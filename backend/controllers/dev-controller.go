package controllers

import (
	"context"
	"fmt"
	"net/http"

	"backend/models"
	"backend/repository"
	"backend/services"
	"backend/utils"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// DevController provides helper endpoints that are only enabled in development environment.
// These endpoints allow the frontend DevTools panel (and developers) to quickly obtain
// real JWTs for the actual test accounts in the database without having to hit the regular login form.
//
// NOTE: These routes must only be registered when the server is running in a non-production
// environment to avoid accidental exposure.
type DevController struct {
	userService    services.UserService
	userRepository repository.UserRepository
	jwtManager     *utils.JWTManager
}

func NewDevController(userService services.UserService, userRepository repository.UserRepository, jwtManager *utils.JWTManager) *DevController {
	return &DevController{
		userService:    userService,
		userRepository: userRepository,
		jwtManager:     jwtManager,
	}
}

// generateAuthResponse creates an auth response with JWT tokens for the given user
func (dc *DevController) generateAuthResponse(ctx context.Context, user interface{}, userID string, email string, userType string, isAdmin bool) (*models.AuthResponse, error) {
	// Convert userID string to ObjectID
	objID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, fmt.Errorf("invalid user ID: %w", err)
	}

	// Generate tokens
	accessToken, err := dc.jwtManager.GenerateAccessToken(objID, email, userType, isAdmin)
	if err != nil {
		return nil, fmt.Errorf("failed to generate access token: %w", err)
	}

	refreshToken, err := dc.jwtManager.GenerateRefreshToken(objID, email, true) // Remember me = true for dev
	if err != nil {
		return nil, fmt.Errorf("failed to generate refresh token: %w", err)
	}

	// Store refresh token
	if err := dc.userRepository.SetRefreshToken(ctx, objID, refreshToken); err != nil {
		return nil, fmt.Errorf("failed to store refresh token: %w", err)
	}

	// Update last login timestamp
	dc.userRepository.UpdateLastLogin(ctx, objID)

	return &models.AuthResponse{
		User:         user,
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		ExpiresIn:    int64(dc.jwtManager.GetAccessTokenExpiry().Seconds()),
	}, nil
}

// findFirstAdminUser finds the first available admin user in the database
func (dc *DevController) findFirstAdminUser(ctx context.Context) (*models.Admin, error) {
	// Use ListUsers to search across all collections including admins
	req := &models.ListUsersRequest{
		Page:     1,
		Limit:    1,
		UserType: models.UserTypeAdmin,
		Status:   models.UserStatusActive,
	}

	response, err := dc.userRepository.ListUsers(ctx, req)
	if err != nil {
		return nil, err
	}

	if len(response.Users) == 0 {
		return nil, nil // No admin found
	}

	// Get the full admin record using the email from the summary
	admin, err := dc.userRepository.GetAdminByEmail(ctx, response.Users[0].Email)
	return admin, err
}

// findFirstMahasiswaUser finds the first available mahasiswa user in the database
func (dc *DevController) findFirstMahasiswaUser(ctx context.Context) (*models.UserMahasiswa, error) {
	// Use ListUsers to search across all collections including mahasiswa
	req := &models.ListUsersRequest{
		Page:     1,
		Limit:    1,
		UserType: models.UserTypeMahasiswa,
		Status:   models.UserStatusActive,
	}

	response, err := dc.userRepository.ListUsers(ctx, req)
	if err != nil {
		return nil, err
	}

	if len(response.Users) == 0 {
		return nil, nil // No mahasiswa found
	}

	// Get the full mahasiswa record using the email from the summary
	mahasiswa, err := dc.userRepository.GetMahasiswaByEmail(ctx, response.Users[0].Email)
	return mahasiswa, err
}

// findFirstExternalUser finds the first available external user in the database
func (dc *DevController) findFirstExternalUser(ctx context.Context) (*models.User, error) {
	// Use ListUsers to search across all collections for external users
	req := &models.ListUsersRequest{
		Page:     1,
		Limit:    1,
		UserType: models.UserTypeExternal,
		Status:   models.UserStatusActive,
	}

	response, err := dc.userRepository.ListUsers(ctx, req)
	if err != nil {
		return nil, err
	}

	if len(response.Users) == 0 {
		return nil, nil // No external user found
	}

	// Get the full external user record using the email from the summary
	user, err := dc.userRepository.GetByEmail(ctx, response.Users[0].Email)
	return user, err
}

