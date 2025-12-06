import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Zap, Clock, Cloud, Cpu } from 'lucide-react';

const MetricsCard = ({ original, optimized }) => {
    // If neither exists, show nothing
    if (!original && !optimized) return null;

    // Helper to safely get metric values and ensure they're numbers
    const getMetric = (data, key) => Number(data?.metrics?.[key]) || 0;

    const hasOriginal = !!original?.metrics;
    const hasOptimized = !!optimized?.metrics;

    // Prepare data for chart
    const data = [
        {
            name: 'Time',
            Original: hasOriginal ? getMetric(original, 'duration') : 0,
            Optimized: hasOptimized ? getMetric(optimized, 'duration') : 0
        },
        {
            name: 'Energy',
            Original: hasOriginal ? getMetric(original, 'energy_joules') : 0,
            Optimized: hasOptimized ? getMetric(optimized, 'energy_joules') : 0
        },
    ];

    // Calculate savings only if both exist
    let timeSaved = '0.0';
    let energySaved = '0.0';
    let showSavings = false;

    if (hasOriginal && hasOptimized) {
        const origTime = getMetric(original, 'duration');
        const optTime = getMetric(optimized, 'duration');
        const origEnergy = getMetric(original, 'energy_joules');
        const optEnergy = getMetric(optimized, 'energy_joules');

        if (origTime > 0) timeSaved = ((origTime - optTime) / origTime * 100).toFixed(1);
        if (origEnergy > 0) energySaved = ((origEnergy - optEnergy) / origEnergy * 100).toFixed(1);
        showSavings = true;
    }

    return (
        <div className="flex flex-col gap-4 h-full">
            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-3">
                {/* Time */}
                <div className="neu-pressed p-3 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 shadow-inner">
                        <Clock size={18} />
                    </div>
                    <div>
                        <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">Time</p>
                        <div className="flex items-baseline gap-2">
                            {hasOptimized && hasOriginal ? (
                                <div className="flex flex-col">
                                    <span className="text-xs text-gray-500 line-through">{getMetric(original, 'duration')} ms</span>
                                    <span className="text-lg font-bold text-white">{getMetric(optimized, 'duration')} <span className="text-xs text-gray-500">ms</span></span>
                                </div>
                            ) : (
                                <p className="text-lg font-bold text-white">{getMetric(hasOptimized ? optimized : original, 'duration')} <span className="text-xs text-gray-500">ms</span></p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Energy */}
                <div className="neu-pressed p-3 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-yellow-500/10 text-yellow-400 shadow-inner">
                        <Zap size={18} />
                    </div>
                    <div>
                        <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">Energy</p>
                        <div className="flex items-baseline gap-2">
                            {hasOptimized && hasOriginal ? (
                                <div className="flex flex-col">
                                    <span className="text-xs text-gray-500 line-through">{getMetric(original, 'energy_joules').toFixed(6)} J</span>
                                    <span className="text-lg font-bold text-white">{getMetric(optimized, 'energy_joules').toFixed(6)} <span className="text-xs text-gray-500">J</span></span>
                                </div>
                            ) : (
                                <p className="text-lg font-bold text-white">{getMetric(hasOptimized ? optimized : original, 'energy_joules').toFixed(6)} <span className="text-xs text-gray-500">J</span></p>
                            )}
                        </div>
                    </div>
                </div>

                {/* CO2 */}
                <div className="neu-pressed p-3 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-500/10 text-green-400 shadow-inner">
                        <Cloud size={18} />
                    </div>
                    <div>
                        <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">CO2</p>
                        <div className="flex items-baseline gap-2">
                            {hasOptimized && hasOriginal ? (
                                <div className="flex flex-col">
                                    <span className="text-xs text-gray-500 line-through">{getMetric(original, 'co2_emissions').toExponential(1)} kg</span>
                                    <span className="text-lg font-bold text-white">{getMetric(optimized, 'co2_emissions').toExponential(1)} <span className="text-xs text-gray-500">kg</span></span>
                                </div>
                            ) : (
                                <p className="text-lg font-bold text-white">{getMetric(hasOptimized ? optimized : original, 'co2_emissions').toExponential(1)} <span className="text-xs text-gray-500">kg</span></p>
                            )}
                        </div>
                    </div>
                </div>

                {/* RAM */}
                <div className="neu-pressed p-3 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 shadow-inner">
                        <Cpu size={18} />
                    </div>
                    <div>
                        <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">RAM</p>
                        <div className="flex items-baseline gap-2">
                            {hasOptimized && hasOriginal ? (
                                <div className="flex flex-col">
                                    <span className="text-xs text-gray-500 line-through">{getMetric(original, 'ram_peak').toFixed(1)} MB</span>
                                    <span className="text-lg font-bold text-white">{getMetric(optimized, 'ram_peak').toFixed(1)} <span className="text-xs text-gray-500">MB</span></span>
                                </div>
                            ) : (
                                <p className="text-lg font-bold text-white">{getMetric(hasOptimized ? optimized : original, 'ram_peak').toFixed(1)} <span className="text-xs text-gray-500">MB</span></p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Savings Badges - Only show if comparison is possible */}
            {showSavings && (
                <div className="flex gap-3">
                    <div className="flex-1 neu-flat border border-green-500/20 bg-green-500/5 p-3 rounded-xl text-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 bg-green-500/10 rounded-full blur-xl -mr-4 -mt-4"></div>
                        <p className="text-green-400 text-[10px] font-bold uppercase tracking-wider relative z-10">Time Saved</p>
                        <p className="text-2xl font-bold text-green-500 relative z-10">{timeSaved}%</p>
                    </div>
                    <div className="flex-1 neu-flat border border-green-500/20 bg-green-500/5 p-3 rounded-xl text-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 bg-green-500/10 rounded-full blur-xl -mr-4 -mt-4"></div>
                        <p className="text-green-400 text-[10px] font-bold uppercase tracking-wider relative z-10">Energy Saved</p>
                        <p className="text-2xl font-bold text-green-500 relative z-10">{energySaved}%</p>
                    </div>
                </div>
            )}

            {/* Chart - Only show if comparison is possible */}
            {showSavings && (
                <div className="neu-flat p-3 rounded-xl border border-[#ffffff05] flex-1 min-h-[150px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                            <XAxis type="number" hide />
                            <YAxis dataKey="name" type="category" stroke="#6b7280" fontSize={10} width={40} tickLine={false} axisLine={false} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1e1e24', borderColor: 'rgba(255,255,255,0.1)', color: '#e0e0e0', fontSize: '12px', borderRadius: '8px' }}
                                itemStyle={{ color: '#e0e0e0' }}
                                cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                            />
                            <Bar dataKey="Original" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={12} />
                            <Bar dataKey="Optimized" fill="#00ff9d" radius={[0, 4, 4, 0]} barSize={12} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
};

export default MetricsCard;
