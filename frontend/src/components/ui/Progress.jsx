// src/components/ui/Progress.jsx
import React from "react";

export const Progress = ({ 
  value, 
  className = '', 
  showLabel = false,
  size = 'md',
  variant = 'primary'
}) => {
  const sizes = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3'
  };

  const variants = {
    primary: 'from-[#0082FB] to-[#0064EO]',
    success: 'from-[#00FFA3] to-[#00CC83]',
    danger: 'from-[#FF4D6D] to-[#FF3355]',
    warning: 'from-[#FF9F5B] to-[#FFA45B]'
  };

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-[#A0A0B8]">Progress</span>
          <span className="text-sm font-semibold text-white">{Math.round(value)}%</span>
        </div>
      )}
      <div className={`w-full bg-[#2A2A3D] rounded-full ${sizes[size]} overflow-hidden`}>
        <div
          className={`bg-gradient-to-r ${variants[variant]} ${sizes[size]} rounded-full transition-all duration-500 ease-out relative overflow-hidden`}
          style={{ width: `${value}%` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
        </div>
      </div>
    </div>
  );
};

export default Progress;