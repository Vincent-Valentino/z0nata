package routes

import (
	"backend/controllers"

	"github.com/gin-gonic/gin"
)

// SetupDevRoutes registers development-only helper endpoints.
// These should ONLY be registered when the application is running in a non-production
// environment. The caller (main.go) is responsible for checking the environment before
// invoking this function.
func SetupDevRoutes(api *gin.RouterGroup, devController *controllers.DevController) {
	dev := api.Group("/dev")

	// Quick login helpers – no auth required because they are only exposed in dev.
	dev.POST("/login-admin", devController.LoginAdmin)
	dev.POST("/login-student", devController.LoginStudent)
	dev.POST("/login-user", devController.LoginUser)
}
