import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { Activity, Zap, Clock, Code, ArrowRight, Loader2, MessageSquare } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, color, subtext }) => (
    <div className="neu-flat p-6 border border-[#ffffff05] relative overflow-hidden group hover:translate-y-[-2px] transition-transform duration-300">
        <div className={`absolute top-0 right-0 p-20 bg-${color}-500/5 rounded-full blur-3xl -mr-10 -mt-10 transition-all group-hover:bg-${color}-500/10`}></div>
        <div className="flex items-start justify-between mb-4 relative z-10">
            <div>
                <p className="text-gray-400 text-sm font-medium mb-1 tracking-wide uppercase">{title}</p>
                <h3 className="text-3xl font-bold text-white drop-shadow-md">{value}</h3>
            </div>
            <div className={`p-3 rounded-xl neu-pressed text-${color}-400 shadow-[inset_2px_2px_5px_rgba(0,0,0,0.3),inset_-2px_-2px_5px_rgba(255,255,255,0.05)]`}>
                <Icon size={24} className="drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]" />
            </div>
        </div>
        {subtext && <p className="text-xs text-gray-500 font-medium relative z-10">{subtext}</p>}
    </div>
);

const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const [recentActivity, setRecentActivity] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchDashboardData();
        // Poll for updates every 5 seconds
        const interval = setInterval(fetchDashboardData, 5000);
        return () => clearInterval(interval);
    }, []);

    const fetchDashboardData = async () => {
        try {
            // Fetch statistics
            const statsRes = await api.get('/user/statistics');
            setStats(statsRes.data.statistics);

            // Fetch recent activity
            const activityRes = await api.get('/api/recent-activity?limit=10');
            setRecentActivity(activityRes.data.activity || []);
        } catch (err) {
            console.error('Failed to fetch dashboard data:', err);
            setError('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    const formatTimeAgo = (timestamp) => {
        const now = new Date();
        const then = new Date(timestamp);
        const diffMs = now - then;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    };

    const formatTimeSaved = (ms) => {
        if (!ms) return '0.00s';
        if (Math.abs(ms) < 1000) return `${ms.toFixed(2)}ms`;
        return `${(ms / 1000).toFixed(2)}s`;
    };

    const formatEnergy = (joules) => {
        if (!joules) return '0.0000 J';
        if (joules < 0.0001) return '< 0.0001 J';
        return `${joules.toFixed(4)} J`;
    };

    if (loading) {
        return (
            <div data-testid="dashboard-loader" className="h-full w-full flex items-center justify-center bg-[#16161c]">
                <Loader2 className="animate-spin text-[#00ff9d]" size={40} />
            </div>
        );
    }

    if (error) {
        return (
            <div className="h-full w-full flex items-center justify-center text-red-500 bg-[#16161c]">
                {error}
            </div>
        );
    }

    return (
        <div className="h-full w-full overflow-y-auto p-8 bg-[#16161c]">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-10">
                    <div>
                        <h1 className="text-4xl font-bold text-white mb-2 tracking-tight drop-shadow-lg">Dashboard</h1>
                        <p className="text-gray-400 font-medium">Overview of your code optimization activity</p>
                    </div>
                    <Link
                        to="/optimizer"
                        state={{ reset: true }}
                        className="neu-button-primary px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 hover:scale-105 active:scale-95"
                    >
                        <Zap size={20} />
                        New Optimization
                    </Link>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
                    <StatCard
                        title="Total Optimizations"
                        value={stats?.totalRuns || 0}
                        icon={Code}
                        color="blue"
                        subtext="All time executions"
                    />
                    <StatCard
                        title="Avg. Performance Gain"
                        value={`${Math.round(stats?.avgPerformanceGain || 0)}%`}
                        icon={Activity}
                        color="green"
                        subtext="Across all languages"
                    />
                    <StatCard
                        title="Time Saved"
                        value={formatTimeSaved(stats?.totalTimeSaved || 0)}
                        icon={Clock}
                        color="purple"
                        subtext="Total execution time reduced"
                    />
                    <StatCard
                        title="Energy Saved"
                        value={formatEnergy(stats?.totalEnergySaved || 0)}
                        icon={Zap}
                        color="yellow"
                        subtext="Estimated energy reduction"
                    />
                </div>

                {/* Recent Activity & Quick Actions */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Recent Activity */}
                    <div className="lg:col-span-2 neu-flat border border-[#ffffff05] overflow-hidden">
                        <div className="p-6 border-b border-[#ffffff05] flex items-center justify-between bg-[#1e1e24]">
                            <h2 className="text-xl font-bold text-white tracking-wide">Recent Activity</h2>
                            <Link to="/history" className="text-[#00ff9d] hover:text-[#00cc7d] text-sm font-bold flex items-center gap-1 transition-colors">
                                View All <ArrowRight size={16} />
                            </Link>
                        </div>
                        <div className="divide-y divide-[#ffffff05]">
                            {recentActivity && recentActivity.length > 0 ? (
                                recentActivity.map((item) => (
                                    <div key={item._id} className="p-5 hover:bg-[#25252d] transition-colors flex items-center justify-between group">
                                        <div className="flex items-center gap-4">
                                            <div className={`p-3 rounded-xl shadow-inner ${item.type === 'chat' ? 'bg-blue-500/10 text-blue-400' : 'bg-green-500/10 text-green-400'}`}>
                                                {item.type === 'chat' ? <MessageSquare size={18} /> : <Code size={18} />}
                                            </div>
                                            <div>
                                                <p className="text-gray-200 font-bold text-sm group-hover:text-white transition-colors">
                                                    {item.type === 'chat' ? item.title : `Optimized ${item.language} code`}
                                                </p>
                                                <p className="text-gray-500 text-xs font-medium mt-0.5">
                                                    {formatTimeAgo(item.timestamp)} • {item.model || 'N/A'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            {item.type === 'optimization' && (
                                                <span className={`inline-block px-3 py-1 rounded-lg text-xs font-bold shadow-sm ${item.performanceGain > 0 ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-gray-700/30 text-gray-400'}`}>
                                                    {item.performanceGain > 0 ? `+${item.performanceGain.toFixed(1)}%` : 'No Gain'}
                                                </span>
                                            )}
                                            {item.type === 'chat' && (
                                                <span className="text-xs text-gray-500 font-medium">{item.messageCount} msgs</span>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-10 text-center text-gray-500 font-medium">
                                    No recent activity found. Start optimizing code or chatting!
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Tips / Info */}
                    <div className="neu-flat border border-[#ffffff05] p-6">
                        <h2 className="text-xl font-bold text-white mb-6 tracking-wide">Did you know?</h2>
                        <div className="space-y-5">
                            <div className="p-5 bg-[#25252d] rounded-xl border border-[#ffffff05] shadow-lg">
                                <h3 className="text-[#00ff9d] font-bold mb-2 flex items-center gap-2">
                                    <Zap size={16} /> Rust is Efficient
                                </h3>
                                <p className="text-gray-400 text-sm leading-relaxed">Rust code often consumes significantly less energy than Python or JavaScript for the same tasks, making it ideal for green computing.</p>
                            </div>
                            <div className="p-5 bg-[#25252d] rounded-xl border border-[#ffffff05] shadow-lg">
                                <h3 className="text-blue-400 font-bold mb-2 flex items-center gap-2">
                                    <Activity size={16} /> AI Models Matter
                                </h3>
                                <p className="text-gray-400 text-sm leading-relaxed">Different AI models (Gemini vs Groq) may produce different optimization strategies. Try both to see which yields better performance!</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
