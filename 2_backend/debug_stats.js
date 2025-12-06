import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// We need to simulate a logged in user.
// Since we can't easily login via script without a real user, 
// let's read the database file directly to see what's in it.

const DB_PATH = path.join(__dirname, 'src/data/executionhistorys.json');
// Adjust path if needed. The server uses ../data relative to JsonModel.js
// JsonModel is in src/utils. So data is in src/../data = data/
// But in server.js, DATA_ROOT is path.resolve(__dirname, '../data') -> 2_backend/data

const REAL_DB_PATH = path.resolve(__dirname, 'data/executionhistorys.json');

console.log(`Checking DB at: ${REAL_DB_PATH}`);

if (fs.existsSync(REAL_DB_PATH)) {
    const content = fs.readFileSync(REAL_DB_PATH, 'utf-8');
    try {
        const data = JSON.parse(content);
        console.log(`Found ${data.length} execution records.`);

        if (data.length > 0) {
            const last = data[data.length - 1];
            console.log('Last Record Metrics:', JSON.stringify(last.metrics, null, 2));

            const orig = last.metrics?.original?.energy_joules;
            const opt = last.metrics?.optimized?.energy_joules;
            console.log(`Energy: Original=${orig}, Optimized=${opt}, Diff=${orig - opt}`);
        }
    } catch (e) {
        console.error('Error parsing DB:', e.message);
    }
} else {
    console.error('DB file not found!');
}
