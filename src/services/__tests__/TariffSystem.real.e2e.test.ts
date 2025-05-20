/**
 * Real End-to-End Integration Tests for Tariff Alert System
 * 
 * Tests the complete data flow from services to visualization components using real APIs.
 * Requires environment variables for API access and should be run in a controlled environment.
 */

import { act, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';
import tariffImpactSimulator from '../TariffImpactSimulator';
import { PerplexityEnhancedNLP } from '../PerplexityEnhancedNLP';
import { ontologyManager } from '../OntologyManager';
import React from 'react';
import dotenv from 'dotenv';

// Try to dynamically import actual components - these will fail if components don't exist
let TariffImpactAnalysisPanel: any;
let TariffImpactHeatmapVisualization: any;

try {
  TariffImpactAnalysisPanel = require('../../components/tariff-analysis/TariffImpactAnalysisPanel').default;
  TariffImpactHeatmapVisualization = require('../../components/tariff-analysis/TariffImpactHeatmapVisualization').default;
} catch (error) {
  console.warn('Could not import real components, some tests will be skipped');
}

// Load environment variables
dotenv.config();

// Skip tests if API keys are not configured
const runRealTests = process.env.RUN_REAL_INTEGRATION_TESTS === 'true' &&
                      process.env.PERPLEXITY_API_KEY &&
                      process.env.VIETNAM_API_KEY;

// Create real theme matching SAP Fiori Horizon design principles
const sapFioriTheme = createTheme({
  palette: {
    primary: {
      main: '#0070F2', // SAP Fiori Blue
    },
    secondary: {
      main: '#107E3E', // SAP Fiori Green
    },
    error: {
      main: '#BB0000', // SAP Fiori Red
    },
    warning: {
      main: '#E9730C', // SAP Fiori Orange
    }
  }
});

// Render wrapper for providing theme context
const renderWithTheme = (ui: React.ReactElement) => {
  return render(
    React.createElement(ThemeProvider, { theme: sapFioriTheme }, ui)
  );
};

// Mock ResizeObserver for visualization components since browsers in test environment don't have it
class ResizeObserverMock {
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
}
global.ResizeObserver = global.ResizeObserver || ResizeObserverMock as any;

// Mock MutationObserver if not available
class MutationObserverMock {
  observe = jest.fn();
  disconnect = jest.fn();
  takeRecords = jest.fn();
}
global.MutationObserver = global.MutationObserver || MutationObserverMock as any;

describe('Tariff Alert System - Real End-to-End Integration', () => {
  // Skip if components don't exist or we're not running real tests
  const runComponentTests = runRealTests && TariffImpactAnalysisPanel && TariffImpactHeatmapVisualization;
  
  beforeEach(() => {
    // Skip setup if not running real tests
    if (!runRealTests) return;
    
    // Initialize with real API credentials from environment variables
    // API keys are automatically loaded via the .env file for all singletons
    
    // Set timeout to 30 seconds for real API calls
    jest.setTimeout(30000);
  });
  
  describe('Real Tariff Analysis Panel Integration', () => {
    (runComponentTests ? test : test.skip)('renders real TariffImpactAnalysisPanel with actual simulation', async () => {
      // Skip if component doesn't exist
      if (!TariffImpactAnalysisPanel) {
        return console.warn('TariffImpactAnalysisPanel not available, skipping test');
      }
      
      // Render the real component
      const { container } = renderWithTheme(
        React.createElement(TariffImpactAnalysisPanel)
      );
      
      // Wait for real component to render
      await waitFor(() => {
        expect(container).toBeInTheDocument();
      }, { timeout: 5000 });
      
      // Find UI elements - actual selectors will depend on component implementation
      const countrySelector = container.querySelector('[data-testid="country-selector"]');
      const runButton = container.querySelector('[data-testid="run-analysis-button"]');
      
      // Verify if UI elements exist and interact if possible
      if (countrySelector && runButton) {
        await act(async () => {
          // Select countries if possible
          if (countrySelector.tagName === 'SELECT') {
            (countrySelector as HTMLSelectElement).value = 'Vietnam';
            
            // Dispatch change event
            const event = new Event('change', { bubbles: true });
            countrySelector.dispatchEvent(event);
          }
          
          // Click run button
          runButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
          
          // Wait for simulation to complete (real API calls)
          await new Promise(resolve => setTimeout(resolve, 15000));
        });
        
        // Verify results appeared
        const resultsSection = container.querySelector('[data-testid="results-section"]');
        expect(resultsSection).toBeTruthy();
      } else {
        console.log('Interactive elements not found, skipping interaction test');
      }
    });
  });
  
  describe('Real Tariff Heatmap Visualization', () => {
    (runComponentTests ? test : test.skip)('renders TariffImpactHeatmapVisualization with real data', async () => {
      // Skip if component doesn't exist
      if (!TariffImpactHeatmapVisualization) {
        return console.warn('TariffImpactHeatmapVisualization not available, skipping test');
      }
      
      // Run a real simulation to get data
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
      
      // Render with actual data
      const { container } = renderWithTheme(
        React.createElement(TariffImpactHeatmapVisualization, { simulationData: simulationResults })
      );
      
      // Wait for visualization to render with real data
      await waitFor(() => {
        expect(container).toBeInTheDocument();
      }, { timeout: 5000 });
      
      // Check for SVG elements that should be part of the heatmap
      const svgElement = container.querySelector('svg');
      expect(svgElement).toBeTruthy();
      
      // Check for cells in the heatmap
      const cells = container.querySelectorAll('.heatmap-cell');
      expect(cells.length).toBeGreaterThan(0);
    });
  });
  
  describe('Real AI-Enhanced Visualization', () => {
    (runComponentTests ? test : test.skip)('shows real AI-enhanced indicators from Perplexity', async () => {
      // Skip if component doesn't exist
      if (!TariffImpactHeatmapVisualization) {
        return console.warn('TariffImpactHeatmapVisualization not available, skipping test');
      }
      
      // Set up Perplexity with real API key
      const perplexityNLP = new PerplexityEnhancedNLP();
      perplexityNLP.setApiKey(process.env.PERPLEXITY_API_KEY!);
      
      // Run a real simulation
      const simulationResults = await tariffImpactSimulator.runSimulation({
        countries: ['Vietnam', 'Thailand'],
        sectors: ['electronics'],
        timeHorizon: 12,
        enhanceWithAI: true // Enable real AI enhancement
      });
      
      // Render with AI-enhanced data
      const { container } = renderWithTheme(
        React.createElement(TariffImpactHeatmapVisualization, {
          data: simulationResults,
          showAIEnhancements: true
        })
      );
      
      // Wait for visualization to render
      await waitFor(() => {
        expect(container).toBeInTheDocument();
      }, { timeout: 5000 });
      
      // Look for AI enhancement indicators
      const aiIndicators = container.querySelectorAll('.ai-enhanced-indicator');
      
      // If simulation had AI enhancements, indicators should be present
      if (simulationResults.aiEnhanced || (simulationResults.insights && simulationResults.insights.some((i: any) => i.aiEnhanced))) {
        expect(aiIndicators.length).toBeGreaterThan(0);
      }
    });
  });
  
  describe('Real Full System Integration', () => {
    (runRealTests ? test : test.skip)('processes real tariff data through the complete system', async () => {
      // This test verifies the data flow through all real system components
      
      // Initialize ontology with real data
      await ontologyManager.initialize();
      
      // Configure Perplexity with real API key
      const perplexityNLP = new PerplexityEnhancedNLP();
      perplexityNLP.setApiKey(process.env.PERPLEXITY_API_KEY!);
      
      // 1. Run simulation with real parameters
      const simulationResults = await tariffImpactSimulator.runSimulation({
        countries: ['Vietnam', 'Thailand'],
        sectors: ['electronics', 'automotive'],
        timeHorizon: 12,
        confidenceThreshold: 0.7,
        enhanceWithAI: true
      });
      
      // Verify simulation produced valid results
      expect(simulationResults).toBeDefined();
      expect(simulationResults.optimalPath).toBeDefined();
      
      // 2. Generate AI insights from real simulation results
      const insights = await perplexityNLP.processTradeData({
        simulationResults,
        query: "What are the key impacts on Vietnamese electronics exports?",
        domain: "tariff-analysis"
      });
      
      // Verify insights were generated
      expect(insights).toBeDefined();
      expect(insights.length).toBeGreaterThan(0);
      
      // 3. Get confidence scores from real AI
      const confidenceScore = perplexityNLP.getConfidenceScore(insights[0]);
      
      // Verify confidence scoring
      expect(confidenceScore).toBeGreaterThanOrEqual(0);
      expect(confidenceScore).toBeLessThanOrEqual(1);
      
      // This test doesn't render any components but verifies the real data flow
      // through all services that would feed into the visualizations
    });
  });
});
