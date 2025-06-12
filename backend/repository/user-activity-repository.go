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

type UserActivityRepository interface {
	// Quiz Results
	CreateQuizResult(ctx context.Context, result *models.QuizResult) (*models.QuizResult, error)
	GetUserQuizResults(ctx context.Context, userID primitive.ObjectID, filter models.QuizResultsFilter) ([]models.QuizResult, int64, error)
	GetQuizResultByID(ctx context.Context, id primitive.ObjectID) (*models.QuizResult, error)

	// User Statistics
	GetUserStats(ctx context.Context, userID primitive.ObjectID) (*models.UserStats, error)
	UpsertUserStats(ctx context.Context, stats *models.UserStats) error
	UpdateUserStats(ctx context.Context, userID primitive.ObjectID, result *models.QuizResult) error

	// Achievements
	GetUserAchievements(ctx context.Context, userID primitive.ObjectID) ([]models.Achievement, error)
	CreateAchievement(ctx context.Context, achievement *models.Achievement) error
	CheckAndCreateAchievements(ctx context.Context, userID primitive.ObjectID, result *models.QuizResult) ([]models.Achievement, error)
}

type userActivityRepository struct {
	db              *mongo.Database
	resultsCol      *mongo.Collection
	statsCol        *mongo.Collection
	achievementsCol *mongo.Collection
}

func NewUserActivityRepository(db *mongo.Database) UserActivityRepository {
	return &userActivityRepository{
		db:              db,
		resultsCol:      db.Collection("quiz_results"),
		statsCol:        db.Collection("user_stats"),
		achievementsCol: db.Collection("achievements"),
	}
}

// Quiz Results
func (r *userActivityRepository) CreateQuizResult(ctx context.Context, result *models.QuizResult) (*models.QuizResult, error) {
	result.ID = primitive.NewObjectID()
	result.CreatedAt = time.Now()
	result.UpdatedAt = time.Now()
	result.CompletedAt = time.Now()
	result.Status = "completed"

	// Generate title based on quiz type and count
	userQuizCount, _ := r.resultsCol.CountDocuments(ctx, bson.M{
		"user_id":   result.UserID,
		"quiz_type": result.QuizType,
	})

	switch result.QuizType {
	case models.MockTest:
		result.Title = fmt.Sprintf("Mock Test #%d", userQuizCount+1)
	case models.TimeQuiz:
		result.Title = fmt.Sprintf("Time Quiz #%d", userQuizCount+1)
	default:
		result.Title = fmt.Sprintf("Quiz #%d", userQuizCount+1)
	}

	_, err := r.resultsCol.InsertOne(ctx, result)
	if err != nil {
		return nil, err
	}

	return result, nil
}

func (r *userActivityRepository) GetUserQuizResults(ctx context.Context, userID primitive.ObjectID, filter models.QuizResultsFilter) ([]models.QuizResult, int64, error) {
	// Build filter
	mongoFilter := bson.M{"user_id": userID}

	if filter.QuizType != "" {
		mongoFilter["quiz_type"] = filter.QuizType
	}

	if filter.DateFrom != "" || filter.DateTo != "" {
		dateFilter := bson.M{}
		if filter.DateFrom != "" {
			if dateFrom, err := time.Parse("2006-01-02", filter.DateFrom); err == nil {
				dateFilter["$gte"] = dateFrom
			}
		}
		if filter.DateTo != "" {
			if dateTo, err := time.Parse("2006-01-02", filter.DateTo); err == nil {
				dateFilter["$lte"] = dateTo.Add(24 * time.Hour)
			}
		}
		if len(dateFilter) > 0 {
			mongoFilter["completed_at"] = dateFilter
		}
	}

	// Count total documents
	totalCount, err := r.resultsCol.CountDocuments(ctx, mongoFilter)
	if err != nil {
		return nil, 0, err
	}

	// Build options
	opts := options.Find()
	opts.SetSort(bson.D{{Key: "completed_at", Value: -1}}) // Sort by completion date descending

	if filter.Limit > 0 {
		opts.SetLimit(int64(filter.Limit))
	}
	if filter.Page > 1 && filter.Limit > 0 {
		skip := int64((filter.Page - 1) * filter.Limit)
		opts.SetSkip(skip)
	}

	cursor, err := r.resultsCol.Find(ctx, mongoFilter, opts)
	if err != nil {
		return nil, 0, err
	}
	defer cursor.Close(ctx)

	var results []models.QuizResult
	if err = cursor.All(ctx, &results); err != nil {
		return nil, 0, err
	}

	return results, totalCount, nil
}

func (r *userActivityRepository) GetQuizResultByID(ctx context.Context, id primitive.ObjectID) (*models.QuizResult, error) {
	var result models.QuizResult
	err := r.resultsCol.FindOne(ctx, bson.M{"_id": id}).Decode(&result)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, errors.New("quiz result not found")
		}
		return nil, err
	}
	return &result, nil
}

