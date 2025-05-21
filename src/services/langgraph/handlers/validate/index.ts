/**
 * Validation Handlers Index
 * Exports all data validation handlers for the LangGraph pipeline
 */

import { 
  validateCompanyData,
  validateFinancialInsights,
  validateMarketNews,
  validateAnalysisResults
} from './dataValidators';

// Export all validation handlers
export const validateHandlers = {
  validateCompanyData,
  validateFinancialInsights,
  validateMarketNews,
  validateAnalysisResults,
};