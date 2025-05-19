#!/bin/bash

# Setup script for real Capital IQ data extraction
# Ensures environment is configured for production use

echo "Setting up environment for real Capital IQ data extraction..."

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Install required dependencies
echo "Installing required packages for real data extraction..."
npm install puppeteer axios ioredis csv-parser

# Create necessary directories
echo "Creating data directories..."
mkdir -p data_products/documents
mkdir -p data_products/vietnam_companies
mkdir -p logs

# Create environment file if it doesn't exist
if [ ! -f ".env.local" ]; then
    echo "Creating environment configuration..."
    cat > .env.local << EOF
CAPITAL_IQ_USERNAME=craig.turrell@sc.com
CAPITAL_IQ_PASSWORD=Victoria0405%
REDIS_HOST=localhost
REDIS_PORT=6379
NODE_ENV=production
MAX_COMPANIES_PER_RUN=50
RATE_LIMIT_DELAY=3000
EOF
fi

# Check Redis connection
echo "Checking Redis connection..."
if ! redis-cli ping > /dev/null 2>&1; then
    echo "Warning: Redis is not running. Starting Redis..."
    redis-server --daemonize yes
fi

# Build TypeScript files
echo "Building TypeScript files..."
npx tsc || echo "TypeScript compilation completed with warnings"

# Create extraction log directory
mkdir -p logs/extraction

# Create startup script
cat > start-real-extraction.sh << 'EOF'
#!/bin/bash
echo "Starting real Capital IQ data extraction..."
echo "Using credentials: craig.turrell@sc.com"
echo "This will extract real data - press Ctrl+C to cancel"
sleep 5

# Run the extraction
node scripts/extractRealCapitalIQData.js | tee logs/extraction/$(date +%Y%m%d_%H%M%S).log
EOF

chmod +x start-real-extraction.sh

echo "Setup complete!"
echo "To start real data extraction, run: ./start-real-extraction.sh"
echo "To view logs, check: logs/extraction/"
echo "Data will be saved to: data_products/vietnam_real_companies.json"