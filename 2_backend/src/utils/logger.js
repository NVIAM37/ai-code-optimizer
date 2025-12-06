import fs from 'fs';
import path from 'path';

class DebugLogger {
    constructor() {
        this.logDir = path.join(process.cwd(), 'logs');
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
        this.logFile = path.join(this.logDir, `debug_${new Date().toISOString().replace(/:/g, '-')}.log`);
    }

    _write(level, category, message, data = null) {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] [${level}] [${category}] ${message}`;

        // Console output with colors
        const colors = {
            INFO: '\x1b[36m', // Cyan
            SUCCESS: '\x1b[32m', // Green
            WARN: '\x1b[33m', // Yellow
            ERROR: '\x1b[31m', // Red
            DEBUG: '\x1b[35m', // Magenta
            RESET: '\x1b[0m'
        };

        console.log(`${colors[level] || colors.RESET}${logEntry}${colors.RESET}`);
        if (data) {
            console.log(JSON.stringify(data, null, 2));
        }

        // File output
        const fileEntry = `${logEntry} ${data ? JSON.stringify(data) : ''}\n`;
        fs.appendFileSync(this.logFile, fileEntry);
    }

    info(category, message, data) { this._write('INFO', category, message, data); }
    success(category, message, data) { this._write('SUCCESS', category, message, data); }
    warn(category, message, data) { this._write('WARN', category, message, data); }
    error(category, message, data) { this._write('ERROR', category, message, data); }
    debug(category, message, data) { this._write('DEBUG', category, message, data); }
}

export const logger = new DebugLogger();
