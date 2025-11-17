const AI_PROMPTS = {
  // Course Generation Prompts
  COURSE_STRUCTURE: (content, settings) => `
Create a comprehensive course structure from the provided educational content.

CONTENT:
${content}

USER SETTINGS:
- Difficulty: ${settings.difficulty}
- Content Type: ${settings.contentType}
- Learning Pace: ${settings.learningPace}
- Total Modules: ${settings.totalModules}
- Lessons per Module: ${settings.lessonsPerModule}

Generate a logical learning progression with:
1. Clear module titles and descriptions
2. Lesson titles that build knowledge progressively
3. Practical applications and examples
4. Assessment points
5. Real-world connections

Return valid JSON with course structure.
`,

  MODULE_GENERATION: (textChunks, moduleInfo, userSettings) => `
Create ${moduleInfo.moduleCount} high-quality educational modules starting from module ${moduleInfo.startModuleNumber}.

SOURCE CONTENT ANALYSIS:
${textChunks}

FOCUS ON THESE KEY ELEMENTS FOR EACH MODULE:

📚 **COMPREHENSIVE CONTENT:**
- Detailed explanations (500-700 words per lesson)
- Important topics and key concepts from source
- Step-by-step breakdown of complex ideas
- Real-world applications and examples
- Notes and key points highlighted

🎯 **LEARNING AIDS:**
- Clear explanations with practical examples
- Common misconceptions addressed
- Memory aids and study tips
- Progressive difficulty building

📝 **ASSESSMENT:**
- ${userSettings.questionsPerTopic} thoughtful quiz questions per lesson
- Questions that test conceptual understanding
- Clear explanations for answers
- Real-world application questions

🃏 **FLASHCARDS:**
- ${userSettings.flashcardsPerModule} key concept flashcards
- Important definitions and formulas
- Critical concepts to remember
- Practical applications

USER PREFERENCES:
- Style: ${userSettings.contentStyle}
- Difficulty: ${userSettings.difficulty}
- Pace: ${userSettings.learningPace}
- Type: ${userSettings.contentType}

GUIDELINES:
1. Use source content extensively
2. Create engaging, educational content
3. Focus on conceptual clarity
4. Include practical examples
5. Build knowledge progressively

Return valid JSON with complete modules including lessons, quizzes, and flashcards.
`,

  // Weakness Analysis Prompts
  WEAKNESS_ANALYSIS: (performanceData) => `
Analyze this learning performance data and identify weaknesses:

${JSON.stringify(performanceData, null, 2)}

Identify:
1. 3-5 specific weak areas with confidence scores
2. Root causes of learning gaps
3. Targeted improvement strategies
4. Priority order for addressing issues
5. Overall performance assessment

Be specific and actionable in your analysis.
`,

  // AI Mentor Chat Prompts
  MENTOR_RESPONSE: (question, context, courseContext) => `
You are an AI Learning Mentor. Answer the student's question using the course context.

STUDENT QUESTION: ${question}

COURSE CONTEXT:
${courseContext}

ADDITIONAL CONTEXT:
${context}

Guidelines:
- Use only provided course materials
- Explain concepts clearly and simply
- Provide examples when helpful
- Be encouraging and supportive
- If context is insufficient, suggest reviewing specific lessons

Provide a helpful, educational response.
`,

  // Daily Boost Task Prompts
  DAILY_BOOST: (weakTopic, userLevel, performanceHistory) => `
Create a 10-minute daily boost task for this weak topic:

TOPIC: ${weakTopic}
USER LEVEL: ${userLevel}
PREVIOUS PERFORMANCE: ${JSON.stringify(performanceHistory)}

Create a micro-lesson with:
1. 2-minute concept refresher
2. 2 practical examples
3. 3 progressive quiz questions
4. 2 key flashcards
5. 1 summary tip

Make it engaging, focused, and effective for quick learning.
`,

  // Quiz Generation Prompts
  QUIZ_GENERATION: (content, options) => `
Create ${options.questionCount} ${options.difficulty}-level quiz questions:

CONTENT:
${content}

Requirements:
- Test conceptual understanding
- Include clear explanations
- Vary question types if possible
- Avoid trick questions
- Make options plausible

Focus on assessing real comprehension.
`,

  // Content Analysis Prompts
  CONTENT_ANALYSIS: (text) => `
Analyze this educational content:

${text}

Provide:
1. Main topics and concepts
2. Difficulty level assessment
3. Key learning objectives
4. Prerequisites needed
5. Estimated teaching time
6. Content quality assessment

Be thorough and objective in your analysis.
`
};

// Export individual prompts for easy access
module.exports = {
  // Course related
  generateCourseStructure: (content, settings) => AI_PROMPTS.COURSE_STRUCTURE(content, settings),
  generateModules: (chunks, moduleInfo, settings) => AI_PROMPTS.MODULE_GENERATION(chunks, moduleInfo, settings),
  generateLessonContent: (outline, source, settings) => AI_PROMPTS.LESSON_CONTENT(outline, source, settings),
  
  // Analytics related
  analyzeWeaknesses: (performanceData) => AI_PROMPTS.WEAKNESS_ANALYSIS(performanceData),
  generateDailyBoost: (topic, level, history) => AI_PROMPTS.DAILY_BOOST(topic, level, history),
  
  // Chat related
  mentorResponse: (question, context, courseContext) => AI_PROMPTS.MENTOR_RESPONSE(question, context, courseContext),
  
  // Assessment related
  generateQuiz: (content, options) => AI_PROMPTS.QUIZ_GENERATION(content, options),
  analyzeContent: (text) => AI_PROMPTS.CONTENT_ANALYSIS(text),
  
  // Complete object for flexibility
  AI_PROMPTS
};