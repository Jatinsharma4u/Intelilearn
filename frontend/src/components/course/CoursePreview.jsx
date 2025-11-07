import React from 'react';
import { motion } from 'framer-motion';

const CoursePreview = ({ files, settings, onBack, onCreateCourse, loading, creationStatus }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'processing': return 'from-yellow-500 to-orange-500';
      case 'extracting_text': return 'from-blue-500 to-purple-500';
      case 'analyzing_content': return 'from-purple-500 to-pink-500';
      case 'generating_course': return 'from-green-500 to-teal-500';
      default: return 'from-[#0082FB] to-[#0064E0]';
    }
  };

  const getStatusMessage = () => {
    switch (creationStatus) {
      case 'processing': return 'Initializing AI processor...';
      case 'extracting_text': return 'Extracting text from files...';
      case 'analyzing_content': return 'Analyzing content structure...';
      case 'generating_course': return 'Generating course content...';
      default: return 'Ready to create your course';
    }
  };

  return (
    <motion.div
      className="course-preview space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1B1B28] to-[#2A2A3D] rounded-2xl border border-[#0082FB]/20 p-6">
        <div className="flex items-center gap-4 mb-3">
          <div className="w-12 h-12 bg-gradient-to-br from-[#0082FB] to-[#0064E0] rounded-xl flex items-center justify-center">
            <span className="text-2xl">👁️</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">Course Preview</h2>
            <p className="text-[#A0A0B8]">Review your settings before AI generation</p>
          </div>
        </div>
        
        {/* AI Status Bar */}
        <div className="bg-[#0D0D14] rounded-xl p-4 border border-[#2A2A3D]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white text-sm font-medium">AI Status</span>
            <span className={`text-sm font-medium ${
              creationStatus ? 'text-[#00FFA3]' : 'text-[#A0A0B8]'
            }`}>
              {getStatusMessage()}
            </span>
          </div>
          <div className="w-full bg-[#2A2A3D] rounded-full h-2 overflow-hidden">
            <motion.div 
              className={`h-2 rounded-full bg-gradient-to-r ${getStatusColor(creationStatus)}`}
              initial={{ width: '0%' }}
              animate={{ 
                width: creationStatus === 'processing' ? '25%' : 
                       creationStatus === 'extracting_text' ? '50%' :
                       creationStatus === 'analyzing_content' ? '75%' :
                       creationStatus === 'generating_course' ? '90%' : '0%'
              }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Files Preview */}
        <motion.div 
          className="bg-[#1B1B28] rounded-2xl border border-[#2A2A3D] p-6"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-[#0082FB]/20 rounded-lg flex items-center justify-center">
              <span className="text-[#0082FB] text-lg">📁</span>
            </div>
            <h3 className="text-lg font-semibold text-white">Uploaded Files</h3>
            <span className="bg-[#0082FB] text-white text-xs px-2 py-1 rounded-full">
              {files.length} files
            </span>
          </div>
          
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {files.map((file, index) => (
              <motion.div 
                key={index}
                className="flex items-center justify-between p-4 bg-[#0D0D14] rounded-xl border border-[#2A2A3D] hover:border-[#0082FB]/40 transition-all group"
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#0082FB] to-[#0064E0] rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-xs">
                      {file.name.split('.').pop()?.toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-white text-sm truncate">{file.name}</p>
                    <p className="text-[#A0A0B8] text-xs">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <div className="text-[#00FFA3] text-lg group-hover:scale-110 transition-transform">
                  ✓
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Settings Preview */}
        <motion.div 
          className="bg-[#1B1B28] rounded-2xl border border-[#2A2A3D] p-6"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-[#00FFA3]/20 rounded-lg flex items-center justify-center">
              <span className="text-[#00FFA3] text-lg">⚙️</span>
            </div>
            <h3 className="text-lg font-semibold text-white">Course Settings</h3>
          </div>
          
          <div className="space-y-5">
            {/* Course Name */}
            <div className="bg-[#0D0D14] rounded-xl p-4 border border-[#2A2A3D]">
              <label className="text-sm font-medium text-[#A0A0B8] block mb-2">Course Name</label>
              <p className="text-white font-semibold text-lg truncate">{settings.courseName}</p>
            </div>
            
            {/* Grid Settings */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Modules', value: settings.modulesCount, icon: '📦' },
                { label: 'Questions/Module', value: settings.questionsPerModule, icon: '❓' },
                { label: 'Flashcards', value: settings.flashcardsCount, icon: '🎴' },
                { label: 'Difficulty', value: settings.difficulty, icon: '📊' }
              ].map((item, index) => (
                <motion.div 
                  key={item.label}
                  className="bg-[#0D0D14] rounded-xl p-4 border border-[#2A2A3D] text-center"
                  whileHover={{ scale: 1.05 }}
                >
                  <div className="text-2xl mb-2">{item.icon}</div>
                  <div className="text-xs text-[#A0A0B8] mb-1">{item.label}</div>
                  <div className="text-white font-bold text-lg capitalize">
                    {item.value}
                  </div>
                </motion.div>
              ))}
            </div>
            
            {/* Additional Settings */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: 'Pace', value: settings.learningPace },
                { label: 'Exam Type', value: settings.examType },
                { label: 'Depth', value: settings.depthLevel }
              ].map((item) => (
                <div key={item.label} className="bg-[#0D0D14] rounded-xl p-3 border border-[#2A2A3D] text-center">
                  <div className="text-xs text-[#A0A0B8] mb-1">{item.label}</div>
                  <div className="text-white font-semibold text-sm capitalize">{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Course Structure Estimate */}
      <motion.div 
        className="bg-gradient-to-br from-[#1B1B28] to-[#2A2A3D] rounded-2xl border border-[#00FFA3]/20 p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-[#00FFA3]/20 rounded-lg flex items-center justify-center">
            <span className="text-[#00FFA3] text-lg">📈</span>
          </div>
          <h3 className="text-lg font-semibold text-white">Estimated Course Structure</h3>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {[
            { 
              label: 'Total Modules', 
              value: settings.modulesCount,
              icon: '📦'
            },
            { 
              label: 'Estimated Lessons', 
              value: `${settings.modulesCount * 3}-${settings.modulesCount * 5}`,
              icon: '📚'
            },
            { 
              label: 'Quiz Questions', 
              value: settings.modulesCount * settings.questionsPerModule,
              icon: '❓'
            },
            { 
              label: 'Flashcards', 
              value: settings.flashcardsCount,
              icon: '🎴'
            },
            { 
              label: 'Duration', 
              value: `${settings.modulesCount * 30}-${settings.modulesCount * 45}m`,
              icon: '⏱️'
            }
          ].map((item, index) => (
            <motion.div 
              key={item.label}
              className="bg-[#0D0D14]/50 rounded-xl p-4 text-center border border-[#2A2A3D] backdrop-blur-sm"
              whileHover={{ scale: 1.05, borderColor: '#00FFA3' }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="text-2xl mb-2">{item.icon}</div>
              <div className="text-white font-bold text-lg mb-1">{item.value}</div>
              <div className="text-[#A0A0B8] text-xs">{item.label}</div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Action Buttons */}
      <motion.div 
        className="flex flex-col sm:flex-row gap-4 justify-between items-center pt-6 border-t border-[#2A2A3D]"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <button
          onClick={onBack}
          disabled={loading}
          className="w-full sm:w-auto px-8 py-4 bg-[#2A2A3D] hover:bg-[#3A3A4D] text-white rounded-xl font-medium transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-3 order-2 sm:order-1"
        >
          <span>←</span>
          <span>Back to Settings</span>
        </button>
        
        <button
          onClick={onCreateCourse}
          disabled={loading || creationStatus}
          className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-[#0082FB] to-[#0064E0] hover:from-[#0064E0] hover:to-[#0082FB] text-white rounded-xl font-medium transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-3 order-1 sm:order-2 shadow-lg shadow-[#0082FB]/25"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>AI is Creating...</span>
            </>
          ) : (
            <>
              <span className="text-xl">🤖</span>
              <span>Create Course with AI</span>
              <span className="text-lg">🚀</span>
            </>
          )}
        </button>
      </motion.div>

      {/* AI Info Card */}
      <motion.div 
        className="bg-gradient-to-r from-[#0082FB]/10 to-[#0064E0]/10 rounded-2xl border border-[#0082FB]/30 p-6 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-[#0082FB] to-[#0064E0] rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="text-2xl">✨</span>
          </div>
          <div>
            <h4 className="font-bold text-white mb-2 text-lg">AI Magic in Progress</h4>
            <p className="text-[#A0A0B8] leading-relaxed">
              Our advanced AI is analyzing your content to create an engaging learning experience. 
              You'll get structured lessons, interactive quizzes, and smart flashcards tailored to your learning style.
              <br />
              <span className="text-[#00FFA3] font-medium">Estimated time: 1-2 minutes</span>
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default CoursePreview;