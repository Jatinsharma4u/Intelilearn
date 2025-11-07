import React from 'react';
import { motion } from 'framer-motion';

const ProgressTracker = ({ course }) => {
  if (!course) {
    return (
      <div className="text-center py-12 bg-[#1B1B28] rounded-2xl border border-[#2A2A3D]">
        <div className="text-6xl mb-4">📊</div>
        <h3 className="text-xl font-semibold text-white mb-2">No Progress Data</h3>
        <p className="text-[#A0A0B8]">Start learning to see your progress!</p>
      </div>
    );
  }

  // ✅ FIX: Safe data access
  const totalModules = course.modules?.length || 0;
  const completedModules = course.modules?.filter(module => module.completed)?.length || 0;
  const totalLessons = course.total_lessons || 0;
  const totalQuizzes = course.total_quizzes || 0;
  const totalFlashcards = course.total_flashcards || 0;

  // ✅ FIX: Safe module progress calculation
  const calculateModuleProgress = (module) => {
    if (!module) return 0;
    
    const totalLessons = module.lessons?.length || 0;
    const completedLessons = module.lessons?.filter(lesson => lesson.completed)?.length || 0;
    return totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;
  };

  const stats = [
    { 
      label: 'Modules Completed', 
      value: `${completedModules}/${totalModules}`, 
      color: '#0082FB',
      icon: '📦',
      percentage: totalModules > 0 ? (completedModules / totalModules) * 100 : 0
    },
    { 
      label: 'Total Lessons', 
      value: totalLessons, 
      color: '#00FFA3',
      icon: '📚'
    },
    { 
      label: 'Quizzes', 
      value: totalQuizzes, 
      color: '#FF9F5B',
      icon: '❓'
    },
    { 
      label: 'Flashcards', 
      value: totalFlashcards, 
      color: '#A0A0B8',
      icon: '🎴'
    }
  ];

  return (
    <motion.div 
      className="progress-tracker space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Overall Progress */}
      <motion.div 
        className="bg-gradient-to-br from-[#1B1B28] to-[#2A2A3D] rounded-2xl border border-[#0082FB]/20 p-6"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-[#0082FB] to-[#0064E0] rounded-xl flex items-center justify-center">
            <span className="text-2xl">📈</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Course Progress</h2>
            <p className="text-[#A0A0B8]">Track your learning journey</p>
          </div>
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              className="bg-[#0D0D14] rounded-xl p-4 border border-[#2A2A3D] text-center hover:border-[#0082FB]/30 transition-all"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 + index * 0.1 }}
              whileHover={{ scale: 1.05, y: -2 }}
            >
              <div className="text-3xl mb-2" style={{ color: stat.color }}>
                {stat.icon}
              </div>
              <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-[#A0A0B8] text-sm">{stat.label}</div>
              {stat.percentage > 0 && (
                <div className="mt-2 w-full bg-[#2A2A3D] rounded-full h-1">
                  <motion.div
                    className="h-1 rounded-full"
                    style={{ backgroundColor: stat.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${stat.percentage}%` }}
                    transition={{ delay: 0.5 + index * 0.1, duration: 1 }}
                  />
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Overall Progress Bar */}
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-white font-medium">Overall Course Progress</span>
            <span className="text-[#00FFA3] font-bold">{Math.round(course.progress || 0)}%</span>
          </div>
          <div className="w-full bg-[#2A2A3D] rounded-full h-3 overflow-hidden">
            <motion.div
              className="bg-gradient-to-r from-[#0082FB] to-[#0064E0] h-3 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${course.progress || 0}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
        </div>
      </motion.div>

      {/* Module-wise Progress */}
      <motion.div 
        className="bg-[#1B1B28] rounded-2xl border border-[#2A2A3D] p-6"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-[#00FFA3]/20 rounded-lg flex items-center justify-center">
            <span className="text-[#00FFA3] text-lg">📊</span>
          </div>
          <h3 className="text-xl font-semibold text-white">Module Progress</h3>
        </div>
        
        <div className="space-y-4">
          {course.modules?.map((module, index) => {
            // ✅ FIX: Safe module access
            if (!module) return null;
            
            const moduleProgress = calculateModuleProgress(module);
            const isCompleted = moduleProgress === 100;
            
            return (
              <motion.div 
                key={module._id || index} 
                className="bg-[#0D0D14] rounded-xl p-5 border border-[#2A2A3D] hover:border-[#0082FB]/30 transition-all group"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      isCompleted ? 'bg-[#00FFA3]' : 'bg-[#0082FB]'
                    }`}>
                      <span className="text-white text-sm font-bold">
                        {isCompleted ? '✓' : index + 1}
                      </span>
                    </div>
                    <h4 className="font-semibold text-white text-lg">
                      {module.title || `Module ${index + 1}`}
                    </h4>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-lg font-bold ${
                      isCompleted ? 'text-[#00FFA3]' : 'text-[#0082FB]'
                    }`}>
                      {Math.round(moduleProgress)}%
                    </span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {/* Progress Bar */}
                  <div className="w-full bg-[#2A2A3D] rounded-full h-2 overflow-hidden">
                    <motion.div
                      className={`h-2 rounded-full ${
                        isCompleted 
                          ? 'bg-gradient-to-r from-[#00FFA3] to-[#00CC83]' 
                          : 'bg-gradient-to-r from-[#0082FB] to-[#0064E0]'
                      }`}
                      initial={{ width: 0 }}
                      animate={{ width: `${moduleProgress}%` }}
                      transition={{ duration: 0.8, delay: 0.6 + index * 0.1 }}
                    />
                  </div>
                  
                  <div className="flex flex-wrap justify-between text-sm text-[#A0A0B8] gap-2">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <span>📚</span>
                        <span>{module.lessons?.length || 0} lessons</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <span>⏱️</span>
                        <span>{module.duration || 0} min</span>
                      </span>
                    </div>
                    
                    <span className="text-[#00FFA3] font-medium">
                      {module.lessons?.filter(lesson => lesson.completed)?.length || 0} completed
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Statistics */}
      <motion.div 
        className="bg-gradient-to-br from-[#1B1B28] to-[#2A2A3D] rounded-2xl border border-[#00FFA3]/20 p-6"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-[#FF9F5B]/20 rounded-lg flex items-center justify-center">
            <span className="text-[#FF9F5B] text-lg">📈</span>
          </div>
          <h3 className="text-xl font-semibold text-white">Learning Statistics</h3>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Completion Rate */}
          <div className="space-y-4">
            <h4 className="font-bold text-white text-lg flex items-center gap-2">
              <span>🎯</span>
              Completion Rate
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-[#A0A0B8]">Modules</span>
                <span className="text-white font-bold">
                  {completedModules}/{totalModules} ({Math.round((completedModules/totalModules)*100)}%)
                </span>
              </div>
              <div className="w-full bg-[#2A2A3D] rounded-full h-3">
                <motion.div
                  className="bg-gradient-to-r from-[#00FFA3] to-[#00CC83] h-3 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${(completedModules/totalModules)*100}%` }}
                  transition={{ duration: 1, delay: 0.7 }}
                />
              </div>
            </div>
          </div>
          
          {/* Time Investment */}
          <div className="space-y-4">
            <h4 className="font-bold text-white text-lg flex items-center gap-2">
              <span>⏱️</span>
              Time Investment
            </h4>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-[#A0A0B8]">Total Duration:</span>
                <span className="text-white font-bold">{course.total_duration || 0} minutes</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#A0A0B8]">Time Completed:</span>
                <span className="text-[#00FFA3] font-bold">
                  {Math.round((course.total_duration || 0) * ((course.progress || 0)/100))} minutes
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#A0A0B8]">Time Remaining:</span>
                <span className="text-[#FF9F5B] font-bold">
                  {Math.round((course.total_duration || 0) * (1 - (course.progress || 0)/100))} minutes
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Achievement Badges */}
        <div className="mt-6 pt-6 border-t border-[#2A2A3D]">
          <h4 className="font-bold text-white text-lg mb-4 flex items-center gap-2">
            <span>🏆</span>
            Achievements
          </h4>
          <div className="flex flex-wrap gap-3">
            {completedModules > 0 && (
              <div className="bg-[#0082FB]/20 text-[#0082FB] px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
                <span>📦</span>
                First Module Complete!
              </div>
            )}
            {completedModules >= totalModules / 2 && (
              <div className="bg-[#00FFA3]/20 text-[#00FFA3] px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
                <span>🎯</span>
                Halfway There!
              </div>
            )}
            {completedModules === totalModules && (
              <div className="bg-[#FF9F5B]/20 text-[#FF9F5B] px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
                <span>🎉</span>
                Course Mastered!
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ProgressTracker;