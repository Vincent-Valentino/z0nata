package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type QuizStatus string

const (
	QuizInProgress QuizStatus = "in_progress"
	QuizCompleted  QuizStatus = "completed"
	QuizTimeout    QuizStatus = "timeout"
	QuizAbandoned  QuizStatus = "abandoned"
)

// QuizSession represents an active quiz session
type QuizSession struct {
	ID           primitive.ObjectID `json:"id" bson:"_id,omitempty"`
	UserID       primitive.ObjectID `json:"user_id" bson:"user_id"`
	QuizType     QuizType           `json:"quiz_type" bson:"quiz_type"`
	SessionToken string             `json:"session_token" bson:"session_token"` // Unique session identifier

	// Quiz Configuration
	TotalQuestions   int `json:"total_questions" bson:"total_questions"`
	MaxPoints        int `json:"max_points" bson:"max_points"`
	TimeLimitMinutes int `json:"time_limit_minutes" bson:"time_limit_minutes"`

	// Questions
	Questions []SessionQuestion `json:"questions" bson:"questions"`

	// Timing
	StartTime     time.Time  `json:"start_time" bson:"start_time"`
	EndTime       *time.Time `json:"end_time,omitempty" bson:"end_time,omitempty"`
	TimeRemaining int64      `json:"time_remaining" bson:"time_remaining"` // seconds left

	// Progress
	CurrentQuestion int `json:"current_question" bson:"current_question"` // 0-based index
	AnsweredCount   int `json:"answered_count" bson:"answered_count"`
	SkippedCount    int `json:"skipped_count" bson:"skipped_count"`

	// Status
	Status      QuizStatus `json:"status" bson:"status"`
	IsSubmitted bool       `json:"is_submitted" bson:"is_submitted"`

	// Metadata
	CreatedAt time.Time `json:"created_at" bson:"created_at"`
	UpdatedAt time.Time `json:"updated_at" bson:"updated_at"`
}

// SessionQuestion represents a question in a quiz session with user's answer
type SessionQuestion struct {
	QuestionID primitive.ObjectID `json:"question_id" bson:"question_id"`
	Title      string             `json:"title" bson:"title"`
	Type       QuestionType       `json:"type" bson:"type"`
	Difficulty DifficultyLevel    `json:"difficulty" bson:"difficulty"`
	Points     int                `json:"points" bson:"points"`

	// Shuffled options for this session
	Options        []Option `json:"options" bson:"options"`
	CorrectAnswers []string `json:"-" bson:"correct_answers"` // Hidden from frontend

	// User's response
	UserAnswer   interface{} `json:"user_answer,omitempty" bson:"user_answer,omitempty"` // string or []string
	IsAnswered   bool        `json:"is_answered" bson:"is_answered"`
	IsSkipped    bool        `json:"is_skipped" bson:"is_skipped"`
	IsCorrect    bool        `json:"is_correct" bson:"is_correct"`
	PointsEarned int         `json:"points_earned" bson:"points_earned"`

	// Timing per question
	TimeSpent      int64      `json:"time_spent" bson:"time_spent"` // seconds
	FirstAttemptAt *time.Time `json:"first_attempt_at,omitempty" bson:"first_attempt_at,omitempty"`
	LastModifiedAt *time.Time `json:"last_modified_at,omitempty" bson:"last_modified_at,omitempty"`

	// Navigation tracking
	VisitCount int `json:"visit_count" bson:"visit_count"`
}

// DetailedQuizResult extends the existing QuizResult with more comprehensive data
type DetailedQuizResult struct {
	QuizResult `bson:",inline"`   // Embed existing QuizResult
	SessionID  primitive.ObjectID `json:"session_id" bson:"session_id"`

	// Enhanced Scoring (extends the basic 0-100 score)
	TotalPoints     int     `json:"total_points" bson:"total_points"`         // Max possible points
	EarnedPoints    int     `json:"earned_points" bson:"earned_points"`       // Points earned
	TimeBonus       int     `json:"time_bonus" bson:"time_bonus"`             // Extra points for speed (TimeQuiz only)
	FinalScore      int     `json:"final_score" bson:"final_score"`           // EarnedPoints + TimeBonus
	ScorePercentage float64 `json:"score_percentage" bson:"score_percentage"` // (FinalScore/TotalPoints) * 100

	// Enhanced Timing
	TimeLimitMinutes int   `json:"time_limit_minutes" bson:"time_limit_minutes"`
	TimeUsedSeconds  int64 `json:"time_used_seconds" bson:"time_used_seconds"`
	TimeLeftSeconds  int64 `json:"time_left_seconds" bson:"time_left_seconds"`

	// Performance by Difficulty
	EasyCorrect   int `json:"easy_correct" bson:"easy_correct"`
	EasyTotal     int `json:"easy_total" bson:"easy_total"`
	MediumCorrect int `json:"medium_correct" bson:"medium_correct"`
	MediumTotal   int `json:"medium_total" bson:"medium_total"`
	HardCorrect   int `json:"hard_correct" bson:"hard_correct"`
	HardTotal     int `json:"hard_total" bson:"hard_total"`

	// Detailed answers for review
	QuestionResults []QuestionResult `json:"question_results" bson:"question_results"`

	// Status
	CompletionStatus QuizStatus `json:"completion_status" bson:"completion_status"`
	SubmittedAt      time.Time  `json:"submitted_at" bson:"submitted_at"`
}

