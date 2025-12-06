import React, { useState, useEffect } from 'react';
import { X, Save, Loader2, Key } from 'lucide-react';
import api from '../api';
import { toast } from 'sonner';

const SettingsModal = ({ isOpen, onClose, onUpdate }) => {
    const [apiKeys, setApiKeys] = useState({ gemini: '', groq: '' });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            const fetchKeys = async () => {
                try {
                    const res = await api.get('/user/api-keys');
                    setApiKeys(res.data.apiKeys || { gemini: '', groq: '' });
                } catch (err) {
                    console.error('Failed to fetch API keys:', err);
                }
            };
            fetchKeys();
        }
    }, [isOpen]);

    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.put('/user/api-keys', apiKeys);
            toast.success('API keys updated successfully');
            if (onUpdate) onUpdate(apiKeys);
            onClose();
        } catch (err) {
            toast.error('Failed to update API keys');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#1e1e1e] rounded-xl border border-gray-800 w-full max-w-md shadow-2xl">
                <div className="flex items-center justify-between p-4 border-b border-gray-800">
                    <div className="flex items-center gap-2">
                        <Key className="text-green-500" size={20} />
                        <h2 className="text-lg font-bold text-white">Optimizer Settings</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSave} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Gemini API Key</label>
                        <input
                            type="password"
                            value={apiKeys.gemini}
                            onChange={(e) => setApiKeys({ ...apiKeys, gemini: e.target.value })}
                            placeholder="Enter Gemini API Key"
                            className="w-full bg-[#0c0c0c] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-green-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Groq API Key</label>
                        <input
                            type="password"
                            value={apiKeys.groq}
                            onChange={(e) => setApiKeys({ ...apiKeys, groq: e.target.value })}
                            placeholder="Enter Groq API Key"
                            className="w-full bg-[#0c0c0c] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-green-500"
                        />
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-400 hover:text-white font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                        >
                            {loading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                            Save Settings
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SettingsModal;
