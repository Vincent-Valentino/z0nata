package services

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"math"
	"math/big"
	"sort"
	"time"

	"backend/models"
	"backend/repository"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type QuizSessionService interface {
	// Session Management
	StartQuiz(ctx context.Context, userID primitive.ObjectID, req *models.StartQuizRequest) (*models.StartQuizResponse, error)
	GetSession(ctx context.Context, sessionToken string) (*models.GetSessionResponse, error)
	SaveAnswer(ctx context.Context, sessionToken string, req *models.SaveAnswerRequest) (*models.SaveAnswerResponse, error)
	NavigateToQuestion(ctx context.Context, sessionToken string, req *models.NavigateQuestionRequest) error
	SubmitQuiz(ctx context.Context, sessionToken string) (*models.SubmitQuizResponse, error)

	// Utility
	ResumeSession(ctx context.Context, userID primitive.ObjectID, quizType models.QuizType) (*models.QuizSession, error)
	GetUserResults(ctx context.Context, userID primitive.ObjectID, quizType models.QuizType, limit int) ([]models.DetailedQuizResult, error)
	CleanupExpiredSessions(ctx context.Context) (int64, error)
}

type quizSessionService struct {
	sessionRepo      repository.QuizSessionRepository
	questionRepo     repository.QuestionRepository
	userActivityRepo repository.UserActivityRepository
}

func NewQuizSessionService(
	sessionRepo repository.QuizSessionRepository,
	questionRepo repository.QuestionRepository,
	userActivityRepo repository.UserActivityRepository,
) QuizSessionService {
	return &quizSessionService{
		sessionRepo:      sessionRepo,
		questionRepo:     questionRepo,
		userActivityRepo: userActivityRepo,
	}
}

func (s *quizSessionService) StartQuiz(ctx context.Context, userID primitive.ObjectID, req *models.StartQuizRequest) (*models.StartQuizResponse, error) {
	// Check if user has an active session for this quiz type
	existingSession, err := s.sessionRepo.GetActiveSessionByUser(ctx, userID, req.QuizType)
	if err != nil {
		return nil, fmt.Errorf("failed to check existing session: %w", err)
	}

	if existingSession != nil {
		// Calculate remaining time
		timeRemaining := s.calculateTimeRemaining(existingSession)
		if timeRemaining <= 0 {
			// Session expired, mark as timeout
			err = s.sessionRepo.MarkSessionCompleted(ctx, existingSession.ID, time.Now())
			if err != nil {
				return nil, fmt.Errorf("failed to mark expired session: %w", err)
			}
		} else {
			// Return existing session
			resumeToken := existingSession.SessionToken
			return &models.StartQuizResponse{
				Session:     *existingSession,
				Message:     "Resumed existing quiz session",
				ResumeToken: resumeToken,
			}, nil
		}
	}

	// Get quiz configuration
	config := models.GetQuizConfig(req.QuizType)

	// Select and prepare questions
	questions, totalPoints, err := s.selectQuestions(ctx, req.QuizType, config)
	if err != nil {
		return nil, fmt.Errorf("failed to select questions: %w", err)
	}

	// Generate session token
	sessionToken, err := generateSessionToken()
	if err != nil {
		return nil, fmt.Errorf("failed to generate session token: %w", err)
	}

	// Create quiz session
	session := &models.QuizSession{
		UserID:           userID,
		QuizType:         req.QuizType,
		SessionToken:     sessionToken,
		TotalQuestions:   len(questions),
		MaxPoints:        totalPoints,
		TimeLimitMinutes: config.TimeLimitMinutes,
		Questions:        questions,
		StartTime:        time.Now(),
		TimeRemaining:    int64(config.TimeLimitMinutes * 60), // Convert to seconds
		CurrentQuestion:  0,
		AnsweredCount:    0,
		SkippedCount:     0,
		Status:           models.QuizInProgress,
		IsSubmitted:      false,
	}

	err = s.sessionRepo.CreateSession(ctx, session)
	if err != nil {
		return nil, fmt.Errorf("failed to create session: %w", err)
	}

	return &models.StartQuizResponse{
		Session:     *session,
		Message:     "Quiz session started successfully",
		ResumeToken: sessionToken,
	}, nil
}

func (s *quizSessionService) GetSession(ctx context.Context, sessionToken string) (*models.GetSessionResponse, error) {
	session, err := s.sessionRepo.GetSessionByToken(ctx, sessionToken)
	if err != nil {
		return nil, fmt.Errorf("failed to get session: %w", err)
	}

	timeRemaining := s.calculateTimeRemaining(session)
	isExpired := timeRemaining <= 0

	if isExpired && session.Status == models.QuizInProgress {
		// Mark session as expired
		err = s.sessionRepo.MarkSessionCompleted(ctx, session.ID, time.Now())
		if err != nil {
			return nil, fmt.Errorf("failed to mark session expired: %w", err)
		}
		session.Status = models.QuizTimeout
	}

	return &models.GetSessionResponse{
		Session:       *session,
		TimeRemaining: timeRemaining,
		IsExpired:     isExpired,
	}, nil
}

func (s *quizSessionService) SaveAnswer(ctx context.Context, sessionToken string, req *models.SaveAnswerRequest) (*models.SaveAnswerResponse, error) {
	session, err := s.sessionRepo.GetSessionByToken(ctx, sessionToken)
	if err != nil {
		return nil, fmt.Errorf("failed to get session: %w", err)
	}

	if session.Status != models.QuizInProgress {
		return nil, fmt.Errorf("quiz session is not active")
	}

	// Check if time expired
	timeRemaining := s.calculateTimeRemaining(session)
	if timeRemaining <= 0 {
		return nil, fmt.Errorf("quiz session has expired")
	}

	// Validate question index
	if req.QuestionIndex < 0 || req.QuestionIndex >= len(session.Questions) {
		return nil, fmt.Errorf("invalid question index")
	}

	// Update question answer in database
	err = s.sessionRepo.UpdateQuestionAnswer(ctx, session.ID, req.QuestionIndex, req.Answer, req.TimeSpent)
	if err != nil {
		return nil, fmt.Errorf("failed to save answer: %w", err)
	}

	// For TimeQuiz, provide immediate feedback
	response := &models.SaveAnswerResponse{
		Success: true,
		Message: "Answer saved successfully",
	}

	if session.QuizType == models.TimeQuiz {
		question := session.Questions[req.QuestionIndex]
		isCorrect := s.checkAnswer(question, req.Answer)
		pointsEarned := 0
		if isCorrect {
			pointsEarned = question.Points
		}

		response.IsCorrect = isCorrect
		response.CorrectAnswer = question.CorrectAnswers
		response.PointsEarned = pointsEarned
	}

	return response, nil
}

func (s *quizSessionService) NavigateToQuestion(ctx context.Context, sessionToken string, req *models.NavigateQuestionRequest) error {
	session, err := s.sessionRepo.GetSessionByToken(ctx, sessionToken)
	if err != nil {
		return fmt.Errorf("failed to get session: %w", err)
	}

	if session.Status != models.QuizInProgress {
		return fmt.Errorf("quiz session is not active")
	}

	// Validate question index
	if req.QuestionIndex < 0 || req.QuestionIndex >= len(session.Questions) {
		return fmt.Errorf("invalid question index")
	}

	// Update current question
	answeredCount := 0
	skippedCount := 0
	for _, q := range session.Questions {
		if q.IsAnswered {
			answeredCount++
		} else if q.IsSkipped {
			skippedCount++
		}
	}

	err = s.sessionRepo.UpdateSessionProgress(ctx, session.ID, req.QuestionIndex, answeredCount, skippedCount)
	if err != nil {
		return fmt.Errorf("failed to update session progress: %w", err)
	}

	return nil
}

