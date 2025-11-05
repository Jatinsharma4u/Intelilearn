// models/User.js - UPDATED
const mongoose = require('mongoose');

const badgeSchema = new mongoose.Schema({
  name: String,
  icon: String,
  earned_date: { type: Date, default: Date.now },
  reward: Number
});

const activitySchema = new mongoose.Schema({
  action: String,
  topic: String,
  coins_earned: Number,
  xp_earned: Number,
  timestamp: { type: Date, default: Date.now },
  details: String
});

const userSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true }, // Firebase UID - added unique
  username: { type: String, required: true, unique: true, lowercase: true },
  email: { type: String, required: true },
  fullName: { type: String, required: true },
  role: { type: String, enum: ['student', 'teacher'], default: 'student' },
  college: String,
  course: String,
  year: String,
  interests: [String],
  subjects: [String],
  bio: String,
  avatar: { type: String, default: '' },

  // Progress with proper defaults
  progress: {
    level: { type: Number, default: 1 },
    xp: { type: Number, default: 0 },
    total_xp: { type: Number, default: 0 },
    coins: { type: Number, default: 0 },
    daily_streak: { type: Number, default: 0 },
    level_name: { type: String, default: '🌱 Rookie' }
  },

  // Battle stats with proper defaults
  battle_stats: {
    battles_won: { type: Number, default: 0 },
    battles_played: { type: Number, default: 0 },
    win_percentage: { type: Number, default: 0 },
    avg_answer_time: { type: Number, default: 0 },
    accuracy: { type: Number, default: 0 },
    fastest_answer: { type: Number, default: 0 }
  },

  badges: [badgeSchema],
  recent_activity: [activitySchema],

  leaderboard: {
    global_rank: { type: Number, default: 0 },
    friends_rank: { type: Number, default: 0 },
    last_updated: { type: Date, default: Date.now }
  },

  settings: {
    daily_battle_limit: { type: Number, default: 10 },
    battles_today: { type: Number, default: 0 },
    last_login: { type: Date }
  },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Set default values for progress and battle_stats if not provided
userSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  
  // Validate username
  if (this.username) {
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(this.username)) {
      return next(new Error('Username can only contain letters, numbers, and underscores'));
    }
    if (this.username.length < 3 || this.username.length > 20) {
      return next(new Error('Username must be between 3 and 20 characters'));
    }
    this.username = this.username.toLowerCase();
  }
  
  // Ensure progress object exists with proper structure
  if (!this.progress || typeof this.progress !== 'object') {
    this.progress = {};
  }
  
  // Set default values for progress
  this.progress.level = this.progress.level || 1;
  this.progress.xp = this.progress.xp || 0;
  this.progress.total_xp = this.progress.total_xp || 0;
  this.progress.coins = this.progress.coins || 0;
  this.progress.daily_streak = this.progress.daily_streak || 0;
  this.progress.level_name = this.progress.level_name || '🌱 Rookie';
  
  // Ensure battle_stats object exists with proper structure
  if (!this.battle_stats || typeof this.battle_stats !== 'object') {
    this.battle_stats = {};
  }
  
  // Set default values for battle_stats
  this.battle_stats.battles_won = this.battle_stats.battles_won || 0;
  this.battle_stats.battles_played = this.battle_stats.battles_played || 0;
  this.battle_stats.win_percentage = this.battle_stats.win_percentage || 0;
  this.battle_stats.avg_answer_time = this.battle_stats.avg_answer_time || 0;
  this.battle_stats.accuracy = this.battle_stats.accuracy || 0;
  this.battle_stats.fastest_answer = this.battle_stats.fastest_answer || 0;
  
  next();
});

// Static method to check username availability
userSchema.statics.isUsernameAvailable = async function(username) {
  const user = await this.findOne({ username: username.toLowerCase() });
  return !user;
};

module.exports = mongoose.model('User', userSchema);