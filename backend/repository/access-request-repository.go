package repository

import (
	"context"
	"time"

	"backend/models"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type AccessRequestRepository interface {
	CreateAccessRequest(ctx context.Context, request *models.AccessRequest) (*models.AccessRequest, error)
	GetAccessRequest(ctx context.Context, id primitive.ObjectID) (*models.AccessRequest, error)
	GetAccessRequestByUserID(ctx context.Context, userID primitive.ObjectID) (*models.AccessRequest, error)
	UpdateAccessRequest(ctx context.Context, id primitive.ObjectID, updates bson.M) error
	DeleteAccessRequest(ctx context.Context, id primitive.ObjectID) error
	ListAccessRequests(ctx context.Context, req *models.ListAccessRequestsRequest) (*models.ListAccessRequestsResponse, error)
	GetPendingRequestsCount(ctx context.Context) (int64, error)
}

type accessRequestRepository struct {
	collection *mongo.Collection
}

func NewAccessRequestRepository(db *mongo.Database) AccessRequestRepository {
	return &accessRequestRepository{
		collection: db.Collection("access_requests"),
	}
}

func (r *accessRequestRepository) CreateAccessRequest(ctx context.Context, request *models.AccessRequest) (*models.AccessRequest, error) {
	request.ID = primitive.NewObjectID()
	request.RequestedAt = time.Now()
	request.Status = models.UserStatusPending

	result, err := r.collection.InsertOne(ctx, request)
	if err != nil {
		return nil, err
	}

	request.ID = result.InsertedID.(primitive.ObjectID)
	return request, nil
}

func (r *accessRequestRepository) GetAccessRequest(ctx context.Context, id primitive.ObjectID) (*models.AccessRequest, error) {
	var request models.AccessRequest
	err := r.collection.FindOne(ctx, bson.M{"_id": id}).Decode(&request)
	if err != nil {
		return nil, err
	}
	return &request, nil
}

func (r *accessRequestRepository) GetAccessRequestByUserID(ctx context.Context, userID primitive.ObjectID) (*models.AccessRequest, error) {
	var request models.AccessRequest
	err := r.collection.FindOne(ctx, bson.M{"user_id": userID}).Decode(&request)
	if err != nil {
		return nil, err
	}
	return &request, nil
}

func (r *accessRequestRepository) UpdateAccessRequest(ctx context.Context, id primitive.ObjectID, updates bson.M) error {
	filter := bson.M{"_id": id}
	update := bson.M{"$set": updates}

	_, err := r.collection.UpdateOne(ctx, filter, update)
	return err
}

func (r *accessRequestRepository) DeleteAccessRequest(ctx context.Context, id primitive.ObjectID) error {
	filter := bson.M{"_id": id}
	_, err := r.collection.DeleteOne(ctx, filter)
	return err
}

func (r *accessRequestRepository) ListAccessRequests(ctx context.Context, req *models.ListAccessRequestsRequest) (*models.ListAccessRequestsResponse, error) {
	// Set defaults
	page := 1
	limit := 20
	if req.Page > 0 {
		page = req.Page
	}
	if req.Limit > 0 {
		limit = req.Limit
	}

	// Build filter
	filter := bson.M{}
	if req.Status != "" {
		filter["status"] = req.Status
	}
	if req.Type != "" {
		filter["request_type"] = req.Type
	}

	// Calculate skip
	skip := (page - 1) * limit

	// Count total documents
	total, err := r.collection.CountDocuments(ctx, filter)
	if err != nil {
		return nil, err
	}

	// Find documents with pagination
	opts := options.Find().
		SetSkip(int64(skip)).
		SetLimit(int64(limit)).
		SetSort(bson.D{{Key: "requested_at", Value: -1}}) // Sort by newest first

	cursor, err := r.collection.Find(ctx, filter, opts)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var requests []models.AccessRequest
	if err = cursor.All(ctx, &requests); err != nil {
		return nil, err
	}

	totalPages := int(total)/limit + 1
	if int(total)%limit == 0 && total > 0 {
		totalPages = int(total) / limit
	}

	return &models.ListAccessRequestsResponse{
		Requests:   requests,
		Total:      total,
		Page:       page,
		Limit:      limit,
		TotalPages: totalPages,
	}, nil
}

func (r *accessRequestRepository) GetPendingRequestsCount(ctx context.Context) (int64, error) {
	filter := bson.M{"status": models.UserStatusPending}
	return r.collection.CountDocuments(ctx, filter)
}
