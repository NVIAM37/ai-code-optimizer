import { listModels } from './src/ai_engine/gemini.js';
import fs from 'fs';

const runTest = async () => {
    const apiKey = "AIzaSyDWuRADN_kEShEI0hVcZ8yO0ryNjz2jnEI"; // User's key
    console.log("🚀 Testing listModels with user key...");

    try {
        const models = await listModels(apiKey);
        console.log(`✅ Found ${models.length} valid models:`);
        fs.writeFileSync('models.json', JSON.stringify(models, null, 2));
        console.log("Saved to models.json");

        const invalidModels = models.filter(m => m.includes('vision') || m.includes('embedding'));
        if (invalidModels.length > 0) {
            console.error("❌ FAILURE: Found invalid models in list:", invalidModels);
        } else {
            console.log("✅ SUCCESS: List contains only text-generation models.");
        }

        if (models.includes('gemini-1.5-flash')) {
            console.log("✅ SUCCESS: gemini-1.5-flash is present.");
        } else {
            console.warn("⚠️ WARNING: gemini-1.5-flash is missing?");
        }

    } catch (error) {
        console.error("❌ Test Failed:", error);
    }
};

runTest();
