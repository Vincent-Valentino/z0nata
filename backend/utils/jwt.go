package utils

import (
	"errors"
	"time"

	"backend/models"

	"github.com/golang-jwt/jwt/v5"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Claims struct {
	UserID   string `json:"user_id"`
	Email    string `json:"email"`
	UserType string `json:"user_type"` // "mahasiswa", "admin", "user"
	IsAdmin  bool   `json:"is_admin"`
	jwt.RegisteredClaims
}

type JWTManager struct {
	secretKey            string
	accessTokenDuration  time.Duration
	refreshTokenDuration time.Duration
	rememberMeDuration   time.Duration
}

func NewJWTManager(config models.JWTConfig) *JWTManager {
	return &JWTManager{
		secretKey:            config.SecretKey,
		accessTokenDuration:  config.AccessTokenDuration,
		refreshTokenDuration: config.RefreshTokenDuration,
		rememberMeDuration:   config.RememberMeDuration,
	}
}

func (j *JWTManager) GenerateAccessToken(userID primitive.ObjectID, email, userType string, isAdmin bool) (string, error) {
	claims := Claims{
		UserID:   userID.Hex(),
		Email:    email,
		UserType: userType,
		IsAdmin:  isAdmin,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(j.accessTokenDuration)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
			Subject:   userID.Hex(),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(j.secretKey))
}

func (j *JWTManager) GenerateRefreshToken(userID primitive.ObjectID, email string, rememberMe bool) (string, error) {
	duration := j.refreshTokenDuration
	if rememberMe {
		duration = j.rememberMeDuration
	}

	claims := Claims{
		UserID: userID.Hex(),
		Email:  email,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(duration)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
			Subject:   userID.Hex(),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(j.secretKey))
}

func (j *JWTManager) ValidateToken(tokenString string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return []byte(j.secretKey), nil
	})

	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(*Claims); ok && token.Valid {
		return claims, nil
	}

	return nil, errors.New("invalid token")
}

func (j *JWTManager) GetTokenExpiry(rememberMe bool) time.Duration {
	if rememberMe {
		return j.rememberMeDuration
	}
	return j.refreshTokenDuration
}

func (j *JWTManager) GetAccessTokenExpiry() time.Duration {
	return j.accessTokenDuration
}
