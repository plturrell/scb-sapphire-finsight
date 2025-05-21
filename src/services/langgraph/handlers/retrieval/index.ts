/**
 * Retrieval Handlers Index
 * Exports all retrieval handlers for the LangGraph pipeline
 */

import { 
  perplexityGeneralRetrieval,
  perplexityCompanyRetrieval,
  perplexityFinancialRetrieval,
  perplexityMarketNewsRetrieval
} from './perplexityRetrieval';

// Export all retrieval handlers
export const retrievalHandlers = {
  perplexityGeneralRetrieval,
  perplexityCompanyRetrieval,
  perplexityFinancialRetrieval,
  perplexityMarketNewsRetrieval,
};