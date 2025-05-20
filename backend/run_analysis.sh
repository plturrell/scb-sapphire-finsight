#!/bin/bash
# Run Tariff Impact Analysis with Monte Carlo Simulation
# This script launches the tariff analysis workflow with default parameters

echo "========================================================"
echo "              Tariff Impact Analysis Tool               "
echo "             Advanced Monte Carlo Engine                "
echo "========================================================"

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "Error: Python 3 is required but not found."
    exit 1
fi

# Ensure script is executable
SCRIPT_DIR=$(dirname "$0")
RUNNER_SCRIPT="${SCRIPT_DIR}/run_tariff_analysis.py"

if [ ! -x "$RUNNER_SCRIPT" ]; then
    chmod +x "$RUNNER_SCRIPT"
fi

# Default parameters
TARIFF_RATE=0.15
COMPANY_NAME="Global TechCorp"
ITERATIONS=100000
SAMPLING_METHOD="latin_hypercube"
PROFILE="balanced"
OPEN_DASHBOARD=1

# Process command line options
while [[ $# -gt 0 ]]; do
    key="$1"
    case $key in
        --tariff-rate)
        TARIFF_RATE="$2"
        shift
        shift
        ;;
        --company-name)
        COMPANY_NAME="$2"
        shift
        shift
        ;;
        --iterations)
        ITERATIONS="$2"
        shift
        shift
        ;;
        --sampling-method)
        SAMPLING_METHOD="$2"
        shift
        shift
        ;;
        --profile)
        PROFILE="$2"
        shift
        shift
        ;;
        --no-open)
        OPEN_DASHBOARD=0
        shift
        ;;
        *)
        echo "Unknown option: $1"
        shift
        ;;
    esac
done

# Build the command
CMD="python3 $RUNNER_SCRIPT --tariff-rate $TARIFF_RATE --company-name \"$COMPANY_NAME\" --iterations $ITERATIONS --sampling-method $SAMPLING_METHOD --profile $PROFILE --run-all"

if [ $OPEN_DASHBOARD -eq 1 ]; then
    CMD="$CMD --open-dashboard"
fi

echo "Starting analysis with the following parameters:"
echo "  - Tariff Rate: $TARIFF_RATE (${TARIFF_RATE/./}%)"
echo "  - Company: $COMPANY_NAME"
echo "  - Iterations: $ITERATIONS"
echo "  - Sampling Method: $SAMPLING_METHOD"
echo "  - Performance Profile: $PROFILE"
echo ""
echo "Running analysis workflow..."
echo "This may take several minutes depending on the complexity of the analysis."
echo ""

# Run the analysis
eval $CMD

exit $?