import User from './models/User.js';
import ExecutionHistory from './models/ExecutionHistory.js';
import Session from './models/Session.js';
import { connectDB } from './config/database.js';
import fs from 'fs';
import path from 'path';

const runTests = async () => {
    console.log("🧪 Starting JSON DB Tests...");

    // 1. Initialize DB
    await connectDB();
    console.log("✅ DB Connected");

    // 2. Test User Creation
    console.log("\n--- Testing User Model ---");
    const testEmail = `test_${Date.now()}@example.com`;
    try {
        const newUser = await User.create({
            email: testEmail,
            password: 'password123',
            name: 'Test User'
        });
        console.log("✅ User Created:", newUser._id);

        // 3. Test User Find
        const foundUser = await User.findOne({ email: testEmail });
        if (foundUser && foundUser._id === newUser._id) {
            console.log("✅ User Found by Email");
        } else {
            console.error("❌ User Find Failed");
        }

        // 4. Test Password Comparison
        const isMatch = await foundUser.comparePassword('password123');
        if (isMatch) {
            console.log("✅ Password Comparison Success");
        } else {
            console.error("❌ Password Comparison Failed");
        }

        // 5. Test Update
        await User.updateOne({ _id: newUser._id }, { name: 'Updated Name' });
        const updatedUser = await User.findById(newUser._id);
        if (updatedUser.name === 'Updated Name') {
            console.log("✅ User Update Success");
        } else {
            console.error("❌ User Update Failed");
        }

    } catch (err) {
        console.error("❌ User Tests Failed:", err);
    }

    // 6. Test ExecutionHistory
    console.log("\n--- Testing ExecutionHistory Model ---");
    try {
        const history = await ExecutionHistory.create({
            userId: "test_user_id",
            language: "python",
            originalCode: "print('hello')",
            optimizedCode: "print('world')",
            metrics: { original: {}, optimized: {} },
            provider: "gemini",
            performanceGain: 10
        });
        console.log("✅ ExecutionHistory Created:", history._id);

        const foundHistory = await ExecutionHistory.findById(history._id);
        if (foundHistory) {
            console.log("✅ ExecutionHistory Found");
        } else {
            console.error("❌ ExecutionHistory Find Failed");
        }
    } catch (err) {
        console.error("❌ ExecutionHistory Tests Failed:", err);
    }

    // 7. Test Session
    console.log("\n--- Testing Session Model ---");
    try {
        const session = await Session.create({
            _id: "test_session_id_" + Date.now(),
            session: { cookie: { originalMaxAge: 1000, expires: new Date(Date.now() + 1000) } }
        });
        console.log("✅ Session Created:", session._id);

        const foundSession = await Session.findById(session._id);
        if (foundSession) {
            console.log("✅ Session Found");
        } else {
            console.error("❌ Session Find Failed");
        }
    } catch (err) {
        console.error("❌ Session Tests Failed:", err);
    }

    console.log("\n✅ All Tests Completed");
    process.exit(0);
};

runTests();
