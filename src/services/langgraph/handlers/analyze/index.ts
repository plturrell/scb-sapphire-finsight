/**
 * Analysis Handlers Index
 * Exports all data analysis handlers for the LangGraph pipeline
 */

import { 
  analyzeCompanyInvestmentPotential,
  analyzeMarketNewsSentiment,
  generateFinancialRecommendations
} from './analyzers';

// Export all analysis handlers
export const analyzeHandlers = {
  analyzeCompanyInvestmentPotential,
  analyzeMarketNewsSentiment,
  generateFinancialRecommendations,
};