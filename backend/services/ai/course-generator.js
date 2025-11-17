const geminiService = require('./gemini-service');
const ExtractedText = require('../../models/ExtractedText');
const Course = require('../../models/Course');

class CourseGenerator {
  constructor() {
    this.sourceText = '';
    this.apiCallCount = 0;
    this.maxApiCalls = 8;
    this.lastApiCallTime = 0;
    this.minCallInterval = 35000;
  }

  async generateCourseFromFile(fileBuffer, courseId, userId, userSettings = {}) {
    try {
      console.log('🎓 Starting AI course generation with smart text division...');
      this.apiCallCount = 0;
      this.lastApiCallTime = 0;
      
      // Step 1: Extract and process text
      const textExtractor = require('../nlp/text-extractor');
      const textCleaner = require('../nlp/text-cleaner');
      
      const mimeType = 'application/pdf';
      const rawText = await textExtractor.extractText(fileBuffer, mimeType);
      const cleanedText = await textCleaner.cleanText(rawText);
      
      this.sourceText = cleanedText;
      const wordCount = cleanedText.split(/\s+/).length;
      console.log(`📝 Extracted text: ${cleanedText.length} chars, ${wordCount} words`);
      
      // Step 2: Save extracted text to MongoDB
      const textChunks = this.divideTextIntoSentenceChunks(cleanedText, userSettings.totalModules);
      
      const extractedTextDoc = new ExtractedText({
        courseId,
        userId,
        originalText: rawText.substring(0, 10000),
        cleanedText: cleanedText,
        textChunks: textChunks,
        chunkingStrategy: {
          totalModules: userSettings.totalModules,
          chunksPerModule: 1,
          totalChunks: textChunks.length
        }
      });
      
      await extractedTextDoc.save();
      console.log(`💾 Extracted text saved with ${textChunks.length} chunks`);
      
      // Generate course structure and ensure completion
      const courseStructure = await this.generateCourseWithDividedText(
        textChunks, 
        userSettings,
        courseId,
        userId
      );
      
      console.log(`✅ Course completed: ${courseStructure.modules.length} modules`);
      console.log(`📊 API calls used: ${this.apiCallCount}/${this.maxApiCalls}`);
      
      return courseStructure;
      
    } catch (error) {
      console.error('❌ Course generation failed:', error);
      
      // Return fallback course with proper structure
      const fallbackCourse = this.createFallbackCourse(userSettings);
      console.log(`🔄 Using fallback course with ${fallbackCourse.modules.length} modules`);
      return fallbackCourse;
    }
  }

  // Rate limiting for free tier API
  async makeRateLimitedAPICall() {
    const now = Date.now();
    const timeSinceLastCall = now - this.lastApiCallTime;
    
    if (timeSinceLastCall < this.minCallInterval) {
      const waitTime = this.minCallInterval - timeSinceLastCall;
      console.log(`⏳ Rate limiting: Waiting ${Math.ceil(waitTime/1000)} seconds before next API call...`);
      await this.sleep(waitTime);
    }
    
    this.lastApiCallTime = Date.now();
    
    if (this.apiCallCount >= this.maxApiCalls) {
      throw new Error(`API call limit reached (${this.maxApiCalls} calls)`);
    }
    
    this.apiCallCount++;
  }

  // Guaranteed sentence-based chunking
  divideTextIntoSentenceChunks(text, totalModules) {
    console.log(`📚 Creating EXACTLY ${totalModules} chunks using sentence-based division...`);
    
    // Split into sentences first
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
    console.log(`📊 Total sentences: ${sentences.length}`);
    
    // If we don't have enough sentences, split by length
    if (sentences.length < totalModules) {
      console.log('⚠️ Not enough sentences, using length-based division');
      return this.divideTextByLength(text, totalModules);
    }
    
    const chunks = [];
    const sentencesPerChunk = Math.max(1, Math.floor(sentences.length / totalModules));
    
    console.log(`📝 Sentences per chunk: ${sentencesPerChunk}`);
    
    for (let i = 0; i < totalModules; i++) {
      const start = i * sentencesPerChunk;
      const end = Math.min(start + sentencesPerChunk, sentences.length);
      
      // For last chunk, include all remaining sentences
      const chunkSentences = (i === totalModules - 1) 
        ? sentences.slice(start) 
        : sentences.slice(start, end);
      
      const chunkText = chunkSentences.join('. ') + '.';
      
      if (chunkText.trim().length > 0) {
        chunks.push({
          chunkNumber: i + 1,
          content: chunkText,
          wordCount: this.countWords(chunkText),
          topics: this.extractTopicsFromChunk(chunkText),
          usedInModules: []
        });
      }
    }
    
    console.log(`✅ Created ${chunks.length} sentence-based chunks`);
    
    // Log chunk details
    chunks.forEach((chunk, index) => {
      console.log(`   Chunk ${index + 1}: ${chunk.wordCount} words, ${chunk.content.split(/[.!?]+/).filter(s => s.trim().length > 0).length} sentences`);
    });
    
    return chunks;
  }

  // Length-based division as fallback
  divideTextByLength(text, totalModules) {
    console.log(`📏 Dividing text by length into ${totalModules} chunks...`);
    
    const chunkSize = Math.ceil(text.length / totalModules);
    const chunks = [];
    
    for (let i = 0; i < totalModules; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, text.length);
      
      let chunkText = text.substring(start, end);
      
      // Try to end at a sentence boundary for last chunk
      if (i < totalModules - 1) {
        const lastPeriod = chunkText.lastIndexOf('.');
        if (lastPeriod > chunkText.length * 0.7) {
          chunkText = chunkText.substring(0, lastPeriod + 1);
        }
      }
      
      if (chunkText.trim().length > 0) {
        chunks.push({
          chunkNumber: i + 1,
          content: chunkText.trim(),
          wordCount: this.countWords(chunkText),
          topics: this.extractTopicsFromChunk(chunkText),
          usedInModules: []
        });
      }
    }
    
    console.log(`✅ Created ${chunks.length} length-based chunks`);
    return chunks;
  }

  // Helper: Count words in text
  countWords(text) {
    return text.split(/\s+/).filter(word => word.length > 0).length;
  }

  extractTopicsFromChunk(chunk) {
    const sentences = chunk.split(/[.!?]+/).filter(s => s.trim().length > 10);
    const topics = new Set();
    
    // Extract first few meaningful sentences as topics
    sentences.slice(0, 3).forEach(sentence => {
      const cleanSentence = sentence.trim();
      if (cleanSentence.length > 20 && cleanSentence.length < 150) {
        topics.add(cleanSentence);
      }
    });
    
    return Array.from(topics).slice(0, 3);
  }

  // Generate course with guaranteed completion
  async generateCourseWithDividedText(textChunks, userSettings, courseId, userId) {
    const totalModules = userSettings.totalModules || 5;
    
    // GUARANTEED: We always have exactly totalModules chunks
    const maxPossibleModules = Math.min(totalModules, textChunks.length);
    
    console.log(`📊 Content Analysis: ${textChunks.length} chunks → ${maxPossibleModules} modules`);
    
    if (maxPossibleModules === 0) {
      console.log('❌ No chunks available for module generation');
      return this.createFallbackCourse(userSettings);
    }
    
    // FIRST: Generate course title and description using AI
    let courseTitle = this.generateCourseTitle(userSettings);
    let courseDescription = this.generateCourseDescription(userSettings, maxPossibleModules);
    
    try {
      const courseMetadata = await this.generateCourseMetadataWithAIRetry(textChunks, userSettings, 3);
      if (courseMetadata && courseMetadata.title) {
        courseTitle = courseMetadata.title;
        courseDescription = courseMetadata.description;
        console.log(`🎯 AI Generated Course: "${courseTitle}"`);
      }
    } catch (error) {
      console.log('⚠️ Using default course title and description');
    }
    
    const modulesPerAPICall = this.calculateOptimalModulesPerAPICall(maxPossibleModules);
    const totalAPICalls = Math.ceil(maxPossibleModules / modulesPerAPICall);
    
    console.log(`🔄 Generating ${maxPossibleModules} modules in ${totalAPICalls} API calls`);
    
    const allModules = [];
    let chunkPointer = 0;

    for (let apiCall = 0; apiCall < totalAPICalls; apiCall++) {
        if (this.apiCallCount >= this.maxApiCalls) {
            console.log('⚠️ API limit reached, using template for remaining modules');
            break;
        }

        const modulesInThisCall = Math.min(modulesPerAPICall, maxPossibleModules - allModules.length);
        const chunksNeeded = modulesInThisCall;
        
        if (chunkPointer >= textChunks.length) {
            console.log('📝 No more chunks available');
            break;
        }
        
        const chunksForThisCall = textChunks.slice(chunkPointer, chunkPointer + chunksNeeded);
        
        console.log(`📞 API Call ${apiCall + 1}: Generating ${modulesInThisCall} modules from ${chunksForThisCall.length} chunks`);
        
        try {
            const generatedModules = await this.generateModulesWithAIRetry(
                chunksForThisCall, 
                allModules.length + 1,
                modulesInThisCall,
                userSettings,
                3
            );
            
            if (generatedModules && generatedModules.length > 0) {
                allModules.push(...generatedModules);
                chunkPointer += chunksForThisCall.length;
                console.log(`✅ API Call ${apiCall + 1} successful: ${generatedModules.length} modules`);
            } else {
                throw new Error('No modules generated from AI');
            }
            
        } catch (error) {
            console.error(`❌ API call ${apiCall + 1} failed:`, error.message);
            
            // Create template modules from available chunks
            if (chunksForThisCall.length > 0) {
                const templateModules = this.createTemplateModules(
                    allModules.length + 1, 
                    chunksForThisCall.length,
                    userSettings,
                    chunksForThisCall
                );
                allModules.push(...templateModules);
                chunkPointer += chunksForThisCall.length;
                console.log(`🔄 Used templates for ${chunksForThisCall.length} modules`);
            }
        }
        
        // Add delay between API calls
        if (apiCall < totalAPICalls - 1) {
            await this.sleep(3000);
        }
    }

    // GUARANTEED COMPLETION: Ensure we have exactly totalModules
    if (allModules.length < totalModules) {
        const remainingModules = totalModules - allModules.length;
        console.log(`🔄 Creating ${remainingModules} additional template modules`);
        
        const availableChunks = textChunks.length > 0 ? textChunks : [{ content: this.sourceText.substring(0, 500) }];
        const templateModules = this.createTemplateModules(
            allModules.length + 1,
            remainingModules,
            userSettings,
            availableChunks
        );
        allModules.push(...templateModules);
    }

    console.log(`🎉 Final result: ${allModules.length}/${totalModules} modules generated`);
    
    return {
        title: courseTitle,
        description: courseDescription,
        modules: allModules,
        settings: userSettings,
        contentUtilization: {
            chunksUsed: chunkPointer,
            totalChunks: textChunks.length,
            modulesGenerated: allModules.length,
            targetModules: totalModules
        }
    };
  }

  // Course metadata with retry attempts
  async generateCourseMetadataWithAIRetry(textChunks, userSettings, maxRetries = 3) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🤖 Course Metadata Attempt ${attempt}/${maxRetries}`);
        const result = await this.generateCourseMetadataWithAI(textChunks, userSettings);
        if (result && result.title) {
          console.log(`✅ Course metadata generated: "${result.title}"`);
          return result;
        }
        throw new Error('Invalid course metadata response');
      } catch (error) {
        lastError = error;
        console.warn(`⚠️ Course metadata attempt ${attempt} failed:`, error.message);
        
        if (attempt < maxRetries) {
          const delay = attempt * 2000;
          console.log(`🔄 Retrying course metadata in ${delay/1000} seconds...`);
          await this.sleep(delay);
        }
      }
    }
    
    console.error(`❌ All ${maxRetries} course metadata attempts failed`);
    throw lastError;
  }

  // Better course metadata generation
  async generateCourseMetadataWithAI(textChunks, userSettings) {
    try {
      await this.makeRateLimitedAPICall();
    } catch (error) {
      console.log('⚠️ API limit reached, using default course metadata');
      return null;
    }
    
    const sampleContent = textChunks.slice(0, 2).map(chunk => 
      chunk.content.substring(0, 500)
    ).join('\n\n');

    const prompt = `
