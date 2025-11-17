import React from 'react';

const Switch = ({ 
  checked, 
  onChange, 
  label,
  disabled = false,
  className = '' 
}) => {
  return (
    <label className={`flex items-center space-x-3 cursor-pointer ${className}`}>
      <div className="relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="sr-only"
        />
        <div className={`
          w-12 h-6 rounded-full transition-colors duration-200
          ${checked ? 'bg-blue-500' : 'bg-gray-300'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `} />
        <div className={`
          absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-200
          ${checked ? 'transform translate-x-6' : ''}
        `} />
      </div>
      {label && (
        <span className={`text-sm font-medium ${
          disabled ? 'text-gray-500' : 'text-gray-700'
        }`}>
          {label}
        </span>
      )}
    </label>
  );
};

export default Switch;