package services

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"strings"
	"time"

	"backend/models"
	"backend/repository"
	"backend/utils"

	"go.mongodb.org/mongo-driver/bson/primitive"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/facebook"
	"golang.org/x/oauth2/github"
	"golang.org/x/oauth2/google"
)

type UserService interface {
	Register(ctx context.Context, req *models.RegisterRequest) (*models.AuthResponse, error)
	Login(ctx context.Context, req *models.LoginRequest) (*models.AuthResponse, error)
	RefreshToken(ctx context.Context, req *models.RefreshTokenRequest) (*models.AuthResponse, error)
	Logout(ctx context.Context, userID primitive.ObjectID) error
	GetProfile(ctx context.Context, userID primitive.ObjectID) (interface{}, error)
	UpdateProfile(ctx context.Context, userID primitive.ObjectID, updates map[string]interface{}) error
	ChangePassword(ctx context.Context, userID primitive.ObjectID, req *models.ChangePasswordRequest) error
	RequestPasswordReset(ctx context.Context, req *models.PasswordResetRequest) error
	ResetPassword(ctx context.Context, req *models.PasswordResetConfirm) error
	OAuthLogin(ctx context.Context, req *models.OAuthRequest) (*models.AuthResponse, error)
	GetOAuthURL(provider, userType string) (string, error)
	VerifyEmail(ctx context.Context, token string) error
	ResendVerification(ctx context.Context, email string) error
}

type userService struct {
	userRepo     repository.UserRepository
	jwtManager   *utils.JWTManager
	emailService *utils.EmailService
	config       models.Config
	oauthConfigs map[string]*oauth2.Config
}

func NewUserService(
	userRepo repository.UserRepository,
	jwtManager *utils.JWTManager,
	emailService *utils.EmailService,
	config models.Config,
) UserService {
	service := &userService{
		userRepo:     userRepo,
		jwtManager:   jwtManager,
		emailService: emailService,
		config:       config,
		oauthConfigs: make(map[string]*oauth2.Config),
	}

	// Initialize OAuth configs
	service.initOAuthConfigs()
	return service
}

func (s *userService) initOAuthConfigs() {
	// Google OAuth
	s.oauthConfigs["google"] = &oauth2.Config{
		ClientID:     s.config.OAuth.Google.ClientID,
		ClientSecret: s.config.OAuth.Google.ClientSecret,
		RedirectURL:  s.config.OAuth.Google.RedirectURL,
		Scopes:       s.config.OAuth.Google.Scopes,
		Endpoint:     google.Endpoint,
	}

	// Facebook OAuth
	s.oauthConfigs["facebook"] = &oauth2.Config{
		ClientID:     s.config.OAuth.Facebook.ClientID,
		ClientSecret: s.config.OAuth.Facebook.ClientSecret,
		RedirectURL:  s.config.OAuth.Facebook.RedirectURL,
		Scopes:       s.config.OAuth.Facebook.Scopes,
		Endpoint:     facebook.Endpoint,
	}

	// Apple OAuth (custom endpoint since golang.org/x/oauth2/apple doesn't exist)
	s.oauthConfigs["apple"] = &oauth2.Config{
		ClientID:     s.config.OAuth.Apple.ClientID,
		ClientSecret: s.config.OAuth.Apple.ClientSecret,
		RedirectURL:  s.config.OAuth.Apple.RedirectURL,
		Scopes:       s.config.OAuth.Apple.Scopes,
		Endpoint: oauth2.Endpoint{
			AuthURL:  "https://appleid.apple.com/auth/authorize",
			TokenURL: "https://appleid.apple.com/auth/token",
		},
	}

	// GitHub OAuth
	s.oauthConfigs["github"] = &oauth2.Config{
		ClientID:     s.config.OAuth.Github.ClientID,
		ClientSecret: s.config.OAuth.Github.ClientSecret,
		RedirectURL:  s.config.OAuth.Github.RedirectURL,
		Scopes:       s.config.OAuth.Github.Scopes,
		Endpoint:     github.Endpoint,
	}
}

