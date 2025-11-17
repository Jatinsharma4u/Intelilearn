// services/ai/tutor-agent.js - Main Tutor Agent Orchestrator (OPTIMIZED - Single API Call)
const geminiService = require('./gemini-service');
const ragService = require('./rag');
const assessorAgent = require('./evaluator');
const WeakTopic = require('../../models/WeakTopic');

class TutorAgent {
  constructor() {
    this.agentName = 'Tutor Agent';
    this.lastApiCallTime = 0;
    this.MIN_API_INTERVAL = 35000; // 35 seconds between API calls
  }

  // Start a topic improvement session - OPTIMIZED: Single API call for both explanation and questions
  async startTopicSession(courseId, userId, topic, preferredDifficulty = 'medium') {
    try {
      console.log(`🎓 ${this.agentName}: Starting session for topic "${topic}"`);

      // Get weak topic data
      const weakTopic = await WeakTopic.findOne({ courseId, userId, topic });
      if (!weakTopic) {
        throw new Error('Weak topic not found');
      }

      const attemptHistory = weakTopic.attemptHistory || [];

      // Rate limiting: Wait if needed
      await this.ensureRateLimit();

      // ✅ SINGLE API CALL: Generate both explanation AND questions together
      console.log('🚀 Generating explanation + questions in single API call...');
      
      const combinedResult = await this.generateCombinedContent(
        courseId,
        topic,
        attemptHistory,
        preferredDifficulty
      );

      return {
        success: true,
        sessionId: `session_${Date.now()}`,
        topic,
        explanation: combinedResult.explanation,
        questions: combinedResult.questions,
        difficulty: combinedResult.difficulty,
        attemptHistory: attemptHistory.slice(-5),
        masteryStatus: weakTopic.getMasteryStatus()
      };

    } catch (error) {
      console.error(`❌ ${this.agentName} start session error:`, error);
      throw error;
    }
  }

