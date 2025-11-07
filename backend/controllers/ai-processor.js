const Course = require('../models/Course');
const ExtractedText = require('../models/ExtractedText');
const { extractTextWithPython, generateCourseWithPython } = require('../utils/pythonBridge');

// Enhanced AI Processor with Batching System
const processCourseWithAI = async (courseId, files, settings) => {
  try {
    const course = await Course.findById(courseId);
    if (!course) {
      throw new Error('Course not found');
    }

    console.log('🚀 Starting advanced AI processing with batching...');

    // Update course status
    course.status = 'processing';
    course.processing_log.push({
      step: 'file_processing',
      status: 'started',
      message: 'Starting enhanced file processing with batching system',
      timestamp: new Date()
    });
    await course.save();

    // Step 1: Enhanced text extraction
    console.log('📄 Step 1: Enhanced text extraction from files...');
    const extractionResult = await extractTextWithPython(files);
    
    if (!extractionResult.success) {
      throw new Error(extractionResult.error || 'Text extraction failed');
    }

    console.log(`✅ Text extraction completed: ${extractionResult.extracted_content.length} files processed`);

    // Step 2: Validate extraction quality and save to MongoDB
    const validContent = extractionResult.extracted_content.filter(item => 
      item.success && item.content && item.content.cleaned_text && 
      item.content.cleaned_text.length > 50
    );

    if (validContent.length === 0) {
      throw new Error('No valid content found in uploaded files');
    }

    console.log(`✅ Valid content found in ${validContent.length} files`);

    // Save extracted text to MongoDB for future reference
    try {
      const extractedText = new ExtractedText({
        course_id: courseId,
        original_text: validContent.map(item => item.content.cleaned_text).join('\n\n'),
        total_chunks: validContent.length,
        processed_chunks: validContent.map((item, index) => ({
          chunk_text: item.content.cleaned_text,
          batch_number: 1,
          module_range: 'all',
          chunk_order: index + 1
        }))
      });
      await extractedText.save();
      console.log('💾 Extracted text saved to database');
    } catch (saveError) {
      console.log('⚠️ Could not save extracted text to database:', saveError.message);
    }

    // Step 3: Generate course content with batching system
    console.log('🧠 Step 3: Generating advanced course content with batching...');
    const generationResult = await generateCourseWithPython(
      validContent, 
      settings, 
      courseId
    );

    if (!generationResult.success) {
      throw new Error(generationResult.error || 'Course generation failed');
    }

    // Step 4: Process and validate the generated course data
    const processedCourseData = processGeneratedCourseData(generationResult.course, settings, validContent);

    // Step 5: Update course with generated content
    const updatedCourse = await Course.findByIdAndUpdate(
      courseId,
      {
        $set: {
          title: processedCourseData.title,
          description: processedCourseData.description,
          modules: processedCourseData.modules,
          total_duration: processedCourseData.total_duration,
          total_lessons: processedCourseData.total_lessons,
          total_quizzes: processedCourseData.total_quizzes,
          total_flashcards: processedCourseData.total_flashcards,
          total_questions: processedCourseData.total_questions,
          tags: processedCourseData.tags,
          category: processedCourseData.category,
          status: 'ready',
          original_files: files.map(file => ({
            filename: file.filename,
            original_name: file.originalname,
            file_type: file.mimetype,
            file_size: file.size
          })),
          content_analysis: processedCourseData.content_analysis,
          generation_metadata: processedCourseData.generation_metadata
        },
        $push: {
          processing_log: {
            step: 'ai_processing',
            status: 'completed',
            message: `Advanced course generated successfully with ${processedCourseData.modules.length} modules using batching system`,
            timestamp: new Date()
          }
        }
      },
      { new: true }
    );

    console.log('🎉 Advanced AI processing completed successfully!');
    console.log(`📊 Final Stats: ${processedCourseData.total_lessons} lessons, ${processedCourseData.total_questions} questions, ${processedCourseData.total_flashcards} flashcards`);
    
    return updatedCourse;

  } catch (error) {
    console.error('❌ Enhanced AI processing failed:', error);
    
    // Update course status to failed
    await Course.findByIdAndUpdate(courseId, {
      status: 'failed',
      $push: {
        processing_log: {
          step: 'ai_processing',
          status: 'failed',
          message: error.message,
          timestamp: new Date()
        }
      }
    });
    throw error;
  }
};

