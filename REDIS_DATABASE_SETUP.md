# Redis Database Setup for Data Products

This guide explains how to set up and use the Redis database for storing and querying data products.

## Prerequisites

- Node.js (v16+)
- Redis server (v6+)
- npm or yarn

## Installation

1. Install Redis locally or use a cloud Redis service:
   ```bash
   # macOS
   brew install redis
   brew services start redis

   # Ubuntu/Debian
   sudo apt-get install redis-server
   sudo systemctl start redis
   ```

2. Install the required npm package:
   ```bash
   npm install ioredis
   ```

## Database Structure

The Redis database stores data products with the following structure:

- **Keys Format**: `dp:namespace:entityName:version`
- **Indices**:
  - `idx:namespace:*` - Index by namespace
  - `idx:entity:*` - Index by entity name
  - `idx:version:*` - Index by version
- **Associations**: `assoc:from:entityName` and `assoc:to:entityName`

## Loading Data

To load your data products into Redis:

```bash
npm run load-data-products
```

Or run the script directly:

```bash
npx ts-node src/scripts/loadDataProductsToRedis.ts
```

## API Endpoints

The following API endpoints are available:

### Health Check
```
GET /api/data-products/health
```

### Search Data Products
```
GET /api/data-products/search?namespace=sap.sfin.ara&entityName=CostCenter&version=1.0.0
```

### Get Specific Data Product
```
GET /api/data-products/{namespace}/{entityName}/{version}
```

### Get Associations
```
GET /api/data-products/associations/{entityName}?direction=from
```

### Store Data Product
```
POST /api/data-products/{namespace}/{entityName}/{version}
Content-Type: application/json

{
  "entities": {...},
  "associations": [...],
  "metadata": {...}
}
```

## UI Access

Access the Data Product Explorer at:
```
http://localhost:3000/data-products
```

## Environment Variables

Set the following environment variables:

```env
REDIS_URL=redis://localhost:6379
```

## Redis Commands

Useful Redis CLI commands:

```bash
# Connect to Redis
redis-cli

# List all data product keys
KEYS dp:*

# Get a specific data product
GET dp:sap.sfin.ara:CostCenter:1.0.0

# List all indices
KEYS idx:*

# Get members of an index
SMEMBERS idx:namespace:sap.sfin.ara

# Clear all data
FLUSHDB
```

## Performance Considerations

- Data products are cached with 24-hour expiry
- Indices are maintained for fast searches
- Use connection pooling for production environments
- Consider Redis Cluster for high availability

## Troubleshooting

1. **Connection Issues**: Check if Redis is running and accessible
2. **Missing Data**: Ensure data products are loaded using the script
3. **Performance**: Monitor Redis memory usage and configure maxmemory policy
4. **API Errors**: Check server logs and Redis connection status

## Alternative: Apache Jena

If you prefer using Apache Jena for semantic data storage:

1. Install Jena dependencies
2. Convert JSON data to RDF triples
3. Use SPARQL queries for complex relationships
4. Implement a Jena TDB2 database

For most use cases, Redis provides better performance and simpler integration with your existing Next.js application.