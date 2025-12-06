import mongoose from 'mongoose';
import User from './src/models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const uri = (process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/green-code-optimizer').replace('localhost', '127.0.0.1');

async function testGoogleUserCreation() {
    try {
        await mongoose.connect(uri);
        console.log('✅ Connected to DB');

        const mockProfile = {
            id: '1234567890',
            emails: [{ value: 'test-google-user@example.com' }],
            displayName: 'Test Google User'
        };

        console.log('Testing Google User Creation/Login logic...');

        // Simulate Passport Strategy Logic
        let user = await User.findOne({ googleId: mockProfile.id });

        if (user) {
            console.log('ℹ️ User already exists (expected if ran before)');
        } else {
            console.log('ℹ️ User does not exist, checking by email...');
            user = await User.findOne({ email: mockProfile.emails[0].value });

            if (user) {
                console.log('ℹ️ Found user by email, linking account...');
                user.googleId = mockProfile.id;
                await user.save();
                console.log('✅ Account linked successfully');
            } else {
                console.log('ℹ️ Creating new user...');
                user = await User.create({
                    googleId: mockProfile.id,
                    email: mockProfile.emails[0].value,
                    name: mockProfile.displayName,
                    password: Math.random().toString(36).slice(-8) // Dummy password
                });
                console.log('✅ New user created successfully');
            }
        }

        console.log('✅ User:', user.email, user.googleId);

        // Cleanup
        await User.deleteOne({ email: mockProfile.emails[0].value });
        console.log('✅ Cleanup complete');

    } catch (error) {
        console.error('❌ Test Failed:', error);
    } finally {
        await mongoose.disconnect();
    }
}

testGoogleUserCreation();
