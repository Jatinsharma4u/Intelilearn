import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sword, User, Calendar, Award, MessageCircle, Trash2, Eye } from 'lucide-react';
import Avatar from '../ui/Avatar';
import { Button } from '../ui/Button';

const FriendList = ({ friends, onRemove, onChallenge, onMessage }) => {
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(null);

  const handleProfileClick = (friend) => {
    // Navigate to friend's public profile in same window
    window.location.href = `/profile/${friend.username}`;
  };

  const handleRemoveClick = (friend) => {
    setShowRemoveConfirm(friend.friendshipId);
  };

  const confirmRemove = (friend) => {
    onRemove(friend.friendshipId, friend.fullName);
    setShowRemoveConfirm(null);
  };

  const cancelRemove = () => {
    setShowRemoveConfirm(null);
  };

  if (friends.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-8 lg:py-12"
      >
        <div className="w-14 h-14 lg:w-16 lg:h-16 bg-gradient-to-br from-[#0082FB]/20 to-[#0064EO]/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <User className="w-6 h-6 lg:w-8 lg:h-8 text-[#0082FB]" />
        </div>
        <h3 className="text-lg lg:text-xl font-bold text-white mb-2">No Friends Yet</h3>
        <p className="text-[#A0A0B8] text-sm max-w-sm mx-auto px-2">
          Start by adding friends to challenge them and learn together!
        </p>
      </motion.div>
    );
  }

  return (
    <div className="grid gap-3 lg:gap-4">
      <AnimatePresence>
        {friends.map((friend, index) => (
          <motion.div
            key={friend.friendshipId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -2 }}
            className="group relative bg-[#1B1B28] rounded-xl p-4 border border-[#2A2A3D] hover:border-[#0082FB]/40 transition-all duration-300"
          >
            {/* Online Status */}
            {friend.isOnline && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#00FFA3] rounded-full border-2 border-[#1B1B28] z-10">
                <div className="w-1 h-1 bg-white rounded-full animate-pulse mx-auto mt-0.5" />
              </div>
            )}

            <div className="flex items-start justify-between mb-3">
              {/* Clickable Profile Section */}
              <div 
                className="flex items-center gap-3 flex-1 cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => handleProfileClick(friend)}
              >
                <Avatar 
                  src={friend.avatar} 
                  alt={friend.fullName}
                  size="md"
                  className="ring-2 ring-[#0082FB]/30 group-hover:ring-[#0082FB]/50 transition-all"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-white text-base leading-tight truncate">
                      {friend.fullName}
                    </h3>
                    <Eye className="w-3 h-3 text-[#0082FB] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <p className="text-[#0082FB] font-medium text-sm truncate mb-1">
                    @{friend.username}
                  </p>
                  
                  {/* Stats */}
                  <div className="flex items-center gap-2 lg:gap-3 text-xs text-[#A0A0B8]">
                    <div className="flex items-center gap-1">
                      <Award className="w-3 h-3" />
                      <span>Lvl {friend.progress?.level || 1}</span>
                    </div>
                    <span>•</span>
                    <span>{friend.progress?.total_xp || 0} XP</span>
                    <span>•</span>
                    <span>{friend.battle_stats?.battles_played || 0} battles</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Friend Since */}
            <div className="flex items-center gap-2 text-xs text-[#A0A0B8] mb-3">
              <Calendar className="w-3 h-3" />
              <span>Friends since {new Date(friend.since).toLocaleDateString()}</span>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                onClick={() => onChallenge(friend)}
                className="flex-1 bg-gradient-to-r from-[#0082FB] to-[#0064EO] hover:from-[#0070E0] hover:to-[#0055CC] text-white py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 text-sm shadow-lg hover:shadow-xl"
              >
                <Sword className="w-4 h-4" />
                Challenge
              </Button>
              
              <Button
                variant="outline"
                onClick={() => onMessage(friend)}
                className="p-2 border-[#2A2A3D] text-[#A0A0B8] hover:text-white hover:bg-[#2A2A3D] transition-colors rounded-lg flex items-center gap-1 text-sm"
              >
                <MessageCircle className="w-4 h-4" />
                <span className="hidden xs:inline">Message</span>
              </Button>

              {/* Remove Friend Button */}
              <Button
                variant="ghost"
                onClick={() => handleRemoveClick(friend)}
                className="p-2 text-[#FF4D6D] hover:bg-[#FF4D6D]/10 transition-all duration-200 opacity-70 hover:opacity-100 rounded-lg flex items-center gap-1 group/remove text-sm"
                title="Remove Friend"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden xs:inline opacity-0 group-hover/remove:opacity-100 transition-opacity">
                  Remove
                </span>
              </Button>
            </div>

            {/* Remove Confirmation Modal */}
            <AnimatePresence>
              {showRemoveConfirm === friend.friendshipId && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-[#0D0D14]/95 rounded-xl flex items-center justify-center p-4 z-20"
                >
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-[#1B1B28] border border-[#FF4D6D]/30 rounded-xl p-4 lg:p-6 max-w-sm w-full text-center"
                  >
                    <div className="w-10 h-10 lg:w-12 lg:h-12 mx-auto mb-3 lg:mb-4 bg-[#FF4D6D]/20 rounded-full flex items-center justify-center">
                      <Trash2 className="w-5 h-5 lg:w-6 lg:h-6 text-[#FF4D6D]" />
                    </div>
                    
                    <h4 className="text-base lg:text-lg font-bold text-white mb-2">
                      Remove Friend?
                    </h4>
                    
                    <p className="text-[#A0A0B8] text-xs lg:text-sm mb-4 lg:mb-6">
                      Are you sure you want to remove <span className="text-white font-semibold">{friend.fullName}</span> from your friends?
                    </p>

                    <div className="flex gap-2 lg:gap-3 justify-center">
                      <Button
                        onClick={cancelRemove}
                        variant="outline"
                        className="border-[#2A2A3D] text-[#A0A0B8] hover:text-white hover:bg-[#2A2A3D] px-3 lg:px-4 py-2 rounded-lg transition-all text-sm"
                      >
                        Cancel
                      </Button>
                      
                      <Button
                        onClick={() => confirmRemove(friend)}
                        className="bg-gradient-to-r from-[#FF4D6D] to-[#FF6B9C] hover:from-[#FF3D5C] hover:to-[#FF5A8A] text-white px-3 lg:px-4 py-2 rounded-lg transition-all shadow-lg hover:shadow-xl text-sm"
                      >
                        Remove
                      </Button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default FriendList;