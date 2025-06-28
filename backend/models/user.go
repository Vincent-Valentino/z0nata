package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// User types
type UserType string

const (
	UserTypeMahasiswa UserType = "mahasiswa"
	UserTypeExternal  UserType = "external"
	UserTypeAdmin     UserType = "admin"
)

// User status
type UserStatus string

const (
	UserStatusPending   UserStatus = "pending"   // Waiting for approval
	UserStatusActive    UserStatus = "active"    // Approved and active
	UserStatusSuspended UserStatus = "suspended" // Temporarily disabled
	UserStatusRejected  UserStatus = "rejected"  // Access denied
)

type User struct {
	ID             primitive.ObjectID `json:"id" bson:"_id,omitempty"`
	FullName       string             `json:"full_name" bson:"full_name"`
	Email          string             `json:"email" bson:"email"`
	PasswordHash   string             `json:"-" bson:"password_hash,omitempty"`
	EmailVerified  bool               `json:"email_verified" bson:"email_verified"`
	ProfilePicture string             `json:"profile_picture" bson:"profile_picture,omitempty"`

	// User classification
	UserType UserType   `json:"user_type" bson:"user_type"`
	Status   UserStatus `json:"status" bson:"status"`

	// OAuth fields
	GoogleID   string `json:"-" bson:"google_id,omitempty"`
	FacebookID string `json:"-" bson:"facebook_id,omitempty"`
	XID        string `json:"-" bson:"x_id,omitempty"`
	GithubID   string `json:"-" bson:"github_id,omitempty"`

	// Password reset
	ResetToken       string    `json:"-" bson:"reset_token,omitempty"`
	ResetTokenExpiry time.Time `json:"-" bson:"reset_token_expiry,omitempty"`

	// Recovery codes for password reset (single-use backup codes)
	RecoveryCodes []string `json:"-" bson:"recovery_codes,omitempty"`

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
	User        `bson:",inline"`
	IsAdmin     bool     `json:"is_admin" bson:"is_admin"`
	Permissions []string `json:"permissions" bson:"permissions"`
}

type UserMahasiswa struct {
	User    `bson:",inline"`
	NIM     string `json:"mahasiswa_id" bson:"mahasiswa_id"`
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
	FullName string   `json:"full_name" binding:"required"`
	Email    string   `json:"email" binding:"required,email"`
	Password string   `json:"password" binding:"required,min=8"`
	UserType UserType `json:"user_type" binding:"required,oneof=mahasiswa user admin"`

	// Fields for mahasiswa
	NIM     string `json:"nim,omitempty"`
	Faculty string `json:"faculty,omitempty"`
	Major   string `json:"major,omitempty"`

	// Fields for external users
	Organization   string   `json:"organization,omitempty"`
	Purpose        string   `json:"purpose,omitempty"`
	SupportingDocs []string `json:"supporting_docs,omitempty"`
}

type AuthResponse struct {
	User         interface{} `json:"user"`
	AccessToken  string      `json:"access_token"`
	RefreshToken string      `json:"refresh_token,omitempty"`
	ExpiresIn    int64       `json:"expires_in"`
}

type OAuthRequest struct {
	Provider    string   `json:"provider" binding:"required,oneof=google facebook x github"`
	Code        string   `json:"code,omitempty"`
	AccessToken string   `json:"access_token,omitempty"`
	IDToken     string   `json:"id_token,omitempty"`
	UserType    UserType `json:"user_type" binding:"required,oneof=mahasiswa user admin"`
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

// Recovery Codes Models
type PasswordResetWithRecoveryRequest struct {
	Email        string `json:"email" binding:"required,email"`
	RecoveryCode string `json:"recovery_code" binding:"required"`
	NewPassword  string `json:"new_password" binding:"required,min=8"`
}

type RecoveryCodesResponse struct {
	Codes   []string `json:"codes"`
	Message string   `json:"message"`
}

type PasswordResetOptionsResponse struct {
	Message          string   `json:"message"`
	Options          []string `json:"options"`
	HasRecoveryCodes bool     `json:"has_recovery_codes"`
	SupportContact   string   `json:"support_contact,omitempty"`
}

// Access Request Models
type AccessRequest struct {
	ID          primitive.ObjectID `json:"id" bson:"_id,omitempty"`
	UserID      primitive.ObjectID `json:"user_id" bson:"user_id"`
	RequestType UserType           `json:"request_type" bson:"request_type"` // mahasiswa or external

	// User information
	FullName string `json:"full_name" bson:"full_name"`
	Email    string `json:"email" bson:"email"`

	// Additional information based on type
	NIM            string   `json:"nim" bson:"nim,omitempty"`                         // For mahasiswa
	Faculty        string   `json:"faculty" bson:"faculty,omitempty"`                 // For mahasiswa
	Major          string   `json:"major" bson:"major,omitempty"`                     // For mahasiswa
	Organization   string   `json:"organization" bson:"organization,omitempty"`       // For external
	Purpose        string   `json:"purpose" bson:"purpose,omitempty"`                 // For external
	SupportingDocs []string `json:"supporting_docs" bson:"supporting_docs,omitempty"` // File URLs

	// Request status
	Status      UserStatus         `json:"status" bson:"status"`
	RequestedAt time.Time          `json:"requested_at" bson:"requested_at"`
	ReviewedAt  *time.Time         `json:"reviewed_at" bson:"reviewed_at,omitempty"`
	ReviewedBy  primitive.ObjectID `json:"reviewed_by" bson:"reviewed_by,omitempty"`
	ReviewNotes string             `json:"review_notes" bson:"review_notes,omitempty"`
}

// User Management Request Models
type ListUsersRequest struct {
	Page     int        `form:"page" binding:"omitempty,min=1"`
	Limit    int        `form:"limit" binding:"omitempty,min=1,max=100"`
	Search   string     `form:"search"`
	UserType UserType   `form:"user_type"`
	Status   UserStatus `form:"status"`
}

type ListUsersResponse struct {
	Users      []UserSummary `json:"users"`
	Total      int64         `json:"total"`
	Page       int           `json:"page"`
	Limit      int           `json:"limit"`
	TotalPages int           `json:"total_pages"`
}

type UserSummary struct {
	ID            primitive.ObjectID `json:"id"`
	FullName      string             `json:"full_name"`
	Email         string             `json:"email"`
	UserType      UserType           `json:"user_type"`
	Status        UserStatus         `json:"status"`
	EmailVerified bool               `json:"email_verified"`
	LastLogin     time.Time          `json:"last_login"`
	CreatedAt     time.Time          `json:"created_at"`

	// Additional fields based on user type
	NIM          string `json:"nim,omitempty"`          // For mahasiswa
	Faculty      string `json:"faculty,omitempty"`      // For mahasiswa
	Major        string `json:"major,omitempty"`        // For mahasiswa
	Organization string `json:"organization,omitempty"` // For external
}

type UpdateUserStatusRequest struct {
	Status UserStatus `json:"status" binding:"required,oneof=pending active suspended rejected"`
	Notes  string     `json:"notes"`
}

type ApproveAccessRequest struct {
	Notes string `json:"notes"`
}

type RejectAccessRequest struct {
	Notes string `json:"notes" binding:"required"`
}

type ListAccessRequestsRequest struct {
	Page   int        `form:"page" binding:"omitempty,min=1"`
	Limit  int        `form:"limit" binding:"omitempty,min=1,max=100"`
	Status UserStatus `form:"status"`
	Type   UserType   `form:"type"`
}

type ListAccessRequestsResponse struct {
	Requests   []AccessRequest `json:"requests"`
	Total      int64           `json:"total"`
	Page       int             `json:"page"`
	Limit      int             `json:"limit"`
	TotalPages int             `json:"total_pages"`
}

type UserStatsResponse struct {
	TotalUsers     int64 `json:"total_users"`
	ActiveUsers    int64 `json:"active_users"`
	PendingUsers   int64 `json:"pending_users"`
	SuspendedUsers int64 `json:"suspended_users"`

	ByType   map[string]int64 `json:"by_type"`
	ByStatus map[string]int64 `json:"by_status"`

	RecentRegistrations int64 `json:"recent_registrations"` // Last 7 days
	PendingRequests     int64 `json:"pending_requests"`
}
