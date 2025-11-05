import React from "react";

const EmojiReactions = ({ onReact }) => {
  const emojis = ["😂", "🔥", "❤️", "👍", "😮"];

  return (
    <div className="flex gap-2">
      {emojis.map((emoji, idx) => (
        <button
          key={idx}
          onClick={() => onReact(emoji)}
          className="text-xl hover:scale-110 transition"
        >
          {emoji}
        </button>
      ))}
    </div>
  );
};

export default EmojiReactions;
