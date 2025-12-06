import React, { useEffect, useRef, useState } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import Draggable from 'react-draggable';
import { X, Minus, Maximize2, TerminalSquare } from 'lucide-react';
import 'xterm/css/xterm.css';

const ConsoleWindow = ({ isOpen, onClose, embedded = false, logs = [], backendLogs = [] }) => {
    const [activeChannel, setActiveChannel] = useState('terminal'); // 'terminal' | 'logs'
    const [isMinimized, setIsMinimized] = useState(false);

    // Refs for Shell Terminal
    const shellContainerRef = useRef(null);
    const shellTermRef = useRef(null);
    const shellFitRef = useRef(null);

    // Refs for Logs Terminal
    const logsContainerRef = useRef(null);
    const logsTermRef = useRef(null);
    const logsFitRef = useRef(null);

    const wsRef = useRef(null);
    const nodeRef = useRef(null);

    // Initialize a terminal instance
    const initXterm = (containerRef, termRef, fitRef, readOnly = false) => {
        if (!containerRef.current || termRef.current) return;

        const term = new Terminal({
            cursorBlink: !readOnly,
            disableStdin: readOnly,
            theme: {
                background: '#0c0c0c',
                foreground: '#cccccc',
                cursor: readOnly ? '#00000000' : '#00ff00',
                selectionBackground: 'rgba(0, 255, 0, 0.3)',
                black: '#0c0c0c',
                red: '#c0392b',
                green: '#27ae60',
                yellow: '#f1c40f',
                blue: '#2980b9',
                magenta: '#8e44ad',
                cyan: '#16a085',
                white: '#ecf0f1',
            },
            fontFamily: 'Menlo, Monaco, "Courier New", monospace',
            fontSize: 12,
            rows: 20,
            cols: 80,
        });

        const fitAddon = new FitAddon();
        term.loadAddon(fitAddon);

        const fitLoop = () => {
            if (containerRef.current && containerRef.current.offsetWidth > 0) {
                term.open(containerRef.current);
                try { fitAddon.fit(); } catch (e) { console.warn("FitAddon failed:", e); }

                const ro = new ResizeObserver(() => {
                    try { fitAddon.fit(); } catch (e) { console.warn("Resize fit failed:", e); }
                });
                ro.observe(containerRef.current);
                return ro;
            } else {
                setTimeout(fitLoop, 100);
            }
        };

        const ro = fitLoop();

        termRef.current = term;
        fitRef.current = fitAddon;

        return () => {
            if (ro) ro.disconnect();
            term.dispose();
        };
    };

    useEffect(() => {
        if (!isOpen) return;

        const cleanupShell = initXterm(shellContainerRef, shellTermRef, shellFitRef, false);
        const cleanupLogs = initXterm(logsContainerRef, logsTermRef, logsFitRef, true);

        return () => {
            if (cleanupShell) cleanupShell();
            if (cleanupLogs) cleanupLogs();
        };
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;
        setTimeout(() => {
            if (activeChannel === 'terminal') shellFitRef.current?.fit();
            else logsFitRef.current?.fit();
        }, 50);
    }, [activeChannel, isOpen]);

    if (!isOpen && !embedded) return null;

    const content = (
        <div
            ref={nodeRef}
            className={`bg-[#0c0c0c] border-gray-700 overflow-hidden flex flex-col transition-all duration-200 ${embedded ? 'h-full w-full border-none rounded-none' : `fixed border rounded-lg shadow-2xl ${isMinimized ? 'h-10 w-64' : 'h-[400px] w-[600px]'}`}`}
            style={embedded ? {} : { position: 'fixed' }}
        >
            {/* Header */}
            <div className="bg-[#1e1e1e] border-b border-gray-800 px-2 py-1 flex items-center justify-between select-none h-9">
                <div className="flex items-center gap-4">
                    {!embedded && (
                        <div className="flex items-center gap-2 text-gray-400 mr-2 handle cursor-move">
                            <TerminalSquare size={14} />
                            <span className="text-xs font-bold tracking-wider">TERMINAL</span>
                        </div>
                    )}

                    {/* Channel Switcher */}
                    <div className="flex bg-[#252526] rounded p-0.5">
                        <button
                            onClick={() => setActiveChannel('terminal')}
                            className={`px-3 py-0.5 text-xs font-medium rounded-sm transition-colors ${activeChannel === 'terminal' ? 'bg-[#37373d] text-white' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            Execution Output
                        </button>
                        <button
                            onClick={() => setActiveChannel('logs')}
                            className={`px-3 py-0.5 text-xs font-medium rounded-sm transition-colors ${activeChannel === 'logs' ? 'bg-[#37373d] text-white' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            Backend Logs
                        </button>
                    </div>
                </div>

                {!embedded && (
                    <div className="flex items-center gap-2">
                        <button onClick={() => setIsMinimized(!isMinimized)} className="text-gray-500 hover:text-white">
                            {isMinimized ? <Maximize2 size={12} /> : <Minus size={12} />}
                        </button>
                        <button onClick={onClose} className="text-gray-500 hover:text-red-500">
                            <X size={12} />
                        </button>
                    </div>
                )}
            </div>

            {/* Terminal Content */}
            {(!isMinimized || embedded) && (
                <div className="flex-1 relative bg-[#0c0c0c] overflow-hidden">
                    {/* Execution Output */}
                    <div className={`absolute inset-0 p-4 overflow-y-auto font-mono text-sm ${activeChannel === 'terminal' ? 'z-10' : 'z-0 invisible'}`}>
                        {logs.length === 0 ? (
                            <div className="text-gray-600">
                                Waiting for code execution...
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {logs.map((log, index) => (
                                    <div key={index} className="flex gap-3">
                                        <span className="text-gray-600 text-xs min-w-[80px]">
                                            {log.timestamp}
                                        </span>
                                        <div className="flex-1">
                                            {log.type === 'info' && <span className="text-blue-400">ℹ️</span>}
                                            {log.type === 'success' && <span className="text-green-400">✅</span>}
                                            {log.type === 'error' && <span className="text-red-400">❌</span>}
                                            {log.type === 'warning' && <span className="text-yellow-400">⚠️</span>}
                                            <span className={`ml-2 ${log.type === 'error' ? 'text-red-300' :
                                                log.type === 'success' ? 'text-green-300' :
                                                    log.type === 'warning' ? 'text-yellow-300' :
                                                        'text-gray-300'
                                                }`}>
                                                {log.message}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Backend Logs */}
                    <div className={`absolute inset-0 p-4 overflow-y-auto font-mono text-sm ${activeChannel === 'logs' ? 'z-10' : 'z-0 invisible'}`}>
                        {backendLogs.length === 0 ? (
                            <div className="text-gray-600">
                                Waiting for backend logs...
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {backendLogs.map((log, index) => (
                                    <div key={index} className="flex gap-3">
                                        <span className="text-gray-600 text-xs min-w-[80px]">
                                            {log.timestamp}
                                        </span>
                                        <div className="flex-1">
                                            {log.type === 'info' && <span className="text-blue-400">ℹ️</span>}
                                            {log.type === 'success' && <span className="text-green-400">✅</span>}
                                            {log.type === 'error' && <span className="text-red-400">❌</span>}
                                            {log.type === 'warning' && <span className="text-yellow-400">⚠️</span>}
                                            <span className={`ml-2 ${log.type === 'error' ? 'text-red-300' :
                                                    log.type === 'success' ? 'text-green-300' :
                                                        log.type === 'warning' ? 'text-yellow-300' :
                                                            'text-gray-300'
                                                }`}>
                                                {log.message}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );

    if (embedded) return content;

    return (
        <Draggable nodeRef={nodeRef} handle=".handle">
            {content}
        </Draggable>
    );
};

export default ConsoleWindow;
