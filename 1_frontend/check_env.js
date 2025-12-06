import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REQUIRED_NODE_VERSION = '18.0.0';
const REQUIRED_FILES = ['package.json', 'vite.config.js', 'src/main.jsx'];

console.log("🔍 Starting Frontend Environment Check...");

// 1. Check Node Version
const currentVersion = process.version;
if (currentVersion < 'v' + REQUIRED_NODE_VERSION) {
    console.error(`❌ Node.js version mismatch! Required: >=${REQUIRED_NODE_VERSION}, Current: ${currentVersion}`);
    process.exit(1);
}
console.log(`✅ Node.js Version: ${currentVersion}`);

// 2. Check Required Files
const missingFiles = REQUIRED_FILES.filter(file => !fs.existsSync(path.join(__dirname, file)));
if (missingFiles.length > 0) {
    console.error(`❌ Missing required files: ${missingFiles.join(', ')}`);
    process.exit(1);
}
console.log("✅ Required files present");

// 3. Check Dependencies
try {
    if (!fs.existsSync(path.join(__dirname, 'package-lock.json'))) {
        console.error("❌ package-lock.json not found! It is required for npm ci.");
        process.exit(1);
    }

    // Check if dependencies are in sync with lock file
    try {
        execSync('npm ls', { stdio: 'ignore' });
        console.log("✅ Dependencies are in sync with lock file");
    } catch (e) {
        console.log("⚠️  Dependencies missing or out of sync. Running 'npm ci'...");

        try {
            execSync('npm ci', { stdio: 'inherit' });
            console.log("✅ Dependencies installed successfully via npm ci");
        } catch (installError) {
            console.error("❌ 'npm ci' failed. Please check the error output above.");
            console.error("   Ensure your package-lock.json matches package.json.");
            process.exit(1);
        }
    }
} catch (error) {
    console.error("❌ Dependency check failed:", error.message);
    process.exit(1);
}

console.log("✅ Frontend Environment Check Passed!");
process.exit(0);
