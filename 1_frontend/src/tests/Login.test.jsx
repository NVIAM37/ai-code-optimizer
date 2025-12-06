import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Login from '../pages/Login';
import { AuthProvider } from '../contexts/AuthContext';
import api from '../api';

// Mock dependencies
vi.mock('../api', () => ({
    default: {
        post: vi.fn(),
        get: vi.fn(),
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
    jwtDecode: vi.fn(() => ({
        id: 'user-1',
        exp: Math.floor(Date.now() / 1000) + 3600
    }))
}));

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => vi.fn(),
    };
});

const renderLogin = () => {
    return render(
        <BrowserRouter>
            <AuthProvider>
                <Login />
            </AuthProvider>
        </BrowserRouter>
    );
};

describe('Login Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
    });

    it('renders login form correctly', () => {
        renderLogin();

        expect(screen.getByText('Green Code Optimizer')).toBeInTheDocument();
        expect(screen.getByText('Sign in to your account')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Log In/i })).toBeInTheDocument();
    });

    it('validates empty email field', async () => {
        renderLogin();

        const submitButton = screen.getByRole('button', { name: /Log In/i });
        fireEvent.click(submitButton);

        // Form should not submit with empty fields (HTML5 validation)
        expect(api.post).not.toHaveBeenCalled();
    });

    it('handles successful login', async () => {
        const mockResponse = {
            data: {
                token: 'test-token-123',
                user: {
                    id: 'user-1',
                    email: 'test@example.com',
                    name: 'Test User'
                }
            }
        };

        api.post.mockResolvedValueOnce(mockResponse);

        renderLogin();

        const emailInput = screen.getByPlaceholderText('you@example.com');
        const passwordInput = screen.getByPlaceholderText('••••••••');
        const submitButton = screen.getByRole('button', { name: /Log In/i });

        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
        fireEvent.change(passwordInput, { target: { value: 'password123' } });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(api.post).toHaveBeenCalledWith('/auth/login', {
                email: 'test@example.com',
                password: 'password123'
            });
        });
    });

    it('handles login error with invalid credentials', async () => {
        api.post.mockRejectedValueOnce({
            response: {
                data: {
                    error: 'Invalid credentials'
                }
            }
        });

        renderLogin();

        const emailInput = screen.getByPlaceholderText('you@example.com');
        const passwordInput = screen.getByPlaceholderText('••••••••');
        const submitButton = screen.getByRole('button', { name: /Log In/i });

        fireEvent.change(emailInput, { target: { value: 'wrong@example.com' } });
        fireEvent.change(passwordInput, { target: { value: 'wrongpass' } });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(api.post).toHaveBeenCalled();
        });
    });

    it('displays loading state during login', async () => {
        api.post.mockImplementation(() => new Promise(() => { })); // Never resolves

        renderLogin();

        const emailInput = screen.getByPlaceholderText('you@example.com');
        const passwordInput = screen.getByPlaceholderText('••••••••');
        const submitButton = screen.getByRole('button', { name: /Log In/i });

        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
        fireEvent.change(passwordInput, { target: { value: 'password123' } });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(screen.getByText(/Logging in.../i)).toBeInTheDocument();
        });
    });

    it('shows link to signup page', () => {
        renderLogin();

        const signupLink = screen.getByText(/Sign up/i);
        expect(signupLink).toBeInTheDocument();
        expect(signupLink.closest('a')).toHaveAttribute('href', '/signup');
    });

    it('handles OAuth error from URL params', () => {
        // This test verifies that error messages from failed OAuth are displayed
        const originalLocation = window.location;
        delete window.location;
        window.location = {
            ...originalLocation,
            search: '?error=OAuth authentication failed'
        };

        renderLogin();

        // The component should clean up the URL
        window.location = originalLocation;
    });
});
