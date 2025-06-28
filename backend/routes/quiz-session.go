package routes

import (
	"backend/controllers"
	"backend/middleware"

	"github.com/gin-gonic/gin"
)

func SetupQuizSessionRoutes(router *gin.Engine, ctrl controllers.QuizSessionController, authMiddleware *middleware.AuthMiddleware) {
	api := router.Group("/api/v1")

	// All quiz session routes require authentication
	quiz := api.Group("/quiz")
	quiz.Use(authMiddleware.RequireAuth())
	{
		// Session Management
		quiz.POST("/start", ctrl.StartQuiz)                            // Start new quiz session
		quiz.GET("/session/:token", ctrl.GetSession)                   // Get session details
		quiz.POST("/session/:token/answer", ctrl.SaveAnswer)           // Save question answer
		quiz.POST("/session/:token/navigate", ctrl.NavigateToQuestion) // Navigate to question
		quiz.POST("/session/:token/skip", ctrl.SkipQuestion)           // Skip question
		quiz.POST("/session/:token/submit", ctrl.SubmitQuiz)           // Submit quiz for grading

		// Session Recovery
		quiz.GET("/resume/:quiz_type", ctrl.ResumeSession) // Check for resumable session

		// Results & History
		quiz.GET("/results", ctrl.GetUserResults) // Get user's quiz history
	}
}
