import React, { useState, useRef } from 'react';

const FileUploadZone = ({ onFileSelect, acceptedTypes, maxSize, multiple = false }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileInput = (e) => {
    const files = Array.from(e.target.files);
    handleFiles(files);
  };

  const handleFiles = (files) => {
    if (files.length === 0) return;

    if (!multiple && files.length > 1) {
      alert('Please select only one file');
      return;
    }

    const file = files[0]; // For now, handle single file
    if (acceptedTypes && !acceptedTypes.includes(file.type)) {
      alert(`Please select a valid file type. Accepted types: ${acceptedTypes.join(', ')}`);
      return;
    }

    if (maxSize && file.size > maxSize) {
      alert(`File size must be less than ${maxSize / 1024 / 1024}MB`);
      return;
    }

    onFileSelect(file);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="file-upload-zone">
      <div
        className={`upload-area ${isDragging ? 'dragging' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <div className="upload-content">
          <div className="upload-icon">📁</div>
          <div className="upload-text">
            <p className="primary-text">Click to upload or drag and drop</p>
            <p className="secondary-text">
              {acceptedTypes?.includes('application/pdf') ? 'PDF files only' : 'Select a file'}
              {maxSize && ` • Max size: ${maxSize / 1024 / 1024}MB`}
            </p>
          </div>
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedTypes?.join(',')}
          multiple={multiple}
          onChange={handleFileInput}
          style={{ display: 'none' }}
        />
      </div>
      
      <style jsx>{`
        .file-upload-zone {
          width: 100%;
        }
        
        .upload-area {
          border: 2px dashed #2A2A3D;
          border-radius: 12px;
          padding: 40px 20px;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s ease;
          background: #1B1B28;
        }
        
        .upload-area:hover {
          border-color: #0082FB;
          background: rgba(0, 130, 251, 0.05);
        }
        
        .upload-area.dragging {
          border-color: #0082FB;
          background: rgba(0, 130, 251, 0.1);
        }
        
        .upload-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }
        
        .upload-icon {
          font-size: 48px;
        }
        
        .upload-text {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        
        .primary-text {
          color: #FFFFFF;
          font-size: 16px;
          font-weight: 500;
          margin: 0;
        }
        
        .secondary-text {
          color: #A0A0B8;
          font-size: 14px;
          margin: 0;
        }
        
        @media (max-width: 768px) {
          .upload-area {
            padding: 30px 16px;
          }
          
          .upload-icon {
            font-size: 36px;
          }
          
          .primary-text {
            font-size: 14px;
          }
          
          .secondary-text {
            font-size: 12px;
          }
        }
      `}</style>
    </div>
  );
};

export default FileUploadZone;