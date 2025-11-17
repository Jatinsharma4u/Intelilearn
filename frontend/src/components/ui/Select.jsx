import React from 'react';

const Select = ({ 
  value, 
  onChange, 
  options = [], 
  placeholder = "Select...",
  className = '',
  disabled = false,
  size = "md",
  fullWidth = true,
  ...props 
}) => {
  const sizes = {
    sm: "px-3 py-2 text-sm",
    md: "px-4 py-3 text-base", 
    lg: "px-4 py-4 text-lg"
  };

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={`
        ${sizes[size]}
        border border-[#2A2A3D] rounded-xl
        focus:outline-none focus:ring-2 focus:ring-[#0082FB] focus:border-[#0082FB]
        bg-[#1B1B28] text-white
        disabled:bg-[#2A2A3D] disabled:text-[#A0A0B8] disabled:cursor-not-allowed
        transition-all duration-200
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      {...props}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options.map((option) => (
        <option 
          key={option.value} 
          value={option.value}
          className="bg-[#1B1B28] text-white"
        >
          {option.label}
        </option>
      ))}
    </select>
  );
};

export default Select;