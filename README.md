# 🎓 QuizApp - Interactive Learning Platform

A full-stack web application for creating and taking quizzes, built with React (frontend) and Go (backend), using MongoDB as the database.

## 🏗️ Architecture

- **Frontend**: React + TypeScript + Vite + TailwindCSS
- **Backend**: Go + Gin Framework + MongoDB
- **Database**: MongoDB with automated initialization
- **Containerization**: Docker + Docker Compose

## 🚀 Quick Start with Docker

### Prerequisites
- [Docker](https://www.docker.com/get-started) installed on your system
- [Docker Compose](https://docs.docker.com/compose/install/) (included with Docker Desktop)

### 1. Clone and Start
```bash
# Clone the repository (or extract from archive)
git clone <repository-url>  # or extract zip
cd quizapp

# Start all services
docker-compose up --build
```

### 2. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080
- **MongoDB**: localhost:27017

### 3. Default Credentials
- **Admin**: admin@quizapp.com
- **Test Login**: Available through dev tools panel (development mode)

## 📦 Docker Services

| Service | Port | Description |
|---------|------|-------------|
| frontend | 3000 | React application served by Nginx |
| backend | 8080 | Go API server |
| mongo | 27017 | MongoDB database with initialization |

## 🛠️ Development Workflow

### Full Stack Development
```bash
# Start all services in development mode
docker-compose up --build

# View logs for specific service
docker-compose logs -f frontend
docker-compose logs -f backend
docker-compose logs -f mongo

# Rebuild specific service
docker-compose up --build frontend

# Stop all services
docker-compose down
```

### Individual Service Development

#### Frontend Only
```bash
cd frontend
docker build -t quizapp-frontend .
docker run -p 3000:80 quizapp-frontend
```

#### Backend Only
```bash
cd backend
docker build -t quizapp-backend .
docker run -p 8080:8080 quizapp-backend
```

## 🗄️ Database Initialization

The MongoDB container automatically:
- Creates the `quizapp` database
- Sets up collections with validation schemas
- Creates optimized indexes
- Inserts sample data for testing

### Sample Data Includes:
- Admin user: `admin@quizapp.com`
- 3 sample questions (single choice, multiple choice, essay)
- 1 sample learning module
- Proper collection schemas and indexes

## 🔧 Configuration

### Environment Variables

#### Frontend (React)
```bash
NODE_ENV=production
REACT_APP_API_URL=http://localhost:8080
REACT_APP_ENABLE_DEV_TOOLS=true
```

#### Backend (Go)
```bash
PORT=8080
MONGODB_URI=mongodb://mongo:27017/quizapp
GIN_MODE=release
JWT_SECRET=your-secret-key
```

#### MongoDB
```bash
MONGO_INITDB_DATABASE=quizapp
```

### Custom Configuration
Edit `docker-compose.yml` to modify:
- Port mappings
- Environment variables
- Volume mounts
- Network settings

## 📋 Available Commands

### Docker Compose Commands
```bash
# Start services
docker-compose up                    # Foreground
docker-compose up -d                 # Background
docker-compose up --build            # Rebuild and start

# Stop services
docker-compose stop                  # Stop containers
docker-compose down                  # Stop and remove containers
docker-compose down -v               # Stop and remove volumes

# View logs
docker-compose logs                  # All services
docker-compose logs frontend         # Specific service
docker-compose logs -f backend       # Follow logs

# Execute commands in containers
docker-compose exec frontend sh      # Shell into frontend
docker-compose exec backend sh       # Shell into backend
docker-compose exec mongo mongosh    # MongoDB shell
```

### Individual Container Commands
```bash
# List running containers
docker ps

# View container logs
docker logs quizapp-frontend
docker logs quizapp-backend
docker logs quizapp-mongo

# Execute commands
docker exec -it quizapp-backend sh
docker exec -it quizapp-mongo mongosh quizapp
```

## 🏥 Health Checks

The setup includes health checks for all services:

```bash
# Check service health
docker-compose ps

# Check container health
docker inspect --format='{{.State.Health.Status}}' quizapp-backend
docker inspect --format='{{.State.Health.Status}}' quizapp-mongo
```

## 🔍 Monitoring & Debugging

### View Service Status
```bash
# Check all services
docker-compose ps

# Check specific service logs
docker-compose logs -f --tail=100 backend
```

### Access Container Shells
```bash
# Frontend (Nginx)
docker-compose exec frontend sh

# Backend (Go)
docker-compose exec backend sh

# Database (MongoDB)
docker-compose exec mongo mongosh quizapp
```

### Database Operations
```bash
# Connect to MongoDB
docker-compose exec mongo mongosh quizapp

# View collections
show collections

# Query sample data
db.users.find().pretty()
db.questions.find().pretty()
db.modules.find().pretty()
```

## 🚦 Production Deployment

### Build Production Images
```bash
# Build all services for production
docker-compose -f docker-compose.prod.yml build

# Or build individually
docker build -t quizapp-frontend:prod ./frontend
docker build -t quizapp-backend:prod ./backend
```

### Environment-Specific Overrides
```bash
# Development
docker-compose up

# Production (create docker-compose.prod.yml)
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up
```

## 🐛 Troubleshooting

### Common Issues

#### Port Conflicts
```bash
# Check what's using ports
lsof -i :3000
lsof -i :8080
lsof -i :27017

# Use different ports
docker-compose up --scale frontend=0
docker run -p 3001:80 quizapp-frontend
```

#### Build Failures
```bash
# Clear Docker cache
docker system prune -a

# Rebuild without cache
docker-compose build --no-cache

# Check Docker disk space
docker system df
```

#### Database Connection Issues
```bash
# Check MongoDB logs
docker-compose logs mongo

# Verify network connectivity
docker-compose exec backend ping mongo

# Reset database
docker-compose down -v
docker-compose up
```

#### Container Won't Start
```bash
# Check container status
docker-compose ps

# View detailed logs
docker-compose logs service-name

# Check resource usage
docker stats
```

### Reset Everything
```bash
# Nuclear option - removes everything
docker-compose down -v
docker system prune -a
docker-compose up --build
```

## 📁 Project Structure

```
quizapp/
├── frontend/                 # React frontend
│   ├── src/                 # Source code
│   ├── Dockerfile           # Frontend container config
│   ├── .dockerignore        # Frontend Docker ignore
│   └── README-Docker.md     # Frontend Docker guide
├── backend/                 # Go backend
│   ├── main.go             # Main application
│   ├── Dockerfile          # Backend container config
│   └── go.mod              # Go dependencies
├── scripts/                # Database scripts
│   └── mongo-init.js       # MongoDB initialization
├── docker-compose.yml      # Multi-service orchestration
└── README.md              # This file
```

## 🤝 Development Team Setup

For team members to get started:

1. **Install Docker**: [Download here](https://www.docker.com/get-started)
2. **Clone project**: `git clone <repo>` or extract zip
3. **Start services**: `docker-compose up --build`
4. **Access app**: http://localhost:3000

That's it! No need to install Node.js, Go, or MongoDB locally.

## 📚 Additional Resources

- [Frontend Docker Guide](./frontend/README-Docker.md)
- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/)
- [MongoDB Docker Hub](https://hub.docker.com/_/mongo)

## 🆘 Getting Help

If you encounter issues:
1. Check the troubleshooting section above
2. View service logs: `docker-compose logs [service-name]`
3. Check container status: `docker-compose ps`
4. Reset environment: `docker-compose down -v && docker-compose up --build`

---

**Happy coding! 🚀** 