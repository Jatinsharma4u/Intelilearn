import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 30000, // Increased timeout for file uploads
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// ===== COURSE API FUNCTIONS =====

// Get all courses for user
export const getCourses = async () => {
  try {
    const response = await api.get('/courses');
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get single course
export const getCourse = async (courseId) => {
  try {
    const response = await api.get(`/courses/${courseId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Create new course - UPDATED FOR FILE UPLOAD
export const createCourse = async (courseData) => {
  try {
    console.log('📤 Creating course with data:', {
      title: courseData.title,
      hasFile: !!courseData.fileBuffer,
      fileSize: courseData.fileBuffer?.data?.length
    });
    
    const response = await api.post('/courses', courseData);
    return response.data;
  } catch (error) {
    console.error('❌ Course creation API error:', error);
    throw error;
  }
};

// Check course generation status
export const checkGenerationStatus = async (courseId) => {
  try {
    const response = await api.get(`/courses/${courseId}/status`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// ✅ FIXED: MARK LESSON CONTENT COMPLETED
export const markContentCompleted = async (courseId, moduleIndex, lessonIndex) => {
  try {
    const response = await api.put(`/courses/${courseId}/modules/${moduleIndex}/lessons/${lessonIndex}/content-complete`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// ✅ FIXED: SUBMIT QUIZ WITH PROGRESSIVE UNLOCK
export const submitQuiz = async (courseId, moduleIndex, lessonIndex, quizData) => {
  try {
    const response = await api.post(`/courses/${courseId}/modules/${moduleIndex}/lessons/${lessonIndex}/quiz-submit`, quizData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// ✅ FIXED: MARK FLASHCARDS COMPLETED
export const markFlashcardsCompleted = async (courseId, moduleIndex, lessonIndex) => {
  try {
    const response = await api.put(`/courses/${courseId}/modules/${moduleIndex}/lessons/${lessonIndex}/flashcards-complete`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// ✅ FIXED: GET LESSON STATUS
export const getLessonStatus = async (courseId, moduleIndex, lessonIndex) => {
  try {
    const response = await api.get(`/courses/${courseId}/modules/${moduleIndex}/lessons/${lessonIndex}/status`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// ✅ FIXED: RESET LESSON WITH MODULE & LESSON INDICES
export const resetLesson = async (courseId, moduleIndex, lessonIndex) => {
  try {
    const response = await api.put(`/courses/${courseId}/modules/${moduleIndex}/lessons/${lessonIndex}/reset`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Legacy functions for backward compatibility
export const updateLessonProgress = async (courseId, lessonId, progressData) => {
  try {
    const response = await api.put(`/courses/${courseId}/lessons/${lessonId}/progress`, progressData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const submitQuizLegacy = async (courseId, lessonId, quizData) => {
  try {
    const response = await api.post(`/courses/${courseId}/lessons/${lessonId}/quiz`, quizData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get course statistics
export const getCourseStats = async (courseId) => {
  try {
    const response = await api.get(`/courses/${courseId}/stats`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Duplicate course
export const duplicateCourse = async (courseId) => {
  try {
    const response = await api.post(`/courses/${courseId}/duplicate`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Update course
export const updateCourse = async (courseId, courseData) => {
  try {
    const response = await api.put(`/courses/${courseId}`, courseData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Delete course
export const deleteCourse = async (courseId) => {
  try {
    const response = await api.delete(`/courses/${courseId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const courseApi = {
  // Core course functions
  getCourses,
  getCourse,
  createCourse,
  checkGenerationStatus,
  getCourseStats,
  duplicateCourse,
  updateCourse,
  deleteCourse,

  // 🔥 FIXED: Progressive learning flow functions
  markContentCompleted,
  submitQuiz,
  markFlashcardsCompleted,
  getLessonStatus,
  resetLesson,

  // Legacy functions (backward compatibility)
  updateLessonProgress,
  submitQuizLegacy
};

export default courseApi;