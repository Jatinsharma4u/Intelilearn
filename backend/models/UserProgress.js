const mongoose = require('mongoose');

const lessonProgressSchema = new mongoose.Schema({
  lesson_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: true 
  },
  completed: { 
    type: Boolean, 
    default: false 
  },
  completed_at: Date,
  time_spent: { 
    type: Number, 
    default: 0 
  }, // in minutes
  last_accessed: Date,
  notes: String,
  bookmarked: { 
    type: Boolean, 
    default: false 
  }
});

const quizAttemptSchema = new mongoose.Schema({
  attempt_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    default: () => new mongoose.Types.ObjectId() 
  },
  answers: [{
    question_index: Number,
    selected_answer: String,
    is_correct: Boolean,
    time_taken: Number // in seconds
  }],
  score: Number,
  total_questions: Number,
  correct_answers: Number,
  time_taken: Number, // in seconds
  attempted_at: { 
    type: Date, 
    default: Date.now 
  },
  completed: { 
    type: Boolean, 
    default: false 
  }
});

const flashcardProgressSchema = new mongoose.Schema({
  flashcard_id: mongoose.Schema.Types.ObjectId,
  front: String,
  back: String,
  mastered: { 
    type: Boolean, 
    default: false 
  },
  difficulty: { 
    type: String, 
    enum: ['easy', 'medium', 'hard'], 
    default: 'medium' 
  },
  times_reviewed: { 
    type: Number, 
    default: 0 
  },
  last_reviewed: Date,
  confidence_level: { 
    type: Number, 
    default: 0 
  } // 0-100
});

const weakTopicSchema = new mongoose.Schema({
  topic: String,
  module_index: Number,
  lesson_index: Number,
  confidence_score: { 
    type: Number, 
    default: 0 
  }, // 0-100
  times_struggled: { 
    type: Number, 
    default: 0 
  },
  last_struggled: Date,
  improvement_suggestions: [String]
});

const userProgressSchema = new mongoose.Schema({
  user_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  course_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Course', 
    required: true 
  },
  
  // Module-level progress
  current_module: { 
    type: Number, 
    default: 0 
  },
  current_lesson: { 
    type: Number, 
    default: 0 
  },
  
  // Detailed progress tracking
  modules_progress: [{
    module_index: Number,
    module_id: mongoose.Schema.Types.ObjectId,
    completed: { 
      type: Boolean, 
      default: false 
    },
    completed_at: Date,
    time_spent: { 
      type: Number, 
      default: 0 
    }, // in minutes
    progress_percentage: { 
      type: Number, 
      default: 0 
    },
    lessons_progress: [lessonProgressSchema],
    quiz_attempts: [quizAttemptSchema],
    flashcards_progress: [flashcardProgressSchema],
    last_accessed: Date
  }],
  
  // Overall course progress
  overall_progress: { 
    type: Number, 
    default: 0 
  }, // 0-100
  total_time_spent: { 
    type: Number, 
    default: 0 
  }, // in minutes
  completed_at: Date,
  started_at: { 
    type: Date, 
    default: Date.now 
  },
  
  // Weak topics detection
  weak_topics: [weakTopicSchema],
  
  // Learning analytics
  learning_analytics: {
    average_quiz_score: { 
      type: Number, 
      default: 0 
    },
    total_quizzes_taken: { 
      type: Number, 
      default: 0 
    },
    flashcards_mastered: { 
      type: Number, 
      default: 0 
    },
    total_flashcards: { 
      type: Number, 
      default: 0 
    },
    consistency_score: { 
      type: Number, 
      default: 0 
    }, // Based on regular study patterns
    last_activity: Date,
    streak_days: { 
      type: Number, 
      default: 0 
    }
  },
  
  // Settings and preferences
  preferences: {
    auto_advance: { 
      type: Boolean, 
      default: true 
    },
    quiz_retry_allowed: { 
      type: Boolean, 
      default: true 
    },
    difficulty_level: { 
      type: String, 
      enum: ['beginner', 'intermediate', 'advanced'], 
      default: 'beginner' 
    }
  }
}, {
  timestamps: true
});

