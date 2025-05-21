/**
 * Financial Insights Graph
 * Defines the graph configuration for processing financial insights
 */

import { Graph, NodeType, EdgeType } from '../types';

/**
 * Graph definition for financial insights processing and recommendations
 */
export const financialInsightsGraph: Graph = {
  id: 'financial_insights_graph',
  name: 'Financial Insights Pipeline',
  description: 'Retrieves, transforms, analyzes, and stores financial insights',
  version: '1.0.0',
  
  // Define all nodes in the graph
  nodes: [
    {
      id: 'start',
      type: NodeType.START,
      handler: 'startNode',
    },
    {
      id: 'retrieve_insights',
      type: NodeType.RETRIEVE,
      handler: 'perplexityFinancialRetrieval',
    },
    {
      id: 'transform_insights',
      type: NodeType.TRANSFORM,
      handler: 'transformFinancialInsights',
    },
    {
      id: 'validate_insights',
      type: NodeType.VALIDATE,
      handler: 'validateFinancialInsights',
    },
    {
      id: 'store_insights',
      type: NodeType.STORE,
      handler: 'storeFinancialInsights',
    },
    {
      id: 'generate_recommendations',
      type: NodeType.ANALYZE,
      handler: 'generateFinancialRecommendations',
    },
    {
      id: 'validate_recommendations',
      type: NodeType.VALIDATE,
      handler: 'validateAnalysisResults',
    },
    {
      id: 'store_recommendations',
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
      to: 'retrieve_insights',
      type: EdgeType.SUCCESS,
    },
    {
      from: 'retrieve_insights',
      to: 'transform_insights',
      type: EdgeType.SUCCESS,
    },
    {
      from: 'transform_insights',
      to: 'validate_insights',
      type: EdgeType.SUCCESS,
    },
    {
      from: 'validate_insights',
      to: 'store_insights',
      type: EdgeType.SUCCESS,
      condition: 'result._validation.isValid === true',
    },
    {
      from: 'validate_insights',
      to: 'error',
      type: EdgeType.ERROR,
      condition: 'result._validation.isValid !== true',
    },
    {
      from: 'store_insights',
      to: 'generate_recommendations',
      type: EdgeType.SUCCESS,
    },
    {
      from: 'generate_recommendations',
      to: 'validate_recommendations',
      type: EdgeType.SUCCESS,
    },
    {
      from: 'validate_recommendations',
      to: 'store_recommendations',
      type: EdgeType.SUCCESS,
      condition: 'result._validation.isValid === true',
    },
    {
      from: 'validate_recommendations',
      to: 'error',
      type: EdgeType.ERROR,
      condition: 'result._validation.isValid !== true',
    },
    {
      from: 'store_recommendations',
      to: 'end',
      type: EdgeType.SUCCESS,
    },
    
    // Error handling edges
    {
      from: 'retrieve_insights',
      to: 'error',
      type: EdgeType.ERROR,
    },
    {
      from: 'transform_insights',
      to: 'error',
      type: EdgeType.ERROR,
    },
    {
      from: 'store_insights',
      to: 'error',
      type: EdgeType.ERROR,
    },
    {
      from: 'generate_recommendations',
      to: 'error',
      type: EdgeType.ERROR,
    },
    {
      from: 'store_recommendations',
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
    tags: ['financial', 'insights', 'recommendations'],
  },
};