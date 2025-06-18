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
	"go.mongodb.org/mongo-driver/mongo"
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
	UpdateLastLogout(userID string) error
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
	s.oauthConfigs = make(map[string]*oauth2.Config)

	// Google OAuth
	if s.config.OAuth.Google.ClientID != "" {
		s.oauthConfigs["google"] = &oauth2.Config{
			ClientID:     s.config.OAuth.Google.ClientID,
			ClientSecret: s.config.OAuth.Google.ClientSecret,
			RedirectURL:  s.config.OAuth.Google.RedirectURL,
			Scopes:       s.config.OAuth.Google.Scopes,
			Endpoint:     google.Endpoint,
		}
	}

	// Facebook OAuth
	if s.config.OAuth.Facebook.ClientID != "" {
		s.oauthConfigs["facebook"] = &oauth2.Config{
			ClientID:     s.config.OAuth.Facebook.ClientID,
			ClientSecret: s.config.OAuth.Facebook.ClientSecret,
			RedirectURL:  s.config.OAuth.Facebook.RedirectURL,
			Scopes:       s.config.OAuth.Facebook.Scopes,
			Endpoint:     facebook.Endpoint,
		}
	}

	// X (Twitter) OAuth
	if s.config.OAuth.X.ClientID != "" {
		s.oauthConfigs["x"] = &oauth2.Config{
			ClientID:     s.config.OAuth.X.ClientID,
			ClientSecret: s.config.OAuth.X.ClientSecret,
			RedirectURL:  s.config.OAuth.X.RedirectURL,
			Scopes:       s.config.OAuth.X.Scopes,
			Endpoint: oauth2.Endpoint{
				AuthURL:  "https://x.com/i/oauth2/authorize",
				TokenURL: "https://api.x.com/2/oauth2/token",
			},
		}
	}

	// GitHub OAuth
	if s.config.OAuth.Github.ClientID != "" {
		s.oauthConfigs["github"] = &oauth2.Config{
			ClientID:     s.config.OAuth.Github.ClientID,
			ClientSecret: s.config.OAuth.Github.ClientSecret,
			RedirectURL:  s.config.OAuth.Github.RedirectURL,
			Scopes:       s.config.OAuth.Github.Scopes,
			Endpoint:     github.Endpoint,
		}
	}
}

