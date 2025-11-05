import React, { useRef, useState } from 'react';
import { FiUploadCloud, FiFile, FiX, FiLoader } from 'react-icons/fi';

const FileUploadCard = ({ onFileUpload, isLoading = false }) => {
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      handleFileSelect(file);
    }
  };

  const handleFileSelect = (file) => {
    if (file && (file.type === 'application/pdf' || file.type.startsWith('image/'))) {
      setSelectedFile(file);
    } else {
      alert('Please upload a PDF or image file only.');
    }
  };

  const handleInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadFile = async () => {
    if (!selectedFile) return;
    
    try {
      await onFileUpload(selectedFile);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed. Please try again.');
    }
  };

  return (
    <div className="bg-[#1B1B28] rounded-xl p-6 border border-[#2A2A3D]">
      <h3 className="text-white text-lg font-semibold mb-4">Upload Your Notes</h3>
      
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive 
            ? 'border-[#7C5FFF] bg-[#2A2A3D]' 
            : 'border-[#2A2A3D] hover:border-[#A084FF]'
        } ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {isLoading ? (
          <div className="flex flex-col items-center justify-center">
            <FiLoader className="animate-spin text-[#7C5FFF] text-3xl mb-3" />
            <p className="text-[#A0A0B8]">Processing with AI...</p>
          </div>
        ) : (
          <>
            <FiUploadCloud className="mx-auto text-[#A0A0B8] text-3xl mb-3" />
            <p className="text-[#A0A0B8] mb-4">
              Drag & drop your PDF or image here, or click to browse
            </p>
            
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,image/*"
              onChange={handleInputChange}
              className="hidden"
              id="file-upload"
              disabled={isLoading}
            />
            
            <label
              htmlFor="file-upload"
              className="inline-block bg-[#7C5FFF] text-white px-6 py-2 rounded-lg cursor-pointer hover:bg-[#A084FF] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Browse Files
            </label>
          </>
        )}
      </div>

      {selectedFile && !isLoading && (
        <div className="mt-4 p-4 bg-[#2A2A3D] rounded-lg flex items-center justify-between">
          <div className="flex items-center">
            <FiFile className="text-[#A084FF] mr-3" />
            <span className="text-white text-sm truncate max-w-xs">
              {selectedFile.name}
            </span>
          </div>
          <button
            onClick={removeFile}
            className="text-[#A0A0B8] hover:text-white transition-colors"
          >
            <FiX size={20} />
          </button>
        </div>
      )}

      {selectedFile && !isLoading && (
        <button
          onClick={uploadFile}
          className="w-full mt-4 bg-[#7C5FFF] text-white py-3 rounded-lg font-medium hover:bg-[#A084FF] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!selectedFile || isLoading}
        >
          Process with AI
        </button>
      )}

      {isLoading && (
        <div className="w-full mt-4 bg-[#7C5FFF]/20 text-[#7C5FFF] py-3 rounded-lg font-medium text-center">
          <div className="flex items-center justify-center">
            <FiLoader className="animate-spin mr-2" />
            AI is processing your file...
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUploadCard;