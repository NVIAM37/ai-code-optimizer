import { optimizeCode } from './src/ai_engine/gemini.js';

const runTest = async () => {
    const apiKey = "AIzaSyDWuRADN_kEShEI0hVcZ8yO0ryNjz2jnEI"; // User's key
    const code = "print('hello world')";

    console.log("🚀 Testing optimization with default model (should be gemini-flash-latest)...");
    try {
        const result = await optimizeCode(code, "python", 50, apiKey);
        console.log("✅ Success! Result length:", result.length);
    } catch (error) {
        console.error("❌ Failed:", error.message);
    }

    console.log("\n🚀 Testing optimization with 'gemini-pro' (should warn and upgrade)...");
    try {
        const result = await optimizeCode(code, "python", 50, apiKey, "gemini-pro");
        console.log("✅ Success! Result length:", result.length);
    } catch (error) {
        console.error("❌ Failed:", error.message);
    }
};

runTest();
