// routes/tutor-routes.js - Tutor Agent Routes
const express = require('express');
const tutorAgent = require('../services/ai/tutor-agent');
const WeakTopic = require('../models/WeakTopic');
const Course = require('../models/Course');
const router = express.Router();

// ✅ Start topic improvement session
router.post('/start-topic', async (req, res) => {
  try {
    const { courseId, topic, preferredDifficulty = 'medium' } = req.body;
    const userId = req.user.uid;

    // Verify course access
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    if (course.createdBy !== userId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Verify weak topic exists
    const weakTopic = await WeakTopic.findOne({ courseId, userId, topic });
    if (!weakTopic) {
      return res.status(404).json({ success: false, message: 'Weak topic not found' });
    }

    // Start session
    const session = await tutorAgent.startTopicSession(
      courseId,
      userId,
      topic,
      preferredDifficulty
    );

    res.json(session);

  } catch (error) {
    console.error('❌ Start topic session error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✅ Submit answers and get evaluation
router.post('/evaluate', async (req, res) => {
  try {
    const { courseId, topic, questions, studentAnswers, timeSpent = 0 } = req.body;
    const userId = req.user.uid;

    // Verify course access
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    if (course.createdBy !== userId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Evaluate and update
    const result = await tutorAgent.evaluateAndUpdate(
      courseId,
      userId,
      topic,
      questions,
      studentAnswers,
      timeSpent
    );

    res.json(result);

  } catch (error) {
    console.error('❌ Evaluate answers error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✅ Get topic progress
router.get('/progress/:courseId/:topic', async (req, res) => {
  try {
    const { courseId, topic } = req.params;
    const userId = req.user.uid;

    // Verify course access
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    if (course.createdBy !== userId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Get progress
    const progress = await tutorAgent.getTopicProgress(courseId, userId, topic);

    res.json(progress);

  } catch (error) {
    console.error('❌ Get progress error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✅ Health check
router.get('/health', async (req, res) => {
  res.json({
    success: true,
    message: 'Tutor Agent is running',
    agents: ['Teacher Agent', 'Practice Agent', 'Assessor Agent']
  });
});

module.exports = router;

