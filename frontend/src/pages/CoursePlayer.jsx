// src/pages/CoursePlayer.jsx - COMPLETELY FIXED VERSION
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useCourses } from '../contexts/CourseContext';
import LessonContent from '../components/courses/LessonContent';
import QuizComponent from '../components/courses/QuizComponent';
import Flashcards from '../components/courses/Flashcards';
import { 
  ArrowLeft, 
  Menu, 
  X, 
  BookOpen, 
  ChevronRight, 
  Lock, 
  CheckCircle,
  Home
} from 'lucide-react';

const CoursePlayer = () => {
  const { courseId, moduleIndex, lessonIndex } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    currentCourse, 
    fetchCourse, 
    loading
  } = useCourses();
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentModuleIdx, setCurrentModuleIdx] = useState(-1);
  const [currentLessonIdx, setCurrentLessonIdx] = useState(-1);
  const [isSearching, setIsSearching] = useState(false);

  // 🔥 FIXED: Find indexes by Object ID instead of parsing as numbers
  const findIndexesById = (moduleId, lessonId) => {
    if (!currentCourse || !currentCourse.modules) {
      return { moduleIdx: -1, lessonIdx: -1 };
    }

    console.log('🔍 Searching for indexes:', { moduleId, lessonId });
    
    let foundModuleIdx = -1;
    let foundLessonIdx = -1;

    // Search for module by ID
    for (let i = 0; i < currentCourse.modules.length; i++) {
      if (currentCourse.modules[i]._id === moduleId) {
        foundModuleIdx = i;
        console.log('✅ Found module at index:', i, currentCourse.modules[i].title);
        break;
      }
    }

    // Search for lesson by ID within the found module
    if (foundModuleIdx !== -1) {
      const module = currentCourse.modules[foundModuleIdx];
      if (module.lessons) {
        for (let j = 0; j < module.lessons.length; j++) {
          if (module.lessons[j]._id === lessonId) {
            foundLessonIdx = j;
            console.log('✅ Found lesson at index:', j, module.lessons[j].title);
            break;
          }
        }
      }
    }

    console.log('🎯 Final indexes found:', { foundModuleIdx, foundLessonIdx });
    return { moduleIdx: foundModuleIdx, lessonIdx: foundLessonIdx };
  };

  // 🔥 FIXED: Fetch course and find indexes
  useEffect(() => {
    if (courseId && (!currentCourse || currentCourse._id !== courseId)) {
      console.log('📥 Fetching course:', courseId);
      fetchCourse(courseId);
    }
  }, [courseId, currentCourse, fetchCourse]);

  // 🔥 FIXED: Find indexes when course loads or URL changes
  useEffect(() => {
    if (currentCourse && moduleIndex && lessonIndex) {
      console.log('🔄 Finding indexes for current course...');
      setIsSearching(true);
      
      const { moduleIdx, lessonIdx } = findIndexesById(moduleIndex, lessonIndex);
      
      setCurrentModuleIdx(moduleIdx);
      setCurrentLessonIdx(lessonIdx);
      setIsSearching(false);
      
      console.log('📚 Final state:', {
        moduleIndex,
        lessonIndex,
        foundModuleIdx: moduleIdx,
        foundLessonIdx: lessonIdx,
        moduleTitle: moduleIdx !== -1 ? currentCourse.modules[moduleIdx]?.title : 'NOT FOUND',
        lessonTitle: lessonIdx !== -1 ? currentCourse.modules[moduleIdx]?.lessons[lessonIdx]?.title : 'NOT FOUND'
      });
    }
  }, [currentCourse, moduleIndex, lessonIndex]);

  // Get current view from URL
  const getCurrentView = () => {
    const path = location.pathname;
    if (path.includes('/quiz')) return 'quiz';
    if (path.includes('/flashcards')) return 'flashcards';
    return 'content';
  };

  const currentView = getCurrentView();

  // 🔥 FIXED: Get current module and lesson
  const currentModule = currentModuleIdx !== -1 ? currentCourse?.modules?.[currentModuleIdx] : null;
  const currentLesson = currentLessonIdx !== -1 ? currentModule?.lessons?.[currentLessonIdx] : null;

  console.log('📚 Current Content Status:', {
    courseId,
    moduleIndex,
    lessonIndex,
    currentModuleIdx,
    currentLessonIdx,
    hasCourse: !!currentCourse,
    hasModule: !!currentModule,
    hasLesson: !!currentLesson,
    moduleTitle: currentModule?.title,
    lessonTitle: currentLesson?.title,
    currentView
  });

  // 🔥 FIXED: Navigation helper - uses Object IDs in URL
  const navigateToLesson = (newModuleIdx, newLessonIdx, view = 'content') => {
    if (!currentCourse || newModuleIdx === -1 || newLessonIdx === -1) {
      console.error('❌ Invalid navigation indexes:', { newModuleIdx, newLessonIdx });
      return;
    }

    const module = currentCourse.modules[newModuleIdx];
    const lesson = module.lessons[newLessonIdx];
    
    if (!module || !lesson) {
      console.error('❌ Module or lesson not found at indexes:', { newModuleIdx, newLessonIdx });
      return;
    }

    const newUrl = `/courses/${courseId}/learn/${module._id}/${lesson._id}/${view}`;
    console.log('🧭 Navigating to:', newUrl);
    navigate(newUrl);
  };

  // Loading state
  if (loading && !currentCourse) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm">Loading course...</p>
        </div>
      </div>
    );
  }

  // Searching state
  if (isSearching) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm">Finding lesson...</p>
        </div>
      </div>
    );
  }

  // Course not found
  if (!currentCourse) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Course Not Found</h2>
          <p className="text-gray-500 text-sm mb-4">The requested course could not be loaded.</p>
          <button
            onClick={() => navigate('/courses')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Back to Courses
          </button>
        </div>
      </div>
    );
  }

  // 🔥 FIXED: Module or lesson not found with better error message
  if (currentModuleIdx === -1 || currentLessonIdx === -1 || !currentModule || !currentLesson) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-2xl">
          <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Lesson Not Found</h2>
          <p className="text-gray-500 text-sm mb-4">
            The requested lesson could not be found in this course.
          </p>
          
          <div className="text-xs text-gray-500 mb-6 p-4 bg-gray-50 rounded-lg text-left">
            <div className="font-semibold mb-2">Debug Information:</div>
            <div>Looking for Module: {moduleIndex}</div>
            <div>Looking for Lesson: {lessonIndex}</div>
            <div className="mt-2">Course has {currentCourse.modules?.length || 0} modules:</div>
            {currentCourse.modules?.map((mod, idx) => (
              <div key={mod._id} className="ml-4 mt-1">
                <div className="font-medium">Module {idx}: {mod.title}</div>
                <div className="ml-4 text-gray-400">
                  ID: {mod._id} ({mod.lessons?.length || 0} lessons)
                  {mod.lessons?.map((les, lesIdx) => (
                    <div key={les._id}>- Lesson {lesIdx}: {les.title} (ID: {les._id})</div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          <button
            onClick={() => navigate(`/courses/${courseId}`)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Back to Course Overview
          </button>
        </div>
      </div>
    );
  }

  // Mobile Sidebar Component
  const MobileSidebar = () => (
    <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
      <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
      <div className="fixed inset-y-0 left-0 w-80 bg-white shadow-xl">
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Course Content</h2>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-600" />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            <CourseNavigation 
              course={currentCourse}
              currentModuleIdx={currentModuleIdx}
              currentLessonIdx={currentLessonIdx}
              currentView={currentView}
              onNavigate={navigateToLesson}
            />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile Sidebar */}
      <MobileSidebar />

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex w-80 flex-shrink-0 border-r border-gray-200 bg-white">
        <div className="w-full flex flex-col h-screen sticky top-0">
          <div className="p-6 border-b border-gray-200">
            <button
              onClick={() => navigate('/courses')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium mb-2"
            >
              <Home className="h-4 w-4" />
              <span>All Courses</span>
            </button>
            <button
              onClick={() => navigate(`/courses/${courseId}`)}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Course Overview</span>
            </button>
            <h1 className="text-lg font-bold text-gray-900 mt-3 truncate">{currentCourse.title}</h1>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            <CourseNavigation 
              course={currentCourse}
              currentModuleIdx={currentModuleIdx}
              currentLessonIdx={currentLessonIdx}
              currentView={currentView}
              onNavigate={navigateToLesson}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <div className="bg-white border-b border-gray-200 lg:border-none sticky top-0 z-40">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors lg:hidden flex-shrink-0"
                >
                  <Menu className="h-5 w-5 text-gray-600" />
                </button>
                
                <div className="min-w-0 flex-1">
                  <h1 className="text-sm font-semibold text-gray-900 truncate">{currentCourse.title}</h1>
                  <p className="text-xs text-gray-500 truncate">
                    {currentModule.title} • Lesson {currentLessonIdx + 1}
                  </p>
                </div>
              </div>
            </div>

            {/* Lesson Title */}
            <h2 className="text-xl font-bold text-gray-900 mt-3 mb-4 leading-tight">
              {currentLesson.title}
            </h2>
            
            {/* Progress Steps */}
            <div className="flex items-center justify-between bg-white rounded-lg p-3 border border-gray-200">
              <ProgressStep 
                active={currentView === 'content'}
                completed={currentLesson.contentCompleted}
                label="Learn"
                onClick={() => navigateToLesson(currentModuleIdx, currentLessonIdx, 'content')}
              />
              
              <ChevronRight className="h-4 w-4 text-gray-400 mx-2" />
              
              <ProgressStep 
                active={currentView === 'quiz'}
                completed={currentLesson.quizCompleted}
                label="Quiz"
                onClick={() => currentLesson.contentCompleted && 
                  navigateToLesson(currentModuleIdx, currentLessonIdx, 'quiz')}
                disabled={!currentLesson.contentCompleted}
              />
              
              <ChevronRight className="h-4 w-4 text-gray-400 mx-2" />
              
              <ProgressStep 
                active={currentView === 'flashcards'}
                completed={currentLesson.flashcardsCompleted}
                label="Review"
                onClick={() => currentLesson.quizCompleted && 
                  navigateToLesson(currentModuleIdx, currentLessonIdx, 'flashcards')}
                disabled={!currentLesson.quizCompleted}
              />
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto bg-white">
          <div className="w-full max-w-6xl mx-auto p-4 lg:p-6">
            {currentView === 'content' && (
              <LessonContent 
                lesson={currentLesson}
                moduleIndex={currentModuleIdx}
                lessonIndex={currentLessonIdx}
                courseId={courseId}
                onProgressUpdate={() => {
                  fetchCourse(courseId);
                }}
              />
            )}

            {currentView === 'quiz' && (
              <QuizComponent 
                quiz={currentLesson.quiz}
                courseId={courseId}
                moduleIndex={currentModuleIdx}
                lessonIndex={currentLessonIdx}
                onComplete={() => {
                  fetchCourse(courseId);
                }}
              />
            )}

            {currentView === 'flashcards' && (
              <Flashcards 
                flashcards={currentLesson.flashcards}
                courseId={courseId}
                moduleIndex={currentModuleIdx}
                lessonIndex={currentLessonIdx}
                onComplete={() => {
                  fetchCourse(courseId);
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Progress Step Component
const ProgressStep = ({ active, completed, label, onClick, disabled }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-col items-center space-y-2 flex-1 min-w-0 transition-all duration-200 ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 cursor-pointer'
      }`}
    >
      <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-200 ${
        active 
          ? 'bg-blue-600 border-blue-600 text-white' 
          : completed 
          ? 'bg-green-500 border-green-500 text-white'
          : 'bg-white border-gray-300 text-gray-400'
      }`}>
        {completed ? (
          <CheckCircle className="h-5 w-5" />
        ) : disabled ? (
          <Lock className="h-4 w-4" />
        ) : (
          <div className={`w-2 h-2 rounded-full ${active ? 'bg-white' : 'bg-gray-400'}`} />
        )}
      </div>
      <span className={`text-xs font-medium transition-colors ${
        active ? 'text-blue-600' : 
        completed ? 'text-green-600' : 
        'text-gray-500'
      }`}>
        {label}
      </span>
    </button>
  );
};

// Course Navigation Component
const CourseNavigation = ({ course, currentModuleIdx, currentLessonIdx, currentView, onNavigate }) => {
  return (
    <div className="p-4 space-y-6">
      {course.modules?.map((module, moduleIndex) => (
        <div key={module._id} className="space-y-3">
          <div className="flex items-center space-x-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              moduleIndex === currentModuleIdx 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-600'
            }`}>
              <span className="text-sm font-semibold">{moduleIndex + 1}</span>
            </div>
            <h3 className="text-sm font-semibold text-gray-900 flex-1 truncate">{module.title}</h3>
          </div>
          
          <div className="space-y-1 ml-4">
            {module.lessons?.map((lesson, lessonIndex) => {
              const isActive = moduleIndex === currentModuleIdx && lessonIndex === currentLessonIdx;
              const isCompleted = lesson.completed;
              const isLocked = lesson.locked;
              
              return (
                <button
                  key={lesson._id}
                  onClick={() => !isLocked && onNavigate(moduleIndex, lessonIndex, currentView)}
                  disabled={isLocked}
                  className={`w-full text-left p-3 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-50 border border-blue-200 shadow-sm'
                      : isLocked
                      ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                      : 'hover:bg-gray-50 hover:border-gray-200 border border-transparent'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                      isActive 
                        ? 'bg-blue-600 text-white' 
                        : isCompleted 
                        ? 'bg-green-500 text-white'
                        : isLocked
                        ? 'bg-gray-300 text-gray-500'
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {isLocked ? (
                        <Lock className="h-3 w-3" />
                      ) : isCompleted ? (
                        <CheckCircle className="h-3 w-3" />
                      ) : (
                        <span className="text-xs font-medium">{lessonIndex + 1}</span>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${
                        isActive ? 'text-blue-900' : 
                        isLocked ? 'text-gray-500' : 
                        'text-gray-900'
                      }`}>
                        {lesson.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {lesson.duration || 10} min
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default CoursePlayer;