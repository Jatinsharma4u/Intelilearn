const mongoose = require('mongoose');

const studentProgressSchema = new mongoose.Schema({
  student: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  classroom: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Classroom', 
    required: true 
  },
  overallStats: {
    totalQuizzes: { type: Number, default: 0 },
    completedQuizzes: { type: Number, default: 0 },
    averageScore: { type: Number, default: 0 },
    totalTimeSpent: { type: Number, default: 0 } // in minutes
  },
  topicPerformance: [{
    topic: String,
    totalQuestions: { type: Number, default: 0 },
    correctAnswers: { type: Number, default: 0 },
    accuracy: { type: Number, default: 0 },
    averageTime: { type: Number, default: 0 },
    lastAttempt: Date
  }],
  weakTopics: [String],
  strongTopics: [String],
  recentActivity: [{
    quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz' },
    score: Number,
    totalMarks: Number,
    percentage: Number,
    completedAt: Date,
    timeSpent: Number // in seconds
  }],
  lastUpdated: { type: Date, default: Date.now }
});

studentProgressSchema.methods.updateTopicPerformance = function(topic, isCorrect, timeSpent) {
  let topicPerf = this.topicPerformance.find(t => t.topic === topic);
  
  if (!topicPerf) {
    topicPerf = {
      topic: topic,
      totalQuestions: 0,
      correctAnswers: 0,
      accuracy: 0,
      averageTime: 0,
      lastAttempt: new Date()
    };
    this.topicPerformance.push(topicPerf);
  }
  
  topicPerf.totalQuestions += 1;
  if (isCorrect) topicPerf.correctAnswers += 1;
  topicPerf.accuracy = topicPerf.correctAnswers / topicPerf.totalQuestions;
  
  // Update average time
  const totalTime = (topicPerf.averageTime * (topicPerf.totalQuestions - 1)) + timeSpent;
  topicPerf.averageTime = totalTime / topicPerf.totalQuestions;
  topicPerf.lastAttempt = new Date();
};

studentProgressSchema.methods.updateWeakStrongTopics = function() {
  const weakThreshold = 0.6; // 60% accuracy
  const strongThreshold = 0.8; // 80% accuracy
  
  this.weakTopics = this.topicPerformance
    .filter(topic => topic.accuracy < weakThreshold && topic.totalQuestions >= 3)
    .map(topic => topic.topic);
    
  this.strongTopics = this.topicPerformance
    .filter(topic => topic.accuracy >= strongThreshold && topic.totalQuestions >= 3)
    .map(topic => topic.topic);
};

// Static method to find progress by student and classroom
studentProgressSchema.statics.findByStudentAndClassroom = function(studentId, classroomId) {
  return this.findOne({ student: studentId, classroom: classroomId })
    .populate('student', 'username fullName avatar')
    .populate('classroom', 'name subject');
};

// Static method to find all progress for a classroom
studentProgressSchema.statics.findByClassroom = function(classroomId) {
  return this.find({ classroom: classroomId })
    .populate('student', 'username fullName avatar')
    .sort({ 'overallStats.averageScore': -1 });
};

module.exports = mongoose.models.StudentProgress || mongoose.model('StudentProgress', studentProgressSchema);