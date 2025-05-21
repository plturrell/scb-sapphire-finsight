/**
 * Analysis Handlers
 * Provides analytical processing of structured data
 */

import { NodeHandler, GraphState } from '../../types';
import { LangGraphConfig } from '../../LangGraphConfig';
import perplexityService from '@/services/PerplexityService';
import { v4 as uuidv4 } from 'uuid';

/**
 * Analyzes company data for investment potential
 */
export const analyzeCompanyInvestmentPotential: NodeHandler = async (input: any, state: GraphState) => {
  console.log('Running analyzeCompanyInvestmentPotential handler');
  
  if (!input || !input.name) {
    throw new Error('No valid company data provided for investment analysis');
  }
  
  // Convert the input to JSON string for the prompt
  const companyDataJson = JSON.stringify(input, null, 2);
  
  // Create an analysis prompt
  const analysisPrompt = `
    Analyze the following company data for investment potential:
    
    ${companyDataJson}
    
    Provide a detailed investment analysis with the following components:
    1. Strengths and competitive advantages
    2. Weaknesses and challenges
    3. Financial health assessment
    4. Growth prospects
    5. Risks and mitigations
    6. Valuation assessment (under/over valued)
    7. Investment recommendation (buy/hold/sell)
    8. Confidence level in the analysis (high/medium/low)
    
    Return ONLY valid JSON (no markdown code blocks or explanations) with the following structure:
    {
      "companyName": "Company name",
      "analysisDate": "YYYY-MM-DD",
      "strengths": ["Strength 1", "Strength 2"],
      "weaknesses": ["Weakness 1", "Weakness 2"],
      "financialHealth": {
        "assessment": "Strong/Moderate/Weak",
        "keyMetrics": [
          { "metric": "Metric name", "value": "Value", "assessment": "Positive/Negative" }
        ],
        "commentary": "Brief commentary on financial health"
      },
      "growthProspects": {
        "shortTerm": "High/Medium/Low",
        "longTerm": "High/Medium/Low",
        "commentary": "Brief commentary on growth prospects"
      },
      "risks": [
        { "risk": "Risk description", "severity": "High/Medium/Low", "mitigation": "Possible mitigation" }
      ],
      "valuation": {
        "assessment": "Undervalued/Fair value/Overvalued",
        "confidence": "High/Medium/Low",
        "commentary": "Brief commentary on valuation"
      },
      "recommendation": {
        "action": "Buy/Hold/Sell",
        "targetPrice": "Price if available",
        "timeHorizon": "Short/Medium/Long term",
        "commentary": "Brief commentary on recommendation"
      },
      "confidenceLevel": "High/Medium/Low",
      "disclaimer": "This analysis is for informational purposes only and should not be considered investment advice."
    }
  `;
  
  try {
    const messages = [
      {
        role: 'system' as const,
        content: 'You are a financial analyst providing investment analysis based on company data. Your analysis should be balanced, data-driven, and include both positive and negative aspects. Return only a valid JSON object with your analysis.'
      },
      {
        role: 'user' as const,
        content: analysisPrompt
      }
    ];
    
    const response = await perplexityService.callPerplexityAPI(messages, {
      temperature: 0.2,
      model: LangGraphConfig.perplexity.defaultModel,
    });
    
    const analysisContent = response.choices[0]?.message?.content || '';
    
    // Extract JSON from the response
    let jsonData: any = {};
    try {
      // Try to parse the entire response as JSON first
      jsonData = JSON.parse(analysisContent);
    } catch (e) {
      // If that fails, try to extract JSON using regex
      const jsonMatch = analysisContent.match(/```json\n([\s\S]*)\n```/) || 
                        analysisContent.match(/```\n([\s\S]*)\n```/) ||
                        analysisContent.match(/\{[\s\S]*\}/);
                        
      if (jsonMatch) {
        jsonData = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      } else {
        throw new Error('Failed to extract JSON from analysis content');
      }
    }
    
    // Update metrics in state
    state.nodes[state.currentNode!].metrics = {
      ...state.nodes[state.currentNode!].metrics,
      tokenUsage: {
        promptTokens: analysisPrompt.length / 4,
        completionTokens: analysisContent.length / 4,
        totalTokens: (analysisPrompt.length + analysisContent.length) / 4,
      },
    };
    
    // Add metadata
    return {
      ...jsonData,
      _metadata: {
        id: uuidv4(),
        type: 'investment_analysis',
        source: 'langgraph_analysis',
        processingTimestamp: new Date().toISOString(),
        baseDataId: input._metadata?.id,
        company: input.name,
      }
    };
  } catch (error) {
    console.error('Error in analyzeCompanyInvestmentPotential:', error);
    
    // Return a minimal result on error
    return {
      companyName: input.name,
      analysisDate: new Date().toISOString().split('T')[0],
      recommendation: {
        action: "Hold",
        commentary: "Insufficient data to make a conclusive recommendation."
      },
      confidenceLevel: "Low",
      disclaimer: "This analysis is for informational purposes only and should not be considered investment advice.",
      _metadata: {
        id: uuidv4(),
        type: 'investment_analysis',
        source: 'langgraph_analysis',
        processingTimestamp: new Date().toISOString(),
        error: 'Failed to complete analysis',
        fallback: true,
      }
    };
  }
};

