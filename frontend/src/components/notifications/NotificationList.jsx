import React from "react";

const NotificationList = ({ notifications }) => {
  return (
    <div className="space-y-2">
      {notifications.length === 0 ? (
        <p className="text-sm text-gray-500">No notifications</p>
      ) : (
        notifications.map((n, idx) => (
          <div
            key={idx}
            className="p-2 bg-gray-100 rounded hover:bg-gray-200 transition"
          >
            {n.message}
          </div>
        ))
      )}
    </div>
  );
};

export default NotificationList;
