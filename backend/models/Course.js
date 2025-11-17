// models/Course.js - UPDATED WITH TOPIC TAGGING FOR QUIZZES
const mongoose = require('mongoose');

const quizQuestionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctAnswer: { type: String, required: true },
  explanation: String,
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  // ✅ NEW: Topic/Concept tagging for quizzes
  topic: { type: String, default: '' },
  conceptTags: [{ type: String }]
});

const flashcardSchema = new mongoose.Schema({
  term: { type: String, required: true },
  definition: { type: String, required: true },
  mastered: { type: Boolean, default: false }
});

// Structured Content Schema
const structuredContentSchema = new mongoose.Schema({
  // Main content sections
  introduction: { 
    type: String, 
    required: true,
    default: "This lesson covers essential concepts and practical applications."
  },
  keyConcepts: [{ 
    type: String 
  }],
  detailedExplanation: { 
    type: String, 
    required: true 
  },
  practicalExamples: [{ 
    type: String 
  }],
  importantPoints: [{ 
    type: String 
  }],
  applications: { 
    type: String 
  },
  
  // Additional learning elements
  learningObjectives: [{ 
    type: String 
  }],
  prerequisites: [{ 
    type: String 
  }],
  summary: { 
    type: String 
  },
  
  // Metadata
  estimatedReadingTime: { 
    type: Number, 
    default: 5 
  },
  difficulty: { 
    type: String, 
    enum: ['easy', 'medium', 'hard'], 
    default: 'medium' 
  }
});

const lessonSchema = new mongoose.Schema({
  title: { type: String, required: true },
  
  // Content with structured format
  content: { 
    type: structuredContentSchema, 
    required: true 
  },
  
  duration: { type: Number, default: 10 }, // minutes
  order: { type: Number, required: true },
  quiz: [quizQuestionSchema],
  flashcards: [flashcardSchema],
  
  // Progressive completion tracking
  locked: { type: Boolean, default: true },
  contentCompleted: { type: Boolean, default: false },
  quizCompleted: { type: Boolean, default: false },
  flashcardsCompleted: { type: Boolean, default: false },
  completed: { type: Boolean, default: false },
  completedAt: { type: Date },
  quizScore: { type: Number, default: 0 },
  timeSpent: { type: Number, default: 0 }, // in seconds
  
  // Individual completion timestamps
  contentCompletedAt: { type: Date },
  quizCompletedAt: { type: Date },
  flashcardsCompletedAt: { type: Date }
});

const moduleSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  order: { type: Number, required: true },
  lessons: [lessonSchema],
  
  // Module level completion tracking
  completed: { type: Boolean, default: false },
  completedAt: { type: Date }
});

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  originalFile: {
    filename: String,
    originalName: String,
    size: Number,
    uploadedAt: { type: Date, default: Date.now }
  },
  createdBy: { type: String, required: true }, // Firebase UID
  settings: {
    contentType: { 
      type: String, 
      enum: ['conceptual', 'practical', 'exam-oriented', 'comprehensive'], 
      default: 'comprehensive' 
    },
    difficulty: { 
      type: String, 
      enum: ['beginner', 'intermediate', 'advanced', 'mixed'], 
      default: 'beginner' 
    },
    learningPace: { 
      type: String, 
      enum: ['slow', 'moderate', 'fast', 'crash'], 
      default: 'moderate' 
    },
    questionsPerTopic: { type: Number, default: 5 },
    flashcardsPerModule: { type: Number, default: 3 },
    quizDifficulty: { 
      type: String, 
      enum: ['easy', 'medium', 'hard'], 
      default: 'medium' 
    },
    includeExercises: { type: Boolean, default: true },
    contentStyle: { 
      type: String, 
      enum: ['visual', 'textual', 'interactive', 'story-based'], 
      default: 'interactive' 
    },
    totalModules: { type: Number, default: 5 },
    lessonsPerModule: { type: Number, default: 4 }
  },
  modules: [moduleSchema],
  isPublic: { type: Boolean, default: false },
  
  // Course generation status
  generationStatus: { 
    type: String, 
    enum: ['processing', 'completed', 'failed'], 
    default: 'processing' 
  },
  isGenerating: { type: Boolean, default: true },
  error: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Auto-unlock next lesson when current lesson completes
