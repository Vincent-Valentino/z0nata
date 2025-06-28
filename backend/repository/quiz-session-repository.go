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

type QuizSessionRepository interface {
	// Session Management
	CreateSession(ctx context.Context, session *models.QuizSession) error
	GetSessionByID(ctx context.Context, sessionID primitive.ObjectID) (*models.QuizSession, error)
	GetSessionByToken(ctx context.Context, sessionToken string) (*models.QuizSession, error)
	GetActiveSessionByUser(ctx context.Context, userID primitive.ObjectID, quizType models.QuizType) (*models.QuizSession, error)
	UpdateSession(ctx context.Context, session *models.QuizSession) error
	UpdateQuestionAnswer(ctx context.Context, sessionID primitive.ObjectID, questionIndex int, answer interface{}, timeSpent int64) error
	SkipQuestion(ctx context.Context, sessionID primitive.ObjectID, questionIndex int, timeSpent int64) error
	UpdateSessionProgress(ctx context.Context, sessionID primitive.ObjectID, currentQuestion, answeredCount, skippedCount int) error
	MarkSessionCompleted(ctx context.Context, sessionID primitive.ObjectID, endTime time.Time) error

	// Cleanup
	CleanupExpiredSessions(ctx context.Context, expiredBefore time.Time) (int64, error)
	CleanupAbandonedSessions(ctx context.Context, abandonedAfter time.Duration) (int64, error)

	// Results
	CreateDetailedResult(ctx context.Context, result *models.DetailedQuizResult) error
	GetDetailedResultBySessionID(ctx context.Context, sessionID primitive.ObjectID) (*models.DetailedQuizResult, error)
	GetUserDetailedResults(ctx context.Context, userID primitive.ObjectID, quizType models.QuizType, limit int) ([]models.DetailedQuizResult, error)
}

type quizSessionRepository struct {
	db                *mongo.Database
	sessionCollection *mongo.Collection
	resultCollection  *mongo.Collection
}

func NewQuizSessionRepository(db *mongo.Database) QuizSessionRepository {
	return &quizSessionRepository{
		db:                db,
		sessionCollection: db.Collection("quiz_sessions"),
		resultCollection:  db.Collection("detailed_quiz_results"),
	}
}

func (r *quizSessionRepository) CreateSession(ctx context.Context, session *models.QuizSession) error {
	session.CreatedAt = time.Now()
	session.UpdatedAt = time.Now()

	result, err := r.sessionCollection.InsertOne(ctx, session)
	if err != nil {
		return fmt.Errorf("failed to create quiz session: %w", err)
	}

	session.ID = result.InsertedID.(primitive.ObjectID)
	return nil
}

func (r *quizSessionRepository) GetSessionByID(ctx context.Context, sessionID primitive.ObjectID) (*models.QuizSession, error) {
	var session models.QuizSession
	err := r.sessionCollection.FindOne(ctx, bson.M{"_id": sessionID}).Decode(&session)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, fmt.Errorf("quiz session not found")
		}
		return nil, fmt.Errorf("failed to get quiz session: %w", err)
	}
	return &session, nil
}

func (r *quizSessionRepository) GetSessionByToken(ctx context.Context, sessionToken string) (*models.QuizSession, error) {
	var session models.QuizSession
	err := r.sessionCollection.FindOne(ctx, bson.M{"session_token": sessionToken}).Decode(&session)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, fmt.Errorf("quiz session not found")
		}
		return nil, fmt.Errorf("failed to get quiz session: %w", err)
	}
	return &session, nil
}

func (r *quizSessionRepository) GetActiveSessionByUser(ctx context.Context, userID primitive.ObjectID, quizType models.QuizType) (*models.QuizSession, error) {
	filter := bson.M{
		"user_id":   userID,
		"quiz_type": quizType,
		"status":    models.QuizInProgress,
	}

	var session models.QuizSession
	err := r.sessionCollection.FindOne(ctx, filter).Decode(&session)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, nil // No active session found (not an error)
		}
		return nil, fmt.Errorf("failed to get active session: %w", err)
	}
	return &session, nil
}