// Enhanced course data processing with batching support
const processGeneratedCourseData = (generatedCourse, settings, extractedContent) => {
  try {
    console.log('🔧 Processing enhanced generated course data...');
    
    // Extract source topics and keywords from original content
    const sourceTopics = [];
    const sourceKeywords = new Set();
    
    extractedContent.forEach(content => {
      if (content.content?.analysis?.key_topics) {
        sourceTopics.push(...content.content.analysis.key_topics);
      }
      if (content.content?.analysis?.keywords) {
        content.content.analysis.keywords.forEach(keyword => sourceKeywords.add(keyword));
      }
    });

    const processedData = {
      title: generatedCourse.title || 'Advanced AI Generated Course',
      description: generatedCourse.description || 'Comprehensive course generated from your uploaded materials with advanced AI analysis',
      modules: [],
      total_duration: 0,
      total_lessons: 0,
      total_quizzes: 0,
      total_flashcards: 0,
      total_questions: 0,
      tags: generatedCourse.tags || ['ai-generated', 'advanced', 'interactive'],
      category: generatedCourse.category || 'Professional Development',
      content_analysis: {
        source_topics: [...new Set(sourceTopics)].slice(0, 15),
        source_keywords: [...sourceKeywords].slice(0, 25),
        total_source_files: extractedContent.length,
        extraction_quality: 'enhanced',
        content_richness: generatedCourse.content_analysis?.content_richness || 'medium',
        key_concepts: generatedCourse.content_analysis?.key_concepts || []
      },
      generation_metadata: generatedCourse.generation_metadata || {
        batch_system_used: true,
        enhanced_content: true,
        generation_timestamp: new Date().toISOString()
      }
    };

    // Process modules with enhanced validation and batching
    if (generatedCourse.modules && Array.isArray(generatedCourse.modules)) {
      processedData.modules = generatedCourse.modules.map((module, index) => {
        const processedModule = {
          title: module.title || `Module ${index + 1}: Comprehensive Learning`,
          description: module.description || `In-depth coverage of key concepts from your materials`,
          order: module.order || index + 1,
          batch: module.batch || 1,
          lessons: [],
          quiz: [],
          flashcards: [],
          duration: module.duration || 60,
          learning_objectives: module.learning_objectives || [
            `Understand core concepts`,
            `Apply knowledge to practical scenarios`,
            `Analyze complex problems and solutions`
          ],
          completed: false,
          timeSpent: 0,
          created_at: new Date()
        };

        // Process lessons with dynamic count based on settings
        if (module.lessons && Array.isArray(module.lessons)) {
          processedModule.lessons = module.lessons.map((lesson, lessonIndex) => ({
            title: lesson.title || `Lesson ${lessonIndex + 1}: Detailed Concepts`,
            content: enhanceLessonContent(lesson.content, settings.depthLevel, module.topics),
            duration: lesson.duration || 20,
            order: lesson.order || lessonIndex + 1,
            keywords: lesson.keywords || ['concepts', 'principles', 'applications'],
            examples: enhanceExamples(lesson.examples, settings.difficulty),
            summary: lesson.summary || 'Comprehensive understanding of key concepts and their practical applications',
            completed: false,
            timeSpent: 0,
            created_at: new Date()
          }));
        } else {
          // Create dynamic lessons based on difficulty
          processedModule.lessons = createDynamicLessons(module, settings, index);
        }

        // Process quiz with exact question count from settings
        const questionsPerModule = parseInt(settings.questionsPerModule) || 10;
        if (module.quiz && Array.isArray(module.quiz)) {
          processedModule.quiz = module.quiz.slice(0, questionsPerModule).map((question, qIndex) => ({
            question: question.question || `Advanced question ${qIndex + 1} on key concepts`,
            options: Array.isArray(question.options) && question.options.length === 4 ? question.options : [
              'Fundamental principles and relationships',
              'Basic definitions only',
              'Simple memorization',
              'Surface-level understanding'
            ],
            correct_answer: question.correct_answer || (Array.isArray(question.options) ? question.options[0] : 'Fundamental principles and relationships'),
            explanation: question.explanation || 'Understanding core principles and their interrelationships is essential for comprehensive knowledge application.',
            difficulty: question.difficulty || settings.difficulty,
            points: question.points || 10
          }));
        } else {
          processedModule.quiz = createDynamicQuiz(module, questionsPerModule, settings);
        }

        // Process flashcards with exact count from settings
        const flashcardsPerModule = Math.max(3, Math.floor((parseInt(settings.flashcardsCount) || 20) / (parseInt(settings.modulesCount) || 5)));
        if (module.flashcards && Array.isArray(module.flashcards)) {
          processedModule.flashcards = module.flashcards.slice(0, flashcardsPerModule).map((card, cardIndex) => ({
            front: card.front || `Key Concept ${cardIndex + 1}`,
            back: card.back || `Detailed explanation with practical applications and examples`,
            difficulty: card.difficulty || 'medium',
            mastered: false
          }));
        } else {
          processedModule.flashcards = createDynamicFlashcards(module, flashcardsPerModule);
        }

        // Calculate module duration if not provided
        if (!module.duration) {
          processedModule.duration = processedModule.lessons.reduce((sum, lesson) => sum + (lesson.duration || 20), 0);
        }

        return processedModule;
      });
    }

    // Calculate enhanced totals
    processedData.total_duration = processedData.modules.reduce((sum, module) => sum + (module.duration || 0), 0);
    processedData.total_lessons = processedData.modules.reduce((sum, module) => sum + (module.lessons?.length || 0), 0);
    processedData.total_quizzes = processedData.modules.reduce((sum, module) => sum + (module.quiz?.length > 0 ? 1 : 0), 0);
    processedData.total_flashcards = processedData.modules.reduce((sum, module) => sum + (module.flashcards?.length || 0), 0);
    processedData.total_questions = processedData.modules.reduce((sum, module) => sum + (module.quiz?.length || 0), 0);

    console.log(`✅ Enhanced course data: ${processedData.modules.length} modules, ${processedData.total_lessons} lessons, ${processedData.total_questions} questions`);
    return processedData;

  } catch (error) {
    console.error('❌ Error processing enhanced course data:', error);
    return createAdvancedFallbackCourseData(settings, extractedContent);
  }
};

// Dynamic lesson creation based on settings
const createDynamicLessons = (module, settings, moduleIndex) => {
  const difficulty = settings.difficulty || 'beginner';
  const lessonCounts = {
    'beginner': 2,
    'intermediate': 3,
    'advanced': 4
  };
  
  const lessonCount = lessonCounts[difficulty] || 2;
  const lessons = [];
  
  const lessonTypes = {
    'beginner': ['Fundamental Concepts', 'Basic Applications'],
    'intermediate': ['Core Principles', 'Practical Implementation', 'Case Studies'],
    'advanced': ['Advanced Theory', 'Complex Applications', 'Expert Techniques', 'Innovation Strategies']
  };
  
  const types = lessonTypes[difficulty] || lessonTypes['beginner'];
  
  for (let i = 0; i < lessonCount; i++) {
    const lessonType = types[i] || `Advanced Topic ${i + 1}`;
    lessons.push({
      title: `Lesson ${i + 1}: ${lessonType}`,
      content: `This ${difficulty} level lesson provides comprehensive coverage of ${module.topics?.[0] || 'key concepts'}. You'll learn ${lessonType.toLowerCase()} through detailed explanations, practical examples, and real-world applications.`,
      duration: difficulty === 'beginner' ? 20 : 25,
      order: i + 1,
      keywords: module.topics?.slice(0, 3) || ['concepts', 'applications', 'principles'],
      examples: [
        {
          title: 'Real-World Application',
          description: `Practical scenario demonstrating how these concepts are applied in ${difficulty === 'advanced' ? 'complex industry settings' : 'real-world situations'}`,
          code: ''
        }
      ],
      summary: `Comprehensive understanding of ${lessonType.toLowerCase()} and their practical applications`,
      completed: false,
      timeSpent: 0,
      created_at: new Date()
    });
  }
  
  return lessons;
};

