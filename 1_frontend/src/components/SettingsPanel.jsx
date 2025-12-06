import React, { useState } from 'react';
import { X, Save, Key, Database, RefreshCw, AlertCircle, Settings } from 'lucide-react';
import api from '../api';

const SettingsPanel = ({ isOpen, onClose, settings, onSave }) => {
    const [localSettings, setLocalSettings] = useState(settings);
    const [models, setModels] = useState([]);
    const [loadingModels, setLoadingModels] = useState(false);
    const [modelError, setModelError] = useState(null);

    if (!isOpen) return null;

    const handleChange = (key, value) => {
        setLocalSettings(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = () => {
        onSave(localSettings);
        onClose();
    };

    const fetchModels = async () => {
        setLoadingModels(true);
        setModelError(null);
        setModels([]);

        const apiKey = localSettings.provider === 'gemini' ? localSettings.geminiKey : localSettings.groqKey;
        if (!apiKey) {
            setModelError("Please enter an API Key first.");
            setLoadingModels(false);
            return;
        }

        try {
            const res = await api.get(`/api/models/${localSettings.provider}`, {
                headers: { 'x-api-key': apiKey }
            });
            if (res.data.models && res.data.models.length > 0) {
                setModels(res.data.models);

                // Auto-select appropriate models if none selected
                const optimizationModels = res.data.models.filter(m => m.capabilities?.includes('optimization'));
                const chatModels = res.data.models.filter(m => m.capabilities?.includes('chat'));

                if (!localSettings.model && optimizationModels.length > 0) {
                    handleChange('model', optimizationModels[0].name);
                }
                if (!localSettings.chatModel && chatModels.length > 0) {
                    handleChange('chatModel', chatModels[0].name);
                }
            } else {
                setModelError("No models found or invalid key.");
            }
        } catch (err) {
            setModelError(err.response?.data?.error || "Failed to fetch models.");
        }
        setLoadingModels(false);
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                <div className="flex justify-between items-center p-4 border-b border-gray-800 bg-gray-950">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                        <Settings size={20} className="text-gray-400" />
                        Settings
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Provider Selection */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-400">AI Provider</label>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => handleChange('provider', 'gemini')}
                                className={`p-3 rounded-lg border transition-all flex items-center justify-center gap-2 ${localSettings.provider === 'gemini'
                                    ? 'bg-green-500/10 border-green-500 text-green-400'
                                    : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-750'
                                    }`}
                            >
                                Google Gemini
                            </button>
                            <button
                                onClick={() => handleChange('provider', 'groq')}
                                className={`p-3 rounded-lg border transition-all flex items-center justify-center gap-2 ${localSettings.provider === 'groq'
                                    ? 'bg-orange-500/10 border-orange-500 text-orange-400'
                                    : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-750'
                                    }`}
                            >
                                Groq Cloud
                            </button>
                        </div>
                    </div>

                    {/* API Key Input */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
                            <Key size={14} />
                            {localSettings.provider === 'gemini' ? 'Gemini API Key' : 'Groq API Key'}
                        </label>
                        <input
                            type="password"
                            value={localSettings.provider === 'gemini' ? localSettings.geminiKey : localSettings.groqKey}
                            onChange={(e) => handleChange(localSettings.provider === 'gemini' ? 'geminiKey' : 'groqKey', e.target.value)}
                            placeholder={`Enter ${localSettings.provider === 'gemini' ? 'Gemini' : 'Groq'} API Key`}
                            className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-green-500 transition-colors"
                        />
                    </div>

                    {/* Model Selection */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
                                <Database size={14} />
                                Optimization Model
                            </label>
                            <button
                                onClick={fetchModels}
                                disabled={loadingModels}
                                className="text-xs text-green-400 hover:text-green-300 flex items-center gap-1"
                            >
                                {loadingModels ? <RefreshCw size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                                {loadingModels ? 'Fetching...' : 'Fetch Models'}
                            </button>
                        </div>

                        {modelError && <p className="text-xs text-red-400 flex items-center gap-1"><AlertCircle size={10} /> {modelError}</p>}

                        <select
                            value={localSettings.model || ''}
                            onChange={(e) => handleChange('model', e.target.value)}
                            className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-green-500 transition-colors appearance-none cursor-pointer"
                        >
                            <option value="" disabled>Select an optimization model...</option>
                            {models.length > 0 ? (
                                models
                                    .filter(m => m.capabilities?.includes('optimization'))
                                    .map(m => (
                                        <option key={m.name} value={m.name}>
                                            {m.name} {m.tier === 'paid' ? '💎' : '🆓'} {m.capabilities?.includes('optimization') ? '🔧' : ''}
                                        </option>
                                    ))
                            ) : (
                                // Fallback options if fetch hasn't run
                                localSettings.provider === 'gemini' ? (
                                    <>
                                        <option value="gemini-2.0-flash">gemini-2.0-flash 🆓 🔧</option>
                                        <option value="gemini-2.0-flash-exp">gemini-2.0-flash-exp 🆓 🔧</option>
                                    </>
                                ) : (
                                    <option value="llama3-70b-8192">llama3-70b-8192 🆓 🔧</option>
                                )
                            )}
                        </select>
                        {models.length > 0 && (
                            <p className="text-xs text-gray-500 mt-1">
                                💎 Paid • 🆓 Free • 🔧 Optimization
                            </p>
                        )}
                    </div>

                    {/* Chat Model Selection */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
                            <Database size={14} />
                            Chat Model
                        </label>
                        <select
                            value={localSettings.chatModel || ''}
                            onChange={(e) => handleChange('chatModel', e.target.value)}
                            className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-green-500 transition-colors appearance-none cursor-pointer"
                        >
                            <option value="" disabled>Select a chat model...</option>
                            {models.length > 0 ? (
                                models
                                    .filter(m => m.capabilities?.includes('chat'))
                                    .map(m => (
                                        <option key={m.name} value={m.name}>
                                            {m.name} {m.tier === 'paid' ? '💎' : '🆓'} 💬
                                        </option>
                                    ))
                            ) : (
                                // Fallback options if fetch hasn't run
                                localSettings.provider === 'gemini' ? (
                                    <>
                                        <option value="gemini-2.0-flash">gemini-2.0-flash 🆓 💬</option>
                                        <option value="gemini-1.5-flash">gemini-1.5-flash 🆓 💬</option>
                                    </>
                                ) : (
                                    <option value="llama3-8b-8192">llama3-8b-8192 🆓 💬</option>
                                )
                            )}
                        </select>
                        {models.length > 0 && (
                            <p className="text-xs text-gray-500 mt-1">
                                💎 Paid • 🆓 Free • 💬 Chat
                            </p>
                        )}
                    </div>
                </div>

                <div className="p-4 border-t border-gray-800 bg-gray-950 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-400 hover:text-white transition-colors font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                    >
                        <Save size={16} />
                        Save Settings
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsPanel;
