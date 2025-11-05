// src/contexts/FriendContext.jsx - UPDATED
import React, { createContext, useContext } from 'react';
import useFriends from '../hooks/useFriends'; // ✅ Default import use karo

const FriendContext = createContext();

export const useFriend = () => {
  const context = useContext(FriendContext);
  if (!context) {
    throw new Error('useFriend must be used within a FriendProvider');
  }
  return context;
};

export const FriendProvider = ({ children }) => {
  const friendsData = useFriends(); // ✅ Ab yeh kaam karega

  return (
    <FriendContext.Provider value={friendsData}>
      {children}
    </FriendContext.Provider>
  );
};