func (r *quizSessionRepository) UpdateSession(ctx context.Context, session *models.QuizSession) error {
	session.UpdatedAt = time.Now()

	filter := bson.M{"_id": session.ID}
	update := bson.M{"$set": session}

	result, err := r.sessionCollection.UpdateOne(ctx, filter, update)
	if err != nil {
		return fmt.Errorf("failed to update quiz session: %w", err)
	}

	if result.MatchedCount == 0 {
		return fmt.Errorf("quiz session not found")
	}

	return nil
}

func (r *quizSessionRepository) UpdateQuestionAnswer(ctx context.Context, sessionID primitive.ObjectID, questionIndex int, answer interface{}, timeSpent int64) error {
	filter := bson.M{"_id": sessionID}

	now := time.Now()
	updates := bson.M{
		"$set": bson.M{
			fmt.Sprintf("questions.%d.user_answer", questionIndex):      answer,
			fmt.Sprintf("questions.%d.is_answered", questionIndex):      true,
			fmt.Sprintf("questions.%d.is_skipped", questionIndex):       false,
			fmt.Sprintf("questions.%d.time_spent", questionIndex):       timeSpent,
			fmt.Sprintf("questions.%d.last_modified_at", questionIndex): now,
			"updated_at": now,
		},
		"$inc": bson.M{
			fmt.Sprintf("questions.%d.visit_count", questionIndex): 1,
		},
		"$setOnInsert": bson.M{
			fmt.Sprintf("questions.%d.first_attempt_at", questionIndex): now,
		},
	}

	opts := options.Update().SetUpsert(false)
	result, err := r.sessionCollection.UpdateOne(ctx, filter, updates, opts)
	if err != nil {
		return fmt.Errorf("failed to update question answer: %w", err)
	}

	if result.MatchedCount == 0 {
		return fmt.Errorf("quiz session not found")
	}

	return nil
}

func (r *quizSessionRepository) SkipQuestion(ctx context.Context, sessionID primitive.ObjectID, questionIndex int, timeSpent int64) error {
	filter := bson.M{"_id": sessionID}

	now := time.Now()
	updates := bson.M{
		"$set": bson.M{
			fmt.Sprintf("questions.%d.is_skipped", questionIndex):       true,
			fmt.Sprintf("questions.%d.is_answered", questionIndex):      false,
			fmt.Sprintf("questions.%d.time_spent", questionIndex):       timeSpent,
			fmt.Sprintf("questions.%d.last_modified_at", questionIndex): now,
			"updated_at": now,
		},
		"$inc": bson.M{
			fmt.Sprintf("questions.%d.visit_count", questionIndex): 1,
		},
		"$setOnInsert": bson.M{
			fmt.Sprintf("questions.%d.first_attempt_at", questionIndex): now,
		},
		"$unset": bson.M{
			fmt.Sprintf("questions.%d.user_answer", questionIndex): "",
		},
	}

	opts := options.Update().SetUpsert(false)
	result, err := r.sessionCollection.UpdateOne(ctx, filter, updates, opts)
	if err != nil {
		return fmt.Errorf("failed to skip question: %w", err)
	}

	if result.MatchedCount == 0 {
		return fmt.Errorf("quiz session not found")
	}

	return nil
}

func (r *quizSessionRepository) UpdateSessionProgress(ctx context.Context, sessionID primitive.ObjectID, currentQuestion, answeredCount, skippedCount int) error {
	filter := bson.M{"_id": sessionID}
	update := bson.M{
		"$set": bson.M{
			"current_question": currentQuestion,
			"answered_count":   answeredCount,
			"skipped_count":    skippedCount,
			"updated_at":       time.Now(),
		},
	}

	result, err := r.sessionCollection.UpdateOne(ctx, filter, update)
	if err != nil {
		return fmt.Errorf("failed to update session progress: %w", err)
	}

	if result.MatchedCount == 0 {
		return fmt.Errorf("quiz session not found")
	}

	return nil
}

