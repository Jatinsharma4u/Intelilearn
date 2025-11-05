// src/components/ui/Input.jsx
import React from "react";
import { Eye, EyeOff } from "lucide-react";

export const Input = ({ 
  className = '', 
  icon: Icon, 
  size = 'md',
  error,
  success,
  type = 'text',
  showPasswordToggle = false,
  ...props 
}) => {
  const [showPassword, setShowPassword] = React.useState(false);
  
  const sizes = {
    sm: 'px-3 py-2 text-sm rounded-lg',
    md: 'px-4 py-3 text-base rounded-xl',
    lg: 'px-4 py-3.5 text-lg rounded-xl'
  };

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  const inputType = type === 'password' && showPassword ? 'text' : type;

  const getBorderColor = () => {
    if (error) return 'border-[#FF4D6D] focus:border-[#FF4D6D] focus:ring-[#FF4D6D]/20';
    if (success) return 'border-[#00FFA3] focus:border-[#00FFA3] focus:ring-[#00FFA3]/20';
    return 'border-[#2A2A3D] focus:border-[#0082FB] focus:ring-[#0082FB]/20';
  };

  return (
    <div className="w-full">
      <div className="relative">
        {/* Left Icon */}
        {Icon && (
          <div className={`absolute left-3 top-1/2 transform -translate-y-1/2 text-[#A0A0B8] z-10 ${props.disabled ? 'opacity-50' : ''}`}>
            <Icon className={iconSizes[size]} />
          </div>
        )}

        {/* Input Field */}
        <input
          type={inputType}
          className={`
            w-full bg-[#1B1B28] text-white placeholder-[#A0A0B8] 
            focus:outline-none focus:ring-2 transition-all duration-200
            ${sizes[size]}
            ${getBorderColor()}
            ${Icon ? 'pl-10' : 'pl-4'}
            ${showPasswordToggle && type === 'password' ? 'pr-10' : ''}
            ${props.disabled ? 'opacity-50 cursor-not-allowed' : ''}
            ${className}
          `}
          {...props}
        />

        {/* Password Toggle */}
        {showPasswordToggle && type === 'password' && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#A0A0B8] hover:text-white transition-colors duration-200"
          >
            {showPassword ? (
              <EyeOff className={iconSizes[size]} />
            ) : (
              <Eye className={iconSizes[size]} />
            )}
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <p className="text-[#FF4D6D] text-xs mt-2 ml-1 flex items-center space-x-1">
          <span>•</span>
          <span>{error}</span>
        </p>
      )}

      {/* Success Message */}
      {success && (
        <p className="text-[#00FFA3] text-xs mt-2 ml-1 flex items-center space-x-1">
          <span>•</span>
          <span>{success}</span>
        </p>
      )}
    </div>
  );
};

export default Input;