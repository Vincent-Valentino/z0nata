package config

import (
	"log"
	"os"
	"strconv"
	"strings"
	"time"

	"backend/models"

	"github.com/joho/godotenv"
)

func LoadConfig() models.Config {
	// Try to load .env file from multiple possible locations
	envPaths := []string{
		".env",         // Current directory (for local development)
		"../.env",      // Parent directory (for Docker context)
		"backend/.env", // Backend subdirectory (alternative)
	}

	envLoaded := false
	for _, path := range envPaths {
		if err := godotenv.Load(path); err == nil {
			log.Printf("Loaded environment variables from: %s", path)
			envLoaded = true
			break
		}
	}

	if !envLoaded {
		log.Println("No .env file found in any expected location, using system environment variables")
	}

	// MongoDB Atlas configuration with fallback support
	mongoURI := getEnvWithFallback("MONGODB_URI", "MONGO_URI", "")
	if mongoURI == "" {
		log.Fatal("MONGODB_URI (or MONGO_URI) environment variable is required for MongoDB Atlas connection")
	}

	// Validate that it's an Atlas connection string
	if !strings.Contains(mongoURI, "mongodb+srv://") && !strings.Contains(mongoURI, "mongodb.net") {
		log.Println("Warning: MongoDB URI doesn't appear to be a MongoDB Atlas connection string")
	}

	config := models.Config{
		Server: models.ServerConfig{
			Port:        getEnvWithFallback("SERVER_PORT", "PORT", "8080"),
			Host:        getEnvWithFallback("SERVER_HOST", "HOST", "localhost"),
			Environment: getEnvWithFallback("SERVER_ENVIRONMENT", "ENVIRONMENT", "development"),
			AllowedOrigins: getEnvArray("ALLOWED_ORIGINS", []string{
				"http://localhost:5173",
				"http://127.0.0.1:5173",
			}),
			ReadTimeout:     getEnvDurationWithFallback("SERVER_READ_TIMEOUT", "READ_TIMEOUT", 30*time.Second),
			WriteTimeout:    getEnvDurationWithFallback("SERVER_WRITE_TIMEOUT", "WRITE_TIMEOUT", 30*time.Second),
			ShutdownTimeout: getEnvDurationWithFallback("SERVER_SHUTDOWN_TIMEOUT", "SHUTDOWN_TIMEOUT", 10*time.Second),
		},
		Database: models.DatabaseConfig{
			URI:         mongoURI,
			Name:        getEnvWithFallback("MONGODB_DATABASE", "MONGO_DB_NAME", "z0nata"),
			MaxPoolSize: uint64(getEnvIntWithFallback("MONGODB_MAX_POOL_SIZE", "MONGO_MAX_POOL_SIZE", 100)),
		},
		JWT: models.JWTConfig{
			SecretKey:            getEnvRequiredWithFallback("JWT_SECRET", "JWT_SECRET_KEY"),
			AccessTokenDuration:  getEnvDurationWithFallback("JWT_ACCESS_TOKEN_EXPIRY", "JWT_ACCESS_DURATION", 15*time.Minute),
			RefreshTokenDuration: getEnvDurationWithFallback("JWT_REFRESH_TOKEN_EXPIRY", "JWT_REFRESH_DURATION", 168*time.Hour),
			RememberMeDuration:   getEnvDurationWithFallback("JWT_REFRESH_TOKEN_EXPIRY", "JWT_REMEMBER_DURATION", 168*time.Hour),
		},
		OAuth: models.OAuthConfig{
			Google: models.OAuthProvider{
				ClientID:     getEnv("GOOGLE_CLIENT_ID", ""),
				ClientSecret: getEnv("GOOGLE_CLIENT_SECRET", ""),
				RedirectURL:  getEnv("GOOGLE_REDIRECT_URL", ""),
				Scopes:       getEnvArray("GOOGLE_SCOPES", []string{"openid", "profile", "email"}),
			},
			Facebook: models.OAuthProvider{
				ClientID:     getEnv("FACEBOOK_CLIENT_ID", ""),
				ClientSecret: getEnv("FACEBOOK_CLIENT_SECRET", ""),
				RedirectURL:  getEnv("FACEBOOK_REDIRECT_URL", ""),
				Scopes:       getEnvArray("FACEBOOK_SCOPES", []string{"email", "public_profile"}),
			},
			X: models.OAuthProvider{
				ClientID:     getEnvWithFallback("X_CLIENT_ID", "TWITTER_CLIENT_ID", ""),
				ClientSecret: getEnvWithFallback("X_CLIENT_SECRET", "TWITTER_CLIENT_SECRET", ""),
				RedirectURL:  getEnv("X_REDIRECT_URL", ""),
				Scopes:       getEnvArray("X_SCOPES", []string{"tweet.read", "users.read"}),
			},
			Github: models.OAuthProvider{
				ClientID:     getEnv("GITHUB_CLIENT_ID", ""),
				ClientSecret: getEnv("GITHUB_CLIENT_SECRET", ""),
				RedirectURL:  getEnv("GITHUB_REDIRECT_URL", ""),
				Scopes:       getEnvArray("GITHUB_SCOPES", []string{"user:email"}),
			},
		},
		Email: models.EmailConfig{
			SMTPHost:     getEnvWithFallback("EMAIL_SMTP_HOST", "SMTP_HOST", "smtp.gmail.com"),
			SMTPPort:     getEnvIntWithFallback("EMAIL_SMTP_PORT", "SMTP_PORT", 587),
			SMTPUsername: getEnvWithFallback("EMAIL_USERNAME", "SMTP_USERNAME", ""),
			SMTPPassword: getEnvWithFallback("EMAIL_PASSWORD", "SMTP_PASSWORD", ""),
			FromEmail:    getEnvWithFallback("EMAIL_FROM_ADDRESS", "FROM_EMAIL", "noreply@quizapp.com"),
			FromName:     getEnvWithFallback("EMAIL_FROM_NAME", "FROM_NAME", "QuizApp Team"),
		},
	}

	return config
}

