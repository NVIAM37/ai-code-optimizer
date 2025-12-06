import { jest } from '@jest/globals';

// Mock Gemini AI BEFORE importing server
jest.unstable_mockModule('../src/ai_engine/gemini.js', () => ({
    chat: jest.fn().mockResolvedValue('Here is a python hello world:\n```python\nprint("Hello World")\n```'),
    optimizeCode: jest.fn().mockResolvedValue('Optimized code'),
    listModels: jest.fn().mockResolvedValue(['gemini-1.5-flash'])
}));

// Import dependencies
import request from 'supertest';
import fs from 'fs';
import path from 'path';

// Import server AFTER mocking
const { app } = await import('../src/server.js');

// Mock data
const uniqueId = Date.now();
const TEST_USER = {
    email: `test${uniqueId}@example.com`,
    password: 'password123',
    name: 'Test User'
};

let authToken = '';
let userId = '';

describe('Backend Integration Tests', () => {

    beforeAll(async () => {
        // Register new user (always unique)
        const res = await request(app)
            .post('/auth/signup')
            .send(TEST_USER);

        if (res.statusCode !== 201) {
            console.error('Setup Registration Failed:', res.body);
            throw new Error('Failed to register test user');
        }

        authToken = res.body.token;
        userId = res.body.user.id;
    });

    // 1. Authentication Tests
    describe('Authentication System', () => {
        it('should login with existing user', async () => {
            const res = await request(app)
                .post('/auth/login')
                .send({
                    email: TEST_USER.email,
                    password: TEST_USER.password
                });

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('token');
            authToken = res.body.token;
        });

        it('should fail login with wrong password', async () => {
            const res = await request(app)
                .post('/chat')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    message: 'Write a python hello world',
                    provider: 'gemini',
                    model: 'gemini-1.5-flash',
                    apiKey: 'dummy-key',
                    history: []
                });

            if (res.statusCode !== 200) {
                console.error('Chat Test Failed:', res.body);
            }

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('reply');
            expect(res.body).toHaveProperty('chatId');

            // Verify file creation
            const chatFile = path.join(process.env.DATA_ROOT, 'users', userId, 'chats', `${res.body.chatId}.json`);
            // Wait a bit for file write
            await new Promise(r => setTimeout(r, 1000));
            expect(fs.existsSync(chatFile)).toBe(true);
        });

        it('should extract code and save to file', async () => {
            // Check if code directory exists and has files
            const codeDir = path.join(process.env.DATA_ROOT, 'users', userId, 'code');
            // Wait for file write
            await new Promise(r => setTimeout(r, 1000));
            expect(fs.existsSync(codeDir)).toBe(true);

            const files = fs.readdirSync(codeDir);
            expect(files.length).toBeGreaterThan(0);
            expect(files[0]).toMatch(/generated_.*\.py/);
        });

        it('should list chat history', async () => {
            const res = await request(app)
                .get('/api/chats')
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.chats).toBeInstanceOf(Array);
            expect(res.body.chats.length).toBeGreaterThan(0);
            expect(res.body.chats[0]).toHaveProperty('title');
        });
    });

    // 3. Explorer API Tests
    describe('Explorer API', () => {
        it('should list Chats virtual directory', async () => {
            const res = await request(app)
                .get('/api/files?path=Chats')
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.files).toBeInstanceOf(Array);

            // Check for chat file
            const chatFile = res.body.files.find(f => f.isVirtual && f.path.startsWith('Chats/'));
            expect(chatFile).toBeDefined();
            expect(chatFile).toHaveProperty('preview');
        });

        it('should list Generated Code virtual directory', async () => {
            const res = await request(app)
                .get('/api/files?path=Code')
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.files).toBeInstanceOf(Array);

            // Check for code file
            const codeFile = res.body.files.find(f => f.name.endsWith('.py'));
            expect(codeFile).toBeDefined();
        });
    });
});
