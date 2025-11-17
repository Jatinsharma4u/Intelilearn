// src/hooks/useAnalytics.js - COMPLETELY FIXED
import { useState, useEffect } from 'react';
import { analyticsApi } from '../utils/analyticsApi';

export const useAnalytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Get course analytics with better error handling
  const fetchCourseAnalytics = async (courseId) => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Fetching analytics for course:', courseId);
      
      const response = await analyticsApi.getCourseAnalytics(courseId);
      
      if (response.data.success) {
        console.log('✅ Analytics received:', response.data.analytics);
        setAnalytics(response.data.analytics);
        return response.data.analytics;
      } else {
        throw new Error(response.data.message || 'Failed to fetch analytics');
      }
    } catch (err) {
      console.error('❌ Analytics fetch error:', err);
      const errorMessage = err.response?.data?.message || 'Failed to fetch analytics';
      setError(errorMessage);
      
      // Return default analytics
      const defaultAnalytics = {
        quizzesAttempted: 0,
        accuracy: '0%',
        averageAccuracy: 0,
        averageSpeed: 0,
        totalTimeSpent: '0m',
        totalTimeSpentSeconds: 0,
        totalQuizTime: '0m',
        lastActive: new Date(),
        daysSinceStart: 0,
        isEmpty: true
      };
      setAnalytics(defaultAnalytics);
      return defaultAnalytics;
    } finally {
      setLoading(false);
    }
  };

  // Record quiz attempt
  const recordQuizAttempt = async (attemptData) => {
    try {
      console.log('🎯 Recording quiz attempt:', attemptData);
      const response = await analyticsApi.recordQuizAttempt(attemptData);
      
      if (response.data.success) {
        console.log('✅ Quiz attempt recorded successfully');
        // Refresh analytics
        if (attemptData.courseId) {
          await fetchCourseAnalytics(attemptData.courseId);
        }
        return response.data;
      } else {
        throw new Error(response.data.message || 'Failed to record quiz attempt');
      }
    } catch (err) {
      console.error('❌ Failed to record quiz attempt:', err);
      const errorMessage = err.response?.data?.message || 'Failed to record quiz attempt';
      throw new Error(errorMessage);
    }
  };

  // Update time spent
  const updateTimeSpent = async (courseId, timeSpent) => {
    try {
      console.log('⏰ Updating time spent:', { courseId, timeSpent });
      const response = await analyticsApi.updateTimeSpent(courseId, timeSpent);
      
      if (response.data.success) {
        console.log('✅ Time updated successfully');
        // Refresh analytics
        await fetchCourseAnalytics(courseId);
        return response.data;
      }
    } catch (err) {
      console.error('❌ Failed to update time:', err);
      // Don't throw error for time updates - they're not critical
    }
  };

  // Get quiz history
  const fetchQuizHistory = async (courseId) => {
    try {
      const response = await analyticsApi.getQuizHistory(courseId);
      return response.data.quizHistory || [];
    } catch (err) {
      console.error('Failed to fetch quiz history:', err);
      return [];
    }
  };

  return {
    analytics,
    loading,
    error,
    fetchCourseAnalytics,
    recordQuizAttempt,
    updateTimeSpent,
    fetchQuizHistory
  };
};