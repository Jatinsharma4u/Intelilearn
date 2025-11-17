import React from 'react';

const TextArea = ({
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
  required = false,
  disabled = false,
  error = null,
  helperText = null,
  className = '',
  ...props
}) => {
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-white mb-2">
          {label}
          {required && <span className="text-[#FF4D6D] ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <textarea
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          rows={rows}
          disabled={disabled}
          required={required}
          className={`
            w-full px-4 py-3 bg-[#1B1B28] border rounded-lg
            text-white placeholder-[#A0A0B8] resize-none
            transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-[#0082FB] focus:border-transparent
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error 
              ? 'border-[#FF4D6D] focus:ring-[#FF4D6D]' 
              : 'border-[#2A2A3D] hover:border-[#0082FB]'
            }
            ${className}
          `}
          {...props}
        />
      </div>

      {(error || helperText) && (
        <p className={`mt-1 text-sm ${
          error ? 'text-[#FF4D6D]' : 'text-[#A0A0B8]'
        }`}>
          {error || helperText}
        </p>
      )}
    </div>
  );
};

export default TextArea;