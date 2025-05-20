/**
 * Advanced Tariff Analysis Types
 * Types for enhanced tariff impact simulation, scenario analysis, and competitive intelligence
 */

import { SankeyData } from './index';

/**
 * Type for tariff modifications in what-if scenario simulations
 */
export interface TariffModification {
  countryId: string;
  productCategoryId: string;
  originalRate: number;
  modifiedRate: number;
  effectiveDate: string;
  description?: string;
  confidence?: number;
}

/**
 * Type for scenario comparison results
 */
export interface ScenarioComparison {
  baseScenarioId: string;
  modifiedScenarioId: string;
  comparativeMetrics: {
    totalTradeImpact: number;
    revenueChange: number;
    marginChange: number;
    supplyChainDisruption: number;
    timeToImplementation: number;
  };
  categoryImpacts: {
    [categoryId: string]: {
      baseValue: number;
      modifiedValue: number;
      percentChange: number;
      confidence: number;
    }
  };
  visualizationData: {
    baseline: SankeyData;
    modified: SankeyData;
    divergencePoints: Array<{
      nodeId: string;
      baselineValue: number;
      modifiedValue: number;
      percentDivergence: number;
    }>;
  };
  recommendations: Array<{
    action: string;
    impact: number;
    confidence: number;
    timeframe: 'immediate' | 'short-term' | 'medium-term' | 'long-term';
    description: string;
  }>;
  riskAssessment: {
    overallRisk: number;
    riskFactors: Array<{
      factor: string;
      severity: number;
      likelihood: number;
      mitigationOptions: string[];
    }>;
  };
}

/**
 * Type for competitive landscape analysis
 */
export interface CompetitiveAnalysis {
  industryId: string;
  industryName: string;
  competitivePositions: Array<{
    companyId: string;
    companyName: string;
    currentMarketShare: number;
    projectedMarketShare: number;
    tariffAdvantage: number;
    priceCompetitiveness: number;
    vulnerabilities: string[];
    strengths: string[];
    changeVector: {
      x: number; // Position change on x-axis
      y: number; // Position change on y-axis
      magnitude: number; // Overall change magnitude
    };
  }>;
  marketDynamics: {
    overallGrowth: number;
    volatility: number;
    barriers: string[];
    opportunities: string[];
  };
  visualizationData: {
    radarPoints: Array<{
      axis: string;
      values: {
        [companyId: string]: number;
      };
    }>;
    timeSeriesData: Array<{
      timestamp: string;
      marketShares: {
        [companyId: string]: number;
      };
    }>;
  };
}

/**
 * Type for supply chain resilience analysis
 */
/**
 * Risk level classification used across the system
 */
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

/**
 * Investment level classification used across the system
 */
export type InvestmentLevel = 'minimal' | 'moderate' | 'substantial';

/**
 * Alternative source for a vulnerable supply chain node
 */
export interface AlternativeSource {
  sourceId: string;
  sourceName: string;
  viabilityScore: number;
  implementationTimeframes: {
    best: number;
    expected: number;
    worst: number;
  };
  tariffDifferential: number;
  qualityCompatibility: number;
}

/**
 * Vulnerability hotspot in a supply chain
 */
export interface VulnerabilityHotspot {
  nodeId: string;
  nodeName: string;
  vulnerabilityScore: number;
  impactOnProductionValue: number;
  timeToDisruptionDays: number;
  alternativeSources: AlternativeSource[];
}

/**
 * Region with associated resilience metrics in the heatmap
 */
export interface RegionalHeatmapEntry {
  regionId: string;
  regionName: string;
  resilienceScore: number;
  tariffRiskLevel: RiskLevel;
  geopoliticalRiskLevel: RiskLevel;
  transitTimeRisk: RiskLevel;
}

/**
 * Recommended action to improve supply chain resilience
 */
export interface ResilienceRecommendation {
  priority: RiskLevel;
  action: string;
  expectedImpact: number;
  timeframe: string;
  investmentRequired: InvestmentLevel;
  tariffConsiderations: string;
}

/**
 * Complete supply chain resilience analysis
 */
export interface SupplyChainResilience {
  overallResilienceScore: number;
  vulnerabilityHotspots: VulnerabilityHotspot[];
  regionalHeatmap: RegionalHeatmapEntry[];
  recommendedActions: ResilienceRecommendation[];
}

/**
 * Type for executive summary
 */
export interface ExecutiveSummary {
  targetAudience: 'CEO' | 'CFO' | 'COO' | 'Supply Chain' | 'General';
  keyFindings: Array<{
    title: string;
    description: string;
    impact: 'positive' | 'negative' | 'neutral';
    magnitude: number;
    confidenceInterval: {
      low: number;
      high: number;
    };
  }>;
  financialImpact: {
    revenueImpact: number;
    marginImpact: number;
    timeframeMonths: number;
    mostAffectedDivisions: string[];
    opportunityCosts: number;
  };
  strategicRecommendations: Array<{
    title: string;
    description: string;
    timeframe: string;
    resourceRequirements: string;
    expectedOutcome: string;
    risks: string[];
  }>;
  presentationSlides: Array<{
    title: string;
    contentType: 'chart' | 'table' | 'text' | 'image';
    content: any;
    notes: string;
  }>;
}

/**
 * Type for temporal comparison
 */
export interface TemporalComparison {
  timelinePoints: Array<{
    timestamp: string;
    label: string;
    description: string;
    tariffLevel: number;
    tradeVolume: number;
    isProjected: boolean;
    confidenceInterval?: {
      low: number;
      high: number;
    };
  }>;
  sankeyTimeSeries: Array<{
    timestamp: string;
    sankeyData: SankeyData;
    keyChanges: Array<{
      description: string;
      magnitude: number;
      affectedNodes: string[];
    }>;
  }>;
  trendAnalysis: Array<{
    metricName: string;
    trend: 'increasing' | 'decreasing' | 'stable' | 'volatile';
    changeRate: number;
    description: string;
  }>;
}

/**
 * Type for interaction patterns
 */
export interface InteractionPattern {
  type: 'touch' | 'voice' | 'ar' | 'haptic';
  triggers: Array<{
    event: string;
    description: string;
    action: string;
  }>;
  contextualActions: Array<{
    context: string;
    availableActions: string[];
    defaultAction: string;
  }>;
  accessibilityFeatures: {
    voiceGuidance: boolean;
    highContrast: boolean;
    textToSpeech: boolean;
    gestureAlternatives: boolean;
  };
}

/**
 * Type for external market signals
 */
export interface MarketSignals {
  currencyFluctuations: Array<{
    currencyPair: string;
    changePercent: number;
    impact: number;
    affectedCategories: string[];
    timestamp: string;
  }>;
  newsSentiment: Array<{
    topic: string;
    averageSentiment: number; // -1 to 1, negative to positive
    volume: number;
    topHeadlines: string[];
    potentialImpact: number;
    timestamp: string;
  }>;
  commodityPrices: Array<{
    commodity: string;
    priceChange: number;
    correlation: number; // Correlation with tariff impacts
    affectedCategories: string[];
    timestamp: string;
  }>;
  tradePolicySignals: Array<{
    country: string;
    signalType: 'positive' | 'negative' | 'neutral';
    description: string;
    probabilityOfChange: number;
    potentialImpact: number;
    timeframeMonths: number;
    timestamp: string;
  }>;
}
