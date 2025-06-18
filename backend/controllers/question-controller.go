package controllers

import (
	"net/http"
	"strconv"

	"backend/middleware"
	"backend/models"
	"backend/services"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type QuestionController struct {
	questionService    services.QuestionService
	activityLogService services.ActivityLogService
}

func NewQuestionController(questionService services.QuestionService, activityLogService services.ActivityLogService) *QuestionController {
	return &QuestionController{
		questionService:    questionService,
		activityLogService: activityLogService,
	}
}

// Helper method to get user information from context
func (qc *QuestionController) getUserInfo(c *gin.Context) (string, string) {
	userName := "Unknown User"
	userType := "unknown"

	// Try to get user name from context (if available)
	if name, exists := c.Get("user_name"); exists {
		if nameStr, ok := name.(string); ok {
			userName = nameStr
		}
	}

	// Try to get user type from context (if available)
	if uType, exists := c.Get("user_type"); exists {
		if typeStr, ok := uType.(string); ok {
			userType = typeStr
		}
	}

	return userName, userType
}

// @Summary Create a new question
// @Description Create a new question (Admin only)
// @Tags questions
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body models.CreateQuestionRequest true "Question data"
// @Success 201 {object} models.Question
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 403 {object} map[string]string
// @Router /admin/questions [post]
func (qc *QuestionController) CreateQuestion(c *gin.Context) {
	userID, exists := middleware.GetUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
		return
	}

	var req models.CreateQuestionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request data",
			"details": err.Error(),
		})
		return
	}

	question, err := qc.questionService.CreateQuestion(c.Request.Context(), &req, userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Log question creation activity
	go func() {
		userName, userType := qc.getUserInfo(c)
		qc.activityLogService.LogQuestionActivity(
			c.Request.Context(),
			models.ActivityQuestionCreated,
			question.ID.Hex(),
			question.Title,
			userID,
			userName,
			userType,
			map[string]interface{}{
				"type":       question.Type,
				"difficulty": question.Difficulty,
				"points":     question.Points,
			},
		)
	}()

	c.JSON(http.StatusCreated, question)
}

// @Summary Get question by ID
// @Description Get a specific question by ID (Admin only)
// @Tags questions
// @Produce json
// @Security BearerAuth
// @Param id path string true "Question ID"
// @Success 200 {object} models.Question
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Router /admin/questions/{id} [get]
func (qc *QuestionController) GetQuestion(c *gin.Context) {
	idParam := c.Param("id")
	questionID, err := primitive.ObjectIDFromHex(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid question ID format"})
		return
	}

	question, err := qc.questionService.GetQuestion(c.Request.Context(), questionID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, question)
}

// @Summary Update question
// @Description Update an existing question (Admin only)
// @Tags questions
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Question ID"
// @Param request body models.UpdateQuestionRequest true "Question updates"
// @Success 200 {object} models.Question
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Router /admin/questions/{id} [put]
func (qc *QuestionController) UpdateQuestion(c *gin.Context) {
	idParam := c.Param("id")
	questionID, err := primitive.ObjectIDFromHex(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid question ID format"})
		return
	}

	var req models.UpdateQuestionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request data",
			"details": err.Error(),
		})
		return
	}

	question, err := qc.questionService.UpdateQuestion(c.Request.Context(), questionID, &req)
	if err != nil {
		if err.Error() == "question not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		} else {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		}
		return
	}

	// Log question update activity
	go func() {
		userID, _ := middleware.GetUserID(c)
		userName, userType := qc.getUserInfo(c)
		changes := make(map[string]interface{})
		if req.Title != nil {
			changes["title"] = *req.Title
		}
		if req.Difficulty != nil {
			changes["difficulty"] = *req.Difficulty
		}
		if req.Points != nil {
			changes["points"] = *req.Points
		}
		if req.IsActive != nil {
			changes["is_active"] = *req.IsActive
		}

		qc.activityLogService.LogQuestionActivity(
			c.Request.Context(),
			models.ActivityQuestionUpdated,
			question.ID.Hex(),
			question.Title,
			userID,
			userName,
			userType,
			changes,
		)
	}()

	c.JSON(http.StatusOK, question)
}

// @Summary Delete question
// @Description Delete a question (Admin only)
// @Tags questions
// @Produce json
// @Security BearerAuth
// @Param id path string true "Question ID"
// @Success 200 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Router /admin/questions/{id} [delete]
func (qc *QuestionController) DeleteQuestion(c *gin.Context) {
	idParam := c.Param("id")
	questionID, err := primitive.ObjectIDFromHex(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid question ID format"})
		return
	}

	// Get question info before deletion for logging
	question, err := qc.questionService.GetQuestion(c.Request.Context(), questionID)
	if err != nil {
		if err.Error() == "question not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get question"})
		}
		return
	}

	err = qc.questionService.DeleteQuestion(c.Request.Context(), questionID)
	if err != nil {
		if err.Error() == "question not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete question"})
		}
		return
	}

	// Log question deletion activity
	go func() {
		userID, _ := middleware.GetUserID(c)
		userName, userType := qc.getUserInfo(c)
		qc.activityLogService.LogQuestionActivity(
			c.Request.Context(),
			models.ActivityQuestionDeleted,
			question.ID.Hex(),
			question.Title,
			userID,
			userName,
			userType,
			map[string]interface{}{
				"type":       question.Type,
				"difficulty": question.Difficulty,
				"points":     question.Points,
			},
		)
	}()

	c.JSON(http.StatusOK, gin.H{"message": "Question deleted successfully"})
}

