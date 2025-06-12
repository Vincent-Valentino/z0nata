package repository

import (
	"context"
	"errors"
	"time"

	"backend/models"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type QuestionRepository interface {
	Create(ctx context.Context, question *models.Question) error
	GetByID(ctx context.Context, id primitive.ObjectID) (*models.Question, error)
	Update(ctx context.Context, id primitive.ObjectID, updates bson.M) error
	Delete(ctx context.Context, id primitive.ObjectID) error
	List(ctx context.Context, filter bson.M, page, limit int) ([]*models.Question, int64, error)
	GetByType(ctx context.Context, questionType models.QuestionType, limit int) ([]*models.Question, error)
	GetStats(ctx context.Context) (*models.QuestionStatsResponse, error)
	GetRandomQuestions(ctx context.Context, questionType models.QuestionType, limit int) ([]*models.Question, error)
}

type questionRepository struct {
	db         *mongo.Database
	collection *mongo.Collection
}

func NewQuestionRepository(db *mongo.Database) QuestionRepository {
	return &questionRepository{
		db:         db,
		collection: db.Collection("questions"),
	}
}

func (r *questionRepository) Create(ctx context.Context, question *models.Question) error {
	question.ID = primitive.NewObjectID()
	question.CreatedAt = time.Now()
	question.UpdatedAt = time.Now()

	// Generate IDs for options
	for i := range question.Options {
		if question.Options[i].ID == "" {
			question.Options[i].ID = primitive.NewObjectID().Hex()
		}
		question.Options[i].Order = i + 1
	}

	_, err := r.collection.InsertOne(ctx, question)
	return err
}

func (r *questionRepository) GetByID(ctx context.Context, id primitive.ObjectID) (*models.Question, error) {
	var question models.Question
	err := r.collection.FindOne(ctx, bson.M{"_id": id}).Decode(&question)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, errors.New("question not found")
		}
		return nil, err
	}
	return &question, nil
}

func (r *questionRepository) Update(ctx context.Context, id primitive.ObjectID, updates bson.M) error {
	updates["updated_at"] = time.Now()

	// If updating options, generate IDs for new ones
	if options, exists := updates["options"]; exists {
		if optionSlice, ok := options.([]models.Option); ok {
			for i := range optionSlice {
				if optionSlice[i].ID == "" {
					optionSlice[i].ID = primitive.NewObjectID().Hex()
				}
				optionSlice[i].Order = i + 1
			}
			updates["options"] = optionSlice
		}
	}

	result, err := r.collection.UpdateOne(
		ctx,
		bson.M{"_id": id},
		bson.M{"$set": updates},
	)

	if err != nil {
		return err
	}

	if result.MatchedCount == 0 {
		return errors.New("question not found")
	}

	return nil
}

func (r *questionRepository) Delete(ctx context.Context, id primitive.ObjectID) error {
	result, err := r.collection.DeleteOne(ctx, bson.M{"_id": id})
	if err != nil {
		return err
	}

	if result.DeletedCount == 0 {
		return errors.New("question not found")
	}

	return nil
}

func (r *questionRepository) List(ctx context.Context, filter bson.M, page, limit int) ([]*models.Question, int64, error) {
	// Calculate skip value
	skip := (page - 1) * limit

	// Create options
	opts := options.Find().
		SetSkip(int64(skip)).
		SetLimit(int64(limit)).
		SetSort(bson.M{"created_at": -1})

	// Get total count
	total, err := r.collection.CountDocuments(ctx, filter)
	if err != nil {
		return nil, 0, err
	}

	// Find questions
	cursor, err := r.collection.Find(ctx, filter, opts)
	if err != nil {
		return nil, 0, err
	}
	defer cursor.Close(ctx)

	var questions []*models.Question
	for cursor.Next(ctx) {
		var question models.Question
		if err := cursor.Decode(&question); err != nil {
			return nil, 0, err
		}
		questions = append(questions, &question)
	}

	return questions, total, nil
}

