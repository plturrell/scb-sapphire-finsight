# Vercel Deployment Guide for Sapphire FinSight

This guide explains how to deploy the integrated Sapphire FinSight application to Vercel, including both the Next.js frontend and Python backend components.

## Prerequisites

- A Vercel account
- The Vercel CLI installed (`npm i -g vercel`)
- Git repository with the project

## Deployment Steps

### 1. Prepare for Deployment

Before deploying, ensure all changes are committed to the repository:

```bash
git add .
git commit -m "Prepare for Vercel deployment"
```

### 2. Initial Setup with Vercel CLI

If this is your first time deploying the project to Vercel, run:

```bash
vercel login
vercel link
```

Follow the prompts to link your local project to Vercel.

### 3. Configure Environment Variables

Set up the required environment variables in the Vercel project dashboard:

- `NEXT_PUBLIC_API_URL`: URL for the API (leave empty for production)
- `USE_GPU_ACCELERATION`: Set to "false" for Vercel deployment
- `ANALYSIS_RESULTS_PATH`: Set to "/tmp/analysis-results"

You can set these using the Vercel CLI:

```bash
vercel env add NEXT_PUBLIC_API_URL
vercel env add USE_GPU_ACCELERATION
vercel env add ANALYSIS_RESULTS_PATH
```

### 4. Deploy to Vercel

Deploy the project using the Vercel CLI:

```bash
vercel --prod
```

Alternatively, use the automated deploy script:

```bash
node deploy-automatic.js
```

### 5. Initialize the Data

After deployment, you need to initialize the sample data for the Python backend:

1. Visit your deployed URL with the path `/api/python/setup_data`
   Example: `https://your-project.vercel.app/api/python/setup_data`

2. This will create sample data in the specified storage path for the Python functions to use.

### 6. Verify API Endpoints

Test each API endpoint to ensure they're working correctly:

- `/api/python/metrics`
- `/api/python/impacts`
- `/api/python/finance-options`
- `/api/python/recommendations`
- `/api/python/real-time-update`
- `/api/python/sparql`

### 7. Test Frontend Integration

Visit your deployed frontend and verify that it's correctly fetching data from the Python backend.

## Architecture Overview

### Frontend (Next.js)

- Deployed as a standard Next.js application on Vercel
- Uses API routes to proxy requests to the Python backend in development
- Directly calls Python functions in production

### Backend (Python)

- Deployed as serverless Python functions on Vercel
- Each endpoint is a separate function
- Data is stored in a temporary directory on the serverless environment
- No GPU acceleration in the Vercel environment (simulated responses)

## Limitations

When deployed to Vercel, be aware of these limitations:

1. **No GPU Acceleration**: The Python functions run without GPU acceleration
2. **Limited Processing Power**: Serverless functions have memory and CPU constraints
3. **Cold Starts**: First requests may be slower due to function initialization
4. **Temporary Storage**: Data is not persistent between function invocations
5. **Execution Timeouts**: Functions will timeout after 30 seconds max

## Troubleshooting

If you encounter issues:

1. **Function Timeouts**: Check Vercel logs for timeout errors. Consider optimizing the code or splitting into smaller functions.
2. **Missing Data**: Verify the setup_data endpoint was called to initialize the sample data.
3. **API Connection Errors**: Check the Next.js API routes are correctly configured to call the Python functions.
4. **Environment Variables**: Ensure all required environment variables are set.

## Advanced Deployment

For production deployments requiring full backend capabilities (including GPU acceleration):

1. Deploy the frontend to Vercel
2. Deploy the full Python backend to a cloud provider supporting GPU instances
3. Configure the frontend to point to the external backend API

## Conclusion

With this setup, the Sapphire FinSight application can be deployed to Vercel with its core functionality intact. For more advanced features like GPU acceleration and permanent data storage, consider a hybrid deployment approach.