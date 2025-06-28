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
	RequestPasswordReset(ctx context.Context, req *models.PasswordResetRequest) (*models.PasswordResetOptionsResponse, error)
	ResetPassword(ctx context.Context, req *models.PasswordResetConfirm) error
	ResetPasswordWithRecoveryCode(ctx context.Context, req *models.PasswordResetWithRecoveryRequest) error
	GenerateNewRecoveryCodes(ctx context.Context, userID primitive.ObjectID) (*models.RecoveryCodesResponse, error)
	GetRecoveryCodes(ctx context.Context, userID primitive.ObjectID) (*models.RecoveryCodesResponse, error)
	OAuthLogin(ctx context.Context, req *models.OAuthRequest) (*models.AuthResponse, error)
	GetOAuthURL(provider, userType string) (string, error)
	VerifyEmail(ctx context.Context, token string) error
	ResendVerification(ctx context.Context, email string) error
	UpdateLastLogout(userID string) error
}

type userService struct {
	userRepo     repository.UserRepository
	jwtManager   *utils.JWTManager
	config       models.Config
	oauthConfigs map[string]*oauth2.Config
}

func NewUserService(
	userRepo repository.UserRepository,
	jwtManager *utils.JWTManager,
	config models.Config,
) UserService {
	service := &userService{
		userRepo:     userRepo,
		jwtManager:   jwtManager,
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

	// X (Twitter) OAuth with PKCE
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

	// Generate recovery codes for password reset
	recoveryCodes, err := utils.GenerateRecoveryCodes(8)
	if err != nil {
		return nil, fmt.Errorf("failed to generate recovery codes: %w", err)
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
				FullName:      req.FullName,
				Email:         req.Email,
				PasswordHash:  hashedPassword,
				EmailVerified: true, // Auto-verify since no email service
				RecoveryCodes: recoveryCodes,
				UserType:      models.UserTypeMahasiswa,
				Status:        models.UserStatusActive, // Mahasiswa are auto-approved
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

		// Note: Recovery codes will be displayed to user after registration

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
				FullName:      req.FullName,
				Email:         req.Email,
				PasswordHash:  hashedPassword,
				EmailVerified: true, // Auto-verify since no email service
				RecoveryCodes: recoveryCodes,
				UserType:      models.UserTypeAdmin,
				Status:        models.UserStatusActive, // Admins are auto-approved
			},
			IsAdmin:     true,
			Permissions: []string{"read", "write", "delete"},
		}

		if err := s.userRepo.CreateAdmin(ctx, admin); err != nil {
			return nil, fmt.Errorf("failed to create admin: %w", err)
		}

		// Note: Recovery codes will be displayed to admin after registration

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
			FullName:      req.FullName,
			Email:         req.Email,
			PasswordHash:  hashedPassword,
			EmailVerified: true, // Auto-verify since no email service
			RecoveryCodes: recoveryCodes,
			UserType:      models.UserTypeExternal,  // Use external type for regular users
			Status:        models.UserStatusPending, // External users need approval
		}

		if err := s.userRepo.Create(ctx, user); err != nil {
			return nil, fmt.Errorf("failed to create user: %w", err)
		}

		// Note: Recovery codes will be displayed to user after registration

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

