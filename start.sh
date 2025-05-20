#!/bin/bash
# Unified startup script for 2025-SCB-Sapphire-UIUX
# Starts both frontend and backend services

# Colors and formatting
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color
BOLD='\033[1m'

echo -e "${BLUE}${BOLD}=====================================${NC}"
echo -e "${BLUE}${BOLD}  2025-SCB-Sapphire-UIUX Launcher   ${NC}"
echo -e "${BLUE}${BOLD}=====================================${NC}"

# Get directory of this script
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Start backend services in the background
echo -e "${YELLOW}Starting backend services...${NC}"
cd "$DIR"
python3 backend/start_backend.py &
BACKEND_PID=$!

# Give the backend a moment to start
sleep 2

# Start frontend development server
echo -e "${YELLOW}Starting frontend development server...${NC}"
cd "$DIR"
if [ ! -d "node_modules" ]; then
  echo -e "${YELLOW}Installing frontend dependencies...${NC}"
  npm install
fi

# Start Next.js dev server
echo -e "${GREEN}Starting Next.js development server...${NC}"
npm run dev &
FRONTEND_PID=$!

# Function to handle script termination
cleanup() {
  echo -e "\n${YELLOW}Shutting down services...${NC}"
  kill $BACKEND_PID 2>/dev/null
  kill $FRONTEND_PID 2>/dev/null
  echo -e "${GREEN}All services stopped.${NC}"
  exit 0
}

# Set up cleanup trap
trap cleanup INT TERM EXIT

echo -e "\n${GREEN}${BOLD}=====================================${NC}"
echo -e "${GREEN}${BOLD}  All services started successfully  ${NC}"
echo -e "${GREEN}${BOLD}=====================================${NC}"
echo -e "${BOLD}Frontend: ${NC}http://localhost:3000"
echo -e "${BOLD}Backend API: ${NC}http://localhost:8888"
echo -e "${BOLD}Jena SPARQL: ${NC}http://localhost:3030/tariff_research/sparql"
echo -e "${BOLD}Dashboard: ${NC}http://localhost:8001"
echo -e "\n${YELLOW}Press Ctrl+C to stop all services${NC}"

# Keep script running until user interrupts
wait