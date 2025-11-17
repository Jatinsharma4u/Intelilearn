// routes/course-routes.js - CORRECTED WITH ACTUAL AI GENERATION
const express = require('express');
const Course = require('../models/Course');
const courseGenerator = require('../services/ai/course-generator'); // ✅ AI Generator import
const router = express.Router();

// ✅ Get all courses for user
router.get('/', async (req, res) => {
  try {
    const courses = await Course.find({ createdBy: req.user.uid })
      .select('title description modules settings createdAt updatedAt generationStatus isGenerating progress')
      .sort({ updatedAt: -1 });
    
    res.json({ success: true, courses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✅ Get single course with details
router.get('/:courseId', async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }
    
    if (course.createdBy !== req.user.uid) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    res.json({ success: true, course });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✅ Create new course - ACTUAL AI GENERATION VERSION
router.post('/', async (req, res) => {
  try {
    const { title, description, settings, originalFile, fileBuffer } = req.body;
    
    console.log('📥 Creating new course with AI generation...');
    console.log('📊 File buffer received:', fileBuffer ? `Size: ${fileBuffer.data.length} bytes` : 'No file buffer');
    
    const course = new Course({
      title: title || 'Generating Course...', // Temporary title
      description: description || 'AI is creating your course content...',
      settings,
      originalFile,
      modules: [], // Start with empty modules
      createdBy: req.user.uid,
      generationStatus: 'processing',
      isGenerating: true
    });
    
    await course.save();
    
    console.log(`📝 Course created with ID: ${course._id}`);
    
    // Send immediate response but course is still generating
    res.status(201).json({ 
      success: true, 
      courseId: course._id,
      message: 'AI course generation started' 
    });

    // 🔥 ACTUAL AI GENERATION PROCESS START
    setTimeout(async () => {
      try {
        console.log(`🚀 Starting ACTUAL AI generation for course: ${course._id}`);
        
        // ✅ ACTUAL AI CALL with proper file buffer
        let fileBufferData;
        
        if (fileBuffer && fileBuffer.data) {
          // Convert array to buffer
          fileBufferData = Buffer.from(fileBuffer.data);
          console.log(`📄 File buffer converted: ${fileBufferData.length} bytes`);
        } else {
          console.log('⚠️ No file buffer provided, using fallback');
          // Create a small fallback buffer
          fileBufferData = Buffer.from('Sample content for AI generation');
        }
        
        const courseStructure = await courseGenerator.generateCourseFromFile(
          fileBufferData,
          course._id.toString(),
          req.user.uid,
          settings || {}
        );

        console.log(`✅ AI Generation completed for course: ${course._id}`);
        console.log(`📊 Generated ${courseStructure.modules.length} modules`);
        
        // Update course with ACTUAL AI generated content
        await Course.findByIdAndUpdate(course._id, {
          title: courseStructure.title,
          description: courseStructure.description,
          modules: courseStructure.modules,
          settings: { ...settings, ...courseStructure.settings },
          generationStatus: 'completed',
          isGenerating: false,
          updatedAt: new Date()
        });

        console.log(`🎉 Course ${course._id} saved with AI content`);
        
      } catch (genError) {
        console.error('❌ Course AI generation failed:', genError);
        
        // Create fallback course with structured content
        const fallbackCourse = generateFallbackCourseContent(
          title || 'Generated Course', 
          settings || {}
        );
        
        await Course.findByIdAndUpdate(course._id, {
          title: fallbackCourse.title,
          description: fallbackCourse.description,
          modules: fallbackCourse.modules,
          generationStatus: 'completed',
          isGenerating: false,
          error: genError.message,
          updatedAt: new Date()
        });
        
        console.log(`🔄 Used fallback content for course: ${course._id}`);
      }
    }, 2000); // Start after 2 seconds

  } catch (error) {
    console.error('❌ Course creation error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✅ Check course generation status
router.get('/:courseId/status', async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }
    
    if (course.createdBy !== req.user.uid) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    res.json({ 
      success: true, 
      status: course.generationStatus,
      isGenerating: course.isGenerating,
      hasContent: course.modules && course.modules.length > 0,
      course: course
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✅ MARK LESSON CONTENT COMPLETED & UNLOCK QUIZ
router.put('/:courseId/modules/:moduleIndex/lessons/:lessonIndex/content-complete', async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }
    
    if (course.createdBy !== req.user.uid) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const moduleIndex = parseInt(req.params.moduleIndex);
    const lessonIndex = parseInt(req.params.lessonIndex);

    if (!course.modules[moduleIndex] || !course.modules[moduleIndex].lessons[lessonIndex]) {
      return res.status(404).json({ success: false, message: 'Lesson not found' });
    }

    // Mark content as completed
    course.modules[moduleIndex].lessons[lessonIndex].contentCompleted = true;
    course.modules[moduleIndex].lessons[lessonIndex].contentCompletedAt = new Date();

    await course.save();

    res.json({
      success: true,
      message: 'Lesson content marked as completed',
      quizUnlocked: true,
      nextStep: 'take_quiz'
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✅ SUBMIT QUIZ & UNLOCK FLASHCARDS
router.post('/:courseId/modules/:moduleIndex/lessons/:lessonIndex/quiz-submit', async (req, res) => {
  try {
    const { answers, totalTime } = req.body;
    const course = await Course.findById(req.params.courseId);
    
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }
    
    if (course.createdBy !== req.user.uid) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const moduleIndex = parseInt(req.params.moduleIndex);
    const lessonIndex = parseInt(req.params.lessonIndex);

    if (!course.modules[moduleIndex] || !course.modules[moduleIndex].lessons[lessonIndex]) {
      return res.status(404).json({ success: false, message: 'Lesson not found' });
    }

    const lesson = course.modules[moduleIndex].lessons[lessonIndex];

    // Calculate quiz score
    let correctAnswers = 0;
    const quizResults = answers.map(answer => {
      const question = lesson.quiz.find(q => q._id.toString() === answer.questionId);
      const isCorrect = question && question.correctAnswer === answer.selectedAnswer;
      if (isCorrect) correctAnswers++;
      
      return {
        questionId: answer.questionId,
        selectedAnswer: answer.selectedAnswer,
        correctAnswer: question ? question.correctAnswer : '',
        isCorrect,
        explanation: question ? question.explanation : ''
      };
    });

    const score = Math.round((correctAnswers / answers.length) * 100);

    // Update lesson quiz completion
    lesson.quizCompleted = true;
    lesson.quizCompletedAt = new Date();
    lesson.quizScore = score;
    lesson.timeSpent = (lesson.timeSpent || 0) + totalTime;

    await course.save();

    res.json({
      success: true,
      score,
      correctAnswers,
      totalQuestions: answers.length,
      results: quizResults,
      flashcardsUnlocked: true,
      nextStep: 'review_flashcards'
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✅ MARK FLASHCARDS COMPLETED & UNLOCK NEXT LESSON
router.put('/:courseId/modules/:moduleIndex/lessons/:lessonIndex/flashcards-complete', async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }
    
    if (course.createdBy !== req.user.uid) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const moduleIndex = parseInt(req.params.moduleIndex);
    const lessonIndex = parseInt(req.params.lessonIndex);

    if (!course.modules[moduleIndex] || !course.modules[moduleIndex].lessons[lessonIndex]) {
      return res.status(404).json({ success: false, message: 'Lesson not found' });
    }

    const lesson = course.modules[moduleIndex].lessons[lessonIndex];
    const module = course.modules[moduleIndex];

    // Mark flashcards as completed
    lesson.flashcardsCompleted = true;
    lesson.flashcardsCompletedAt = new Date();

    let nextLessonUnlocked = false;
    let nextModuleUnlocked = false;
    let nextLessonId = null;
    let nextModuleId = null;

    // Check if this completes the lesson (all components done)
    if (lesson.contentCompleted && lesson.quizCompleted && lesson.flashcardsCompleted) {
      lesson.completed = true;
      lesson.completedAt = new Date();

      // Unlock next lesson in same module
      if (lessonIndex < module.lessons.length - 1) {
        module.lessons[lessonIndex + 1].locked = false;
        nextLessonUnlocked = true;
        nextLessonId = module.lessons[lessonIndex + 1]._id;
      } 
      // If last lesson in module, check if module completes and unlock next module
      else if (lessonIndex === module.lessons.length - 1) {
        // Check if all lessons in module are completed
        const allLessonsCompleted = module.lessons.every(l => l.completed);
        if (allLessonsCompleted) {
          module.completed = true;
          module.completedAt = new Date();

          // Unlock next module's first lesson
          if (moduleIndex < course.modules.length - 1) {
            course.modules[moduleIndex + 1].lessons[0].locked = false;
            nextModuleUnlocked = true;
            nextModuleId = course.modules[moduleIndex + 1]._id;
          }
        }
      }
    }

    await course.save();

    res.json({
      success: true,
      message: 'Flashcards completed successfully',
      lessonCompleted: lesson.completed,
      nextLessonUnlocked,
      nextLessonId,
      nextModuleUnlocked,
      nextModuleId,
      nextStep: nextLessonUnlocked ? 'next_lesson' : (nextModuleUnlocked ? 'next_module' : 'course_completed')
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✅ RESET LESSON COMPLETELY
router.put('/:courseId/modules/:moduleIndex/lessons/:lessonIndex/reset', async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }
    
    if (course.createdBy !== req.user.uid) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const moduleIndex = parseInt(req.params.moduleIndex);
    const lessonIndex = parseInt(req.params.lessonIndex);

    if (!course.modules[moduleIndex] || !course.modules[moduleIndex].lessons[lessonIndex]) {
      return res.status(404).json({ success: false, message: 'Lesson not found' });
    }

    // Use the resetLesson method from Course model
    course.resetLesson(moduleIndex, lessonIndex);
    await course.save();

    res.json({
      success: true,
      message: 'Lesson reset successfully',
      lesson: course.modules[moduleIndex].lessons[lessonIndex]
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✅ GET LESSON STATUS
router.get('/:courseId/modules/:moduleIndex/lessons/:lessonIndex/status', async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }
    
    if (course.createdBy !== req.user.uid) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const moduleIndex = parseInt(req.params.moduleIndex);
    const lessonIndex = parseInt(req.params.lessonIndex);

    if (!course.modules[moduleIndex] || !course.modules[moduleIndex].lessons[lessonIndex]) {
      return res.status(404).json({ success: false, message: 'Lesson not found' });
    }

    const lesson = course.modules[moduleIndex].lessons[lessonIndex];

    res.json({
      success: true,
      lesson: {
        locked: lesson.locked,
        contentCompleted: lesson.contentCompleted,
        quizCompleted: lesson.quizCompleted,
        flashcardsCompleted: lesson.flashcardsCompleted,
        completed: lesson.completed,
        quizScore: lesson.quizScore,
        timeSpent: lesson.timeSpent
      },
      currentStep: getCurrentStep(lesson),
      nextAction: getNextAction(lesson)
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Helper function to determine current step
function getCurrentStep(lesson) {
  if (!lesson.contentCompleted) return 'content';
  if (!lesson.quizCompleted) return 'quiz';
  if (!lesson.flashcardsCompleted) return 'flashcards';
  return 'completed';
}

// Helper function to determine next action
function getNextAction(lesson) {
  if (!lesson.contentCompleted) return 'complete_content';
  if (!lesson.quizCompleted) return 'take_quiz';
  if (!lesson.flashcardsCompleted) return 'review_flashcards';
  return 'next_lesson';
}

// ✅ Update course
router.put('/:courseId', async (req, res) => {
  try {
    const { title, description, settings, modules, isPublic } = req.body;
    
    const course = await Course.findById(req.params.courseId);
    
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }
    
    if (course.createdBy !== req.user.uid) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    // Update fields
    if (title !== undefined) course.title = title;
    if (description !== undefined) course.description = description;
    if (settings !== undefined) course.settings = { ...course.settings, ...settings };
    if (modules !== undefined) course.modules = modules;
    if (isPublic !== undefined) course.isPublic = isPublic;
    
    await course.save();
    
    res.json({ 
      success: true, 
      course,
      message: 'Course updated successfully' 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✅ Delete course
router.delete('/:courseId', async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }
    
    if (course.createdBy !== req.user.uid) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    await Course.findByIdAndDelete(req.params.courseId);
    
    res.json({ 
      success: true, 
      message: 'Course deleted successfully' 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✅ Get course statistics (basic)
router.get('/:courseId/stats', async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }
    
    if (course.createdBy !== req.user.uid) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    // Enhanced statistics with progressive tracking
    const stats = {
      totalModules: course.modules.length,
      completedModules: course.modules.filter(module => module.completed).length,
      totalLessons: course.modules.reduce((acc, module) => acc + module.lessons.length, 0),
      completedLessons: course.modules.reduce((acc, module) => 
        acc + module.lessons.filter(lesson => lesson.completed).length, 0),
      contentCompleted: course.modules.reduce((acc, module) => 
        acc + module.lessons.filter(lesson => lesson.contentCompleted).length, 0),
      quizzesCompleted: course.modules.reduce((acc, module) => 
        acc + module.lessons.filter(lesson => lesson.quizCompleted).length, 0),
      flashcardsCompleted: course.modules.reduce((acc, module) => 
        acc + module.lessons.filter(lesson => lesson.flashcardsCompleted).length, 0),
      totalQuizzes: course.modules.reduce((acc, module) => 
        acc + module.lessons.reduce((lessonAcc, lesson) => lessonAcc + lesson.quiz.length, 0), 0),
      totalFlashcards: course.modules.reduce((acc, module) => 
        acc + module.lessons.reduce((lessonAcc, lesson) => lessonAcc + lesson.flashcards.length, 0), 0),
      estimatedDuration: course.modules.reduce((acc, module) => 
        acc + module.lessons.reduce((lessonAcc, lesson) => lessonAcc + (lesson.duration || 10), 0), 0),
      overallProgress: course.progress // Virtual property
    };
    
    res.json({ 
      success: true, 
      stats 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✅ Duplicate course
router.post('/:courseId/duplicate', async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }
    
    // Create duplicate
    const duplicateCourse = new Course({
      title: `${course.title} (Copy)`,
      description: course.description,
      settings: { ...course.settings },
      modules: JSON.parse(JSON.stringify(course.modules)), // Deep copy
      createdBy: req.user.uid,
      isPublic: false
    });
    
    await duplicateCourse.save();
    
    res.status(201).json({ 
      success: true, 
      course: duplicateCourse,
      message: 'Course duplicated successfully' 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 🔥 NEW: Generate fallback course with STRUCTURED CONTENT
function generateFallbackCourseContent(title, settings) {
  const totalModules = settings.totalModules || 4;
  const lessonsPerModule = settings.lessonsPerModule || 3;
  
  const modules = [];
  
  for (let i = 1; i <= totalModules; i++) {
    const lessons = [];
    
    for (let j = 1; j <= lessonsPerModule; j++) {
      // Only first lesson of first module is unlocked initially
      const locked = !(i === 1 && j === 1);
      
      lessons.push({
        title: `Lesson ${j}: ${title} Fundamentals - Part ${j}`,
        content: {
          introduction: `This ${settings.difficulty || 'beginner'}-level lesson covers essential concepts in a ${settings.contentStyle || 'interactive'} format to enhance your understanding and practical application skills.`,
          keyConcepts: [
            "Fundamental principles and core theories",
            "Important terminology and definitions",
            "Essential relationships between concepts",
            "Practical applications and use cases"
          ],
          detailedExplanation: `Clear, step-by-step explanations of each concept with practical insights and detailed guidance. This section breaks down complex ideas into understandable components for ${settings.difficulty || 'beginner'} level learners.`,
          practicalExamples: [
            "Simple implementation showing basic principles in action",
            "Intermediate application demonstrating practical usage scenarios",
            "Advanced scenario for comprehensive understanding and mastery"
          ],
          importantPoints: [
            "Core concepts that form the foundation of understanding",
            "Key takeaways essential for practical application",
            "Common mistakes to avoid and best practices to follow"
          ],
          applications: `How to apply these concepts in real-world projects, professional scenarios, and practical implementations. Learn to use this knowledge effectively in ${settings.contentType || 'comprehensive'} contexts.`,
          learningObjectives: [
            "Understand and explain core concepts clearly",
            "Apply knowledge to solve real-world problems",
            "Implement concepts in practical scenarios effectively"
          ],
          prerequisites: [
            "Basic understanding of subject fundamentals",
            "Openness to learning and applying new concepts"
          ],
          summary: `This lesson covered essential ${settings.difficulty || 'beginner'}-level concepts with practical examples and applications. You should now understand the core principles and how to apply them in real-world situations.`,
          estimatedReadingTime: 5,
          difficulty: settings.difficulty || 'beginner'
        },
        duration: 12,
        order: j,
        locked: locked,
        contentCompleted: false,
        quizCompleted: false,
        flashcardsCompleted: false,
        completed: false,
        quiz: generateQuizQuestions(settings.questionsPerTopic || 3),
        flashcards: generateFlashcards(settings.flashcardsPerModule || 3)
      });
    }

    modules.push({
      title: `Module ${i}: ${title} Core Concepts`,
      description: `Comprehensive coverage of ${title} fundamentals with practical applications and real-world scenarios.`,
      order: i,
      completed: false,
      lessons: lessons
    });
  }

  return {
    title: title || 'Comprehensive Learning Course',
    description: `A complete course covering ${title} from basics to advanced concepts with interactive learning approach.`,
    modules: modules
  };
}

function generateQuizQuestions(count) {
  const questions = [];
  for (let i = 1; i <= count; i++) {
    questions.push({
      question: `What is the most important aspect of understanding concept ${i}?`,
      options: [
        "Memorizing definitions without context",
        "Applying concepts to real-world scenarios", 
        "Focusing only on theoretical aspects",
        "Skipping practical examples"
      ],
      correctAnswer: "Applying concepts to real-world scenarios",
      explanation: `Practical application ensures deeper understanding and long-term retention of concept ${i}.`,
      difficulty: 'medium'
    });
  }
  return questions;
}

function generateFlashcards(count) {
  const flashcards = [];
  const terms = [
    { term: "Core Concept", definition: "Fundamental idea that forms the basis for understanding complex topics" },
    { term: "Practical Application", definition: "Real-world implementation of theoretical knowledge to solve problems" },
    { term: "Learning Objective", definition: "Specific goal that guides the educational process and assessment" },
    { term: "Problem-Solving", definition: "Systematic approach to analyzing challenges and finding solutions" }
  ];
  
  for (let i = 0; i < count; i++) {
    if (terms[i]) {
      flashcards.push({
        term: terms[i].term,
        definition: terms[i].definition,
        mastered: false
      });
    } else {
      flashcards.push({
        term: `Key Term ${i + 1}`,
        definition: `Essential definition for understanding concept ${i + 1}`,
        mastered: false
      });
    }
  }
  return flashcards;
}

module.exports = router;