/**
 * Analyzes market news for sentiment and impact
 */
export const analyzeMarketNewsSentiment: NodeHandler = async (input: any, state: GraphState) => {
  console.log('Running analyzeMarketNewsSentiment handler');
  
  if (!input || !input.articles || !Array.isArray(input.articles)) {
    throw new Error('No valid market news data provided for sentiment analysis');
  }
  
  // Convert the input to JSON string for the prompt
  const newsDataJson = JSON.stringify(input, null, 2);
  
  // Create an analysis prompt
  const analysisPrompt = `
    Analyze the sentiment and potential market impact of the following financial news:
    
    ${newsDataJson}
    
    For each news article, assess the sentiment (positive, negative, or neutral) and the potential impact on markets.
    Then provide an overall market sentiment analysis based on all the news combined.
    
    Return ONLY valid JSON (no markdown code blocks or explanations) with the following structure:
    {
      "topic": "News topic",
      "overallSentiment": {
        "sentiment": "positive/negative/neutral/mixed",
        "confidence": "high/medium/low",
        "rationale": "Brief explanation of overall sentiment"
      },
      "marketImpact": {
        "shortTerm": "positive/negative/neutral",
        "longTerm": "positive/negative/neutral",
        "sectors": [
          { "sector": "Sector name", "impact": "positive/negative/neutral", "reason": "Brief explanation" }
        ],
        "commentary": "Brief commentary on market impact"
      },
      "keyTakeaways": [
        "Key takeaway 1",
        "Key takeaway 2"
      ],
      "articleAnalysis": [
        {
          "id": "article-id",
          "title": "Article title",
          "sentiment": "positive/negative/neutral",
          "impactLevel": "high/medium/low",
          "keyPoints": ["Key point 1", "Key point 2"]
        }
      ]
    }
  `;
  
  try {
    const messages = [
      {
        role: 'system' as const,
        content: 'You are a financial news analyst providing sentiment analysis and market impact assessment based on financial news. Your analysis should be objective, data-driven, and nuanced. Return only a valid JSON object with your analysis.'
      },
      {
        role: 'user' as const,
        content: analysisPrompt
      }
    ];
    
    const response = await perplexityService.callPerplexityAPI(messages, {
      temperature: 0.2,
      model: LangGraphConfig.perplexity.defaultModel,
    });
    
    const analysisContent = response.choices[0]?.message?.content || '';
    
    // Extract JSON from the response
    let jsonData: any = {};
    try {
      // Try to parse the entire response as JSON first
      jsonData = JSON.parse(analysisContent);
    } catch (e) {
      // If that fails, try to extract JSON using regex
      const jsonMatch = analysisContent.match(/```json\n([\s\S]*)\n```/) || 
                        analysisContent.match(/```\n([\s\S]*)\n```/) ||
                        analysisContent.match(/\{[\s\S]*\}/);
                        
      if (jsonMatch) {
        jsonData = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      } else {
        throw new Error('Failed to extract JSON from analysis content');
      }
    }
    
    // Update metrics in state
    state.nodes[state.currentNode!].metrics = {
      ...state.nodes[state.currentNode!].metrics,
      tokenUsage: {
        promptTokens: analysisPrompt.length / 4,
        completionTokens: analysisContent.length / 4,
        totalTokens: (analysisPrompt.length + analysisContent.length) / 4,
      },
    };
    
    // Add metadata
    return {
      ...jsonData,
      _metadata: {
        id: uuidv4(),
        type: 'news_sentiment_analysis',
        source: 'langgraph_analysis',
        processingTimestamp: new Date().toISOString(),
        baseDataId: input._metadata?.id,
      }
    };
  } catch (error) {
    console.error('Error in analyzeMarketNewsSentiment:', error);
    
    // Return a minimal result on error
    return {
      topic: input.topic || "Financial markets",
      overallSentiment: {
        sentiment: "neutral",
        confidence: "low",
        rationale: "Analysis failed to complete due to an error."
      },
      keyTakeaways: [
        "Analysis was unable to complete successfully."
      ],
      _metadata: {
        id: uuidv4(),
        type: 'news_sentiment_analysis',
        source: 'langgraph_analysis',
        processingTimestamp: new Date().toISOString(),
        error: 'Failed to complete analysis',
        fallback: true,
      }
    };
  }
};

