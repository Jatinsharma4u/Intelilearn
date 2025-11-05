import React from "react";

const FriendRequestNotification = ({ name, onAccept, onReject }) => {
  return (
    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex justify-between items-center">
      <span>👤 {name} sent you a friend request</span>
      <div className="space-x-2">
        <button
          onClick={onAccept}
          className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition"
        >
          Accept
        </button>
        <button
          onClick={onReject}
          className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition"
        >
          Reject
        </button>
      </div>
    </div>
  );
};

export default FriendRequestNotification;
