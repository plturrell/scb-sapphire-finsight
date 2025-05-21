/**
 * Data Validation Handlers
 * Provides validation for structured data before storing in Jena
 */

import { NodeHandler, GraphState } from '../../types';

/**
 * Validates company data structure
 */
export const validateCompanyData: NodeHandler = async (input: any, state: GraphState) => {
  console.log('Running validateCompanyData handler');
  
  if (!input) {
    throw new Error('No data provided for company validation');
  }
  
  const validationErrors = [];
  
  // Required fields
  if (!input.name) {
    validationErrors.push('Missing required field: name');
  }
  
  // Check financials structure if present
  if (input.financials) {
    if (input.financials.revenue && typeof input.financials.revenue === 'object') {
      if (!input.financials.revenue.value && input.financials.revenue.value !== 0) {
        validationErrors.push('Missing required field: financials.revenue.value');
      }
    }
  }
  
  // Check that metadata exists
  if (!input._metadata) {
    validationErrors.push('Missing required field: _metadata');
  } else {
    if (!input._metadata.id) {
      validationErrors.push('Missing required field: _metadata.id');
    }
    if (!input._metadata.type) {
      validationErrors.push('Missing required field: _metadata.type');
    }
    if (input._metadata.type !== 'company') {
      validationErrors.push(`Invalid metadata type: ${input._metadata.type}, expected 'company'`);
    }
  }
  
  // Update validation state
  const isValid = validationErrors.length === 0;
  
  // Add validation results to the node state
  state.nodes[state.currentNode!] = {
    ...state.nodes[state.currentNode!],
    result: {
      isValid,
      errors: validationErrors,
      data: input,
    },
  };
  
  // Return the validated data with validation info
  return {
    ...input,
    _validation: {
      isValid,
      errors: validationErrors,
      timestamp: new Date().toISOString(),
    },
  };
};

/**
 * Validates financial insights data structure
 */
export const validateFinancialInsights: NodeHandler = async (input: any, state: GraphState) => {
  console.log('Running validateFinancialInsights handler');
  
  if (!input) {
    throw new Error('No data provided for financial insights validation');
  }
  
  const validationErrors = [];
  
  // Required fields
  if (!input.topic) {
    validationErrors.push('Missing required field: topic');
  }
  
  if (!input.summary) {
    validationErrors.push('Missing required field: summary');
  }
  
  // Check that arrays are properly formed
  if (input.keyTrends && !Array.isArray(input.keyTrends)) {
    validationErrors.push('keyTrends must be an array');
  }
  
  if (input.metrics && !Array.isArray(input.metrics)) {
    validationErrors.push('metrics must be an array');
  }
  
  if (input.risks && !Array.isArray(input.risks)) {
    validationErrors.push('risks must be an array');
  }
  
  if (input.opportunities && !Array.isArray(input.opportunities)) {
    validationErrors.push('opportunities must be an array');
  }
  
  // Check that metadata exists
  if (!input._metadata) {
    validationErrors.push('Missing required field: _metadata');
  } else {
    if (!input._metadata.id) {
      validationErrors.push('Missing required field: _metadata.id');
    }
    if (!input._metadata.type) {
      validationErrors.push('Missing required field: _metadata.type');
    }
    if (input._metadata.type !== 'financial_insights') {
      validationErrors.push(`Invalid metadata type: ${input._metadata.type}, expected 'financial_insights'`);
    }
  }
  
  // Update validation state
  const isValid = validationErrors.length === 0;
  
  // Add validation results to the node state
  state.nodes[state.currentNode!] = {
    ...state.nodes[state.currentNode!],
    result: {
      isValid,
      errors: validationErrors,
      data: input,
    },
  };
  
  // Return the validated data with validation info
  return {
    ...input,
    _validation: {
      isValid,
      errors: validationErrors,
      timestamp: new Date().toISOString(),
    },
  };
};

/**
 * Validates market news data structure
 */
