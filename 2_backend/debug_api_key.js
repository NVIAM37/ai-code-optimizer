const validateKey = (key) => {
    console.log(`Testing Key: '${key}'`);
    console.log(`Length: ${key.length}`);

    const trimmed = key.trim();
    console.log(`Trimmed: '${trimmed}'`);
    console.log(`Trimmed Length: ${trimmed.length}`);

    const startsWith = trimmed.startsWith('AIza');
    console.log(`Starts with AIza: ${startsWith}`);

    const lengthCheck = trimmed.length < 35;
    console.log(`Length < 35: ${lengthCheck}`);

    if (!startsWith || lengthCheck) {
        console.log("❌ Validation FAILED");
    } else {
        console.log("✅ Validation PASSED");
    }
}

const userKey = "AIzaSyDWuRADN_kEShEI0hVcZ8yO0ryNjz2jnEI";
validateKey(userKey);

// Test with potential hidden chars
const dirtyKey = " " + userKey + " \n";
validateKey(dirtyKey);
