import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Users, UserPlus, Filter, Sparkles, Loader } from 'lucide-react';
import Avatar from '../ui/Avatar';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

const FriendSearch = ({ onSearch, searchResults, searchLoading, onSendRequest, searchQuery, setSearchQuery }) => {
  const [message, setMessage] = useState('');
  const [showRemovedUsers, setShowRemovedUsers] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.length >= 2) {
      onSearch(searchQuery, true, showRemovedUsers);
    }
  };

  const handleSendRequest = async (username, userData) => {
    try {
      await onSendRequest(username, message);
      setMessage('');
    } catch (error) {
      console.error('Failed to send request:', error);
    }
  };

  const getUserForAvatar = (user) => {
    return {
      avatar: user.avatar,
      fullName: user.fullName,
      username: user.username,
      userId: user.userId
    };
  };

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Search Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="w-14 h-14 lg:w-20 lg:h-20 mx-auto mb-3 lg:mb-4 bg-gradient-to-br from-[#0082FB]/20 to-[#0064EO]/20 rounded-2xl flex items-center justify-center">
          <Search className="w-6 h-6 lg:w-8 lg:h-8 text-[#0082FB]" />
        </div>
        <h2 className="text-xl lg:text-3xl font-bold text-white mb-2 lg:mb-3">
          Find Learning Partners
        </h2>
        <p className="text-[#A0A0B8] text-sm lg:text-base max-w-2xl mx-auto px-2">
          Connect with fellow learners, challenge each other, and grow together
        </p>
      </motion.div>

      {/* Search Form */}
      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        onSubmit={handleSearch}
        className="bg-[#1B1B28] rounded-xl lg:rounded-2xl p-4 lg:p-6 shadow-lg border border-[#2A2A3D]"
      >
        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 lg:left-4 top-1/2 transform -translate-y-1/2 text-[#A0A0B8] w-4 h-4 lg:w-5 lg:h-5" />
            <Input
              type="text"
              placeholder="Search by username or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 lg:pl-12 pr-4 py-3 text-sm lg:text-base border-2 border-[#2A2A3D] focus:border-[#0082FB] rounded-xl bg-[#0D0D14] text-white transition-all duration-300 placeholder-[#A0A0B8]"
            />
          </div>

          {/* Optional Message */}
          <div>
            <label className="block text-sm font-medium text-[#A0A0B8] mb-2">
              Optional Message
            </label>
            <Input
              type="text"
              placeholder="Hi! Let's learn together..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full border-2 border-[#2A2A3D] focus:border-[#0082FB] rounded-xl bg-[#0D0D14] text-white text-sm transition-all duration-300 placeholder-[#A0A0B8]"
            />
          </div>

          {/* Filters & Search Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-[#A0A0B8]" />
              <span className="text-sm text-[#A0A0B8]">Filters:</span>
              <label className="flex items-center gap-2 text-sm text-[#A0A0B8] cursor-pointer">
                <input
                  type="checkbox"
                  checked={showRemovedUsers}
                  onChange={(e) => {
                    setShowRemovedUsers(e.target.checked);
                    if (searchQuery.length >= 2) {
                      onSearch(searchQuery, true, e.target.checked);
                    }
                  }}
                  className="w-4 h-4 text-[#0082FB] bg-[#0D0D14] border-2 border-[#2A2A3D] rounded focus:ring-2 focus:ring-[#0082FB] cursor-pointer"
                />
                Show removed users
              </label>
            </div>

            <Button
              type="submit"
              disabled={searchQuery.length < 2 || searchLoading}
              className="bg-gradient-to-r from-[#0082FB] to-[#0064EO] hover:from-[#0070E0] hover:to-[#0055CC] text-white px-6 lg:px-8 py-2.5 lg:py-3 rounded-xl font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm lg:text-base shadow-lg hover:shadow-xl min-w-[140px] justify-center"
            >
              {searchLoading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  <span className="hidden sm:inline">Searching...</span>
                  <span className="sm:hidden">Searching</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span className="hidden sm:inline">Search Users</span>
                  <span className="sm:hidden">Search</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </motion.form>

      {/* Search Results */}
      <AnimatePresence>
        {searchResults.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 lg:w-6 lg:h-6 text-[#0082FB]" />
              <h3 className="text-lg lg:text-xl font-bold text-white">
                Search Results ({searchResults.length})
              </h3>
            </div>

            <div className="grid gap-3 lg:gap-4">
              {searchResults.map((user, index) => (
                <motion.div
                  key={user.userId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.01 }}
                  className="bg-[#1B1B28] rounded-xl lg:rounded-2xl p-4 lg:p-6 shadow-lg border border-[#2A2A3D] hover:border-[#0082FB] transition-all duration-300 group"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Avatar 
                        user={getUserForAvatar(user)} 
                        size="md"
                        className="ring-2 ring-[#0082FB]/30 group-hover:ring-[#0082FB]/50 transition-all"
                      />
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-white text-base lg:text-lg truncate">
                          {user.fullName}
                        </h4>
                        <p className="text-[#0082FB] font-medium text-sm lg:text-base mb-2 truncate">
                          @{user.username}
                        </p>
                        
                        <div className="flex items-center gap-2 lg:gap-4 text-xs lg:text-sm text-[#A0A0B8]">
                          <span className="bg-[#0082FB]/20 text-[#0082FB] px-2 py-1 rounded-full text-xs">
                            Lvl {user.progress?.level || 1}
                          </span>
                          <span>{user.progress?.total_xp || 0} XP</span>
                          <span>•</span>
                          <span>{user.battle_stats?.battles_played || 0} battles</span>
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={() => handleSendRequest(user.username, user)}
                      className="bg-gradient-to-r from-[#00FFA3] to-[#0082FB] hover:from-[#00E691] hover:to-[#0070E0] text-white px-4 lg:px-6 py-2.5 rounded-lg lg:rounded-xl font-medium transition-all duration-300 flex items-center gap-2 text-sm lg:text-base whitespace-nowrap shadow-lg hover:shadow-xl min-w-[120px] justify-center"
                    >
                      <UserPlus className="w-4 h-4 lg:w-4 lg:h-4" />
                      <span className="hidden sm:inline">Add Friend</span>
                      <span className="sm:hidden">Add</span>
                    </Button>
                  </div>

                  {showRemovedUsers && (
                    <div className="mt-3 lg:mt-4 p-3 bg-[#FF9F5B]/10 border border-[#FF9F5B]/20 rounded-lg flex items-center gap-2">
                      <Sparkles className="w-4 h-4 lg:w-4 lg:h-4 text-[#FF9F5B]" />
                      <span className="text-xs lg:text-sm text-[#FF9F5B]">
                        You can send a new friend request
                      </span>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {searchQuery.length >= 2 && searchResults.length === 0 && !searchLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-8 lg:py-12"
          >
            <div className="w-16 h-16 lg:w-20 lg:h-20 mx-auto mb-4 lg:mb-6 bg-gradient-to-br from-[#1B1B28] to-[#0D0D14] rounded-2xl flex items-center justify-center">
              <Search className="w-8 h-8 lg:w-10 lg:h-10 text-[#A0A0B8]" />
            </div>
            <h3 className="text-lg lg:text-2xl font-bold text-white mb-2 lg:mb-3">
              No Users Found
            </h3>
            <p className="text-[#A0A0B8] text-sm lg:text-base mb-4 lg:mb-6 max-w-md mx-auto px-2">
              No users found matching "<span className="font-semibold text-white">{searchQuery}</span>"
            </p>
            {!showRemovedUsers && (
              <Button
                onClick={() => {
                  setShowRemovedUsers(true);
                  onSearch(searchQuery, true, true);
                }}
                variant="outline"
                className="border-[#0082FB] text-[#0082FB] hover:bg-[#0082FB]/10 text-sm px-4 py-2"
              >
                Include previously removed users
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FriendSearch;