// Helper functions with fallback support for backward compatibility
func getEnvWithFallback(key, fallbackKey, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	if value := os.Getenv(fallbackKey); value != "" {
		return value
	}
	return defaultValue
}

func getEnvRequiredWithFallback(key, fallbackKey string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	if value := os.Getenv(fallbackKey); value != "" {
		return value
	}
	log.Fatalf("Required environment variable %s (or %s) is not set", key, fallbackKey)
	return ""
}

func getEnvIntWithFallback(key, fallbackKey string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if intValue, err := strconv.Atoi(value); err == nil {
			return intValue
		}
		log.Printf("Invalid integer value for %s: %s, using default: %d", key, value, defaultValue)
	}
	if value := os.Getenv(fallbackKey); value != "" {
		if intValue, err := strconv.Atoi(value); err == nil {
			return intValue
		}
		log.Printf("Invalid integer value for %s: %s, using default: %d", fallbackKey, value, defaultValue)
	}
	return defaultValue
}

func getEnvDurationWithFallback(key, fallbackKey string, defaultValue time.Duration) time.Duration {
	if value := os.Getenv(key); value != "" {
		if duration, err := time.ParseDuration(value); err == nil {
			return duration
		}
		log.Printf("Invalid duration value for %s: %s, using default: %v", key, value, defaultValue)
	}
	if value := os.Getenv(fallbackKey); value != "" {
		if duration, err := time.ParseDuration(value); err == nil {
			return duration
		}
		log.Printf("Invalid duration value for %s: %s, using default: %v", fallbackKey, value, defaultValue)
	}
	return defaultValue
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvRequired(key string) string {
	value := os.Getenv(key)
	if value == "" {
		log.Fatalf("Required environment variable %s is not set", key)
	}
	return value
}

func getEnvInt(key string, defaultValue int) int {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}

	intValue, err := strconv.Atoi(value)
	if err != nil {
		log.Printf("Invalid integer value for %s: %s, using default: %d", key, value, defaultValue)
		return defaultValue
	}

	return intValue
}

func getEnvDuration(key string, defaultValue time.Duration) time.Duration {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}

	duration, err := time.ParseDuration(value)
	if err != nil {
		log.Printf("Invalid duration value for %s: %s, using default: %v", key, value, defaultValue)
		return defaultValue
	}

	return duration
}

func getEnvArray(key string, defaultValue []string) []string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}

	return strings.Split(value, ",")
}
