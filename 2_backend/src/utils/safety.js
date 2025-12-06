export const isSafe = (code, language) => {
    // Only block truly dangerous system commands, not module names
    const dangerousPatterns = [
        /rm\s+-rf\s+[\/\\]/i,           // rm -rf with paths
        /sudo\s+rm/i,                    // sudo rm
        /format\s+c:/i,                  // format c:
        /del\s+\/[sq]/i,                 // del /s or del /q
        /shutil\.rmtree\(/i,             // Python's rmtree function call
        /os\.system\(/i,                 // Python's os.system function call
        /os\.popen\(/i,                  // Python's os.popen function call
        /subprocess\.run\(/i,            // Python's subprocess.run
        /subprocess\.Popen\(/i,          // Python's subprocess.Popen
        /import\s+subprocess/i,          // Import subprocess
        /from\s+subprocess/i,            // From subprocess import ...
        /require\(['"]child_process['"]\)/i, // Node.js child_process
        /exec\(['"](rm|del|format)/i    // exec with dangerous commands
    ];

    // Check if code matches any dangerous pattern
    return !dangerousPatterns.some(pattern => pattern.test(code));
};
