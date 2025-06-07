package controllers

import (
	"net/http"

	"backend/middleware"
	"backend/models"
	"backend/services"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type UserController struct {
	userService services.UserService
}

func NewUserController(userService services.UserService) *UserController {
	return &UserController{
		userService: userService,
	}
}

// @Summary Register a new user
// @Description Register a new user account (mahasiswa or admin)
// @Tags auth
// @Accept json
// @Produce json
// @Param request body models.RegisterRequest true "Registration data"
// @Success 201 {object} models.AuthResponse
// @Failure 400 {object} map[string]string
// @Failure 409 {object} map[string]string
// @Router /auth/register [post]
func (uc *UserController) Register(c *gin.Context) {
	var req models.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request data",
			"details": err.Error(),
		})
		return
	}

	response, err := uc.userService.Register(c.Request.Context(), &req)
	if err != nil {
		statusCode := http.StatusBadRequest
		if err.Error() == "user with this email already exists" || err.Error() == "user with this NIM already exists" {
			statusCode = http.StatusConflict
		}
		c.JSON(statusCode, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, response)
}

// @Summary Login user
// @Description Login with email and password
// @Tags auth
// @Accept json
// @Produce json
// @Param request body models.LoginRequest true "Login credentials"
// @Success 200 {object} models.AuthResponse
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Router /auth/login [post]
func (uc *UserController) Login(c *gin.Context) {
	var req models.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request data",
			"details": err.Error(),
		})
		return
	}

	response, err := uc.userService.Login(c.Request.Context(), &req)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, response)
}

// @Summary Refresh access token
// @Description Get new access token using refresh token
// @Tags auth
// @Accept json
// @Produce json
// @Param request body models.RefreshTokenRequest true "Refresh token"
// @Success 200 {object} models.AuthResponse
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Router /auth/refresh [post]
func (uc *UserController) RefreshToken(c *gin.Context) {
	var req models.RefreshTokenRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request data",
			"details": err.Error(),
		})
		return
	}

	response, err := uc.userService.RefreshToken(c.Request.Context(), &req)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, response)
}

// @Summary Logout user
// @Description Logout and invalidate refresh token
// @Tags auth
// @Produce json
// @Security BearerAuth
// @Success 200 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Router /auth/logout [post]
func (uc *UserController) Logout(c *gin.Context) {
	userID, exists := middleware.GetUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
		return
	}

	if err := uc.userService.Logout(c.Request.Context(), userID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to logout"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Logged out successfully"})
}

// @Summary Get user profile
// @Description Get current user's profile information
// @Tags user
// @Produce json
// @Security BearerAuth
// @Success 200 {object} interface{}
// @Failure 401 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Router /user/profile [get]
func (uc *UserController) GetProfile(c *gin.Context) {
	userID, exists := middleware.GetUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
		return
	}

	profile, err := uc.userService.GetProfile(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"user": profile})
}

// @Summary Update user profile
// @Description Update current user's profile information
// @Tags user
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body map[string]interface{} true "Profile updates"
// @Success 200 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Router /user/profile [put]
func (uc *UserController) UpdateProfile(c *gin.Context) {
	userID, exists := middleware.GetUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
		return
	}

	var updates map[string]interface{}
	if err := c.ShouldBindJSON(&updates); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request data",
			"details": err.Error(),
		})
		return
	}

	if err := uc.userService.UpdateProfile(c.Request.Context(), userID, updates); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Profile updated successfully"})
}

// @Summary Change password
// @Description Change current user's password
// @Tags user
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body models.ChangePasswordRequest true "Password change data"
// @Success 200 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Router /user/change-password [post]
func (uc *UserController) ChangePassword(c *gin.Context) {
	userID, exists := middleware.GetUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
		return
	}

	var req models.ChangePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request data",
			"details": err.Error(),
		})
		return
	}

	if err := uc.userService.ChangePassword(c.Request.Context(), userID, &req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Password changed successfully"})
}

// @Summary Request password reset
// @Description Send password reset email
// @Tags auth
// @Accept json
// @Produce json
// @Param request body models.PasswordResetRequest true "Email for password reset"
// @Success 200 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Router /auth/forgot-password [post]
func (uc *UserController) RequestPasswordReset(c *gin.Context) {
	var req models.PasswordResetRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request data",
			"details": err.Error(),
		})
		return
	}

	if err := uc.userService.RequestPasswordReset(c.Request.Context(), &req); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to send reset email"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Password reset email sent"})
}

