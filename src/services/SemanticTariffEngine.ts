import { OntologyManager } from './OntologyManager';
import { NotificationCenter } from './NotificationCenter';
import { TariffOntology } from './TariffOntology';
import { LangChainIntegration } from './LangChainIntegration';

// Type definitions
export interface TariffDataSource {
  id: string;
  name: string;
  url?: string;
  type: 'api' | 'website' | 'database';
  description: string;
  reliability: number; // 0-1 scale
}

export interface TariffInfo {
  id: string;
  hsCode: string;
  description: string;
  sourceCountry: string;
  destinationCountry: string;
  rate: number;
  currency?: string;
  effectiveDate: string;
  expirationDate?: string;
  exemptions?: string[];
  specialConditions?: string[];
  source: TariffDataSource;
  confidence: number; // 0-1 scale, represents AI extraction confidence
  lastUpdated: string;
}

export interface TariffSearchParams {
  product?: string;
  hsCode?: string;
  originCountry?: string;
  destinationCountry?: string;
  effectiveDate?: string;
  includeExpired?: boolean;
  limit?: number;
}

export interface TariffChangeEvent {
  id: string;
  title: string;
  description: string;
  country: string;
  hsCode?: string;
  productCategories: string[];
  oldRate?: number;
  newRate?: number;
  effectiveDate: string;
  announcementDate: string;
  source: TariffDataSource;
  impactLevel: 'low' | 'medium' | 'high';
  relatedCountries: string[];
  confidence: number;
}

/**
 * SemanticTariffEngine
 * 
 * Integrates Perplexity AI's real-time search with Apache Jena's semantic reasoning
 * through LangChain as the integration layer to create a comprehensive tariff data system.
 */
export class SemanticTariffEngine {
  private ontologyManager: OntologyManager;
  private tariffOntology: TariffOntology;
  private langChainIntegration: LangChainIntegration;
  private isInitialized: boolean = false;
  private tariffDataSources: TariffDataSource[] = [
    {
      id: 'perplexity-api',
      name: 'Perplexity AI Search',
      type: 'api',
      description: 'Real-time tariff information from Perplexity AI search',
      reliability: 0.85
    },
    {
      id: 'wto-tariff-db',
      name: 'WTO Tariff Database',
      url: 'https://tariffdata.wto.org/',
      type: 'api',
      description: 'Official WTO tariff and trade data',
      reliability: 0.95
    },
    {
      id: 'trade-gov',
      name: 'Trade.gov',
      url: 'https://www.trade.gov/tariff-rates',
      type: 'website',
      description: 'U.S. government trade portal with tariff information',
      reliability: 0.9
    }
  ];
  
  constructor(ontologyManager: OntologyManager) {
    this.ontologyManager = ontologyManager;
    this.tariffOntology = new TariffOntology(ontologyManager);
    this.langChainIntegration = new LangChainIntegration();
  }

  /**
   * Initialize the Semantic Tariff Engine
   */
  public async initialize(): Promise<boolean> {
    try {
      // Initialize the tariff ontology
      await this.tariffOntology.initialize();
      
      // Initialize the LangChain integration
      await this.langChainIntegration.initialize();
      
      // Set up change monitoring
      this.setupChangeMonitoring();
      
      this.isInitialized = true;
      console.log('Semantic Tariff Engine initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize Semantic Tariff Engine:', error);
      return false;
    }
  }

  /**
   * Set up monitoring for tariff changes
   */
  private setupChangeMonitoring(): void {
    // This would be implemented to periodically check for tariff changes
    // For demonstration purposes, we'll just log that it's set up
    console.log('Tariff change monitoring set up');
    
    // In a real implementation, this would be a periodic check
    setInterval(() => {
      this.checkForTariffChanges();
    }, 86400000); // Daily check
  }

