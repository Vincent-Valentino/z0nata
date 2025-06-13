// MongoDB initialization script for QuizApp
// This script runs when the MongoDB container starts for the first time

print('Starting QuizApp database initialization...');

// Switch to the quizapp database
db = db.getSiblingDB('quizapp');

// Create collections with validation
print('Creating collections...');

// Users collection
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['email', 'full_name', 'created_at'],
      properties: {
        email: {
          bsonType: 'string',
          pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        },
        full_name: {
          bsonType: 'string',
          minLength: 1
        },
        created_at: {
          bsonType: 'date'
        }
      }
    }
  }
});

// Questions collection
db.createCollection('questions', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['title', 'type', 'difficulty', 'points', 'created_by', 'created_at'],
      properties: {
        title: {
          bsonType: 'string',
          minLength: 5
        },
        type: {
          bsonType: 'string',
          enum: ['single_choice', 'multiple_choice', 'essay']
        },
        difficulty: {
          bsonType: 'string',
          enum: ['easy', 'medium', 'hard']
        },
        points: {
          bsonType: 'int',
          minimum: 1
        }
      }
    }
  }
});

// Modules collection
db.createCollection('modules', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['name', 'created_by', 'created_at'],
      properties: {
        name: {
          bsonType: 'string',
          minLength: 1
        },
        is_published: {
          bsonType: 'bool'
        }
      }
    }
  }
});

// User activities collection
db.createCollection('user_activities', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['user_id', 'quiz_type', 'score', 'created_at'],
      properties: {
        quiz_type: {
          bsonType: 'string',
          enum: ['mock_test', 'time_quiz']
        },
        score: {
          bsonType: 'number',
          minimum: 0
        }
      }
    }
  }
});

// Access requests collection
db.createCollection('access_requests', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['email', 'full_name', 'reason', 'status', 'created_at'],
      properties: {
        email: {
          bsonType: 'string',
          pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        },
        status: {
          bsonType: 'string',
          enum: ['pending', 'approved', 'rejected']
        }
      }
    }
  }
});

print('Creating indexes...');

// Users indexes
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ created_at: -1 });
db.users.createIndex({ is_admin: 1 });

// Questions indexes
db.questions.createIndex({ type: 1 });
db.questions.createIndex({ difficulty: 1 });
db.questions.createIndex({ is_active: 1 });
db.questions.createIndex({ created_by: 1 });
db.questions.createIndex({ created_at: -1 });
db.questions.createIndex({ title: "text" }); // Text search

// Modules indexes
db.modules.createIndex({ name: 1 });
db.modules.createIndex({ is_published: 1 });
db.modules.createIndex({ created_by: 1 });
db.modules.createIndex({ created_at: -1 });
db.modules.createIndex({ name: "text", description: "text" }); // Text search

// User activities indexes
db.user_activities.createIndex({ user_id: 1 });
db.user_activities.createIndex({ quiz_type: 1 });
db.user_activities.createIndex({ created_at: -1 });
db.user_activities.createIndex({ user_id: 1, created_at: -1 });

// Access requests indexes
db.access_requests.createIndex({ email: 1 });
db.access_requests.createIndex({ status: 1 });
db.access_requests.createIndex({ created_at: -1 });

print('Inserting sample data...');

// Insert sample admin user
db.users.insertOne({
  email: 'admin@quizapp.com',
  full_name: 'System Administrator',
  email_verified: true,
  is_admin: true,
  created_at: new Date(),
  updated_at: new Date(),
  last_login: new Date()
});

// Insert sample questions
db.questions.insertMany([
  {
    title: 'What is the capital of Indonesia?',
    type: 'single_choice',
    difficulty: 'easy',
    points: 10,
    is_active: true,
    options: [
      { id: 'opt1', text: 'Jakarta', order: 1, points: 10 },
      { id: 'opt2', text: 'Bandung', order: 2, points: 0 },
      { id: 'opt3', text: 'Surabaya', order: 3, points: 0 },
      { id: 'opt4', text: 'Medan', order: 4, points: 0 }
    ],
    correct_answers: ['opt1'],
    created_by: 'admin@quizapp.com',
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    title: 'Which of the following are programming languages?',
    type: 'multiple_choice',
    difficulty: 'medium',
    points: 15,
    is_active: true,
    options: [
      { id: 'opt1', text: 'JavaScript', order: 1, points: 5 },
      { id: 'opt2', text: 'Python', order: 2, points: 5 },
      { id: 'opt3', text: 'HTML', order: 3, points: 0 },
      { id: 'opt4', text: 'Go', order: 4, points: 5 }
    ],
    correct_answers: ['opt1', 'opt2', 'opt4'],
    created_by: 'admin@quizapp.com',
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    title: 'Explain the concept of microservices architecture.',
    type: 'essay',
    difficulty: 'hard',
    points: 25,
    max_points: 30,
    is_active: true,
    sample_answer: 'Microservices architecture is a design approach where applications are built as a collection of loosely coupled services. Each service is independently deployable, scalable, and maintainable.',
    created_by: 'admin@quizapp.com',
    created_at: new Date(),
    updated_at: new Date()
  }
]);

// Insert sample module
db.modules.insertOne({
  name: 'Introduction to Programming',
  description: 'Basic concepts of programming and software development',
  content: '# Introduction to Programming\n\nThis module covers the fundamental concepts of programming...',
  is_published: true,
  sub_modules: [
    {
      id: 'sub1',
      name: 'Variables and Data Types',
      description: 'Understanding variables and different data types',
      content: '## Variables and Data Types\n\nVariables are containers for storing data...',
      is_published: true,
      created_by: 'admin@quizapp.com',
      created_at: new Date(),
      updated_at: new Date()
    }
  ],
  created_by: 'admin@quizapp.com',
  created_at: new Date(),
  updated_at: new Date()
});

print('Database initialization completed successfully!');
print('Collections created: users, questions, modules, user_activities, access_requests');
print('Sample data inserted for testing purposes');
print('Ready to accept connections from the backend application.'); 