import React from 'react';
import { FiFileText, FiClock, FiTrash2 } from 'react-icons/fi';

const UploadedFileItem = ({ file, onDelete }) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getFileIcon = (type) => {
    if (type === 'pdf') return '📄';
    if (type.startsWith('image')) return '🖼️';
    return '📝';
  };

  return (
    <div className="bg-[#1B1B28] rounded-xl p-4 border border-[#2A2A3D] hover:border-[#A084FF] transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <div className="text-2xl mt-1">{getFileIcon(file.fileType)}</div>
          <div className="flex-1 min-w-0">
            <h4 className="text-white font-medium truncate">{file.fileName}</h4>
            <div className="flex items-center text-[#A0A0B8] text-sm mt-1">
              <FiClock className="mr-1" size={14} />
              <span>{formatDate(file.uploadDate)}</span>
            </div>
            <div className="flex items-center mt-2 space-x-4">
              <span className={`px-2 py-1 rounded text-xs ${
                file.status === 'processed' 
                  ? 'bg-[#00FFA3]/20 text-[#00FFA3]' 
                  : file.status === 'processing'
                  ? 'bg-[#FF9F5B]/20 text-[#FF9F5B]'
                  : 'bg-[#A0A0B8]/20 text-[#A0A0B8]'
              }`}>
                {file.status}
              </span>
              <span className="text-[#A0A0B8] text-xs">
                {file.subject}
              </span>
            </div>
          </div>
        </div>
        
        <button
          onClick={() => onDelete(file._id)}
          className="text-[#A0A0B8] hover:text-[#FF4D6D] transition-colors p-2"
          title="Delete file"
        >
          <FiTrash2 size={16} />
        </button>
      </div>
    </div>
  );
};

export default UploadedFileItem;