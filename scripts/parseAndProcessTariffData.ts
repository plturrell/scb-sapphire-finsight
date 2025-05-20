import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import { RedisDataStore, DataProduct } from '../src/services/RedisDataStore';
import { TariffInfo } from '../src/services/SemanticTariffEngine';

/**
 * Tariff record interface representing a single tariff entry
 */
interface TariffRecord {
  id: string;
  hsCode: string;
  productDescription: string;
  sourceCountry: string;
  destinationCountry: string;
  tariffRate: number;
  unit: string;
  effectiveDate: string;
  expirationDate?: string;
  tradeAgreement?: string;
  exemptions?: string[];
  regulatoryBody: string;
  source: string;
  lastUpdated: string;
}

/**
 * Structure of the tariff database API response
 */
interface TariffAPIResponse {
  success: boolean;
  data: {
    tariffs: TariffRecord[];
    metadata: {
      total: number;
      count: number;
      source: string;
      updatedAt: string;
    };
  };
}

/**
 * Interface for tariff impact analysis results
 */
interface TariffImpactAnalysis {
  product: string;
  sourceCountry: string;
  destinationCountries: string[];
  timeframeMonths: number;
  riskLevel: 'low' | 'medium' | 'high';
  summary: string;
  impactByCountry: Array<{
    country: string;
    currentTariffRate: number;
    projectedRate: number;
    impactAssessment: string;
  }>;
  impactFactors: string[];
  recommendations: string[];
  source: string;
  analysisDate: string;
}

/**
 * Parses and processes tariff data from official sources,
 * transforms it, and loads it into Redis as structured data products
 */
async function parseAndProcessTariffData(): Promise<void> {
  console.log('Starting tariff data processing...');

  // Initialize Redis data store
  const dataStore = new RedisDataStore(process.env.REDIS_URL);
  const isHealthy = await dataStore.healthCheck();
  if (!isHealthy) {
    throw new Error('Redis connection failed');
  }
  console.log('Connected to Redis successfully');

  try {
    // Read tariff parameters from configuration
    const tariffConfigPath = path.join(process.cwd(), 'config', 'tariff_config.json');
    
    // Define default configuration if config file doesn't exist
    let tariffConfig: {
      countries: string[];
      products: Array<{ name: string; hsCode: string }>;
      sources: string[];
    };
    
    if (fs.existsSync(tariffConfigPath)) {
      const configContent = await fs.promises.readFile(tariffConfigPath, 'utf-8');
      tariffConfig = JSON.parse(configContent);
      console.log(`Loaded tariff configuration with ${tariffConfig.countries.length} countries and ${tariffConfig.products.length} product categories`);
    } else {
      console.log('Tariff configuration not found, using default values');
      tariffConfig = {
        countries: ['Vietnam', 'United States', 'European Union', 'Japan', 'China'],
        products: [
          { name: 'Electronics', hsCode: '85' },
          { name: 'Textiles', hsCode: '52' },
          { name: 'Agricultural products', hsCode: '07' },
          { name: 'Machinery', hsCode: '84' },
          { name: 'Automotive', hsCode: '87' }
        ],
        sources: ['WTO', 'USITC', 'Vietnam Customs', 'EU Commission']
      };
    }
    
    // Create data products directory if it doesn't exist
    const dataProductsDir = path.join(process.cwd(), 'data_products');
    if (!fs.existsSync(dataProductsDir)) {
      fs.mkdirSync(dataProductsDir, { recursive: true });
    }
    
    // Extract tariffs from multiple sources and merge them
    console.log('Extracting tariff data from official sources...');
    const allTariffData: TariffRecord[] = await extractTariffData(tariffConfig);
    console.log(`Extracted ${allTariffData.length} tariff records`);
    
    // Process tariffs and create data products
    await processAndStoreTariffData(allTariffData, dataStore, dataProductsDir);
    
    // Generate tariff impact analysis
    await generateTariffImpactAnalysis(tariffConfig, dataStore, dataProductsDir);
    
    console.log('Tariff data processing completed successfully');
  } catch (error) {
    console.error('Error in tariff data processing:', error);
    throw error;
  } finally {
    await dataStore.close();
  }
}

/**
 * Extract tariff data from official sources via API
 */
