# Real Data Extraction Guide - S&P Capital IQ Integration

## Overview

This system provides real-time access to S&P Capital IQ data for Vietnam companies using actual credentials (craig.turrell@sc.com / Victoria0405%). All data is 100% real - no mock data is used.

## Components

### 1. Data Extraction Scripts

- **`scripts/extractRealCapitalIQData.ts`**: Main extraction script that logs into Capital IQ and downloads Vietnam company data
- **`scripts/ingestVietnamDocuments.ts`**: Ingests real documents from Capital IQ API
- **`scripts/scrapCapitalIQVietnam.ts`**: Web scraping fallback using real Capital IQ selectors

### 2. API Endpoints

- **`/api/vietnam/real-search`**: Searches through real Capital IQ data
- **`/api/companies/search`**: Company search with auto-complete
- **`/api/companies/load-documents`**: Streams document loading progress from Capital IQ

### 3. Components

- **`RealCompanySearchBar.tsx`**: Search bar with real Capital IQ data, autocomplete, and recommendations
- **`CompanySearchBar.tsx`**: Standard company search component

### 4. Services

- **`VietnamCompanyRAG`**: Stores and retrieves real company documents
- **`VietnamSearchManager`**: Manages Vietnam-specific searches
- **`RedisDataStore`**: Caches real data for performance

## Setup Instructions

1. **Install Dependencies**:
   ```bash
   npm install puppeteer axios ioredis
   ```

2. **Configure Environment**:
   ```bash
   ./scripts/setupRealDataEnvironment.sh
   ```

3. **Set Environment Variables**:
   ```
   CAPITAL_IQ_USERNAME=craig.turrell@sc.com
   CAPITAL_IQ_PASSWORD=Victoria0405%
   REDIS_URL=redis://localhost:6379
   ```

4. **Run Real Data Extraction**:
   ```bash
   node scripts/extractRealCapitalIQData.js
   ```

## Data Flow

1. **Extraction**: Logs into Capital IQ with real credentials
2. **Search**: Finds Vietnam companies using actual Capital IQ search
3. **Download**: Extracts real company data and financial documents
4. **Storage**: Stores in RAG system for LLM processing
5. **Search**: Provides real-time search with autocomplete
6. **Display**: Shows actual Capital IQ data in UI

## Key Features

- Real Capital IQ authentication using provided credentials
- Actual Vietnam company data extraction
- Real-time document streaming from Capital IQ
- Autocomplete with real company names
- Recent searches with actual data
- Document count from real Capital IQ sources

## Real Data Endpoints

### Company Search
```typescript
POST /api/vietnam/real-search
{
  "query": "Vingroup",
  "filters": {
    "industry": "Real Estate",
    "province": "Hanoi",
    "minRevenue": 1000000,
    "exportOnly": true
  },
  "limit": 10
}
```

### Response
```typescript
{
  "success": true,
  "query": "Vingroup",
  "resultCount": 5,
  "results": [
    {
      "companyCode": "VIC",
      "companyName": "Vingroup JSC",
      "capitalIQId": "CIQ123456",
      "industry": "Real Estate",
      "province": "Hanoi",
      "annualRevenue": 5000000000,
      "exportValue": 100000000,
      "importValue": 50000000,
      "hasFinancialDocs": true,
      "documentCount": 15,
      "lastUpdated": "2024-01-15T10:30:00Z"
    }
  ],
  "dataSource": "Capital IQ Real Data"
}
```

## Important Notes

1. **100% Real Data**: Everything uses actual Capital IQ data
2. **No Mock Data**: All mock document generation has been removed
3. **Live Authentication**: Uses real credentials for Capital IQ access
4. **Rate Limiting**: Includes delays to respect Capital IQ rate limits
5. **Error Handling**: Gracefully handles authentication and data extraction errors

## Deployment

For production deployment using Brev CLI:

```bash
# Deploy with Brev
brev deploy -f brev-deployment.yaml

# Set environment variables
brev env set CAPITAL_IQ_USERNAME craig.turrell@sc.com
brev env set CAPITAL_IQ_PASSWORD Victoria0405%
```

## Support

For any issues with real data extraction:
1. Check Capital IQ credentials are correct
2. Verify Redis is running for caching
3. Ensure network access to capitaliq.com
4. Review extraction logs in `logs/extraction/`