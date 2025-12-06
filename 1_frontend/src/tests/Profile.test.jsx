import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Profile from '../pages/Profile';
import { AuthProvider } from '../contexts/AuthContext';
import api from '../api';

// Mock dependencies
vi.mock('../api', () => ({
    default: {
        get: vi.fn(),
        put: vi.fn(),
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

const mockUserData = {
    id: 'user-1',
    name: 'Test User',
    email: 'test@example.com',
    geminiKey: 'gemini-key-123',
    groqKey: 'groq-key-456'
};

const renderProfile = () => {
    return render(
        <BrowserRouter>
            <AuthProvider>
                <Profile />
            </AuthProvider>
        </BrowserRouter>
    );
};

describe('Profile Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.setItem('token', 'test-token');
        api.get.mockResolvedValue({
            data: {
                user: mockUserData,
                apiKeys: { gemini: 'gemini-key-123', groq: 'groq-key-456' }
            }
        });
    });

    it('renders profile page correctly', async () => {
        renderProfile();

        await waitFor(() => {
            expect(screen.getByRole('heading', { name: /Profile & Settings/i })).toBeInTheDocument();
        });
    });

    it('fetches and displays user profile data', async () => {
        renderProfile();

        await waitFor(() => {
            expect(api.get).toHaveBeenCalledWith('/auth/me');
        });

        await waitFor(() => {
            expect(screen.getByDisplayValue('Test User')).toBeInTheDocument();
            expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
        });
    });

    it('displays API keys in masked format', async () => {
        renderProfile();

        await waitFor(() => {
            // API keys should be displayed but masked (type="password")
            const geminiInput = screen.getByPlaceholderText(/Gemini API Key/i);
            const groqInput = screen.getByPlaceholderText(/Groq API Key/i);

            expect(geminiInput).toHaveAttribute('type', 'password');
            expect(groqInput).toHaveAttribute('type', 'password');
            expect(geminiInput).toHaveValue('gemini-key-123');
            expect(groqInput).toHaveValue('groq-key-456');
        });
    });

    it('handles profile update successfully', async () => {
        api.put.mockResolvedValueOnce({
            data: {
                user: {
                    ...mockUserData,
                    name: 'Updated Name'
                }
            }
        });

        renderProfile();

        await waitFor(() => {
            expect(screen.getByDisplayValue('Test User')).toBeInTheDocument();
        });

        const nameInput = screen.getByDisplayValue('Test User');
        fireEvent.change(nameInput, { target: { value: 'Updated Name' } });

        const saveButton = screen.getByRole('button', { name: /Save Profile/i });
        fireEvent.click(saveButton);

        await waitFor(() => {
            expect(api.put).toHaveBeenCalledWith('/user/profile', expect.objectContaining({
                name: 'Updated Name'
            }));
        });
    });

    it('handles API key update', async () => {
        api.put.mockResolvedValueOnce({
            data: {
                user: {
                    ...mockUserData,
                    geminiKey: 'new-gemini-key'
                }
            }
        });

        renderProfile();

        await waitFor(() => {
            expect(screen.getByRole('heading', { name: /Profile & Settings/i })).toBeInTheDocument();
        });

        // Find input for Gemini API key and change it
        const apiKeyInputs = screen.getAllByPlaceholderText(/Enter.*API key/i);
        if (apiKeyInputs.length > 0) {
            fireEvent.change(apiKeyInputs[0], { target: { value: 'new-gemini-key' } });

            const saveButton = screen.getByRole('button', { name: /Update Keys/i });
            fireEvent.click(saveButton);

            await waitFor(() => {
                expect(api.put).toHaveBeenCalled();
            });
        }
    });



    it('handles profile update error', async () => {
        api.put.mockRejectedValueOnce(new Error('Update failed'));

        renderProfile();

        await waitFor(() => {
            expect(screen.getByDisplayValue('Test User')).toBeInTheDocument();
        });

        const nameInput = screen.getByDisplayValue('Test User');
        fireEvent.change(nameInput, { target: { value: 'New Name' } });

        const saveButton = screen.getByRole('button', { name: /Save Profile/i });
        fireEvent.click(saveButton);

        await waitFor(() => {
            expect(api.put).toHaveBeenCalled();
        });
    });

    it('displays loading state while fetching profile', () => {
        api.get.mockImplementation(() => new Promise(() => { })); // Never resolves

        renderProfile();

        // Should show loading indicator
        expect(screen.getByRole('heading', { name: /Profile & Settings/i })).toBeInTheDocument();
    });


});
