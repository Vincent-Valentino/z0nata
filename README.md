# 🎓 Zonata QuizApp

A modern, full-stack quiz application built with React (Frontend) and Go (Backend), using MongoDB Atlas as the database.

## 🏗️ Architecture

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Go + Gin + MongoDB Driver
- **Database**: MongoDB Atlas
- **Deployment**: Docker + Docker Compose

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose
- Git

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd quizapp
```

### 2. Environment Setup

The application is configured to use MongoDB Atlas with your connection string. Run the setup script:

```bash
chmod +x setup.sh
./setup.sh
```

Or manually create `.env` file:

```bash
cp env.example .env
```

### 3. Configure Environment Variables

Edit the `.env` file and update these important values:

```env
# Database (MongoDB Atlas) - Already configured
MONGODB_URI=mongodb+srv://valentinolubu2:iniesta8@z0nata.sbg8h09.mongodb.net/
MONGODB_DATABASE=z0nata

# JWT Secret - CHANGE THIS!
JWT_SECRET=your_super_secret_jwt_key_here

# Email Configuration (for password reset)
EMAIL_USERNAME=your-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password

# OAuth (Optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### 4. Start the Application

```bash
docker-compose up --build -d
```

### 5. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080
- **Health Check**: http://localhost:8080/health

## 📁 Project Structure

```
quizapp/
├── frontend/                 # React frontend
│   ├── src/
│   │   ├── components/      # UI components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   └── types/          # TypeScript types
│   ├── Dockerfile
│   └── package.json
├── backend/                 # Go backend
│   ├── controllers/        # HTTP handlers
│   ├── models/            # Data models
│   ├── services/          # Business logic
│   ├── repository/        # Database layer
│   ├── config/            # Configuration
│   ├── middleware/        # HTTP middleware
│   ├── routes/            # Route definitions
│   ├── utils/             # Utilities
│   ├── Dockerfile
│   └── go.mod
├── docker-compose.yml      # Docker orchestration
├── env.example            # Environment template
└── setup.sh              # Setup script
```

## 🔧 Environment Variables

### Server Configuration
- `SERVER_HOST` - Server host (default: localhost)
- `SERVER_PORT` - Server port (default: 8080)
- `SERVER_ENVIRONMENT` - Environment mode (development/production)

### Database Configuration (MongoDB Atlas)
- `MONGODB_URI` - MongoDB Atlas connection string
- `MONGODB_DATABASE` - Database name (default: z0nata)
- `MONGODB_MAX_POOL_SIZE` - Connection pool size (default: 100)

### JWT Configuration
- `JWT_SECRET` - JWT signing secret (REQUIRED)
- `JWT_ACCESS_TOKEN_EXPIRY` - Access token expiry (default: 15m)
- `JWT_REFRESH_TOKEN_EXPIRY` - Refresh token expiry (default: 168h)

### Email Configuration
- `EMAIL_SMTP_HOST` - SMTP host (default: smtp.gmail.com)
- `EMAIL_SMTP_PORT` - SMTP port (default: 587)
- `EMAIL_USERNAME` - SMTP username
- `EMAIL_PASSWORD` - SMTP password
- `EMAIL_FROM_NAME` - Sender name
- `EMAIL_FROM_ADDRESS` - Sender email

### OAuth Configuration (Optional)
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
- And similar for Facebook, GitHub, Apple...

## 🛠️ Development

### Frontend Development

```bash
cd frontend
pnpm install
pnpm run dev
```

### Backend Development

```bash
cd backend
go mod download
go run main.go
```

### Database Management

The application is configured to use MongoDB Atlas. The connection includes:
- Automatic reconnection
- Connection pooling
- Optimized timeouts for cloud database
- Index creation on startup

## 📊 Docker Commands

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild and restart
docker-compose up --build

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

## 🔒 Security Features

- JWT-based authentication
- Password hashing with Argon2
- CORS protection
- Rate limiting
- Input validation
- SQL injection protection (NoSQL)
- XSS protection headers

## 📈 Features

### Authentication
- User registration/login
- JWT token-based auth
- Password reset via email
- OAuth integration (Google, Facebook, GitHub, Apple)
- Role-based access control

### Quiz System
- Multiple question types (single choice, multiple choice, essay)
- Timed quizzes
- Mock tests
- Result tracking
- Performance analytics

### Admin Panel
- User management
- Question management
- Documentation management
- System monitoring

### Documentation
- Markdown-based content management
- Module and submodule organization
- Search functionality
- Publication control

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB Connection Issues**
   - Verify MongoDB Atlas connection string
   - Check network connectivity
   - Ensure IP whitelist includes your IP

2. **Docker Build Issues**
   - Clear Docker cache: `docker system prune -a`
   - Check Docker daemon is running

3. **Environment Variables**
   - Ensure `.env` file exists
   - Check for typos in variable names
   - Verify required variables are set

### Logs

Check application logs:
```bash
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Health Check

Visit http://localhost:8080/health to verify backend is running.

## 📝 API Documentation

The backend provides a RESTful API with the following main endpoints:

- `/api/v1/auth/*` - Authentication endpoints
- `/api/v1/users/*` - User management
- `/api/v1/questions/*` - Question management
- `/api/v1/modules/*` - Documentation modules
- `/api/v1/quiz/*` - Quiz functionality
- `/health` - Health check

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

If you encounter any issues:

1. Check this README
2. Review the logs with `docker-compose logs -f`
3. Ensure all environment variables are properly set
4. Verify MongoDB Atlas connectivity
5. Create an issue with detailed error information 