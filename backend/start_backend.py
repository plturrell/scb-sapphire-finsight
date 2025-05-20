#!/usr/bin/env python3
"""
Backend Service Launcher for 2025-SCB-Sapphire-UIUX
Coordinates all backend services for the Finsight App
"""

import os
import sys
import argparse
import subprocess
import threading
import time
from pathlib import Path

# Get the absolute path to the backend directory
BACKEND_DIR = Path(__file__).resolve().parent
API_DIR = BACKEND_DIR / 'api'
ANALYSIS_DIR = BACKEND_DIR / 'analysis'
RESULTS_DIR = BACKEND_DIR / 'results'

def start_api_server(port=8888):
    """Start the API server"""
    print(f"Starting API server on port {port}...")
    api_script = API_DIR / 'api_server.py'
    
    # Create a modified version of the script with the correct results path
    with open(api_script, 'r') as f:
        script_content = f.read()
    
    # Update the results directory path
    script_content = script_content.replace(
        'results_dir = Path("results")', 
        f'results_dir = Path("{RESULTS_DIR}")'
    )
    
    temp_script = API_DIR / 'api_server_temp.py'
    with open(temp_script, 'w') as f:
        f.write(script_content)
    
    # Make it executable
    os.chmod(temp_script, 0o755)
    
    # Launch the API server
    api_process = subprocess.Popen(
        [sys.executable, str(temp_script)],
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        universal_newlines=True
    )
    
    # Wait for server to start
    time.sleep(2)
    
    return api_process

def start_jena_server(port=3030):
    """Start the Jena server"""
    print(f"Starting Jena integration on port {port}...")
    jena_script = API_DIR / 'jena_integration.py'
    
    # Create a modified version of the script with the correct results path
    with open(jena_script, 'r') as f:
        script_content = f.read()
    
    # Update the results directory path
    script_content = script_content.replace(
        'results_dir = Path("results")', 
        f'results_dir = Path("{RESULTS_DIR}")'
    )
    
    temp_script = API_DIR / 'jena_integration_temp.py'
    with open(temp_script, 'w') as f:
        f.write(script_content)
    
    # Make it executable
    os.chmod(temp_script, 0o755)
    
    # Launch the Jena server
    jena_process = subprocess.Popen(
        [sys.executable, str(temp_script)],
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        universal_newlines=True
    )
    
    # Wait for server to start
    time.sleep(2)
    
    return jena_process

def start_dashboard(port=8001):
    """Start the dashboard viewer"""
    print(f"Starting dashboard viewer on port {port}...")
    dashboard_script = RESULTS_DIR / 'run_dashboard.py'
    
    # Create a modified version of the script with the correct paths
    with open(dashboard_script, 'r') as f:
        script_content = f.read()
    
    # Update paths
    script_content = script_content.replace(
        'os.chdir("results")', 
        f'os.chdir("{RESULTS_DIR}")'
    )
    
    temp_script = RESULTS_DIR / 'run_dashboard_temp.py'
    with open(temp_script, 'w') as f:
        f.write(script_content)
    
    # Make it executable
    os.chmod(temp_script, 0o755)
    
    # Launch the dashboard viewer
    dashboard_process = subprocess.Popen(
        [sys.executable, str(temp_script)],
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        universal_newlines=True
    )
    
    return dashboard_process

def start_all_services():
    """Start all backend services"""
    print("Starting all Sapphire backend services...")
    
    processes = []
    
    # Start API server
    api_process = start_api_server()
    processes.append(("API Server", api_process))
    
    # Start Jena integration
    jena_process = start_jena_server()
    processes.append(("Jena Server", jena_process))
    
    # Start dashboard viewer
    dashboard_process = start_dashboard()
    processes.append(("Dashboard Viewer", dashboard_process))
    
    print("\nAll services started successfully!")
    print("=" * 50)
    print("Service endpoints:")
    print("- API server: http://localhost:8888")
    print("- Jena SPARQL endpoint: http://localhost:3030/tariff_research/sparql")
    print("- Dashboard viewer: http://localhost:8001")
    print("=" * 50)
    
    # Monitor processes and redirect output
    def monitor_process(name, process):
        for line in process.stdout:
            print(f"[{name}] {line.strip()}")
    
    threads = []
    for name, process in processes:
        thread = threading.Thread(target=monitor_process, args=(name, process), daemon=True)
        thread.start()
        threads.append(thread)
    
    try:
        # Keep the main thread alive until interrupted
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nShutting down all services...")
        for _, process in processes:
            process.terminate()
        
        print("All services stopped.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Start backend services for Sapphire FinSight")
    parser.add_argument("--api-only", action="store_true", help="Start only the API server")
    parser.add_argument("--jena-only", action="store_true", help="Start only the Jena server")
    parser.add_argument("--dashboard-only", action="store_true", help="Start only the dashboard viewer")
    
    args = parser.parse_args()
    
    if args.api_only:
        start_api_server()
    elif args.jena_only:
        start_jena_server()
    elif args.dashboard_only:
        start_dashboard()
    else:
        start_all_services()