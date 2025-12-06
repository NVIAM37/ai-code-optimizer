import mongoose from 'mongoose';

const uri = 'mongodb://127.0.0.1:27017/green-code-optimizer';

console.log(`Attempting to connect to ${uri}...`);

mongoose.connect(uri, {
    serverSelectionTimeoutMS: 5000,
    family: 4 // Force IPv4
})
    .then(() => {
        console.log('✅ Connected successfully!');
        process.exit(0);
    })
    .catch(err => {
        console.error('❌ Connection failed:', err.message);
        process.exit(1);
    });
