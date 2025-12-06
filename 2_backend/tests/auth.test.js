import { jest } from '@jest/globals';
import request from 'supertest';
import User from '../src/models/User.js';

// Mock dependencies before importing the app
jest.unstable_mockModule('../src/ai_engine/gemini.js', () => ({
    chat: jest.fn(),
    optimizeCode: jest.fn(),
    listModels: jest.fn()
}));

const { app } = await import('../src/server.js');

const uniqueId = Date.now();
const TEST_USER = {
    email: `authtest${uniqueId}@example.com`,
    password: 'testpassword123',
    name: 'Auth Test User'
};

describe('Authentication Routes Tests', () => {
    let authToken = '';
    let userId = '';

    afterAll(async () => {
        // Cleanup test user
        if (TEST_USER.email) {
            await User.deleteMany({ email: TEST_USER.email });
        }
    });

    describe('POST /auth/signup', () => {
        it('should register a new user successfully', async () => {
            const res = await request(app)
                .post('/auth/signup')
                .send(TEST_USER);

            expect(res.statusCode).toBe(201);
            expect(res.body).toHaveProperty('token');
            expect(res.body).toHaveProperty('user');
            expect(res.body.user.email).toBe(TEST_USER.email);
            expect(res.body.user).not.toHaveProperty('password');

            authToken = res.body.token;
            userId = res.body.user.id;
        });

        it('should reject signup with missing email', async () => {
            const res = await request(app)
                .post('/auth/signup')
                .send({
                    password: 'password123'
                });

            expect(res.statusCode).toBe(400);
            expect(res.body).toHaveProperty('error');
            expect(res.body.error).toContain('email');
        });

        it('should reject signup with short password', async () => {
            const res = await request(app)
                .post('/auth/signup')
                .send({
                    email: 'test@example.com',
                    password: 'short'
                });

            expect(res.statusCode).toBe(400);
            expect(res.body.error).toContain('8 characters');
        });

        it('should reject duplicate email', async () => {
            const res = await request(app)
                .post('/auth/signup')
                .send(TEST_USER);

            expect(res.statusCode).toBe(400);
            expect(res.body.error).toContain('already exists');
        });
    });

    describe('POST /auth/login', () => {
        it('should login with valid credentials', async () => {
            const res = await request(app)
                .post('/auth/login')
                .send({
                    email: TEST_USER.email,
                    password: TEST_USER.password
                });

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('token');
            expect(res.body).toHaveProperty('user');
            expect(res.body.user.email).toBe(TEST_USER.email);
        });

        it('should reject login with invalid email', async () => {
            const res = await request(app)
                .post('/auth/login')
                .send({
                    email: 'nonexistent@example.com',
                    password: 'password123'
                });

            expect(res.statusCode).toBe(401);
            expect(res.body.error).toContain('Invalid');
        });

        it('should reject login with invalid password', async () => {
            const res = await request(app)
                .post('/auth/login')
                .send({
                    email: TEST_USER.email,
                    password: 'wrongpassword'
                });

            expect(res.statusCode).toBe(401);
            expect(res.body.error).toContain('Invalid');
        });

        it('should reject login with missing credentials', async () => {
            const res = await request(app)
                .post('/auth/login')
                .send({});

            expect(res.statusCode).toBe(400);
            expect(res.body.error).toContain('email and password');
        });
    });

    describe('GET /auth/me', () => {
        it('should get current user with valid token', async () => {
            const res = await request(app)
                .get('/auth/me')
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.user.email).toBe(TEST_USER.email);
            expect(res.body.user).not.toHaveProperty('password');
        });

        it('should reject request without token', async () => {
            const res = await request(app)
                .get('/auth/me');

            expect(res.statusCode).toBe(401);
        });

        it('should reject request with invalid token', async () => {
            const res = await request(app)
                .get('/auth/me')
                .set('Authorization', 'Bearer invalid-token');

            expect(res.statusCode).toBe(401);
        });
    });

    describe('POST /auth/refresh', () => {
        it('should refresh token successfully', async () => {
            const res = await request(app)
                .post('/auth/refresh')
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('token');
            expect(res.body.token).toBeTruthy();
        });

        it('should reject refresh without token', async () => {
            const res = await request(app)
                .post('/auth/refresh');

            expect(res.statusCode).toBe(401);
        });
    });

    describe('POST /auth/logout', () => {
        it('should logout successfully', async () => {
            const res = await request(app)
                .post('/auth/logout')
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
        });

        it('should reject logout without token', async () => {
            const res = await request(app)
                .post('/auth/logout');

            expect(res.statusCode).toBe(401);
        });
    });

    describe('Token Validation', () => {
        it('should maintain session across multiple requests', async () => {
            const res1 = await request(app)
                .get('/auth/me')
                .set('Authorization', `Bearer ${authToken}`);

            expect(res1.statusCode).toBe(200);

            const res2 = await request(app)
                .get('/auth/me')
                .set('Authorization', `Bearer ${authToken}`);

            expect(res2.statusCode).toBe(200);
            expect(res2.body.user.id).toBe(res1.body.user.id);
        });
    });
});
