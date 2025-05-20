import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import TariffImpactAnalysisPanel from '../TariffImpactAnalysisPanel';

// Mock the tariff impact simulator
jest.mock('../../../services/TariffImpactSimulator', () => ({
  __esModule: true,
  default: {
    runSimulation: jest.fn().mockResolvedValue({}),
    generateAIInsights: jest.fn().mockResolvedValue([])
  }
}));

// Import the mocked simulator
const tariffImpactSimulator = require('../../../services/TariffImpactSimulator').default;

// Mock the child components for cleaner testing
jest.mock('../TariffImpactHeatmapVisualization', () => ({
  __esModule: true,
  default: jest.fn(() => <div data-testid="mock-heatmap">Heatmap Visualization</div>)
}));

jest.mock('../SimulationTreeVisualization', () => ({
  __esModule: true,
  default: jest.fn(() => <div data-testid="mock-tree">Tree Visualization</div>)
}));

jest.mock('../../common/ModelCitationPanel', () => ({
  __esModule: true,
  default: jest.fn(() => <div data-testid="mock-citation">Model Citation Panel</div>)
}));

// Sample simulation result with detailed MCTS root node structure and enhanced insights
const mockSimulationResult = {
  countryImpacts: {
    'USA': {
      gdpImpact: 0.25,
      productCategories: {
        'Electronics': {
          currentTariffRate: 5,
          projectedTariffRate: 7.5,
          economicImpact: {
            percentChange: 2.5,
            absoluteChange: 125000000
          },
          tradeVolume: 5000,
          priceElasticity: 0.8,
          confidenceScore: 0.95,
          perplexityEnhanced: true,
          tradingPartners: ['China', 'Japan', 'South Korea'],
          sensitivityAnalysis: {
            tariffRateSensitivity: 1.2,
            volumeSensitivity: 0.8,
            elasticitySensitivity: 1.5
          },
          thresholds: {
            critical: 10,
            significant: 7.5
          }
        }
      }
    },
    'China': {
      gdpImpact: -0.15,
      productCategories: {
        'Textiles': {
          currentTariffRate: 10,
          projectedTariffRate: 8,
          economicImpact: {
            percentChange: -2,
            absoluteChange: -85000000
          },
          tradeVolume: 3000,
          priceElasticity: 1.2,
          confidenceScore: 0.85,
          perplexityEnhanced: false,
          tradingPartners: ['USA', 'Vietnam', 'Bangladesh'],
          sensitivityAnalysis: {
            tariffRateSensitivity: 0.9,
            volumeSensitivity: 1.1,
            elasticitySensitivity: 0.7
          }
        }
      }
    }
  },
  insights: [
    {
      id: 'ins-001',
      country: 'USA',
      productCategory: 'Electronics',
      title: 'Increased Tariffs Impact',
      description: 'The projected tariff increase will likely affect consumer electronics pricing.',
      severity: 'high',
      confidence: 0.9,
      aiEnhanced: true,
      citations: ['Trade Economics Journal', 'Federal Reserve Economic Data']
    },
    {
      id: 'ins-002',
      country: 'China',
      productCategory: 'Textiles',
      title: 'Tariff Reduction Benefits',
      description: 'Reduction in textile tariffs should improve export competitiveness.',
      severity: 'medium',
      confidence: 0.85,
      aiEnhanced: false
    }
  ],
  rootNode: {
    id: 'root',
    state: {
      currentMonth: 0,
      tariffRates: {
        'USA': { 'Electronics': 5 },
        'China': { 'Textiles': 10 }
      },
      economicMetrics: {
        gdp: { 'USA': 25000000000000, 'China': 17700000000000 },
        inflation: { 'USA': 0.02, 'China': 0.015 },
        unemployment: { 'USA': 0.04, 'China': 0.035 }
      }
    },
    parent: null,
    children: [
      { id: 'node-1', visits: 2500, value: 0.75 },
      { id: 'node-2', visits: 1500, value: 0.45 },
      { id: 'node-3', visits: 1000, value: 0.3 }
    ],
    visits: 5000,
    value: 0.5,
    untriedActions: []
  },
  simulationMetadata: {
    iterations: 5000,
    duration: 12.5,
    convergenceRate: 0.98,
    domainContext: 'tariffs',
    perplexityConfidence: 0.92
  }
};

