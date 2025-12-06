import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import api from '../api';

// Mock dependencies
vi.mock('../api', () => ({
    default: {
        get: vi.fn(),
        post: vi.fn(),
        defaults: {
            headers: {
                common: {}
            }
        },
        interceptors: {
            request: { use: vi.fn() },
            response: { use: vi.fn() }
        }
    }
}));

vi.mock('jwt-decode', () => ({
    jwtDecode: vi.fn((token) => {
        if (token === 'valid-token') {
            return { id: 'user-1', exp: Math.floor(Date.now() / 1000) + 3600 }; // Expires in 1 hour
        }
        if (token === 'expired-token') {
            return { id: 'user-1', exp: Math.floor(Date.now() / 1000) - 3600 }; // Expired 1 hour ago
        }
        if (token === 'oauth-token-123') {
            return { id: 'user-1', exp: Math.floor(Date.now() / 1000) + 3600 };
        }
        if (token === 'new-token-123') {
            return { id: 'user-1', exp: Math.floor(Date.now() / 1000) + 3600 };
        }
        if (token === 'signup-token-123') {
            return { id: 'user-2', exp: Math.floor(Date.now() / 1000) + 3600 };
        }
        throw new Error('Invalid token');
    })
}));

describe('AuthContext', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
    });

    it('provides auth context to children', () => {
        const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;
        const { result } = renderHook(() => useAuth(), { wrapper });

        expect(result.current).toHaveProperty('user');
        expect(result.current).toHaveProperty('token');
        expect(result.current).toHaveProperty('login');
        expect(result.current).toHaveProperty('signup');
        expect(result.current).toHaveProperty('logout');
        expect(result.current).toHaveProperty('isAuthenticated');
    });

    it('throws error when useAuth is used outside AuthProvider', () => {
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => { });

        expect(() => {
            renderHook(() => useAuth());
        }).toThrow('useAuth must be used within AuthProvider');

        consoleError.mockRestore();
    });

    it('loads user from valid stored token on mount', async () => {
        localStorage.setItem('token', 'valid-token');
        api.get.mockResolvedValue({
            data: {
                user: {
                    id: 'user-1',
                    email: 'test@example.com',
                    name: 'Test User'
                }
            }
        });

        const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;
        const { result } = renderHook(() => useAuth(), { wrapper });

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(api.get).toHaveBeenCalledWith('/auth/me');
        expect(result.current.user).toEqual({
            id: 'user-1',
            email: 'test@example.com',
            name: 'Test User'
        });
        expect(result.current.isAuthenticated).toBe(true);
    });

    it('removes invalid token on mount', async () => {
        localStorage.setItem('token', 'expired-token');

        const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;
        const { result } = renderHook(() => useAuth(), { wrapper });

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(localStorage.getItem('token')).toBeNull();
        expect(result.current.user).toBeNull();
        expect(result.current.isAuthenticated).toBe(false);
    });

    it('handles login successfully', async () => {
        const mockLoginResponse = {
            data: {
                token: 'new-token-123',
                user: {
                    id: 'user-1',
                    email: 'test@example.com',
                    name: 'Test User'
                }
            }
        };

        api.post.mockResolvedValue(mockLoginResponse);

        const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;
        const { result } = renderHook(() => useAuth(), { wrapper });

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        await act(async () => {
            await result.current.login('test@example.com', 'password123');
        });

        expect(api.post).toHaveBeenCalledWith('/auth/login', {
            email: 'test@example.com',
            password: 'password123'
        });

        expect(localStorage.getItem('token')).toBe('new-token-123');
        expect(result.current.user).toEqual(mockLoginResponse.data.user);
        expect(result.current.token).toBe('new-token-123');
        expect(result.current.isAuthenticated).toBe(true);
    });

    it('handles signup successfully', async () => {
        const mockSignupResponse = {
            data: {
                token: 'signup-token-123',
                user: {
                    id: 'user-2',
                    email: 'newuser@example.com',
                    name: 'New User'
                }
            }
        };

        api.post.mockResolvedValue(mockSignupResponse);

        const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;
        const { result } = renderHook(() => useAuth(), { wrapper });

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        await act(async () => {
            await result.current.signup('newuser@example.com', 'password123', 'New User');
        });

        expect(api.post).toHaveBeenCalledWith('/auth/signup', {
            email: 'newuser@example.com',
            password: 'password123',
            name: 'New User'
        });

        expect(localStorage.getItem('token')).toBe('signup-token-123');
        expect(result.current.user).toEqual(mockSignupResponse.data.user);
        expect(result.current.isAuthenticated).toBe(true);
    });

    it('handles logout correctly', async () => {
        localStorage.setItem('token', 'test-token');
        api.get.mockResolvedValue({
            data: {
                user: { id: 'user-1', email: 'test@example.com', name: 'Test User' }
            }
        });

        const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;
        const { result } = renderHook(() => useAuth(), { wrapper });

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        act(() => {
            result.current.logout();
        });

        expect(localStorage.getItem('token')).toBeNull();
        expect(result.current.user).toBeNull();
        expect(result.current.token).toBeNull();
        expect(result.current.isAuthenticated).toBe(false);
    });

    it('handles loginWithToken for OAuth', async () => {
        api.get.mockResolvedValue({
            data: {
                user: { id: 'user-1', email: 'oauth@example.com', name: 'OAuth User' }
            }
        });

        const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;
        const { result } = renderHook(() => useAuth(), { wrapper });

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        let success;
        await act(async () => {
            success = await result.current.loginWithToken('oauth-token-123');
        });

        expect(success).toBe(true);
        expect(localStorage.getItem('token')).toBe('oauth-token-123');
        expect(result.current.user).toEqual({
            id: 'user-1',
            email: 'oauth@example.com',
            name: 'OAuth User'
        });
    });

    it('handles failed loginWithToken', async () => {
        api.get.mockRejectedValue(new Error('Invalid token'));

        const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;
        const { result } = renderHook(() => useAuth(), { wrapper });

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        let success;
        await act(async () => {
            success = await result.current.loginWithToken('invalid-token');
        });

        expect(success).toBe(false);
        expect(localStorage.getItem('token')).toBeNull();
        expect(result.current.user).toBeNull();
    });

    it('updates user data locally', async () => {
        console.error('DEBUG: Starting updates user data locally test');
        localStorage.setItem('token', 'valid-token');
        api.get.mockResolvedValue({
            data: {
                user: { id: 'user-1', email: 'test@example.com', name: 'Test User' }
            }
        });

        const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;
        const { result } = renderHook(() => useAuth(), { wrapper });

        await waitFor(() => {
            console.error('DEBUG: Waiting for user...', result.current.user);
            expect(result.current.user).toBeTruthy();
        });

        act(() => {
            result.current.updateUser({ name: 'Updated Name' });
        });

        expect(result.current.user.name).toBe('Updated Name');
        expect(result.current.user.email).toBe('test@example.com'); // Other fields preserved
    });
});
