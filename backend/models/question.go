package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// QuestionType represents the type of question
type QuestionType string

const (
	SingleChoice   QuestionType = "single_choice"
	MultipleChoice QuestionType = "multiple_choice"
	Essay          QuestionType = "essay"
)

// DifficultyLevel represents the difficulty of a question
type DifficultyLevel string

const (
	Easy   DifficultyLevel = "easy"
	Medium DifficultyLevel = "medium"
	Hard   DifficultyLevel = "hard"
)

// Option represents a choice option for single/multiple choice questions
type Option struct {
	ID     string `json:"id" bson:"id"`
	Text   string `json:"text" bson:"text"`
	Order  int    `json:"order" bson:"order"`
	Points int    `json:"points" bson:"points"` // Points for this specific option (useful for partial credit)
}

// Question represents a quiz question with support for different types
type Question struct {
	ID         primitive.ObjectID `json:"id" bson:"_id,omitempty"`
	Title      string             `json:"title" bson:"title"`
	Type       QuestionType       `json:"type" bson:"type"`
	Difficulty DifficultyLevel    `json:"difficulty" bson:"difficulty"`
	Points     int                `json:"points" bson:"points"` // Total points for this question
	IsActive   bool               `json:"is_active" bson:"is_active"`

	// Options for single/multiple choice questions with shuffling support
	Options []Option `json:"options,omitempty" bson:"options,omitempty"`

	// Correct answers as option IDs (allows for shuffling)
	CorrectAnswers []string `json:"correct_answers,omitempty" bson:"correct_answers,omitempty"`

	// Essay-specific field
	SampleAnswer string `json:"sample_answer,omitempty" bson:"sample_answer,omitempty"`

	// Maximum points for essay (can be different from base points for partial credit)
	MaxPoints int `json:"max_points,omitempty" bson:"max_points,omitempty"`

	// Metadata
	CreatedBy primitive.ObjectID `json:"created_by" bson:"created_by"`
	CreatedAt time.Time          `json:"created_at" bson:"created_at"`
	UpdatedAt time.Time          `json:"updated_at" bson:"updated_at"`
}

// Request/Response models for API

// CreateQuestionRequest represents the request to create a new question
type CreateQuestionRequest struct {
	Title          string          `json:"title" binding:"required"`
	Type           QuestionType    `json:"type" binding:"required,oneof=single_choice multiple_choice essay"`
	Difficulty     DifficultyLevel `json:"difficulty" binding:"required,oneof=easy medium hard"`
	Points         int             `json:"points" binding:"required,min=1"`
	Options        []CreateOption  `json:"options,omitempty"`
	CorrectAnswers []string        `json:"correct_answers,omitempty"`
	SampleAnswer   string          `json:"sample_answer,omitempty"`
	MaxPoints      int             `json:"max_points,omitempty"`
}

// CreateOption represents an option when creating a question
type CreateOption struct {
	Text   string `json:"text" binding:"required"`
	Points int    `json:"points,omitempty"` // Points for this option (default: 0 for wrong, question.Points for correct)
}

// UpdateQuestionRequest represents the request to update a question
type UpdateQuestionRequest struct {
	Title          *string          `json:"title,omitempty"`
	Difficulty     *DifficultyLevel `json:"difficulty,omitempty"`
	Points         *int             `json:"points,omitempty"`
	IsActive       *bool            `json:"is_active,omitempty"`
	Options        []CreateOption   `json:"options,omitempty"`
	CorrectAnswers []string         `json:"correct_answers,omitempty"`
	SampleAnswer   *string          `json:"sample_answer,omitempty"`
	MaxPoints      *int             `json:"max_points,omitempty"`
}

// ListQuestionsRequest represents the request to list questions with filters
type ListQuestionsRequest struct {
	Page       int             `form:"page,default=1" binding:"min=1"`
	Limit      int             `form:"limit,default=20" binding:"min=1,max=100"`
	Search     string          `form:"search"`
	Type       QuestionType    `form:"type"`
	Difficulty DifficultyLevel `form:"difficulty"`
	IsActive   *bool           `form:"is_active"`
}

// ListQuestionsResponse represents the response for listing questions
type ListQuestionsResponse struct {
	Questions  []*Question `json:"questions"`
	Total      int64       `json:"total"`
	Page       int         `json:"page"`
	Limit      int         `json:"limit"`
	TotalPages int         `json:"total_pages"`
}

// QuestionStatsResponse represents question statistics
type QuestionStatsResponse struct {
	Total          int64            `json:"total"`
	ByType         map[string]int64 `json:"by_type"`
	ByDifficulty   map[string]int64 `json:"by_difficulty"`
	ActiveCount    int64            `json:"active_count"`
	InactiveCount  int64            `json:"inactive_count"`
	SingleChoice   int64            `json:"single_choice"`
	MultipleChoice int64            `json:"multiple_choice"`
	Essay          int64            `json:"essay"`
	TotalPoints    int64            `json:"total_points"`
	AveragePoints  float64          `json:"average_points"`
}

// QuestionForQuiz represents a question prepared for quiz (with shuffled options)
type QuestionForQuiz struct {
	ID        primitive.ObjectID `json:"id"`
	Title     string             `json:"title"`
	Type      QuestionType       `json:"type"`
	Points    int                `json:"points"`
	Options   []Option           `json:"options,omitempty"` // Shuffled options
	MaxPoints int                `json:"max_points,omitempty"`
	// Note: CorrectAnswers are NOT included in quiz response for security
}