func (s *userService) Register(ctx context.Context, req *models.RegisterRequest) (*models.AuthResponse, error) {
	// Check if user already exists
	existing, _ := s.userRepo.GetByEmail(ctx, req.Email)
	if existing != nil {
		return nil, errors.New("user with this email already exists")
	}

	// Hash password
	passwordConfig := utils.DefaultPasswordConfig()
	hashedPassword, err := utils.HashPassword(req.Password, passwordConfig)
	if err != nil {
		return nil, fmt.Errorf("failed to hash password: %w", err)
	}

	// Generate verification token
	verificationToken, err := utils.GenerateRandomToken(32)
	if err != nil {
		return nil, fmt.Errorf("failed to generate verification token: %w", err)
	}

	// Create user based on type
	if req.UserType == "mahasiswa" {
		// Check if NIM already exists
		if req.NIM != "" {
			existingNIM, _ := s.userRepo.GetMahasiswaByNIM(ctx, req.NIM)
			if existingNIM != nil {
				return nil, errors.New("user with this NIM already exists")
			}
		}

		mahasiswa := &models.UserMahasiswa{
			User: models.User{
				FullName:          req.FullName,
				Email:             req.Email,
				PasswordHash:      hashedPassword,
				EmailVerified:     false,
				VerificationToken: verificationToken,
			},
			NIM:     req.NIM,
			Status:  "active",
			Faculty: req.Faculty,
			Major:   req.Major,
		}

		if err := s.userRepo.CreateMahasiswa(ctx, mahasiswa); err != nil {
			return nil, fmt.Errorf("failed to create mahasiswa: %w", err)
		}

		// Send verification email
		verifyURL := fmt.Sprintf("%s/verify-email", s.config.Server.AllowedOrigins[0])
		if err := s.emailService.SendVerificationEmail(req.Email, verificationToken, verifyURL); err != nil {
			// Log error but don't fail registration
			fmt.Printf("Failed to send verification email: %v\n", err)
		}

		// Generate tokens
		accessToken, err := s.jwtManager.GenerateAccessToken(mahasiswa.ID, mahasiswa.Email, "mahasiswa", false)
		if err != nil {
			return nil, fmt.Errorf("failed to generate access token: %w", err)
		}

		refreshToken, err := s.jwtManager.GenerateRefreshToken(mahasiswa.ID, mahasiswa.Email, false)
		if err != nil {
			return nil, fmt.Errorf("failed to generate refresh token: %w", err)
		}

		// Store refresh token
		if err := s.userRepo.SetRefreshToken(ctx, mahasiswa.ID, refreshToken); err != nil {
			return nil, fmt.Errorf("failed to store refresh token: %w", err)
		}

		return &models.AuthResponse{
			User:         mahasiswa,
			AccessToken:  accessToken,
			RefreshToken: refreshToken,
			ExpiresIn:    int64(s.jwtManager.GetAccessTokenExpiry().Seconds()),
		}, nil

	} else if req.UserType == "admin" {
		admin := &models.Admin{
			User: models.User{
				FullName:          req.FullName,
				Email:             req.Email,
				PasswordHash:      hashedPassword,
				EmailVerified:     false,
				VerificationToken: verificationToken,
			},
			IsAdmin:     true,
			Permissions: []string{"read", "write", "delete"},
		}

		if err := s.userRepo.CreateAdmin(ctx, admin); err != nil {
			return nil, fmt.Errorf("failed to create admin: %w", err)
		}

		// Send verification email
		verifyURL := fmt.Sprintf("%s/verify-email", s.config.Server.AllowedOrigins[0])
		if err := s.emailService.SendVerificationEmail(req.Email, verificationToken, verifyURL); err != nil {
			// Log error but don't fail registration
			fmt.Printf("Failed to send verification email: %v\n", err)
		}

		// Generate tokens
		accessToken, err := s.jwtManager.GenerateAccessToken(admin.ID, admin.Email, "admin", true)
		if err != nil {
			return nil, fmt.Errorf("failed to generate access token: %w", err)
		}

		refreshToken, err := s.jwtManager.GenerateRefreshToken(admin.ID, admin.Email, false)
		if err != nil {
			return nil, fmt.Errorf("failed to generate refresh token: %w", err)
		}

		// Store refresh token
		if err := s.userRepo.SetRefreshToken(ctx, admin.ID, refreshToken); err != nil {
			return nil, fmt.Errorf("failed to store refresh token: %w", err)
		}

		return &models.AuthResponse{
			User:         admin,
			AccessToken:  accessToken,
			RefreshToken: refreshToken,
			ExpiresIn:    int64(s.jwtManager.GetAccessTokenExpiry().Seconds()),
		}, nil
	}

	return nil, errors.New("invalid user type")
}

