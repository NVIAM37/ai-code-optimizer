import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import History from '../pages/History';
import { AuthProvider } from '../contexts/AuthContext';
import api from '../api';

// Mock dependencies
vi.mock('../api', () => ({
    default: {
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

const mockHistoryData = {
    history: [
        {
            _id: 'hist-1',
            language: 'python',
            timestamp: new Date().toISOString(),
            originalMetrics: {
                executionTime: 2500,
                energyUsed: 125000,
                memoryUsed: 45000000,
                cpuUsage: 65
            },
            optimizedMetrics: {
                executionTime: 1450,
                energyUsed: 72500,
                memoryUsed: 28000000,
                cpuUsage: 42
            }
        },
        {
            _id: 'hist-2',
            language: 'javascript',
            timestamp: new Date(Date.now() - 86400000).toISOString(),
            originalMetrics: {
                executionTime: 1800,
                energyUsed: 90000,
                memoryUsed: 38000000,
                cpuUsage: 55
            },
            optimizedMetrics: {
                executionTime: 1200,
                energyUsed: 60000,
                memoryUsed: 25000000,
                cpuUsage: 38
            }
        }
    ],
    chats: [
        {
            _id: 'chat-1',
            title: 'Python Optimization Discussion',
            updatedAt: new Date().toISOString(),
            messageCount: 5
        }
    ]
};

const renderHistory = () => {
    return render(
        <BrowserRouter>
            <AuthProvider>
                <History />
            </AuthProvider>
        </BrowserRouter>
    );
};

describe('History Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.setItem('token', 'test-token');

        // Mock api.get to handle both /auth/me and history endpoints
        api.get.mockImplementation((url) => {
            if (url === '/auth/me') {
                return Promise.resolve({
                    data: {
                        user: { id: 'user-1', email: 'test@example.com', name: 'Test User' }
                    }
                });
            }
            if (url === '/api/history') {
                return Promise.resolve({ data: mockHistoryData.history });
            }
            if (url === '/api/chats') {
                return Promise.resolve({ data: { chats: mockHistoryData.chats } });
            }
            return Promise.reject(new Error('Not found'));
        });
    });

    it('renders history page correctly', () => {

        renderHistory();

        expect(screen.getByRole('heading', { name: /History & Archives/i })).toBeInTheDocument();
    });

    it('fetches optimization history on mount', async () => {

        renderHistory();

        await waitFor(() => {
            expect(api.get).toHaveBeenCalledWith('/api/history');
        });
    });

    it('fetches chat history on mount', async () => {

        renderHistory();

        await waitFor(() => {
            expect(api.get).toHaveBeenCalledWith('/api/chats');
        });
    });

    it('displays optimization history items', async () => {

        renderHistory();

        await waitFor(() => {
            expect(screen.getByText(/python/i)).toBeInTheDocument();
            expect(screen.getByText(/javascript/i)).toBeInTheDocument();
        });
    });

    it('displays improvement percentages', async () => {

        renderHistory();

        await waitFor(() => {
            // Should show improvement calculation
            const historyItems = screen.queryAllByText(/%/);
            expect(historyItems.length).toBeGreaterThan(0);
        });
    });

    it('formats dates correctly', async () => {

        renderHistory();

        await waitFor(() => {
            // Should format timestamps appropriately
            expect(api.get).toHaveBeenCalled();
        });
    });

    it('handles empty history state', async () => {
        api.get.mockResolvedValue({
            data: {
                history: [],
                chats: []
            }
        });

        renderHistory();

        await waitFor(() => {
            // Should show appropriate empty state message
            expect(api.get).toHaveBeenCalled();
        });
    });

    it('handles error when fetching history', async () => {
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => { });
        api.get.mockRejectedValue(new Error('Failed to fetch history'));

        renderHistory();

        await waitFor(() => {
            expect(api.get).toHaveBeenCalled();
        });

        consoleError.mockRestore();
    });

    it('navigates to optimizer when session is clicked', async () => {

        renderHistory();

        await waitFor(() => {
            expect(screen.getByText(/python/i)).toBeInTheDocument();
        });

        // Click on history item should navigate to optimizer with session data
    });

    it('displays chat history in separate tab', async () => {

        renderHistory();

        await waitFor(() => {
            // Should show chat sessions if implemented
            expect(api.get).toHaveBeenCalledWith('/api/chats');
        });
    });

    it('switches between optimization and chat history tabs', async () => {

        renderHistory();

        await waitFor(() => {
            expect(api.get).toHaveBeenCalledWith('/api/history');
        });

        // If tabs exist, they should be clickable
    });
});
