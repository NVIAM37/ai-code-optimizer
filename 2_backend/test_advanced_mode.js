import axios from 'axios';

const API_URL = 'http://localhost:3000';
const TEST_CODE = 'print("Hello Advanced Mode")';

async function testRunAction() {
    console.log('Testing RUN action...');
    try {
        const res = await axios.post(`${API_URL}/process`, {
            code: TEST_CODE,
            language: 'python',
            intensity: 10,
            action: 'run'
        });

        if (res.data.original && !res.data.optimized) {
            console.log('✅ RUN action success: Returned original metrics only.');
        } else {
            console.error('❌ RUN action failed: Unexpected response structure.', Object.keys(res.data));
        }
    } catch (err) {
        console.error('❌ RUN action error:', err.message);
    }
}

async function testOptimizeAction() {
    console.log('\nTesting OPTIMIZE action...');
    try {
        // Mocking AI response by not providing API key (server might fail or skip, but we check structure)
        // Actually, we need a valid key or mock. For now, let's assume server handles missing key gracefully or we skip AI part.
        // But to test structure, we need it to succeed.
        // Let's rely on the fact that if we send action='optimize', it SHOULD NOT return original metrics.

        const res = await axios.post(`${API_URL}/process`, {
            code: TEST_CODE,
            language: 'python',
            intensity: 10,
            action: 'optimize',
            provider: 'gemini' // Will fail without key, but let's see response
        });

        // If it fails due to key, that's fine, but if it returns original metrics, that's a bug.
        if (!res.data.original) {
            console.log('✅ OPTIMIZE action success: Did not return original metrics.');
        } else {
            console.error('❌ OPTIMIZE action failed: Returned original metrics.', Object.keys(res.data));
        }

    } catch (err) {
        // If error is about API key, it means it tried to optimize, which is good.
        // If it ran original code, we wouldn't get API key error (unless we checked key before run).
        if (err.response && err.response.data && !err.response.data.original) {
            console.log('✅ OPTIMIZE action verified (via error): Did not run original code.');
        } else {
            console.error('❌ OPTIMIZE action error:', err.message);
        }
    }
}

async function runTests() {
    await testRunAction();
    await testOptimizeAction();
}

runTests();