func (s *userService) Login(ctx context.Context, req *models.LoginRequest) (*models.AuthResponse, error) {
	// Try to find user in all collections
	var user interface{}
	var userID primitive.ObjectID
	var email, userType string
	var isAdmin bool
	var passwordHash string

	// Check mahasiswa collection
	mahasiswa, err := s.userRepo.GetMahasiswaByEmail(ctx, req.Email)
	if err == nil && mahasiswa != nil {
		user = mahasiswa
		userID = mahasiswa.ID
		email = mahasiswa.Email
		userType = "mahasiswa"
		isAdmin = false
		passwordHash = mahasiswa.PasswordHash
	} else {
		// Check admin collection
		admin, err := s.userRepo.GetAdminByEmail(ctx, req.Email)
		if err == nil && admin != nil {
			user = admin
			userID = admin.ID
			email = admin.Email
			userType = "admin"
			isAdmin = admin.IsAdmin
			passwordHash = admin.PasswordHash
		} else {
			// Check regular user collection
			regularUser, err := s.userRepo.GetByEmail(ctx, req.Email)
			if err != nil {
				return nil, errors.New("invalid email or password")
			}
			user = regularUser
			userID = regularUser.ID
			email = regularUser.Email
			userType = "user"
			isAdmin = false
			passwordHash = regularUser.PasswordHash
		}
	}

	// Verify password
	valid, err := utils.VerifyPassword(req.Password, passwordHash)
	if err != nil || !valid {
		return nil, errors.New("invalid email or password")
	}

	// Update last login
	if err := s.userRepo.UpdateLastLogin(ctx, userID); err != nil {
		// Log error but don't fail login
		fmt.Printf("Failed to update last login: %v\n", err)
	}

	// Generate tokens
	accessToken, err := s.jwtManager.GenerateAccessToken(userID, email, userType, isAdmin)
	if err != nil {
		return nil, fmt.Errorf("failed to generate access token: %w", err)
	}

	refreshToken, err := s.jwtManager.GenerateRefreshToken(userID, email, req.RememberMe)
	if err != nil {
		return nil, fmt.Errorf("failed to generate refresh token: %w", err)
	}

	// Store refresh token
	if err := s.userRepo.SetRefreshToken(ctx, userID, refreshToken); err != nil {
		return nil, fmt.Errorf("failed to store refresh token: %w", err)
	}

	// Update remember me setting
	if req.RememberMe {
		if err := s.userRepo.Update(ctx, userID, map[string]interface{}{"remember_me": true}); err != nil {
			// Log error but don't fail login
			fmt.Printf("Failed to update remember me setting: %v\n", err)
		}
	}

	return &models.AuthResponse{
		User:         user,
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		ExpiresIn:    int64(s.jwtManager.GetAccessTokenExpiry().Seconds()),
	}, nil
}

func (s *userService) RefreshToken(ctx context.Context, req *models.RefreshTokenRequest) (*models.AuthResponse, error) {
	// Validate refresh token
	claims, err := s.jwtManager.ValidateToken(req.RefreshToken)
	if err != nil {
		return nil, errors.New("invalid refresh token")
	}

	// Get user from database
	userID, err := primitive.ObjectIDFromHex(claims.UserID)
	if err != nil {
		return nil, errors.New("invalid user ID")
	}

	// Verify refresh token exists in database
	user, err := s.userRepo.GetByRefreshToken(ctx, req.RefreshToken)
	if err != nil {
		return nil, errors.New("invalid refresh token")
	}

	// Determine user type and get full user data
	var fullUser interface{}
	var userType string
	var isAdmin bool

	mahasiswa, err := s.userRepo.GetMahasiswaByID(ctx, userID)
	if err == nil {
		fullUser = mahasiswa
		userType = "mahasiswa"
		isAdmin = false
	} else {
		admin, err := s.userRepo.GetAdminByID(ctx, userID)
		if err == nil {
			fullUser = admin
			userType = "admin"
			isAdmin = admin.IsAdmin
		} else {
			fullUser = user
			userType = "user"
			isAdmin = false
		}
	}

	// Generate new tokens
	newAccessToken, err := s.jwtManager.GenerateAccessToken(userID, user.Email, userType, isAdmin)
	if err != nil {
		return nil, fmt.Errorf("failed to generate access token: %w", err)
	}

	newRefreshToken, err := s.jwtManager.GenerateRefreshToken(userID, user.Email, user.RememberMe)
	if err != nil {
		return nil, fmt.Errorf("failed to generate refresh token: %w", err)
	}

	// Update refresh token in database
	if err := s.userRepo.SetRefreshToken(ctx, userID, newRefreshToken); err != nil {
		return nil, fmt.Errorf("failed to update refresh token: %w", err)
	}

	return &models.AuthResponse{
		User:         fullUser,
		AccessToken:  newAccessToken,
		RefreshToken: newRefreshToken,
		ExpiresIn:    int64(s.jwtManager.GetAccessTokenExpiry().Seconds()),
	}, nil
}

