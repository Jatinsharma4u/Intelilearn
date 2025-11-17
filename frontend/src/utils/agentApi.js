// src/utils/agentApi.js
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Get auth token
const getAuthToken = () => {
  return localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
};

// Generic API call function with authentication
const apiCall = async (endpoint, options = {}) => {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = getAuthToken();
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Add authorization header if token exists
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (options.body) {
      config.body = JSON.stringify(options.body);
    }

    console.log(`🔗 API Call: ${url}`, { 
      method: options.method || 'GET',
      hasToken: !!token,
      body: options.body 
    });

    const response = await fetch(url, config);
    
    // Handle unauthorized
    if (response.status === 401) {
      throw new Error('Access denied. No token provided or token expired.');
    }

    let data;
    try {
      data = await response.json();
    } catch (parseError) {
      throw new Error(`Invalid JSON response: ${parseError.message}`);
    }

    if (!response.ok) {
      throw new Error(data.error || data.message || `HTTP error! status: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error(`❌ API call failed for ${endpoint}:`, error);
    throw error;
  }
};

// Agent API Service
export const agentApi = {
  // ==================== TUTOR AGENT ENDPOINTS ====================
  
  // Start a new tutoring session
  startSession: async (sessionData) => {
    return apiCall('/tutor/session/start', {
      method: 'POST',
      body: sessionData
    });
  },

  // Get next step in tutoring session
  getNextStep: async (sessionData) => {
    return apiCall('/tutor/session/next', {
      method: 'POST',
      body: sessionData
    });
  },

  // Submit answer for assessment
  submitAnswer: async (answerData) => {
    return apiCall('/tutor/session/answer', {
      method: 'POST',
      body: answerData
    });
  },

  // End tutoring session
  endSession: async (sessionId) => {
    return apiCall(`/tutor/session/${sessionId}/end`, {
      method: 'POST'
    });
  },

  // Get session analytics
  getSessionAnalytics: async (sessionId) => {
    return apiCall(`/tutor/session/${sessionId}/analytics`);
  },

  // Initialize RAG for course
  initRAG: async (courseId) => {
    return apiCall(`/tutor/${courseId}/init-rag`, {
      method: 'POST'
    });
  },

  // Get tutor recommendations
  getRecommendations: async (userId, courseId = null) => {
    const params = new URLSearchParams();
    if (courseId) params.append('courseId', courseId);
    
    return apiCall(`/tutor/recommendations/${userId}?${params}`);
  },

  // Health check
  healthCheck: async () => {
    return apiCall('/tutor/health');
  },

  // ==================== WEAK TOPICS ENDPOINTS ====================
  
  // Analyze quiz results and identify weak topics
  analyzeQuiz: async (quizData) => {
    return apiCall('/weak-topics/analyze-quiz', {
      method: 'POST',
      body: quizData
    });
  },

  // Get user's weak topics
  getUserWeakTopics: async (userId, courseId = null, limit = 10, category = 'all') => {
    const params = new URLSearchParams({ userId, limit, category });
    if (courseId) params.append('courseId', courseId);
    
    return apiCall(`/weak-topics/user-weak-topics?${params}`);
  },

  // Get weak topics for specific course
  getCourseWeakTopics: async (courseId, userId, includeRecommendations = true) => {
    const params = new URLSearchParams({ 
      userId, 
      includeRecommendations: includeRecommendations.toString() 
    });
    
    return apiCall(`/weak-topics/course/${courseId}/weak-topics?${params}`);
  },

  // Get AI recommendations for improvement
  getWeakTopicRecommendations: async (userId, courseId = null, priority = 'all', limit = 10) => {
    const params = new URLSearchParams({ userId, priority, limit });
    if (courseId) params.append('courseId', courseId);
    
    return apiCall(`/weak-topics/recommendations?${params}`);
  },

  // Mark topic as improved
  markTopicImproved: async (topicId, userId, confidence = 0.9) => {
    return apiCall(`/weak-topics/topic/${topicId}/improved`, {
      method: 'PUT',
      body: { userId, confidence }
    });
  },

  // Reset topic progress
  resetTopic: async (topicId, userId) => {
    return apiCall(`/weak-topics/topic/${topicId}/reset`, {
      method: 'PUT',
      body: { userId }
    });
  },

  // Get weakness analytics
  getWeaknessAnalytics: async (userId, timeRange = 'all') => {
    const params = new URLSearchParams({ userId, timeRange });
    return apiCall(`/weak-topics/analytics?${params}`);
  },

  // Get critical weak topics
  getCriticalTopics: async (userId, courseId = null, limit = 5) => {
    const params = new URLSearchParams({ userId, limit });
    if (courseId) params.append('courseId', courseId);
    
    return apiCall(`/weak-topics/critical-topics?${params}`);
  },

  // Get improvement timeline for topic
  getTopicTimeline: async (topicId, userId) => {
    const params = new URLSearchParams({ userId });
    return apiCall(`/weak-topics/topic/${topicId}/timeline?${params}`);
  }
};

// Agent Types and Constants
export const AGENT_TYPES = {
  TEACHER: 'teacher',
  PRACTICE: 'practice', 
  ASSESSOR: 'assessor',
  SYSTEM: 'system'
};

export const SESSION_STEPS = {
  EXPLANATION: 'explanation',
  PRACTICE: 'practice',
  ASSESSMENT: 'assessment',
  MASTERED: 'mastered'
};

export default agentApi;