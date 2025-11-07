import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCourse } from '../contexts/CourseContext';
import LessonViewer from '../components/course/LessonViewer';
import QuizComponent from '../components/course/QuizComponent';
import FlashcardSystem from '../components/course/FlashcardSystem';
import ProgressTracker from '../components/course/ProgressTracker';
import { Tabs, Loader } from '../components/ui';

const CoursePlayer = () => {
  const { courseId } = useParams();
  const [activeTab, setActiveTab] = useState('lessons');
  const [currentModule, setCurrentModule] = useState(0);
  const [currentLesson, setCurrentLesson] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { currentCourse, getCourse, loading } = useCourse();

  useEffect(() => {
    if (courseId) getCourse(courseId);
  }, [courseId]);

  // ✅ FIX: Safe data access functions
  const getSafeModules = () => {
    return Array.isArray(currentCourse?.modules) ? currentCourse.modules : [];
  };

  const getCurrentModule = () => {
    const modules = getSafeModules();
    return modules[currentModule] || null;
  };

  const getModuleProgress = () => {
    const module = getCurrentModule();
    if (!module) return 0;
    
    const totalLessons = module.lessons?.length || 0;
    const completedLessons = module.lessons?.filter(lesson => lesson.completed)?.length || 0;
    
    return totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;
  };

  const getOverallProgress = () => {
    return currentCourse?.progress || 0;
  };

  // ✅ FIX: Safe moduleProgress access
  const getSafeModuleProgress = () => {
    if (!currentCourse?.moduleProgress) return {};
    
    // If it's an array, convert to object format
    if (Array.isArray(currentCourse.moduleProgress)) {
      const progressObj = {};
      currentCourse.moduleProgress.forEach((item, index) => {
        if (item && typeof item === 'object') {
          progressObj[index] = item;
        }
      });
      return progressObj;
    }
    
    // If it's already an object, return it
    return currentCourse.moduleProgress;
  };

  if (loading || !currentCourse) {
    return (
      <div className="min-h-screen bg-[#0D0D14] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <Loader size="lg" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl">📚</span>
            </div>
          </div>
          <p className="text-[#A0A0B8] text-lg">Loading your course...</p>
          <div className="w-48 h-1 bg-[#2A2A3D] rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#0082FB] to-[#0064E0] rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  const modules = getSafeModules();
  const module = getCurrentModule();
  const totalModules = modules.length;
  const moduleProgress = getModuleProgress();
  const overallProgress = getOverallProgress();
  const safeModuleProgress = getSafeModuleProgress();

  const tabs = [
    { id: 'lessons', label: 'Lessons', icon: '📚', color: '#0082FB' },
    { id: 'quiz', label: 'Quiz', icon: '❓', color: '#FF9F5B' },
    { id: 'flashcards', label: 'Flashcards', icon: '🎴', color: '#00FFA3' },
    { id: 'progress', label: 'Progress', icon: '📊', color: '#A0A0B8' }
  ];

  const activeTabConfig = tabs.find(tab => tab.id === activeTab) || tabs[0];

  return (
    <div className="min-h-screen bg-[#0D0D14] pb-8">
      <div className="container mx-auto px-4 sm:px-6">
        {/* Course Header - Premium Design */}
        <motion.div
          className="bg-gradient-to-br from-[#1B1B28] to-[#2A2A3D] p-6 rounded-2xl border border-[#0082FB]/20 shadow-lg shadow-[#0082FB]/5 mt-4 mb-6 relative overflow-hidden"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Background Pattern */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#0082FB]/10 to-transparent rounded-full blur-xl"></div>
          
          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 leading-tight">
                  {currentCourse.title || 'Untitled Course'}
                </h1>
                <p className="text-[#A0A0B8] text-sm sm:text-base mb-4 leading-relaxed">
                  {currentCourse.description || 'Master your skills with this AI-powered course'}
                </p>
                
                {/* Course Stats */}
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-2 text-[#A0A0B8]">
                    <span>📦</span>
                    <span>{totalModules} Modules</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#A0A0B8]">
                    <span>⏱️</span>
                    <span>{currentCourse.total_duration || '0'} min</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#00FFA3]">
                    <span>📈</span>
                    <span>{Math.round(overallProgress)}% Complete</span>
                  </div>
                </div>
              </div>

              {/* Module Selector */}
              {totalModules > 0 && (
                <div className="lg:w-64">
                  <div className="flex items-center gap-3 mb-3">
                    <label className="text-sm font-medium text-white whitespace-nowrap">
                      Current Module:
                    </label>
                    <div className="text-xs text-[#00FFA3] bg-[#00FFA3]/10 px-2 py-1 rounded-full">
                      {Math.round(moduleProgress)}% Done
                    </div>
                  </div>
                  
                  <div className="relative">
                    <select
                      value={currentModule}
                      onChange={(e) => {
                        const newModuleIndex = Number(e.target.value);
                        if (newModuleIndex >= 0 && newModuleIndex < totalModules) {
                          setCurrentModule(newModuleIndex);
                          setCurrentLesson(0);
                        }
                      }}
                      className="w-full px-4 py-3 bg-[#0D0D14] border border-[#2A2A3D] rounded-xl text-white text-sm focus:outline-none focus:border-[#0082FB] transition-colors appearance-none cursor-pointer"
                    >
                      {modules.map((mod, i) => (
                        <option key={mod._id || i} value={i} className="bg-[#1B1B28] text-white">
                          Module {i + 1}: {mod.title || `Module ${i + 1}`}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#A0A0B8] pointer-events-none">
                      ▼
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {totalModules === 0 ? (
          <motion.div
            className="bg-[#1B1B28] rounded-2xl border border-[#2A2A3D] p-8 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-xl font-semibold text-white mb-2">No Modules Available</h3>
            <p className="text-[#A0A0B8] mb-4">This course doesn't have any learning modules yet.</p>
            <button
              onClick={() => window.history.back()}
              className="bg-[#0082FB] text-white px-6 py-3 rounded-xl hover:bg-[#0064E0] transition-colors"
            >
              Back to Courses
            </button>
          </motion.div>
        ) : (
          <>
            {/* Mobile Tab Menu Button */}
            <div className="lg:hidden mb-4">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="w-full bg-[#1B1B28] border border-[#2A2A3D] rounded-xl p-3 text-white font-medium flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <span>{activeTabConfig?.icon}</span>
                  <span>{activeTabConfig?.label}</span>
                </div>
                <span className={`transform transition-transform ${isMobileMenuOpen ? 'rotate-180' : ''}`}>
                  ▼
                </span>
              </button>
            </div>

            {/* Main Content Area */}
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Tabs Sidebar - Desktop */}
              <div className="hidden lg:block lg:w-64 flex-shrink-0">
                <div className="bg-[#1B1B28] rounded-2xl border border-[#2A2A3D] p-4 sticky top-6">
                  <div className="space-y-2">
                    {tabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                          activeTab === tab.id
                            ? 'bg-[#0082FB] text-white shadow-lg shadow-[#0082FB]/20'
                            : 'text-[#A0A0B8] hover:text-white hover:bg-[#2A2A3D]'
                        }`}
                      >
                        <span className="text-lg">{tab.icon}</span>
                        <span className="font-medium">{tab.label}</span>
                        {activeTab === tab.id && (
                          <motion.div
                            className="ml-auto w-2 h-2 bg-white rounded-full"
                            layoutId="activeTabDot"
                          />
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Quick Stats */}
                  <div className="mt-6 pt-4 border-t border-[#2A2A3D]">
                    <div className="text-xs text-[#A0A0B8] uppercase tracking-wider mb-3">
                      Module Progress
                    </div>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm text-white mb-1">
                          <span>Completion</span>
                          <span>{Math.round(moduleProgress)}%</span>
                        </div>
                        <div className="w-full bg-[#2A2A3D] rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-[#0082FB] to-[#0064E0] h-2 rounded-full transition-all duration-500"
                            style={{ width: `${moduleProgress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile Tabs Menu */}
              <AnimatePresence>
                {isMobileMenuOpen && (
                  <motion.div
                    className="lg:hidden bg-[#1B1B28] rounded-2xl border border-[#2A2A3D] p-4 mb-4"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="grid grid-cols-2 gap-2">
                      {tabs.map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => {
                            setActiveTab(tab.id);
                            setIsMobileMenuOpen(false);
                          }}
                          className={`flex items-center gap-2 px-3 py-3 rounded-lg text-sm transition-all ${
                            activeTab === tab.id
                              ? 'bg-[#0082FB] text-white shadow-lg'
                              : 'bg-[#2A2A3D] text-[#A0A0B8]'
                          }`}
                        >
                          <span>{tab.icon}</span>
                          <span>{tab.label}</span>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Main Content Panel */}
              <div className="flex-1">
                <motion.div
                  className="bg-[#1B1B28] rounded-2xl border border-[#2A2A3D] shadow-lg overflow-hidden"
                  key={activeTab}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  {/* Active Tab Header */}
                  <div 
                    className="p-4 border-b border-[#2A2A3D]"
                    style={{ 
                      background: `linear-gradient(90deg, ${activeTabConfig?.color}10, transparent)` 
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{activeTabConfig?.icon}</span>
                      <div>
                        <h2 className="text-lg font-semibold text-white">{activeTabConfig?.label}</h2>
                        <p className="text-[#A0A0B8] text-sm">
                          {module?.title || 'No module selected'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Tab Content */}
                  <div className="p-4 sm:p-6">
                    <AnimatePresence mode="wait">
                      {activeTab === 'lessons' && module && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <LessonViewer
                            module={module}
                            currentLesson={currentLesson}
                            onLessonChange={setCurrentLesson}
                            courseId={courseId}
                            moduleIndex={currentModule}
                          />
                        </motion.div>
                      )}

                      {activeTab === 'quiz' && module && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <QuizComponent 
                            quiz={module.quiz} 
                            courseId={courseId} 
                            moduleIndex={currentModule} 
                          />
                        </motion.div>
                      )}

                      {activeTab === 'flashcards' && module && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <FlashcardSystem 
                            flashcards={module.flashcards} 
                            courseId={courseId} 
                            moduleIndex={currentModule} 
                          />
                        </motion.div>
                      )}

                      {activeTab === 'progress' && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <ProgressTracker 
                            course={currentCourse} 
                            courseId={courseId} 
                          />
                        </motion.div>
                      )}

                      {/* No Module Selected Fallback */}
                      {!module && activeTab !== 'progress' && (
                        <motion.div
                          className="text-center py-12"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        >
                          <div className="text-6xl mb-4">📚</div>
                          <h3 className="text-xl font-semibold text-white mb-2">No Module Selected</h3>
                          <p className="text-[#A0A0B8]">Please select a module to continue learning.</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CoursePlayer;