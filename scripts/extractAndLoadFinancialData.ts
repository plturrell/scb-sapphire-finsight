import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import axios from 'axios';
import { RedisDataStore, DataProduct } from '../src/services/RedisDataStore';

/**
 * Financial data record structure
 */
interface FinancialRecord {
  id: string;
  companyId: string;
  companyName: string;
  metricName: string;
  metricValue: number;
  metricUnit: string;
  period: string;
  fiscalYear: string;
  source: string;
  dataProvider: string;
  timestamp: string;
  confidence: number;
}

/**
 * Capital IQ API response structure
 */
interface CapitalIQResponse {
  success: boolean;
  data: {
    companies: Array<{
      companyId: string;
      companyName: string;
      metrics: Array<{
        metricName: string;
        metricValue: number;
        metricUnit: string;
        period: string;
        fiscalYear: string;
        lastUpdated: string;
      }>;
    }>;
  };
}

/**
 * Extracts real financial data from Capital IQ API,
 * transforms it to structured data products, and loads into Redis
 */
async function extractAndLoadFinancialData() {
  console.log('Starting automated financial data extraction process...');
  
  // Initialize Redis data store
  const dataStore = new RedisDataStore(process.env.REDIS_URL);
  const isHealthy = await dataStore.healthCheck();
  if (!isHealthy) {
    throw new Error('Redis connection failed');
  }
  console.log('Connected to Redis successfully');
  
  try {
    // Read company list from configuration file
    const companiesConfigPath = path.join(process.cwd(), 'config', 'target_companies.json');
    
    // Check if config exists, otherwise use default list
    let targetCompanies: Array<{ companyId: string; name: string; country: string; exchange?: string }>;
    
    if (fs.existsSync(companiesConfigPath)) {
      const configContent = await fs.promises.readFile(companiesConfigPath, 'utf-8');
      targetCompanies = JSON.parse(configContent);
      console.log(`Loaded ${targetCompanies.length} companies from configuration file`);
    } else {
      console.log('Target companies configuration not found, using default list');
      targetCompanies = [
        { companyId: 'IQ142267', name: 'Vietnam Airlines', country: 'Vietnam', exchange: 'HOSE' },
        { companyId: 'IQ014703', name: 'FPT Corporation', country: 'Vietnam', exchange: 'HOSE' },
        { companyId: 'IQ001079', name: 'Vingroup', country: 'Vietnam', exchange: 'HOSE' },
        { companyId: 'IQ002015', name: 'Masan Group', country: 'Vietnam', exchange: 'HOSE' },
        { companyId: 'IQ054288', name: 'Vietcombank', country: 'Vietnam', exchange: 'HOSE' }
      ];
    }
    
    // Extract company IDs for API request
    const companyIds = targetCompanies.map(company => company.companyId);
    
    console.log(`Extracting financial data for ${companyIds.length} companies...`);
    
    // Extract financial metrics from Capital IQ API
    const financialData = await extractFinancialMetrics(companyIds);
    console.log(`Extracted ${financialData.length} financial records`);
    
    // Create data products directory if it doesn't exist
    const dataProductsDir = path.join(process.cwd(), 'data_products');
    if (!fs.existsSync(dataProductsDir)) {
      fs.mkdirSync(dataProductsDir, { recursive: true });
    }
    
    // Transform data into data products and store in Redis
    await transformAndStoreDataProducts(financialData, dataStore, dataProductsDir);
    
    // Verify and report status
    const storedKeys = await dataStore.searchKeys('dp:financial:*');
    console.log(`Successfully stored ${storedKeys.length} financial data products in Redis`);
    
    console.log('Financial data extraction and loading completed successfully');
  } catch (error) {
    console.error('Error in financial data extraction process:', error);
    throw error;
  } finally {
    await dataStore.close();
  }
}

/**
 * Extract financial metrics from Capital IQ API
 */
