import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LayoutDashboard, Zap, History, BarChart2, User, LogOut, Cpu } from 'lucide-react';

const AppLayout = () => {
    const { logout, user } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navItems = [
        { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/optimizer', icon: Zap, label: 'Optimizer' },
        { path: '/history', icon: History, label: 'History' },
        { path: '/analytics', icon: BarChart2, label: 'Analytics' },
    ];

    return (
        <div className="flex h-screen w-screen bg-[#0c0c0c] text-white font-sans overflow-hidden">
            {/* Navigation Sidebar */}
            <div className="w-16 flex flex-col items-center py-4 bg-[#181818] border-r border-gray-800 z-50">
                {/* Logo */}
                <div className="mb-8 text-green-500">
                    <Cpu size={28} />
                </div>

                {/* Nav Items */}
                <div className="flex-1 flex flex-col gap-4 w-full px-2">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`p-3 rounded-xl flex justify-center transition-all duration-200 group relative ${isActive
                                        ? 'bg-green-500/10 text-green-500'
                                        : 'text-gray-400 hover:bg-[#2a2a2a] hover:text-white'
                                    }`}
                                title={item.label}
                            >
                                <item.icon size={20} />
                                {/* Tooltip */}
                                <span className="absolute left-14 bg-[#2a2a2a] text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-gray-700 z-50">
                                    {item.label}
                                </span>
                            </Link>
                        );
                    })}
                </div>

                {/* Bottom Actions */}
                <div className="flex flex-col gap-4 w-full px-2 mt-auto">
                    <Link
                        to="/profile"
                        className={`p-3 rounded-xl flex justify-center transition-all duration-200 group relative ${location.pathname === '/profile'
                                ? 'bg-green-500/10 text-green-500'
                                : 'text-gray-400 hover:bg-[#2a2a2a] hover:text-white'
                            }`}
                        title="Profile"
                    >
                        <User size={20} />
                    </Link>
                    <button
                        onClick={handleLogout}
                        className="p-3 rounded-xl flex justify-center text-gray-400 hover:bg-red-500/10 hover:text-red-500 transition-all duration-200"
                        title="Logout"
                    >
                        <LogOut size={20} />
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-hidden relative">
                <Outlet />
            </div>
        </div>
    );
};

export default AppLayout;
