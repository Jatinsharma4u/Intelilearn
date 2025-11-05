import React from "react";

export const Badge = ({ 
  children, 
  variant = 'primary', 
  className = '', 
  icon: Icon,
  size = 'md'
}) => {
  const variants = {
    primary: 'bg-gradient-to-r from-[#0082FB] to-[#0064EO] text-white',
    secondary: 'bg-[#2A2A3D] text-[#A0A0B8] border border-[#2A2A3D]',
    success: 'bg-gradient-to-r from-[#00FFA3] to-[#00CC83] text-white',
    warning: 'bg-gradient-to-r from-[#FF9F5B] to-[#FFA45B] text-white',
    error: 'bg-gradient-to-r from-[#FF4D6D] to-[#FF3355] text-white',
    outline: 'border border-[#0082FB] text-[#0082FB] bg-transparent',
    info: 'bg-[#0082FB]/10 text-[#0082FB] border border-[#0082FB]/20',
    success_light: 'bg-[#00FFA3]/10 text-[#00FFA3] border border-[#00FFA3]/20',
    warning_light: 'bg-[#FF9F5B]/10 text-[#FF9F5B] border border-[#FF9F5B]/20',
    error_light: 'bg-[#FF4D6D]/10 text-[#FF4D6D] border border-[#FF4D6D]/20'
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm'
  };

  const iconSizes = {
    sm: 'w-2.5 h-2.5',
    md: 'w-3 h-3',
    lg: 'w-3.5 h-3.5'
  };

  return (
    <span className={`
      inline-flex items-center rounded-full font-medium transition-all duration-200
      ${variants[variant]} ${sizes[size]} ${className}
    `}>
      {Icon && <Icon className={`${iconSizes[size]} mr-1.5 flex-shrink-0`} />}
      {children}
    </span>
  );
};

export default Badge;