import { NextApiRequest, NextApiResponse } from 'next';
import perplexityApiClient from '../../services/PerplexityApiClient';
import { NotificationCenter } from '../../services/NotificationCenter';
import { OntologyManager } from '../../services/OntologyManager';

/**
 * API endpoint for enhanced Perplexity.ai style AI integration
 * Provides Perplexity-quality natural language processing capabilities
 * while maintaining SCB Sapphire's perfect cross-platform consistency
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      query, 
      context, 
      domain = 'supply-chain', 
      depth = 'standard',
      responseName = 'perfectConsistency'
    } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    // Use Perplexity API client for enhanced analysis
    const perplexityResponse = await perplexityApiClient.getEnhancedAnalysis(
      query,
      {
        domain,
        depth,
        additionalContext: context,
        responseName
      }
    );

    // Add notification about Perplexity enhancement
    try {
      NotificationCenter.showNotification({
        title: 'Enhanced AI Analysis Ready',
        body: `Perplexity-enhanced analysis completed for "${query.substring(0, 30)}..."`,
        priority: 'medium',
        category: 'ai-insight',
        dataPoints: {
          'Source': 'Perplexity AI',
          'Confidence': `${Math.round(perplexityResponse.confidence * 100)}%`,
          'Analysis Type': domain,
          'Depth': depth
        }
      }, 'market-intelligence', 'enhanced-analysis');
    } catch (notificationError) {
      console.error('Error showing notification:', notificationError);
      // Continue even if notification fails
    }

    return res.status(200).json({
      success: true,
      response: perplexityResponse,
      meta: {
        processingTime: perplexityResponse.processingTime || 'N/A',
        consistency: 'perfect',
        enhancementLevel: depth,
        domain
      }
    });
  } catch (error) {
    console.error('Error processing Perplexity integration:', error);
    return res.status(500).json({ 
      success: false,
      error: 'An error occurred while processing your Perplexity integration request',
      details: error.message
    });
  }
}
