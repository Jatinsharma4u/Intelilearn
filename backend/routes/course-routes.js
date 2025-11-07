const express = require('express');
const router = express.Router();
const {
  createCourse,
  getUserCourses,
  getCourse,
  getModuleContent,
  updateLessonProgress,
  submitQuiz,
  deleteCourse
} = require('../controllers/course-controller');
const authMiddleware = require('../middleware/auth-middleware');
const { handleFileUpload } = require('../utils/fileUpload');

// Apply authentication middleware to all course routes
router.use(authMiddleware);

// Course creation with file upload - USE handleFileUpload() instead of upload.array()
router.post('/create', handleFileUpload(), createCourse);

// Get all courses for authenticated user
router.get('/', getUserCourses);

// Get specific course details
router.get('/:courseId', getCourse);

// Get module content
router.get('/:courseId/modules/:moduleIndex', getModuleContent);

// Update lesson progress
router.post('/:courseId/modules/:moduleIndex/lessons/:lessonIndex/progress', updateLessonProgress);

// Submit quiz answers
router.post('/:courseId/modules/:moduleIndex/quiz', submitQuiz);

// Delete course
router.delete('/:courseId', deleteCourse);

module.exports = router;