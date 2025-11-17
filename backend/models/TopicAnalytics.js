const mongoose = require('mongoose');

const topicAnalyticsSchema = new mongoose.Schema({
  classroom: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Classroom', 
    required: true 
  },
  topic: { type: String, required: true },
  overallStats: {
    totalAttempts: { type: Number, default: 0 },
    correctAttempts: { type: Number, default: 0 },
    averageAccuracy: { type: Number, default: 0 },
    averageTime: { type: Number, default: 0 }
  },
  studentPerformance: [{
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    totalQuestions: { type: Number, default: 0 },
    correctAnswers: { type: Number, default: 0 },
    accuracy: { type: Number, default: 0 },
    averageTime: { type: Number, default: 0 }
  }],
  difficultyBreakdown: {
    easy: { correct: { type: Number, default: 0 }, total: { type: Number, default: 0 } },
    medium: { correct: { type: Number, default: 0 }, total: { type: Number, default: 0 } },
    hard: { correct: { type: Number, default: 0 }, total: { type: Number, default: 0 } }
  },
  isWeakTopic: { type: Boolean, default: false },
  weakStudentsCount: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now }
});

topicAnalyticsSchema.pre('save', function(next) {
  this.calculateWeakTopicStatus();
  this.lastUpdated = new Date();
  next();
});

topicAnalyticsSchema.methods.calculateWeakTopicStatus = function() {
  const weakThreshold = 0.5; // 50% accuracy
  this.isWeakTopic = this.overallStats.averageAccuracy < weakThreshold;
  
  this.weakStudentsCount = this.studentPerformance.filter(
    student => student.accuracy < weakThreshold
  ).length;
};

topicAnalyticsSchema.methods.updateAnalytics = function(examSessions) {
  // Reset counters
  this.overallStats.totalAttempts = 0;
  this.overallStats.correctAttempts = 0;
  this.overallStats.averageAccuracy = 0;
  this.overallStats.averageTime = 0;
  
  this.difficultyBreakdown = {
    easy: { correct: 0, total: 0 },
    medium: { correct: 0, total: 0 },
    hard: { correct: 0, total: 0 }
  };
  
  const studentMap = new Map();
  let totalAccuracy = 0;
  let totalTime = 0;
  let sessionCount = 0;
  
  examSessions.forEach(session => {
    session.answers.forEach(answer => {
      if (answer.question.topic === this.topic) {
        this.overallStats.totalAttempts++;
        if (answer.isCorrect) this.overallStats.correctAttempts++;
        
        // Update difficulty breakdown
        const difficulty = answer.question.difficulty || 'medium';
        this.difficultyBreakdown[difficulty].total++;
        if (answer.isCorrect) this.difficultyBreakdown[difficulty].correct++;
        
        // Update student performance
        if (!studentMap.has(session.student._id.toString())) {
          studentMap.set(session.student._id.toString(), {
            student: session.student._id,
            totalQuestions: 0,
            correctAnswers: 0,
            accuracy: 0,
            averageTime: 0,
            totalTime: 0
          });
        }
        
        const studentData = studentMap.get(session.student._id.toString());
        studentData.totalQuestions++;
        if (answer.isCorrect) studentData.correctAnswers++;
        studentData.totalTime += answer.timeSpent || 0;
      }
    });
    
    // Calculate averages for this session
    const topicAnswers = session.answers.filter(a => a.question.topic === this.topic);
    if (topicAnswers.length > 0) {
      const accuracy = topicAnswers.filter(a => a.isCorrect).length / topicAnswers.length;
      const avgTime = topicAnswers.reduce((sum, a) => sum + (a.timeSpent || 0), 0) / topicAnswers.length;
      
      totalAccuracy += accuracy;
      totalTime += avgTime;
      sessionCount++;
    }
  });
  
  // Calculate overall averages
  if (sessionCount > 0) {
    this.overallStats.averageAccuracy = totalAccuracy / sessionCount;
    this.overallStats.averageTime = totalTime / sessionCount;
  }
  
  // Update student performance array
  this.studentPerformance = Array.from(studentMap.values()).map(student => ({
    ...student,
    accuracy: student.correctAnswers / student.totalQuestions,
    averageTime: student.totalTime / student.totalQuestions
  }));
  
  this.calculateWeakTopicStatus();
};

// Static method to get or create analytics for classroom topic
topicAnalyticsSchema.statics.getOrCreate = async function(classroomId, topic) {
  let analytics = await this.findOne({ classroom: classroomId, topic });
  
  if (!analytics) {
    analytics = new this({
      classroom: classroomId,
      topic: topic
    });
    await analytics.save();
  }
  
  return analytics;
};

// Static method to find analytics by classroom
topicAnalyticsSchema.statics.findByClassroom = function(classroomId) {
  return this.find({ classroom: classroomId })
    .populate('classroom', 'name subject')
    .sort({ isWeakTopic: -1, 'overallStats.averageAccuracy': 1 });
};

module.exports = mongoose.models.TopicAnalytics || mongoose.model('TopicAnalytics', topicAnalyticsSchema);