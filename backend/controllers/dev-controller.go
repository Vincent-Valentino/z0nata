package controllers

import (
	"context"
	"net/http"

	"backend/models"
	"backend/services"

	"github.com/gin-gonic/gin"
)

// DevController provides helper endpoints that are only enabled in development environment.
// These endpoints allow the frontend DevTools panel (and developers) to quickly obtain
// real JWTs for the seeded test accounts without having to hit the regular login form.
//
// NOTE: These routes must only be registered when the server is running in a non-production
// environment to avoid accidental exposure.
type DevController struct {
	userService services.UserService
}

func NewDevController(userService services.UserService) *DevController {
	return &DevController{userService: userService}
}

// loginHelper is a private helper that invokes the normal UserService.Login with the
// supplied credentials and writes a standard JSON response or error.
func (dc *DevController) loginHelper(c *gin.Context, email, password string) {
	req := &models.LoginRequest{
		Email:      email,
		Password:   password,
		RememberMe: true,
	}

	authResp, err := dc.userService.Login(context.Background(), req)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, authResp)
}

// LoginAdmin logs in the seeded admin account and returns JWT tokens.
func (dc *DevController) LoginAdmin(c *gin.Context) {
	dc.loginHelper(c, "william.zonata@admin.com", "admin123")
}

// LoginStudent logs in the seeded mahasiswa (student) account and returns JWT tokens.
func (dc *DevController) LoginStudent(c *gin.Context) {
	dc.loginHelper(c, "vincent.valentino@student.com", "student123")
}

// LoginUser logs in the seeded regular user account and returns JWT tokens.
func (dc *DevController) LoginUser(c *gin.Context) {
	dc.loginHelper(c, "johnny.tester@user.com", "user123")
}
