/**
 * Storage Handlers Index
 * Exports all storage handlers for the LangGraph pipeline
 */

import { 
  storeCompanyData,
  storeFinancialInsights,
  storeMarketNews,
  storeAnalysisResults
} from './jenaStorage';

// Export all storage handlers
export const storeHandlers = {
  storeCompanyData,
  storeFinancialInsights,
  storeMarketNews,
  storeAnalysisResults,
};