async function extractTariffData(
  config: { countries: string[]; products: Array<{ name: string; hsCode: string }>; sources: string[] }
): Promise<TariffRecord[]> {
  const allTariffs: TariffRecord[] = [];
  
  try {
    // Get the API key from environment variables
    const apiKey = process.env.TARIFF_API_KEY;
    
    if (!apiKey) {
      throw new Error('TARIFF_API_KEY environment variable is required');
    }
    
    // Process each country pair and product combination
    for (const sourceCountry of config.countries) {
      for (const destinationCountry of config.countries) {
        // Skip self-references
        if (sourceCountry === destinationCountry) continue;
        
        // Process each product category
        for (const product of config.products) {
          console.log(`Fetching tariff data for ${product.name} from ${sourceCountry} to ${destinationCountry}...`);
          
          try {
            // Make API call to tariff database
            const response = await axios.get('https://api.tradetariffdata.com/v2/tariffs', {
              params: {
                source_country: sourceCountry,
                destination_country: destinationCountry,
                hs_code: product.hsCode,
                product_category: product.name
              },
              headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Accept': 'application/json'
              }
            });
            
            // Validate the response
            if (!response.data || !response.data.tariffs || !Array.isArray(response.data.tariffs)) {
              console.warn(`Invalid response for ${sourceCountry} to ${destinationCountry} ${product.name}`);
              continue;
            }
            
            // Process tariff records from API
            const tariffs = response.data.tariffs;
            console.log(`Received ${tariffs.length} tariff records for ${product.name}`);
            
            // Map API response to internal format
            for (const tariff of tariffs) {
              const record: TariffRecord = {
                id: tariff.id || uuidv4(),
                hsCode: tariff.hs_code,
                productDescription: tariff.product_description,
                sourceCountry: tariff.source_country,
                destinationCountry: tariff.destination_country,
                tariffRate: parseFloat(tariff.rate),
                unit: tariff.unit || '%',
                effectiveDate: tariff.effective_date,
                regulatoryBody: tariff.regulatory_authority,
                source: tariff.data_source || 'Trade Tariff Database',
                lastUpdated: tariff.last_updated || new Date().toISOString()
              };
              
              // Add optional fields if present
              if (tariff.expiration_date) {
                record.expirationDate = tariff.expiration_date;
              }
              
              if (tariff.trade_agreement) {
                record.tradeAgreement = tariff.trade_agreement;
              }
              
              if (tariff.exemptions && Array.isArray(tariff.exemptions)) {
                record.exemptions = tariff.exemptions;
              }
              
              allTariffs.push(record);
            }
          } catch (error) {
            console.error(`Error fetching tariffs for ${sourceCountry} to ${destinationCountry} ${product.name}:`, error);
            // Continue with other queries even if one fails
          }
          
          // Rate limiting - avoid overwhelming the API
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    }
    
    return allTariffs;
  } catch (error) {
    console.error('Error extracting tariff data:', error);
    throw new Error('Failed to extract tariff data from sources');
  }
}

/**
 * Process tariff records and store them as data products
 */
async function processAndStoreTariffData(
  tariffs: TariffRecord[],
  dataStore: RedisDataStore,
  outputDir: string
): Promise<void> {
  try {
    // Group tariffs by country pair
    const countryPairGroups = groupByCountryPair(tariffs);
    console.log(`Creating ${Object.keys(countryPairGroups).length} tariff data products...`);
    
    // Create data products for each country pair
    for (const [countryPair, tariffRecords] of Object.entries(countryPairGroups)) {
      try {
        // Extract source and destination countries
        const [sourceCountry, destinationCountry] = countryPair.split('-to-');
        const pairSlug = countryPair.toLowerCase().replace(/[^a-z0-9]/g, '_');
        const id = `tariff:${pairSlug}:1.0`;
        
        // Create entity map (key by HS code)
        const entities: Record<string, any> = {};
        
        // Group tariffs by HS code
        const hsCodes = new Set(tariffRecords.map(t => t.hsCode));
        
        for (const hsCode of hsCodes) {
          const hsRecords = tariffRecords.filter(t => t.hsCode === hsCode);
          const primaryRecord = hsRecords[0];
          
          // Format HS code for Redis key (replace dots with underscores)
          const hsKey = hsCode.replace(/\./g, '_');
          
          entities[hsKey] = {
            description: primaryRecord.productDescription,
            rate: primaryRecord.tariffRate,
            unit: primaryRecord.unit,
            effectiveDate: primaryRecord.effectiveDate,
            expirationDate: primaryRecord.expirationDate,
            tradeAgreement: primaryRecord.tradeAgreement,
            exemptions: primaryRecord.exemptions,
            regulatoryBody: primaryRecord.regulatoryBody,
            source: primaryRecord.source,
            lastUpdated: primaryRecord.lastUpdated,
            alternativeRates: hsRecords.length > 1 ? 
              hsRecords.slice(1).map(r => ({
                rate: r.tariffRate,
                agreement: r.tradeAgreement,
                conditions: r.exemptions ? r.exemptions.join(', ') : undefined
              })) : undefined
          };
        }
        
        // Create data product
        const dataProduct: DataProduct = {
          id,
          namespace: 'tariff',
          version: '1.0',
          entityName: pairSlug,
          entities,
          metadata: {
            sourceCountry,
            destinationCountry,
            recordCount: tariffRecords.length,
            hsCodeCount: hsCodes.size,
            extractedAt: new Date().toISOString(),
            source: tariffRecords[0].source
          }
        };
        
        // Save to file
        const filePath = path.join(outputDir, `Tariff_v1.${pairSlug}.json`);
        await fs.promises.writeFile(filePath, JSON.stringify(dataProduct, null, 2));
        
        // Store in Redis
        await dataStore.storeDataProduct(dataProduct);
        console.log(`Stored tariff data product for ${countryPair} in Redis`);
      } catch (error) {
        console.error(`Error creating tariff data product for ${countryPair}:`, error);
      }
    }
  } catch (error) {
    console.error('Error processing tariff data:', error);
    throw error;
  }
}

/**
 * Generate tariff impact analysis for specific products
 */
async function generateTariffImpactAnalysis(
  config: { countries: string[]; products: Array<{ name: string; hsCode: string }>; sources: string[] },
  dataStore: RedisDataStore,
  outputDir: string
): Promise<void> {
  try {
    console.log('Generating tariff impact analysis...');
    
    // Get the API key from environment variables
    const analysisApiKey = process.env.TARIFF_ANALYSIS_API_KEY;
    
    if (!analysisApiKey) {
      throw new Error('TARIFF_ANALYSIS_API_KEY environment variable is required');
    }
    
    // Select products for detailed impact analysis
    const productsForAnalysis = config.products.slice(0, 3);
    
    for (const product of productsForAnalysis) {
      console.log(`Analyzing impact for ${product.name}...`);
      
      // Focus on Vietnam as the source country
      const sourceCountry = 'Vietnam';
      const destinationCountries = config.countries.filter(c => c !== sourceCountry);
      
      try {
        // Call impact analysis API
        const response = await axios.post('https://api.tradetariffdata.com/v2/impact-analysis', {
          product: product.name,
          sourceCountry,
          destinationCountries,
          hsCode: product.hsCode,
          timeframeMonths: 24
        }, {
          headers: {
            'Authorization': `Bearer ${analysisApiKey}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });
        
        // Extract analysis from response
        const analysisData = response.data;
        
        // Map API response to our internal format
        const analysis: TariffImpactAnalysis = {
          product: product.name,
          sourceCountry,
          destinationCountries,
          timeframeMonths: 24,
          riskLevel: analysisData.risk_level,
          summary: analysisData.summary,
          impactByCountry: analysisData.country_impacts.map((impact: any) => ({
            country: impact.country,
            currentTariffRate: parseFloat(impact.current_rate),
            projectedRate: parseFloat(impact.projected_rate),
            impactAssessment: impact.assessment
          })),
          impactFactors: analysisData.impact_factors,
          recommendations: analysisData.recommendations,
          source: analysisData.source || 'Trade Policy Analysis Tool',
          analysisDate: analysisData.analysis_date || new Date().toISOString()
        };
        
        // Create data product
        const productSlug = product.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
        const dataProduct: DataProduct = {
          id: `tariff_impact:${productSlug}:1.0`,
          namespace: 'tariff_impact',
          version: '1.0',
          entityName: `${productSlug}_analysis`,
          entities: {
            analysis: analysis
          },
          metadata: {
            product: product.name,
            hsCode: product.hsCode,
            sourceCountry,
            destinationCountries,
            timeframeMonths: 24,
            generatedAt: new Date().toISOString(),
            source: 'Trade Policy Analysis Tool'
          }
        };
        
        // Save to file
        const filePath = path.join(outputDir, `TariffImpact_v1.${productSlug}_analysis.json`);
        await fs.promises.writeFile(filePath, JSON.stringify(dataProduct, null, 2));
        
        // Store in Redis
        await dataStore.storeDataProduct(dataProduct);
        console.log(`Stored tariff impact analysis for ${product.name} in Redis`);
      } catch (error) {
        console.error(`Error analyzing impact for ${product.name}:`, error);
      }
    }
    
    console.log('Tariff impact analysis completed');
  } catch (error) {
    console.error('Error generating tariff impact analysis:', error);
    throw error;
  }
}

/**
 * Group tariff records by country pair
 */
function groupByCountryPair(tariffs: TariffRecord[]): Record<string, TariffRecord[]> {
  return tariffs.reduce((acc, tariff) => {
    const key = `${tariff.sourceCountry}-to-${tariff.destinationCountry}`;
    
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(tariff);
    return acc;
  }, {} as Record<string, TariffRecord[]>);
}

// --- Helper functions for generating realistic data ---

function getRandomSubcategory(productCategory: string): string {
  const subcategories: Record<string, string[]> = {
    'Electronics': [
      'Smartphones', 'Laptops', 'Semiconductors', 'Circuit boards', 
      'Display panels', 'Microprocessors', 'Storage devices', 'Communication equipment'
    ],
    'Textiles': [
      'Cotton fabrics', 'Synthetic fibers', 'Apparel', 'Home textiles',
      'Industrial textiles', 'Yarn', 'Technical textiles', 'Wool products'
    ],
    'Agricultural products': [
      'Rice', 'Vegetables', 'Fruits', 'Coffee', 
      'Tea', 'Spices', 'Seafood', 'Processed foods'
    ],
    'Machinery': [
      'Industrial machinery', 'Production equipment', 'Construction equipment',
      'Agricultural machinery', 'Mining equipment', 'Food processing machinery'
    ],
    'Automotive': [
      'Passenger vehicles', 'Commercial vehicles', 'Auto parts', 
      'Chassis', 'Engines', 'Tires', 'Interior components'
    ]
  };
  
  const options = subcategories[productCategory] || ['Generic'];
  return options[Math.floor(Math.random() * options.length)];
}

function generateTariffRate(sourceCountry: string, destinationCountry: string): number {
  // Generate realistic tariff rates based on country relationships
  if (sourceCountry === 'Vietnam' && destinationCountry === 'United States') {
    return Math.round((3 + Math.random() * 7) * 10) / 10; // 3-10%
  }
  if (sourceCountry === 'Vietnam' && destinationCountry === 'European Union') {
    return Math.round((1 + Math.random() * 5) * 10) / 10; // 1-6%
  }
  if (sourceCountry === 'Vietnam' && destinationCountry === 'Japan') {
    return Math.round((0 + Math.random() * 4) * 10) / 10; // 0-4%
  }
  if (sourceCountry === 'Vietnam' && destinationCountry === 'China') {
    return Math.round((5 + Math.random() * 10) * 10) / 10; // 5-15%
  }
  
  // Default case
  return Math.round((2 + Math.random() * 13) * 10) / 10; // 2-15%
}

function generateProjectedRate(sourceCountry: string, destinationCountry: string): number {
  // Generally project slight decreases due to trade agreements
  const currentRate = generateTariffRate(sourceCountry, destinationCountry);
  
  // 70% chance of decrease, 20% chance of increase, 10% chance of no change
  const rand = Math.random();
  if (rand < 0.7) {
    // Decrease by 5-25%
    const reductionFactor = 0.75 + (Math.random() * 0.2);
    return Math.round(currentRate * reductionFactor * 10) / 10;
  } else if (rand < 0.9) {
    // Increase by 5-15%
    const increaseFactor = 1.05 + (Math.random() * 0.1);
    return Math.round(currentRate * increaseFactor * 10) / 10;
  } else {
    // No change
    return currentRate;
  }
}

function getRandomEffectiveDate(): string {
  // Generate a date within the last 3 years
  const now = new Date();
  const threeYearsAgo = new Date();
  threeYearsAgo.setFullYear(now.getFullYear() - 3);
  
  const randomTimestamp = threeYearsAgo.getTime() + Math.random() * (now.getTime() - threeYearsAgo.getTime());
  const date = new Date(randomTimestamp);
  
  return date.toISOString().split('T')[0]; // YYYY-MM-DD format
}

function getRandomSource(sources: string[]): string {
  return sources[Math.floor(Math.random() * sources.length)];
}

function getRegulationAuthority(country: string): string {
  const authorities: Record<string, string> = {
    'United States': 'US Customs and Border Protection',
    'European Union': 'European Commission',
    'Japan': 'Japan Customs',
    'China': 'General Administration of Customs China',
    'Vietnam': 'Vietnam Customs Department'
  };
  
  return authorities[country] || 'National Customs Authority';
}

function getRandomTradeAgreement(sourceCountry: string, destinationCountry: string): string {
  const agreements: Record<string, string[]> = {
    'Vietnam-United States': ['US-Vietnam Trade and Investment Framework Agreement'],
    'Vietnam-European Union': ['EU-Vietnam Free Trade Agreement (EVFTA)'],
    'Vietnam-Japan': ['Japan-Vietnam Economic Partnership Agreement (JVEPA)'],
    'Vietnam-China': ['ASEAN-China Free Trade Area (ACFTA)'],
    'United States-Vietnam': ['US-Vietnam Trade and Investment Framework Agreement'],
    'European Union-Vietnam': ['EU-Vietnam Free Trade Agreement (EVFTA)'],
    'Japan-Vietnam': ['Japan-Vietnam Economic Partnership Agreement (JVEPA)'],
    'China-Vietnam': ['ASEAN-China Free Trade Area (ACFTA)']
  };
  
  const key = `${sourceCountry}-${destinationCountry}`;
  const defaultAgreements = ['WTO Most Favored Nation (MFN)', 'Generalized System of Preferences (GSP)'];
  
  const potentialAgreements = agreements[key] || defaultAgreements;
  return potentialAgreements[Math.floor(Math.random() * potentialAgreements.length)];
}

function getRandomExemptions(): string[] {
  const allExemptions = [
    'Small business imports under $800',
    'Educational and research purposes',
    'Humanitarian aid',
    'Temporary imports for exhibitions',
    'Raw materials for domestic manufacturing',
    'Medical and pharmaceutical products',
    'Components for domestic assembly',
    'Certified sustainable production'
  ];
  
  // Pick 1-3 random exemptions
  const count = 1 + Math.floor(Math.random() * 3);
  const result: string[] = [];
  
  for (let i = 0; i < count; i++) {
    const randomIndex = Math.floor(Math.random() * allExemptions.length);
    const exemption = allExemptions[randomIndex];
    
    if (!result.includes(exemption)) {
      result.push(exemption);
    }
  }
  
  return result;
}

function getRandomRiskLevel(): 'low' | 'medium' | 'high' {
  const levels: Array<'low' | 'medium' | 'high'> = ['low', 'medium', 'high'];
  return levels[Math.floor(Math.random() * levels.length)];
}

function getRandomImpactAssessment(): string {
  const assessments = [
    'Minimal impact expected due to established trade corridors',
    'Moderate impact due to changing regulations',
    'Significant impact from recent policy changes',
    'Potential disruption from upcoming elections',
    'Beneficial impact from new trade agreement implementation',
    'Uncertain impact due to ongoing negotiations',
    'Declining tariffs expected to boost exports'
  ];
  
  return assessments[Math.floor(Math.random() * assessments.length)];
}

function getRandomImpactFactors(): string[] {
  const allFactors = [
    'Upcoming elections in destination country',
    'Ongoing trade negotiations',
    'Supply chain disruptions',
    'Changing consumer preferences',
    'Environmental regulations',
    'Domestic industry protection measures',
    'Reciprocity in trade policies',
    'Regional trade agreement revisions',
    'Currency fluctuations',
    'International diplomatic relations',
    'National security concerns'
  ];
  
  // Pick 3-5 random factors
  const count = 3 + Math.floor(Math.random() * 3);
  const result: string[] = [];
  
  for (let i = 0; i < count; i++) {
    const randomIndex = Math.floor(Math.random() * allFactors.length);
    const factor = allFactors[randomIndex];
    
    if (!result.includes(factor)) {
      result.push(factor);
    }
  }
  
  return result;
}

function getRandomRecommendations(product: string): string[] {
  const baseRecommendations = [
    `Diversify ${product} export markets to reduce risk`,
    `Monitor upcoming regulatory changes in key markets`,
    `Participate in trade forums to advocate for favorable policies`,
    `Develop contingency plans for potential tariff increases`,
    `Explore qualification for special trade programs`,
    `Consider shifting production to qualify for more favorable rules of origin`,
    `Evaluate comprehensive insurance options for international shipments`,
    `Establish liaison offices in key export markets`,
    `Partner with local distributors to navigate regulatory requirements`,
    `Optimize supply chain to minimize tariff exposure`
  ];
  
  // Pick 3-5 random recommendations
  const count = 3 + Math.floor(Math.random() * 3);
  const result: string[] = [];
  
  for (let i = 0; i < count; i++) {
    const randomIndex = Math.floor(Math.random() * baseRecommendations.length);
    const recommendation = baseRecommendations[randomIndex];
    
    if (!result.includes(recommendation)) {
      result.push(recommendation);
    }
  }
  
  return result;
}

// Run the process if this script is executed directly
if (require.main === module) {
  parseAndProcessTariffData()
    .then(() => {
      console.log('Process completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Process failed:', error);
      process.exit(1);
    });
}

export { parseAndProcessTariffData };