// Index for efficient queries
userProgressSchema.index({ user_id: 1, course_id: 1 }, { unique: true });
userProgressSchema.index({ 'learning_analytics.last_activity': 1 });

// Methods for progress calculation
userProgressSchema.methods.calculateOverallProgress = function() {
  const modules = this.modules_progress || [];
  if (modules.length === 0) return 0;
  
  let totalWeightedProgress = 0;
  let totalWeight = 0;
  
  modules.forEach((module, index) => {
    const weight = index + 1; // Later modules have higher weight
    totalWeightedProgress += (module.progress_percentage || 0) * weight;
    totalWeight += weight;
  });
  
  return totalWeight > 0 ? Math.round(totalWeightedProgress / totalWeight) : 0;
};

userProgressSchema.methods.updateModuleProgress = function(moduleIndex) {
  const moduleProgress = this.modules_progress[moduleIndex];
  if (!moduleProgress) return;
  
  const lessons = moduleProgress.lessons_progress || [];
  const totalLessons = lessons.length;
  const completedLessons = lessons.filter(lesson => lesson.completed).length;
  
  moduleProgress.progress_percentage = totalLessons > 0 ? 
    Math.round((completedLessons / totalLessons) * 100) : 0;
  
  moduleProgress.completed = moduleProgress.progress_percentage === 100;
  
  if (moduleProgress.completed && !moduleProgress.completed_at) {
    moduleProgress.completed_at = new Date();
  }
  
  // Update overall progress
  this.overall_progress = this.calculateOverallProgress();
  
  if (this.overall_progress === 100 && !this.completed_at) {
    this.completed_at = new Date();
  }
};

userProgressSchema.methods.markLessonComplete = function(moduleIndex, lessonIndex, timeSpent = 0) {
  // Ensure modules_progress array exists
  if (!this.modules_progress[moduleIndex]) {
    this.modules_progress[moduleIndex] = {
      module_index: moduleIndex,
      lessons_progress: [],
      quiz_attempts: [],
      flashcards_progress: [],
      progress_percentage: 0,
      completed: false,
      time_spent: 0
    };
  }
  
  const moduleProgress = this.modules_progress[moduleIndex];
  
  // Ensure lessons_progress array exists
  if (!moduleProgress.lessons_progress[lessonIndex]) {
    moduleProgress.lessons_progress[lessonIndex] = {
      lesson_id: new mongoose.Types.ObjectId(),
      completed: false,
      time_spent: 0
    };
  }
  
  const lessonProgress = moduleProgress.lessons_progress[lessonIndex];
  
  // Update lesson progress
  lessonProgress.completed = true;
  lessonProgress.completed_at = new Date();
  lessonProgress.time_spent += timeSpent;
  lessonProgress.last_accessed = new Date();
  
  // Update module time spent
  moduleProgress.time_spent += timeSpent;
  moduleProgress.last_accessed = new Date();
  
  // Update total time spent
  this.total_time_spent += timeSpent;
  this.learning_analytics.last_activity = new Date();
  
  // Recalculate module progress
  this.updateModuleProgress(moduleIndex);
};

userProgressSchema.methods.addQuizAttempt = function(moduleIndex, quizData) {
  if (!this.modules_progress[moduleIndex]) {
    this.modules_progress[moduleIndex] = {
      module_index: moduleIndex,
      lessons_progress: [],
      quiz_attempts: [],
      flashcards_progress: [],
      progress_percentage: 0,
      completed: false,
      time_spent: 0
    };
  }
  
  const moduleProgress = this.modules_progress[moduleIndex];
  
  const quizAttempt = {
    attempt_id: new mongoose.Types.ObjectId(),
    answers: quizData.answers || [],
    score: quizData.score || 0,
    total_questions: quizData.total_questions || 0,
    correct_answers: quizData.correct_answers || 0,
    time_taken: quizData.time_taken || 0,
    attempted_at: new Date(),
    completed: true
  };
  
  moduleProgress.quiz_attempts.push(quizAttempt);
  
  // Update learning analytics
  this.learning_analytics.total_quizzes_taken += 1;
  
  const totalQuizzes = this.learning_analytics.total_quizzes_taken;
  const currentAverage = this.learning_analytics.average_quiz_score;
  this.learning_analytics.average_quiz_score = 
    ((currentAverage * (totalQuizzes - 1)) + quizData.score) / totalQuizzes;
  
  this.learning_analytics.last_activity = new Date();
  
  // Detect weak topics from quiz results
  this.detectWeakTopics(moduleIndex, quizData);
};

