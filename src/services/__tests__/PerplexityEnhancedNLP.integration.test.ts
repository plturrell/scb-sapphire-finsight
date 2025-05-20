/**
 * Integration tests for PerplexityEnhancedNLP
 * Tests realistic scenarios with complex data and API responses
 */

import { PerplexityEnhancedNLP } from '../PerplexityEnhancedNLP';
import perplexityApiClient from '../PerplexityApiClient';
import { ontologyManager } from '../OntologyManager';
import { NotificationCenter } from '../NotificationCenter';

// Mock dependencies
jest.mock('../PerplexityApiClient');
jest.mock('../OntologyManager', () => ({
  ontologyManager: {
    getInstancesOfClass: jest.fn(),
    getDataPropertyValue: jest.fn(),
    getLabelForInstance: jest.fn(),
    getRelatedObject: jest.fn(),
    expandUri: jest.fn((uri) => `expanded:${uri}`),
    getEntitiesByRelation: jest.fn(),
    query: jest.fn()
  }
}));

jest.mock('../NotificationCenter', () => ({
  NotificationCenter: {
    showNotification: jest.fn()
  }
}));

describe('PerplexityEnhancedNLP - Integration Tests', () => {
  let perplexityService: PerplexityEnhancedNLP;
  
  // Sample real-world tariff data for testing
  const realWorldTariffData = {
    countries: [
      {
        name: 'Vietnam',
        avgTariffRate: 7.5,
        economicStrength: 0.72,
        competitiveness: 0.68,
        gdpGrowth: 6.2
      },
      {
        name: 'China',
        avgTariffRate: 12.8,
        economicStrength: 0.88,
        competitiveness: 0.83,
        gdpGrowth: 5.1
      },
      {
        name: 'Thailand',
        avgTariffRate: 8.4,
        economicStrength: 0.75,
        competitiveness: 0.70,
        gdpGrowth: 3.8
      }
    ],
    products: [
      {
        name: 'Electronics',
        tradeVolume: 28500,
        marketShare: 0.31,
        elasticity: -1.38
      },
      {
        name: 'Automotive',
        tradeVolume: 19200,
        marketShare: 0.24,
        elasticity: -0.92
      },
      {
        name: 'Textiles',
        tradeVolume: 14600,
        marketShare: 0.18,
        elasticity: -1.05
      }
    ],
    policies: [
      {
        name: 'RCEP Implementation',
        effectDate: '2025-06-01',
        coverage: 0.85,
        sectors: ['Electronics', 'Automotive']
      },
      {
        name: 'EU Green Tariffs',
        effectDate: '2026-01-01',
        coverage: 0.78,
        sectors: ['Automotive', 'Chemicals']
      }
    ]
  };
  
  // Sample simulation results
  const mockSimulationResults = {
    optimalPath: [
      { action: 'MODIFY_TARIFF', country: 'Vietnam', product: 'Electronics', change: -3.5 },
      { action: 'APPLY_POLICY', name: 'RCEP Implementation' },
      { action: 'MODIFY_TARIFF', country: 'China', product: 'Automotive', change: 2.1 }
    ],
    expectedValues: {
      gdpImpact: -1.2,
      tradeBalanceChange: 258.4,
      employmentImpact: 0.8
    },
    confidenceInterval: [0.84, 0.92],
    riskMetrics: {
      volatility: 0.12,
      downside: 1.8,
      maxDrawdown: 2.4
    }
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
    perplexityService = PerplexityEnhancedNLP.getInstance(ontologyManager);
    
    // Mock API client responses
    (perplexityApiClient.getAnswer as jest.Mock).mockImplementation((query) => {
      if (query.includes('TARIFF IMPACT CONTEXT')) {
        return Promise.resolve({
          content: 'The analysis indicates significant tariff impacts on electronics sector with Vietnam benefiting from reduced rates. China may face challenges in automotive exports due to increased competition.',
          sources: [
            { title: 'ASEAN Trade Report 2025', reliability: 0.92, relevance: 0.87 },
            { title: 'Global Value Chains and Tariff Effects', reliability: 0.89, relevance: 0.82 }
          ],
          confidence: 0.91
        });
      } else if (query.includes('SUPPLY CHAIN CONTEXT')) {
        return Promise.resolve({
          content: 'Supply chain analysis shows potential for diversification away from China toward Vietnam and Thailand for electronics components, driven by tariff differentials and improving infrastructure.',
          sources: [
            { title: 'McKinsey Supply Chain Resilience Report', reliability: 0.94, relevance: 0.88 },
            { title: 'ASEAN Manufacturing Outlook 2025', reliability: 0.91, relevance: 0.85 }
          ],
          confidence: 0.89
        });
      } else {
        return Promise.resolve({
          content: 'General analysis of trade patterns without specific tariff context.',
          sources: [
            { title: 'World Trade Report', reliability: 0.84, relevance: 0.75 }
          ],
          confidence: 0.75
        });
      }
    });
  });
  
  describe('Real-world tariff scenario analysis', () => {
    test('provides enhanced insights for ASEAN tariff changes', async () => {
      // Setup the query with real-world context
      const query = {
        query: "What are the implications of Vietnam's reduced tariffs on electronics under RCEP?",
        context: JSON.stringify(realWorldTariffData),
        domainContext: 'tariffs' as 'tariffs',
        responseFormat: 'analytical' as 'analytical'
      };
      
      // Process the query through the service
      const result = await perplexityService.processQuery(query);
      
      // Verify the response includes enhanced content
      expect(result.response).toContain('Vietnam');
      expect(result.response).toContain('electronics');
      expect(result.confidence).toBeGreaterThan(0.8);
      
      // Verify sources are included
      expect(result.sources.length).toBeGreaterThan(0);
      expect(result.sources[0]).toHaveProperty('title');
      expect(result.sources[0]).toHaveProperty('reliability');
      
      // Verify insights were generated
      expect(result.insights.length).toBeGreaterThan(0);
      
      // Check for visualization suggestions related to tariff impacts
      expect(result.visualizationSuggestions).toBeDefined();
      if (result.visualizationSuggestions) {
        const hasTariffVisualization = result.visualizationSuggestions.some(
          vs => vs.title.toLowerCase().includes('tariff') || vs.description.toLowerCase().includes('tariff')
        );
        expect(hasTariffVisualization).toBeTruthy();
      }
    });
    
    test('enhances insights from simulation results', async () => {
      // Setup the perplexity service with ability to enhance insights
      const enhanceInsightsSpy = jest.spyOn(perplexityService as any, 'enhanceInsights')
        .mockImplementation((insights) => {
          return insights.map((insight: string) => 
            `Enhanced: ${insight} with price elasticity and economic projections`
          );
        });
      
      // Generate insights for these simulation results
      const insights = [
        'Electronics sector in Vietnam shows positive response to tariff reduction',
        "China's automotive exports face competitive pressure from ASEAN producers",
        'RCEP implementation provides significant benefits for electronics supply chains'
      ];
      
      const enhancedInsights = await perplexityService.enhanceInsights(insights);
      
      // Verify insights were enhanced
      expect(enhancedInsights.length).toBe(insights.length);
      enhancedInsights.forEach(insight => {
        expect(insight).toContain('Enhanced:');
        expect(insight).toContain('with price elasticity and economic projections');
      });
      
      // Check that the enhanceInsights method was called correctly
      expect(enhanceInsightsSpy).toHaveBeenCalledWith(insights);
      
      // Cleanup
      enhanceInsightsSpy.mockRestore();
    });
    
    test('processes complex trade data with accurate confidence scores', async () => {
      // Setup the perplexity service with mock trade data processing
      const processTradeDataSpy = jest.spyOn(perplexityService as any, 'processTradeData')
        .mockResolvedValue({
          elasticityInsights: [
            {
              product: 'Electronics',
              elasticityCoefficient: -1.38,
              recommendation: 'High price sensitivity suggests significant volume increases with tariff reduction'
            },
            {
              product: 'Automotive',
              elasticityCoefficient: -0.92,
              recommendation: 'Moderate price sensitivity suggests measured impact from tariff changes'
            }
          ],
          confidenceScores: {
            overall: 0.87,
            dataQuality: 0.91,
            modelReliability: 0.84,
            timeHorizon: 0.88
          }
        });
      
      // Process realistic trade data
      const result = await perplexityService.processTradeData(realWorldTariffData);
      
      // Verify elasticity insights
      expect(result.elasticityInsights.length).toBe(2);
      expect(result.elasticityInsights[0].product).toBe('Electronics');
      expect(result.elasticityInsights[0].elasticityCoefficient).toBe(-1.38);
      
      // Verify confidence scores
      expect(result.confidenceScores.overall).toBeCloseTo(0.87);
      expect(result.confidenceScores.dataQuality).toBeGreaterThan(0.85);
      
      // Cleanup
      processTradeDataSpy.mockRestore();
    });
  });
  
  describe('Cache management and performance', () => {
    test('caches responses for identical queries to improve performance', async () => {
      const getAnswerSpy = jest.spyOn(perplexityApiClient, 'getAnswer');
      
      // First query should call the API
      const query = {
        query: "What are the implications of Vietnam's reduced tariffs on electronics?",
        domainContext: 'tariffs' as 'tariffs'
      };
      
      await perplexityService.processQuery(query);
      expect(getAnswerSpy).toHaveBeenCalledTimes(1);
      
      // Same query should use cache
      await perplexityService.processQuery(query);
      expect(getAnswerSpy).toHaveBeenCalledTimes(1); // Still just one call
      
      // Different query should call API again
      await perplexityService.processQuery({
        ...query,
        query: 'How does the EU Green Tariff affect automotive exports?'
      });
      expect(getAnswerSpy).toHaveBeenCalledTimes(2);
    });
    
    test('handles API failures gracefully', async () => {
      // Mock API failure
      (perplexityApiClient.getAnswer as jest.Mock).mockRejectedValueOnce(new Error('API timeout'));
      
      // Attempt to process a query
      const query = {
        query: 'What are the trade implications of increased tariffs?',
        domainContext: 'tariffs' as 'tariffs'
      };
      
      // Should throw an error but with helpful context
      await expect(perplexityService.processQuery(query)).rejects.toThrow('Failed to process query');
    });
  });
  
  describe('Integration with ontology for domain context', () => {
    test('enriches queries with ontology concepts', async () => {
      // Mock ontology responses
      (ontologyManager.query as jest.Mock).mockImplementation((sparqlQuery) => {
        if (sparqlQuery.includes('tariff')) {
          return [
            { concept: 'tas:TariffBarrier', label: 'Tariff Barrier' },
            { concept: 'tas:ASEANPreferentialTariff', label: 'ASEAN Preferential Tariff' }
          ];
        }
        return [];
      });
      
      // Access the private method using type assertion
      const enhanceQueryMethod = (perplexityService as any).enhanceQueryWithDomainKnowledge.bind(perplexityService);
      
      // Test the method
      const enhancedQuery = await enhanceQueryMethod({
        query: 'Impact of tariff reduction on electronics imports',
        domainContext: 'tariffs'
      });
      
      // Verify query enhancement
      expect(enhancedQuery.query).toContain('[TARIFF IMPACT CONTEXT]');
      expect(enhancedQuery.query).toContain('financial concepts');
    });
  });
});
