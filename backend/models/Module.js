const mongoose = require('mongoose');

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
  module_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: true 
  },
  completed_lessons: [{
    lesson_id: mongoose.Schema.Types.ObjectId,
    completed_at: { type: Date, default: Date.now },
    time_spent: Number // in minutes
  }],
  quiz_score: {
    attempted: { type: Boolean, default: false },
    score: Number,
    total_questions: Number,
    correct_answers: Number,
    time_taken: Number, // in seconds
    attempted_at: Date
  },
  flashcards_mastered: { type: Number, default: 0 },
  total_flashcards: { type: Number, default: 0 },
  started_at: { type: Date, default: Date.now },
  completed_at: Date,
  total_time_spent: { type: Number, default: 0 } // in minutes
});

userProgressSchema.index({ user_id: 1, course_id: 1, module_id: 1 }, { unique: true });

module.exports = mongoose.model('UserProgress', userProgressSchema);