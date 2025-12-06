#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("🏥 GREEN CODE OPTIMIZER - COMPREHENSIVE HEALTH CHECK");
console.log("=".repeat(60));

let healthIssues = [];
let warnings = [];

// 1. DIRECTORY STRUCTURE CHECK
console.log("\n📁 Checking Directory Structure...");
const requiredDirs = [
    '1_frontend',
    '1_frontend/src',
    '1_frontend/src/components',
    '2_backend',
    '2_backend/src',
    '2_backend/src/ai_engine',
    '2_backend/src/utils'
];

requiredDirs.forEach(dir => {
    const fullPath = path.join(__dirname, dir);
    if (fs.existsSync(fullPath)) {
        console.log(`  ✅ ${dir}`);
    } else {
        console.log(`  ❌ ${dir} - MISSING`);
        healthIssues.push(`Missing directory: ${dir}`);
    }
});

// 2. DEPENDENCY VERSIONS CHECK
console.log("\n📦 Checking Dependencies & Versions...");

// Node.js
try {
    const nodeVersion = process.version;
    console.log(`  ✅ Node.js: ${nodeVersion}`);
    if (nodeVersion < 'v18.0.0') {
        warnings.push(`Node.js ${nodeVersion} is below recommended v18.0.0`);
    }
} catch (e) {
    healthIssues.push("Node.js version check failed");
}

// Python
try {
    const pythonVersion = execSync('python --version', { encoding: 'utf-8' }).trim();
    console.log(`  ✅ Python: ${pythonVersion}`);
} catch (e) {
    console.log(`  ⚠️  Python: Not found or not in PATH`);
    warnings.push("Python not available - code execution will fail");
}

// npm
try {
    const npmVersion = execSync('npm --version', { encoding: 'utf-8' }).trim();
    console.log(`  ✅ npm: v${npmVersion}`);
} catch (e) {
    healthIssues.push("npm not available");
}

// 3. BACKEND DEPENDENCIES
console.log("\n🔧 Checking Backend Dependencies...");
const backendPath = path.join(__dirname, '2_backend');
if (fs.existsSync(path.join(backendPath, 'node_modules'))) {
    console.log("  ✅ node_modules exists");

    // Check critical packages
    const criticalPackages = ['express', 'ws', 'dotenv', '@google/generative-ai', 'groq-sdk'];
    criticalPackages.forEach(pkg => {
        if (fs.existsSync(path.join(backendPath, 'node_modules', pkg))) {
            console.log(`  ✅ ${pkg}`);
        } else {
            console.log(`  ❌ ${pkg} - MISSING`);
            healthIssues.push(`Missing package: ${pkg}`);
        }
    });
} else {
    console.log("  ❌ node_modules missing - run 'npm ci'");
    healthIssues.push("Backend dependencies not installed");
}

// 4. FRONTEND DEPENDENCIES
console.log("\n⚛️  Checking Frontend Dependencies...");
const frontendPath = path.join(__dirname, '1_frontend');
if (fs.existsSync(path.join(frontendPath, 'node_modules'))) {
    console.log("  ✅ node_modules exists");
} else {
    console.log("  ❌ node_modules missing - run 'npm ci'");
    healthIssues.push("Frontend dependencies not installed");
}

// 5. CODECARBON CHECK
console.log("\n🌱 Checking CodeCarbon (Optional)...");
try {
    execSync('python -c "import codecarbon"', { stdio: 'ignore' });
    console.log("  ✅ CodeCarbon installed - Energy metrics enabled");
} catch (e) {
    console.log("  ℹ️  CodeCarbon not installed - Energy metrics disabled");
    console.log("     (This is optional - install with: pip install codecarbon)");
}

// 6. CONNECTION HEALTH CHECK
console.log("\n🔗 Checking Service Connections...");

// Check if backend is running
const checkBackend = () => {
    return new Promise((resolve) => {
        const req = http.get('http://localhost:3000', (res) => {
            console.log(`  ✅ Backend responding on http://localhost:3000`);
            resolve(true);
        });
        req.on('error', () => {
            console.log("  ⚠️  Backend not responding (may not be started yet)");
            warnings.push("Backend server needs to be started");
            resolve(false);
        });
        req.setTimeout(2000, () => {
            req.destroy();
            resolve(false);
        });
    });
};

// Check if frontend is running
const checkFrontend = () => {
    return new Promise((resolve) => {
        const req = http.get('http://localhost:5173', (res) => {
            console.log(`  ✅ Frontend responding on http://localhost:5173`);
            resolve(true);
        });
        req.on('error', () => {
            // Try alternate port
            const req2 = http.get('http://localhost:5174', (res) => {
                console.log(`  ✅ Frontend responding on http://localhost:5174`);
                resolve(true);
            });
            req2.on('error', () => {
                console.log("  ⚠️  Frontend not responding (may not be started yet)");
                warnings.push("Frontend server needs to be started");
                resolve(false);
            });
            req2.setTimeout(2000, () => {
                req2.destroy();
                resolve(false);
            });
        });
        req.setTimeout(2000, () => {
            req.destroy();
            resolve(false);
        });
    });
};

await checkBackend();
await checkFrontend();

// 7. FINAL REPORT
console.log("\n" + "=".repeat(60));
console.log("📊 HEALTH CHECK SUMMARY");
console.log("=".repeat(60));

if (healthIssues.length === 0 && warnings.length === 0) {
    console.log("\n✅ ALL SYSTEMS HEALTHY");
    console.log("The Green Code Optimizer is ready to use!");
} else {
    if (healthIssues.length > 0) {
        console.log("\n❌ CRITICAL ISSUES FOUND:");
        healthIssues.forEach(issue => console.log(`   - ${issue}`));
    }

    if (warnings.length > 0) {
        console.log("\n⚠️  WARNINGS:");
        warnings.forEach(warning => console.log(`   - ${warning}`));
    }

    if (healthIssues.length > 0) {
        console.log("\n❌ System health check FAILED");
        process.exit(1);
    } else {
        console.log("\n⚠️  System operational with warnings");
    }
}

console.log("\n" + "=".repeat(60));
process.exit(0);
