#!/bin/bash

# Check Vercel Deployment Script
# Usage: ./check-vercel-deployment.sh [deployment_url]

# Default URL if not provided
DEPLOYMENT_URL=${1:-"https://scb-sapphire-finsight-git-main.vercel.app"}

# Text colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}===== SCB Sapphire FinSight Deployment Check =====${NC}\n"
echo -e "Checking deployment at: ${YELLOW}${DEPLOYMENT_URL}${NC}\n"

# Basic URL check
echo -e "${CYAN}[1/5] Checking basic connectivity...${NC}"
if curl -s --head --request GET ${DEPLOYMENT_URL} | grep "200" > /dev/null; then 
  echo -e "${GREEN}✓ Homepage is accessible (200 OK)${NC}"
else
  echo -e "${RED}✗ Homepage is NOT accessible. Please check deployment status.${NC}"
  exit 1
fi

# Function to check a specific page
check_page() {
  local page=$1
  local name=$2
  echo -e "\n${CYAN}Checking ${name} page:${NC}"
  
  if curl -s --head --request GET ${DEPLOYMENT_URL}${page} | grep "200\|304" > /dev/null; then 
    echo -e "${GREEN}✓ ${name} page is accessible${NC}"
    return 0
  else
    echo -e "${RED}✗ ${name} page returned non-200 status${NC}"
    return 1
  fi
}

# Check critical pages (previously problematic pages)
echo -e "\n${CYAN}[2/5] Checking problematic pages...${NC}"
problematic_count=0
total_problematic=7

check_page "/dashboard" "Dashboard" || ((problematic_count++))
check_page "/financial-simulation" "Financial Simulation" || ((problematic_count++))
check_page "/tariff-alerts" "Tariff Alerts" || ((problematic_count++))
check_page "/tariff-scanner" "Tariff Scanner" || ((problematic_count++))
check_page "/vietnam-monte-carlo" "Vietnam Monte Carlo" || ((problematic_count++))
check_page "/vietnam-monte-carlo-enhanced" "Vietnam Monte Carlo Enhanced" || ((problematic_count++))
check_page "/vietnam-tariff-impact" "Vietnam Tariff Impact" || ((problematic_count++))

if [ $problematic_count -eq 0 ]; then
  echo -e "\n${GREEN}✓ All previously problematic pages are accessible!${NC}"
else
  echo -e "\n${YELLOW}⚠ ${problematic_count}/${total_problematic} problematic pages are still inaccessible${NC}"
fi

# Check API endpoints
echo -e "\n${CYAN}[3/5] Checking API endpoints...${NC}"
api_count=0
total_api=3

if curl -s --request GET ${DEPLOYMENT_URL}/api/health | grep "ok\|healthy\|ready" > /dev/null; then 
  echo -e "${GREEN}✓ Health API is working${NC}"
else
  echo -e "${RED}✗ Health API is NOT working${NC}"
  ((api_count++))
fi

if curl -s --request GET ${DEPLOYMENT_URL}/api/data-products/health | grep "ok\|healthy\|ready" > /dev/null; then 
  echo -e "${GREEN}✓ Data Products API is working${NC}"
else
  echo -e "${RED}✗ Data Products API is NOT working${NC}"
  ((api_count++))
fi

if curl -s --head --request GET ${DEPLOYMENT_URL}/api/market-news | grep "200\|400\|401\|404" > /dev/null; then 
  echo -e "${GREEN}✓ Market News API is accessible${NC}"
else
  echo -e "${RED}✗ Market News API is NOT accessible${NC}"
  ((api_count++))
fi

if [ $api_count -eq 0 ]; then
  echo -e "\n${GREEN}✓ All API endpoints are working!${NC}"
else
  echo -e "\n${YELLOW}⚠ ${api_count}/${total_api} API endpoints are not working${NC}"
fi

# Check static assets
echo -e "\n${CYAN}[4/5] Checking static assets...${NC}"
asset_count=0
total_assets=3

if curl -s --head --request GET ${DEPLOYMENT_URL}/favicon.ico | grep "200" > /dev/null; then 
  echo -e "${GREEN}✓ Favicon is accessible${NC}"
else
  echo -e "${RED}✗ Favicon is NOT accessible${NC}"
  ((asset_count++))
fi

if curl -s --head --request GET ${DEPLOYMENT_URL}/images/finsight-logo.svg | grep "200" > /dev/null; then 
  echo -e "${GREEN}✓ Logo image is accessible${NC}"
else
  echo -e "${RED}✗ Logo image is NOT accessible${NC}"
  ((asset_count++))
fi

if curl -s --head --request GET ${DEPLOYMENT_URL}/_next/static/css/ | grep "200" > /dev/null; then 
  echo -e "${GREEN}✓ CSS assets are accessible${NC}"
else
  echo -e "${RED}✗ CSS assets are NOT accessible${NC}"
  ((asset_count++))
fi

if [ $asset_count -eq 0 ]; then
  echo -e "\n${GREEN}✓ All static assets are accessible!${NC}"
else
  echo -e "\n${YELLOW}⚠ ${asset_count}/${total_assets} static assets are not accessible${NC}"
fi

# Summary
echo -e "\n${CYAN}[5/5] Deployment Health Summary:${NC}"
total_issues=$((problematic_count + api_count + asset_count))

if [ $total_issues -eq 0 ]; then
  echo -e "\n${GREEN}✓ DEPLOYMENT LOOKS HEALTHY! All checks passed.${NC}"
  echo -e "\n${CYAN}Recommendation:${NC} This deployment appears ready for production use."
elif [ $total_issues -lt 3 ]; then
  echo -e "\n${YELLOW}⚠ DEPLOYMENT HAS MINOR ISSUES:${NC} ${total_issues} checks failed."
  echo -e "\n${CYAN}Recommendation:${NC} Review the issues above before promoting to production."
else
  echo -e "\n${RED}✗ DEPLOYMENT HAS SIGNIFICANT ISSUES:${NC} ${total_issues} checks failed."
  echo -e "\n${CYAN}Recommendation:${NC} Fix the issues before proceeding with deployment."
fi

echo -e "\n${CYAN}=================================================${NC}"