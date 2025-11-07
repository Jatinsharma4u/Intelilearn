// Utility functions for course management

// Format file size to readable format
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Calculate estimated course duration
export const calculateEstimatedDuration = (modulesCount, learningPace) => {
  const baseDuration = modulesCount * 30; // 30 minutes per module base
  const paceMultipliers = {
    slow: 1.5,
    medium: 1,
    fast: 0.7
  };
  return Math.round(baseDuration * paceMultipliers[learningPace]);
};

// Generate course structure preview
export const generateCoursePreview = (settings) => {
  const { modulesCount, questionsPerModule, flashcardsCount } = settings;
  
  return {
    totalModules: modulesCount,
    estimatedLessons: {
      min: modulesCount * 3,
      max: modulesCount * 5
    },
    totalQuizQuestions: modulesCount * questionsPerModule,
    totalFlashcards: flashcardsCount,
    estimatedDuration: {
      min: modulesCount * 25,
      max: modulesCount * 40
    }
  };
};

// Validate file upload
export const validateFileUpload = (files) => {
  const errors = [];
  const maxSize = 50 * 1024 * 1024; // 50MB
  const allowedTypes = [
    'application/pdf',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ];

  if (files.length === 0) {
    errors.push('Please select at least one file');
    return errors;
  }

  files.forEach(file => {
    if (file.size > maxSize) {
      errors.push(`File "${file.name}" is too large. Maximum size is 50MB.`);
    }
    
    if (!allowedTypes.includes(file.type)) {
      errors.push(`File "${file.name}" is not a supported format.`);
    }
  });

  return errors;
};

// Get file type icon
export const getFileTypeIcon = (fileType) => {
  const icons = {
    'application/pdf': '📕',
    'application/vnd.ms-powerpoint': '📊',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': '📊',
    'application/msword': '📄',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '📄',
    'text/plain': '📝'
  };
  
  return icons[fileType] || '📁';
};

// Calculate course progress
export const calculateCourseProgress = (course) => {
  if (!course || !course.modules) return 0;
  
  const totalLessons = course.modules.reduce((total, module) => 
    total + (module.lessons?.length || 0), 0
  );
  
  const completedLessons = course.modules.reduce((total, module) => 
    total + (module.user_progress?.completed_lessons?.length || 0), 0
  );
  
  return totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;
};

// Get difficulty color
export const getDifficultyColor = (difficulty) => {
  const colors = {
    beginner: 'green',
    intermediate: 'yellow',
    advanced: 'red'
  };
  
  return colors[difficulty] || 'gray';
};

// Format learning time
export const formatLearningTime = (minutes) => {
  if (minutes < 60) {
    return `${minutes} min`;
  } else {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  }
};

// Generate course statistics
export const generateCourseStats = (course) => {
  if (!course) return null;
  
  return {
    totalModules: course.modules?.length || 0,
    totalLessons: course.total_lessons || 0,
    totalQuizzes: course.total_quizzes || 0,
    totalFlashcards: course.total_flashcards || 0,
    totalDuration: course.total_duration || 0,
    progress: course.progress || 0
  };
};

// Check if course is processing
export const isCourseProcessing = (course) => {
  return course?.status === 'processing';
};

// Check if course is ready
export const isCourseReady = (course) => {
  return course?.status === 'ready';
};

export default {
  formatFileSize,
  calculateEstimatedDuration,
  generateCoursePreview,
  validateFileUpload,
  getFileTypeIcon,
  calculateCourseProgress,
  getDifficultyColor,
  formatLearningTime,
  generateCourseStats,
  isCourseProcessing,
  isCourseReady
};