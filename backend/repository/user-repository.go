package repository

import (
	"context"
	"errors"
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
	case "apple":
		fieldName = "apple_id"
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
