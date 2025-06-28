package controllers

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"os"
	"strings"

	"backend/middleware"
	"backend/models"
	"backend/repository"
	"backend/services"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type UserController struct {
	userService        services.UserService
	userRepository     repository.UserRepository
	activityLogService services.ActivityLogService
}

func NewUserController(userService services.UserService, userRepository repository.UserRepository, activityLogService services.ActivityLogService) *UserController {
	return &UserController{
		userService:        userService,
		userRepository:     userRepository,
		activityLogService: activityLogService,
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

	// Extract client info for activity logging
	ipAddress, userAgent := services.ExtractClientInfo(c.Request)

	response, err := uc.userService.Login(c.Request.Context(), &req)
	if err != nil {
		// Log failed login attempt
		go func() {
			ctx := context.Background()
			uc.activityLogService.LogAuthActivity(
				ctx,
				models.ActivityUserLoginFailed,
				"", // No user ID for failed login
				req.Email,
				"unknown", // User type unknown for failed login
				false,
				ipAddress,
				userAgent,
				err.Error(),
			)
		}()

		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	// Type assert the user from interface{} to access fields
	var userID, userName, userType string
	var activityType models.ActivityType = models.ActivityUserLogin

	if user, ok := response.User.(models.User); ok {
		userID = user.ID.Hex()
		userName = user.FullName
		userType = string(user.UserType)

		// Determine activity type based on user type
		switch user.UserType {
		case "admin":
			activityType = models.ActivityAdminLogin
		case "mahasiswa":
			activityType = models.ActivityMahasiswaLogin
		default:
			activityType = models.ActivityExternalLogin
		}
	} else if userMap, ok := response.User.(map[string]interface{}); ok {
		// Handle case where user is returned as a map
		if id, exists := userMap["id"]; exists {
			if oid, ok := id.(primitive.ObjectID); ok {
				userID = oid.Hex()
			}
		}
		if name, exists := userMap["full_name"]; exists {
			if nameStr, ok := name.(string); ok {
				userName = nameStr
			}
		}
		if uType, exists := userMap["user_type"]; exists {
			if typeStr, ok := uType.(string); ok {
				userType = typeStr
				switch typeStr {
				case "admin":
					activityType = models.ActivityAdminLogin
				case "mahasiswa":
					activityType = models.ActivityMahasiswaLogin
				default:
					activityType = models.ActivityExternalLogin
				}
			}
		}
	}

	// Log successful login
	go func() {
		ctx := context.Background()
		uc.activityLogService.LogAuthActivity(
			ctx,
			activityType,
			userID,
			userName,
			userType,
			true,
			ipAddress,
			userAgent,
			"",
		)
	}()

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
	// Get user ID from context (set by auth middleware)
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error":   "Unauthorized",
			"message": "User not authenticated",
		})
		return
	}

	// Get the token from Authorization header
	authHeader := c.GetHeader("Authorization")
	if authHeader == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Bad Request",
			"message": "Authorization header required",
		})
		return
	}

	// Extract token from "Bearer <token>"
	tokenParts := strings.Split(authHeader, " ")
	if len(tokenParts) != 2 || tokenParts[0] != "Bearer" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Bad Request",
			"message": "Invalid authorization header format",
		})
		return
	}

	token := tokenParts[1]

	// Log the logout attempt
	log.Printf("User logout attempt - UserID: %v, Token: %s...", userID, token[:min(len(token), 10)])

	// Update user's last logout time (optional)
	userIDStr := fmt.Sprintf("%v", userID)
	err := uc.userService.UpdateLastLogout(userIDStr)
	if err != nil {
		log.Printf("Failed to update last logout for user %s: %v", userIDStr, err)
		// Don't fail the logout for this error
	}

	// Get user details for activity logging
	userOID, err := primitive.ObjectIDFromHex(userIDStr)
	if err == nil {
		profile, err := uc.userService.GetProfile(c.Request.Context(), userOID)
		if err == nil {
			// Extract client info for activity logging
			ipAddress, userAgent := services.ExtractClientInfo(c.Request)

			// Type assert the profile to access fields
			var userName, userType string
			if user, ok := profile.(models.User); ok {
				userName = user.FullName
				userType = string(user.UserType)
			} else if userMap, ok := profile.(map[string]interface{}); ok {
				if name, exists := userMap["full_name"]; exists {
					if nameStr, ok := name.(string); ok {
						userName = nameStr
					}
				}
				if uType, exists := userMap["user_type"]; exists {
					if typeStr, ok := uType.(string); ok {
						userType = typeStr
					}
				}
			}

			// Log logout activity
			go uc.activityLogService.LogAuthActivity(
				c.Request.Context(),
				models.ActivityUserLogout,
				userIDStr,
				userName,
				userType,
				true,
				ipAddress,
				userAgent,
				"",
			)
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Logout successful",
		"status":  "success",
	})
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

	response, err := uc.userService.RequestPasswordReset(c.Request.Context(), &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process password reset request"})
		return
	}

	c.JSON(http.StatusOK, response)
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
// @Param provider path string true "OAuth provider" Enums(google, facebook, x, github)
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
// @Param search query string false "Search term"
// @Param user_type query string false "User type filter"
// @Param status query string false "Status filter"
// @Success 200 {object} models.ListUsersResponse
// @Failure 401 {object} map[string]string
// @Failure 403 {object} map[string]string
// @Router /admin/users [get]
func (uc *UserController) GetAllUsers(c *gin.Context) {
	// Check if user is admin
	userType, exists := middleware.GetUserType(c)
	if !exists || userType != "admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Admin access required"})
		return
	}

	var req models.ListUsersRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid query parameters",
			"details": err.Error(),
		})
		return
	}

	// Set defaults
	if req.Page == 0 {
		req.Page = 1
	}
	if req.Limit == 0 {
		req.Limit = 20
	}

	response, err := uc.userRepository.ListUsers(c.Request.Context(), &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get users"})
		return
	}

	c.JSON(http.StatusOK, response)
}

