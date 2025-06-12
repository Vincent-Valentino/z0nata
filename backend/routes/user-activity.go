package routes

import (
	"backend/controllers"
	"backend/middleware"

	"github.com/gin-gonic/gin"
)

func SetupUserActivityRoutes(router gin.IRouter, userActivityController *controllers.UserActivityController, authMiddleware *middleware.AuthMiddleware) {
	// Quiz Results - require authentication
	quizResults := router.Group("/quiz-results")
	quizResults.Use(authMiddleware.RequireAuth())
	{
		quizResults.POST("", userActivityController.CreateQuizResult)
		quizResults.GET("", userActivityController.GetUserResults)
		quizResults.GET("/:id", userActivityController.GetQuizResultByID)
	}

	// User Statistics and Achievements - require authentication
	user := router.Group("/user")
	user.Use(authMiddleware.RequireAuth())
	{
		user.GET("/stats", userActivityController.GetUserStats)
		user.GET("/achievements", userActivityController.GetUserAchievements)
		user.GET("/performance-summary", userActivityController.GetPerformanceSummary)
	}
}
