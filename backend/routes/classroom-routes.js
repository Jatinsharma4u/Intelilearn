const express = require('express');
const multer = require('multer');
const classroomController = require('../controllers/classroom-controller');
const authMiddleware = require('../middleware/auth-middleware');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  }
});

// Apply auth middleware to all routes
router.use(authMiddleware);

// ===== CLASSROOM ROUTES =====
router.post('/create', classroomController.createClassroom);
router.post('/join', classroomController.joinClassroom);
router.get('/teacher', classroomController.getTeacherClassrooms);
router.get('/student', classroomController.getStudentClassrooms);
router.get('/:classroomId', classroomController.getClassroomDetails);
router.delete('/:classroomId/students/:studentId', classroomController.removeStudent);

// ===== QUIZ ROUTES =====
router.post('/:classroomId/quizzes/manual', classroomController.createManualQuiz);
router.post('/:classroomId/quizzes/pdf', upload.single('pdf'), classroomController.createQuizFromPDF);
router.get('/:classroomId/quizzes', classroomController.getClassroomQuizzes);
router.get('/quizzes/:quizId', classroomController.getQuizDetails);

// ===== QUIZ STATUS MANAGEMENT ROUTES =====
router.patch('/quizzes/:quizId/status', classroomController.updateQuizStatus);
router.delete('/quizzes/:quizId', classroomController.deleteQuiz);
router.patch('/quizzes/:quizId/schedule', classroomController.scheduleQuiz);

// ===== EXAM ROUTES =====
router.post('/quizzes/:quizId/start', classroomController.startExam);
router.post('/sessions/:sessionId/answer', classroomController.submitAnswer);
router.post('/sessions/:sessionId/submit', classroomController.submitExam);
router.get('/sessions/:sessionId', classroomController.getExamSessionDetails);

// ===== ANALYTICS & RESULTS ROUTES =====
router.get('/:classroomId/student-results', classroomController.getStudentResults);
router.get('/:classroomId/analytics', classroomController.getClassroomAnalytics);
router.get('/:classroomId/export', classroomController.exportResults);
router.get('/:classroomId/leaderboard', classroomController.getLeaderboard);

// ===== QUIZ-SPECIFIC ANALYTICS ROUTES =====
router.get('/quizzes/:quizId/analytics', classroomController.getQuizAnalytics);
router.get('/quizzes/:quizId/export', classroomController.exportQuizResults);

module.exports = router;