package controllers

import (
	"net/http"
	"strconv"

	"backend/middleware"
	"backend/models"
	"backend/services"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type ModuleController struct {
	moduleService services.ModuleService
}

func NewModuleController(moduleService services.ModuleService) *ModuleController {
	return &ModuleController{
		moduleService: moduleService,
	}
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

	err = mc.moduleService.DeleteModule(c.Request.Context(), moduleID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

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

	err = mc.moduleService.DeleteSubModule(c.Request.Context(), moduleID, subModuleID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

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

	c.JSON(http.StatusOK, subModule)
}
