// src/components/ui/Tooltip.jsx
import React from "react";

export const Tooltip = ({ 
  text, 
  children, 
  position = "top", 
  className = '',
  delay = 100 
}) => {
  const positions = {
    top: "bottom-full mb-2 left-1/2 transform -translate-x-1/2",
    bottom: "top-full mt-2 left-1/2 transform -translate-x-1/2",
    left: "right-full mr-2 top-1/2 transform -translate-y-1/2",
    right: "left-full ml-2 top-1/2 transform -translate-y-1/2"
  };

  const arrows = {
    top: '-bottom-1 left-1/2 -translate-x-1/2 border-t-[#1B1B28]',
    bottom: '-top-1 left-1/2 -translate-x-1/2 border-b-[#1B1B28]',
    left: '-right-1 top-1/2 -translate-y-1/2 border-l-[#1B1B28]',
    right: '-left-1 top-1/2 -translate-y-1/2 border-r-[#1B1B28]'
  };

  return (
    <div className={`relative group inline-block ${className}`}>
      {children}
      <div 
        className={`
          absolute ${positions[position]} hidden group-hover:block 
          bg-[#1B1B28] text-white text-xs rounded-lg px-3 py-2 z-50 
          border border-[#2A2A3D] shadow-2xl whitespace-nowrap
          animate-in fade-in-0 zoom-in-95
        `}
        style={{ transitionDelay: `${delay}ms` }}
      >
        {text}
        <div className={`absolute w-0 h-0 border-4 border-transparent ${arrows[position]}`}></div>
      </div>
    </div>
  );
};

export default Tooltip;