package controllers

import (
	"net/http"
	"strconv"
	"time"

	"backend/models"
	"backend/services"

	"github.com/gin-gonic/gin"
)

type ActivityLogController struct {
	activityLogService services.ActivityLogService
}

func NewActivityLogController(activityLogService services.ActivityLogService) *ActivityLogController {
	return &ActivityLogController{
		activityLogService: activityLogService,
	}
}

// GetActivityLogs handles GET /api/admin/activity-logs
func (c *ActivityLogController) GetActivityLogs(ctx *gin.Context) {
	// Parse query parameters
	req := &models.GetActivityLogsRequest{
		Page:  1,
		Limit: 20,
	}

	if pageStr := ctx.Query("page"); pageStr != "" {
		if page, err := strconv.Atoi(pageStr); err == nil && page > 0 {
			req.Page = page
		}
	}

	if limitStr := ctx.Query("limit"); limitStr != "" {
		if limit, err := strconv.Atoi(limitStr); err == nil && limit > 0 {
			req.Limit = limit
		}
	}

	if activityType := ctx.Query("type"); activityType != "" {
		req.Type = models.ActivityType(activityType)
	}

	if entityType := ctx.Query("entity_type"); entityType != "" {
		req.EntityType = entityType
	}

	if userID := ctx.Query("user_id"); userID != "" {
		req.UserID = userID
	}

	if dateFromStr := ctx.Query("date_from"); dateFromStr != "" {
		if dateFrom, err := time.Parse(time.RFC3339, dateFromStr); err == nil {
			req.DateFrom = &dateFrom
		}
	}

	if dateToStr := ctx.Query("date_to"); dateToStr != "" {
		if dateTo, err := time.Parse(time.RFC3339, dateToStr); err == nil {
			req.DateTo = &dateTo
		}
	}

	if successStr := ctx.Query("success"); successStr != "" {
		if success, err := strconv.ParseBool(successStr); err == nil {
			req.Success = &success
		}
	}

	// Get activity logs
	response, err := c.activityLogService.GetActivityLogs(ctx.Request.Context(), req)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get activity logs: " + err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, response)
}

// GetActivityStats handles GET /api/admin/activity-logs/stats
func (c *ActivityLogController) GetActivityStats(ctx *gin.Context) {
	stats, err := c.activityLogService.GetActivityStats(ctx.Request.Context())
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get activity stats: " + err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, stats)
}

// GetRecentActivities handles GET /api/admin/activity-logs/recent
func (c *ActivityLogController) GetRecentActivities(ctx *gin.Context) {
	limit := 10
	if limitStr := ctx.Query("limit"); limitStr != "" {
		if parsedLimit, err := strconv.Atoi(limitStr); err == nil && parsedLimit > 0 {
			limit = parsedLimit
		}
	}

	activities, err := c.activityLogService.GetRecentActivities(ctx.Request.Context(), limit)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get recent activities: " + err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"activities": activities,
		"count":      len(activities),
	})
}

// CleanupOldActivities handles POST /api/admin/activity-logs/cleanup
func (c *ActivityLogController) CleanupOldActivities(ctx *gin.Context) {
	var cleanupRequest struct {
		RetentionDays int `json:"retention_days"`
	}

	if err := ctx.ShouldBindJSON(&cleanupRequest); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	if cleanupRequest.RetentionDays <= 0 {
		cleanupRequest.RetentionDays = 90 // Default to 90 days
	}

	deletedCount, err := c.activityLogService.CleanupOldActivities(ctx.Request.Context(), cleanupRequest.RetentionDays)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to cleanup old activities: " + err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"deleted_count":  deletedCount,
		"retention_days": cleanupRequest.RetentionDays,
		"message":        "Successfully cleaned up old activity logs",
	})
}

// GetActivityLogByID handles GET /api/admin/activity-logs/:id
func (c *ActivityLogController) GetActivityLogByID(ctx *gin.Context) {
	activityID := ctx.Param("id")

	if activityID == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Activity ID is required"})
		return
	}

	// For now, we'll get recent activities and find the one with matching ID
	// In a production system, you might want to add a specific GetByID method
	activities, err := c.activityLogService.GetRecentActivities(ctx.Request.Context(), 100)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get activity: " + err.Error()})
		return
	}

	for _, activity := range activities {
		if activity.ID.Hex() == activityID {
			ctx.JSON(http.StatusOK, activity)
			return
		}
	}

	ctx.JSON(http.StatusNotFound, gin.H{"error": "Activity not found"})
}

// GetActivityTypes handles GET /api/admin/activity-logs/types
func (c *ActivityLogController) GetActivityTypes(ctx *gin.Context) {
	activityTypes := []map[string]string{
		// Module activities
		{"value": string(models.ActivityModuleCreated), "label": "Module Created"},
		{"value": string(models.ActivityModuleUpdated), "label": "Module Updated"},
		{"value": string(models.ActivityModuleDeleted), "label": "Module Deleted"},
		{"value": string(models.ActivityModulePublished), "label": "Module Published"},
		{"value": string(models.ActivityModuleUnpublished), "label": "Module Unpublished"},

		// SubModule activities
		{"value": string(models.ActivitySubModuleCreated), "label": "SubModule Created"},
		{"value": string(models.ActivitySubModuleUpdated), "label": "SubModule Updated"},
		{"value": string(models.ActivitySubModuleDeleted), "label": "SubModule Deleted"},
		{"value": string(models.ActivitySubModulePublished), "label": "SubModule Published"},
		{"value": string(models.ActivitySubModuleUnpublished), "label": "SubModule Unpublished"},

		// Question activities
		{"value": string(models.ActivityQuestionCreated), "label": "Question Created"},
		{"value": string(models.ActivityQuestionUpdated), "label": "Question Updated"},
		{"value": string(models.ActivityQuestionDeleted), "label": "Question Deleted"},
		{"value": string(models.ActivityQuestionActivated), "label": "Question Activated"},
		{"value": string(models.ActivityQuestionDeactivated), "label": "Question Deactivated"},

		// User management activities
		{"value": string(models.ActivityUserAccessGranted), "label": "User Access Granted"},
		{"value": string(models.ActivityUserAccessRevoked), "label": "User Access Revoked"},
		{"value": string(models.ActivityUserSuspended), "label": "User Suspended"},
		{"value": string(models.ActivityUserActivated), "label": "User Activated"},
		{"value": string(models.ActivityUserRoleChanged), "label": "User Role Changed"},

		// Authentication activities
		{"value": string(models.ActivityUserLogin), "label": "User Login"},
		{"value": string(models.ActivityUserLogout), "label": "User Logout"},
		{"value": string(models.ActivityUserLoginFailed), "label": "Login Failed"},
		{"value": string(models.ActivityAdminLogin), "label": "Admin Login"},
		{"value": string(models.ActivityMahasiswaLogin), "label": "Mahasiswa Login"},
		{"value": string(models.ActivityExternalLogin), "label": "External Login"},

		// System activities
		{"value": string(models.ActivitySystemMaintenance), "label": "System Maintenance"},
		{"value": string(models.ActivityBulkOperation), "label": "Bulk Operation"},
		{"value": string(models.ActivityDataExport), "label": "Data Export"},
		{"value": string(models.ActivityDataImport), "label": "Data Import"},
	}

	ctx.JSON(http.StatusOK, gin.H{
		"activity_types": activityTypes,
	})
}
