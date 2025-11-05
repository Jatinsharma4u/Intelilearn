// src/components/ui/Button.jsx
import React from "react";

export const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  icon: Icon,
  loading = false,
  fullWidth = false,
  disabled = false,
  ...props 
}) => {
  const variants = {
    primary: 'bg-gradient-to-r from-[#0082FB] to-[#0064E0] hover:from-[#0070E0] hover:to-[#0055CC] text-white shadow-lg hover:shadow-xl shadow-[#0082FB]/25 hover:scale-105 active:scale-95 transition-all duration-200',
    secondary: 'bg-[#2A2A3D] hover:bg-[#3A3A4D] text-[#A0A0B8] hover:text-white border border-[#2A2A3D] hover:border-[#0082FB]/30 shadow-lg hover:shadow-xl transition-all duration-200',
    ghost: 'bg-transparent hover:bg-[#2A2A3D] text-[#A0A0B8] hover:text-white border border-transparent hover:border-[#2A2A3D] transition-all duration-200',
    success: 'bg-gradient-to-r from-[#00F2A6] to-[#00C982] hover:from-[#00E69B] hover:to-[#00B875] text-gray-900 shadow-lg hover:shadow-xl shadow-[#00F2A6]/40 hover:scale-105 active:scale-95 transition-all duration-200 font-bold',
    danger: 'bg-gradient-to-r from-[#FF4757] to-[#FF3742] hover:from-[#E64050] hover:to-[#D92B3A] text-white shadow-lg hover:shadow-xl shadow-[#FF4757]/25 hover:scale-105 active:scale-95 transition-all duration-200',
    warning: 'bg-gradient-to-r from-[#FFA726] to-[#FF9800] hover:from-[#E69622] hover:to-[#D98600] text-gray-900 shadow-lg hover:shadow-xl shadow-[#FFA726]/25 hover:scale-105 active:scale-95 transition-all duration-200 font-bold',
    outline: 'bg-transparent border border-[#2A2A3D] text-[#A0A0B8] hover:border-[#0082FB] hover:text-white hover:bg-[#0082FB]/10 transition-all duration-200'
  };

  const sizes = {
    sm: 'px-3 py-2 text-xs rounded-lg gap-1.5',
    md: 'px-4 py-2.5 text-sm rounded-xl gap-2',
    lg: 'px-6 py-3 text-base rounded-xl gap-2.5'
  };

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  return (
    <button
      className={`
        font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
        disabled:hover:scale-100
        inline-flex items-center justify-center ${variants[variant]} ${sizes[size]} 
        ${fullWidth ? 'w-full' : ''} 
        ${loading ? 'cursor-wait' : ''}
        ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <div className={`${iconSizes[size]} border-2 border-current border-t-transparent rounded-full animate-spin`} />
      ) : Icon ? (
        <Icon className={`${iconSizes[size]} flex-shrink-0`} />
      ) : null}
      {children}
    </button>
  );
};

export default Button;