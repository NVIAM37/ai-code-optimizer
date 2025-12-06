import mongoose from 'mongoose';
import User from './src/models/User.js';

const uri = 'mongodb://127.0.0.1:27017/green-code-optimizer';

async function testUserCreation() {
    try {
        await mongoose.connect(uri, { family: 4 });
        console.log('✅ Connected to DB');

        // Try creating a user with a "dummy" email
        const dummyEmail = 'dummy'; // Invalid email
        console.log(`Attempting to create user with email: "${dummyEmail}"`);

        try {
            await User.create({
                email: dummyEmail,
                password: 'password123',
                name: 'Dummy User'
            });
            console.log('❌ Unexpected Success: User created with invalid email');
        } catch (err) {
            console.log('✅ Expected Failure:', err.message);
        }

        // Try with valid email
        const validEmail = 'valid@example.com';
        console.log(`Attempting to create user with email: "${validEmail}"`);

        // Cleanup first
        await User.deleteOne({ email: validEmail });

        await User.create({
            email: validEmail,
            password: 'password123',
            name: 'Valid User'
        });
        console.log('✅ Success: User created with valid email');

        // Cleanup
        await User.deleteOne({ email: validEmail });

    } catch (error) {
        console.error('❌ System Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

testUserCreation();
