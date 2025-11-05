// src/components/ui/Modal.jsx
import React, { useEffect } from "react";
import { X } from "lucide-react";

export const Modal = ({ 
  isOpen, 
  onClose, 
  children, 
  title, 
  className = '',
  size = 'md',
  closeOnOverlayClick = true
}) => {
  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full mx-4'
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;
  
  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-3 sm:p-4 animate-in fade-in-0 duration-300"
      onClick={closeOnOverlayClick ? onClose : undefined}
    >
      <div 
        className={`
          bg-[#1B1B28] border border-[#2A2A3D] rounded-xl sm:rounded-2xl 
          w-full ${sizes[size]} max-h-[90vh] overflow-y-auto shadow-2xl
          animate-in zoom-in-95 duration-300
          ${className}
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 sm:p-6 border-b border-[#2A2A3D] sticky top-0 bg-[#1B1B28] rounded-t-xl sm:rounded-t-2xl">
          <h2 className="text-lg sm:text-xl font-bold text-white">{title}</h2>
          <button
            className="w-8 h-8 flex items-center justify-center text-[#A0A0B8] hover:text-white hover:bg-[#2A2A3D] rounded-lg transition-all duration-200"
            onClick={onClose}
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;