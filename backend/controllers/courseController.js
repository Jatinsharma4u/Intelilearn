const Course = require('../models/Course');
const ExtractedContent = require('../models/ExtractedContent');
const { generateCourseWithAI } = require('../services/aiCourseService');
const { extractTextFromFile } = require('../services/ocrService');
const fetch = require('node-fetch');
const { v4: uuidv4 } = require('uuid');

/**
 * Generate course from content with batching support
 */
exports.generateCourse = async (req, res) => {
  try {
    const { content, settings, content_id } = req.body;
    const userId = req.user.uid;
    const generationId = uuidv4();

    console.log('🚀 Starting course generation...');
    console.log(`👤 User: ${userId}`);
    console.log(`⚙️ Settings: ${JSON.stringify(settings)}`);

    let extractedText = content;
    let extractedContentId = content_id;

    // 1. Text extraction (if file uploaded instead of content)
    if (req.file) {
      console.log('📁 File uploaded, extracting text...');
      const extractionResult = await extractTextFromFile(req.file);
      
      if (!extractionResult.success) {
        return res.status(400).json({ 
          success: false, 
          error: extractionResult.error 
        });
      }

      extractedText = extractionResult.text;

      // Save extracted content to database
      const extractedContent = new ExtractedContent({
        userId: userId,
        filename: req.file.originalname,
        original_filename: req.file.originalname,
        content: extractedText,
        source_type: extractionResult.source_type,
        file_size: req.file.size,
        length: extractedText.length,
        settings: settings,
        quality_metrics: extractionResult.quality_metrics,
        processing_info: {
          processing_time: extractionResult.processing_time,
          engines_tried: ['node_ocr'],
          confidence_score: extractionResult.confidence || 0.8
        },
        generation_tracking: {
          generation_id: generationId
        }
      });

      await extractedContent.save();
      extractedContentId = extractedContent._id;
      console.log(`✅ Content saved with ID: ${extractedContentId}`);
    }

    // 2. Validate content before generation
    const validation = await this._validateContentForGeneration(extractedText, settings);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: validation.message,
        details: validation.details
      });
    }

    console.log(`📄 Content validated: ${extractedText.length} characters`);

    // 3. AI course generation with batching support
    console.log('🤖 Generating course with AI...');
    const startTime = Date.now();
    
    let courseResult;
    try {
      // Try Python service first (supports batching)
      courseResult = await this._generateWithPythonService(
        extractedText, 
        settings, 
        userId, 
        extractedContentId,
        generationId
      );
    } catch (pythonError) {
      console.log('⚠️ Python service failed, falling back to Node.js service...');
      // Fallback to Node.js service
      courseResult = await generateCourseWithAI(extractedText, settings);
      courseResult.source = 'nodejs_fallback';
    }

    const generationTime = (Date.now() - startTime) / 1000;

    if (!courseResult.success) {
      // Update content with failure if we have content_id
      if (extractedContentId) {
        await this._updateContentGenerationStatus(
          extractedContentId, 
          false, 
          generationTime, 
          courseResult.error
        );
      }

      return res.status(500).json({
        success: false,
        error: courseResult.error,
        generation_time: generationTime,
        source: courseResult.source
      });
    }

    console.log(`✅ Course generated in ${generationTime}s`);

    // 4. Save course to database with enhanced metadata
    const courseData = await this._prepareCourseData(
      courseResult.course_data,
      userId,
      extractedContentId,
      settings,
      generationTime,
      courseResult
    );

    const course = new Course(courseData);
    await course.save();

    console.log(`✅ Course saved with ID: ${course._id}`);

    // 5. Update extracted content with success
    if (extractedContentId) {
      await this._updateContentGenerationStatus(
        extractedContentId, 
        true, 
        generationTime, 
        null, 
        course._id
      );
    }

    // 6. Return enhanced response
    const response = {
      success: true,
      course: await this._formatCourseResponse(course),
      course_id: course._id,
      generation_id: generationId,
      generation_time: generationTime,
      performance: {
        modules_generated: course.modules.length,
        flashcards_generated: course.flashcards.length,
        total_questions: course.modules.reduce((sum, module) => 
          sum + (module.quiz?.questions?.length || 0), 0
        ),
        content_utilization: this._calculateContentUtilization(extractedText, course)
      },
      message: 'Course generated successfully'
    };

    // Add batching info if applicable
    if (courseResult.batched) {
      response.batching = {
        batched: true,
        total_batches: courseResult.batches,
        completed_batches: courseResult.completed_batches,
        batch_times: courseResult.batch_times,
        efficiency: courseResult.batch_efficiency
      };
    }

    res.json(response);

  } catch (error) {
    console.error('❌ Course generation error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Course generation failed',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

/**
 * Get course by ID with enhanced data
 */
exports.getCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    
    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }

    // Check if user owns this course
    if (course.userId !== req.user.uid) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Update analytics
    course.analytics.views += 1;
    course.progress.last_accessed = new Date();
    await course.save();

    res.json({
      success: true,
      course: await this._formatCourseResponse(course)
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get user's courses with pagination and filtering
 */
exports.getUserCourses = async (req, res) => {
  try {
    const userId = req.user.uid;
    const { 
      page = 1, 
      limit = 10, 
      status = 'active', 
      sort = 'createdAt',
      difficulty,
      search 
    } = req.query;

    // Build query
    const query = { userId };
    
    if (status !== 'all') {
      query.status = status;
    }

    if (difficulty) {
      query.difficulty = difficulty;
    }

    if (search) {
      query.$text = { $search: search };
    }

    // Pagination options
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: this._getSortOption(sort)
    };

    // Execute query
    const courses = await Course.find(query)
      .sort(options.sort)
      .limit(options.limit)
      .skip((options.page - 1) * options.limit)
      .select('title description total_modules difficulty progress analytics status generated_at batched version estimated_duration');

    const total = await Course.countDocuments(query);

    // Get stats
    const stats = await this._getUserCourseStats(userId);

    res.json({
      success: true,
      courses: courses.map(course => this._formatCourseListResponse(course)),
      pagination: {
        page: options.page,
        limit: options.limit,
        total,
        pages: Math.ceil(total / options.limit)
      },
      stats: stats
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Update course progress
 */
exports.updateCourseProgress = async (req, res) => {
  try {
    const { module_number, completed, quiz_score, time_spent } = req.body;
    const course = await Course.findById(req.params.courseId);

    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }

    if (course.userId !== req.user.uid) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Update module completion
    if (module_number !== undefined) {
      await course.updateProgress(module_number, completed);
    }

    // Add quiz score if provided
    if (quiz_score) {
      await course.addQuizScore(
        module_number, 
        quiz_score.score, 
        quiz_score.total, 
        quiz_score.time_spent
      );
    }

    // Update time spent
    if (time_spent) {
      course.progress.total_time_spent += time_spent;
      await course.save();
    }

    res.json({
      success: true,
      progress: course.progress,
      analytics: course.analytics
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Submit quiz results
 */
exports.submitQuiz = async (req, res) => {
  try {
    const { answers, time_spent } = req.body;
    const course = await Course.findById(req.params.courseId);

    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }

    if (course.userId !== req.user.uid) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const moduleNumber = parseInt(req.params.moduleNumber);
    const module = course.modules.find(m => m.module_number === moduleNumber);
    
    if (!module || !module.quiz) {
      return res.status(404).json({
        success: false,
        error: 'Module or quiz not found'
      });
    }

    // Calculate score
    const result = this._calculateQuizScore(module.quiz.questions, answers);
    
    // Save quiz results
    await course.addQuizScore(
      moduleNumber, 
      result.score, 
      result.total, 
      time_spent
    );

    // Mark module as completed if score is good enough
    if (result.percentage >= 70) {
      await course.updateProgress(moduleNumber, true);
    }

    res.json({
      success: true,
      ...result,
      time_spent: time_spent,
      module_completed: result.percentage >= 70,
      next_module: moduleNumber < course.total_modules ? moduleNumber + 1 : null
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get course analytics
 */
exports.getCourseAnalytics = async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    
    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }

    if (course.userId !== req.user.uid) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const analytics = await this._compileCourseAnalytics(course);

    res.json({
      success: true,
      analytics: analytics
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Archive course (soft delete)
 */
exports.archiveCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    
    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      });
    }

    if (course.userId !== req.user.uid) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    course.status = 'archived';
    await course.save();

    res.json({
      success: true,
      message: 'Course archived successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ========== PRIVATE HELPER METHODS ==========

/**
 * Generate course using Python service (supports batching)
 */
_generateWithPythonService = async (content, settings, userId, contentId, generationId) => {
  try {
    const pythonResponse = await fetch('http://localhost:5001/python/generate-course', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        content: content,
        settings: settings,
        user_id: userId,
        content_id: contentId,
        generation_id: generationId
      }),
      timeout: 300000 // 5 minute timeout
    });

    if (!pythonResponse.ok) {
      throw new Error(`Python service error: ${pythonResponse.status}`);
    }

    const pythonData = await pythonResponse.json();
    return pythonData;

  } catch (error) {
    throw new Error(`Python service communication failed: ${error.message}`);
  }
};

/**
 * Validate content before generation
 */
_validateContentForGeneration = async (content, settings) => {
  if (!content || content.trim().length === 0) {
    return {
      valid: false,
      message: 'Content is empty',
      details: 'Please provide valid content for course generation'
    };
  }

  const minContentLength = 100;
  if (content.length < minContentLength) {
    return {
      valid: false,
      message: 'Content too short',
      details: `Minimum ${minContentLength} characters required, got ${content.length}`
    };
  }

  const modules = settings.modules || 4;
  const recommendedLength = modules * 500; // ~500 chars per module
  
  if (content.length < recommendedLength) {
    return {
      valid: true,
      message: 'Content might be insufficient for requested modules',
      details: `Recommended: ${recommendedLength} chars, Found: ${content.length} chars`,
      warning: true
    };
  }

  return { valid: true };
};

/**
 * Prepare course data for saving
 */
_prepareCourseData = (courseData, userId, contentId, settings, generationTime, generationResult) => {
  return {
    userId: userId,
    contentId: contentId,
    ...courseData,
    
    // Enhanced progress tracking
    progress: {
      completed_modules: [],
      current_module: 1,
      total_progress: 0,
      quiz_scores: [],
      started_at: new Date(),
      last_accessed: new Date(),
      total_time_spent: 0,
      completion_percentage: 0
    },
    
    // Enhanced analytics
    analytics: {
      views: 0,
      average_quiz_score: 0,
      completion_rate: 0,
      time_spent: 0,
      total_quiz_attempts: 0,
      total_modules_completed: 0
    },
    
    // Batching support
    batched: generationResult.batched || false,
    batches: generationResult.batches || 1,
    batch_generation_info: {
      total_batches: generationResult.batches,
      completed_batches: generationResult.completed_batches,
      batch_times: generationResult.batch_times || [],
      merged_at: new Date()
    },
    
    // Generation metadata
    generation_metadata: {
      source: generationResult.source || 'python_ai',
      generation_time: generationTime,
      model_used: 'gemini-pro',
      retry_count: generationResult.retry_count || 0,
      tokens_used: generationResult.tokens_used
    },
    
    status: 'active',
    generated_at: new Date(),
    settings: settings,
    
    // Performance metrics
    performance_metrics: {
      load_time: 0,
      quiz_completion_rate: 0,
      module_completion_rate: 0
    },
    
    // Tags and categorization
    tags: this._generateTags(settings, courseData),
    category: this._determineCategory(courseData),
    language: 'english'
  };
};

/**
 * Update extracted content generation status
 */
_updateContentGenerationStatus = async (contentId, success, generationTime, error = null, courseId = null) => {
  try {
    const content = await ExtractedContent.findById(contentId);
    if (content) {
      await content.addGenerationAttempt(success, generationTime, courseId);
      
      // Auto-cleanup if enabled
      if (success && content.user_preferences.auto_cleanup !== false) {
        await content.cleanupContent();
      }
    }
  } catch (error) {
    console.error('Error updating content generation status:', error);
  }
};

/**
 * Calculate quiz score
 */
_calculateQuizScore = (questions, answers) => {
  let correct = 0;
  const results = [];

  answers.forEach((answer, index) => {
    const question = questions[index];
    const isCorrect = question && answer.answer === question.correct_answer;
    
    if (isCorrect) correct++;
    
    results.push({
      question_id: question?.id,
      question: question?.question,
      user_answer: answer.answer,
      correct_answer: question?.correct_answer,
      is_correct: isCorrect,
      explanation: question?.explanation
    });
  });

  const total = questions.length;
  const percentage = (correct / total) * 100;

  return {
    score: correct,
    total: total,
    percentage: percentage,
    correct_answers: correct,
    wrong_answers: total - correct,
    results: results
  };
};

/**
 * Format course for response
 */
_formatCourseResponse = async (course) => {
  const response = course.toObject();
  
  // Add computed fields
  response.stats = {
    total_flashcards: course.flashcards.length,
    total_questions: course.modules.reduce((sum, module) => 
      sum + (module.quiz?.questions?.length || 0), 0
    ),
    completion_percentage: course.progress.total_progress,
    time_spent_minutes: Math.floor(course.progress.total_time_spent / 60),
    estimated_completion_time: this._estimateCompletionTime(course)
  };

  return response;
};

/**
 * Format course for list response
 */
_formatCourseListResponse = (course) => {
  return {
    _id: course._id,
    title: course.title,
    description: course.description,
    total_modules: course.total_modules,
    difficulty: course.difficulty,
    progress: course.progress,
    analytics: course.analytics,
    status: course.status,
    generated_at: course.generated_at,
    batched: course.batched,
    version: course.version,
    estimated_duration: course.estimated_duration
  };
};

/**
 * Get user course statistics
 */
_getUserCourseStats = async (userId) => {
  const total = await Course.countDocuments({ userId });
  const active = await Course.countDocuments({ userId, status: 'active' });
  const completed = await Course.countDocuments({ 
    userId, 
    'progress.completion_percentage': 100 
  });
  const archived = await Course.countDocuments({ userId, status: 'archived' });

  // Calculate total learning time
  const timeAggregation = await Course.aggregate([
    { $match: { userId } },
    { $group: { _id: null, totalTime: { $sum: '$progress.total_time_spent' } } }
  ]);

  const totalLearningTime = timeAggregation[0]?.totalTime || 0;

  return {
    total_courses: total,
    active_courses: active,
    completed_courses: completed,
    archived_courses: archived,
    total_learning_time: Math.floor(totalLearningTime / 60), // Convert to minutes
    completion_rate: total > 0 ? (completed / total) * 100 : 0
  };
};

/**
 * Compile course analytics
 */
_compileCourseAnalytics = async (course) => {
  const quizScores = course.progress.quiz_scores;
  const totalQuizzes = quizScores.length;
  
  const averageScore = totalQuizzes > 0 
    ? quizScores.reduce((sum, quiz) => sum + quiz.score, 0) / totalQuizzes 
    : 0;

  const moduleCompletion = course.progress.completed_modules.length;
  const completionRate = course.total_modules > 0 
    ? (moduleCompletion / course.total_modules) * 100 
    : 0;

  return {
    overview: {
      total_views: course.analytics.views,
      total_quiz_attempts: course.analytics.total_quiz_attempts,
      average_quiz_score: averageScore,
      completion_rate: completionRate,
      total_learning_time: course.progress.total_time_spent
    },
    progress: {
      completed_modules: moduleCompletion,
      total_modules: course.total_modules,
      current_module: course.progress.current_module,
      last_accessed: course.progress.last_accessed
    },
    performance: {
      best_quiz_score: Math.max(...quizScores.map(q => q.score), 0),
      worst_quiz_score: Math.min(...quizScores.map(q => q.score), 0),
      average_time_per_quiz: totalQuizzes > 0 
        ? quizScores.reduce((sum, quiz) => sum + (quiz.time_spent || 0), 0) / totalQuizzes 
        : 0
    },
    engagement: {
      total_sessions: course.analytics.views,
      average_session_time: course.analytics.views > 0 
        ? course.progress.total_time_spent / course.analytics.views 
        : 0,
      last_activity: course.progress.last_accessed
    }
  };
};

// Additional helper methods...
_getSortOption = (sort) => {
  const sortOptions = {
    'createdAt': { createdAt: -1 },
    'updatedAt': { updated_at: -1 },
    'progress': { 'progress.total_progress': -1 },
    'title': { title: 1 },
    'difficulty': { difficulty: 1 }
  };
  return sortOptions[sort] || { createdAt: -1 };
};

_calculateContentUtilization = (originalContent, course) => {
  // Simple content utilization calculation
  const courseText = JSON.stringify(course).length;
  const utilization = (courseText / originalContent.length) * 100;
  return Math.min(100, utilization);
};

_estimateCompletionTime = (course) => {
  const baseTime = course.total_modules * 45; // 45 minutes per module
  const quizTime = course.modules.length * 10; // 10 minutes per quiz
  return baseTime + quizTime;
};

_generateTags = (settings, courseData) => {
  const tags = [];
  if (settings.difficulty) tags.push(settings.difficulty);
  if (settings.learning_pace) tags.push(settings.learning_pace);
  if (courseData.depth_level) tags.push(courseData.depth_level);
  return tags;
};

_determineCategory = (courseData) => {
  // Simple category determination based on title and description
  const text = (courseData.title + ' ' + courseData.description).toLowerCase();
  
  if (text.includes('programming') || text.includes('code') || text.includes('python')) {
    return 'technology';
  }
  if (text.includes('business') || text.includes('marketing') || text.includes('management')) {
    return 'business';
  }
  if (text.includes('science') || text.includes('math') || text.includes('physics')) {
    return 'science';
  }
  
  return 'general';
};

module.exports = exports;