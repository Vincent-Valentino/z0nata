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

		// Convert to session questions using original question points
		for _, q := range easyQuestions {
			questions = append(questions, s.convertQuestionToSessionQuestion(q))
		}
		for _, q := range mediumQuestions {
			questions = append(questions, s.convertQuestionToSessionQuestion(q))
		}
		for _, q := range hardQuestions {
			questions = append(questions, s.convertQuestionToSessionQuestion(q))
		}

		// Calculate total points from actual question values
		totalPoints = 0
		for _, q := range questions {
			totalPoints += q.Points
		}

	case models.MockTest:
		// Dynamic allocation to reach ~1000 points
		questions, totalPoints, err := s.selectMockTestQuestions(ctx, config)
		if err != nil {
			return nil, 0, fmt.Errorf("failed to select mock test questions: %w", err)
		}
		return questions, totalPoints, nil
	}

	// Shuffle questions
	s.shuffleSessionQuestions(questions)

	return questions, totalPoints, nil
}

func (s *quizSessionService) selectMockTestQuestions(ctx context.Context, config models.QuizConfig) ([]models.SessionQuestion, int, error) {
	// Get available questions by difficulty (reasonable limit, not all)
	easyQuestions, err := s.getQuestionsByDifficulty(ctx, models.Easy, 200) // Get up to 200 easy questions
	if err != nil {
		return nil, 0, fmt.Errorf("failed to get easy questions: %w", err)
	}

	mediumQuestions, err := s.getQuestionsByDifficulty(ctx, models.Medium, 150) // Get up to 150 medium questions
	if err != nil {
		return nil, 0, fmt.Errorf("failed to get medium questions: %w", err)
	}

	hardQuestions, err := s.getQuestionsByDifficulty(ctx, models.Hard, 100) // Get up to 100 hard questions
	if err != nil {
		return nil, 0, fmt.Errorf("failed to get hard questions: %w", err)
	}

	// Check minimum requirements
	totalAvailable := len(easyQuestions) + len(mediumQuestions) + len(hardQuestions)
	if totalAvailable < 10 {
		return nil, 0, fmt.Errorf("insufficient questions available: need at least 10, have %d", totalAvailable)
	}

	// Combine all questions and calculate how many we need to reach ~1000 points
	var allQuestions []*models.Question
	allQuestions = append(allQuestions, easyQuestions...)
	allQuestions = append(allQuestions, mediumQuestions...)
	allQuestions = append(allQuestions, hardQuestions...)

	// Shuffle all questions to ensure random distribution
	s.shuffleQuestionsSlice(allQuestions)

	// Select 100 questions for MockTest (10 points each = 1000 points total)
	targetQuestionCount := 100
	if len(allQuestions) < targetQuestionCount {
		targetQuestionCount = len(allQuestions)
	}

	// Ensure we have at least 10 questions for a meaningful quiz
	if targetQuestionCount < 10 {
		return nil, 0, fmt.Errorf("insufficient questions available: need at least 10, have %d", len(allQuestions))
	}

	selectedQuestions := allQuestions[:targetQuestionCount]

	// Calculate total points (should be targetQuestionCount * 10)
	totalPoints := 0
	for _, q := range selectedQuestions {
		totalPoints += q.Points
	}

	// Convert to session questions (using their original points, not config points)
	var sessionQuestions []models.SessionQuestion
	for _, q := range selectedQuestions {
		sessionQ := s.convertQuestionToSessionQuestion(q)
		sessionQuestions = append(sessionQuestions, sessionQ)
	}

	// Final shuffle for good measure
	s.shuffleSessionQuestions(sessionQuestions)

	fmt.Printf("Selected %d questions for MockTest with %d total points (target: %d)\n",
		len(selectedQuestions), totalPoints, config.MaxPoints)

	return sessionQuestions, totalPoints, nil
}

