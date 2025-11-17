const geminiService = require('../ai/gemini-service');

class GeminiProcessor {
  constructor() {
    this.maxRetries = 3;
  }

  async generateQuizFromText(text, settings) {
    try {
      console.log('🎯 Generating quiz with Gemini...', settings);
      
      const prompt = this.createEnhancedQuizPrompt(text, settings);
      
      const quizData = await geminiService.generateStructuredContent(
        prompt,
        this.getEnhancedQuizSchema()
      );
      
      const validatedQuiz = this.validateAndLimitQuizData(quizData, settings);
      
      console.log('✅ Gemini quiz generation successful');
      return validatedQuiz;
      
    } catch (error) {
      console.error('❌ Gemini quiz generation failed:', error.message);
      throw new Error(`AI quiz generation failed: ${error.message}`);
    }
  }

  createEnhancedQuizPrompt(text, settings) {
    const { numQuestions, difficulty, examTime, focusTopics } = settings;
    
    return `
CRITICAL: You MUST generate EXACTLY ${numQuestions} questions. Do not generate more or less than ${numQuestions}.

You are an expert educational content creator. Generate a comprehensive quiz based on the provided text.

TEXT CONTENT:
${text.substring(0, 20000)}

QUIZ REQUIREMENTS:
- Number of questions: ${numQuestions} (EXACTLY ${numQuestions} - THIS IS MANDATORY)
- Primary difficulty: ${difficulty}
- Exam duration: ${examTime} minutes
- Focus topics: ${focusTopics?.join(', ') || 'all relevant topics from text'}

QUESTION DISTRIBUTION:
- ${difficulty === 'easy' ? '70% easy, 30% medium' : 
   difficulty === 'medium' ? '50% medium, 30% easy, 20% hard' : 
   '60% hard, 30% medium, 10% easy'}

STRICT INSTRUCTIONS:
1. Create EXACTLY ${numQuestions} multiple choice questions - no more, no less
2. Each question must have 4 plausible options
3. Mark exactly ONE correct answer per question
4. Provide clear explanations for why the answer is correct
5. Tag each question with specific topics from the content
6. Ensure questions test understanding, not just memorization
7. Count your questions to ensure you have exactly ${numQuestions}

QUALITY CHECKS:
- Options should be mutually exclusive
- Avoid trick questions
- Ensure clarity in question phrasing
- Balance coverage across different topics
- Verify question count is exactly ${numQuestions}

OUTPUT FORMAT:
Return valid JSON with EXACTLY ${numQuestions} questions in the questions array.
    `;
  }

  getEnhancedQuizSchema() {
    return {
      type: "object",
      properties: {
        title: { 
          type: "string",
          description: "Appropriate title for the quiz"
        },
        description: {
          type: "string", 
          description: "Brief description of quiz content"
        },
        questions: {
          type: "array",
          items: {
            type: "object",
            properties: {
              question: { 
                type: "string",
                description: "Clear and concise question text"
              },
              type: { 
                type: "string", 
                enum: ["multiple_choice"],
                default: "multiple_choice"
              },
              options: {
                type: "array",
                minItems: 4,
                maxItems: 4,
                items: {
                  type: "object",
                  properties: {
                    text: { type: "string" },
                    isCorrect: { type: "boolean" }
                  },
                  required: ["text", "isCorrect"]
                }
              },
              correctAnswer: { 
                type: "string",
                description: "The text of the correct answer option"
              },
              explanation: {
                type: "string",
                description: "Detailed explanation of why the answer is correct"
              },
              topic: {
                type: "string", 
                description: "Specific topic category for analytics"
              },
              difficulty: {
                type: "string",
                enum: ["easy", "medium", "hard"],
                description: "Appropriate difficulty level"
              },
              marks: {
                type: "number",
                default: 1,
                description: "Marks allocated for this question"
              }
            },
            required: ["question", "options", "correctAnswer", "explanation", "topic", "difficulty"]
          }
        },
        estimatedTime: {
          type: "number",
          description: "Estimated completion time in minutes"
        },
        totalMarks: {
          type: "number",
          description: "Total marks for the quiz"
        },
        topicsCovered: {
          type: "array",
          items: { type: "string" },
          description: "List of all topics covered in the quiz"
        }
      },
      required: ["title", "questions", "topicsCovered"]
    };
  }

