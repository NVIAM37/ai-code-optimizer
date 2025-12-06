import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { spawn, exec } from 'child_process';
import { optimizeCode as optimizeGemini, listModels as listGeminiModels, chat as chatGemini } from './ai_engine/gemini.js';
import { optimizeCodeGroq, listModelsGroq, chatGroq } from './ai_engine/groq.js';
import { isSafe } from './utils/safety.js';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';

// Database and Auth
import connectDB from './config/database.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/user.js';
import authMiddleware, { optionalAuth } from './middleware/auth.js';
import ExecutionHistory from './models/ExecutionHistory.js';
import Chat from './models/Chat.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_ROOT = process.env.DATA_ROOT || path.join(__dirname, 'data');

const app = express();
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}));
app.use(express.json({ charset: 'utf-8' }));
app.use(express.urlencoded({ extended: true, charset: 'utf-8' }));

// Set UTF-8 content-type for all responses
app.use((req, res, next) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    next();
});

// Create HTTP server to attach WebSocket
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Session configuration
import session from 'express-session';
import JsonStore from './config/json_session_store.js';
import passport from './config/passport.js';

import crypto from 'crypto';

// Securely handle Session Secret
let SESSION_SECRET = process.env.SESSION_SECRET;
if (!SESSION_SECRET) {
    console.warn('⚠️  WARNING: SESSION_SECRET not set. Generating a random secret for this session.');
    SESSION_SECRET = crypto.randomBytes(64).toString('hex');
}

app.use(session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: new JsonStore(),
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

app.use(passport.initialize());
app.use(passport.session());




import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// node-pty is optional and not needed for code execution
// Using mock implementation to avoid build/native module issues
const pty = {
    spawn: () => ({
        onData: () => { },
        write: () => { },
        resize: () => { },
        kill: () => { },
        on: () => { }
    })
};

// WebSocket Connection Handler
wss.on('connection', (ws) => {
    // Don't broadcast system messages
    const shell = process.env.SHELL || 'zsh';
    let ptyProcess;
    try {
        ptyProcess = pty.spawn(shell, [], {
            name: 'xterm-color',
            cols: 80,
            rows: 24,
            cwd: process.env.HOME,
            env: process.env
        });
    } catch (err) {
        // Silent fallback - PTY not needed for code execution
        ptyProcess = ({
            onData: () => { },
            write: () => { },
            resize: () => { },
            kill: () => { },
            on: () => { }
        });
    }

    // Pipe PTY output to WebSocket (not used for optimization)
    ptyProcess.onData((data) => {
        if (ws.readyState === 1) {
            // Don't send, we're not using interactive terminal
        }
    });

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            if (data.type === 'input') {
                ptyProcess.write(data.data);
            } else if (data.type === 'resize') {
                ptyProcess.resize(data.cols, data.rows);
            }
        } catch (e) {
            // Silent
        }
    });

    ws.on('close', () => {
        ptyProcess.kill();
    });
});

// Keep original console functions for backend logging (no broadcasting)
const originalLog = console.log;
const originalError = console.error;

