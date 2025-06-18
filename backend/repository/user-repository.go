package repository

import (
	"context"
	"errors"
	"fmt"
	"time"

	"backend/models"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type UserRepository interface {
	Create(ctx context.Context, user *models.User) error
	CreateMahasiswa(ctx context.Context, mahasiswa *models.UserMahasiswa) error
	CreateAdmin(ctx context.Context, admin *models.Admin) error
	GetByID(ctx context.Context, id primitive.ObjectID) (*models.User, error)
	GetByEmail(ctx context.Context, email string) (*models.User, error)
	GetMahasiswaByID(ctx context.Context, id primitive.ObjectID) (*models.UserMahasiswa, error)
	GetMahasiswaByEmail(ctx context.Context, email string) (*models.UserMahasiswa, error)
	GetMahasiswaByNIM(ctx context.Context, nim string) (*models.UserMahasiswa, error)
	GetAdminByID(ctx context.Context, id primitive.ObjectID) (*models.Admin, error)
	GetAdminByEmail(ctx context.Context, email string) (*models.Admin, error)
	GetByOAuthID(ctx context.Context, provider, oauthID string) (*models.User, error)
	GetByResetToken(ctx context.Context, token string) (*models.User, error)
	GetByVerificationToken(ctx context.Context, token string) (*models.User, error)
	GetByRefreshToken(ctx context.Context, token string) (*models.User, error)
	Update(ctx context.Context, id primitive.ObjectID, updates bson.M) error
	UpdatePassword(ctx context.Context, id primitive.ObjectID, passwordHash string) error
	SetResetToken(ctx context.Context, id primitive.ObjectID, token string, expiry time.Time) error
	ClearResetToken(ctx context.Context, id primitive.ObjectID) error
	SetVerificationToken(ctx context.Context, id primitive.ObjectID, token string) error
	VerifyEmail(ctx context.Context, id primitive.ObjectID) error
	SetRefreshToken(ctx context.Context, id primitive.ObjectID, token string) error
	ClearRefreshToken(ctx context.Context, id primitive.ObjectID) error
	UpdateLastLogin(ctx context.Context, id primitive.ObjectID) error
	Delete(ctx context.Context, id primitive.ObjectID) error
	List(ctx context.Context, filter bson.M, page, limit int) ([]*models.User, int64, error)

	// New user management methods
	ListUsers(ctx context.Context, req *models.ListUsersRequest) (*models.ListUsersResponse, error)
	UpdateUserStatus(ctx context.Context, id primitive.ObjectID, status models.UserStatus) error
	GetUserStats(ctx context.Context) (*models.UserStatsResponse, error)
	GetRecentRegistrations(ctx context.Context, days int) (int64, error)
	SearchUsers(ctx context.Context, query string, userType models.UserType, status models.UserStatus, page, limit int) ([]*models.UserSummary, int64, error)

	// UpdateLastLogout updates the user's last logout timestamp
	UpdateLastLogout(userID string) error
}

type userRepository struct {
	db                  *mongo.Database
	userCollection      *mongo.Collection
	mahasiswaCollection *mongo.Collection
	adminCollection     *mongo.Collection
}

func NewUserRepository(db *mongo.Database) UserRepository {
	return &userRepository{
		db:                  db,
		userCollection:      db.Collection("users"),
		mahasiswaCollection: db.Collection("mahasiswa"),
		adminCollection:     db.Collection("admins"),
	}
}

func (r *userRepository) Create(ctx context.Context, user *models.User) error {
	user.ID = primitive.NewObjectID()
	user.CreatedAt = time.Now()
	user.UpdatedAt = time.Now()

	_, err := r.userCollection.InsertOne(ctx, user)
	return err
}

func (r *userRepository) CreateMahasiswa(ctx context.Context, mahasiswa *models.UserMahasiswa) error {
	mahasiswa.ID = primitive.NewObjectID()
	mahasiswa.CreatedAt = time.Now()
	mahasiswa.UpdatedAt = time.Now()

	_, err := r.mahasiswaCollection.InsertOne(ctx, mahasiswa)
	return err
}

func (r *userRepository) CreateAdmin(ctx context.Context, admin *models.Admin) error {
	admin.ID = primitive.NewObjectID()
	admin.CreatedAt = time.Now()
	admin.UpdatedAt = time.Now()
	admin.IsAdmin = true

	_, err := r.adminCollection.InsertOne(ctx, admin)
	return err
}

func (r *userRepository) GetByID(ctx context.Context, id primitive.ObjectID) (*models.User, error) {
	var user models.User
	err := r.userCollection.FindOne(ctx, bson.M{"_id": id}).Decode(&user)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, errors.New("user not found")
		}
		return nil, err
	}
	return &user, nil
}

