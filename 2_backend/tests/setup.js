// Setup file for Jest
import fs from 'fs';
import path from 'path';

// Create temp data directory for tests
const TEST_DATA_DIR = path.join(process.cwd(), 'data_test');

beforeAll(() => {
    if (!fs.existsSync(TEST_DATA_DIR)) {
        fs.mkdirSync(TEST_DATA_DIR, { recursive: true });
    }
    process.env.DATA_ROOT = TEST_DATA_DIR;
});

afterAll(() => {
    // Cleanup logic if needed
});
