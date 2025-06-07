package database

import (
	"context"
	"fmt"
	"log"
	"time"

	"backend/models"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func ConnectMongoDB(config models.DatabaseConfig) (*mongo.Database, error) {
	// Set client options
	clientOptions := options.Client().
		ApplyURI(config.URI).
		SetMaxPoolSize(config.MaxPoolSize).
		SetMaxConnIdleTime(30 * time.Minute).
		SetServerSelectionTimeout(5 * time.Second)

	// Connect to MongoDB
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	client, err := mongo.Connect(ctx, clientOptions)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to MongoDB: %w", err)
	}

	// Test the connection
	err = client.Ping(ctx, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to ping MongoDB: %w", err)
	}

	log.Printf("Successfully connected to MongoDB database: %s", config.Name)

	db := client.Database(config.Name)

	// Create indexes
	if err := createIndexes(ctx, db); err != nil {
		log.Printf("Warning: Failed to create indexes: %v", err)
	}

	return db, nil
}

func createIndexes(ctx context.Context, db *mongo.Database) error {
	// Users collection indexes
	usersCollection := db.Collection("users")

	// Email index (unique)
	emailIndex := mongo.IndexModel{
		Keys:    bson.D{{Key: "email", Value: 1}},
		Options: options.Index().SetUnique(true),
	}

	// OAuth ID indexes
	googleIDIndex := mongo.IndexModel{
		Keys:    bson.D{{Key: "google_id", Value: 1}},
		Options: options.Index().SetSparse(true),
	}

	facebookIDIndex := mongo.IndexModel{
		Keys:    bson.D{{Key: "facebook_id", Value: 1}},
		Options: options.Index().SetSparse(true),
	}

	appleIDIndex := mongo.IndexModel{
		Keys:    bson.D{{Key: "apple_id", Value: 1}},
		Options: options.Index().SetSparse(true),
	}

	githubIDIndex := mongo.IndexModel{
		Keys:    bson.D{{Key: "github_id", Value: 1}},
		Options: options.Index().SetSparse(true),
	}

	// Token indexes
	resetTokenIndex := mongo.IndexModel{
		Keys:    bson.D{{Key: "reset_token", Value: 1}},
		Options: options.Index().SetSparse(true),
	}

	verificationTokenIndex := mongo.IndexModel{
		Keys:    bson.D{{Key: "verification_token", Value: 1}},
		Options: options.Index().SetSparse(true),
	}

	refreshTokenIndex := mongo.IndexModel{
		Keys:    bson.D{{Key: "refresh_token", Value: 1}},
		Options: options.Index().SetSparse(true),
	}

	// TTL index for reset token expiry
	resetTokenExpiryIndex := mongo.IndexModel{
		Keys:    bson.D{{Key: "reset_token_expiry", Value: 1}},
		Options: options.Index().SetExpireAfterSeconds(0),
	}

	userIndexes := []mongo.IndexModel{
		emailIndex,
		googleIDIndex,
		facebookIDIndex,
		appleIDIndex,
		githubIDIndex,
		resetTokenIndex,
		verificationTokenIndex,
		refreshTokenIndex,
		resetTokenExpiryIndex,
	}

	_, err := usersCollection.Indexes().CreateMany(ctx, userIndexes)
	if err != nil {
		return fmt.Errorf("failed to create users indexes: %w", err)
	}

	// Mahasiswa collection indexes
	mahasiswaCollection := db.Collection("mahasiswa")

	// Email index (unique)
	mahasiswaEmailIndex := mongo.IndexModel{
		Keys:    bson.D{{Key: "email", Value: 1}},
		Options: options.Index().SetUnique(true),
	}

	// NIM index (unique)
	nimIndex := mongo.IndexModel{
		Keys:    bson.D{{Key: "mahasiswa_id", Value: 1}},
		Options: options.Index().SetUnique(true).SetSparse(true),
	}

	// OAuth ID indexes for mahasiswa
	mahasiswaGoogleIDIndex := mongo.IndexModel{
		Keys:    bson.D{{Key: "google_id", Value: 1}},
		Options: options.Index().SetSparse(true),
	}

	mahasiswaFacebookIDIndex := mongo.IndexModel{
		Keys:    bson.D{{Key: "facebook_id", Value: 1}},
		Options: options.Index().SetSparse(true),
	}

	mahasiswaAppleIDIndex := mongo.IndexModel{
		Keys:    bson.D{{Key: "apple_id", Value: 1}},
		Options: options.Index().SetSparse(true),
	}

	mahasiswaGithubIDIndex := mongo.IndexModel{
		Keys:    bson.D{{Key: "github_id", Value: 1}},
		Options: options.Index().SetSparse(true),
	}

	// Token indexes for mahasiswa
	mahasiswaResetTokenIndex := mongo.IndexModel{
		Keys:    bson.D{{Key: "reset_token", Value: 1}},
		Options: options.Index().SetSparse(true),
	}

	mahasiswaVerificationTokenIndex := mongo.IndexModel{
		Keys:    bson.D{{Key: "verification_token", Value: 1}},
		Options: options.Index().SetSparse(true),
	}

	mahasiswaRefreshTokenIndex := mongo.IndexModel{
		Keys:    bson.D{{Key: "refresh_token", Value: 1}},
		Options: options.Index().SetSparse(true),
	}

	mahasiswaIndexes := []mongo.IndexModel{
		mahasiswaEmailIndex,
		nimIndex,
		mahasiswaGoogleIDIndex,
		mahasiswaFacebookIDIndex,
		mahasiswaAppleIDIndex,
		mahasiswaGithubIDIndex,
		mahasiswaResetTokenIndex,
		mahasiswaVerificationTokenIndex,
		mahasiswaRefreshTokenIndex,
	}

	_, err = mahasiswaCollection.Indexes().CreateMany(ctx, mahasiswaIndexes)
	if err != nil {
		return fmt.Errorf("failed to create mahasiswa indexes: %w", err)
	}

	// Admin collection indexes
	adminCollection := db.Collection("admins")

	// Email index (unique)
	adminEmailIndex := mongo.IndexModel{
		Keys:    bson.D{{Key: "email", Value: 1}},
		Options: options.Index().SetUnique(true),
	}

	// OAuth ID indexes for admin
	adminGoogleIDIndex := mongo.IndexModel{
		Keys:    bson.D{{Key: "google_id", Value: 1}},
		Options: options.Index().SetSparse(true),
	}

	adminFacebookIDIndex := mongo.IndexModel{
		Keys:    bson.D{{Key: "facebook_id", Value: 1}},
		Options: options.Index().SetSparse(true),
	}

	adminAppleIDIndex := mongo.IndexModel{
		Keys:    bson.D{{Key: "apple_id", Value: 1}},
		Options: options.Index().SetSparse(true),
	}

	adminGithubIDIndex := mongo.IndexModel{
		Keys:    bson.D{{Key: "github_id", Value: 1}},
		Options: options.Index().SetSparse(true),
	}

	// Token indexes for admin
	adminResetTokenIndex := mongo.IndexModel{
		Keys:    bson.D{{Key: "reset_token", Value: 1}},
		Options: options.Index().SetSparse(true),
	}

	adminVerificationTokenIndex := mongo.IndexModel{
		Keys:    bson.D{{Key: "verification_token", Value: 1}},
		Options: options.Index().SetSparse(true),
	}

	adminRefreshTokenIndex := mongo.IndexModel{
		Keys:    bson.D{{Key: "refresh_token", Value: 1}},
		Options: options.Index().SetSparse(true),
	}

	adminIndexes := []mongo.IndexModel{
		adminEmailIndex,
		adminGoogleIDIndex,
		adminFacebookIDIndex,
		adminAppleIDIndex,
		adminGithubIDIndex,
		adminResetTokenIndex,
		adminVerificationTokenIndex,
		adminRefreshTokenIndex,
	}

	_, err = adminCollection.Indexes().CreateMany(ctx, adminIndexes)
	if err != nil {
		return fmt.Errorf("failed to create admin indexes: %w", err)
	}

	log.Println("Successfully created MongoDB indexes")
	return nil
}
