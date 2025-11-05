import React from 'react';
import { motion } from 'framer-motion';
import { UserPlus, Loader } from 'lucide-react';
import { useFriends } from '../../hooks/useFriends';

const FriendButton = ({ username, size = 'default', variant = 'primary' }) => {
  const { sendRequest, isActionLoading } = useFriends();

  const handleAddFriend = async () => {
    try {
      await sendRequest(username, 'Hi! Let\'s learn together!');
    } catch (err) {
      console.error('Failed to send request:', err);
    }
  };

  const isLoading = isActionLoading(`send-${username}`);

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    default: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-base'
  };

  const variantClasses = {
    primary: 'bg-gradient-to-r from-[#0082FB] to-[#0064EO] hover:from-[#0070E0] hover:to-[#0055CC] text-white shadow-lg hover:shadow-xl',
    secondary: 'bg-[#1B1B28] hover:bg-[#2A2A3D] text-[#A0A0B8] hover:text-white border border-[#2A2A3D]',
    ghost: 'bg-transparent hover:bg-[#1B1B28] text-[#0082FB] hover:text-white'
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleAddFriend}
      disabled={isLoading}
      className={`
        inline-flex items-center gap-2 font-medium rounded-xl transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        ${sizeClasses[size]} ${variantClasses[variant]}
      `}
    >
      {isLoading ? (
        <>
          <Loader className="w-4 h-4 animate-spin" />
          <span className="hidden sm:inline">Sending...</span>
          <span className="sm:hidden">Sending</span>
        </>
      ) : (
        <>
          <UserPlus className="w-4 h-4" />
          <span className="hidden sm:inline">Add Friend</span>
          <span className="sm:hidden">Add</span>
        </>
      )}
    </motion.button>
  );
};

export default FriendButton;