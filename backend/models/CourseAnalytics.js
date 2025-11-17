// models/CourseAnalytics.js - COMPLETELY FIXED
const mongoose = require('mongoose');

const quizAttemptSchema = new mongoose.Schema({
  lessonId: { type: mongoose.Schema.Types.ObjectId, required: true },
  moduleId: { type: mongoose.Schema.Types.ObjectId, required: true },
  lessonTitle: String,
  moduleTitle: String,
  score: { type: Number, required: true }, // Percentage
  totalQuestions: { type: Number, required: true },
  correctAnswers: { type: Number, required: true },
  timeSpent: { type: Number, required: true }, // seconds for this quiz
  attemptedAt: { type: Date, default: Date.now },
  answers: [{
    question: String,
    userAnswer: String,
    correctAnswer: String,
    isCorrect: Boolean,
    timeSpent: Number // seconds for this question
  }]
});

const courseAnalyticsSchema = new mongoose.Schema({
  studentId: { type: String, required: true }, // Firebase UID
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  courseTitle: String,
  
  // 📈 BASIC METRICS
  totalTimeSpent: { type: Number, default: 0 }, // Total seconds in entire course
  quizAttempts: [quizAttemptSchema],
  
  // ✅ CALCULATED FIELDS
  totalQuizzesAttempted: { type: Number, default: 0 },
  averageAccuracy: { type: Number, default: 0 }, // Percentage
  averageSpeed: { type: Number, default: 0 }, // seconds per question
  
  lastActive: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// 🎯 AUTO-CALCULATE METRICS - FIXED
courseAnalyticsSchema.methods.updateMetrics = function() {
  const attempts = this.quizAttempts;
  
  console.log('🔄 Updating metrics for', attempts.length, 'quiz attempts');
  
  if (attempts.length > 0) {
    // 1. Total quizzes attempted
    this.totalQuizzesAttempted = attempts.length;
    
    // 2. Average accuracy (%)
    const totalAccuracy = attempts.reduce((sum, attempt) => {
      const accuracy = (attempt.correctAnswers / attempt.totalQuestions) * 100;
      return sum + accuracy;
    }, 0);
    
    this.averageAccuracy = Math.round(totalAccuracy / attempts.length);
    
    // 3. Average speed per question (seconds)
    const totalQuizTime = attempts.reduce((sum, attempt) => sum + attempt.timeSpent, 0);
    const totalQuestions = attempts.reduce((sum, attempt) => sum + attempt.totalQuestions, 0);
    
    this.averageSpeed = totalQuestions > 0 ? Math.round(totalQuizTime / totalQuestions) : 0;
    
    console.log('📊 Metrics updated:', {
      totalQuizzesAttempted: this.totalQuizzesAttempted,
      averageAccuracy: this.averageAccuracy,
      averageSpeed: this.averageSpeed,
      totalTimeSpent: this.totalTimeSpent
    });
  } else {
    console.log('📊 No quiz attempts, resetting metrics');
    this.totalQuizzesAttempted = 0;
    this.averageAccuracy = 0;
    this.averageSpeed = 0;
  }
  
  this.updatedAt = new Date();
  return this;
};

// 📊 Get course summary - FIXED
courseAnalyticsSchema.methods.getCourseSummary = function() {
  const summary = {
    studentId: this.studentId,
    courseId: this.courseId,
    courseTitle: this.courseTitle,
    
    // 🎯 EXACTLY WHAT YOU WANTED:
    quizzesAttempted: this.totalQuizzesAttempted,
    accuracy: `${this.averageAccuracy}%`,
    averageSpeed: `${this.averageSpeed} seconds per question`,
    totalTimeSpent: this.formatTime(this.totalTimeSpent),
    
    // 📈 Additional useful metrics
    totalQuizTime: this.formatTime(this.quizAttempts.reduce((sum, attempt) => sum + attempt.timeSpent, 0)),
    lastActive: this.lastActive,
    daysSinceStart: Math.floor((new Date() - this.createdAt) / (1000 * 60 * 60 * 24))
  };

  console.log('📄 Generated summary:', summary);
  return summary;
};

// ⏰ Format seconds to readable time - FIXED
courseAnalyticsSchema.methods.formatTime = function(seconds) {
  if (!seconds || seconds === 0) return '0m';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

// ✅ STATIC METHODS
courseAnalyticsSchema.statics.findByStudentAndCourse = function(studentId, courseId) {
  return this.findOne({ studentId, courseId });
};

courseAnalyticsSchema.statics.findByStudent = function(studentId) {
  return this.find({ studentId }).sort({ updatedAt: -1 });
};

module.exports = mongoose.model('CourseAnalytics', courseAnalyticsSchema);