package services

import (
	"context"
	"errors"
	"fmt"
	"math"
	"strconv"
	"strings"

	"backend/models"
	"backend/repository"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type QuestionService interface {
	CreateQuestion(ctx context.Context, req *models.CreateQuestionRequest, createdBy primitive.ObjectID) (*models.Question, error)
	GetQuestion(ctx context.Context, id primitive.ObjectID) (*models.Question, error)
	UpdateQuestion(ctx context.Context, id primitive.ObjectID, req *models.UpdateQuestionRequest) (*models.Question, error)
	DeleteQuestion(ctx context.Context, id primitive.ObjectID) error
	ListQuestions(ctx context.Context, req *models.ListQuestionsRequest) (*models.ListQuestionsResponse, error)
	GetQuestionStats(ctx context.Context) (*models.QuestionStatsResponse, error)
	GetRandomQuestions(ctx context.Context, questionType models.QuestionType, limit int) ([]*models.Question, error)
	ToggleQuestionStatus(ctx context.Context, id primitive.ObjectID, isActive bool) (*models.Question, error)
	ValidateQuestionData(req *models.CreateQuestionRequest) error
}

type questionService struct {
	questionRepo repository.QuestionRepository
}

func NewQuestionService(questionRepo repository.QuestionRepository) QuestionService {
	return &questionService{
		questionRepo: questionRepo,
	}
}

func (s *questionService) CreateQuestion(ctx context.Context, req *models.CreateQuestionRequest, createdBy primitive.ObjectID) (*models.Question, error) {
	// Validate question data
	if err := s.ValidateQuestionData(req); err != nil {
		return nil, err
	}

	// Create question from request
	question := &models.Question{
		Title:      strings.TrimSpace(req.Title),
		Type:       req.Type,
		Difficulty: req.Difficulty,
		Points:     req.Points,
		IsActive:   true, // New questions are active by default
		CreatedBy:  createdBy,
	}

	// Handle different question types
	switch req.Type {
	case models.SingleChoice, models.MultipleChoice:
		if err := s.processChoiceQuestion(question, req); err != nil {
			return nil, err
		}
	case models.Essay:
		if err := s.processEssayQuestion(question, req); err != nil {
			return nil, err
		}
	}

	// Create question in database
	if err := s.questionRepo.Create(ctx, question); err != nil {
		return nil, fmt.Errorf("failed to create question: %w", err)
	}

	return question, nil
}

func (s *questionService) GetQuestion(ctx context.Context, id primitive.ObjectID) (*models.Question, error) {
	question, err := s.questionRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get question: %w", err)
	}
	return question, nil
}

func (s *questionService) UpdateQuestion(ctx context.Context, id primitive.ObjectID, req *models.UpdateQuestionRequest) (*models.Question, error) {
	// Get existing question
	existingQuestion, err := s.questionRepo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("question not found: %w", err)
	}

	// Build updates map
	updates := bson.M{}

	if req.Title != nil {
		updates["title"] = strings.TrimSpace(*req.Title)
	}
	if req.Difficulty != nil {
		updates["difficulty"] = *req.Difficulty
	}
	if req.Points != nil {
		if *req.Points < 1 {
			return nil, errors.New("points must be at least 1")
		}
		updates["points"] = *req.Points
	}
	if req.IsActive != nil {
		updates["is_active"] = *req.IsActive
	}

	// Handle type-specific updates
	switch existingQuestion.Type {
	case models.SingleChoice, models.MultipleChoice:
		if req.Options != nil {
			// Convert CreateOption to Option
			options := make([]models.Option, len(req.Options))
			for i, opt := range req.Options {
				options[i] = models.Option{
					ID:    primitive.NewObjectID().Hex(),
					Text:  strings.TrimSpace(opt.Text),
					Order: i + 1,
				}
			}
			updates["options"] = options
		}
		if req.CorrectAnswers != nil {
			updates["correct_answers"] = req.CorrectAnswers
		}
	case models.Essay:
		if req.SampleAnswer != nil {
			updates["sample_answer"] = strings.TrimSpace(*req.SampleAnswer)
		}
	}

	// Update question in database
	if err := s.questionRepo.Update(ctx, id, updates); err != nil {
		return nil, fmt.Errorf("failed to update question: %w", err)
	}

	// Return updated question
	return s.questionRepo.GetByID(ctx, id)
}

func (s *questionService) DeleteQuestion(ctx context.Context, id primitive.ObjectID) error {
	// Check if question exists
	_, err := s.questionRepo.GetByID(ctx, id)
	if err != nil {
		return fmt.Errorf("question not found: %w", err)
	}

	// Delete question
	if err := s.questionRepo.Delete(ctx, id); err != nil {
		return fmt.Errorf("failed to delete question: %w", err)
	}

	return nil
}

