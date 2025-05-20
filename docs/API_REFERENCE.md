# FinSight API Reference

**Version: 1.0.0 (May 2025)**

This document provides a consolidated reference for all API endpoints available in the FinSight application.

## Base URL

All API endpoints are relative to the application base URL:

- Development: `http://localhost:3001/api`
- Production: `https://finsight-app.vercel.app/api`

## Authentication

Currently, the API does not require authentication tokens. All endpoints are accessible directly.

## Response Format

Unless otherwise specified, all responses follow this JSON structure:

```json
{
  "success": true|false,
  "data": {...},
  "error": "Error message (only if success: false)"
}
```

## Common Error Codes

- `400` - Bad Request: Invalid input parameters
- `404` - Not Found: Resource not found
- `500` - Server Error: Internal server error

## Available Endpoints

### Health Check

```
GET /health
```

Returns the health status of the API.

**Response:**
```json
{
  "success": true,
  "status": "ok",
  "version": "1.0.0"
}
```

### Market News

```
GET /market-news
```

Returns the latest market news.

**Query Parameters:**
- `limit` (optional): Number of news items to return (default: 10)
- `sector` (optional): Filter by business sector

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "news-1",
      "title": "Market Update",
      "summary": "The latest market movement...",
      "source": "Financial Times",
      "date": "2025-05-15T10:30:00Z",
      "url": "https://example.com/news/1"
    }
  ]
}
```

### Notifications

```
GET /notifications
```

Returns active user notifications.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "notif-1",
      "title": "New Report Available",
      "message": "Q2 Financial Report is now available",
      "type": "info",
      "date": "2025-05-10T08:45:00Z",
      "read": false
    }
  ]
}
```

### Data Products

#### List All Data Products

```
GET /data-products
```

Returns a list of all available data products.

**Response:**
```json
{
  "success": true,
  "data": {
    "dataProducts": [
      {
        "namespace": "sap.sfin.ara",
        "entityName": "CostCenter",
        "version": "1.0.0"
      }
    ],
    "totalCount": 25
  }
}
```

#### Search Data Products

```
GET /data-products/search
```

Searches for specific data products.

**Query Parameters:**
- `namespace` (optional): Filter by namespace
- `entityName` (optional): Filter by entity name
- `version` (optional): Filter by version

**Response:**
```json
{
  "success": true,
  "data": {
    "results": [...],
    "count": 5
  }
}
```

#### Get Specific Data Product

```
GET /data-products/:namespace/:entityName/:version
```

Returns details for a specific data product.

**Response:**
```json
{
  "success": true,
  "data": {
    "namespace": "sap.sfin.ara",
    "entityName": "CostCenter",
    "version": "1.0.0",
    "entities": {...},
    "associations": [...],
    "metadata": {...}
  }
}
```

### Vietnam Company Data

#### Search Vietnamese Companies

```
POST /vietnam/real-search
```

Searches for Vietnamese companies in the Capital IQ database.

**Request Body:**
```json
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

**Response:**
```json
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

#### Load Company Documents

```
POST /companies/load-documents
```

Streams document loading progress from Capital IQ.

**Request Body:**
```json
{
  "companyCode": "VIC",
  "documentTypes": ["financial", "annual_report", "investor_presentation"]
}
```

**Response:**
Stream of JSON data with loading progress:
```json
{"progress": 10, "status": "starting", "message": "Initiating document load"}
{"progress": 25, "status": "loading", "message": "Loading financial statements"}
{"progress": 50, "status": "loading", "message": "Processing annual reports"}
{"progress": 100, "status": "complete", "documents": [{"id": "doc1", "title": "Annual Report 2024", "url": "..."}]}
```

### Company Reports

#### Generate Company Report

```
POST /reports/generate
```

Generates a comprehensive company report.

**Request Body:**
```json
{
  "companyCode": "VIC",
  "reportType": "financial",
  "timePeriod": "2023-Q4",
  "sections": ["overview", "financial_highlights", "risk_analysis"]
}
```

**Response:**
```json
{
  "success": true,
  "reportId": "report-123456",
  "status": "processing",
  "estimatedTimeSeconds": 30
}
```

#### Get Company Report

```
GET /reports/company/:companyCode
```

Returns the generated report for a specific company.

**Response:**
```json
{
  "success": true,
  "report": {
    "id": "report-123456",
    "companyCode": "VIC",
    "companyName": "Vingroup JSC",
    "generatedDate": "2025-05-20T15:30:00Z",
    "sections": {...},
    "insights": [...],
    "downloadUrl": "https://..."
  }
}
```

### Tariff Information

#### Tariff Search

```
POST /tariff-search
```

Searches tariff information using semantic matching.

**Request Body:**
```json
{
  "query": "electronics import from China",
  "country": "Vietnam",
  "hsCodePrefix": "85",
  "maxResults": 20
}
```

**Response:**
```json
{
  "success": true,
  "results": [
    {
      "hsCode": "851712",
      "description": "Smartphones",
      "baseRate": 5,
      "preferentialRate": 0,
      "applicableAgreements": ["ACFTA", "RCEP"],
      "conditions": "Certificate of Origin required",
      "impactScore": 0.85
    }
  ],
  "facets": {
    "countries": [{"name": "China", "count": 15}, {"name": "Japan", "count": 8}],
    "categories": [{"name": "Electronics", "count": 25}, {"name": "Components", "count": 12}]
  }
}
```

### Perplexity Integration

```
POST /perplexity-proxy
```

Proxies requests to Perplexity AI for market research.

**Request Body:**
```json
{
  "query": "What are the latest trends in Vietnam's electronics manufacturing sector?",
  "maxTokens": 500
}
```

**Response:**
```json
{
  "success": true,
  "answer": "Vietnam's electronics manufacturing sector is experiencing several key trends...",
  "sources": [
    {
      "title": "Vietnam Electronics Industry Report 2025",
      "url": "https://example.com/report",
      "snippet": "..."
    }
  ]
}
```

## Rate Limits

- Standard rate limit: 100 requests per minute
- Report generation: 10 requests per hour
- Data product bulk operations: 50 requests per hour

## Error Handling

If an error occurs, the API will return an appropriate HTTP status code and a JSON response with error details:

```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "The requested resource could not be found",
    "details": "Company with code ABC123 does not exist"
  }
}
```

## Versioning

The current API version is v1. All endpoints described in this document are accessible without a version prefix. Future API versions will use the `/v2/` prefix.