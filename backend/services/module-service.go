package services

import (
	"context"
	"fmt"
	"time"

	"backend/models"
	"backend/repository"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type ModuleService interface {
	GetAllModules(ctx context.Context, req *models.GetModulesRequest) (*models.GetModulesResponse, error)
	GetModuleByID(ctx context.Context, moduleID primitive.ObjectID) (*models.Module, error)
	CreateModule(ctx context.Context, req *models.CreateModuleRequest, userID primitive.ObjectID) (*models.Module, error)
	UpdateModule(ctx context.Context, moduleID primitive.ObjectID, req *models.UpdateModuleRequest, userID primitive.ObjectID) (*models.Module, error)
	DeleteModule(ctx context.Context, moduleID primitive.ObjectID) error
	ToggleModulePublication(ctx context.Context, moduleID primitive.ObjectID, published bool, userID primitive.ObjectID) (*models.Module, error)
	ReorderModules(ctx context.Context, moduleIDs []string, userID primitive.ObjectID) error
	ReorderSubModules(ctx context.Context, moduleID primitive.ObjectID, subModuleIDs []string, userID primitive.ObjectID) error
	BulkReorder(ctx context.Context, req *models.BulkReorderRequest, userID primitive.ObjectID) error

	// SubModule methods
	CreateSubModule(ctx context.Context, moduleID primitive.ObjectID, req *models.CreateSubModuleRequest, userID primitive.ObjectID) (*models.SubModule, error)
	UpdateSubModule(ctx context.Context, moduleID primitive.ObjectID, subModuleID primitive.ObjectID, req *models.CreateSubModuleRequest, userID primitive.ObjectID) (*models.SubModule, error)
	DeleteSubModule(ctx context.Context, moduleID primitive.ObjectID, subModuleID primitive.ObjectID) error
	ToggleSubModulePublication(ctx context.Context, moduleID primitive.ObjectID, subModuleID primitive.ObjectID, published bool, userID primitive.ObjectID) (*models.SubModule, error)
}

type moduleService struct {
	moduleRepo repository.ModuleRepository
}

func NewModuleService(moduleRepo repository.ModuleRepository) ModuleService {
	return &moduleService{
		moduleRepo: moduleRepo,
	}
}

func (s *moduleService) GetAllModules(ctx context.Context, req *models.GetModulesRequest) (*models.GetModulesResponse, error) {
	// Set defaults
	if req.Page < 1 {
		req.Page = 1
	}
	if req.Limit < 1 {
		req.Limit = 10
	}
	if req.Limit > 100 {
		req.Limit = 100
	}

	modules, total, err := s.moduleRepo.GetAllModules(ctx, req)
	if err != nil {
		return nil, fmt.Errorf("failed to get modules: %w", err)
	}

	totalPages := int(total) / req.Limit
	if int(total)%req.Limit > 0 {
		totalPages++
	}

	return &models.GetModulesResponse{
		Modules:    modules,
		Total:      total,
		Page:       req.Page,
		Limit:      req.Limit,
		TotalPages: totalPages,
	}, nil
}

func (s *moduleService) GetModuleByID(ctx context.Context, moduleID primitive.ObjectID) (*models.Module, error) {
	module, err := s.moduleRepo.GetModuleByID(ctx, moduleID)
	if err != nil {
		return nil, fmt.Errorf("module not found: %w", err)
	}

	return module, nil
}

func (s *moduleService) CreateModule(ctx context.Context, req *models.CreateModuleRequest, userID primitive.ObjectID) (*models.Module, error) {
	now := time.Now()

	// If no order specified, set it to a high value (will be auto-ordered by creation time)
	order := req.Order
	if order == 0 {
		// Get the count of existing modules to set default order
		// This ensures new modules without explicit order go to the end
		allModules, _, err := s.moduleRepo.GetAllModules(ctx, &models.GetModulesRequest{Page: 1, Limit: 1000})
		if err == nil {
			order = len(allModules) + 1
		} else {
			order = 999 // Fallback if query fails
		}
	}

	module := &models.Module{
		ID:          primitive.NewObjectID(),
		Name:        req.Name,
		Description: req.Description,
		Content:     req.Content,
		SubModules:  []models.SubModule{},
		IsPublished: false, // Always start as draft
		Order:       order,
		CreatedAt:   now,
		UpdatedAt:   now,
		CreatedBy:   userID,
		UpdatedBy:   userID,
	}

	// Create submodules if provided
	if len(req.SubModules) > 0 {
		for i, subModuleReq := range req.SubModules {
			subModuleOrder := subModuleReq.Order
			if subModuleOrder == 0 {
				subModuleOrder = i + 1 // Auto-order submodules 1, 2, 3...
			}

			subModule := models.SubModule{
				ID:          primitive.NewObjectID(),
				Name:        subModuleReq.Name,
				Description: subModuleReq.Description,
				Content:     subModuleReq.Content,
				IsPublished: false, // Always start as draft
				Order:       subModuleOrder,
				CreatedAt:   now,
				UpdatedAt:   now,
				CreatedBy:   userID,
				UpdatedBy:   userID,
			}
			module.SubModules = append(module.SubModules, subModule)
		}
	}

	if err := s.moduleRepo.CreateModule(ctx, module); err != nil {
		return nil, fmt.Errorf("failed to create module: %w", err)
	}

	return module, nil
}

func (s *moduleService) UpdateModule(ctx context.Context, moduleID primitive.ObjectID, req *models.UpdateModuleRequest, userID primitive.ObjectID) (*models.Module, error) {
	// Get existing module
	module, err := s.moduleRepo.GetModuleByID(ctx, moduleID)
	if err != nil {
		return nil, fmt.Errorf("module not found: %w", err)
	}

	// Update fields if provided
	if req.Name != nil {
		module.Name = *req.Name
	}
	if req.Description != nil {
		module.Description = *req.Description
	}
	if req.Content != nil {
		module.Content = *req.Content
	}
	if req.Order != nil {
		module.Order = *req.Order
	}
	if req.SubModules != nil {
		module.SubModules = req.SubModules
	}

	module.UpdatedAt = time.Now()
	module.UpdatedBy = userID

	if err := s.moduleRepo.UpdateModule(ctx, module); err != nil {
		return nil, fmt.Errorf("failed to update module: %w", err)
	}

	return module, nil
}

func (s *moduleService) DeleteModule(ctx context.Context, moduleID primitive.ObjectID) error {
	if err := s.moduleRepo.DeleteModule(ctx, moduleID); err != nil {
		return fmt.Errorf("failed to delete module: %w", err)
	}
	return nil
}

func (s *moduleService) ToggleModulePublication(ctx context.Context, moduleID primitive.ObjectID, published bool, userID primitive.ObjectID) (*models.Module, error) {
	module, err := s.moduleRepo.GetModuleByID(ctx, moduleID)
	if err != nil {
		return nil, fmt.Errorf("module not found: %w", err)
	}

	module.IsPublished = published
	module.UpdatedAt = time.Now()
	module.UpdatedBy = userID

	if err := s.moduleRepo.UpdateModule(ctx, module); err != nil {
		return nil, fmt.Errorf("failed to update module publication status: %w", err)
	}

	return module, nil
}

// SubModule methods

func (s *moduleService) CreateSubModule(ctx context.Context, moduleID primitive.ObjectID, req *models.CreateSubModuleRequest, userID primitive.ObjectID) (*models.SubModule, error) {
	module, err := s.moduleRepo.GetModuleByID(ctx, moduleID)
	if err != nil {
		return nil, fmt.Errorf("module not found: %w", err)
	}

	now := time.Now()

	// If no order specified, set it to be after existing submodules
	order := req.Order
	if order == 0 {
		order = len(module.SubModules) + 1
	}

	subModule := models.SubModule{
		ID:          primitive.NewObjectID(),
		Name:        req.Name,
		Description: req.Description,
		Content:     req.Content,
		IsPublished: false, // Always start as draft
		Order:       order,
		CreatedAt:   now,
		UpdatedAt:   now,
		CreatedBy:   userID,
		UpdatedBy:   userID,
	}

	module.SubModules = append(module.SubModules, subModule)
	module.UpdatedAt = now
	module.UpdatedBy = userID

	if err := s.moduleRepo.UpdateModule(ctx, module); err != nil {
		return nil, fmt.Errorf("failed to create submodule: %w", err)
	}

	return &subModule, nil
}

func (s *moduleService) UpdateSubModule(ctx context.Context, moduleID primitive.ObjectID, subModuleID primitive.ObjectID, req *models.CreateSubModuleRequest, userID primitive.ObjectID) (*models.SubModule, error) {
	module, err := s.moduleRepo.GetModuleByID(ctx, moduleID)
	if err != nil {
		return nil, fmt.Errorf("module not found: %w", err)
	}

	// Find the submodule
	var subModuleIndex = -1
	for i, subModule := range module.SubModules {
		if subModule.ID == subModuleID {
			subModuleIndex = i
			break
		}
	}

	if subModuleIndex == -1 {
		return nil, fmt.Errorf("submodule not found")
	}

	// Update submodule
	module.SubModules[subModuleIndex].Name = req.Name
	module.SubModules[subModuleIndex].Description = req.Description
	module.SubModules[subModuleIndex].Content = req.Content
	if req.Order != 0 {
		module.SubModules[subModuleIndex].Order = req.Order
	}
	module.SubModules[subModuleIndex].UpdatedAt = time.Now()
	module.SubModules[subModuleIndex].UpdatedBy = userID

	module.UpdatedAt = time.Now()
	module.UpdatedBy = userID

	if err := s.moduleRepo.UpdateModule(ctx, module); err != nil {
		return nil, fmt.Errorf("failed to update submodule: %w", err)
	}

	return &module.SubModules[subModuleIndex], nil
}

func (s *moduleService) DeleteSubModule(ctx context.Context, moduleID primitive.ObjectID, subModuleID primitive.ObjectID) error {
	module, err := s.moduleRepo.GetModuleByID(ctx, moduleID)
	if err != nil {
		return fmt.Errorf("module not found: %w", err)
	}

	// Find and remove the submodule
	var newSubModules []models.SubModule
	found := false
	for _, subModule := range module.SubModules {
		if subModule.ID != subModuleID {
			newSubModules = append(newSubModules, subModule)
		} else {
			found = true
		}
	}

	if !found {
		return fmt.Errorf("submodule not found")
	}

	module.SubModules = newSubModules
	module.UpdatedAt = time.Now()

	if err := s.moduleRepo.UpdateModule(ctx, module); err != nil {
		return fmt.Errorf("failed to delete submodule: %w", err)
	}

	return nil
}

func (s *moduleService) ToggleSubModulePublication(ctx context.Context, moduleID primitive.ObjectID, subModuleID primitive.ObjectID, published bool, userID primitive.ObjectID) (*models.SubModule, error) {
	module, err := s.moduleRepo.GetModuleByID(ctx, moduleID)
	if err != nil {
		return nil, fmt.Errorf("module not found: %w", err)
	}

	// Find the submodule
	var subModuleIndex = -1
	for i, subModule := range module.SubModules {
		if subModule.ID == subModuleID {
			subModuleIndex = i
			break
		}
	}

	if subModuleIndex == -1 {
		return nil, fmt.Errorf("submodule not found")
	}

	module.SubModules[subModuleIndex].IsPublished = published
	module.SubModules[subModuleIndex].UpdatedAt = time.Now()
	module.SubModules[subModuleIndex].UpdatedBy = userID

	module.UpdatedAt = time.Now()
	module.UpdatedBy = userID

	if err := s.moduleRepo.UpdateModule(ctx, module); err != nil {
		return nil, fmt.Errorf("failed to update submodule publication status: %w", err)
	}

	return &module.SubModules[subModuleIndex], nil
}

func (s *moduleService) ReorderModules(ctx context.Context, moduleIDs []string, userID primitive.ObjectID) error {
	for i, moduleIDStr := range moduleIDs {
		moduleID, err := primitive.ObjectIDFromHex(moduleIDStr)
		if err != nil {
			return fmt.Errorf("invalid module ID %s: %w", moduleIDStr, err)
		}

		module, err := s.moduleRepo.GetModuleByID(ctx, moduleID)
		if err != nil {
			return fmt.Errorf("module not found %s: %w", moduleIDStr, err)
		}

		// Update order to match position in array (1-based)
		module.Order = i + 1
		module.UpdatedAt = time.Now()
		module.UpdatedBy = userID

		if err := s.moduleRepo.UpdateModule(ctx, module); err != nil {
			return fmt.Errorf("failed to update module order %s: %w", moduleIDStr, err)
		}
	}

	return nil
}

func (s *moduleService) ReorderSubModules(ctx context.Context, moduleID primitive.ObjectID, subModuleIDs []string, userID primitive.ObjectID) error {
	module, err := s.moduleRepo.GetModuleByID(ctx, moduleID)
	if err != nil {
		return fmt.Errorf("module not found: %w", err)
	}

	// Create a map for quick lookup of submodules
	subModuleMap := make(map[string]*models.SubModule)
	for i := range module.SubModules {
		subModuleMap[module.SubModules[i].ID.Hex()] = &module.SubModules[i]
	}

	// Reorder submodules according to the provided IDs
	var reorderedSubModules []models.SubModule
	for i, subModuleIDStr := range subModuleIDs {
		subModule, exists := subModuleMap[subModuleIDStr]
		if !exists {
			return fmt.Errorf("submodule not found: %s", subModuleIDStr)
		}

		// Update order to match position in array (1-based)
		subModule.Order = i + 1
		subModule.UpdatedAt = time.Now()
		subModule.UpdatedBy = userID

		reorderedSubModules = append(reorderedSubModules, *subModule)
	}

	// Update module with reordered submodules
	module.SubModules = reorderedSubModules
	module.UpdatedAt = time.Now()
	module.UpdatedBy = userID

	if err := s.moduleRepo.UpdateModule(ctx, module); err != nil {
		return fmt.Errorf("failed to update submodule order: %w", err)
	}

	return nil
}

func (s *moduleService) BulkReorder(ctx context.Context, req *models.BulkReorderRequest, userID primitive.ObjectID) error {
	// Handle module reordering
	if len(req.ModuleUpdates) > 0 {
		// Add user ID to each update
		for i := range req.ModuleUpdates {
			req.ModuleUpdates[i].UpdatedBy = userID
		}

		if err := s.moduleRepo.BulkUpdateModuleOrder(ctx, req.ModuleUpdates); err != nil {
			return fmt.Errorf("failed to bulk update module order: %w", err)
		}
	}

	// Handle submodule reordering
	if len(req.SubModuleUpdates) > 0 {
		// Group submodule updates by parent module
		moduleSubModules := make(map[primitive.ObjectID][]models.SubModuleOrderUpdate)

		for _, update := range req.SubModuleUpdates {
			// We need to find the parent module for each submodule
			// This requires querying each module to find which one contains the submodule
			modules, _, err := s.moduleRepo.GetAllModules(ctx, &models.GetModulesRequest{Page: 1, Limit: 1000})
			if err != nil {
				return fmt.Errorf("failed to get modules for submodule reordering: %w", err)
			}

			var parentModuleID primitive.ObjectID
			for _, module := range modules {
				for _, subModule := range module.SubModules {
					if subModule.ID == update.SubModuleID {
						parentModuleID = module.ID
						break
					}
				}
				if !parentModuleID.IsZero() {
					break
				}
			}

			if parentModuleID.IsZero() {
				return fmt.Errorf("parent module not found for submodule: %s", update.SubModuleID.Hex())
			}

			moduleSubModules[parentModuleID] = append(moduleSubModules[parentModuleID], update)
		}

		// Update each module's submodules
		for moduleID, subModuleUpdates := range moduleSubModules {
			module, err := s.moduleRepo.GetModuleByID(ctx, moduleID)
			if err != nil {
				return fmt.Errorf("failed to get module %s: %w", moduleID.Hex(), err)
			}

			// Update submodule orders
			for _, update := range subModuleUpdates {
				for i := range module.SubModules {
					if module.SubModules[i].ID == update.SubModuleID {
						module.SubModules[i].Order = update.Order
						module.SubModules[i].UpdatedAt = time.Now()
						module.SubModules[i].UpdatedBy = userID
						break
					}
				}
			}

			module.UpdatedAt = time.Now()
			module.UpdatedBy = userID

			if err := s.moduleRepo.UpdateModule(ctx, module); err != nil {
				return fmt.Errorf("failed to update module %s with reordered submodules: %w", moduleID.Hex(), err)
			}
		}
	}

	return nil
}