func (r *userRepository) GetByEmail(ctx context.Context, email string) (*models.User, error) {
	var user models.User
	err := r.userCollection.FindOne(ctx, bson.M{"email": email}).Decode(&user)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, errors.New("user not found")
		}
		return nil, err
	}
	return &user, nil
}

func (r *userRepository) GetMahasiswaByID(ctx context.Context, id primitive.ObjectID) (*models.UserMahasiswa, error) {
	var mahasiswa models.UserMahasiswa
	err := r.mahasiswaCollection.FindOne(ctx, bson.M{"_id": id}).Decode(&mahasiswa)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, errors.New("mahasiswa not found")
		}
		return nil, err
	}
	return &mahasiswa, nil
}

func (r *userRepository) GetMahasiswaByEmail(ctx context.Context, email string) (*models.UserMahasiswa, error) {
	var mahasiswa models.UserMahasiswa
	err := r.mahasiswaCollection.FindOne(ctx, bson.M{"email": email}).Decode(&mahasiswa)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, errors.New("mahasiswa not found")
		}
		return nil, err
	}
	return &mahasiswa, nil
}

func (r *userRepository) GetMahasiswaByNIM(ctx context.Context, nim string) (*models.UserMahasiswa, error) {
	var mahasiswa models.UserMahasiswa
	err := r.mahasiswaCollection.FindOne(ctx, bson.M{"mahasiswa_id": nim}).Decode(&mahasiswa)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, errors.New("mahasiswa not found")
		}
		return nil, err
	}
	return &mahasiswa, nil
}

func (r *userRepository) GetAdminByID(ctx context.Context, id primitive.ObjectID) (*models.Admin, error) {
	var admin models.Admin
	err := r.adminCollection.FindOne(ctx, bson.M{"_id": id}).Decode(&admin)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, errors.New("admin not found")
		}
		return nil, err
	}
	return &admin, nil
}

func (r *userRepository) GetAdminByEmail(ctx context.Context, email string) (*models.Admin, error) {
	var admin models.Admin
	err := r.adminCollection.FindOne(ctx, bson.M{"email": email}).Decode(&admin)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, errors.New("admin not found")
		}
		return nil, err
	}
	return &admin, nil
}

func (r *userRepository) GetByOAuthID(ctx context.Context, provider, oauthID string) (*models.User, error) {
	var fieldName string
	switch provider {
	case "google":
		fieldName = "google_id"
	case "facebook":
		fieldName = "facebook_id"
	case "x":
		fieldName = "x_id"
	case "github":
		fieldName = "github_id"
	default:
		return nil, errors.New("invalid oauth provider")
	}

	// Check in all collections
	collections := []*mongo.Collection{r.userCollection, r.mahasiswaCollection, r.adminCollection}

	for _, collection := range collections {
		var user models.User
		err := collection.FindOne(ctx, bson.M{fieldName: oauthID}).Decode(&user)
		if err == nil {
			return &user, nil
		}
		if err != mongo.ErrNoDocuments {
			return nil, err
		}
	}

	return nil, errors.New("user not found")
}

func (r *userRepository) GetByResetToken(ctx context.Context, token string) (*models.User, error) {
	filter := bson.M{
		"reset_token":        token,
		"reset_token_expiry": bson.M{"$gt": time.Now()},
	}

	// Check in all collections
	collections := []*mongo.Collection{r.userCollection, r.mahasiswaCollection, r.adminCollection}

	for _, collection := range collections {
		var user models.User
		err := collection.FindOne(ctx, filter).Decode(&user)
		if err == nil {
			return &user, nil
		}
		if err != mongo.ErrNoDocuments {
			return nil, err
		}
	}

	return nil, errors.New("invalid or expired reset token")
}

