// src/utils/analyticsApi.js - COMPLETELY FIXED
import { api } from './api';

export const analyticsApi = {
  // Get course analytics
  getCourseAnalytics: (courseId) => 
    api.get(`/analytics/course/${courseId}`),
  
  // Get all user analytics
  getUserAnalytics: () => 
    api.get('/analytics/my-analytics'),
  
  // Record quiz attempt
  recordQuizAttempt: (data) => 
    api.post('/analytics/quiz-attempt', data),
  
  // Update time spent
  updateTimeSpent: (courseId, timeSpent) => 
    api.post('/analytics/update-time', { courseId, timeSpent }),
  
  // Get quiz history
  getQuizHistory: (courseId) => 
    api.get(`/analytics/quiz-history/${courseId}`),
  
  // Debug endpoint
  debugAnalytics: (courseId) =>
    api.get(`/analytics/debug/${courseId}`)
};