func (s *quizSessionService) getQuestionsByDifficulty(ctx context.Context, difficulty models.DifficultyLevel, limit int) ([]*models.Question, error) {
	if limit == -1 {
		// Get all questions of this difficulty
		limit = 1000 // Set a reasonable max limit
	}

	// Try to get questions from database first
	dbQuestions, err := s.questionRepo.GetRandomQuestionsByDifficulty(ctx, difficulty, limit)
	if err != nil {
		// If database query fails, return error but continue with samples
		fmt.Printf("Warning: Database query failed for %s questions: %v\n", difficulty, err)
	}

	// Check if we have enough questions from database
	if len(dbQuestions) >= limit {
		return dbQuestions, nil
	}

	// Not enough questions in database, supplement with hardcoded samples
	fmt.Printf("Only found %d %s questions in database, need %d. Adding sample questions.\n",
		len(dbQuestions), difficulty, limit)

	// Generate sample questions for the missing count
	missingCount := limit - len(dbQuestions)
	sampleQuestions := generateSampleQuestions(difficulty, missingCount)

	// Combine database questions with samples
	allQuestions := make([]*models.Question, 0, len(dbQuestions)+len(sampleQuestions))
	allQuestions = append(allQuestions, dbQuestions...)
	allQuestions = append(allQuestions, sampleQuestions...)

	return allQuestions, nil
}

// generateSampleQuestions creates hardcoded sample questions for testing
func generateSampleQuestions(difficulty models.DifficultyLevel, count int) []*models.Question {
	var samples []*models.Question
	adminID := primitive.NewObjectID() // Dummy admin ID

	// Sample question templates based on difficulty
	switch difficulty {
	case models.Easy:
		easyTemplates := []struct {
			title   string
			options []string
			correct int // 0-based index of correct answer
		}{
			{"What is 2 + 2?", []string{"3", "4", "5", "6"}, 1},
			{"What is the capital of France?", []string{"London", "Berlin", "Paris", "Madrid"}, 2},
			{"Which color is made by mixing red and blue?", []string{"Green", "Purple", "Yellow", "Orange"}, 1},
			{"How many days are in a week?", []string{"5", "6", "7", "8"}, 2},
			{"What is the first letter of the alphabet?", []string{"A", "B", "C", "D"}, 0},
			{"Which programming language uses 'print()' function?", []string{"Java", "Python", "C++", "Assembly"}, 1},
			{"What does HTML stand for?", []string{"Hypertext Markup Language", "High Tech Modern Language", "Home Tool Markup Language", "Hyperlink Text Markup Language"}, 0},
			{"Which planet is closest to the Sun?", []string{"Venus", "Earth", "Mercury", "Mars"}, 2},
		}

		for i := 0; i < count && i < len(easyTemplates); i++ {
			template := easyTemplates[i%len(easyTemplates)]
			// All questions: 10 points each
			question := createSampleQuestion(template.title, template.options, template.correct, difficulty, 10, adminID)
			samples = append(samples, question)
		}

	case models.Medium:
		mediumTemplates := []struct {
			title   string
			options []string
			correct int
		}{
			{"What is the time complexity of binary search?", []string{"O(n)", "O(log n)", "O(n²)", "O(1)"}, 1},
			{"Which HTTP status code indicates 'Not Found'?", []string{"200", "404", "500", "301"}, 1},
			{"In object-oriented programming, what is inheritance?", []string{"Creating objects", "Reusing code from parent class", "Deleting objects", "Changing object state"}, 1},
			{"What does SQL stand for?", []string{"Structured Query Language", "Simple Query Language", "Standard Query Language", "Sequential Query Language"}, 0},
			{"Which data structure follows LIFO principle?", []string{"Queue", "Array", "Stack", "Tree"}, 2},
			{"What is the default port for HTTP?", []string{"21", "22", "80", "443"}, 2},
			{"In Git, what command is used to create a new branch?", []string{"git new-branch", "git create-branch", "git branch", "git checkout -b"}, 3},
		}

		for i := 0; i < count && i < len(mediumTemplates); i++ {
			template := mediumTemplates[i%len(mediumTemplates)]
			// All questions: 10 points each
			question := createSampleQuestion(template.title, template.options, template.correct, difficulty, 10, adminID)
			samples = append(samples, question)
		}

	case models.Hard:
		hardTemplates := []struct {
			title   string
			options []string
			correct int
		}{
			{"What is the purpose of the 'volatile' keyword in Java?", []string{"Prevents method overriding", "Ensures thread-safe access to variables", "Makes variables immutable", "Improves performance"}, 1},
			{"Which algorithm has the best average-case time complexity for sorting?", []string{"Bubble Sort", "Quick Sort", "Merge Sort", "Selection Sort"}, 2},
			{"In database design, what is normalization?", []string{"Adding indexes", "Organizing data to reduce redundancy", "Encrypting data", "Backing up data"}, 1},
			{"What does the CAP theorem state?", []string{"Consistency, Availability, Partition tolerance - pick two", "All distributed systems are consistent", "Performance is more important than consistency", "Databases should always be available"}, 0},
			{"Which design pattern ensures a class has only one instance?", []string{"Factory", "Observer", "Singleton", "Strategy"}, 2},
			{"What is the space complexity of merge sort?", []string{"O(1)", "O(log n)", "O(n)", "O(n log n)"}, 2},
		}

		for i := 0; i < count && i < len(hardTemplates); i++ {
			template := hardTemplates[i%len(hardTemplates)]
			// All questions: 10 points each
			question := createSampleQuestion(template.title, template.options, template.correct, difficulty, 10, adminID)
			samples = append(samples, question)
		}
	}

	return samples
}

