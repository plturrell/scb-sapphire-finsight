/**
 * Graph Definitions Index
 * Exports all graph definitions for the LangGraph pipelines
 */

import { companyAnalysisGraph } from './companyAnalysisGraph';
import { marketNewsGraph } from './marketNewsGraph';
import { financialInsightsGraph } from './financialInsightsGraph';

// Export all graph definitions
export const graphs = {
  companyAnalysisGraph,
  marketNewsGraph,
  financialInsightsGraph,
};