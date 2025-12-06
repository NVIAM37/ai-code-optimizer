import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';

dotenv.config();

const TEST_EMAIL = 'verification_test@example.com';
const TEST_PASSWORD = 'TestPassword123!';
const API_URL = 'http://localhost:3000';

async function runVerification() {
    console.log('🚀 Starting Backend Verification...');

    // 1. Test Database Connection
    try {
        console.log('Testing MongoDB Connection...');
        const uri = (process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/green-code-optimizer').replace('localhost', '127.0.0.1');
        await mongoose.connect(uri);
        console.log('✅ MongoDB Connected Successfully');
    } catch (error) {
        console.error('❌ MongoDB Connection Failed:', error.message);
        process.exit(1);
    }

    // 2. Cleanup previous test data
    try {
        await User.deleteOne({ email: TEST_EMAIL });
        console.log('🧹 Cleaned up previous test data');
    } catch (error) {
        console.warn('⚠️ Cleanup warning:', error.message);
    }

    // 3. Test Signup
    let token = '';
    try {
        console.log('Testing Signup Endpoint...');
        const res = await fetch(`${API_URL}/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: TEST_EMAIL,
                password: TEST_PASSWORD,
                name: 'Verification User'
            })
        });
        const data = await res.json();

        if (res.ok && data.success && data.token) {
            console.log('✅ Signup Successful');
            token = data.token;
        } else {
            throw new Error(data.error || 'Signup response invalid');
        }
    } catch (error) {
        console.error('❌ Signup Failed:', error.message);
        process.exit(1);
    }

    // 4. Test Login
    try {
        console.log('Testing Login Endpoint...');
        const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: TEST_EMAIL,
                password: TEST_PASSWORD
            })
        });
        const data = await res.json();

        if (res.ok && data.success && data.token) {
            console.log('✅ Login Successful');
            token = data.token; // Update token just in case
        } else {
            throw new Error(data.error || 'Login response invalid');
        }
    } catch (error) {
        console.error('❌ Login Failed:', error.message);
        process.exit(1);
    }

    // 5. Test Protected Route (Profile)
    try {
        console.log('Testing Protected Route (/user/profile)...');
        const res = await fetch(`${API_URL}/user/profile`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        const data = await res.json();

        if (res.ok && data.success && data.user.email === TEST_EMAIL) {
            console.log('✅ Protected Route Access Successful');
        } else {
            throw new Error(data.error || 'Profile response invalid');
        }
    } catch (error) {
        console.error('❌ Protected Route Failed:', error.message);
        process.exit(1);
    }

    // 6. Final Cleanup
    try {
        await User.deleteOne({ email: TEST_EMAIL });
        console.log('🧹 Final cleanup completed');
    } catch (error) {
        console.warn('⚠️ Final cleanup warning:', error.message);
    }

    console.log('🎉 All Verification Tests Passed!');
    process.exit(0);
}

runVerification();