func (s *userService) Logout(ctx context.Context, userID primitive.ObjectID) error {
	return s.userRepo.ClearRefreshToken(ctx, userID)
}

func (s *userService) GetProfile(ctx context.Context, userID primitive.ObjectID) (interface{}, error) {
	// Try to get user from different collections
	mahasiswa, err := s.userRepo.GetMahasiswaByID(ctx, userID)
	if err == nil {
		return mahasiswa, nil
	}

	admin, err := s.userRepo.GetAdminByID(ctx, userID)
	if err == nil {
		return admin, nil
	}

	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		return nil, errors.New("user not found")
	}

	return user, nil
}

func (s *userService) UpdateProfile(ctx context.Context, userID primitive.ObjectID, updates map[string]interface{}) error {
	// Remove sensitive fields
	delete(updates, "password_hash")
	delete(updates, "reset_token")
	delete(updates, "reset_token_expiry")
	delete(updates, "verification_token")
	delete(updates, "refresh_token")

	return s.userRepo.Update(ctx, userID, updates)
}

func (s *userService) ChangePassword(ctx context.Context, userID primitive.ObjectID, req *models.ChangePasswordRequest) error {
	// Get user
	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		return errors.New("user not found")
	}

	// Verify current password
	valid, err := utils.VerifyPassword(req.CurrentPassword, user.PasswordHash)
	if err != nil || !valid {
		return errors.New("invalid current password")
	}

	// Hash new password
	passwordConfig := utils.DefaultPasswordConfig()
	hashedPassword, err := utils.HashPassword(req.NewPassword, passwordConfig)
	if err != nil {
		return fmt.Errorf("failed to hash password: %w", err)
	}

	// Update password
	return s.userRepo.UpdatePassword(ctx, userID, hashedPassword)
}

func (s *userService) RequestPasswordReset(ctx context.Context, req *models.PasswordResetRequest) error {
	// Get user
	user, err := s.userRepo.GetByEmail(ctx, req.Email)
	if err != nil {
		// Don't reveal if email exists or not
		return nil
	}

	// Generate reset token
	resetToken, err := utils.GenerateRandomToken(32)
	if err != nil {
		return fmt.Errorf("failed to generate reset token: %w", err)
	}

	// Set reset token with 1 hour expiry
	expiry := time.Now().Add(time.Hour)
	if err := s.userRepo.SetResetToken(ctx, user.ID, resetToken, expiry); err != nil {
		return fmt.Errorf("failed to set reset token: %w", err)
	}

	// Send password reset email
	resetURL := fmt.Sprintf("%s/reset-password", s.config.Server.AllowedOrigins[0])
	return s.emailService.SendPasswordResetEmail(req.Email, resetToken, resetURL)
}

func (s *userService) ResetPassword(ctx context.Context, req *models.PasswordResetConfirm) error {
	// Get user by reset token
	user, err := s.userRepo.GetByResetToken(ctx, req.Token)
	if err != nil {
		return errors.New("invalid or expired reset token")
	}

	// Hash new password
	passwordConfig := utils.DefaultPasswordConfig()
	hashedPassword, err := utils.HashPassword(req.NewPassword, passwordConfig)
	if err != nil {
		return fmt.Errorf("failed to hash password: %w", err)
	}

	// Update password and clear reset token
	if err := s.userRepo.UpdatePassword(ctx, user.ID, hashedPassword); err != nil {
		return fmt.Errorf("failed to update password: %w", err)
	}

	return s.userRepo.ClearResetToken(ctx, user.ID)
}

