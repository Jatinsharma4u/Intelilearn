import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';

const FileUpload = ({ onFilesUpload }) => {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const onDrop = useCallback((acceptedFiles) => {
    setIsProcessing(true);
    
    const newFiles = acceptedFiles.map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      type: file.type,
      uploadTime: new Date().toLocaleTimeString()
    }));
    
    // Simulate upload delay for better UX
    setTimeout(() => {
      setUploadedFiles(prev => [...prev, ...newFiles]);
      setIsProcessing(false);
    }, 800);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.ms-powerpoint': ['.ppt'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt']
    },
    maxSize: 50 * 1024 * 1024,
    multiple: true
  });

  const removeFile = (id) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== id));
  };

  const handleContinue = () => {
    if (uploadedFiles.length === 0) {
      return;
    }
    onFilesUpload(uploadedFiles.map(f => f.file));
  };

  const getFileIcon = (type) => {
    if (type.includes('pdf')) return '📕';
    if (type.includes('powerpoint') || type.includes('presentation')) return '📊';
    if (type.includes('word') || type.includes('document')) return '📄';
    if (type.includes('text')) return '📝';
    return '📁';
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <motion.div
      className="file-upload space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Dropzone Area */}
      <motion.div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300
          ${isDragActive 
            ? 'border-[#0082FB] bg-[#0082FB]/10 scale-[1.02]' 
            : 'border-[#2A2A3D] bg-[#1B1B28] hover:border-[#0082FB]/50 hover:bg-[#1B1B28]/80'
          }
        `}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <input {...getInputProps()} />
        
        <motion.div 
          className="dropzone-content space-y-4"
          initial={{ y: 10 }}
          animate={{ y: 0 }}
        >
          <motion.div 
            className="upload-icon text-6xl"
            animate={{ 
              scale: isDragActive ? 1.2 : 1,
              y: isDragActive ? -5 : 0 
            }}
          >
            {isDragActive ? '🎉' : '📁'}
          </motion.div>
          
          <div>
            <h3 className="text-xl font-bold text-white mb-2">
              {isDragActive ? 'Drop to Upload!' : 'Add Study Materials'}
            </h3>
            <p className="text-[#A0A0B8] mb-1">
              Drag & drop your files here, or click to browse
            </p>
            <p className="text-[#A0A0B8] text-sm">
              Supports: PDF, PPT, DOC, TXT • Max 50MB per file
            </p>
          </div>

          <motion.button
            type="button"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#0082FB] hover:bg-[#0064E0] text-white rounded-xl font-medium transition-colors duration-200"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span>📂</span>
            Browse Files
          </motion.button>
        </motion.div>

        {/* Processing Overlay */}
        <AnimatePresence>
          {isProcessing && (
            <motion.div
              className="absolute inset-0 bg-[#0D0D14]/80 rounded-2xl flex items-center justify-center backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-[#0082FB] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-white text-sm">Processing files...</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Uploaded Files */}
      <AnimatePresence>
        {uploadedFiles.length > 0 && (
          <motion.div
            className="uploaded-files bg-[#1B1B28] rounded-2xl border border-[#2A2A3D] p-6"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#00FFA3]/20 rounded-lg flex items-center justify-center">
                  <span className="text-[#00FFA3] text-lg">✅</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Uploaded Files</h3>
                  <p className="text-[#A0A0B8] text-sm">
                    {uploadedFiles.length} file{uploadedFiles.length !== 1 ? 's' : ''} ready
                  </p>
                </div>
              </div>
              <div className="bg-[#0082FB] text-white text-sm px-3 py-1 rounded-full">
                {uploadedFiles.length}
              </div>
            </div>

            <div className="space-y-3 max-h-64 overflow-y-auto">
              {uploadedFiles.map((file, index) => (
                <motion.div
                  key={file.id}
                  className="flex items-center justify-between p-4 bg-[#0D0D14] rounded-xl border border-[#2A2A3D] group hover:border-[#00FFA3]/30 transition-all"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#0082FB] to-[#0064E0] rounded-xl flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-lg">
                        {getFileIcon(file.type)}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-white text-sm truncate">
                        {file.name}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-[#A0A0B8]">
                        <span>{formatFileSize(file.size)}</span>
                        <span>•</span>
                        <span>Uploaded {file.uploadTime}</span>
                      </div>
                    </div>
                  </div>
                  
                  <motion.button
                    onClick={() => removeFile(file.id)}
                    className="w-8 h-8 bg-[#2A2A3D] text-[#A0A0B8] rounded-lg flex items-center justify-center hover:bg-[#FF4D6D] hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    ×
                  </motion.button>
                </motion.div>
              ))}
            </div>

            {/* Continue Button */}
            <motion.button
              onClick={handleContinue}
              className="w-full mt-6 px-6 py-4 bg-gradient-to-r from-[#00FFA3] to-[#00CC83] hover:from-[#00CC83] hover:to-[#00FFA3] text-[#0D0D14] rounded-xl font-bold transition-all duration-200 flex items-center justify-center gap-3 shadow-lg shadow-[#00FFA3]/20"
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="text-lg">🚀</span>
              <span>Continue to Settings</span>
              <span className="text-lg">⚙️</span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* File Type Info */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { type: 'PDF', icon: '📕', color: '#FF4D6D' },
          { type: 'PPT', icon: '📊', color: '#FF9F5B' },
          { type: 'DOC', icon: '📄', color: '#0082FB' },
          { type: 'TXT', icon: '📝', color: '#00FFA3' }
        ].map((fileType) => (
          <motion.div
            key={fileType.type}
            className="bg-[#1B1B28] rounded-xl p-3 text-center border border-[#2A2A3D]"
            whileHover={{ scale: 1.05, borderColor: fileType.color }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="text-2xl mb-2">{fileType.icon}</div>
            <div className="text-white text-sm font-medium">{fileType.type}</div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default FileUpload;