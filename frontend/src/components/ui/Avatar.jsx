import React, { useState } from 'react';
import { User } from 'lucide-react';

const Avatar = ({ 
  user,           // User object {avatar, fullName, username}
  src,            // Direct image source
  alt,            // Direct alt text
  size = 'md', 
  className = '',
  showOnline = false,
  onClick,
  fallback = null
}) => {
  // Handle both user object and direct props
  const avatarSrc = src || user?.avatar;
  const avatarAlt = alt || user?.fullName || user?.username || 'User Avatar';
  const userName = user?.fullName || user?.username || '';
  
  const [imageError, setImageError] = useState(false);

  // Size classes
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-base',
    xl: 'w-20 h-20 text-lg'
  };

  // Get user initials for fallback
  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Background colors based on username for consistent avatars
  const getBackgroundColor = (username) => {
    if (!username) return 'bg-gradient-to-br from-[#7C5FFF] to-[#A084FF]';
    
    const colors = [
      'bg-gradient-to-br from-[#3B82F6] to-[#1E40AF]',
      'bg-gradient-to-br from-[#10B981] to-[#059669]',
      'bg-gradient-to-br from-[#7C5FFF] to-[#A084FF]',
      'bg-gradient-to-br from-[#EC4899] to-[#BE185D]',
      'bg-gradient-to-br from-[#F59E0B] to-[#D97706]',
      'bg-gradient-to-br from-[#06B6D4] to-[#0891B2]',
      'bg-gradient-to-br from-[#EF4444] to-[#DC2626]',
      'bg-gradient-to-br from-[#8B5CF6] to-[#7C3AED]'
    ];
    
    const index = username.charCodeAt(0) % colors.length;
    return colors[index];
  };

  // Custom fallback component
  const defaultFallback = (
    <div 
      className={`
        ${sizeClasses[size]} 
        ${getBackgroundColor(user?.username)}
        rounded-full flex items-center justify-center
        text-white font-semibold
        border-2 border-white/20
        ${className}
      `}
      onClick={onClick}
    >
      {getInitials(userName)}
    </div>
  );

  // If no image source or image failed to load
  if (!avatarSrc || imageError) {
    return fallback || defaultFallback;
  }

  return (
    <div className="relative inline-block">
      {/* User avatar image */}
      <img
        src={avatarSrc}
        alt={avatarAlt}
        onError={() => setImageError(true)}
        className={`
          ${sizeClasses[size]} 
          rounded-full object-cover
          border-2 border-white/20
          ${className}
        `}
        onClick={onClick}
      />
      
      {/* Online status indicator */}
      {showOnline && user?.isOnline && (
        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
      )}
    </div>
  );
};

export default Avatar;