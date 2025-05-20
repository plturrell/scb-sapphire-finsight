import { promises as fs } from 'fs';
import path from 'path';
import { vietnamCompanyRAG, CompanyFinancialData } from '../src/services/VietnamCompanyRAG';
import { RedisDataStore, DataProduct } from '../src/services/RedisDataStore';

/**
 * Loads company data from data products into RAG system
 * and creates a unified knowledge base for semantic search
 */
async function loadCompanyDataToRAG() {
  console.log('Starting company data loading to RAG system...');
  
  // Initialize Redis data store
  const dataStore = new RedisDataStore();
  const isHealthy = await dataStore.healthCheck();
  if (!isHealthy) {
    throw new Error('Redis connection failed');
  }
  console.log('Connected to Redis successfully');
  
  const dataProductsDir = path.join(process.cwd(), 'data_products');
  
  try {
    // Step 1: Load all Financial data products
    console.log('Loading financial data products...');
    const financialDataProducts = await searchDataProducts(dataStore, 'financial');
    console.log(`Found ${financialDataProducts.length} financial data products`);
    
    // Step 2: Extract company data
    const companyData: CompanyFinancialData[] = [];
    
    for (const product of financialDataProducts) {
      const company = product.metadata?.company as string;
      
      if (company && product.entities) {
        // Create company financial data record
        const financialData: CompanyFinancialData = {
          VietnamCompanyCode: `VCG-${product.entityName}`,
          CompanyName: company,
          // Try to extract standard metrics
          AnnualRevenue: extractMetricValue(product.entities, 'annual_revenue'),
          AnnualRevenueCurrency: extractMetricCurrency(product.entities, 'annual_revenue'),
          Status: 'Active',
          DataSource: product.metadata?.source as string || 'Unknown',
          LastUpdated: product.metadata?.extractedAt as string || new Date().toISOString()
        };
        
        // Add other available metrics
        for (const [key, value] of Object.entries(product.entities)) {
          if (key !== 'annual_revenue') {
            financialData[formatMetricName(key)] = value.value;
          }
        }
        
        companyData.push(financialData);
        console.log(`Extracted data for ${company}`);
      }
    }
    
    // Step 3: Load tariff data products to enhance company data
    console.log('Loading tariff data products...');
    const tariffDataProducts = await searchDataProducts(dataStore, 'tariff');
    console.log(`Found ${tariffDataProducts.length} tariff data products`);
    
    // Enhance company data with tariff information
    for (const company of companyData) {
      const countryName = company.Country || 'Vietnam';
      
      // Find relevant tariff data
      const relevantTariffs = tariffDataProducts.filter(product => 
        product.metadata?.sourceCountry === countryName ||
        (product.metadata?.destinationCountry as string)?.includes(countryName)
      );
      
      if (relevantTariffs.length > 0) {
        // Extract relevant tariff information
        const tariffInfo: string[] = [];
        
        for (const tariff of relevantTariffs) {
          const sourceCountry = tariff.metadata?.sourceCountry;
          const destinationCountry = tariff.metadata?.destinationCountry;
          
          tariffInfo.push(`${sourceCountry} to ${destinationCountry}`);
          
          // Extract main export/import products if available
          const hsCodeKeys = Object.keys(tariff.entities || {}).slice(0, 3);
          if (hsCodeKeys.length > 0) {
            const products = hsCodeKeys.map(hsCode => {
              const description = tariff.entities?.[hsCode]?.description;
              return description ? `${hsCode}: ${description}` : hsCode;
            });
            
            if (sourceCountry === countryName) {
              company.MainExportProducts = products.join('; ');
            } else if (destinationCountry === countryName) {
              company.MainImportProducts = products.join('; ');
            }
          }
        }
        
        company.TradingPartners = tariffInfo.join('; ');
        console.log(`Enhanced ${company.CompanyName} with tariff data`);
      }
    }
    
    // Step 4: Save the processed company data
    const outputFile = path.join(dataProductsDir, 'vietnam_companies_enriched.json');
    await fs.writeFile(outputFile, JSON.stringify(companyData, null, 2));
    console.log(`Saved enriched company data to ${outputFile}`);
    
    // Step 5: Ingest data into RAG system
    console.log('Ingesting company data into RAG system...');
    for (const company of companyData) {
      console.log(`Ingesting ${company.CompanyName} into RAG...`);
      await vietnamCompanyRAG.ingestCompanyDocument(company);
    }
    
    console.log('Company data successfully loaded to RAG system');
  } catch (error) {
    console.error('Error loading company data to RAG:', error);
    throw error;
  } finally {
    await dataStore.close();
  }
}

/**
 * Search for data products by namespace
 */
async function searchDataProducts(dataStore: RedisDataStore, namespace: string): Promise<DataProduct[]> {
  try {
    const keys = await dataStore.searchKeys(`dp:${namespace}:*`);
    const products: DataProduct[] = [];
    
    for (const key of keys) {
      const product = await dataStore.get(key);
      if (product) {
        products.push(product);
      }
    }
    
    return products;
  } catch (error) {
    console.error(`Error searching for ${namespace} data products:`, error);
    return [];
  }
}

/**
 * Extract metric value from entities
 */
function extractMetricValue(entities: Record<string, any>, metricKey: string): number | undefined {
  const metric = entities[metricKey];
  if (metric && typeof metric.value === 'number') {
    return metric.value;
  }
  return undefined;
}

/**
 * Extract metric currency from entities
 */
function extractMetricCurrency(entities: Record<string, any>, metricKey: string): string | undefined {
  const metric = entities[metricKey];
  if (metric && typeof metric.currency === 'string') {
    return metric.currency;
  }
  return undefined;
}

/**
 * Format metric name for consistent capitalization
 */
function formatMetricName(key: string): string {
  return key.split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}

// Run the process if this script is executed directly
if (require.main === module) {
  loadCompanyDataToRAG()
    .then(() => {
      console.log('Process completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Process failed:', error);
      process.exit(1);
    });
}

export { loadCompanyDataToRAG };