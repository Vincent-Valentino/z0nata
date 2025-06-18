package routes

import (
	"backend/controllers"
	"backend/middleware"

	"github.com/gin-gonic/gin"
)

func SetupModuleRoutes(router gin.IRouter, moduleController *controllers.ModuleController, authMiddleware *middleware.AuthMiddleware, admin gin.IRouter) {
	// Public module routes
	modules := router.Group("/modules")
	{
		modules.GET("", moduleController.GetAllModules)
		modules.GET("/:moduleId", moduleController.GetModuleByID)
	}

	// Admin module routes (use the shared admin group)
	adminModules := admin.Group("/modules")
	{
		// Module CRUD
		adminModules.POST("", moduleController.CreateModule)
		adminModules.PUT("/:moduleId", moduleController.UpdateModule)
		adminModules.DELETE("/:moduleId", moduleController.DeleteModule)
		adminModules.PATCH("/:moduleId/publish", moduleController.ToggleModulePublication)

		// Module ordering
		adminModules.POST("/reorder", moduleController.ReorderModules)
		adminModules.POST("/bulk-reorder", moduleController.BulkReorder)

		// Submodule CRUD
		adminModules.POST("/:moduleId/submodules", moduleController.CreateSubModule)
		adminModules.PUT("/:moduleId/submodules/:submoduleId", moduleController.UpdateSubModule)
		adminModules.DELETE("/:moduleId/submodules/:submoduleId", moduleController.DeleteSubModule)
		adminModules.PATCH("/:moduleId/submodules/:submoduleId/publish", moduleController.ToggleSubModulePublication)

		// Submodule ordering
		adminModules.POST("/:moduleId/submodules/reorder", moduleController.ReorderSubModules)
	}
}
