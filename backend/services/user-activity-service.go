package services

import (
	"context"
	"fmt"

	"backend/models"
	"backend/repository"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type UserActivityService interface {
	// Quiz Results
	CreateQuizResult(ctx context.Context, userID primitive.ObjectID, request models.QuizResultRequest) (*models.QuizResult, []models.Achievement, error)
	GetUserResults(ctx context.Context, userID primitive.ObjectID, filter models.QuizResultsFilter) (*models.UserResultsResponse, error)
	GetQuizResultByID(ctx context.Context, id primitive.ObjectID) (*models.QuizResult, error)

	// User Statistics
	GetUserStats(ctx context.Context, userID primitive.ObjectID) (*models.UserStats, error)

	// Achievements
	GetUserAchievements(ctx context.Context, userID primitive.ObjectID) ([]models.Achievement, error)
}

type userActivityService struct {
	userActivityRepo repository.UserActivityRepository
}

func NewUserActivityService(userActivityRepo repository.UserActivityRepository) UserActivityService {
	return &userActivityService{
		userActivityRepo: userActivityRepo,
	}
}

func (s *userActivityService) CreateQuizResult(ctx context.Context, userID primitive.ObjectID, request models.QuizResultRequest) (*models.QuizResult, []models.Achievement, error) {
	// Validate the request
	if request.CorrectAnswers > request.TotalQuestions {
		return nil, nil, fmt.Errorf("correct answers cannot exceed total questions")
	}

	// Calculate score if not provided correctly
	calculatedScore := (request.CorrectAnswers * 100) / request.TotalQuestions
	if request.Score != calculatedScore {
		request.Score = calculatedScore
	}

	// Create quiz result model
	result := &models.QuizResult{
		UserID:         userID,
		QuizType:       request.QuizType,
		Score:          request.Score,
		TotalQuestions: request.TotalQuestions,
		CorrectAnswers: request.CorrectAnswers,
		TimeSpent:      request.TimeSpent,
		TimeLimit:      request.TimeLimit,
		StartedAt:      request.StartedAt,
		IsTimedOut:     request.IsTimedOut,

		// Question type breakdown
		SingleChoiceCorrect:   request.SingleChoiceCorrect,
		MultipleChoiceCorrect: request.MultipleChoiceCorrect,
		EssayCorrect:          request.EssayCorrect,
		SingleChoiceTotal:     request.SingleChoiceTotal,
		MultipleChoiceTotal:   request.MultipleChoiceTotal,
		EssayTotal:            request.EssayTotal,
	}

	// Create the quiz result
	createdResult, err := s.userActivityRepo.CreateQuizResult(ctx, result)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to create quiz result: %w", err)
	}

	// Update user statistics
	if err := s.userActivityRepo.UpdateUserStats(ctx, userID, createdResult); err != nil {
		// Log error but don't fail the request
		fmt.Printf("Failed to update user stats: %v\n", err)
	}

	// Check and create achievements
	newAchievements, err := s.userActivityRepo.CheckAndCreateAchievements(ctx, userID, createdResult)
	if err != nil {
		// Log error but don't fail the request
		fmt.Printf("Failed to check achievements: %v\n", err)
		newAchievements = []models.Achievement{}
	}

	return createdResult, newAchievements, nil
}

func (s *userActivityService) GetUserResults(ctx context.Context, userID primitive.ObjectID, filter models.QuizResultsFilter) (*models.UserResultsResponse, error) {
	// Get quiz results
	results, totalCount, err := s.userActivityRepo.GetUserQuizResults(ctx, userID, filter)
	if err != nil {
		return nil, fmt.Errorf("failed to get user quiz results: %w", err)
	}

	// Get user statistics
	stats, err := s.userActivityRepo.GetUserStats(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get user stats: %w", err)
	}

	// Get user achievements
	achievements, err := s.userActivityRepo.GetUserAchievements(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get user achievements: %w", err)
	}

	return &models.UserResultsResponse{
		Results:      results,
		Stats:        *stats,
		Achievements: achievements,
		TotalCount:   totalCount,
	}, nil
}

func (s *userActivityService) GetQuizResultByID(ctx context.Context, id primitive.ObjectID) (*models.QuizResult, error) {
	result, err := s.userActivityRepo.GetQuizResultByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get quiz result: %w", err)
	}
	return result, nil
}

func (s *userActivityService) GetUserStats(ctx context.Context, userID primitive.ObjectID) (*models.UserStats, error) {
	stats, err := s.userActivityRepo.GetUserStats(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get user stats: %w", err)
	}
	return stats, nil
}

func (s *userActivityService) GetUserAchievements(ctx context.Context, userID primitive.ObjectID) ([]models.Achievement, error) {
	achievements, err := s.userActivityRepo.GetUserAchievements(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get user achievements: %w", err)
	}
	return achievements, nil
}
