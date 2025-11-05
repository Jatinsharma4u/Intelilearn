// src/components/ui/EmojiPicker.jsx
import React, { useState, useRef, useEffect } from "react";
import { Smile } from "lucide-react";

export const EmojiPicker = ({ onSelect, className = '' }) => {
  const emojis = ["😀", "😂", "😍", "😎", "😢", "👍", "🎉", "🔥", "⭐", "💯", "🤔", "👏", "🎯", "🚀", "💡"];
  const [open, setOpen] = useState(false);
  const pickerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`} ref={pickerRef}>
      <button 
        onClick={() => setOpen(!open)} 
        className="p-2.5 bg-[#2A2A3D] text-[#A0A0B8] rounded-xl hover:bg-[#7C5FFF] hover:text-white transition-colors"
      >
        <Smile className="w-4 h-4" />
      </button>
      
      {open && (
        <div className="absolute bottom-full mb-2 right-0 bg-[#1B1B28] border border-[#2A2A3D] p-3 rounded-xl shadow-2xl z-50 
                       grid grid-cols-5 gap-2 w-48">
          {emojis.map((emoji, idx) => (
            <button
              key={idx}
              className="text-xl p-2 hover:bg-[#2A2A3D] rounded-lg transition-colors cursor-pointer hover:scale-110"
              onClick={() => { 
                onSelect(emoji); 
                setOpen(false); 
              }}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default EmojiPicker;