package services

import (
	"context"
	"fmt"
	"net/http"
	"time"

	"backend/models"
	"backend/repository"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type ActivityLogService interface {
	// Core activity logging
	LogActivity(ctx context.Context, activityLog *models.ActivityLog) error
	LogActivityAsync(activityLog *models.ActivityLog)

	// Convenience methods for common activities
	LogModuleActivity(ctx context.Context, activityType models.ActivityType, moduleID, moduleName string, performedBy primitive.ObjectID, performedByName, performedByType string, details map[string]interface{}) error
	LogQuestionActivity(ctx context.Context, activityType models.ActivityType, questionID, questionTitle string, performedBy primitive.ObjectID, performedByName, performedByType string, details map[string]interface{}) error
	LogUserActivity(ctx context.Context, activityType models.ActivityType, userID, userName string, performedBy primitive.ObjectID, performedByName, performedByType string, details map[string]interface{}) error
	LogAuthActivity(ctx context.Context, activityType models.ActivityType, userID, userName, userType string, success bool, ipAddress, userAgent string, errorMsg string) error

	// Query methods
	GetActivityLogs(ctx context.Context, req *models.GetActivityLogsRequest) (*models.GetActivityLogsResponse, error)
	GetActivityStats(ctx context.Context) (*models.ActivityStats, error)
	GetRecentActivities(ctx context.Context, limit int) ([]models.ActivityLog, error)

	// Maintenance
	CleanupOldActivities(ctx context.Context, retentionDays int) (int64, error)
}

type activityLogService struct {
	activityLogRepo repository.ActivityLogRepository
	asyncChannel    chan *models.ActivityLog
}

func NewActivityLogService(activityLogRepo repository.ActivityLogRepository) ActivityLogService {
	service := &activityLogService{
		activityLogRepo: activityLogRepo,
		asyncChannel:    make(chan *models.ActivityLog, 1000), // Buffer for async logging
	}

	// Start async worker
	go service.asyncWorker()

	return service
}

// asyncWorker processes activity logs asynchronously
func (s *activityLogService) asyncWorker() {
	for activityLog := range s.asyncChannel {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		if err := s.activityLogRepo.CreateActivityLog(ctx, activityLog); err != nil {
			// Log error but don't fail the application
			fmt.Printf("Failed to log activity asynchronously: %v\n", err)
		}
		cancel()
	}
}

func (s *activityLogService) LogActivity(ctx context.Context, activityLog *models.ActivityLog) error {
	return s.activityLogRepo.CreateActivityLog(ctx, activityLog)
}

func (s *activityLogService) LogActivityAsync(activityLog *models.ActivityLog) {
	select {
	case s.asyncChannel <- activityLog:
		// Successfully queued for async processing
	default:
		// Channel is full, log synchronously as fallback
		ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
		defer cancel()
		if err := s.activityLogRepo.CreateActivityLog(ctx, activityLog); err != nil {
			fmt.Printf("Failed to log activity (async fallback): %v\n", err)
		}
	}
}

func (s *activityLogService) LogModuleActivity(ctx context.Context, activityType models.ActivityType, moduleID, moduleName string, performedBy primitive.ObjectID, performedByName, performedByType string, details map[string]interface{}) error {
	action := s.getActionFromType(activityType)

	activityLog := models.NewActivityLog(
		activityType,
		action,
		"module",
		moduleID,
		moduleName,
		performedBy,
		performedByName,
		performedByType,
	)

	if details != nil {
		for key, value := range details {
			activityLog.SetDetails(key, value)
		}
	}

	return s.LogActivity(ctx, activityLog)
}

func (s *activityLogService) LogQuestionActivity(ctx context.Context, activityType models.ActivityType, questionID, questionTitle string, performedBy primitive.ObjectID, performedByName, performedByType string, details map[string]interface{}) error {
	action := s.getActionFromType(activityType)

	activityLog := models.NewActivityLog(
		activityType,
		action,
		"question",
		questionID,
		questionTitle,
		performedBy,
		performedByName,
		performedByType,
	)

	if details != nil {
		for key, value := range details {
			activityLog.SetDetails(key, value)
		}
	}

	return s.LogActivity(ctx, activityLog)
}

func (s *activityLogService) LogUserActivity(ctx context.Context, activityType models.ActivityType, userID, userName string, performedBy primitive.ObjectID, performedByName, performedByType string, details map[string]interface{}) error {
	action := s.getActionFromType(activityType)

	activityLog := models.NewActivityLog(
		activityType,
		action,
		"user",
		userID,
		userName,
		performedBy,
		performedByName,
		performedByType,
	)

	if details != nil {
		for key, value := range details {
			activityLog.SetDetails(key, value)
		}
	}

	return s.LogActivity(ctx, activityLog)
}

func (s *activityLogService) LogAuthActivity(ctx context.Context, activityType models.ActivityType, userID, userName, userType string, success bool, ipAddress, userAgent string, errorMsg string) error {
	action := s.getActionFromType(activityType)

	// For auth activities, the user performing the action is the same as the entity
	performedBy, _ := primitive.ObjectIDFromHex(userID)

	activityLog := models.NewActivityLog(
		activityType,
		action,
		"user",
		userID,
		userName,
		performedBy,
		userName,
		userType,
	)

	activityLog.Success = success
	activityLog.SetClientInfo(ipAddress, userAgent)

	if !success && errorMsg != "" {
		activityLog.MarkFailed(errorMsg)
	}

	return s.LogActivity(ctx, activityLog)
}

func (s *activityLogService) GetActivityLogs(ctx context.Context, req *models.GetActivityLogsRequest) (*models.GetActivityLogsResponse, error) {
	// Set default pagination if not provided
	if req.Page <= 0 {
		req.Page = 1
	}
	if req.Limit <= 0 {
		req.Limit = 20
	}
	if req.Limit > 100 {
		req.Limit = 100 // Max limit
	}

	activities, total, err := s.activityLogRepo.GetActivityLogs(ctx, req)
	if err != nil {
		return nil, err
	}

	totalPages := int((total + int64(req.Limit) - 1) / int64(req.Limit))

	return &models.GetActivityLogsResponse{
		Activities: activities,
		Total:      total,
		Page:       req.Page,
		Limit:      req.Limit,
		TotalPages: totalPages,
	}, nil
}

func (s *activityLogService) GetActivityStats(ctx context.Context) (*models.ActivityStats, error) {
	return s.activityLogRepo.GetActivityStats(ctx)
}

func (s *activityLogService) GetRecentActivities(ctx context.Context, limit int) ([]models.ActivityLog, error) {
	if limit <= 0 {
		limit = 10
	}
	if limit > 50 {
		limit = 50 // Max limit for recent activities
	}

	return s.activityLogRepo.GetRecentActivities(ctx, limit)
}

func (s *activityLogService) CleanupOldActivities(ctx context.Context, retentionDays int) (int64, error) {
	if retentionDays <= 0 {
		retentionDays = 90 // Default retention: 90 days
	}

	cutoffDate := time.Now().AddDate(0, 0, -retentionDays)
	return s.activityLogRepo.DeleteOldActivities(ctx, cutoffDate)
}

// Helper method to convert activity type to human-readable action
func (s *activityLogService) getActionFromType(activityType models.ActivityType) string {
	actionMap := map[models.ActivityType]string{
		// Module actions
		models.ActivityModuleCreated:     "Created module",
		models.ActivityModuleUpdated:     "Updated module",
		models.ActivityModuleDeleted:     "Deleted module",
		models.ActivityModulePublished:   "Published module",
		models.ActivityModuleUnpublished: "Unpublished module",

		// SubModule actions
		models.ActivitySubModuleCreated:     "Created submodule",
		models.ActivitySubModuleUpdated:     "Updated submodule",
		models.ActivitySubModuleDeleted:     "Deleted submodule",
		models.ActivitySubModulePublished:   "Published submodule",
		models.ActivitySubModuleUnpublished: "Unpublished submodule",

		// Question actions
		models.ActivityQuestionCreated:     "Created question",
		models.ActivityQuestionUpdated:     "Updated question",
		models.ActivityQuestionDeleted:     "Deleted question",
		models.ActivityQuestionActivated:   "Activated question",
		models.ActivityQuestionDeactivated: "Deactivated question",

		// User management actions
		models.ActivityUserAccessGranted: "Granted user access",
		models.ActivityUserAccessRevoked: "Revoked user access",
		models.ActivityUserSuspended:     "Suspended user",
		models.ActivityUserActivated:     "Activated user",
		models.ActivityUserRoleChanged:   "Changed user role",

		// Authentication actions
		models.ActivityUserLogin:       "User logged in",
		models.ActivityUserLogout:      "User logged out",
		models.ActivityUserLoginFailed: "User login failed",
		models.ActivityAdminLogin:      "Admin logged in",
		models.ActivityMahasiswaLogin:  "Mahasiswa logged in",
		models.ActivityExternalLogin:   "External user logged in",

		// System actions
		models.ActivitySystemMaintenance: "System maintenance",
		models.ActivityBulkOperation:     "Bulk operation",
		models.ActivityDataExport:        "Data export",
		models.ActivityDataImport:        "Data import",
	}

	if action, exists := actionMap[activityType]; exists {
		return action
	}

	return string(activityType) // Fallback to the type itself
}

// Helper function to extract client info from HTTP request
func ExtractClientInfo(r *http.Request) (string, string) {
	// Get IP address (considering proxies)
	ipAddress := r.Header.Get("X-Forwarded-For")
	if ipAddress == "" {
		ipAddress = r.Header.Get("X-Real-IP")
	}
	if ipAddress == "" {
		ipAddress = r.RemoteAddr
	}

	// Get User Agent
	userAgent := r.Header.Get("User-Agent")

	return ipAddress, userAgent
}
