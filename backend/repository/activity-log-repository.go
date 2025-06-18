package repository

import (
	"context"
	"fmt"
	"time"

	"backend/models"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type ActivityLogRepository interface {
	CreateActivityLog(ctx context.Context, activityLog *models.ActivityLog) error
	GetActivityLogs(ctx context.Context, req *models.GetActivityLogsRequest) ([]models.ActivityLog, int64, error)
	GetActivityStats(ctx context.Context) (*models.ActivityStats, error)
	GetRecentActivities(ctx context.Context, limit int) ([]models.ActivityLog, error)
	DeleteOldActivities(ctx context.Context, olderThan time.Time) (int64, error)
}

type activityLogRepository struct {
	db                    *mongo.Database
	activityLogCollection *mongo.Collection
}

func NewActivityLogRepository(db *mongo.Database) ActivityLogRepository {
	return &activityLogRepository{
		db:                    db,
		activityLogCollection: db.Collection("activity_logs"),
	}
}

func (r *activityLogRepository) CreateActivityLog(ctx context.Context, activityLog *models.ActivityLog) error {
	fmt.Printf("DEBUG REPO: Creating activity log - Type: %s, Entity: %s, User: %s\n",
		activityLog.Type, activityLog.EntityName, activityLog.PerformedByName)

	if activityLog.ID.IsZero() {
		activityLog.ID = primitive.NewObjectID()
	}

	if activityLog.Timestamp.IsZero() {
		activityLog.Timestamp = time.Now()
	}

	result, err := r.activityLogCollection.InsertOne(ctx, activityLog)
	if err != nil {
		fmt.Printf("ERROR REPO: Failed to insert activity log: %v\n", err)
		return err
	}

	fmt.Printf("SUCCESS REPO: Activity log inserted with ID: %v\n", result.InsertedID)
	return nil
}

func (r *activityLogRepository) GetActivityLogs(ctx context.Context, req *models.GetActivityLogsRequest) ([]models.ActivityLog, int64, error) {
	// Build filter
	filter := bson.M{}

	// Filter by activity type
	if req.Type != "" {
		filter["type"] = req.Type
	}

	// Filter by entity type
	if req.EntityType != "" {
		filter["entity_type"] = req.EntityType
	}

	// Filter by user ID
	if req.UserID != "" {
		userOID, err := primitive.ObjectIDFromHex(req.UserID)
		if err == nil {
			filter["performed_by"] = userOID
		}
	}

	// Filter by date range
	if req.DateFrom != nil || req.DateTo != nil {
		dateFilter := bson.M{}
		if req.DateFrom != nil {
			dateFilter["$gte"] = *req.DateFrom
		}
		if req.DateTo != nil {
			dateFilter["$lte"] = *req.DateTo
		}
		filter["timestamp"] = dateFilter
	}

	// Filter by success status
	if req.Success != nil {
		filter["success"] = *req.Success
	}

	// Count total documents
	total, err := r.activityLogCollection.CountDocuments(ctx, filter)
	if err != nil {
		return nil, 0, err
	}

	// Build options for pagination and sorting
	opts := options.Find()
	opts.SetSkip(int64((req.Page - 1) * req.Limit))
	opts.SetLimit(int64(req.Limit))
	opts.SetSort(bson.D{{Key: "timestamp", Value: -1}}) // Sort by timestamp descending (newest first)

	// Find activity logs
	cursor, err := r.activityLogCollection.Find(ctx, filter, opts)
	if err != nil {
		return nil, 0, err
	}
	defer cursor.Close(ctx)

	var activityLogs []models.ActivityLog
	if err = cursor.All(ctx, &activityLogs); err != nil {
		return nil, 0, err
	}

	return activityLogs, total, nil
}

func (r *activityLogRepository) GetActivityStats(ctx context.Context) (*models.ActivityStats, error) {
	stats := &models.ActivityStats{
		ByType:       make(map[models.ActivityType]int64),
		ByEntityType: make(map[string]int64),
	}

	// Get total activities count
	total, err := r.activityLogCollection.CountDocuments(ctx, bson.M{})
	if err != nil {
		return nil, err
	}
	stats.TotalActivities = total

	// Get today's activities count
	today := time.Now().Truncate(24 * time.Hour)
	todayCount, err := r.activityLogCollection.CountDocuments(ctx, bson.M{
		"timestamp": bson.M{"$gte": today},
	})
	if err != nil {
		return nil, err
	}
	stats.TodayActivities = todayCount

	// Get successful vs failed actions
	successCount, err := r.activityLogCollection.CountDocuments(ctx, bson.M{"success": true})
	if err != nil {
		return nil, err
	}
	stats.SuccessfulActions = successCount
	stats.FailedActions = total - successCount

	// Aggregate by activity type
	typeAggregation := []bson.M{
		{"$group": bson.M{
			"_id":   "$type",
			"count": bson.M{"$sum": 1},
		}},
	}

	cursor, err := r.activityLogCollection.Aggregate(ctx, typeAggregation)
	if err == nil {
		defer cursor.Close(ctx)
		for cursor.Next(ctx) {
			var result struct {
				ID    models.ActivityType `bson:"_id"`
				Count int64               `bson:"count"`
			}
			if err := cursor.Decode(&result); err == nil {
				stats.ByType[result.ID] = result.Count
			}
		}
	}

	// Aggregate by entity type
	entityAggregation := []bson.M{
		{"$group": bson.M{
			"_id":   "$entity_type",
			"count": bson.M{"$sum": 1},
		}},
	}

	cursor, err = r.activityLogCollection.Aggregate(ctx, entityAggregation)
	if err == nil {
		defer cursor.Close(ctx)
		for cursor.Next(ctx) {
			var result struct {
				ID    string `bson:"_id"`
				Count int64  `bson:"count"`
			}
			if err := cursor.Decode(&result); err == nil {
				stats.ByEntityType[result.ID] = result.Count
			}
		}
	}

	// Get recent activities (last 10)
	recentActivities, _, err := r.GetActivityLogs(ctx, &models.GetActivityLogsRequest{
		Page:  1,
		Limit: 10,
	})
	if err == nil {
		stats.RecentActivities = recentActivities
	}

	// Get top performers (users with most activities in last 30 days)
	thirtyDaysAgo := time.Now().AddDate(0, 0, -30)
	performerAggregation := []bson.M{
		{"$match": bson.M{"timestamp": bson.M{"$gte": thirtyDaysAgo}}},
		{"$group": bson.M{
			"_id": bson.M{
				"user_id":   "$performed_by",
				"user_name": "$performed_by_name",
				"user_type": "$performed_by_type",
			},
			"count": bson.M{"$sum": 1},
		}},
		{"$sort": bson.M{"count": -1}},
		{"$limit": 5},
	}

	cursor, err = r.activityLogCollection.Aggregate(ctx, performerAggregation)
	if err == nil {
		defer cursor.Close(ctx)
		var topPerformers []models.UserActivitySummary
		for cursor.Next(ctx) {
			var result struct {
				ID struct {
					UserID   primitive.ObjectID `bson:"user_id"`
					UserName string             `bson:"user_name"`
					UserType string             `bson:"user_type"`
				} `bson:"_id"`
				Count int64 `bson:"count"`
			}
			if err := cursor.Decode(&result); err == nil {
				topPerformers = append(topPerformers, models.UserActivitySummary{
					UserID:      result.ID.UserID.Hex(),
					UserName:    result.ID.UserName,
					UserType:    result.ID.UserType,
					ActionCount: result.Count,
				})
			}
		}
		stats.TopPerformers = topPerformers
	}

	return stats, nil
}

func (r *activityLogRepository) GetRecentActivities(ctx context.Context, limit int) ([]models.ActivityLog, error) {
	opts := options.Find()
	opts.SetLimit(int64(limit))
	opts.SetSort(bson.D{{Key: "timestamp", Value: -1}})

	cursor, err := r.activityLogCollection.Find(ctx, bson.M{}, opts)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var activities []models.ActivityLog
	if err = cursor.All(ctx, &activities); err != nil {
		return nil, err
	}

	return activities, nil
}

func (r *activityLogRepository) DeleteOldActivities(ctx context.Context, olderThan time.Time) (int64, error) {
	filter := bson.M{"timestamp": bson.M{"$lt": olderThan}}

	result, err := r.activityLogCollection.DeleteMany(ctx, filter)
	if err != nil {
		return 0, err
	}

	return result.DeletedCount, nil
}
