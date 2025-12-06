import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import BottomPanel from '../components/Layout/BottomPanel';
import CodeEditor from '../components/CodeEditor';
import SettingsPanel from '../components/SettingsPanel';
import api from '../api';
import { toast } from 'sonner';
import { Cpu, Settings, Play, Loader2, Zap, Sliders, Server, Code } from 'lucide-react';
import { useOptimizer } from '../context/OptimizerContext';

const Optimizer = () => {
    const [searchParams] = useSearchParams();
    const loadHistoryId = searchParams.get('load');

    const {
        language, setLanguage,
        code, setCode,
        optimizedCode, setOptimizedCode,
        metrics, setMetrics,
        aiMetadata, setAiMetadata,
        terminalLogs, setTerminalLogs,
        backendLogs, setBackendLogs,
        isAdvancedMode, setIsAdvancedMode,
        advancedSettings, setAdvancedSettings,
        loadFromHistory,
        clearState // Import clearState
    } = useOptimizer();

    const [loading, setLoading] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [bottomPanelTab, setBottomPanelTab] = useState('terminal');

    const [settings, setSettings] = useState({
        provider: 'gemini',
        geminiKey: '',
        groqKey: '',
        model: ''
    });

    const ws = useRef(null);
    const [cooldown, setCooldown] = useState(0);

    const defaultCode = {
        python: `def hello_world():\n    print("Hello, World!")\n\nif __name__ == "__main__":\n    hello_world()`,
        javascript: `function helloWorld() {\n    console.log("Hello, World!");\n}\n\nhelloWorld();`,
        rust: `fn main() {\n    println!("Hello, World!");\n}`,
        c: `#include <stdio.h>\n\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}`,
        cpp: `#include <iostream>\n\nint main() {\n    std::cout << "Hello, World!" << std::endl;\n    return 0;\n}`,
        java: `public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}`
    };

    const location = useLocation(); // Ensure useLocation is used

    useEffect(() => {
        // Only clear state if explicitly requested via navigation (e.g. from Dashboard "New Optimization")
        if (location.state?.reset) {
            clearState();
            setTimeout(() => setCode(defaultCode[language]), 0);
            // Clear the reset flag from history to prevent clearing on refresh
            window.history.replaceState({}, document.title);
        }

        fetchSettings();
        fetchApiKeys();
        connectWebSocket();

        if (loadHistoryId) {
            loadHistorySession(loadHistoryId);
        }

        return () => {
            if (ws.current) {
                ws.current.close();
                ws.current = null;
            }
        };
    }, [loadHistoryId, location.state]); // Add location.state dependency

    const loadHistorySession = async (historyId) => {
        setLoadingHistory(true);
        try {
            console.log(`📂 Loading history session: ${historyId}`);
            const res = await api.get(`/api/history/${historyId}`);

            if (res.data && res.data.record) {
                // Ensure state is cleared before loading new history
                clearState();
                // Small delay to ensure clearState processes
                setTimeout(() => {
                    loadFromHistory(res.data.record);
                    setBottomPanelTab('metrics');
                    toast.success('Session restored from history!');
                }, 10);
            }
        } catch (err) {
            console.error('Failed to load history session:', err);
            toast.error('Failed to restore session from history');
        } finally {
            setLoadingHistory(false);
        }
    };

    const fetchApiKeys = async () => {
        try {
            const res = await api.get('/user/api-keys');
            if (res.data.apiKeys) {
                setSettings(prev => ({
                    ...prev,
                    geminiKey: res.data.apiKeys.gemini || '',
                    groqKey: res.data.apiKeys.groq || ''
                }));
            }
        } catch (err) {
            console.error('Failed to fetch API keys:', err);
        }
    };

    const connectWebSocket = () => {
        // Prevent duplicate connections
        if (ws.current && (ws.current.readyState === WebSocket.OPEN || ws.current.readyState === WebSocket.CONNECTING)) {
            return;
        }

        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.hostname}:3000`;

        ws.current = new WebSocket(wsUrl);

        ws.current.onopen = () => {
            console.log('✅ Connected to Real-time Logs');
        };

        ws.current.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                const timestamp = data.timestamp || new Date().toLocaleTimeString();

                // Deduplication helper
                const isDuplicate = (logs, newMessage) => {
                    if (logs.length === 0) return false;
                    const lastLog = logs[logs.length - 1];
                    return lastLog.message === newMessage && lastLog.timestamp === timestamp;
                };

                if (data.type === 'optimized-output') {
                    setTerminalLogs(prev => {
                        if (isDuplicate(prev, data.message)) return prev;
                        return [...prev, {
                            type: data.level === 'error' ? 'error' : 'success',
                            message: data.message,
                            timestamp
                        }];
                    });
                } else if (data.type === 'metrics-detail') {
                    if (data.context === 'optimized') {
                        const { duration, energy, memory, cpu, co2, improvements } = data.data;
                        
                        // For metrics, we always replace/update, but let's just append for log history
                        // We use a unique marker to prevent re-adding the same block
                        setTerminalLogs(prev => {
                            const lastLog = prev[prev.length - 1];
                            if (lastLog && lastLog.message === '📊 Improvements:') return prev; // Simple debounce check

                            return [
                                ...prev,
                                { type: 'success', message: `⚡ Optimized Code Performance:`, timestamp },
                                { type: 'info', message: `   ⏱️  Execution Time: ${duration}ms`, timestamp },
                                { type: 'info', message: `   💾 RAM Usage: ${(Number(memory) || 0).toFixed(2)}MB`, timestamp },
                                { type: 'info', message: `   🔋 Energy Used: ${(Number(energy) || 0).toFixed(6)}J`, timestamp },
                                { type: 'info', message: `   🌱 CO2 Emissions: ${(Number(co2) || 0).toExponential(2)}kg`, timestamp },
                                { type: 'info', message: `   🖥️  CPU Peak: ${(Number(cpu) || 0).toFixed(1)}%`, timestamp },
                                { type: 'success', message: `📊 Improvements:`, timestamp },
                                { type: 'success', message: `   🚀 ${improvements?.time || 0}% faster execution`, timestamp },
                                { type: 'success', message: `   ⚡ ${improvements?.energy || 0}% less energy`, timestamp },
                                { type: 'success', message: `   💾 ${improvements?.memory || 0}% less memory`, timestamp }
                            ];
                        });
                    } else {
                        const { duration, energy, memory, cpu, co2 } = data.data;
                        setBackendLogs(prev => {
                            const lastLog = prev[prev.length - 1];
                            if (lastLog && lastLog.message === '📊 Original Code Performance:') return prev;

                            return [
                                ...prev,
                                { type: 'info', message: `📊 Original Code Performance:`, timestamp },
                                { type: 'info', message: `   ⏱️  Execution Time: ${duration}ms`, timestamp },
                                { type: 'info', message: `   💾 RAM Usage: ${(Number(memory) || 0).toFixed(2)}MB`, timestamp },
                                { type: 'info', message: `   🔋 Energy Used: ${(Number(energy) || 0).toFixed(6)}J`, timestamp },
                                { type: 'info', message: `   🌱 CO2 Emissions: ${(Number(co2) || 0).toExponential(2)}kg`, timestamp },
                                { type: 'info', message: `   🖥️  CPU Peak: ${(Number(cpu) || 0).toFixed(1)}%`, timestamp }
                            ];
                        });
                    }
                } else if (data.type === 'original-output') {
                    setBackendLogs(prev => {
                        if (isDuplicate(prev, data.message)) return prev;
                        return [...prev, {
                            type: data.level === 'error' ? 'error' : 'info',
                            message: data.message,
                            timestamp
                        }];
                    });
                }
            } catch (e) {
                // Silently ignore parse errors
            }
        };
        ws.current.onclose = () => {
            console.log('❌ Disconnected from Real-time Logs');
            setTimeout(connectWebSocket, 3000);
        };

        ws.current.onerror = (error) => {
            console.error('WebSocket error:', error);
        };
    };

    const fetchSettings = async () => {
        try {
            const res = await api.get('/user/api-keys');
            if (res.data.apiKeys) {
                setSettings(prev => ({
                    ...prev,
                    geminiKey: res.data.apiKeys.gemini || '',
                    groqKey: res.data.apiKeys.groq || ''
                }));
            }
        } catch (err) {
            console.error('Failed to fetch settings:', err);
        }
    };

    const handleSettingsSave = async (newSettings) => {
        setSettings(newSettings);
        try {
            await api.put('/user/api-keys', {
                gemini: newSettings.geminiKey,
                groq: newSettings.groqKey
            });
            toast.success('Settings saved successfully');
        } catch (err) {
            toast.error('Failed to save API keys');
        }
    };

    const handleLanguageChange = (e) => {
        const newLang = e.target.value;
        setLanguage(newLang);
        setCode(defaultCode[newLang]);
        setOptimizedCode('');
        setMetrics(null);
        setAiMetadata(null);
    };

    useEffect(() => {
        let timer;
        if (cooldown > 0) {
            timer = setInterval(() => {
                setCooldown(prev => prev - 1);
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [cooldown]);

    const handleOptimize = async (action = 'optimize') => {
        if (!code.trim()) {
            toast.error('Please enter some code to optimize');
            return;
        }

        if (cooldown > 0) {
            toast.warning(`Please wait ${cooldown}s before optimizing again.`);
            return;
        }

        const apiKey = settings.provider === 'gemini' ? settings.geminiKey : settings.groqKey;
        if (!apiKey) {
            toast.error(`Please enter a ${settings.provider === 'gemini' ? 'Gemini' : 'Groq'} API Key in settings.`);
            setIsSettingsOpen(true);
            return;
        }

        setLoading(true);

        try {
            const startTime = Date.now();
            setTerminalLogs(prev => [...prev, {
                type: 'info',
                message: `🚀 Starting ${action} for ${language} using ${settings.provider}...`,
                timestamp: new Date().toLocaleTimeString()
            }]);

            if (isAdvancedMode) {
                setTerminalLogs(prev => [...prev, {
                    type: 'info',
                    message: `⚙️ Advanced Settings: ${advancedSettings.paradigm}, ${advancedSettings.optimizationType}, LLVM: ${advancedSettings.useLLVM}, Context: ${advancedSettings.projectContext}`,
                    timestamp: new Date().toLocaleTimeString()
                }]);
            }

            const res = await api.post('/process', {
                code,
                language,
                intensity: 50,
                provider: settings.provider,
                apiKey: apiKey,
                model: settings.model,
                paradigm: isAdvancedMode ? advancedSettings.paradigm : undefined,
                optimizationType: isAdvancedMode ? advancedSettings.optimizationType : undefined,
                useLLVM: isAdvancedMode ? advancedSettings.useLLVM : undefined,
                projectContext: isAdvancedMode ? advancedSettings.projectContext : undefined,
                action: isAdvancedMode ? action : 'full'
            });

            if (res.data.error) {
                throw new Error(res.data.error);
            }

            if (res.data.optimized && res.data.optimized.code) {
                setOptimizedCode(res.data.optimized.code);
            }

            setMetrics(prev => ({
                original: res.data.original || (prev ? prev.original : null),
                optimized: res.data.optimized || (prev ? prev.optimized : null)
            }));

            if (res.data.aiMetadata) {
                setAiMetadata(res.data.aiMetadata);
            }

            const duration = ((Date.now() - startTime) / 1000).toFixed(2);
            toast.success(`Operation completed in ${duration}s`);
            setTerminalLogs(prev => [...prev, {
                type: 'success',
                message: `✅ Operation completed in ${duration}s`,
                timestamp: new Date().toLocaleTimeString()
            }]);

            setCooldown(3);

        } catch (err) {
            console.error('Optimization error:', err);
            const msg = err.response?.data?.error || err.message || 'Optimization failed';
            toast.error(msg);
            setTerminalLogs(prev => [...prev, {
                type: 'error',
                message: `❌ ${msg}`,
                timestamp: new Date().toLocaleTimeString()
            }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-full w-full flex flex-col bg-[#1e1e1e] text-white overflow-hidden font-sans">
            {/* Header */}
            <div className="h-16 bg-[#1e1e24] flex items-center justify-between px-6 border-b border-[#ffffff0d] select-none shadow-md z-20 relative">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-[#16161c] shadow-inner border border-[#ffffff05]">
                        <Cpu className="text-[#00ff9d] animate-pulse" size={20} />
                    </div>
                    <span className="text-lg font-bold text-gray-200 tracking-wide">Green Code Optimizer</span>
                </div>

                <div className="flex items-center gap-6">
                    <button
                        onClick={() => setIsAdvancedMode(!isAdvancedMode)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${isAdvancedMode
                            ? 'neu-pressed text-[#00ff9d] shadow-[inset_2px_2px_5px_rgba(0,0,0,0.5),inset_-2px_-2px_5px_rgba(255,255,255,0.05)]'
                            : 'neu-button text-gray-400 hover:text-gray-200'
                            }`}
                    >
                        <Sliders size={14} />
                        Advanced Mode
                    </button>

                    <div className="h-8 w-px bg-[#ffffff10] mx-2"></div>

                    <select
                        value={language}
                        onChange={handleLanguageChange}
                        className="neu-input text-xs text-gray-300 px-3 py-1.5 w-32 cursor-pointer hover:text-white transition-colors"
                    >
                        <option value="python">Python</option>
                        <option value="rust">Rust</option>
                        <option value="javascript">Node.js</option>
                        <option value="c">C</option>
                        <option value="cpp">C++</option>
                        <option value="java">Java</option>
                    </select>

                    {isAdvancedMode ? (
                        <div className="flex gap-2">

                            <button
                                onClick={() => handleOptimize('full')}
                                disabled={loading || cooldown > 0}
                                className="neu-button-primary px-6 py-2 rounded-lg text-xs font-bold text-[#16161c] flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all shadow-[0_0_15px_rgba(0,255,157,0.3)] hover:shadow-[0_0_25px_rgba(0,255,157,0.5)]"
                            >
                                {loading ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
                                {cooldown > 0 ? `WAIT ${cooldown}s` : 'RUN & OPTIMIZE'}
                            </button>
                        </div>
                    ) : (
                        <div className="flex gap-2">

                            <button
                                onClick={() => handleOptimize('full')}
                                disabled={loading || cooldown > 0}
                                className="neu-button-primary px-6 py-2 rounded-lg text-xs font-bold text-[#16161c] flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all shadow-[0_0_15px_rgba(0,255,157,0.3)] hover:shadow-[0_0_25px_rgba(0,255,157,0.5)]"
                            >
                                {loading ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
                                {cooldown > 0 ? `WAIT ${cooldown}s` : 'RUN & OPTIMIZE'}
                            </button>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsSettingsOpen(true)}
                        className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded-md"
                        title="Settings"
                    >
                        <Settings size={18} />
                    </button>
                </div>
            </div>

            {isAdvancedMode && (
                <div className="bg-[#1e1e24] border-b border-[#ffffff0d] px-4 py-4 flex flex-wrap items-center gap-6 animate-in slide-in-from-top-2 duration-300 shadow-lg z-10 relative">
                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] uppercase text-gray-500 font-bold tracking-wider ml-1">Paradigm</label>
                        <select
                            value={advancedSettings.paradigm}
                            onChange={(e) => setAdvancedSettings(prev => ({ ...prev, paradigm: e.target.value }))}
                            className="neu-input text-xs w-32 cursor-pointer transition-all hover:text-white"
                        >
                            <option value="Procedural">Procedural</option>
                            <option value="Object-Oriented">Object-Oriented</option>
                            <option value="Functional">Functional</option>
                            <option value="Imperative">Imperative</option>
                        </select>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] uppercase text-gray-500 font-bold tracking-wider ml-1">Optimization Goal</label>
                        <select
                            value={advancedSettings.optimizationType}
                            onChange={(e) => setAdvancedSettings(prev => ({ ...prev, optimizationType: e.target.value }))}
                            className="neu-input text-xs w-36 cursor-pointer transition-all hover:text-white"
                        >
                            <option value="Balanced">Balanced</option>
                            <option value="Speed">Speed (Performance)</option>
                            <option value="Memory">Memory Efficiency</option>
                            <option value="Energy">Energy Efficiency</option>
                        </select>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] uppercase text-gray-500 font-bold tracking-wider ml-1">Context</label>
                        <select
                            value={advancedSettings.projectContext}
                            onChange={(e) => setAdvancedSettings(prev => ({ ...prev, projectContext: e.target.value }))}
                            className="neu-input text-xs w-36 cursor-pointer transition-all hover:text-white"
                        >
                            <option value="Standalone Script">Standalone Script</option>
                            <option value="Project Module">Project Module</option>
                            <option value="Library Function">Library Function</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-3 mt-5 bg-[#16161c] px-3 py-2 rounded-lg shadow-inner border border-[#ffffff05]">
                        <input
                            type="checkbox"
                            id="useLLVM"
                            checked={advancedSettings.useLLVM}
                            onChange={(e) => setAdvancedSettings(prev => ({ ...prev, useLLVM: e.target.checked }))}
                            className="w-4 h-4 rounded border-gray-700 bg-[#1e1e24] text-green-500 focus:ring-green-500 focus:ring-offset-0 cursor-pointer"
                        />
                        <label htmlFor="useLLVM" className="text-xs text-gray-300 cursor-pointer select-none font-medium hover:text-white transition-colors">
                            Include LLVM IR / Inline Assembly
                        </label>
                    </div>
                </div>
            )}

            <div className="flex-1 flex overflow-hidden">
                <PanelGroup direction="vertical">
                    <Panel defaultSize={70} minSize={30}>
                        <PanelGroup direction="horizontal">
                            <Panel defaultSize={50} minSize={20}>
                                <div className="h-full flex flex-col">
                                    <div className="h-8 bg-[#1e1e1e] flex items-center px-4 border-b border-gray-800">
                                        <Code size={14} className="text-gray-400 mr-2" />
                                        <span className="text-xs text-gray-400 italic">Original Code ({language})</span>
                                    </div>
                                    <div className="flex-1 relative">
                                        <CodeEditor value={code} onChange={setCode} language={language} />
                                    </div>
                                </div>
                            </Panel>

                            <PanelResizeHandle className="w-1 bg-[#2b2b2b] hover:bg-blue-500 transition-colors" />

                            <Panel defaultSize={50} minSize={20}>
                                <div className="h-full flex flex-col bg-[#1e1e1e]">
                                    <div className="h-8 bg-[#1e1e1e] flex items-center px-4 border-b border-gray-800 justify-between">
                                        <div className="flex items-center">
                                            <Zap size={14} className="text-green-400 mr-2" />
                                            <span className="text-xs text-green-400 italic">Optimized Code (AI Generated)</span>
                                        </div>
                                    </div>
                                    <div className="flex-1 relative">
                                        <CodeEditor value={optimizedCode} readOnly={true} language={language} />
                                    </div>
                                </div>
                            </Panel>
                        </PanelGroup>
                    </Panel>

                    <PanelResizeHandle className="h-1 bg-[#2b2b2b] hover:bg-blue-500 transition-colors" />

                    <Panel defaultSize={30} minSize={10} collapsible={true}>
                        <BottomPanel
                            isConsoleOpen={true}
                            setIsConsoleOpen={() => { }}
                            isChatOpen={true}
                            setIsChatOpen={() => { }}
                            metrics={metrics}
                            settings={settings}
                            terminalLogs={terminalLogs}
                            backendLogs={backendLogs}
                            aiMetadata={aiMetadata}
                            initialTab={bottomPanelTab}
                        />
                    </Panel>
                </PanelGroup>
            </div>

            <SettingsPanel
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                settings={settings}
                onSave={handleSettingsSave}
            />
        </div>
    );
};

export default Optimizer;