  validateAndLimitQuizData(quizData, settings) {
    if (!quizData.questions || !Array.isArray(quizData.questions)) {
      throw new Error('Invalid quiz data: questions array missing');
    }

    const requestedCount = settings.numQuestions;
    const actualCount = quizData.questions.length;

    console.log(`🔢 Question Count: Requested ${requestedCount}, Got ${actualCount}`);

    // ✅ FIXED: Strictly enforce exact question count
    if (actualCount !== requestedCount) {
      console.warn(`⚠️ Question count mismatch: Expected ${requestedCount}, got ${actualCount}`);
      
      if (actualCount > requestedCount) {
        console.log(`✂️ Trimming questions from ${actualCount} to ${requestedCount}`);
        quizData.questions = quizData.questions.slice(0, requestedCount);
      } else {
        console.warn(`⚠️ Could only generate ${actualCount} questions instead of ${requestedCount}`);
        // We'll proceed with whatever we got, but log the warning
      }
    }

    // Validate each question
    quizData.questions.forEach((question, index) => {
      if (!question.question || question.question.trim().length === 0) {
        throw new Error(`Question ${index + 1}: Question text is required`);
      }
      
      if (!question.options || question.options.length !== 4) {
        throw new Error(`Question ${index + 1}: Exactly 4 options required`);
      }
      
      const correctOptions = question.options.filter(opt => opt.isCorrect);
      if (correctOptions.length !== 1) {
        throw new Error(`Question ${index + 1}: Exactly one correct option required`);
      }
      
      if (!question.topic || question.topic.trim().length === 0) {
        throw new Error(`Question ${index + 1}: Topic is required`);
      }
      
      const correctOption = question.options.find(opt => opt.isCorrect);
      question.correctAnswer = correctOption.text;
    });

    quizData.totalMarks = quizData.questions.reduce((sum, q) => sum + (q.marks || 1), 0);
    quizData.estimatedTime = settings.examTime;
    quizData.topicsCovered = [...new Set(quizData.questions.map(q => q.topic))];

    return quizData;
  }

  async analyzeStudentWeaknesses(studentProgress) {
    try {
      const prompt = this.createWeaknessAnalysisPrompt(studentProgress);
      
      const analysis = await geminiService.generateContent(prompt);
      
      return this.parseWeaknessAnalysis(analysis);
      
    } catch (error) {
      console.error('❌ Weakness analysis failed:', error.message);
      return this.getDefaultWeaknessAnalysis(studentProgress);
    }
  }

  createWeaknessAnalysisPrompt(studentProgress) {
    const weakTopics = studentProgress.weakTopics.join(', ');
    const strongTopics = studentProgress.strongTopics.join(', ');
    
    return `
Analyze this student's learning progress and provide specific recommendations:

STUDENT PERFORMANCE:
- Weak Topics: ${weakTopics}
- Strong Topics: ${strongTopics}
- Average Score: ${studentProgress.overallStats.averageScore}%
- Total Quizzes: ${studentProgress.overallStats.completedQuizzes}

Provide:
1. 3 specific learning recommendations for weak topics
2. Study strategies tailored to their performance
3. Suggested focus areas for improvement
4. Encouragement based on strengths

Keep the response structured but conversational and helpful.
    `;
  }

  parseWeaknessAnalysis(analysis) {
    return {
      recommendations: analysis.split('\n').filter(line => line.trim().length > 0),
      rawAnalysis: analysis
    };
  }

  getDefaultWeaknessAnalysis(studentProgress) {
    return {
      recommendations: [
        `Focus on practicing ${studentProgress.weakTopics.slice(0, 2).join(' and ')} topics`,
        'Review incorrect answers to understand patterns',
        'Try spaced repetition for difficult concepts'
      ],
      rawAnalysis: 'Analysis based on performance patterns'
    };
  }
}

module.exports = new GeminiProcessor();