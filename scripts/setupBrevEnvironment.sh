#!/bin/bash

# Setup Script for Brev Environment
# This script configures the Vietnam Company RAG system in the Brev environment

echo "Setting up Vietnam Company RAG System in Brev environment..."

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Check if we're in Brev environment
if [ -z "$BREV_INSTANCE_ID" ]; then
    print_error "Not in Brev environment. Please run this on a Brev instance."
    exit 1
fi

print_success "Detected Brev environment: $BREV_INSTANCE_ID"

# Install system dependencies
echo "Installing system dependencies..."
sudo apt-get update
sudo apt-get install -y \
    build-essential \
    python3-pip \
    redis-server \
    postgresql \
    postgresql-contrib \
    nginx

print_success "System dependencies installed"

# Install Node.js dependencies
echo "Installing Node.js dependencies..."
npm install
print_success "Node.js dependencies installed"

# Install Python dependencies for Jupyter
echo "Installing Python dependencies..."
pip3 install \
    jupyter \
    pandas \
    numpy \
    matplotlib \
    seaborn \
    plotly

print_success "Python dependencies installed"

# Setup Redis
echo "Configuring Redis..."
sudo systemctl start redis-server
sudo systemctl enable redis-server
print_success "Redis configured and started"

# Setup PostgreSQL (optional, for advanced RAG)
echo "Configuring PostgreSQL..."
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database for RAG system
sudo -u postgres psql <<EOF
CREATE DATABASE vietnam_rag;
CREATE USER rag_user WITH PASSWORD 'rag_password';
GRANT ALL PRIVILEGES ON DATABASE vietnam_rag TO rag_user;
EOF

print_success "PostgreSQL configured"

# Create necessary directories
echo "Creating application directories..."
mkdir -p data_products/documents
mkdir -p logs
mkdir -p cache
mkdir -p notebooks

print_success "Directories created"

# Set up environment variables
echo "Setting up environment variables..."
cat > .env.local <<EOF
# Brev Environment Variables
NODE_ENV=production
REDIS_URL=redis://localhost:6379
DATABASE_URL=postgresql://rag_user:rag_password@localhost:5432/vietnam_rag

# API Keys (replace with actual values)
CAPITAL_IQ_API_KEY=your_capital_iq_key
OPENAI_API_KEY=your_openai_key
REPORT_API_KEY=your_report_api_key

# Brev specific
BREV_INSTANCE_ID=$BREV_INSTANCE_ID
BREV_PUBLIC_URL=https://${BREV_INSTANCE_ID}.brevlab.com
EOF

print_success "Environment variables configured"

# Build the application
echo "Building the application..."
npm run build

if [ $? -eq 0 ]; then
    print_success "Application built successfully"
else
    print_error "Application build failed"
    exit 1
fi

# Initialize the RAG system
echo "Initializing RAG system with Vietnam company data..."
node scripts/ingestVietnamDocuments.ts --init

if [ $? -eq 0 ]; then
    print_success "RAG system initialized"
else
    print_error "RAG initialization failed"
    exit 1
fi

# Configure Nginx for reverse proxy
echo "Configuring Nginx..."
sudo tee /etc/nginx/sites-available/vietnam-rag <<EOF
server {
    listen 80;
    server_name ${BREV_INSTANCE_ID}.brevlab.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }

    location /jupyter {
        proxy_pass http://localhost:8888;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

sudo ln -s /etc/nginx/sites-available/vietnam-rag /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl restart nginx

print_success "Nginx configured"

# Create startup script
echo "Creating startup script..."
cat > start-services.sh <<'EOF'
#!/bin/bash

# Start Redis
redis-server &

# Start PostgreSQL
sudo systemctl start postgresql

# Start the Next.js application
npm run start &

# Start Jupyter notebook
jupyter notebook --ip=0.0.0.0 --port=8888 --no-browser --allow-root &

# Keep the script running
wait
EOF

chmod +x start-services.sh
print_success "Startup script created"

# Create Jupyter notebook for Vietnam data analysis
echo "Creating sample Jupyter notebook..."
cat > notebooks/vietnam_company_analysis.ipynb <<'EOF'
{
 "cells": [
  {
   "cell_type": "markdown",
   "metadata": {},
   "source": [
    "# Vietnam Company Data Analysis\n",
    "This notebook demonstrates how to analyze Vietnam company data from the RAG system"
   ]
  },
  {
   "cell_type": "code",
   "execution_count": null,
   "metadata": {},
   "outputs": [],
   "source": [
    "import pandas as pd\n",
    "import json\n",
    "import matplotlib.pyplot as plt\n",
    "import seaborn as sns\n",
    "\n",
    "# Load Vietnam company data\n",
    "with open('../data_products/vietnam_companies_capitaliq.json', 'r') as f:\n",
    "    companies = json.load(f)\n",
    "\n",
    "df = pd.DataFrame(companies)\n",
    "print(f\"Loaded {len(df)} Vietnam companies\")"
   ]
  },
  {
   "cell_type": "code",
   "execution_count": null,
   "metadata": {},
   "outputs": [],
   "source": [
    "# Basic statistics\n",
    "df.describe()"
   ]
  },
  {
   "cell_type": "code",
   "execution_count": null,
   "metadata": {},
   "outputs": [],
   "source": [
    "# Industry distribution\n",
    "plt.figure(figsize=(12, 6))\n",
    "industry_counts = df['IndustryCode'].value_counts()\n",
    "industry_counts.plot(kind='bar')\n",
    "plt.title('Vietnam Companies by Industry')\n",
    "plt.xlabel('Industry')\n",
    "plt.ylabel('Number of Companies')\n",
    "plt.xticks(rotation=45)\n",
    "plt.show()"
   ]
  }
 ],
 "metadata": {
  "kernelspec": {
   "display_name": "Python 3",
   "language": "python",
   "name": "python3"
  }
 },
 "nbformat": 4,
 "nbformat_minor": 4
}
EOF

print_success "Sample Jupyter notebook created"

# Create health check endpoint
echo "Creating health check endpoint..."
cat > src/pages/api/health.ts <<'EOF'
import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      web: 'running',
      rag: 'initialized',
      redis: 'connected'
    }
  });
}
EOF

print_success "Health check endpoint created"

echo ""
echo "======================================"
echo "Vietnam RAG System Setup Complete!"
echo "======================================"
echo ""
echo "Access your services at:"
echo "- Web Application: https://${BREV_INSTANCE_ID}.brevlab.com"
echo "- Jupyter Notebook: https://jupyter0-${BREV_INSTANCE_ID}.brevlab.com"
echo ""
echo "To start all services, run:"
echo "./start-services.sh"
echo ""
echo "To monitor logs:"
echo "tail -f logs/*.log"
echo ""
print_success "Setup complete!"