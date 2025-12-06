import { spawn } from 'child_process';
import path from 'path';

const testSupervisorSysInfo = async () => {
    console.log("Testing Supervisor SysInfo...");

    return new Promise((resolve, reject) => {
        const supervisorPath = path.join(process.cwd(), 'src/executors/supervisor.py');
        const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';

        console.log(`Running: ${pythonCmd} ${supervisorPath} sysinfo`);

        const py = spawn(pythonCmd, [supervisorPath, 'sysinfo']);

        let data = "";
        let error = "";

        py.stdout.on('data', (chunk) => data += chunk);
        py.stderr.on('data', (chunk) => error += chunk);

        py.on('close', (code) => {
            if (code === 0) {
                try {
                    const sysInfo = JSON.parse(data.trim());
                    console.log("✅ Supervisor returned valid JSON:", sysInfo);
                    if (sysInfo.os && sysInfo.cpu_count) {
                        console.log("✅ System Info contains expected fields.");
                        resolve();
                    } else {
                        reject(new Error("Missing fields in sysinfo"));
                    }
                } catch (e) {
                    console.error("❌ Failed to parse JSON:", data);
                    reject(e);
                }
            } else {
                console.error("❌ Supervisor failed with code", code, error);
                reject(new Error("Supervisor failed"));
            }
        });
    });
};

testSupervisorSysInfo();
