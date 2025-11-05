import { useState, useCallback } from 'react';
import { getProgress, updateProgress, addXP, addCoins } from '../utils/api';

export const useProgressApi = () => {
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProgress = useCallback(async (userId) => {
    if (!userId) {
      console.warn('fetchProgress called without userId');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await getProgress(userId);
      setProgress(data);
      setError(null);
      return data;
    } catch (err) {
      console.error('Error fetching progress:', err);
      setError(err.message || 'Failed to fetch progress');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProgressApiWrapper = async (userId, updates) => {
    try {
      if (!progress) {
        // Directly update if progress not loaded yet
        const data = await updateProgress(userId, updates);
        setProgress(data);
        return data;
      }
      const merged = { ...progress, ...updates };
      const data = await updateProgress(userId, merged);
      setProgress(data);
      return data;
    } catch (err) {
      console.error('Error updating progress:', err);
      throw err;
    }
  };

  const addXPApiWrapper = async (userId, amount) => {
    try {
      const data = await addXP(userId, amount);
      setProgress(data);
      return data;
    } catch (err) {
      console.error('Error adding XP:', err);
      throw err;
    }
  };

  const addCoinsApiWrapper = async (userId, amount) => {
    try {
      const data = await addCoins(userId, amount);
      setProgress(data);
      return data;
    } catch (err) {
      console.error('Error adding coins:', err);
      throw err;
    }
  };

  return {
    progress,
    loading,
    error,
    fetchProgress,
    updateProgressApi: updateProgressApiWrapper,
    addXPApi: addXPApiWrapper,
    addCoinsApi: addCoinsApiWrapper
  };
};
