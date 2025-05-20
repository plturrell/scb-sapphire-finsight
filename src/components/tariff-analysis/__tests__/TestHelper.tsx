/**
 * TestHelper.tsx
 * Provides test utilities for visualization component tests
 */
import React from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';

// Create a simple test theme that matches SAP Fiori Horizon principles
const testTheme = createTheme({
  palette: {
    mode: 'light',
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
    },
    info: {
      main: '#0a6ed1', // SAP Fiori Light Blue
    }
  },
  typography: {
    fontFamily: '"72", "72-Regular", "72-Light", Arial, Helvetica, sans-serif',
  },
  shape: {
    borderRadius: 4,
  },
});

// Test wrapper for consistent theme provider in tests
export const TestWrapper: React.FC<{children: React.ReactNode}> = ({ children }) => {
  return (
    <ThemeProvider theme={testTheme}>
      {children}
    </ThemeProvider>
  );
};

// Simulate Perplexity AI API for tests
export class TestPerplexityAPI {
  static enhanceData(data: any) {
    return {
      ...data,
      aiEnhanced: true,
      confidence: 0.92,
    };
  }
  
  static generateInsights(data: any) {
    return [
      {
        title: "Test Insight",
        description: "This is a test insight generated for unit tests",
        importance: "high" as const,
        confidence: 0.9
      }
    ];
  }
}

// D3 visualization test helpers
export const mockD3Event = {
  clientX: 100,
  clientY: 100,
  target: {
    getBoundingClientRect: () => ({
      left: 50,
      top: 50,
      width: 100,
      height: 100
    })
  }
};

// Mock response data for tariff impact tests
export const tariffTestData = {
  countryImpacts: {
    "USA": {
      gdpImpact: 0.25,
      productCategories: {
        "Electronics": {
          currentTariffRate: 5,
          projectedTariffRate: 7.5,
          economicImpact: {
            percentChange: 2.5
          },
          tradeVolume: 5000,
          confidenceScore: 0.95
        }
      }
    }
  },
  sensitivityAnalysis: {
    tariffRates: {
      variable: "tariffRates",
      variations: [
        { value: 0.8, outcome: -0.15 },
        { value: 1.0, outcome: 0 },
        { value: 1.2, outcome: 0.25 }
      ]
    }
  }
};