func (s *userService) GetOAuthURL(provider, userType string) (string, error) {
	config, exists := s.oauthConfigs[provider]
	if !exists {
		return "", errors.New("unsupported OAuth provider")
	}

	// Add user type to state for later retrieval
	state := fmt.Sprintf("%s:%s", provider, userType)
	return config.AuthCodeURL(state, oauth2.AccessTypeOffline), nil
}

func (s *userService) OAuthLogin(ctx context.Context, req *models.OAuthRequest) (*models.AuthResponse, error) {
	config, exists := s.oauthConfigs[req.Provider]
	if !exists {
		return nil, errors.New("unsupported OAuth provider")
	}

	var userInfo map[string]interface{}
	var err error

	// Get user info based on provider
	switch req.Provider {
	case "google":
		userInfo, err = s.getGoogleUserInfo(ctx, config, req.Code)
	case "facebook":
		userInfo, err = s.getFacebookUserInfo(ctx, config, req.Code)
	case "github":
		userInfo, err = s.getGithubUserInfo(ctx, config, req.Code)
	case "apple":
		userInfo, err = s.getAppleUserInfo(ctx, config, req.IDToken)
	default:
		return nil, errors.New("unsupported OAuth provider")
	}

	if err != nil {
		return nil, fmt.Errorf("failed to get user info: %w", err)
	}

	// Extract user information
	email, _ := userInfo["email"].(string)
	name, _ := userInfo["name"].(string)
	picture, _ := userInfo["picture"].(string)
	oauthID, _ := userInfo["id"].(string)

	if email == "" || oauthID == "" {
		return nil, errors.New("insufficient user information from OAuth provider")
	}

	// Check if user exists with OAuth ID
	existingUser, _ := s.userRepo.GetByOAuthID(ctx, req.Provider, oauthID)
	if existingUser != nil {
		// User exists, log them in
		return s.loginExistingOAuthUser(ctx, existingUser, req.Provider)
	}

	// Check if user exists with email
	existingUser, _ = s.userRepo.GetByEmail(ctx, email)
	if existingUser != nil {
		// Link OAuth account to existing user
		return s.linkOAuthAccount(ctx, existingUser, req.Provider, oauthID)
	}

	// Create new user
	return s.createOAuthUser(ctx, email, name, picture, req.Provider, oauthID, req.UserType)
}

func (s *userService) VerifyEmail(ctx context.Context, token string) error {
	user, err := s.userRepo.GetByVerificationToken(ctx, token)
	if err != nil {
		return errors.New("invalid verification token")
	}

	if err := s.userRepo.VerifyEmail(ctx, user.ID); err != nil {
		return fmt.Errorf("failed to verify email: %w", err)
	}

	// Send welcome email
	return s.emailService.SendWelcomeEmail(user.Email, user.FullName)
}

func (s *userService) ResendVerification(ctx context.Context, email string) error {
	user, err := s.userRepo.GetByEmail(ctx, email)
	if err != nil {
		return errors.New("user not found")
	}

	if user.EmailVerified {
		return errors.New("email already verified")
	}

	// Generate new verification token
	verificationToken, err := utils.GenerateRandomToken(32)
	if err != nil {
		return fmt.Errorf("failed to generate verification token: %w", err)
	}

	// Update verification token
	if err := s.userRepo.SetVerificationToken(ctx, user.ID, verificationToken); err != nil {
		return fmt.Errorf("failed to set verification token: %w", err)
	}

	// Send verification email
	verifyURL := fmt.Sprintf("%s/verify-email", s.config.Server.AllowedOrigins[0])
	return s.emailService.SendVerificationEmail(email, verificationToken, verifyURL)
}

// Helper methods for OAuth providers

func (s *userService) getGoogleUserInfo(ctx context.Context, config *oauth2.Config, code string) (map[string]interface{}, error) {
	token, err := config.Exchange(ctx, code)
	if err != nil {
		return nil, err
	}

	client := config.Client(ctx, token)
	resp, err := client.Get("https://www.googleapis.com/oauth2/v2/userinfo")
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var userInfo map[string]interface{}
	if err := json.Unmarshal(body, &userInfo); err != nil {
		return nil, err
	}

	return userInfo, nil
}