// API Endpoint to List Models
app.get('/api/models/:provider', async (req, res) => {
    const { provider } = req.params;
    const apiKey = req.headers['x-api-key'];

    try {
        let models = [];
        if (provider === 'gemini') {
            models = await listGeminiModels(apiKey);
        } else if (provider === 'groq') {
            models = await listModelsGroq(apiKey);
        } else {
            return res.status(400).json({ error: "Invalid provider" });
        }
        res.json({ models });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Helper to check toolchain availability
const checkToolchain = async (language) => {
    const checkCmd = (cmd) => {
        return new Promise((resolve) => {
            exec(cmd, (error, stdout, stderr) => {
                if (error) {
                    resolve(null);
                } else {
                    resolve(stdout.trim());
                }
            });
        });
    };

    if (language === 'python') {
        // Try multiple python commands
        const commands = ['python3', 'python', 'py'];
        for (const cmd of commands) {
            const version = await checkCmd(`${cmd} --version`);
            if (version) {
                return { available: true, version, command: cmd };
            }
        }
        return { available: false, error: "Python not found. Please install Python." };
    } else if (language === 'javascript') {
        const version = await checkCmd('node --version');
        if (version) return { available: true, version, command: 'node' };
        return { available: false, error: "Node.js not found." };
    } else if (language === 'rust') {
        const version = await checkCmd('rustc --version');
        if (version) return { available: true, version, command: 'rustc' };
        return { available: false, error: "Rust not found. Please install Rust." };
    } else if (language === 'c') {
        const version = await checkCmd('gcc --version');
        if (version) return { available: true, version: version.split('\n')[0], command: 'gcc' };
        return { available: false, error: "GCC not found. Please install GCC." };
    } else if (language === 'cpp') {
        const version = await checkCmd('g++ --version');
        if (version) return { available: true, version: version.split('\n')[0], command: 'g++' };
        return { available: false, error: "G++ not found. Please install G++." };
    } else if (language === 'java') {
        const version = await checkCmd('java -version 2>&1'); // java -version outputs to stderr
        const compilerVersion = await checkCmd('javac -version 2>&1');
        if (version && compilerVersion) {
            return { available: true, version: version.split('\n')[0], command: 'java' };
        }
        return { available: false, error: "Java/Javac not found. Please install JDK." };
    }

    return { available: false, error: `Unknown language: ${language}` };
};

// Helper to compile Rust code
const compileRust = (sourcePath, outputPath) => {
    return new Promise((resolve, reject) => {
        exec(`rustc "${sourcePath}" -o "${outputPath}"`, (error, stdout, stderr) => {
            if (error) {
                reject({ message: "Compilation Failed", stderr: stderr || error.message });
            } else {
                resolve(stdout);
            }
        });
    });
};

// Helper to run supervisor
const runSupervisor = async (cmd, context = 'original') => {
    // Detect python for supervisor itself
    let pythonCmd = 'python';
    const pythonCheck = await checkToolchain('python');
    if (pythonCheck.available) {
        pythonCmd = pythonCheck.command;
    } else {
        return { error: "Supervisor Failed", stderr: "Python not found to run supervisor." };
    }

    return new Promise((resolve) => {
        // supervisor.py is in src/executors/supervisor.py relative to project root
        // We are in src/server.js
        const supervisorPath = path.join(__dirname, 'executors/supervisor.py');
        originalLog(`Running supervisor with command: ${cmd} (using ${pythonCmd})`);

        const py = spawn(pythonCmd, [supervisorPath, cmd]);

        py.on('error', (err) => {
            originalError("Failed to spawn supervisor:", err);
            resolve({ error: "Spawn Failed", stderr: err.message });
        });

        let data = "";
        let errorData = "";

        py.stdout.on('data', (chunk) => {
            data += chunk;
            const output = chunk.toString().trim();
            if (output && !output.includes('---METRICS')) {
                // Send actual execution output to frontend as 'execution-output'
                wss.clients.forEach(client => {
                    if (client.readyState === 1) {
                        if (context === 'optimized') {
                            client.send(JSON.stringify({
                                type: 'optimized-output',
                                message: output,
                                timestamp: new Date().toLocaleTimeString()
                            }));
                        } else {
                            client.send(JSON.stringify({
                                type: 'original-output',
                                message: output,
                                timestamp: new Date().toLocaleTimeString()
                            }));
                        }
                    }
                });
                // Also log to backend console
                originalLog(`[EXECUTION OUTPUT ${context.toUpperCase()}] ${output}`);
            }
        });
        py.stderr.on('data', (chunk) => {
            errorData += chunk;
            const err = chunk.toString().trim();
            if (err && !err.includes('UserWarning')) {
                // Send execution errors to frontend as 'execution-output' with error type
                wss.clients.forEach(client => {
                    if (client.readyState === 1) {
                        client.send(JSON.stringify({
                            type: context === 'optimized' ? 'optimized-output' : 'original-output',
                            message: err,
                            level: 'error',
                            timestamp: new Date().toLocaleTimeString()
                        }));
                    }
                });
                originalError(`[EXECUTION ERROR ${context.toUpperCase()}] ${err}`);
            }
        });

        const timeout = setTimeout(() => {
            originalError("Supervisor timed out! Killing process...");
            py.kill();
            resolve({ error: "Execution Timed Out", stderr: "Process took too long to execute." });
        }, 30000); // 30 seconds timeout

        py.on('close', (code) => {
            clearTimeout(timeout);
            console.log(`Supervisor exited with code ${code}`);
            if (code !== 0) {
                console.error(`Supervisor stderr: ${errorData}`);
            }
            try {
                const parts = data.split("---METRICS_START---");
                if (parts.length > 1) {
                    const json = parts[1].split("---METRICS_END---")[0];
                    resolve(JSON.parse(json));
                } else {
                    resolve({ error: "Runtime Error", raw: data, stderr: errorData });
                }
            } catch (e) {
                console.error("JSON Parse Error:", e);
                resolve({ error: "Metrics Parse Error", raw: data, stderr: errorData });
            }
        });
    });
};

// Helper to get system info from supervisor
let cachedSystemInfo = null;
const getSystemInfo = async () => {
    if (cachedSystemInfo) return cachedSystemInfo;

    // Detect python for supervisor itself
    let pythonCmd = 'python';
    const pythonCheck = await checkToolchain('python');
    if (pythonCheck.available) {
        pythonCmd = pythonCheck.command;
    } else {
        return { os: "Unknown", cpu_count: "Unknown", ram_total_gb: "Unknown", gpu_available: false };
    }

    return new Promise((resolve) => {
        const supervisorPath = path.join(__dirname, 'executors/supervisor.py');
        const py = spawn(pythonCmd, [supervisorPath, 'sysinfo']);

        let data = "";
        py.stdout.on('data', (chunk) => data += chunk);

        py.on('close', (code) => {
            if (code === 0) {
                try {
                    cachedSystemInfo = JSON.parse(data.trim());
                    resolve(cachedSystemInfo);
                } catch (e) {
                    resolve({ os: "Unknown", error: "Parse Error" });
                }
            } else {
                resolve({ os: "Unknown", error: "Supervisor Failed" });
            }
        });
    });
};
// Health Check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});

// =======================
// MAIN PROCESSING ENDPOINT
// =======================
app.post('/process', optionalAuth, async (req, res) => {
    const {
        code,
        language,
        intensity,
        provider,
        apiKey,
        model,
        paradigm,          // New
        optimizationType,  // New
        useLLVM,           // New
        projectContext,    // New
        action             // New: 'run', 'optimize', 'full' (default)
    } = req.body;
    const systemLogs = [];

    // Determine what to do
    const shouldRunOriginal = !action || action === 'full' || action === 'run';
    const shouldOptimize = !action || action === 'full' || action === 'optimize';

    // Get effective API key - prioritize request body, then fetch fresh from DB
    let effectiveApiKey = apiKey;

    if (req.user && !apiKey) {
        // Fetch FRESH user data from database to get latest API keys
        try {
            const freshUser = await User.findById(req.user._id);
            if (freshUser) {
                if (provider === 'gemini') {
                    effectiveApiKey = freshUser.apiKeys?.gemini;
                } else if (provider === 'groq') {
                    effectiveApiKey = freshUser.apiKeys?.groq;
                }
            }
        } catch (err) {
            console.error(`[DB] Error fetching fresh user:`, err);
        }
    }

    // Trim and validate API key
    if (effectiveApiKey) {
        effectiveApiKey = effectiveApiKey.trim();

        // Validate Gemini API key format (Warning only)
        if (provider === 'gemini') {
            if (!effectiveApiKey.startsWith('AIza') || effectiveApiKey.length < 35) {
                systemLogs.push({ type: 'warning', message: `API Key format looks unusual, but we'll try to use it.` });
            }
        }
    } else {
        // Only require API key if we are optimizing
        if (shouldOptimize) {
            console.error(`[API KEY] No API key available for provider: ${provider}`);
            systemLogs.push({ type: 'error', message: `No API key found for ${provider}. Please add your API key in Settings.` });
            return res.status(400).json({
                error: `Missing API Key`,
                message: `Please add your ${provider === 'gemini' ? 'Gemini' : 'Groq'} API key in the Settings panel.`,
                systemLogs
            });
        }
    }

    const timestamp = Date.now();
    const fileExt = language === 'rust' ? 'rs' : language === 'python' ? 'py' : 'js';
    const tempDir = path.join(__dirname, 'temp_execution');

    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
    }

    if (!code) return res.status(400).json({ error: "No code provided" });
    if (!isSafe(code)) return res.status(400).json({ error: "Unsafe Code Detected" });

    try {
        // 1. Check Toolchain
        const toolchain = await checkToolchain(language);
        if (!toolchain.available) {
            systemLogs.push({ type: 'error', message: toolchain.error });

            // Provide helpful installation links
            let helpMessage = '';
            if (language === 'rust') {
                helpMessage = 'Install Rust from https://rustup.rs';
            } else if (language === 'javascript') {
                helpMessage = 'Node.js is required but not found';
            } else if (language === 'python') {
                helpMessage = 'Python is required but not found';
            }

            systemLogs.push({ type: 'info', message: helpMessage });
            return res.json({
                error: `${language} toolchain not available. ${helpMessage}`,
                systemLogs,
                canOptimizeOnly: true // Flag for optimization without execution
            });
        }
        systemLogs.push({ type: 'success', message: `Toolchain found: ${toolchain.version}` });

        // Setup paths
        const tempDir = path.join(process.cwd(), 'temp_execution');
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

        const timestamp = Date.now();
        let fileExt = 'js';
        if (language === 'python') fileExt = 'py';
        else if (language === 'rust') fileExt = 'rs';
        else if (language === 'c') fileExt = 'c';
        else if (language === 'cpp') fileExt = 'cpp';
        else if (language === 'java') fileExt = 'java';

        const fileName = language === 'java' ? `Main_${timestamp}.${fileExt}` : `temp_${timestamp}.${fileExt}`;
        const filePath = path.join(tempDir, fileName);

        // For Java, we need to ensure the class name matches the file name
        let finalCode = code;
        if (language === 'java') {
            // Simple regex to replace public class Name with public class Main_timestamp
            // This is a basic heuristic, might need more robustness
            finalCode = code.replace(/public\s+class\s+\w+/g, `public class Main_${timestamp}`);
        }

        fs.writeFileSync(filePath, finalCode);

        // 2. Prepare Run Command (Compile if needed)
        let runCmd = "";

        if (language === 'rust') {
            const binaryName = `temp_${timestamp}`;
            const binaryPath = path.join(tempDir, binaryName);
            systemLogs.push({ type: 'info', message: "Compiling original Rust code..." });
            try {
                await compileRust(filePath, binaryPath);
                systemLogs.push({ type: 'success', message: "Compilation successful" });
                runCmd = binaryPath;
            } catch (compError) {
                systemLogs.push({ type: 'error', message: `Compilation failed: ${compError.stderr}` });
                return res.json({ error: "Compilation Failed", systemLogs, details: compError.stderr });
            }
        } else if (language === 'c') {
            const binaryName = `temp_${timestamp}`;
            const binaryPath = path.join(tempDir, binaryName);
            systemLogs.push({ type: 'info', message: "Compiling original C code..." });
            try {
                await new Promise((resolve, reject) => {
                    exec(`gcc "${filePath}" -o "${binaryPath}"`, (err, stdout, stderr) => {
                        if (err) reject({ stderr: stderr || err.message });
                        else resolve();
                    });
                });
                systemLogs.push({ type: 'success', message: "Compilation successful" });
                runCmd = binaryPath;
            } catch (compError) {
                systemLogs.push({ type: 'error', message: `Compilation failed: ${compError.stderr}` });
                return res.json({ error: "Compilation Failed", systemLogs, details: compError.stderr });
            }
        } else if (language === 'cpp') {
            const binaryName = `temp_${timestamp}`;
            const binaryPath = path.join(tempDir, binaryName);
            systemLogs.push({ type: 'info', message: "Compiling original C++ code..." });
            try {
                await new Promise((resolve, reject) => {
                    exec(`g++ "${filePath}" -o "${binaryPath}"`, (err, stdout, stderr) => {
                        if (err) reject({ stderr: stderr || err.message });
                        else resolve();
                    });
                });
                systemLogs.push({ type: 'success', message: "Compilation successful" });
                runCmd = binaryPath;
            } catch (compError) {
                systemLogs.push({ type: 'error', message: `Compilation failed: ${compError.stderr}` });
                return res.json({ error: "Compilation Failed", systemLogs, details: compError.stderr });
            }
        } else if (language === 'java') {
            systemLogs.push({ type: 'info', message: "Compiling original Java code..." });
            try {
                await new Promise((resolve, reject) => {
                    exec(`javac "${filePath}"`, (err, stdout, stderr) => {
                        if (err) reject({ stderr: stderr || err.message });
                        else resolve();
                    });
                });
                systemLogs.push({ type: 'success', message: "Compilation successful" });
                // Run java with classpath to temp dir
                runCmd = `java -cp "${tempDir}" Main_${timestamp}`;
            } catch (compError) {
                systemLogs.push({ type: 'error', message: `Compilation failed: ${compError.stderr}` });
                return res.json({ error: "Compilation Failed", systemLogs, details: compError.stderr });
            }
        } else {
            // Use the detected command from checkToolchain
            runCmd = `${toolchain.command} ${filePath}`;
        }

        // 1. Baseline Execution (CRITICAL: Establish Fixed Baseline)
        // We execute the original code FIRST to get the empirical baseline.
        // This ensures we are comparing against the CURRENT state of the code.
        let originalMetrics = null;
        // shouldRunOriginal is determined by action type, but for optimization we MUST have a baseline.
        // If action is 'optimize', we force running original to get baseline metrics for the AI.
        const forceBaseline = shouldOptimize;

        if (shouldRunOriginal || forceBaseline) {
            systemLogs.push({ type: 'info', message: "⏱️ Establishing Baseline Metrics..." });
            originalMetrics = await runSupervisor(runCmd, 'original');

            if (originalMetrics.error) {
                systemLogs.push({ type: 'error', message: `Original code execution failed: ${originalMetrics.stderr}` });
                // If baseline fails, we cannot safely optimize based on metrics.
                // We could abort or proceed blindly. Let's proceed but warn.
            } else {
                systemLogs.push({ type: 'success', message: "✅ Baseline Established" });
            }
        }

        // Send original code metrics via WebSocket if we ran it
        if (originalMetrics && originalMetrics.metrics) {
            wss.clients.forEach(client => {
                if (client.readyState === 1) {
                    client.send(JSON.stringify({
                        type: 'metrics-detail',
                        context: 'original',
                        data: {
                            duration: originalMetrics.metrics.duration,
                            energy: originalMetrics.metrics.energy_joules,
                            memory: originalMetrics.metrics.ram_peak,
                            cpu: originalMetrics.metrics.cpu_peak,
                            co2: originalMetrics.metrics.co2_emissions
                        },
                        timestamp: new Date().toLocaleTimeString()
                    }));
                }
            });
        }

        // 2. AI Optimization
        let optimizedCode = "";
        let aiMetadata = {};
        let optimizedMetrics = {};

        if (shouldOptimize) {
            systemLogs.push({ type: 'info', message: `Optimizing code with ${provider || 'gemini'}...` });

            try {
                // Fetch System Info
                const systemInfo = await getSystemInfo();

                let aiResult;
                const aiOptions = {
                    paradigm,
                    optimizationType,
                    useLLVM,
                    projectContext,
                    systemInfo,
                    originalMetrics: originalMetrics ? originalMetrics.metrics : null // Pass baseline metrics
                };

                if (provider === 'groq') {
                    aiResult = await optimizeCodeGroq(code, language, intensity, effectiveApiKey, model, aiOptions);
                } else {
                    aiResult = await optimizeGemini(code, language, intensity, effectiveApiKey, model, aiOptions);
                }

                if (aiResult.status === 'no_optimization_needed' || !aiResult.optimized) {
                    systemLogs.push({ type: 'info', message: "AI determined code is already optimized." });
                    if (aiResult.explanation) systemLogs.push({ type: 'info', message: `Reason: ${aiResult.explanation}` });

                    // If no optimization needed, we can just return the original metrics?
                    // Or maybe we should just say "Optimized Code" is the same as Original?
                    // Let's treat it as if optimized code = original code for comparison
                    optimizedCode = code;
                    aiMetadata = aiResult;
                } else {
                    optimizedCode = aiResult.optimized_code;
                    aiMetadata = aiResult;
                    systemLogs.push({ type: 'success', message: "AI optimization completed" });
                }

            } catch (aiError) {
                console.error(`[AI] ❌ Error: ${aiError.message}`);

                // Handle rate limit specifically
                if (aiError.message === 'RATE_LIMIT_EXCEEDED') {
                    systemLogs.push({ type: 'error', message: 'API rate limit exceeded' });
                    return res.status(429).json({
                        error: 'RATE_LIMIT_EXCEEDED',
                        message: 'Your API key has reached its rate limit. Please wait or use a different key.',
                        systemLogs
                    });
                }

                systemLogs.push({ type: 'error', message: `AI Optimization failed: ${aiError.message}` });
                // Return the actual error message so the frontend can show it
                return res.json({ error: aiError.message || "AI Optimization Failed", systemLogs, details: aiError.message });
            }

            // 5. Run Optimized Code
            const optFileName = language === 'java' ? `Main_${timestamp}_opt.${fileExt}` : `temp_${timestamp}_opt.${fileExt}`;
            const optFilePath = path.join(tempDir, optFileName);

            let finalOptimizedCode = optimizedCode;
            if (language === 'java') {
                finalOptimizedCode = optimizedCode.replace(/public\s+class\s+\w+/g, `public class Main_${timestamp}_opt`);
            }

            fs.writeFileSync(optFilePath, finalOptimizedCode);

            let optRunCmd = "";
            if (language === 'rust') {
                const optBinaryName = `temp_${timestamp}_opt`;
                const optBinaryPath = path.join(tempDir, optBinaryName);

                systemLogs.push({ type: 'info', message: "Compiling optimized Rust code..." });
                systemLogs.push({ type: 'debug', message: `[CMD] rustc "${optFilePath}" -o "${optBinaryPath}"` });

                try {
                    await compileRust(optFilePath, optBinaryPath);
                    systemLogs.push({ type: 'success', message: "Compilation successful" });
                    systemLogs.push({ type: 'debug', message: `[FILE] Binary created: ${optBinaryPath}` });
                    optRunCmd = optBinaryPath;
                } catch (compError) {
                    systemLogs.push({ type: 'error', message: `Optimized code compilation failed: ${compError.stderr}` });
                    systemLogs.push({ type: 'debug', message: `[STDERR] ${compError.stderr}` });
                    // Return partial results if optimized code fails to compile
                    return res.json({
                        original: originalMetrics,
                        optimized: { error: "Compilation Failed", code: optimizedCode },
                        systemLogs
                    });
                }
            } else if (language === 'c') {
                const optBinaryName = `temp_${timestamp}_opt`;
                const optBinaryPath = path.join(tempDir, optBinaryName);
                systemLogs.push({ type: 'info', message: "Compiling optimized C code..." });
                try {
                    await new Promise((resolve, reject) => {
                        exec(`gcc "${optFilePath}" -o "${optBinaryPath}"`, (err, stdout, stderr) => {
                            if (err) reject({ stderr: stderr || err.message });
                            else resolve();
                        });
                    });
                    systemLogs.push({ type: 'success', message: "Compilation successful" });
                    optRunCmd = optBinaryPath;
                } catch (compError) {
                    systemLogs.push({ type: 'error', message: `Optimized code compilation failed: ${compError.stderr}` });
                    return res.json({
                        original: originalMetrics,
                        optimized: { error: "Compilation Failed", code: optimizedCode },
                        systemLogs
                    });
                }
            } else if (language === 'cpp') {
                const optBinaryName = `temp_${timestamp}_opt`;
                const optBinaryPath = path.join(tempDir, optBinaryName);
                systemLogs.push({ type: 'info', message: "Compiling optimized C++ code..." });
                try {
                    await new Promise((resolve, reject) => {
                        exec(`g++ "${optFilePath}" -o "${optBinaryPath}"`, (err, stdout, stderr) => {
                            if (err) reject({ stderr: stderr || err.message });
                            else resolve();
                        });
                    });
                    systemLogs.push({ type: 'success', message: "Compilation successful" });
                    optRunCmd = optBinaryPath;
                } catch (compError) {
                    systemLogs.push({ type: 'error', message: `Optimized code compilation failed: ${compError.stderr}` });
                    return res.json({
                        original: originalMetrics,
                        optimized: { error: "Compilation Failed", code: optimizedCode },
                        systemLogs
                    });
                }
            } else if (language === 'java') {
                systemLogs.push({ type: 'info', message: "Compiling optimized Java code..." });
                try {
                    await new Promise((resolve, reject) => {
                        exec(`javac "${optFilePath}"`, (err, stdout, stderr) => {
                            if (err) reject({ stderr: stderr || err.message });
                            else resolve();
                        });
                    });
                    systemLogs.push({ type: 'success', message: "Compilation successful" });
                    optRunCmd = `java -cp "${tempDir}" Main_${timestamp}_opt`;
                } catch (compError) {
                    systemLogs.push({ type: 'error', message: `Optimized code compilation failed: ${compError.stderr}` });
                    return res.json({
                        original: originalMetrics,
                        optimized: { error: "Compilation Failed", code: optimizedCode },
                        systemLogs
                    });
                }
            } else {
                // Use the detected command from checkToolchain
                optRunCmd = `${toolchain.command} ${optFilePath}`;
            }
            systemLogs.push({ type: 'debug', message: `[CMD] ${optRunCmd}` });

            systemLogs.push({ type: 'info', message: "Running optimized code..." });


            optimizedMetrics = await runSupervisor(optRunCmd, 'optimized');

            if (optimizedMetrics.metrics) {
                systemLogs.push({ type: 'debug', message: `[METRICS] Duration: ${optimizedMetrics.metrics.duration}ms` });

                // Calculate improvements (only if we have original metrics)
                let timeImprovement = 0, energySaved = 0, memorySaved = 0;

                if (originalMetrics.metrics) {
                    timeImprovement = ((originalMetrics.metrics.duration - optimizedMetrics.metrics.duration) / originalMetrics.metrics.duration * 100).toFixed(1);
                    energySaved = ((originalMetrics.metrics.energy_joules - optimizedMetrics.metrics.energy_joules) / originalMetrics.metrics.energy_joules * 100).toFixed(1);
                    memorySaved = ((originalMetrics.metrics.ram_peak - optimizedMetrics.metrics.ram_peak) / originalMetrics.metrics.ram_peak * 100).toFixed(1);
                }

                // Send detailed metrics to terminals
                wss.clients.forEach(client => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({
                            type: 'metrics-detail',
                            context: 'optimized',
                            data: {
                                duration: optimizedMetrics.metrics.duration,
                                energy: optimizedMetrics.metrics.energy_joules,
                                memory: optimizedMetrics.metrics.ram_peak,
                                cpu: optimizedMetrics.metrics.cpu_peak,
                                co2: optimizedMetrics.metrics.co2_emissions,
                                improvements: {
                                    time: timeImprovement,
                                    energy: energySaved,
                                    memory: memorySaved
                                }
                            }
                        }));
                    }
                });

                // Log improvements to backend console
                const timeMsg = Number(timeImprovement) >= 0 ? `${timeImprovement}% faster` : `${Math.abs(Number(timeImprovement))}% slower`;
                const energyMsg = Number(energySaved) >= 0 ? `${energySaved}% less energy` : `${Math.abs(Number(energySaved))}% more energy`;
                const memoryMsg = Number(memorySaved) >= 0 ? `${memorySaved}% less memory` : `${Math.abs(Number(memorySaved))}% more memory`;

                systemLogs.push({ type: 'success', message: `📊 Improvements:` });

                // --- DbC Post-condition Check & Fallback Logic ---
                // --- DbC Post-condition Check & Fallback Logic ---
                // User requested to REMOVE the 3% threshold check.
                // We now show results regardless of performance.

                // --- NEW MANDATORY LOG STRUCTURE ---
                systemLogs.push({ type: 'info', message: `ℹ️ ⏱️ BASELINE Time (Human Code): ${originalMetrics.metrics.duration}ms` });
                systemLogs.push({ type: 'info', message: `ℹ️ 🔋 BASELINE Energy (Human Code): ${originalMetrics.metrics.energy_joules.toFixed(6)}J` });
                systemLogs.push({ type: 'info', message: `---` });
                systemLogs.push({ type: 'success', message: `✅⚡ OPTIMIZED Time: ${optimizedMetrics.metrics.duration}ms` });
                systemLogs.push({ type: 'success', message: `✅⚡ OPTIMIZED Energy: ${optimizedMetrics.metrics.energy_joules.toFixed(6)}J` });
                systemLogs.push({ type: 'info', message: `---` });

                // Additional Metrics
                systemLogs.push({ type: 'info', message: `   💾 Memory: ${originalMetrics.metrics.ram_peak.toFixed(2)}MB ➜ ${optimizedMetrics.metrics.ram_peak.toFixed(2)}MB` });
                systemLogs.push({ type: 'info', message: `   🖥️  Max CPU Usage: ${optimizedMetrics.metrics.cpu_peak}%` });

                systemLogs.push({ type: 'success', message: `📊 Improvements:` });
                systemLogs.push({ type: Number(timeImprovement) >= 0 ? 'success' : 'warning', message: `   🚀 ${timeMsg}` });
                systemLogs.push({ type: Number(energySaved) >= 0 ? 'success' : 'warning', message: `   ⚡ ${energyMsg}` });
            }
        } else {
            systemLogs.push({ type: 'info', message: "Skipping optimization (Action: Run Only)" });
        }

        // Cleanup
        // setTimeout(() => {
        //     [filePath, optFilePath, runCmd, optRunCmd].forEach(f => {
        //         if (fs.existsSync(f) && !f.includes('python3') && !f.includes('node')) fs.unlinkSync(f);
        //     });
        // }, 1000);

        // Save to execution history if user is logged in
        if (req.user) {
            try {
                const performanceGain = originalMetrics.metrics && optimizedMetrics.metrics
                    ? ((originalMetrics.metrics.duration - optimizedMetrics.metrics.duration) / originalMetrics.metrics.duration) * 100
                    : 0;

                const historyRecord = {
                    userId: req.user._id,
                    language,
                    originalCode: code,
                    optimizedCode,
                    metrics: {
                        original: originalMetrics.metrics || {},
                        optimized: optimizedMetrics.metrics || {}
                    },
                    provider,
                    model: model || '',
                    intensity,
                    performanceGain: Math.round(performanceGain * 10) / 10,
                    timestamp: new Date()
                };

                await ExecutionHistory.create(historyRecord);
            } catch (historyError) {
                console.error('Failed to save execution history:', historyError);
                // Don't fail the request if history saving fails
            }
        }

        // Construct response based on action
        const response = {
            aiMetadata,
            systemLogs
        };

        if (shouldRunOriginal) {
            response.original = originalMetrics;
        }

        if (shouldOptimize) {
            response.optimized = { ...optimizedMetrics, code: optimizedCode };
        }

        res.json(response);
    } catch (error) {
        console.error("Server Error:", error);
        const errorMessage = error.message || String(error);
        systemLogs.push({ type: 'error', message: `Internal Server Error: ${errorMessage}` });
        systemLogs.push({ type: 'debug', message: `[STACK] ${error.stack}` });
        res.status(500).json({ error: "Internal Server Error", details: errorMessage, systemLogs });
    }
});