func (s *userService) RequestPasswordReset(ctx context.Context, req *models.PasswordResetRequest) (*models.PasswordResetOptionsResponse, error) {
	// Check if user exists (but don't reveal if they don't)
	user, err := s.userRepo.GetByEmail(ctx, req.Email)
	hasRecoveryCodes := false

	if err == nil && len(user.RecoveryCodes) > 0 {
		hasRecoveryCodes = true
	}

	response := &models.PasswordResetOptionsResponse{
		Message: "Password reset options available:",
		Options: []string{
			"Use your recovery codes if available",
			"Contact administrator for password reset assistance",
			"Create a new account if necessary",
		},
		HasRecoveryCodes: hasRecoveryCodes,
		SupportContact:   "admin@yourapp.com", // Update with actual support contact
	}

	// Don't reveal specific user information for security
	return response, nil
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

	// Handle OAuth ID - it might be a string or number depending on provider
	var oauthID string
	fmt.Printf("🔍 Processing OAuth ID: %v (type: %T)\n", userInfo["id"], userInfo["id"])

	if id, ok := userInfo["id"].(string); ok {
		oauthID = id
		fmt.Printf("✅ OAuth ID as string: %s\n", oauthID)
	} else if id, ok := userInfo["id"].(float64); ok {
		oauthID = fmt.Sprintf("%.0f", id)
		fmt.Printf("✅ OAuth ID as float64: %s\n", oauthID)
	} else if id, ok := userInfo["id"].(int64); ok {
		oauthID = fmt.Sprintf("%d", id)
		fmt.Printf("✅ OAuth ID as int64: %s\n", oauthID)
	} else if id, ok := userInfo["id"].(int); ok {
		oauthID = fmt.Sprintf("%d", id)
		fmt.Printf("✅ OAuth ID as int: %s\n", oauthID)
	}

	// Validate required fields
	if oauthID == "" {
		fmt.Printf("❌ Failed to extract OAuth ID from: %v (type: %T)\n", userInfo["id"], userInfo["id"])
		return nil, fmt.Errorf("OAuth ID is required from provider (got: %v, type: %T)", userInfo["id"], userInfo["id"])
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
	// Since emails are auto-verified during registration, this function
	// can either be disabled or auto-approve verification attempts
	return errors.New("email verification is not required - emails are auto-verified during registration")
}

func (s *userService) ResendVerification(ctx context.Context, email string) error {
	return errors.New("email verification is not required - emails are auto-verified during registration")
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
	fmt.Printf("🔄 Exchanging Facebook OAuth code for token...\n")
	token, err := config.Exchange(ctx, code)
	if err != nil {
		fmt.Printf("❌ Failed to exchange Facebook OAuth code: %v\n", err)
		return nil, fmt.Errorf("failed to exchange code for token: %w", err)
	}
	fmt.Printf("✅ Successfully obtained Facebook OAuth token\n")

	client := config.Client(ctx, token)
	// Note: Using public_profile scope only (email removed due to Facebook restrictions)
	fmt.Printf("🔄 Fetching Facebook user info...\n")
	resp, err := client.Get("https://graph.facebook.com/me?fields=id,name,picture.type(large)")
	if err != nil {
		fmt.Printf("❌ Failed to fetch Facebook user info: %v\n", err)
		return nil, fmt.Errorf("failed to get user info: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		fmt.Printf("❌ Facebook API returned status %d\n", resp.StatusCode)
		return nil, fmt.Errorf("Facebook API returned status %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		fmt.Printf("❌ Failed to read Facebook user response: %v\n", err)
		return nil, fmt.Errorf("failed to read response body: %w", err)
	}

	fmt.Printf("📄 Facebook user response: %s\n", string(body))

	var userInfo map[string]interface{}
	if err := json.Unmarshal(body, &userInfo); err != nil {
		fmt.Printf("❌ Failed to parse Facebook user response: %v\n", err)
		return nil, fmt.Errorf("failed to parse user info: %w", err)
	}

	// Facebook doesn't provide email with public_profile scope
	// Generate a placeholder email based on Facebook ID
	if facebookID, ok := userInfo["id"].(string); ok {
		userInfo["email"] = fmt.Sprintf("facebook_%s@facebook.local", facebookID)
		fmt.Printf("ℹ️ Generated placeholder email for Facebook user: %s\n", userInfo["email"])
	}

	// Extract picture URL from nested structure
	if picture, ok := userInfo["picture"].(map[string]interface{}); ok {
		if data, ok := picture["data"].(map[string]interface{}); ok {
			if url, ok := data["url"].(string); ok {
				userInfo["picture"] = url
				fmt.Printf("✅ Extracted Facebook profile picture URL\n")
			}
		}
	}

	fmt.Printf("✅ Successfully retrieved Facebook user info for ID: %v\n", userInfo["id"])
	return userInfo, nil
}

func (s *userService) getGithubUserInfo(ctx context.Context, config *oauth2.Config, code string) (map[string]interface{}, error) {
	fmt.Printf("🔄 Exchanging GitHub OAuth code for token...\n")
	token, err := config.Exchange(ctx, code)
	if err != nil {
		fmt.Printf("❌ Failed to exchange GitHub OAuth code: %v\n", err)
		return nil, fmt.Errorf("failed to exchange code for token: %w", err)
	}
	fmt.Printf("✅ Successfully obtained GitHub OAuth token\n")

	client := config.Client(ctx, token)
	fmt.Printf("🔄 Fetching GitHub user info...\n")
	resp, err := client.Get("https://api.github.com/user")
	if err != nil {
		fmt.Printf("❌ Failed to fetch GitHub user info: %v\n", err)
		return nil, fmt.Errorf("failed to get user info: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		fmt.Printf("❌ GitHub API returned status %d\n", resp.StatusCode)
		return nil, fmt.Errorf("GitHub API returned status %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		fmt.Printf("❌ Failed to read GitHub user response: %v\n", err)
		return nil, fmt.Errorf("failed to read response body: %w", err)
	}

	fmt.Printf("📄 GitHub user response: %s\n", string(body))

	var userInfo map[string]interface{}
	if err := json.Unmarshal(body, &userInfo); err != nil {
		fmt.Printf("❌ Failed to parse GitHub user response: %v\n", err)
		return nil, fmt.Errorf("failed to parse user info: %w", err)
	}

	// Get user's primary email
	fmt.Printf("🔄 Fetching GitHub user emails...\n")
	emailResp, err := client.Get("https://api.github.com/user/emails")
	if err == nil {
		defer emailResp.Body.Close()
		if emailResp.StatusCode == 200 {
			emailBody, _ := io.ReadAll(emailResp.Body)
			fmt.Printf("📧 GitHub emails response: %s\n", string(emailBody))
			var emails []map[string]interface{}
			if json.Unmarshal(emailBody, &emails) == nil {
				for _, email := range emails {
					if primary, ok := email["primary"].(bool); ok && primary {
						userInfo["email"] = email["email"]
						fmt.Printf("✅ Found primary email: %s\n", email["email"])
						break
					}
				}
			}
		} else {
			fmt.Printf("⚠️ GitHub emails API returned status %d\n", emailResp.StatusCode)
		}
	} else {
		fmt.Printf("⚠️ Failed to fetch GitHub emails: %v\n", err)
	}

	// Ensure we have an ID field
	if userInfo["id"] == nil {
		fmt.Printf("❌ GitHub user info missing ID field\n")
		return nil, fmt.Errorf("GitHub user info missing required ID field")
	}

	fmt.Printf("✅ Successfully retrieved GitHub user info for ID: %v\n", userInfo["id"])
	return userInfo, nil
}

func (s *userService) getXUserInfo(ctx context.Context, config *oauth2.Config, code string) (map[string]interface{}, error) {
	fmt.Printf("🔄 Exchanging X OAuth code for token...\n")
	token, err := config.Exchange(ctx, code)
	if err != nil {
		fmt.Printf("❌ Failed to exchange X OAuth code: %v\n", err)
		return nil, fmt.Errorf("failed to exchange code for token: %w", err)
	}
	fmt.Printf("✅ Successfully obtained X OAuth token\n")

	client := config.Client(ctx, token)
	fmt.Printf("🔄 Fetching X user info...\n")
	resp, err := client.Get("https://api.x.com/2/users/me?user.fields=id,username,name,profile_image_url")
	if err != nil {
		fmt.Printf("❌ Failed to fetch X user info: %v\n", err)
		return nil, fmt.Errorf("failed to get user info: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		fmt.Printf("❌ X API returned status %d\n", resp.StatusCode)
		return nil, fmt.Errorf("X API returned status %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		fmt.Printf("❌ Failed to read X user response: %v\n", err)
		return nil, fmt.Errorf("failed to read response body: %w", err)
	}

	fmt.Printf("📄 X user response: %s\n", string(body))

	var response map[string]interface{}
	if err := json.Unmarshal(body, &response); err != nil {
		fmt.Printf("❌ Failed to parse X user response: %v\n", err)
		return nil, fmt.Errorf("failed to parse user info: %w", err)
	}

	// Extract user data from X API response
	data, ok := response["data"].(map[string]interface{})
	if !ok {
		fmt.Printf("❌ Invalid X API response format - missing 'data' field\n")
		return nil, errors.New("invalid response format from X API")
	}

	// X doesn't provide email by default with OAuth 2.0
	username, _ := data["username"].(string)
	email := fmt.Sprintf("x_%s@x.local", username)
	if username == "" {
		if userID, ok := data["id"].(string); ok {
			email = fmt.Sprintf("x_%s@x.local", userID)
		}
	}

	userInfo := map[string]interface{}{
		"id":      data["id"],
		"name":    data["name"],
		"email":   email,
		"picture": data["profile_image_url"],
	}

	fmt.Printf("✅ Successfully retrieved X user info for ID: %v\n", userInfo["id"])
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
	// Generate recovery codes for OAuth users
	recoveryCodes, err := utils.GenerateRecoveryCodes(8)
	if err != nil {
		return nil, fmt.Errorf("failed to generate recovery codes: %w", err)
	}

	if userType == "mahasiswa" {
		mahasiswa := &models.UserMahasiswa{
			User: models.User{
				FullName:       name,
				Email:          email,
				EmailVerified:  true, // OAuth emails are pre-verified
				ProfilePicture: picture,
				RecoveryCodes:  recoveryCodes,
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
				RecoveryCodes:  recoveryCodes,
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

		// Note: Welcome emails disabled - no SMTP service configured

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
			RecoveryCodes:  recoveryCodes,
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

		// Note: Welcome emails disabled - no SMTP service configured

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

// ResetPasswordWithRecoveryCode allows users to reset password using recovery codes
func (s *userService) ResetPasswordWithRecoveryCode(ctx context.Context, req *models.PasswordResetWithRecoveryRequest) error {
	// Get user by email
	user, err := s.userRepo.GetByEmail(ctx, req.Email)
	if err != nil {
		return errors.New("invalid email or recovery code")
	}

	// Check if recovery code exists and remove it (single use)
	found := false
	newCodes := []string{}
	for _, existingCode := range user.RecoveryCodes {
		if existingCode == req.RecoveryCode && !found {
			found = true // Skip this code (use it up)
		} else {
			newCodes = append(newCodes, existingCode)
		}
	}

	if !found {
		return errors.New("invalid recovery code")
	}

	// Hash new password
	passwordConfig := utils.DefaultPasswordConfig()
	hashedPassword, err := utils.HashPassword(req.NewPassword, passwordConfig)
	if err != nil {
		return fmt.Errorf("failed to hash password: %w", err)
	}

	// Update password and recovery codes
	updates := map[string]interface{}{
		"password_hash":  hashedPassword,
		"recovery_codes": newCodes,
		"updated_at":     time.Now(),
	}

	return s.userRepo.Update(ctx, user.ID, updates)
}

// GenerateNewRecoveryCodes generates a new set of recovery codes for a user
func (s *userService) GenerateNewRecoveryCodes(ctx context.Context, userID primitive.ObjectID) (*models.RecoveryCodesResponse, error) {
	// Generate new recovery codes
	newCodes, err := utils.GenerateRecoveryCodes(8)
	if err != nil {
		return nil, fmt.Errorf("failed to generate recovery codes: %w", err)
	}

	// Update user with new codes
	updates := map[string]interface{}{
		"recovery_codes": newCodes,
		"updated_at":     time.Now(),
	}

	if err := s.userRepo.Update(ctx, userID, updates); err != nil {
		return nil, fmt.Errorf("failed to update recovery codes: %w", err)
	}

	return &models.RecoveryCodesResponse{
		Codes:   newCodes,
		Message: "New recovery codes generated. Please save these codes in a secure location.",
	}, nil
}

// GetRecoveryCodes returns the current recovery codes for a user
func (s *userService) GetRecoveryCodes(ctx context.Context, userID primitive.ObjectID) (*models.RecoveryCodesResponse, error) {
	// Get user
	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		return nil, errors.New("user not found")
	}

	if len(user.RecoveryCodes) == 0 {
		return &models.RecoveryCodesResponse{
			Codes:   []string{},
			Message: "No recovery codes available. Generate new codes if needed.",
		}, nil
	}

	return &models.RecoveryCodesResponse{
		Codes:   user.RecoveryCodes,
		Message: fmt.Sprintf("You have %d recovery codes remaining.", len(user.RecoveryCodes)),
	}, nil
}
