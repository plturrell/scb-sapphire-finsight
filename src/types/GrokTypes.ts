/**
 * Grok 3 API Types
 * Definitions of types used for integration with Grok 3 API
 */

import { AnalysisDepth } from './MonteCarloTypes';

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