// @Summary Reset password
// @Description Reset password with token
// @Tags auth
// @Accept json
// @Produce json
// @Param request body models.PasswordResetConfirm true "Password reset confirmation"
// @Success 200 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Router /auth/reset-password [post]
func (uc *UserController) ResetPassword(c *gin.Context) {
	var req models.PasswordResetConfirm
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request data",
			"details": err.Error(),
		})
		return
	}

	if err := uc.userService.ResetPassword(c.Request.Context(), &req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Password reset successfully"})
}

// @Summary Get OAuth URL
// @Description Get OAuth authorization URL for specified provider
// @Tags auth
// @Produce json
// @Param provider path string true "OAuth provider" Enums(google, facebook, apple, github)
// @Param user_type query string true "User type" Enums(mahasiswa, admin)
// @Success 200 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Router /auth/oauth/{provider}/url [get]
func (uc *UserController) GetOAuthURL(c *gin.Context) {
	provider := c.Param("provider")
	userType := c.Query("user_type")

	if userType == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "user_type query parameter is required"})
		return
	}

	authURL, err := uc.userService.GetOAuthURL(provider, userType)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"auth_url":  authURL,
		"provider":  provider,
		"user_type": userType,
	})
}

// @Summary OAuth callback
// @Description Handle OAuth callback and login
// @Tags auth
// @Accept json
// @Produce json
// @Param request body models.OAuthRequest true "OAuth data"
// @Success 200 {object} models.AuthResponse
// @Failure 400 {object} map[string]string
// @Router /auth/oauth/callback [post]
func (uc *UserController) OAuthCallback(c *gin.Context) {
	var req models.OAuthRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request data",
			"details": err.Error(),
		})
		return
	}

	response, err := uc.userService.OAuthLogin(c.Request.Context(), &req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, response)
}

// @Summary Verify email
// @Description Verify email with token
// @Tags auth
// @Produce json
// @Param token query string true "Verification token"
// @Success 200 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Router /auth/verify-email [get]
func (uc *UserController) VerifyEmail(c *gin.Context) {
	token := c.Query("token")
	if token == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Token is required"})
		return
	}

	if err := uc.userService.VerifyEmail(c.Request.Context(), token); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Email verified successfully"})
}

// @Summary Resend verification email
// @Description Resend email verification
// @Tags auth
// @Accept json
// @Produce json
// @Param request body map[string]string true "Email address"
// @Success 200 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Router /auth/resend-verification [post]
func (uc *UserController) ResendVerification(c *gin.Context) {
	var req struct {
		Email string `json:"email" binding:"required,email"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request data",
			"details": err.Error(),
		})
		return
	}

	if err := uc.userService.ResendVerification(c.Request.Context(), req.Email); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Verification email sent"})
}

// Admin endpoints

// @Summary Get all users (Admin only)
// @Description Get paginated list of all users
// @Tags admin
// @Produce json
// @Security BearerAuth
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Items per page" default(10)
// @Success 200 {object} map[string]interface{}
// @Failure 401 {object} map[string]string
// @Failure 403 {object} map[string]string
// @Router /admin/users [get]
func (uc *UserController) GetAllUsers(c *gin.Context) {
	// This would be implemented with a separate admin service
	// For now, returning a placeholder
	c.JSON(http.StatusOK, gin.H{
		"message": "Admin endpoint - Get all users",
		"note":    "Implementation needed in admin service",
	})
}

// @Summary Delete user (Admin only)
// @Description Delete a user account
// @Tags admin
// @Produce json
// @Security BearerAuth
// @Param id path string true "User ID"
// @Success 200 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 403 {object} map[string]string
// @Router /admin/users/{id} [delete]
func (uc *UserController) DeleteUser(c *gin.Context) {
	userIDStr := c.Param("id")
	userID, err := primitive.ObjectIDFromHex(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	// This would be implemented with a separate admin service
	// For now, returning a placeholder
	c.JSON(http.StatusOK, gin.H{
		"message": "Admin endpoint - Delete user",
		"user_id": userID.Hex(),
		"note":    "Implementation needed in admin service",
	})
}

// Health check endpoint
func (uc *UserController) HealthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status":  "healthy",
		"service": "user-service",
	})
}
