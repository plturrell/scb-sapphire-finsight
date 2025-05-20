/**
 * Real Integration Tests for Tariff API Services
 * 
 * Tests actual API integration with live services.
 * Requires environment variables to be set for API access.
 */

import { VietnamApiClient } from '../VietnamApiClient';
import semanticTariffEngine from '../SemanticTariffEngine';
import { default as OntologyManager } from '../OntologyManager';
import tariffImpactSimulator from '../TariffImpactSimulator';
import { PerplexityEnhancedNLP } from '../PerplexityEnhancedNLP';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Skip tests if API keys are not configured
const runRealTests = process.env.RUN_REAL_INTEGRATION_TESTS === 'true' &&
                      process.env.VIETNAM_API_KEY &&
                      process.env.PERPLEXITY_API_KEY;

// Define test groups
describe('Tariff API Service - Real Integration Tests', () => {
  let vietnamApiClient: VietnamApiClient;
  let perplexityNLP: any;
  
  beforeEach(() => {
    // Skip setup if not running real tests
    if (!runRealTests) return;
    
    // Initialize with real API credentials
    vietnamApiClient = new VietnamApiClient({
      apiKey: process.env.VIETNAM_API_KEY,
      maxRetries: 2,
      rateLimitPerMinute: 20 // Reduced for test environment
    });
    
    // Use imported semanticTariffEngine singleton
    // Access Perplexity API through the exposed singleton
    const PerplexityService = require('../PerplexityEnhancedNLP');
    perplexityNLP = PerplexityService.perplexityService;
  });
  
  describe('Vietnam API Client Integration', () => {
    // Only run if API keys are available
    (runRealTests ? test : test.skip)('fetches real tariff rates from Vietnam Customs API', async () => {
      // Use real HS codes for electronic components
      const productCodes = ['8542.31', '8542.32'];
      
      // Make actual API call
      const result = await vietnamApiClient.getCustomsTariffRates(productCodes);
      
      // Verify real data structure
      expect(result.success).toBe(true);
      expect(result.tariffRates).toBeDefined();
      expect(result.tariffRates.length).toBeGreaterThan(0);
      
      // Verify data fields from the real API
      const firstTariff = result.tariffRates[0];
      expect(firstTariff).toHaveProperty('code');
      expect(firstTariff).toHaveProperty('rate');
      expect(firstTariff).toHaveProperty('effective_date');
    });
    
    (runRealTests ? test : test.skip)('retrieves real market analysis from Vietstock', async () => {
      // Request real sector data
      const result = await vietnamApiClient.getVietstockTariffAnalysis({
        sectors: ['electronics', 'automotive'],
        timeframe: 'monthly'
      });
      
      // Verify real analysis data
      expect(result.success).toBe(true);
      expect(result.analysis).toBeDefined();
      expect(result.analysis.length).toBeGreaterThan(0);
      
      // Check analysis structure
      const analysisItem = result.analysis[0];
      expect(analysisItem).toHaveProperty('sector');
      expect(analysisItem).toHaveProperty('impact');
      expect(analysisItem).toHaveProperty('trend');
    });
    
    (runRealTests ? test : test.skip)('fetches real VnExpress news about tariffs', async () => {
      // Search for tariff-related news in Vietnamese sources
      const result = await vietnamApiClient.searchVnExpress('thuế quan xuất nhập khẩu', {
        fromDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        limit: 5
      });
      
      // Verify real news retrieval
      expect(result.success).toBe(true);
      expect(result.articles).toBeDefined();
      
      // If articles exist, check their structure
      if (result.articles.length > 0) {
        const article = result.articles[0];
        expect(article).toHaveProperty('title');
        expect(article).toHaveProperty('publishDate');
        expect(article).toHaveProperty('url');
      }
    });
  });
  
  describe('Semantic Tariff Engine Integration', () => {
    (runRealTests ? test : test.skip)('initializes the semantic engine with real ontology', async () => {
      // Initialize the real semantic engine
      const result = await semanticTariffEngine.initialize();
      
      // Verify successful initialization
      expect(result).toBe(true);
    });
    
    (runRealTests ? test : test.skip)('searches for real tariff information', async () => {
      // First initialize
      await semanticTariffEngine.initialize();
      
      // Search for real tariff data
      const results = await semanticTariffEngine.searchTariffs({
        destinationCountry: 'Vietnam',
        product: 'electronics',
        limit: 5
      });
      
      // Verify real data structure
      expect(Array.isArray(results)).toBe(true);
      
      // If results exist, check structure
      if (results.length > 0) {
        const tariffInfo = results[0];
        expect(tariffInfo).toHaveProperty('id');
        expect(tariffInfo).toHaveProperty('hsCode');
        expect(tariffInfo).toHaveProperty('rate');
        expect(tariffInfo).toHaveProperty('confidence');
      }
    });
  });
  
  describe('End-to-End Tariff Impact Simulation', () => {
    (runRealTests ? test : test.skip)('runs a full simulation with real data', async () => {
      // Initialize required components
      await semanticTariffEngine.initialize();
      
      // Run actual simulation with properly structured parameters
      const simulationResults = await tariffImpactSimulator.runSimulation({
        iterations: 1000,
        maxDepth: 10,
        explorationParameter: 1.4,
        domainContext: 'tariffs',
        confidenceLevel: 0.7,
        usePerplexityEnhancement: true,
        perplexityAnalysisDepth: 'comprehensive',
        sensitivityAnalysis: true
      });
      
      // Verify real simulation results
      expect(simulationResults).toBeDefined();
      expect(simulationResults.optimalPath).toBeDefined();
      expect(simulationResults.optimalPath.recommendations).toBeDefined();
      expect(simulationResults.optimalPath.recommendations.length).toBeGreaterThan(0);
      
      // Check simulation metrics
      expect(simulationResults.expectedValues).toBeDefined();
      expect(simulationResults.riskMetrics).toBeDefined();
    });
  });
  
  describe('Perplexity AI Integration', () => {
    (runRealTests ? test : test.skip)('initializes with API key and processes natural language queries', async () => {
      // Skip if not running real tests
      if (!runRealTests) return;
      
      // Ensure the API key is set through environment variables
      expect(process.env.PERPLEXITY_API_KEY).toBeTruthy();
      
      // Test NLP query processing
      const result = await perplexityNLP.processQuery({
        query: 'How will the new tariffs on semiconductors affect Vietnam?',
        context: 'Analyzing economic impacts of trade policies',
        domain: 'tariff-analysis'
      });
      
      // Verify real AI results
      expect(result).toBeDefined();
      expect(result.insights).toBeDefined();
      expect(result.insights.length).toBeGreaterThan(0);
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.sources).toBeDefined();
    });
    
    (runRealTests ? test : test.skip)('enhances trade data insights with real AI analysis', async () => {
      // Set up with real API key
      perplexityNLP.setApiKey(process.env.PERPLEXITY_API_KEY!);
      
      // Create sample insights for enhancement
      const insights = [
        "Vietnamese electronics exports may increase by 8%",
        "Thai automotive sector faces tariff uncertainties in Q3"
      ];
      
      // Enhance with real AI
      const enhancedInsights = await perplexityNLP.enhanceInsights(insights);
      
      // Verify real enhancement
      expect(enhancedInsights).toBeDefined();
      expect(enhancedInsights.length).toBe(insights.length);
      expect(enhancedInsights[0]).not.toBe(insights[0]); // Should be enhanced, not identical
    });
  });
});
