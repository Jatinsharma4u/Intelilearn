const mongoose = require('mongoose');

const examSessionSchema = new mongoose.Schema({
  student: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  quiz: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Quiz', 
    required: true 
  },
  classroom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Classroom',
    required: true
  },
  answers: [{
    question: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz.questions' },
    selectedAnswer: String,
    isCorrect: Boolean,
    timeSpent: Number, // seconds
    questionText: String, // Store question text for reference
    correctAnswer: String // Store correct answer for reference
  }],
  score: { type: Number, default: 0 },
  totalMarks: { type: Number, default: 0 },
  percentage: { type: Number, default: 0 },
  status: { 
    type: String, 
    enum: ['in_progress', 'completed', 'abandoned', 'graded'], 
    default: 'in_progress' 
  },
  startTime: { type: Date, default: Date.now },
  endTime: Date,
  timeSpent: Number, // total seconds
  topicsPerformance: [{
    topic: String,
    correct: Number,
    total: Number,
    percentage: Number
  }],
  passed: { type: Boolean, default: false },
  rank: Number,
  feedback: String
});

examSessionSchema.pre('save', function(next) {
  if (this.answers && this.answers.length > 0) {
    const correctAnswers = this.answers.filter(answer => answer.isCorrect).length;
    this.score = correctAnswers;
    this.totalMarks = this.answers.length;
    this.percentage = (correctAnswers / this.answers.length) * 100;
    
    // Calculate time spent if endTime is set
    if (this.endTime && this.startTime) {
      this.timeSpent = Math.round((this.endTime - this.startTime) / 1000); // in seconds
    }
    
    // Calculate topics performance
    this.calculateTopicsPerformance();
  }
  
  // Check if passed (if quiz reference available)
  if (this.quiz && this.quiz.settings && this.quiz.settings.passingMarks) {
    this.passed = this.score >= this.quiz.settings.passingMarks;
  }
  
  next();
});

examSessionSchema.methods.calculateTopicsPerformance = function() {
  const topicsMap = {};
  
  this.answers.forEach(answer => {
    if (!topicsMap[answer.question.topic]) {
      topicsMap[answer.question.topic] = { correct: 0, total: 0 };
    }
    topicsMap[answer.question.topic].total++;
    if (answer.isCorrect) {
      topicsMap[answer.question.topic].correct++;
    }
  });
  
  this.topicsPerformance = Object.keys(topicsMap).map(topic => ({
    topic,
    correct: topicsMap[topic].correct,
    total: topicsMap[topic].total,
    percentage: (topicsMap[topic].correct / topicsMap[topic].total) * 100
  }));
};

// Static method to find exam sessions by student
examSessionSchema.statics.findByStudent = function(studentId) {
  return this.find({ student: studentId })
    .populate('quiz', 'title settings schedule')
    .populate('classroom', 'name subject')
    .sort({ startTime: -1 });
};

// Static method to find exam sessions by quiz (for teacher)
examSessionSchema.statics.findByQuiz = function(quizId) {
  return this.find({ quiz: quizId })
    .populate('student', 'username fullName avatar')
    .populate('quiz', 'title settings')
    .sort({ score: -1, timeSpent: 1 });
};

// Static method to find exam sessions by classroom
examSessionSchema.statics.findByClassroom = function(classroomId) {
  return this.find({ classroom: classroomId })
    .populate('student', 'username fullName avatar')
    .populate('quiz', 'title settings')
    .sort({ startTime: -1 });
};

// Method to calculate rank among all students for this quiz
examSessionSchema.statics.calculateRanks = async function(quizId) {
  const sessions = await this.find({ quiz: quizId, status: 'completed' })
    .sort({ score: -1, timeSpent: 1 });
  
  let rank = 1;
  let previousScore = null;
  let sameScoreCount = 0;
  
  for (const session of sessions) {
    if (previousScore !== null && session.score !== previousScore) {
      rank += sameScoreCount;
      sameScoreCount = 1;
    } else {
      sameScoreCount++;
    }
    
    session.rank = rank;
    await session.save();
    previousScore = session.score;
  }
};

module.exports = mongoose.models.ExamSession || mongoose.model('ExamSession', examSessionSchema);