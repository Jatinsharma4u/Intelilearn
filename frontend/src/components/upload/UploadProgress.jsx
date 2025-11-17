// src/components/upload/UploadProgress.jsx - UPDATED
import React from 'react';
import { Loader, CheckCircle, File, Cpu, Sparkles } from 'lucide-react';

const UploadProgress = ({ progress, fileName, status, isGenerating = false }) => {
  const getStatusColor = () => {
    if (isGenerating) return 'from-[#FF6B35] to-[#FF8E53]';
    if (progress === 100) return 'from-[#00FFA3] to-[#00CC83]';
    return 'from-[#0082FB] to-[#0064EO]';
  };

  const getStatusIcon = () => {
    if (isGenerating) {
      return <Cpu className="h-6 w-6 text-white animate-pulse" />;
    }
    if (progress < 100) {
      return <Loader className="h-6 w-6 text-white animate-spin" />;
    }
    return <CheckCircle className="h-6 w-6 text-white" />;
  };

  const getStatusTitle = () => {
    if (isGenerating) return 'Generating Course';
    if (progress < 100) return 'Uploading File';
    return 'File Uploaded Successfully';
  };

  const getStatusMessage = () => {
    if (isGenerating) {
      return 'AI is creating your course content...';
    }
    if (progress < 25) return 'Starting upload process...';
    if (progress < 50) return 'Uploading file to server...';
    if (progress < 75) return 'Processing file content...';
    if (progress < 100) return 'Finalizing upload...';
    return 'Ready for course generation!';
  };

  return (
    <div className="bg-[#1B1B28] border border-[#2A2A3D] rounded-2xl p-6">
      <div className="flex items-center space-x-4 mb-6">
        <div className="relative">
          <div className={`w-12 h-12 bg-gradient-to-br ${getStatusColor()} rounded-xl flex items-center justify-center`}>
            {getStatusIcon()}
          </div>
          
          {/* Sparkle effect for generation */}
          {isGenerating && (
            <div className="absolute -top-1 -right-1">
              <Sparkles className="h-4 w-4 text-yellow-400 animate-ping" />
            </div>
          )}
        </div>
        
        <div className="flex-1">
          <h3 className="font-semibold text-white">
            {getStatusTitle()}
          </h3>
          <p className="text-[#A0A0B8] text-sm">{status || getStatusMessage()}</p>
        </div>
        
        <div className="text-right">
          <div className="text-lg font-bold text-white">
            {isGenerating ? 'Processing...' : `${progress}%`}
          </div>
          <div className="text-xs text-[#A0A0B8]">
            {isGenerating ? 'AI Working' : 'Complete'}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-[#2A2A3D] rounded-full h-3 mb-4">
        <div 
          className={`bg-gradient-to-r ${getStatusColor()} h-3 rounded-full transition-all duration-500 ${
            isGenerating ? 'animate-pulse' : ''
          }`}
          style={{ width: isGenerating ? '100%' : `${progress}%` }}
        ></div>
      </div>

      {/* File Info */}
      <div className="flex items-center space-x-3 p-3 bg-[#0D0D14] rounded-xl mb-4">
        <File className="h-4 w-4 text-[#0082FB]" />
        <span className="text-sm text-[#A0A0B8] flex-1 truncate">{fileName}</span>
        {isGenerating && (
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-xs text-green-400">Processing</span>
          </div>
        )}
      </div>

      {/* Status Details */}
      <div className="space-y-3">
        {/* Current Step */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-[#A0A0B8]">Current Step:</span>
          <span className="text-white font-medium">
            {isGenerating ? 'AI Course Generation' : 'File Upload'}
          </span>
        </div>

        {/* Estimated Time */}
        {isGenerating && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-[#A0A0B8]">Estimated Time:</span>
            <span className="text-white font-medium">2-5 minutes</span>
          </div>
        )}

        {/* Status Message */}
        <div className="p-3 bg-[#0D0D14] rounded-xl border border-[#2A2A3D]">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              isGenerating ? 'bg-[#FF6B35] animate-pulse' : 'bg-[#0082FB]'
            }`}></div>
            <p className="text-sm text-[#A0A0B8]">
              {getStatusMessage()}
            </p>
          </div>
        </div>
      </div>

      {/* Tips for Generation */}
      {isGenerating && (
        <div className="mt-4 p-3 bg-[#0D0D14] rounded-xl border border-[#2A2A3D]">
          <div className="flex items-center space-x-2 mb-2">
            <Sparkles className="h-4 w-4 text-yellow-400" />
            <span className="text-sm font-medium text-white">AI is Creating:</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="text-[#A0A0B8]">• Course Modules</div>
            <div className="text-[#A0A0B8]">• Lesson Content</div>
            <div className="text-[#A0A0B8]">• Quiz Questions</div>
            <div className="text-[#A0A0B8]">• Flashcards</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadProgress;