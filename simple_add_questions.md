# Add AI Questions via MongoDB Shell

## Step 1: Connect to MongoDB and select database
```bash
# Connect to MongoDB
mongosh

# Use your database (replace 'quizapp' with your actual database name)
use quizapp
```

## Step 2: Get your admin user ID
```javascript
// Find your admin user ID
db.admin.findOne({}, {_id: 1})
// Or if users are in 'user' collection:
db.user.findOne({role: "admin"}, {_id: 1})
```

## Step 3: Insert the questions one by one

### Question 1: Single Choice (AI Characteristics)
```javascript
db.questions.insertOne({
  title: "Which of the following is a key characteristic of artificial intelligence?",
  type: "single_choice",
  difficulty: "medium",
  points: 15,
  max_points: 15,
  is_active: true,
  options: [
    { 
      _id: new ObjectId(), 
      text: "The ability to learn from data and improve performance", 
      order: 1 
    },
    { 
      _id: new ObjectId(), 
      text: "Running programs on multiple computers simultaneously", 
      order: 2 
    },
    { 
      _id: new ObjectId(), 
      text: "Storing large amounts of data in databases", 
      order: 3 
    },
    { 
      _id: new ObjectId(), 
      text: "Creating user interfaces for web applications", 
      order: 4 
    }
  ],
  correct_answers: [], // Will be set in next step
  created_by: ObjectId("YOUR_ADMIN_USER_ID"), // Replace with actual ID
  created_at: new Date(),
  updated_at: new Date()
})
```

### Update correct answer for Question 1:
```javascript
// Get the question and set correct answer to first option
const q1 = db.questions.findOne({title: {$regex: "key characteristic"}})
db.questions.updateOne(
  {_id: q1._id}, 
  {$set: {correct_answers: [q1.options[0]._id]}}
)
```

### Question 2: Multiple Choice (ML Algorithms)
```javascript
db.questions.insertOne({
  title: "Which of the following are examples of machine learning algorithms commonly used in AI? (Select all that apply)",
  type: "multiple_choice",
  difficulty: "hard",
  points: 20,
  max_points: 20,
  is_active: true,
  options: [
    { _id: new ObjectId(), text: "Neural Networks", order: 1 },
    { _id: new ObjectId(), text: "Decision Trees", order: 2 },
    { _id: new ObjectId(), text: "HTML Parser", order: 3 },
    { _id: new ObjectId(), text: "Random Forest", order: 4 },
    { _id: new ObjectId(), text: "Database Query Optimizer", order: 5 },
    { _id: new ObjectId(), text: "Support Vector Machines", order: 6 }
  ],
  correct_answers: [], // Will be set in next step
  created_by: ObjectId("YOUR_ADMIN_USER_ID"), // Replace with actual ID
  created_at: new Date(),
  updated_at: new Date()
})
```

### Update correct answers for Question 2:
```javascript
// Get the question and set correct answers (options 1, 2, 4, 6)
const q2 = db.questions.findOne({title: {$regex: "machine learning algorithms"}})
db.questions.updateOne(
  {_id: q2._id}, 
  {$set: {correct_answers: [
    q2.options[0]._id, // Neural Networks
    q2.options[1]._id, // Decision Trees  
    q2.options[3]._id, // Random Forest
    q2.options[5]._id  // Support Vector Machines
  ]}}
)
```

### Question 3: Essay (AI in Healthcare)
```javascript
db.questions.insertOne({
  title: "Discuss the potential benefits and challenges of implementing artificial intelligence in healthcare. Provide specific examples and explain how AI could transform medical diagnosis and treatment.",
  type: "essay",
  difficulty: "hard",
  points: 25,
  max_points: 25,
  is_active: true,
  sample_answer: "AI in healthcare offers significant benefits including: 1) Enhanced diagnostic accuracy through medical image analysis (e.g., detecting cancer in radiology scans), 2) Personalized treatment recommendations based on patient data analysis, 3) Drug discovery acceleration through molecular modeling, 4) Predictive analytics for early disease detection. However, challenges include: 1) Data privacy and security concerns with sensitive medical information, 2) Need for regulatory approval and validation of AI systems, 3) Potential bias in AI algorithms that could lead to healthcare disparities, 4) Integration with existing healthcare systems and workflows. AI transformation examples include IBM Watson for oncology treatment recommendations, Google's DeepMind for eye disease detection, and AI-powered robotic surgery systems for precision procedures.",
  created_by: ObjectId("YOUR_ADMIN_USER_ID"), // Replace with actual ID
  created_at: new Date(),
  updated_at: new Date()
})
```

## Step 4: Verify the questions were added
```javascript
// Check all questions
db.questions.find({}, {title: 1, type: 1, difficulty: 1, points: 1})

// Count questions
db.questions.countDocuments()
```

## Notes:
1. **Replace "YOUR_ADMIN_USER_ID"** with your actual admin user's ObjectId
2. **Replace "quizapp"** with your actual database name
3. The correct answers store **unique ObjectIds** from the options, which allows for **randomized option order** in tests
4. You can run these commands one by one in MongoDB shell for safety 