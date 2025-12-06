import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { Clock, Calendar, Zap, Activity } from 'lucide-react';

const History = () => {
    const navigate = useNavigate();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('executions');
    const [chats, setChats] = useState([]);
    const [loadingChats, setLoadingChats] = useState(false);

    useEffect(() => {
        fetchHistory();
        fetchChats();
    }, []);

    const fetchHistory = async () => {
        try {
            const res = await api.get('/api/history');
            console.log("Fetched history:", res.data);
            setHistory(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error("Failed to fetch history:", err);
            setHistory([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchChats = async () => {
        setLoadingChats(true);
        try {
            const res = await api.get('/api/chats');
            console.log("Fetched chats:", res.data);
            setChats(res.data.chats || []);
        } catch (err) {
            console.error("Failed to fetch chats:", err);
            setChats([]);
        } finally {
            setLoadingChats(false);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString();
    };

    return (
        <div className="h-screen overflow-y-auto bg-[#16161c]">
            <div className="p-8 max-w-7xl mx-auto space-y-8 pb-24">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-4xl font-bold text-white flex items-center gap-3 tracking-tight drop-shadow-lg">
                            <Clock className="text-[#00ff9d]" size={36} />
                            History & Archives
                        </h1>
                        <p className="text-gray-400 mt-2 font-medium ml-12">Track your optimization journey and chat sessions</p>
                    </div>
                    <div className="flex gap-4 bg-[#1e1e24] p-1.5 rounded-xl shadow-inner border border-[#ffffff05]">
                        <button
                            onClick={() => setActiveTab('executions')}
                            className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'executions'
                                ? 'neu-pressed text-[#00ff9d] shadow-[inset_2px_2px_5px_rgba(0,0,0,0.5),inset_-2px_-2px_5px_rgba(255,255,255,0.05)]'
                                : 'text-gray-400 hover:text-white hover:bg-[#25252d]'
                                }`}
                        >
                            Code Executions ({history.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('chats')}
                            className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'chats'
                                ? 'neu-pressed text-[#00ff9d] shadow-[inset_2px_2px_5px_rgba(0,0,0,0.5),inset_-2px_-2px_5px_rgba(255,255,255,0.05)]'
                                : 'text-gray-400 hover:text-white hover:bg-[#25252d]'
                                }`}
                        >
                            Chat Sessions ({chats.length})
                        </button>
                    </div>
                </div>

                {activeTab === 'executions' ? (
                    <div className="space-y-6">
                        {loading ? (
                            <div className="text-center text-gray-400 py-20 flex flex-col items-center gap-4">
                                <div className="w-12 h-12 border-4 border-[#00ff9d] border-t-transparent rounded-full animate-spin"></div>
                                <p className="font-medium">Loading history...</p>
                            </div>
                        ) : history.length === 0 ? (
                            <div className="text-center text-gray-500 py-20 neu-flat">
                                <p className="text-lg font-medium">No execution history found.</p>
                                <p className="text-sm mt-2">Start optimizing code to see your history here!</p>
                            </div>
                        ) : (
                            history.map((item) => (
                                <div
                                    key={item._id}
                                    className="neu-flat p-6 hover:translate-y-[-2px] transition-all duration-300 group cursor-pointer hover:shadow-[0_0_20px_rgba(0,255,157,0.2)]"
                                    onClick={() => navigate(`/optimizer?load=${item._id}`)}
                                    title="Click to restore this session in Optimizer"
                                >
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <div className="flex items-center gap-4 mb-2">
                                                <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider shadow-sm border border-opacity-20 ${item.language === 'python' ? 'bg-blue-500/10 text-blue-400 border-blue-500' :
                                                    item.language === 'javascript' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500' :
                                                        'bg-orange-500/10 text-orange-400 border-orange-500'
                                                    }`}>
                                                    {item.language}
                                                </span>
                                                <span className="text-gray-500 text-sm flex items-center gap-1.5 font-medium">
                                                    <Calendar size={14} />
                                                    {formatDate(item.timestamp)}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-6 text-sm text-gray-400 mt-3">
                                                <span className="flex items-center gap-2 bg-[#16161c] px-3 py-1.5 rounded-lg border border-[#ffffff05]">
                                                    <Zap size={14} className="text-yellow-500" />
                                                    Intensity: <span className="text-white font-bold">{item.intensity}%</span>
                                                </span>
                                                <span className="flex items-center gap-2 bg-[#16161c] px-3 py-1.5 rounded-lg border border-[#ffffff05]">
                                                    <Activity size={14} className="text-[#00ff9d]" />
                                                    Gain: <span className="text-[#00ff9d] font-bold">+{item.performanceGain?.toFixed(1) || 0}%</span>
                                                </span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xs text-gray-500 mb-1 font-bold uppercase tracking-wider">Model</div>
                                            <div className="text-sm text-white font-bold bg-[#16161c] px-3 py-1 rounded-lg border border-[#ffffff05]">{item.model || 'N/A'}</div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="neu-pressed p-4">
                                            <div className="text-xs text-gray-500 mb-3 font-bold uppercase tracking-wider flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-gray-500"></div> Original Metrics
                                            </div>
                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div className="text-gray-400 font-medium">Time: <span className="text-white font-bold ml-1">{item.metrics?.original?.duration || 0}ms</span></div>
                                                <div className="text-gray-400 font-medium">Energy: <span className="text-white font-bold ml-1">{item.metrics?.original?.energy_joules?.toFixed(6) || 0}J</span></div>
                                            </div>
                                        </div>
                                        <div className="neu-pressed p-4 border border-[#00ff9d] border-opacity-20 bg-[#00ff9d] bg-opacity-[0.02]">
                                            <div className="text-xs text-[#00ff9d] mb-3 font-bold uppercase tracking-wider flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-[#00ff9d] animate-pulse"></div> Optimized Metrics
                                            </div>
                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div className="text-gray-400 font-medium">Time: <span className="text-[#00ff9d] font-bold ml-1">{item.metrics?.optimized?.duration || 0}ms</span></div>
                                                <div className="text-gray-400 font-medium">Energy: <span className="text-[#00ff9d] font-bold ml-1">{item.metrics?.optimized?.energy_joules?.toFixed(6) || 0}J</span></div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Click hint */}
                                    <div className="mt-4 text-xs text-gray-500 text-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        💡 Click to restore this session in Optimizer
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {loadingChats ? (
                            <div className="text-center text-gray-400 py-20 flex flex-col items-center gap-4">
                                <div className="w-12 h-12 border-4 border-[#00ff9d] border-t-transparent rounded-full animate-spin"></div>
                                <p className="font-medium">Loading chats...</p>
                            </div>
                        ) : chats.length === 0 ? (
                            <div className="text-center text-gray-500 py-20 neu-flat">
                                <p className="text-lg font-medium">No chat history found.</p>
                                <p className="text-sm mt-2">Start chatting to see your conversations here!</p>
                            </div>
                        ) : (
                            chats.map((chat) => (
                                <div key={chat._id} className="neu-flat p-5 hover:translate-x-1 transition-transform duration-200 cursor-pointer flex justify-between items-center group" onClick={() => navigate(`/chat?id=${chat._id}`)}>
                                    <div className="flex items-center gap-5">
                                        <div className="neu-pressed p-3 text-[#00ff9d]">
                                            <Activity size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-white group-hover:text-[#00ff9d] transition-colors">{chat.title}</h3>
                                            <div className="flex items-center gap-3 text-xs text-gray-500 mt-1.5">
                                                <span className="bg-[#16161c] px-2 py-0.5 rounded border border-[#ffffff05] text-gray-300 font-medium">{chat.model}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-sm text-gray-500 whitespace-nowrap flex items-center gap-2 font-medium bg-[#16161c] px-3 py-1.5 rounded-lg border border-[#ffffff05]">
                                        <Clock size={14} />
                                        {formatDate(chat.updatedAt)}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default History;
