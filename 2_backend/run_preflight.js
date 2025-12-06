import fs from 'fs';
import path from 'path';
import { spawn, execSync } from 'child_process';
import axios from 'axios';
import WebSocket from 'ws';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'http://localhost:3000';
const WS_URL = 'ws://localhost:3000';
const SUPERVISOR_PATH = path.join(__dirname, 'src', 'executors', 'supervisor.py');

// Colors for console output
const colors = {
    reset: "\x1b[0m",
    green: "\x1b[32m",
    red: "\x1b[31m",
    yellow: "\x1b[33m",
    cyan: "\x1b[36m",
    bold: "\x1b[1m"
};

const log = (msg, color = colors.reset) => console.log(`${color}${msg}${colors.reset}`);

async function runPreflight() {
    log("\n🚀 STARTING PREFLIGHT SYSTEM CHECKS...\n", colors.cyan + colors.bold);
    let allPassed = true;

    // ==========================================
    // 1. STATIC CHECKS (Environment & Deps)
    // ==========================================
    log("[1/4] 🏗️  Checking Infrastructure...", colors.yellow);

    // Check .env
    if (fs.existsSync(path.join(__dirname, '.env'))) {
        log("  ✅ .env file found", colors.green);
    } else {
        log("  ❌ .env file missing!", colors.red);
        allPassed = false;
    }

    // Check node_modules
    if (fs.existsSync(path.join(__dirname, 'node_modules'))) {
        log("  ✅ node_modules found", colors.green);
    } else {
        log("  ❌ node_modules missing!", colors.red);
        allPassed = false;
    }

    // Check Supervisor Exists
    if (fs.existsSync(SUPERVISOR_PATH)) {
        log("  ✅ supervisor.py found", colors.green);
    } else {
        log("  ❌ supervisor.py missing!", colors.red);
        allPassed = false;
    }

    // ==========================================
    // 2. SUPERVISOR LOGIC CHECK (Python)
    // ==========================================
    log("\n[2/4] 🧠 Verifying Supervisor & DbC...", colors.yellow);
    const dummyScript = path.join(__dirname, 'temp_preflight_test.py');
    fs.writeFileSync(dummyScript, "print('Preflight Test')");

    try {
        // Run supervisor with the dummy script
        // python src/executors/supervisor.py "python temp_preflight_test.py"
        const cmd = `python "${SUPERVISOR_PATH}" "python ${path.basename(dummyScript)}"`;
        const output = execSync(cmd, { cwd: __dirname, encoding: 'utf-8' });

        // Parse JSON output
        const parts = output.split("---METRICS_START---");
        if (parts.length > 1) {
            const jsonStr = parts[1].split("---METRICS_END---")[0];
            const metrics = JSON.parse(jsonStr).metrics;

            // DbC Assertions
            const checks = [
                { name: "Duration >= 0", pass: metrics.duration >= 0 },
                { name: "Energy >= 0", pass: metrics.energy_joules >= 0 },
                { name: "RAM >= 0", pass: metrics.ram_peak >= 0 },
                { name: "CPU > 0 (Polling Fix)", pass: metrics.cpu_peak > 0 }
            ];

            const failedChecks = checks.filter(c => !c.pass);
            if (failedChecks.length === 0) {
                log("  ✅ Supervisor Metrics Valid (DbC Passed)", colors.green);
                log(`  ✅ CPU Polling Verified (${metrics.cpu_peak}%)`, colors.green);
            } else {
                log(`  ❌ Supervisor DbC Failed: ${failedChecks.map(c => c.name).join(', ')}`, colors.red);
                allPassed = false;
            }
        } else {
            log("  ❌ Supervisor returned invalid format", colors.red);
            allPassed = false;
        }

    } catch (error) {
        log(`  ❌ Supervisor Execution Error: ${error.message}`, colors.red);
        allPassed = false;
    } finally {
        if (fs.existsSync(dummyScript)) fs.unlinkSync(dummyScript);
    }

    // ==========================================
    // 3. BACKEND SERVER STARTUP
    // ==========================================
    log("\n[3/4] 🔌 Starting Backend Server for API Checks...", colors.yellow);
    let serverProcess = null;

    try {
        serverProcess = spawn('node', ['src/server.js'], {
            cwd: __dirname,
            stdio: ['ignore', 'pipe', 'pipe'], // Pipe stdout/stderr to detect startup
            env: { ...process.env, PORT: '3000' } // Force port 3000
        });

        // Wait for server to be ready
        await new Promise((resolve, reject) => {
            let started = false;
            const timeout = setTimeout(() => {
                if (!started) reject(new Error("Server startup timeout (10s)"));
            }, 10000);

            serverProcess.stdout.on('data', (data) => {
                const str = data.toString();
                // console.log(str); 
                if (str.includes('Server running') || str.includes('Connected to MongoDB')) {
                    if (!started) {
                        started = true;
                        clearTimeout(timeout);
                        log("  ✅ Server started successfully", colors.green);
                        setTimeout(resolve, 2000);
                    }
                }
                // Detect Port in Use
                if (str.includes('EADDRINUSE') || str.includes('Port 3000 is already in use')) {
                    log("  ⚠️  Port 3000 in use. Assuming server is ALREADY running.", colors.yellow);
                    started = true;
                    clearTimeout(timeout);
                    // Don't kill existing server on exit
                    serverProcess = null;
                    resolve();
                }
            });

            serverProcess.stderr.on('data', (data) => {
                const str = data.toString();
                if (str.includes('EADDRINUSE')) {
                    log("  ⚠️  Port 3000 in use. Assuming server is ALREADY running.", colors.yellow);
                    started = true;
                    clearTimeout(timeout);
                    serverProcess = null;
                    resolve();
                }
            });

            serverProcess.on('error', (err) => reject(err));
            serverProcess.on('exit', (code) => {
                if (!started) {
                    // If code 0, maybe it just printed help or something? Or maybe it detected port and exited?
                    // But usually server keeps running.
                    // Let's assume if it exits with 0 but we didn't see "Server running", it might be an issue OR it might be the port check logic in server.js exiting cleanly.
                    // Let's check if we can reach the API anyway.
                    log(`  ⚠️  Server exited with code ${code}. Checking API availability...`, colors.yellow);
                    started = true;
                    clearTimeout(timeout);
                    serverProcess = null; // Don't try to kill it
                    resolve();
                }
            });
        });

        // ==========================================
        // 4. API & WEBSOCKET CHECKS
        // ==========================================
        log("\n[4/4] 📡 Verifying API & WebSockets...", colors.yellow);

        // API Check
        try {
            // Try health first, fallback to test-auth if health missing (though we added it)
            try {
                const res = await axios.get(`${BASE_URL}/api/health`);
                if (res.status === 200) log("  ✅ GET /api/health (200 OK)", colors.green);
            } catch (e) {
                if (e.response && e.response.status === 404) {
                    log("  ⚠️ /api/health missing, trying /api/test-auth...", colors.yellow);
                    const res = await axios.get(`${BASE_URL}/api/test-auth`);
                    if (res.status === 200) log("  ✅ GET /api/test-auth (200 OK)", colors.green);
                } else {
                    throw e;
                }
            }
        } catch (e) {
            log(`  ❌ API Check Failed: ${e.message}`, colors.red);
            allPassed = false;
        }

        // WebSocket Check
        try {
            await new Promise((resolve, reject) => {
                const ws = new WebSocket(WS_URL);
                const tm = setTimeout(() => { ws.terminate(); reject(new Error("Timeout")); }, 3000);

                ws.on('open', () => {
                    log("  ✅ WebSocket Connection Established", colors.green);
                    clearTimeout(tm);
                    ws.close();
                    resolve();
                });

                ws.on('error', (err) => {
                    clearTimeout(tm);
                    reject(err);
                });
            });
        } catch (e) {
            log(`  ❌ WebSocket Check Failed: ${e.message}`, colors.red);
            allPassed = false;
        }

    } catch (error) {
        log(`  ❌ Server Startup/Verification Failed: ${error.message}`, colors.red);
        allPassed = false;
    } finally {
        if (serverProcess) {
            log("\n🧹 Stopping Temporary Server...", colors.cyan);
            serverProcess.kill();
            // Force kill if needed
            try { process.kill(serverProcess.pid, 'SIGKILL'); } catch (e) { }
        }
    }

    log("\n---------------------------------------------------", colors.cyan);
    if (allPassed) {
        log("✅✅ SYSTEM INTEGRITY VERIFIED - READY FOR DEV ✅✅", colors.green + colors.bold);
        process.exit(0);
    } else {
        log("❌❌ SYSTEM CHECKS FAILED - DO NOT START DEV ❌❌", colors.red + colors.bold);
        process.exit(1);
    }
}

runPreflight();
