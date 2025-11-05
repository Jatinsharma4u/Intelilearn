import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { useProgressApi } from "../hooks/useProgressApi";

const ProgressContext = createContext();

export const useProgress = () => {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error("useProgress must be used within ProgressProvider");
  return ctx;
};

export const ProgressProvider = ({ children }) => {
  const { user } = useAuth();
  const {
    progress,
    loading,
    error,
    fetchProgress,
    updateProgressApi,
    addXPApi,
    addCoinsApi,
  } = useProgressApi();

  // Load progress on login - ONLY HERE
  useEffect(() => {
    if (!user) {
      return;
    }
    fetchProgress(user.uid);
  }, [user, fetchProgress]);

  const updateProgress = async (updates) => {
    if (!user) return;
    await updateProgressApi(user.uid, {
      ...progress,
      ...updates,
    });
  };

  const addXP = async (amount) => {
    if (!user) return;
    await addXPApi(user.uid, amount);
  };

  const addCoins = async (amount) => {
    if (!user) return;
    await addCoinsApi(user.uid, amount);
  };

  return (
    <ProgressContext.Provider
      value={{ 
        progress, 
        loading, 
        error, 
        updateProgress, 
        addXP, 
        addCoins 
      }}
    >
      {children}
    </ProgressContext.Provider>
  );
};