func (r *quizSessionRepository) MarkSessionCompleted(ctx context.Context, sessionID primitive.ObjectID, endTime time.Time) error {
	filter := bson.M{"_id": sessionID}
	update := bson.M{
		"$set": bson.M{
			"status":       models.QuizCompleted,
			"is_submitted": true,
			"end_time":     endTime,
			"updated_at":   time.Now(),
		},
	}

	result, err := r.sessionCollection.UpdateOne(ctx, filter, update)
	if err != nil {
		return fmt.Errorf("failed to mark session completed: %w", err)
	}

	if result.MatchedCount == 0 {
		return fmt.Errorf("quiz session not found")
	}

	return nil
}

func (r *quizSessionRepository) CleanupExpiredSessions(ctx context.Context, expiredBefore time.Time) (int64, error) {
	filter := bson.M{
		"status": models.QuizInProgress,
		"start_time": bson.M{
			"$lt": expiredBefore,
		},
	}

	update := bson.M{
		"$set": bson.M{
			"status":     models.QuizTimeout,
			"end_time":   time.Now(),
			"updated_at": time.Now(),
		},
	}

	result, err := r.sessionCollection.UpdateMany(ctx, filter, update)
	if err != nil {
		return 0, fmt.Errorf("failed to cleanup expired sessions: %w", err)
	}

	return result.ModifiedCount, nil
}

func (r *quizSessionRepository) CleanupAbandonedSessions(ctx context.Context, abandonedAfter time.Duration) (int64, error) {
	abandonedBefore := time.Now().Add(-abandonedAfter)

	filter := bson.M{
		"status": models.QuizInProgress,
		"updated_at": bson.M{
			"$lt": abandonedBefore,
		},
	}

	update := bson.M{
		"$set": bson.M{
			"status":     models.QuizAbandoned,
			"updated_at": time.Now(),
		},
	}

	result, err := r.sessionCollection.UpdateMany(ctx, filter, update)
	if err != nil {
		return 0, fmt.Errorf("failed to cleanup abandoned sessions: %w", err)
	}

	return result.ModifiedCount, nil
}

func (r *quizSessionRepository) CreateDetailedResult(ctx context.Context, result *models.DetailedQuizResult) error {
	result.CreatedAt = time.Now()
	result.UpdatedAt = time.Now()

	insertResult, err := r.resultCollection.InsertOne(ctx, result)
	if err != nil {
		return fmt.Errorf("failed to create detailed quiz result: %w", err)
	}

	result.ID = insertResult.InsertedID.(primitive.ObjectID)
	return nil
}

func (r *quizSessionRepository) GetDetailedResultBySessionID(ctx context.Context, sessionID primitive.ObjectID) (*models.DetailedQuizResult, error) {
	var result models.DetailedQuizResult
	err := r.resultCollection.FindOne(ctx, bson.M{"session_id": sessionID}).Decode(&result)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, fmt.Errorf("detailed quiz result not found")
		}
		return nil, fmt.Errorf("failed to get detailed quiz result: %w", err)
	}
	return &result, nil
}

func (r *quizSessionRepository) GetUserDetailedResults(ctx context.Context, userID primitive.ObjectID, quizType models.QuizType, limit int) ([]models.DetailedQuizResult, error) {
	filter := bson.M{"user_id": userID}
	if quizType != "" {
		filter["quiz_type"] = quizType
	}

	opts := options.Find().
		SetSort(bson.D{{Key: "submitted_at", Value: -1}}).
		SetLimit(int64(limit))

	cursor, err := r.resultCollection.Find(ctx, filter, opts)
	if err != nil {
		return nil, fmt.Errorf("failed to get user detailed results: %w", err)
	}
	defer cursor.Close(ctx)

	var results []models.DetailedQuizResult
	if err := cursor.All(ctx, &results); err != nil {
		return nil, fmt.Errorf("failed to decode detailed results: %w", err)
	}

	return results, nil
}
