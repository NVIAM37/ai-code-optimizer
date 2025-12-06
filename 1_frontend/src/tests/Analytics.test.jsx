import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Analytics from '../pages/Analytics';
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

// Mock recharts to avoid rendering issues in tests
vi.mock('recharts', () => ({
    LineChart: ({ children }) => <div data-testid="line-chart">{children}</div>,
    Line: () => <div />,
    BarChart: ({ children }) => <div data-testid="bar-chart">{children}</div>,
    Bar: () => <div />,
    XAxis: () => <div />,
    YAxis: () => <div />,
    CartesianGrid: () => <div />,
    Tooltip: () => <div />,
    Legend: () => <div />,
    ResponsiveContainer: ({ children }) => <div>{children}</div>,
    PieChart: ({ children }) => <div data-testid="pie-chart">{children}</div>,
    Pie: ({ children }) => <div>{children}</div>,
    Cell: () => <div />
}));

const mockAnalyticsData = {
    totalOptimizations: 25,
    totalEnergySaved: 2500000,
    totalTimeSaved: 125000,
    averageImprovement: 38.5,
    totalRuns: 25,
    avgPerformanceGain: 38.5,
    languages: [
        { _id: 'python', count: 15, avgImprovement: 42.3 },
        { _id: 'javascript', count: 7, avgImprovement: 35.1 },
        { _id: 'rust', count: 3, avgImprovement: 28.5 }
    ],
    recentActivity: [
        {
            timestamp: new Date().toISOString(),
            performanceGain: 40.2,
            metrics: {
                original: { energy_joules: 0.15 },
                optimized: { energy_joules: 0.05 }
            }
        },
        {
            timestamp: new Date(Date.now() - 86400000).toISOString(),
            performanceGain: 38.7,
            metrics: {
                original: { energy_joules: 0.25 },
                optimized: { energy_joules: 0.10 }
            }
        }
    ]
};

const renderAnalytics = () => {
    return render(
        <BrowserRouter>
            <AuthProvider>
                <Analytics />
            </AuthProvider>
        </BrowserRouter>
    );
};

describe('Analytics Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.setItem('token', 'test-token');

        // Mock api.get to handle both /auth/me and analytics endpoints
        api.get.mockImplementation((url) => {
            console.log('MOCK CALLED:', url);
            if (url === '/auth/me') {
                return Promise.resolve({
                    data: {
                        user: { id: 'user-1', email: 'test@example.com', name: 'Test User' }
                    }
                });
            }
            if (url === '/user/statistics') {
                console.log('RETURNING STATS');
                return Promise.resolve({ data: { statistics: mockAnalyticsData } });
            }
            console.log('REJECTING:', url);
            return Promise.reject(new Error('Not found'));
        });
    });

    it('renders analytics page correctly', async () => {
        renderAnalytics();
        await waitFor(() => {
            expect(screen.getByText(/Analytics/i)).toBeInTheDocument();
        });
    });

    it('fetches analytics data on mount', async () => {
        renderAnalytics();
        await waitFor(() => {
            expect(api.get).toHaveBeenCalledWith('/user/statistics');
        });
    });



    it('renders charts when data is available', async () => {
        renderAnalytics();
        await waitFor(() => {
            const charts = screen.queryAllByTestId(/chart/i);
            expect(charts.length).toBeGreaterThan(0);
        });
    });




});