// Dynamic quiz creation with exact question count
const createDynamicQuiz = (module, questionCount, settings) => {
  const quiz = [];
  const difficulty = settings.difficulty || 'intermediate';
  
  for (let i = 0; i < questionCount; i++) {
    quiz.push({
      question: `What is essential for effective application of ${module.topics?.[0] || 'these concepts'} in ${difficulty} scenarios?`,
      options: [
        'Understanding fundamental principles and their interrelationships',
        'Memorizing definitions without context',
        'Focusing only on theoretical knowledge',
        'Avoiding practical implementations'
      ],
      correct_answer: 'Understanding fundamental principles and their interrelationships',
      explanation: `True mastery at ${difficulty} level requires deep understanding of how principles connect and can be applied across various contexts.`,
      difficulty: i < questionCount / 2 ? 'medium' : 'hard',
      points: 10
    });
  }
  
  return quiz;
};

// Dynamic flashcards creation
const createDynamicFlashcards = (module, flashcardCount) => {
  const flashcards = [];
  
  for (let i = 0; i < flashcardCount; i++) {
    flashcards.push({
      front: `Key Concept ${i + 1}: ${module.topics?.[0] || 'Core Principle'}`,
      back: `Comprehensive explanation of this important concept with practical applications, real-world significance, and implementation guidelines.`,
      difficulty: 'medium',
      mastered: false
    });
  }
  
  return flashcards;
};

// Enhance lesson content based on depth level
const enhanceLessonContent = (content, depthLevel, topics) => {
  if (!content) {
    return `This lesson provides comprehensive coverage of ${topics?.[0] || 'key concepts'} with detailed explanations, practical examples, and real-world applications to ensure thorough understanding and knowledge retention.`;
  }

  const enhancements = {
    basic: content + ' This covers fundamental concepts and basic applications with clear examples.',
    comprehensive: content + ' Includes detailed explanations, multiple practical examples, case studies, and real-world applications for better understanding and retention.',
    'in-depth': content + ' Comprehensive coverage with advanced insights, complex scenarios, expert-level analysis, strategic implementations, and innovative approaches for deep knowledge acquisition.'
  };

  return enhancements[depthLevel] || enhancements.comprehensive;
};

// Enhance examples based on difficulty
const enhanceExamples = (examples, difficulty) => {
  if (!examples || !Array.isArray(examples) || examples.length === 0) {
    return [{
      title: difficulty === 'advanced' ? 'Complex Real-World Scenario' : 'Practical Application',
      description: difficulty === 'beginner' 
        ? 'Simple example demonstrating basic concept application'
        : difficulty === 'intermediate'
        ? 'Real-world scenario with step-by-step analysis'
        : 'Complex industry case study with advanced implementation strategies',
      code: ''
    }];
  }

  return examples.map(example => ({
    title: example.title || (difficulty === 'advanced' ? 'Expert Case Study' : 'Practical Example'),
    description: example.description || 'Detailed walkthrough with comprehensive explanation and practical insights.',
    code: example.code || ''
  }));
};

