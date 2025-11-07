// hooks/useCourse.js - UPDATED

import { useState, useContext } from 'react';
import { CourseContext } from '../contexts/CourseContext';

export const useCourse = () => {
  const context = useContext(CourseContext);
  if (!context) {
    throw new Error('useCourse must be used within a CourseProvider');
  }
  return context;
};

// Enhanced progress tracking hook
export const useProgressTracking = () => {
  const [trackingState, setTrackingState] = useState({
    completedLessons: new Set(),
    attemptedQuizzes: new Set(),
    inProgress: false
  });

  const markLessonCompleted = async (courseId, moduleIndex, lessonIndex, timeSpent = 5) => {
    if (trackingState.inProgress) return;
    
    setTrackingState(prev => ({ ...prev, inProgress: true }));
    
    try {
      // Check if already completed locally
      const lessonKey = `${courseId}-${moduleIndex}-${lessonIndex}`;
      if (trackingState.completedLessons.has(lessonKey)) {
        console.log('Lesson already completed');
        return { alreadyCompleted: true };
      }

      // Call backend
      const response = await updateLessonProgress(courseId, moduleIndex, lessonIndex, timeSpent);
      
      if (response.success) {
        // Update local state
        setTrackingState(prev => ({
          ...prev,
          completedLessons: new Set([...prev.completedLessons, lessonKey])
        }));
      }
      
      return response;
    } catch (error) {
      console.error('Error marking lesson completed:', error);
      throw error;
    } finally {
      setTrackingState(prev => ({ ...prev, inProgress: false }));
    }
  };

  const submitQuizAttempt = async (courseId, moduleIndex, answers, timeTaken) => {
    if (trackingState.inProgress) return;
    
    setTrackingState(prev => ({ ...prev, inProgress: true }));
    
    try {
      const quizKey = `${courseId}-${moduleIndex}`;
      
      // Check if already attempted
      if (trackingState.attemptedQuizzes.has(quizKey)) {
        throw new Error('Quiz already attempted. Reset progress to try again.');
      }

      // Call backend
      const response = await submitQuiz(courseId, moduleIndex, answers, timeTaken);
      
      if (response.success) {
        // Update local state
        setTrackingState(prev => ({
          ...prev,
          attemptedQuizzes: new Set([...prev.attemptedQuizzes, quizKey])
        }));
      }
      
      return response;
    } catch (error) {
      console.error('Error submitting quiz:', error);
      throw error;
    } finally {
      setTrackingState(prev => ({ ...prev, inProgress: false }));
    }
  };

  const resetProgress = async (courseId) => {
    try {
      await resetCourseProgress(courseId);
      
      // Clear local state
      setTrackingState({
        completedLessons: new Set(),
        attemptedQuizzes: new Set(),
        inProgress: false
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error resetting progress:', error);
      throw error;
    }
  };

  const isLessonCompleted = (courseId, moduleIndex, lessonIndex) => {
    const lessonKey = `${courseId}-${moduleIndex}-${lessonIndex}`;
    return trackingState.completedLessons.has(lessonKey);
  };

  const isQuizAttempted = (courseId, moduleIndex) => {
    const quizKey = `${courseId}-${moduleIndex}`;
    return trackingState.attemptedQuizzes.has(quizKey);
  };

  return {
    markLessonCompleted,
    submitQuizAttempt,
    resetProgress,
    isLessonCompleted,
    isQuizAttempted,
    trackingState
  };
};