package controllers

import (
	"fmt"
	"net/http"
	"strconv"

	"backend/middleware"
	"backend/models"
	"backend/services"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type ModuleController struct {
	moduleService      services.ModuleService
	activityLogService services.ActivityLogService
}

func NewModuleController(moduleService services.ModuleService, activityLogService services.ActivityLogService) *ModuleController {
	return &ModuleController{
		moduleService:      moduleService,
		activityLogService: activityLogService,
	}
}

// Helper method to get user information from context
func (mc *ModuleController) getUserInfo(c *gin.Context) (string, string) {
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

// @Summary Get all modules
// @Description Get paginated list of all modules with optional filtering
// @Tags modules
// @Produce json
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Items per page" default(10)
// @Param search query string false "Search term"
// @Param published query bool false "Filter by published status"
// @Success 200 {object} map[string]interface{}
// @Router /modules [get]
func (mc *ModuleController) GetAllModules(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	search := c.Query("search")
	publishedStr := c.Query("published")

	var published *bool
	if publishedStr != "" {
		if p, err := strconv.ParseBool(publishedStr); err == nil {
			published = &p
		}
	}

	req := &models.GetModulesRequest{
		Page:      page,
		Limit:     limit,
		Search:    search,
		Published: published,
	}

	response, err := mc.moduleService.GetAllModules(c.Request.Context(), req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, response)
}

// @Summary Get module by ID
// @Description Get a specific module with its submodules
// @Tags modules
// @Produce json
// @Param id path string true "Module ID"
// @Success 200 {object} models.Module
// @Failure 404 {object} map[string]string
// @Router /modules/{id} [get]
func (mc *ModuleController) GetModuleByID(c *gin.Context) {
	moduleIDStr := c.Param("moduleId")
	moduleID, err := primitive.ObjectIDFromHex(moduleIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid module ID"})
		return
	}

	module, err := mc.moduleService.GetModuleByID(c.Request.Context(), moduleID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, module)
}

// @Summary Create new module
// @Description Create a new module (Admin only)
// @Tags modules
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body models.CreateModuleRequest true "Module data"
// @Success 201 {object} models.Module
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 403 {object} map[string]string
// @Router /admin/modules [post]
func (mc *ModuleController) CreateModule(c *gin.Context) {
	userID, exists := middleware.GetUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
		return
	}

	var req models.CreateModuleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request data",
			"details": err.Error(),
		})
		return
	}

	module, err := mc.moduleService.CreateModule(c.Request.Context(), &req, userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Log module creation activity
	userName, userType := mc.getUserInfo(c)
	fmt.Printf("DEBUG: Logging module creation activity for module %s by user %s (%s)\n", module.Name, userName, userType)
	err = mc.activityLogService.LogModuleActivity(
		c.Request.Context(),
		models.ActivityModuleCreated,
		module.ID.Hex(),
		module.Name,
		userID,
		userName,
		userType,
		map[string]interface{}{
			"description": module.Description,
			"order":       module.Order,
		},
	)
	if err != nil {
		fmt.Printf("ERROR: Failed to log module creation activity: %v\n", err)
	} else {
		fmt.Printf("SUCCESS: Module creation activity logged successfully\n")
	}

	c.JSON(http.StatusCreated, module)
}

// @Summary Update module
// @Description Update an existing module (Admin only)
// @Tags modules
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Module ID"
// @Param request body models.UpdateModuleRequest true "Module update data"
// @Success 200 {object} models.Module
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 403 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Router /admin/modules/{id} [put]
func (mc *ModuleController) UpdateModule(c *gin.Context) {
	userID, exists := middleware.GetUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
		return
	}

	moduleIDStr := c.Param("moduleId")
	moduleID, err := primitive.ObjectIDFromHex(moduleIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid module ID"})
		return
	}

	var req models.UpdateModuleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request data",
			"details": err.Error(),
		})
		return
	}

	module, err := mc.moduleService.UpdateModule(c.Request.Context(), moduleID, &req, userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Log module update activity
	userName, userType := mc.getUserInfo(c)
	changes := make(map[string]interface{})
	if req.Name != nil {
		changes["name"] = *req.Name
	}
	if req.Description != nil {
		changes["description"] = *req.Description
	}
	if req.Order != nil {
		changes["order"] = *req.Order
	}

	fmt.Printf("DEBUG: Logging module update activity for module %s by user %s (%s)\n", module.Name, userName, userType)
	err = mc.activityLogService.LogModuleActivity(
		c.Request.Context(),
		models.ActivityModuleUpdated,
		module.ID.Hex(),
		module.Name,
		userID,
		userName,
		userType,
		changes,
	)
	if err != nil {
		fmt.Printf("ERROR: Failed to log module update activity: %v\n", err)
	} else {
		fmt.Printf("SUCCESS: Module update activity logged successfully\n")
	}

	c.JSON(http.StatusOK, module)
}

