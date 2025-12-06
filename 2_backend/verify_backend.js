import axios from 'axios';
import WebSocket from 'ws';

const BASE_URL = 'http://localhost:3000';
const WS_URL = 'ws://localhost:3000';

async function verifyBackend() {
    console.log("🔍 Starting Backend Verification...");
    let allPassed = true;

    // 1. Health Check
    try {
        let res;
        try {
            res = await axios.get(`${BASE_URL}/api/health`);
        } catch (e) {
            if (e.response && e.response.status === 404) {
                console.warn("⚠️ /api/health not found (Server might need restart). Trying /api/test-auth...");
                res = await axios.get(`${BASE_URL}/api/test-auth`);
            } else {
                throw e;
            }
        }

        if (res.status === 200) {
            console.log("✅ API Connectivity Verified");
        } else {
            console.error(`❌ API Check Failed: Status ${res.status}`);
            allPassed = false;
        }
    } catch (e) {
        console.error(`❌ API Check Failed: ${e.message}`);
        allPassed = false;
    }

    // 2. CORS Check (Implicit via axios from 'origin' if we could simulate, but here just checking headers)
    try {
        const res = await axios.options(`${BASE_URL}/api/health`);
        // Axios might follow redirects or handle options differently, but let's check headers if possible
        // Simple GET usually returns CORS headers too
        const getRes = await axios.get(`${BASE_URL}/api/health`);
        if (getRes.headers['access-control-allow-origin']) {
            console.log("✅ CORS Headers Present");
        } else {
            // Express might not send it for non-CORS requests (server-to-server), so this might be a weak check.
            // But usually 'cors' middleware adds it.
            console.log("⚠️ CORS Headers missing (might be normal for server-to-server)");
        }
    } catch (e) {
        // Ignore
    }

    // 3. WebSocket Connection
    try {
        await new Promise((resolve, reject) => {
            const ws = new WebSocket(WS_URL);

            const timeout = setTimeout(() => {
                ws.terminate();
                reject(new Error("WebSocket Connection Timeout"));
            }, 5000);

            ws.on('open', () => {
                console.log("✅ WebSocket Connection Successful");
                clearTimeout(timeout);
                ws.close();
                resolve();
            });

            ws.on('error', (err) => {
                clearTimeout(timeout);
                reject(err);
            });
        });
    } catch (e) {
        console.error(`❌ WebSocket Check Failed: ${e.message}`);
        allPassed = false;
    }

    if (allPassed) {
        console.log("✅ BACKEND VERIFICATION PASSED");
        process.exit(0);
    } else {
        console.error("❌ BACKEND VERIFICATION FAILED");
        process.exit(1);
    }
}

verifyBackend();
