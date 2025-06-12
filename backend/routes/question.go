package routes

import (
	"backend/controllers"
	"backend/middleware"

	"github.com/gin-gonic/gin"
)

func SetupQuestionRoutes(router gin.IRouter, questionController *controllers.QuestionController, authMiddleware *middleware.AuthMiddleware, admin gin.IRouter) {
	// Public question routes (for quiz taking)
	questions := router.Group("/questions")
	{
		// Get random questions for quiz generation
		questions.GET("/random", questionController.GetRandomQuestions)
	}

	// Admin question routes (use the shared admin group)
	{
		// Basic CRUD operations
		admin.POST("/questions", questionController.CreateQuestion)
		admin.GET("/questions", questionController.ListQuestions)
		admin.GET("/questions/:id", questionController.GetQuestion)
		admin.PUT("/questions/:id", questionController.UpdateQuestion)
		admin.DELETE("/questions/:id", questionController.DeleteQuestion)

		// Question management features
		admin.PATCH("/questions/:id/status", questionController.ToggleQuestionStatus)
		admin.GET("/questions/stats", questionController.GetQuestionStats)
		admin.POST("/questions/validate", questionController.ValidateQuestion)
	}
}
