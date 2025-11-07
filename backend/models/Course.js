const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  duration: { type: Number, default: 10 }, // in minutes
  order: { type: Number, required: true },
  keywords: [String],
  examples: [{
    title: String,
    description: String,
    code: String
  }],
  summary: String,
  completed: { type: Boolean, default: false },
  completedAt: Date,
  timeSpent: { type: Number, default: 0 },
  created_at: { type: Date, default: Date.now }
});

const quizQuestionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: [{ type: String, required: true }],
  correct_answer: { type: String, required: true },
  explanation: String,
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  points: { type: Number, default: 5 }
});

const flashcardSchema = new mongoose.Schema({
  front: { type: String, required: true },
  back: { type: String, required: true },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  mastered: { type: Boolean, default: false }
});

const moduleSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  order: { type: Number, required: true },
  batch: { type: Number, default: 1 }, // ✅ NEW: Batch number for processing
  lessons: [lessonSchema],
  quiz: [quizQuestionSchema],
  flashcards: [flashcardSchema],
  duration: { type: Number, default: 0 }, // Total minutes
  learning_objectives: [String], // ✅ NEW: Learning objectives for module
  topics: [String], // ✅ NEW: Specific topics covered in this module
  completed: { type: Boolean, default: false },
  completedAt: Date,
  timeSpent: { type: Number, default: 0 },
  quizResult: { // ✅ NEW: Store quiz results
    score: Number,
    correctAnswers: Number,
    totalQuestions: Number,
    timeTaken: Number,
    attemptedAt: Date
  }
});

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  creator: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  original_files: [{
    filename: String,
    original_name: String,
    file_type: String,
    file_size: Number,
    upload_date: { type: Date, default: Date.now }
  }],
  settings: {
    modules_count: { type: Number, default: 5 },
    flashcards_count: { type: Number, default: 20 },
    difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
    learning_pace: { type: String, enum: ['slow', 'medium', 'fast'], default: 'medium' },
    questions_per_module: { type: Number, default: 10 },
    exam_type: { type: String, enum: ['academic', 'practical', 'conceptual'], default: 'academic' },
    depth_level: { type: String, enum: ['basic', 'comprehensive', 'in-depth'], default: 'comprehensive' }
  },
  modules: [moduleSchema],
  status: {
    type: String,
    enum: ['processing', 'ready', 'failed'],
    default: 'processing'
  },
  processing_log: [{
    step: String,
    status: String,
    message: String,
    timestamp: { type: Date, default: Date.now }
  }],
  
  // ✅ ENHANCED: Total calculations
  total_duration: { type: Number, default: 0 },
  total_lessons: { type: Number, default: 0 },
  total_quizzes: { type: Number, default: 0 },
  total_flashcards: { type: Number, default: 0 },
  total_questions: { type: Number, default: 0 }, // ✅ NEW: Total quiz questions
  
  tags: [String],
  category: String,
  is_public: { type: Boolean, default: false },
  thumbnail: String,
  
  // ✅ ENHANCED: Content analysis for better tracking
  content_analysis: {
    source_topics: [String],
    source_keywords: [String],
    total_source_files: Number,
    extraction_quality: String,
    content_richness: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    key_concepts: [String],
    estimated_study_hours: Number
  },
  
  // ✅ NEW: Generation metadata for batching system
  generation_metadata: {
    batch_system_used: { type: Boolean, default: false },
    total_batches: { type: Number, default: 1 },
    enhanced_content: { type: Boolean, default: true },
    fallback_used: { type: Boolean, default: false },
    generation_timestamp: Date
  },
  
  // ✅ NEW: Performance metrics
  performance_metrics: {
    avg_lesson_duration: Number,
    avg_quiz_score: Number,
    completion_rate: Number,
    popular_modules: [String],
    difficult_topics: [String]
  },
  
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

// Update timestamp before save
courseSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  
  // Calculate enhanced totals before save
  if (this.modules) {
    this.total_duration = this.modules.reduce((sum, module) => sum + (module.duration || 0), 0);
    this.total_lessons = this.modules.reduce((sum, module) => sum + (module.lessons?.length || 0), 0);
    this.total_quizzes = this.modules.reduce((sum, module) => sum + (module.quiz?.length > 0 ? 1 : 0), 0);
    this.total_flashcards = this.modules.reduce((sum, module) => sum + (module.flashcards?.length || 0), 0);
    this.total_questions = this.modules.reduce((sum, module) => sum + (module.quiz?.length || 0), 0);
    
    // Calculate performance metrics
    const totalModules = this.modules.length;
    const completedModules = this.modules.filter(module => module.completed).length;
    this.performance_metrics = this.performance_metrics || {};
    this.performance_metrics.completion_rate = totalModules > 0 ? (completedModules / totalModules) * 100 : 0;
    
    // Calculate average lesson duration
    const totalLessons = this.modules.reduce((sum, module) => sum + (module.lessons?.length || 0), 0);
    const totalLessonDuration = this.modules.reduce((sum, module) => {
      return sum + (module.lessons?.reduce((lessonSum, lesson) => lessonSum + (lesson.duration || 0), 0) || 0);
    }, 0);
    this.performance_metrics.avg_lesson_duration = totalLessons > 0 ? totalLessonDuration / totalLessons : 0;
    
    // Calculate average quiz score
    const modulesWithQuizResults = this.modules.filter(module => module.quizResult?.score);
    const totalQuizScore = modulesWithQuizResults.reduce((sum, module) => sum + (module.quizResult.score || 0), 0);
    this.performance_metrics.avg_quiz_score = modulesWithQuizResults.length > 0 ? totalQuizScore / modulesWithQuizResults.length : 0;
    
    // Find popular modules (most time spent)
    this.performance_metrics.popular_modules = this.modules
      .filter(module => module.timeSpent > 0)
      .sort((a, b) => b.timeSpent - a.timeSpent)
      .slice(0, 3)
      .map(module => module.title);
  }
  
  next();
});