// createSampleQuestion creates a sample question with the given parameters
func createSampleQuestion(title string, optionTexts []string, correctIndex int, difficulty models.DifficultyLevel, points int, adminID primitive.ObjectID) *models.Question {
	// Create options with IDs
	options := make([]models.Option, len(optionTexts))
	for i, text := range optionTexts {
		options[i] = models.Option{
			ID:    primitive.NewObjectID().Hex(),
			Text:  text,
			Order: i + 1,
		}
	}

	// Set correct answer
	var correctAnswers []string
	if correctIndex >= 0 && correctIndex < len(options) {
		correctAnswers = []string{options[correctIndex].ID}
	}

	return &models.Question{
		ID:             primitive.NewObjectID(),
		Title:          title,
		Type:           models.SingleChoice,
		Difficulty:     difficulty,
		Points:         points,
		IsActive:       true,
		Options:        options,
		CorrectAnswers: correctAnswers,
		CreatedBy:      adminID,
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
	}
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

func (s *quizSessionService) shuffleQuestionsSlice(questions []*models.Question) {
	for i := len(questions) - 1; i > 0; i-- {
		j, _ := rand.Int(rand.Reader, big.NewInt(int64(i+1)))
		questions[i], questions[j.Int64()] = questions[j.Int64()], questions[i]
	}
}

func (s *quizSessionService) shuffleSessionQuestions(questions []models.SessionQuestion) {
	for i := len(questions) - 1; i > 0; i-- {
		j, _ := rand.Int(rand.Reader, big.NewInt(int64(i+1)))
		questions[i], questions[j.Int64()] = questions[j.Int64()], questions[i]
	}
}

func (s *quizSessionService) convertQuestionToSessionQuestion(q *models.Question) models.SessionQuestion {
	// Create a copy of options to shuffle
	options := make([]models.Option, len(q.Options))
	copy(options, q.Options)
	s.shuffleOptions(options)

	return models.SessionQuestion{
		QuestionID:     q.ID,
		Title:          q.Title,
		Type:           q.Type,
		Difficulty:     q.Difficulty,
		Points:         q.Points, // Use the question's original points
		Options:        options,
		CorrectAnswers: q.CorrectAnswers,
		IsAnswered:     false,
		IsSkipped:      false,
		IsCorrect:      false,
		PointsEarned:   0,
		TimeSpent:      0,
		VisitCount:     0,
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