  // Generate both explanation and questions in a single API call
  async generateCombinedContent(courseId, topic, attemptHistory, preferredDifficulty) {
    try {
      // Retrieve context from RAG
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

      // Analyze confusion
      const confusionAnalysis = this.analyzeConfusion(attemptHistory);
      const adaptiveDifficulty = this.calculateAdaptiveDifficulty(attemptHistory, preferredDifficulty);

      // Build combined prompt
      const combinedPrompt = this.buildCombinedPrompt(
        topic,
        contextData.content,
        courseMetadata,
        confusionAnalysis,
        adaptiveDifficulty,
        attemptHistory
      );

      // Generate both explanation and questions in ONE API call
      const result = await geminiService.generateStructuredContent(
        combinedPrompt,
        {
          explanation: {
            simpleDefinition: "string",
            example: "string",
            importance: "string",
            commonMistakes: ["string"],
            keyPoints: ["string"],
            analogies: ["string"]
          },
          questions: [{
            type: "string",
            question: "string",
            options: ["string"],
            correctAnswer: "string",
            explanation: "string",
            difficulty: "string",
            hint: "string"
          }]
        },
        { temperature: 0.7 }
      );

      // Process questions
      let questionList = result.questions || [];
      if (questionList.length < 3) {
        // Add fallback questions if needed
        questionList = questionList.concat(this.generateFallbackQuestions(topic, 3 - questionList.length));
      }
      if (questionList.length > 5) {
        questionList = questionList.slice(0, 5);
      }

      // Process and fix questions
      const processedQuestions = questionList.map((q, idx) => {
        // Ensure MCQ has options
        if ((q.type === 'mcq' || !q.type) && (!q.options || q.options.length === 0)) {
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
            while (q.options.length < 4) {
              q.options.push(`Option ${q.options.length + 1}`);
            }
          } else {
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
        explanation: result.explanation || {
          simpleDefinition: `${topic} is a key concept that involves understanding core principles.`,
          example: `In ${courseMetadata.title}, ${topic} helps solve problems effectively.`,
          importance: `${topic} is essential for building a strong foundation.`,
          commonMistakes: ['Missing basic principles', 'Confusing with similar concepts'],
          keyPoints: ['Master fundamentals', 'Practice regularly'],
          analogies: []
        },
        questions: processedQuestions,
        difficulty: adaptiveDifficulty
      };

    } catch (error) {
      console.error('❌ Combined content generation failed:', error);
      // Return fallback content
      return {
        explanation: {
          simpleDefinition: `${topic} is an important concept in this course.`,
          example: `Understanding ${topic} helps you apply knowledge effectively.`,
          importance: `Mastering ${topic} builds a strong foundation for advanced learning.`,
          commonMistakes: ['Not practicing enough', 'Skipping basics'],
          keyPoints: ['Focus on fundamentals', 'Practice regularly'],
          analogies: []
        },
        questions: this.generateFallbackQuestions(topic, 3),
        difficulty: preferredDifficulty
      };
    }
  }

  // Build combined prompt for explanation + questions
  buildCombinedPrompt(topic, contextContent, courseMetadata, confusionAnalysis, difficulty, attemptHistory) {
    const performanceInfo = attemptHistory.length > 0
      ? `Student's recent performance: ${(attemptHistory[attemptHistory.length - 1].score * 100).toFixed(0)}% average`
      : 'This is the student\'s first attempt';

    return `You are an expert AI tutor helping a student understand "${topic}".

COURSE CONTEXT:
Course: ${courseMetadata.title}
Description: ${courseMetadata.description}

RELEVANT COURSE CONTENT:
${contextContent}

STUDENT'S PERFORMANCE:
Confusion Level: ${confusionAnalysis.level}
Average Score: ${(confusionAnalysis.averageScore * 100).toFixed(0)}%
${performanceInfo}
Target Difficulty: ${difficulty}

TASK:
Generate BOTH:
1. A comprehensive explanation of "${topic}" (MAX 300 words total)
2. 3-5 practice questions about "${topic}"

EXPLANATION REQUIREMENTS (Keep TOTAL under 300 words):
- SIMPLE DEFINITION: 2-3 sentences (50-70 words)
- PRACTICAL EXAMPLE: 1 clear example (40-60 words)
- IMPORTANCE: Why this matters (30-50 words)
- COMMON MISTAKES: 2-3 specific mistakes (40-60 words)
- KEY POINTS: 2-3 bullet points (30-40 words)
- ANALOGIES: 1 simple analogy if helpful (20-30 words)

QUESTION REQUIREMENTS:
Generate 3-5 diverse practice questions:
- Multiple Choice Questions (MCQ) - MUST have exactly 4 options
- Short Answer Questions
- Fill in the Blank
- Scenario-based Questions
- Reasoning Questions

For MCQ questions:
- "type" must be "mcq"
- "options" array MUST contain exactly 4 strings
- One option must match "correctAnswer"
- Options should be plausible but only one correct

For each question:
- Make it relevant to the course content
- Ensure correct answer is clear
- Provide detailed explanation
- Add hints if difficulty is easy or medium
- Match the target difficulty: ${difficulty}

Return the response in the specified JSON format with both "explanation" and "questions" fields.`;
  }

  // Analyze confusion from attempt history
  analyzeConfusion(attemptHistory) {
    if (!attemptHistory || attemptHistory.length === 0) {
      return {
        level: 'unknown',
        averageScore: 0.5,
        patterns: [],
        suggestions: ['Start with basic concepts']
      };
    }

    const recentAttempts = attemptHistory.slice(-3);
    const avgScore = recentAttempts.reduce((sum, a) => sum + a.score, 0) / recentAttempts.length;
    
    let confusionLevel = 'low';
    if (avgScore < 0.4) confusionLevel = 'high';
    else if (avgScore < 0.7) confusionLevel = 'medium';

    return {
      level: confusionLevel,
      averageScore: avgScore,
      patterns: [],
      suggestions: []
    };
  }

  // Calculate adaptive difficulty
  calculateAdaptiveDifficulty(attemptHistory, preferredDifficulty) {
    if (!attemptHistory || attemptHistory.length === 0) {
      return preferredDifficulty;
    }

    const recentAttempts = attemptHistory.slice(-3);
    const avgScore = recentAttempts.reduce((sum, a) => sum + a.score, 0) / recentAttempts.length;

    if (avgScore >= 0.7) {
      if (preferredDifficulty === 'easy') return 'medium';
      if (preferredDifficulty === 'medium') return 'hard';
      return 'hard';
    }

    if (avgScore < 0.7) {
      if (preferredDifficulty === 'hard') return 'medium';
      if (preferredDifficulty === 'medium') return 'easy';
      return 'easy';
    }

    return preferredDifficulty;
  }

  // Generate fallback questions
  generateFallbackQuestions(topic, count) {
    const questions = [];
    const templates = [
      {
        type: 'mcq',
        question: `What is a fundamental concept of ${topic}?`,
        options: ['Understanding core principles', 'Memorizing definitions', 'Avoiding practice', 'Skipping examples'],
        correctAnswer: 'Understanding core principles',
        explanation: `The fundamental concept of ${topic} involves understanding the core principles.`,
        difficulty: 'medium',
        hint: `Think about what makes ${topic} work at its core`
      },
      {
        type: 'mcq',
        question: `Which of the following best describes ${topic}?`,
        options: ['A key concept in this course', 'An unrelated topic', 'Something to skip', 'Not important'],
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
      }
    ];

    for (let i = 0; i < count; i++) {
      const template = templates[i % templates.length];
      questions.push({
        id: `q_fallback_${Date.now()}_${i}`,
        ...template,
        question: template.question.replace(/\{topic\}/g, topic)
      });
    }
    return questions;
  }

  // Ensure rate limiting - wait 35 seconds between API calls
  async ensureRateLimit() {
    const now = Date.now();
    const timeSinceLastCall = now - this.lastApiCallTime;
    
    if (timeSinceLastCall < this.MIN_API_INTERVAL) {
      const waitTime = this.MIN_API_INTERVAL - timeSinceLastCall;
      console.log(`⏳ Rate limiting: Waiting ${Math.round(waitTime / 1000)} seconds before API call...`);
      await this.sleep(waitTime);
    }
    
    this.lastApiCallTime = Date.now();
  }

  // Helper sleep function
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Evaluate student answers and update weak topic
  async evaluateAndUpdate(courseId, userId, topic, questions, studentAnswers, timeSpent = 0) {
    try {
      console.log(`✅ ${this.agentName}: Evaluating answers for "${topic}"`);

      // Step 1: Assessor Agent - Evaluate answers
      const evaluation = await assessorAgent.evaluateAnswers(questions, studentAnswers);

      // Step 2: Update WeakTopic with attempt
      const weakTopic = await WeakTopic.findOne({ courseId, userId, topic });
      if (!weakTopic) {
        throw new Error('Weak topic not found');
      }

      // Prepare attempt data
      const attemptData = {
        score: evaluation.finalScore,
        totalQuestions: questions.length,
        correctAnswers: evaluation.correctAnswers,
        timeSpent,
        answers: evaluation.evaluations.map(evaluationItem => ({
          questionId: evaluationItem.questionId,
          questionText: evaluationItem.questionText,
          studentAnswer: evaluationItem.studentAnswer,
          correctAnswer: evaluationItem.correctAnswer,
          isCorrect: evaluationItem.isCorrect,
          explanation: evaluationItem.explanation
        }))
      };

      // Add attempt to history
      weakTopic.addAttempt(attemptData);
      await weakTopic.save();

      // Check if mastered
      const masteryStatus = weakTopic.getMasteryStatus();
      let shouldRemove = false;

      if (masteryStatus.isMastered && masteryStatus.masteryScore >= 0.8) {
        weakTopic.isReviewed = true;
        weakTopic.reviewedAt = new Date();
        await weakTopic.save();
        shouldRemove = true;
      }

      return {
        success: true,
        evaluation: {
          finalScore: evaluation.finalScore,
          totalQuestions: evaluation.totalQuestions,
          correctAnswers: evaluation.correctAnswers,
          summary: evaluation.summary,
          evaluations: evaluation.evaluations
        },
        masteryStatus,
        isMastered: masteryStatus.isMastered,
        shouldRemove,
        message: masteryStatus.isMastered 
          ? `🎉 Congratulations! You've mastered "${topic}"!`
          : `Keep practicing! Your mastery score is ${(masteryStatus.masteryScore * 100).toFixed(0)}%`
      };

    } catch (error) {
      console.error(`❌ ${this.agentName} evaluate error:`, error);
      throw error;
    }
  }

  // Get topic progress
  async getTopicProgress(courseId, userId, topic) {
    try {
      const weakTopic = await WeakTopic.findOne({ courseId, userId, topic });
      if (!weakTopic) {
        return {
          success: false,
          message: 'Weak topic not found'
        };
      }

      return {
        success: true,
        topic,
        masteryStatus: weakTopic.getMasteryStatus(),
        attemptHistory: weakTopic.attemptHistory || [],
        totalQuestions: weakTopic.totalQuestions,
        wrongAnswers: weakTopic.wrongAnswers,
        weaknessScore: weakTopic.weaknessScore
      };

    } catch (error) {
      console.error(`❌ ${this.agentName} get progress error:`, error);
      throw error;
    }
  }
}

module.exports = new TutorAgent();
