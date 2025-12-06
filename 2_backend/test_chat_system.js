// Quick test to verify chat system is working
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_ROOT = path.join(__dirname, 'data');

console.log('🔍 Testing Chat System...\n');

// Check if data directory exists
if (!fs.existsSync(DATA_ROOT)) {
    console.log('❌ DATA_ROOT does not exist:', DATA_ROOT);
    process.exit(1);
}

console.log('✅ DATA_ROOT exists:', DATA_ROOT);

// Check users directory
const usersDir = path.join(DATA_ROOT, 'users');
if (!fs.existsSync(usersDir)) {
    console.log('⚠️  No users directory found');
} else {
    console.log('✅ Users directory exists');

    // List all users
    const users = fs.readdirSync(usersDir);
    console.log(`\n📁 Found ${users.length} user(s):`);

    users.forEach(userId => {
        const userPath = path.join(usersDir, userId);
        const chatsPath = path.join(userPath, 'chats');
        const codePath = path.join(userPath, 'code');

        console.log(`\n👤 User: ${userId}`);

        // Check chats
        if (fs.existsSync(chatsPath)) {
            const chatFiles = fs.readdirSync(chatsPath).filter(f => f.endsWith('.json'));
            console.log(`  💬 Chats: ${chatFiles.length} session(s)`);
            chatFiles.forEach(file => {
                const content = JSON.parse(fs.readFileSync(path.join(chatsPath, file), 'utf-8'));
                console.log(`    - ${content.title} (${content.messages.length} messages)`);
            });
        } else {
            console.log(`  💬 Chats: 0 (directory doesn't exist)`);
        }

        // Check code files
        if (fs.existsSync(codePath)) {
            const codeFiles = fs.readdirSync(codePath);
            console.log(`  📄 Generated Code: ${codeFiles.length} file(s)`);
            codeFiles.forEach(file => {
                console.log(`    - ${file}`);
            });
        } else {
            console.log(`  📄 Generated Code: 0 (directory doesn't exist)`);
        }
    });
}

console.log('\n✅ Test complete!');
