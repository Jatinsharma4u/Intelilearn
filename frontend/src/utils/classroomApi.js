import axios from 'axios';

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/classroom`,
  timeout: 30000,
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
    console.error('Classroom API Error:', error.response?.data || error.message);
    
    // Handle specific error cases
    if (error.response?.status === 401) {
      // Token expired, redirect to login
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

// ===== CLASSROOM API FUNCTIONS =====

export const createClassroom = async (classroomData) => {
  try {
    const response = await api.post('/create', classroomData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to create classroom');
  }
};

export const joinClassroom = async (code) => {
  try {
    const response = await api.post('/join', { code });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to join classroom');
  }
};

export const getTeacherClassrooms = async (page = 1, limit = 10) => {
  try {
    const response = await api.get(`/teacher?page=${page}&limit=${limit}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch teacher classrooms');
  }
};

export const getStudentClassrooms = async (page = 1, limit = 10) => {
  try {
    const response = await api.get(`/student?page=${page}&limit=${limit}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch student classrooms');
  }
};

export const getClassroomDetails = async (classroomId) => {
  try {
    const response = await api.get(`/${classroomId}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch classroom details');
  }
};

export const removeStudent = async (classroomId, studentId) => {
  try {
    const response = await api.delete(`/${classroomId}/students/${studentId}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to remove student');
  }
};

// ===== QUIZ API FUNCTIONS =====

export const createManualQuiz = async (classroomId, quizData) => {
  try {
    const response = await api.post(`/${classroomId}/quizzes/manual`, quizData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to create manual quiz');
  }
};

export const createPDFQuiz = async (classroomId, pdfFile, settings) => {
  try {
    const formData = new FormData();
    formData.append('pdf', pdfFile);
    formData.append('settings', JSON.stringify(settings));

    const response = await api.post(`/${classroomId}/quizzes/pdf`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 60000, // Longer timeout for file upload
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to create PDF quiz');
  }
};

export const getClassroomQuizzes = async (classroomId, filters = {}) => {
  try {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null) {
        params.append(key, filters[key]);
      }
    });

    const response = await api.get(`/${classroomId}/quizzes?${params}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch classroom quizzes');
  }
};

export const getQuizDetails = async (quizId) => {
  try {
    const response = await api.get(`/quizzes/${quizId}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch quiz details');
  }
};

// ===== NEW QUIZ MANAGEMENT FUNCTIONS =====

export const updateQuizStatus = async (quizId, updateData) => {
  try {
    const response = await api.patch(`/quizzes/${quizId}/status`, updateData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to update quiz status');
  }
};

export const deleteQuiz = async (quizId) => {
  try {
    const response = await api.delete(`/quizzes/${quizId}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to delete quiz');
  }
};

export const scheduleQuiz = async (quizId, scheduleData) => {
  try {
    const response = await api.patch(`/quizzes/${quizId}/schedule`, scheduleData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to schedule quiz');
  }
};

// ===== EXAM API FUNCTIONS =====

export const startExam = async (quizId) => {
  try {
    const response = await api.post(`/quizzes/${quizId}/start`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to start exam');
  }
};

export const submitAnswer = async (sessionId, answerData) => {
  try {
    const response = await api.post(`/sessions/${sessionId}/answer`, answerData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to submit answer');
  }
};

export const submitExam = async (sessionId) => {
  try {
    const response = await api.post(`/sessions/${sessionId}/submit`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to submit exam');
  }
};

export const getExamSessionDetails = async (sessionId) => {
  try {
    const response = await api.get(`/sessions/${sessionId}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch exam session details');
  }
};

// ===== ANALYTICS API FUNCTIONS =====

export const getStudentResults = async (classroomId) => {
  try {
    const response = await api.get(`/${classroomId}/student-results`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch student results');
  }
};

export const getClassroomAnalytics = async (classroomId) => {
  try {
    const response = await api.get(`/${classroomId}/analytics`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch classroom analytics');
  }
};

export const exportResults = async (classroomId) => {
  try {
    const response = await api.get(`/${classroomId}/export`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to export results');
  }
};

export const getLeaderboard = async (classroomId) => {
  try {
    const response = await api.get(`/${classroomId}/leaderboard`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch leaderboard');
  }
};

// ✅ NEW: Quiz-specific analytics
export const getQuizAnalytics = async (quizId) => {
  try {
    const response = await api.get(`/quizzes/${quizId}/analytics`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch quiz analytics');
  }
};

export const exportQuizResults = async (quizId) => {
  try {
    const response = await api.get(`/quizzes/${quizId}/export`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to export quiz results');
  }
};

// ===== UTILITY FUNCTIONS =====

export const downloadExportFile = async (classroomId, filename) => {
  try {
    const response = await api.get(`/${classroomId}/export`, {
      responseType: 'blob' // For file downloads
    });
    
    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename || `classroom-results-${classroomId}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    
    return { success: true };
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to download export file');
  }
};

export const validateClassroomCode = async (code) => {
  try {
    // This would typically call a validation endpoint
    // For now, we'll just check format
    const codeRegex = /^[A-Z0-9]{6}$/;
    return codeRegex.test(code);
  } catch (error) {
    return false;
  }
};

const classroomApi = {
  // Classroom management
  createClassroom,
  joinClassroom,
  getTeacherClassrooms,
  getStudentClassrooms,
  getClassroomDetails,
  removeStudent,

  // Quiz management
  createManualQuiz,
  createPDFQuiz,
  getClassroomQuizzes,
  getQuizDetails,
  updateQuizStatus,
  deleteQuiz,
  scheduleQuiz,

  // Exam management
  startExam,
  submitAnswer,
  submitExam,
  getExamSessionDetails,

  // Analytics
  getStudentResults,
  getClassroomAnalytics,
  exportResults,
  getLeaderboard,
  getQuizAnalytics,
  exportQuizResults,

  // Utilities
  downloadExportFile,
  validateClassroomCode
};

export default classroomApi;