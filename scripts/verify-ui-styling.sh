#!/bin/bash

# Verify UI Styling Script
# Usage: ./verify-ui-styling.sh [deployment_url]

# Default URL if not provided
DEPLOYMENT_URL=${1:-"https://scb-sapphire-finsight-git-main.vercel.app"}

# Text colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}===== SCB Sapphire FinSight UI Styling Verification =====${NC}\n"
echo -e "Checking UI at: ${YELLOW}${DEPLOYMENT_URL}${NC}\n"

# Function to check if a specific CSS feature is loaded
check_css() {
  local url=$1
  local selector=$2
  local property=$3
  local description=$4
  
  echo -e "\n${CYAN}Checking ${description}...${NC}"
  
  # Use curl to fetch the page and check if the specified CSS feature is present
  if curl -s "${url}" | grep -q "${selector}.*${property}"; then
    echo -e "${GREEN}✓ ${description} is properly styled${NC}"
    return 0
  else
    echo -e "${RED}✗ ${description} styling is missing${NC}"
    return 1
  fi
}

# Check if SC Prosper Sans fonts are correctly loaded
echo -e "${CYAN}[1/5] Checking font integration...${NC}"
if curl -s "${DEPLOYMENT_URL}" | grep -q "SC Prosper Sans"; then
  echo -e "${GREEN}✓ SC Prosper Sans font references found${NC}"
else
  echo -e "${RED}✗ SC Prosper Sans font references not found${NC}"
fi

# Check for font preloads
if curl -s "${DEPLOYMENT_URL}" | grep -q "preload.*fonts/SCProsperSans"; then
  echo -e "${GREEN}✓ Font preloads are in place${NC}"
else
  echo -e "${RED}✗ Font preloads are missing${NC}"
fi

# Check for Chakra theme integration
echo -e "\n${CYAN}[2/5] Checking Chakra UI theme...${NC}"
if curl -s "${DEPLOYMENT_URL}" | grep -q "ChakraProvider.*theme"; then
  echo -e "${GREEN}✓ Chakra theme integration found${NC}"
else
  echo -e "${RED}✗ Chakra theme integration missing${NC}"
fi

# Check SCB color variables
echo -e "\n${CYAN}[3/5] Checking SCB color variables...${NC}"
if curl -s "${DEPLOYMENT_URL}" | grep -q "scb-honolulu-blue"; then
  echo -e "${GREEN}✓ SCB color variables found${NC}"
else
  echo -e "${RED}✗ SCB color variables missing${NC}"
fi

# Check for responsive design elements
echo -e "\n${CYAN}[4/5] Checking responsive design elements...${NC}"
if curl -s "${DEPLOYMENT_URL}" | grep -q "lg:hidden\\|md:block"; then
  echo -e "${GREEN}✓ Responsive design patterns found${NC}"
else
  echo -e "${RED}✗ Responsive design patterns missing${NC}"
fi

# Check typography classes
echo -e "\n${CYAN}[5/5] Checking typography styles...${NC}"
if curl -s "${DEPLOYMENT_URL}" | grep -q "scb-title\\|scb-section-header"; then
  echo -e "${GREEN}✓ Typography classes found${NC}"
else
  echo -e "${RED}✗ Typography classes missing${NC}"
fi

echo -e "\n${CYAN}=== RECOMMENDED FIXES ===${NC}"
echo -e "${YELLOW}1. Verify that all CSS imports in _app.tsx are working correctly${NC}"
echo -e "${YELLOW}2. Check that Chakra theme is correctly applied with SCB variables${NC}"
echo -e "${YELLOW}3. Ensure font files are correctly deployed to /fonts/ directory${NC}"
echo -e "${YELLOW}4. Add font-display: swap to font-face declarations for better loading${NC}"
echo -e "${YELLOW}5. Inspect the deployed page using browser DevTools to see styling inconsistencies${NC}"

echo -e "\n${CYAN}=================================================${NC}"