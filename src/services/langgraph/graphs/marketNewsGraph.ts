/**
 * Market News Graph
 * Defines the graph configuration for processing market news
 */

import { Graph, NodeType, EdgeType } from '../types';

/**
 * Graph definition for market news processing and sentiment analysis
 */
export const marketNewsGraph: Graph = {
  id: 'market_news_graph',
  name: 'Market News Pipeline',
  description: 'Retrieves, transforms, analyzes, and stores market news data',
  version: '1.0.0',
  
  // Define all nodes in the graph
  nodes: [
    {
      id: 'start',
      type: NodeType.START,
      handler: 'startNode',
    },
    {
      id: 'retrieve_news',
      type: NodeType.RETRIEVE,
      handler: 'perplexityMarketNewsRetrieval',
    },
    {
      id: 'transform_news',
      type: NodeType.TRANSFORM,
      handler: 'transformMarketNews',
    },
    {
      id: 'validate_news',
      type: NodeType.VALIDATE,
      handler: 'validateMarketNews',
    },
    {
      id: 'store_news',
      type: NodeType.STORE,
      handler: 'storeMarketNews',
    },
    {
      id: 'analyze_sentiment',
      type: NodeType.ANALYZE,
      handler: 'analyzeMarketNewsSentiment',
    },
    {
      id: 'validate_sentiment',
      type: NodeType.VALIDATE,
      handler: 'validateAnalysisResults',
    },
    {
      id: 'store_sentiment',
      type: NodeType.STORE,
      handler: 'storeAnalysisResults',
    },
    {
      id: 'error',
      type: NodeType.START,
      handler: 'errorNode',
    },
    {
      id: 'end',
      type: NodeType.END,
      handler: 'endNode',
    },
  ],
  
  // Define all edges between nodes
  edges: [
    {
      from: 'start',
      to: 'retrieve_news',
      type: EdgeType.SUCCESS,
    },
    {
      from: 'retrieve_news',
      to: 'transform_news',
      type: EdgeType.SUCCESS,
    },
    {
      from: 'transform_news',
      to: 'validate_news',
      type: EdgeType.SUCCESS,
    },
    {
      from: 'validate_news',
      to: 'store_news',
      type: EdgeType.SUCCESS,
      condition: 'result._validation.isValid === true',
    },
    {
      from: 'validate_news',
      to: 'error',
      type: EdgeType.ERROR,
      condition: 'result._validation.isValid !== true',
    },
    {
      from: 'store_news',
      to: 'analyze_sentiment',
      type: EdgeType.SUCCESS,
    },
    {
      from: 'analyze_sentiment',
      to: 'validate_sentiment',
      type: EdgeType.SUCCESS,
    },
    {
      from: 'validate_sentiment',
      to: 'store_sentiment',
      type: EdgeType.SUCCESS,
      condition: 'result._validation.isValid === true',
    },
    {
      from: 'validate_sentiment',
      to: 'error',
      type: EdgeType.ERROR,
      condition: 'result._validation.isValid !== true',
    },
    {
      from: 'store_sentiment',
      to: 'end',
      type: EdgeType.SUCCESS,
    },
    
    // Error handling edges
    {
      from: 'retrieve_news',
      to: 'error',
      type: EdgeType.ERROR,
    },
    {
      from: 'transform_news',
      to: 'error',
      type: EdgeType.ERROR,
    },
    {
      from: 'store_news',
      to: 'error',
      type: EdgeType.ERROR,
    },
    {
      from: 'analyze_sentiment',
      to: 'error',
      type: EdgeType.ERROR,
    },
    {
      from: 'store_sentiment',
      to: 'error',
      type: EdgeType.ERROR,
    },
    {
      from: 'error',
      to: 'end',
      type: EdgeType.SUCCESS,
    },
  ],
  
  // Additional metadata
  metadata: {
    author: 'SCB Sapphire Team',
    createdAt: '2025-05-21',
    tags: ['market', 'news', 'sentiment'],
  },
};