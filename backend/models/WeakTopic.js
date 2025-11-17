// models/WeakTopic.js - Weak Topics Detection for Course Feature
const mongoose = require('mongoose');

const weakTopicSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  userId: {
    type: String,
    required: true // Firebase UID
  },
  topic: {
    type: String,
    required: true
  },
  // Track performance metrics
  totalQuestions: {
    type: Number,
    default: 0
  },
  wrongAnswers: {
    type: Number,
    default: 0
  },
  correctAnswers: {
    type: Number,
    default: 0
  },
  // Track time spent on questions
  totalTimeSpent: {
    type: Number,
    default: 0 // in seconds
  },
  averageTimePerQuestion: {
    type: Number,
    default: 0 // in seconds
  },
  // Track which questions were problematic
  problematicQuestions: [{
    questionId: String,
    questionText: String,
    moduleId: String,
    lessonId: String,
    moduleTitle: String,
    lessonTitle: String,
    timesAttempted: { type: Number, default: 1 },
    timesWrong: { type: Number, default: 0 },
    averageTimeSpent: { type: Number, default: 0 }
  }],
  // Review status
  isReviewed: {
    type: Boolean,
    default: false
  },
  reviewedAt: {
    type: Date
  },
  // ✅ NEW: Attempt history for tutor agent (last 5 attempts)
  attemptHistory: [{
    attemptNumber: { type: Number, required: true },
    score: { type: Number, required: true }, // 0-1 (0.0 to 1.0)
    totalQuestions: { type: Number, required: true },
    correctAnswers: { type: Number, required: true },
    timeSpent: { type: Number, default: 0 }, // in seconds
    answers: [{
      questionId: String,
      questionText: String,
      studentAnswer: String,
      correctAnswer: String,
      isCorrect: Boolean,
      explanation: String
    }],
    attemptedAt: { type: Date, default: Date.now }
  }],
  // Mastery status
  masteryScore: {
    type: Number,
    default: 0 // Average of last 5 attempts (0-1)
  },
  isMastered: {
    type: Boolean,
    default: false
  },
  masteredAt: {
    type: Date
  },
  // Last updated
  lastAttemptedAt: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient queries
weakTopicSchema.index({ courseId: 1, userId: 1, topic: 1 });
weakTopicSchema.index({ courseId: 1, userId: 1, isReviewed: 1 });

// ✅ FIXED: Calculate weakness score based ONLY on wrong answers
weakTopicSchema.virtual('weaknessScore').get(function() {
  if (this.totalQuestions === 0) return 0;
  
  // Only count wrong answers percentage (since we only track wrong answers now)
  const wrongPercentage = (this.wrongAnswers / this.totalQuestions) * 100;
  
  // Time penalty only if average time is very high (more than 90 seconds)
  const timePenalty = this.averageTimePerQuestion > 90 
    ? Math.min((this.averageTimePerQuestion - 90) / 60, 1) * 10 // Max 10 points for excessive time
    : 0;
  
  return Math.min(wrongPercentage + timePenalty, 100);
});

// Method to update weak topic with new quiz attempt
weakTopicSchema.methods.updateWithQuizAttempt = function(questionData) {
  this.totalQuestions += questionData.totalQuestions || 0;
  this.wrongAnswers += questionData.wrongAnswers || 0;
  this.correctAnswers += questionData.correctAnswers || 0;
  this.totalTimeSpent += questionData.totalTimeSpent || 0;
  
  // Update average time
  if (this.totalQuestions > 0) {
    this.averageTimePerQuestion = Math.round(this.totalTimeSpent / this.totalQuestions);
  }
  
  // Update problematic questions
  if (questionData.problematicQuestions) {
    questionData.problematicQuestions.forEach(pq => {
      const existing = this.problematicQuestions.find(
        p => p.questionId === pq.questionId
      );
      
      if (existing) {
        existing.timesAttempted += 1;
        existing.timesWrong += pq.isWrong ? 1 : 0;
        existing.averageTimeSpent = Math.round(
          (existing.averageTimeSpent * (existing.timesAttempted - 1) + pq.timeSpent) / existing.timesAttempted
        );
      } else {
        this.problematicQuestions.push({
          questionId: pq.questionId,
          questionText: pq.questionText,
          moduleId: pq.moduleId,
          lessonId: pq.lessonId,
          moduleTitle: pq.moduleTitle,
          lessonTitle: pq.lessonTitle,
          timesAttempted: 1,
          timesWrong: pq.isWrong ? 1 : 0,
          averageTimeSpent: pq.timeSpent
        });
      }
    });
  }
  
  this.lastAttemptedAt = new Date();
  this.updatedAt = new Date();
  this.isReviewed = false; // Reset review status if new attempts made
  this.reviewedAt = null;
  
  return this;
};

// Method to mark as reviewed
weakTopicSchema.methods.markAsReviewed = function() {
  this.isReviewed = true;
  this.reviewedAt = new Date();
  this.updatedAt = new Date();
  return this;
};

// ✅ NEW: Add attempt to history (keeps last 5)
weakTopicSchema.methods.addAttempt = function(attemptData) {
  const attemptNumber = this.attemptHistory.length + 1;
  
  this.attemptHistory.push({
    attemptNumber,
    score: attemptData.score, // 0-1
    totalQuestions: attemptData.totalQuestions,
    correctAnswers: attemptData.correctAnswers,
    timeSpent: attemptData.timeSpent || 0,
    answers: attemptData.answers || [],
    attemptedAt: new Date()
  });

  // Keep only last 5 attempts
  if (this.attemptHistory.length > 5) {
    this.attemptHistory = this.attemptHistory.slice(-5);
  }

  // Calculate mastery score (average of last 5 attempts)
  const recentAttempts = this.attemptHistory.slice(-5);
  if (recentAttempts.length > 0) {
    this.masteryScore = recentAttempts.reduce((sum, attempt) => sum + attempt.score, 0) / recentAttempts.length;
    
    // Mark as mastered if average >= 0.8
    if (this.masteryScore >= 0.8 && !this.isMastered) {
      this.isMastered = true;
      this.masteredAt = new Date();
    }
  }

  this.lastAttemptedAt = new Date();
  this.updatedAt = new Date();
  
  return this;
};

// ✅ NEW: Get mastery status
weakTopicSchema.methods.getMasteryStatus = function() {
  return {
    masteryScore: this.masteryScore,
    isMastered: this.isMastered,
    attemptsCount: this.attemptHistory.length,
    recentAverage: this.masteryScore
  };
};

// Static method to find weak topics for a user in a course
weakTopicSchema.statics.findWeakTopics = function(courseId, userId, includeReviewed = false) {
  const query = { courseId, userId };
  if (!includeReviewed) {
    query.isReviewed = false;
  }
  return this.find(query).sort({ weaknessScore: -1, lastAttemptedAt: -1 });
};

// Static method to get or create weak topic
weakTopicSchema.statics.getOrCreate = async function(courseId, userId, topic) {
  let weakTopic = await this.findOne({ courseId, userId, topic });
  
  if (!weakTopic) {
    weakTopic = new this({
      courseId,
      userId,
      topic
    });
    await weakTopic.save();
  }
  
  return weakTopic;
};

weakTopicSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('WeakTopic', weakTopicSchema);


