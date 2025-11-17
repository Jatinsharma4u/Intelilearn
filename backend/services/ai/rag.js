// services/ai/rag.js - RAG Service for Course Content Retrieval
const Course = require('../../models/Course');
const { ChromaClient } = require('chromadb');

class RAGService {
  constructor() {
    this.chromaClient = null;
    this.chromaAvailable = false;
    this.initializeChroma();
  }

  async initializeChroma() {
    try {
      this.chromaClient = new ChromaClient({ path: "http://localhost:8000" });
      await this.chromaClient.heartbeat();
      this.chromaAvailable = true;
      console.log('✅ ChromaDB RAG initialized');
    } catch (error) {
      console.log('⚠️ ChromaDB not available, using MongoDB fallback');
      this.chromaAvailable = false;
    }
  }

  // Retrieve course content for a topic (RAG or MongoDB fallback)
  async retrieveTopicContent(courseId, topic) {
    try {
      // Try ChromaDB first if available
      if (this.chromaAvailable) {
        try {
          const collection = await this.chromaClient.getOrCreateCollection({
            name: `course_${courseId}`,
            metadata: { courseId }
          });

          const results = await collection.query({
            queryTexts: [topic],
            nResults: 5
          });

          if (results.documents && results.documents[0].length > 0) {
            return {
              source: 'chromadb',
              content: results.documents[0].join('\n\n'),
              metadata: results.metadatas[0] || []
            };
          }
        } catch (chromaError) {
          console.log('⚠️ ChromaDB query failed, using MongoDB fallback');
        }
      }

      // MongoDB fallback - search course content
      const course = await Course.findById(courseId);
      if (!course) {
        throw new Error('Course not found');
      }

      // Extract all content related to the topic
      let topicContent = [];
      
      course.modules.forEach(module => {
        module.lessons.forEach(lesson => {
          // Check lesson content
          if (lesson.content) {
            const contentText = JSON.stringify(lesson.content);
            if (contentText.toLowerCase().includes(topic.toLowerCase())) {
              topicContent.push({
                type: 'lesson_content',
                moduleTitle: module.title,
                lessonTitle: lesson.title,
                content: lesson.content
              });
            }
          }

          // Check quiz questions
          if (lesson.quiz) {
            lesson.quiz.forEach(question => {
              if (question.topic && question.topic.toLowerCase() === topic.toLowerCase()) {
                topicContent.push({
                  type: 'quiz_question',
                  moduleTitle: module.title,
                  lessonTitle: lesson.title,
                  question: question.question,
                  explanation: question.explanation,
                  correctAnswer: question.correctAnswer
                });
              }
            });
          }
        });
      });

      // Build context document
      const contextDocument = this.buildContextDocument(topicContent, topic);

      return {
        source: 'mongodb',
        content: contextDocument,
        metadata: { topicContentCount: topicContent.length }
      };

    } catch (error) {
      console.error('❌ RAG retrieval error:', error);
      throw error;
    }
  }

  // Build context document from course content
  buildContextDocument(topicContent, topic) {
    if (topicContent.length === 0) {
      return `Topic: ${topic}\n\nNo specific content found for this topic in the course.`;
    }

    let document = `Topic: ${topic}\n\n`;
    document += `Course Content Related to "${topic}":\n\n`;

    topicContent.forEach((item, index) => {
      document += `--- Content ${index + 1} ---\n`;
      document += `Module: ${item.moduleTitle}\n`;
      document += `Lesson: ${item.lessonTitle}\n\n`;

      if (item.type === 'lesson_content') {
        const content = item.content;
        if (content.introduction) document += `Introduction: ${content.introduction}\n\n`;
        if (content.detailedExplanation) document += `Explanation: ${content.detailedExplanation}\n\n`;
        if (content.keyConcepts && content.keyConcepts.length > 0) {
          document += `Key Concepts: ${content.keyConcepts.join(', ')}\n\n`;
        }
        if (content.practicalExamples && content.practicalExamples.length > 0) {
          document += `Examples:\n${content.practicalExamples.map(ex => `- ${ex}`).join('\n')}\n\n`;
        }
      } else if (item.type === 'quiz_question') {
        document += `Question: ${item.question}\n`;
        if (item.explanation) document += `Explanation: ${item.explanation}\n`;
        document += `\n`;
      }
    });

    return document;
  }

  // Get course metadata
  async getCourseMetadata(courseId) {
    try {
      const course = await Course.findById(courseId);
      if (!course) {
        throw new Error('Course not found');
      }

      return {
        title: course.title,
        description: course.description,
        settings: course.settings,
        totalModules: course.modules.length,
        totalLessons: course.modules.reduce((acc, m) => acc + m.lessons.length, 0)
      };
    } catch (error) {
      console.error('❌ Get course metadata error:', error);
      throw error;
    }
  }
}

module.exports = new RAGService();

