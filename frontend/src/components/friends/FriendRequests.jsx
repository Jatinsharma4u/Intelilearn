import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Clock, Send, Mail, Award, User } from 'lucide-react';
import Avatar from '../ui/Avatar';
import { Button } from '../ui/Button';

const FriendRequests = ({ 
  requests, 
  type, 
  onAccept, 
  onReject, 
  onCancel,
  isLoading = false 
}) => {
  
  if (requests.length === 0 && !isLoading) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-8 lg:py-12"
      >
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2 }}
          className="w-16 h-16 lg:w-20 lg:h-20 mx-auto mb-4 lg:mb-6 bg-gradient-to-br from-[#1B1B28] to-[#0D0D14] rounded-2xl flex items-center justify-center"
        >
          {type === 'received' ? (
            <Mail className="w-8 h-8 lg:w-10 lg:h-10 text-[#0082FB]" />
          ) : (
            <Send className="w-8 h-8 lg:w-10 lg:h-10 text-[#0082FB]" />
          )}
        </motion.div>
        <h3 className="text-lg lg:text-2xl font-bold text-white mb-2 lg:mb-3">
          No {type === 'received' ? 'Received' : 'Sent'} Requests
        </h3>
        <p className="text-[#A0A0B8] text-sm lg:text-base max-w-sm mx-auto px-2">
          {type === 'received' 
            ? "When someone sends you a friend request, it will appear here."
            : "Your sent friend requests will appear here."
          }
        </p>
      </motion.div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((item) => (
          <div
            key={item}
            className="p-4 lg:p-5 rounded-xl lg:rounded-2xl bg-[#1B1B28] border border-[#2A2A3D] animate-pulse"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-[#2A2A3D] rounded-xl"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-[#2A2A3D] rounded w-1/3"></div>
                <div className="h-3 bg-[#2A2A3D] rounded w-1/4"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3 lg:space-y-4">
      <AnimatePresence>
        {requests.map((request, index) => {
          const user = type === 'received' ? request.fromUser : request.toUser;
          const isReceived = type === 'received';
          
          const userData = user || {};
          const fullName = userData.fullName || 'Unknown User';
          const username = userData.username || 'unknown';
          const avatar = userData.avatar || null;
          const level = userData.progress?.level || 1;
          const xp = userData.progress?.total_xp || 0;
          
          return (
            <motion.div
              key={request._id || index}
              initial={{ opacity: 0, x: isReceived ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: isReceived ? -20 : 20 }}
              transition={{ delay: index * 0.1 }}
              className={`p-4 lg:p-5 rounded-xl lg:rounded-2xl border transition-all duration-300 ${
                isReceived
                  ? 'bg-[#0082FB]/10 border-[#0082FB]/20 hover:border-[#0082FB]/30'
                  : 'bg-[#1B1B28] border-[#2A2A3D] hover:border-[#0082FB]/20'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-center gap-3 lg:gap-4 flex-1">
                  <div className="relative">
                    <Avatar 
                      src={avatar}
                      alt={fullName}
                      size="md"
                      className="ring-2 ring-[#0082FB]/30"
                      fallback={
                        <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-[#0082FB] to-[#0064EO] rounded-xl flex items-center justify-center">
                          <User className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
                        </div>
                      }
                    />
                    {userData.isOnline && (
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-[#00FFA3] rounded-full border-2 border-[#1B1B28]"></div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                      <h4 className="font-bold text-white text-base lg:text-lg truncate">
                        {fullName}
                      </h4>
                      <span className="bg-[#0082FB]/20 text-[#0082FB] text-xs px-2 py-1 rounded-full whitespace-nowrap">
                        Level {level}
                      </span>
                    </div>
                    
                    <p className="text-[#0082FB] font-medium text-sm lg:text-base mb-2 truncate">
                      @{username}
                    </p>

                    {request.message && (
                      <motion.p 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="text-[#A0A0B8] text-sm italic mt-2 p-3 bg-[#0D0D14] rounded-lg border border-[#2A2A3D]"
                      >
                        "{request.message}"
                      </motion.p>
                    )}

                    <div className="flex items-center gap-3 lg:gap-4 mt-3 text-xs lg:text-sm text-[#A0A0B8]">
                      <div className="flex items-center gap-1 lg:gap-2">
                        <Clock className="w-3 h-3 lg:w-4 lg:h-4" />
                        <span>{request.sentAt ? new Date(request.sentAt).toLocaleDateString() : 'Recently'}</span>
                      </div>
                      <div className="flex items-center gap-1 lg:gap-2">
                        <Award className="w-3 h-3 lg:w-4 lg:h-4" />
                        <span>{xp.toLocaleString()} XP</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 lg:gap-3 justify-end">
                  {isReceived ? (
                    <>
                      <Button
                        onClick={() => onAccept(request._id, fullName)}
                        className="bg-[#00FFA3] hover:bg-[#00E691] text-[#0D0D14] px-3 lg:px-4 py-2 rounded-lg lg:rounded-xl font-medium transition-all duration-300 flex items-center gap-2 hover:scale-105 text-sm lg:text-base min-w-[100px] justify-center"
                      >
                        <Check className="w-3 h-3 lg:w-4 lg:h-4" />
                        Accept
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => onReject(request._id, fullName)}
                        className="border-[#FF4D6D] text-[#FF4D6D] hover:bg-[#FF4D6D]/10 px-3 lg:px-4 py-2 rounded-lg lg:rounded-xl font-medium transition-all duration-300 hover:scale-105 text-sm lg:text-base min-w-[100px] justify-center"
                      >
                        <X className="w-3 h-3 lg:w-4 lg:h-4" />
                        Decline
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() => onCancel(request._id, fullName)}
                      className="border-[#A0A0B8] text-[#A0A0B8] hover:bg-[#A0A0B8]/10 px-3 lg:px-4 py-2 rounded-lg lg:rounded-xl font-medium transition-all duration-300 hover:scale-105 text-sm lg:text-base min-w-[100px] justify-center"
                    >
                      <X className="w-3 h-3 lg:w-4 lg:h-4" />
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default FriendRequests;