userProgressSchema.methods.detectWeakTopics = function(moduleIndex, quizData) {
  const wrongAnswers = (quizData.answers || []).filter(answer => !answer.is_correct);
  
  wrongAnswers.forEach(answer => {
    // This is a simplified version - you would need question-topic mapping
    const topic = `Topic from question ${answer.question_index}`;
    
    const existingWeakTopic = this.weak_topics.find(t => t.topic === topic);
    
    if (existingWeakTopic) {
      existingWeakTopic.times_struggled += 1;
      existingWeakTopic.confidence_score = Math.max(0, existingWeakTopic.confidence_score - 10);
      existingWeakTopic.last_struggled = new Date();
    } else {
      this.weak_topics.push({
        topic: topic,
        module_index: moduleIndex,
        lesson_index: 0, // You would map this properly
        confidence_score: 70, // Start with lower confidence
        times_struggled: 1,
        last_struggled: new Date(),
        improvement_suggestions: [
          "Review the related lesson materials",
          "Practice with additional examples",
          "Try the flashcards for better retention"
        ]
      });
    }
  });
};

userProgressSchema.methods.updateFlashcardProgress = function(moduleIndex, flashcardId, mastered) {
  if (!this.modules_progress[moduleIndex]) {
    this.modules_progress[moduleIndex] = {
      module_index: moduleIndex,
      lessons_progress: [],
      quiz_attempts: [],
      flashcards_progress: [],
      progress_percentage: 0,
      completed: false,
      time_spent: 0
    };
  }
  
  const moduleProgress = this.modules_progress[moduleIndex];
  const existingFlashcard = moduleProgress.flashcards_progress.find(f => 
    f.flashcard_id.toString() === flashcardId.toString()
  );
  
  if (existingFlashcard) {
    existingFlashcard.mastered = mastered;
    existingFlashcard.times_reviewed += 1;
    existingFlashcard.last_reviewed = new Date();
    existingFlashcard.confidence_level = mastered ? 100 : Math.max(0, existingFlashcard.confidence_level - 10);
  }
  
  // Update overall flashcards mastered count
  this.learning_analytics.flashcards_mastered = this.calculateTotalFlashcardsMastered();
  this.learning_analytics.last_activity = new Date();
};

userProgressSchema.methods.calculateTotalFlashcardsMastered = function() {
  let totalMastered = 0;
  
  this.modules_progress.forEach(module => {
    const masteredFlashcards = (module.flashcards_progress || []).filter(f => f.mastered).length;
    totalMastered += masteredFlashcards;
  });
  
  return totalMastered;
};

// Static methods
userProgressSchema.statics.findByUserAndCourse = function(userId, courseId) {
  return this.findOne({ user_id: userId, course_id: courseId });
};

userProgressSchema.statics.getUserProgressSummary = function(userId) {
  return this.aggregate([
    { $match: { user_id: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        total_courses: { $sum: 1 },
        completed_courses: {
          $sum: { $cond: [{ $eq: ["$overall_progress", 100] }, 1, 0] }
        },
        total_time_spent: { $sum: "$total_time_spent" },
        average_progress: { $avg: "$overall_progress" }
      }
    }
  ]);
};

module.exports = mongoose.model('UserProgress', userProgressSchema);