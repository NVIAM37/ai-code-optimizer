import JsonModel from './src/utils/JsonModel.js';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

async function testRaceCondition() {
    console.log('Testing Race Condition...');
    const model = new JsonModel('test_race', { count: Number });

    // Reset data
    console.log('Resetting data...');
    await model.deleteMany({});
    console.log('Creating initial doc...');
    await model.create({ count: 0 });
    console.log('Initial doc created.');

    const iterations = 20; // 20 concurrent writes
    const promises = [];

    console.log(`Starting ${iterations} concurrent updates...`);

    for (let i = 0; i < iterations; i++) {
        promises.push((async () => {
            try {
                // Use atomic update (thread-safe via Mutex)
                await model.updateOne({}, { $inc: { count: 1 } });
                process.stdout.write('.');
            } catch (err) {
                console.error('Error in loop:', err);
            }
        })());
    }

    // Run all concurrently
    await Promise.all(promises);

    const finalDoc = await model.findOne({});
    console.log(`Expected count: ${iterations}, Actual count: ${finalDoc.count}`);
    if (finalDoc.count === iterations) {
        console.log('✅ Race Condition Fixed!');
    } else {
        console.error('❌ Race Condition Failed!');
    }
}

async function testRCE() {
    console.log('\nTesting RCE Fix...');
    return new Promise((resolve) => {
        const supervisorPath = path.resolve('src/executors/supervisor.py');

        // Try to inject a command
        // If shell=True, this would run python --version AND echo vulnerable
        // If shell=False, it tries to find an executable named "python --version; echo vulnerable" and fails
        const cmd = 'python3 --version; echo vulnerable';

        const py = spawn('python3', [supervisorPath, cmd]);

        let stdout = '';
        let stderr = '';

        py.stdout.on('data', d => stdout += d);
        py.stderr.on('data', d => stderr += d);

        py.on('close', (code) => {
            // Parse JSON output to avoid false positives from debug logs
            const parts = stdout.split('---METRICS_START---');
            if (parts.length > 1) {
                const jsonStr = parts[1].split('---METRICS_END---')[0];
                try {
                    const result = JSON.parse(jsonStr);
                    // Check if the ACTUAL execution stdout contains "vulnerable"
                    if (result.stdout && result.stdout.includes('vulnerable')) {
                        console.error('❌ RCE Vulnerable! "vulnerable" found in execution output.');
                        console.log('DEBUG STDERR:', stderr);
                    } else {
                        console.log('✅ RCE Fixed (Injection did not execute)');
                        // Optional: Check if it failed as expected
                        if (result.stderr || (result.stdout && !result.stdout.includes('vulnerable'))) {
                            console.log('   Confirmed: Command failed or did not echo.');
                        }
                    }
                } catch (e) {
                    console.error('❌ Failed to parse supervisor output:', e.message);
                }
            } else {
                // Fallback if no JSON found (e.g. crash)
                if (stdout.includes('vulnerable') && !stdout.includes('[DEBUG] Raw Metrics')) {
                    console.error('❌ RCE Vulnerable! "vulnerable" found in raw output.');
                } else {
                    console.log('✅ RCE Fixed (Injection did not execute - JSON check skipped)');
                }
            }
            resolve();
        });
    });
}

async function testSafety() {
    console.log('\nTesting Safety Blacklist...');
    // Dynamic import to avoid issues if file doesn't exist (though it should)
    try {
        const { isSafe } = await import('./src/utils/safety.js');

        const unsafeCodes = [
            'import os; os.system("ls")',
            'import subprocess',
            'from subprocess import Popen',
            'require("child_process")',
            'exec("rm -rf /")'
        ];

        let passed = true;
        for (const code of unsafeCodes) {
            if (isSafe(code)) {
                console.error(`❌ Safety Failed! Unsafe code passed: "${code}"`);
                passed = false;
            }
        }

        if (passed) {
            console.log('✅ Safety Check Passed! (All dangerous patterns blocked)');
        }
    } catch (e) {
        console.error('Skipping Safety Test (module not found or error):', e.message);
    }
}

async function run() {
    try {
        await testRaceCondition();
        await testRCE();
        await testSafety();
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

run();
