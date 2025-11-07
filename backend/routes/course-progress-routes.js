const express = require('express');
const router = express.Router();
const {
  getUserProgress,
  resetProgress,
  getLearningAnalytics,
  updateFlashcardProgress
} = require('../controllers/course-controller');
const authMiddleware = require('../middleware/auth-middleware');

// Apply authentication middleware
router.use(authMiddleware);

// Get user progress for a specific course
router.get('/:courseId', getUserProgress);

// Reset progress for a course
router.delete('/:courseId/reset', resetProgress);

// Update flashcard progress
router.post('/:courseId/modules/:moduleIndex/flashcards', updateFlashcardProgress);

// Get comprehensive learning analytics
router.get('/analytics/overview', getLearningAnalytics);

module.exports = router;