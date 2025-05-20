#!/bin/bash

echo "Starting Sapphire Dashboard 2025 with MCTS Integration..."
echo ""

# Check if files exist
if [ ! -f "sapphire_dashboard_2025.html" ]; then
    echo "Error: sapphire_dashboard_2025.html not found!"
    exit 1
fi

if [ ! -f "mcts_impact_analyzer.js" ]; then
    echo "Error: mcts_impact_analyzer.js not found!"
    exit 1
fi

# Start the server
echo "Starting server at http://localhost:8001"
echo ""
echo "Features:"
echo "✓ MCTS-powered Sankey diagram for trade flow visualization"
echo "✓ Time-based impact projections (3M, 6M, 12M, 24M)"
echo "✓ Real-time simulation of complex impact scenarios"
echo "✓ Decision tree visualization for optimal paths"
echo "✓ Risk probability analysis with confidence intervals"
echo "✓ Automatic mitigation strategy recommendations"
echo ""
echo "To use MCTS features:"
echo "1. Navigate to Impact Analysis tab"
echo "2. Click 'Run Simulation' to start MCTS analysis"
echo "3. Use timeline buttons to see projected impacts"
echo "4. Explore decision trees and alternative paths"
echo ""

# Open in browser
open http://localhost:8001/sapphire_dashboard_2025.html

# Start server
python3 -m http.server 8001