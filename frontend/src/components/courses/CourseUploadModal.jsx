// src/components/courses/CourseUploadModal.jsx
import React from 'react';
import { createPortal } from 'react-dom';
import FileUploadZone from '../upload/FileUploadZone';
import { X } from 'lucide-react';

const CourseUploadModal = ({ onClose }) => {
  const handleFileSelect = (file) => {
    // Navigate to create course page with the file
    window.location.href = `/courses/create?file=${encodeURIComponent(file.name)}`;
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1B1B28] border border-[#2A2A3D] rounded-2xl w-full max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#2A2A3D]">
          <h2 className="text-xl font-bold text-white">Create New Course</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#2A2A3D] rounded-xl transition-colors"
          >
            <X className="h-5 w-5 text-[#A0A0B8]" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold text-white mb-2">
              Upload Your Learning Material
            </h3>
            <p className="text-[#A0A0B8]">
              Upload PDF or DOCX files to transform them into interactive AI-powered courses
            </p>
          </div>

          <FileUploadZone onFileSelect={handleFileSelect} />
        </div>
      </div>
    </div>,
    document.body
  );
};

export default CourseUploadModal;