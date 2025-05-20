#!/bin/bash

echo "Starting Sapphire Dashboard with Jena Integration..."
echo ""

# Kill any existing processes on our ports
echo "Cleaning up existing processes..."
lsof -ti:5000 | xargs kill -9 2>/dev/null
lsof -ti:8002 | xargs kill -9 2>/dev/null

# Start Jena API server in background
echo "Starting Jena Data Server on port 5000..."
python3 simple_jena_server.py &
JENA_PID=$!
echo "Jena Server PID: $JENA_PID"

# Wait for Jena server to start
sleep 2

# Start dashboard server
echo ""
echo "Starting Dashboard Server on port 8002..."
echo ""
echo "Dashboard Features:"
echo "✓ Real-time data from Jena RDF store"
echo "✓ Live Sankey diagram visualization" 
echo "✓ Dynamic KPI updates"
echo "✓ Interactive charts"
echo "✓ Data refresh capabilities"
echo ""
echo "Access the dashboard at: http://localhost:8002/sapphire_dashboard_fixed.html"
echo ""

# Open dashboard in browser
open http://localhost:8002/sapphire_dashboard_fixed.html

# Start HTTP server for dashboard
python3 -m http.server 8002 &
DASHBOARD_PID=$!
echo "Dashboard Server PID: $DASHBOARD_PID"

echo ""
echo "Both servers are running. Press Ctrl+C to stop."
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "Stopping servers..."
    kill $JENA_PID 2>/dev/null
    kill $DASHBOARD_PID 2>/dev/null
    echo "Servers stopped."
    exit 0
}

# Set trap to cleanup on Ctrl+C
trap cleanup INT

# Wait
wait