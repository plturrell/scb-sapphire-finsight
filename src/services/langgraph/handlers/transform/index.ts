/**
 * Transform Handlers Index
 * Exports all data transformation handlers for the LangGraph pipeline
 */

import { 
  transformCompanyData,
  transformFinancialInsights,
  transformMarketNews
} from './transformToStructured';

// Export all transform handlers
export const transformHandlers = {
  transformCompanyData,
  transformFinancialInsights,
  transformMarketNews,
};