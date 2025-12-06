import { jest } from '@jest/globals';
import request from 'supertest';

// Mock dependencies
jest.unstable_mockModule('../src/ai_engine/gemini.js', () => ({
    chat: jest.fn(),
    optimizeCode: jest.fn(),
    listModels: jest.fn()
}));

const { app } = await import('../src/server.js');

const uniqueId = Date.now() + 1000;
const TEST_USER = {
    email: `usertest${uniqueId}@example.com`,
    password: 'testpassword123',
    name: 'User Test'
};

describe('User Routes Tests', () => {
    let authToken = '';
    let userId = '';

    beforeAll(async () => {
        // Create a test user
        const res = await request(app)
            .post('/auth/signup')
            .send(TEST_USER);

        authToken = res.body.token;
        userId = res.body.user.id;
    });

    describe('GET /user/profile', () => {
        it('should get user profile', async () => {
            const res = await request(app)
                .get('/user/profile')
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.user.email).toBe(TEST_USER.email);
            expect(res.body.user.name).toBe(TEST_USER.name);
        });

        it('should reject without auth token', async () => {
            const res = await request(app)
                .get('/user/profile');

            expect(res.statusCode).toBe(401);
        });
    });

    describe('PUT /user/profile', () => {
        it('should update user profile', async () => {
            const res = await request(app)
                .put('/user/profile')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: 'Updated Name'
                });

            expect(res.statusCode).toBe(200);
            expect(res.body.user.name).toBe('Updated Name');
        });

        it('should update preferences', async () => {
            const res = await request(app)
                .put('/user/profile')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    preferences: {
                        theme: 'dark',
                        language: 'python'
                    }
                });

            expect(res.statusCode).toBe(200);
            expect(res.body.user.preferences).toHaveProperty('theme');
        });
    });

    describe('PUT /user/api-keys', () => {
        it('should update Gemini API key', async () => {
            const res = await request(app)
                .put('/user/api-keys')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    gemini: 'test-gemini-key-123'
                });

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.apiKeys.gemini).toBe('test-gemini-key-123');
        });

        it('should update Groq API key', async () => {
            const res = await request(app)
                .put('/user/api-keys')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    groq: 'test-groq-key-456'
                });

            expect(res.statusCode).toBe(200);
            expect(res.body.apiKeys.groq).toBe('test-groq-key-456');
        });

        it('should update both API keys', async () => {
            const res = await request(app)
                .put('/user/api-keys')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    gemini: 'new-gemini-key',
                    groq: 'new-groq-key'
                });

            expect(res.statusCode).toBe(200);
            expect(res.body.apiKeys.gemini).toBe('new-gemini-key');
            expect(res.body.apiKeys.groq).toBe('new-groq-key');
        });
    });

    describe('GET /user/api-keys', () => {
        it('should retrieve API keys', async () => {
            const res = await request(app)
                .get('/user/api-keys')
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('apiKeys');
            expect(res.body.apiKeys).toHaveProperty('gemini');
            expect(res.body.apiKeys).toHaveProperty('groq');
        });
    });

    describe('GET /user/history', () => {
        it('should get execution history', async () => {
            const res = await request(app)
                .get('/user/history')
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('history');
            expect(res.body.history).toBeInstanceOf(Array);
            expect(res.body).toHaveProperty('pagination');
        });

        it('should support pagination', async () => {
            const res = await request(app)
                .get('/user/history?page=1&limit=5')
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.pagination.current).toBe(1);
            expect(res.body.pagination.limit).toBe(5);
        });

        it('should filter by language', async () => {
            const res = await request(app)
                .get('/user/history?language=python')
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.history).toBeInstanceOf(Array);
        });

        it('should support sorting', async () => {
            const res = await request(app)
                .get('/user/history?sortBy=timestamp&order=asc')
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.history).toBeInstanceOf(Array);
        });
    });

    describe('GET /user/statistics', () => {
        it('should get user statistics', async () => {
            const res = await request(app)
                .get('/user/statistics')
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.statistics).toHaveProperty('totalRuns');
            expect(res.body.statistics).toHaveProperty('avgPerformanceGain');
            expect(res.body.statistics).toHaveProperty('totalTimeSaved');
            expect(res.body.statistics).toHaveProperty('totalEnergySaved');
            expect(res.body.statistics).toHaveProperty('languages');
        });

        it('should include language breakdown', async () => {
            const res = await request(app)
                .get('/user/statistics')
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.statistics.languages).toBeInstanceOf(Array);
        });
    });

    describe('GET /user/export', () => {
        it('should export user data', async () => {
            const res = await request(app)
                .get('/user/export')
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.headers['content-type']).toContain('application/json');
            expect(res.headers['content-disposition']).toContain('attachment');
            expect(res.body).toHaveProperty('user');
            expect(res.body).toHaveProperty('executionHistory');
            expect(res.body).toHaveProperty('exportedAt');
        });
    });

    describe('DELETE /user/data', () => {
        it('should reject deletion without confirmation', async () => {
            const res = await request(app)
                .delete('/user/data')
                .set('Authorization', `Bearer ${authToken}`)
                .send({});

            expect(res.statusCode).toBe(400);
            expect(res.body.error).toContain('confirm');
        });

        it('should reject deletion with wrong confirmation', async () => {
            const res = await request(app)
                .delete('/user/data')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ confirm: 'WRONG' });

            expect(res.statusCode).toBe(400);
        });

        // Note: We don't actually delete the test user to avoid breaking other tests
    });
});
