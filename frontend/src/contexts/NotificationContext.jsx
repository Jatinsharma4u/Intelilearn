import React, { createContext, useState, useEffect } from "react";

// Create the context - remove the import line that was causing the circular reference
export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        // Dummy data for demonstration
        setNotifications([
          { id: 1, title: "New Battle Invite", type: "battle", read: false },
          { id: 2, title: "Friend Request", type: "friend", read: true },
        ]);
      } catch (err) {
        console.error("Failed to fetch notifications", err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const markAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  return (
    <NotificationContext.Provider
      value={{ notifications, loading, markAsRead }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

// Optional: Create a custom hook for easier usage
export const useNotification = () => {
  const context = React.useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotification must be used within a NotificationProvider");
  }
  return context;
};