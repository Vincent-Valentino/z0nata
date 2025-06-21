package routes

import (
	"backend/controllers"
	"backend/middleware"

	"github.com/gin-gonic/gin"
)

func SetupAuthRoutes(router gin.IRouter, userController *controllers.UserController, authMiddleware *middleware.AuthMiddleware, admin gin.IRouter) {
	// Health check
	router.GET("/health", userController.HealthCheck)

	// Note: Development routes are now handled by SetupDevRoutes in dev.go

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
