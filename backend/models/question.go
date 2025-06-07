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

// Question represents a quiz question with support for different types
type Question struct {
	ID     primitive.ObjectID `json:"id" bson:"_id,omitempty"`
	Text   string             `json:"text" bson:"text"`
	Type   QuestionType       `json:"type" bson:"type"`
	Points int                `json:"points" bson:"points"`

	// Options for single/multiple choice questions
	Options []Option `json:"options,omitempty" bson:"options,omitempty"`

	// Correct answers handling
	CorrectAnswers []Option `json:"correct_answers,omitempty" bson:"correct_answers,omitempty"`

	// Essay-specific field
	EssaySampleAnswer string `json:"essay_sample_answer,omitempty" bson:"essay_sample_answer,omitempty"`

	// Metadata
	CreatedBy primitive.ObjectID `json:"created_by" bson:"created_by"`
	CreatedAt time.Time          `json:"created_at" bson:"created_at"`
	UpdatedAt time.Time          `json:"updated_at" bson:"updated_at"`
}

// Option represents a choice option for single/multiple choice questions
type Option struct {
	ID    string `json:"id" bson:"id"`
	Text  string `json:"text" bson:"text"`
	Order int    `json:"order" bson:"order"`
}