// @Summary Get user statistics (Admin only)
// @Description Get user statistics and counts
// @Tags admin
// @Produce json
// @Security BearerAuth
// @Success 200 {object} models.UserStatsResponse
// @Failure 401 {object} map[string]string
// @Failure 403 {object} map[string]string
// @Router /admin/users/stats [get]
func (uc *UserController) GetUserStats(c *gin.Context) {
	// Check if user is admin
	userType, exists := middleware.GetUserType(c)
	if !exists || userType != "admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Admin access required"})
		return
	}

	stats, err := uc.userRepository.GetUserStats(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get user statistics"})
		return
	}

	c.JSON(http.StatusOK, stats)
}

// @Summary Update user status (Admin only)
// @Description Update a user's status (active, pending, suspended, rejected)
// @Tags admin
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "User ID"
// @Param request body models.UpdateUserStatusRequest true "Status update data"
// @Success 200 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 403 {object} map[string]string
// @Router /admin/users/{id}/status [put]
func (uc *UserController) UpdateUserStatus(c *gin.Context) {
	// Check if user is admin
	userType, exists := middleware.GetUserType(c)
	if !exists || userType != "admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Admin access required"})
		return
	}

	userIDStr := c.Param("id")
	userID, err := primitive.ObjectIDFromHex(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	var req models.UpdateUserStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request data",
			"details": err.Error(),
		})
		return
	}

	// Get user info before updating for logging
	user, err := uc.userRepository.GetByID(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	if err := uc.userRepository.UpdateUserStatus(c.Request.Context(), userID, req.Status); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user status"})
		return
	}

	// Log user status update activity
	go func() {
		ctx := context.Background()
		adminUserID, _ := middleware.GetUserID(c)
		adminUserName, adminUserType := uc.getUserInfo(c)

		activityType := models.ActivityUserActivated
		if req.Status == models.UserStatusSuspended {
			activityType = models.ActivityUserSuspended
		}

		fmt.Printf("🔄 Attempting to log user status update activity...\n")
		err := uc.activityLogService.LogUserActivity(
			ctx,
			activityType,
			user.ID.Hex(),
			user.FullName,
			adminUserID,
			adminUserName,
			adminUserType,
			map[string]interface{}{
				"previous_status": string(user.Status),
				"new_status":      string(req.Status),
				"user_email":      user.Email,
				"user_type":       string(user.UserType),
			},
		)

		if err != nil {
			fmt.Printf("❌ ERROR: Failed to log user status update activity: %v\n", err)
		} else {
			fmt.Printf("✅ SUCCESS: User status update activity logged successfully\n")
		}
	}()

	c.JSON(http.StatusOK, gin.H{
		"message": "User status updated successfully",
		"user_id": userID.Hex(),
		"status":  req.Status,
	})
}

