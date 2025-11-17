// src/pages/CourseDetail.jsx - WEAKNESS BOOSTER REMOVED
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCourses } from '../contexts/CourseContext';
import ModuleAccordion from '../components/courses/ModuleAccordion';
import CourseAnalytics from '../components/courses/CourseAnalytics';
import WeakTopics from '../components/courses/WeakTopics';
import { 
  ArrowLeft, 
  Play, 
  BookOpen, 
  BarChart3, 
  Clock, 
  CheckCircle2, 
  FileText, 
  Brain, 
  Users,
  AlertTriangle
} from 'lucide-react';

const CourseDetail = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { currentCourse, fetchCourse, loading } = useCourses();
  const [activeTab, setActiveTab] = useState('content');

  useEffect(() => {
    if (courseId) {
      fetchCourse(courseId);
    }
  }, [courseId]);

  // Calculate course stats
  const getCourseStats = () => {
    if (!currentCourse?.modules) {
      return {
        totalLessons: 0,
        completedLessons: 0,
        totalModules: 0,
        completedModules: 0,
        totalQuizzes: 0,
        totalFlashcards: 0,
        totalDuration: 0
      };
    }

    const totalLessons = currentCourse.modules.reduce((acc, module) => 
      acc + (module.lessons?.length || 0), 0
    );
    
    const completedLessons = currentCourse.modules.reduce((acc, module) => 
      acc + (module.lessons?.filter(lesson => lesson.completed).length || 0), 0
    );

    const totalModules = currentCourse.modules.length;
    const completedModules = currentCourse.modules.filter(module => 
      module.lessons?.every(lesson => lesson.completed)
    ).length;

    const totalQuizzes = currentCourse.modules.reduce((acc, module) => 
      acc + (module.lessons?.reduce((lessonAcc, lesson) => 
        lessonAcc + (lesson.quiz?.length || 0), 0) || 0), 0
    );

    const totalFlashcards = currentCourse.modules.reduce((acc, module) => 
      acc + (module.lessons?.reduce((lessonAcc, lesson) => 
        lessonAcc + (lesson.flashcards?.length || 0), 0) || 0), 0
    );

    const totalDuration = currentCourse.modules.reduce((acc, module) => 
      acc + (module.lessons?.reduce((lessonAcc, lesson) => 
        lessonAcc + (lesson.duration || 10), 0) || 0), 0
    );

    const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    return {
      totalLessons,
      completedLessons,
      totalModules,
      completedModules,
      totalQuizzes,
      totalFlashcards,
      totalDuration,
      progress
    };
  };

  const stats = getCourseStats();

  if (loading && !currentCourse) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!currentCourse) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <BookOpen className="h-10 w-10 text-gray-400 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Course Not Found</h2>
          <p className="text-gray-500 text-sm mb-4">The course you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/courses')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium w-full transition-colors"
          >
            Back to Courses
          </button>
        </div>
      </div>
    );
  }

  // Updated tabs with Weak Topics
  const tabs = [
    { id: 'content', label: 'Content', icon: BookOpen },
    { id: 'weaktopics', label: 'Weak Topics', icon: AlertTriangle },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 }
  ];

  const getFirstIncompleteLesson = () => {
    for (const module of currentCourse.modules) {
      for (const lesson of module.lessons) {
        if (!lesson.completed && !lesson.locked) {
          return {
            moduleId: module._id,
            lessonId: lesson._id,
            moduleTitle: module.title,
            lessonTitle: lesson.title
          };
        }
      }
    }
    return null;
  };

  const handleContinueLearning = () => {
    const nextLesson = getFirstIncompleteLesson();
    if (nextLesson) {
      navigate(`/courses/${courseId}/learn/${nextLesson.moduleId}/${nextLesson.lessonId}`);
    } else if (currentCourse.modules.length > 0) {
      const firstModule = currentCourse.modules[0];
      const firstLesson = firstModule.lessons[0];
      navigate(`/courses/${courseId}/learn/${firstModule._id}/${firstLesson._id}`);
    }
  };

  const handleStartFromBeginning = () => {
    if (currentCourse.modules.length > 0) {
      const firstModule = currentCourse.modules[0];
      const firstLesson = firstModule.lessons[0];
      navigate(`/courses/${courseId}/learn/${firstModule._id}/${firstLesson._id}`);
    }
  };

  // Get completion status for analytics
  const getCompletionStatus = () => {
    if (stats.progress === 0) return 'not-started';
    if (stats.progress === 100) return 'completed';
    if (stats.progress >= 50) return 'halfway';
    return 'in-progress';
  };

  const completionStatus = getCompletionStatus();
  const nextLesson = getFirstIncompleteLesson();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Enhanced Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          {/* Back and Title */}
          <div className="flex items-center space-x-3 mb-4">
            <button
              onClick={() => navigate('/courses')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
            >
              <ArrowLeft className="h-4 w-4 text-gray-600" />
            </button>
            
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-semibold text-gray-900 truncate">{currentCourse.title}</h1>
              <p className="text-gray-500 text-xs sm:text-sm mt-0.5 line-clamp-2">
                {currentCourse.description}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-2 flex-shrink-0">
              {stats.progress > 0 ? (
                <button
                  onClick={handleContinueLearning}
                  className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                >
                  <Play className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">
                    {completionStatus === 'completed' ? 'Review' : 'Continue'}
                  </span>
                </button>
              ) : (
                <button
                  onClick={handleStartFromBeginning}
                  className="flex items-center space-x-1.5 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                >
                  <Play className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Start</span>
                </button>
              )}
            </div>
          </div>

          {/* Enhanced Progress Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 text-xs font-medium">Progress</p>
                  <p className="text-lg font-bold text-blue-700">{stats.progress}%</p>
                  <p className="text-xs text-blue-600 mt-1">
                    {completionStatus === 'completed' ? 'Course Completed! 🎉' :
                     completionStatus === 'halfway' ? 'More than halfway! 🔥' :
                     completionStatus === 'in-progress' ? 'Keep going! 💪' :
                     "Let's start! 🚀"}
                  </p>
                </div>
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-green-50 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 text-xs font-medium">Lessons</p>
                  <p className="text-lg font-bold text-green-700">
                    {stats.completedLessons}/{stats.totalLessons}
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    {stats.totalLessons - stats.completedLessons} remaining
                  </p>
                </div>
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-purple-50 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-600 text-xs font-medium">Quizzes</p>
                  <p className="text-lg font-bold text-purple-700">{stats.totalQuizzes}</p>
                  <p className="text-xs text-purple-600 mt-1">
                    {stats.totalQuizzes > 0 ? 'Test your knowledge' : 'No quizzes'}
                  </p>
                </div>
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <FileText className="h-5 w-5 text-purple-600" />
                </div>
              </div>
            </div>

            <div className="bg-orange-50 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-600 text-xs font-medium">Duration</p>
                  <p className="text-lg font-bold text-orange-700">{stats.totalDuration}m</p>
                  <p className="text-xs text-orange-600 mt-1">
                    ~{Math.ceil(stats.totalDuration / 60)}h total
                  </p>
                </div>
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                  <Clock className="h-5 w-5 text-orange-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Progress Bar with Next Lesson Info */}
          <div className="space-y-3 mb-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500 shadow-sm"
                style={{ width: `${stats.progress}%` }}
              ></div>
            </div>
            
            {nextLesson && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">
                  Next: <span className="font-medium">{nextLesson.lessonTitle}</span>
                </span>
                <span className="text-blue-600 font-medium">
                  Module {currentCourse.modules.findIndex(m => m._id === nextLesson.moduleId) + 1}
                </span>
              </div>
            )}
          </div>

          {/* Enhanced Tabs */}
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            {tabs.map((tab) => {
              const TabIcon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 flex-1 justify-center ${
                    isActive
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-700'
                  }`}
                >
                  <TabIcon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {activeTab === 'content' && (
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <BookOpen className="h-6 w-6 text-blue-600" />
                </div>
                <p className="text-sm text-gray-600">Modules</p>
                <p className="text-xl font-bold text-gray-900">
                  {stats.completedModules}/{stats.totalModules}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.completedModules === stats.totalModules ? 'All completed!' : `${stats.totalModules - stats.completedModules} remaining`}
                </p>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Brain className="h-6 w-6 text-green-600" />
                </div>
                <p className="text-sm text-gray-600">Flashcards</p>
                <p className="text-xl font-bold text-gray-900">{stats.totalFlashcards}</p>
                <p className="text-xs text-gray-500 mt-1">Memory cards</p>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <FileText className="h-6 w-6 text-purple-600" />
                </div>
                <p className="text-sm text-gray-600">Quizzes</p>
                <p className="text-xl font-bold text-gray-900">{stats.totalQuizzes}</p>
                <p className="text-xs text-gray-500 mt-1">Practice tests</p>
              </div>
            </div>

            {/* Course Content */}
            <div className="bg-white border border-gray-200 rounded-lg">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Course Content</h2>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span>{stats.completedLessons} of {stats.totalLessons} lessons completed</span>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <ModuleAccordion 
                  modules={currentCourse.modules || []} 
                  courseId={courseId}
                />
              </div>
            </div>

            {/* Course Tips */}
            {completionStatus !== 'completed' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Users className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-blue-900 mb-1">Learning Tip</h3>
                    <p className="text-sm text-blue-700">
                      {completionStatus === 'not-started' 
                        ? "Start with the first module and complete lessons in order. Each lesson builds on previous knowledge."
                        : completionStatus === 'in-progress'
                        ? "Try to complete at least one lesson per day. Consistent practice is key to effective learning."
                        : "You're doing great! Consider reviewing completed lessons to reinforce your understanding."
                      }
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'weaktopics' && (
          <div className="space-y-6">
            <WeakTopics courseId={courseId} />
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* Analytics Header with Enhanced Stats */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Course Analytics</h2>
                  <p className="text-gray-500 text-sm">Track your learning progress and performance</p>
                </div>
              </div>
              
              {/* Enhanced Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                  <p className="text-2xl font-bold text-blue-600">{stats.progress}%</p>
                  <p className="text-xs text-blue-700 font-medium">Overall Progress</p>
                  <div className="w-full bg-blue-200 rounded-full h-1 mt-2">
                    <div 
                      className="bg-blue-600 h-1 rounded-full"
                      style={{ width: `${stats.progress}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="text-center p-3 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
                  <p className="text-2xl font-bold text-green-600">
                    {stats.completedLessons}/{stats.totalLessons}
                  </p>
                  <p className="text-xs text-green-700 font-medium">Lessons Done</p>
                  <p className="text-xs text-green-600 mt-1">
                    {Math.round((stats.completedLessons / stats.totalLessons) * 100)}% complete
                  </p>
                </div>
                
                <div className="text-center p-3 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                  <p className="text-2xl font-bold text-purple-600">{stats.totalQuizzes}</p>
                  <p className="text-xs text-purple-700 font-medium">Total Quizzes</p>
                  <p className="text-xs text-purple-600 mt-1">Practice opportunities</p>
                </div>
                
                <div className="text-center p-3 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg border border-orange-200">
                  <p className="text-2xl font-bold text-orange-600">{stats.totalDuration}m</p>
                  <p className="text-xs text-orange-700 font-medium">Total Duration</p>
                  <p className="text-xs text-orange-600 mt-1">
                    ~{Math.ceil(stats.totalDuration / 60)} hours
                  </p>
                </div>
              </div>
            </div>

            {/* Actual Analytics Component */}
            <CourseAnalytics courseId={courseId} />
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseDetail;