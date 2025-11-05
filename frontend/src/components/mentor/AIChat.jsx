// components/mentor/AIChat.jsx
import { useState } from "react";
import ChatWindow from "../chat/ChatWindow";
import ChatInput from "../chat/ChatInput";

export default function AIChat() {
  const [messages, setMessages] = useState([]);

  const sendMessage = (msg) => {
    setMessages([...messages, { sender: "user", text: msg }]);
    // TODO: call AI API here
    setTimeout(() => {
      setMessages((prev) => [...prev, { sender: "ai", text: "AI Response..." }]);
    }, 1000);
  };

  return (
    <div className="h-[500px] flex flex-col border rounded-xl">
      <ChatWindow messages={messages} />
      <ChatInput onSend={sendMessage} />
    </div>
  );
}
