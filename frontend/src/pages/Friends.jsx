import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Mail, 
  Search, 
  Sword, 
  MessageCircle, 
  Calendar,
  Award,
  Zap,
  UserCheck,
  UserX
} from 'lucide-react';

import MainLayout from '../components/layout/MainLayout';
import FriendList from '../components/friends/FriendList';
import FriendRequests from '../components/friends/FriendRequests';
import FriendSearch from '../components/friends/FriendSearch';
import useFriends from '../hooks/useFriends';
import { useAuth } from '../contexts/AuthContext';
import Toast from '../components/ui/Toast';

const Friends = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('friends');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  
  const { 
    friends, 
    pendingRequests,
    sentRequests,
    loading, 
    error,
    sendRequest,
    acceptRequest,
    rejectRequest,
    cancelRequest,
    removeFriendship,
    searchUsers,
    clearError,
    isActionLoading,
    toast,
    closeToast,
    loadFriendsData
  } = useFriends();
  
  const { user } = useAuth();

  // Enhanced search
  const handleSearch = async (query, excludeFriends = true, showRemoved = false) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const results = await searchUsers(query, excludeFriends, showRemoved);
      setSearchResults(Array.isArray(results) ? results : []);
    } catch (error) {
      console.error('❌ Search error in component:', error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  // Debounced search
  useEffect(() => {
    if (activeTab !== 'find' || !searchQuery || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(() => {
      handleSearch(searchQuery, true, false);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, activeTab]);

  // Handlers with proper user context
  const handleSendRequest = async (username, message = '') => {
    try {
      await sendRequest(username, message);
      setSearchResults(prev => prev.filter(u => u.username !== username));
      await loadFriendsData();
    } catch (error) {
      console.error('Send request error:', error);
    }
  };

  const handleAcceptRequest = async (requestId, userName) => {
    try {
      await acceptRequest(requestId, userName);
    } catch (error) {
      console.error('Accept request error:', error);
    }
  };

  const handleRejectRequest = async (requestId, userName) => {
    try {
      await rejectRequest(requestId, userName);
    } catch (error) {
      console.error('Reject request error:', error);
    }
  };

  const handleCancelRequest = async (requestId, userName) => {
    try {
      await cancelRequest(requestId, userName);
    } catch (error) {
      console.error('Cancel request error:', error);
    }
  };

  const handleRemoveFriend = async (friendshipId, userName) => {
    if (window.confirm(`Are you sure you want to remove ${userName} from your friends?`)) {
      try {
        await removeFriendship(friendshipId, userName);
      } catch (error) {
        console.error('Remove friend error:', error);
      }
    }
  };

  const handleChallengeFriend = (friend) => {
    navigate('/battle-hub', { state: { challengeFriend: friend } });
  };

  const handleViewProfile = (username) => {
    navigate(`/profile/${username}`);
  };

  const handleMessageFriend = (friend) => {
    console.log('Message friend:', friend);
  };

  // Clear error when tab changes
  useEffect(() => {
    clearError();
  }, [activeTab]);

  // Tab configurations
  const tabs = [
    { 
      id: 'friends', 
      label: 'Friends', 
      icon: Users, 
      count: friends.length,
      color: 'from-[#0082FB] to-[#0064EO]'
    },
    { 
      id: 'requests', 
      label: 'Requests', 
      icon: Mail, 
      count: pendingRequests.length,
      color: 'from-[#FF9F5B] to-[#FFA45B]'
    },
    { 
      id: 'find', 
      label: 'Find', 
      icon: Search, 
      color: 'from-[#00FFA3] to-[#0082FB]'
    }
  ];

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSearchQuery('');
    setSearchResults([]);
  };

  return (
    <MainLayout>
      <Toast 
        isOpen={toast.isOpen}
        onClose={closeToast}
        message={toast.message}
        type={toast.type}
        duration={3000}
      />

      <div className="min-h-screen bg-[#0D0D14]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-6 lg:mb-8"
          >
            <div className="w-16 h-16 lg:w-20 lg:h-20 mx-auto mb-3 lg:mb-4 bg-gradient-to-br from-[#0082FB] to-[#0064EO] rounded-2xl lg:rounded-3xl flex items-center justify-center shadow-lg">
              <Users className="w-8 h-8 lg:w-10 lg:h-10 text-white" />
            </div>
            <h1 className="text-2xl lg:text-4xl font-bold text-white mb-2 lg:mb-3">
              Friends Hub
            </h1>
            <p className="text-[#A0A0B8] text-sm lg:text-base max-w-2xl mx-auto">
              Connect with fellow learners, challenge each other, and grow together
            </p>
          </motion.div>

          {/* Error Display */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-4 lg:mb-6 p-3 lg:p-4 bg-[#1B1B28] border border-[#FF4D6D] rounded-xl flex items-center justify-between"
              >
                <div className="flex items-center gap-2 lg:gap-3">
                  <div className="w-5 h-5 lg:w-6 lg:h-6 bg-[#FF4D6D]/20 rounded-full flex items-center justify-center">
                    <UserX className="w-3 h-3 lg:w-4 lg:h-4 text-[#FF4D6D]" />
                  </div>
                  <span className="text-[#FF4D6D] text-sm lg:text-base font-medium">{error}</span>
                </div>
                <button 
                  onClick={clearError}
                  className="text-[#FF4D6D] hover:text-[#FF4D6D]/80 text-lg font-bold"
                >
                  ×
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tab Navigation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-4 lg:mb-6"
          >
            <div className="flex space-x-1 bg-[#1B1B28] rounded-xl lg:rounded-2xl p-1 shadow-lg border border-[#2A2A3D]">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex items-center gap-2 lg:gap-3 px-3 lg:px-6 py-2 lg:py-3 rounded-lg lg:rounded-xl font-semibold transition-all duration-300 flex-1 justify-center text-xs lg:text-sm ${
                    activeTab === tab.id
                      ? `bg-gradient-to-r ${tab.color} text-white shadow-lg`
                      : 'text-[#A0A0B8] hover:text-white hover:bg-[#2A2A3D]'
                  }`}
                >
                  <tab.icon className="w-4 h-4 lg:w-5 lg:h-5" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className={`px-1.5 lg:px-2 py-0.5 lg:py-1 rounded-full text-xs font-bold ${
                      activeTab === tab.id
                        ? 'bg-white/20 text-white'
                        : 'bg-[#2A2A3D] text-[#A0A0B8]'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Tab Content */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-[#1B1B28] rounded-xl lg:rounded-2xl shadow-xl border border-[#2A2A3D] overflow-hidden"
          >
            {/* Friends Tab */}
            {activeTab === 'friends' && (
              <div className="p-4 lg:p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-4 lg:mb-6">
                  <div className="mb-3 lg:mb-0">
                    <h2 className="text-xl lg:text-2xl font-bold text-white mb-1 lg:mb-2">
                      Your Learning Circle
                    </h2>
                    <p className="text-[#A0A0B8] text-sm lg:text-base">
                      Connect and challenge your friends
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-xs lg:text-sm text-[#A0A0B8]">
                    <div className="flex items-center gap-1 lg:gap-2">
                      <Zap className="w-3 h-3 lg:w-4 lg:h-4 text-[#00FFA3]" />
                      <span>{friends.filter(f => f.isOnline).length} online</span>
                    </div>
                    <div className="flex items-center gap-1 lg:gap-2">
                      <Award className="w-3 h-3 lg:w-4 lg:h-4 text-[#0082FB]" />
                      <span>{friends.reduce((total, f) => total + (f.battle_stats?.battles_played || 0), 0)} battles</span>
                    </div>
                  </div>
                </div>

                {loading ? (
                  <div className="text-center py-8 lg:py-12">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 lg:h-8 lg:w-8 border-2 lg:border-4 border-[#0082FB] border-t-transparent"></div>
                    <p className="mt-2 lg:mt-3 text-[#A0A0B8] text-sm lg:text-base">Loading your friends...</p>
                  </div>
                ) : (
                  <FriendList
                    friends={friends}
                    onRemove={handleRemoveFriend}
                    onChallenge={handleChallengeFriend}
                    onMessage={handleMessageFriend}
                  />
                )}
              </div>
            )}

            {/* Requests Tab */}
            {activeTab === 'requests' && (
              <div className="p-4 lg:p-6">
                <div className="mb-4 lg:mb-6">
                  <h2 className="text-xl lg:text-2xl font-bold text-white mb-1 lg:mb-2">
                    Friend Requests
                  </h2>
                  <p className="text-[#A0A0B8] text-sm lg:text-base">
                    Manage your incoming and outgoing requests
                  </p>
                </div>

                <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
                  {/* Received Requests */}
                  <div>
                    <div className="flex items-center gap-2 lg:gap-3 mb-3 lg:mb-4">
                      <div className="w-8 h-8 lg:w-10 lg:h-10 bg-[#0082FB]/20 rounded-xl flex items-center justify-center">
                        <Mail className="w-4 h-4 lg:w-5 lg:h-5 text-[#0082FB]" />
                      </div>
                      <div>
                        <h3 className="text-lg lg:text-xl font-bold text-white">
                          Received Requests
                        </h3>
                        <p className="text-[#A0A0B8] text-xs lg:text-sm">
                          {pendingRequests.length} requests waiting for your response
                        </p>
                      </div>
                    </div>
                    <FriendRequests
                      requests={pendingRequests}
                      type="received"
                      onAccept={handleAcceptRequest}
                      onReject={handleRejectRequest}
                    />
                  </div>

                  {/* Sent Requests */}
                  <div>
                    <div className="flex items-center gap-2 lg:gap-3 mb-3 lg:mb-4">
                      <div className="w-8 h-8 lg:w-10 lg:h-10 bg-[#FF9F5B]/20 rounded-xl flex items-center justify-center">
                        <UserCheck className="w-4 h-4 lg:w-5 lg:h-5 text-[#FF9F5B]" />
                      </div>
                      <div>
                        <h3 className="text-lg lg:text-xl font-bold text-white">
                          Sent Requests
                        </h3>
                        <p className="text-[#A0A0B8] text-xs lg:text-sm">
                          {sentRequests.length} requests waiting for response
                        </p>
                      </div>
                    </div>
                    <FriendRequests
                      requests={sentRequests}
                      type="sent"
                      onCancel={handleCancelRequest}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Find Friends Tab */}
            {activeTab === 'find' && (
              <div className="p-4 lg:p-6">
                <FriendSearch
                  onSearch={handleSearch}
                  searchResults={searchResults}
                  searchLoading={searchLoading}
                  onSendRequest={handleSendRequest}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                />
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Friends;