Create an engaging course title and description based on the learning material and user preferences.

LEARNING MATERIAL SAMPLE:
${sampleContent}

USER SETTINGS & PREFERENCES:
- Content Type: ${userSettings.contentType || 'comprehensive'}
- Difficulty Level: ${userSettings.difficulty || 'beginner'}
- Learning Pace: ${userSettings.learningPace || 'moderate'}
- Content Style: ${userSettings.contentStyle || 'interactive'}
- Total Modules: ${userSettings.totalModules || 5}
- Lessons per Module: ${userSettings.lessonsPerModule || 4}

COURSE REQUIREMENTS:
- Title: Catchy, professional, and relevant (max 8-10 words)
- Description: Compelling overview explaining learning outcomes (2-3 sentences)
- Match the ${userSettings.difficulty} level and ${userSettings.contentStyle} style
- Highlight ${userSettings.contentType} approach

Return ONLY JSON format:
{
  "title": "Engaging Course Title Here",
  "description": "Compelling course description that explains what students will achieve..."
}
`;

    try {
      console.log('🤖 Generating course title and description with AI...');
      
      const result = await geminiService.generateStructuredContent(prompt, {
        title: "Course title",
        description: "Course description"
      }, {
        maxRetries: 1,
        validateJSON: true,
        cleanResponse: true
      });
      
      return result;
      
    } catch (error) {
      console.error('❌ Course metadata generation failed:', error.message);
      throw error;
    }
  }

  // Optimized for free tier
  calculateOptimalModulesPerAPICall(totalModules) {
    if (totalModules <= 2) return 1;
    if (totalModules <= 4) return 2;
    if (totalModules <= 6) return 2;
    return 3;
  }

  // 3 attempts tak retry for free tier
  async generateModulesWithAIRetry(textChunks, startModuleNumber, moduleCount, userSettings, maxRetries = 3) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🤖 AI Generation Attempt ${attempt}/${maxRetries}`);
        const result = await this.generateModulesWithAI(textChunks, startModuleNumber, moduleCount, userSettings);
        console.log(`✅ Attempt ${attempt} successful!`);
        return result;
      } catch (error) {
        lastError = error;
        console.warn(`⚠️ Attempt ${attempt} failed:`, error.message);
        
        if (attempt < maxRetries) {
          const delay = attempt * 2000;
          console.log(`🔄 Retrying in ${delay/1000} seconds...`);
          await this.sleep(delay);
        }
      }
    }
    
    console.error(`❌ All ${maxRetries} attempts failed`);
    throw lastError;
  }

  // ✅ UPDATED: Better module generation with TOPIC TAGGING FOR QUIZZES
  async generateModulesWithAI(textChunks, startModuleNumber, moduleCount, userSettings) {
    await this.makeRateLimitedAPICall();
    
    const prompt = this.buildEnhancedModuleGenerationPrompt(textChunks, startModuleNumber, moduleCount, userSettings);
    
    // ✅ UPDATED: Schema with topic tagging for quizzes
    const schema = {
      modules: [
        {
          title: "Module title",
          description: "Module description",
          order: 1,
          lessons: [
            {
              title: "Lesson title",
              content: {
                introduction: "Brief overview of what this lesson covers",
                keyConcepts: ["Concept 1", "Concept 2", "Concept 3"],
                detailedExplanation: "Detailed step-by-step explanation of concepts",
                practicalExamples: ["Example 1", "Example 2", "Example 3"],
                importantPoints: ["Key point 1", "Key point 2", "Key point 3"],
                applications: "How to apply these concepts in real world",
                learningObjectives: ["Objective 1", "Objective 2"],
                prerequisites: ["Prerequisite 1", "Prerequisite 2"],
                summary: "Brief summary of main points"
              },
              duration: 15,
              order: 1,
              quiz: [
                {
                  question: "Quiz question",
                  options: ["Option 1", "Option 2", "Option 3", "Option 4"],
                  correctAnswer: "Correct option",
                  explanation: "Detailed explanation of correct answer",
                  // ✅ NEW: Topic tagging for quizzes
                  topic: "Relevant topic/concept name",
                  conceptTags: ["tag1", "tag2", "tag3"]
                }
              ],
              flashcards: [
                {
                  term: "Key term",
                  definition: "Clear definition of the term"
                }
              ]
            }
          ]
        }
      ]
    };

    try {
      console.log(`🤖 Generating ${moduleCount} modules with AI...`);
      
      const result = await geminiService.generateStructuredContent(prompt, schema, {
        maxRetries: 2,
        validateJSON: true,
        cleanResponse: true
      });
      
      if (!result || !result.modules || !Array.isArray(result.modules)) {
        throw new Error('Invalid response format from AI - missing modules array');
      }
      
      // Validate and enhance modules with settings
      const validModules = result.modules
        .filter(module => module && module.title && module.lessons && Array.isArray(module.lessons))
        .slice(0, moduleCount)
        .map((module, index) => this.enhanceModuleWithSettings(module, startModuleNumber + index, userSettings));
      
      if (validModules.length === 0) {
        throw new Error('No valid modules generated after filtering');
      }
      
      console.log(`✅ Generated ${validModules.length} valid modules`);
      return validModules;
      
    } catch (error) {
      console.error('AI module generation failed:', error);
      throw error;
    }
  }

  // ✅ UPDATED: Enhanced prompts with TOPIC TAGGING REQUIREMENTS
  buildEnhancedModuleGenerationPrompt(textChunks, startModuleNumber, moduleCount, userSettings) {
    const chunkContents = textChunks.map((chunk, idx) => 
      `CHUNK ${idx + 1} (${chunk.wordCount} words):\n${chunk.content.substring(0, 800)}...`
    ).join('\n\n');

    const lessonsPerModule = this.getLessonCountByPace(userSettings.learningPace);
    const questionsPerLesson = userSettings.questionsPerTopic || 4;
    const flashcardsPerModule = userSettings.flashcardsPerModule || 4;

    return `
Generate EXACTLY ${moduleCount} high-quality educational modules starting from module ${startModuleNumber}.

CRITICAL CONTENT REQUIREMENTS:
- Create ${moduleCount} COMPLETE modules with ${lessonsPerModule} lessons each
- Each lesson MUST follow this EXACT STRUCTURED FORMAT:

  📚 LESSON STRUCTURE (JSON FORMAT):
  {
    "title": "Lesson Title",
    "content": {
      "introduction": "2-3 sentence overview of what will be covered",
      "keyConcepts": ["Bullet point 1", "Bullet point 2", "Bullet point 3"],
      "detailedExplanation": "Step-by-step explanation with clear paragraphs",
      "practicalExamples": ["Real example 1", "Real example 2", "Real example 3"],
      "importantPoints": ["Key takeaway 1", "Key takeaway 2", "Key takeaway 3"],
      "applications": "How to apply these concepts in real world scenarios",
      "learningObjectives": ["What student will learn 1", "What student will learn 2"],
      "prerequisites": ["Required knowledge 1", "Required knowledge 2"],
      "summary": "Brief recap of main points covered in lesson"
    }
  }

QUIZ REQUIREMENTS (IMPORTANT):
- Each quiz question MUST include:
  * "topic": "Specific topic/concept name this question tests"
  * "conceptTags": ["relevant_tag1", "relevant_tag2"] 
  * Topics should be specific like "Variables", "Functions", "Data Types", etc.
  * Tags should be related keywords for better organization

USER SETTINGS:
- Content Type: ${userSettings.contentType || 'comprehensive'}
- Difficulty: ${userSettings.difficulty || 'beginner'}
- Learning Pace: ${userSettings.learningPace || 'moderate'}
- Content Style: ${userSettings.contentStyle || 'interactive'}

CONTENT GUIDELINES:
- Use BULLET POINTS for keyConcepts, practicalExamples, and importantPoints
- Include PRACTICAL EXAMPLES in every lesson
- Add REAL-WORLD SCENARIOS in applications
- Focus on KEY CONCEPTS and IMPORTANT POINTS
- Make content ACTIONABLE and PRACTICAL
- Use clear, simple language appropriate for ${userSettings.difficulty} level

SOURCE TEXT CHUNKS (Use these extensively):
${chunkContents}

MODULE REQUIREMENTS FOR EACH:
- Title: Clear, descriptive module title
- Description: Engaging overview of learning outcomes
- ${lessonsPerModule} Lessons: Each with:
  * Title: Engaging and descriptive
  * Structured Content: Follow the exact JSON structure above
  * Quiz: ${questionsPerLesson} questions with TOPIC TAGGING
  * Flashcards: ${flashcardsPerModule} key concept cards

Return VALID JSON only with structured content for each lesson.
`;
  }

  // Enhanced module with STRUCTURED CONTENT
  enhanceModuleWithSettings(module, order, userSettings) {
    const baseLessonCount = this.getLessonCountByPace(userSettings.learningPace);
    const adjustedLessons = (module.lessons || []).slice(0, baseLessonCount);
    
    // Enhanced structured content based on settings
    adjustedLessons.forEach(lesson => {
      // Ensure structured content exists and is properly formatted
      lesson.content = this.ensureStructuredContent(lesson.content, userSettings);
      
      // Proper lesson duration calculation
      lesson.duration = this.calculateStructuredContentDuration(lesson.content, userSettings.learningPace);
      
      // ✅ UPDATED: Ensure quizzes with topic tagging
      lesson.quiz = this.ensureQuizWithTopicTagging(lesson.quiz, userSettings, lesson.content);
      lesson.flashcards = this.ensureFlashcardsWithFallback(lesson.flashcards, userSettings);
      
      // Progress tracking fields
      lesson.locked = order > 1;
      lesson.completed = false;
      lesson.quizScore = 0;
      lesson.timeSpent = 0;
    });

    return {
      ...module,
      order: order,
      lessons: adjustedLessons.map((lesson, lessonIndex) => ({
        title: lesson.title || `Lesson ${lessonIndex + 1}: Key Concepts`,
        content: lesson.content, // Now structured object
        duration: lesson.duration,
        order: lessonIndex + 1,
        locked: lesson.locked,
        completed: lesson.completed,
        quizScore: lesson.quizScore,
        timeSpent: lesson.timeSpent,
        quiz: lesson.quiz,
        flashcards: lesson.flashcards
      }))
    };
  }

  // ✅ UPDATED: Ensure quizzes with topic tagging
  ensureQuizWithTopicTagging(quiz, userSettings, lessonContent) {
    if (!quiz || !Array.isArray(quiz) || quiz.length === 0) {
      return this.generateQuizQuestionsWithTopics([], userSettings, lessonContent);
    }
    
    return quiz.map((question, index) => ({
      question: question.question || `Important concept question ${index + 1}`,
      options: question.options || [
        "Correct understanding of concept",
        "Partial understanding", 
        "Misunderstanding of basics",
        "Complete misconception"
      ],
      correctAnswer: question.correctAnswer || (question.options ? question.options[0] : "Correct understanding of concept"),
      explanation: question.explanation || "This question tests your understanding of key concepts from the lesson.",
      // ✅ NEW: Topic tagging with fallback
      topic: question.topic || this.extractTopicFromContent(lessonContent, index),
      conceptTags: Array.isArray(question.conceptTags) && question.conceptTags.length > 0 
        ? question.conceptTags 
        : this.generateConceptTags(lessonContent, index)
    }));
  }

  // ✅ NEW: Extract topic from lesson content
  extractTopicFromContent(lessonContent, questionIndex) {
    if (!lessonContent) return `Concept ${questionIndex + 1}`;
    
    // Try to get from keyConcepts first
    if (lessonContent.keyConcepts && Array.isArray(lessonContent.keyConcepts) && lessonContent.keyConcepts.length > 0) {
      const conceptIndex = questionIndex % lessonContent.keyConcepts.length;
      return lessonContent.keyConcepts[conceptIndex].substring(0, 50);
    }
    
    // Try to get from learningObjectives
    if (lessonContent.learningObjectives && Array.isArray(lessonContent.learningObjectives) && lessonContent.learningObjectives.length > 0) {
      const objectiveIndex = questionIndex % lessonContent.learningObjectives.length;
      return lessonContent.learningObjectives[objectiveIndex].substring(0, 50);
    }
    
    return `Topic ${questionIndex + 1}`;
  }

  // ✅ NEW: Generate concept tags from lesson content
  generateConceptTags(lessonContent, questionIndex) {
    const tags = [];
    
    if (lessonContent.keyConcepts && Array.isArray(lessonContent.keyConcepts)) {
      lessonContent.keyConcepts.forEach(concept => {
        // Extract key words from concept
        const words = concept.split(' ').slice(0, 3);
        tags.push(words.join('_').toLowerCase());
      });
    }
    
    // Ensure we have at least some tags
    if (tags.length === 0) {
      tags.push('fundamentals', 'core_concepts', 'essential_skills');
    }
    
    return tags.slice(0, 3); // Return max 3 tags
  }

  // Ensure structured content exists and is properly formatted
  ensureStructuredContent(content, userSettings) {
    // If content is already structured object, validate and enhance it
    if (content && typeof content === 'object') {
      return {
        introduction: content.introduction || "This lesson covers essential concepts and their practical applications.",
        keyConcepts: Array.isArray(content.keyConcepts) && content.keyConcepts.length > 0 
          ? content.keyConcepts 
          : ["Fundamental principles", "Core concepts", "Essential terminology"],
        detailedExplanation: content.detailedExplanation || "Detailed explanation of concepts with step-by-step guidance.",
        practicalExamples: Array.isArray(content.practicalExamples) && content.practicalExamples.length > 0
          ? content.practicalExamples
          : ["Real-world scenario 1", "Practical implementation example", "Case study application"],
        importantPoints: Array.isArray(content.importantPoints) && content.importantPoints.length > 0
          ? content.importantPoints
          : ["Key concept to remember", "Critical application point", "Essential takeaway"],
        applications: content.applications || "How to apply these concepts in real-world projects and scenarios.",
        learningObjectives: Array.isArray(content.learningObjectives) && content.learningObjectives.length > 0
          ? content.learningObjectives
          : ["Understand core concepts", "Apply knowledge practically", "Solve real-world problems"],
        prerequisites: Array.isArray(content.prerequisites) && content.prerequisites.length > 0
          ? content.prerequisites
          : ["Basic understanding of subject", "Fundamental concepts knowledge"],
        summary: content.summary || "Summary of key concepts and their practical applications covered in this lesson.",
        estimatedReadingTime: content.estimatedReadingTime || 5,
        difficulty: content.difficulty || 'medium'
      };
    }
    
    // If content is string (legacy format), convert to structured format
    return this.convertToStructuredContent(content || '', userSettings);
  }

  // Convert string content to structured format
  convertToStructuredContent(contentString, userSettings) {
    const difficulty = userSettings.difficulty || 'intermediate';
    
    return {
      introduction: "This lesson covers essential concepts from your learning material in an organized, structured format.",
      keyConcepts: [
        "Fundamental principles and core theories",
        "Important terminology and definitions",
        "Essential relationships between concepts"
      ],
      detailedExplanation: contentString || "Detailed explanation of concepts with practical insights and step-by-step guidance for better understanding.",
      practicalExamples: [
        "Real-world scenario demonstrating basic principles",
        "Practical implementation showing intermediate applications",
        "Advanced case study for comprehensive understanding"
      ],
      importantPoints: [
        "Core concepts to master from this lesson",
        "Key takeaways for practical application", 
        "Common mistakes and how to avoid them"
      ],
      applications: "How to apply these concepts in real-world projects, scenarios, and practical implementations for maximum impact and learning retention.",
      learningObjectives: [
        "Understand and explain core concepts",
        "Apply knowledge to solve practical problems",
        "Implement concepts in real-world scenarios"
      ],
      prerequisites: [
        "Basic understanding of subject fundamentals",
        "Willingness to learn and apply concepts"
      ],
      summary: "Comprehensive overview of key concepts, practical applications, and important takeaways from this lesson.",
      estimatedReadingTime: 5,
      difficulty: difficulty === 'beginner' ? 'easy' : difficulty === 'advanced' ? 'hard' : 'medium'
    };
  }

  // Calculate duration based on structured content
  calculateStructuredContentDuration(content, learningPace) {
    let totalWords = 0;
    
    // Calculate words from all content sections
    if (content.introduction) totalWords += content.introduction.split(/\s+/).length;
    if (content.detailedExplanation) totalWords += content.detailedExplanation.split(/\s+/).length;
    if (content.applications) totalWords += content.applications.split(/\s+/).length;
    if (content.summary) totalWords += content.summary.split(/\s+/).length;
    
    // Add words from arrays (estimate)
    if (Array.isArray(content.keyConcepts)) totalWords += content.keyConcepts.join(' ').split(/\s+/).length;
    if (Array.isArray(content.practicalExamples)) totalWords += content.practicalExamples.join(' ').split(/\s+/).length;
    if (Array.isArray(content.importantPoints)) totalWords += content.importantPoints.join(' ').split(/\s+/).length;
    
    const wordsPerMinute = {
      'slow': 150,
      'moderate': 175, 
      'fast': 200,
      'crash': 220
    };
    
    const wpm = wordsPerMinute[learningPace] || 175;
    const readingTime = Math.ceil(totalWords / wpm);
    
    const additionalTime = {
      'slow': 8,
      'moderate': 6,
      'fast': 4,
      'crash': 3
    };
    
    const addTime = additionalTime[learningPace] || 6;
    const totalTime = readingTime + addTime;
    
    return Math.max(10, Math.min(20, totalTime));
  }

  // Template modules creation (fallback) - UPDATED for topic tagging
  createTemplateModules(startModuleNumber, moduleCount, userSettings, chunks = []) {
    const modules = [];
    const lessonsPerModule = this.getLessonCountByPace(userSettings.learningPace);
    
    for (let i = 0; i < moduleCount; i++) {
      const moduleChunks = chunks.slice(i * 2, (i + 1) * 2);
      
      const lessons = [];
      for (let j = 0; j < lessonsPerModule; j++) {
        const lessonContent = this.generateStructuredLessonContent(moduleChunks, j, userSettings);
        
        lessons.push({
          title: this.generateLessonTitle(moduleChunks, j, userSettings),
          content: lessonContent,
          duration: this.calculateTemplateDuration(userSettings.learningPace, j),
          order: j + 1,
          locked: startModuleNumber + i > 1,
          completed: false,
          timeSpent: 0,
          // ✅ UPDATED: Use topic-tagged quiz generation
          quiz: this.generateQuizQuestionsWithTopics(moduleChunks, userSettings, lessonContent),
          flashcards: this.generateFlashcards(moduleChunks, userSettings)
        });
      }
      
      modules.push({
        title: this.generateModuleTitle(moduleChunks, startModuleNumber + i, userSettings),
        description: this.generateModuleDescription(moduleChunks, userSettings),
        order: startModuleNumber + i,
        lessons: lessons
      });
    }
    
    return modules;
  }

  // ✅ UPDATED: Generate quiz questions with topic tagging
  generateQuizQuestionsWithTopics(chunks, userSettings, lessonContent) {
    const questionsNeeded = userSettings.questionsPerTopic || 4;
    const questions = [];
    
    const difficultyLevels = {
      'easy': ['basic understanding', 'fundamental concepts', 'simple recall', 'essential principles'],
      'medium': ['practical application', 'conceptual analysis', 'scenario-based', 'implementation'],
      'hard': ['complex problem-solving', 'critical thinking', 'advanced analysis', 'optimization'],
      'adaptive': ['comprehensive assessment', 'mixed difficulty', 'progressive challenge', 'integrated concepts']
    };
    
    const difficultyDesc = difficultyLevels[userSettings.quizDifficulty] || difficultyLevels.medium;
    
    // Extract potential topics from lesson content
    const potentialTopics = this.extractPotentialTopics(lessonContent);
    
    for (let i = 0; i < questionsNeeded; i++) {
      const topicIndex = i % potentialTopics.length;
      const currentTopic = potentialTopics[topicIndex];
      
      questions.push({
        question: `What demonstrates proper ${difficultyDesc[i % difficultyDesc.length]} of ${currentTopic} in ${userSettings.difficulty || 'intermediate'} level contexts?`,
        options: [
          "Applying concepts to real-world scenarios with practical examples",
          "Memorizing definitions without understanding context", 
          "Focusing only on theoretical aspects without application",
          "Skipping fundamental concepts for advanced topics"
        ],
        correctAnswer: "Applying concepts to real-world scenarios with practical examples",
        explanation: `This question tests your ${difficultyDesc[i % difficultyDesc.length]} of ${currentTopic}. Practical application ensures deeper understanding and long-term retention.`,
        // ✅ NEW: Topic tagging
        topic: currentTopic,
        conceptTags: this.generateTagsFromTopic(currentTopic)
      });
    }
    
    return questions;
  }

  // ✅ NEW: Extract potential topics from lesson content
  extractPotentialTopics(lessonContent) {
    const topics = new Set();
    
    // Extract from key concepts
    if (lessonContent.keyConcepts && Array.isArray(lessonContent.keyConcepts)) {
      lessonContent.keyConcepts.forEach(concept => {
        if (concept.length > 5 && concept.length < 50) {
          topics.add(concept);
        }
      });
    }
    
    // Extract from learning objectives
    if (lessonContent.learningObjectives && Array.isArray(lessonContent.learningObjectives)) {
      lessonContent.learningObjectives.forEach(objective => {
        const words = objective.split(' ').slice(0, 3).join(' ');
        if (words.length > 5) {
          topics.add(words);
        }
      });
    }
    
    // Add fallback topics
    if (topics.size === 0) {
      topics.add('Fundamental Concepts');
      topics.add('Core Principles');
      topics.add('Essential Skills');
      topics.add('Practical Applications');
    }
    
    return Array.from(topics);
  }

  // ✅ NEW: Generate tags from topic
  generateTagsFromTopic(topic) {
    const words = topic.toLowerCase().split(' ').slice(0, 3);
    return words.map(word => word.replace(/[^a-z0-9]/g, '_'));
  }

  // Generate structured lesson content for templates
  generateStructuredLessonContent(chunks, lessonIndex, userSettings) {
    const difficulty = userSettings.difficulty || 'intermediate';
    const style = userSettings.contentStyle || 'interactive';
    
    return {
      introduction: `This ${difficulty}-level lesson covers essential concepts in a ${style} format to enhance your understanding and practical application skills.`,
      keyConcepts: [
        "Fundamental principles and core theories",
        "Important terminology and definitions", 
        "Essential relationships between concepts",
        "Practical applications and use cases"
      ],
      detailedExplanation: `Clear, step-by-step explanations of each concept with practical insights and detailed guidance. This section breaks down complex ideas into understandable components for ${difficulty} level learners.`,
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
      applications: `How to apply these concepts in real-world projects, professional scenarios, and practical implementations. Learn to use this knowledge effectively in ${userSettings.contentType || 'various'} contexts.`,
      learningObjectives: [
        "Understand and explain core concepts clearly",
        "Apply knowledge to solve real-world problems",
        "Implement concepts in practical scenarios effectively"
      ],
      prerequisites: [
        "Basic understanding of subject fundamentals",
        "Openness to learning and applying new concepts"
      ],
      summary: `This lesson covered essential ${difficulty}-level concepts with practical examples and applications. You should now understand the core principles and how to apply them in real-world situations.`,
      estimatedReadingTime: 5,
      difficulty: difficulty === 'beginner' ? 'easy' : difficulty === 'advanced' ? 'hard' : 'medium'
    };
  }

  // Rest of the helper methods...
  getLessonCountByPace(learningPace) {
    const paceSettings = {
      'slow': 3,
      'moderate': 4,
      'fast': 5,
      'crash': 6
    };
    return paceSettings[learningPace] || 4;
  }

  ensureFlashcardsWithFallback(flashcards, userSettings) {
    if (!flashcards || !Array.isArray(flashcards) || flashcards.length === 0) {
      return this.generateFlashcards([], userSettings);
    }
    
    return flashcards.map((card, index) => ({
      term: card.term || `Key Term ${index + 1}`,
      definition: card.definition || "Important definition from the lesson content"
    }));
  }

  calculateTemplateDuration(learningPace, lessonIndex) {
    const baseDurations = {
      'slow': [12, 13, 14, 15, 15],
      'moderate': [11, 12, 13, 14, 14],
      'fast': [10, 11, 12, 13, 13],
      'crash': [10, 10, 11, 12, 12]
    };
    
    const durations = baseDurations[learningPace] || baseDurations.moderate;
    return durations[lessonIndex] || 12;
  }

  // Legacy method for backward compatibility
  generateQuizQuestions(chunks, userSettings) {
    return this.generateQuizQuestionsWithTopics(chunks, userSettings, {});
  }

  generateCourseTitle(userSettings) {
    const contentType = userSettings.contentType || 'Comprehensive';
    const difficulty = userSettings.difficulty || 'Intermediate';
    const style = userSettings.contentStyle || 'interactive';
    
    const titleTemplates = {
      'beginner': `Complete ${contentType} Fundamentals - ${this.getStyleAdjective(style)} Beginner Course`,
      'intermediate': `Master ${contentType} - ${this.getStyleAdjective(style)} Intermediate Mastery`, 
      'advanced': `Advanced ${contentType} - ${this.getStyleAdjective(style)} Expert Deep Dive`,
      'mixed': `Comprehensive ${contentType} - ${this.getStyleAdjective(style)} All Levels`
    };
    
    return titleTemplates[userSettings.difficulty] || `${contentType} Mastery Course - ${difficulty} Level`;
  }

  getStyleAdjective(style) {
    const adjectives = {
      'visual': 'Visual',
      'textual': 'Detailed',
      'interactive': 'Interactive',
      'story-based': 'Practical',
      'comprehensive': 'Complete'
    };
    return adjectives[style] || 'Comprehensive';
  }

  generateCourseDescription(userSettings, totalModules) {
    const difficulty = userSettings.difficulty || 'intermediate';
    const pace = userSettings.learningPace || 'moderate';
    const contentType = userSettings.contentType || 'essential concepts';
    const style = userSettings.contentStyle || 'interactive';
    
    const styleDescriptions = {
      'visual': 'with visual explanations and conceptual diagrams',
      'textual': 'with detailed written explanations and comprehensive coverage',
      'interactive': 'with engaging Q&A format and interactive learning',
      'story-based': 'through real-world stories and practical case studies',
      'comprehensive': 'with complete coverage of theory and practice'
    };
    
    const styleDesc = styleDescriptions[style] || 'with comprehensive learning approach';
    
    const descriptions = {
      'beginner': `Perfect for beginners! ${totalModules} modules with step-by-step lessons ${styleDesc} to master ${contentType} from scratch.`,
      'intermediate': `Take your skills to the next level! ${totalModules} comprehensive modules ${styleDesc} with real-world applications in ${contentType}.`,
      'advanced': `Expert-level deep dive! ${totalModules} intensive modules ${styleDesc} covering advanced ${contentType} concepts and complex problem-solving.`,
      'mixed': `Complete learning journey! ${totalModules} well-structured modules ${styleDesc} covering ${contentType} from basics to advanced concepts.`
    };
    
    return descriptions[difficulty] || `A ${difficulty} level course with ${totalModules} ${pace}-paced modules covering ${contentType} ${styleDesc}.`;
  }

  generateModuleTitle(chunks, moduleNumber, userSettings) {
    const difficulty = userSettings.difficulty || 'intermediate';
    const style = userSettings.contentStyle || 'interactive';
    
    if (chunks.length > 0 && chunks[0].topics && chunks[0].topics.length > 0) {
      const baseTopic = chunks[0].topics[0];
      const templates = {
        'beginner': `Module ${moduleNumber}: Understanding ${baseTopic} - ${this.getStyleAdjective(style)} Basics`,
        'intermediate': `Module ${moduleNumber}: Mastering ${baseTopic} - ${this.getStyleAdjective(style)} Core Concepts`,
        'advanced': `Module ${moduleNumber}: Advanced ${baseTopic} - ${this.getStyleAdjective(style)} Expert Techniques`,
        'mixed': `Module ${moduleNumber}: ${baseTopic} - ${this.getStyleAdjective(style)} Complete Coverage`
      };
      return templates[difficulty] || `Module ${moduleNumber}: ${baseTopic}`;
    }
    
    const fallbackTitles = {
      'beginner': `Module ${moduleNumber}: Fundamental Concepts & ${this.getStyleAdjective(style)} Basics`,
      'intermediate': `Module ${moduleNumber}: Core Principles & ${this.getStyleAdjective(style)} Applications`, 
      'advanced': `Module ${moduleNumber}: Advanced Strategies & ${this.getStyleAdjective(style)} Implementation`,
      'mixed': `Module ${moduleNumber}: Key Concepts & ${this.getStyleAdjective(style)} Applications`
    };
    
    return fallbackTitles[difficulty] || `Module ${moduleNumber}: Key Concepts in ${userSettings.contentType || 'the Subject'}`;
  }

  generateModuleDescription(chunks, userSettings) {
    const difficulty = userSettings.difficulty || 'intermediate';
    const style = userSettings.contentStyle || 'interactive';
    
    const styleApproach = {
      'visual': 'visual explanations and conceptual understanding',
      'textual': 'detailed written analysis and comprehensive coverage',
      'interactive': 'interactive learning and thought-provoking questions',
      'story-based': 'real-world stories and practical case studies',
      'comprehensive': 'balanced approach with multiple learning methods'
    };
    
    const styleDesc = styleApproach[style] || 'comprehensive learning approach';
    
    const descriptions = {
      'beginner': `Step-by-step guidance with simple explanations, practical examples, and ${styleDesc} perfect for beginners.`,
      'intermediate': `Comprehensive coverage of core concepts with real-world applications and ${styleDesc} for intermediate learners.`,
      'advanced': `Deep dive into complex topics with advanced techniques, expert insights, and ${styleDesc} for experienced learners.`,
      'mixed': `Balanced approach covering both fundamental concepts and advanced applications with ${styleDesc} for all levels.`
    };
    
    return descriptions[difficulty] || `Covers essential concepts from your uploaded material with ${difficulty} level depth and ${styleDesc}.`;
  }

  generateLessonTitle(chunks, lessonIndex, userSettings) {
    const difficulty = userSettings.difficulty || 'intermediate';
    const style = userSettings.contentStyle || 'interactive';
    const lessonsPerModule = this.getLessonCountByPace(userSettings.learningPace);
    
    const baseTitles = {
      'beginner': [
        `Getting Started: ${this.getStyleAdjective(style)} Basic Concepts`,
        `Building Foundation: ${this.getStyleAdjective(style)} Core Principles`, 
        `Practical Application: ${this.getStyleAdjective(style)} Implementations`,
        `Putting It Together: ${this.getStyleAdjective(style)} Projects`,
        `Mastering the Basics: ${this.getStyleAdjective(style)} Key Skills`
      ],
      'intermediate': [
        `Core Concepts: ${this.getStyleAdjective(style)} Essential Principles`,
        `Advanced Techniques: ${this.getStyleAdjective(style)} Applications`, 
        `Real-World Implementation: ${this.getStyleAdjective(style)} Case Studies`,
        `Problem Solving: ${this.getStyleAdjective(style)} Scenarios`,
        `Expert Insights: ${this.getStyleAdjective(style)} Best Practices`
      ],
      'advanced': [
        `Expert Insights: ${this.getStyleAdjective(style)} Advanced Theory`,
        `Sophisticated Applications: ${this.getStyleAdjective(style)} Implementations`, 
        `Industry Best Practices: ${this.getStyleAdjective(style)} Standards`,
        `Master Level: ${this.getStyleAdjective(style)} Problem Solving`,
        `Cutting Edge: ${this.getStyleAdjective(style)} Developments`
      ],
      'mixed': [
        `Fundamentals: ${this.getStyleAdjective(style)} Core Concepts`,
        `Intermediate: ${this.getStyleAdjective(style)} Applications`,
        `Advanced: ${this.getStyleAdjective(style)} Scenarios`, 
        `Expert Level: ${this.getStyleAdjective(style)} Optimization`,
        `Comprehensive: ${this.getStyleAdjective(style)} Coverage`
      ]
    };
    
    const titles = baseTitles[difficulty] || baseTitles.intermediate;
    const titleIndex = lessonIndex % titles.length;
    
    if (chunks.length > 0 && chunks[0].topics && chunks[0].topics.length > 0) {
      const topic = chunks[0].topics[lessonIndex % chunks[0].topics.length];
      return `${titles[titleIndex]}: ${topic}`;
    }
    
    return titles[titleIndex] || `Lesson ${lessonIndex + 1}: ${this.getStyleAdjective(style)} Key Concepts`;
  }

  generateFlashcards(chunks, userSettings) {
    const flashcardsNeeded = userSettings.flashcardsPerModule || 4;
    const flashcards = [];
    
    const baseFlashcards = [
      { 
        term: "Core Concept", 
        definition: "Fundamental idea that forms the essential basis for understanding complex topics and their applications" 
      },
      { 
        term: "Practical Application", 
        definition: "Real-world implementation and usage of theoretical knowledge to solve actual problems and create solutions" 
      },
      { 
        term: "Learning Objective", 
        definition: "Specific, measurable goal that guides the educational process and helps assess understanding and progress" 
      },
      { 
        term: "Problem-Solving Framework", 
        definition: "Systematic approach and methodology for analyzing challenges and finding effective solutions using acquired knowledge" 
      }
    ];
    
    for (let i = 0; i < flashcardsNeeded; i++) {
      if (baseFlashcards[i]) {
        flashcards.push(baseFlashcards[i]);
      } else {
        flashcards.push({
          term: `Important Concept ${i + 1}`,
          definition: "Essential knowledge point that contributes to comprehensive understanding of the subject matter"
        });
      }
    }
    
    return flashcards;
  }

  // Create fallback course with proper progress tracking
  createFallbackCourse(userSettings) {
    const totalModules = userSettings.totalModules || 5;
    const fallbackCourse = {
      title: this.generateCourseTitle(userSettings),
      description: this.generateCourseDescription(userSettings, totalModules),
      modules: this.createTemplateModules(1, totalModules, userSettings),
      isFallback: true
    };
    
    console.log(`🔄 Fallback course created with ${fallbackCourse.modules.length} modules`);
    return fallbackCourse;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new CourseGenerator();