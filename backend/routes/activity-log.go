package routes

import (
	"backend/controllers"
	"backend/middleware"

	"github.com/gin-gonic/gin"
)

func SetupActivityLogRoutes(api *gin.RouterGroup, activityLogController *controllers.ActivityLogController, authMiddleware *middleware.AuthMiddleware, admin *gin.RouterGroup) {
	// Admin-only activity log routes
	admin.GET("/activity-logs", activityLogController.GetActivityLogs)
	admin.GET("/activity-logs/stats", activityLogController.GetActivityStats)
	admin.GET("/activity-logs/recent", activityLogController.GetRecentActivities)
	admin.GET("/activity-logs/types", activityLogController.GetActivityTypes)
	admin.GET("/activity-logs/:id", activityLogController.GetActivityLogByID)
	admin.POST("/activity-logs/cleanup", activityLogController.CleanupOldActivities)
}
