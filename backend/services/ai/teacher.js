// services/ai/teacher.js - Teacher Agent (Explanation Generator)
const geminiService = require('./gemini-service');
const ragService = require('./rag');

class TeacherAgent {
  constructor() {
    this.agentName = 'Teacher Agent';
  }

  // Generate explanation for a weak topic
  async explainTopic(courseId, topic, attemptHistory = []) {
    let contextData = null;
    let courseMetadata = null;
    let confusionAnalysis = null;

    try {
      console.log(`📚 ${this.agentName}: Explaining topic "${topic}"`);

      // Retrieve context from RAG (with fallback)
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

      // Analyze student's confusion from attempt history
      confusionAnalysis = this.analyzeConfusion(attemptHistory);

      // Build prompt for explanation
      const prompt = this.buildExplanationPrompt(
        topic,
        contextData.content,
        courseMetadata,
        confusionAnalysis
      );

      // Generate explanation using Gemini
      const explanation = await geminiService.generateStructuredContent(
        prompt,
        {
          simpleDefinition: "string",
          example: "string",
          importance: "string",
          commonMistakes: ["string"],
          keyPoints: ["string"],
          analogies: ["string"]
        },
        { temperature: 0.7 }
      );

      return {
        success: true,
        topic,
        explanation: {
          simpleDefinition: explanation.simpleDefinition || `A clear, simple definition of ${topic}`,
          example: explanation.example || `A practical example related to ${courseMetadata.title}`,
          importance: explanation.importance || `Why ${topic} is important in this course`,
          commonMistakes: explanation.commonMistakes || [],
          keyPoints: explanation.keyPoints || [],
          analogies: explanation.analogies || []
        },
        confusionAnalysis,
        contextSource: contextData.source
      };

    } catch (error) {
      console.error(`❌ ${this.agentName} error:`, error);
      
      // Ensure we have fallback values
      if (!courseMetadata) {
        courseMetadata = { title: 'Course', description: 'Learning course' };
      }
      if (!confusionAnalysis) {
        confusionAnalysis = this.analyzeConfusion(attemptHistory);
      }
      if (!contextData) {
        contextData = { source: 'fallback', content: `Topic: ${topic}` };
      }
      
      // Fallback explanation if AI fails (concise version)
      return {
        success: true,
        topic,
        explanation: {
          simpleDefinition: `${topic} is a key concept that involves understanding core principles and their practical application.`,
          example: `In ${courseMetadata.title}, ${topic} helps connect different ideas and solve problems effectively.`,
          importance: `${topic} is essential as it builds the foundation for advanced learning in this course.`,
          commonMistakes: [
            'Missing the basic principles',
            'Confusing with similar concepts',
            'Not enough practice'
          ],
          keyPoints: [
            'Master the fundamentals first',
            'Practice regularly',
            'Review when stuck'
          ],
          analogies: []
        },
        confusionAnalysis,
        contextSource: contextData.source || 'fallback',
        fallback: true
      };
    }
  }

  // Analyze student confusion from attempt history
  analyzeConfusion(attemptHistory) {
    if (!attemptHistory || attemptHistory.length === 0) {
      return {
        level: 'unknown',
        patterns: [],
        suggestions: ['Start with basic concepts']
      };
    }

    const recentAttempts = attemptHistory.slice(-3);
    const avgScore = recentAttempts.reduce((sum, a) => sum + a.score, 0) / recentAttempts.length;
    
    let confusionLevel = 'low';
    if (avgScore < 0.4) confusionLevel = 'high';
    else if (avgScore < 0.7) confusionLevel = 'medium';

    // Analyze common mistakes
    const mistakes = [];
    recentAttempts.forEach(attempt => {
      attempt.answers?.forEach(answer => {
        if (!answer.isCorrect) {
          mistakes.push({
            question: answer.questionText,
            studentAnswer: answer.studentAnswer,
            correctAnswer: answer.correctAnswer
          });
        }
      });
    });

    return {
      level: confusionLevel,
      averageScore: avgScore,
      patterns: mistakes.slice(0, 3), // Top 3 mistakes
      suggestions: this.getSuggestions(confusionLevel, mistakes)
    };
  }

  getSuggestions(level, mistakes) {
    const suggestions = [];
    
    if (level === 'high') {
      suggestions.push('Focus on fundamental concepts first');
      suggestions.push('Review basic definitions and examples');
      suggestions.push('Practice with simpler questions');
    } else if (level === 'medium') {
      suggestions.push('Review key concepts you missed');
      suggestions.push('Practice more examples');
      suggestions.push('Focus on understanding, not memorization');
    } else {
      suggestions.push('You\'re doing well! Practice advanced concepts');
    }

    return suggestions;
  }

  // Build explanation prompt
  buildExplanationPrompt(topic, contextContent, courseMetadata, confusionAnalysis) {
    return `You are an expert teacher explaining the topic "${topic}" to a student.

COURSE CONTEXT:
Course: ${courseMetadata.title}
Description: ${courseMetadata.description}

RELEVANT COURSE CONTENT:
${contextContent}

STUDENT'S PERFORMANCE:
Confusion Level: ${confusionAnalysis.level}
Average Score: ${(confusionAnalysis.averageScore * 100).toFixed(0)}%
Common Mistakes: ${confusionAnalysis.patterns.length > 0 
  ? confusionAnalysis.patterns.map(p => `- ${p.question}: Student said "${p.studentAnswer}" but correct is "${p.correctAnswer}"`).join('\n')
  : 'None identified yet'}

TASK:
Generate a SHORT, CONCISE explanation of "${topic}" (MAX 200-300 words total):

1. SIMPLE DEFINITION: 2-3 sentences max (50-70 words)
2. PRACTICAL EXAMPLE: 1 clear example related to "${courseMetadata.title}" (40-60 words)
3. IMPORTANCE: Why this topic matters in the course (30-50 words)
4. COMMON MISTAKES: List 2-3 specific mistakes students make (based on mistakes above) (40-60 words)
5. KEY POINTS: 2-3 bullet points to remember (30-40 words)
6. ANALOGIES: 1 simple analogy if helpful (20-30 words)

IMPORTANT:
- Keep TOTAL content under 300 words
- Be concise and direct
- NO markdown formatting (no **, no #, no bold/italic)
- Plain text only
- Focus on clarity, not length
- Address the student's specific confusion patterns

Return the explanation in the specified JSON format with plain text (no markdown).`;
  }
}

module.exports = new TeacherAgent();