func (r *userRepository) GetByVerificationToken(ctx context.Context, token string) (*models.User, error) {
	filter := bson.M{"verification_token": token}

	// Check in all collections
	collections := []*mongo.Collection{r.userCollection, r.mahasiswaCollection, r.adminCollection}

	for _, collection := range collections {
		var user models.User
		err := collection.FindOne(ctx, filter).Decode(&user)
		if err == nil {
			return &user, nil
		}
		if err != mongo.ErrNoDocuments {
			return nil, err
		}
	}

	return nil, errors.New("invalid verification token")
}

func (r *userRepository) GetByRefreshToken(ctx context.Context, token string) (*models.User, error) {
	filter := bson.M{"refresh_token": token}

	// Check in all collections
	collections := []*mongo.Collection{r.userCollection, r.mahasiswaCollection, r.adminCollection}

	for _, collection := range collections {
		var user models.User
		err := collection.FindOne(ctx, filter).Decode(&user)
		if err == nil {
			return &user, nil
		}
		if err != mongo.ErrNoDocuments {
			return nil, err
		}
	}

	return nil, errors.New("invalid refresh token")
}

func (r *userRepository) Update(ctx context.Context, id primitive.ObjectID, updates bson.M) error {
	updates["updated_at"] = time.Now()

	// Try to update in all collections
	collections := []*mongo.Collection{r.userCollection, r.mahasiswaCollection, r.adminCollection}

	for _, collection := range collections {
		result, err := collection.UpdateOne(ctx, bson.M{"_id": id}, bson.M{"$set": updates})
		if err != nil {
			return err
		}
		if result.MatchedCount > 0 {
			return nil
		}
	}

	return errors.New("user not found")
}

func (r *userRepository) UpdatePassword(ctx context.Context, id primitive.ObjectID, passwordHash string) error {
	return r.Update(ctx, id, bson.M{"password_hash": passwordHash})
}

func (r *userRepository) SetResetToken(ctx context.Context, id primitive.ObjectID, token string, expiry time.Time) error {
	return r.Update(ctx, id, bson.M{
		"reset_token":        token,
		"reset_token_expiry": expiry,
	})
}

func (r *userRepository) ClearResetToken(ctx context.Context, id primitive.ObjectID) error {
	return r.Update(ctx, id, bson.M{
		"$unset": bson.M{
			"reset_token":        "",
			"reset_token_expiry": "",
		},
	})
}

func (r *userRepository) SetVerificationToken(ctx context.Context, id primitive.ObjectID, token string) error {
	return r.Update(ctx, id, bson.M{"verification_token": token})
}

func (r *userRepository) VerifyEmail(ctx context.Context, id primitive.ObjectID) error {
	return r.Update(ctx, id, bson.M{
		"email_verified": true,
		"$unset":         bson.M{"verification_token": ""},
	})
}

func (r *userRepository) SetRefreshToken(ctx context.Context, id primitive.ObjectID, token string) error {
	return r.Update(ctx, id, bson.M{"refresh_token": token})
}

func (r *userRepository) ClearRefreshToken(ctx context.Context, id primitive.ObjectID) error {
	return r.Update(ctx, id, bson.M{
		"$unset": bson.M{"refresh_token": ""},
	})
}

func (r *userRepository) UpdateLastLogin(ctx context.Context, id primitive.ObjectID) error {
	return r.Update(ctx, id, bson.M{"last_login": time.Now()})
}

func (r *userRepository) Delete(ctx context.Context, id primitive.ObjectID) error {
	// Try to delete from all collections
	collections := []*mongo.Collection{r.userCollection, r.mahasiswaCollection, r.adminCollection}

	for _, collection := range collections {
		result, err := collection.DeleteOne(ctx, bson.M{"_id": id})
		if err != nil {
			return err
		}
		if result.DeletedCount > 0 {
			return nil
		}
	}

	return errors.New("user not found")
}

func (r *userRepository) List(ctx context.Context, filter bson.M, page, limit int) ([]*models.User, int64, error) {
	skip := (page - 1) * limit

	opts := options.Find().
		SetSkip(int64(skip)).
		SetLimit(int64(limit)).
		SetSort(bson.M{"created_at": -1})

	cursor, err := r.userCollection.Find(ctx, filter, opts)
	if err != nil {
		return nil, 0, err
	}
	defer cursor.Close(ctx)

	var users []*models.User
	if err := cursor.All(ctx, &users); err != nil {
		return nil, 0, err
	}

	count, err := r.userCollection.CountDocuments(ctx, filter)
	if err != nil {
		return nil, 0, err
	}

	return users, count, nil
}

