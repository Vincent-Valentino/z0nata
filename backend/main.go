package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"backend/config"
	"backend/controllers"
	"backend/database"
	"backend/middleware"
	"backend/repository"
	"backend/routes"
	"backend/services"
	"backend/utils"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	// Load configuration
	cfg := config.LoadConfig()

	// Set Gin mode based on environment
	if cfg.Server.Environment == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	// Connect to MongoDB Atlas
	db, err := database.ConnectMongoDB(cfg.Database)
	if err != nil {
		log.Fatalf("Failed to connect to MongoDB Atlas: %v", err)
	}

	// Initialize repositories
	userRepo := repository.NewUserRepository(db)
	moduleRepo := repository.NewModuleRepository(db)
	userActivityRepo := repository.NewUserActivityRepository(db)
	questionRepo := repository.NewQuestionRepository(db)
	activityLogRepo := repository.NewActivityLogRepository(db)

	// Initialize utilities
	jwtManager := utils.NewJWTManager(cfg.JWT)
	emailService := utils.NewEmailService(cfg.Email)

	// Initialize services
	userService := services.NewUserService(userRepo, jwtManager, emailService, cfg)
	moduleService := services.NewModuleService(moduleRepo)
	userActivityService := services.NewUserActivityService(userActivityRepo)
	questionService := services.NewQuestionService(questionRepo)
	activityLogService := services.NewActivityLogService(activityLogRepo)

	// Initialize controllers
	userController := controllers.NewUserController(userService, userRepo, activityLogService)
	moduleController := controllers.NewModuleController(moduleService, activityLogService)
	userActivityController := controllers.NewUserActivityController(userActivityService)
	questionController := controllers.NewQuestionController(questionService, activityLogService)
	activityLogController := controllers.NewActivityLogController(activityLogService)

	// Initialize middleware
	authMiddleware := middleware.NewAuthMiddleware(jwtManager)

	// Create Gin router
	router := gin.New()

	// Add middleware
	router.Use(gin.Logger())
	router.Use(gin.Recovery())

	// CORS configuration
	corsConfig := cors.Config{
		AllowOrigins:     cfg.Server.AllowedOrigins,
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Length", "Content-Type", "Authorization"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}
	router.Use(cors.New(corsConfig))

	// Health check endpoint for Docker health checks
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":   "ok",
			"database": "connected",
			"service":  "quizapp-backend",
		})
	})

	// API version prefix
	api := router.Group("/api/v1")

	// Create shared admin group to avoid route conflicts
	admin := api.Group("/admin")
	admin.Use(authMiddleware.RequireAuth())
	admin.Use(authMiddleware.RequireAdmin())

	// Setup routes
	routes.SetupAuthRoutes(api, userController, authMiddleware, admin)
	routes.SetupModuleRoutes(api, moduleController, authMiddleware, admin)
	routes.SetupUserActivityRoutes(api, userActivityController, authMiddleware)
	routes.SetupQuestionRoutes(api, questionController, authMiddleware, admin)
	routes.SetupActivityLogRoutes(api, activityLogController, authMiddleware, admin)

	// API documentation endpoint
	api.GET("/docs", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"message": "QuizApp API Documentation",
			"version": "v1",
			"endpoints": gin.H{
				"auth": gin.H{
					"POST /auth/register":             "Register new user",
					"POST /auth/login":                "Login user",
					"POST /auth/refresh":              "Refresh access token",
					"POST /auth/logout":               "Logout user (requires auth)",
					"POST /auth/forgot-password":      "Request password reset",
					"POST /auth/reset-password":       "Reset password",
					"GET  /auth/verify-email":         "Verify email",
					"POST /auth/resend-verification":  "Resend verification email",
					"GET  /auth/oauth/{provider}/url": "Get OAuth URL",
					"POST /auth/oauth/callback":       "OAuth callback",
				},
				"user": gin.H{
					"GET  /user/profile":         "Get user profile (requires auth)",
					"PUT  /user/profile":         "Update user profile (requires auth)",
					"POST /user/change-password": "Change password (requires auth)",
				},
				"mahasiswa": gin.H{
					"GET /mahasiswa/dashboard": "Mahasiswa dashboard (requires mahasiswa auth)",
				},
				"admin": gin.H{
					"GET    /admin/users":                 "Get all users (requires admin auth)",
					"DELETE /admin/users/:id":             "Delete user (requires admin auth)",
					"GET    /admin/dashboard":             "Admin dashboard (requires admin auth)",
					"POST   /admin/questions":             "Create new question (requires admin auth)",
					"GET    /admin/questions":             "List questions with filtering (requires admin auth)",
					"GET    /admin/questions/:id":         "Get specific question (requires admin auth)",
					"PUT    /admin/questions/:id":         "Update question (requires admin auth)",
					"DELETE /admin/questions/:id":         "Delete question (requires admin auth)",
					"PATCH  /admin/questions/:id/status":  "Toggle question status (requires admin auth)",
					"GET    /admin/questions/stats":       "Get question statistics (requires admin auth)",
					"POST   /admin/questions/validate":    "Validate question data (requires admin auth)",
					"GET    /admin/activity-logs":         "Get activity logs with filtering (requires admin auth)",
					"GET    /admin/activity-logs/stats":   "Get activity statistics (requires admin auth)",
					"GET    /admin/activity-logs/recent":  "Get recent activities (requires admin auth)",
					"GET    /admin/activity-logs/types":   "Get available activity types (requires admin auth)",
					"GET    /admin/activity-logs/:id":     "Get specific activity log (requires admin auth)",
					"POST   /admin/activity-logs/cleanup": "Cleanup old activity logs (requires admin auth)",
				},
				"questions": gin.H{
					"GET /questions/random": "Get random questions for quiz (public)",
				},
			},
			"oauth_providers": []string{"google", "facebook", "apple", "github"},
			"user_types":      []string{"mahasiswa", "admin"},
		})
	})

	// Create HTTP server
	server := &http.Server{
		Addr:         fmt.Sprintf("%s:%s", cfg.Server.Host, cfg.Server.Port),
		Handler:      router,
		ReadTimeout:  cfg.Server.ReadTimeout,
		WriteTimeout: cfg.Server.WriteTimeout,
	}

	// Start server in a goroutine
	go func() {
		log.Printf("Starting server on %s:%s", cfg.Server.Host, cfg.Server.Port)
		log.Printf("Environment: %s", cfg.Server.Environment)
		log.Printf("API documentation available at: http://%s:%s/api/v1/docs", cfg.Server.Host, cfg.Server.Port)

		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Failed to start server: %v", err)
		}
	}()

	// Wait for interrupt signal to gracefully shutdown the server
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("Shutting down server...")

	// Give outstanding requests time to complete
	ctx, cancel := context.WithTimeout(context.Background(), cfg.Server.ShutdownTimeout)
	defer cancel()

	if err := server.Shutdown(ctx); err != nil {
		log.Fatalf("Server forced to shutdown: %v", err)
	}

	log.Println("Server exited")
}