func (s *quizSessionService) SubmitQuiz(ctx context.Context, sessionToken string) (*models.SubmitQuizResponse, error) {
	session, err := s.sessionRepo.GetSessionByToken(ctx, sessionToken)
	if err != nil {
		return nil, fmt.Errorf("failed to get session: %w", err)
	}

	if session.Status != models.QuizInProgress {
		return nil, fmt.Errorf("quiz session is not active")
	}

	// Mark session as completed
	endTime := time.Now()
	err = s.sessionRepo.MarkSessionCompleted(ctx, session.ID, endTime)
	if err != nil {
		return nil, fmt.Errorf("failed to mark session completed: %w", err)
	}

	// Calculate results
	result, err := s.calculateResults(session, endTime)
	if err != nil {
		return nil, fmt.Errorf("failed to calculate results: %w", err)
	}

	// Save detailed result
	err = s.sessionRepo.CreateDetailedResult(ctx, result)
	if err != nil {
		return nil, fmt.Errorf("failed to save detailed result: %w", err)
	}

	// Also create simple QuizResult for existing user activity tracking
	simpleResult := s.convertToSimpleQuizResult(result, session.UserID)
	_, err = s.userActivityRepo.CreateQuizResult(ctx, simpleResult)
	if err != nil {
		return nil, fmt.Errorf("failed to save simple result: %w", err)
	}

	return &models.SubmitQuizResponse{
		Result:  *result,
		Success: true,
		Message: "Quiz submitted successfully",
	}, nil
}

func (s *quizSessionService) ResumeSession(ctx context.Context, userID primitive.ObjectID, quizType models.QuizType) (*models.QuizSession, error) {
	return s.sessionRepo.GetActiveSessionByUser(ctx, userID, quizType)
}

func (s *quizSessionService) GetUserResults(ctx context.Context, userID primitive.ObjectID, quizType models.QuizType, limit int) ([]models.DetailedQuizResult, error) {
	return s.sessionRepo.GetUserDetailedResults(ctx, userID, quizType, limit)
}

func (s *quizSessionService) CleanupExpiredSessions(ctx context.Context) (int64, error) {
	// Mark sessions that have exceeded their time limit as timeout
	expiredBefore := time.Now().Add(-2 * time.Hour) // Sessions older than 2 hours are expired
	timeoutCount, err := s.sessionRepo.CleanupExpiredSessions(ctx, expiredBefore)
	if err != nil {
		return 0, fmt.Errorf("failed to cleanup expired sessions: %w", err)
	}

	// Mark sessions that haven't been updated in a while as abandoned
	abandonedCount, err := s.sessionRepo.CleanupAbandonedSessions(ctx, 1*time.Hour)
	if err != nil {
		return timeoutCount, fmt.Errorf("failed to cleanup abandoned sessions: %w", err)
	}

	return timeoutCount + abandonedCount, nil
}

// Private helper methods

func (s *quizSessionService) selectQuestions(ctx context.Context, quizType models.QuizType, config models.QuizConfig) ([]models.SessionQuestion, int, error) {
	var questions []models.SessionQuestion
	totalPoints := 0

	switch quizType {
	case models.TimeQuiz:
		// Fixed distribution for TimeQuiz
		easyQuestions, err := s.getQuestionsByDifficulty(ctx, models.Easy, config.EasyQuestions)
		if err != nil {
			return nil, 0, fmt.Errorf("failed to get easy questions: %w", err)
		}

		mediumQuestions, err := s.getQuestionsByDifficulty(ctx, models.Medium, config.MediumQuestions)
		if err != nil {
			return nil, 0, fmt.Errorf("failed to get medium questions: %w", err)
		}

		hardQuestions, err := s.getQuestionsByDifficulty(ctx, models.Hard, config.HardQuestions)
		if err != nil {
			return nil, 0, fmt.Errorf("failed to get hard questions: %w", err)
		}

		// Convert to session questions with fixed points
		questions = append(questions, s.convertToSessionQuestions(easyQuestions, config.EasyPoints)...)
		questions = append(questions, s.convertToSessionQuestions(mediumQuestions, config.MediumPoints)...)
		questions = append(questions, s.convertToSessionQuestions(hardQuestions, config.HardPoints)...)

		totalPoints = len(easyQuestions)*config.EasyPoints + len(mediumQuestions)*config.MediumPoints + len(hardQuestions)*config.HardPoints

	case models.MockTest:
		// Dynamic allocation to reach ~1000 points
		questions, totalPoints, err := s.selectMockTestQuestions(ctx, config)
		if err != nil {
			return nil, 0, fmt.Errorf("failed to select mock test questions: %w", err)
		}
		return questions, totalPoints, nil
	}

	// Shuffle questions
	s.shuffleQuestions(questions)

	return questions, totalPoints, nil
}