func (s *userService) getFacebookUserInfo(ctx context.Context, config *oauth2.Config, code string) (map[string]interface{}, error) {
	token, err := config.Exchange(ctx, code)
	if err != nil {
		return nil, err
	}

	client := config.Client(ctx, token)
	resp, err := client.Get("https://graph.facebook.com/me?fields=id,name,email,picture")
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var userInfo map[string]interface{}
	if err := json.Unmarshal(body, &userInfo); err != nil {
		return nil, err
	}

	return userInfo, nil
}

func (s *userService) getGithubUserInfo(ctx context.Context, config *oauth2.Config, code string) (map[string]interface{}, error) {
	token, err := config.Exchange(ctx, code)
	if err != nil {
		return nil, err
	}

	client := config.Client(ctx, token)
	resp, err := client.Get("https://api.github.com/user")
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var userInfo map[string]interface{}
	if err := json.Unmarshal(body, &userInfo); err != nil {
		return nil, err
	}

	// Get user's primary email
	emailResp, err := client.Get("https://api.github.com/user/emails")
	if err == nil {
		defer emailResp.Body.Close()
		emailBody, _ := io.ReadAll(emailResp.Body)
		var emails []map[string]interface{}
		if json.Unmarshal(emailBody, &emails) == nil {
			for _, email := range emails {
				if primary, ok := email["primary"].(bool); ok && primary {
					userInfo["email"] = email["email"]
					break
				}
			}
		}
	}

	return userInfo, nil
}

func (s *userService) getAppleUserInfo(ctx context.Context, config *oauth2.Config, idToken string) (map[string]interface{}, error) {
	// For Apple, we would need to validate the ID token
	// This is a simplified implementation - in production, you should validate the JWT
	parts := strings.Split(idToken, ".")
	if len(parts) != 3 {
		return nil, errors.New("invalid ID token format")
	}

	// Decode the payload (this is a simplified example)
	// In production, you should properly validate the JWT signature
	payload := parts[1]
	// Add padding if necessary
	for len(payload)%4 != 0 {
		payload += "="
	}

	decoded, err := utils.GenerateRandomToken(16) // Placeholder
	if err != nil {
		return nil, err
	}

	// This should be replaced with actual JWT decoding
	userInfo := map[string]interface{}{
		"id":    decoded,
		"email": "user@example.com", // Should be extracted from the validated JWT
		"name":  "Apple User",       // Should be extracted from the validated JWT
	}

	return userInfo, nil
}

func (s *userService) loginExistingOAuthUser(ctx context.Context, user *models.User, provider string) (*models.AuthResponse, error) {
	// Determine user type
	var userType string
	var isAdmin bool
	var fullUser interface{}

	mahasiswa, err := s.userRepo.GetMahasiswaByID(ctx, user.ID)
	if err == nil {
		userType = "mahasiswa"
		isAdmin = false
		fullUser = mahasiswa
	} else {
		admin, err := s.userRepo.GetAdminByID(ctx, user.ID)
		if err == nil {
			userType = "admin"
			isAdmin = admin.IsAdmin
			fullUser = admin
		} else {
			userType = "user"
			isAdmin = false
			fullUser = user
		}
	}

	// Update last login
	if err := s.userRepo.UpdateLastLogin(ctx, user.ID); err != nil {
		fmt.Printf("Failed to update last login: %v\n", err)
	}

	// Generate tokens
	accessToken, err := s.jwtManager.GenerateAccessToken(user.ID, user.Email, userType, isAdmin)
	if err != nil {
		return nil, fmt.Errorf("failed to generate access token: %w", err)
	}

	refreshToken, err := s.jwtManager.GenerateRefreshToken(user.ID, user.Email, false)
	if err != nil {
		return nil, fmt.Errorf("failed to generate refresh token: %w", err)
	}

	// Store refresh token
	if err := s.userRepo.SetRefreshToken(ctx, user.ID, refreshToken); err != nil {
		return nil, fmt.Errorf("failed to store refresh token: %w", err)
	}

	return &models.AuthResponse{
		User:         fullUser,
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		ExpiresIn:    int64(s.jwtManager.GetAccessTokenExpiry().Seconds()),
	}, nil
}