// @Summary Get access requests (Admin only)
// @Description Get paginated list of access requests
// @Tags admin
// @Produce json
// @Security BearerAuth
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Items per page" default(10)
// @Param status query string false "Status filter"
// @Param type query string false "Type filter"
// @Success 200 {object} models.ListAccessRequestsResponse
// @Failure 401 {object} map[string]string
// @Failure 403 {object} map[string]string
// @Router /admin/access-requests [get]
func (uc *UserController) GetAccessRequests(c *gin.Context) {
	// Check if user is admin
	userType, exists := middleware.GetUserType(c)
	if !exists || userType != "admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Admin access required"})
		return
	}

	var req models.ListAccessRequestsRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid query parameters",
			"details": err.Error(),
		})
		return
	}

	// Set defaults
	if req.Page == 0 {
		req.Page = 1
	}
	if req.Limit == 0 {
		req.Limit = 20
	}

	// For now, return pending users as access requests
	// This is a simplified implementation - in a real app you might have a separate access_requests collection
	userReq := &models.ListUsersRequest{
		Page:     req.Page,
		Limit:    req.Limit,
		Status:   models.UserStatusPending,
		UserType: models.UserTypeExternal, // Only external users need approval
	}

	userResponse, err := uc.userRepository.ListUsers(c.Request.Context(), userReq)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get access requests"})
		return
	}

	// Convert users to access requests format
	requests := make([]models.AccessRequest, len(userResponse.Users))
	for i, user := range userResponse.Users {
		requests[i] = models.AccessRequest{
			ID:          user.ID,
			UserID:      user.ID,
			RequestType: user.UserType,
			FullName:    user.FullName,
			Email:       user.Email,
			Status:      user.Status,
			RequestedAt: user.CreatedAt,
		}
	}

	response := &models.ListAccessRequestsResponse{
		Requests:   requests,
		Total:      userResponse.Total,
		Page:       userResponse.Page,
		Limit:      userResponse.Limit,
		TotalPages: userResponse.TotalPages,
	}

	c.JSON(http.StatusOK, response)
}

// @Summary Approve access request (Admin only)
// @Description Approve a pending access request
// @Tags admin
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Request ID"
// @Param request body models.ApproveAccessRequest true "Approval data"
// @Success 200 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 403 {object} map[string]string
// @Router /admin/access-requests/{id}/approve [post]
func (uc *UserController) ApproveAccessRequest(c *gin.Context) {
	// Check if user is admin
	userType, exists := middleware.GetUserType(c)
	if !exists || userType != "admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Admin access required"})
		return
	}

	requestIDStr := c.Param("id")
	requestID, err := primitive.ObjectIDFromHex(requestIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request ID"})
		return
	}

	var req models.ApproveAccessRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request data",
			"details": err.Error(),
		})
		return
	}

	// Get user info before approving for logging
	user, err := uc.userRepository.GetByID(c.Request.Context(), requestID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// Update user status to active
	if err := uc.userRepository.UpdateUserStatus(c.Request.Context(), requestID, models.UserStatusActive); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to approve access request"})
		return
	}

	// Log access request approval activity
	go func() {
		ctx := context.Background()
		adminUserID, _ := middleware.GetUserID(c)
		adminUserName, adminUserType := uc.getUserInfo(c)

		fmt.Printf("🔄 Attempting to log access request approval activity...\n")
		err := uc.activityLogService.LogUserActivity(
			ctx,
			models.ActivityUserAccessGranted,
			user.ID.Hex(),
			user.FullName,
			adminUserID,
			adminUserName,
			adminUserType,
			map[string]interface{}{
				"previous_status": string(user.Status),
				"new_status":      string(models.UserStatusActive),
				"user_email":      user.Email,
				"user_type":       string(user.UserType),
				"approval_note":   req.Notes,
			},
		)

		if err != nil {
			fmt.Printf("❌ ERROR: Failed to log access approval activity: %v\n", err)
		} else {
			fmt.Printf("✅ SUCCESS: Access approval activity logged successfully\n")
		}
	}()

	c.JSON(http.StatusOK, gin.H{
		"message":    "Access request approved successfully",
		"request_id": requestID.Hex(),
	})
}