func (s *quizSessionService) selectMockTestQuestions(ctx context.Context, config models.QuizConfig) ([]models.SessionQuestion, int, error) {
	// Get available questions by difficulty
	easyQuestions, err := s.getQuestionsByDifficulty(ctx, models.Easy, -1) // Get all
	if err != nil {
		return nil, 0, fmt.Errorf("failed to get easy questions: %w", err)
	}

	mediumQuestions, err := s.getQuestionsByDifficulty(ctx, models.Medium, -1)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to get medium questions: %w", err)
	}

	hardQuestions, err := s.getQuestionsByDifficulty(ctx, models.Hard, -1)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to get hard questions: %w", err)
	}

	// Calculate optimal distribution to reach ~1000 points
	easyCount := min(len(easyQuestions), 80)     // Up to 80 easy (400 points)
	mediumCount := min(len(mediumQuestions), 30) // Up to 30 medium (300 points)
	hardCount := min(len(hardQuestions), 15)     // Up to 15 hard (300 points)

	// Adjust if we don't have enough questions
	totalAvailable := len(easyQuestions) + len(mediumQuestions) + len(hardQuestions)
	if totalAvailable < 50 {
		return nil, 0, fmt.Errorf("insufficient questions available: need at least 50, have %d", totalAvailable)
	}

	// Select random questions from each difficulty
	selectedEasy := s.selectRandomQuestions(easyQuestions, easyCount)
	selectedMedium := s.selectRandomQuestions(mediumQuestions, mediumCount)
	selectedHard := s.selectRandomQuestions(hardQuestions, hardCount)

	// Convert to session questions
	var questions []models.SessionQuestion
	questions = append(questions, s.convertToSessionQuestions(selectedEasy, config.EasyPoints)...)
	questions = append(questions, s.convertToSessionQuestions(selectedMedium, config.MediumPoints)...)
	questions = append(questions, s.convertToSessionQuestions(selectedHard, config.HardPoints)...)

	totalPoints := len(selectedEasy)*config.EasyPoints + len(selectedMedium)*config.MediumPoints + len(selectedHard)*config.HardPoints

	return questions, totalPoints, nil
}

func (s *quizSessionService) getQuestionsByDifficulty(ctx context.Context, difficulty models.DifficultyLevel, limit int) ([]*models.Question, error) {
	// This would use the existing question repository method
	// For now, we'll need to extend the question repository to support getting random questions by difficulty
	return s.questionRepo.GetRandomQuestions(ctx, models.SingleChoice, limit) // Placeholder
}

func (s *quizSessionService) selectRandomQuestions(questions []*models.Question, count int) []*models.Question {
	if count >= len(questions) {
		return questions
	}

	// Shuffle and take first 'count' questions
	shuffled := make([]*models.Question, len(questions))
	copy(shuffled, questions)

	// Fisher-Yates shuffle
	for i := len(shuffled) - 1; i > 0; i-- {
		j, _ := rand.Int(rand.Reader, big.NewInt(int64(i+1)))
		shuffled[i], shuffled[j.Int64()] = shuffled[j.Int64()], shuffled[i]
	}

	return shuffled[:count]
}