// New user management methods

func (r *userRepository) ListUsers(ctx context.Context, req *models.ListUsersRequest) (*models.ListUsersResponse, error) {
	// Set defaults
	page := 1
	limit := 20
	if req.Page > 0 {
		page = req.Page
	}
	if req.Limit > 0 {
		limit = req.Limit
	}

	// Build filter for search across all collections
	filter := bson.M{}

	// Search filter
	if req.Search != "" {
		filter["$or"] = []bson.M{
			{"full_name": bson.M{"$regex": req.Search, "$options": "i"}},
			{"email": bson.M{"$regex": req.Search, "$options": "i"}},
		}
	}

	// User type filter
	if req.UserType != "" {
		filter["user_type"] = req.UserType
	}

	// Status filter
	if req.Status != "" {
		filter["status"] = req.Status
	}

	skip := (page - 1) * limit
	opts := options.Find().
		SetSkip(int64(skip)).
		SetLimit(int64(limit)).
		SetSort(bson.M{"created_at": -1})

	var allUsers []models.UserSummary
	totalCount := int64(0)

	// Search in all user collections
	collections := []struct {
		coll     *mongo.Collection
		userType models.UserType
	}{
		{r.userCollection, ""}, // General users
		{r.mahasiswaCollection, models.UserTypeMahasiswa},
		{r.adminCollection, models.UserTypeAdmin},
	}

	for _, c := range collections {
		// Apply user type filter for specific collections
		collectionFilter := filter
		if c.userType != "" && req.UserType == "" {
			// If no specific user type requested, include collection's default type
			collectionFilter = bson.M{}
			for k, v := range filter {
				collectionFilter[k] = v
			}
		} else if req.UserType != "" && c.userType != "" && req.UserType != c.userType {
			// Skip this collection if it doesn't match the requested user type
			continue
		}

		cursor, err := c.coll.Find(ctx, collectionFilter, opts)
		if err != nil {
			continue // Skip this collection on error
		}

		var users []models.UserSummary
		if c.userType == models.UserTypeMahasiswa {
			var mahasiswaUsers []models.UserMahasiswa
			if err := cursor.All(ctx, &mahasiswaUsers); err == nil {
				for _, u := range mahasiswaUsers {
					users = append(users, models.UserSummary{
						ID:            u.ID,
						FullName:      u.FullName,
						Email:         u.Email,
						UserType:      models.UserTypeMahasiswa,
						Status:        u.Status,
						EmailVerified: u.EmailVerified,
						LastLogin:     u.LastLogin,
						CreatedAt:     u.CreatedAt,
						NIM:           u.NIM,
						Faculty:       u.Faculty,
						Major:         u.Major,
					})
				}
			}
		} else if c.userType == models.UserTypeAdmin {
			var adminUsers []models.Admin
			if err := cursor.All(ctx, &adminUsers); err == nil {
				for _, u := range adminUsers {
					users = append(users, models.UserSummary{
						ID:            u.ID,
						FullName:      u.FullName,
						Email:         u.Email,
						UserType:      models.UserTypeAdmin,
						Status:        u.Status,
						EmailVerified: u.EmailVerified,
						LastLogin:     u.LastLogin,
						CreatedAt:     u.CreatedAt,
					})
				}
			}
		} else {
			var generalUsers []models.User
			if err := cursor.All(ctx, &generalUsers); err == nil {
				for _, u := range generalUsers {
					users = append(users, models.UserSummary{
						ID:            u.ID,
						FullName:      u.FullName,
						Email:         u.Email,
						UserType:      u.UserType,
						Status:        u.Status,
						EmailVerified: u.EmailVerified,
						LastLogin:     u.LastLogin,
						CreatedAt:     u.CreatedAt,
					})
				}
			}
		}

		cursor.Close(ctx)
		allUsers = append(allUsers, users...)

		// Count documents in this collection
		count, err := c.coll.CountDocuments(ctx, collectionFilter)
		if err == nil {
			totalCount += count
		}
	}

	totalPages := int(totalCount)/limit + 1
	if int(totalCount)%limit == 0 && totalCount > 0 {
		totalPages = int(totalCount) / limit
	}

	return &models.ListUsersResponse{
		Users:      allUsers,
		Total:      totalCount,
		Page:       page,
		Limit:      limit,
		TotalPages: totalPages,
	}, nil
}

