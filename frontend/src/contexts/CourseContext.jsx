import React, { createContext, useContext, useState, useEffect } from 'react';
import { courseApi } from '../utils/courseApi';
import { uploadApi } from '../utils/uploadApi';

const CourseContext = createContext();

export const useCourses = () => {
  const context = useContext(CourseContext);
  if (!context) {
    throw new Error('useCourses must be used within a CourseProvider');
  }
  return context;
};

export const CourseProvider = ({ children }) => {
  const [courses, setCourses] = useState([]);
  const [currentCourse, setCurrentCourse] = useState(null);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [generationStatus, setGenerationStatus] = useState({});

  // Fetch all courses for the user - ONLY COMPLETED COURSES
  const fetchCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await courseApi.getCourses();
      if (response.success) {
        // 🔥 ONLY show courses that are completed (not generating or failed)
        const completedCourses = response.courses.filter(course => 
          course.generationStatus === 'completed' && !course.isGenerating
        );
        setCourses(completedCourses);
        console.log(`📚 Loaded ${completedCourses.length} completed courses`);
      } else {
        setError(response.message || 'Failed to fetch courses');
      }
    } catch (err) {
      console.error('Fetch courses error:', err);
      setError(err.response?.data?.message || 'Failed to fetch courses');
    } finally {
      setLoading(false);
    }
  };

  // Fetch single course details
  const fetchCourse = async (courseId) => {
    try {
      setLoading(true);
      setError(null);
      const response = await courseApi.getCourse(courseId);
      if (response.success) {
        setCurrentCourse(response.course);
        console.log(`📖 Loaded course: ${response.course.title}`);
        return response.course;
      } else {
        setError(response.message || 'Failed to fetch course');
        return null;
      }
    } catch (err) {
      console.error('Fetch course error:', err);
      setError(err.response?.data?.message || 'Failed to fetch course');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // 🔥 FIXED: Get specific lesson with proper error handling
  const getLesson = (moduleIndex, lessonIndex) => {
    if (!currentCourse || 
        !currentCourse.modules || 
        !currentCourse.modules[moduleIndex] || 
        !currentCourse.modules[moduleIndex].lessons || 
        !currentCourse.modules[moduleIndex].lessons[lessonIndex]) {
      return null;
    }
    return currentCourse.modules[moduleIndex].lessons[lessonIndex];
  };

  // 🔥 FIXED: Set current lesson with validation
  const setCurrentLessonByIndices = (moduleIndex, lessonIndex) => {
    const lesson = getLesson(moduleIndex, lessonIndex);
    if (lesson) {
      setCurrentLesson({
        ...lesson,
        moduleIndex,
        lessonIndex
      });
      return true;
    }
    return false;
  };

  // Upload file and create course - UPDATED FOR AI GENERATION
  const createCourse = async (file, courseData) => {
    try {
      setLoading(true);
      setError(null);
      setUploadProgress(0);
      
      console.log('🚀 Starting course creation with AI generation...');
      
      // Upload file and start course generation
      const response = await uploadApi.uploadFile(file, courseData, (progress) => {
        setUploadProgress(progress);
      });
      
      if (response.success && response.courseId) {
        console.log(`✅ Course creation started: ${response.courseId}`);
        
        // Start polling for status
        pollCourseGeneration(response.courseId, courseData.title);
        
        return response;
      } else {
        setError(response.message || 'Failed to create course');
        return null;
      }
    } catch (err) {
      console.error('Create course error:', err);
      setError(err.message || 'Failed to create course');
      return null;
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  // 🔥 IMPROVED POLLING: Check course generation status
  const pollCourseGeneration = async (courseId, courseTitle) => {
    const maxAttempts = 60; // 5 minutes maximum (5 seconds × 60)
    let attempts = 0;
    
    console.log(`🔄 Starting polling for course: ${courseTitle}`);
    
    const checkStatus = async () => {
      try {
        const statusResponse = await courseApi.checkGenerationStatus(courseId);
        
        if (statusResponse.success) {
          console.log(`📊 Course status: ${statusResponse.status}, Generating: ${statusResponse.isGenerating}`);
          
          if (statusResponse.status === 'completed' && statusResponse.hasContent) {
            // 🔥 Generation complete - fetch and add to courses list
            const completedCourse = await fetchCourse(courseId);
            
            if (completedCourse) {
              setCourses(prev => [completedCourse, ...prev]);
              console.log(`✅ Course "${courseTitle}" added to list with ${completedCourse.modules.length} modules`);
            }
            
            return;
          } else if (statusResponse.status === 'failed') {
            console.error(`❌ Course generation failed: ${courseTitle}`);
            setError(`Course "${courseTitle}" generation failed. Please try again.`);
            return;
          }
        }
        
        // Continue polling
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(checkStatus, 5000); // Check every 5 seconds
        } else {
          console.error(`⏰ Course generation timeout: ${courseTitle}`);
          setError(`Course "${courseTitle}" generation is taking longer than expected. Please check back later.`);
        }
      } catch (err) {
        console.error('Status check error:', err);
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(checkStatus, 5000);
        }
      }
    };
    
    // Start polling after 3 seconds
    setTimeout(checkStatus, 3000);
  };

  // 🔥 FIXED: MARK LESSON CONTENT COMPLETED
  const markContentCompleted = async (courseId, moduleIndex, lessonIndex) => {
    try {
      setLoading(true);
      const response = await courseApi.markContentCompleted(courseId, moduleIndex, lessonIndex);
      
      if (response.success) {
        // Update current course state
        setCurrentCourse(prev => {
          if (!prev || prev._id !== courseId) return prev;
          
          const updatedModules = [...prev.modules];
          if (updatedModules[moduleIndex] && updatedModules[moduleIndex].lessons[lessonIndex]) {
            updatedModules[moduleIndex].lessons[lessonIndex].contentCompleted = true;
            updatedModules[moduleIndex].lessons[lessonIndex].contentCompletedAt = new Date();
          }
          
          return { ...prev, modules: updatedModules };
        });
        
        // Update current lesson state
        setCurrentLesson(prev => prev ? {
          ...prev,
          contentCompleted: true,
          contentCompletedAt: new Date()
        } : null);
        
        return response;
      }
      return null;
    } catch (err) {
      console.error('Mark content completed error:', err);
      setError(err.response?.data?.message || 'Failed to mark content as completed');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // 🔥 FIXED: SUBMIT QUIZ AND UNLOCK FLASHCARDS
  const submitQuizAndUnlockFlashcards = async (courseId, moduleIndex, lessonIndex, quizData) => {
    try {
      setLoading(true);
      const response = await courseApi.submitQuiz(courseId, moduleIndex, lessonIndex, quizData);
      
      if (response.success) {
        // Update current course state
        setCurrentCourse(prev => {
          if (!prev || prev._id !== courseId) return prev;
          
          const updatedModules = [...prev.modules];
          if (updatedModules[moduleIndex] && updatedModules[moduleIndex].lessons[lessonIndex]) {
            const lesson = updatedModules[moduleIndex].lessons[lessonIndex];
            
            lesson.quizCompleted = true;
            lesson.quizCompletedAt = new Date();
            lesson.quizScore = response.score;
            lesson.timeSpent = (lesson.timeSpent || 0) + (quizData.totalTime || 0);
          }
          
          return { ...prev, modules: updatedModules };
        });
        
        // Update current lesson state
        setCurrentLesson(prev => prev ? {
          ...prev,
          quizCompleted: true,
          quizCompletedAt: new Date(),
          quizScore: response.score
        } : null);
        
        return response;
      }
      return null;
    } catch (err) {
      console.error('Submit quiz error:', err);
      setError(err.response?.data?.message || 'Failed to submit quiz');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // 🔥 FIXED: MARK FLASHCARDS COMPLETED AND UNLOCK NEXT
  const markFlashcardsCompleted = async (courseId, moduleIndex, lessonIndex) => {
    try {
      setLoading(true);
      const response = await courseApi.markFlashcardsCompleted(courseId, moduleIndex, lessonIndex);
      
      if (response.success) {
        // Update current course state
        setCurrentCourse(prev => {
          if (!prev || prev._id !== courseId) return prev;
          
          const updatedModules = [...prev.modules];
          if (updatedModules[moduleIndex] && updatedModules[moduleIndex].lessons[lessonIndex]) {
            const lesson = updatedModules[moduleIndex].lessons[lessonIndex];
            
            lesson.flashcardsCompleted = true;
            lesson.flashcardsCompletedAt = new Date();
            
            // If all components completed, mark lesson as complete
            if (lesson.contentCompleted && lesson.quizCompleted && lesson.flashcardsCompleted) {
              lesson.completed = true;
              lesson.completedAt = new Date();
            }
            
            // Unlock next lesson if applicable
            if (response.nextLessonUnlocked && response.nextLessonId) {
              const nextLessonIndex = lessonIndex + 1;
              if (updatedModules[moduleIndex].lessons[nextLessonIndex]) {
                updatedModules[moduleIndex].lessons[nextLessonIndex].locked = false;
              }
            }
            
            // Unlock next module if applicable
            if (response.nextModuleUnlocked) {
              const nextModuleIndex = moduleIndex + 1;
              if (updatedModules[nextModuleIndex] && updatedModules[nextModuleIndex].lessons[0]) {
                updatedModules[nextModuleIndex].lessons[0].locked = false;
              }
            }
          }
          
          return { ...prev, modules: updatedModules };
        });
        
        // Update current lesson state
        setCurrentLesson(prev => prev ? {
          ...prev,
          flashcardsCompleted: true,
          flashcardsCompletedAt: new Date(),
          completed: response.lessonCompleted
        } : null);
        
        return response;
      }
      return null;
    } catch (err) {
      console.error('Mark flashcards completed error:', err);
      setError(err.response?.data?.message || 'Failed to mark flashcards as completed');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // 🔥 FIXED: GET LESSON STATUS
  const getLessonStatus = async (courseId, moduleIndex, lessonIndex) => {
    try {
      const response = await courseApi.getLessonStatus(courseId, moduleIndex, lessonIndex);
      return response;
    } catch (err) {
      console.error('Get lesson status error:', err);
      return null;
    }
  };

  // 🔥 FIXED: RESET LESSON COMPLETELY
  const resetLesson = async (courseId, moduleIndex, lessonIndex) => {
    try {
      setLoading(true);
      const response = await courseApi.resetLesson(courseId, moduleIndex, lessonIndex);
      
      if (response.success) {
        // Update current course state
        setCurrentCourse(prev => {
          if (!prev || prev._id !== courseId) return prev;
          
          const updatedModules = [...prev.modules];
          if (updatedModules[moduleIndex] && updatedModules[moduleIndex].lessons[lessonIndex]) {
            const lesson = updatedModules[moduleIndex].lessons[lessonIndex];
            
            // Reset all completion flags
            lesson.contentCompleted = false;
            lesson.quizCompleted = false;
            lesson.flashcardsCompleted = false;
            lesson.completed = false;
            lesson.quizScore = 0;
            lesson.completedAt = null;
            lesson.contentCompletedAt = null;
            lesson.quizCompletedAt = null;
            lesson.flashcardsCompletedAt = null;
            
            // Reset flashcards mastery
            if (lesson.flashcards) {
              lesson.flashcards = lesson.flashcards.map(flashcard => ({
                ...flashcard,
                mastered: false
              }));
            }
          }
          
          return { ...prev, modules: updatedModules };
        });
        
        // Update current lesson state
        setCurrentLesson(prev => prev ? {
          ...prev,
          contentCompleted: false,
          quizCompleted: false,
          flashcardsCompleted: false,
          completed: false,
          quizScore: 0
        } : null);
        
        return true;
      }
      return false;
    } catch (err) {
      console.error('Reset lesson error:', err);
      setError(err.response?.data?.message || 'Failed to reset lesson');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // 🔥 FIXED: Check if user can proceed to next step
  const canProceedToQuiz = (moduleIndex, lessonIndex) => {
    const lesson = getLesson(moduleIndex, lessonIndex);
    return lesson && lesson.contentCompleted && !lesson.quizCompleted;
  };

  const canProceedToFlashcards = (moduleIndex, lessonIndex) => {
    const lesson = getLesson(moduleIndex, lessonIndex);
    return lesson && lesson.contentCompleted && lesson.quizCompleted && !lesson.flashcardsCompleted;
  };

  const canProceedToNextLesson = (moduleIndex, lessonIndex) => {
    const lesson = getLesson(moduleIndex, lessonIndex);
    return lesson && lesson.contentCompleted && lesson.quizCompleted && lesson.flashcardsCompleted;
  };

  const clearError = () => setError(null);

  // Clear current course and lesson when unmounting
  useEffect(() => {
    return () => {
      setCurrentCourse(null);
      setCurrentLesson(null);
    };
  }, []);

  const value = {
    // State
    courses,
    currentCourse,
    currentLesson,
    loading,
    error,
    uploadProgress,
    generationStatus,
    
    // Course management
    fetchCourses,
    fetchCourse,
    createCourse,
    
    // 🔥 FIXED: Progressive learning flow functions
    getLesson,
    setCurrentLessonByIndices,
    markContentCompleted,
    submitQuizAndUnlockFlashcards,
    markFlashcardsCompleted,
    getLessonStatus,
    resetLesson,
    
    // 🔥 FIXED: Progress validation helpers
    canProceedToQuiz,
    canProceedToFlashcards,
    canProceedToNextLesson,
    
    // Utility
    clearError,
    setCurrentCourse
  };

  return (
    <CourseContext.Provider value={value}>
      {children}
    </CourseContext.Provider>
  );
};

export default CourseContext;