// Enhanced progress tracking virtual with batching support
courseSchema.virtual('progress').get(function() {
  if (!this.modules || this.modules.length === 0) return 0;
  
  let totalLessons = 0;
  let completedLessons = 0;
  let totalQuizzes = 0;
  let completedQuizzes = 0;
  let totalFlashcards = 0;
  let masteredFlashcards = 0;

  this.modules.forEach(module => {
    totalLessons += module.lessons?.length || 0;
    totalQuizzes += module.quiz?.length > 0 ? 1 : 0;
    totalFlashcards += module.flashcards?.length || 0;

    // Count completed lessons
    if (module.lessons) {
      completedLessons += module.lessons.filter(lesson => lesson.completed).length;
    }

    // Count completed quizzes
    if (module.quiz?.length > 0 && module.completed) {
      completedQuizzes++;
    }

    // Count mastered flashcards
    if (module.flashcards) {
      masteredFlashcards += module.flashcards.filter(card => card.mastered).length;
    }
  });

  // Enhanced weighted progress: 
  // 50% lessons + 30% quizzes + 20% flashcards
  const lessonProgress = totalLessons > 0 ? (completedLessons / totalLessons) * 50 : 0;
  const quizProgress = totalQuizzes > 0 ? (completedQuizzes / totalQuizzes) * 30 : 0;
  const flashcardProgress = totalFlashcards > 0 ? (masteredFlashcards / totalFlashcards) * 20 : 0;

  return Math.min(lessonProgress + quizProgress + flashcardProgress, 100);
});

// ✅ NEW: Virtual for batch progress tracking
courseSchema.virtual('batch_progress').get(function() {
  if (!this.modules || this.modules.length === 0) return {};
  
  const batchProgress = {};
  const batches = [...new Set(this.modules.map(module => module.batch || 1))];
  
  batches.forEach(batch => {
    const batchModules = this.modules.filter(module => (module.batch || 1) === batch);
    const totalBatchModules = batchModules.length;
    const completedBatchModules = batchModules.filter(module => module.completed).length;
    
    batchProgress[`batch_${batch}`] = {
      total_modules: totalBatchModules,
      completed_modules: completedBatchModules,
      progress_percentage: totalBatchModules > 0 ? (completedBatchModules / totalBatchModules) * 100 : 0,
      batch_duration: batchModules.reduce((sum, module) => sum + (module.duration || 0), 0)
    };
  });
  
  return batchProgress;
});

// ✅ NEW: Method to get module statistics
courseSchema.methods.getModuleStats = function() {
  if (!this.modules || this.modules.length === 0) return null;
  
  return {
    total_modules: this.modules.length,
    completed_modules: this.modules.filter(module => module.completed).length,
    total_lessons: this.total_lessons,
    total_questions: this.total_questions,
    total_flashcards: this.total_flashcards,
    total_duration: this.total_duration,
    estimated_completion_time: Math.ceil(this.total_duration / 60), // in hours
    batches_used: [...new Set(this.modules.map(module => module.batch || 1))].length
  };
};

// ✅ NEW: Method to find difficult topics based on quiz performance
courseSchema.methods.getDifficultTopics = function() {
  if (!this.modules || this.modules.length === 0) return [];
  
  const difficultTopics = [];
  
  this.modules.forEach(module => {
    if (module.quizResult && module.quizResult.score < 70) {
      // Module with low quiz score, consider its topics difficult
      if (module.topics && module.topics.length > 0) {
        difficultTopics.push(...module.topics);
      } else if (module.title) {
        // Extract topic from module title as fallback
        const topic = module.title.replace(/Module \d+:\s*/i, '').trim();
        if (topic) difficultTopics.push(topic);
      }
    }
  });
  
  // Remove duplicates and return
  return [...new Set(difficultTopics)].slice(0, 5);
};

// ✅ NEW: Static method to get course analytics
courseSchema.statics.getCourseAnalytics = async function(courseId) {
  const course = await this.findById(courseId);
  if (!course) return null;
  
  return {
    course_id: course._id,
    title: course.title,
    progress: course.progress,
    stats: course.getModuleStats(),
    batch_progress: course.batch_progress,
    difficult_topics: course.getDifficultTopics(),
    performance: course.performance_metrics,
    generation_info: course.generation_metadata,
    content_quality: course.content_analysis?.content_richness || 'medium'
  };
};

module.exports = mongoose.model('Course', courseSchema);