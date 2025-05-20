#!/bin/bash
echo "Starting Sapphire Dashboard 2025..."
cd /Users/apple/projects/tarrif/results
python3 -m http.server 8001 &
SERVER_PID=$!
echo "Dashboard running at http://localhost:8001/sapphire_dashboard_2025.html"
echo "Press Ctrl+C to stop the server"
open http://localhost:8001/sapphire_dashboard_2025.html
wait $SERVER_PID