import sys
import os
import json
import subprocess

# Add src to path to allow importing supervisor if needed, 
# but here we will run it as a subprocess to test the CLI interface exactly as server.js does.

SUPERVISOR_PATH = os.path.join("src", "executors", "supervisor.py")

def test_supervisor():
    print("🔍 Starting Supervisor Verification...")
    
    # Test Script
    test_code = "print('Hello from Supervisor Test')"
    # We need to pass a command to supervisor. 
    # Supervisor expects: python supervisor.py <command>
    # But wait, supervisor.py takes the command to run as an argument.
    # So we need a dummy python file to run.
    
    dummy_file = "test_script_dummy.py"
    with open(dummy_file, "w") as f:
        f.write(test_code)
        
    cmd = f"python {dummy_file}"
    
    try:
        # Run supervisor
        # python src/executors/supervisor.py "python test_script_dummy.py"
        result = subprocess.run(
            ["python", SUPERVISOR_PATH, cmd],
            capture_output=True,
            text=True
        )
        
        if result.returncode != 0:
            print(f"❌ Supervisor Execution Failed: {result.stderr}")
            return False
            
        # Parse Output
        output = result.stdout
        # Extract JSON between markers
        try:
            json_str = output.split("---METRICS_START---")[1].split("---METRICS_END---")[0].strip()
            metrics = json.loads(json_str)
        except Exception as e:
            print(f"❌ Failed to parse Supervisor Output: {e}")
            print(f"Raw Output: {output}")
            return False
            
        # Verify Metrics (DbC)
        print(f"📊 Metrics Received: {metrics['metrics']}")
        
        checks = []
        checks.append(metrics['metrics']['duration'] >= 0)
        checks.append(metrics['metrics']['energy_joules'] >= 0)
        checks.append(metrics['metrics']['ram_peak'] >= 0)
        checks.append(metrics['metrics']['cpu_peak'] > 0) # Strict check for > 0 as per fix
        
        if all(checks):
            print("✅ DbC Assertions Passed (Non-negative metrics)")
            print("✅ CPU Polling Verified (> 0.0%)")
        else:
            print("❌ DbC/CPU Check Failed")
            if metrics['metrics']['cpu_peak'] == 0:
                print("   ❌ CPU Peak is 0.0% (Fix failed?)")
            return False
            
    finally:
        if os.path.exists(dummy_file):
            os.remove(dummy_file)
            
    print("✅ SUPERVISOR VERIFICATION PASSED")
    return True

if __name__ == "__main__":
    if test_supervisor():
        sys.exit(0)
    else:
        sys.exit(1)
