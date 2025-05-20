import { NextApiRequest, NextApiResponse } from 'next';
import { perplexityApi } from '../lib/perplexity-api';

/**
 * API handler for Perplexity API proxy
 * 
 * This endpoint provides a secure proxy to the Perplexity API,
 * exposing key financial data capabilities without exposing API keys.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Require POST requests for security
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action, params } = req.body;

  try {
    let result;

    // Route to appropriate Perplexity API methods
    switch (action) {
      case 'getMarketNews':
        const { topic, limit } = params;
        if (!topic) {
          return res.status(400).json({ error: 'Topic is required' });
        }
        result = await perplexityApi.getMarketNews(topic, limit || 5);
        break;

      case 'getCompanyFinancialMetrics':
        const { ticker } = params;
        if (!ticker) {
          return res.status(400).json({ error: 'Ticker is required' });
        }
        result = await perplexityApi.getCompanyFinancialMetrics(ticker);
        break;

      case 'getTariffAlerts':
        const { country, alertLimit } = params;
        if (!country) {
          return res.status(400).json({ error: 'Country is required' });
        }
        result = await perplexityApi.getTariffAlerts(country, alertLimit || 3);
        break;

      case 'analyzeFinancialImpact':
        const { event, company } = params;
        if (!event) {
          return res.status(400).json({ error: 'Event is required' });
        }
        result = await perplexityApi.analyzeFinancialImpact(event, company);
        break;

      case 'getMacroeconomicIndicators':
        const { macroCountry } = params;
        if (!macroCountry) {
          return res.status(400).json({ error: 'Country is required' });
        }
        result = await perplexityApi.getMacroeconomicIndicators(macroCountry);
        break;

      default:
        return res.status(400).json({ error: 'Invalid action' });
    }

    // Return results
    return res.status(200).json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Perplexity API proxy error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: new Date().toISOString()
    });
  }
}