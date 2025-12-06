import { jest } from '@jest/globals';
import request from 'supertest';
import fs from 'fs';
import path from 'path';

// Mock Gemini AI
jest.unstable_mockModule('../src/ai_engine/gemini.js', () => ({
    chat: jest.fn().mockResolvedValue('Here is a python hello world:\n```python\nprint("Hello World")\n```'),
    optimizeCode: jest.fn().mockResolvedValue('Optimized code'),
    listModels: jest.fn().mockResolvedValue(['gemini-1.5-flash'])
}));

const { app } = await import('../src/server.js');

const uniqueId = Date.now();
const TEST_USER = {
    email: `verify${uniqueId}@example.com`,
    password: 'password123',
    name: 'Verification User'
};

let authToken = '';
let userId = '';
let chatId = '';

describe('🔍 COMPREHENSIVE VERIFICATION TESTS', () => {

    describe('✅ 1. Authentication & Session Persistence', () => {
        it('should register a new user', async () => {
            const res = await request(app)
                .post('/auth/signup')
                .send(TEST_USER);

            expect(res.statusCode).toBe(201);
            expect(res.body).toHaveProperty('token');
            expect(res.body).toHaveProperty('user');

            authToken = res.body.token;
            userId = res.body.user.id;

            console.log('✅ User registered:', userId);
        });

        it('should login with credentials', async () => {
            const res = await request(app)
                .post('/auth/login')
                .send({
                    email: TEST_USER.email,
                    password: TEST_USER.password
                });

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('token');

            console.log('✅ Login successful');
        });

        it('should persist session across requests', async () => {
            const res = await request(app)
                .get('/auth/me')
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.user.email).toBe(TEST_USER.email);

            console.log('✅ Session persists');
        });
    });

    describe('✅ 2. Chat Messages Save to File System', () => {
        it('should send chat message and save to file', async () => {
            const res = await request(app)
                .post('/chat')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    message: 'Write a python hello world',
                    provider: 'gemini',
                    model: 'gemini-1.5-flash',
                    apiKey: 'test-key',
                    history: []
                });

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('reply');
            expect(res.body).toHaveProperty('chatId');

            chatId = res.body.chatId;

            // Wait for file write
            await new Promise(r => setTimeout(r, 1000));

            // Verify chat file exists
            const chatFile = path.join(process.env.DATA_ROOT, 'users', userId, 'chats', `${chatId}.json`);
            expect(fs.existsSync(chatFile)).toBe(true);

            // Verify file content
            const content = JSON.parse(fs.readFileSync(chatFile, 'utf-8'));
            expect(content.messages).toBeInstanceOf(Array);
            expect(content.messages.length).toBeGreaterThan(0);

            console.log('✅ Chat saved to:', chatFile);
        });
    });

    describe('✅ 3. Generated Code Files in File System', () => {
        it('should extract and save code to file', async () => {
            const codeDir = path.join(process.env.DATA_ROOT, 'users', userId, 'code');

            // Wait for file write
            await new Promise(r => setTimeout(r, 1000));

            expect(fs.existsSync(codeDir)).toBe(true);

            const files = fs.readdirSync(codeDir);
            expect(files.length).toBeGreaterThan(0);
            expect(files[0]).toMatch(/generated_.*\.py/);

            // Verify file content
            const codeFile = path.join(codeDir, files[0]);
            const code = fs.readFileSync(codeFile, 'utf-8');
            expect(code).toContain('print("Hello World")');

            console.log('✅ Code saved to:', codeFile);
        });
    });

    describe('✅ 4. Chat History Appears in History Page', () => {
        it('should list chat history via API', async () => {
            const res = await request(app)
                .get('/api/chats')
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.chats).toBeInstanceOf(Array);
            expect(res.body.chats.length).toBeGreaterThan(0);

            const chat = res.body.chats[0];
            expect(chat).toHaveProperty('_id');
            expect(chat).toHaveProperty('title');
            expect(chat).toHaveProperty('updatedAt');
            // Note: preview is only in Explorer API, not in chat list API

            console.log('✅ Chat history available:', res.body.chats.length, 'chats');
        });
    });

    describe('✅ 5. Chat Sessions in Explorer with Previews', () => {
        it('should list Chats virtual directory', async () => {
            const res = await request(app)
                .get('/api/files?path=Chats')
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.files).toBeInstanceOf(Array);

            const chatFile = res.body.files.find(f => f.isVirtual && f.path.startsWith('Chats/'));
            expect(chatFile).toBeDefined();
            expect(chatFile).toHaveProperty('preview');
            expect(chatFile.preview).toBeTruthy();

            console.log('✅ Chat in Explorer with preview:', chatFile.name);
        });
    });

    describe('✅ 6. Generated Code Files in Explorer', () => {
        it('should list Code virtual directory', async () => {
            const res = await request(app)
                .get('/api/files?path=Code')
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.files).toBeInstanceOf(Array);

            const codeFile = res.body.files.find(f => f.name.endsWith('.py'));
            expect(codeFile).toBeDefined();
            expect(codeFile).toHaveProperty('size');
            expect(codeFile.size).toBeGreaterThan(0);

            console.log('✅ Code file in Explorer:', codeFile.name);
        });
    });

    describe('✅ 7. Download Button Functionality', () => {
        it('should verify code files are downloadable', async () => {
            const codeDir = path.join(process.env.DATA_ROOT, 'users', userId, 'code');
            const files = fs.readdirSync(codeDir);

            expect(files.length).toBeGreaterThan(0);

            const codeFile = path.join(codeDir, files[0]);
            const stats = fs.statSync(codeFile);

            expect(stats.isFile()).toBe(true);
            expect(stats.size).toBeGreaterThan(0);

            console.log('✅ Download ready:', files[0], `(${stats.size} bytes)`);
        });
    });

    describe('✅ 8. Logout/Login Cycle - History Persists', () => {
        let newToken = '';

        it('should logout (client-side token removal)', async () => {
            const res = await request(app)
                .post('/auth/logout')
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.statusCode).toBe(200);

            console.log('✅ Logout successful');
        });

        it('should login again', async () => {
            const res = await request(app)
                .post('/auth/login')
                .send({
                    email: TEST_USER.email,
                    password: TEST_USER.password
                });

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('token');

            newToken = res.body.token;

            console.log('✅ Re-login successful');
        });

        it('should still see previous chat history after re-login', async () => {
            const res = await request(app)
                .get('/api/chats')
                .set('Authorization', `Bearer ${newToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.chats).toBeInstanceOf(Array);
            expect(res.body.chats.length).toBeGreaterThan(0);

            // Verify the chat we created earlier is still there
            const previousChat = res.body.chats.find(c => c._id === chatId);
            expect(previousChat).toBeDefined();

            console.log('✅ History persists after logout/login:', res.body.chats.length, 'chats');
        });

        it('should still see code files after re-login', async () => {
            const res = await request(app)
                .get('/api/files?path=Code')
                .set('Authorization', `Bearer ${newToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.files).toBeInstanceOf(Array);
            expect(res.body.files.length).toBeGreaterThan(0);

            console.log('✅ Code files persist after logout/login:', res.body.files.length, 'files');
        });
    });

    describe('✅ 9. File System Integrity', () => {
        it('should verify all user directories exist', async () => {
            const userDir = path.join(process.env.DATA_ROOT, 'users', userId);
            const chatsDir = path.join(userDir, 'chats');
            const codeDir = path.join(userDir, 'code');

            expect(fs.existsSync(userDir)).toBe(true);
            expect(fs.existsSync(chatsDir)).toBe(true);
            expect(fs.existsSync(codeDir)).toBe(true);

            console.log('✅ All directories exist');
        });

        it('should verify file permissions are correct', async () => {
            const codeDir = path.join(process.env.DATA_ROOT, 'users', userId, 'code');
            const files = fs.readdirSync(codeDir);
            const codeFile = path.join(codeDir, files[0]);

            const stats = fs.statSync(codeFile);
            expect(stats.isFile()).toBe(true);

            // Verify file is readable
            const content = fs.readFileSync(codeFile, 'utf-8');
            expect(content.length).toBeGreaterThan(0);

            console.log('✅ File permissions OK');
        });
    });
});
