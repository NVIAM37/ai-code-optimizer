import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../api';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    // Check if token is valid
    const isTokenValid = (token) => {
        if (!token) {
            console.log('[AuthContext] Token validation: No token provided');
            return false;
        }
        try {
            const decoded = jwtDecode(token);
            const isValid = decoded.exp * 1000 > Date.now();
            console.log('[AuthContext] Token validation:', {
                isValid,
                expiresAt: new Date(decoded.exp * 1000).toISOString(),
                userId: decoded.id
            });
            return isValid;
        } catch (error) {
            console.error('[AuthContext] Token validation failed:', error.message);
            return false;
        }
    };

    // Load user from token on mount
    useEffect(() => {
        const loadUser = async () => {
            console.log('[AuthContext] Loading user from stored token...');
            const storedToken = localStorage.getItem('token');

            if (storedToken && isTokenValid(storedToken)) {
                try {
                    console.log('[AuthContext] Valid token found, fetching user data...');
                    api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
                    const res = await api.get('/auth/me');
                    setUser(res.data.user);
                    setToken(storedToken);
                    console.log('[AuthContext] User loaded successfully:', res.data.user.email);
                } catch (error) {
                    console.error('[AuthContext] Failed to load user:', {
                        message: error.message,
                        status: error.response?.status,
                        data: error.response?.data
                    });
                    localStorage.removeItem('token');
                    delete api.defaults.headers.common['Authorization'];
                }
            } else {
                console.log('[AuthContext] No valid token found in localStorage');
                if (storedToken) localStorage.removeItem('token');
            }
            setLoading(false);
            console.log('[AuthContext] Auth initialization complete');
        };

        loadUser();
    }, []);

    // Login function
    const login = async (email, password) => {
        console.log('[AuthContext] Login attempt for:', email);
        try {
            const res = await api.post('/auth/login', { email, password });
            const { token: newToken, user: newUser } = res.data;

            console.log('[AuthContext] Login successful:', { userId: newUser.id, email: newUser.email });
            localStorage.setItem('token', newToken);
            api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
            setToken(newToken);
            setUser(newUser);
            console.log('[AuthContext] User state updated and token stored');

            return res.data;
        } catch (error) {
            console.error('[AuthContext] Login failed:', {
                message: error.message,
                status: error.response?.status,
                error: error.response?.data?.error
            });
            throw error; // Re-throw to allow component to handle
        }
    };

    // Signup function
    const signup = async (email, password, name) => {
        console.log('[AuthContext] Signup attempt for:', email);
        try {
            const res = await api.post('/auth/signup', { email, password, name });
            const { token: newToken, user: newUser } = res.data;

            console.log('[AuthContext] Signup successful:', { userId: newUser.id, email: newUser.email });
            localStorage.setItem('token', newToken);
            api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
            setToken(newToken);
            setUser(newUser);
            console.log('[AuthContext] New user state updated and token stored');

            return res.data;
        } catch (error) {
            console.error('[AuthContext] Signup failed:', {
                message: error.message,
                status: error.response?.status,
                error: error.response?.data?.error
            });
            throw error; // Re-throw to allow component to handle
        }
    };

    // Logout function
    const logout = () => {
        console.log('[AuthContext] Logging out user:', user?.email);
        localStorage.removeItem('token');
        delete api.defaults.headers.common['Authorization'];
        setToken(null);
        setUser(null);
        console.log('[AuthContext] Logout complete, user state cleared');
    };

    // Login with token (for OAuth)
    const loginWithToken = async (newToken) => {
        console.log('[AuthContext] OAuth login with token...');
        localStorage.setItem('token', newToken);
        api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        setToken(newToken);

        try {
            const res = await api.get('/auth/me');
            setUser(res.data.user);
            console.log('[AuthContext] OAuth login successful:', res.data.user.email);
            return true;
        } catch (error) {
            console.error('[AuthContext] OAuth login failed to fetch user:', {
                message: error.message,
                status: error.response?.status
            });
            logout();
            return false;
        }
    };

    // Update user data locally
    const updateUser = (userData) => {
        console.log('[AuthContext] Updating user data:', Object.keys(userData));
        setUser(prev => ({ ...prev, ...userData }));
        console.log('[AuthContext] User data updated successfully');
    };

    const value = {
        user,
        token,
        loading,
        isAuthenticated: !!user,
        login,
        signup,
        logout,
        updateUser,
        loginWithToken
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

// Hook to use auth context
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export default AuthContext;
