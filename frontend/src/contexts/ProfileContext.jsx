import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { 
  createUserProfile, 
  getUserProfile, 
  updateUserProfile,
  checkUsernameAvailability 
} from '../utils/api';

const ProfileContext = createContext();

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
};

export const ProfileProvider = ({ children }) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const defaultAvatars = [
    '/assets/avatars/avatar-1.png',
    '/assets/avatars/avatar-2.png',
    '/assets/avatars/avatar-3.png',
    '/assets/avatars/avatar-4.png',
    '/assets/avatars/avatar-5.png',
    '/assets/avatars/avatar-6.png',
    '/assets/avatars/avatar-7.png',
    '/assets/avatars/avatar-8.png',
    '/assets/avatars/avatar-9.png',
    '/assets/avatars/avatar-10.png'
  ];

  useEffect(() => {
    if (user) {
      loadProfile();
    } else {
      setLoading(false);
      setProfile(null);
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const userProfile = await getUserProfile(user.uid);
      setProfile(userProfile);
    } catch (err) {
      console.error('Profile load error:', err);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const checkUsername = async (username) => {
    try {
      const result = await checkUsernameAvailability(username);
      return result;
    } catch (error) {
      throw error;
    }
  };

  const createProfile = async (profileData) => {
    try {
      setLoading(true);
      setError(null);
      
      const randomAvatar = defaultAvatars[Math.floor(Math.random() * defaultAvatars.length)];
      
      const profileWithDefaults = {
        userId: user.uid,
        email: user.email,
        avatar: profileData.avatar || randomAvatar,
        ...profileData
      };
      
      const newProfile = await createUserProfile(profileWithDefaults);
      setProfile(newProfile);
      return newProfile;
    } catch (err) {
      console.error('Profile creation error:', err);
      setError(err.response?.data?.error || 'Failed to create profile');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates) => {
    try {
      setLoading(true);
      setError(null);
      
      const updatedProfile = await updateUserProfile(user.uid, updates);
      setProfile(updatedProfile);
      return updatedProfile;
    } catch (err) {
      console.error('Profile update error:', err);
      setError(err.response?.data?.error || 'Failed to update profile');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = () => {
    loadProfile();
  };

  const clearError = () => {
    setError(null);
  };

  const getDefaultAvatars = () => {
    return defaultAvatars;
  };

  const value = {
    profile,
    loading,
    error,
    checkUsername,
    createProfile,
    updateProfile,
    refreshProfile,
    clearError,
    getDefaultAvatars
  };

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  );
};