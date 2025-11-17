import React, { createContext, useContext, useReducer, useEffect } from 'react';
import classroomApi from '../utils/classroomApi';

const ClassroomContext = createContext();

const classroomReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'SET_TEACHER_CLASSROOMS':
      return { ...state, teacherClassrooms: action.payload };
    
    case 'SET_STUDENT_CLASSROOMS':
      return { ...state, studentClassrooms: action.payload };
    
    case 'SET_CURRENT_CLASSROOM':
      return { ...state, currentClassroom: action.payload };
    
    case 'SET_CLASSROOM_QUIZZES':
      return { ...state, classroomQuizzes: action.payload };
    
    case 'SET_STUDENT_RESULTS':
      return { ...state, studentResults: action.payload };
    
    case 'SET_CLASSROOM_ANALYTICS':
      return { ...state, classroomAnalytics: action.payload };
    
    case 'SET_ACTIVE_EXAM':
      return { ...state, activeExam: action.payload };
    
    case 'SET_QUIZ_DETAILS':
      return { ...state, quizDetails: action.payload };
    
    case 'SET_EXAM_SESSION_DETAILS':
      return { ...state, examSessionDetails: action.payload };
    
    case 'SET_LEADERBOARD':
      return { ...state, leaderboard: action.payload };
    
    case 'SET_QUIZ_ANALYTICS':
      return { ...state, quizAnalytics: action.payload };
    
    case 'ADD_CLASSROOM':
      return {
        ...state,
        teacherClassrooms: {
          ...state.teacherClassrooms,
          classrooms: [action.payload, ...state.teacherClassrooms.classrooms]
        }
      };
    
    case 'ADD_QUIZ':
      return {
        ...state,
        classroomQuizzes: {
          ...state.classroomQuizzes,
          quizzes: [action.payload, ...state.classroomQuizzes.quizzes]
        }
      };
    
    case 'UPDATE_QUIZ':
      return {
        ...state,
        classroomQuizzes: {
          ...state.classroomQuizzes,
          quizzes: state.classroomQuizzes.quizzes.map(quiz =>
            quiz._id === action.payload._id ? action.payload : quiz
          )
        }
      };
    
    case 'REMOVE_QUIZ':
      return {
        ...state,
        classroomQuizzes: {
          ...state.classroomQuizzes,
          quizzes: state.classroomQuizzes.quizzes.filter(quiz =>
            quiz._id !== action.payload
          )
        }
      };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    
    case 'CLEAR_STATE':
      return {
        ...initialState,
        teacherClassrooms: state.teacherClassrooms,
        studentClassrooms: state.studentClassrooms
      };
    
    default:
      return state;
  }
};

const initialState = {
  loading: false,
  error: null,
  teacherClassrooms: { classrooms: [], pagination: {} },
  studentClassrooms: { classrooms: [], pagination: {} },
  currentClassroom: null,
  classroomQuizzes: { quizzes: [], pagination: {} },
  studentResults: null,
  classroomAnalytics: null,
  activeExam: null,
  quizDetails: null,
  examSessionDetails: null,
  leaderboard: null,
  quizAnalytics: null
};

