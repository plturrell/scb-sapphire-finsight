# SCB Sapphire FinSight Deployment Guide

## Recent Build Fixes

We've implemented several changes to fix the build process issues related to Terser minification:

### 1. Removed Terser Dependency

The main issue was with Terser minification during the build process. We've completely removed this dependency by:

- Disabling minification in the webpack configuration
- Removing any Terser plugins from the minimizer array
- Using a simpler source map strategy that doesn't require Terser

### 2. Fixed Output Configuration

We resolved conflicting output settings by:

- Setting `output: 'export'` in Next.js config (previously had conflicting 'standalone' setting)
- Ensuring the build script in package.json aligns with this configuration
- Configuring Vercel to use the standard build process

### 3. Perplexity API Integration

All the Perplexity API enhancements remain intact:

- Using the correct model name: 'sonar' (not 'sonar-small-chat')
- Using the verified working API key: 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
- Robust error handling, timeout management, and retry logic

## Deployment Instructions

### Standard Deployment

1. Push changes to the main branch on GitHub
2. Vercel will automatically deploy the application
3. The build process will now skip Terser minification

### Manual Deployment

If you need to deploy manually:

```bash
# Install dependencies
npm install --legacy-peer-deps

# Build the application
npm run build

# The output will be in the 'out' directory
```

## Troubleshooting

If you encounter any build issues:

1. Check the Vercel deployment logs for specific errors
2. Ensure the webpack configuration in next.config.js has minification disabled
3. Verify that the output setting in next.config.js is set to 'export'
4. Confirm that all required environment variables are set in Vercel

## Perplexity API Configuration

The application is configured to use the following Perplexity API settings:

- **API Key**: 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
- **Model**: sonar
- **Rate Limits**: Properly handled with backoff strategy
- **Error Handling**: Comprehensive retry logic implemented

## Future Improvements

1. Consider alternative minification tools that don't rely on Terser
2. Implement more extensive unit testing for the API integration
3. Explore using a service worker for offline caching of news data
