import React from 'react';
import { Button } from './index';

const EmptyState = ({ 
  title, 
  description, 
  icon = "📝", 
  action = null,
  size = "md",
  className = "" 
}) => {
  const sizes = {
    sm: {
      icon: "text-4xl",
      title: "text-lg",
      description: "text-sm",
      padding: "py-6"
    },
    md: {
      icon: "text-5xl",
      title: "text-xl",
      description: "text-base",
      padding: "py-8"
    },
    lg: {
      icon: "text-6xl",
      title: "text-2xl",
      description: "text-lg",
      padding: "py-12"
    }
  };

  const currentSize = sizes[size];

  // Agar icon ek React component hai toh use render karo, nahi toh string ko display karo
  const renderIcon = () => {
    if (typeof icon === 'string') {
      return <div className={`empty-icon ${currentSize.icon} mb-4`}>{icon}</div>;
    }
    
    // Agar icon ek React component hai
    const IconComponent = icon;
    return (
      <div className={`empty-icon ${currentSize.icon} mb-4 flex justify-center`}>
        <IconComponent className="w-full h-full text-[#A0A0B8]" />
      </div>
    );
  };

  // Action ko properly handle karo
  const renderAction = () => {
    if (!action) return null;
    
    // Agar action ek React element hai
    if (React.isValidElement(action)) {
      return <div className="empty-action">{action}</div>;
    }
    
    // Agar action ek object hai (purana format)
    if (typeof action === 'object' && action.label) {
      return (
        <Button
          variant={action.variant || "primary"}
          size={action.size || "md"}
          onClick={action.onClick}
          className="empty-action"
        >
          {action.label}
        </Button>
      );
    }
    
    return null;
  };

  return (
    <div className={`empty-state text-center ${currentSize.padding} ${className}`}>
      <div className="empty-content">
        {icon && renderIcon()}
        
        {title && (
          <h3 className={`empty-title ${currentSize.title} font-semibold text-white mb-2`}>
            {title}
          </h3>
        )}
        
        {description && (
          <p className={`empty-description ${currentSize.description} text-[#A0A0B8] max-w-md mx-auto mb-6`}>
            {description}
          </p>
        )}
        
        {renderAction()}
      </div>
    </div>
  );
};

export default EmptyState;