// QuestionResult represents the result for a specific question
type QuestionResult struct {
	QuestionID primitive.ObjectID `json:"question_id" bson:"question_id"`
	Title      string             `json:"title" bson:"title"`
	Type       QuestionType       `json:"type" bson:"type"`
	Difficulty DifficultyLevel    `json:"difficulty" bson:"difficulty"`
	Points     int                `json:"points" bson:"points"`

	UserAnswer    interface{} `json:"user_answer" bson:"user_answer"`
	CorrectAnswer interface{} `json:"correct_answer" bson:"correct_answer"`
	IsCorrect     bool        `json:"is_correct" bson:"is_correct"`
	IsSkipped     bool        `json:"is_skipped" bson:"is_skipped"`
	PointsEarned  int         `json:"points_earned" bson:"points_earned"`
	TimeSpent     int64       `json:"time_spent" bson:"time_spent"`

	// For review purposes - include options
	Options []Option `json:"options" bson:"options"`
}

// API Request/Response Models

type StartQuizRequest struct {
	QuizType QuizType `json:"quiz_type" binding:"required,oneof=mock_test time_quiz"`
}

type StartQuizResponse struct {
	Session     QuizSession `json:"session"`
	Message     string      `json:"message"`
	ResumeToken string      `json:"resume_token"` // For frontend to store in localStorage
}

type SaveAnswerRequest struct {
	QuestionIndex int         `json:"question_index" binding:"required"`
	Answer        interface{} `json:"answer" binding:"required"`
	TimeSpent     int64       `json:"time_spent" binding:"required"` // seconds spent on this question
}

type SaveAnswerResponse struct {
	Success       bool        `json:"success"`
	IsCorrect     bool        `json:"is_correct,omitempty"`     // Only for TimeQuiz immediate feedback
	CorrectAnswer interface{} `json:"correct_answer,omitempty"` // Only for TimeQuiz immediate feedback
	PointsEarned  int         `json:"points_earned,omitempty"`  // Only for TimeQuiz immediate feedback
	Message       string      `json:"message"`
}

type NavigateQuestionRequest struct {
	QuestionIndex int `json:"question_index" binding:"required"`
}

type SubmitQuizRequest struct {
	SessionToken string `json:"session_token" binding:"required"`
}

type SubmitQuizResponse struct {
	Result  DetailedQuizResult `json:"result"`
	Success bool               `json:"success"`
	Message string             `json:"message"`
}

type GetSessionResponse struct {
	Session       QuizSession `json:"session"`
	TimeRemaining int64       `json:"time_remaining"` // Real-time calculation
	IsExpired     bool        `json:"is_expired"`
}

// Quiz Configuration for different types
type QuizConfig struct {
	Type             QuizType `json:"type"`
	MaxPoints        int      `json:"max_points"`
	TimeLimitMinutes int      `json:"time_limit_minutes"`
	EasyQuestions    int      `json:"easy_questions"`
	MediumQuestions  int      `json:"medium_questions"`
	HardQuestions    int      `json:"hard_questions"`
	TotalQuestions   int      `json:"total_questions"`
	EasyPoints       int      `json:"easy_points"`   // Points per easy question
	MediumPoints     int      `json:"medium_points"` // Points per medium question
	HardPoints       int      `json:"hard_points"`   // Points per hard question
}

// GetQuizConfig returns configuration for different quiz types
func GetQuizConfig(quizType QuizType) QuizConfig {
	switch quizType {
	case MockTest:
		return QuizConfig{
			Type:             MockTest,
			MaxPoints:        1000,
			TimeLimitMinutes: 60,
			EasyPoints:       5,  // Easy questions worth 5 points
			MediumPoints:     10, // Medium questions worth 10 points
			HardPoints:       20, // Hard questions worth 20 points
			// Questions will be dynamically allocated to reach ~1000 points
			// Example: 80 easy (400pts) + 30 medium (300pts) + 15 hard (300pts) = 1000pts
			TotalQuestions: 0, // Will be calculated based on available questions
		}
	case TimeQuiz:
		return QuizConfig{
			Type:             TimeQuiz,
			MaxPoints:        200, // 10*5 + 5*10 + 5*20 = 200 points
			TimeLimitMinutes: 5,
			EasyQuestions:    10,
			MediumQuestions:  5,
			HardQuestions:    5,
			TotalQuestions:   20,
			EasyPoints:       5,
			MediumPoints:     10,
			HardPoints:       20,
		}
	default:
		return QuizConfig{}
	}
}

// CalculateTimeBonus calculates time bonus for TimeQuiz
func CalculateTimeBonus(timeLeftSeconds int64, maxBonus int) int {
	if timeLeftSeconds <= 0 {
		return 0
	}

	// Time bonus formula: up to maxBonus points based on time remaining
	// More time left = more bonus (linear scale)
	maxTimeSeconds := int64(5 * 60) // 5 minutes
	bonusPercentage := float64(timeLeftSeconds) / float64(maxTimeSeconds)
	bonus := int(bonusPercentage * float64(maxBonus))

	if bonus > maxBonus {
		bonus = maxBonus
	}
	return bonus
}
