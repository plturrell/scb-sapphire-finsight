/**
 * Monte Carlo Simulation Types
 * Comprehensive type definitions for the Vietnam Tariff Monte Carlo simulation
 * Based on the enhanced technical specification integrating with SAP Business Data Cloud
 */

// Common Types
export type UUID = string;
export type Timestamp = number;
export type SimulationType = 'Vietnam_Tariff' | 'General_Financial';
export type DistributionType = 'Normal' | 'Uniform' | 'Log-Normal' | 'Triangle';
export type ParameterType = 'Numeric' | 'Currency' | 'Percentage' | 'Date' | 'Enum';
export type SimulationStatus = 'idle' | 'running' | 'completed' | 'failed';
export type AnalysisDepth = 'basic' | 'detailed' | 'comprehensive';
export type ReportFormat = 'html' | 'pdf' | 'excel' | 'word';
export type ConfidenceLevel = number; // 0-1
export type RiskLevel = 'low' | 'medium' | 'high';

// Parameter Definition
export interface SimulationParameter {
  id: string;
  name: string;
  value: any;
  minValue?: number | string;
  maxValue?: number | string;
  distributionType: DistributionType;
  parameterType: ParameterType;
  unit?: string;
  description?: string;
  constraints?: {
    min?: number;
    max?: number;
    step?: number;
    options?: string[] | number[];
  };
  // Aliases to support other components using different property names
  min?: number | string;
  max?: number | string;
  distribution?: DistributionType; // Alias for distributionType
}

// Tariff-specific Parameters
export interface TariffParameters {
  hsCodes: string[];
  countries: string[];
  tradeAgreements: string[];
  exchangeRates: {
    fromCurrency: string;
    toCurrency: string;
    rate: number;
    minRate?: number;
    maxRate?: number;
  }[];
}

// Simulation Configuration
export interface SimulationConfig {
  iterations: number;
  confidenceInterval: number;
  scenarioThresholds: {
    pessimistic: number;
    realistic: number;
    optimistic: number;
  };
  precision?: 'Preview' | 'Medium' | 'High';
}

// Simulation Input Repository
export interface SimulationInput {
  id: UUID;
  name: string;
  description?: string;
  createdBy: string;
  createdAt: Timestamp;
  simulationType: SimulationType;
  parameters: {
    generalParameters: SimulationParameter[];
    tariffSpecificParameters: TariffParameters;
  };
  simulationConfig: SimulationConfig;
}

// Basic Statistics
export interface StatisticsSummary {
  mean: number;
  median: number;
  min: number;
  max: number;
  standardDeviation: number;
  variance: number;
}

// Percentile Data
export interface PercentileData {
  percentile: number;
  value: number;
}

// Scenario Results
export interface ScenarioResult {
  probability: number;
  meanValue: number;
  rangeMin: number;
  rangeMax: number;
}

// Sensitivity Analysis Results
export interface SensitivityResult {
  parameter: string;
  correlation: number;
  impact: number;
  mitigation?: string;
}

// Distribution Bin
export interface DistributionBin {
  bin: number;
  frequency: number;
  cumulative: number;
}

// LLM Analysis
export interface LlmAnalysis {
  insights: string[];
  recommendations: string[];
  riskFactors: {
    factor: string;
    severity: number;
    mitigation: string;
  }[];
  riskAssessment?: {
    text: string;
    riskLevel: RiskLevel;
    probabilityOfNegativeImpact: number;
  };
}

// Simulation Results
export interface SimulationResults {
  summary: StatisticsSummary;
  percentiles: PercentileData[];
  scenarios: {
    pessimistic: ScenarioResult;
    realistic: ScenarioResult;
    optimistic: ScenarioResult;
  };
  sensitivityAnalysis: SensitivityResult[];
  distributionData: DistributionBin[];
  rawResults?: number[]; // The actual simulation output values
}

// Simulation Output Repository
export interface SimulationOutput {
  id: UUID;
  inputId: UUID; // Reference to SimulationInput
  status: SimulationStatus;
  startTime: Timestamp;
  endTime?: Timestamp;
  progressPercentage: number;
  results?: SimulationResults;
  llmAnalysis?: LlmAnalysis;
  computeTimeMs?: number;
  iteration?: number;
  error?: string;
}

// Parameter History Store
export interface ParameterHistory {
  id: UUID;
  parameterId: string;
  simulationInputId: UUID;
  timestamp: Timestamp;
  previousValue: any;
  newValue: any;
  changedBy: string;
}

