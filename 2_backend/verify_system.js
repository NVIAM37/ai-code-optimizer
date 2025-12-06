import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const COLORS = {
    reset: "\x1b[0m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    bold: "\x1b[1m"
};

const log = (color, msg) => console.log(`${color}${msg}${COLORS.reset}`);

async function verifySystem() {
    log(COLORS.blue, "\n🔍 Starting Deep System Verification...\n");

    let hasErrors = false;
    let hasWarnings = false;

    // 1. Check Environment Variables
    log(COLORS.bold, "1. Checking Environment Configuration...");
    const requiredVars = ['GEMINI_API_KEY', 'MONGODB_URI', 'JWT_SECRET', 'SESSION_SECRET'];
    const optionalVars = ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'];

    requiredVars.forEach(v => {
        if (!process.env[v]) {
            log(COLORS.red, `❌ Missing Required Variable: ${v}`);
            hasErrors = true;
        } else {
            log(COLORS.green, `✅ Found ${v}`);
        }
    });

    optionalVars.forEach(v => {
        if (!process.env[v]) {
            log(COLORS.yellow, `⚠️  Missing Optional Variable: ${v} (Google Login will be disabled)`);
            hasWarnings = true;
        } else {
            log(COLORS.green, `✅ Found ${v}`);
        }
    });

    // 2. Check MongoDB Connection
    log(COLORS.bold, "\n2. Checking Database Connection...");
    try {
        const uri = (process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/green-code-optimizer').replace('localhost', '127.0.0.1');
        log(COLORS.blue, `   Connecting to: ${uri.replace(/:[^:]*@/, ':****@')} ...`); // Mask password

        await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
        log(COLORS.green, "✅ MongoDB Connected Successfully");
        await mongoose.disconnect();
    } catch (error) {
        log(COLORS.red, `❌ MongoDB Connection Failed: ${error.message}`);
        log(COLORS.yellow, "   Tip: Ensure 'mongod' is running and port 27017 is open.");
        hasErrors = true;
    }

    // 3. Check Critical Files
    log(COLORS.bold, "\n3. Checking Critical Files...");
    const criticalFiles = [
        'src/server.js',
        'src/config/database.js',
        'src/config/passport.js',
        'src/routes/auth.js',
        'src/routes/user.js',
        'src/models/User.js',
        'src/models/Session.js'
    ];

    criticalFiles.forEach(file => {
        if (fs.existsSync(path.join(__dirname, file))) {
            log(COLORS.green, `✅ Found ${file}`);
        } else {
            log(COLORS.red, `❌ Missing File: ${file}`);
            hasErrors = true;
        }
    });

    // Summary
    log(COLORS.bold, "\n============================================");
    if (hasErrors) {
        log(COLORS.red, "❌ SYSTEM VERIFICATION FAILED");
        log(COLORS.red, "Please fix the errors above before running the application.");
    } else if (hasWarnings) {
        log(COLORS.yellow, "⚠️  SYSTEM VERIFIED WITH WARNINGS");
        log(COLORS.yellow, "The application will run, but some features (like Google Login) may be disabled.");
    } else {
        log(COLORS.green, "✅ SYSTEM VERIFIED SUCCESSFULLY");
        log(COLORS.green, "All systems go!");
    }
    log(COLORS.bold, "============================================\n");
}

verifySystem();