async function extractFinancialMetrics(companyIds: string[]): Promise<FinancialRecord[]> {
  // List of core financial metrics to extract
  const metrics = [
    'TOTAL_REVENUE',
    'NET_INCOME',
    'EBITDA',
    'GROSS_PROFIT_MARGIN',
    'OPERATING_MARGIN',
    'TOTAL_ASSETS',
    'TOTAL_DEBT',
    'RETURN_ON_EQUITY',
    'MARKET_CAP'
  ];
  
  try {
    // Get API key from environment variables
    const apiKey = process.env.CAPITAL_IQ_API_KEY;
    
    if (!apiKey) {
      throw new Error('CAPITAL_IQ_API_KEY environment variable is required');
    }
    
    // Send request to Capital IQ API
    const response = await axios.post('https://api.capitaliq.com/v2/companies/financials', {
      companyIds,
      metrics,
      periods: ['FY', 'Q', 'TTM'],
      fiscalYears: ['2023', '2024']
    }, {
      headers: { 
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    // Transform API response to our internal format
    const financialRecords: FinancialRecord[] = [];
    
    // Access the companies array from the response
    const companies = response.data.data.companies;
    
    if (!Array.isArray(companies)) {
      throw new Error('Invalid API response format: expected data.companies to be an array');
    }
    
    companies.forEach(company => {
      if (!company.metrics || !Array.isArray(company.metrics)) {
        console.warn(`Company ${company.companyId || 'unknown'} has no metrics data`);
        return;
      }
      
      company.metrics.forEach(metric => {
        // Validate and parse the metric data
        const metricName = metric.metricName || '';
        const metricUnit = normalizeMetricUnit(metric.metricUnit || '');
        const metricValue = parseMetricValue(metric.metricValue, metricUnit);
        
        // Skip metrics with missing or invalid values
        if (!metricName || isNaN(metricValue)) {
          console.warn(`Skipping invalid metric for company ${company.companyId}: ${JSON.stringify(metric)}`);
          return;
        }
        
        financialRecords.push({
          id: uuidv4(),
          companyId: company.companyId,
          companyName: company.companyName,
          metricName: metricName,
          metricValue: metricValue,
          metricUnit: metricUnit,
          period: metric.period || 'FY',
          fiscalYear: metric.fiscalYear || new Date().getFullYear().toString(),
          source: 'Capital IQ',
          dataProvider: 'S&P Global',
          timestamp: new Date().toISOString(),
          confidence: 0.98 // High confidence for direct API data
        });
      });
    });
    
    return financialRecords;
  } catch (error) {
    console.error('Error fetching data from Capital IQ API:', error);
    throw new Error('Failed to extract financial metrics from Capital IQ API');
  }
}

/**
 * Transform financial records to data products and store in Redis
 */
async function transformAndStoreDataProducts(
  records: FinancialRecord[],
  dataStore: RedisDataStore,
  outputDir: string
): Promise<void> {
  // Group records by company
  const companyGroups = records.reduce((acc, record) => {
    if (!acc[record.companyId]) {
      acc[record.companyId] = [];
    }
    acc[record.companyId].push(record);
    return acc;
  }, {} as Record<string, FinancialRecord[]>);
  
  // Process each company's data
  for (const [companyId, companyRecords] of Object.entries(companyGroups)) {
    try {
      const companyName = companyRecords[0].companyName;
      const companySlug = companyName.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const id = `financial:${companySlug}:1.0`;
      
      console.log(`Creating data product for ${companyName}...`);
      
      // Build entities map - each metric is an entity
      const entities: Record<string, any> = {};
      
      for (const record of companyRecords) {
        const metricKey = record.metricName.toLowerCase();
        entities[metricKey] = {
          value: record.metricValue,
          unit: record.metricUnit,
          period: record.period,
          fiscalYear: record.fiscalYear,
          source: record.source,
          provider: record.dataProvider,
          extractedAt: record.timestamp,
          confidence: record.confidence
        };
      }
      
      // Create structured data product
      const dataProduct: DataProduct = {
        id,
        namespace: 'financial',
        version: '1.0',
        entityName: companySlug,
        entities,
        metadata: {
          companyId,
          companyName,
          recordCount: companyRecords.length,
          extractedAt: new Date().toISOString(),
          source: 'capital_iq_api',
          lastUpdated: new Date().toISOString()
        }
      };
      
      // Save to file
      const filePath = path.join(outputDir, `Financial_v1.${companySlug}.json`);
      await fs.promises.writeFile(filePath, JSON.stringify(dataProduct, null, 2));
      
      // Store in Redis
      await dataStore.storeDataProduct(dataProduct);
      console.log(`Stored data product for ${companyName} in Redis`);
    } catch (error) {
      console.error(`Error creating data product for company ${companyId}:`, error);
    }
  }
}

/**
 * Parse metric value from API response
 * @param value The metric value to parse
 * @param unit The unit of the metric
 * @returns Parsed number value
 */
function parseMetricValue(value: string | number, unit: string): number {
  if (typeof value === 'number') {
    return value;
  }
  
  try {
    // Remove any currency symbols or commas
    const cleanValue = value.replace(/[$,]/g, '');
    
    // Convert to number
    const numValue = parseFloat(cleanValue);
    
    // Apply scaling based on unit if needed
    if (unit === 'percent' && numValue > 1 && numValue <= 100) {
      // Convert percentage displayed as 0-100 to decimal 0-1
      return numValue / 100;
    }
    
    return numValue;
  } catch (error) {
    console.error(`Error parsing metric value: ${value}`, error);
    return 0;
  }
}

/**
 * Normalize metric unit from various formats
 * @param unit The unit string from the API
 * @returns Normalized unit string
 */
function normalizeMetricUnit(unit: string): string {
  const lowerUnit = unit.toLowerCase();
  
  if (lowerUnit.includes('percent') || lowerUnit.includes('%')) {
    return 'percent';
  }
  
  if (lowerUnit.includes('usd') || lowerUnit.includes('$')) {
    return 'USD';
  }
  
  if (lowerUnit.includes('eur') || lowerUnit.includes('€')) {
    return 'EUR';
  }
  
  return unit;
}

// Run the extraction and loading process if this script is executed directly
if (require.main === module) {
  extractAndLoadFinancialData()
    .then(() => {
      console.log('Process completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Process failed:', error);
      process.exit(1);
    });
}

export { extractAndLoadFinancialData };