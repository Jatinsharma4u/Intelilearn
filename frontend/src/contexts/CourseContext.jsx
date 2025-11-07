import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const CourseContext = createContext();

export const useCourse = () => {
  const context = useContext(CourseContext);
  if (!context) {
    throw new Error('useCourse must be used within a CourseProvider');
  }
  return context;
};

export const CourseProvider = ({ children }) => {
  const [courses, setCourses] = useState([]);
  const [currentCourse, setCurrentCourse] = useState(null);
  const [userProgress, setUserProgress] = useState({});
  const [learningAnalytics, setLearningAnalytics] = useState(null);
  const [weakTopics, setWeakTopics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  // Fetch user courses with enhanced progress tracking
  const fetchCourses = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const token = await user.getIdToken();
      const response = await fetch('/api/courses', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setCourses(data.courses || []);
        
        // Create progress map from courses
        const progressMap = {};
        data.courses.forEach(course => {
          progressMap[course._id] = {
            overall: course.progress || 0,
            timeSpent: course.learningData?.timeSpent || 0,
            started: course.started || false,
            weakTopics: course.learningData?.weakTopics || []
          };
        });
        setUserProgress(progressMap);
      } else {
        throw new Error('Failed to fetch courses');
      }
    } catch (err) {
      setError('Failed to fetch courses');
      console.error('Error fetching courses:', err);
    } finally {
      setLoading(false);
    }
  };

  // Create new course with enhanced error handling and progress tracking
  const createCourse = async (courseData, files) => {
    if (!user) throw new Error('User not authenticated');

    try {
      setLoading(true);
      setError(null);
      
      const token = await user.getIdToken();
      const formData = new FormData();
      
      // Add course data
      formData.append('title', courseData.title);
      formData.append('settings', JSON.stringify(courseData.settings));
      
      // Add files
      files.forEach(file => {
        formData.append('files', file);
      });

      const response = await fetch('/api/courses/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to create course');
      }

      // Refresh courses list
      await fetchCourses();
      return result.course;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Get course details with enhanced progress tracking
  const getCourse = async (courseId) => {
    if (!user) throw new Error('User not authenticated');

    try {
      setLoading(true);
      const token = await user.getIdToken();
      const response = await fetch(`/api/courses/${courseId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setCurrentCourse(data.course);
        
        // Update user progress with detailed data
        if (data.course.userProgress) {
          setUserProgress(prev => ({
            ...prev,
            [courseId]: data.course.userProgress
          }));
        }
        
        return data.course;
      } else {
        throw new Error('Failed to fetch course');
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Enhanced update lesson progress with UserProgress integration
  const updateLessonProgress = async (courseId, moduleIndex, lessonIndex, timeSpent = 5, notes, bookmarked) => {
    if (!user) return;

    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/courses/${courseId}/modules/${moduleIndex}/lessons/${lessonIndex}/progress`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          timeSpent, 
          completed: true,
          notes, 
          bookmarked 
        }),
      });
      
      if (response.ok) {
        const result = await response.json();
        
        // Update local progress state with enhanced data
        setUserProgress(prev => ({
          ...prev,
          [courseId]: {
            ...prev[courseId],
            overall: result.progress.overall,
            timeSpent: result.userProgress.timeSpent,
            lastActivity: result.userProgress.lastActivity
          }
        }));
        
        // Update current course if active
        if (currentCourse && currentCourse._id === courseId) {
          setCurrentCourse(prev => ({
            ...prev,
            progress: result.progress.overall
          }));
        }
        
        return result;
      } else {
        throw new Error('Failed to update lesson progress');
      }
    } catch (err) {
      console.error('Error updating progress:', err);
      throw err;
    }
  };

  // Enhanced quiz submission with weak topics detection
  const submitQuiz = async (courseId, moduleIndex, answers, timeTaken) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/courses/${courseId}/modules/${moduleIndex}/quiz`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ answers, timeTaken }),
      });
      
      if (response.ok) {
        const result = await response.json();
        
        // Update progress with weak topics
        setUserProgress(prev => ({
          ...prev,
          [courseId]: {
            ...prev[courseId],
            overall: result.overallProgress,
            weakTopics: result.weakTopics || []
          }
        }));

        // Update weak topics globally
        if (result.weakTopics && result.weakTopics.length > 0) {
          setWeakTopics(prev => [...prev, ...result.weakTopics]);
        }
        
        return result;
      } else {
        throw new Error('Failed to submit quiz');
      }
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Update flashcard progress
  const updateFlashcardProgress = async (courseId, moduleIndex, flashcardId, mastered) => {
    if (!user) return;

    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/course-progress/${courseId}/modules/${moduleIndex}/flashcards`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ flashcardId, mastered }),
      });
      
      if (response.ok) {
        const result = await response.json();
        
        // Update local state
        setUserProgress(prev => ({
          ...prev,
          [courseId]: {
            ...prev[courseId],
            flashcardsMastered: result.flashcardsMastered
          }
        }));
        
        return result;
      }
    } catch (err) {
      console.error('Error updating flashcard progress:', err);
      throw err;
    }
  };

  // Get detailed user progress for a course
  const fetchUserProgress = async (courseId) => {
    if (!user) return;

    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/course-progress/${courseId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        
        setUserProgress(prev => ({
          ...prev,
          [courseId]: data.progress
        }));

        if (data.weakTopics) {
          setWeakTopics(data.weakTopics);
        }
        
        return data.progress;
      }
    } catch (err) {
      console.error('Error fetching user progress:', err);
    }
  };

  // Reset progress for a course
  const resetProgress = async (courseId) => {
    if (!user) return;

    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/course-progress/${courseId}/reset`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        // Update local state
        setUserProgress(prev => ({
          ...prev,
          [courseId]: {
            overall: 0,
            timeSpent: 0,
            started: false,
            weakTopics: []
          }
        }));

        // Reset current course if active
        if (currentCourse && currentCourse._id === courseId) {
          setCurrentCourse(prev => ({
            ...prev,
            progress: 0
          }));
        }
        
        return true;
      }
    } catch (err) {
      console.error('Error resetting progress:', err);
      throw err;
    }
  };

  // Fetch comprehensive learning analytics
  const fetchLearningAnalytics = async () => {
    if (!user) return;

    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/course-progress/analytics/overview', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setLearningAnalytics(data);
        return data;
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
    }
  };

  // Get course progress
  const getCourseProgress = (courseId) => {
    return userProgress[courseId]?.overall || 0;
  };

  // Check if course is completed
  const isCourseCompleted = (courseId) => {
    return userProgress[courseId]?.overall >= 95;
  };

  // Get weak topics for a course
  const getWeakTopics = (courseId) => {
    return userProgress[courseId]?.weakTopics || [];
  };

  // Get time spent on a course
  const getTimeSpent = (courseId) => {
    return userProgress[courseId]?.timeSpent || 0;
  };

  // Clear error
  const clearError = () => setError(null);

  // Refresh all data
  const refreshData = async () => {
    await fetchCourses();
    await fetchLearningAnalytics();
  };

  useEffect(() => {
    if (user) {
      fetchCourses();
      fetchLearningAnalytics();
    }
  }, [user]);

  const value = {
    // State
    courses,
    currentCourse,
    userProgress,
    learningAnalytics,
    weakTopics,
    loading,
    error,
    
    // Course Management
    createCourse,
    fetchCourses,
    getCourse,
    
    // Progress Tracking
    updateLessonProgress,
    submitQuiz,
    updateFlashcardProgress,
    getCourseProgress,
    isCourseCompleted,
    getWeakTopics,
    getTimeSpent,
    
    // Enhanced Progress Features
    fetchUserProgress,
    resetProgress,
    fetchLearningAnalytics,
    
    // Utilities
    setError,
    clearError,
    refreshData
  };

  return (
    <CourseContext.Provider value={value}>
      {children}
    </CourseContext.Provider>
  );
};