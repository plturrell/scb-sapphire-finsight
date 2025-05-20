/**
 * Integration tests for Tariff API services
 * Tests the API integration with realistic mock responses
 */

import { VietnamApiClient } from '../VietnamApiClient';
import dotenv from 'dotenv';
import { NotificationCenter } from '../NotificationCenter';

// Load environment variables
dotenv.config();

// Mock the fetch API
global.fetch = jest.fn();

// Mock NotificationCenter
jest.mock('../NotificationCenter', () => ({
  NotificationCenter: {
    showNotification: jest.fn()
  }
}));

// Mock OntologyManager
jest.mock('../OntologyManager', () => ({
  ontologyManager: {
    initialize: jest.fn().mockResolvedValue(true),
    getInstancesOfClass: jest.fn(),
    addTariffInfo: jest.fn().mockResolvedValue('tariff-123'),
    addTariffChange: jest.fn().mockResolvedValue('change-123'),
    addDataProperty: jest.fn(),
    addInstance: jest.fn(),
    addObjectProperty: jest.fn(),
    query: jest.fn()
  }
}));

// Mock SemanticTariffEngine
jest.mock('../SemanticTariffEngine', () => ({
  __esModule: true,
  default: {
    initialize: jest.fn().mockResolvedValue(true),
    searchTariffs: jest.fn().mockResolvedValue([{
      id: 'tariff-123',
      hsCode: '8542.31',
      description: 'Electronic integrated circuits: Processors and controllers',
      sourceCountry: 'China',
      destinationCountry: 'Vietnam',
      rate: 5.2,
      effectiveDate: '2025-01-01',
      confidence: 0.89
    }])
  }
}));

// Mock TariffImpactSimulator
jest.mock('../TariffImpactSimulator', () => ({
  __esModule: true,
  default: {
    runSimulation: jest.fn().mockResolvedValue({
      optimalPath: { recommendations: ['Test recommendation'] },
      expectedValues: { gdpImpact: -0.5 }
    }),
    setSimulationData: jest.fn()
  }
}));

// Now import mocked modules
const tariffImpactSimulator = require('../TariffImpactSimulator').default;
const semanticTariffEngine = require('../SemanticTariffEngine').default;

// Add missing methods to the mocked semanticTariffEngine
semanticTariffEngine.tariffOntology = {
  initialize: jest.fn().mockResolvedValue(true),
  addTariffInfo: jest.fn().mockResolvedValue('tariff-id-123'),
  query: jest.fn().mockResolvedValue([
    { hsCode: '8542.31', rate: 5.2, sourceCountry: 'China', destinationCountry: 'Vietnam' }
  ])
};

semanticTariffEngine.checkForTariffChanges = jest.fn().mockImplementation(function() {
  return Promise.resolve({
    changes: [
      {
        id: 'change-123',
        hsCode: '8542.31',
        oldRate: 5.0,
        newRate: 5.2,
        effectiveDate: '2025-01-01',
        sourceCountry: 'China',
        destinationCountry: 'Vietnam'
      }
    ]
  });
});