// User Statistics
func (r *userActivityRepository) GetUserStats(ctx context.Context, userID primitive.ObjectID) (*models.UserStats, error) {
	var stats models.UserStats
	err := r.statsCol.FindOne(ctx, bson.M{"user_id": userID}).Decode(&stats)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			// Create default stats if not found
			stats = models.UserStats{
				ID:                    primitive.NewObjectID(),
				UserID:                userID,
				TotalQuizzesCompleted: 0,
				AverageScore:          0,
				TotalTimeSpent:        0,
				TotalQuestions:        0,
				TotalCorrectAnswers:   0,
				WeeklyGoal:            5,
				TargetAverageScore:    80,
				UpdatedAt:             time.Now(),
			}
			_, insertErr := r.statsCol.InsertOne(ctx, &stats)
			if insertErr != nil {
				return nil, insertErr
			}
		} else {
			return nil, err
		}
	}
	return &stats, nil
}

func (r *userActivityRepository) UpsertUserStats(ctx context.Context, stats *models.UserStats) error {
	stats.UpdatedAt = time.Now()
	filter := bson.M{"user_id": stats.UserID}
	update := bson.M{"$set": stats}
	opts := options.Update().SetUpsert(true)

	_, err := r.statsCol.UpdateOne(ctx, filter, update, opts)
	return err
}

func (r *userActivityRepository) UpdateUserStats(ctx context.Context, userID primitive.ObjectID, result *models.QuizResult) error {
	// Get current stats
	stats, err := r.GetUserStats(ctx, userID)
	if err != nil {
		return err
	}

	// Update stats with new result
	stats.TotalQuizzesCompleted++
	stats.TotalTimeSpent += result.TimeSpent
	stats.TotalQuestions += result.TotalQuestions
	stats.TotalCorrectAnswers += result.CorrectAnswers

	// Recalculate average score
	stats.AverageScore = float64(stats.TotalCorrectAnswers) / float64(stats.TotalQuestions) * 100

	// Update question type accuracies
	totalSingleChoice := stats.SingleChoiceAccuracy
	totalMultipleChoice := stats.MultipleChoiceAccuracy
	totalEssay := stats.EssayAccuracy

	if result.SingleChoiceTotal > 0 {
		newAccuracy := float64(result.SingleChoiceCorrect) / float64(result.SingleChoiceTotal) * 100
		stats.SingleChoiceAccuracy = (totalSingleChoice + newAccuracy) / 2
	}
	if result.MultipleChoiceTotal > 0 {
		newAccuracy := float64(result.MultipleChoiceCorrect) / float64(result.MultipleChoiceTotal) * 100
		stats.MultipleChoiceAccuracy = (totalMultipleChoice + newAccuracy) / 2
	}
	if result.EssayTotal > 0 {
		newAccuracy := float64(result.EssayCorrect) / float64(result.EssayTotal) * 100
		stats.EssayAccuracy = (totalEssay + newAccuracy) / 2
	}

	// Update quiz type averages and counts
	switch result.QuizType {
	case models.MockTest:
		stats.MockTestCount++
		if stats.MockTestCount == 1 {
			stats.MockTestAverage = float64(result.Score)
		} else {
			stats.MockTestAverage = ((stats.MockTestAverage * float64(stats.MockTestCount-1)) + float64(result.Score)) / float64(stats.MockTestCount)
		}
	case models.TimeQuiz:
		stats.TimeQuizCount++
		if stats.TimeQuizCount == 1 {
			stats.TimeQuizAverage = float64(result.Score)
		} else {
			stats.TimeQuizAverage = ((stats.TimeQuizAverage * float64(stats.TimeQuizCount-1)) + float64(result.Score)) / float64(stats.TimeQuizCount)
		}
		// Update timeout count
		if result.IsTimedOut {
			stats.TimeoutCount++
		}
	}

	// Update time-based statistics
	if result.TotalQuestions > 0 {
		timePerQuestion := float64(result.TimeSpent) / float64(result.TotalQuestions)
		if stats.AverageTimePerQuestion == 0 {
			stats.AverageTimePerQuestion = timePerQuestion
		} else {
			stats.AverageTimePerQuestion = (stats.AverageTimePerQuestion + timePerQuestion) / 2
		}
	}

	// Update fastest quiz time
	if stats.FastestQuizTime == 0 || result.TimeSpent < stats.FastestQuizTime {
		stats.FastestQuizTime = result.TimeSpent
	}

	// Update streak
	now := time.Now()
	lastQuizDate := stats.LastQuizDate
	if lastQuizDate.IsZero() || now.Sub(lastQuizDate).Hours() <= 48 { // Within 2 days
		stats.CurrentStreak++
		if stats.CurrentStreak > stats.LongestStreak {
			stats.LongestStreak = stats.CurrentStreak
		}
	} else {
		stats.CurrentStreak = 1
	}
	stats.LastQuizDate = now

	// Update weekly progress
	weekStart := now.AddDate(0, 0, -int(now.Weekday()))
	weekStart = time.Date(weekStart.Year(), weekStart.Month(), weekStart.Day(), 0, 0, 0, 0, weekStart.Location())

	weeklyCount, _ := r.resultsCol.CountDocuments(ctx, bson.M{
		"user_id":      userID,
		"completed_at": bson.M{"$gte": weekStart},
	})
	stats.WeeklyProgress = int(weeklyCount)

	return r.UpsertUserStats(ctx, stats)
}

