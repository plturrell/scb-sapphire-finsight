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
  id: string;
  name: string;
  group: string;
}

// Link type for Sankey diagrams
export interface SankeyLink {
  source: string;
  target: string;
  value: number;
  type: string;
  uiColor: string;
  aiEnhanced?: boolean;
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
  aiInsights: AIInsights;
}
