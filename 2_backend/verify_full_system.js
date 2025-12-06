import mongoose from 'mongoose';
import User from './src/models/User.js';
import Session from './src/models/Session.js';
import ExecutionHistory from './src/models/ExecutionHistory.js';
import dotenv from 'dotenv';

dotenv.config();

const uri = (process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/green-code-optimizer').replace('localhost', '127.0.0.1');

async function verifySystem() {
    console.log('🔍 Starting Full System Verification...');
    console.log(`📡 Connecting to: ${uri}`);

    try {
        await mongoose.connect(uri);
        console.log('✅ Database Connected');

        // 1. Test User Creation (Email/Password)
        console.log('\n👤 Testing User Creation (Email/Password)...');
        const testEmail = 'verify_test@example.com';

        // Cleanup first
        await User.deleteOne({ email: testEmail });

        const user = await User.create({
            email: testEmail,
            password: 'password123',
            name: 'Verification User'
        });

        if (user && user._id) {
            console.log('✅ User Created Successfully:', user._id);
        } else {
            throw new Error('User creation failed - no ID returned');
        }

        // 2. Test User Retrieval
        console.log('\n🔍 Testing User Retrieval...');
        const foundUser = await User.findOne({ email: testEmail }).select('+password');
        if (foundUser) {
            console.log('✅ User Found');
            const isMatch = await foundUser.comparePassword('password123');
            console.log(`🔐 Password Verification: ${isMatch ? 'PASSED' : 'FAILED'}`);
        } else {
            throw new Error('User not found after creation');
        }

        // 3. Test Session Creation
        console.log('\n🎟️ Testing Session Creation...');
        const session = await Session.create({
            userId: user._id,
            token: 'test-token-123',
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        });
        console.log('✅ Session Created:', session._id);

        // 4. Test Execution History
        console.log('\n📜 Testing Execution History...');
        const history = await ExecutionHistory.create({
            userId: user._id,
            language: 'javascript',
            originalCode: 'console.log("hello")',
            optimizedCode: 'console.log("hello")',
            metrics: {
                original: { duration: 100 },
                optimized: { duration: 80 }
            },
            provider: 'gemini',
            intensity: 50
        });
        console.log('✅ History Entry Created:', history._id);

        // 5. Test Google User Logic
        console.log('\n🌐 Testing Google User Logic...');
        const googleId = 'google-test-id-123';
        const googleEmail = 'google_test@example.com';

        await User.deleteOne({ email: googleEmail });

        const googleUser = await User.create({
            email: googleEmail,
            googleId: googleId,
            name: 'Google Test User'
        });
        console.log('✅ Google User Created:', googleUser._id);

        // Cleanup
        console.log('\n🧹 Cleaning up...');
        await User.deleteMany({ email: { $in: [testEmail, googleEmail] } });
        await Session.deleteMany({ userId: user._id });
        await ExecutionHistory.deleteMany({ userId: user._id });
        console.log('✅ Cleanup Complete');

        console.log('\n✨ ALL SYSTEMS GO! Database is fully functional.');

    } catch (error) {
        console.error('\n❌ CRITICAL FAILURE:', error);
        console.error('Stack:', error.stack);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
    }
}

verifySystem();