// @Summary Delete module
// @Description Delete a module and all its submodules (Admin only)
// @Tags modules
// @Produce json
// @Security BearerAuth
// @Param id path string true "Module ID"
// @Success 200 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 403 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Router /admin/modules/{id} [delete]
func (mc *ModuleController) DeleteModule(c *gin.Context) {
	moduleIDStr := c.Param("moduleId")
	moduleID, err := primitive.ObjectIDFromHex(moduleIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid module ID"})
		return
	}

	// Get module info before deletion for logging
	module, err := mc.moduleService.GetModuleByID(c.Request.Context(), moduleID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	err = mc.moduleService.DeleteModule(c.Request.Context(), moduleID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	// Log module deletion activity
	userID, _ := middleware.GetUserID(c)
	userName, userType := mc.getUserInfo(c)
	mc.activityLogService.LogModuleActivity(
		c.Request.Context(),
		models.ActivityModuleDeleted,
		module.ID.Hex(),
		module.Name,
		userID,
		userName,
		userType,
		map[string]interface{}{
			"submodules_count": len(module.SubModules),
		},
	)

	c.JSON(http.StatusOK, gin.H{"message": "Module deleted successfully"})
}

// @Summary Publish/Unpublish module
// @Description Toggle module publication status (Admin only)
// @Tags modules
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "Module ID"
// @Param request body map[string]bool true "Publication status"
// @Success 200 {object} models.Module
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 403 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Router /admin/modules/{id}/publish [patch]
func (mc *ModuleController) ToggleModulePublication(c *gin.Context) {
	userID, exists := middleware.GetUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
		return
	}

	moduleIDStr := c.Param("moduleId")
	moduleID, err := primitive.ObjectIDFromHex(moduleIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid module ID"})
		return
	}

	var req struct {
		Published bool `json:"published"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request data",
			"details": err.Error(),
		})
		return
	}

	module, err := mc.moduleService.ToggleModulePublication(c.Request.Context(), moduleID, req.Published, userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Log module publication activity
	userName, userType := mc.getUserInfo(c)
	activityType := models.ActivityModulePublished
	if !req.Published {
		activityType = models.ActivityModuleUnpublished
	}

	mc.activityLogService.LogModuleActivity(
		c.Request.Context(),
		activityType,
		module.ID.Hex(),
		module.Name,
		userID,
		userName,
		userType,
		map[string]interface{}{
			"published": req.Published,
		},
	)

	c.JSON(http.StatusOK, module)
}

// Submodule endpoints

// @Summary Create submodule
// @Description Create a new submodule for a module (Admin only)
// @Tags submodules
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param moduleId path string true "Module ID"
// @Param request body models.CreateSubModuleRequest true "Submodule data"
// @Success 201 {object} models.SubModule
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 403 {object} map[string]string
// @Router /admin/modules/{moduleId}/submodules [post]
func (mc *ModuleController) CreateSubModule(c *gin.Context) {
	userID, exists := middleware.GetUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
		return
	}

	moduleIDStr := c.Param("moduleId")
	moduleID, err := primitive.ObjectIDFromHex(moduleIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid module ID"})
		return
	}

	var req models.CreateSubModuleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request data",
			"details": err.Error(),
		})
		return
	}

	subModule, err := mc.moduleService.CreateSubModule(c.Request.Context(), moduleID, &req, userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Log submodule creation activity
	userName, userType := mc.getUserInfo(c)
	mc.activityLogService.LogModuleActivity(
		c.Request.Context(),
		models.ActivitySubModuleCreated,
		subModule.ID.Hex(),
		subModule.Name,
		userID,
		userName,
		userType,
		map[string]interface{}{
			"parent_module_id": moduleIDStr,
			"description":      subModule.Description,
			"order":            subModule.Order,
		},
	)

	c.JSON(http.StatusCreated, subModule)
}

// @Summary Update submodule
// @Description Update an existing submodule (Admin only)
// @Tags submodules
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param moduleId path string true "Module ID"
// @Param submoduleId path string true "Submodule ID"
// @Param request body models.CreateSubModuleRequest true "Submodule update data"
// @Success 200 {object} models.SubModule
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 403 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Router /admin/modules/{moduleId}/submodules/{submoduleId} [put]
func (mc *ModuleController) UpdateSubModule(c *gin.Context) {
	userID, exists := middleware.GetUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
		return
	}

	moduleIDStr := c.Param("moduleId")
	moduleID, err := primitive.ObjectIDFromHex(moduleIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid module ID"})
		return
	}

	subModuleIDStr := c.Param("submoduleId")
	subModuleID, err := primitive.ObjectIDFromHex(subModuleIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid submodule ID"})
		return
	}

	var req models.CreateSubModuleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request data",
			"details": err.Error(),
		})
		return
	}

	subModule, err := mc.moduleService.UpdateSubModule(c.Request.Context(), moduleID, subModuleID, &req, userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Log submodule update activity
	userName, userType := mc.getUserInfo(c)
	mc.activityLogService.LogModuleActivity(
		c.Request.Context(),
		models.ActivitySubModuleUpdated,
		subModule.ID.Hex(),
		subModule.Name,
		userID,
		userName,
		userType,
		map[string]interface{}{
			"parent_module_id": moduleIDStr,
			"name":             req.Name,
			"description":      req.Description,
			"order":            req.Order,
		},
	)

	c.JSON(http.StatusOK, subModule)
}

// @Summary Delete submodule
// @Description Delete a submodule from a module (Admin only)
// @Tags submodules
// @Produce json
// @Security BearerAuth
// @Param moduleId path string true "Module ID"
// @Param submoduleId path string true "Submodule ID"
// @Success 200 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 403 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Router /admin/modules/{moduleId}/submodules/{submoduleId} [delete]
func (mc *ModuleController) DeleteSubModule(c *gin.Context) {
	moduleIDStr := c.Param("moduleId")
	moduleID, err := primitive.ObjectIDFromHex(moduleIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid module ID"})
		return
	}

	subModuleIDStr := c.Param("submoduleId")
	subModuleID, err := primitive.ObjectIDFromHex(subModuleIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid submodule ID"})
		return
	}

	// Get module and submodule info before deletion for logging
	module, err := mc.moduleService.GetModuleByID(c.Request.Context(), moduleID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Module not found"})
		return
	}

	var subModuleName string
	for _, sm := range module.SubModules {
		if sm.ID == subModuleID {
			subModuleName = sm.Name
			break
		}
	}

	err = mc.moduleService.DeleteSubModule(c.Request.Context(), moduleID, subModuleID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	// Log submodule deletion activity
	userID, _ := middleware.GetUserID(c)
	userName, userType := mc.getUserInfo(c)
	mc.activityLogService.LogModuleActivity(
		c.Request.Context(),
		models.ActivitySubModuleDeleted,
		subModuleIDStr,
		subModuleName,
		userID,
		userName,
		userType,
		map[string]interface{}{
			"parent_module_id":   moduleIDStr,
			"parent_module_name": module.Name,
		},
	)

	c.JSON(http.StatusOK, gin.H{"message": "Submodule deleted successfully"})
}

// @Summary Publish/Unpublish submodule
// @Description Toggle submodule publication status (Admin only)
// @Tags submodules
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param moduleId path string true "Module ID"
// @Param submoduleId path string true "Submodule ID"
// @Param request body map[string]bool true "Publication status"
// @Success 200 {object} models.SubModule
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 403 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Router /admin/modules/{moduleId}/submodules/{submoduleId}/publish [patch]
func (mc *ModuleController) ToggleSubModulePublication(c *gin.Context) {
	userID, exists := middleware.GetUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
		return
	}

	moduleIDStr := c.Param("moduleId")
	moduleID, err := primitive.ObjectIDFromHex(moduleIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid module ID"})
		return
	}

	subModuleIDStr := c.Param("submoduleId")
	subModuleID, err := primitive.ObjectIDFromHex(subModuleIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid submodule ID"})
		return
	}

	var req struct {
		Published bool `json:"published"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request data",
			"details": err.Error(),
		})
		return
	}

	subModule, err := mc.moduleService.ToggleSubModulePublication(c.Request.Context(), moduleID, subModuleID, req.Published, userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Log submodule publication activity
	userName, userType := mc.getUserInfo(c)
	activityType := models.ActivitySubModulePublished
	if !req.Published {
		activityType = models.ActivitySubModuleUnpublished
	}

	mc.activityLogService.LogModuleActivity(
		c.Request.Context(),
		activityType,
		subModule.ID.Hex(),
		subModule.Name,
		userID,
		userName,
		userType,
		map[string]interface{}{
			"parent_module_id": moduleIDStr,
			"published":        req.Published,
		},
	)

	c.JSON(http.StatusOK, subModule)
}

