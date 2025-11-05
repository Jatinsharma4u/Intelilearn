// src/components/ui/Card.jsx
import React from "react";

export const Card = ({ 
  children, 
  className = '', 
  hover = false, 
  padding = 'default',
  variant = 'default'
}) => {
  const paddingClasses = {
    none: '',
    sm: 'p-4 sm:p-5',
    default: 'p-5 sm:p-6',
    lg: 'p-6 sm:p-8'
  };

  const variants = {
    default: 'bg-[#1B1B28] border border-[#2A2A3D]',
    elevated: 'bg-[#1B1B28] border border-[#2A2A3D] shadow-lg shadow-black/10',
    gradient: 'bg-gradient-to-br from-[#1B1B28] to-[#2A2A3D] border border-[#2A2A3D]'
  };

  return (
    <div
      className={`
        rounded-2xl backdrop-blur-sm
        ${variants[variant]}
        ${paddingClasses[padding]}
        ${hover ? 'hover:border-[#0082FB]/30 hover:shadow-xl hover:shadow-[#0082FB]/10 transition-all duration-300' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ 
  children, 
  className = '', 
  padding = 'default',
  divider = true 
}) => {
  const paddingClasses = {
    none: '',
    sm: 'p-4 sm:p-5',
    default: 'p-5 sm:p-6',
    lg: 'p-6 sm:p-8'
  };

  return (
    <div className={`
      ${paddingClasses[padding]} 
      ${divider ? 'border-b border-[#2A2A3D]' : ''}
      ${className}
    `}>
      {children}
    </div>
  );
};

export const CardTitle = ({ 
  children, 
  className = '',
  size = 'lg'
}) => {
  const sizes = {
    sm: 'text-base font-semibold',
    md: 'text-lg font-semibold',
    lg: 'text-xl font-bold'
  };

  return (
    <h3 className={`${sizes[size]} text-white ${className}`}>
      {children}
    </h3>
  );
};

export const CardDescription = ({ 
  children, 
  className = '',
  size = 'sm'
}) => {
  const sizes = {
    sm: 'text-sm',
    md: 'text-base'
  };

  return (
    <p className={`${sizes[size]} text-[#A0A0B8] mt-1.5 ${className}`}>
      {children}
    </p>
  );
};

export const CardContent = ({ 
  children, 
  className = '', 
  padding = 'default' 
}) => {
  const paddingClasses = {
    none: '',
    sm: 'p-4 sm:p-5',
    default: 'p-5 sm:p-6',
    lg: 'p-6 sm:p-8'
  };

  return (
    <div className={`${paddingClasses[padding]} ${className}`}>
      {children}
    </div>
  );
};

export const CardFooter = ({ 
  children, 
  className = '', 
  padding = 'default',
  divider = true 
}) => {
  const paddingClasses = {
    none: '',
    sm: 'p-4 sm:p-5',
    default: 'p-5 sm:p-6',
    lg: 'p-6 sm:p-8'
  };

  return (
    <div className={`
      ${paddingClasses[padding]} 
      ${divider ? 'border-t border-[#2A2A3D]' : ''}
      ${className}
    `}>
      {children}
    </div>
  );
};

// Default export
export default Card;