import React, { useEffect, useRef } from 'react';
import { Activity, X, TerminalSquare } from 'lucide-react';

const SystemMonitor = ({ logs, isOpen, onClose }) => {
    const scrollRef = useRef(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs]);

    if (!isOpen) return null;

    return (
        <div className="fixed bottom-4 right-4 w-[400px] h-[300px] bg-black border border-green-900/50 rounded-lg shadow-2xl flex flex-col overflow-hidden z-50 font-mono text-xs opacity-95">
            {/* Header */}
            <div className="bg-green-950/30 border-b border-green-900/30 px-3 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2 text-green-500">
                    <TerminalSquare size={14} />
                    <span className="font-bold tracking-wider">SYSTEM_MONITOR_V1.0</span>
                </div>
                <button onClick={onClose} className="text-green-700 hover:text-green-400 transition-colors">
                    <X size={14} />
                </button>
            </div>

            {/* Content */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-3 space-y-1 bg-black custom-scrollbar"
            >
                {logs.length === 0 && (
                    <div className="text-green-900 italic text-center mt-20">
                        Waiting for system events...
                    </div>
                )}
                {logs.map((log, index) => (
                    <div key={index} className="flex gap-2 break-all">
                        <span className="text-gray-600 shrink-0">[{log.timestamp}]</span>
                        <span className={`
              ${log.type === 'error' ? 'text-red-500' :
                                log.type === 'debug' ? 'text-gray-500' :
                                    log.type === 'success' ? 'text-green-400' : 'text-green-600'}
            `}>
                            {log.type === 'debug' ? '>' : '#'} {log.message}
                        </span>
                    </div>
                ))}
                <div className="animate-pulse text-green-500 font-bold">_</div>
            </div>
        </div>
    );
};

export default SystemMonitor;