  /**
   * Check for tariff changes using Perplexity
   */
  private async checkForTariffChanges(): Promise<void> {
    try {
      const recentChanges = await this.langChainIntegration.queryRecentTariffChanges();
      
      if (recentChanges && recentChanges.length > 0) {
        // Process the changes
        for (const change of recentChanges) {
          // Store in ontology
          const changeId = await this.tariffOntology.addTariffChange(change);
          
          // Create notification for significant changes
          if (change.impactLevel === 'high') {
            NotificationCenter.showNotification({
              title: `Important Tariff Change: ${change.title}`,
              body: change.description,
              priority: 'high',
              data: change
            });
          }
        }
        
        console.log(`Processed ${recentChanges.length} tariff changes`);
      }
    } catch (error) {
      console.error('Error checking for tariff changes:', error);
    }
  }

  /**
   * Search for tariff information using the specified parameters
   */
  public async searchTariffs(params: TariffSearchParams): Promise<TariffInfo[]> {
    if (!this.isInitialized) {
      throw new Error('Semantic Tariff Engine not initialized');
    }
    
    try {
      // First check the ontology for existing information
      const ontologyResults = await this.tariffOntology.searchTariffs(params);
      
      // If we have sufficient results, return them
      if (ontologyResults.length >= (params.limit || 5)) {
        return ontologyResults;
      }
      
      // Otherwise, supplement with real-time Perplexity search
      const queryParams = {
        ...params,
        limit: params.limit ? params.limit - ontologyResults.length : 5
      };
      
      const perplexityResults = await this.langChainIntegration.searchTariffsWithPerplexity(queryParams);
      
      // Store the new results in the ontology
      if (perplexityResults.length > 0) {
        for (const tariff of perplexityResults) {
          await this.tariffOntology.addTariffInfo(tariff);
        }
      }
      
      // Combine and return results
      return [...ontologyResults, ...perplexityResults];
    } catch (error) {
      console.error('Error searching tariffs:', error);
      throw error;
    }
  }

  /**
   * Get all available data sources for tariff information
   */
  public getTariffDataSources(): TariffDataSource[] {
    return this.tariffDataSources;
  }

  /**
   * Get tariff changes by country
   */
  public async getTariffChangesByCountry(country: string, limit: number = 10): Promise<TariffChangeEvent[]> {
    if (!this.isInitialized) {
      throw new Error('Semantic Tariff Engine not initialized');
    }
    
    try {
      // Query the ontology for tariff changes for the specified country
      return await this.tariffOntology.getTariffChangesByCountry(country, limit);
    } catch (error) {
      console.error(`Error getting tariff changes for ${country}:`, error);
      throw error;
    }
  }

  /**
   * Calculate tariff impact for a specific product category
   */
  public async calculateTariffImpact(params: {
    product: string;
    countries: string[];
    timeframe: number; // months
  }): Promise<any> {
    if (!this.isInitialized) {
      throw new Error('Semantic Tariff Engine not initialized');
    }
    
    try {
      // This would query the ontology for historical data and use LangChain
      // to analyze potential impacts
      const analysis = await this.langChainIntegration.analyzeProductTariffImpact(
        params.product,
        params.countries,
        params.timeframe
      );
      
      return analysis;
    } catch (error) {
      console.error('Error calculating tariff impact:', error);
      throw error;
    }
  }

  /**
   * Execute a SPARQL query against the tariff ontology
   */
  public async executeSparqlQuery(query: string): Promise<any[]> {
    if (!this.isInitialized) {
      throw new Error('Semantic Tariff Engine not initialized');
    }
    
    try {
      return await this.tariffOntology.executeSparqlQuery(query);
    } catch (error) {
      console.error('Error executing SPARQL query:', error);
      throw error;
    }
  }

  /**
   * Import tariff data from a structured source
   */
  public async importTariffData(data: TariffInfo[]): Promise<number> {
    if (!this.isInitialized) {
      throw new Error('Semantic Tariff Engine not initialized');
    }
    
    try {
      let importedCount = 0;
      
      for (const tariff of data) {
        await this.tariffOntology.addTariffInfo(tariff);
        importedCount++;
      }
      
      return importedCount;
    } catch (error) {
      console.error('Error importing tariff data:', error);
      throw error;
    }
  }
}

// Create and export a singleton instance
const semanticTariffEngine = new SemanticTariffEngine(new OntologyManager({}));

export default semanticTariffEngine;