import React, { useState, useEffect } from 'react';
import api from '../api';
import { Loader2, BarChart2, PieChart, Activity, Zap } from 'lucide-react';
import {
    LineChart, Line, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const Analytics = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get('/user/statistics');
                setStats(res.data.statistics);
            } catch (err) {
                console.error('Failed to fetch stats:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) {
        return (
            <div data-testid="analytics-loader" className="flex items-center justify-center h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-green-500" />
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="p-8">
                <div className="text-center text-gray-400">No analytics data available</div>
            </div>
        );
    }

    // Prepare data for charts
    const languageData = stats?.languages?.map(l => ({
        name: l._id,
        value: l.count
    })) || [];

    const activityData = stats?.recentActivity?.map(run => {
        // Handle nested metrics structure (backward compatibility)
        const origMetrics = run.metrics?.original?.metrics || run.metrics?.original || {};
        const optMetrics = run.metrics?.optimized?.metrics || run.metrics?.optimized || {};
        
        const energySaved = (origMetrics.energy_joules || 0) - (optMetrics.energy_joules || 0);
        
        return {
            date: new Date(run.timestamp).toLocaleDateString(),
            gain: run.performanceGain,
            energy: Math.max(0, energySaved) // Ensure no negative energy savings
        };
    }).reverse() || [];

    return (
        <div className="h-screen overflow-y-auto">
            <div className="p-8 max-w-7xl mx-auto space-y-8 pb-24">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">Analytics</h1>
                    <p className="text-gray-400">Deep dive into your optimization metrics</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    {/* Performance Trend */}
                    <div className="bg-[#1e1e1e] p-6 rounded-xl border border-gray-800">
                        <div className="flex items-center gap-2 mb-6">
                            <Activity className="text-green-500" size={20} />
                            <h2 className="text-lg font-bold text-white">Performance Gain Trend</h2>
                        </div>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={activityData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                    <XAxis dataKey="date" stroke="#666" fontSize={12} />
                                    <YAxis stroke="#666" fontSize={12} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#252525', border: 'none', borderRadius: '8px' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                    <Legend />
                                    <Line type="monotone" dataKey="gain" stroke="#10b981" strokeWidth={2} name="Gain (%)" />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Language Distribution */}
                    <div className="bg-[#1e1e1e] p-6 rounded-xl border border-gray-800">
                        <div className="flex items-center gap-2 mb-6">
                            <PieChart className="text-blue-500" size={20} />
                            <h2 className="text-lg font-bold text-white">Language Distribution</h2>
                        </div>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <RechartsPieChart>
                                    <Pie
                                        data={languageData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {languageData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#252525', border: 'none', borderRadius: '8px' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                    <Legend />
                                </RechartsPieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Energy Savings */}
                <div className="bg-[#1e1e1e] p-6 rounded-xl border border-gray-800">
                    <div className="flex items-center gap-2 mb-6">
                        <Zap className="text-yellow-500" size={20} />
                        <h2 className="text-lg font-bold text-white">Energy Savings (Joules)</h2>
                    </div>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={activityData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                <XAxis dataKey="date" stroke="#666" fontSize={12} />
                                <YAxis stroke="#666" fontSize={12} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#252525', border: 'none', borderRadius: '8px' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Legend />
                                <Bar dataKey="energy" fill="#eab308" name="Energy Saved (J)" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Analytics;
