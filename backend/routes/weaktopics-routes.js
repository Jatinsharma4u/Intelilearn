// routes/weaktopics-routes.js - Weak Topics Routes for Course Feature
const express = require('express');
const WeakTopic = require('../models/WeakTopic');
const Course = require('../models/Course');
const router = express.Router();

// ✅ Get all weak topics for a course
router.get('/course/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.uid;

    // Verify course exists and user has access
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    if (course.createdBy !== userId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const includeReviewed = req.query.includeReviewed === 'true';
    const weakTopics = await WeakTopic.findWeakTopics(courseId, userId, includeReviewed);

    res.json({
      success: true,
      weakTopics: weakTopics.map(wt => ({
        ...wt.toObject(),
        weaknessScore: wt.weaknessScore
      }))
    });
  } catch (error) {
    console.error('❌ Get weak topics error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✅ Record quiz attempt and update weak topics
router.post('/course/:courseId/record-attempt', async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.uid;
    const { answers, questionDetails } = req.body; // questionDetails: [{questionId, topic, timeSpent, isCorrect, ...}]

    // Verify course exists and user has access
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    if (course.createdBy !== userId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // ✅ FIXED: Only track topics with WRONG answers (not correct ones)
    // Group questions by topic - ONLY for wrong answers
    const topicMap = new Map();

    questionDetails.forEach(qd => {
      // ✅ ONLY process if answer is WRONG
      if (!qd.isCorrect) {
        const topic = qd.topic || 'General';
        
        if (!topicMap.has(topic)) {
          topicMap.set(topic, {
            totalQuestions: 0,
            wrongAnswers: 0,
            correctAnswers: 0,
            totalTimeSpent: 0,
            problematicQuestions: []
          });
        }

        const topicData = topicMap.get(topic);
        topicData.totalQuestions += 1;
        topicData.wrongAnswers += 1;
        topicData.totalTimeSpent += qd.timeSpent || 0;

        // Add to problematic questions (only wrong answers)
        topicData.problematicQuestions.push({
          questionId: qd.questionId,
          questionText: qd.questionText || '',
          moduleId: qd.moduleId || '',
          lessonId: qd.lessonId || '',
          moduleTitle: qd.moduleTitle || '',
          lessonTitle: qd.lessonTitle || '',
          isWrong: true,
          timeSpent: qd.timeSpent || 0
        });
      }
      // Note: Questions that took too long (>60s) are already handled above if they're wrong
      // We only track wrong answers, not correct ones even if they took time
    });

    // ✅ Only update/create weak topics if there are WRONG answers
    const updatedTopics = [];
    for (const [topic, topicData] of topicMap.entries()) {
      // Only process if there are wrong answers
      if (topicData.wrongAnswers > 0) {
        const weakTopic = await WeakTopic.getOrCreate(courseId, userId, topic);
        weakTopic.updateWithQuizAttempt(topicData);
        await weakTopic.save();
        updatedTopics.push(weakTopic);
      }
    }

    res.json({
      success: true,
      message: 'Quiz attempt recorded and weak topics updated',
      updatedTopics: updatedTopics.map(wt => ({
        topic: wt.topic,
        weaknessScore: wt.weaknessScore,
        totalQuestions: wt.totalQuestions,
        wrongAnswers: wt.wrongAnswers
      }))
    });
  } catch (error) {
    console.error('❌ Record quiz attempt error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✅ Mark weak topic as reviewed
router.put('/:weakTopicId/review', async (req, res) => {
  try {
    const { weakTopicId } = req.params;
    const userId = req.user.uid;

    const weakTopic = await WeakTopic.findById(weakTopicId);
    if (!weakTopic) {
      return res.status(404).json({ success: false, message: 'Weak topic not found' });
    }

    if (weakTopic.userId !== userId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    weakTopic.markAsReviewed();
    await weakTopic.save();

    res.json({
      success: true,
      message: 'Weak topic marked as reviewed',
      weakTopic: {
        ...weakTopic.toObject(),
        weaknessScore: weakTopic.weaknessScore
      }
    });
  } catch (error) {
    console.error('❌ Mark as reviewed error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✅ Get weak topic details
router.get('/:weakTopicId', async (req, res) => {
  try {
    const { weakTopicId } = req.params;
    const userId = req.user.uid;

    const weakTopic = await WeakTopic.findById(weakTopicId);
    if (!weakTopic) {
      return res.status(404).json({ success: false, message: 'Weak topic not found' });
    }

    if (weakTopic.userId !== userId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.json({
      success: true,
      weakTopic: {
        ...weakTopic.toObject(),
        weaknessScore: weakTopic.weaknessScore
      }
    });
  } catch (error) {
    console.error('❌ Get weak topic error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✅ Delete weak topic (when user wants to remove it)
router.delete('/:weakTopicId', async (req, res) => {
  try {
    const { weakTopicId } = req.params;
    const userId = req.user.uid;

    const weakTopic = await WeakTopic.findById(weakTopicId);
    if (!weakTopic) {
      return res.status(404).json({ success: false, message: 'Weak topic not found' });
    }

    if (weakTopic.userId !== userId) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    await WeakTopic.findByIdAndDelete(weakTopicId);

    res.json({
      success: true,
      message: 'Weak topic deleted successfully'
    });
  } catch (error) {
    console.error('❌ Delete weak topic error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;


