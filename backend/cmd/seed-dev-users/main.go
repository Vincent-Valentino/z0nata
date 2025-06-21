package main

import (
	"context"
	"fmt"
	"log"

	"backend/config"
	"backend/database"
	"backend/models"
	"backend/repository"
	"backend/utils"
)

func main() {
	fmt.Println("🚀 Starting dev user seed script ...")

	// Load config – uses environment variables or defaults
	cfg := config.LoadConfig()

	// Connect to MongoDB
	db, err := database.ConnectMongoDB(cfg.Database)
	if err != nil {
		log.Fatalf("❌ Failed to connect to MongoDB: %v", err)
	}

	// Init repositories
	userRepo := repository.NewUserRepository(db)

	ctx := context.Background()

	// Helper to ensure user exists or update password if exists
	ensureAdmin(ctx, userRepo)
	ensureMahasiswa(ctx, userRepo)
	ensureRegularUser(ctx, userRepo)

	fmt.Println("✅ Dev user seeding completed")
}

func ensureAdmin(ctx context.Context, repo repository.UserRepository) {
	email := "william.zonata@admin.com"
	admin, _ := repo.GetAdminByEmail(ctx, email)

	passwordHash, _ := utils.HashPassword("admin123", utils.DefaultPasswordConfig())

	if admin != nil {
		// Update password hash in case it changed
		_ = repo.UpdatePassword(ctx, admin.ID, passwordHash)
		fmt.Printf("🔄 Admin user already exists – password updated (%s)\n", email)
		return
	}

	adminUser := &models.Admin{
		User: models.User{
			FullName:       "William Zonata",
			Email:          email,
			PasswordHash:   passwordHash,
			EmailVerified:  true,
			ProfilePicture: "https://ui-avatars.io/api/?name=William+Zonata&background=ef4444&color=fff",
			UserType:       models.UserTypeAdmin,
			Status:         models.UserStatusActive,
		},
		IsAdmin:     true,
		Permissions: []string{"read", "write", "delete", "admin"},
	}

	if err := repo.CreateAdmin(ctx, adminUser); err != nil {
		fmt.Printf("❌ Failed to create admin user: %v\n", err)
		return
	}
	fmt.Printf("✅ Admin user created (%s)\n", email)
}

func ensureMahasiswa(ctx context.Context, repo repository.UserRepository) {
	email := "vincent.valentino@student.com"
	mhs, _ := repo.GetMahasiswaByEmail(ctx, email)

	passwordHash, _ := utils.HashPassword("student123", utils.DefaultPasswordConfig())

	if mhs != nil {
		_ = repo.UpdatePassword(ctx, mhs.ID, passwordHash)
		fmt.Printf("🔄 Mahasiswa user already exists – password updated (%s)\n", email)
		return
	}

	mahasiswa := &models.UserMahasiswa{
		User: models.User{
			FullName:       "Vincent Valentino",
			Email:          email,
			PasswordHash:   passwordHash,
			EmailVerified:  true,
			ProfilePicture: "https://ui-avatars.io/api/?name=Vincent+Valentino&background=22c55e&color=fff",
			UserType:       models.UserTypeMahasiswa,
			Status:         models.UserStatusActive,
		},
		NIM:     "2021001234",
		Faculty: "Fakultas Teknik",
		Major:   "Teknik Informatika",
	}

	if err := repo.CreateMahasiswa(ctx, mahasiswa); err != nil {
		fmt.Printf("❌ Failed to create mahasiswa user: %v\n", err)
		return
	}
	fmt.Printf("✅ Mahasiswa user created (%s)\n", email)
}

func ensureRegularUser(ctx context.Context, repo repository.UserRepository) {
	email := "johnny.tester@user.com"
	user, _ := repo.GetByEmail(ctx, email)

	passwordHash, _ := utils.HashPassword("user123", utils.DefaultPasswordConfig())

	if user != nil {
		_ = repo.UpdatePassword(ctx, user.ID, passwordHash)
		fmt.Printf("🔄 Regular user already exists – password updated (%s)\n", email)
		return
	}

	regular := &models.User{
		FullName:       "Johnny Tester",
		Email:          email,
		PasswordHash:   passwordHash,
		EmailVerified:  true,
		ProfilePicture: "https://ui-avatars.io/api/?name=Johnny+Tester&background=3b82f6&color=fff",
		UserType:       models.UserType("user"),
		Status:         models.UserStatusActive,
	}

	if err := repo.Create(ctx, regular); err != nil {
		fmt.Printf("❌ Failed to create regular user: %v\n", err)
		return
	}
	fmt.Printf("✅ Regular user created (%s)\n", email)
}
