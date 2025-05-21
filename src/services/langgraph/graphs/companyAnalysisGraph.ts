/**
 * Company Analysis Graph
 * Defines the graph configuration for analyzing company data
 */

import { Graph, NodeType, EdgeType } from '../types';

/**
 * Graph definition for company data processing and analysis
 */
export const companyAnalysisGraph: Graph = {
  id: 'company_analysis_graph',
  name: 'Company Analysis Pipeline',
  description: 'Retrieves, transforms, analyzes, and stores company data',
  version: '1.0.0',
  
  // Define all nodes in the graph
  nodes: [
    {
      id: 'start',
      type: NodeType.START,
      handler: 'startNode',
    },
    {
      id: 'retrieve_company',
      type: NodeType.RETRIEVE,
      handler: 'perplexityCompanyRetrieval',
    },
    {
      id: 'transform_company',
      type: NodeType.TRANSFORM,
      handler: 'transformCompanyData',
    },
    {
      id: 'validate_company',
      type: NodeType.VALIDATE,
      handler: 'validateCompanyData',
    },
    {
      id: 'store_company',
      type: NodeType.STORE,
      handler: 'storeCompanyData',
    },
    {
      id: 'analyze_investment',
      type: NodeType.ANALYZE,
      handler: 'analyzeCompanyInvestmentPotential',
    },
    {
      id: 'validate_analysis',
      type: NodeType.VALIDATE,
      handler: 'validateAnalysisResults',
    },
    {
      id: 'store_analysis',
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
      to: 'retrieve_company',
      type: EdgeType.SUCCESS,
    },
    {
      from: 'retrieve_company',
      to: 'transform_company',
      type: EdgeType.SUCCESS,
    },
    {
      from: 'transform_company',
      to: 'validate_company',
      type: EdgeType.SUCCESS,
    },
    {
      from: 'validate_company',
      to: 'store_company',
      type: EdgeType.SUCCESS,
      condition: 'result._validation.isValid === true',
    },
    {
      from: 'validate_company',
      to: 'error',
      type: EdgeType.ERROR,
      condition: 'result._validation.isValid !== true',
    },
    {
      from: 'store_company',
      to: 'analyze_investment',
      type: EdgeType.SUCCESS,
    },
    {
      from: 'analyze_investment',
      to: 'validate_analysis',
      type: EdgeType.SUCCESS,
    },
    {
      from: 'validate_analysis',
      to: 'store_analysis',
      type: EdgeType.SUCCESS,
      condition: 'result._validation.isValid === true',
    },
    {
      from: 'validate_analysis',
      to: 'error',
      type: EdgeType.ERROR,
      condition: 'result._validation.isValid !== true',
    },
    {
      from: 'store_analysis',
      to: 'end',
      type: EdgeType.SUCCESS,
    },
    
    // Error handling edges
    {
      from: 'retrieve_company',
      to: 'error',
      type: EdgeType.ERROR,
    },
    {
      from: 'transform_company',
      to: 'error',
      type: EdgeType.ERROR,
    },
    {
      from: 'store_company',
      to: 'error',
      type: EdgeType.ERROR,
    },
    {
      from: 'analyze_investment',
      to: 'error',
      type: EdgeType.ERROR,
    },
    {
      from: 'store_analysis',
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
    tags: ['company', 'investment', 'analysis'],
  },
};