// Difference Matrix Record
export interface DifferenceRecord {
  sim1Id: UUID;
  sim2Id: UUID;
  percentageDifference: number;
  absoluteDifference: number;
}

// Simulation Comparison
export interface SimulationComparison {
  id: UUID;
  name: string;
  description?: string;
  createdAt: Timestamp;
  simulationIds: UUID[];
  comparisonResults: {
    differenceMatrix: {
      parameter: string;
      differences: DifferenceRecord[];
    }[];
    outcomeComparison: {
      meanDifferences: DifferenceRecord[];
      riskProfileDifferences: {
        sim1Id: UUID;
        sim2Id: UUID;
        pessimisticDifference: number;
        realisticDifference: number;
        optimisticDifference: number;
      }[];
    };
  };
  llmAnalysis?: LlmAnalysis;
}

// GROK 3 API Types
export interface Grok3AnalysisRequest {
  simulation_data: {
    input_parameters: Record<string, any>;
    output_metrics: Record<string, any>;
    distribution_data: any[];
  };
  analysis_context: {
    simulation_type: string;
    business_context: string;
    prior_simulations: any[];
  };
  analysis_request: {
    insights_depth: AnalysisDepth;
    focus_areas: string[];
    format: 'bullet_points' | 'narrative' | 'structured';
  };
}

export interface Grok3AnalysisResponse {
  insights: string[];
  recommendations: string[];
  risk_factors: {
    factor: string;
    severity: number;
    mitigation: string;
  }[];
  confidence: number;
}

// Nvidia Langchain Types
export interface LangchainReportRequest {
  simulation_data: any;
  report_template: string;
  sections: string[];
  format_options: {
    include_charts: boolean;
    include_tables: boolean;
    include_raw_data: boolean;
    output_format: ReportFormat;
  };
}

export interface LangchainReportResponse {
  report_content: string;
  charts: any[];
  metadata: {
    generated_at: Timestamp;
    version: string;
    confidence: number;
  };
}

// Component Parameter (UI representation)
export interface ComponentParameter {
  id: string;
  name: string;
  value: any;
  min?: any;
  max?: any;
  distribution: DistributionType;
  description?: string;
  unit?: string;
  // Add additional fields to make it compatible with SimulationParameter
  distributionType?: DistributionType; // Alias for distribution
  parameterType?: ParameterType;
  minValue?: any; // Alias for min
  maxValue?: any; // Alias for max
}

// Utility Functions
export const generateUUID = (): UUID => {
  // Simple UUID generation for client-side use
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export const getCurrentTimestamp = (): Timestamp => {
  return Date.now();
};

// Converter function: Component Parameter to Simulation Parameter
export const toSimulationParameter = (componentParam: ComponentParameter): SimulationParameter => {
  return {
    id: componentParam.id,
    name: componentParam.name,
    value: componentParam.value,
    minValue: componentParam.minValue || componentParam.min,
    maxValue: componentParam.maxValue || componentParam.max,
    distributionType: componentParam.distributionType || componentParam.distribution,
    parameterType: componentParam.parameterType || (
      componentParam.unit === '%' ? 'Percentage' :
      componentParam.unit === 'USD' || componentParam.unit === 'VND' ? 'Currency' : 'Numeric'
    ),
    unit: componentParam.unit,
    description: componentParam.description,
    constraints: {
      min: typeof componentParam.min === 'number' ? componentParam.min : undefined,
      max: typeof componentParam.max === 'number' ? componentParam.max : undefined
    },
    // Add aliases for backward compatibility
    min: componentParam.min,
    max: componentParam.max,
    distribution: componentParam.distribution
  };
};

// Converter function: Simulation Parameter to Component Parameter
export const toComponentParameter = (simulationParam: SimulationParameter): ComponentParameter => {
  return {
    id: simulationParam.id,
    name: simulationParam.name,
    value: simulationParam.value,
    min: simulationParam.min || simulationParam.minValue || 
         (typeof simulationParam.constraints?.min === 'number' ? simulationParam.constraints.min : undefined),
    max: simulationParam.max || simulationParam.maxValue || 
         (typeof simulationParam.constraints?.max === 'number' ? simulationParam.constraints.max : undefined),
    distribution: simulationParam.distribution || simulationParam.distributionType,
    description: simulationParam.description,
    unit: simulationParam.unit,
    // Add additional fields for full compatibility
    distributionType: simulationParam.distributionType,
    parameterType: simulationParam.parameterType,
    minValue: simulationParam.minValue,
    maxValue: simulationParam.maxValue
  };
};
