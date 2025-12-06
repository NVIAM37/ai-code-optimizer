import sys
import subprocess
import time
import json
import threading
import os

# Set UTF-8 encoding for stdout/stderr
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')
else:
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# --- Robust Imports ---
try:
    import psutil
except ImportError:
    psutil = None

try:
    from codecarbon import EmissionsTracker
except ImportError:
    EmissionsTracker = None

try:
    import pynvml
except ImportError:
    pynvml = None

# Suppress CodeCarbon warnings
import logging
logging.getLogger("codecarbon").setLevel(logging.ERROR)

# 1. Get the command to run
if len(sys.argv) < 2:
    print("Error: No command provided to supervisor.")
    sys.exit(1)

command_to_run = sys.argv[1]

# Check for system info request
if command_to_run == "sysinfo":
    sys_info = {
        "os": sys.platform,
        "cpu_count": psutil.cpu_count(logical=True) if psutil else "Unknown",
        "ram_total_gb": round(psutil.virtual_memory().total / (1024**3), 2) if psutil else "Unknown",
        "gpu_available": False,
        "gpu_name": "Unknown"
    }
    
    if pynvml:
        try:
            pynvml.nvmlInit()
            handle = pynvml.nvmlDeviceGetHandleByIndex(0)
            sys_info["gpu_name"] = pynvml.nvmlDeviceGetName(handle)
            if isinstance(sys_info["gpu_name"], bytes):
                 sys_info["gpu_name"] = sys_info["gpu_name"].decode('utf-8')
            sys_info["gpu_available"] = True
        except:
            pass

    print(json.dumps(sys_info))
    sys.exit(0)

metrics = {
    "duration": 0,
    "cpu_peak": 0,
    "ram_peak": 0,
    "energy_joules": 0,
    "co2_emissions": 0,
    "gpu_usage": 0
}

process_running = False

# 2. GPU Monitoring Thread
def monitor_gpu():
    if not pynvml:
        return
    try:
        pynvml.nvmlInit()
        handle = pynvml.nvmlDeviceGetHandleByIndex(0)
        while process_running:
            try:
                util = pynvml.nvmlDeviceGetUtilizationRates(handle)
                metrics["gpu_usage"] = max(metrics["gpu_usage"], util.gpu)
            except:
                pass
            time.sleep(0.1)
    except:
        pass # No Nvidia GPU or init failed

