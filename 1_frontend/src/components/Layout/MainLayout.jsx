import React from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import Sidebar from './Sidebar';
import BottomPanel from './BottomPanel';
import CodeEditor from '../CodeEditor';
import { Cpu, Settings, Play, Loader2 } from 'lucide-react';

const MainLayout = ({
    language,
    code,
    setCode,
    optimizedCode,
    metrics,
    loading,
    intensity,
    setIntensity,
    handleOptimize,
    settings,
    setSettings,
    isSettingsOpen,
    setIsSettingsOpen,
    handleLanguageChange,
    terminalLogs = [],
    backendLogs = []
}) => {
    return (
        <div className="h-screen w-screen flex flex-col bg-[#1e1e1e] text-white overflow-hidden font-sans">
            {/* Top Bar (VS Code style) */}
            <div className="h-10 bg-[#1f1f1f] flex items-center justify-between px-4 border-b border-gray-800 select-none">
                <div className="flex items-center gap-2">
                    <Cpu className="text-green-500" size={18} />
                    <span className="text-sm font-medium text-gray-300">Green Code Optimizer</span>
                </div>

                {/* Center Controls */}
                <div className="flex items-center gap-4 bg-[#2d2d2d] rounded-md px-2 py-1">
                    <select
                        value={language}
                        onChange={handleLanguageChange}
                        className="bg-transparent text-xs text-gray-300 focus:outline-none cursor-pointer"
                    >
                        <option value="python">Python</option>
                        <option value="rust">Rust</option>
                        <option value="javascript">Node.js</option>
                    </select>
                    <div className="w-px h-4 bg-gray-600"></div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">Intensity</span>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={intensity}
                            onChange={(e) => setIntensity(e.target.value)}
                            className="w-20 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-green-500"
                        />
                        <span className="text-xs text-green-400 w-6 text-right">{intensity}%</span>
                    </div>
                    <div className="w-px h-4 bg-gray-600"></div>
                    <button
                        onClick={handleOptimize}
                        disabled={loading}
                        className="flex items-center gap-1 text-xs font-bold text-green-400 hover:text-green-300 disabled:opacity-50"
                    >
                        {loading ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} className="fill-current" />}
                        RUN
                    </button>
                </div>

                {/* Right Controls */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsSettingsOpen(true)}
                        className="text-gray-400 hover:text-white"
                        title="Settings"
                    >
                        <Settings size={16} />
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex overflow-hidden">
                {/* Activity Bar (Leftmost thin strip) */}
                <div className="w-12 bg-[#181818] border-r border-gray-800 flex flex-col items-center py-4 gap-4">
                    <div className="p-2 border-l-2 border-white text-white cursor-pointer">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                    </div>
                    {/* Add more icons here for future extensions */}
                </div>

                <PanelGroup direction="horizontal">
                    {/* Sidebar: File Explorer */}
                    <Panel defaultSize={20} minSize={15} maxSize={30} collapsible={true}>
                        <Sidebar onFileSelect={(file) => {
                            // TODO: Implement file opening logic
                            console.log("Selected file:", file);
                        }} />
                    </Panel>

                    <PanelResizeHandle className="w-1 bg-[#2b2b2b] hover:bg-blue-500 transition-colors" />

                    {/* Editor & Bottom Panel Area */}
                    <Panel>
                        <PanelGroup direction="vertical">
                            {/* Editors Split View */}
                            <Panel defaultSize={70} minSize={30}>
                                <PanelGroup direction="horizontal">
                                    {/* Original Code */}
                                    <Panel defaultSize={50} minSize={20}>
                                        <div className="h-full flex flex-col">
                                            <div className="h-8 bg-[#1e1e1e] flex items-center px-4 border-b border-gray-800">
                                                <span className="text-xs text-gray-400 italic">Original Code ({language})</span>
                                            </div>
                                            <div className="flex-1 relative">
                                                <CodeEditor value={code} onChange={setCode} language={language} />
                                            </div>
                                        </div>
                                    </Panel>

                                    <PanelResizeHandle className="w-1 bg-[#2b2b2b] hover:bg-blue-500 transition-colors" />

                                    {/* Optimized Code */}
                                    <Panel defaultSize={50} minSize={20}>
                                        <div className="h-full flex flex-col bg-[#1e1e1e]">
                                            <div className="h-8 bg-[#1e1e1e] flex items-center px-4 border-b border-gray-800 justify-between">
                                                <span className="text-xs text-green-400 italic">Optimized Code (AI Generated)</span>
                                            </div>
                                            <div className="flex-1 relative">
                                                <CodeEditor value={optimizedCode} readOnly={true} language={language} />
                                            </div>
                                        </div>
                                    </Panel>
                                </PanelGroup>
                            </Panel>

                            <PanelResizeHandle className="h-1 bg-[#2b2b2b] hover:bg-blue-500 transition-colors" />

                            {/* Bottom Panel (Terminal/Chat/Metrics) */}
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
                                />
                            </Panel>
                        </PanelGroup>
                    </Panel>
                </PanelGroup>
            </div>
        </div>
    );
};

export default MainLayout;
