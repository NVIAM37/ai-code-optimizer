import fetch from 'node-fetch';

const runTest = async () => {
    console.log("🚀 Testing /process endpoint with 'invalid' format key...");

    const payload = {
        code: "print('hello')",
        language: "python",
        intensity: 50,
        provider: "gemini",
        apiKey: "short_key", // This would have failed validation before
        model: "gemini-2.0-flash-exp"
    };

    try {
        const response = await fetch('http://localhost:3000/process', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        console.log(`Response Status: ${response.status}`);

        if (response.status === 400 && data.error === "Invalid Gemini API Key Format") {
            console.error("❌ FAILURE: Server still blocking key format.");
        } else if (data.error && data.error !== "Invalid Gemini API Key Format") {
            console.log("✅ SUCCESS: Server allowed key, failed at AI provider (expected).");
            console.log("Error:", data.error);
        } else if (response.status === 200) {
            console.log("❓ UNEXPECTED: Request succeeded with short key?");
        }

    } catch (error) {
        console.error("❌ Request Failed:", error);
    }
};

runTest();