func (s *questionService) ListQuestions(ctx context.Context, req *models.ListQuestionsRequest) (*models.ListQuestionsResponse, error) {
	// Build filter
	filter := bson.M{}

	// Add search filter
	if req.Search != "" {
		filter["title"] = bson.M{"$regex": req.Search, "$options": "i"}
	}

	// Add type filter
	if req.Type != "" {
		filter["type"] = req.Type
	}

	// Add difficulty filter
	if req.Difficulty != "" {
		filter["difficulty"] = req.Difficulty
	}

	// Add active status filter
	if req.IsActive != nil {
		filter["is_active"] = *req.IsActive
	}

	// Get questions from repository
	questions, total, err := s.questionRepo.List(ctx, filter, req.Page, req.Limit)
	if err != nil {
		return nil, fmt.Errorf("failed to list questions: %w", err)
	}

	// Calculate total pages
	totalPages := int(math.Ceil(float64(total) / float64(req.Limit)))

	return &models.ListQuestionsResponse{
		Questions:  questions,
		Total:      total,
		Page:       req.Page,
		Limit:      req.Limit,
		TotalPages: totalPages,
	}, nil
}

func (s *questionService) GetQuestionStats(ctx context.Context) (*models.QuestionStatsResponse, error) {
	stats, err := s.questionRepo.GetStats(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get question statistics: %w", err)
	}
	return stats, nil
}

func (s *questionService) GetRandomQuestions(ctx context.Context, questionType models.QuestionType, limit int) ([]*models.Question, error) {
	if limit <= 0 {
		return nil, errors.New("limit must be greater than 0")
	}

	questions, err := s.questionRepo.GetRandomQuestions(ctx, questionType, limit)
	if err != nil {
		return nil, fmt.Errorf("failed to get random questions: %w", err)
	}

	return questions, nil
}

func (s *questionService) ToggleQuestionStatus(ctx context.Context, id primitive.ObjectID, isActive bool) (*models.Question, error) {
	updates := bson.M{"is_active": isActive}

	if err := s.questionRepo.Update(ctx, id, updates); err != nil {
		return nil, fmt.Errorf("failed to toggle question status: %w", err)
	}

	return s.questionRepo.GetByID(ctx, id)
}

func (s *questionService) ValidateQuestionData(req *models.CreateQuestionRequest) error {
	// Validate title
	if strings.TrimSpace(req.Title) == "" {
		return errors.New("title is required")
	}

	// Validate points
	if req.Points < 1 {
		return errors.New("points must be at least 1")
	}

	// Validate based on question type
	switch req.Type {
	case models.SingleChoice:
		return s.validateSingleChoiceQuestion(req)
	case models.MultipleChoice:
		return s.validateMultipleChoiceQuestion(req)
	case models.Essay:
		return s.validateEssayQuestion(req)
	default:
		return errors.New("invalid question type")
	}
}

func (s *questionService) validateSingleChoiceQuestion(req *models.CreateQuestionRequest) error {
	// Check options
	if len(req.Options) < 2 {
		return errors.New("single choice questions must have at least 2 options")
	}
	if len(req.Options) > 10 {
		return errors.New("single choice questions cannot have more than 10 options")
	}

	// Check option texts
	for i, opt := range req.Options {
		if strings.TrimSpace(opt.Text) == "" {
			return fmt.Errorf("option %d text cannot be empty", i+1)
		}
	}

	// Check correct answers
	if len(req.CorrectAnswers) != 1 {
		return errors.New("single choice questions must have exactly 1 correct answer")
	}

	return nil
}

func (s *questionService) validateMultipleChoiceQuestion(req *models.CreateQuestionRequest) error {
	// Check options
	if len(req.Options) < 2 {
		return errors.New("multiple choice questions must have at least 2 options")
	}
	if len(req.Options) > 10 {
		return errors.New("multiple choice questions cannot have more than 10 options")
	}

	// Check option texts
	for i, opt := range req.Options {
		if strings.TrimSpace(opt.Text) == "" {
			return fmt.Errorf("option %d text cannot be empty", i+1)
		}
	}

	// Check correct answers
	if len(req.CorrectAnswers) < 1 {
		return errors.New("multiple choice questions must have at least 1 correct answer")
	}
	return nil
}

func (s *questionService) validateEssayQuestion(req *models.CreateQuestionRequest) error {
	// Essay questions don't need options or correct answers
	if len(req.Options) > 0 {
		return errors.New("essay questions should not have options")
	}
	if len(req.CorrectAnswers) > 0 {
		return errors.New("essay questions should not have correct answers")
	}

	return nil
}

func (s *questionService) processChoiceQuestion(question *models.Question, req *models.CreateQuestionRequest) error {
	// Convert CreateOption to Option
	options := make([]models.Option, len(req.Options))
	for i, opt := range req.Options {
		options[i] = models.Option{
			ID:    primitive.NewObjectID().Hex(),
			Text:  strings.TrimSpace(opt.Text),
			Order: i + 1,
		}
	}

	question.Options = options

	// Map correct answer indices to generated option IDs
	correctAnswers := make([]string, 0, len(req.CorrectAnswers))
	for _, answerStr := range req.CorrectAnswers {
		// Parse the answer as an index
		if index, err := strconv.Atoi(answerStr); err == nil {
			if index >= 0 && index < len(options) {
				correctAnswers = append(correctAnswers, options[index].ID)
			}
		}
	}
	question.CorrectAnswers = correctAnswers

	return nil
}

func (s *questionService) processEssayQuestion(question *models.Question, req *models.CreateQuestionRequest) error {
	if req.SampleAnswer != "" {
		question.SampleAnswer = strings.TrimSpace(req.SampleAnswer)
	}

	return nil
}
