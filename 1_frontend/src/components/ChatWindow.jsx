import React, { useState, useRef, useEffect } from 'react';
import Draggable from 'react-draggable';
import { X, MessageSquare, Send, Bot, User, Minimize2, Maximize2 } from 'lucide-react';
import api from '../api';

const ChatWindow = ({ isOpen, onClose, settings, embedded = false, initialMessages }) => {
    const [messages, setMessages] = useState(initialMessages || [
        { role: 'model', content: 'Hello! I am your Green Code Assistant. How can I help you optimize your code today?' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const scrollRef = useRef(null);
    const nodeRef = useRef(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen]);

    const handleSend = async () => {
        if (!input.trim() || loading) return;

        const userMsg = { role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const apiKey = settings.provider === 'gemini' ? settings.geminiKey : settings.groqKey;

            if (!apiKey) {
                setMessages(prev => [...prev, { role: 'model', content: 'Please enter an API Key in Settings to chat.' }]);
                setLoading(false);
                return;
            }

            const res = await api.post('/chat', {
                message: userMsg.content,
                history: messages.filter(m => m.role !== 'system'), // Filter out system messages if any
                provider: settings.provider,
                apiKey,
                model: settings.model
            });

            if (res.data.error) {
                // Show the specific error from backend
                setMessages(prev => [...prev, { role: 'model', content: `❌ ${res.data.error}` }]);
            } else {
                setMessages(prev => [...prev, { role: 'model', content: res.data.reply }]);
            }
        } catch (err) {
            console.error('Chat error:', err);

            // Show specific error message if available
            let errorMsg = 'Failed to connect to the chat server.';

            if (err.response?.data?.error) {
                // Backend provided specific error
                errorMsg = `❌ ${err.response.data.error}`;
            } else if (err.code === 'ERR_NETWORK') {
                errorMsg = '❌ Network error. Make sure the backend server is running on port 3000.';
            } else if (err.message) {
                errorMsg = `❌ ${err.message}`;
            }

            setMessages(prev => [...prev, { role: 'model', content: errorMsg }]);
        }
        setLoading(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    if (!isOpen && !embedded) return null;

    const content = (
        <div
            ref={nodeRef}
            className={`neu-flat overflow-hidden flex flex-col transition-all duration-300 ${embedded ? 'h-full w-full border-none rounded-none bg-transparent shadow-none' : `fixed bottom-20 right-10 z-50 ${isMinimized ? 'h-14 w-72' : 'h-[550px] w-[380px]'}`
                }`}
            style={embedded ? {} : {
                position: 'fixed'
            }}
        >
            {/* Header - Only show if not embedded */}
            {!embedded && (
                <div className="chat-handle bg-[#1e1e24] border-b border-[#ffffff05] px-4 py-3 flex items-center justify-between cursor-move select-none">
                    <div className="flex items-center gap-2 text-white font-bold tracking-wide">
                        <Bot size={18} className="text-[#00ff9d]" />
                        <span>AI Assistant</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-400">
                        <button
                            onClick={() => window.location.href = '/chat'}
                            className="hover:text-white transition-colors"
                            title="Open Full Chat View"
                        >
                            <MessageSquare size={14} />
                        </button>
                        <button onClick={() => setIsMinimized(!isMinimized)} className="hover:text-white transition-colors">
                            {isMinimized ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
                        </button>
                        <button onClick={onClose} className="hover:text-red-400 transition-colors">
                            <X size={14} />
                        </button>
                    </div>
                </div>
            )}

            {/* Chat Content */}
            {(!isMinimized || embedded) && (
                <>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-[#16161c]" ref={scrollRef}>
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''} animate-fade-in-up`}>
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-lg ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-[#00ff9d] text-black'
                                    }`}>
                                    {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                                </div>
                                <div className={`max-w-[85%] rounded-2xl p-3.5 shadow-md ${msg.role === 'user'
                                    ? 'bg-blue-600/10 text-blue-100 border border-blue-500/20 rounded-tr-none'
                                    : 'neu-pressed text-gray-200 rounded-tl-none'
                                    }`}>
                                    {msg.role === 'user' ? (
                                        <div className="text-sm leading-relaxed">{msg.content}</div>
                                    ) : (
                                        <div className="text-sm leading-relaxed">
                                            {msg.content.split(/(```[\s\S]*?```)/g).map((part, i) => {
                                                if (part.startsWith('```')) {
                                                    const match = part.match(/```(\w+)?\n([\s\S]*?)```/);
                                                    const lang = match ? match[1] : '';
                                                    const code = match ? match[2] : part.slice(3, -3);
                                                    return (
                                                        <div key={i} className="my-3 rounded-xl overflow-hidden border border-[#ffffff05] bg-[#0c0c0c] shadow-inner">
                                                            <div className="flex justify-between items-center px-3 py-2 bg-[#1e1e24] border-b border-[#ffffff05]">
                                                                <span className="text-[10px] font-bold uppercase text-gray-500">{lang || 'code'}</span>
                                                                <div className="flex gap-3">
                                                                    <button
                                                                        onClick={() => {
                                                                            const blob = new Blob([code], { type: 'text/plain' });
                                                                            const url = URL.createObjectURL(blob);
                                                                            const a = document.createElement('a');
                                                                            a.href = url;
                                                                            a.download = `generated_code.${lang || 'txt'}`;
                                                                            document.body.appendChild(a);
                                                                            a.click();
                                                                            document.body.removeChild(a);
                                                                            URL.revokeObjectURL(url);
                                                                        }}
                                                                        className="text-[10px] font-bold text-gray-500 hover:text-white transition-colors uppercase tracking-wider"
                                                                    >
                                                                        Download
                                                                    </button>
                                                                    <button
                                                                        onClick={() => {
                                                                            navigator.clipboard.writeText(code);
                                                                        }}
                                                                        className="text-[10px] font-bold text-gray-500 hover:text-[#00ff9d] transition-colors uppercase tracking-wider"
                                                                    >
                                                                        Copy
                                                                    </button>
                                                                </div>
                                                            </div>
                                                            <pre className="p-3 overflow-x-auto custom-scrollbar text-[#00ff9d] font-mono text-xs leading-relaxed">
                                                                {code}
                                                            </pre>
                                                        </div>
                                                    );
                                                }
                                                return <div key={i} className="whitespace-pre-wrap">{part}</div>;
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="flex gap-3 animate-pulse">
                                <div className="w-8 h-8 rounded-xl bg-[#00ff9d] flex items-center justify-center shrink-0 shadow-lg">
                                    <Bot size={16} className="text-black" />
                                </div>
                                <div className="neu-pressed rounded-2xl rounded-tl-none px-4 py-3">
                                    <div className="flex gap-1.5">
                                        <div className="w-1.5 h-1.5 bg-[#00ff9d] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <div className="w-1.5 h-1.5 bg-[#00ff9d] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <div className="w-1.5 h-1.5 bg-[#00ff9d] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Input Area */}
                    <div className="p-3 bg-[#1e1e24] border-t border-[#ffffff05]">
                        <div className="flex gap-3">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Ask about optimization..."
                                className="flex-1 neu-input text-sm focus:ring-1 focus:ring-[#00ff9d]/50"
                            />
                            <button
                                onClick={handleSend}
                                disabled={loading || !input.trim()}
                                aria-label="Send message"
                                className="neu-button-primary p-2.5 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                            >
                                <Send size={18} />
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );

    if (embedded) return content;

    return (
        <Draggable nodeRef={nodeRef} handle=".chat-handle">
            {content}
        </Draggable>
    );
};

export default ChatWindow;