func (s *quizSessionService) convertToSessionQuestions(questions []*models.Question, points int) []models.SessionQuestion {
	var sessionQuestions []models.SessionQuestion

	for _, q := range questions {
		// Shuffle options for this session
		shuffledOptions := make([]models.Option, len(q.Options))
		copy(shuffledOptions, q.Options)
		s.shuffleOptions(shuffledOptions)

		sessionQuestions = append(sessionQuestions, models.SessionQuestion{
			QuestionID:     q.ID,
			Title:          q.Title,
			Type:           q.Type,
			Difficulty:     q.Difficulty,
			Points:         points, // Use configured points, not question points
			Options:        shuffledOptions,
			CorrectAnswers: q.CorrectAnswers,
			IsAnswered:     false,
			IsSkipped:      false,
			IsCorrect:      false,
			PointsEarned:   0,
			TimeSpent:      0,
			VisitCount:     0,
		})
	}

	return sessionQuestions
}

func (s *quizSessionService) shuffleQuestions(questions []models.SessionQuestion) {
	for i := len(questions) - 1; i > 0; i-- {
		j, _ := rand.Int(rand.Reader, big.NewInt(int64(i+1)))
		questions[i], questions[j.Int64()] = questions[j.Int64()], questions[i]
	}
}

func (s *quizSessionService) shuffleOptions(options []models.Option) {
	for i := len(options) - 1; i > 0; i-- {
		j, _ := rand.Int(rand.Reader, big.NewInt(int64(i+1)))
		options[i], options[j.Int64()] = options[j.Int64()], options[i]
	}
}

func (s *quizSessionService) calculateTimeRemaining(session *models.QuizSession) int64 {
	elapsed := time.Since(session.StartTime)
	timeLimit := time.Duration(session.TimeLimitMinutes) * time.Minute
	remaining := timeLimit - elapsed

	if remaining < 0 {
		return 0
	}

	return int64(remaining.Seconds())
}

func (s *quizSessionService) checkAnswer(question models.SessionQuestion, userAnswer interface{}) bool {
	// Convert user answer to string slice for comparison
	var userAnswers []string

	switch v := userAnswer.(type) {
	case string:
		userAnswers = []string{v}
	case []string:
		userAnswers = v
	case []interface{}:
		for _, item := range v {
			if str, ok := item.(string); ok {
				userAnswers = append(userAnswers, str)
			}
		}
	default:
		return false
	}

	// Sort both slices for comparison
	sort.Strings(userAnswers)
	correctAnswers := make([]string, len(question.CorrectAnswers))
	copy(correctAnswers, question.CorrectAnswers)
	sort.Strings(correctAnswers)

	// Compare lengths first
	if len(userAnswers) != len(correctAnswers) {
		return false
	}

	// Compare each answer
	for i, answer := range userAnswers {
		if answer != correctAnswers[i] {
			return false
		}
	}

	return true
}

