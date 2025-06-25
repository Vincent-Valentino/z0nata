package controllers

import (
	"net/http"
	"strconv"

	"backend/models"
	"backend/services"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type QuizSessionController interface {
	StartQuiz(c *gin.Context)
	GetSession(c *gin.Context)
	SaveAnswer(c *gin.Context)
	NavigateToQuestion(c *gin.Context)
	SubmitQuiz(c *gin.Context)
	GetUserResults(c *gin.Context)
	ResumeSession(c *gin.Context)
}

type quizSessionController struct {
	quizSessionService services.QuizSessionService
}

func NewQuizSessionController(quizSessionService services.QuizSessionService) QuizSessionController {
	return &quizSessionController{
		quizSessionService: quizSessionService,
	}
}

// StartQuiz starts a new quiz session or resumes existing one
// POST /api/v1/quiz/start
func (ctrl *quizSessionController) StartQuiz(c *gin.Context) {
	var req models.StartQuizRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request format",
			"details": err.Error(),
		})
		return
	}

	// Get user ID from JWT token
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "User not authenticated",
		})
		return
	}

	userObjectID, ok := userID.(primitive.ObjectID)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Invalid user ID format",
		})
		return
	}

	response, err := ctrl.quizSessionService.StartQuiz(c.Request.Context(), userObjectID, &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to start quiz",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, response)
}

// GetSession retrieves current session state
// GET /api/v1/quiz/session/:token
func (ctrl *quizSessionController) GetSession(c *gin.Context) {
	sessionToken := c.Param("token")
	if sessionToken == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Session token is required",
		})
		return
	}

	response, err := ctrl.quizSessionService.GetSession(c.Request.Context(), sessionToken)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error":   "Session not found",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, response)
}

// SaveAnswer saves user's answer for a question
// POST /api/v1/quiz/session/:token/answer
func (ctrl *quizSessionController) SaveAnswer(c *gin.Context) {
	sessionToken := c.Param("token")
	if sessionToken == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Session token is required",
		})
		return
	}

	var req models.SaveAnswerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request format",
			"details": err.Error(),
		})
		return
	}

	response, err := ctrl.quizSessionService.SaveAnswer(c.Request.Context(), sessionToken, &req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Failed to save answer",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, response)
}

// NavigateToQuestion updates current question index
// POST /api/v1/quiz/session/:token/navigate
func (ctrl *quizSessionController) NavigateToQuestion(c *gin.Context) {
	sessionToken := c.Param("token")
	if sessionToken == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Session token is required",
		})
		return
	}

	var req models.NavigateQuestionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request format",
			"details": err.Error(),
		})
		return
	}

	err := ctrl.quizSessionService.NavigateToQuestion(c.Request.Context(), sessionToken, &req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Failed to navigate to question",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Navigation successful",
	})
}

// SubmitQuiz submits the quiz and calculates final results
// POST /api/v1/quiz/session/:token/submit
func (ctrl *quizSessionController) SubmitQuiz(c *gin.Context) {
	sessionToken := c.Param("token")
	if sessionToken == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Session token is required",
		})
		return
	}

	response, err := ctrl.quizSessionService.SubmitQuiz(c.Request.Context(), sessionToken)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Failed to submit quiz",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, response)
}

// GetUserResults retrieves user's quiz results history
// GET /api/v1/quiz/results?quiz_type=mock_test&limit=10
func (ctrl *quizSessionController) GetUserResults(c *gin.Context) {
	// Get user ID from JWT token
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "User not authenticated",
		})
		return
	}

	userObjectID, ok := userID.(primitive.ObjectID)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Invalid user ID format",
		})
		return
	}

	// Parse query parameters
	quizTypeStr := c.DefaultQuery("quiz_type", "")
	limitStr := c.DefaultQuery("limit", "10")

	var quizType models.QuizType
	if quizTypeStr != "" {
		quizType = models.QuizType(quizTypeStr)
	}

	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit <= 0 {
		limit = 10
	}

	results, err := ctrl.quizSessionService.GetUserResults(c.Request.Context(), userObjectID, quizType, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to get user results",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"results": results,
		"count":   len(results),
	})
}

// ResumeSession checks if user has an active session to resume
// GET /api/v1/quiz/resume/:quiz_type
func (ctrl *quizSessionController) ResumeSession(c *gin.Context) {
	quizTypeStr := c.Param("quiz_type")
	if quizTypeStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Quiz type is required",
		})
		return
	}

	quizType := models.QuizType(quizTypeStr)
	if quizType != models.MockTest && quizType != models.TimeQuiz {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid quiz type",
		})
		return
	}

	// Get user ID from JWT token
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "User not authenticated",
		})
		return
	}

	userObjectID, ok := userID.(primitive.ObjectID)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Invalid user ID format",
		})
		return
	}

	session, err := ctrl.quizSessionService.ResumeSession(c.Request.Context(), userObjectID, quizType)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to check for resume session",
			"details": err.Error(),
		})
		return
	}

	if session == nil {
		c.JSON(http.StatusOK, gin.H{
			"has_active_session": false,
			"message":            "No active session found",
		})
		return
	}

	// Calculate remaining time
	response, err := ctrl.quizSessionService.GetSession(c.Request.Context(), session.SessionToken)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to get session details",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"has_active_session": true,
		"session":            response,
		"resume_token":       session.SessionToken,
		"message":            "Active session found",
	})
}
