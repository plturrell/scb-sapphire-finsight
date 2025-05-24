/**
 * Simulation Types
 * Elegant interfaces for Monte Carlo simulations and financial modeling.
 * Sophisticated mathematics presented with absolute clarity.
 */

import { Entity, ID, Timestamp, Currency, Percentage, Confidence, Statistics, Range } from './core';

// === SIMULATION FRAMEWORK ===

export interface Simulation extends Entity {
  name: string;
  description: string;
  type: 'monte_carlo' | 'stress_test' | 'scenario' | 'optimization';
  status: 'draft' | 'running' | 'completed' | 'failed';
  config: SimulationConfig;
  results?: SimulationResults;
  progress: SimulationProgress;
}

export interface SimulationConfig {
  iterations: number;
  timeHorizon: number; // periods
  confidenceLevel: Percentage;
  randomSeed?: number;
  precision: 'low' | 'medium' | 'high';
  parallelization: boolean;
}

export interface SimulationProgress {
  current: number;
  total: number;
  percentage: Percentage;
  startTime: Timestamp;
  estimatedCompletion?: Timestamp;
  stage: 'initializing' | 'running' | 'analyzing' | 'finalizing';
}

// === PARAMETERS ===

export interface Parameter extends Entity {
  name: string;
  description: string;
  type: 'numeric' | 'currency' | 'percentage' | 'boolean' | 'categorical';
  value: ParameterValue;
  distribution: Distribution;
  constraints: ParameterConstraints;
  sensitivity: Confidence;
}

export type ParameterValue = number | string | boolean;

export interface ParameterConstraints {
  min?: number;
  max?: number;
  step?: number;
  required: boolean;
  dependencies?: ID[];
}

export interface Distribution {
  type: 'normal' | 'uniform' | 'lognormal' | 'triangular' | 'beta' | 'constant';
  parameters: DistributionParameters;
}

export interface DistributionParameters {
  mean?: number;
  stddev?: number;
  min?: number;
  max?: number;
  mode?: number;
  alpha?: number;
  beta?: number;
}

// === SCENARIOS ===

export interface Scenario {
  name: string;
  description: string;
  probability: Confidence;
  parameters: ParameterOverride[];
  impact: ScenarioImpact;
}

export interface ParameterOverride {
  parameterId: ID;
  value: ParameterValue;
  reason: string;
}

export interface ScenarioImpact {
  description: string;
  magnitude: 'minimal' | 'moderate' | 'significant' | 'severe';
  timeframe: 'immediate' | 'short_term' | 'long_term';
  sectors: string[];
}

// === RESULTS ===

export interface SimulationResults {
  summary: ResultSummary;
  statistics: Statistics;
  percentiles: PercentileData[];
  scenarios: ScenarioResults;
  sensitivity: SensitivityAnalysis;
  distribution: DistributionData;
  convergence: ConvergenceData;
}

export interface ResultSummary {
  expectedValue: Currency;
  confidence: Range<Currency>;
  riskMetrics: RiskMetrics;
  interpretation: string;
  keyInsights: string[];
}

export interface RiskMetrics {
  valueAtRisk: Currency; // VaR at confidence level
  expectedShortfall: Currency; // CVaR
  maxDrawdown: Currency;
  volatility: Percentage;
  probabilityOfLoss: Confidence;
}

export interface PercentileData {
  percentile: Percentage;
  value: Currency;
}

export interface ScenarioResults {
  optimistic: ScenarioOutcome;
  baseline: ScenarioOutcome;
  pessimistic: ScenarioOutcome;
}

export interface ScenarioOutcome {
  probability: Confidence;
  value: Currency;
  range: Range<Currency>;
  description: string;
}

export interface SensitivityAnalysis {
  parameters: ParameterSensitivity[];
  interactions: ParameterInteraction[];
  criticalFactors: CriticalFactor[];
}

export interface ParameterSensitivity {
  parameterId: ID;
  correlation: number; // -1 to 1
  elasticity: number;
  rank: number;
}

export interface ParameterInteraction {
  parameters: [ID, ID];
  correlation: number;
  impact: 'synergistic' | 'antagonistic' | 'independent';
}

export interface CriticalFactor {
  parameterId: ID;
  threshold: number;
  impact: Currency;
  probability: Confidence;
}

export interface DistributionData {
  bins: DistributionBin[];
  fitTest: GoodnessOfFit;
  moments: DistributionMoments;
}

export interface DistributionBin {
  lower: number;
  upper: number;
  frequency: number;
  cumulative: Percentage;
}

export interface GoodnessOfFit {
  distributionType: string;
  pValue: number;
  chiSquare: number;
  ksStatistic: number;
  isGoodFit: boolean;
}

export interface DistributionMoments {
  mean: number;
  variance: number;
  skewness: number;
  kurtosis: number;
}

export interface ConvergenceData {
  iteration: number[];
  runningMean: number[];
  convergenceTest: ConvergenceTest;
}

export interface ConvergenceTest {
  isConverged: boolean;
  tolerance: number;
  stabilizationPoint: number;
  confidence: Confidence;
}

// === COMPARISON & ANALYSIS ===

export interface SimulationComparison extends Entity {
  name: string;
  simulations: ID[];
  analysis: ComparisonAnalysis;
  visualization: ComparisonVisualization;
}

export interface ComparisonAnalysis {
  summary: string;
  differences: SimulationDifference[];
  recommendations: string[];
  confidence: Confidence;
}

export interface SimulationDifference {
  metric: string;
  simulation1: number;
  simulation2: number;
  difference: number;
  significance: 'low' | 'medium' | 'high';
}

export interface ComparisonVisualization {
  type: 'overlay' | 'difference' | 'tornado' | 'matrix';
  config: Record<string, unknown>;
  data: Record<string, unknown>;
}

// === OPTIMIZATION ===

export interface Optimization extends Entity {
  objective: 'maximize' | 'minimize';
  target: string;
  constraints: OptimizationConstraint[];
  method: 'genetic' | 'gradient' | 'grid_search' | 'bayesian';
  solution?: OptimizationSolution;
}

export interface OptimizationConstraint {
  parameterId: ID;
  type: 'equality' | 'inequality';
  value: number;
  tolerance: number;
}

export interface OptimizationSolution {
  parameters: ParameterValue[];
  objectiveValue: number;
  iterations: number;
  convergence: boolean;
  confidence: Confidence;
}