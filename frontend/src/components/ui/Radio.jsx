import React from 'react';

const Radio = ({
  name,
  value,
  checked,
  onChange,
  label,
  disabled = false,
  className = "",
  size = "md"
}) => {
  const sizes = {
    sm: {
      radio: "w-4 h-4",
      label: "text-sm"
    },
    md: {
      radio: "w-5 h-5",
      label: "text-base"
    },
    lg: {
      radio: "w-6 h-6",
      label: "text-lg"
    }
  };

  const currentSize = sizes[size];

  const handleChange = (e) => {
    if (!disabled) {
      onChange?.(e.target.value);
    }
  };

  return (
    <label className={`
      radio-container flex items-center space-x-3 cursor-pointer
      ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      ${className}
    `}>
      <div className="relative">
        <input
          type="radio"
          name={name}
          value={value}
          checked={checked}
          onChange={handleChange}
          disabled={disabled}
          className={`
            appearance-none border-2 rounded-full transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-[#0082FB] focus:ring-offset-2 focus:ring-offset-[#1B1B28]
            ${currentSize.radio}
            ${checked 
              ? 'border-[#0082FB] bg-[#0082FB]' 
              : 'border-[#2A2A3D] bg-[#1B1B28] hover:border-[#0082FB]'
            }
            ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
          `}
        />
        {checked && (
          <div className={`
            absolute inset-0 flex items-center justify-center
            ${currentSize.radio}
          `}>
            <div className="w-1/2 h-1/2 bg-white rounded-full"></div>
          </div>
        )}
      </div>
      
      {label && (
        <span className={`
          radio-label text-white
          ${currentSize.label}
          ${disabled ? 'text-[#A0A0B8]' : 'text-white'}
        `}>
          {label}
        </span>
      )}
    </label>
  );
};

export default Radio;