app.get('/api/files/content', (req, res) => {
    try {
        const filePath = getSafePath(req.query.path);
        if (fs.statSync(filePath).isDirectory()) {
            return res.status(400).json({ error: "Cannot read directory content" });
        }
        const content = fs.readFileSync(filePath, 'utf-8');
        res.json({ content });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Write File
app.post('/api/files', (req, res) => {
    try {
        const { path: reqPath, content } = req.body;
        const filePath = getSafePath(reqPath);
        fs.writeFileSync(filePath, content);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create Directory
app.post('/api/files/mkdir', (req, res) => {
    try {
        const dirPath = getSafePath(req.body.path);
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete File/Directory
app.delete('/api/files', (req, res) => {
    try {
        const targetPath = getSafePath(req.query.path);
        fs.rmSync(targetPath, { recursive: true, force: true });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Enhanced File Explorer API
app.get('/api/files', authMiddleware, async (req, res) => {
    try {
        const requestedPath = req.query.path || '';
        const userDataPath = path.join(DATA_ROOT, 'users', req.user._id.toString());

        // Ensure user data directory exists
        if (!fs.existsSync(userDataPath)) {
            fs.mkdirSync(userDataPath, { recursive: true });
        }

        const targetPath = requestedPath
            ? path.join(userDataPath, requestedPath)
            : userDataPath;

        // Security check: prevent directory traversal
        if (!targetPath.startsWith(userDataPath)) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const files = [];
        const directories = [];

        // 1. Virtual 'Chats' Directory (only at root)
        if (requestedPath === '') {
            directories.push({
                name: 'Chats',
                path: 'Chats',
                type: 'directory',
                isVirtual: true
            });
        }

        // 2. Handle Virtual 'Chats' Directory Content
        if (requestedPath === 'Chats') {
            const chatsDir = path.join(userDataPath, 'chats');
            if (fs.existsSync(chatsDir)) {
                const chatFiles = fs.readdirSync(chatsDir).filter(f => f.endsWith('.json'));
                chatFiles.forEach(file => {
                    try {
                        const content = JSON.parse(fs.readFileSync(path.join(chatsDir, file), 'utf-8'));
                        const lastMsg = content.messages && content.messages.length > 0
                            ? content.messages[content.messages.length - 1].content
                            : 'No messages';

                        files.push({
                            name: file,
                            displayName: content.title,
                            path: `Chats/${content._id}`, // Virtual path for frontend routing
                            type: 'file',
                            size: content.messages.length,
                            modified: content.updatedAt,
                            isVirtual: true,
                            id: content._id,
                            preview: lastMsg.substring(0, 40) + (lastMsg.length > 40 ? '...' : '')
                        });
                    } catch (e) {
                        console.error(`Error reading chat file ${file}:`, e);
                    }
                });
            }
            // Sort by modified date desc
            files.sort((a, b) => new Date(b.modified) - new Date(a.modified));
            return res.json({ files, directories, currentPath: requestedPath });
        }

        // 3. Handle Virtual 'Code' Directory (Generated Code)
        if (requestedPath === '') {
            directories.push({
                name: 'Generated Code',
                path: 'Code',
                type: 'directory',
                isVirtual: true
            });
        }

        if (requestedPath === 'Code') {
            const codeDir = path.join(userDataPath, 'code');
            if (fs.existsSync(codeDir)) {
                const codeFiles = fs.readdirSync(codeDir);
                codeFiles.forEach(file => {
                    const stats = fs.statSync(path.join(codeDir, file));
                    files.push({
                        name: file,
                        path: `Code/${file}`, // Relative path for file reading
                        type: 'file',
                        size: stats.size,
                        modified: stats.mtime
                    });
                });
            }
            // Sort by modified date desc
            files.sort((a, b) => new Date(b.modified) - new Date(a.modified));
            return res.json({ files, directories, currentPath: requestedPath });
        }

        // 3. Physical Files
        if (fs.existsSync(targetPath)) {
            const items = fs.readdirSync(targetPath);
            items.forEach(item => {
                const itemPath = path.join(targetPath, item);
                const stats = fs.statSync(itemPath);
                const relativePath = path.relative(userDataPath, itemPath);

                if (stats.isDirectory()) {
                    directories.push({
                        name: item,
                        path: relativePath,
                        type: 'directory'
                    });
                } else {
                    files.push({
                        name: item,
                        path: relativePath,
                        type: 'file',
                        size: stats.size,
                        modified: stats.mtime
                    });
                }
            });
        }

        res.json({ files, directories, currentPath: requestedPath });
    } catch (error) {
        console.error('File listing error:', error);
        res.status(500).json({ error: error.message });
    }
});

// TEST ENDPOINT - Check if user is authenticated
app.get('/api/test-auth', optionalAuth, (req, res) => {
    if (req.user) {
        res.json({
            authenticated: true,
            user: {
                id: req.user._id,
                email: req.user.email
            }
        });
    } else {
        res.json({ authenticated: false, message: 'Not logged in' });
    }
});

// Chat Endpoint
app.post('/chat', optionalAuth, async (req, res) => {
    const { message, history, provider, apiKey, model, chatId } = req.body;

    if (!apiKey) {
        return res.status(400).json({ error: "API Key is required. Please add your API key in settings." });
    }

    if (!message?.trim()) {
        return res.status(400).json({ error: "Message cannot be empty." });
    }

    // Validate Model
    let selectedModel = model;
    if (!selectedModel || selectedModel.trim() === "") {
        if (req.user && req.user.preferences) {
            // Prioritize chatModel, fallback to generic model
            selectedModel = req.user.preferences.chatModel || req.user.preferences.model;
            console.log(`[CHAT] Using user preference model: ${selectedModel}`);
        } else {
            selectedModel = "gemini-flash-latest"; // Safe default
            console.log(`[CHAT] Model not provided. Using default: ${selectedModel}`);
        }
    }

    console.log(`[CHAT] Request: provider=${provider}, model=${selectedModel}, chatId=${chatId || 'new'}`);

    try {
        let reply;
        const startTime = Date.now();

        if (provider === 'gemini') {
            reply = await chatGemini(message, history || [], apiKey, selectedModel);
        } else if (provider === 'groq') {
            reply = await chatGroq(message, history || [], apiKey, selectedModel);
        } else {
            return res.status(400).json({ error: `Invalid provider "${provider}". Please select Gemini or Groq.` });
        }

        const endTime = Date.now();
        const latency = endTime - startTime;

        console.log(`[CHAT] ✅ Success`);

        // Save Chat History if User is Logged In
        let savedChatId = chatId;
        if (req.user) {
            console.log(`[CHAT SAVE] User authenticated: ${req.user.email || req.user._id}`);
            try {
                const userDir = path.join(DATA_ROOT, 'users', req.user._id.toString());
                const chatsDir = path.join(userDir, 'chats');
                const codeDir = path.join(userDir, 'code');

                console.log(`[CHAT SAVE] Creating directories: ${chatsDir}`);

                // Ensure directories exist
                if (!fs.existsSync(chatsDir)) fs.mkdirSync(chatsDir, { recursive: true });
                if (!fs.existsSync(codeDir)) fs.mkdirSync(codeDir, { recursive: true });

                let chatData = {
                    _id: chatId || new Date().getTime().toString(),
                    userId: req.user._id,
                    title: 'New Chat',
                    messages: [],
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    model: selectedModel,
                    provider: provider
                };

                const chatFilePath = path.join(chatsDir, `${chatData._id}.json`);

                if (chatId && fs.existsSync(chatFilePath)) {
                    // Load existing chat
                    const existingData = JSON.parse(fs.readFileSync(chatFilePath, 'utf-8'));
                    chatData = { ...existingData, updatedAt: new Date() };
                } else if (!chatId) {
                    // Generate title for new chat
                    chatData.title = message.substring(0, 30) + (message.length > 30 ? '...' : '');
                    savedChatId = chatData._id;
                }

                const newMessage = { role: 'user', content: message, timestamp: new Date() };
                const replyMessage = { role: 'model', content: reply, timestamp: new Date() };

                chatData.messages.push(newMessage, replyMessage);

                // --- CODE EXTRACTION & AUTO-SAVE ---
                const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
                let match;
                while ((match = codeBlockRegex.exec(reply)) !== null) {
                    const language = match[1] || 'txt';
                    const codeContent = match[2];
                    const timestamp = Date.now();

                    // Map language to extension
                    const extMap = { python: 'py', javascript: 'js', rust: 'rs', html: 'html', css: 'css', json: 'json', react: 'jsx' };
                    const ext = extMap[language.toLowerCase()] || language.toLowerCase() || 'txt';

                    const codeFileName = `generated_${timestamp}.${ext}`;
                    const codeFilePath = path.join(codeDir, codeFileName);

                    fs.writeFileSync(codeFilePath, codeContent);
                    console.log(`[AUTO-SAVE] Saved generated code to ${codeFilePath}`);

                    // Append info to reply message (optional, but good for debugging)
                    // replyMessage.metadata = { ...replyMessage.metadata, savedFile: codeFileName };
                }

                // Save Chat File
                fs.writeFileSync(chatFilePath, JSON.stringify(chatData, null, 2));

                // Also update the MongoDB/JsonModel for backward compatibility/indexing if needed
                // But primarily rely on the file system now as requested.
                // We will sync the JsonModel to keep the DB consistent.
                if (chatId) {
                    await Chat.findByIdAndUpdate(chatId, {
                        messages: chatData.messages,
                        updatedAt: new Date()
                    });
                } else {
                    await Chat.create(chatData);
                }

                console.log(`💾 Chat saved to file: ${chatFilePath}`);

            } catch (historyError) {
                console.error('Failed to save chat history:', historyError);
            }
        } else {
            console.warn('[CHAT SAVE] ⚠️  User not authenticated - chat will not be saved');
        }

        res.json({ reply, chatId: savedChatId });
    } catch (error) {
        console.error("Chat Error:", error);
        res.status(500).json({ error: error.message || "Failed to process chat message." });
    }
});

// List User Chats
app.get('/api/chats', authMiddleware, async (req, res) => {
    try {
        const userDir = path.join(DATA_ROOT, 'users', req.user._id.toString());
        const chatsDir = path.join(userDir, 'chats');

        if (!fs.existsSync(chatsDir)) {
            return res.json({ chats: [] });
        }

        const chatFiles = fs.readdirSync(chatsDir).filter(f => f.endsWith('.json'));
        const chats = chatFiles.map(file => {
            try {
                const content = JSON.parse(fs.readFileSync(path.join(chatsDir, file), 'utf-8'));
                return content;
            } catch (e) {
                console.error(`Error reading chat file ${file}:`, e);
                return null;
            }
        }).filter(c => c !== null);

        // Sort by updatedAt desc
        chats.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

        res.json({ chats });
    } catch (error) {
        console.error('Error fetching chats:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get Single Chat
app.get('/api/chats/:id', authMiddleware, async (req, res) => {
    try {
        const userDir = path.join(DATA_ROOT, 'users', req.user._id.toString());
        const chatsDir = path.join(userDir, 'chats');
        const chatFilePath = path.join(chatsDir, `${req.params.id}.json`);

        if (!fs.existsSync(chatFilePath)) {
            return res.status(404).json({ error: "Chat not found" });
        }

        const chat = JSON.parse(fs.readFileSync(chatFilePath, 'utf-8'));

        // Verify ownership
        if (chat.userId !== req.user._id.toString()) {
            return res.status(403).json({ error: "Access denied" });
        }

        res.json({ chat });
    } catch (error) {
        console.error('Error fetching chat:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get Execution History (for History page)
app.get('/api/history', authMiddleware, async (req, res) => {
    try {
        const history = await ExecutionHistory.find({ userId: req.user._id });
        // Sort by timestamp desc
        history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        res.json(history);
    } catch (error) {
        console.error("Failed to fetch history:", error);
        res.status(500).json({ error: error.message });
    }
});

// Get Single Execution History Record (for session restore)
app.get('/api/history/:id', authMiddleware, async (req, res) => {
    try {
        const record = await ExecutionHistory.findById(req.params.id);

        if (!record) {
            return res.status(404).json({ error: 'Execution history not found' });
        }

        // Verify ownership
        if (record.userId !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Access denied' });
        }

        console.log(`📂 Loading execution history ${req.params.id} for user ${req.user.email}`);
        res.json({ record });
    } catch (error) {
        console.error("Failed to fetch execution history record:", error);
        res.status(500).json({ error: error.message });
    }
});

// Get Recent Activity (chats + executions combined)
app.get('/api/recent-activity', authMiddleware, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;

        // Get recent executions
        const executions = await ExecutionHistory.find({ userId: req.user._id });
        executions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        // Get recent chats
        const chats = await Chat.find({ userId: req.user._id });
        chats.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

        // Combine and format
        const activity = [
            ...executions.slice(0, limit).map(exec => ({
                _id: exec._id,
                type: 'optimization',
                timestamp: exec.timestamp,
                language: exec.language,
                model: exec.model,
                performanceGain: exec.performanceGain,
                metrics: exec.metrics
            })),
            ...chats.slice(0, limit).map(chat => ({
                _id: chat._id,
                type: 'chat',
                timestamp: chat.updatedAt,
                title: chat.title,
                model: chat.model,
                messageCount: chat.messages?.length || 0,
                metrics: chat.metrics
            }))
        ];

        // Sort by timestamp desc
        activity.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        res.json({ activity: activity.slice(0, limit) });
    } catch (error) {
        console.error("Failed to fetch recent activity:", error);
        res.status(500).json({ error: error.message });
    }
});

// Global Error Handlers - Prevent crashes
process.on('uncaughtException', (error) => {
    console.error('💥 UNCAUGHT EXCEPTION:', error);
    console.error('Stack:', error.stack);
    // Don't exit - keep server running
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 UNHANDLED REJECTION at:', promise);
    console.error('Reason:', reason);
    // Don't exit - keep server running
});

// Authentication & User Routes
app.use('/auth', authRoutes);
app.use('/user', userRoutes);

// Express Error Handling Middleware (must be after routes)
app.use((err, req, res, next) => {
    console.error('Express Error Handler:', err);
    res.status(500).json({
        error: 'Internal Server Error',
        message: err.message,
        details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

const PORT = process.env.PORT || 3000;

// Server Error Handler
server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use!`);
        console.error('Please close the other process or change the port.');
        process.exit(1);
    } else {
        console.error('❌ Server error:', error);
    }
});

// Initialize Database and Start Server
const startServer = async () => {
    try {
        await connectDB();
    } catch (err) {
        console.error('Failed to connect to database:', err);
    }

    server.listen(PORT, () => {
        console.log(`✅ Orchestrator running on port ${PORT}`);
        console.log(`🔗 http://localhost:${PORT}`);
    });
};

if (process.env.NODE_ENV !== 'test') {
    startServer();
}

// Export cleanup function for tests
export const closeServer = () => {
    return new Promise((resolve) => {
        wss.clients.forEach(client => client.terminate());
        wss.close(() => {
            server.close(() => {
                resolve();
            });
        });
    });
};

export { app, startServer };
