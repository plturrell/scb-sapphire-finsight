import { NextApiRequest, NextApiResponse } from 'next';
import { OntologyManager } from '../../services/OntologyManager';
import { PerplexityEnhancedNLP } from '../../services/PerplexityEnhancedNLP';

/**
 * API endpoint for natural language processing queries
 * Integrates with PerplexityEnhancedNLP service for Perplexity-quality responses
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { query, domainContext, responseFormat, maxTokens } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    // Initialize services
    const ontologyManager = new OntologyManager();
    const nlpService = PerplexityEnhancedNLP.getInstance(ontologyManager);

    // Process the query
    const result = await nlpService.processQuery({
      query,
      domainContext: domainContext || 'finance',
      responseFormat: responseFormat || 'conversational',
      maxTokens: maxTokens || undefined
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error processing NLP query:', error);
    return res.status(500).json({ 
      error: 'An error occurred while processing your query',
      details: error.message
    });
  }
}
