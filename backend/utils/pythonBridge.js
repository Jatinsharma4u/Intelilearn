const axios = require('axios');

const PYTHON_SERVICE_URL = 'http://localhost:5001';

// Test Python connection
const testPythonConnection = async () => {
  try {
    const response = await axios.get(`${PYTHON_SERVICE_URL}/python/health`);
    return {
      success: true,
      message: 'Python service is connected',
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      message: `Python service connection failed: ${error.message}`
    };
  }
};

// Call Python service for text extraction
const extractTextWithPython = async (files) => {
  try {
    const response = await axios.post(`${PYTHON_SERVICE_URL}/python/extract-text`, {
      files: files
    });
    return response.data;
  } catch (error) {
    throw new Error(`Text extraction failed: ${error.message}`);
  }
};

// Call Python service for course generation
const generateCourseWithPython = async (extractedTexts, settings, courseId) => {
  try {
    const response = await axios.post(`${PYTHON_SERVICE_URL}/python/generate-course`, {
      extracted_texts: extractedTexts,
      settings: settings,
      course_id: courseId
    });
    return response.data;
  } catch (error) {
    throw new Error(`Course generation failed: ${error.message}`);
  }
};

module.exports = {
  testPythonConnection,
  extractTextWithPython,
  generateCourseWithPython
};