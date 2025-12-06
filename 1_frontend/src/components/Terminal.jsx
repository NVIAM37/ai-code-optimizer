import React, { useEffect, useRef } from 'react';
import { Terminal as TerminalIcon, XCircle, CheckCircle, Activity } from 'lucide-react';

const Terminal = ({ logs, isOpen, onClose }) => {
    const scrollRef = useRef(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs]);

    if (!isOpen) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 h-64 bg-gray-950 border-t border-gray-800 shadow-2xl flex flex-col font-mono text-sm z-50">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-800">
                <div className="flex items-center gap-2 text-gray-400">
                    <TerminalIcon size={16} />
                    <span className="font-semibold">System Terminal</span>
                </div>
                <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
                    <XCircle size={18} />
                </button>
            </div>

            {/* Logs Area */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                {logs.length === 0 && (
                    <div className="text-gray-600 italic">Waiting for system events...</div>
                )}

                {logs.map((log, index) => (
                    <div key={index} className="flex gap-3 animate-fade-in">
                        <span className="text-gray-600 min-w-[80px]">{log.timestamp}</span>
                        <div className="flex-1 break-all">
                            {log.type === 'info' && <span className="text-blue-400">ℹ️ [INFO] </span>}
                            {log.type === 'success' && <span className="text-green-400">✅ [SUCCESS] </span>}
                            {log.type === 'error' && <span className="text-red-400">❌ [ERROR] </span>}
                            {log.type === 'system' && <span className="text-purple-400">⚙️ [SYSTEM] </span>}

                            <span className={
                                log.type === 'error' ? 'text-red-300' :
                                    log.type === 'success' ? 'text-green-300' :
                                        'text-gray-300'
                            }>
                                {log.message}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Terminal;
