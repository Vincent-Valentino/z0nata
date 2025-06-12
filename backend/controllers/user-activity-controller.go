package controllers

import (
	"math"
	"net/http"

	"backend/models"
	"backend/services"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// Helper function to round float64 to specified decimal places
func round(val float64, places int) float64 {
	factor := math.Pow(10, float64(places))
	return math.Round(val*factor) / factor
}

type UserActivityController struct {
	userActivityService services.UserActivityService
}

func NewUserActivityController(userActivityService services.UserActivityService) *UserActivityController {
	return &UserActivityController{
		userActivityService: userActivityService,
	}
}

// @Summary Create quiz result
// @Description Submit a completed quiz result
// @Tags User Activity
// @Accept json
// @Produce json
// @Param quiz_result body models.QuizResultRequest true "Quiz result data"
// @Success 201 {object} map[string]interface{}
// @Failure 400 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /api/quiz-results [post]
func (c *UserActivityController) CreateQuizResult(ctx *gin.Context) {
	// Get user from context
	userID, exists := ctx.Get("userID")
	if !exists {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	userObjID, ok := userID.(primitive.ObjectID)
	if !ok {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID format"})
		return
	}

	var request models.QuizResultRequest
	if err := ctx.ShouldBindJSON(&request); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	result, achievements, err := c.userActivityService.CreateQuizResult(ctx, userObjID, request)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	response := gin.H{
		"result":       result,
		"achievements": achievements,
		"message":      "Quiz result created successfully",
	}

	if len(achievements) > 0 {
		response["new_achievements"] = true
	}

	ctx.JSON(http.StatusCreated, response)
}

// @Summary Get user quiz results
// @Description Get quiz results for the authenticated user
// @Tags User Activity
// @Accept json
// @Produce json
// @Param quiz_type query string false "Filter by quiz type (mock_test, time_quiz)"
// @Param date_from query string false "Filter from date (YYYY-MM-DD)"
// @Param date_to query string false "Filter to date (YYYY-MM-DD)"
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Items per page" default(10)
// @Success 200 {object} models.UserResultsResponse
// @Failure 401 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /api/quiz-results [get]
func (c *UserActivityController) GetUserResults(ctx *gin.Context) {
	// Get user from context
	userID, exists := ctx.Get("userID")
	if !exists {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	userObjID, ok := userID.(primitive.ObjectID)
	if !ok {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID format"})
		return
	}

	// Parse query parameters
	var filter models.QuizResultsFilter
	if err := ctx.ShouldBindQuery(&filter); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	response, err := c.userActivityService.GetUserResults(ctx, userObjID, filter)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, response)
}

// @Summary Get quiz result by ID
// @Description Get a specific quiz result by ID
// @Tags User Activity
// @Accept json
// @Produce json
// @Param id path string true "Quiz result ID"
// @Success 200 {object} models.QuizResult
// @Failure 400 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /api/quiz-results/{id} [get]
func (c *UserActivityController) GetQuizResultByID(ctx *gin.Context) {
	idParam := ctx.Param("id")
	id, err := primitive.ObjectIDFromHex(idParam)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid quiz result ID"})
		return
	}

	result, err := c.userActivityService.GetQuizResultByID(ctx, id)
	if err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, result)
}

// @Summary Get user statistics
// @Description Get comprehensive statistics for the authenticated user
// @Tags User Activity
// @Accept json
// @Produce json
// @Success 200 {object} models.UserStats
// @Failure 401 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /api/user/stats [get]
func (c *UserActivityController) GetUserStats(ctx *gin.Context) {
	// Get user from context
	userID, exists := ctx.Get("userID")
	if !exists {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	userObjID, ok := userID.(primitive.ObjectID)
	if !ok {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID format"})
		return
	}

	stats, err := c.userActivityService.GetUserStats(ctx, userObjID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, stats)
}

// @Summary Get user achievements
// @Description Get all achievements for the authenticated user
// @Tags User Activity
// @Accept json
// @Produce json
// @Success 200 {object} []models.Achievement
// @Failure 401 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /api/user/achievements [get]
func (c *UserActivityController) GetUserAchievements(ctx *gin.Context) {
	// Get user from context
	userID, exists := ctx.Get("userID")
	if !exists {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	userObjID, ok := userID.(primitive.ObjectID)
	if !ok {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID format"})
		return
	}

	achievements, err := c.userActivityService.GetUserAchievements(ctx, userObjID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"achievements": achievements})
}

// @Summary Get quiz performance summary
// @Description Get a summary of quiz performance by type
// @Tags User Activity
// @Accept json
// @Produce json
// @Success 200 {object} map[string]interface{}
// @Failure 401 {object} map[string]interface{}
// @Failure 500 {object} map[string]interface{}
// @Router /api/user/performance-summary [get]
func (c *UserActivityController) GetPerformanceSummary(ctx *gin.Context) {
	// Get user from context
	userID, exists := ctx.Get("userID")
	if !exists {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	userObjID, ok := userID.(primitive.ObjectID)
	if !ok {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID format"})
		return
	}

	stats, err := c.userActivityService.GetUserStats(ctx, userObjID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Create performance summary by quiz type
	summary := gin.H{
		"mock_test": gin.H{
			"count":   stats.MockTestCount,
			"average": round(stats.MockTestAverage, 1),
		},
		"time_quiz": gin.H{
			"count":   stats.TimeQuizCount,
			"average": round(stats.TimeQuizAverage, 1),
			"timeout_rate": func() float64 {
				if stats.TimeQuizCount > 0 {
					return round(float64(stats.TimeoutCount)/float64(stats.TimeQuizCount)*100, 1)
				}
				return 0
			}(),
		},
		"question_types": gin.H{
			"single_choice":   round(stats.SingleChoiceAccuracy, 1),
			"multiple_choice": round(stats.MultipleChoiceAccuracy, 1),
			"essay":           round(stats.EssayAccuracy, 1),
		},
		"overall": gin.H{
			"total_quizzes":             stats.TotalQuizzesCompleted,
			"average_score":             round(stats.AverageScore, 1),
			"total_time_spent":          stats.TotalTimeSpent,
			"average_time_per_question": round(stats.AverageTimePerQuestion, 1),
			"current_streak":            stats.CurrentStreak,
			"longest_streak":            stats.LongestStreak,
		},
		"goals": gin.H{
			"weekly_goal":          stats.WeeklyGoal,
			"weekly_progress":      stats.WeeklyProgress,
			"target_average_score": stats.TargetAverageScore,
		},
	}

	ctx.JSON(http.StatusOK, summary)
}
