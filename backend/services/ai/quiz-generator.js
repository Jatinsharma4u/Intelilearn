// services/ai/quiz-generator.js
const geminiService = require('./gemini-service');

class QuizGenerator {
  async generateQuiz(lessonContent, options = {}) {
    const {
      questionCount = 5,
      difficulty = 'medium',
      questionTypes = ['mcq'],
      includeExplanations = true
    } = options;

    try {
      console.log(`🎯 Generating ${questionCount} ${difficulty} quiz questions...`);
      
      const prompt = this.buildQuizPrompt(lessonContent, {
        questionCount,
        difficulty,
        questionTypes,
        includeExplanations
      });
      
      const quiz = await geminiService.generateStructuredContent(prompt, {});
      
      console.log(`✅ Quiz generated: ${quiz.questions.length} questions`);
      return quiz;
    } catch (error) {
      console.error('❌ Quiz generation failed:', error);
      throw new Error(`Quiz generation failed: ${error.message}`);
    }
  }

  buildQuizPrompt(lessonContent, options) {
    const { questionCount, difficulty, questionTypes, includeExplanations } = options;
    
    const questionTypeDescriptions = {
      mcq: 'multiple-choice questions with 4 options',
      tf: 'true/false questions',
      fill: 'fill-in-the-blank questions',
      short: 'short answer questions (1-2 sentences)'
    };
    
    const selectedTypes = questionTypes.map(type => questionTypeDescriptions[type] || type);
    
    return `
      Create a ${difficulty}-level quiz based on this lesson content:
      
      LESSON CONTENT:
      ${lessonContent.substring(0, 4000)}
      
      REQUIREMENTS:
      - ${questionCount} questions total
      - Question types: ${selectedTypes.join(', ')}
      - ${includeExplanations ? 'Include detailed explanations for answers' : 'No explanations needed'}
      - Test conceptual understanding, not just facts
      - Vary question difficulty within ${difficulty} range
      - Avoid trick questions
      - Make options plausible but distinct
      
      Return JSON:
      {
        "questions": [
          {
            "type": "mcq|tf|fill|short",
            "question": "Clear question text",
            "options": ["Option A", "Option B", "Option C", "Option D"], // For MCQ/TF
            "correctAnswer": "Correct answer or option",
            "explanation": "${includeExplanations ? 'Detailed explanation' : ''}",
            "difficulty": "easy|medium|hard",
            "conceptTested": "Specific concept or skill",
            "timeEstimate": 30 // seconds to answer
          }
        ],
        "summary": {
          "totalQuestions": ${questionCount},
          "estimatedTime": 0, // Will calculate
          "difficultyBreakdown": {"easy": 0, "medium": 0, "hard": 0}
        }
      }
    `;
  }

  async generateFlashcards(lessonContent, count = 5) {
    const prompt = `
      Create ${count} key concept flashcards from this lesson content:
      
      CONTENT:
      ${lessonContent.substring(0, 3000)}
      
      Focus on:
      - Important definitions
      - Key concepts
      - Formulas or rules
      - Critical processes
      
      Make flashcards clear, concise, and educational.
      
      Return JSON:
      {
        "flashcards": [
          {
            "term": "Key term or concept",
            "definition": "Clear definition with context",
            "category": "definition|concept|formula|process",
            "importance": "high|medium|low"
          }
        ]
      }
    `;
    
    return await geminiService.generateStructuredContent(prompt, {});
  }

  async generatePracticeExercises(lessonContent, exerciseCount = 2) {
    const prompt = `
      Create ${exerciseCount} practical exercises based on this lesson:
      
      LESSON CONTENT:
      ${lessonContent.substring(0, 4000)}
      
      Create exercises that:
      - Apply theoretical knowledge
      - Develop practical skills
      - Include clear instructions
      - Have sample solutions or approaches
      - Vary in difficulty
      
      Return JSON:
      {
        "exercises": [
          {
            "title": "Exercise title",
            "description": "Clear instructions",
            "objectives": ["objective1", "objective2"],
            "difficulty": "beginner|intermediate|advanced",
            "estimatedTime": 15, // minutes
            "materials": ["material1", "material2"], // if any
            "steps": ["step1", "step2", "step3"], // optional
            "solution": "Expected solution or approach",
            "tips": ["tip1", "tip2"]
          }
        ]
      }
    `;
    
    return await geminiService.generateStructuredContent(prompt, {});
  }

  // Adaptive quiz generation based on performance
  async generateAdaptiveQuiz(weakTopics, performanceHistory, questionCount = 8) {
    const prompt = `
      Create an adaptive quiz focusing on these weak areas:
      
      WEAK TOPICS: ${weakTopics.join(', ')}
      
      PERFORMANCE HISTORY:
      ${JSON.stringify(performanceHistory, null, 2)}
      
      Generate ${questionCount} questions that:
      - Target identified weak areas
      - Gradually increase difficulty
      - Include reinforcement of related strong areas
      - Provide building blocks for complex concepts
      
      Return JSON with questions that help build confidence while addressing gaps.
    `;
    
    return await geminiService.generateStructuredContent(prompt, {});
  }

  // Validate quiz quality
  validateQuiz(quiz) {
    const issues = [];
    
    if (!quiz.questions || !Array.isArray(quiz.questions)) {
      issues.push('Invalid quiz structure: missing questions array');
      return { isValid: false, issues };
    }
    
    quiz.questions.forEach((q, index) => {
      if (!q.question || q.question.length < 10) {
        issues.push(`Question ${index + 1}: Question text too short`);
      }
      
      if (q.type === 'mcq' && (!q.options || q.options.length !== 4)) {
        issues.push(`Question ${index + 1}: MCQ should have exactly 4 options`);
      }
      
      if (!q.correctAnswer) {
        issues.push(`Question ${index + 1}: Missing correct answer`);
      }
      
      if (q.difficulty && !['easy', 'medium', 'hard'].includes(q.difficulty)) {
        issues.push(`Question ${index + 1}: Invalid difficulty level`);
      }
    });
    
    return {
      isValid: issues.length === 0,
      issues,
      questionCount: quiz.questions.length,
      estimatedTime: quiz.questions.reduce((sum, q) => sum + (q.timeEstimate || 30), 0)
    };
  }
}

module.exports = new QuizGenerator();