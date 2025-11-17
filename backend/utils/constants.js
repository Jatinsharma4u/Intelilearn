// utils/constants.js
const CONSTANTS = {
  // Course Settings Options
  CONTENT_TYPES: [
    { value: 'conceptual', label: 'Conceptual (Theory-heavy)' },
    { value: 'practical', label: 'Practical (Examples-focused)' },
    { value: 'exam-oriented', label: 'Exam-oriented (Quick revisions)' },
    { value: 'comprehensive', label: 'Comprehensive (Complete coverage)' }
  ],

  DIFFICULTY_LEVELS: [
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' },
    { value: 'mixed', label: 'Mixed (Auto-adjust)' }
  ],

  LEARNING_PACES: [
    { value: 'slow', label: 'Slow & Detailed' },
    { value: 'moderate', label: 'Moderate' },
    { value: 'fast', label: 'Fast-paced' },
    { value: 'crash', label: 'Crash Course' }
  ],

  CONTENT_STYLES: [
    { value: 'visual', label: 'Visual (Diagrams, charts)' },
    { value: 'textual', label: 'Textual (Detailed explanations)' },
    { value: 'interactive', label: 'Interactive (Q&A format)' },
    { value: 'story-based', label: 'Story-based (Real examples)' }
  ],

  QUIZ_DIFFICULTIES: [
    { value: 'easy', label: 'Easy' },
    { value: 'medium', label: 'Medium' },
    { value: 'hard', label: 'Hard' },
    { value: 'adaptive', label: 'Adaptive' }
  ],

  // File Upload Limits
  UPLOAD_LIMITS: {
    MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
    ALLOWED_MIME_TYPES: [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ],
    MAX_FILES: 1
  },

  // AI Service Limits
  AI_LIMITS: {
    MAX_TOKENS: 8192,
    MAX_CHUNK_SIZE: 4000,
    REQUEST_DELAY: 500, // ms between requests
    MAX_RETRIES: 3
  },

  // Progress Tracking
  PROGRESS_LEVELS: [
    { level: 1, name: '🌱 Rookie', xpRequired: 0 },
    { level: 2, name: '📚 Learner', xpRequired: 1000 },
    { level: 3, name: '💡 Thinker', xpRequired: 2500 },
    { level: 4, name: '🎯 Achiever', xpRequired: 5000 },
    { level: 5, name: '🚀 Master', xpRequired: 10000 },
    { level: 6, name: '🏆 Champion', xpRequired: 20000 }
  ],

  // XP Rewards
  XP_REWARDS: {
    LESSON_COMPLETE: 50,
    QUIZ_PERFECT: 100,
    DAILY_TASK: 25,
    LEARNING_STREAK: 10,
    COURSE_COMPLETE: 500
  },

  // Weakness Detection Thresholds
  WEAKNESS_THRESHOLDS: {
    LOW_QUIZ_SCORE: 60, // Percentage
    HIGH_TIME_SPENT: 1.5, // Ratio of actual vs expected time
    HIGH_RETRY_RATE: 0.3, // 30% of lessons retried
    LOW_ENGAGEMENT: 7 // Days since last activity
  },

  // Daily Task Settings
  DAILY_TASK: {
    DEFAULT_ESTIMATED_TIME: 10, // minutes
    MAX_TASKS_PER_DAY: 3,
    GENERATION_TIME: '09:00', // 9 AM
    EXPIRY_HOURS: 24
  },

  // Vector DB Settings
  VECTOR_DB: {
    COLLECTION_NAME: 'eduai_course_content',
    SIMILARITY_THRESHOLD: 0.6,
    MAX_RESULTS: 10,
    EMBEDDING_DIMENSION: 384
  },

  // Error Messages
  ERROR_MESSAGES: {
    FILE_UPLOAD: {
      INVALID_TYPE: 'Only PDF and DOCX files are allowed',
      SIZE_EXCEEDED: 'File size must be less than 50MB',
      UPLOAD_FAILED: 'File upload failed. Please try again.'
    },
    AI_SERVICE: {
      GENERATION_FAILED: 'Content generation failed. Please try again.',
      RATE_LIMIT: 'AI service is busy. Please wait a moment.',
      INVALID_RESPONSE: 'AI returned invalid response format.'
    },
    COURSE: {
      NOT_FOUND: 'Course not found',
      ACCESS_DENIED: 'You do not have access to this course',
      GENERATION_IN_PROGRESS: 'Course is still being generated'
    }
  },

  // Success Messages
  SUCCESS_MESSAGES: {
    COURSE_CREATED: 'Course created successfully',
    LESSON_COMPLETED: 'Lesson completed! Great job!',
    QUIZ_SUBMITTED: 'Quiz submitted successfully',
    DAILY_TASK_COMPLETED: 'Daily task completed! Keep going!',
    WEAKNESS_ANALYZED: 'Weakness analysis completed'
  }
};

module.exports = CONSTANTS;