// LoginAdmin logs in the first available admin account from database and returns JWT tokens.
func (dc *DevController) LoginAdmin(c *gin.Context) {
	ctx := context.Background()

	admin, err := dc.findFirstAdminUser(ctx)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to find admin user: " + err.Error(),
		})
		return
	}

	if admin == nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "No admin user found in database. Please ensure admin users are seeded.",
		})
		return
	}

	// For dev mode, we bypass password verification and directly generate tokens
	// This simulates a successful login without requiring the actual password
	authResp, err := dc.generateAuthResponse(ctx, &admin.User, admin.ID.Hex(), admin.Email, string(admin.UserType), true)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to generate tokens: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, authResp)
}

// LoginStudent logs in the first available student account from database and returns JWT tokens.
func (dc *DevController) LoginStudent(c *gin.Context) {
	ctx := context.Background()

	mahasiswa, err := dc.findFirstMahasiswaUser(ctx)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to find mahasiswa user: " + err.Error(),
		})
		return
	}

	if mahasiswa == nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "No mahasiswa user found in database. Please ensure mahasiswa users are seeded.",
		})
		return
	}

	// For dev mode, we bypass password verification and directly generate tokens
	authResp, err := dc.generateAuthResponse(ctx, mahasiswa, mahasiswa.ID.Hex(), mahasiswa.Email, string(mahasiswa.UserType), false)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to generate tokens: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, authResp)
}

// LoginUser logs in the first available external user account from database and returns JWT tokens.
func (dc *DevController) LoginUser(c *gin.Context) {
	ctx := context.Background()

	user, err := dc.findFirstExternalUser(ctx)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to find external user: " + err.Error(),
		})
		return
	}

	if user == nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "No external user found in database. Please ensure external users are seeded.",
		})
		return
	}

	// For dev mode, we bypass password verification and directly generate tokens
	authResp, err := dc.generateAuthResponse(ctx, user, user.ID.Hex(), user.Email, string(user.UserType), false)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to generate tokens: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, authResp)
}

// GetDevUsers returns the available dev test users for frontend to display
func (dc *DevController) GetDevUsers(c *gin.Context) {
	ctx := context.Background()
	var users []gin.H

	// Find first admin
	admin, err := dc.findFirstAdminUser(ctx)
	if err == nil && admin != nil {
		users = append(users, gin.H{
			"id":          admin.ID.Hex(),
			"full_name":   admin.FullName,
			"email":       admin.Email,
			"role":        "admin",
			"user_type":   string(admin.UserType),
			"description": "Admin Account - Full system access",
			"available":   true,
		})
	}

	// Find first mahasiswa
	mahasiswa, err := dc.findFirstMahasiswaUser(ctx)
	if err == nil && mahasiswa != nil {
		users = append(users, gin.H{
			"id":          mahasiswa.ID.Hex(),
			"full_name":   mahasiswa.FullName,
			"email":       mahasiswa.Email,
			"role":        "student",
			"user_type":   string(mahasiswa.UserType),
			"description": "Student Account - Standard user access",
			"nim":         mahasiswa.NIM,
			"faculty":     mahasiswa.Faculty,
			"major":       mahasiswa.Major,
			"available":   true,
		})
	}

	// Find first external user
	externalUser, err := dc.findFirstExternalUser(ctx)
	if err == nil && externalUser != nil {
		users = append(users, gin.H{
			"id":          externalUser.ID.Hex(),
			"full_name":   externalUser.FullName,
			"email":       externalUser.Email,
			"role":        "user",
			"user_type":   string(externalUser.UserType),
			"description": "External User - Basic access",
			"available":   true,
		})
	}

	if len(users) == 0 {
		c.JSON(http.StatusNotFound, gin.H{
			"error":   "No test users found in database",
			"message": "Please ensure test users are seeded in the database",
			"users":   []gin.H{},
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"users":   users,
		"message": "Dev test users available in database",
		"note":    "Password authentication required for login",
	})
}