func (s *userService) linkOAuthAccount(ctx context.Context, user *models.User, provider, oauthID string) (*models.AuthResponse, error) {
	// Update user with OAuth ID
	updates := make(map[string]interface{})
	switch provider {
	case "google":
		updates["google_id"] = oauthID
	case "facebook":
		updates["facebook_id"] = oauthID
	case "apple":
		updates["apple_id"] = oauthID
	case "github":
		updates["github_id"] = oauthID
	}

	if err := s.userRepo.Update(ctx, user.ID, updates); err != nil {
		return nil, fmt.Errorf("failed to link OAuth account: %w", err)
	}

	return s.loginExistingOAuthUser(ctx, user, provider)
}

func (s *userService) createOAuthUser(ctx context.Context, email, name, picture, provider, oauthID, userType string) (*models.AuthResponse, error) {
	if userType == "mahasiswa" {
		mahasiswa := &models.UserMahasiswa{
			User: models.User{
				FullName:       name,
				Email:          email,
				EmailVerified:  true, // OAuth emails are pre-verified
				ProfilePicture: picture,
			},
			Status: "active",
		}

		// Set OAuth ID
		switch provider {
		case "google":
			mahasiswa.GoogleID = oauthID
		case "facebook":
			mahasiswa.FacebookID = oauthID
		case "apple":
			mahasiswa.AppleID = oauthID
		case "github":
			mahasiswa.GithubID = oauthID
		}

		if err := s.userRepo.CreateMahasiswa(ctx, mahasiswa); err != nil {
			return nil, fmt.Errorf("failed to create mahasiswa: %w", err)
		}

		// Generate tokens
		accessToken, err := s.jwtManager.GenerateAccessToken(mahasiswa.ID, mahasiswa.Email, "mahasiswa", false)
		if err != nil {
			return nil, fmt.Errorf("failed to generate access token: %w", err)
		}

		refreshToken, err := s.jwtManager.GenerateRefreshToken(mahasiswa.ID, mahasiswa.Email, false)
		if err != nil {
			return nil, fmt.Errorf("failed to generate refresh token: %w", err)
		}

		// Store refresh token
		if err := s.userRepo.SetRefreshToken(ctx, mahasiswa.ID, refreshToken); err != nil {
			return nil, fmt.Errorf("failed to store refresh token: %w", err)
		}

		// Send welcome email
		if err := s.emailService.SendWelcomeEmail(email, name); err != nil {
			fmt.Printf("Failed to send welcome email: %v\n", err)
		}

		return &models.AuthResponse{
			User:         mahasiswa,
			AccessToken:  accessToken,
			RefreshToken: refreshToken,
			ExpiresIn:    int64(s.jwtManager.GetAccessTokenExpiry().Seconds()),
		}, nil

	} else if userType == "admin" {
		admin := &models.Admin{
			User: models.User{
				FullName:       name,
				Email:          email,
				EmailVerified:  true, // OAuth emails are pre-verified
				ProfilePicture: picture,
			},
			IsAdmin:     true,
			Permissions: []string{"read", "write", "delete"},
		}

		// Set OAuth ID
		switch provider {
		case "google":
			admin.GoogleID = oauthID
		case "facebook":
			admin.FacebookID = oauthID
		case "apple":
			admin.AppleID = oauthID
		case "github":
			admin.GithubID = oauthID
		}

		if err := s.userRepo.CreateAdmin(ctx, admin); err != nil {
			return nil, fmt.Errorf("failed to create admin: %w", err)
		}

		// Generate tokens
		accessToken, err := s.jwtManager.GenerateAccessToken(admin.ID, admin.Email, "admin", true)
		if err != nil {
			return nil, fmt.Errorf("failed to generate access token: %w", err)
		}

		refreshToken, err := s.jwtManager.GenerateRefreshToken(admin.ID, admin.Email, false)
		if err != nil {
			return nil, fmt.Errorf("failed to generate refresh token: %w", err)
		}

		// Store refresh token
		if err := s.userRepo.SetRefreshToken(ctx, admin.ID, refreshToken); err != nil {
			return nil, fmt.Errorf("failed to store refresh token: %w", err)
		}

		// Send welcome email
		if err := s.emailService.SendWelcomeEmail(email, name); err != nil {
			fmt.Printf("Failed to send welcome email: %v\n", err)
		}

		return &models.AuthResponse{
			User:         admin,
			AccessToken:  accessToken,
			RefreshToken: refreshToken,
			ExpiresIn:    int64(s.jwtManager.GetAccessTokenExpiry().Seconds()),
		}, nil
	}

	return nil, errors.New("invalid user type")
}
