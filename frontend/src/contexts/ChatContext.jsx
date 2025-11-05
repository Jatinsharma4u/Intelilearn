import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp,
  where 
} from 'firebase/firestore';
import { db } from '../utils/firebase';
import { useAuth } from './AuthContext';

// Create the Chat Context
export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeChat, setActiveChat] = useState(null);
  const { user } = useAuth();

  // Fetch messages for the active chat
  useEffect(() => {
    if (!activeChat) {
      setMessages([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const messagesRef = collection(db, 'chats', activeChat, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messagesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(messagesData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [activeChat]);

  // Send a new message
  const sendMessage = async (text, senderId, senderName, senderAvatar) => {
    if (!activeChat || !text.trim()) return;

    try {
      await addDoc(collection(db, 'chats', activeChat, 'messages'), {
        text: text.trim(),
        senderId,
        senderName,
        senderAvatar,
        timestamp: serverTimestamp(),
        reactions: []
      });
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Add reaction to a message
  const addReaction = async (messageId, reaction, userId) => {
    if (!activeChat) return;

    try {
      const messageRef = doc(db, 'chats', activeChat, 'messages', messageId);
      await updateDoc(messageRef, {
        reactions: arrayUnion({ reaction, userId, timestamp: new Date() })
      });
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  };

  // Create or switch to a chat
  const createChat = async (participantIds, chatName = null) => {
    try {
      const chatRef = await addDoc(collection(db, 'chats'), {
        participants: participantIds,
        chatName: chatName || `Chat-${Date.now()}`,
        createdAt: serverTimestamp(),
        lastMessage: null,
        lastMessageTime: null
      });
      return chatRef.id;
    } catch (error) {
      console.error('Error creating chat:', error);
      return null;
    }
  };

  const value = {
    messages,
    loading,
    activeChat,
    setActiveChat,
    sendMessage,
    addReaction,
    createChat
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

// Custom hook to use the chat context
export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};