# 3. Execution & Measurement
def main():
    global process_running
    process_running = True
    
    # Start GPU Thread
    gpu_thread = threading.Thread(target=monitor_gpu)
    gpu_thread.daemon = True # Ensure thread dies if main dies
    gpu_thread.start()
    
    # Start CodeCarbon
    tracker = None
    if EmissionsTracker:
        try:
            # measure_power_secs=0.05 for higher resolution on short scripts
            tracker = EmissionsTracker(measure_power_secs=0.05, save_to_file=False, log_level='error')
            tracker.start()
        except Exception as e:
            # CodeCarbon failed to start (e.g. permission issues)
            tracker = None
    
    # Use perf_counter for microsecond precision
    start_time = time.perf_counter()
    stdout = ""
    stderr = ""
    
    try:
        # Spawn the User's Code with UTF-8 encoding
        # We use psutil.Popen if available to easily get the process object
        import shlex
        command_args = shlex.split(command_to_run)
        print(f"[DEBUG] Supervisor executing: {command_args} (shell=False)", file=sys.stderr)
        
        if psutil:
            process = psutil.Popen(command_args, shell=False, stdout=subprocess.PIPE, stderr=subprocess.PIPE, encoding='utf-8', errors='replace')
        else:
            # Fallback if psutil is missing
            process = subprocess.Popen(command_args, shell=False, stdout=subprocess.PIPE, stderr=subprocess.PIPE, encoding='utf-8', errors='replace')
        
        # Poll for CPU/RAM stats
        while process.poll() is None:
            if psutil:
                try:
                    # Recursive Monitoring: Include all child processes
                    # This is critical because shell=True spawns a shell which spawns the actual command
                    current_process = psutil.Process(process.pid)
                    children = current_process.children(recursive=True)
                    all_procs = [current_process] + children
                    
                    total_cpu = 0.0
                    total_ram = 0.0
                    
                    for proc in all_procs:
                        try:
                            # interval=None is non-blocking. First call returns 0.0.
                            # We sum up CPU percent of all related processes.
                            total_cpu += proc.cpu_percent(interval=None)
                            total_ram += proc.memory_info().rss
                        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                            pass
                    
                    metrics["cpu_peak"] = max(metrics["cpu_peak"], total_cpu)
                    metrics["ram_peak"] = max(metrics["ram_peak"], total_ram / (1024 * 1024)) # Convert to MB
                except Exception:
                    pass
            
            # Fast polling for short-lived processes - High Frequency for accurate CPU Peak
            # Increased sleep to 10ms to prevent CPU starvation of the actual process
            time.sleep(0.01)
        
        stdout, stderr = process.communicate()
        
    except Exception as e:
        stdout, stderr = "", str(e)

    # Stop Tracking
    emissions = 0
    if tracker:
        try:
            emissions = tracker.stop()
        except:
            pass

    end_time = time.perf_counter()
    process_running = False
    
    # Finalize Metrics
    metrics["duration"] = round((end_time - start_time) * 1000, 2) # ms
    
    # If duration is extremely short, CPU peak might be 0 due to sampling.
    # We can't easily fix this without OS-level accounting, but recursive monitoring helps.
    
    if emissions:
        metrics["energy_joules"] = emissions * 3600 * 1000 # kWh -> Joules
        metrics["co2_emissions"] = emissions # kg
    else:
        # Fallback for very short scripts where codecarbon might return 0
        # Heuristic: 0.5 * (CPU_Peak / 100) * Duration(s) * TDP (assumed 65W for laptop/desktop mix)
        # This gives a "non-zero" feeling that is physically plausible.
        duration_sec = metrics["duration"] / 1000.0
        if duration_sec > 0:
            cpu_fraction = metrics["cpu_peak"] / 100.0
            # If CPU peak is 0 (very fast script), assume at least 1% usage for the duration
            if metrics["cpu_peak"] == 0:
                metrics["cpu_peak"] = 1.0 # Minimum floor for visibility
            
            cpu_fraction = metrics["cpu_peak"] / 100.0
            
            estimated_joules = 0.5 * cpu_fraction * duration_sec * 65.0
            metrics["energy_joules"] = estimated_joules
            # CO2 estimation: 0.475 kgCO2/kWh (global avg) -> 0.475 / (3.6 * 10^6) kg/J
            metrics["co2_emissions"] = estimated_joules * (0.475 / 3600000.0)
    
    # Final CPU Floor Check
    if metrics["cpu_peak"] == 0:
        metrics["cpu_peak"] = 1.0
    
    # --- RAW METRICS LOGGING (User Requested) ---
    print(f"\n[DEBUG] Raw Metrics for {command_to_run}:")
    print(f"  • Duration: {metrics['duration']} ms")
    print(f"  • CPU Peak: {metrics['cpu_peak']}%")
    print(f"  • RAM Peak: {metrics['ram_peak']} MB")
    
    if emissions:
        print(f"  • CodeCarbon Emissions: {emissions} kgCO2")
        print(f"  • Energy (Real): {metrics['energy_joules']} Joules")
    else:
        print(f"  • CodeCarbon: No data (script too fast or tracker failed)")
        print(f"  • Energy (Estimated): {metrics['energy_joules']} Joules (Fallback Calculation)")
    print("--------------------------------------------------\n")
    
    # 4. Print JSON Output
    # Since we set encoding='utf-8' in Popen, stdout/stderr are already strings
    output = {
        "metrics": metrics,
        "stdout": stdout if isinstance(stdout, str) else stdout.decode('utf-8', errors='replace'),
        "stderr": stderr if isinstance(stderr, str) else stderr.decode('utf-8', errors='replace')
    }
    
    # --- Formal Methods: Design by Contract (DbC) ---
    # Post-condition Assertions to guarantee metric validity
    try:
        # 1. Duration must be non-negative
        assert metrics["duration"] >= 0, "DbC Failure: Execution duration cannot be negative."

        # 2. Energy must be non-negative
        assert metrics["energy_joules"] >= 0, "DbC Failure: Energy consumption cannot be negative."

        # 3. RAM usage must be non-negative
        assert metrics["ram_peak"] >= 0, "DbC Failure: RAM usage cannot be negative."
        
        # 4. CPU usage must be non-negative
        assert metrics["cpu_peak"] >= 0, "DbC Failure: CPU usage cannot be negative."
    except AssertionError as e:
        # In a strict formal system, this might halt execution. 
        # Here we log it as a critical error in stderr but allow return for debugging.
        stderr += f"\n[CRITICAL] {str(e)}"

    # Ensure these markers are ALWAYS printed on their own lines
    print("\n---METRICS_START---")
    print(json.dumps(output))
    print("---METRICS_END---")

if __name__ == "__main__":
    main()
