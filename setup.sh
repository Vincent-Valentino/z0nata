#!/bin/bash

echo "🚀 QuizApp Setup Script"
echo "======================="

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command_exists docker; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command_exists docker-compose; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "✅ Docker and Docker Compose are installed"

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file from template..."
    
    if [ -f "env.example" ]; then
        cp env.example .env
        echo "✅ .env file created from env.example"
        echo ""
        echo "⚠️  IMPORTANT: Please edit the .env file and update the following:"
        echo "   - JWT_SECRET: Change to a secure random string"
        echo "   - EMAIL_USERNAME: Your SMTP email username"
        echo "   - EMAIL_PASSWORD: Your SMTP email password (app-specific password for Gmail)"
        echo "   - OAuth credentials (if you plan to use OAuth)"
        echo ""
        echo "🔑 Your MongoDB Atlas connection is already configured:"
        echo "   MONGODB_URI=mongodb+srv://valentinolubu2:iniesta8@z0nata.sbg8h09.mongodb.net/"
        echo "   MONGODB_DATABASE=z0nata"
        echo ""
    else
        echo "❌ env.example file not found. Please create .env file manually."
        exit 1
    fi
else
    echo "✅ .env file already exists"
fi

# Create backend .env if it doesn't exist
if [ ! -f "backend/.env" ]; then
    echo "📝 Creating backend/.env file..."
    cp .env backend/.env
    echo "✅ backend/.env file created"
else
    echo "✅ backend/.env file already exists"
fi

# Function to ask yes/no questions
ask_yes_no() {
    while true; do
        read -p "$1 (y/n): " yn
        case $yn in
            [Yy]* ) return 0;;
            [Nn]* ) return 1;;
            * ) echo "Please answer yes or no.";;
        esac
    done
}

# Ask if user wants to build and start the application
echo ""
if ask_yes_no "🐳 Do you want to build and start the application with Docker Compose?"; then
    echo "🔨 Building and starting the application..."
    
    # Build and start services
    docker-compose up --build -d
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "🎉 Application started successfully!"
        echo ""
        echo "📱 Frontend: http://localhost:3000"
        echo "🔧 Backend API: http://localhost:8080"
        echo "📚 Health Check: http://localhost:8080/health"
        echo ""
        echo "📊 To view logs:"
        echo "   docker-compose logs -f"
        echo ""
        echo "🛑 To stop the application:"
        echo "   docker-compose down"
        echo ""
        echo "🔄 To restart the application:"
        echo "   docker-compose restart"
        echo ""
    else
        echo "❌ Failed to start the application. Check the logs:"
        echo "   docker-compose logs"
    fi
else
    echo "⏭️  Skipping application startup"
    echo ""
    echo "To start the application later, run:"
    echo "   docker-compose up --build -d"
fi

echo ""
echo "✨ Setup complete!"
echo ""
echo "📝 Next steps:"
echo "1. Edit .env file with your actual credentials"
echo "2. Make sure your MongoDB Atlas cluster is accessible"
echo "3. Start the application with: docker-compose up --build -d"
echo ""
echo "🔗 Useful commands:"
echo "   View logs: docker-compose logs -f"
echo "   Stop: docker-compose down"
echo "   Restart: docker-compose restart"
echo "   Rebuild: docker-compose up --build" 