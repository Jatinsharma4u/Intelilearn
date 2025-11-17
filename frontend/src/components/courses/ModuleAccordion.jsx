// src/components/courses/ModuleAccordion.jsx - UPDATED WITH LOCKING
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronUp, Play, CheckCircle, Clock, FileText, Lock } from 'lucide-react';

const ModuleAccordion = ({ modules, courseId }) => {
  const [expandedModules, setExpandedModules] = useState(new Set());

  const toggleModule = (moduleId) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId);
    } else {
      newExpanded.add(moduleId);
    }
    setExpandedModules(newExpanded);
  };

  const getModuleProgress = (module) => {
    const totalLessons = module.lessons?.length || 0;
    const completedLessons = module.lessons?.filter(lesson => lesson.completed).length || 0;
    return totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  };

  const getModuleDuration = (module) => {
    return module.lessons?.reduce((total, lesson) => total + (lesson.duration || 10), 0) || 0;
  };

  // Find first available lesson (unlocked and not completed, or first unlocked)
  const getFirstAvailableLesson = (module) => {
    const unlockedLessons = module.lessons?.filter(lesson => !lesson.locked);
    if (!unlockedLessons || unlockedLessons.length === 0) return null;
    
    // Return first incomplete lesson, or first unlocked lesson if all completed
    return unlockedLessons.find(lesson => !lesson.completed) || unlockedLessons[0];
  };

  // Check if module is locked (all lessons are locked)
  const isModuleLocked = (module) => {
    return module.lessons?.every(lesson => lesson.locked) || false;
  };

  return (
    <div className="space-y-3">
      {modules.map((module) => {
        const progress = getModuleProgress(module);
        const duration = getModuleDuration(module);
        const isExpanded = expandedModules.has(module._id);
        const completedLessons = module.lessons?.filter(lesson => lesson.completed).length || 0;
        const totalLessons = module.lessons?.length || 0;
        const firstAvailableLesson = getFirstAvailableLesson(module);
        const moduleLocked = isModuleLocked(module);

        return (
          <div
            key={module._id}
            className={`bg-white border rounded-lg overflow-hidden hover:shadow-sm transition-shadow ${
              moduleLocked ? 'border-gray-300 bg-gray-50' : 'border-gray-200'
            }`}
          >
            {/* Module Header */}
            <button
              onClick={() => !moduleLocked && toggleModule(module._id)}
              disabled={moduleLocked}
              className={`w-full flex items-center justify-between p-3 text-left transition-colors ${
                moduleLocked 
                  ? 'cursor-not-allowed opacity-70' 
                  : 'hover:bg-gray-50 cursor-pointer'
              }`}
            >
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <div className="relative flex-shrink-0">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    moduleLocked 
                      ? 'bg-gray-200' 
                      : progress === 100 
                        ? 'bg-green-100' 
                        : 'bg-blue-100'
                  }`}>
                    {moduleLocked ? (
                      <Lock className="h-4 w-4 text-gray-500" />
                    ) : (
                      <span className={`font-medium text-xs ${
                        progress === 100 ? 'text-green-600' : 'text-blue-600'
                      }`}>
                        {module.order}
                      </span>
                    )}
                  </div>
                  {progress === 100 && !moduleLocked && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-2 w-2 text-white" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className={`text-sm font-medium mb-0.5 truncate ${
                    moduleLocked ? 'text-gray-500' : 'text-gray-900'
                  }`}>
                    {module.title}
                    {moduleLocked && <span className="text-gray-400 ml-1">(Locked)</span>}
                  </h3>
                  
                  <div className="flex items-center space-x-3 text-xs text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>{duration}m</span>
                    </div>
                    <span>{completedLessons}/{totalLessons} lessons</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2 flex-shrink-0">
                {/* Progress */}
                {!moduleLocked && (
                  <div className="hidden sm:flex flex-col items-end">
                    <span className="text-xs font-medium text-gray-700">
                      {progress}%
                    </span>
                    <div className="w-16 bg-gray-200 rounded-full h-1 mt-0.5">
                      <div 
                        className={`h-1 rounded-full transition-all duration-300 ${
                          progress === 100 ? 'bg-green-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Expand Icon */}
                {!moduleLocked && (
                  isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  )
                )}
              </div>
            </button>

            {/* Module Content */}
            {isExpanded && !moduleLocked && (
              <div className="border-t border-gray-200">
                <div className="p-3">
                  <div className="space-y-2">
                    {module.lessons?.map((lesson) => {
                      const isCompleted = lesson.completed;
                      const isLocked = lesson.locked;
                      
                      return (
                        <Link
                          key={lesson._id}
                          to={isLocked ? '#' : `/courses/${courseId}/learn/${module._id}/${lesson._id}`}
                          className={`block ${isLocked ? 'cursor-not-allowed' : ''}`}
                        >
                          <div
                            className={`flex items-center space-x-2 p-2 rounded-lg border transition-colors ${
                              isLocked
                                ? 'bg-gray-100 border-gray-300 text-gray-400'
                                : isCompleted
                                ? 'bg-green-50 border-green-200'
                                : 'bg-gray-50 border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                            }`}
                          >
                            <div className={`p-1 rounded flex-shrink-0 ${
                              isLocked 
                                ? 'bg-gray-200 text-gray-400' 
                                : isCompleted 
                                ? 'bg-green-100 text-green-600' 
                                : 'bg-blue-100 text-blue-600'
                            }`}>
                              {isLocked ? (
                                <Lock className="h-3 w-3" />
                              ) : isCompleted ? (
                                <CheckCircle className="h-3 w-3" />
                              ) : (
                                <Play className="h-3 w-3" />
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <h4 className={`text-xs font-medium truncate ${
                                isLocked 
                                  ? 'text-gray-400'
                                  : isCompleted 
                                  ? 'text-green-900' 
                                  : 'text-gray-900'
                              }`}>
                                {lesson.order}. {lesson.title}
                                {isLocked && <span className="text-gray-400 ml-1">(Locked)</span>}
                              </h4>
                              <div className="flex items-center space-x-2 mt-0.5">
                                <span className={`text-xs ${
                                  isLocked ? 'text-gray-400' : 'text-gray-500'
                                }`}>
                                  {lesson.duration || 10}m
                                </span>
                                {lesson.quiz && lesson.quiz.length > 0 && !isLocked && (
                                  <span className="text-xs text-orange-600 flex items-center space-x-0.5">
                                    <FileText className="h-2.5 w-2.5" />
                                    <span>{lesson.quiz.length}</span>
                                  </span>
                                )}
                              </div>
                            </div>

                            {isCompleted && !isLocked && (
                              <div className="flex items-center space-x-0.5 text-green-600 text-xs flex-shrink-0">
                                <CheckCircle className="h-3 w-3" />
                                <span className="hidden xs:inline">Done</span>
                              </div>
                            )}
                          </div>
                        </Link>
                      );
                    })}
                  </div>

                  {/* Module Actions */}
                  <div className="flex space-x-2 mt-3 pt-3 border-t border-gray-200">
                    {firstAvailableLesson && (
                      <Link
                        to={`/courses/${courseId}/learn/${module._id}/${firstAvailableLesson._id}`}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-2 py-1.5 rounded text-xs font-medium text-center transition-colors"
                      >
                        {progress === 0 ? 'Start Module' : 'Continue'}
                      </Link>
                    )}
                    
                    {progress === 100 && (
                      <button className="px-2 py-1.5 border border-green-600 text-green-600 hover:bg-green-600 hover:text-white rounded text-xs font-medium transition-colors">
                        Review
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ModuleAccordion;