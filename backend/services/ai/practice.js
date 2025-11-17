// services/ai/practice.js - Practice Agent (Adaptive Question Generator)
const geminiService = require('./gemini-service');
const ragService = require('./rag');

class PracticeAgent {
  constructor() {
    this.agentName = 'Practice Agent';
  }

  // Generate adaptive practice questions
  async generateQuestions(courseId, topic, attemptHistory = [], preferredDifficulty = 'medium') {
    let adaptiveDifficulty = this.calculateAdaptiveDifficulty(attemptHistory, preferredDifficulty);
    
    try {
      console.log(`📝 ${this.agentName}: Generating questions for "${topic}"`);

      // Retrieve context (with fallback)
      let contextData = null;
      let courseMetadata = null;
      
      try {
        contextData = await ragService.retrieveTopicContent(courseId, topic);
      } catch (ragError) {
        console.warn('⚠️ RAG retrieval failed, using fallback:', ragError.message);
        contextData = { source: 'fallback', content: `Topic: ${topic}` };
      }

      try {
        courseMetadata = await ragService.getCourseMetadata(courseId);
      } catch (metaError) {
        console.warn('⚠️ Course metadata retrieval failed, using fallback:', metaError.message);
        courseMetadata = { title: 'Course', description: 'Learning course' };
      }

      // Build prompt
      const prompt = this.buildQuestionPrompt(
        topic,
        contextData.content,
        courseMetadata,
        adaptiveDifficulty,
        attemptHistory
      );

      // Generate questions
      const questions = await geminiService.generateStructuredContent(
        prompt,
        {
          questions: [{
            type: "string", // 'mcq', 'short_answer', 'fill_blank', 'scenario', 'reasoning'
            question: "string",
            options: ["string"], // For MCQ
            correctAnswer: "string",
            explanation: "string",
            difficulty: "string", // 'easy', 'medium', 'hard'
            hint: "string" // Optional hint
          }]
        },
        { temperature: 0.8 }
      );

      // Ensure we have 3-5 questions
      let questionList = questions.questions || [];
      if (questionList.length < 3) {
        // Generate more if needed
        questionList = questionList.concat(this.generateFallbackQuestions(topic, 3 - questionList.length));
      }
      if (questionList.length > 5) {
        questionList = questionList.slice(0, 5);
      }

      // Process and fix questions
      const processedQuestions = questionList.map((q, idx) => {
        // Ensure MCQ has options
        if ((q.type === 'mcq' || !q.type) && (!q.options || q.options.length === 0)) {
          // Generate default options if missing
          q.options = [
            q.correctAnswer || 'Option A',
            'Incorrect option 1',
            'Incorrect option 2',
            'Incorrect option 3'
          ];
        }
        
        // Ensure MCQ has exactly 4 options
        if (q.type === 'mcq' && q.options && q.options.length !== 4) {
          if (q.options.length < 4) {
            // Add more options if less than 4
            while (q.options.length < 4) {
              q.options.push(`Option ${q.options.length + 1}`);
            }
          } else {
            // Take first 4 if more than 4
            q.options = q.options.slice(0, 4);
          }
        }

        return {
          id: `q_${Date.now()}_${idx}`,
          type: q.type || 'mcq',
          question: q.question || `Question about ${topic}`,
          options: q.options || [],
          correctAnswer: q.correctAnswer || q.options?.[0] || 'Answer',
          explanation: q.explanation || '',
          difficulty: q.difficulty || adaptiveDifficulty,
          hint: q.hint || ''
        };
      });

      return {
        success: true,
        topic,
        difficulty: adaptiveDifficulty,
        questions: processedQuestions,
        totalQuestions: processedQuestions.length
      };

    } catch (error) {
      console.error(`❌ ${this.agentName} error:`, error);
      
      // Fallback questions if AI fails
      const fallbackQuestions = this.generateFallbackQuestions(topic, 3);
      return {
        success: true,
        topic,
        difficulty: adaptiveDifficulty,
        questions: fallbackQuestions.map((q, idx) => ({
          id: `q_${Date.now()}_${idx}`,
          type: q.type || 'mcq',
          question: q.question,
          options: q.options || [],
          correctAnswer: q.correctAnswer,
          explanation: q.explanation || '',
          difficulty: q.difficulty || adaptiveDifficulty,
          hint: q.hint || ''
        })),
        totalQuestions: fallbackQuestions.length,
        fallback: true
      };
    }
  }