lessonSchema.methods.completeLesson = function() {
  this.completed = true;
  this.completedAt = new Date();
  return this;
};

// Check if lesson can be unlocked
lessonSchema.methods.canUnlock = function(previousLesson) {
  return previousLesson && previousLesson.completed;
};

// Method to mark content as completed
lessonSchema.methods.markContentCompleted = function() {
  this.contentCompleted = true;
  this.contentCompletedAt = new Date();
  
  // Check if all components are completed
  if (this.quizCompleted && this.flashcardsCompleted) {
    this.completeLesson();
  }
  return this;
};

// Method to mark quiz as completed
lessonSchema.methods.markQuizCompleted = function(score) {
  this.quizCompleted = true;
  this.quizCompletedAt = new Date();
  this.quizScore = score;
  
  // Check if all components are completed
  if (this.contentCompleted && this.flashcardsCompleted) {
    this.completeLesson();
  }
  return this;
};

// Method to mark flashcards as completed
lessonSchema.methods.markFlashcardsCompleted = function() {
  this.flashcardsCompleted = true;
  this.flashcardsCompletedAt = new Date();
  
  // Check if all components are completed
  if (this.contentCompleted && this.quizCompleted) {
    this.completeLesson();
  }
  return this;
};

courseSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Auto-unlock first lesson of first module for new courses
  if (this.isNew && this.modules.length > 0 && this.modules[0].lessons.length > 0) {
    this.modules[0].lessons[0].locked = false;
  }
  
  // Auto-unlock next lessons and modules based on completion
  this.modules.forEach((module, moduleIndex) => {
    let allLessonsCompleted = true;
    
    module.lessons.forEach((lesson, lessonIndex) => {
      // Check if all components are completed for overall completion
      if (lesson.contentCompleted && lesson.quizCompleted && lesson.flashcardsCompleted) {
        lesson.completed = true;
        if (!lesson.completedAt) {
          lesson.completedAt = new Date();
        }
        
        // Auto-unlock next lesson
        if (lessonIndex < module.lessons.length - 1) {
          module.lessons[lessonIndex + 1].locked = false;
        }
      }
      
      if (!lesson.completed) {
        allLessonsCompleted = false;
      }
    });
    
    // Mark module as completed if all lessons are completed
    if (allLessonsCompleted) {
      module.completed = true;
      if (!module.completedAt) {
        module.completedAt = new Date();
      }
      
      // Auto-unlock next module
      if (moduleIndex < this.modules.length - 1 && this.modules[moduleIndex + 1].lessons.length > 0) {
        this.modules[moduleIndex + 1].lessons[0].locked = false;
      }
    }
  });
  
  next();
});

// Virtual for overall progress (updated)
courseSchema.virtual('progress').get(function() {
  if (!this.modules || this.modules.length === 0) return 0;
  
  const totalLessons = this.modules.reduce((acc, module) => 
    acc + module.lessons.length, 0
  );
  
  if (totalLessons === 0) return 0;
  
  const completedLessons = this.modules.reduce((acc, module) => 
    acc + module.lessons.filter(lesson => lesson.completed).length, 0
  );
  
  return Math.round((completedLessons / totalLessons) * 100);
});

// Method to reset a lesson
courseSchema.methods.resetLesson = function(moduleIndex, lessonIndex) {
  if (!this.modules[moduleIndex] || !this.modules[moduleIndex].lessons[lessonIndex]) {
    return this;
  }
  
  const lesson = this.modules[moduleIndex].lessons[lessonIndex];
  
  lesson.contentCompleted = false;
  lesson.quizCompleted = false;
  lesson.flashcardsCompleted = false;
  lesson.completed = false;
  lesson.quizScore = 0;
  lesson.completedAt = null;
  lesson.contentCompletedAt = null;
  lesson.quizCompletedAt = null;
  lesson.flashcardsCompletedAt = null;
  
  // Re-lock subsequent lessons in the same module
  for (let i = lessonIndex + 1; i < this.modules[moduleIndex].lessons.length; i++) {
    this.modules[moduleIndex].lessons[i].locked = true;
    this.resetLesson(moduleIndex, i); // Also reset the subsequent lessons
  }
  
  return this;
};

