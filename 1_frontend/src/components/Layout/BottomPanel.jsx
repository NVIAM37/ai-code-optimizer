import React, { useState, useEffect } from 'react';
import { TerminalSquare, MessageSquare, Activity, Sparkles } from 'lucide-react';
import ConsoleWindow from '../ConsoleWindow';
import ChatWindow from '../ChatWindow';
import MetricsCard from '../MetricsCard';
import AIInsights from '../AIInsights';

const BottomPanel = ({
    isConsoleOpen,
    setIsConsoleOpen,
    isChatOpen,
    setIsChatOpen,
    metrics,
    settings,
    terminalLogs = [],
    backendLogs = [],
    aiMetadata,
    initialTab = 'terminal'
}) => {
    const [activeTab, setActiveTab] = useState(initialTab);

    // Update active tab when initialTab prop changes
    useEffect(() => {
        setActiveTab(initialTab);
    }, [initialTab]);

    const tabs = [
        { id: 'terminal', label: 'TERMINAL', icon: TerminalSquare },
        { id: 'chat', label: 'AI CHAT', icon: MessageSquare },
        { id: 'metrics', label: 'METRICS', icon: Activity },
        { id: 'insights', label: 'AI INSIGHTS', icon: Sparkles },
    ];

    return (
        <div className="h-full flex flex-col bg-[#1e1e1e] border-t border-gray-800">
            {/* Tabs Header */}
            <div className="flex items-center bg-[#1e1e1e] border-b border-gray-800">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`
                            flex items-center gap-2 px-4 py-2 text-xs font-medium uppercase tracking-wider border-t-2 transition-colors
                            ${activeTab === tab.id
                                ? 'border-green-500 text-white bg-[#1e1e1e]'
                                : 'border-transparent text-gray-500 hover:text-gray-300 hover:bg-[#2d2d2d]'}
                        `}
                    >
                        <tab.icon size={14} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden relative bg-[#0c0c0c]">
                {/* Terminal */}
                <div className={`absolute inset-0 ${activeTab === 'terminal' ? 'z-10' : 'z-0 invisible'}`}>
                    <ConsoleWindow
                        isOpen={true} // Always open in embedded mode
                        onClose={() => { }}
                        embedded={true}
                        logs={terminalLogs}
                        backendLogs={backendLogs}
                    />
                </div>

                {/* Chat */}
                <div className={`absolute inset-0 ${activeTab === 'chat' ? 'z-10' : 'z-0 invisible'}`}>
                    <ChatWindow
                        isOpen={true}
                        onClose={() => { }}
                        settings={settings}
                        embedded={true}
                    />
                </div>

                {/* Metrics */}
                <div className={`absolute inset-0 p-4 overflow-y-auto ${activeTab === 'metrics' ? 'z-10' : 'z-0 invisible'}`}>
                    {metrics ? (
                        <MetricsCard original={metrics.original} optimized={metrics.optimized} />
                    ) : (
                        <div className="text-gray-500 text-sm text-center mt-10">
                            No metrics available. Run an optimization to see results.
                        </div>
                    )}
                </div>

                {/* AI Insights */}
                <div className={`absolute inset-0 ${activeTab === 'insights' ? 'z-10' : 'z-0 invisible'}`}>
                    <AIInsights metadata={aiMetadata} />
                </div>
            </div>
        </div>
    );
};

export default BottomPanel;
