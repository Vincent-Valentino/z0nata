package middleware

import (
	"net/http"
	"strings"

	"backend/utils"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type AuthMiddleware struct {
	jwtManager *utils.JWTManager
}

func NewAuthMiddleware(jwtManager *utils.JWTManager) *AuthMiddleware {
	return &AuthMiddleware{
		jwtManager: jwtManager,
	}
}

// RequireAuth validates JWT token and sets user context
func (a *AuthMiddleware) RequireAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Authorization header required",
			})
			c.Abort()
			return
		}

		// Extract token from "Bearer <token>"
		tokenParts := strings.Split(authHeader, " ")
		if len(tokenParts) != 2 || tokenParts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Invalid authorization header format",
			})
			c.Abort()
			return
		}

		token := tokenParts[1]

		// Validate token
		claims, err := a.jwtManager.ValidateToken(token)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Invalid token",
			})
			c.Abort()
			return
		}

		// Convert user ID to ObjectID
		userID, err := primitive.ObjectIDFromHex(claims.UserID)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Invalid user ID",
			})
			c.Abort()
			return
		}

		// Set user context
		c.Set("userID", userID)
		c.Set("userEmail", claims.Email)
		c.Set("userType", claims.UserType)
		c.Set("isAdmin", claims.IsAdmin)

		c.Next()
	}
}

// RequireAdmin requires admin privileges
func (a *AuthMiddleware) RequireAdmin() gin.HandlerFunc {
	return func(c *gin.Context) {
		isAdmin, exists := c.Get("isAdmin")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Authentication required",
			})
			c.Abort()
			return
		}

		if !isAdmin.(bool) {
			c.JSON(http.StatusForbidden, gin.H{
				"error": "Admin privileges required",
			})
			c.Abort()
			return
		}

		c.Next()
	}
}

// RequireMahasiswa requires mahasiswa user type
func (a *AuthMiddleware) RequireMahasiswa() gin.HandlerFunc {
	return func(c *gin.Context) {
		userType, exists := c.Get("userType")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Authentication required",
			})
			c.Abort()
			return
		}

		if userType.(string) != "mahasiswa" {
			c.JSON(http.StatusForbidden, gin.H{
				"error": "Mahasiswa privileges required",
			})
			c.Abort()
			return
		}

		c.Next()
	}
}

// RequireUserType requires specific user type
func (a *AuthMiddleware) RequireUserType(allowedTypes ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		userType, exists := c.Get("userType")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Authentication required",
			})
			c.Abort()
			return
		}

		currentUserType := userType.(string)
		for _, allowedType := range allowedTypes {
			if currentUserType == allowedType {
				c.Next()
				return
			}
		}

		c.JSON(http.StatusForbidden, gin.H{
			"error": "Insufficient privileges",
		})
		c.Abort()
	}
}

// OptionalAuth validates token if present but doesn't require it
func (a *AuthMiddleware) OptionalAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.Next()
			return
		}

		// Extract token from "Bearer <token>"
		tokenParts := strings.Split(authHeader, " ")
		if len(tokenParts) != 2 || tokenParts[0] != "Bearer" {
			c.Next()
			return
		}

		token := tokenParts[1]

		// Validate token
		claims, err := a.jwtManager.ValidateToken(token)
		if err != nil {
			c.Next()
			return
		}

		// Convert user ID to ObjectID
		userID, err := primitive.ObjectIDFromHex(claims.UserID)
		if err != nil {
			c.Next()
			return
		}

		// Set user context
		c.Set("userID", userID)
		c.Set("userEmail", claims.Email)
		c.Set("userType", claims.UserType)
		c.Set("isAdmin", claims.IsAdmin)

		c.Next()
	}
}

// GetUserID helper function to get user ID from context
func GetUserID(c *gin.Context) (primitive.ObjectID, bool) {
	userID, exists := c.Get("userID")
	if !exists {
		return primitive.NilObjectID, false
	}
	return userID.(primitive.ObjectID), true
}

// GetUserEmail helper function to get user email from context
func GetUserEmail(c *gin.Context) (string, bool) {
	email, exists := c.Get("userEmail")
	if !exists {
		return "", false
	}
	return email.(string), true
}

// GetUserType helper function to get user type from context
func GetUserType(c *gin.Context) (string, bool) {
	userType, exists := c.Get("userType")
	if !exists {
		return "", false
	}
	return userType.(string), true
}

// IsAdmin helper function to check if user is admin
func IsAdmin(c *gin.Context) bool {
	isAdmin, exists := c.Get("isAdmin")
	if !exists {
		return false
	}
	return isAdmin.(bool)
}
