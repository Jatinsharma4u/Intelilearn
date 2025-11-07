import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCourse } from '../../contexts/CourseContext';

const LessonViewer = ({ module, currentLesson, onLessonChange, courseId, moduleIndex }) => {
  const [completedLessons, setCompletedLessons] = useState(new Set());
  const [isCompleting, setIsCompleting] = useState(false);
  const { updateLessonProgress } = useCourse();

  const lesson = module?.lessons?.[currentLesson];

  const markLessonComplete = async () => {
    if (!lesson || completedLessons.has(lesson._id) || isCompleting) return;
    
    setIsCompleting(true);
    try {
      await updateLessonProgress(courseId, moduleIndex, currentLesson, lesson.duration || 10);
      setCompletedLessons(prev => new Set([...prev, lesson._id]));
      
      // Auto-advance after 1 second
      setTimeout(() => {
        if (currentLesson < module.lessons.length - 1) {
          onLessonChange(currentLesson + 1);
        }
        setIsCompleting(false);
      }, 1000);
    } catch (error) {
      console.error('Error marking lesson complete:', error);
      setIsCompleting(false);
    }
  };

  const handleNextLesson = () => {
    if (currentLesson < module.lessons.length - 1) {
      onLessonChange(currentLesson + 1);
    }
  };

  const handlePrevLesson = () => {
    if (currentLesson > 0) {
      onLessonChange(currentLesson - 1);
    }
  };

  if (!lesson) {
    return (
      <div className="text-center py-12 bg-[#1B1B28] rounded-2xl border border-[#2A2A3D]">
        <div className="text-6xl mb-4">📚</div>
        <h3 className="text-xl font-semibold text-white mb-2">No Lesson Available</h3>
        <p className="text-[#A0A0B8]">This module doesn't have any lessons yet.</p>
      </div>
    );
  }

  const progress = ((currentLesson + 1) / module.lessons.length) * 100;

  return (
    <motion.div
      className="lesson-viewer bg-[#1B1B28] rounded-2xl border border-[#2A2A3D] overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Lesson Header */}
      <div className="bg-gradient-to-r from-[#0082FB] to-[#0064E0] p-6 border-b border-[#0082FB]/30">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-4">
          <div className="flex-1">
            <motion.h2 
              className="text-2xl font-bold text-white mb-3 leading-tight"
              key={lesson.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {lesson.title}
            </motion.h2>
            
            <div className="flex flex-wrap items-center gap-4 text-white/90 text-sm">
              <div className="flex items-center gap-2">
                <span>⏱️</span>
                <span>{lesson.duration || 10} min</span>
              </div>
              <div className="flex items-center gap-2">
                <span>📖</span>
                <span>Lesson {currentLesson + 1} of {module.lessons.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <span>📊</span>
                <span>{Math.round(progress)}% Complete</span>
              </div>
            </div>
          </div>

          <motion.button
            onClick={markLessonComplete}
            disabled={completedLessons.has(lesson._id) || isCompleting}
            className={`
              flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all duration-300 min-w-[160px] justify-center
              ${completedLessons.has(lesson._id)
                ? 'bg-[#00FFA3] text-[#0D0D14] cursor-not-allowed'
                : isCompleting
                ? 'bg-[#00FFA3] text-[#0D0D14] cursor-wait'
                : 'bg-white text-[#0082FB] hover:bg-gray-100 hover:scale-105'
              }
            `}
            whileHover={{ 
              scale: completedLessons.has(lesson._id) || isCompleting ? 1 : 1.05 
            }}
            whileTap={{ scale: 0.95 }}
          >
            <AnimatePresence mode="wait">
              {isCompleting ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2"
                >
                  <div className="w-4 h-4 border-2 border-[#0D0D14] border-t-transparent rounded-full animate-spin"></div>
                  <span>Completing...</span>
                </motion.div>
              ) : completedLessons.has(lesson._id) ? (
                <motion.div
                  key="completed"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="flex items-center gap-2"
                >
                  <span>✓</span>
                  <span>Completed</span>
                </motion.div>
              ) : (
                <motion.div
                  key="complete"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2"
                >
                  <span>🎯</span>
                  <span>Mark Complete</span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </div>

        {/* Keywords */}
        {lesson.keywords && lesson.keywords.length > 0 && (
          <motion.div 
            className="flex flex-wrap gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {lesson.keywords.map((keyword, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm text-white border border-white/30"
              >
                {keyword}
              </span>
            ))}
          </motion.div>
        )}
      </div>

      {/* Lesson Content */}
      <div className="p-6 max-h-[60vh] overflow-y-auto">
        <motion.div
          className="prose prose-invert max-w-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <div 
            className="text-[#A0A0B8] leading-relaxed text-lg whitespace-pre-line"
            dangerouslySetInnerHTML={{ 
              __html: lesson.content.replace(/\n/g, '<br/>') 
            }}
          />
        </motion.div>

        {/* Examples */}
        {lesson.examples && lesson.examples.length > 0 && (
          <motion.div 
            className="mt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h4 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span>💡</span>
              Examples
            </h4>
            <div className="space-y-4">
              {lesson.examples.map((example, index) => (
                <div 
                  key={index} 
                  className="bg-[#0D0D14] rounded-xl p-4 border border-[#2A2A3D] hover:border-[#0082FB]/30 transition-colors"
                >
                  <h5 className="font-bold text-white mb-2 text-lg">{example.title}</h5>
                  <p className="text-[#A0A0B8] mb-3 leading-relaxed">{example.description}</p>
                  {example.code && (
                    <pre className="bg-[#0D0D14] border border-[#2A2A3D] text-[#00FFA3] p-4 rounded-lg overflow-x-auto text-sm">
                      <code>{example.code}</code>
                    </pre>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Summary */}
        {lesson.summary && (
          <motion.div 
            className="mt-8 p-6 bg-gradient-to-r from-[#00FFA3]/10 to-[#00CC83]/10 rounded-2xl border border-[#00FFA3]/20 backdrop-blur-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <h4 className="font-bold text-white text-lg mb-3 flex items-center gap-2">
              <span>🎯</span>
              Key Takeaways
            </h4>
            <p className="text-[#A0A0B8] leading-relaxed text-lg">{lesson.summary}</p>
          </motion.div>
        )}
      </div>

      {/* Navigation */}
      <div className="p-6 border-t border-[#2A2A3D] bg-[#0D0D14] flex flex-col sm:flex-row gap-4 justify-between">
        <motion.button
          onClick={handlePrevLesson}
          disabled={currentLesson === 0}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
            currentLesson === 0
              ? 'bg-[#2A2A3D] text-[#A0A0B8] cursor-not-allowed'
              : 'bg-[#1B1B28] border border-[#2A2A3D] text-white hover:bg-[#0082FB] hover:border-[#0082FB]'
          }`}
          whileHover={{ scale: currentLesson === 0 ? 1 : 1.05 }}
        >
          <span>←</span>
          Previous Lesson
        </motion.button>
        
        <motion.button
          onClick={handleNextLesson}
          disabled={currentLesson === module.lessons.length - 1}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
            currentLesson === module.lessons.length - 1
              ? 'bg-[#2A2A3D] text-[#A0A0B8] cursor-not-allowed'
              : 'bg-[#1B1B28] border border-[#2A2A3D] text-white hover:bg-[#0082FB] hover:border-[#0082FB]'
          }`}
          whileHover={{ scale: currentLesson === module.lessons.length - 1 ? 1 : 1.05 }}
        >
          Next Lesson
          <span>→</span>
        </motion.button>
      </div>

      {/* Progress Bar */}
      <div className="px-6 pb-6">
        <div className="flex justify-between text-sm text-[#A0A0B8] mb-2">
          <span>Module Progress</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-[#2A2A3D] rounded-full h-2 overflow-hidden">
          <motion.div
            className="bg-gradient-to-r from-[#0082FB] to-[#0064E0] h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
      </div>
    </motion.div>
  );
};

export default LessonViewer;