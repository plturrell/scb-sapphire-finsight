/**
 * Transform Handlers for LangGraph
 * Transforms unstructured text data into structured formats
 */

import { NodeHandler, GraphState } from '../../types';
import { LangGraphConfig } from '../../LangGraphConfig';
import perplexityService from '@/services/PerplexityService';
import { v4 as uuidv4 } from 'uuid';

/**
 * Transforms company info text into structured data
 */
export const transformCompanyData: NodeHandler = async (input: any, state: GraphState) => {
  console.log('Running transformCompanyData handler');
  
  if (!input || !input.content) {
    throw new Error('No content provided for company data transformation');
  }
  
  const content = input.content;
  const company = input.metadata?.company || 'Unknown Company';
  
  // Use Perplexity to structure the data
  const structuringPrompt = `
    Transform the following company information into a structured JSON format:
    
    ${content}
    
    Return ONLY valid JSON (no markdown code blocks or explanations) with the following structure:
    {
      "name": "Company Name",
      "ticker": "TICKER", // If available
      "description": "Brief company description",
      "industry": "Primary industry",
      "sector": "Market sector",
      "foundedYear": YYYY, // If available
      "headquarters": "Location",
      "employees": Number, // If available
      "ceo": "CEO name", // If available
      "financials": {
        "revenue": { "value": Number, "currency": "USD", "period": "Annual/Quarterly", "year": YYYY },
        "marketCap": { "value": Number, "currency": "USD" },
        "peRatio": Number,
        "profitMargin": Number // As decimal
      },
      "products": ["Product1", "Product2"],
      "competitors": ["Competitor1", "Competitor2"],
      "recentNews": [
        { "headline": "News headline", "summary": "Brief summary", "date": "YYYY-MM-DD" }
      ]
    }
    
    Include as many fields as possible from the provided information. Use null for missing values.
  `;
  
  try {
    const messages = [
      {
        role: 'system' as const,
        content: 'You are a data structuring assistant. Your job is to transform unstructured text into valid JSON. Only output valid JSON without markdown formatting, explanations, or any other text.'
      },
      {
        role: 'user' as const,
        content: structuringPrompt
      }
    ];
    
    const response = await perplexityService.callPerplexityAPI(messages, {
      temperature: 0.1, // Low temperature for consistent formatting
      model: LangGraphConfig.perplexity.defaultModel,
    });
    
    const structuredContent = response.choices[0]?.message?.content || '';
    
    // Extract JSON from the response (handle cases where API might add markdown)
    let jsonData: any = {};
    try {
      // Try to parse the entire response as JSON first
      jsonData = JSON.parse(structuredContent);
    } catch (e) {
      // If that fails, try to extract JSON using regex
      const jsonMatch = structuredContent.match(/```json\n([\s\S]*)\n```/) || 
                        structuredContent.match(/```\n([\s\S]*)\n```/) ||
                        structuredContent.match(/\{[\s\S]*\}/);
                        
      if (jsonMatch) {
        jsonData = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      } else {
        throw new Error('Failed to extract JSON from structured content');
      }
    }
    
    // Update metrics in state
    state.nodes[state.currentNode!].metrics = {
      ...state.nodes[state.currentNode!].metrics,
      tokenUsage: {
        promptTokens: structuringPrompt.length / 4,
        completionTokens: structuredContent.length / 4,
        totalTokens: (structuringPrompt.length + structuredContent.length) / 4,
      },
    };
    
    // Add metadata
    return {
      ...jsonData,
      _metadata: {
        id: uuidv4(),
        type: 'company',
        source: 'perplexity',
        processingTimestamp: new Date().toISOString(),
        dataTimestamp: input.metadata?.timestamp || new Date().toISOString(),
        query: input.metadata?.query || `Information about ${company}`,
      }
    };
  } catch (error) {
    console.error('Error in transformCompanyData:', error);
    
    // Fallback to a simpler structure if transformation fails
    return {
      name: company,
      description: content.substring(0, 200) + '...',
      _metadata: {
        id: uuidv4(),
        type: 'company',
        source: 'perplexity',
        processingTimestamp: new Date().toISOString(),
        error: 'Failed to transform data',
        fallback: true,
      }
    };
  }
};

/**
 * Transforms financial insights text into structured data
 */
export const transformFinancialInsights: NodeHandler = async (input: any, state: GraphState) => {
  console.log('Running transformFinancialInsights handler');
  
  if (!input || !input.content) {
    throw new Error('No content provided for financial insights transformation');
  }
  
  const content = input.content;
  const topic = input.metadata?.topic || 'Unknown Topic';
  
  // Use Perplexity to structure the data
  const structuringPrompt = `
    Transform the following financial insights into a structured JSON format:
    
    ${content}
    
    Return ONLY valid JSON (no markdown code blocks or explanations) with the following structure:
    {
      "topic": "Topic name",
      "summary": "Brief summary of insights",
      "keyTrends": [
        { "trend": "Trend description", "impact": "Impact description" }
      ],
      "metrics": [
        { "name": "Metric name", "value": "Value", "unit": "Unit", "trend": "up/down/stable" }
      ],
      "risks": [
        { "risk": "Risk description", "severity": "high/medium/low", "mitigation": "Mitigation approach" }
      ],
      "opportunities": [
        { "opportunity": "Opportunity description", "potential": "high/medium/low", "timeframe": "short/medium/long-term" }
      ],
      "recommendations": [
        { "recommendation": "Recommendation description", "rationale": "Why this is recommended" }
      ]
    }
    
    Include as many fields as possible from the provided information. Use null for missing values or empty arrays.
  `;
  
  try {
    const messages = [
      {
        role: 'system' as const,
        content: 'You are a financial data structuring assistant. Your job is to transform unstructured financial insights into valid JSON. Only output valid JSON without markdown formatting, explanations, or any other text.'
      },
      {
        role: 'user' as const,
        content: structuringPrompt
      }
    ];
    
    const response = await perplexityService.callPerplexityAPI(messages, {
      temperature: 0.1,
      model: LangGraphConfig.perplexity.defaultModel,
    });
    
    const structuredContent = response.choices[0]?.message?.content || '';
    
    // Extract JSON from the response
    let jsonData: any = {};
    try {
      // Try to parse the entire response as JSON first
      jsonData = JSON.parse(structuredContent);
    } catch (e) {
      // If that fails, try to extract JSON using regex
      const jsonMatch = structuredContent.match(/```json\n([\s\S]*)\n```/) || 
                        structuredContent.match(/```\n([\s\S]*)\n```/) ||
                        structuredContent.match(/\{[\s\S]*\}/);
                        
      if (jsonMatch) {
        jsonData = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      } else {
        throw new Error('Failed to extract JSON from structured content');
      }
    }
    
    // Update metrics in state
    state.nodes[state.currentNode!].metrics = {
      ...state.nodes[state.currentNode!].metrics,
      tokenUsage: {
        promptTokens: structuringPrompt.length / 4,
        completionTokens: structuredContent.length / 4,
        totalTokens: (structuringPrompt.length + structuredContent.length) / 4,
      },
    };
    
    // Add metadata
    return {
      ...jsonData,
      _metadata: {
        id: uuidv4(),
        type: 'financial_insights',
        source: 'perplexity',
        processingTimestamp: new Date().toISOString(),
        dataTimestamp: input.metadata?.timestamp || new Date().toISOString(),
        query: input.metadata?.query || `Financial insights about ${topic}`,
      }
    };
  } catch (error) {
    console.error('Error in transformFinancialInsights:', error);
    
    // Fallback to a simpler structure if transformation fails
    return {
      topic: topic,
      summary: content.substring(0, 200) + '...',
      _metadata: {
        id: uuidv4(),
        type: 'financial_insights',
        source: 'perplexity',
        processingTimestamp: new Date().toISOString(),
        error: 'Failed to transform data',
        fallback: true,
      }
    };
  }
};

/**
 * Transforms market news text into structured data
 */
export const transformMarketNews: NodeHandler = async (input: any, state: GraphState) => {
  console.log('Running transformMarketNews handler');
  
  if (!input || !input.content) {
    throw new Error('No content provided for market news transformation');
  }
  
  const content = input.content;
  const topic = input.metadata?.topic || 'financial markets';
  
  // Use Perplexity to structure the data
  const structuringPrompt = `
    Transform the following market news into a structured JSON format:
    
    ${content}
    
    Return ONLY valid JSON (no markdown code blocks or explanations) with the following structure:
    {
      "topic": "News topic",
      "articles": [
        {
          "id": "unique-id", // Generate this
          "title": "Headline",
          "summary": "News summary",
          "category": "Category (Markets, Economy, Stocks, etc.)",
          "source": "News source",
          "timestamp": "2023-01-01T00:00:00Z", // Approximate date
          "impact": "positive/negative/neutral",
          "relevance": "high/medium/low"
        }
      ]
    }
    
    Format the articles array with multiple news items from the content. Generate reasonable timestamps if exact dates aren't provided (use current or recent dates).
  `;
  
  try {
    const messages = [
      {
        role: 'system' as const,
        content: 'You are a financial news structuring assistant. Your job is to transform unstructured news text into valid JSON format. Only output valid JSON without markdown formatting, explanations, or any other text.'
      },
      {
        role: 'user' as const,
        content: structuringPrompt
      }
    ];
    
    const response = await perplexityService.callPerplexityAPI(messages, {
      temperature: 0.1,
      model: LangGraphConfig.perplexity.defaultModel,
    });
    
    const structuredContent = response.choices[0]?.message?.content || '';
    
    // Extract JSON from the response
    let jsonData: any = {};
    try {
      // Try to parse the entire response as JSON first
      jsonData = JSON.parse(structuredContent);
    } catch (e) {
      // If that fails, try to extract JSON using regex
      const jsonMatch = structuredContent.match(/```json\n([\s\S]*)\n```/) || 
                        structuredContent.match(/```\n([\s\S]*)\n```/) ||
                        structuredContent.match(/\{[\s\S]*\}/);
                        
      if (jsonMatch) {
        jsonData = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      } else {
        throw new Error('Failed to extract JSON from structured content');
      }
    }
    
    // Ensure each article has an ID
    if (jsonData.articles) {
      jsonData.articles = jsonData.articles.map((article: any) => ({
        ...article,
        id: article.id || `news-${uuidv4()}`,
      }));
    }
    
    // Update metrics in state
    state.nodes[state.currentNode!].metrics = {
      ...state.nodes[state.currentNode!].metrics,
      tokenUsage: {
        promptTokens: structuringPrompt.length / 4,
        completionTokens: structuredContent.length / 4,
        totalTokens: (structuringPrompt.length + structuredContent.length) / 4,
      },
    };
    
    // Add metadata
    return {
      ...jsonData,
      _metadata: {
        id: uuidv4(),
        type: 'market_news',
        source: 'perplexity',
        processingTimestamp: new Date().toISOString(),
        dataTimestamp: input.metadata?.timestamp || new Date().toISOString(),
        query: input.metadata?.query || `Market news about ${topic}`,
      }
    };
  } catch (error) {
    console.error('Error in transformMarketNews:', error);
    
    // Fallback to a simple structure if transformation fails
    return {
      topic: topic,
      articles: [
        {
          id: `news-${uuidv4()}`,
          title: 'News retrieval error',
          summary: 'Unable to process market news at this time.',
          category: 'System',
          timestamp: new Date().toISOString(),
        }
      ],
      _metadata: {
        id: uuidv4(),
        type: 'market_news',
        source: 'perplexity',
        processingTimestamp: new Date().toISOString(),
        error: 'Failed to transform data',
        fallback: true,
      }
    };
  }
};