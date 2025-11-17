const express = require('express');
const multer = require('multer');
const Course = require('../models/Course');
const courseGenerator = require('../services/ai/course-generator');
const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || 
        file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and DOCX files are allowed'), false);
    }
  }
});

// ✅ UPDATED: Fast response with background generation
router.post('/', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No file uploaded' 
      });
    }

    const { title, description, settings = {} } = req.body;
    
    console.log('📁 File upload received:', {
      filename: req.file.originalname,
      size: req.file.size,
      title: title
    });

    // Parse settings if it's a string
    const parsedSettings = typeof settings === 'string' ? JSON.parse(settings) : settings;

    // Create course immediately with generating status
    const course = new Course({
      title: title || 'New Course',
      description: description || 'Course generated from uploaded content',
      createdBy: req.user.uid,
      settings: {
        contentType: parsedSettings.contentType || 'comprehensive',
        difficulty: parsedSettings.difficulty || 'beginner',
        learningPace: parsedSettings.learningPace || 'moderate',
        contentStyle: parsedSettings.contentStyle || 'interactive',
        questionsPerTopic: parsedSettings.questionsPerTopic || 5,
        flashcardsPerModule: parsedSettings.flashcardsPerModule || 3,
        quizDifficulty: parsedSettings.quizDifficulty || 'medium',
        includeExercises: parsedSettings.includeExercises !== false,
        totalModules: parsedSettings.totalModules || 5,
        lessonsPerModule: parsedSettings.lessonsPerModule || 4
      },
      originalFile: {
        filename: req.file.originalname,
        originalName: req.file.originalname,
        size: req.file.size,
        uploadedAt: new Date()
      },
      modules: [],
      generationStatus: 'processing',
      isGenerating: true
    });

    await course.save();
    console.log('💾 Course saved to DB with ID:', course._id);

    // 🔥 CRITICAL FIX: Send immediate response
    res.json({ 
      success: true, 
      message: 'Course generation started',
      courseId: course._id,
      status: 'processing'
    });

    // 🔥 Start generation in background (don't wait for response)
    courseGenerator.generateCourseFromFile(
      req.file.buffer, 
      course._id, 
      req.user.uid,
      course.settings
    )
    .then(async (generatedCourse) => {
      try {
        console.log('✅ Course generation completed, updating database...');
        
        await Course.findByIdAndUpdate(course._id, {
          modules: generatedCourse.modules,
          title: generatedCourse.title || course.title,
          description: generatedCourse.description || course.description,
          generationStatus: 'completed',
          isGenerating: false,
          updatedAt: new Date()
        });
        
        console.log('🎉 Course updated successfully with', 
          generatedCourse.modules?.length || 0, 'modules');
          
      } catch (updateError) {
        console.error('❌ Failed to update course:', updateError);
        await Course.findByIdAndUpdate(course._id, {
          generationStatus: 'failed',
          isGenerating: false,
          error: updateError.message
        });
      }
    })
    .catch(async (error) => {
      console.error('❌ Course generation failed:', error);
      await Course.findByIdAndUpdate(course._id, {
        generationStatus: 'failed',
        isGenerating: false,
        error: error.message
      });
    });

  } catch (error) {
    console.error('❌ Upload route error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Upload failed' 
    });
  }
});

// ✅ Check course generation status
router.get('/:courseId/status', async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    
    if (!course) {
      return res.status(404).json({ 
        success: false, 
        message: 'Course not found' 
      });
    }
    
    res.json({
      success: true,
      status: course.generationStatus,
      isGenerating: course.isGenerating,
      hasContent: course.modules && course.modules.length > 0,
      course: course
    });
    
  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

module.exports = router;