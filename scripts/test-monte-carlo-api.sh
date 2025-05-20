#!/bin/bash

# Test script for Monte Carlo Data Products Integration API

# Configuration
API_BASE_URL="http://localhost:3003/api/monte-carlo/data-products"
SAVED_INPUT_ID=""
TEMP_DIR="/tmp/monte-carlo-test"

# Create temp directory
mkdir -p "$TEMP_DIR"

# Text colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper function for printing
print_header() {
  printf "\n${BLUE}==== $1 ====${NC}\n"
}

print_success() {
  printf "${GREEN}✓ $1${NC}\n"
}

print_error() {
  printf "${RED}✗ $1${NC}\n"
}

print_info() {
  printf "${YELLOW}ℹ $1${NC}\n"
}

# Test 1: Import simulation inputs
print_header "Testing Import Simulation Inputs"
curl -s "$API_BASE_URL?action=inputs" > "$TEMP_DIR/inputs.json"
IMPORTS_COUNT=$(cat "$TEMP_DIR/inputs.json" | grep -o '"inputs":' | wc -l)

if [ $IMPORTS_COUNT -ge 1 ]; then
  print_success "Successfully imported simulation inputs"
  # Extract the first input ID for later tests
  SAVED_INPUT_ID=$(cat "$TEMP_DIR/inputs.json" | grep -o '"id":"[^"]*"' | head -1 | sed 's/"id":"//;s/"//')
  print_info "Saved input ID: $SAVED_INPUT_ID"
else
  print_error "Failed to import simulation inputs"
fi

# Test 2: Import simulation outputs
print_header "Testing Import Simulation Outputs"
curl -s "$API_BASE_URL?action=outputs" > "$TEMP_DIR/outputs.json"
OUTPUTS_COUNT=$(cat "$TEMP_DIR/outputs.json" | grep -o '"outputs":' | wc -l)

if [ $OUTPUTS_COUNT -ge 1 ]; then
  print_success "Successfully imported simulation outputs"
else
  print_error "Failed to import simulation outputs"
fi

# Test 3: Export simulation inputs
print_header "Testing Export Simulation Inputs"
EXPORT_RESULT=$(curl -s -X POST "$API_BASE_URL?action=inputs/export" -H "Content-Type: application/json")
EXPORT_SUCCESS=$(echo "$EXPORT_RESULT" | grep -o '"success":true' | wc -l)

if [ $EXPORT_SUCCESS -ge 1 ]; then
  print_success "Successfully exported simulation inputs"
else
  print_error "Failed to export simulation inputs"
fi

# Test 4: Export simulation outputs
print_header "Testing Export Simulation Outputs"
EXPORT_RESULT=$(curl -s -X POST "$API_BASE_URL?action=outputs/export" -H "Content-Type: application/json")
EXPORT_SUCCESS=$(echo "$EXPORT_RESULT" | grep -o '"success":true' | wc -l)

if [ $EXPORT_SUCCESS -ge 1 ]; then
  print_success "Successfully exported simulation outputs"
else
  print_error "Failed to export simulation outputs"
fi

# Test 5: Get mapping
print_header "Testing Get Mapping"
curl -s "$API_BASE_URL?action=mapping" > "$TEMP_DIR/mapping.json"
MAPPING_SUCCESS=$(cat "$TEMP_DIR/mapping.json" | grep -o '"success":true' | wc -l)

if [ $MAPPING_SUCCESS -ge 1 ]; then
  print_success "Successfully retrieved mapping"
else
  print_error "Failed to retrieve mapping"
fi

# Test 6: Run simulation from data product input (if we have an input ID)
if [ ! -z "$SAVED_INPUT_ID" ]; then
  print_header "Testing Run Simulation From Data Product Input"
  curl -s -X POST "$API_BASE_URL?action=run&inputId=$SAVED_INPUT_ID" > "$TEMP_DIR/run_result.json"
  RUN_SUCCESS=$(cat "$TEMP_DIR/run_result.json" | grep -o '"success":true' | wc -l)
  
  if [ $RUN_SUCCESS -ge 1 ]; then
    print_success "Successfully ran simulation from data product input"
  else
    print_error "Failed to run simulation from data product input"
  fi
else
  print_info "Skipping run simulation test: No input ID available"
fi

# Print summary
print_header "Test Results Summary"
echo "1. Import Inputs: $([ $IMPORTS_COUNT -ge 1 ] && echo "${GREEN}PASSED${NC}" || echo "${RED}FAILED${NC}")"
echo "2. Import Outputs: $([ $OUTPUTS_COUNT -ge 1 ] && echo "${GREEN}PASSED${NC}" || echo "${RED}FAILED${NC}")"
echo "3. Export Inputs: $([ $EXPORT_SUCCESS -ge 1 ] && echo "${GREEN}PASSED${NC}" || echo "${RED}FAILED${NC}")"
echo "4. Export Outputs: $([ $EXPORT_SUCCESS -ge 1 ] && echo "${GREEN}PASSED${NC}" || echo "${RED}FAILED${NC}")"
echo "5. Get Mapping: $([ $MAPPING_SUCCESS -ge 1 ] && echo "${GREEN}PASSED${NC}" || echo "${RED}FAILED${NC}")"

if [ ! -z "$SAVED_INPUT_ID" ]; then
  echo "6. Run Simulation: $([ $RUN_SUCCESS -ge 1 ] && echo "${GREEN}PASSED${NC}" || echo "${RED}FAILED${NC}")"
fi

# Clean up
print_header "Cleaning Up"
rm -rf "$TEMP_DIR"
print_success "Removed temporary files"

print_header "Test Completed"