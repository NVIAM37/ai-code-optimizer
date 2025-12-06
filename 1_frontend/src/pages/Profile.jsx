import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../api';
import { toast } from 'sonner';
import { User, Key, Trash2, Save, Loader2, AlertTriangle, Shield, Mail } from 'lucide-react';

const Profile = () => {
    const { user, updateUser, logout } = useAuth();
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState(user?.name || '');
    const [apiKeys, setApiKeys] = useState({ gemini: '', groq: '' });
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');

    useEffect(() => {
        if (user) setName(user.name);
        // Fetch API keys (masked or empty if not set)
        const fetchKeys = async () => {
            try {
                const res = await api.get('/user/api-keys');
                setApiKeys(res.data.apiKeys || { gemini: '', groq: '' });
            } catch (err) {
                console.error('Failed to fetch API keys:', err);
            }
        };
        fetchKeys();
    }, [user]);

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.put('/user/profile', { name });
            updateUser(res.data.user);
            toast.success('Profile updated successfully');
        } catch (err) {
            toast.error('Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateKeys = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.put('/user/api-keys', apiKeys);
            toast.success('API keys updated successfully');
        } catch (err) {
            toast.error('Failed to update API keys');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (deleteConfirmText !== 'DELETE') return;

        setLoading(true);
        try {
            await api.delete('/user/data', { data: { confirm: 'DELETE' } });
            toast.success('Account deleted successfully');
            logout();
        } catch (err) {
            toast.error('Failed to delete account');
            setLoading(false);
        }
    };

    return (
        <div className="h-full w-full overflow-y-auto p-8 bg-[#16161c]">
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="animate-fade-in-up">
                    <h1 className="text-4xl font-bold text-white mb-2 tracking-tight drop-shadow-lg">Profile & Settings</h1>
                    <p className="text-gray-400 font-medium">Manage your account preferences and API configurations</p>
                </div>

                {/* Profile Info */}
                <div className="neu-flat p-8 rounded-2xl border border-[#ffffff05] animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                    <div className="flex items-center gap-4 mb-8 border-b border-[#ffffff05] pb-4">
                        <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 shadow-inner">
                            <User size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Personal Information</h2>
                            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Update your details</p>
                        </div>
                    </div>
                    <form onSubmit={handleUpdateProfile} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                    <input
                                        type="email"
                                        value={user?.email || ''}
                                        disabled
                                        className="neu-input !pl-11 w-full opacity-60 cursor-not-allowed"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Display Name</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="neu-input !pl-11 w-full focus:ring-1 focus:ring-blue-500/50"
                                        placeholder="Enter your name"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="neu-button-primary px-6 py-2.5 rounded-xl flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                                Save Profile
                            </button>
                        </div>
                    </form>
                </div>

                {/* API Keys */}
                <div className="neu-flat p-8 rounded-2xl border border-[#ffffff05] animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                    <div className="flex items-center gap-4 mb-8 border-b border-[#ffffff05] pb-4">
                        <div className="p-3 rounded-xl bg-yellow-500/10 text-yellow-400 shadow-inner">
                            <Key size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">API Configuration</h2>
                            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Manage your AI provider keys</p>
                        </div>
                    </div>

                    <div className="bg-[#1e1e24] border border-yellow-500/10 rounded-xl p-4 mb-6 flex gap-3 items-start">
                        <Shield className="text-yellow-500 shrink-0 mt-0.5" size={18} />
                        <p className="text-sm text-gray-400 leading-relaxed">
                            Your API keys are stored securely using AES-256 encryption. They are never shared and are only used to communicate with the AI providers for code optimization.
                        </p>
                    </div>

                    <form onSubmit={handleUpdateKeys} className="space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Gemini API Key</label>
                                <input
                                    type="password"
                                    value={apiKeys.gemini}
                                    onChange={(e) => setApiKeys({ ...apiKeys, gemini: e.target.value })}
                                    placeholder="Enter your Gemini API Key"
                                    className="neu-input w-full focus:ring-1 focus:ring-yellow-500/50"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Groq API Key</label>
                                <input
                                    type="password"
                                    value={apiKeys.groq}
                                    onChange={(e) => setApiKeys({ ...apiKeys, groq: e.target.value })}
                                    placeholder="Enter your Groq API Key"
                                    className="neu-input w-full focus:ring-1 focus:ring-yellow-500/50"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="neu-button px-6 py-2.5 rounded-xl flex items-center gap-2 hover:text-yellow-400 transition-colors disabled:opacity-50"
                            >
                                {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                                Update Keys
                            </button>
                        </div>
                    </form>
                </div>

                {/* Danger Zone */}
                <div className="neu-flat p-8 rounded-2xl border border-red-500/20 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 rounded-xl bg-red-500/10 text-red-500 shadow-inner">
                            <AlertTriangle size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Danger Zone</h2>
                            <p className="text-xs text-red-400/70 font-medium uppercase tracking-wider">Irreversible actions</p>
                        </div>
                    </div>

                    {!showDeleteConfirm ? (
                        <div className="flex items-center justify-between bg-[#1e1e24] p-4 rounded-xl border border-[#ffffff05]">
                            <div>
                                <h3 className="text-white font-bold text-sm">Delete Account</h3>
                                <p className="text-gray-500 text-xs mt-1">Permanently delete your account and all associated data.</p>
                            </div>
                            <button
                                onClick={() => setShowDeleteConfirm(true)}
                                className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 px-4 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2"
                            >
                                <Trash2 size={16} />
                                Delete Account
                            </button>
                        </div>
                    ) : (
                        <div className="bg-red-500/5 p-6 rounded-xl border border-red-500/20 animate-in fade-in zoom-in-95 duration-200">
                            <p className="text-red-400 font-bold mb-2 flex items-center gap-2">
                                <AlertTriangle size={16} />
                                Are you absolutely sure?
                            </p>
                            <p className="text-gray-400 text-sm mb-4">This action cannot be undone. Please type <strong className="text-white">DELETE</strong> to confirm.</p>
                            <div className="flex gap-4">
                                <input
                                    type="text"
                                    value={deleteConfirmText}
                                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                                    className="bg-[#0c0c0c] border border-red-900/50 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-red-500 w-full"
                                    placeholder="Type DELETE"
                                />
                                <button
                                    onClick={handleDeleteAccount}
                                    disabled={deleteConfirmText !== 'DELETE' || loading}
                                    className="bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-bold transition-all shadow-lg shadow-red-900/20 whitespace-nowrap"
                                >
                                    Confirm Delete
                                </button>
                                <button
                                    onClick={() => {
                                        setShowDeleteConfirm(false);
                                        setDeleteConfirmText('');
                                    }}
                                    className="text-gray-400 hover:text-white px-4 py-2 font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Profile;
