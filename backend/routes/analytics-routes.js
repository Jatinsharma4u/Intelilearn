// routes/analytics-routes.js - COMPLETE FIXED VERSION
const express = require('express');
const router = express.Router();
const CourseAnalytics = require('../models/CourseAnalytics');
const Course = require('../models/Course');
const auth = require('../middleware/auth-middleware');

// 🐛 DEBUG: Check analytics data
router.get('/debug/:courseId', auth, async (req, res) => {
  try {
    const { courseId } = req.params;
    const studentId = req.user.uid;

    console.log('🔍 DEBUG Analytics Request:', { studentId, courseId });

    // Check if analytics exists
    const analytics = await CourseAnalytics.findOne({ studentId, courseId });
    
    if (!analytics) {
      console.log('❌ No analytics document found in database');
      return res.json({
        success: true,
        message: 'No analytics document found in database',
        exists: false,
        studentId,
        courseId
      });
    }

    console.log('✅ Analytics document found:', {
      totalTimeSpent: analytics.totalTimeSpent,
      quizAttemptsCount: analytics.quizAttempts.length,
      totalQuizzesAttempted: analytics.totalQuizzesAttempted,
      averageAccuracy: analytics.averageAccuracy,
      averageSpeed: analytics.averageSpeed,
      lastActive: analytics.lastActive
    });

    // Update metrics to ensure they're current
    analytics.updateMetrics();
    await analytics.save();

    res.json({
      success: true,
      exists: true,
      rawData: {
        totalTimeSpent: analytics.totalTimeSpent,
        quizAttempts: analytics.quizAttempts.length,
        totalQuizzesAttempted: analytics.totalQuizzesAttempted,
        averageAccuracy: analytics.averageAccuracy,
        averageSpeed: analytics.averageSpeed,
        lastActive: analytics.lastActive
      },
      summary: analytics.getCourseSummary()
    });
  } catch (error) {
    console.error('❌ DEBUG Error:', error);
    res.status(500).json({
      success: false,
      message: 'Debug error',
      error: error.message
    });
  }
});

// 📊 GET analytics for a specific course - COMPLETELY FIXED
router.get('/course/:courseId', auth, async (req, res) => {
  try {
    const { courseId } = req.params;
    const studentId = req.user.uid;

    console.log('🔍 Fetching analytics for:', { studentId, courseId });

    const analytics = await CourseAnalytics.findOne({ studentId, courseId });
    
    if (!analytics) {
      console.log('📭 No analytics found, returning empty data');
      return res.json({
        success: true,
        analytics: {
          studentId,
          courseId,
          courseTitle: 'Unknown Course',
          quizzesAttempted: 0,
          accuracy: '0%',
          averageAccuracy: 0,
          averageSpeed: 0,
          totalTimeSpent: '0m',
          totalTimeSpentSeconds: 0,
          totalQuizTime: '0m',
          lastActive: new Date(),
          daysSinceStart: 0,
          isEmpty: true
        }
      });
    }

    // ✅ Ensure metrics are updated
    analytics.updateMetrics();
    await analytics.save();

    const summary = analytics.getCourseSummary();
    
    // ✅ Add raw data for frontend calculations
    summary.averageAccuracy = analytics.averageAccuracy;
    summary.averageSpeed = analytics.averageSpeed;
    summary.totalTimeSpentSeconds = analytics.totalTimeSpent;
    summary.quizAttemptsCount = analytics.quizAttempts.length;
    summary.isEmpty = false;

    console.log('✅ Sending analytics to frontend:', {
      quizzesAttempted: summary.quizzesAttempted,
      averageAccuracy: summary.averageAccuracy,
      totalTimeSpent: summary.totalTimeSpent
    });

    res.json({
      success: true,
      analytics: summary
    });
  } catch (error) {
    console.error('❌ Analytics fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching analytics',
      error: error.message
    });
  }
});