func (r *userRepository) UpdateUserStatus(ctx context.Context, id primitive.ObjectID, status models.UserStatus) error {
	updates := bson.M{
		"status":     status,
		"updated_at": time.Now(),
	}
	return r.Update(ctx, id, updates)
}

func (r *userRepository) GetUserStats(ctx context.Context) (*models.UserStatsResponse, error) {
	stats := &models.UserStatsResponse{
		ByType:   make(map[string]int64),
		ByStatus: make(map[string]int64),
	}

	// Count users by type and status across all collections
	collections := []struct {
		coll     *mongo.Collection
		userType string
	}{
		{r.userCollection, "general"},
		{r.mahasiswaCollection, "mahasiswa"},
		{r.adminCollection, "admin"},
	}

	for _, c := range collections {
		total, _ := c.coll.CountDocuments(ctx, bson.M{})
		stats.TotalUsers += total
		stats.ByType[c.userType] = total

		// Count by status
		statuses := []models.UserStatus{
			models.UserStatusActive,
			models.UserStatusPending,
			models.UserStatusSuspended,
			models.UserStatusRejected,
		}

		for _, status := range statuses {
			count, _ := c.coll.CountDocuments(ctx, bson.M{"status": status})
			stats.ByStatus[string(status)] += count

			switch status {
			case models.UserStatusActive:
				stats.ActiveUsers += count
			case models.UserStatusPending:
				stats.PendingUsers += count
			case models.UserStatusSuspended:
				stats.SuspendedUsers += count
			}
		}
	}

	// Get recent registrations (last 7 days)
	weekAgo := time.Now().AddDate(0, 0, -7)
	recentFilter := bson.M{"created_at": bson.M{"$gte": weekAgo}}

	for _, c := range collections {
		count, _ := c.coll.CountDocuments(ctx, recentFilter)
		stats.RecentRegistrations += count
	}

	// Pending requests count (assuming this is handled separately in access requests)
	stats.PendingRequests = stats.PendingUsers

	return stats, nil
}

func (r *userRepository) GetRecentRegistrations(ctx context.Context, days int) (int64, error) {
	since := time.Now().AddDate(0, 0, -days)
	filter := bson.M{"created_at": bson.M{"$gte": since}}

	var total int64
	collections := []*mongo.Collection{r.userCollection, r.mahasiswaCollection, r.adminCollection}

	for _, collection := range collections {
		count, err := collection.CountDocuments(ctx, filter)
		if err == nil {
			total += count
		}
	}

	return total, nil
}

func (r *userRepository) SearchUsers(ctx context.Context, query string, userType models.UserType, status models.UserStatus, page, limit int) ([]*models.UserSummary, int64, error) {
	req := &models.ListUsersRequest{
		Page:     page,
		Limit:    limit,
		Search:   query,
		UserType: userType,
		Status:   status,
	}

	response, err := r.ListUsers(ctx, req)
	if err != nil {
		return nil, 0, err
	}

	// Convert to pointer slice
	users := make([]*models.UserSummary, len(response.Users))
	for i := range response.Users {
		users[i] = &response.Users[i]
	}

	return users, response.Total, nil
}

// UpdateLastLogout updates the user's last logout timestamp
func (r *userRepository) UpdateLastLogout(userID string) error {
	now := time.Now()

	// Convert userID to ObjectID
	objectID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return fmt.Errorf("invalid user ID format: %v", err)
	}

	// Update the user's last_logout field
	filter := bson.M{"_id": objectID}
	update := bson.M{
		"$set": bson.M{
			"last_logout": now,
			"updated_at":  now,
		},
	}

	_, err = r.userCollection.UpdateOne(context.Background(), filter, update)
	if err != nil {
		return fmt.Errorf("failed to update last logout: %v", err)
	}

	return nil
}