export const ClassroomProvider = ({ children }) => {
  const [state, dispatch] = useReducer(classroomReducer, initialState);

  // Classroom Actions
  const createClassroom = async (classroomData) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      const response = await classroomApi.createClassroom(classroomData);
      dispatch({ type: 'ADD_CLASSROOM', payload: response.classroom });
      
      return response;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw new Error(errorMessage);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const joinClassroom = async (code) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      const response = await classroomApi.joinClassroom(code);
      // Refresh student classrooms after joining
      await fetchStudentClassrooms();
      
      return response;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw new Error(errorMessage);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const fetchTeacherClassrooms = async (page = 1, limit = 10) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      const response = await classroomApi.getTeacherClassrooms(page, limit);
      dispatch({ type: 'SET_TEACHER_CLASSROOMS', payload: response });
      
      return response;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw new Error(errorMessage);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const fetchStudentClassrooms = async (page = 1, limit = 10) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      const response = await classroomApi.getStudentClassrooms(page, limit);
      dispatch({ type: 'SET_STUDENT_CLASSROOMS', payload: response });
      
      return response;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw new Error(errorMessage);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const fetchClassroomDetails = async (classroomId) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      const response = await classroomApi.getClassroomDetails(classroomId);
      dispatch({ type: 'SET_CURRENT_CLASSROOM', payload: response.classroom });
      
      return response;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw new Error(errorMessage);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // ✅ ADDED: Remove student from classroom
  const removeStudent = async (classroomId, studentId) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      const response = await classroomApi.removeStudent(classroomId, studentId);
      
      // Update current classroom if it's the same one
      if (currentClassroom && currentClassroom._id === classroomId) {
        dispatch({ type: 'SET_CURRENT_CLASSROOM', payload: response.classroom });
      }
      
      return response;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw new Error(errorMessage);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Quiz Actions
  const createManualQuiz = async (classroomId, quizData) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      const response = await classroomApi.createManualQuiz(classroomId, quizData);
      dispatch({ type: 'ADD_QUIZ', payload: response.quiz });
      
      return response;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw new Error(errorMessage);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const createPDFQuiz = async (classroomId, pdfFile, settings) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      const response = await classroomApi.createPDFQuiz(classroomId, pdfFile, settings);
      dispatch({ type: 'ADD_QUIZ', payload: response.quiz });
      
      return response;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw new Error(errorMessage);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const fetchClassroomQuizzes = async (classroomId, filters = {}) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      const response = await classroomApi.getClassroomQuizzes(classroomId, filters);
      dispatch({ type: 'SET_CLASSROOM_QUIZZES', payload: response });
      
      return response;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw new Error(errorMessage);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const fetchQuizDetails = async (quizId) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      const response = await classroomApi.getQuizDetails(quizId);
      dispatch({ type: 'SET_QUIZ_DETAILS', payload: response.quiz });
      
      return response;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw new Error(errorMessage);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // ✅ FIXED: Quiz Status Management Functions
  const updateQuizStatus = async (quizId, updateData) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      const response = await classroomApi.updateQuizStatus(quizId, updateData);
      dispatch({ type: 'UPDATE_QUIZ', payload: response.quiz });
      
      return response;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw new Error(errorMessage);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const deleteQuiz = async (quizId) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      await classroomApi.deleteQuiz(quizId);
      dispatch({ type: 'REMOVE_QUIZ', payload: quizId });
      
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw new Error(errorMessage);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const scheduleQuiz = async (quizId, scheduleData) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      const response = await classroomApi.scheduleQuiz(quizId, scheduleData);
      dispatch({ type: 'UPDATE_QUIZ', payload: response.quiz });
      
      return response;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw new Error(errorMessage);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // ✅ FIXED: Simple status update functions
  const publishQuiz = async (quizId) => {
    return await updateQuizStatus(quizId, { status: 'active' });
  };

  const unpublishQuiz = async (quizId) => {
    return await updateQuizStatus(quizId, { status: 'draft' });
  };

  const startQuizNow = async (quizId) => {
    return await updateQuizStatus(quizId, { status: 'active' });
  };

  const endQuiz = async (quizId) => {
    return await updateQuizStatus(quizId, { status: 'ended' });
  };

  // Exam Actions
  const startExam = async (quizId) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      const response = await classroomApi.startExam(quizId);
      dispatch({ type: 'SET_ACTIVE_EXAM', payload: response.session });
      
      return response;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw new Error(errorMessage);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const submitAnswer = async (sessionId, answerData) => {
    try {
      dispatch({ type: 'SET_ERROR', payload: null });
      
      const response = await classroomApi.submitAnswer(sessionId, answerData);
      return response;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw new Error(errorMessage);
    }
  };

  const submitExam = async (sessionId) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      const response = await classroomApi.submitExam(sessionId);
      dispatch({ type: 'SET_ACTIVE_EXAM', payload: null });
      
      return response;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw new Error(errorMessage);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const fetchExamSessionDetails = async (sessionId) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      const response = await classroomApi.getExamSessionDetails(sessionId);
      // Store the exam session details properly
      dispatch({ type: 'SET_EXAM_SESSION_DETAILS', payload: response.examSession || response });
      
      return response;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw new Error(errorMessage);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Analytics Actions
  const fetchStudentResults = async (classroomId) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      const response = await classroomApi.getStudentResults(classroomId);
      dispatch({ type: 'SET_STUDENT_RESULTS', payload: response });
      
      return response;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw new Error(errorMessage);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const fetchClassroomAnalytics = async (classroomId) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      const response = await classroomApi.getClassroomAnalytics(classroomId);
      dispatch({ type: 'SET_CLASSROOM_ANALYTICS', payload: response.analytics });
      
      return response;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw new Error(errorMessage);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const exportClassroomResults = async (classroomId) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      const response = await classroomApi.exportResults(classroomId);
      return response;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw new Error(errorMessage);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // ✅ NEW: Quiz-specific analytics
  const fetchQuizAnalytics = async (quizId) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      const response = await classroomApi.getQuizAnalytics(quizId);
      dispatch({ type: 'SET_QUIZ_ANALYTICS', payload: response.analytics });
      
      return response;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw new Error(errorMessage);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const exportQuizResults = async (quizId) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      const response = await classroomApi.exportQuizResults(quizId);
      return response;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw new Error(errorMessage);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const downloadExportFile = async (classroomId, filename) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      await classroomApi.downloadExportFile(classroomId, filename);
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw new Error(errorMessage);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const fetchLeaderboard = async (classroomId) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      const response = await classroomApi.getLeaderboard(classroomId);
      dispatch({ type: 'SET_LEADERBOARD', payload: response.leaderboard });
      
      return response;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw new Error(errorMessage);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Utility Actions
  const clearError = () => {
    dispatch({ type: 'SET_ERROR', payload: null });
  };

  const setCurrentClassroom = (classroom) => {
    dispatch({ type: 'SET_CURRENT_CLASSROOM', payload: classroom });
  };

  const clearCurrentClassroom = () => {
    dispatch({ type: 'SET_CURRENT_CLASSROOM', payload: null });
  };

  const clearQuizDetails = () => {
    dispatch({ type: 'SET_QUIZ_DETAILS', payload: null });
  };

  const clearExamSessionDetails = () => {
    dispatch({ type: 'SET_EXAM_SESSION_DETAILS', payload: null });
  };

  const clearActiveExam = () => {
    dispatch({ type: 'SET_ACTIVE_EXAM', payload: null });
  };

  const clearState = () => {
    dispatch({ type: 'CLEAR_STATE' });
  };

  // Initialize classrooms based on user role
  useEffect(() => {
    const initializeClassrooms = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user) {
          if (user.role === 'teacher') {
            await fetchTeacherClassrooms();
          } else if (user.role === 'student') {
            await fetchStudentClassrooms();
          }
        }
      } catch (error) {
        console.error('Error initializing classrooms:', error);
      }
    };

    initializeClassrooms();
  }, []);

  const value = {
    ...state,
    // Classroom actions
    createClassroom,
    joinClassroom,
    fetchTeacherClassrooms,
    fetchStudentClassrooms,
    fetchClassroomDetails,
    removeStudent,
    // Quiz actions
    createManualQuiz,
    createPDFQuiz,
    fetchClassroomQuizzes,
    fetchQuizDetails,
    updateQuizStatus,
    deleteQuiz,
    scheduleQuiz,
    // ✅ FIXED: Simple status management functions
    publishQuiz,
    unpublishQuiz,
    startQuizNow,
    endQuiz,
    // Exam actions
    startExam,
    submitAnswer,
    submitExam,
    fetchExamSessionDetails,
    // Analytics actions
    fetchStudentResults,
    fetchClassroomAnalytics,
    exportClassroomResults,
    fetchQuizAnalytics,
    exportQuizResults,
    downloadExportFile,
    fetchLeaderboard,
    // Utility actions
    clearError,
    setCurrentClassroom,
    clearCurrentClassroom,
    clearQuizDetails,
    clearExamSessionDetails,
    clearActiveExam,
    clearState
  };

  return (
    <ClassroomContext.Provider value={value}>
      {children}
    </ClassroomContext.Provider>
  );
};

export const useClassroom = () => {
  const context = useContext(ClassroomContext);
  if (!context) {
    throw new Error('useClassroom must be used within a ClassroomProvider');
  }
  return context;
};