// Method to get structured content for a lesson
courseSchema.methods.getLessonContent = function(moduleIndex, lessonIndex) {
  if (!this.modules[moduleIndex] || !this.modules[moduleIndex].lessons[lessonIndex]) {
    return null;
  }
  
  const lesson = this.modules[moduleIndex].lessons[lessonIndex];
  return lesson.content;
};

// Method to update lesson content
courseSchema.methods.updateLessonContent = function(moduleIndex, lessonIndex, newContent) {
  if (!this.modules[moduleIndex] || !this.modules[moduleIndex].lessons[lessonIndex]) {
    return false;
  }
  
  this.modules[moduleIndex].lessons[lessonIndex].content = {
    ...this.modules[moduleIndex].lessons[lessonIndex].content,
    ...newContent
  };
  
  return true;
};

// ✅ NEW: Method to get quizzes by topic
courseSchema.methods.getQuizzesByTopic = function(topic) {
  const quizzesByTopic = [];
  
  this.modules.forEach(module => {
    module.lessons.forEach(lesson => {
      lesson.quiz.forEach(question => {
        if (question.topic === topic || 
            (question.conceptTags && question.conceptTags.includes(topic))) {
          quizzesByTopic.push({
            module: module.title,
            lesson: lesson.title,
            question: question
          });
        }
      });
    });
  });
  
  return quizzesByTopic;
};

// ✅ NEW: Method to get all unique topics from quizzes
courseSchema.methods.getAllQuizTopics = function() {
  const topics = new Set();
  
  this.modules.forEach(module => {
    module.lessons.forEach(lesson => {
      lesson.quiz.forEach(question => {
        if (question.topic) {
          topics.add(question.topic);
        }
        if (question.conceptTags) {
          question.conceptTags.forEach(tag => topics.add(tag));
        }
      });
    });
  });
  
  return Array.from(topics);
};

// Static method to find courses by user
courseSchema.statics.findByUser = function(userId) {
  return this.find({ createdBy: userId }).sort({ createdAt: -1 });
};

// Static method to find public courses
courseSchema.statics.findPublic = function() {
  return this.find({ isPublic: true }).sort({ createdAt: -1 });
};

// Static method to find course by ID with populated data
courseSchema.statics.findByIdWithDetails = function(courseId) {
  return this.findById(courseId);
};

// Method to calculate total course duration
courseSchema.virtual('totalDuration').get(function() {
  if (!this.modules || this.modules.length === 0) return 0;
  
  return this.modules.reduce((total, module) => {
    const moduleDuration = module.lessons.reduce((moduleTotal, lesson) => {
      return moduleTotal + (lesson.duration || 0);
    }, 0);
    return total + moduleDuration;
  }, 0);
});

// Method to get course statistics
courseSchema.methods.getCourseStats = function() {
  const stats = {
    totalModules: this.modules.length,
    totalLessons: 0,
    completedLessons: 0,
    totalQuizzes: 0,
    totalFlashcards: 0,
    totalDuration: this.totalDuration,
    // ✅ NEW: Quiz topic statistics
    totalTopics: 0,
    topics: []
  };
  
  const topicMap = new Map();
  
  this.modules.forEach(module => {
    stats.totalLessons += module.lessons.length;
    stats.completedLessons += module.lessons.filter(lesson => lesson.completed).length;
    
    module.lessons.forEach(lesson => {
      stats.totalQuizzes += lesson.quiz.length;
      stats.totalFlashcards += lesson.flashcards.length;
      
      // Count questions by topic
      lesson.quiz.forEach(question => {
        if (question.topic) {
          const count = topicMap.get(question.topic) || 0;
          topicMap.set(question.topic, count + 1);
        }
        
        if (question.conceptTags) {
          question.conceptTags.forEach(tag => {
            const count = topicMap.get(tag) || 0;
            topicMap.set(tag, count + 1);
          });
        }
      });
    });
  });
  
  stats.totalTopics = topicMap.size;
  stats.topics = Array.from(topicMap.entries()).map(([topic, count]) => ({
    topic,
    questionCount: count
  }));
  
  return stats;
};

module.exports = mongoose.model('Course', courseSchema);