const pdfParse = require('pdf-parse');
const geminiService = require('../ai/gemini-service');

class PDFExtractionService {
  constructor() {
    this.supportedFormats = ['pdf', 'txt'];
  }

  async extractTextFromPDF(fileBuffer) {
    try {
      console.log('📄 Extracting text from PDF...');
      
      const data = await pdfParse(fileBuffer);
      const extractedText = data.text;
      
      if (!extractedText || extractedText.trim().length === 0) {
        throw new Error('No text could be extracted from the PDF');
      }
      
      console.log(`✅ PDF extraction successful. Text length: ${extractedText.length} characters`);
      return extractedText;
      
    } catch (error) {
      console.error('❌ PDF extraction failed:', error.message);
      throw new Error(`PDF extraction error: ${error.message}`);
    }
  }

  async processPDFWithAI(fileBuffer, settings) {
    try {
      console.log('🤖 Processing PDF with AI...', settings);
      
      // Extract text from PDF
      const extractedText = await this.extractTextFromPDF(fileBuffer);
      
      // Prepare prompt for AI
      const prompt = this.createQuizGenerationPrompt(extractedText, settings);
      
      // Generate quiz using AI
      const quizData = await geminiService.generateStructuredContent(
        prompt, 
        this.getQuizSchema()
      );
      
      console.log('✅ AI quiz generation successful');
      return {
        extractedText,
        quizData,
        topics: this.extractTopicsFromQuiz(quizData)
      };
      
    } catch (error) {
      console.error('❌ AI PDF processing failed:', error.message);
      throw error;
    }
  }

  createQuizGenerationPrompt(text, settings) {
    const { numQuestions, difficulty, topics, examTime } = settings;
    
    return `
Create a comprehensive quiz based on the following educational content.

CONTENT:
${text.substring(0, 15000)} // Limit text length

REQUIREMENTS:
- Number of questions: ${numQuestions}
- Difficulty level: ${difficulty}
- Exam time: ${examTime} minutes
- Topics to focus on: ${topics?.join(', ') || 'all relevant topics'}

INSTRUCTIONS:
1. Generate multiple choice questions with 4 options each
2. Mark the correct answer clearly
3. Include explanations for each answer
4. Tag each question with relevant topics
5. Vary difficulty according to specified level
6. Ensure questions cover different aspects of the content

FORMAT:
Return valid JSON with questions array containing:
- question text
- options array with text and isCorrect
- correctAnswer
- explanation
- topic
- difficulty
- marks (typically 1 mark per question)
    `;
  }

  getQuizSchema() {
    return {
      type: "object",
      properties: {
        title: { type: "string" },
        description: { type: "string" },
        questions: {
          type: "array",
          items: {
            type: "object",
            properties: {
              question: { type: "string" },
              type: { type: "string", enum: ["multiple_choice"] },
              options: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    text: { type: "string" },
                    isCorrect: { type: "boolean" }
                  }
                }
              },
              correctAnswer: { type: "string" },
              explanation: { type: "string" },
              topic: { type: "string" },
              difficulty: { type: "string", enum: ["easy", "medium", "hard"] },
              marks: { type: "number", default: 1 }
            },
            required: ["question", "options", "correctAnswer", "topic", "difficulty"]
          }
        },
        estimatedTime: { type: "number" },
        totalMarks: { type: "number" }
      },
      required: ["questions"]
    };
  }

  extractTopicsFromQuiz(quizData) {
    const topics = new Set();
    quizData.questions.forEach(question => {
      if (question.topic) {
        topics.add(question.topic);
      }
    });
    return Array.from(topics);
  }
}

module.exports = new PDFExtractionService();