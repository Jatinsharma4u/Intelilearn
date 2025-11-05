import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  sendFriendRequest,
  getPendingRequests,
  getSentRequests,
  acceptFriendRequest,
  rejectFriendRequest,
  cancelFriendRequest,
  getFriendsList,
  removeFriend,
  searchUsersForFriends,
  checkFriendshipStatus
} from '../utils/api';

const useFriends = () => {
  const { user } = useAuth();
  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState({});
  const [toast, setToast] = useState({ isOpen: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ isOpen: true, message, type });
    setTimeout(() => setToast({ isOpen: false, message: '', type: 'success' }), 3000);
  };

  const closeToast = () => {
    setToast({ isOpen: false, message: '', type: 'success' });
  };

  useEffect(() => {
    if (user) {
      loadFriendsData();
    }
  }, [user]);

  const loadFriendsData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const [friendsList, pending, sent] = await Promise.all([
        getFriendsList(),
        getPendingRequests(),
        getSentRequests()
      ]);
      
      setFriends(Array.isArray(friendsList) ? friendsList : []);
      setPendingRequests(Array.isArray(pending) ? pending : []);
      setSentRequests(Array.isArray(sent) ? sent : []);
    } catch (err) {
      console.error('Load friends data error:', err);
      const errorMsg = err.response?.data?.error || 'Failed to load friends data';
      setError(errorMsg);
      showToast(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIXED: Send request with immediate state update
  const sendRequest = async (toUsername, message = '') => {
    const actionKey = `send-${toUsername}`;
    try {
      setActionLoading(prev => ({ ...prev, [actionKey]: true }));
      setError(null);
      
      const response = await sendFriendRequest(toUsername, message);
      
      // ✅ IMMEDIATE STATE UPDATE
      if (response.request) {
        setSentRequests(prev => {
          // Remove any existing request to same user
          const filtered = prev.filter(req => 
            req.toUser.userId !== response.request.toUser.userId
          );
          return [response.request, ...filtered];
        });
        
        // ✅ Also remove from pending if exists
        setPendingRequests(prev => 
          prev.filter(req => req.fromUser.userId !== response.request.toUser.userId)
        );
      }
      
      showToast(`Friend request sent to ${toUsername}!`, 'success');
      return true;
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to send friend request';
      setError(errorMsg);
      showToast(errorMsg, 'error');
      throw err;
    } finally {
      setActionLoading(prev => ({ ...prev, [actionKey]: false }));
    }
  };

  // ✅ FIXED: Accept request with immediate state update
  const acceptRequest = async (requestId, userName = '') => {
    const actionKey = `accept-${requestId}`;
    try {
      setActionLoading(prev => ({ ...prev, [actionKey]: true }));
      setError(null);
      
      const response = await acceptFriendRequest(requestId);
      
      // ✅ IMMEDIATE STATE UPDATE
      setPendingRequests(prev => prev.filter(req => req._id !== requestId));
      
      if (response.friendship && response.request.fromUser) {
        setFriends(prev => {
          const exists = prev.find(f => f.userId === response.request.fromUser.userId);
          if (!exists) {
            return [{
              userId: response.request.fromUser.userId,
              username: response.request.fromUser.username,
              fullName: response.request.fromUser.fullName,
              avatar: response.request.fromUser.avatar,
              progress: response.request.fromUser.progress,
              battle_stats: response.request.fromUser.battle_stats,
              friendshipId: response.friendship._id,
              since: response.friendship.since,
              lastInteraction: response.friendship.lastInteraction
            }, ...prev];
          }
          return prev;
        });
      }
      
      showToast(`You are now friends with ${userName || 'this user'}!`, 'success');
      return true;
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to accept friend request';
      setError(errorMsg);
      showToast(errorMsg, 'error');
      throw err;
    } finally {
      setActionLoading(prev => ({ ...prev, [actionKey]: false }));
    }
  };

  // ✅ FIXED: Reject request with immediate state update
  const rejectRequest = async (requestId, userName = '') => {
    const actionKey = `reject-${requestId}`;
    try {
      setActionLoading(prev => ({ ...prev, [actionKey]: true }));
      setError(null);
      
      await rejectFriendRequest(requestId);
      
      // ✅ IMMEDIATE STATE UPDATE
      setPendingRequests(prev => prev.filter(req => req._id !== requestId));
      
      showToast(`Friend request from ${userName || 'this user'} declined`, 'info');
      return true;
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to reject friend request';
      setError(errorMsg);
      showToast(errorMsg, 'error');
      throw err;
    } finally {
      setActionLoading(prev => ({ ...prev, [actionKey]: false }));
    }
  };

  // ✅ FIXED: Cancel request with immediate state update
  const cancelRequest = async (requestId, userName = '') => {
    const actionKey = `cancel-${requestId}`;
    try {
      setActionLoading(prev => ({ ...prev, [actionKey]: true }));
      setError(null);
      
      await cancelFriendRequest(requestId);
      
      // ✅ IMMEDIATE STATE UPDATE
      setSentRequests(prev => prev.filter(req => req._id !== requestId));
      
      showToast(`Friend request to ${userName || 'this user'} cancelled`, 'info');
      return true;
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to cancel friend request';
      setError(errorMsg);
      showToast(errorMsg, 'error');
      throw err;
    } finally {
      setActionLoading(prev => ({ ...prev, [actionKey]: false }));
    }
  };

  // ✅ FIXED: Remove friend with immediate state update
  const removeFriendship = async (friendshipId, userName = '') => {
    const actionKey = `remove-${friendshipId}`;
    try {
      setActionLoading(prev => ({ ...prev, [actionKey]: true }));
      setError(null);
      
      await removeFriend(friendshipId);
      
      // ✅ IMMEDIATE STATE UPDATE
      setFriends(prev => prev.filter(friend => friend.friendshipId !== friendshipId));
      
      showToast(`${userName || 'Friend'} removed successfully`, 'info');
      return true;
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to remove friend';
      setError(errorMsg);
      showToast(errorMsg, 'error');
      throw err;
    } finally {
      setActionLoading(prev => ({ ...prev, [actionKey]: false }));
    }
  };

  const searchUsers = async (query, excludeFriends = true, showRemoved = false) => {
    try {
      setError(null);
      const result = await searchUsersForFriends(query, excludeFriends, showRemoved);
      return Array.isArray(result) ? result : [];
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to search users';
      setError(errorMsg);
      showToast(errorMsg, 'error');
      return [];
    }
  };

  const checkStatus = async (username) => {
    try {
      const result = await checkFriendshipStatus(username);
      return result;
    } catch (err) {
      throw err;
    }
  };

  const clearError = () => setError(null);

  const isActionLoading = (actionKey) => actionLoading[actionKey] || false;

  return {
    friends,
    pendingRequests, // ✅ Requests received by current user
    sentRequests,    // ✅ Requests sent by current user  
    loading,
    error,
    actionLoading,
    toast,
    sendRequest,
    acceptRequest,
    rejectRequest,
    cancelRequest,
    removeFriendship,
    searchUsers,
    checkStatus,
    clearError,
    loadFriendsData,
    isActionLoading,
    closeToast,
    showToast
  };
};

export default useFriends;