// @Summary Reject access request (Admin only)
// @Description Reject a pending access request
// @Tags admin
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Request ID"
// @Param request body models.RejectAccessRequest true "Rejection data"
// @Success 200 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 403 {object} map[string]string
// @Router /admin/access-requests/{id}/reject [post]
func (uc *UserController) RejectAccessRequest(c *gin.Context) {
	// Check if user is admin
	userType, exists := middleware.GetUserType(c)
	if !exists || userType != "admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Admin access required"})
		return
	}

	requestIDStr := c.Param("id")
	requestID, err := primitive.ObjectIDFromHex(requestIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request ID"})
		return
	}

	var req models.RejectAccessRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request data",
			"details": err.Error(),
		})
		return
	}

	// Get user info before rejecting for logging
	user, err := uc.userRepository.GetByID(c.Request.Context(), requestID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// Update user status to rejected
	if err := uc.userRepository.UpdateUserStatus(c.Request.Context(), requestID, models.UserStatusRejected); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to reject access request"})
		return
	}

	// Log access request rejection activity
	go func() {
		ctx := context.Background()
		adminUserID, _ := middleware.GetUserID(c)
		adminUserName, adminUserType := uc.getUserInfo(c)

		fmt.Printf("🔄 Attempting to log access request rejection activity...\n")
		err := uc.activityLogService.LogUserActivity(
			ctx,
			models.ActivityUserAccessRevoked,
			user.ID.Hex(),
			user.FullName,
			adminUserID,
			adminUserName,
			adminUserType,
			map[string]interface{}{
				"previous_status": string(user.Status),
				"new_status":      string(models.UserStatusRejected),
				"user_email":      user.Email,
				"user_type":       string(user.UserType),
				"rejection_note":  req.Notes,
			},
		)

		if err != nil {
			fmt.Printf("❌ ERROR: Failed to log access rejection activity: %v\n", err)
		} else {
			fmt.Printf("✅ SUCCESS: Access rejection activity logged successfully\n")
		}
	}()

	c.JSON(http.StatusOK, gin.H{
		"message":    "Access request rejected successfully",
		"request_id": requestID.Hex(),
	})
}

// Health check endpoint
func (uc *UserController) HealthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status":  "healthy",
		"service": "user-service",
	})
}

// GoogleOAuthCallback handles Google OAuth callback
func (uc *UserController) GoogleOAuthCallback(c *gin.Context) {
	uc.handleOAuthCallback(c, "google")
}

// FacebookOAuthCallback handles Facebook OAuth callback
func (uc *UserController) FacebookOAuthCallback(c *gin.Context) {
	uc.handleOAuthCallback(c, "facebook")
}

// XOAuthCallback handles X OAuth callback
func (uc *UserController) XOAuthCallback(c *gin.Context) {
	uc.handleOAuthCallback(c, "x")
}

// GithubOAuthCallback handles GitHub OAuth callback
func (uc *UserController) GithubOAuthCallback(c *gin.Context) {
	uc.handleOAuthCallback(c, "github")
}

// handleOAuthCallback is a helper method to handle OAuth callbacks for all providers
func (uc *UserController) handleOAuthCallback(c *gin.Context, provider string) {
	code := c.Query("code")
	state := c.Query("state")
	errorParam := c.Query("error")

	fmt.Printf("🔄 OAuth callback for %s: code=%s, state=%s, error=%s\n", provider, code, state, errorParam)

	// Force all OAuth logins to use "user" role only
	userType := "user"
	fmt.Printf("🔒 OAuth login forced to use 'user' role (state was: %s)\n", state)

	// Get frontend URL from environment or use default (always 5173 now)
	frontendURL := os.Getenv("FRONTEND_URL")
	if frontendURL == "" {
		frontendURL = "http://localhost:5173" // Standardized port for both dev and production
	}

	// Handle OAuth error
	if errorParam != "" {
		c.Redirect(302, fmt.Sprintf("%s/oauth-callback?error=%s", frontendURL, errorParam))
		return
	}

	// Handle missing code
	if code == "" {
		c.Redirect(302, fmt.Sprintf("%s/oauth-callback?error=missing_code", frontendURL))
		return
	}

	// Process OAuth callback
	request := models.OAuthRequest{
		Provider: provider,
		Code:     code,
		UserType: models.UserType(userType),
	}

	fmt.Printf("🔄 Processing OAuth login for %s with user type %s\n", provider, userType)
	response, err := uc.userService.OAuthLogin(c.Request.Context(), &request)
	if err != nil {
		fmt.Printf("❌ OAuth login failed: %v\n", err)
		c.Redirect(302, fmt.Sprintf("%s/oauth-callback?error=%s", frontendURL, url.QueryEscape(err.Error())))
		return
	}
	fmt.Printf("✅ OAuth login successful\n")

	// Determine user type from response
	var userTypeStr string
	switch response.User.(type) {
	case *models.Admin:
		userTypeStr = "admin"
	case *models.UserMahasiswa:
		userTypeStr = "mahasiswa"
	default:
		userTypeStr = "user"
	}

	// Redirect to frontend with tokens
	redirectURL := fmt.Sprintf("%s/oauth-callback?access_token=%s&refresh_token=%s&user_type=%s",
		frontendURL,
		url.QueryEscape(response.AccessToken),
		url.QueryEscape(response.RefreshToken),
		url.QueryEscape(userTypeStr))

	c.Redirect(302, redirectURL)
}

// Helper method to get user information from context
func (uc *UserController) getUserInfo(c *gin.Context) (string, string) {
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
