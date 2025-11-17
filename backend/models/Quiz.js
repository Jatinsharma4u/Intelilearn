const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['multiple_choice', 'true_false', 'short_answer'], 
    default: 'multiple_choice' 
  },
  options: [{
    text: String,
    isCorrect: Boolean
  }],
  correctAnswer: String,
  explanation: String,
  topic: String,
  difficulty: { 
    type: String, 
    enum: ['easy', 'medium', 'hard'], 
    default: 'medium' 
  },
  marks: { type: Number, default: 1 },
  timeLimit: { type: Number, default: 30 }
});

const quizSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  classroom: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Classroom', 
    required: true 
  },
  teacher: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  questions: [questionSchema],
  settings: {
    totalMarks: Number,
    duration: Number,
    passingMarks: Number,
    showResults: { type: Boolean, default: true },
    shuffleQuestions: { type: Boolean, default: false },
    allowRetakes: { type: Boolean, default: false },
    showAnswers: { type: Boolean, default: false }
  },
  schedule: {
    startTime: Date,
    endTime: Date,
    timeLimit: Number
  },
  // ✅ FIXED: Added status field
  status: {
    type: String,
    enum: ['draft', 'upcoming', 'active', 'completed', 'ended'],
    default: 'draft'
  },
  topics: [String],
  isActive: { type: Boolean, default: true },
  createdBy: { 
    type: String, 
    enum: ['manual', 'ai_pdf'], 
    required: true 
  },
  sourcePdf: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

quizSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // ✅ FIXED: Auto-update status based on schedule with proper logic
  const now = new Date();
  
  // Only auto-update if status is not manually set to 'draft' or 'ended'
  if (this.status !== 'draft' && this.status !== 'ended') {
    if (this.schedule) {
      const startTime = this.schedule.startTime ? new Date(this.schedule.startTime) : null;
      const endTime = this.schedule.endTime ? new Date(this.schedule.endTime) : null;
      
      if (startTime && now < startTime) {
        // Quiz hasn't started yet
        this.status = 'upcoming';
      } else if (endTime && now > endTime) {
        // Quiz has ended
        this.status = 'ended';
      } else if (startTime && now >= startTime && (!endTime || now <= endTime)) {
        // Quiz is currently active
        this.status = 'active';
      } else if (!startTime && !endTime && this.status === 'draft') {
        // No schedule, keep as draft
        this.status = 'draft';
      }
    } else if (!this.schedule && this.status === 'draft') {
      // No schedule, keep as draft
      this.status = 'draft';
    }
  }
  
  // Calculate total marks
  if (this.questions && this.questions.length > 0) {
    this.settings.totalMarks = this.questions.reduce((total, question) => total + question.marks, 0);
  }
  
  // Calculate total duration if not set
  if (!this.settings.duration && this.questions.length > 0) {
    this.settings.duration = Math.ceil(this.questions.reduce((total, question) => total + (question.timeLimit || 30), 0) / 60);
  }
  
  // Set passing marks if not set (default: 40%)
  if (!this.settings.passingMarks && this.settings.totalMarks) {
    this.settings.passingMarks = Math.ceil(this.settings.totalMarks * 0.4);
  }
  
  next();
});

// Method to check if user is quiz teacher
quizSchema.methods.isQuizTeacher = function(userId) {
  return this.teacher.toString() === userId.toString();
};

// Static method to find quizzes by teacher
quizSchema.statics.findByTeacher = function(teacherId) {
  return this.find({ teacher: teacherId })
    .populate('classroom', 'name subject')
    .populate('teacher', 'username fullName');
};

// Static method to find quizzes by classroom with status filtering
quizSchema.statics.findByClassroom = function(classroomId, options = {}) {
  const { status, page = 1, limit = 10 } = options;
  
  let query = { classroom: classroomId, isActive: true };
  
  // ✅ FIXED: Status-based filtering
  if (status && status !== 'all') {
    if (status === 'active') {
      query.status = 'active';
    } else if (status === 'upcoming') {
      query.status = 'upcoming';
    } else if (status === 'completed') {
      query.status = 'completed';
    } else if (status === 'ended') {
      query.status = 'ended';
    } else if (status === 'draft') {
      query.status = 'draft';
    }
  }
  
  const skip = (page - 1) * limit;
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('teacher', 'username fullName avatar');
};

// Method to get quiz statistics
quizSchema.methods.getStats = function() {
  return {
    totalQuestions: this.questions.length,
    totalMarks: this.settings.totalMarks,
    duration: this.settings.duration,
    status: this.status,
    topics: this.topics,
    difficultyBreakdown: {
      easy: this.questions.filter(q => q.difficulty === 'easy').length,
      medium: this.questions.filter(q => q.difficulty === 'medium').length,
      hard: this.questions.filter(q => q.difficulty === 'hard').length
    }
  };
};

// ✅ FIXED: Method to update quiz status
quizSchema.methods.updateStatus = async function(newStatus) {
  const validStatuses = ['draft', 'upcoming', 'active', 'completed', 'ended'];
  
  if (!validStatuses.includes(newStatus)) {
    throw new Error('Invalid status');
  }
  
  this.status = newStatus;
  this.updatedAt = new Date();
  
  return await this.save();
};

module.exports = mongoose.models.Quiz || mongoose.model('Quiz', quizSchema);