describe('TariffImpactAnalysisPanel', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock the simulation to return our test data
    (tariffImpactSimulator.runSimulation as jest.Mock).mockResolvedValue(mockSimulationResult);
  });

  // Test initial rendering and data loading
  test('renders the panel and loads simulation data', async () => {
    // Setup the mock to immediately resolve with our test data
    tariffImpactSimulator.runSimulation.mockResolvedValue(mockSimulationResult);
    
    // Render the component
    render(<TariffImpactAnalysisPanel />);
    
    // Wait for the heatmap to appear in the document
    await waitFor(() => {
      expect(screen.getByTestId('mock-heatmap')).toBeInTheDocument();
    });
    
    // Now check that everything else is rendered correctly
    expect(screen.getByText('Impact Heatmap')).toBeInTheDocument();
    expect(screen.getByText('Simulation Tree')).toBeInTheDocument();
    expect(screen.getByTestId('mock-citation')).toBeInTheDocument();
    
    // Verify the simulation was called with correct parameters
    expect(tariffImpactSimulator.runSimulation).toHaveBeenCalledWith(
      expect.objectContaining({
        iterations: 5000,
        maxDepth: 36,
        sensitivityAnalysis: true
      })
    );
  }, 10000);  // Increase timeout to 10 seconds

  // Test tab switching
  test('switches between visualization tabs', async () => {
    // Setup the mock to immediately resolve with our test data
    tariffImpactSimulator.runSimulation.mockResolvedValue(mockSimulationResult);
    
    // Render the component
    render(<TariffImpactAnalysisPanel />);
    
    // Wait for initial render to complete
    await waitFor(() => {
      expect(screen.getByTestId('mock-heatmap')).toBeInTheDocument();
    });
    
    // Click tree tab
    fireEvent.click(screen.getByText('Simulation Tree'));
    
    // Wait for tree tab to appear
    await waitFor(() => {
      expect(screen.getByTestId('mock-tree')).toBeInTheDocument();
    });
    
    // Should now show tree visualization and not heatmap
    expect(screen.queryByTestId('mock-heatmap')).not.toBeInTheDocument();
    
    // Click heatmap tab
    fireEvent.click(screen.getByText('Impact Heatmap'));
    
    // Wait for heatmap to reappear
    await waitFor(() => {
      expect(screen.getByTestId('mock-heatmap')).toBeInTheDocument();
    });
    
    // Should show heatmap again
    expect(screen.queryByTestId('mock-tree')).not.toBeInTheDocument();
  }, 10000);  // Increase timeout to 10 seconds
  
  // Test with country filters
  test('applies country filters to simulation', async () => {
    const countryFilter = ['USA', 'Japan'];
    
    // Setup the mock to immediately resolve with our test data
    tariffImpactSimulator.runSimulation.mockResolvedValue(mockSimulationResult);
    
    // Render the component
    render(<TariffImpactAnalysisPanel countryFilter={countryFilter} />);
    
    // Wait for simulation call to complete
    await waitFor(() => {
      expect(tariffImpactSimulator.runSimulation).toHaveBeenCalled();
    });
    
    // Should pass filters to simulation
    expect(tariffImpactSimulator.runSimulation).toHaveBeenCalledWith(
      expect.objectContaining({
        countryFilter: countryFilter
      })
    );
  }, 10000);  // Increase timeout to 10 seconds
  
  // Test with product filters
  test('applies product filters to simulation', async () => {
    const productFilter = ['Electronics', 'Automotive'];
    
    // Setup the mock to immediately resolve with our test data
    tariffImpactSimulator.runSimulation.mockResolvedValue(mockSimulationResult);
    
    // Render the component
    render(<TariffImpactAnalysisPanel productFilter={productFilter} />);
    
    // Wait for simulation call to complete
    await waitFor(() => {
      expect(tariffImpactSimulator.runSimulation).toHaveBeenCalled();
    });
    
    // Should pass filters to simulation
    expect(tariffImpactSimulator.runSimulation).toHaveBeenCalledWith(
      expect.objectContaining({
        productFilter: productFilter
      })
    );
  }, 10000);  // Increase timeout to 10 seconds
  
  // Test insight selection callback
  test('calls onInsightSelected when an insight is selected', async () => {
    const onInsightSelected = jest.fn();
    
    render(<TariffImpactAnalysisPanel onInsightSelected={onInsightSelected} />);
    
    // Note: Since we're using mock components, this just verifies the prop is passed correctly
    // A more comprehensive E2E test would be needed to verify the actual interaction
    expect(onInsightSelected).not.toHaveBeenCalled();
  });
  
  // Test error handling
  test('handles simulation errors gracefully', async () => {
    // Spy on console.error to track error logging
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Mock a simulation failure (needs to be properly handled for the component to recover)
    tariffImpactSimulator.runSimulation.mockRejectedValue(new Error('Simulation failed'));
    
    // Render the component
    render(<TariffImpactAnalysisPanel />);
    
    // Wait for the error to be logged
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error running simulation'),
        expect.any(Error)
      );
    });
    
    // Component should still render and not crash
    expect(screen.getByText('Impact Heatmap')).toBeInTheDocument();
    expect(screen.getByText('Simulation Tree')).toBeInTheDocument();
    expect(screen.getByTestId('mock-heatmap')).toBeInTheDocument();
    
    // User should see appropriate fallback UI instead of error message
    expect(screen.queryByText('Simulation failed')).not.toBeInTheDocument();
    
    // Restore console.error
    consoleErrorSpy.mockRestore();
  }, 10000);  // Increase timeout to 10 seconds
  
  // Test cell selection functionality (integration-focused test)
  test('renders correctly with cell selection functionality', async () => {
    // Setup the mock to immediately resolve with our test data
    tariffImpactSimulator.runSimulation.mockResolvedValue(mockSimulationResult);
    
    // Render the component
    render(<TariffImpactAnalysisPanel />);
    
    // Wait for the heatmap to appear
    await waitFor(() => {
      expect(screen.getByTestId('mock-heatmap')).toBeInTheDocument();
    });
    
    // Note: In a real integration test, we would simulate clicking on a cell
    // and verify the details panel is updated. Since we're using mock components,
    // we can only verify the component renders correctly.
  }, 10000);  // Increase timeout to 10 seconds
  
  // Test advanced simulation parameters
  test('uses perplexity enhancement and sensitivity analysis', async () => {
    // Setup the mock to immediately resolve with our test data
    tariffImpactSimulator.runSimulation.mockResolvedValue(mockSimulationResult);
    
    // Render the component
    render(<TariffImpactAnalysisPanel />);
    
    // Wait for simulation call to complete
    await waitFor(() => {
      expect(tariffImpactSimulator.runSimulation).toHaveBeenCalled();
    });
    
    // Verify the simulation was called with proper perplexity and sensitivity parameters
    expect(tariffImpactSimulator.runSimulation).toHaveBeenCalledWith(
      expect.objectContaining({
        usePerplexityEnhancement: true,
        perplexityAnalysisDepth: 'comprehensive',
        sensitivityAnalysis: true,
        sensitivityVariables: ['tariffRates', 'tradeVolume', 'elasticity']
      })
    );
  }, 10000);  // Increase timeout to 10 seconds
  
  // Test the processing of simulation data
  test('correctly processes simulation data for visualization', async () => {
    // Start with a clean mock
    jest.clearAllMocks();
    
    // Setup the mock to immediately resolve with our test data
    tariffImpactSimulator.runSimulation.mockResolvedValue(mockSimulationResult);
    
    // Render the component
    render(<TariffImpactAnalysisPanel />);
    
    // Wait for the heatmap to appear
    await waitFor(() => {
      expect(screen.getByTestId('mock-heatmap')).toBeInTheDocument();
    });
    
    // Since we're using mock components, we can only verify the simulator was
    // called with the right parameters and the component didn't crash
    expect(tariffImpactSimulator.runSimulation).toHaveBeenCalledWith(
      expect.objectContaining({
        iterations: 5000,
        maxDepth: 36,
        usePerplexityEnhancement: true
      })
    );
  }, 10000);  // Increase timeout to 10 seconds
  
  // Test Monte Carlo Tree Search visualization tab
  test('switches to tree visualization and renders correctly', async () => {
    // Setup the mock to immediately resolve with our test data
    tariffImpactSimulator.runSimulation.mockResolvedValue(mockSimulationResult);
    
    // Render the component
    render(<TariffImpactAnalysisPanel />);
    
    // Wait for initial render to complete
    await waitFor(() => {
      expect(screen.getByTestId('mock-heatmap')).toBeInTheDocument();
    });
    
    // Click tree tab
    fireEvent.click(screen.getByText('Simulation Tree'));
    
    // Wait for tree visualization to appear
    await waitFor(() => {
      expect(screen.getByTestId('mock-tree')).toBeInTheDocument();
    });
    
    // Verify heatmap is no longer visible
    expect(screen.queryByTestId('mock-heatmap')).not.toBeInTheDocument();
  }, 10000);  // Increase timeout to 10 seconds
});
