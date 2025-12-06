import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Dashboard from '../pages/Dashboard';
import { AuthProvider } from '../contexts/AuthContext';
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
    jwtDecode: vi.fn(() => ({
        id: 'user-1',
        exp: Math.floor(Date.now() / 1000) + 3600
    }))
}));

const mockDashboardData = {
    stats: {
        totalRuns: 15,
        avgPerformanceGain: 35.5,
        totalEnergySaved: 1.25,
        totalTimeSaved: 45000
    },
    recentOptimizations: [
        {
            _id: 'opt-1',
            language: 'python',
            timestamp: new Date().toISOString(),
            type: 'optimization',
            model: 'gemini-pro',
            performanceGain: 42.3
        },
        {
            _id: 'opt-2',
            language: 'javascript',
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            type: 'optimization',
            model: 'groq',
            performanceGain: 28.7
        }
    ]
};

const renderDashboard = () => {
    return render(
        <BrowserRouter>
            <AuthProvider>
                <Dashboard />
            </AuthProvider>
        </BrowserRouter>
    );
};

describe('Dashboard Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.setItem('token', 'test-token');

        // Mock api.get to handle /auth/me and dashboard endpoints
        api.get.mockImplementation((url) => {
            if (url === '/auth/me') {
                return Promise.resolve({
                    data: {
                        user: { id: 'user-1', email: 'test@example.com', name: 'Test User' }
                    }
                });
            }
            if (url === '/user/statistics') {
                return Promise.resolve({ data: { statistics: mockDashboardData.stats } });
            }
            if (url.startsWith('/api/recent-activity')) {
                return Promise.resolve({ data: { activity: mockDashboardData.recentOptimizations } });
            }
            return Promise.reject(new Error('Not found'));
        });
    });

    it('renders dashboard layout correctly', async () => {
        renderDashboard();

        await waitFor(() => {
            expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
        });
    });

    it('fetches and displays dashboard statistics', async () => {
        renderDashboard();

        await waitFor(() => {
            expect(api.get).toHaveBeenCalledWith('/user/statistics');
        });

        await waitFor(() => {
            expect(screen.getByText('15')).toBeInTheDocument(); // Total runs
        });
    });

    it('displays recent optimizations list', async () => {
        renderDashboard();

        await waitFor(() => {
            expect(screen.getByText(/Optimized python code/i)).toBeInTheDocument();
        });
    });

    it('handles loading state', () => {
        api.get.mockImplementation(() => new Promise(() => { })); // Never resolves

        renderDashboard();

        // Should show loading spinner
        expect(screen.getByTestId('dashboard-loader')).toBeInTheDocument();
    });

    it('handles error when fetching dashboard data', async () => {
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => { });
        api.get.mockImplementation((url) => {
            if (url === '/auth/me') {
                return Promise.resolve({
                    data: {
                        user: { id: 'user-1', email: 'test@example.com', name: 'Test User' }
                    }
                });
            }
            return Promise.reject(new Error('Failed to fetch dashboard data'));
        });

        renderDashboard();

        await waitFor(() => {
            expect(api.get).toHaveBeenCalled();
        });

        consoleError.mockRestore();
    });
});
