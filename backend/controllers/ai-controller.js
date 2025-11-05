const axios = require('axios');

// Google Gemini API Configuration
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

const extractTextFromPDF = async (fileBuffer) => {
  // PDF text extraction logic (pytesseract/Tesseract.js)
  // ...
  return "Extracted text from PDF";
};

const generateAISummary = async (text) => {
  try {
    const response = await axios.post(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [{
            text: `Summarize this study material in 2-3 paragraphs:\n\n${text}`
          }]
        }]
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error('Gemini API Error:', error);
    throw new Error('AI summarization failed');
  }
};

const generateFlashcards = async (text) => {
  try {
    const response = await axios.post(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [{
            text: `Create 5-10 flashcards (question and answer pairs) from this text in JSON format:\n\n${text}\n\nReturn only valid JSON array: [{"question": "...", "answer": "..."}]`
          }]
        }]
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    const flashcardsText = response.data.candidates[0].content.parts[0].text;
    return JSON.parse(flashcardsText);
  } catch (error) {
    console.error('Gemini API Error:', error);
    throw new Error('Flashcard generation failed');
  }
};

const generateQuizQuestions = async (text) => {
  try {
    const response = await axios.post(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [{
            text: `Generate 5-10 multiple choice questions from this text in JSON format. Include question, options array, correct answer, and explanation:\n\n${text}\n\nReturn only valid JSON array`
          }]
        }]
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    const quizText = response.data.candidates[0].content.parts[0].text;
    return JSON.parse(quizText);
  } catch (error) {
    console.error('Gemini API Error:', error);
    throw new Error('Quiz generation failed');
  }
};

// Export these functions for your routes
module.exports = {
  extractTextFromPDF,
  generateAISummary,
  generateFlashcards,
  generateQuizQuestions
};