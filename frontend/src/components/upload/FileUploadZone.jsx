// src/components/upload/FileUploadZone.jsx - UPDATED
import React, { useCallback, useState } from 'react';
import { Upload, File, X, CheckCircle, AlertCircle, BookOpen, Cpu } from 'lucide-react';

const FileUploadZone = ({ onFileSelect, isLoading = false }) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState('');

  const validateFile = (file) => {
    const validTypes = [
      'application/pdf', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    const maxSize = 50 * 1024 * 1024; // 50MB

    if (!validTypes.includes(file.type)) {
      throw new Error('Only PDF and DOCX files are allowed. Please select a valid file.');
    }

    if (file.size > maxSize) {
      throw new Error('File size must be less than 50MB. Please choose a smaller file.');
    }

    if (file.size === 0) {
      throw new Error('File appears to be empty. Please select a valid file.');
    }

    return true;
  };

  const handleFile = (file) => {
    try {
      setError('');
      validateFile(file);
      setSelectedFile(file);
    } catch (err) {
      setError(err.message);
      setSelectedFile(null);
    }
  };

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  }, []);

  const handleChange = (e) => {
    e.preventDefault();
    const files = e.target.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setError('');
  };

  const getFileIcon = (file) => {
    if (file.type === 'application/pdf') {
      return '📄';
    } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      return '📝';
    }
    return '📎';
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileTypeName = (file) => {
    if (file.type === 'application/pdf') return 'PDF Document';
    if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return 'Word Document';
    return 'Document';
  };

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      {!selectedFile && (
        <div
          className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 ${
            dragActive
              ? 'border-[#0082FB] bg-[#0082FB]/10'
              : 'border-[#2A2A3D] hover:border-[#0082FB] hover:bg-[#0082FB]/5'
          } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          onDragEnter={!isLoading ? handleDrag : undefined}
          onDragLeave={!isLoading ? handleDrag : undefined}
          onDragOver={!isLoading ? handleDrag : undefined}
          onDrop={!isLoading ? handleDrop : undefined}
        >
          <input
            type="file"
            id="file-upload"
            className="hidden"
            accept=".pdf,.docx"
            onChange={!isLoading ? handleChange : undefined}
            disabled={isLoading}
          />
          
          <div className="max-w-md mx-auto">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
              isLoading 
                ? 'bg-[#2A2A3D]' 
                : 'bg-gradient-to-br from-[#0082FB] to-[#0064EO]'
            }`}>
              {isLoading ? (
                <Cpu className="h-8 w-8 text-[#A0A0B8] animate-pulse" />
              ) : (
                <Upload className="h-8 w-8 text-white" />
              )}
            </div>
            
            <h3 className="text-xl font-semibold text-white mb-2">
              {isLoading ? 'Processing...' : 'Upload Learning Material'}
            </h3>
            
            <p className="text-[#A0A0B8] mb-6">
              {isLoading 
                ? 'Please wait while we process your request...'
                : 'Drag and drop your PDF or DOCX file here, or click to browse'
              }
            </p>

            {!isLoading && (
              <>
                <label
                  htmlFor="file-upload"
                  className="inline-flex items-center space-x-2 bg-gradient-to-r from-[#0082FB] to-[#0064EO] hover:from-[#0064EO] hover:to-[#0082FB] text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 hover:scale-105 cursor-pointer"
                >
                  <Upload className="h-4 w-4" />
                  <span>Choose File</span>
                </label>

                <div className="mt-4 text-xs text-[#A0A0B8] space-y-1">
                  <div>Supported formats: PDF, DOCX</div>
                  <div>Maximum file size: 50MB</div>
                  <div>AI will generate: Lessons, Quizzes, Flashcards</div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-center space-x-3 p-4 bg-[#FF4D6D]/10 border border-[#FF4D6D] rounded-xl">
          <AlertCircle className="h-5 w-5 text-[#FF4D6D] flex-shrink-0" />
          <div>
            <p className="text-[#FF4D6D] font-medium">Upload Error</p>
            <p className="text-[#FF4D6D] text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Selected File */}
      {selectedFile && (
        <div className="bg-[#0D0D14] border border-[#2A2A3D] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Selected File</h3>
            {!isLoading && (
              <button
                onClick={removeFile}
                className="p-2 hover:bg-[#2A2A3D] rounded-xl transition-colors"
                disabled={isLoading}
              >
                <X className="h-4 w-4 text-[#A0A0B8]" />
              </button>
            )}
          </div>

          <div className="flex items-center space-x-4 p-4 bg-[#1B1B28] rounded-xl">
            <div className="text-2xl">{getFileIcon(selectedFile)}</div>
            
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <span className="font-medium text-white truncate">{selectedFile.name}</span>
                <CheckCircle className="h-4 w-4 text-[#00FFA3] flex-shrink-0" />
              </div>
              <div className="text-sm text-[#A0A0B8] space-y-1">
                <div>{getFileTypeName(selectedFile)} • {formatFileSize(selectedFile.size)}</div>
                <div className="flex items-center space-x-2 text-xs">
                  <BookOpen className="h-3 w-3" />
                  <span>Ready for AI course generation</span>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => onFileSelect(selectedFile)}
            disabled={isLoading}
            className={`w-full mt-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
              isLoading
                ? 'bg-[#2A2A3D] text-[#A0A0B8] cursor-not-allowed'
                : 'bg-gradient-to-r from-[#0082FB] to-[#0064EO] hover:from-[#0064EO] hover:to-[#0082FB] text-white hover:scale-105'
            }`}
          >
            {isLoading ? (
              <div className="flex items-center justify-center space-x-2">
                <Cpu className="h-4 w-4 animate-spin" />
                <span>Processing...</span>
              </div>
            ) : (
              'Continue with This File'
            )}
          </button>

          {/* Course Generation Info */}
          {!isLoading && (
            <div className="mt-4 p-3 bg-[#1B1B28] rounded-xl border border-[#2A2A3D]">
              <div className="flex items-center space-x-2 mb-2">
                <Cpu className="h-4 w-4 text-[#0082FB]" />
                <span className="text-sm font-medium text-white">AI Will Generate:</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-[#A0A0B8]">
                <div className="flex items-center space-x-1">
                  <div className="w-1.5 h-1.5 bg-[#0082FB] rounded-full"></div>
                  <span>Interactive Lessons</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-1.5 h-1.5 bg-[#0082FB] rounded-full"></div>
                  <span>Quiz Questions</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-1.5 h-1.5 bg-[#0082FB] rounded-full"></div>
                  <span>Flashcards</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-1.5 h-1.5 bg-[#0082FB] rounded-full"></div>
                  <span>Progress Tracking</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Loading State */}
      {isLoading && !selectedFile && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0082FB] mx-auto mb-4"></div>
          <p className="text-[#A0A0B8]">Preparing upload...</p>
        </div>
      )}
    </div>
  );
};

export default FileUploadZone;