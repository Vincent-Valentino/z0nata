package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// ActivityType represents the type of activity performed
type ActivityType string

const (
	// Module activities
	ActivityModuleCreated     ActivityType = "module_created"
	ActivityModuleUpdated     ActivityType = "module_updated"
	ActivityModuleDeleted     ActivityType = "module_deleted"
	ActivityModulePublished   ActivityType = "module_published"
	ActivityModuleUnpublished ActivityType = "module_unpublished"

	// SubModule activities
	ActivitySubModuleCreated     ActivityType = "submodule_created"
	ActivitySubModuleUpdated     ActivityType = "submodule_updated"
	ActivitySubModuleDeleted     ActivityType = "submodule_deleted"
	ActivitySubModulePublished   ActivityType = "submodule_published"
	ActivitySubModuleUnpublished ActivityType = "submodule_unpublished"

	// Question activities
	ActivityQuestionCreated     ActivityType = "question_created"
	ActivityQuestionUpdated     ActivityType = "question_updated"
	ActivityQuestionDeleted     ActivityType = "question_deleted"
	ActivityQuestionActivated   ActivityType = "question_activated"
	ActivityQuestionDeactivated ActivityType = "question_deactivated"

	// User management activities
	ActivityUserAccessGranted ActivityType = "user_access_granted"
	ActivityUserAccessRevoked ActivityType = "user_access_revoked"
	ActivityUserSuspended     ActivityType = "user_suspended"
	ActivityUserActivated     ActivityType = "user_activated"
	ActivityUserRoleChanged   ActivityType = "user_role_changed"

	// Authentication activities
	ActivityUserLogin       ActivityType = "user_login"
	ActivityUserLogout      ActivityType = "user_logout"
	ActivityUserLoginFailed ActivityType = "user_login_failed"
	ActivityAdminLogin      ActivityType = "admin_login"
	ActivityMahasiswaLogin  ActivityType = "mahasiswa_login"
	ActivityExternalLogin   ActivityType = "external_login"

	// System activities
	ActivitySystemMaintenance ActivityType = "system_maintenance"
	ActivityBulkOperation     ActivityType = "bulk_operation"
	ActivityDataExport        ActivityType = "data_export"
	ActivityDataImport        ActivityType = "data_import"
)

// ActivityLog represents a system activity log entry
type ActivityLog struct {
	ID         primitive.ObjectID `json:"id" bson:"_id,omitempty"`
	Type       ActivityType       `json:"type" bson:"type"`
	Action     string             `json:"action" bson:"action"`           // Human readable action description
	EntityType string             `json:"entity_type" bson:"entity_type"` // e.g., "module", "question", "user"
	EntityID   string             `json:"entity_id" bson:"entity_id"`     // ID of the affected entity
	EntityName string             `json:"entity_name" bson:"entity_name"` // Name/title of the affected entity

	// User who performed the action
	PerformedBy     primitive.ObjectID `json:"performed_by" bson:"performed_by"`
	PerformedByName string             `json:"performed_by_name" bson:"performed_by_name"`
	PerformedByType string             `json:"performed_by_type" bson:"performed_by_type"` // "admin", "mahasiswa", "external"

	// Additional context
	Details   map[string]interface{} `json:"details,omitempty" bson:"details,omitempty"`       // Additional structured data
	Changes   map[string]interface{} `json:"changes,omitempty" bson:"changes,omitempty"`       // Before/after values for updates
	IPAddress string                 `json:"ip_address,omitempty" bson:"ip_address,omitempty"` // Client IP address
	UserAgent string                 `json:"user_agent,omitempty" bson:"user_agent,omitempty"` // Client user agent

	// Metadata
	Timestamp time.Time `json:"timestamp" bson:"timestamp"`
	Success   bool      `json:"success" bson:"success"`                         // Whether the action was successful
	ErrorMsg  string    `json:"error_msg,omitempty" bson:"error_msg,omitempty"` // Error message if failed
}

// Request/Response models for API
type GetActivityLogsRequest struct {
	Page       int          `json:"page"`
	Limit      int          `json:"limit"`
	Type       ActivityType `json:"type,omitempty"`
	EntityType string       `json:"entity_type,omitempty"`
	UserID     string       `json:"user_id,omitempty"`
	DateFrom   *time.Time   `json:"date_from,omitempty"`
	DateTo     *time.Time   `json:"date_to,omitempty"`
	Success    *bool        `json:"success,omitempty"`
}

type GetActivityLogsResponse struct {
	Activities []ActivityLog `json:"activities"`
	Total      int64         `json:"total"`
	Page       int           `json:"page"`
	Limit      int           `json:"limit"`
	TotalPages int           `json:"total_pages"`
}

type ActivityStats struct {
	TotalActivities   int64                  `json:"total_activities"`
	TodayActivities   int64                  `json:"today_activities"`
	SuccessfulActions int64                  `json:"successful_actions"`
	FailedActions     int64                  `json:"failed_actions"`
	ByType            map[ActivityType]int64 `json:"by_type"`
	ByEntityType      map[string]int64       `json:"by_entity_type"`
	RecentActivities  []ActivityLog          `json:"recent_activities"`
	TopPerformers     []UserActivitySummary  `json:"top_performers"`
}

type UserActivitySummary struct {
	UserID      string `json:"user_id"`
	UserName    string `json:"user_name"`
	UserType    string `json:"user_type"`
	ActionCount int64  `json:"action_count"`
}

// Helper methods for activity creation
func NewActivityLog(activityType ActivityType, action string, entityType, entityID, entityName string, performedBy primitive.ObjectID, performedByName, performedByType string) *ActivityLog {
	return &ActivityLog{
		ID:              primitive.NewObjectID(),
		Type:            activityType,
		Action:          action,
		EntityType:      entityType,
		EntityID:        entityID,
		EntityName:      entityName,
		PerformedBy:     performedBy,
		PerformedByName: performedByName,
		PerformedByType: performedByType,
		Details:         make(map[string]interface{}),
		Changes:         make(map[string]interface{}),
		Timestamp:       time.Now(),
		Success:         true,
	}
}

// SetDetails adds additional context to the activity log
func (a *ActivityLog) SetDetails(key string, value interface{}) *ActivityLog {
	if a.Details == nil {
		a.Details = make(map[string]interface{})
	}
	a.Details[key] = value
	return a
}

// SetChanges records before/after values for update operations
func (a *ActivityLog) SetChanges(changes map[string]interface{}) *ActivityLog {
	a.Changes = changes
	return a
}

// SetClientInfo records client IP and user agent
func (a *ActivityLog) SetClientInfo(ipAddress, userAgent string) *ActivityLog {
	a.IPAddress = ipAddress
	a.UserAgent = userAgent
	return a
}

// MarkFailed marks the activity as failed with an error message
func (a *ActivityLog) MarkFailed(errorMsg string) *ActivityLog {
	a.Success = false
	a.ErrorMsg = errorMsg
	return a
}
