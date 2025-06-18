package repository

import (
	"context"
	"errors"
	"time"

	"backend/models"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type ModuleRepository interface {
	GetAllModules(ctx context.Context, req *models.GetModulesRequest) ([]models.Module, int64, error)
	GetModuleByID(ctx context.Context, moduleID primitive.ObjectID) (*models.Module, error)
	CreateModule(ctx context.Context, module *models.Module) error
	UpdateModule(ctx context.Context, module *models.Module) error
	DeleteModule(ctx context.Context, moduleID primitive.ObjectID) error
	GetPublishedModules(ctx context.Context, page, limit int) ([]models.Module, int64, error)
	BulkUpdateModuleOrder(ctx context.Context, updates []models.ModuleOrderUpdate) error
}

type moduleRepository struct {
	db               *mongo.Database
	moduleCollection *mongo.Collection
}

func NewModuleRepository(db *mongo.Database) ModuleRepository {
	return &moduleRepository{
		db:               db,
		moduleCollection: db.Collection("modules"),
	}
}

func (r *moduleRepository) GetAllModules(ctx context.Context, req *models.GetModulesRequest) ([]models.Module, int64, error) {
	// Build filter
	filter := bson.M{}

	// Search filter
	if req.Search != "" {
		filter["$or"] = []bson.M{
			{"name": bson.M{"$regex": req.Search, "$options": "i"}},
			{"description": bson.M{"$regex": req.Search, "$options": "i"}},
			{"content": bson.M{"$regex": req.Search, "$options": "i"}},
		}
	}

	// Published filter
	if req.Published != nil {
		filter["is_published"] = *req.Published
	}

	// Count total documents
	total, err := r.moduleCollection.CountDocuments(ctx, filter)
	if err != nil {
		return nil, 0, err
	}

	// Build options for pagination
	opts := options.Find()
	opts.SetSkip(int64((req.Page - 1) * req.Limit))
	opts.SetLimit(int64(req.Limit))
	// Enhanced sorting: primary by order, secondary by created_at
	opts.SetSort(bson.D{
		{Key: "order", Value: 1},      // Sort by order ascending (1, 2, 3...)
		{Key: "created_at", Value: 1}, // Then by created_at ascending (oldest first)
	})

	// Find modules
	cursor, err := r.moduleCollection.Find(ctx, filter, opts)
	if err != nil {
		return nil, 0, err
	}
	defer cursor.Close(ctx)

	var modules []models.Module
	if err = cursor.All(ctx, &modules); err != nil {
		return nil, 0, err
	}

	// Sort submodules within each module by order
	for i := range modules {
		if len(modules[i].SubModules) > 1 {
			// Sort submodules by order, then by created_at
			for j := 0; j < len(modules[i].SubModules)-1; j++ {
				for k := j + 1; k < len(modules[i].SubModules); k++ {
					if modules[i].SubModules[j].Order > modules[i].SubModules[k].Order ||
						(modules[i].SubModules[j].Order == modules[i].SubModules[k].Order &&
							modules[i].SubModules[j].CreatedAt.After(modules[i].SubModules[k].CreatedAt)) {
						modules[i].SubModules[j], modules[i].SubModules[k] = modules[i].SubModules[k], modules[i].SubModules[j]
					}
				}
			}
		}
	}

	return modules, total, nil
}

func (r *moduleRepository) GetModuleByID(ctx context.Context, moduleID primitive.ObjectID) (*models.Module, error) {
	var module models.Module
	err := r.moduleCollection.FindOne(ctx, bson.M{"_id": moduleID}).Decode(&module)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, errors.New("module not found")
		}
		return nil, err
	}
	return &module, nil
}

func (r *moduleRepository) CreateModule(ctx context.Context, module *models.Module) error {
	if module.ID.IsZero() {
		module.ID = primitive.NewObjectID()
	}

	now := time.Now()
	module.CreatedAt = now
	module.UpdatedAt = now

	_, err := r.moduleCollection.InsertOne(ctx, module)
	return err
}

