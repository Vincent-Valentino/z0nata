package routes

import (
	"backend/controllers"
	"backend/middleware"
	"backend/models"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func SetupAuthRoutes(router gin.IRouter, userController *controllers.UserController, authMiddleware *middleware.AuthMiddleware, admin gin.IRouter) {
	// Health check
	router.GET("/health", userController.HealthCheck)

	// Development-only routes
	if os.Getenv("SERVER_ENVIRONMENT") != "production" && os.Getenv("ENVIRONMENT") != "production" {
		dev := router.Group("/dev")
		{
			// Development admin login that bypasses normal auth
			dev.POST("/login-admin", func(c *gin.Context) {
				// Create a mock admin user
				adminUser := models.Admin{
					User: models.User{
						ID:             primitive.NewObjectID(),
						FullName:       "William Zonata",
						Email:          "william.zonata@admin.com",
						EmailVerified:  true,
						ProfilePicture: "https://ui-avatars.io/api/?name=William+Zonata&background=ef4444&color=fff",
						UserType:       models.UserTypeAdmin,
						Status:         models.UserStatusActive,
						LastLogin:      time.Now(),
						CreatedAt:      time.Now(),
						UpdatedAt:      time.Now(),
					},
					IsAdmin:     true,
					Permissions: []string{"read", "write", "delete", "admin"},
				}

				// Get JWT manager from auth middleware to use the same configuration
				jwtManager := authMiddleware.GetJWTManager()

				accessToken, err := jwtManager.GenerateAccessToken(
					adminUser.ID,
					adminUser.Email,
					string(adminUser.UserType),
					adminUser.IsAdmin,
				)
				if err != nil {
					c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
					return
				}

				refreshToken, err := jwtManager.GenerateRefreshToken(adminUser.ID, adminUser.Email, false)
				if err != nil {
					c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate refresh token"})
					return
				}

				// Return the response in the same format as regular login
				c.JSON(http.StatusOK, models.AuthResponse{
					User:         adminUser,
					AccessToken:  accessToken,
					RefreshToken: refreshToken,
					ExpiresIn:    int64(jwtManager.GetAccessTokenExpiry().Seconds()),
				})
			})

			// Development student login
			dev.POST("/login-student", func(c *gin.Context) {
				// Create a mock student user
				studentUser := models.UserMahasiswa{
					User: models.User{
						ID:             primitive.NewObjectID(),
						FullName:       "Vincent Valentino",
						Email:          "vincent.valentino@student.com",
						EmailVerified:  true,
						ProfilePicture: "https://ui-avatars.io/api/?name=Vincent+Valentino&background=22c55e&color=fff",
						UserType:       models.UserTypeMahasiswa,
						Status:         models.UserStatusActive,
						LastLogin:      time.Now(),
						CreatedAt:      time.Now(),
						UpdatedAt:      time.Now(),
					},
					NIM:     "2021001234",
					Faculty: "Fakultas Teknik",
					Major:   "Teknik Informatika",
				}

				// Get JWT manager from auth middleware to use the same configuration
				jwtManager := authMiddleware.GetJWTManager()

				accessToken, err := jwtManager.GenerateAccessToken(
					studentUser.ID,
					studentUser.Email,
					string(studentUser.UserType),
					false, // not admin
				)
				if err != nil {
					c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
					return
				}

				refreshToken, err := jwtManager.GenerateRefreshToken(studentUser.ID, studentUser.Email, false)
				if err != nil {
					c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate refresh token"})
					return
				}

				// Return the response in the same format as regular login
				c.JSON(http.StatusOK, models.AuthResponse{
					User:         studentUser,
					AccessToken:  accessToken,
					RefreshToken: refreshToken,
					ExpiresIn:    int64(jwtManager.GetAccessTokenExpiry().Seconds()),
				})
			})
		}
	}

	// Public auth routes
	auth := router.Group("/auth")
	{
		// Registration and login
		auth.POST("/register", userController.Register)
		auth.POST("/login", userController.Login)
		auth.POST("/refresh", userController.RefreshToken)

		// Password reset
		auth.POST("/forgot-password", userController.RequestPasswordReset)
		auth.POST("/reset-password", userController.ResetPassword)

		// Email verification
		auth.GET("/verify-email", userController.VerifyEmail)
		auth.POST("/resend-verification", userController.ResendVerification)

		// OAuth
		auth.GET("/oauth/:provider/url", userController.GetOAuthURL)
		auth.POST("/oauth/callback", userController.OAuthCallback)

		// OAuth callback routes
		auth.GET("/oauth/google/callback", userController.GoogleOAuthCallback)
		auth.GET("/oauth/facebook/callback", userController.FacebookOAuthCallback)
		auth.GET("/oauth/x/callback", userController.XOAuthCallback)
		auth.GET("/oauth/github/callback", userController.GithubOAuthCallback)
	}

	// Protected auth routes (require authentication)
	authProtected := router.Group("/auth")
	authProtected.Use(authMiddleware.RequireAuth())
	{
		authProtected.POST("/logout", userController.Logout)
	}

	// User routes (require authentication)
	user := router.Group("/user")
	user.Use(authMiddleware.RequireAuth())
	{
		user.GET("/profile", userController.GetProfile)
		user.PUT("/profile", userController.UpdateProfile)
		user.POST("/change-password", userController.ChangePassword)
	}

	// Mahasiswa-specific routes
	mahasiswa := router.Group("/mahasiswa")
	mahasiswa.Use(authMiddleware.RequireAuth())
	mahasiswa.Use(authMiddleware.RequireMahasiswa())
	{
		// Add mahasiswa-specific endpoints here
		mahasiswa.GET("/dashboard", func(c *gin.Context) {
			c.JSON(200, gin.H{"message": "Mahasiswa dashboard"})
		})
	}

	// Admin routes (use the shared admin group)
	{
		// User management
		admin.GET("/users", userController.GetAllUsers)
		admin.GET("/users/stats", userController.GetUserStats)
		admin.PUT("/users/:id/status", userController.UpdateUserStatus)

		// Access request management
		admin.GET("/access-requests", userController.GetAccessRequests)
		admin.POST("/access-requests/:id/approve", userController.ApproveAccessRequest)
		admin.POST("/access-requests/:id/reject", userController.RejectAccessRequest)

		// Dashboard
		admin.GET("/dashboard", func(c *gin.Context) {
			c.JSON(200, gin.H{"message": "Admin dashboard"})
		})
	}
}