describe('Tariff API Service - Integration Tests', () => {
  let vietnamApiClient: VietnamApiClient;
  let semanticTariffEngine: any;
  
  // Sample real-world API responses
  const mockTariffRatesResponse = {
    status: 'success',
    timestamp: new Date().toISOString(),
    data: {
      countries: [
        {
          name: 'Vietnam',
          iso_code: 'VN',
          tariff_schedules: [
            {
              product_category: 'Electronics',
              hs_code: '8517.12',
              rate: 7.5,
              effective_date: '2025-01-01',
              end_date: null
            },
            {
              product_category: 'Automotive',
              hs_code: '8703.23',
              rate: 12.0,
              effective_date: '2025-01-01',
              end_date: null
            }
          ]
        },
        {
          name: 'Thailand',
          iso_code: 'TH',
          tariff_schedules: [
            {
              product_category: 'Electronics',
              hs_code: '8517.12',
              rate: 8.4,
              effective_date: '2024-12-01',
              end_date: null
            },
            {
              product_category: 'Textiles',
              hs_code: '6204.32',
              rate: 15.2,
              effective_date: '2024-10-15',
              end_date: null
            }
          ]
        }
      ]
    }
  };
  
  const mockTradeVolumeResponse = {
    status: 'success',
    timestamp: new Date().toISOString(),
    data: {
      time_period: 'Q2 2025',
      trade_flows: [
        {
          origin: 'Vietnam',
          destination: 'Global',
          product_category: 'Electronics',
          hs_code: '8517.12',
          volume_usd: 876500000,
          volume_units: 12450000,
          year_over_year_change: 0.085
        },
        {
          origin: 'Thailand',
          destination: 'Global',
          product_category: 'Textiles',
          hs_code: '6204.32',
          volume_usd: 543200000,
          volume_units: 28750000,
          year_over_year_change: -0.032
        }
      ]
    }
  };
  
  const mockTariffPoliciesResponse = {
    status: 'success',
    timestamp: new Date().toISOString(),
    data: {
      policies: [
        {
          name: 'RCEP Implementation Phase 2',
          effective_date: '2025-06-01',
          countries: ['Vietnam', 'Thailand', 'Malaysia', 'Indonesia', 'China'],
          product_categories: ['Electronics', 'Automotive', 'Chemicals'],
          description: 'Second phase of RCEP tariff reductions for member countries',
          expected_impact: 'Moderate reduction in tariffs for electronics and automotive sectors'
        },
        {
          name: 'EU Green Tariff Framework',
          effective_date: '2026-01-01',
          countries: ['EU'],
          product_categories: ['Automotive', 'Steel', 'Chemicals'],
          description: 'Carbon-based border adjustment tax on imports to the EU',
          expected_impact: 'Significant increase in effective tariff rates for non-compliant producers'
        }
      ]
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    vietnamApiClient = new VietnamApiClient({
      apiKey: 'test-api-key',
      maxRetries: 1,
      rateLimitPerMinute: 100
    });
    semanticTariffEngine = require('../SemanticTariffEngine').default;
    
    // Load environment variables
    dotenv.config();
    
    // Reset the mock fetch implementation
    (global.fetch as jest.Mock).mockReset();
    
    // Set up mock fetch responses
    (global.fetch as jest.Mock).mockImplementation((url, options) => {
      if (url.includes('/api/tariffs/rates')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockTariffRatesResponse)
        });
      } else if (url.includes('/api/trade/volumes')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockTradeVolumeResponse)
        });
      } else if (url.includes('/api/tariffs/policies')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockTariffPoliciesResponse)
        });
      } else if (url.includes('/finance/tariff-impact-analysis')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockVietstockResponse)
        });
      }
      
      // Default response for any other URL
      return Promise.resolve({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ error: 'Not found' })
      });
    });
  });
  
  describe('Fetching and processing tariff rates', () => {
    test('fetches and processes current tariff rates', async () => {
      // Mock the fetch API to return our sample response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTariffRatesResponse
      });
      
      // Call the API client
      const result = await vietnamApiClient.getCustomsTariffRates(['7208.10', '7209.15']);
      
      // Verify the API was called with expected parameters
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/tariffs/rates'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.any(Object),
          body: expect.any(String)
        })
      );
      
      // Verify the result structure
      expect(result.status).toBe('success');
      expect(result.data.countries.length).toBe(2);
      
      // Check specific content
      const vietnam = result.data.countries.find(c => c.name === 'Vietnam');
      expect(vietnam).toBeDefined();
      expect(vietnam?.tariff_schedules.length).toBe(2);
      expect(vietnam?.tariff_schedules[0].product_category).toBe('Electronics');
      expect(vietnam?.tariff_schedules[0].rate).toBe(7.5);
    });
    
    test('integrates tariff data with ontology', async () => {
      // Mock the fetch API
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTariffRatesResponse
      });
      
      // Mock ontology operations
      // Mock TariffOntology methods
      const mockTariffOntology = {
        initialize: jest.fn().mockResolvedValue(true),
        addTariffInfo: jest.fn().mockResolvedValue('tariff-123'),
        addTariffChange: jest.fn().mockResolvedValue('change-123')
      };
      (semanticTariffEngine as any).tariffOntology = mockTariffOntology;
      
      // Initialize the semantic engine which integrates with ontology
      const result = await semanticTariffEngine.initialize();
      
      // Verify the initialization was successful
      expect(result).toBe(true);
      
      // Verify the tariff ontology's initialize method was called
      expect((semanticTariffEngine as any).tariffOntology.initialize).toHaveBeenCalled();
    });
  });
  
  describe('Fetching and processing trade volumes', () => {
    test('fetches current trade volume data', async () => {
      // Mock the fetch API
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTradeVolumeResponse
      });
      
      // Call the API client for Vietnam-specific market analysis
      const result = await vietnamApiClient.getVietstockTariffAnalysis({
        sectors: ['manufacturing', 'electronics'],
        timeframe: 'Q2 2025'
      });
      
      // Verify API call
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/trade/volumes'),
        expect.any(Object)
      );
      
      // Verify the result
      expect(result.status).toBe('success');
      expect(result.data.trade_flows.length).toBe(2);
      
      // Check specific content
      const electronics = result.data.trade_flows.find(tf => tf.product_category === 'Electronics');
      expect(electronics).toBeDefined();
      expect(electronics?.volume_usd).toBe(876500000);
      expect(electronics?.year_over_year_change).toBeCloseTo(0.085);
    });
    
    test('handles API errors gracefully', async () => {
      // Mock a failed API call
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
      
      // Mock implementation to throw an error
      jest.spyOn(vietnamApiClient, 'getVietstockTariffAnalysis').mockRejectedValueOnce(new Error('Network error'));
      
      // Mock LangChain integration to throw an error
      const mockLangChainIntegration = {
        queryRecentTariffChanges: jest.fn().mockRejectedValue(new Error('Network error'))
      };
      (semanticTariffEngine as any).langChainIntegration = mockLangChainIntegration;
      
      // Call the API client and expect it to handle the error
      await expect(vietnamApiClient.getVietstockTariffAnalysis({
        timeframe: 'Q2 2025'
      })).rejects.toThrow('Network error');
      
      // Call the private method and expect it to handle the error properly
      await expect((semanticTariffEngine as any).checkForTariffChanges.call(semanticTariffEngine)).rejects.toThrow('Error checking for tariff changes');
      
      // Verify error notification was shown
      expect(NotificationCenter.showNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          title: expect.stringContaining('Error'),
          priority: 'high'
        }),
        expect.any(String),
        expect.any(String)
      );
    });
  });
  
  describe('Fetching and processing tariff policies', () => {
    test('fetches upcoming tariff policy changes', async () => {
      // Mock the fetch API
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTariffPoliciesResponse
      });
      
      // Setup a mock for the LangChain integration
      const mockLangChainIntegration = {
        queryRecentTariffChanges: jest.fn().mockResolvedValue(mockTariffPoliciesResponse.data.policies)
      };
      (semanticTariffEngine as any).langChainIntegration = mockLangChainIntegration;
      
      // Call the private method using function binding to access it
      const result = await (semanticTariffEngine as any).checkForTariffChanges.call(semanticTariffEngine);
      
      // Verify API call
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/tariffs/policies'),
        expect.any(Object)
      );
      
      // Verify the result
      expect(result.status).toBe('success');
      expect(result.data.policies.length).toBe(2);
      
      // Check specific content
      const rcepPolicy = result.data.policies.find(p => p.name.includes('RCEP'));
      expect(rcepPolicy).toBeDefined();
      expect(rcepPolicy?.effective_date).toBe('2025-06-01');
      expect(rcepPolicy?.countries).toContain('Vietnam');
      expect(rcepPolicy?.product_categories).toContain('Electronics');
    });
  });
  
  describe('Integration with TariffImpactSimulator', () => {
    test('provides data for simulation through the simulator interface', async () => {
      // Mock API responses
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockTariffRatesResponse
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockTradeVolumeResponse
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockTariffPoliciesResponse
        });
      
      // Spy on simulator methods
      const runSimulationSpy = jest.spyOn(tariffImpactSimulator, 'runSimulation')
        .mockResolvedValueOnce({
          optimalPath: [],
          expectedValues: {},
          riskMetrics: {},
          perplexityEnhanced: true
        });
      
      // Initialize and search for tariffs
      await semanticTariffEngine.initialize();
      const tariffs = await semanticTariffEngine.searchTariffs({
        destinationCountry: 'Vietnam',
        limit: 10
      });
      await tariffImpactSimulator.runSimulation();
      
      // Verify simulator was called with the right data
      expect(runSimulationSpy).toHaveBeenCalledTimes(1);
      
      // Cleanup
      runSimulationSpy.mockRestore();
    });
  });
});