func (r *moduleRepository) UpdateModule(ctx context.Context, module *models.Module) error {
	module.UpdatedAt = time.Now()

	filter := bson.M{"_id": module.ID}
	update := bson.M{"$set": module}

	result, err := r.moduleCollection.UpdateOne(ctx, filter, update)
	if err != nil {
		return err
	}

	if result.MatchedCount == 0 {
		return errors.New("module not found")
	}

	return nil
}

func (r *moduleRepository) DeleteModule(ctx context.Context, moduleID primitive.ObjectID) error {
	result, err := r.moduleCollection.DeleteOne(ctx, bson.M{"_id": moduleID})
	if err != nil {
		return err
	}

	if result.DeletedCount == 0 {
		return errors.New("module not found")
	}

	return nil
}

func (r *moduleRepository) GetPublishedModules(ctx context.Context, page, limit int) ([]models.Module, int64, error) {
	filter := bson.M{"is_published": true}

	// Count total published documents
	total, err := r.moduleCollection.CountDocuments(ctx, filter)
	if err != nil {
		return nil, 0, err
	}

	// Build options for pagination
	opts := options.Find()
	opts.SetSkip(int64((page - 1) * limit))
	opts.SetLimit(int64(limit))
	// Enhanced sorting: primary by order, secondary by created_at
	opts.SetSort(bson.D{
		{Key: "order", Value: 1},      // Sort by order ascending (1, 2, 3...)
		{Key: "created_at", Value: 1}, // Then by created_at ascending (oldest first)
	})

	// Find published modules
	cursor, err := r.moduleCollection.Find(ctx, filter, opts)
	if err != nil {
		return nil, 0, err
	}
	defer cursor.Close(ctx)

	var modules []models.Module
	if err = cursor.All(ctx, &modules); err != nil {
		return nil, 0, err
	}

	// Sort submodules within each module by order (only published ones)
	for i := range modules {
		if len(modules[i].SubModules) > 0 {
			// Filter and sort published submodules
			var publishedSubModules []models.SubModule
			for _, subModule := range modules[i].SubModules {
				if subModule.IsPublished {
					publishedSubModules = append(publishedSubModules, subModule)
				}
			}

			// Sort by order, then by created_at
			for j := 0; j < len(publishedSubModules)-1; j++ {
				for k := j + 1; k < len(publishedSubModules); k++ {
					if publishedSubModules[j].Order > publishedSubModules[k].Order ||
						(publishedSubModules[j].Order == publishedSubModules[k].Order &&
							publishedSubModules[j].CreatedAt.After(publishedSubModules[k].CreatedAt)) {
						publishedSubModules[j], publishedSubModules[k] = publishedSubModules[k], publishedSubModules[j]
					}
				}
			}

			modules[i].SubModules = publishedSubModules
		}
	}

	return modules, total, nil
}

// Add method for bulk order updates
func (r *moduleRepository) BulkUpdateModuleOrder(ctx context.Context, updates []models.ModuleOrderUpdate) error {
	// Start a session for transaction
	session, err := r.db.Client().StartSession()
	if err != nil {
		return err
	}
	defer session.EndSession(ctx)

	// Execute updates in a transaction
	_, err = session.WithTransaction(ctx, func(sc mongo.SessionContext) (interface{}, error) {
		for _, update := range updates {
			filter := bson.M{"_id": update.ModuleID}
			updateDoc := bson.M{
				"$set": bson.M{
					"order":      update.Order,
					"updated_at": time.Now(),
					"updated_by": update.UpdatedBy,
				},
			}

			result, err := r.moduleCollection.UpdateOne(sc, filter, updateDoc)
			if err != nil {
				return nil, err
			}
			if result.MatchedCount == 0 {
				return nil, errors.New("module not found: " + update.ModuleID.Hex())
			}
		}
		return nil, nil
	})

	return err
}