  // Calculate adaptive difficulty based on performance
  calculateAdaptiveDifficulty(attemptHistory, preferredDifficulty) {
    if (!attemptHistory || attemptHistory.length === 0) {
      return preferredDifficulty;
    }

    const recentAttempts = attemptHistory.slice(-3);
    const avgScore = recentAttempts.reduce((sum, a) => sum + a.score, 0) / recentAttempts.length;

    // If student scores >= 70%, increase difficulty
    if (avgScore >= 0.7) {
      if (preferredDifficulty === 'easy') return 'medium';
      if (preferredDifficulty === 'medium') return 'hard';
      return 'hard';
    }

    // If student scores < 70%, decrease difficulty
    if (avgScore < 0.7) {
      if (preferredDifficulty === 'hard') return 'medium';
      if (preferredDifficulty === 'medium') return 'easy';
      return 'easy';
    }

    return preferredDifficulty;
  }

  // Build question generation prompt
  buildQuestionPrompt(topic, contextContent, courseMetadata, difficulty, attemptHistory) {
    const performanceInfo = attemptHistory.length > 0
      ? `Student's recent performance: ${(attemptHistory[attemptHistory.length - 1].score * 100).toFixed(0)}% average`
      : 'This is the student\'s first attempt';

    return `You are an expert educator creating practice questions for the topic "${topic}".

COURSE CONTEXT:
Course: ${courseMetadata.title}
${contextContent}

STUDENT PERFORMANCE:
${performanceInfo}
Target Difficulty: ${difficulty}

TASK:
Generate 3-5 diverse practice questions about "${topic}" with the following types:
1. Multiple Choice Question (MCQ) - MUST have exactly 4 options in the "options" array
2. Short Answer Question - options array should be empty []
3. Fill in the Blank - options array should be empty []
4. Scenario-based Question - can be MCQ or short answer
5. Reasoning Question - can be MCQ or short answer

IMPORTANT FOR MCQ QUESTIONS:
- "type" must be "mcq"
- "options" array MUST contain exactly 4 strings
- One option must match the "correctAnswer"
- Options should be plausible but only one correct

ADAPTIVE LOGIC:
- If student performance >= 70%: Use ${difficulty === 'easy' ? 'medium' : difficulty === 'medium' ? 'hard' : 'hard'} difficulty
- If student performance < 70%: Use ${difficulty === 'hard' ? 'medium' : difficulty === 'medium' ? 'easy' : 'easy'} difficulty and add hints

For each question:
- Make it relevant to the course content
- Ensure correct answer is clear
- Provide detailed explanation
- Add hints if difficulty is easy or medium
- Vary question types
- For MCQ: ALWAYS include 4 options

Return questions in the specified JSON format. Make sure MCQ questions have exactly 4 options.`;
  }

  // Generate fallback questions if AI fails
  generateFallbackQuestions(topic, count) {
    const questions = [];
    const questionTemplates = [
      {
        type: 'mcq',
        question: `What is a fundamental concept of ${topic}?`,
        options: [
          'Understanding core principles',
          'Memorizing definitions',
          'Avoiding practice',
          'Skipping examples'
        ],
        correctAnswer: 'Understanding core principles',
        explanation: `The fundamental concept of ${topic} involves understanding the core principles rather than just memorizing.`,
        difficulty: 'medium',
        hint: `Think about what makes ${topic} work at its core`
      },
      {
        type: 'mcq',
        question: `Which of the following best describes ${topic}?`,
        options: [
          'A key concept in this course',
          'An unrelated topic',
          'Something to skip',
          'Not important'
        ],
        correctAnswer: 'A key concept in this course',
        explanation: `Correct! ${topic} is an important concept you need to master.`,
        difficulty: 'easy',
        hint: `Consider why ${topic} is in this course`
      },
      {
        type: 'short_answer',
        question: `Explain ${topic} in your own words.`,
        options: [],
        correctAnswer: `${topic} involves key concepts and practical applications.`,
        explanation: `Good! ${topic} is about understanding and applying key concepts.`,
        difficulty: 'medium',
        hint: `Consider the main purpose and application of ${topic}`
      },
      {
        type: 'fill_blank',
        question: `${topic} is important because it helps us understand __________.`,
        options: [],
        correctAnswer: 'key concepts',
        explanation: `Correct! ${topic} helps us understand key concepts in this course.`,
        difficulty: 'easy',
        hint: `Think about what ${topic} helps you learn`
      }
    ];

    for (let i = 0; i < count; i++) {
      const template = questionTemplates[i % questionTemplates.length];
      questions.push({
        ...template,
        question: template.question.replace(/\{topic\}/g, topic)
      });
    }
    return questions;
  }
}

module.exports = new PracticeAgent();