// 🎯 RECORD QUIZ ATTEMPT - COMPLETELY FIXED
router.post('/quiz-attempt', auth, async (req, res) => {
  try {
    const studentId = req.user.uid;
    const {
      courseId,
      lessonId,
      moduleId,
      score,
      totalQuestions,
      correctAnswers,
      timeSpent,
      answers,
      lessonTitle,
      moduleTitle
    } = req.body;

    console.log('📝 Recording quiz attempt:', { 
      studentId, 
      courseId, 
      score,
      correctAnswers,
      totalQuestions,
      timeSpent 
    });

    // Find or create analytics
    let analytics = await CourseAnalytics.findOne({ studentId, courseId });
    
    if (!analytics) {
      const course = await Course.findById(courseId);
      analytics = new CourseAnalytics({
        studentId,
        courseId,
        courseTitle: course?.title || 'Unknown Course',
        totalTimeSpent: 0
      });
      console.log('✅ Created new analytics document');
    }

    // Create quiz attempt object
    const quizAttempt = {
      lessonId,
      moduleId,
      lessonTitle: lessonTitle || `Lesson ${lessonId}`,
      moduleTitle: moduleTitle || `Module ${moduleId}`,
      score,
      totalQuestions,
      correctAnswers,
      timeSpent,
      answers: answers || [],
      attemptedAt: new Date()
    };

    // Add quiz attempt
    analytics.quizAttempts.push(quizAttempt);

    console.log('✅ Quiz attempt added, updating metrics...');

    // Update metrics
    analytics.updateMetrics();
    analytics.lastActive = new Date();
    
    await analytics.save();

    console.log('✅ Analytics saved successfully:', {
      totalQuizzesAttempted: analytics.totalQuizzesAttempted,
      averageAccuracy: analytics.averageAccuracy,
      averageSpeed: analytics.averageSpeed,
      totalTimeSpent: analytics.totalTimeSpent
    });

    const summary = analytics.getCourseSummary();
    summary.averageAccuracy = analytics.averageAccuracy;
    summary.averageSpeed = analytics.averageSpeed;
    summary.totalTimeSpentSeconds = analytics.totalTimeSpent;

    res.json({
      success: true,
      message: 'Quiz attempt recorded successfully',
      analytics: summary
    });
  } catch (error) {
    console.error('❌ Quiz attempt error:', error);
    res.status(500).json({
      success: false,
      message: 'Error recording quiz attempt',
      error: error.message
    });
  }
});

// ⏰ UPDATE TOTAL TIME SPENT - COMPLETELY FIXED
router.post('/update-time', auth, async (req, res) => {
  try {
    const studentId = req.user.uid;
    const { courseId, timeSpent } = req.body;

    console.log('⏰ Updating time:', { studentId, courseId, timeSpent });

    let analytics = await CourseAnalytics.findOne({ studentId, courseId });
    
    if (!analytics) {
      const course = await Course.findById(courseId);
      analytics = new CourseAnalytics({
        studentId,
        courseId,
        courseTitle: course?.title || 'Unknown Course',
        totalTimeSpent: timeSpent
      });
      console.log('✅ Created new analytics with time:', timeSpent);
    } else {
      const oldTime = analytics.totalTimeSpent;
      analytics.totalTimeSpent += timeSpent;
      analytics.lastActive = new Date();
      console.log('✅ Updated time:', { oldTime, newTime: analytics.totalTimeSpent, added: timeSpent });
    }

    await analytics.save();

    res.json({
      success: true,
      message: 'Time updated successfully',
      totalTimeSpent: analytics.formatTime(analytics.totalTimeSpent),
      totalTimeSpentSeconds: analytics.totalTimeSpent
    });
  } catch (error) {
    console.error('❌ Time update error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating time',
      error: error.message
    });
  }
});

// 📋 GET detailed quiz history for a course
router.get('/quiz-history/:courseId', auth, async (req, res) => {
  try {
    const { courseId } = req.params;
    const studentId = req.user.uid;

    const analytics = await CourseAnalytics.findOne({ studentId, courseId });
    
    if (!analytics || analytics.quizAttempts.length === 0) {
      return res.json({
        success: true,
        quizHistory: []
      });
    }

    const quizHistory = analytics.quizAttempts.map(attempt => ({
      lessonTitle: attempt.lessonTitle,
      moduleTitle: attempt.moduleTitle,
      score: attempt.score,
      correctAnswers: attempt.correctAnswers,
      totalQuestions: attempt.totalQuestions,
      timeSpent: analytics.formatTime(attempt.timeSpent),
      attemptedAt: attempt.attemptedAt,
      accuracy: Math.round((attempt.correctAnswers / attempt.totalQuestions) * 100)
    }));

    res.json({
      success: true,
      quizHistory: quizHistory.reverse()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching quiz history',
      error: error.message
    });
  }
});

// 📈 GET all analytics for student
router.get('/my-analytics', auth, async (req, res) => {
  try {
    const studentId = req.user.uid;
    
    const analytics = await CourseAnalytics.find({ studentId });
    
    const summary = analytics.map(analytic => {
      const summary = analytic.getCourseSummary();
      summary.averageAccuracy = analytic.averageAccuracy;
      summary.averageSpeed = analytic.averageSpeed;
      summary.totalTimeSpentSeconds = analytic.totalTimeSpent;
      return summary;
    });
    
    res.json({
      success: true,
      analytics: summary,
      totalCourses: analytics.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching analytics',
      error: error.message
    });
  }
});

module.exports = router;