// Create advanced fallback course data with batching
const createAdvancedFallbackCourseData = (settings, extractedContent) => {
  const modulesCount = parseInt(settings.modulesCount) || 4;
  const difficulty = settings.difficulty || 'intermediate';
  
  // Determine batching
  let batches = 1;
  if (modulesCount > 8) batches = 3;
  else if (modulesCount > 4) batches = 2;
  
  const modulesPerBatch = Math.ceil(modulesCount / batches);
  
  // Extract topics from original content for better fallback
  const sourceTopics = [];
  extractedContent.forEach(content => {
    if (content.content?.analysis?.key_topics) {
      sourceTopics.push(...content.content.analysis.key_topics);
    }
  });

  const uniqueTopics = [...new Set(sourceTopics)].slice(0, modulesCount);
  
  const modules = [];
  for (let i = 0; i < modulesCount; i++) {
    const topic = uniqueTopics[i] || `Advanced Concept ${i + 1}`;
    const batchNumber = Math.floor(i / modulesPerBatch) + 1;
    
    const lessonCounts = {
      'beginner': 2,
      'intermediate': 3,
      'advanced': 4
    };
    
    const lessonCount = lessonCounts[difficulty] || 3;
    
    modules.push({
      title: `Module ${i + 1}: Mastering ${topic}`,
      description: `Comprehensive exploration of ${topic} with in-depth analysis, practical applications, and real-world implementations`,
      order: i + 1,
      batch: batchNumber,
      duration: 60,
      learning_objectives: [
        `Master the fundamental principles of ${topic}`,
        `Apply ${topic} concepts to complex real-world scenarios`,
        `Analyze and solve problems using advanced ${topic} knowledge`,
        `Develop innovative solutions leveraging ${topic}`
      ],
      lessons: createDynamicLessons({ topics: [topic] }, settings, i),
      quiz: createDynamicQuiz({ topics: [topic] }, parseInt(settings.questionsPerModule) || 10, settings),
      flashcards: createDynamicFlashcards({ topics: [topic] }, Math.max(3, Math.floor((parseInt(settings.flashcardsCount) || 20) / modulesCount))),
      completed: false,
      timeSpent: 0
    });
  }

  const totalLessons = modules.reduce((sum, module) => sum + module.lessons.length, 0);
  const totalQuestions = modules.reduce((sum, module) => sum + module.quiz.length, 0);
  const totalFlashcards = modules.reduce((sum, module) => sum + module.flashcards.length, 0);

  return {
    title: 'Advanced Comprehensive Course',
    description: 'Expert-level course generated from your uploaded materials with in-depth coverage and practical applications',
    modules: modules,
    total_duration: modulesCount * 60,
    total_lessons: totalLessons,
    total_quizzes: modulesCount,
    total_flashcards: totalFlashcards,
    total_questions: totalQuestions,
    tags: ['advanced', 'comprehensive', 'interactive', 'expert-level'],
    category: 'Professional Development',
    content_analysis: {
      source_topics: uniqueTopics,
      source_keywords: ['advanced', 'comprehensive', 'practical', 'interactive'],
      total_source_files: extractedContent.length,
      extraction_quality: 'fallback_enhanced',
      content_richness: 'high'
    },
    generation_metadata: {
      batch_system_used: true,
      total_batches: batches,
      enhanced_content: true,
      fallback_used: true
    }
  };
};

// Test AI service connection
const testAIService = async () => {
  try {
    const { testPythonConnection } = require('../utils/pythonBridge');
    const result = await testPythonConnection();
    return result;
  } catch (error) {
    return {
      success: false,
      message: `AI Service test failed: ${error.message}`
    };
  }
};

// Test Gemini AI connection
const testGeminiAI = async () => {
  try {
    const response = await axios.get('http://localhost:5001/python/test-gemini');
    return response.data;
  } catch (error) {
    return {
      success: false,
      message: `Gemini AI test failed: ${error.message}`
    };
  }
};

module.exports = {
  processCourseWithAI,
  testAIService,
  testGeminiAI
};