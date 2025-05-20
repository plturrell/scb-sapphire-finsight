# NVIDIA API Integration Guide

This document explains how to set up and use the NVIDIA API integration for GPU-accelerated tariff impact analysis in the Sapphire FinSight application.

## Overview

The Sapphire FinSight application can leverage NVIDIA's powerful GPU capabilities through their cloud APIs for computationally intensive tasks, such as:

- Deep financial analysis
- Monte Carlo simulations
- Real-time data processing
- Complex scenario modeling

This hybrid deployment approach combines Vercel for the frontend and static API functions with NVIDIA's GPU-powered APIs for the heavy computational work.

## Architecture

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│                 │         │                  │         │                 │
│  Next.js        │ ───────>│  Vercel          │         │  NVIDIA         │
│  Frontend       │         │  Serverless      │ ───────>│  GPU-powered    │
│  (Vercel)       │         │  Functions       │         │  APIs           │
│                 │         │                  │         │                 │
└─────────────────┘         └──────────────────┘         └─────────────────┘
```

## Setup Instructions

### 1. NVIDIA API Account Setup

1. Sign up for an NVIDIA API account at [NVIDIA Developer Portal](https://developer.nvidia.com/)
2. Create a new API key in your NVIDIA developer dashboard
3. Note your API key, client ID and client secret

### 2. Environment Configuration

Create a `.env.local` file in the project root with the following variables:

```
# NVIDIA API configuration
NVIDIA_API_KEY=your_api_key_here
NVIDIA_API_URL=https://api.nvidia.com/v1
NVIDIA_MODEL_ID=nvidia/research-llm-70b

# Deployment configuration
NEXT_PUBLIC_USE_HYBRID_DEPLOYMENT=true
NEXT_PUBLIC_API_URL=https://your-gpu-backend-url.com
```

### 3. Deployment Options

#### Option A: Using NVIDIA Directly from Vercel

This approach uses Vercel serverless functions that call NVIDIA APIs directly:

1. Deploy the Next.js app to Vercel
2. Set the required environment variables in Vercel dashboard
3. The serverless functions will make API calls to NVIDIA services

```bash
# Deploy to Vercel
vercel --prod
```

#### Option B: Using a Custom GPU Backend

For more advanced scenarios or custom processing, deploy a dedicated backend:

1. Deploy the Next.js app to Vercel
2. Deploy the Python backend to a server with the NVIDIA integration
3. Point the Next.js app to your custom backend via environment variables

```bash
# Deploy backend
cd backend
./deploy-gpu-backend.sh
```

## API Integration

The application uses the `nvidia_integration.py` module to interact with NVIDIA's APIs. The main capabilities include:

### Tariff Impact Analysis

```python
# Initialize client
nvidia_client = NvidiaAPIClient(api_key="your_api_key")

# Analyze tariff impacts
impacts = nvidia_client.analyze_tariff_impacts({
    "name": "Samsung Electronics Vietnam",
    "industry": "Electronics",
    "annual_revenue": 60000000000,
    "employee_count": 160000,
    "us_export_percentage": 35.0
})
```

### Monte Carlo Simulation

```python
# Run GPU-accelerated Monte Carlo simulation
results = nvidia_client.run_monte_carlo_simulation({
    "tariff_rate": 46.0,
    "negotiation_chance": 0.3,
    "market_adaptability": 0.5
}, iterations=10000)
```

### Mitigation Strategy Analysis

```python
# Analyze optimal mitigation strategies
strategies = nvidia_client.analyze_mitigation_strategies(
    impacts=impact_data,
    company_profile=company_data
)
```

## Frontend Integration

The frontend uses the `utils/api.js` module to communicate with the backend, which in turn calls the NVIDIA APIs. This abstraction allows for seamless switching between local development, Vercel-only deployment, and hybrid deployment with NVIDIA GPU acceleration.

For example, to run a Monte Carlo simulation:

```javascript
import { tariffApi } from '../utils/api';

// Run Monte Carlo simulation
const runSimulation = async () => {
  try {
    const parameters = {
      tariffRate: 46.0,
      negotiationChance: 0.3,
      marketAdaptability: 0.5
    };
    
    const results = await tariffApi.runMonteCarloSimulation(parameters);
    setSimulationResults(results);
  } catch (error) {
    console.error('Error running simulation:', error);
  }
};
```

## Performance Considerations

- NVIDIA GPU-accelerated APIs provide significant performance improvements for computationally intensive tasks
- Monte Carlo simulations run 10-100x faster compared to CPU-based processing
- Real-time analysis becomes possible for complex financial modeling
- Consider costs when using NVIDIA APIs for high-volume processing

## Testing the Integration

To verify the NVIDIA integration is working correctly:

1. Set up environment variables with your NVIDIA API credentials
2. Run the integration test script:

```bash
cd backend
python nvidia_integration.py
```

3. Check the output for successful API calls and responses

## Troubleshooting

- **API Key Issues**: Ensure your NVIDIA API key is valid and has the correct permissions
- **Rate Limiting**: Check if you're hitting rate limits on the NVIDIA API
- **Connection Errors**: Verify network connectivity to NVIDIA endpoints
- **Model Availability**: Confirm the requested model ID is available in your account

## References

- [NVIDIA API Documentation](https://developer.nvidia.com/docs)
- [NVIDIA Developer Resources](https://developer.nvidia.com/resources)
- [Next.js API Routes Documentation](https://nextjs.org/docs/api-routes/introduction)
- [Vercel Deployment Documentation](https://vercel.com/docs/deployments)