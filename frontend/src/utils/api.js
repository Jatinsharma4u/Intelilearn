import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ===== FRIENDS API FUNCTIONS =====

// Send friend request
export const sendFriendRequest = async (toUsername, message = '') => {
  try {
    const response = await api.post('/friends/request/send', { 
      toUsername, 
      message 
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get pending friend requests (received)
export const getPendingRequests = async () => {
  try {
    const response = await api.get('/friends/requests/pending');
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get sent friend requests
export const getSentRequests = async () => {
  try {
    const response = await api.get('/friends/requests/sent');
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Accept friend request
export const acceptFriendRequest = async (requestId) => {
  try {
    const response = await api.post(`/friends/request/accept/${requestId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Reject friend request
export const rejectFriendRequest = async (requestId) => {
  try {
    const response = await api.post(`/friends/request/reject/${requestId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Cancel sent request
export const cancelFriendRequest = async (requestId) => {
  try {
    const response = await api.delete(`/friends/request/cancel/${requestId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get friends list
export const getFriendsList = async () => {
  try {
    const response = await api.get('/friends/list');
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Remove friend
export const removeFriend = async (friendshipId) => {
  try {
    const response = await api.delete(`/friends/remove/${friendshipId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// ✅ FIXED: Search users for friends - PROPER PARAMETERS
export const searchUsersForFriends = async (query, excludeFriends = true, showRemoved = false) => {
  try {
    const response = await api.get('/friends/search', {
      params: { 
        q: query, 
        excludeFriends: excludeFriends.toString(),
        showRemoved: showRemoved.toString() // ✅ ADDED THIS PARAM
      }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Check friendship status
export const checkFriendshipStatus = async (username) => {
  try {
    const response = await api.get(`/friends/status/${username}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// ===== PROFILE API FUNCTIONS =====

// Check username availability
export const checkUsernameAvailability = async (username) => {
  try {
    const response = await api.get(`/users/check-username/${username}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Search users
export const searchUsers = async (query) => {
  try {
    const response = await api.get(`/users/search?q=${query}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Create user profile
export const createUserProfile = async (profileData) => {
  try {
    const response = await api.post('/users/profile', profileData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get user profile by userId
export const getUserProfile = async (userId) => {
  try {
    const response = await api.get(`/users/profile/${userId}`);
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      return null;
    }
    throw error;
  }
};

// Get user profile by username
export const getUserProfileByUsername = async (username) => {
  try {
    const response = await api.get(`/users/profile/username/${username}`);
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      return null;
    }
    throw error;
  }
};

// Update user profile
export const updateUserProfile = async (userId, updates) => {
  try {
    const response = await api.put(`/users/profile/${userId}`, updates);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// ===== PROGRESS API FUNCTIONS =====

// Get progress by userId
export const getProgress = async (userId) => {
  try {
    const response = await api.get(`/progress/${userId}`);
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      return null;
    }
    throw error;
  }
};

// Get progress by username
export const getProgressByUsername = async (username) => {
  try {
    const response = await api.get(`/progress/username/${username}`);
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      return null;
    }
    throw error;
  }
};

// Update progress
export const updateProgress = async (userId, updates) => {
  try {
    const response = await api.put(`/progress/${userId}`, updates);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Add XP
export const addXP = async (userId, amount) => {
  try {
    const response = await api.post(`/progress/${userId}/addXP`, { amount });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Add XP by username
export const addXPByUsername = async (username, amount) => {
  try {
    const response = await api.post(`/progress/username/${username}/addXP`, { amount });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Add Coins
export const addCoins = async (userId, amount) => {
  try {
    const currentProgress = await getProgress(userId);
    if (!currentProgress) {
      const defaultProgress = {
        level: 1,
        xp: 0,
        total_xp: 0,
        coins: amount,
        daily_streak: 0,
        level_name: '🌱 Rookie'
      };
      return await updateProgress(userId, defaultProgress);
    }
    
    const updatedProgress = {
      ...currentProgress,
      coins: (currentProgress.coins || 0) + amount
    };
    return await updateProgress(userId, updatedProgress);
  } catch (error) {
    console.error('Add coins error:', error);
    throw error;
  }
};

export { api };