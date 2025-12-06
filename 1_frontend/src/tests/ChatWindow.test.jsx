import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ChatWindow from '../components/ChatWindow';
import api from '../api';

// Mock dependencies
vi.mock('../api', () => ({
    default: {
        post: vi.fn(),
        get: vi.fn()
    }
}));

// Mock CodeBlock to avoid syntax highlighter issues
vi.mock('../components/CodeBlock', () => ({
    default: ({ code }) => <div data-testid="code-block">{code}</div>
}));

// Mock Draggable
vi.mock('react-draggable', () => ({
    default: ({ children }) => <div>{children}</div>
}));

describe('ChatWindow Component', () => {
    const mockMessages = [
        { role: 'user', content: 'Hello AI' },
        { role: 'model', content: 'Hello User' }
    ];

    const mockOnSendMessage = vi.fn();

    it('renders messages correctly', () => {
        render(<ChatWindow isOpen={true} initialMessages={mockMessages} loading={false} onSendMessage={mockOnSendMessage} />);

        expect(screen.getByText('Hello AI')).toBeInTheDocument();
        expect(screen.getByText('Hello User')).toBeInTheDocument();
    });

    it('handles input and sends message via API', async () => {
        // Mock API response
        api.post.mockResolvedValue({ data: { reply: 'AI Reply' } });

        render(<ChatWindow isOpen={true} messages={[]} loading={false} onSendMessage={mockOnSendMessage} settings={{ provider: 'gemini', geminiKey: 'test-key' }} />);

        const input = screen.getByPlaceholderText(/Ask about optimization/i);
        const button = screen.getByRole('button', { name: /Send message/i });

        fireEvent.change(input, { target: { value: 'New Message' } });
        fireEvent.click(button);

        // Verify API was called
        await waitFor(() => {
            expect(api.post).toHaveBeenCalledWith('/chat', expect.objectContaining({
                message: 'New Message'
            }));
        });
    });
});
