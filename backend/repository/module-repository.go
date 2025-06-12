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
	opts.SetSort(bson.D{{Key: "updated_at", Value: -1}}) // Sort by updated_at descending

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
	opts.SetSort(bson.D{{Key: "updated_at", Value: -1}}) // Sort by updated_at descending

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

	return modules, total, nil
}
