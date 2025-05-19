# Vietnam Company RAG System Documentation

## Overview

The Vietnam Company RAG (Retrieval-Augmented Generation) System is a comprehensive solution for storing, retrieving, and analyzing Vietnam company data. It integrates with S&P Capital IQ data and provides intelligent report generation capabilities.

## Architecture

```
┌─────────────────────────────────────┐
│        Capital IQ Data Source       │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│        Document Ingestion           │
│    (CSV Parser / API Client)        │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│         RAG Storage System          │
│    (Vector DB + Document Store)     │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│      Report Generation Service      │
│   (LLM + Vietnam Report Service)    │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│        Web Application              │
│     (Next.js + React + MUI)         │
└─────────────────────────────────────┘
```

## Components

### 1. VietnamCompanyRAG Service
- **Location**: `src/services/VietnamCompanyRAG.ts`
- **Purpose**: Core RAG service for Vietnam company data
- **Key Features**:
  - Document ingestion and storage
  - Company profile creation
  - Financial data extraction
  - Query and retrieval

### 2. Document Ingestion Pipeline
- **Location**: `scripts/ingestVietnamDocuments.ts`
- **Purpose**: Batch process documents from various sources
- **Sources**:
  - Capital IQ exports
  - Local files
  - External APIs

### 3. Capital IQ Integration
- **API Client**: `scripts/capitalIQApiClient.ts`
- **CSV Parser**: `scripts/parseCapitalIQExport.ts`
- **Web Scraper**: `scripts/scrapCapitalIQVietnam.ts`

### 4. Report Generation
- **Service**: `src/lib/vietnam-report-service.ts`
- **Features**:
  - Company profiles
  - Financial analysis
  - Tariff impact reports
  - Market comparisons

## Data Flow

1. **Data Extraction**
   ```bash
   # Extract from Capital IQ
   node scripts/extractCapitalIQVietnamData.ts
   
   # Or parse CSV export
   node scripts/parseCapitalIQExport.ts
   ```

2. **Document Ingestion**
   ```bash
   # Initialize RAG system
   node scripts/ingestVietnamDocuments.ts --init
   
   # Ingest from specific source
   node scripts/ingestVietnamDocuments.ts capitaliq
   ```

3. **Query and Retrieval**
   ```typescript
   // Query companies
   const results = await vietnamCompanyRAG.queryCompanies(
     "Vietnam electronics companies Ho Chi Minh", 
     5
   );
   
   // Get financial data
   const financialData = await vietnamCompanyRAG.getCompanyFinancialData("VCG-0001");
   ```

4. **Report Generation**
   ```typescript
   // Generate company report
   const report = await vietnamReportService.generateVietnamCompanyReport({
     companyCode: "VCG-0001",
     reportType: "financial_analysis",
     includeFinancials: true,
     includeTariffAnalysis: true
   });
   ```

## Deployment on Brev

### Prerequisites
- Brev CLI installed
- Active Brev account
- Access to Capital IQ

### Setup Steps

1. **Create Brev Instance**
   ```bash
   brev create vietnam-rag-system
   ```

2. **SSH into Instance**
   ```bash
   brev ssh vietnam-rag-system
   ```

3. **Clone Repository**
   ```bash
   git clone [repository-url]
   cd finsight-app
   ```

4. **Run Setup Script**
   ```bash
   chmod +x scripts/setupBrevEnvironment.sh
   ./scripts/setupBrevEnvironment.sh
   ```

5. **Configure Environment Variables**
   Edit `.env.local` with your API keys:
   ```
   CAPITAL_IQ_API_KEY=your_key
   OPENAI_API_KEY=your_key
   REPORT_API_KEY=your_key
   ```

6. **Start Services**
   ```bash
   ./start-services.sh
   ```

### Access Services

- **Web Application**: `https://[instance-id].brevlab.com`
- **Jupyter Notebook**: `https://jupyter0-[instance-id].brevlab.com`
- **Health Check**: `https://[instance-id].brevlab.com/api/health`

## API Endpoints

### RAG Endpoints

```typescript
// Query companies
POST /api/rag/query
{
  "query": "Vietnam electronics companies",
  "limit": 5
}

// Store document
POST /api/rag/store
{
  "companyCode": "VCG-0001",
  "documentType": "annual_report",
  "content": "...",
  "metadata": {}
}
```

### Report Endpoints

```typescript
// Generate report
POST /api/reports/vietnam
{
  "companyCode": "VCG-0001",
  "reportType": "financial_analysis",
  "includeFinancials": true
}

// Compare companies
POST /api/reports/vietnam/compare
{
  "companyCodes": ["VCG-0001", "VCG-0002", "VCG-0003"]
}
```

## Data Structure

### Vietnam Company Schema
```typescript
interface VietnamCompany {
  VietnamCompanyCode: string;
  CompanyName: string;
  CompanyNameLocal?: string;
  TaxCode?: string;
  BusinessRegistrationNumber?: string;
  IndustryCode?: string;
  CompanyType?: string;
  Province?: string;
  District?: string;
  Address?: string;
  PhoneNumber?: string;
  Email?: string;
  Website?: string;
  EstablishedDate?: string;
  RegisteredCapital?: number;
  RegisteredCapitalCurrency?: string;
  EmployeeCount?: number;
  AnnualRevenue?: number;
  AnnualRevenueCurrency?: string;
  ExportValue?: number;
  ExportValueCurrency?: string;
  ImportValue?: number;
  ImportValueCurrency?: string;
  MainExportProducts?: string;
  MainImportProducts?: string;
  TradingPartners?: string;
  CreditRating?: string;
  ListingStatus?: string;
  StockSymbol?: string;
  Status?: string;
  LastUpdated?: string;
  DataSource?: string;
}
```

## Monitoring and Maintenance

### Health Checks
```bash
# Check system health
curl https://[instance-id].brevlab.com/api/health

# Check RAG health
curl https://[instance-id].brevlab.com/api/rag/health
```

### Logs
```bash
# View application logs
tail -f logs/app.log

# View ingestion logs
tail -f logs/ingestion.log

# View error logs
tail -f logs/error.log
```

### Data Updates
```bash
# Update company data
node scripts/extractCapitalIQVietnamData.ts

# Re-ingest documents
node scripts/ingestVietnamDocuments.ts --update
```

## Troubleshooting

### Common Issues

1. **Capital IQ Authentication Failed**
   - Verify credentials in `.env.local`
   - Check API rate limits
   - Ensure network connectivity

2. **RAG Query Returns No Results**
   - Check if data was ingested properly
   - Verify Redis is running
   - Review query syntax

3. **Report Generation Fails**
   - Check OpenAI API key
   - Verify company code exists
   - Review error logs

### Debug Commands

```bash
# Test Capital IQ connection
node scripts/testCapitalIQConnection.ts

# Verify RAG data
node scripts/verifyRAGSystem.ts

# Check Redis
redis-cli ping
```

## Best Practices

1. **Data Quality**
   - Regularly update company data
   - Validate data before ingestion
   - Monitor data completeness

2. **Performance**
   - Use batch operations for ingestion
   - Implement caching for frequent queries
   - Optimize vector search parameters

3. **Security**
   - Rotate API keys regularly
   - Use environment variables for secrets
   - Implement access controls

4. **Monitoring**
   - Set up alerts for errors
   - Monitor system resources
   - Track API usage

## Support

For issues or questions:
1. Check the documentation
2. Review error logs
3. Contact support team

## License

This system is proprietary to SCB and should not be shared externally.