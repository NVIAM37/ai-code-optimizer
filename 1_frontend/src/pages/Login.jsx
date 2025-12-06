import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import GoogleOAuthButton from '../components/GoogleOAuthButton';
import { toast } from 'sonner';
import { Cpu, Mail, Lock, Loader2 } from 'lucide-react';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!email || !password) {
            toast.error('Please fill in all fields');
            return;
        }

        setLoading(true);
        try {
            await login(email, password);
            toast.success('Logged in successfully!');
            navigate('/');
        } catch (error) {
            console.error('Login error:', error);
            const errorMsg = error.response?.data?.error || 'Login failed. Please check your credentials.';
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    // Check for error in URL (e.g. from OAuth failure)
    React.useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const error = params.get('error');
        if (error) {
            toast.error(error);
            // Clean up URL
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, []);

    return (
        <div className="min-h-screen bg-[#16161c] flex items-center justify-center p-4 relative overflow-hidden">
            {/* Animated Background Elements */}
            <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-green-500/5 rounded-full blur-[120px] animate-pulse pointer-events-none"></div>
            <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-blue-500/5 rounded-full blur-[120px] animate-pulse delay-1000 pointer-events-none"></div>

            <div className="max-w-md w-full relative z-10 animate-fade-in-up">
                {/* Logo/Header */}
                <div className="text-center mb-10">
                    <div className="flex items-center justify-center gap-3 mb-4 animate-float">
                        <div className="p-4 rounded-2xl neu-flat border border-[#ffffff05]">
                            <Cpu className="text-[#00ff9d] drop-shadow-[0_0_10px_rgba(0,255,157,0.5)]" size={48} />
                        </div>
                    </div>
                    <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">Green Code Optimizer</h1>
                    <p className="text-gray-400 font-medium">Sign in to your account</p>
                </div>

                {/* Login Form */}
                <div className="neu-flat p-8 backdrop-blur-sm bg-opacity-90">
                    <div className="mb-8">
                        <GoogleOAuthButton text="Sign in with Google" />
                        <div className="relative my-8">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-[#ffffff10]"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-4 bg-[#1e1e24] text-gray-500 font-medium rounded-full border border-[#ffffff05]">Or continue with</span>
                            </div>
                        </div>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Email */}
                        <div>
                            <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider ml-1">
                                Email
                            </label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="neu-input w-full !pl-12 pr-4 py-3.5 text-white focus:outline-none"
                                    placeholder="you@example.com"
                                    required
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider ml-1">
                                Password
                            </label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="neu-input w-full !pl-12 pr-4 py-3.5 text-white focus:outline-none"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full neu-button-primary py-3.5 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 mt-4"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="animate-spin" size={20} />
                                    Logging in...
                                </>
                            ) : (
                                'Log In'
                            )}
                        </button>
                    </form>

                    {/* Signup Link */}
                    <div className="mt-8 text-center">
                        <p className="text-gray-400 text-sm">
                            Don't have an account?{' '}
                            <Link to="/signup" className="text-[#00ff9d] hover:text-[#00cc7d] font-bold transition-colors hover:underline decoration-2 underline-offset-4">
                                Sign up
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
