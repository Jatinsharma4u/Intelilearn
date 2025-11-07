const Course = require('../models/Course');
const UserProgress = require('../models/UserProgress');
const { processCourseWithAI } = require('./ai-processor');
const path = require('path');
const fs = require('fs');

// Create new course with enhanced AI processing
const createCourse = async (req, res) => {
  try {
    console.log('📝 Course creation request received');
    console.log('📁 Files:', req.files?.length, 'files');
    console.log('⚙️ Settings:', req.body);

    const { 
      title, 
      settings 
    } = req.body;

    const userId = req.user.uid;

    // Find user
    const User = require('../models/User');
    const user = await User.findOne({ userId: userId });
    if (!user) {
      console.log('❌ User not found with userId:', userId);
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('✅ User found:', user.username);

    // Parse settings
    let parsedSettings = settings;
    if (typeof settings === 'string') {
      try {
        parsedSettings = JSON.parse(settings);
      } catch (parseError) {
        console.log('❌ Settings parse error:', parseError);
        return res.status(400).json({ error: 'Invalid settings format' });
      }
    }

    // Create course document
    const course = new Course({
      title: title || 'Untitled Course',
      description: `AI-generated course: ${title || 'Untitled Course'}`,
      creator: user._id,
      settings: {
        modules_count: parsedSettings.modulesCount || 5,
        flashcards_count: parsedSettings.flashcardsCount || 20,
        difficulty: parsedSettings.difficulty || 'beginner',
        learning_pace: parsedSettings.learningPace || 'medium',
        questions_per_module: parsedSettings.questionsPerModule || 10,
        exam_type: parsedSettings.examType || 'academic',
        depth_level: parsedSettings.depthLevel || 'comprehensive',
        ...parsedSettings
      },
      status: 'processing',
      processing_log: [{
        step: 'init',
        status: 'started',
        message: 'Course creation started',
        timestamp: new Date()
      }]
    });

    await course.save();
    console.log('✅ Course document created:', course._id);

    // Process files and generate course content
    try {
      console.log('🚀 Starting enhanced AI processing...');
      const processedCourse = await processCourseWithAI(course._id, req.files, parsedSettings);
      
      console.log('🎉 Course processing completed successfully!');
      
      res.status(201).json({
        success: true,
        message: 'Course created successfully',
        course: processedCourse
      });
    } catch (processingError) {
      console.log('❌ AI processing failed:', processingError);
      
      // Update course status to failed
      course.status = 'failed';
      course.processing_log.push({
        step: 'ai_processing',
        status: 'failed',
        message: processingError.message,
        timestamp: new Date()
      });
      await course.save();

      res.status(500).json({
        success: false,
        error: 'Course processing failed',
        details: processingError.message
      });
    }

  } catch (error) {
    console.error('❌ Course creation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create course',
      details: error.message
    });
  }
};

// Get all courses for user with enhanced progress tracking
const getUserCourses = async (req, res) => {
  try {
    const userId = req.user.uid;

    const User = require('../models/User');
    const user = await User.findOne({ userId: userId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('📚 Fetching courses for user:', user.username);

    const courses = await Course.find({ creator: user._id })
      .sort({ created_at: -1 })
      .select('title description status settings created_at updated_at total_duration total_lessons thumbnail modules');

    console.log(`✅ Found ${courses.length} courses for user`);

    // Enhanced progress calculation with UserProgress model
    const coursesWithProgress = await Promise.all(
      courses.map(async (course) => {
        const userProgress = await UserProgress.findOne({
          user_id: user._id,
          course_id: course._id
        });
        
        const progress = userProgress ? userProgress.overall_progress : 0;
        const stats = generateCourseStats(course);
        const learningData = userProgress ? {
          timeSpent: userProgress.total_time_spent,
          lastActivity: userProgress.learning_analytics.last_activity,
          weakTopics: userProgress.weak_topics.slice(0, 3)
        } : null;
        
        return {
          ...course.toObject(),
          progress,
          stats,
          learningData,
          started: !!userProgress
        };
      })
    );

    res.json({
      success: true,
      courses: coursesWithProgress
    });
  } catch (error) {
    console.error('❌ Get courses error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch courses'
    });
  }
};

// Get single course with detailed progress
const getCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.uid;

    const User = require('../models/User');
    const user = await User.findOne({ userId: userId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const course = await Course.findOne({ 
      _id: courseId, 
      creator: user._id 
    }).populate('creator', 'username fullName avatar');

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Get detailed user progress
    const userProgress = await UserProgress.findOne({
      user_id: user._id,
      course_id: courseId
    });

    const progress = userProgress ? userProgress.overall_progress : 0;
    const stats = generateCourseStats(course);
    const moduleProgress = await getModuleProgress(user._id, courseId);

    res.json({
      success: true,
      course: {
        ...course.toObject(),
        progress,
        stats,
        moduleProgress,
        userProgress: userProgress ? {
          overall: userProgress.overall_progress,
          timeSpent: userProgress.total_time_spent,
          startedAt: userProgress.started_at,
          completed: userProgress.overall_progress === 100,
          weakTopics: userProgress.weak_topics,
          analytics: userProgress.learning_analytics
        } : null
      }
    });
  } catch (error) {
    console.error('❌ Get course error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch course'
    });
  }
};