func (r *questionRepository) GetByType(ctx context.Context, questionType models.QuestionType, limit int) ([]*models.Question, error) {
	filter := bson.M{
		"type":      questionType,
		"is_active": true,
	}

	opts := options.Find().
		SetLimit(int64(limit)).
		SetSort(bson.M{"created_at": -1})

	cursor, err := r.collection.Find(ctx, filter, opts)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var questions []*models.Question
	for cursor.Next(ctx) {
		var question models.Question
		if err := cursor.Decode(&question); err != nil {
			return nil, err
		}
		questions = append(questions, &question)
	}

	return questions, nil
}

func (r *questionRepository) GetRandomQuestions(ctx context.Context, questionType models.QuestionType, limit int) ([]*models.Question, error) {
	filter := bson.M{
		"type":      questionType,
		"is_active": true,
	}

	pipeline := []bson.M{
		{"$match": filter},
		{"$sample": bson.M{"size": limit}},
	}

	cursor, err := r.collection.Aggregate(ctx, pipeline)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var questions []*models.Question
	for cursor.Next(ctx) {
		var question models.Question
		if err := cursor.Decode(&question); err != nil {
			return nil, err
		}
		questions = append(questions, &question)
	}

	return questions, nil
}

func (r *questionRepository) GetStats(ctx context.Context) (*models.QuestionStatsResponse, error) {
	// Count total questions
	total, err := r.collection.CountDocuments(ctx, bson.M{})
	if err != nil {
		return nil, err
	}

	// Count active questions
	activeCount, err := r.collection.CountDocuments(ctx, bson.M{"is_active": true})
	if err != nil {
		return nil, err
	}

	// Count by type
	typePipeline := []bson.M{
		{
			"$group": bson.M{
				"_id":   "$type",
				"count": bson.M{"$sum": 1},
			},
		},
	}

	cursor, err := r.collection.Aggregate(ctx, typePipeline)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	typeStats := make(map[string]int64)
	for cursor.Next(ctx) {
		var result struct {
			ID    string `bson:"_id"`
			Count int64  `bson:"count"`
		}
		if err := cursor.Decode(&result); err != nil {
			continue
		}
		typeStats[result.ID] = result.Count
	}

	// Count by difficulty
	difficultyPipeline := []bson.M{
		{
			"$group": bson.M{
				"_id":   "$difficulty",
				"count": bson.M{"$sum": 1},
			},
		},
	}

	cursor, err = r.collection.Aggregate(ctx, difficultyPipeline)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	difficultyStats := make(map[string]int64)
	for cursor.Next(ctx) {
		var result struct {
			ID    string `bson:"_id"`
			Count int64  `bson:"count"`
		}
		if err := cursor.Decode(&result); err != nil {
			continue
		}
		difficultyStats[result.ID] = result.Count
	}

	// Calculate total and average points
	pointsPipeline := []bson.M{
		{
			"$group": bson.M{
				"_id":           nil,
				"totalPoints":   bson.M{"$sum": "$points"},
				"averagePoints": bson.M{"$avg": "$points"},
			},
		},
	}

	cursor, err = r.collection.Aggregate(ctx, pointsPipeline)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var totalPoints int64
	var averagePoints float64

	if cursor.Next(ctx) {
		var result struct {
			TotalPoints   int64   `bson:"totalPoints"`
			AveragePoints float64 `bson:"averagePoints"`
		}
		if err := cursor.Decode(&result); err == nil {
			totalPoints = result.TotalPoints
			averagePoints = result.AveragePoints
		}
	}

	return &models.QuestionStatsResponse{
		Total:          total,
		ByType:         typeStats,
		ByDifficulty:   difficultyStats,
		ActiveCount:    activeCount,
		InactiveCount:  total - activeCount,
		SingleChoice:   typeStats["single_choice"],
		MultipleChoice: typeStats["multiple_choice"],
		Essay:          typeStats["essay"],
		TotalPoints:    totalPoints,
		AveragePoints:  averagePoints,
	}, nil
}
