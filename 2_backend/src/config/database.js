import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const connectDB = async () => {
    try {
        const dataDir = path.resolve(__dirname, '../../data');
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        console.log(`✅ File-based JSON Database ready at ${dataDir}`);
        return true;
    } catch (error) {
        console.error(`❌ Database Initialization Error: ${error.message}`);
        return null;
    }
};

export default connectDB;