func (s *userService) Register(ctx context.Context, req *models.RegisterRequest) (*models.AuthResponse, error) {
	// Check if user already exists in any collection
	existing, _ := s.userRepo.GetByEmail(ctx, req.Email)
	if existing != nil {
		return nil, errors.New("user with this email already exists")
	}

	// Check mahasiswa collection
	existingMahasiswa, _ := s.userRepo.GetMahasiswaByEmail(ctx, req.Email)
	if existingMahasiswa != nil {
		return nil, errors.New("user with this email already exists")
	}

	// Check admin collection
	existingAdmin, _ := s.userRepo.GetAdminByEmail(ctx, req.Email)
	if existingAdmin != nil {
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
				UserType:          models.UserTypeMahasiswa,
				Status:            models.UserStatusActive, // Mahasiswa are auto-approved
			},
			NIM:     req.NIM,
			Faculty: req.Faculty,
			Major:   req.Major,
		}

		if err := s.userRepo.CreateMahasiswa(ctx, mahasiswa); err != nil {
			// Check if it's a duplicate key error
			if mongo.IsDuplicateKeyError(err) {
				return nil, fmt.Errorf("user with this email or OAuth account already exists")
			}
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
				UserType:          models.UserTypeAdmin,
				Status:            models.UserStatusActive, // Admins are auto-approved
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

	} else if req.UserType == "user" {
		// Create regular user (non-mahasiswa)
		user := &models.User{
			FullName:          req.FullName,
			Email:             req.Email,
			PasswordHash:      hashedPassword,
			EmailVerified:     false,
			VerificationToken: verificationToken,
			UserType:          models.UserTypeExternal,  // Use external type for regular users
			Status:            models.UserStatusPending, // External users need approval
		}

		if err := s.userRepo.Create(ctx, user); err != nil {
			return nil, fmt.Errorf("failed to create user: %w", err)
		}

		// Send verification email
		verifyURL := fmt.Sprintf("%s/verify-email", s.config.Server.AllowedOrigins[0])
		if err := s.emailService.SendVerificationEmail(req.Email, verificationToken, verifyURL); err != nil {
			// Log error but don't fail registration
			fmt.Printf("Failed to send verification email: %v\n", err)
		}

		// Generate tokens
		accessToken, err := s.jwtManager.GenerateAccessToken(user.ID, user.Email, "user", false)
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
			User:         user,
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
	case "x":
		userInfo, err = s.getXUserInfo(ctx, config, req.Code)
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

	// Validate required fields
	if oauthID == "" {
		return nil, errors.New("OAuth ID is required from provider")
	}

	// Handle missing email (some providers like X/Twitter might not provide email)
	if email == "" {
		// Generate a more meaningful email based on provider and user info
		if name != "" {
			// Use name-based email if name is available
			cleanName := strings.ToLower(strings.ReplaceAll(name, " ", "."))
			email = fmt.Sprintf("%s@%s.oauth", cleanName, req.Provider)
		} else {
			// Fallback to OAuth ID
			email = fmt.Sprintf("user_%s@%s.oauth", oauthID, req.Provider)
		}
	}

	// Handle missing name
	if name == "" {
		// Try to extract name from email
		if strings.Contains(email, "@") {
			emailParts := strings.Split(email, "@")
			if len(emailParts) > 0 {
				namePart := emailParts[0]
				// Replace dots and underscores with spaces and title case
				namePart = strings.ReplaceAll(namePart, ".", " ")
				namePart = strings.ReplaceAll(namePart, "_", " ")
				name = strings.Title(namePart)
			}
		}

		// Final fallback
		if name == "" {
			name = fmt.Sprintf("%s User", strings.Title(req.Provider))
		}
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
	return s.createOAuthUser(ctx, email, name, picture, req.Provider, oauthID, string(req.UserType))
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

func (s *userService) getXUserInfo(ctx context.Context, config *oauth2.Config, code string) (map[string]interface{}, error) {
	token, err := config.Exchange(ctx, code)
	if err != nil {
		return nil, err
	}

	client := config.Client(ctx, token)
	resp, err := client.Get("https://api.x.com/2/users/me?user.fields=id,username,name,profile_image_url")
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var response map[string]interface{}
	if err := json.Unmarshal(body, &response); err != nil {
		return nil, err
	}

	// Extract user data from X API response
	data, ok := response["data"].(map[string]interface{})
	if !ok {
		return nil, errors.New("invalid response format from X API")
	}

	userInfo := map[string]interface{}{
		"id":      data["id"],
		"name":    data["name"],
		"email":   data["username"].(string) + "@x.local", // X doesn't provide email by default
		"picture": data["profile_image_url"],
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
	case "x":
		updates["x_id"] = oauthID
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
				UserType:       models.UserTypeMahasiswa,
				Status:         models.UserStatusActive,
			},
		}

		// Set OAuth ID
		switch provider {
		case "google":
			mahasiswa.GoogleID = oauthID
		case "facebook":
			mahasiswa.FacebookID = oauthID
		case "x":
			mahasiswa.XID = oauthID
		case "github":
			mahasiswa.GithubID = oauthID
		}

		if err := s.userRepo.CreateMahasiswa(ctx, mahasiswa); err != nil {
			// Check if it's a duplicate key error
			if mongo.IsDuplicateKeyError(err) {
				return nil, fmt.Errorf("user with this email or OAuth account already exists")
			}
			return nil, fmt.Errorf("failed to create mahasiswa: %w", err)
		}

		// OAuth users don't need email verification (already verified by OAuth provider)

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

	} else if userType == "admin" {
		admin := &models.Admin{
			User: models.User{
				FullName:       name,
				Email:          email,
				EmailVerified:  true, // OAuth emails are pre-verified
				ProfilePicture: picture,
				UserType:       models.UserTypeAdmin,
				Status:         models.UserStatusActive,
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
		case "x":
			admin.XID = oauthID
		case "github":
			admin.GithubID = oauthID
		}

		if err := s.userRepo.CreateAdmin(ctx, admin); err != nil {
			// Check if it's a duplicate key error
			if mongo.IsDuplicateKeyError(err) {
				return nil, fmt.Errorf("user with this email or OAuth account already exists")
			}
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
	} else if userType == "user" {
		// Create regular user (external/non-mahasiswa)
		user := &models.User{
			FullName:       name,
			Email:          email,
			EmailVerified:  true, // OAuth emails are pre-verified
			ProfilePicture: picture,
			UserType:       models.UserTypeExternal,
			Status:         models.UserStatusPending, // External users need approval
		}

		// Set OAuth ID
		switch provider {
		case "google":
			user.GoogleID = oauthID
		case "facebook":
			user.FacebookID = oauthID
		case "x":
			user.XID = oauthID
		case "github":
			user.GithubID = oauthID
		}

		if err := s.userRepo.Create(ctx, user); err != nil {
			// Check if it's a duplicate key error
			if mongo.IsDuplicateKeyError(err) {
				return nil, fmt.Errorf("user with this email or OAuth account already exists")
			}
			return nil, fmt.Errorf("failed to create user: %w", err)
		}

		// Generate tokens
		accessToken, err := s.jwtManager.GenerateAccessToken(user.ID, user.Email, "user", false)
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

		// Send welcome email
		if err := s.emailService.SendWelcomeEmail(email, name); err != nil {
			fmt.Printf("Failed to send welcome email: %v\n", err)
		}

		return &models.AuthResponse{
			User:         user,
			AccessToken:  accessToken,
			RefreshToken: refreshToken,
			ExpiresIn:    int64(s.jwtManager.GetAccessTokenExpiry().Seconds()),
		}, nil
	}

	return nil, errors.New("invalid user type")
}

// UpdateLastLogout updates the user's last logout timestamp
func (s *userService) UpdateLastLogout(userID string) error {
	return s.userRepo.UpdateLastLogout(userID)
}
