import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import ChatWindow from '../components/ChatWindow';
import { MessageSquare } from 'lucide-react';
import api from '../api';

const Chat = () => {
    const [searchParams] = useSearchParams();
    const chatId = searchParams.get('id');
    const [initialMessages, setInitialMessages] = useState(null);
    const [chatData, setChatData] = useState(null);
    const [loading, setLoading] = useState(!!chatId);

    // Mock settings for now, or fetch from context if available globally
    // Ideally, we should use useOptimizer context, but Chat page might be outside Optimizer scope
    // For simplicity, we'll use default settings or fetch from local storage if needed
    const settings = {
        provider: 'gemini', // Default
        geminiKey: localStorage.getItem('geminiKey') || '',
        groqKey: localStorage.getItem('groqKey') || '',
        model: 'gemini-pro'
    };

    useEffect(() => {
        if (chatId) {
            fetchChatHistory(chatId);
        } else {
            setLoading(false);
        }
    }, [chatId]);

    const fetchChatHistory = async (id) => {
        try {
            const res = await api.get(`/api/chats/${id}`);
            console.log('Fetched chat data:', res.data);
            if (res.data && res.data.chat) {
                setChatData(res.data.chat);
                setInitialMessages(res.data.chat.messages || []);
            }
        } catch (err) {
            console.error("Failed to fetch chat history:", err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-[#16161c]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#00ff9d]"></div>
            </div>
        );
    }

    return (
        <div className="h-screen w-full bg-[#16161c] flex flex-col">
            <div className="p-6 border-b border-[#ffffff05] flex items-center gap-3 bg-[#1e1e24]">
                <MessageSquare className="text-[#00ff9d]" size={24} />
                <h1 className="text-xl font-bold text-white tracking-wide">
                    {chatData?.title || 'AI Chat Session'}
                </h1>
            </div>
            <div className="flex-1 overflow-hidden relative">
                <ChatWindow
                    isOpen={true}
                    onClose={() => { }}
                    settings={settings}
                    embedded={true}
                    initialMessages={initialMessages}
                    chatId={chatId}
                />
            </div>
        </div>
    );
};

export default Chat;