/**
 * Generates financial recommendations based on insights
 */
export const generateFinancialRecommendations: NodeHandler = async (input: any, state: GraphState) => {
  console.log('Running generateFinancialRecommendations handler');
  
  if (!input) {
    throw new Error('No financial insights provided for recommendations');
  }
  
  // Convert the input to JSON string for the prompt
  const insightsDataJson = JSON.stringify(input, null, 2);
  
  // Create an analysis prompt
  const analysisPrompt = `
    Based on the following financial insights, generate actionable recommendations:
    
    ${insightsDataJson}
    
    Provide strategic recommendations for investors, traders, or financial advisors.
    Focus on clear, actionable steps supported by the data.
    
    Return ONLY valid JSON (no markdown code blocks or explanations) with the following structure:
    {
      "topic": "Financial topic",
      "summary": "Brief summary of the situation",
      "recommendations": [
        {
          "title": "Recommendation title",
          "description": "Detailed description",
          "timeframe": "Immediate/Short-term/Medium-term/Long-term",
          "riskLevel": "Low/Moderate/High",
          "potentialOutcome": "Expected outcome if followed",
          "alternatives": ["Alternative approach 1", "Alternative approach 2"]
        }
      ],
      "prioritizedActions": [
        "Most important action 1",
        "Most important action 2"
      ],
      "considerations": [
        "Important consideration 1",
        "Important consideration 2"
      ],
      "disclaimer": "Appropriate disclaimer about financial advice"
    }
  `;
  
  try {
    const messages = [
      {
        role: 'system' as const,
        content: 'You are a financial advisor generating recommendations based on financial insights. Your recommendations should be clear, actionable, and appropriate for the context. Return only a valid JSON object with your recommendations.'
      },
      {
        role: 'user' as const,
        content: analysisPrompt
      }
    ];
    
    const response = await perplexityService.callPerplexityAPI(messages, {
      temperature: 0.3,
      model: LangGraphConfig.perplexity.defaultModel,
    });
    
    const recommendationsContent = response.choices[0]?.message?.content || '';
    
    // Extract JSON from the response
    let jsonData: any = {};
    try {
      // Try to parse the entire response as JSON first
      jsonData = JSON.parse(recommendationsContent);
    } catch (e) {
      // If that fails, try to extract JSON using regex
      const jsonMatch = recommendationsContent.match(/```json\n([\s\S]*)\n```/) || 
                        recommendationsContent.match(/```\n([\s\S]*)\n```/) ||
                        recommendationsContent.match(/\{[\s\S]*\}/);
                        
      if (jsonMatch) {
        jsonData = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      } else {
        throw new Error('Failed to extract JSON from recommendations content');
      }
    }
    
    // Update metrics in state
    state.nodes[state.currentNode!].metrics = {
      ...state.nodes[state.currentNode!].metrics,
      tokenUsage: {
        promptTokens: analysisPrompt.length / 4,
        completionTokens: recommendationsContent.length / 4,
        totalTokens: (analysisPrompt.length + recommendationsContent.length) / 4,
      },
    };
    
    // Add metadata
    return {
      ...jsonData,
      _metadata: {
        id: uuidv4(),
        type: 'financial_recommendations',
        source: 'langgraph_analysis',
        processingTimestamp: new Date().toISOString(),
        baseDataId: input._metadata?.id,
      }
    };
  } catch (error) {
    console.error('Error in generateFinancialRecommendations:', error);
    
    // Return a minimal result on error
    return {
      topic: input.topic || "Financial insights",
      summary: "Analysis could not be completed successfully.",
      recommendations: [
        {
          title: "Seek additional information",
          description: "The current data was insufficient to generate detailed recommendations.",
          timeframe: "Immediate",
          riskLevel: "Low",
        }
      ],
      disclaimer: "This represents a fallback recommendation due to processing errors. It should not be considered financial advice.",
      _metadata: {
        id: uuidv4(),
        type: 'financial_recommendations',
        source: 'langgraph_analysis',
        processingTimestamp: new Date().toISOString(),
        error: 'Failed to generate recommendations',
        fallback: true,
      }
    };
  }
};