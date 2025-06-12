package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Module struct {
	ID          primitive.ObjectID `json:"id" bson:"_id,omitempty"`
	Name        string             `json:"name" bson:"name" binding:"required,min=1,max=200"`
	Description string             `json:"description" bson:"description" binding:"max=500"`
	SubModules  []SubModule        `json:"sub_modules" bson:"sub_modules"`
	Content     string             `json:"content" bson:"content"`           // Markdown content
	IsPublished bool               `json:"is_published" bson:"is_published"` // Publication status

	// Metadata
	CreatedAt time.Time          `json:"created_at" bson:"created_at"`
	UpdatedAt time.Time          `json:"updated_at" bson:"updated_at"`
	CreatedBy primitive.ObjectID `json:"created_by" bson:"created_by"`
	UpdatedBy primitive.ObjectID `json:"updated_by" bson:"updated_by"`
}

type SubModule struct {
	ID          primitive.ObjectID `json:"id" bson:"_id,omitempty"`
	Name        string             `json:"name" bson:"name" binding:"required,min=1,max=200"`
	Description string             `json:"description" bson:"description" binding:"max=500"`
	Content     string             `json:"content" bson:"content"`           // Markdown content
	IsPublished bool               `json:"is_published" bson:"is_published"` // Publication status

	// Metadata
	CreatedAt time.Time          `json:"created_at" bson:"created_at"`
	UpdatedAt time.Time          `json:"updated_at" bson:"updated_at"`
	CreatedBy primitive.ObjectID `json:"created_by" bson:"created_by"`
	UpdatedBy primitive.ObjectID `json:"updated_by" bson:"updated_by"`
}

// Request/Response models for API
type CreateModuleRequest struct {
	Name        string      `json:"name" binding:"required,min=1,max=200"`
	Description string      `json:"description" binding:"max=500"`
	Content     string      `json:"content" binding:"required"`
	SubModules  []SubModule `json:"sub_modules,omitempty"`
}

type UpdateModuleRequest struct {
	Name        *string     `json:"name,omitempty" binding:"omitempty,min=1,max=200"`
	Description *string     `json:"description,omitempty" binding:"omitempty,max=500"`
	Content     *string     `json:"content,omitempty"`
	SubModules  []SubModule `json:"sub_modules,omitempty"`
}

type CreateSubModuleRequest struct {
	Name        string `json:"name" binding:"required,min=1,max=200"`
	Description string `json:"description" binding:"max=500"`
	Content     string `json:"content" binding:"required"`
}

// Additional request/response models for API
type GetModulesRequest struct {
	Page      int    `json:"page"`
	Limit     int    `json:"limit"`
	Search    string `json:"search,omitempty"`
	Published *bool  `json:"published,omitempty"`
}

type GetModulesResponse struct {
	Modules    []Module `json:"modules"`
	Total      int64    `json:"total"`
	Page       int      `json:"page"`
	Limit      int      `json:"limit"`
	TotalPages int      `json:"total_pages"`
}
