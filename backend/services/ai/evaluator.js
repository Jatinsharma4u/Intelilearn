// services/ai/evaluator.js - Assessor Agent (Answer Evaluator)
const geminiService = require('./gemini-service');

class AssessorAgent {
  constructor() {
    this.agentName = 'Assessor Agent';
  }

  // Evaluate student answers
  async evaluateAnswers(questions, studentAnswers) {
    try {
      console.log(`✅ ${this.agentName}: Evaluating ${studentAnswers.length} answers`);

      const evaluations = [];
      let totalScore = 0;

      for (let i = 0; i < questions.length; i++) {
        const question = questions[i];
        const studentAnswer = studentAnswers[i] || '';

        const evaluation = await this.evaluateSingleAnswer(
          question,
          studentAnswer
        );

        evaluations.push(evaluation);
        totalScore += evaluation.score;
      }

      const finalScore = evaluations.length > 0 ? totalScore / evaluations.length : 0;

      return {
        success: true,
        evaluations,
        finalScore: Math.round(finalScore * 100) / 100, // Round to 2 decimals
        totalQuestions: questions.length,
        correctAnswers: evaluations.filter(e => e.isCorrect).length,
        summary: this.generateSummary(evaluations, finalScore)
      };

    } catch (error) {
      console.error(`❌ ${this.agentName} error:`, error);
      throw error;
    }
  }

  // Evaluate a single answer
  async evaluateSingleAnswer(question, studentAnswer) {
    try {
      // For MCQ, simple comparison
      if (question.type === 'mcq') {
        const isCorrect = studentAnswer.trim().toLowerCase() === question.correctAnswer.trim().toLowerCase();
        return {
          questionId: question.id,
          questionText: question.question,
          studentAnswer,
          correctAnswer: question.correctAnswer,
          isCorrect,
          score: isCorrect ? 1.0 : 0.0,
          explanation: isCorrect 
            ? question.explanation || 'Correct!'
            : question.explanation || `The correct answer is: ${question.correctAnswer}`
        };
      }

      // For other types, use AI evaluation
      const prompt = this.buildEvaluationPrompt(question, studentAnswer);
      
      const evaluation = await geminiService.generateStructuredContent(
        prompt,
        {
          isCorrect: "boolean",
          score: "number", // 0.0 to 1.0
          explanation: "string",
          feedback: "string"
        },
        { temperature: 0.3 }
      );

      return {
        questionId: question.id,
        questionText: question.question,
        studentAnswer,
        correctAnswer: question.correctAnswer,
        isCorrect: evaluation.isCorrect || false,
        score: Math.max(0, Math.min(1, evaluation.score || 0)), // Clamp between 0-1
        explanation: evaluation.explanation || question.explanation || '',
        feedback: evaluation.feedback || ''
      };

    } catch (error) {
      console.error('❌ Single answer evaluation error:', error);
      // Fallback: simple comparison
      return {
        questionId: question.id,
        questionText: question.question,
        studentAnswer,
        correctAnswer: question.correctAnswer,
        isCorrect: false,
        score: 0.0,
        explanation: question.explanation || 'Evaluation error occurred'
      };
    }
  }

  // Build evaluation prompt
  buildEvaluationPrompt(question, studentAnswer) {
    return `You are an expert assessor evaluating a student's answer.

QUESTION:
${question.question}

TYPE: ${question.type}

CORRECT ANSWER:
${question.correctAnswer}

STUDENT'S ANSWER:
${studentAnswer}

TASK:
Evaluate the student's answer and provide:
1. isCorrect: true if the answer is correct or mostly correct, false otherwise
2. score: A number between 0.0 and 1.0 representing how correct the answer is
   - 1.0 = Perfectly correct
   - 0.7-0.9 = Mostly correct with minor issues
   - 0.4-0.6 = Partially correct
   - 0.1-0.3 = Mostly incorrect but shows some understanding
   - 0.0 = Completely incorrect
3. explanation: A brief explanation of why the answer is correct/incorrect
4. feedback: Constructive feedback to help the student improve

Be fair and encouraging. Give partial credit for partial understanding.

Return the evaluation in JSON format.`;
  }

  // Generate summary
  generateSummary(evaluations, finalScore) {
    const correctCount = evaluations.filter(e => e.isCorrect).length;
    const totalCount = evaluations.length;
    const percentage = Math.round((finalScore * 100));

    if (percentage >= 80) {
      return `Excellent! You scored ${percentage}% (${correctCount}/${totalCount} correct). Great job!`;
    } else if (percentage >= 60) {
      return `Good effort! You scored ${percentage}% (${correctCount}/${totalCount} correct). Keep practicing!`;
    } else {
      return `You scored ${percentage}% (${correctCount}/${totalCount} correct). Review the explanations and try again!`;
    }
  }
}

module.exports = new AssessorAgent();