// @Summary List questions
// @Description Get a paginated list of questions with filtering (Admin only)
// @Tags questions
// @Produce json
// @Security BearerAuth
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Items per page" default(20)
// @Param search query string false "Search in question titles"
// @Param type query string false "Filter by question type" Enums(single_choice, multiple_choice, essay)
// @Param difficulty query string false "Filter by difficulty" Enums(easy, medium, hard)
// @Param is_active query bool false "Filter by active status"
// @Success 200 {object} models.ListQuestionsResponse
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Router /admin/questions [get]
func (qc *QuestionController) ListQuestions(c *gin.Context) {
	// Parse query parameters with defaults
	page := 1
	limit := 20

	if pageParam := c.Query("page"); pageParam != "" {
		if p, err := strconv.Atoi(pageParam); err == nil && p > 0 {
			page = p
		}
	}

	if limitParam := c.Query("limit"); limitParam != "" {
		if l, err := strconv.Atoi(limitParam); err == nil && l > 0 && l <= 100 {
			limit = l
		}
	}

	// Build request
	req := &models.ListQuestionsRequest{
		Page:   page,
		Limit:  limit,
		Search: c.Query("search"),
	}

	// Handle type filter
	if typeParam := c.Query("type"); typeParam != "" {
		req.Type = models.QuestionType(typeParam)
	}

	// Handle difficulty filter
	if difficultyParam := c.Query("difficulty"); difficultyParam != "" {
		req.Difficulty = models.DifficultyLevel(difficultyParam)
	}

	// Handle is_active filter
	if isActiveParam := c.Query("is_active"); isActiveParam != "" {
		if isActive, err := strconv.ParseBool(isActiveParam); err == nil {
			req.IsActive = &isActive
		}
	}

	response, err := qc.questionService.ListQuestions(c.Request.Context(), req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to list questions"})
		return
	}

	c.JSON(http.StatusOK, response)
}

// @Summary Get question statistics
// @Description Get statistics about questions (Admin only)
// @Tags questions
// @Produce json
// @Security BearerAuth
// @Success 200 {object} models.QuestionStatsResponse
// @Failure 401 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /admin/questions/stats [get]
func (qc *QuestionController) GetQuestionStats(c *gin.Context) {
	stats, err := qc.questionService.GetQuestionStats(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get question statistics"})
		return
	}

	c.JSON(http.StatusOK, stats)
}

// @Summary Toggle question status
// @Description Enable or disable a question (Admin only)
// @Tags questions
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Question ID"
// @Param request body map[string]bool true "Status update" example({"is_active": true})
// @Success 200 {object} models.Question
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Router /admin/questions/{id}/status [patch]
func (qc *QuestionController) ToggleQuestionStatus(c *gin.Context) {
	idParam := c.Param("id")
	questionID, err := primitive.ObjectIDFromHex(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid question ID format"})
		return
	}

	var req struct {
		IsActive bool `json:"is_active" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request data",
			"details": err.Error(),
		})
		return
	}

	question, err := qc.questionService.ToggleQuestionStatus(c.Request.Context(), questionID, req.IsActive)
	if err != nil {
		if err.Error() == "question not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update question status"})
		}
		return
	}

	// Log question status toggle activity
	go func() {
		userID, _ := middleware.GetUserID(c)
		userName, userType := qc.getUserInfo(c)
		activityType := models.ActivityQuestionActivated
		if !req.IsActive {
			activityType = models.ActivityQuestionDeactivated
		}

		qc.activityLogService.LogQuestionActivity(
			c.Request.Context(),
			activityType,
			question.ID.Hex(),
			question.Title,
			userID,
			userName,
			userType,
			map[string]interface{}{
				"is_active": req.IsActive,
			},
		)
	}()

	c.JSON(http.StatusOK, question)
}

// @Summary Get random questions
// @Description Get random questions for quiz generation (Public for quiz taking)
// @Tags questions
// @Produce json
// @Param type query string true "Question type" Enums(single_choice, multiple_choice, essay)
// @Param limit query int false "Number of questions" default(10)
// @Success 200 {array} models.QuestionForQuiz
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /questions/random [get]
func (qc *QuestionController) GetRandomQuestions(c *gin.Context) {
	typeParam := c.Query("type")
	if typeParam == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Question type is required"})
		return
	}

	limit := 10
	if limitParam := c.Query("limit"); limitParam != "" {
		if l, err := strconv.Atoi(limitParam); err == nil && l > 0 && l <= 50 {
			limit = l
		}
	}

	questionType := models.QuestionType(typeParam)

	// Validate question type
	switch questionType {
	case models.SingleChoice, models.MultipleChoice, models.Essay:
		// Valid types
	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid question type"})
		return
	}

	questions, err := qc.questionService.GetRandomQuestions(c.Request.Context(), questionType, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get random questions"})
		return
	}

	// Convert to QuestionForQuiz format (without correct answers for security)
	quizQuestions := make([]models.QuestionForQuiz, len(questions))
	for i, q := range questions {
		quizQuestions[i] = models.QuestionForQuiz{
			ID:      q.ID,
			Title:   q.Title,
			Type:    q.Type,
			Points:  q.Points,
			Options: q.Options,
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"questions": quizQuestions,
		"total":     len(quizQuestions),
		"type":      questionType,
	})
}

// @Summary Validate question data
// @Description Validate question data without creating (Admin only)
// @Tags questions
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body models.CreateQuestionRequest true "Question data to validate"
// @Success 200 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Router /admin/questions/validate [post]
func (qc *QuestionController) ValidateQuestion(c *gin.Context) {
	var req models.CreateQuestionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request data",
			"details": err.Error(),
		})
		return
	}

	if err := qc.questionService.ValidateQuestionData(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"valid": false,
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"valid":   true,
		"message": "Question data is valid",
	})
}