// @Summary Reorder modules
// @Description Update the display order of multiple modules (Admin only)
// @Tags modules
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body map[string][]string true "Module order mapping"
// @Success 200 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 403 {object} map[string]string
// @Router /admin/modules/reorder [post]
func (mc *ModuleController) ReorderModules(c *gin.Context) {
	userID, exists := middleware.GetUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
		return
	}

	var req struct {
		ModuleIDs []string `json:"module_ids" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request data",
			"details": err.Error(),
		})
		return
	}

	err := mc.moduleService.ReorderModules(c.Request.Context(), req.ModuleIDs, userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Modules reordered successfully"})
}

// @Summary Reorder submodules
// @Description Update the display order of submodules within a module (Admin only)
// @Tags submodules
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param moduleId path string true "Module ID"
// @Param request body map[string][]string true "Submodule order mapping"
// @Success 200 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 403 {object} map[string]string
// @Router /admin/modules/{moduleId}/submodules/reorder [post]
func (mc *ModuleController) ReorderSubModules(c *gin.Context) {
	userID, exists := middleware.GetUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
		return
	}

	moduleIDStr := c.Param("moduleId")
	moduleID, err := primitive.ObjectIDFromHex(moduleIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid module ID"})
		return
	}

	var req struct {
		SubModuleIDs []string `json:"submodule_ids" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request data",
			"details": err.Error(),
		})
		return
	}

	err = mc.moduleService.ReorderSubModules(c.Request.Context(), moduleID, req.SubModuleIDs, userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Submodules reordered successfully"})
}

// @Summary Bulk reorder modules and submodules
// @Description Update the display order of multiple modules and submodules in one request (Admin only)
// @Tags modules
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body models.BulkReorderRequest true "Bulk reorder data"
// @Success 200 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 403 {object} map[string]string
// @Router /admin/modules/bulk-reorder [post]
func (mc *ModuleController) BulkReorder(c *gin.Context) {
	userID, exists := middleware.GetUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
		return
	}

	var req models.BulkReorderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request data",
			"details": err.Error(),
		})
		return
	}

	err := mc.moduleService.BulkReorder(c.Request.Context(), &req, userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Items reordered successfully"})
}
