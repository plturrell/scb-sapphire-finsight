#!/bin/bash

echo "Starting Sapphire Dashboard with Jena Integration..."
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "Error: Python 3 is required but not installed."
    exit 1
fi

# Check if Flask is installed
if ! python3 -c "import flask" &> /dev/null; then
    echo "Installing Flask and dependencies..."
    pip3 install flask flask-cors
fi

# Start Jena API server in background
echo "Starting Jena Data API Server on port 5000..."
python3 jena_api_server.py &
JENA_PID=$!
echo "Jena API Server PID: $JENA_PID"

# Wait for Jena server to start
sleep 3

# Start dashboard server
echo ""
echo "Starting Dashboard Server on port 8001..."
echo ""
echo "Dashboard Features:"
echo "✓ Real-time data from Jena RDF store"
echo "✓ Live Sankey diagram visualization" 
echo "✓ Dynamic KPI updates"
echo "✓ Interactive charts"
echo "✓ Data refresh capabilities"
echo ""
echo "Access the dashboard at: http://localhost:8001/sapphire_dashboard_fixed.html"
echo ""

# Open dashboard in browser
open http://localhost:8001/sapphire_dashboard_fixed.html

# Start HTTP server for dashboard
python3 -m http.server 8001 &
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

# Wait for interrupt
wait