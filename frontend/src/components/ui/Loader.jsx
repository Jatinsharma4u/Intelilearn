// src/components/ui/Loader.jsx
import React from "react";

const Loader = ({ 
  size = 'md', 
  variant = 'primary',
  className = '' 
}) => {
  const sizes = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const variants = {
    primary: 'border-[#2A2A3D] border-t-[#0082FB]',
    success: 'border-[#2A2A3D] border-t-[#00FFA3]',
    danger: 'border-[#2A2A3D] border-t-[#FF4D6D]',
    warning: 'border-[#2A2A3D] border-t-[#FF9F5B]'
  };

  return (
    <div className={`flex justify-center items-center ${className}`}>
      <div 
        className={`
          ${sizes[size]} border-4 rounded-full animate-spin
          ${variants[variant]}
        `}
      ></div>
    </div>
  );
};

export default Loader;