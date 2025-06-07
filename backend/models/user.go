package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type User struct {
	ID             primitive.ObjectID `json:"id" bson:"_id,omitempty"`
	FullName       string             `json:"full_name" bson:"full_name"`
	Email          string             `json:"email" bson:"email"`
	PasswordHash   string             `json:"-" bson:"password_hash,omitempty"`
	EmailVerified  bool               `json:"email_verified" bson:"email_verified"`
	ProfilePicture string             `json:"profile_picture" bson:"profile_picture,omitempty"`

	// OAuth fields
	GoogleID   string `json:"-" bson:"google_id,omitempty"`
	FacebookID string `json:"-" bson:"facebook_id,omitempty"`
	AppleID    string `json:"-" bson:"apple_id,omitempty"`
	GithubID   string `json:"-" bson:"github_id,omitempty"`

	// Password reset
	ResetToken       string    `json:"-" bson:"reset_token,omitempty"`
	ResetTokenExpiry time.Time `json:"-" bson:"reset_token_expiry,omitempty"`

	// Email verification
	VerificationToken string `json:"-" bson:"verification_token,omitempty"`

	// Session management
	RefreshToken string    `json:"-" bson:"refresh_token,omitempty"`
	RememberMe   bool      `json:"-" bson:"remember_me"`
	LastLogin    time.Time `json:"last_login" bson:"last_login"`

	CreatedAt time.Time `json:"created_at" bson:"created_at"`
	UpdatedAt time.Time `json:"updated_at" bson:"updated_at"`
}

type Admin struct {
	User
	IsAdmin     bool     `json:"is_admin" bson:"is_admin"`
	Permissions []string `json:"permissions" bson:"permissions"`
}

type UserMahasiswa struct {
	User
	NIM     string `json:"mahasiswa_id" bson:"mahasiswa_id"`
	Status  string `json:"status" bson:"status"`
	Faculty string `json:"faculty" bson:"faculty,omitempty"`
	Major   string `json:"major" bson:"major,omitempty"`
}

// Auth request/response models
type LoginRequest struct {
	Email      string `json:"email" binding:"required,email"`
	Password   string `json:"password" binding:"required"`
	RememberMe bool   `json:"remember_me"`
}

type RegisterRequest struct {
	FullName string `json:"full_name" binding:"required"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=8"`
	UserType string `json:"user_type" binding:"required,oneof=mahasiswa admin"`

	// Optional fields for mahasiswa
	NIM     string `json:"nim,omitempty"`
	Faculty string `json:"faculty,omitempty"`
	Major   string `json:"major,omitempty"`
}

type AuthResponse struct {
	User         interface{} `json:"user"`
	AccessToken  string      `json:"access_token"`
	RefreshToken string      `json:"refresh_token,omitempty"`
	ExpiresIn    int64       `json:"expires_in"`
}

type OAuthRequest struct {
	Provider    string `json:"provider" binding:"required,oneof=google facebook apple github"`
	Code        string `json:"code,omitempty"`
	AccessToken string `json:"access_token,omitempty"`
	IDToken     string `json:"id_token,omitempty"`
	UserType    string `json:"user_type" binding:"required,oneof=mahasiswa admin"`
}

type PasswordResetRequest struct {
	Email string `json:"email" binding:"required,email"`
}

type PasswordResetConfirm struct {
	Token       string `json:"token" binding:"required"`
	NewPassword string `json:"new_password" binding:"required,min=8"`
}

type ChangePasswordRequest struct {
	CurrentPassword string `json:"current_password" binding:"required"`
	NewPassword     string `json:"new_password" binding:"required,min=8"`
}

type RefreshTokenRequest struct {
	RefreshToken string `json:"refresh_token" binding:"required"`
}
