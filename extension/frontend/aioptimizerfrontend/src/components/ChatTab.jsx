// ChatSection.jsx
// React + Tailwind chat panel (matches your provided image)
// Plug this inside your existing tab structure for the Chat tab content.

import React, { useState, useRef, useEffect } from "react";

const initialMessages = [
  {
    id: 1,
    role: "assistant",
    avatar: "A",
    content: "Hello! How can I assist you today?",
  },
  {
    id: 2,
    role: "user",
    avatar: "U",
    content:
      "I need help optimizing a function in my Python code. It's a bit slow, and I think there might be a better way to implement it.",
  },
  {
    id: 3,
    role: "assistant",
    avatar: "A",
    content:
      "Sure, I can help with that. Please provide the function you'd like to optimize, and any relevant context about its usage.",
  },
  {
    id: 4,
    role: "user",
    avatar: "U",
    content: "Here's the function:",
    type: "code",
    code: `def process_data(data):\n    result = []\n    for item in data:\n        if item > 10:\n            result.append(item * 2)\n    return result`,
  },
  {
    id: 5,
    role: "assistant",
    avatar: "A",
    content:
      "Thanks. List comprehension is indeed a more Pythonic and efficient approach. Here's the optimized version:",
    type: "code",
    code: `def process_data(data):\n    return [item * 2 for item in data if item > 10]`,
  },
];

const Avatar = ({ letter, role }) => (
  <div
    className={`w-8 h-8 flex items-center justify-center rounded-full font-semibold text-sm shrink-0 ${
      role === "assistant"
        ? "bg-slate-700 text-slate-200"
        : "bg-amber-500 text-white"
    }`}
  >
    {letter}
  </div>
);

const CodeBlock = ({ code }) => (
  <pre className="bg-[#0b1116] border border-slate-800 rounded-md p-3 text-sm font-mono text-slate-100 whitespace-pre-wrap overflow-auto">
    <code>{code}</code>
  </pre>
);

export default function ChatTab() {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const [agent, setAgent] = useState("Code Optimizer Pro");
  const messagesRef = useRef(null);

  useEffect(() => {
    messagesRef.current?.scrollTo({
      top: messagesRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim()) return;
    const newMsg = {
      id: Date.now(),
      role: "user",
      avatar: "U",
      content: input,
    };
    setMessages([...messages, newMsg]);
    setInput("");
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "assistant",
          avatar: "A",
          content: "Got it! Let me check that.",
        },
      ]);
    }, 600);
  };

  return (
    <div className="flex flex-col h-full bg-[#121216] text-slate-200 border-l border-slate-700">
      {/* Agent selector */}
      <div className="px-4 pt-4 pb-2 border-b border-slate-700">
        <label className="text-xs text-slate-400">Select Agent</label>
        <select
          value={agent}
          onChange={(e) => setAgent(e.target.value)}
          className="mt-2 w-full bg-[#0f1114] text-sm rounded-md p-2 border border-slate-800"
        >
          <option>Code Optimizer Pro</option>
          <option>Debug Assistant</option>
          <option>Chat Helper</option>
        </select>
      </div>

      {/* Messages */}
      <div
        ref={messagesRef}
        className="flex-1 overflow-y-auto px-4 py-3 space-y-4"
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${
              msg.role === "user" ? "flex-row-reverse gap-3" : "gap-3"
            }`}
          >
            <Avatar letter={msg.avatar} role={msg.role} />
            <div className="max-w-[75%]">
              {msg.type === "code" ? (
                <CodeBlock code={msg.code} />
              ) : (
                <div className="bg-[#0e1113] border border-slate-800 rounded-md px-4 py-3 text-sm">
                  {msg.content}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="border-t border-slate-700 p-3 flex items-center gap-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Send a message..."
          className="flex-1 bg-[#0b0e10] text-sm border border-slate-800 rounded-md p-3 placeholder:text-slate-500"
        />
        <button
          onClick={sendMessage}
          className="w-12 h-12 rounded-md bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M2 21l21-9L2 3v7l15 2-15 2v7z" fill="white" />
          </svg>
        </button>
      </div>
    </div>
  );
}
