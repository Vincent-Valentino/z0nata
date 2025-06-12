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
	// Load .env file
	err := godotenv.Load()
	if err != nil {
		log.Println("No .env file found or error loading .env file")
	}

	config := models.Config{
		Server: models.ServerConfig{
			Port:        getEnv("PORT", "8080"),
			Host:        getEnv("HOST", "localhost"),
			Environment: getEnv("ENVIRONMENT", "development"),
			AllowedOrigins: getEnvArray("ALLOWED_ORIGINS", []string{
				"http://localhost:3000",
				"http://localhost:3001",
				"https://quizapp.com",
			}),
			ReadTimeout:     getEnvDuration("READ_TIMEOUT", 30*time.Second),
			WriteTimeout:    getEnvDuration("WRITE_TIMEOUT", 30*time.Second),
			ShutdownTimeout: getEnvDuration("SHUTDOWN_TIMEOUT", 10*time.Second),
		},
		Database: models.DatabaseConfig{
			URI:         getEnv("MONGO_URI", "mongodb://localhost:27017"),
			Name:        getEnv("MONGO_DB_NAME", "quizapp"),
			MaxPoolSize: uint64(getEnvInt("MONGO_MAX_POOL_SIZE", 100)),
		},
		JWT: models.JWTConfig{
			SecretKey:            getEnv("JWT_SECRET_KEY", "abubakar"),
			AccessTokenDuration:  getEnvDuration("JWT_ACCESS_DURATION", 15*time.Minute),
			RefreshTokenDuration: getEnvDuration("JWT_REFRESH_DURATION", 7*24*time.Hour),
			RememberMeDuration:   getEnvDuration("JWT_REMEMBER_DURATION", 30*24*time.Hour),
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
			Apple: models.OAuthProvider{
				ClientID:     getEnv("APPLE_CLIENT_ID", ""),
				ClientSecret: getEnv("APPLE_CLIENT_SECRET", ""),
				RedirectURL:  getEnv("APPLE_REDIRECT_URL", ""),
				Scopes:       getEnvArray("APPLE_SCOPES", []string{"name", "email"}),
			},
			Github: models.OAuthProvider{
				ClientID:     getEnv("GITHUB_CLIENT_ID", ""),
				ClientSecret: getEnv("GITHUB_CLIENT_SECRET", ""),
				RedirectURL:  getEnv("GITHUB_REDIRECT_URL", ""),
				Scopes:       getEnvArray("GITHUB_SCOPES", []string{"user:email"}),
			},
		},
		Email: models.EmailConfig{
			SMTPHost:     getEnv("SMTP_HOST", "smtp.gmail.com"),
			SMTPPort:     getEnvInt("SMTP_PORT", 587),
			SMTPUsername: getEnv("SMTP_USERNAME", ""),
			SMTPPassword: getEnv("SMTP_PASSWORD", ""),
			FromEmail:    getEnv("FROM_EMAIL", ""),
			FromName:     getEnv("FROM_NAME", "QuizApp"),
		},
	}

	return config
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
