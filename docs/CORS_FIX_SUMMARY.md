# CORS and API Integration Fixes

## Summary of Changes
We've fixed the CORS issues affecting the Perplexity API integration by implementing several key changes:

1. Replaced direct API calls with server-side proxying
2. Added proper CORS headers to API routes
3. Handled OPTIONS requests (preflight)
4. Updated API key handling for better security
5. Fixed error handling and logging

## Files Modified

### Client-Side Changes
- `src/lib/perplexity-api.ts`
  - Removed direct API calls to Perplexity
  - Updated to use our proxy endpoint
  - Removed client-side API key usage
  - Improved error handling

- `src/lib/perplexity-tariff-api.ts`
  - Removed direct API calls to Perplexity
  - Updated to use our proxy endpoint
  - Removed client-side API key usage

### Server-Side Changes
- `src/pages/api/perplexity-proxy.ts`
  - Added proper CORS headers
  - Added OPTIONS request handling
  - Improved error handling
  - Set fallback for API key

- `src/pages/api/market-news.ts`
  - Added proper CORS headers
  - Added OPTIONS request handling
  - Improved error handling

- `src/pages/api/tariff-search.ts`
  - Added proper CORS headers
  - Added OPTIONS request handling
  - Improved API key security

### Configuration Changes
- `vercel.json`
  - Updated global CORS headers
  - Added specific CORS config for API routes
  - Added Authorization header to allowed headers

## How This Fixes the Issues
1. **CORS Issues**: 
   - By using server-side proxying, we avoid direct browser-to-Perplexity API calls
   - Our Next.js API routes now properly handle CORS headers and preflight requests

2. **Authentication Issues**:
   - API keys are now used only on the server-side
   - Added fallbacks to ensure API keys are always available

3. **Better Error Handling**:
   - Improved logging of API errors
   - Added more graceful degradation when API calls fail

## Next Steps
1. Verify that all API calls work correctly in the deployed environment
2. Consider implementing a caching layer to reduce API calls to Perplexity
3. Set up monitoring for API usage and errors
4. Remove the API key from vercel.json and use Vercel environment variables instead

## Testing
After deployment, test the following:
1. Search functionality on the main dashboard
2. Market news display
3. Tariff search features
4. Company data lookups

## Security Note
Make sure to transfer the API key to Vercel environment variables rather than keeping it in the vercel.json file for production use. The current implementation is a temporary fix.