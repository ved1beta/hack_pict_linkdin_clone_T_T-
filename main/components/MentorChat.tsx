"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { Send } from "lucide-react";

function MentorChat() {
  const [messages, setMessages] = useState([
    { sender: "Mentor", text: "Welcome! How can I help you today?" }
  ]);
  const [input, setInput] = useState("");

  const sendMessage = () => {
    if (input.trim() === "") return;

    // Add user message
    setMessages([...messages, { sender: "You", text: input }]);

    // Simulate mentor response
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { sender: "Mentor", text: "Stay consistent and keep improving your skills!" }
      ]);
    }, 500);

    setInput("");
  };

  return (
    <div className="card-modern p-6 space-y-4">
      {/* Messages */}
      <div className="h-64 overflow-y-auto border border-border rounded-lg p-4 bg-background space-y-3">
        {messages.map((msg, index) => (
          <div key={index} className="text-sm">
            <span className={msg.sender === "You" ? "text-primary font-semibold" : "text-accent font-semibold"}>
              {msg.sender}:
            </span>{" "}
            <span className="text-foreground">{msg.text}</span>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="flex gap-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Type your message..."
          className="flex-1 p-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <Button onClick={sendMessage} className="btn-primary">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default MentorChat;
