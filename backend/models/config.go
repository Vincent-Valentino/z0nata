package models

import "time"

type Config struct {
	Server   ServerConfig   `json:"server"`
	Database DatabaseConfig `json:"database"`
	JWT      JWTConfig      `json:"jwt"`
	OAuth    OAuthConfig    `json:"oauth"`
	Email    EmailConfig    `json:"email"`
}

type ServerConfig struct {
	Port            string        `json:"port" env:"PORT" env-default:"8080"`
	Host            string        `json:"host" env:"HOST" env-default:"localhost"`
	Environment     string        `json:"environment" env:"ENVIRONMENT" env-default:"development"`
	AllowedOrigins  []string      `json:"allowed_origins" env:"ALLOWED_ORIGINS" env-default:"http://localhost:3000"`
	ReadTimeout     time.Duration `json:"read_timeout" env:"READ_TIMEOUT" env-default:"30s"`
	WriteTimeout    time.Duration `json:"write_timeout" env:"WRITE_TIMEOUT" env-default:"30s"`
	ShutdownTimeout time.Duration `json:"shutdown_timeout" env:"SHUTDOWN_TIMEOUT" env-default:"10s"`
}

type DatabaseConfig struct {
	URI         string `json:"uri" env:"MONGO_URI" env-required:"true"`
	Name        string `json:"name" env:"MONGO_DB_NAME" env-default:"quizapp"`
	MaxPoolSize uint64 `json:"max_pool_size" env:"MONGO_MAX_POOL_SIZE" env-default:"100"`
}

type JWTConfig struct {
	SecretKey            string        `json:"secret_key" env:"JWT_SECRET_KEY" env-required:"true"`
	AccessTokenDuration  time.Duration `json:"access_token_duration" env:"JWT_ACCESS_DURATION" env-default:"15m"`
	RefreshTokenDuration time.Duration `json:"refresh_token_duration" env:"JWT_REFRESH_DURATION" env-default:"7d"`
	RememberMeDuration   time.Duration `json:"remember_me_duration" env:"JWT_REMEMBER_DURATION" env-default:"30d"`
}

type OAuthConfig struct {
	Google   OAuthProvider `json:"google"`
	Facebook OAuthProvider `json:"facebook"`
	Apple    OAuthProvider `json:"apple"`
	Github   OAuthProvider `json:"github"`
}

type OAuthProvider struct {
	ClientID     string   `json:"client_id"`
	ClientSecret string   `json:"client_secret"`
	RedirectURL  string   `json:"redirect_url"`
	Scopes       []string `json:"scopes"`
}

type EmailConfig struct {
	SMTPHost     string `json:"smtp_host" env:"SMTP_HOST" env-default:"smtp.gmail.com"`
	SMTPPort     int    `json:"smtp_port" env:"SMTP_PORT" env-default:"587"`
	SMTPUsername string `json:"smtp_username" env:"SMTP_USERNAME" env-required:"true"`
	SMTPPassword string `json:"smtp_password" env:"SMTP_PASSWORD" env-required:"true"`
	FromEmail    string `json:"from_email" env:"FROM_EMAIL" env-required:"true"`
	FromName     string `json:"from_name" env:"FROM_NAME" env-default:"QuizApp"`
}
