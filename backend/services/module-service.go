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

	module := &models.Module{
		ID:          primitive.NewObjectID(),
		Name:        req.Name,
		Description: req.Description,
		Content:     req.Content,
		SubModules:  []models.SubModule{},
		IsPublished: false, // Always start as draft
		CreatedAt:   now,
		UpdatedAt:   now,
		CreatedBy:   userID,
		UpdatedBy:   userID,
	}

	// Create submodules if provided
	if len(req.SubModules) > 0 {
		for _, subModuleReq := range req.SubModules {
			subModule := models.SubModule{
				ID:          primitive.NewObjectID(),
				Name:        subModuleReq.Name,
				Description: subModuleReq.Description,
				Content:     subModuleReq.Content,
				IsPublished: false, // Always start as draft
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
	subModule := models.SubModule{
		ID:          primitive.NewObjectID(),
		Name:        req.Name,
		Description: req.Description,
		Content:     req.Content,
		IsPublished: false, // Always start as draft
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
