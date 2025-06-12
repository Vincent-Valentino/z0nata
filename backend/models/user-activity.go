package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// QuizType represents the type of quiz
type QuizType string

const (
	MockTest QuizType = "mock_test"
	TimeQuiz QuizType = "time_quiz"
)

// QuizResult represents a completed quiz attempt by a user
type QuizResult struct {
	ID     primitive.ObjectID `json:"id" bson:"_id,omitempty"`
	UserID primitive.ObjectID `json:"user_id" bson:"user_id"`

	// Quiz info - questions are random so no specific quiz ID needed
	QuizType QuizType `json:"quiz_type" bson:"quiz_type"` // mock_test or time_quiz
	Title    string   `json:"title" bson:"title"`         // Generated title like "Mock Test #1" or "Time Quiz #1"

	// Results - always out of 100
	Score          int `json:"score" bson:"score"` // Percentage score (0-100)
	TotalQuestions int `json:"total_questions" bson:"total_questions"`
	CorrectAnswers int `json:"correct_answers" bson:"correct_answers"`

	// Time tracking
	TimeSpent   int64     `json:"time_spent" bson:"time_spent"`                     // in seconds
	TimeLimit   int64     `json:"time_limit,omitempty" bson:"time_limit,omitempty"` // in seconds, for time quiz
	StartedAt   time.Time `json:"started_at" bson:"started_at"`
	CompletedAt time.Time `json:"completed_at" bson:"completed_at"`

	// Question types breakdown
	SingleChoiceCorrect   int `json:"single_choice_correct" bson:"single_choice_correct"`
	MultipleChoiceCorrect int `json:"multiple_choice_correct" bson:"multiple_choice_correct"`
	EssayCorrect          int `json:"essay_correct" bson:"essay_correct"`

	SingleChoiceTotal   int `json:"single_choice_total" bson:"single_choice_total"`
	MultipleChoiceTotal int `json:"multiple_choice_total" bson:"multiple_choice_total"`
	EssayTotal          int `json:"essay_total" bson:"essay_total"`

	// Status
	Status     string `json:"status" bson:"status"`             // completed, abandoned, in_progress
	IsTimedOut bool   `json:"is_timed_out" bson:"is_timed_out"` // for time quiz

	CreatedAt time.Time `json:"created_at" bson:"created_at"`
	UpdatedAt time.Time `json:"updated_at" bson:"updated_at"`
}

// UserStats represents aggregated statistics for a user
type UserStats struct {
	ID     primitive.ObjectID `json:"id" bson:"_id,omitempty"`
	UserID primitive.ObjectID `json:"user_id" bson:"user_id"`

	// Overall statistics
	TotalQuizzesCompleted int     `json:"total_quizzes_completed" bson:"total_quizzes_completed"`
	AverageScore          float64 `json:"average_score" bson:"average_score"`
	TotalTimeSpent        int64   `json:"total_time_spent" bson:"total_time_spent"` // in seconds
	TotalQuestions        int     `json:"total_questions" bson:"total_questions"`
	TotalCorrectAnswers   int     `json:"total_correct_answers" bson:"total_correct_answers"`

	// Quiz type performance
	MockTestCount   int     `json:"mock_test_count" bson:"mock_test_count"`
	TimeQuizCount   int     `json:"time_quiz_count" bson:"time_quiz_count"`
	MockTestAverage float64 `json:"mock_test_average" bson:"mock_test_average"`
	TimeQuizAverage float64 `json:"time_quiz_average" bson:"time_quiz_average"`

	// Question type performance
	SingleChoiceAccuracy   float64 `json:"single_choice_accuracy" bson:"single_choice_accuracy"`
	MultipleChoiceAccuracy float64 `json:"multiple_choice_accuracy" bson:"multiple_choice_accuracy"`
	EssayAccuracy          float64 `json:"essay_accuracy" bson:"essay_accuracy"`

	// Time-based statistics
	AverageTimePerQuestion float64 `json:"average_time_per_question" bson:"average_time_per_question"` // seconds
	FastestQuizTime        int64   `json:"fastest_quiz_time" bson:"fastest_quiz_time"`
	TimeoutCount           int     `json:"timeout_count" bson:"timeout_count"` // how many time quizzes timed out

	// Streak and goals
	CurrentStreak int       `json:"current_streak" bson:"current_streak"`
	LongestStreak int       `json:"longest_streak" bson:"longest_streak"`
	LastQuizDate  time.Time `json:"last_quiz_date" bson:"last_quiz_date"`

	// Goals
	WeeklyGoal         int `json:"weekly_goal" bson:"weekly_goal"`
	WeeklyProgress     int `json:"weekly_progress" bson:"weekly_progress"`
	TargetAverageScore int `json:"target_average_score" bson:"target_average_score"`

	UpdatedAt time.Time `json:"updated_at" bson:"updated_at"`
}

// Achievement represents user achievements
type Achievement struct {
	ID          primitive.ObjectID `json:"id" bson:"_id,omitempty"`
	UserID      primitive.ObjectID `json:"user_id" bson:"user_id"`
	Type        string             `json:"type" bson:"type"` // high_achiever, consistent_learner, time_master, speed_demon, etc.
	Title       string             `json:"title" bson:"title"`
	Description string             `json:"description" bson:"description"`
	IconName    string             `json:"icon_name" bson:"icon_name"`
	EarnedAt    time.Time          `json:"earned_at" bson:"earned_at"`
}

// Request/Response models for API
type QuizResultRequest struct {
	QuizType       QuizType  `json:"quiz_type" binding:"required,oneof=mock_test time_quiz"`
	Score          int       `json:"score" binding:"required,min=0,max=100"`
	TotalQuestions int       `json:"total_questions" binding:"required,min=1"`
	CorrectAnswers int       `json:"correct_answers" binding:"required,min=0"`
	TimeSpent      int64     `json:"time_spent" binding:"required,min=0"`
	TimeLimit      int64     `json:"time_limit,omitempty"` // for time quiz
	StartedAt      time.Time `json:"started_at" binding:"required"`
	IsTimedOut     bool      `json:"is_timed_out,omitempty"` // for time quiz

	// Question type breakdown
	SingleChoiceCorrect   int `json:"single_choice_correct"`
	MultipleChoiceCorrect int `json:"multiple_choice_correct"`
	EssayCorrect          int `json:"essay_correct"`
	SingleChoiceTotal     int `json:"single_choice_total"`
	MultipleChoiceTotal   int `json:"multiple_choice_total"`
	EssayTotal            int `json:"essay_total"`
}

type UserResultsResponse struct {
	Results      []QuizResult  `json:"results"`
	Stats        UserStats     `json:"stats"`
	Achievements []Achievement `json:"achievements"`
	TotalCount   int64         `json:"total_count"`
}

type QuizResultsFilter struct {
	QuizType string `form:"quiz_type"` // mock_test, time_quiz
	DateFrom string `form:"date_from"`
	DateTo   string `form:"date_to"`
	Page     int    `form:"page,default=1"`
	Limit    int    `form:"limit,default=10"`
}