func (s *quizSessionService) calculateResults(session *models.QuizSession, endTime time.Time) (*models.DetailedQuizResult, error) {
	var correctAnswers, wrongAnswers, skippedQuestions int
	var earnedPoints int
	var easyCorrect, easyTotal, mediumCorrect, mediumTotal, hardCorrect, hardTotal int
	var questionResults []models.QuestionResult

	for _, question := range session.Questions {
		// Create question result
		qr := models.QuestionResult{
			QuestionID:    question.QuestionID,
			Title:         question.Title,
			Type:          question.Type,
			Difficulty:    question.Difficulty,
			Points:        question.Points,
			UserAnswer:    question.UserAnswer,
			CorrectAnswer: question.CorrectAnswers,
			IsCorrect:     false,
			IsSkipped:     question.IsSkipped,
			PointsEarned:  0,
			TimeSpent:     question.TimeSpent,
			Options:       question.Options,
		}

		// Count by difficulty
		switch question.Difficulty {
		case models.Easy:
			easyTotal++
		case models.Medium:
			mediumTotal++
		case models.Hard:
			hardTotal++
		}

		if question.IsSkipped {
			skippedQuestions++
		} else if question.IsAnswered {
			isCorrect := s.checkAnswer(question, question.UserAnswer)
			qr.IsCorrect = isCorrect

			if isCorrect {
				correctAnswers++
				earnedPoints += question.Points
				qr.PointsEarned = question.Points

				// Count correct by difficulty
				switch question.Difficulty {
				case models.Easy:
					easyCorrect++
				case models.Medium:
					mediumCorrect++
				case models.Hard:
					hardCorrect++
				}
			} else {
				wrongAnswers++
			}
		}

		questionResults = append(questionResults, qr)
	}

	// Calculate time used
	timeUsedSeconds := int64(endTime.Sub(session.StartTime).Seconds())
	timeLeftSeconds := int64(session.TimeLimitMinutes*60) - timeUsedSeconds
	if timeLeftSeconds < 0 {
		timeLeftSeconds = 0
	}

	// Calculate time bonus for TimeQuiz
	timeBonus := 0
	if session.QuizType == models.TimeQuiz {
		timeBonus = models.CalculateTimeBonus(timeLeftSeconds, 50) // Max 50 bonus points
	}

	finalScore := earnedPoints + timeBonus
	scorePercentage := float64(finalScore) / float64(session.MaxPoints) * 100

	// Determine completion status
	completionStatus := models.QuizCompleted
	if timeLeftSeconds == 0 {
		completionStatus = models.QuizTimeout
	}

	// Create simple QuizResult for backwards compatibility
	simpleScore := int(math.Min(100, scorePercentage)) // Cap at 100%

	result := &models.DetailedQuizResult{
		QuizResult: models.QuizResult{
			UserID:         session.UserID,
			QuizType:       session.QuizType,
			Title:          fmt.Sprintf("%s #%d", session.QuizType, time.Now().Unix()),
			Score:          simpleScore,
			TotalQuestions: session.TotalQuestions,
			CorrectAnswers: correctAnswers,
			TimeSpent:      timeUsedSeconds,
			TimeLimit:      int64(session.TimeLimitMinutes * 60),
			StartedAt:      session.StartTime,
			CompletedAt:    endTime,
			Status:         string(completionStatus),
			IsTimedOut:     completionStatus == models.QuizTimeout,
		},
		SessionID:        session.ID,
		TotalPoints:      session.MaxPoints,
		EarnedPoints:     earnedPoints,
		TimeBonus:        timeBonus,
		FinalScore:       finalScore,
		ScorePercentage:  scorePercentage,
		TimeLimitMinutes: session.TimeLimitMinutes,
		TimeUsedSeconds:  timeUsedSeconds,
		TimeLeftSeconds:  timeLeftSeconds,
		EasyCorrect:      easyCorrect,
		EasyTotal:        easyTotal,
		MediumCorrect:    mediumCorrect,
		MediumTotal:      mediumTotal,
		HardCorrect:      hardCorrect,
		HardTotal:        hardTotal,
		QuestionResults:  questionResults,
		CompletionStatus: completionStatus,
		SubmittedAt:      endTime,
	}

	return result, nil
}

func (s *quizSessionService) convertToSimpleQuizResult(detailed *models.DetailedQuizResult, userID primitive.ObjectID) *models.QuizResult {
	return &models.QuizResult{
		UserID:         userID,
		QuizType:       detailed.QuizType,
		Title:          detailed.Title,
		Score:          detailed.Score,
		TotalQuestions: detailed.TotalQuestions,
		CorrectAnswers: detailed.CorrectAnswers,
		TimeSpent:      detailed.TimeSpent,
		TimeLimit:      detailed.TimeLimit,
		StartedAt:      detailed.StartedAt,
		CompletedAt:    detailed.CompletedAt,
		Status:         detailed.Status,
		IsTimedOut:     detailed.IsTimedOut,
	}
}

// Utility functions
func generateSessionToken() (string, error) {
	bytes := make([]byte, 32)
	_, err := rand.Read(bytes)
	if err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
