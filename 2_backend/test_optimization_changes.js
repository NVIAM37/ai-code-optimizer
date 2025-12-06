// Test to verify AI ALWAYS returns optimized (different) code
const BASE_URL = 'http://localhost:3000';
const API_KEY = process.env.GEMINI_API_KEY || "AIzaSyBv4Smrgbk3yzJY4g9DHUY9hGvcaiuzAck";

console.log('Testing AI Optimization - Verifying NO unchanged code is returned\n');

async function testOptimizationChanges(testName, language, code) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`TEST: ${testName}`);
    console.log(`${'='.repeat(60)}`);

    try {
        const res = await fetch(`${BASE_URL}/process`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                code,
                language,
                intensity: 50,
                provider: 'gemini',
                apiKey: API_KEY
            })
        });

        const data = await res.json();

        if (data.error) {
            console.log(`❌ Error: ${data.error}`);
            return false;
        }

        const originalCode = code.trim();
        const optimizedCode = data.optimized?.code?.trim() || '';

        console.log(`Original Code (${originalCode.length} chars):`);
        console.log(originalCode);
        console.log(`\nOptimized Code (${optimizedCode.length} chars):`);
        console.log(optimizedCode);

        // Check if code was actually changed
        if (originalCode === optimizedCode) {
            console.log(`\n❌ FAIL: Code is IDENTICAL (not optimized!)`);
            return false;
        } else {
            console.log(`\n✅ PASS: Code was MODIFIED (optimized)`);

            // Show performance improvement
            if (data.original?.metrics && data.optimized?.metrics) {
                const improvement = ((data.original.metrics.duration - data.optimized.metrics.duration) / data.original.metrics.duration * 100).toFixed(1);
                console.log(`⚡ Performance: ${improvement}% ${improvement > 0 ? 'faster' : 'slower'}`);
                console.log(`📊 Original: ${data.original.metrics.duration}ms | Optimized: ${data.optimized.metrics.duration}ms`);
            }

            return true;
        }

    } catch (err) {
        console.log(`❌ Request failed: ${err.message}`);
        return false;
    }
}

async function runTests() {
    const tests = [
        {
            name: 'Python - Inefficient Loop',
            language: 'python',
            code: `
total = 0
for i in range(1000):
    total = total + i
print(total)
`.trim()
        },
        {
            name: 'JavaScript - Manual Array Sum',
            language: 'javascript',
            code: `
let arr = [1, 2, 3, 4, 5];
let sum = 0;
for (let i = 0; i < arr.length; i++) {
    sum = sum + arr[i];
}
console.log(sum);
`.trim()
        },
        {
            name: 'Python - Redundant Calculations',
            language: 'python',
            code: `
def calculate():
    result = 0
    for i in range(100):
        result += i * 2
    return result
print(calculate())
`.trim()
        }
    ];

    let passed = 0;
    let failed = 0;

    for (const test of tests) {
        const success = await testOptimizationChanges(test.name, test.language, test.code);
        if (success) {
            passed++;
        } else {
            failed++;
        }
        // Wait 3 seconds between tests
        await new Promise(resolve => setTimeout(resolve, 3000));
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log(`RESULTS`);
    console.log(`${'='.repeat(60)}`);
    console.log(`✅ Passed: ${passed}/${tests.length}`);
    console.log(`❌ Failed: ${failed}/${tests.length}`);

    if (failed === 0) {
        console.log(`\n🎉 SUCCESS: AI is ALWAYS returning optimized code!`);
    } else {
        console.log(`\n⚠️  WARNING: Some tests returned unchanged code`);
    }
}

runTests();
