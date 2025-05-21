#!/bin/bash

# Test script for Perplexity API endpoints
# This script will test all the migrated endpoints to ensure they're working correctly

echo "============================================"
echo "Testing Perplexity API Endpoints"
echo "============================================"

# Test the perplexity-proxy endpoint
echo "\nTesting perplexity-proxy endpoint..."
curl -s -X POST http://localhost:3001/api/perplexity-proxy \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"role": "user", "content": "Test message for perplexity-proxy"}], "temperature": 0.2, "max_tokens": 30}' | head -n 30

# Test the perplexity-simple endpoint
echo "\n\nTesting perplexity-simple endpoint..."
curl -s -X POST http://localhost:3001/api/perplexity-simple \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"role": "user", "content": "Test message for perplexity-simple"}]}' | head -n 30

# Test the perplexity-centralized endpoint
echo "\n\nTesting perplexity-centralized endpoint..."
curl -s -X POST http://localhost:3001/api/perplexity-centralized \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"role": "user", "content": "Test message for perplexity-centralized"}], "temperature": 0.2, "max_tokens": 30}' | head -n 30

# Test the market-news endpoint
echo "\n\nTesting market-news endpoint..."
curl -s "http://localhost:3001/api/market-news?topic=forex&limit=1" | head -n 30

# Test the tariff-search endpoint
echo "\n\nTesting tariff-search endpoint..."
curl -s -X POST http://localhost:3001/api/tariff-search \
  -H "Content-Type: application/json" \
  -d '{"product": "electronics", "sourceCountry": "China", "destinationCountry": "United States"}' | head -n 30

# Test the debug endpoint
echo "\n\nTesting perplexity-debug endpoint..."
curl -s http://localhost:3001/api/perplexity-debug | head -n 30

echo "\n\nTesting complete!"
echo "============================================"
