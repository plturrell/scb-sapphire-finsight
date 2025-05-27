/**
 * Financial Types
 * Clean, purposeful interfaces for financial data and operations.
 * Each type has a single, clear responsibility.
 */

import { Entity, ID, Currency, Percentage, Timestamp, DataPoint, Metric, Statistics, Range } from './core';

// === FINANCIAL ENTITIES ===

export interface Portfolio extends Entity {
  name: string;
  totalValue: Currency;
  allocation: Allocation[];
  performance: Performance;
}

export interface Allocation {
  name: string;
  value: Currency;
  percentage: Percentage;
  color: string;
}

export interface Performance {
  totalReturn: Percentage;
  timeWeightedReturn: Percentage;
  volatility: Percentage;
  sharpeRatio: number;
  maxDrawdown: Percentage;
}

// === SECTORS & MARKETS ===

export interface Sector {
  name: string;
  allocation: Percentage;
  performance: Performance;
  metrics: SectorMetrics;
}

export interface SectorMetrics {
  revenue: Currency;
  accounts: number;
  assets: Currency;
  deposits: Currency;
  yield: Percentage;
}

export interface Market {
  region: string;
  currency: string;
  exchangeRate: number;
  volatility: Percentage;
}

// === RISK ANALYSIS ===

export interface RiskProfile {
  level: 'conservative' | 'moderate' | 'aggressive';
  tolerance: Percentage;
  capacity: Currency;
  timeline: 'short' | 'medium' | 'long';
}

export interface RiskMetrics {
  var: Currency; // Value at Risk
  expectedShortfall: Currency;
  beta: number;
  correlation: number;
  trackingError: Percentage;
}

// === SIMULATION ===

export interface SimulationConfig {
  iterations: number;
  timeHorizon: number; // years
  confidenceLevel: Percentage;
  scenarios: ScenarioWeights;
}

export interface ScenarioWeights {
  optimistic: Percentage;
  base: Percentage;
  pessimistic: Percentage;
}

export interface SimulationResult {
  expectedReturn: Currency;
  confidence: Range<Currency>;
  scenarios: {
    optimistic: Currency;
    base: Currency;
    pessimistic: Currency;
  };
  statistics: Statistics;
  paths: DataPoint[][];
}

// === DASHBOARDS ===

export interface Dashboard {
  name: string;
  metrics: Metric[];
  charts: Chart[];
  lastUpdated: Timestamp;
}

export interface Chart {
  type: 'line' | 'bar' | 'pie' | 'sankey';
  title: string;
  data: DataPoint[];
  config: ChartConfig;
}

export interface ChartConfig {
  colors: string[];
  animation: boolean;
  responsive: boolean;
  legend: boolean;
}

// === FLOW VISUALIZATION ===

export interface FlowNode {
  id: ID;
  name: string;
  value: Currency;
  category: string;
  level: number;
}

export interface FlowLink {
  source: ID;
  target: ID;
  value: Currency;
  confidence?: number;
}

export interface FlowDiagram {
  nodes: FlowNode[];
  links: FlowLink[];
  totalFlow: Currency;
}