export const validateMarketNews: NodeHandler = async (input: any, state: GraphState) => {
  console.log('Running validateMarketNews handler');
  
  if (!input) {
    throw new Error('No data provided for market news validation');
  }
  
  const validationErrors = [];
  
  // Required fields
  if (!input.topic) {
    validationErrors.push('Missing required field: topic');
  }
  
  // Check that articles array exists and is properly formed
  if (!input.articles) {
    validationErrors.push('Missing required field: articles');
  } else if (!Array.isArray(input.articles)) {
    validationErrors.push('articles must be an array');
  } else {
    // Check each article for required fields
    input.articles.forEach((article: any, index: number) => {
      if (!article.id) {
        validationErrors.push(`Article at index ${index} is missing required field: id`);
      }
      if (!article.title) {
        validationErrors.push(`Article at index ${index} is missing required field: title`);
      }
      if (!article.summary) {
        validationErrors.push(`Article at index ${index} is missing required field: summary`);
      }
    });
  }
  
  // Check that metadata exists
  if (!input._metadata) {
    validationErrors.push('Missing required field: _metadata');
  } else {
    if (!input._metadata.id) {
      validationErrors.push('Missing required field: _metadata.id');
    }
    if (!input._metadata.type) {
      validationErrors.push('Missing required field: _metadata.type');
    }
    if (input._metadata.type !== 'market_news') {
      validationErrors.push(`Invalid metadata type: ${input._metadata.type}, expected 'market_news'`);
    }
  }
  
  // Update validation state
  const isValid = validationErrors.length === 0;
  
  // Add validation results to the node state
  state.nodes[state.currentNode!] = {
    ...state.nodes[state.currentNode!],
    result: {
      isValid,
      errors: validationErrors,
      data: input,
    },
  };
  
  // Return the validated data with validation info
  return {
    ...input,
    _validation: {
      isValid,
      errors: validationErrors,
      timestamp: new Date().toISOString(),
    },
  };
};

/**
 * Validates analysis results data structure
 */
export const validateAnalysisResults: NodeHandler = async (input: any, state: GraphState) => {
  console.log('Running validateAnalysisResults handler');
  
  if (!input) {
    throw new Error('No data provided for analysis results validation');
  }
  
  const validationErrors = [];
  
  // Check that metadata exists
  if (!input._metadata) {
    validationErrors.push('Missing required field: _metadata');
  } else {
    if (!input._metadata.id) {
      validationErrors.push('Missing required field: _metadata.id');
    }
    if (!input._metadata.type) {
      validationErrors.push('Missing required field: _metadata.type');
    }
    
    // Validate based on type of analysis
    const analysisType = input._metadata.type;
    switch (analysisType) {
      case 'investment_analysis':
        if (!input.companyName) {
          validationErrors.push('Missing required field for investment_analysis: companyName');
        }
        if (!input.recommendation || !input.recommendation.action) {
          validationErrors.push('Missing required field for investment_analysis: recommendation.action');
        }
        break;
        
      case 'news_sentiment_analysis':
        if (!input.overallSentiment || !input.overallSentiment.sentiment) {
          validationErrors.push('Missing required field for news_sentiment_analysis: overallSentiment.sentiment');
        }
        break;
        
      case 'financial_recommendations':
        if (!input.recommendations || !Array.isArray(input.recommendations) || input.recommendations.length === 0) {
          validationErrors.push('Missing required field for financial_recommendations: recommendations (must be non-empty array)');
        }
        break;
        
      default:
        validationErrors.push(`Unknown analysis type: ${analysisType}`);
    }
  }
  
  // Update validation state
  const isValid = validationErrors.length === 0;
  
  // Add validation results to the node state
  state.nodes[state.currentNode!] = {
    ...state.nodes[state.currentNode!],
    result: {
      isValid,
      errors: validationErrors,
      data: input,
    },
  };
  
  // Return the validated data with validation info
  return {
    ...input,
    _validation: {
      isValid,
      errors: validationErrors,
      timestamp: new Date().toISOString(),
    },
  };
};