// Get module content with enhanced progress tracking
const getModuleContent = async (req, res) => {
  try {
    const { courseId, moduleIndex } = req.params;
    const userId = req.user.uid;

    const User = require('../models/User');
    const user = await User.findOne({ userId: userId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const course = await Course.findOne({ 
      _id: courseId, 
      creator: user._id 
    });

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const module = course.modules[moduleIndex];
    if (!module) {
      return res.status(404).json({ error: 'Module not found' });
    }

    // Get detailed user progress for this module
    const userProgress = await UserProgress.findOne({
      user_id: user._id,
      course_id: courseId
    });

    let moduleUserProgress = null;
    if (userProgress && userProgress.modules_progress[moduleIndex]) {
      const moduleProgress = userProgress.modules_progress[moduleIndex];
      moduleUserProgress = {
        completed: moduleProgress.completed || false,
        completedLessons: moduleProgress.lessons_progress?.filter(lesson => lesson.completed).length || 0,
        totalLessons: module.lessons?.length || 0,
        quizCompleted: moduleProgress.quiz_attempts?.length > 0,
        progressPercentage: moduleProgress.progress_percentage || 0,
        timeSpent: moduleProgress.time_spent || 0,
        lastAccessed: moduleProgress.last_accessed,
        quizAttempts: moduleProgress.quiz_attempts?.length || 0,
        bestQuizScore: Math.max(...(moduleProgress.quiz_attempts?.map(attempt => attempt.score) || [0])),
        flashcardsMastered: moduleProgress.flashcards_progress?.filter(card => card.mastered).length || 0
      };
    } else {
      // Fallback to basic progress calculation
      const completedLessons = module.lessons?.filter(lesson => lesson.completed).length || 0;
      const totalLessons = module.lessons?.length || 0;
      
      moduleUserProgress = {
        completed: module.completed || false,
        completedLessons: completedLessons,
        totalLessons: totalLessons,
        quizCompleted: module.completed && module.quiz && module.quiz.length > 0,
        progressPercentage: totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0,
        timeSpent: module.timeSpent || 0
      };
    }

    res.json({
      success: true,
      module: {
        ...module.toObject(),
        user_progress: moduleUserProgress
      },
      course_title: course.title
    });
  } catch (error) {
    console.error('❌ Get module error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch module'
    });
  }
};

// Enhanced progress tracking with UserProgress model
const calculateCourseProgress = async (userId, courseId) => {
  try {
    const userProgress = await UserProgress.findOne({
      user_id: userId,
      course_id: courseId
    });

    if (userProgress) {
      return userProgress.overall_progress;
    }

    // Fallback to course-based calculation
    const course = await Course.findById(courseId);
    if (!course || !course.modules) return 0;

    let totalLessons = 0;
    let completedLessons = 0;
    let totalQuizzes = 0;
    let completedQuizzes = 0;

    course.modules.forEach(module => {
      const moduleLessons = module.lessons?.length || 0;
      const moduleCompletedLessons = module.lessons?.filter(lesson => lesson.completed).length || 0;
      
      totalLessons += moduleLessons;
      completedLessons += moduleCompletedLessons;

      if (module.quiz?.length > 0) {
        totalQuizzes++;
        if (module.completed) {
          completedQuizzes++;
        }
      }
    });

    const lessonProgress = totalLessons > 0 ? (completedLessons / totalLessons) * 70 : 0;
    const quizProgress = totalQuizzes > 0 ? (completedQuizzes / totalQuizzes) * 30 : 0;

    return Math.min(lessonProgress + quizProgress, 100);
  } catch (error) {
    console.error('❌ Progress calculation error:', error);
    return 0;
  }
};

// Get detailed module progress
const getModuleProgress = async (userId, courseId) => {
  try {
    const userProgress = await UserProgress.findOne({
      user_id: userId,
      course_id: courseId
    });

    const course = await Course.findById(courseId);
    if (!course) return [];

    return course.modules.map((module, index) => {
      let moduleProgress = null;
      
      if (userProgress && userProgress.modules_progress[index]) {
        const userModuleProgress = userProgress.modules_progress[index];
        moduleProgress = {
          moduleId: module._id,
          moduleIndex: index,
          title: module.title,
          completed: userModuleProgress.completed || false,
          completedLessons: userModuleProgress.lessons_progress?.filter(lesson => lesson.completed).length || 0,
          totalLessons: module.lessons?.length || 0,
          quizCompleted: userModuleProgress.quiz_attempts?.length > 0,
          timeSpent: userModuleProgress.time_spent || 0,
          progressPercentage: userModuleProgress.progress_percentage || 0,
          lastAccessed: userModuleProgress.last_accessed,
          quizAttempts: userModuleProgress.quiz_attempts?.length || 0,
          bestQuizScore: Math.max(...(userModuleProgress.quiz_attempts?.map(attempt => attempt.score) || [0])),
          flashcardsMastered: userModuleProgress.flashcards_progress?.filter(card => card.mastered).length || 0
        };
      } else {
        // Fallback calculation
        const completedLessons = module.lessons?.filter(lesson => lesson.completed).length || 0;
        const totalLessons = module.lessons?.length || 0;
        
        moduleProgress = {
          moduleId: module._id,
          moduleIndex: index,
          title: module.title,
          completed: module.completed || false,
          completedLessons: completedLessons,
          totalLessons: totalLessons,
          quizCompleted: module.completed && module.quiz && module.quiz.length > 0,
          timeSpent: module.timeSpent || 0,
          progressPercentage: totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0
        };
      }

      return moduleProgress;
    });
  } catch (error) {
    console.error('❌ Module progress error:', error);
    return [];
  }
};

// Enhanced update lesson progress with UserProgress model
const updateLessonProgress = async (req, res) => {
  try {
    const { courseId, moduleIndex, lessonIndex } = req.params;
    const { timeSpent, completed = true, notes, bookmarked } = req.body;
    const userId = req.user.uid;

    const User = require('../models/User');
    const user = await User.findOne({ userId: userId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const moduleIdx = parseInt(moduleIndex);
    const lessonIdx = parseInt(lessonIndex);

    if (isNaN(moduleIdx) || isNaN(lessonIdx)) {
      return res.status(400).json({ error: 'Invalid module or lesson index' });
    }

    const module = course.modules[moduleIdx];
    if (!module) {
      return res.status(404).json({ error: 'Module not found' });
    }

    const lesson = module.lessons[lessonIdx];
    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    // Find or create user progress
    let userProgress = await UserProgress.findOne({
      user_id: user._id,
      course_id: courseId
    });

    if (!userProgress) {
      userProgress = new UserProgress({
        user_id: user._id,
        course_id: courseId,
        current_module: moduleIdx,
        current_lesson: lessonIdx,
        modules_progress: []
      });
    }

    // Update lesson progress in UserProgress
    userProgress.markLessonComplete(moduleIdx, lessonIdx, timeSpent || 5);

    // Update notes and bookmarks if provided
    if (notes !== undefined || bookmarked !== undefined) {
      if (!userProgress.modules_progress[moduleIdx]) {
        userProgress.modules_progress[moduleIdx] = {
          module_index: moduleIdx,
          lessons_progress: []
        };
      }

      if (!userProgress.modules_progress[moduleIdx].lessons_progress[lessonIdx]) {
        userProgress.modules_progress[moduleIdx].lessons_progress[lessonIdx] = {
          lesson_id: lesson._id,
          completed: false,
          time_spent: 0
        };
      }

      const lessonProgress = userProgress.modules_progress[moduleIdx].lessons_progress[lessonIdx];
      
      if (notes !== undefined) {
        lessonProgress.notes = notes;
      }
      
      if (bookmarked !== undefined) {
        lessonProgress.bookmarked = bookmarked;
      }
    }

    await userProgress.save();

    // Also update the course document for backward compatibility
    if (completed && !lesson.completed) {
      course.modules[moduleIdx].lessons[lessonIdx].completed = true;
      course.modules[moduleIdx].lessons[lessonIdx].completedAt = new Date();
      course.modules[moduleIdx].lessons[lessonIdx].timeSpent = timeSpent || lesson.duration;
      
      course.modules[moduleIdx].timeSpent = (course.modules[moduleIdx].timeSpent || 0) + (timeSpent || 5);
      
      const allLessonsCompleted = course.modules[moduleIdx].lessons.every(lesson => lesson.completed);
      if (allLessonsCompleted) {
        course.modules[moduleIdx].completed = true;
        course.modules[moduleIdx].completedAt = new Date();
      }
    }

    await course.save();

    // Award XP only if this is a new completion
    if (completed && !lesson.completed) {
      await awardXP(user._id, 15, `Completed lesson: ${lesson.title}`);
    }

    // Get updated progress
    const overallProgress = userProgress.overall_progress;
    const moduleProgress = userProgress.modules_progress[moduleIdx]?.progress_percentage || 0;

    res.json({
      success: true,
      message: 'Lesson progress updated',
      progress: {
        overall: overallProgress,
        module: moduleProgress,
        lesson: 100
      },
      moduleCompleted: course.modules[moduleIdx].completed,
      userProgress: {
        timeSpent: userProgress.total_time_spent,
        lastActivity: userProgress.learning_analytics.last_activity
      }
    });
  } catch (error) {
    console.error('❌ Update progress error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update progress'
    });
  }
};

// Enhanced quiz submission with progress tracking
const submitQuiz = async (req, res) => {
  try {
    const { courseId, moduleIndex } = req.params;
    const { answers, timeTaken } = req.body;
    const userId = req.user.uid;

    const User = require('../models/User');
    const user = await User.findOne({ userId: userId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const moduleIdx = parseInt(moduleIndex);
    if (isNaN(moduleIdx)) {
      return res.status(400).json({ error: 'Invalid module index' });
    }

    const module = course.modules[moduleIdx];
    if (!module || !module.quiz || !Array.isArray(module.quiz)) {
      return res.status(404).json({ error: 'Module or quiz not found' });
    }

    // Calculate score
    let correctAnswers = 0;
    const results = module.quiz.map((question, index) => {
      const userAnswer = answers[index];
      const isCorrect = userAnswer === question.correct_answer;
      if (isCorrect) correctAnswers++;
      
      return {
        question: question.question,
        userAnswer,
        correctAnswer: question.correct_answer,
        isCorrect,
        explanation: question.explanation,
        points: question.points || 5,
        question_index: index
      };
    });

    const score = Math.round((correctAnswers / module.quiz.length) * 100);

    // Find or create user progress
    let userProgress = await UserProgress.findOne({
      user_id: user._id,
      course_id: courseId
    });

    if (!userProgress) {
      userProgress = new UserProgress({
        user_id: user._id,
        course_id: courseId,
        current_module: moduleIdx,
        modules_progress: []
      });
    }

    // Add quiz attempt to progress tracking
    userProgress.addQuizAttempt(moduleIdx, {
      answers: results.map(result => ({
        question_index: result.question_index,
        selected_answer: result.userAnswer,
        is_correct: result.isCorrect,
        time_taken: timeTaken / results.length
      })),
      score: score,
      total_questions: module.quiz.length,
      correct_answers: correctAnswers,
      time_taken: timeTaken || 0
    });

    await userProgress.save();

    // Update course document for backward compatibility
    course.modules[moduleIdx].completed = true;
    course.modules[moduleIdx].completedAt = new Date();
    course.modules[moduleIdx].timeSpent = (course.modules[moduleIdx].timeSpent || 0) + (timeTaken || 0);

    course.modules[moduleIdx].quizResult = {
      score: score,
      correctAnswers: correctAnswers,
      totalQuestions: module.quiz.length,
      timeTaken: timeTaken || 0,
      attemptedAt: new Date()
    };

    await course.save();

    // Award XP based on performance
    const xpEarned = calculateQuizXP(score, module.quiz.length);
    await awardXP(user._id, xpEarned, `Quiz completed: ${score}% score`);

    // Get weak topics from user progress
    const weakTopics = userProgress.weak_topics.filter(topic => 
      topic.confidence_score < 70
    ).slice(0, 3);

    res.json({
      success: true,
      score,
      correctAnswers,
      totalQuestions: module.quiz.length,
      results,
      xpEarned,
      overallProgress: userProgress.overall_progress,
      moduleProgress: userProgress.modules_progress[moduleIdx]?.progress_percentage || 0,
      performance: getPerformanceLevel(score),
      weakTopics: weakTopics,
      analytics: {
        averageScore: userProgress.learning_analytics.average_quiz_score,
        totalQuizzes: userProgress.learning_analytics.total_quizzes_taken
      }
    });
  } catch (error) {
    console.error('❌ Submit quiz error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit quiz'
    });
  }
};

// Update flashcard progress
const updateFlashcardProgress = async (req, res) => {
  try {
    const { courseId, moduleIndex } = req.params;
    const { flashcardId, mastered } = req.body;
    const userId = req.user.uid;

    const User = require('../models/User');
    const user = await User.findOne({ userId: userId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userProgress = await UserProgress.findOne({
      user_id: user._id,
      course_id: courseId
    });

    if (!userProgress) {
      return res.status(404).json({ error: 'Progress not found' });
    }

    const moduleIdx = parseInt(moduleIndex);
    userProgress.updateFlashcardProgress(moduleIdx, flashcardId, mastered);
    await userProgress.save();

    res.json({
      success: true,
      message: 'Flashcard progress updated',
      flashcardsMastered: userProgress.learning_analytics.flashcards_mastered
    });
  } catch (error) {
    console.error('❌ Update flashcard progress error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update flashcard progress'
    });
  }
};

// Get user progress for a course
const getUserProgress = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.uid;

    const User = require('../models/User');
    const user = await User.findOne({ userId: userId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userProgress = await UserProgress.findOne({
      user_id: user._id,
      course_id: courseId
    }).populate('course_id');

    if (!userProgress) {
      return res.json({
        success: true,
        progress: {
          overall: 0,
          timeSpent: 0,
          started: false
        },
        analytics: {
          averageQuizScore: 0,
          totalQuizzes: 0,
          flashcardsMastered: 0
        },
        weakTopics: []
      });
    }

    res.json({
      success: true,
      progress: {
        overall: userProgress.overall_progress,
        timeSpent: userProgress.total_time_spent,
        started: true,
        completed: userProgress.overall_progress === 100,
        completedAt: userProgress.completed_at
      },
      analytics: userProgress.learning_analytics,
      weakTopics: userProgress.weak_topics,
      currentModule: userProgress.current_module,
      currentLesson: userProgress.current_lesson,
      lastActivity: userProgress.learning_analytics.last_activity
    });
  } catch (error) {
    console.error('❌ Get user progress error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch progress'
    });
  }
};

// Reset progress for a course
const resetProgress = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.uid;

    const User = require('../models/User');
    const user = await User.findOne({ userId: userId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete user progress
    await UserProgress.findOneAndDelete({
      user_id: user._id,
      course_id: courseId
    });

    // Reset course progress
    const course = await Course.findById(courseId);
    if (course) {
      course.modules.forEach(module => {
        module.completed = false;
        module.completedAt = null;
        module.timeSpent = 0;
        module.quizResult = null;
        
        if (module.lessons) {
          module.lessons.forEach(lesson => {
            lesson.completed = false;
            lesson.completedAt = null;
            lesson.timeSpent = 0;
          });
        }
      });

      await course.save();
    }

    res.json({
      success: true,
      message: 'Progress reset successfully'
    });
  } catch (error) {
    console.error('❌ Reset progress error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset progress'
    });
  }
};

// Get learning analytics
const getLearningAnalytics = async (req, res) => {
  try {
    const userId = req.user.uid;

    const User = require('../models/User');
    const user = await User.findOne({ userId: userId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const analytics = await UserProgress.aggregate([
      { $match: { user_id: user._id } },
      {
        $group: {
          _id: null,
          totalCourses: { $sum: 1 },
          completedCourses: {
            $sum: { $cond: [{ $eq: ["$overall_progress", 100] }, 1, 0] }
          },
          totalTimeSpent: { $sum: "$total_time_spent" },
          averageProgress: { $avg: "$overall_progress" },
          totalQuizzesTaken: { $sum: "$learning_analytics.total_quizzes_taken" },
          averageQuizScore: { $avg: "$learning_analytics.average_quiz_score" },
          totalFlashcardsMastered: { $sum: "$learning_analytics.flashcards_mastered" }
        }
      }
    ]);

    const weakTopics = await UserProgress.aggregate([
      { $match: { user_id: user._id } },
      { $unwind: "$weak_topics" },
      {
        $group: {
          _id: "$weak_topics.topic",
          totalStruggles: { $sum: "$weak_topics.times_struggled" },
          averageConfidence: { $avg: "$weak_topics.confidence_score" },
          lastStruggled: { $max: "$weak_topics.last_struggled" }
        }
      },
      { $sort: { totalStruggles: -1 } },
      { $limit: 5 }
    ]);

    res.json({
      success: true,
      analytics: analytics[0] || {
        totalCourses: 0,
        completedCourses: 0,
        totalTimeSpent: 0,
        averageProgress: 0,
        totalQuizzesTaken: 0,
        averageQuizScore: 0,
        totalFlashcardsMastered: 0
      },
      weakTopics: weakTopics,
      studyStreak: user.progress?.daily_streak || 0
    });
  } catch (error) {
    console.error('❌ Get analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch analytics'
    });
  }
};

// Helper functions
const calculateQuizXP = (score, totalQuestions) => {
  const baseXP = 20;
  const scoreMultiplier = score / 100;
  const questionBonus = Math.min(totalQuestions * 0.5, 10);
  
  return Math.round(baseXP * scoreMultiplier + questionBonus);
};

const getPerformanceLevel = (score) => {
  if (score >= 90) return 'excellent';
  if (score >= 75) return 'good';
  if (score >= 60) return 'average';
  return 'needs_improvement';
};

const awardXP = async (userId, xp, reason = '') => {
  try {
    const User = require('../models/User');
    
    const updateResult = await User.findByIdAndUpdate(
      userId,
      {
        $inc: {
          'progress.xp': xp,
          'progress.total_xp': xp,
          'progress.coins': Math.floor(xp / 2)
        }
      },
      { new: true }
    );

    if (!updateResult) {
      console.error('❌ User not found for XP award');
      return;
    }

    const user = await User.findById(userId);
    if (!user) return;

    const xpForNextLevel = user.progress.level * 100;
    
    if (user.progress.total_xp >= xpForNextLevel) {
      const newLevel = user.progress.level + 1;
      await User.findByIdAndUpdate(userId, {
        'progress.level': newLevel,
        'progress.level_name': getLevelName(newLevel)
      });
      
      console.log(`🎉 User ${userId} leveled up to ${newLevel}`);
    }

    console.log(`🎯 Awarded ${xp} XP to user ${userId} for: ${reason}`);
  } catch (error) {
    console.error('❌ Award XP error:', error);
  }
};

const getLevelName = (level) => {
  const levels = {
    1: '🌱 Beginner', 2: '📚 Learner', 3: '🎯 Practitioner',
    4: '🔥 Specialist', 5: '🚀 Expert', 6: '🏆 Master',
    7: '💫 Grand Master', 8: '👑 Legend', 9: '⚡ Elite',
    10: '🌟 Phoenix'
  };
  return levels[level] || `Level ${level} Champion`;
};

const generateCourseStats = (course) => {
  if (!course || !course.modules) return null;

  const totalModules = course.modules.length;
  const totalLessons = course.modules.reduce((sum, module) => 
    sum + (module.lessons?.length || 0), 0
  );
  const totalQuizzes = course.modules.reduce((sum, module) => 
    sum + (module.quiz?.length > 0 ? 1 : 0), 0
  );
  const totalFlashcards = course.modules.reduce((sum, module) => 
    sum + (module.flashcards?.length || 0), 0
  );
  const totalDuration = course.modules.reduce((sum, module) => 
    sum + (module.duration || 0), 0
  );

  return {
    totalModules,
    totalLessons,
    totalQuizzes,
    totalFlashcards,
    totalDuration,
    estimatedHours: Math.ceil(totalDuration / 60)
  };
};

// Delete course
const deleteCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.uid;

    const User = require('../models/User');
    const user = await User.findOne({ userId: userId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete user progress first
    await UserProgress.deleteMany({
      user_id: user._id,
      course_id: courseId
    });

    const course = await Course.findOneAndDelete({ 
      _id: courseId, 
      creator: user._id 
    });

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    res.json({
      success: true,
      message: 'Course deleted successfully'
    });
  } catch (error) {
    console.error('❌ Delete course error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete course'
    });
  }
};

module.exports = {
  createCourse,
  getUserCourses,
  getCourse,
  getModuleContent,
  updateLessonProgress,
  submitQuiz,
  updateFlashcardProgress,
  deleteCourse,
  getUserProgress,
  resetProgress,
  getLearningAnalytics,
  calculateCourseProgress,
  generateCourseStats
};