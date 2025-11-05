// src/components/ui/Tabs.jsx
import React from "react";

export const Tabs = ({ children, className = '' }) => {
  return <div className={className}>{children}</div>;
};

export const TabsList = ({ children, className = '' }) => {
  return (
    <div className={`flex space-x-1 p-1 bg-[#2A2A3D] rounded-lg sm:rounded-xl overflow-x-auto scrollbar-hide ${className}`}>
      {children}
    </div>
  );
};

export const TabsTrigger = ({ 
  value, 
  onClick, 
  active = false,
  className = '', 
  icon: Icon,
  ...props 
}) => {
  return (
    <button
      onClick={onClick}
      className={`
        px-3 sm:px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 
        flex items-center space-x-2 min-w-0 whitespace-nowrap flex-1 justify-center
        ${active 
          ? 'bg-gradient-to-r from-[#0082FB] to-[#0064EO] text-white shadow-lg' 
          : 'text-[#A0A0B8] hover:text-white hover:bg-[#1B1B28]'
        } ${className}
      `}
      {...props}
    >
      {Icon && <Icon className="w-4 h-4 flex-shrink-0" />}
      <span className="truncate">{props.children}</span>
    </button>
  );
};

export const TabsContent = ({ children, className = '' }) => {
  return <div className={`mt-4 ${className}`}>{children}</div>;
};

export const TabPanel = ({ id, activeTab, children, className = '' }) => {
  if (id !== activeTab) return null;
  return <div className={`mt-4 ${className}`}>{children}</div>;
};

export default Tabs;