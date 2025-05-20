/**
 * Type definitions for SCB Sapphire FinSight application
 * Includes specifications for tariff alerts, simulation data, and Vietnam-specific extensions
 */

// Tariff Alert definition with support for Vietnam-specific fields
export interface TariffAlert {
  id?: string;
  title: string;
  description: string;
  country: string;
  impactSeverity: number; // 1-10 scale
  confidence: number; // 0-1 scale
  sourceUrl: string;
  sourceName: string;
  publishDate: Date;
  createdAt: Date;
  priority: 'Critical' | 'high' | 'medium' | 'low';
  tariffRate?: number;
  productCategories?: string[];
  aiEnhanced?: boolean;
  // Vietnam-specific fields
  affectedProvinces?: string[];
  tradingPartners?: string[];
}

// Simulation Types
export interface SimulationConfig {
  country?: string;
  timeHorizon: number; // months
  iterations: number;
  confidenceRequired?: number;
  tariffRate?: number;
  productCategories?: string[];
  scenarios?: string[];
  riskTolerance?: 'low' | 'moderate' | 'high';
  aseanCountries?: string[];
  tradeCategories?: string[];
  confidenceLevel?: number;
}

// Vietnam-specific types
export interface VietnamProvinceData {
  id: string;
  name: string;
  netImpact: number;
  exportVolume: number;
  importVolume: number;
}

export interface VietnamTradeCorridorData {
  from: string;
  to: string;
  volume: number;
  tariffImpact: number;
}

export interface VietnamTradeSectorData {
  name: string;
  exportVolume: number;
  importVolume: number;
  tariffTrend: 'increasing' | 'decreasing' | 'stable' | 'mixed';
  partners: string[];
  keyProducts: string[];
}

// Node type for Sankey diagrams
export interface SankeyNode {
  id?: string;
  name: string;
  group?: string;
  category?: string;
  value?: number;
  predictedValue?: number;
  confidence?: number;
  x0?: number;
  x1?: number;
  y0?: number;
  y1?: number;
  index?: number;
}

// Link type for Sankey diagrams
export interface SankeyLink {
  source: number | SankeyNode;
  target: number | SankeyNode;
  value: number;
  type?: string;
  uiColor?: string;
  aiEnhanced?: boolean;
  originalValue?: number; // Original value before AI enhancement
  uid?: string; // Unique identifier for links
}

// AI Insights type
export interface AIInsights {
  summary: string;
  recommendations: string[];
  confidence: number;
  updatedAt: Date;
}

// Complete Sankey data structure
export interface SankeyData {
  nodes: SankeyNode[];
  links: SankeyLink[];
  aiInsights?: AIInsights;
}

// Simulation Result
export interface SimulationResult {
  optimalPath: {
    allocations: Record<string, number>;
    recommendations: string[];
  };
  expectedValue: {
    totalReturn: number;
    byCountry: Record<string, number>;
  };
  riskMetrics: {
    volatility: number;
    confidenceLowerBound: number;
    confidenceUpperBound: number;
    maxDrawdown: number;
    recessionImpact: number;
  };
  flowData: SankeyData;
}