// Achievements
func (r *userActivityRepository) GetUserAchievements(ctx context.Context, userID primitive.ObjectID) ([]models.Achievement, error) {
	cursor, err := r.achievementsCol.Find(ctx, bson.M{"user_id": userID}, options.Find().SetSort(bson.D{{Key: "earned_at", Value: -1}}))
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var achievements []models.Achievement
	if err = cursor.All(ctx, &achievements); err != nil {
		return nil, err
	}

	return achievements, nil
}

func (r *userActivityRepository) CreateAchievement(ctx context.Context, achievement *models.Achievement) error {
	achievement.ID = primitive.NewObjectID()
	achievement.EarnedAt = time.Now()

	_, err := r.achievementsCol.InsertOne(ctx, achievement)
	return err
}

func (r *userActivityRepository) CheckAndCreateAchievements(ctx context.Context, userID primitive.ObjectID, result *models.QuizResult) ([]models.Achievement, error) {
	var newAchievements []models.Achievement

	// Check for High Achiever (90%+ score)
	if result.Score >= 90 {
		exists, _ := r.achievementsCol.CountDocuments(ctx, bson.M{
			"user_id": userID,
			"type":    "high_achiever",
		})
		if exists == 0 {
			achievement := models.Achievement{
				UserID:      userID,
				Type:        "high_achiever",
				Title:       "High Achiever",
				Description: "Scored 90%+ on a quiz",
				IconName:    "Trophy",
			}
			if err := r.CreateAchievement(ctx, &achievement); err == nil {
				newAchievements = append(newAchievements, achievement)
			}
		}
	}

	// Check for Time Master (completed time quiz within time limit)
	if result.QuizType == models.TimeQuiz && !result.IsTimedOut {
		exists, _ := r.achievementsCol.CountDocuments(ctx, bson.M{
			"user_id": userID,
			"type":    "time_master",
		})
		if exists == 0 {
			achievement := models.Achievement{
				UserID:      userID,
				Type:        "time_master",
				Title:       "Time Master",
				Description: "Completed time quiz within time limit",
				IconName:    "Clock",
			}
			if err := r.CreateAchievement(ctx, &achievement); err == nil {
				newAchievements = append(newAchievements, achievement)
			}
		}
	}

	// Check for Speed Demon (completed quiz very quickly)
	expectedTime := int64(result.TotalQuestions * 45) // 45 seconds per question
	if result.TimeSpent <= expectedTime {
		exists, _ := r.achievementsCol.CountDocuments(ctx, bson.M{
			"user_id": userID,
			"type":    "speed_demon",
		})
		if exists == 0 {
			achievement := models.Achievement{
				UserID:      userID,
				Type:        "speed_demon",
				Title:       "Speed Demon",
				Description: "Completed quiz in record time",
				IconName:    "Zap",
			}
			if err := r.CreateAchievement(ctx, &achievement); err == nil {
				newAchievements = append(newAchievements, achievement)
			}
		}
	}

	// Check for Mock Test Master (5+ mock tests)
	mockTestCount, _ := r.resultsCol.CountDocuments(ctx, bson.M{
		"user_id":   userID,
		"quiz_type": models.MockTest,
	})
	if mockTestCount >= 5 {
		exists, _ := r.achievementsCol.CountDocuments(ctx, bson.M{
			"user_id": userID,
			"type":    "mock_test_master",
		})
		if exists == 0 {
			achievement := models.Achievement{
				UserID:      userID,
				Type:        "mock_test_master",
				Title:       "Mock Test Master",
				Description: "Completed 5 mock tests",
				IconName:    "BookOpen",
			}
			if err := r.CreateAchievement(ctx, &achievement); err == nil {
				newAchievements = append(newAchievements, achievement)
			}
		}
	}

	// Check for Consistent Learner (10+ total quizzes)
	totalQuizzes, _ := r.resultsCol.CountDocuments(ctx, bson.M{"user_id": userID})
	if totalQuizzes >= 10 {
		exists, _ := r.achievementsCol.CountDocuments(ctx, bson.M{
			"user_id": userID,
			"type":    "consistent_learner",
		})
		if exists == 0 {
			achievement := models.Achievement{
				UserID:      userID,
				Type:        "consistent_learner",
				Title:       "Consistent Learner",
				Description: "Completed 10 quizzes",
				IconName:    "Target",
			}
			if err := r.CreateAchievement(ctx, &achievement); err == nil {
				newAchievements = append(newAchievements, achievement)
			}
		}
	}

	return newAchievements, nil
}
