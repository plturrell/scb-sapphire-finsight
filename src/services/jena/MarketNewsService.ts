/**
 * Market News Service
 * Provides functionality to retrieve and manage market news from Jena
 */

import jenaClient, { SparqlResults } from './JenaClient';
import { langGraphService } from '../langgraph';

/**
 * News Article interface
 */
export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  category: string;
  source: string;
  timestamp: string;
  impact?: 'positive' | 'negative' | 'neutral';
  relevance?: 'high' | 'medium' | 'low';
  url?: string;
}

/**
 * News Analysis interface
 */
export interface NewsAnalysis {
  topic: string;
  overallSentiment: {
    sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
    confidence: 'high' | 'medium' | 'low';
    rationale: string;
  };
  marketImpact?: {
    shortTerm?: 'positive' | 'negative' | 'neutral';
    longTerm?: 'positive' | 'negative' | 'neutral';
    sectors?: Array<{
      sector: string;
      impact: 'positive' | 'negative' | 'neutral';
      reason: string;
    }>;
    commentary?: string;
  };
  keyTakeaways?: string[];
  articleAnalysis?: Array<{
    id: string;
    title: string;
    sentiment: 'positive' | 'negative' | 'neutral';
    impactLevel: 'high' | 'medium' | 'low';
    keyPoints: string[];
  }>;
}

/**
 * Market News Service
 */
export class MarketNewsService {
  /**
   * Get latest news articles
   */
  public async getLatestNews(
    options?: {
      topic?: string;
      category?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<NewsArticle[]> {
    const topic = options?.topic || 'financial markets';
    const limit = options?.limit || 10;
    const offset = options?.offset || 0;
    
    try {
      // Construct SPARQL query for getting latest news
      let query = `
        PREFIX scb: <http://scb.com/ontology#>
        PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
        
        SELECT ?id ?title ?summary ?category ?source ?timestamp ?impact ?relevance ?url
        WHERE {
          ?id a scb:NewsArticle ;
             scb:hasTitle ?title ;
             scb:hasSummary ?summary ;
             scb:hasTimestamp ?timestamp .
          OPTIONAL { ?id scb:hasCategory ?category }
          OPTIONAL { ?id scb:hasSource ?source }
          OPTIONAL { ?id scb:hasImpact ?impact }
          OPTIONAL { ?id scb:hasRelevance ?relevance }
          OPTIONAL { ?id scb:hasUrl ?url }
      `;
      
      // Add topic filter if specified
      if (topic !== 'financial markets') {
        query += `
          ?id scb:hasTopic ?topic .
          FILTER(CONTAINS(LCASE(?topic), LCASE("${topic}")))
        `;
      }
      
      // Add category filter if specified
      if (options?.category) {
        query += `
          FILTER(CONTAINS(LCASE(?category), LCASE("${options.category}")))
        `;
      }
      
      // Close the query and add ordering, limit, and offset
      query += `
        }
        ORDER BY DESC(xsd:dateTime(?timestamp))
        LIMIT ${limit}
        OFFSET ${offset}
      `;
      
      // Execute the query
      const result = await jenaClient.select(query);
      
      // Transform SPARQL results to NewsArticle objects
      return this.transformNewsResults(result);
    } catch (error) {
      console.error('Error getting latest news:', error);
      
      // If Jena query fails, fall back to Perplexity
      return this.fallbackGetLatestNews(topic, limit);
    }
  }
  
  /**
   * Get news analysis
   */
  public async getNewsAnalysis(topic: string): Promise<NewsAnalysis | null> {
    try {
      // Construct SPARQL query for getting news analysis
      const query = `
        PREFIX scb: <http://scb.com/ontology#>
        PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
        
        SELECT *
        WHERE {
          ?id a scb:NewsAnalysis ;
             scb:hasTopic ?topic ;
             scb:hasOverallSentiment ?overallSentiment ;
             scb:hasConfidence ?confidence ;
             scb:hasRationale ?rationale .
          
          FILTER(CONTAINS(LCASE(?topic), LCASE("${topic}")))
          
          OPTIONAL { ?id scb:hasShortTermImpact ?shortTermImpact }
          OPTIONAL { ?id scb:hasLongTermImpact ?longTermImpact }
          OPTIONAL { ?id scb:hasCommentary ?commentary }
          
          # Key takeaways
          OPTIONAL { ?id scb:hasTakeaway ?takeaway }
          
          # Sector impacts
          OPTIONAL {
            ?id scb:hasSectorImpact ?sectorImpact .
            ?sectorImpact scb:hasSector ?sector ;
                         scb:hasImpact ?sectorImpactType ;
                         scb:hasReason ?sectorReason .
          }
          
          # Article analysis
          OPTIONAL {
            ?id scb:hasArticleAnalysis ?articleAnalysis .
            ?articleAnalysis scb:hasArticleId ?articleId ;
                           scb:hasArticleTitle ?articleTitle ;
                           scb:hasSentiment ?articleSentiment ;
                           scb:hasImpactLevel ?articleImpactLevel .
            OPTIONAL { ?articleAnalysis scb:hasKeyPoint ?keyPoint }
          }
        }
        ORDER BY DESC(xsd:dateTime(?timestamp))
        LIMIT 1
      `;
      
      // Execute the query
      const result = await jenaClient.select(query);
      
      // Transform SPARQL results to NewsAnalysis object
      return this.transformAnalysisResults(result);
    } catch (error) {
      console.error('Error getting news analysis:', error);
      
      // If Jena query fails, fall back to Perplexity
      return this.fallbackGetNewsAnalysis(topic);
    }
  }
  
  /**
   * Refresh market news by triggering the LangGraph pipeline
   */
  public async refreshMarketNews(topic: string = 'financial markets'): Promise<{ success: boolean; message: string }> {
    try {
      // Trigger LangGraph pipeline to refresh market news
      const pipelineResult = await langGraphService.processMarketNews(topic);
      
      if (pipelineResult.status === 'completed') {
        return {
          success: true,
          message: `Successfully refreshed market news for ${topic}`,
        };
      } else {
        return {
          success: false,
          message: `Failed to refresh market news for ${topic}: ${pipelineResult.error || 'Unknown error'}`,
        };
      }
    } catch (error) {
      console.error('Error refreshing market news:', error);
      return {
        success: false,
        message: `Error refreshing market news for ${topic}: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }
  
  /**
   * Transform SPARQL news results to NewsArticle objects
   */
  private transformNewsResults(result: SparqlResults): NewsArticle[] {
    const articles: NewsArticle[] = [];
    
    for (const binding of result.results.bindings) {
      articles.push({
        id: binding.id.value,
        title: binding.title.value,
        summary: binding.summary.value,
        category: binding.category?.value || 'General',
        source: binding.source?.value || 'Financial News',
        timestamp: binding.timestamp.value,
        impact: (binding.impact?.value || 'neutral') as 'positive' | 'negative' | 'neutral',
        relevance: (binding.relevance?.value || 'medium') as 'high' | 'medium' | 'low',
        url: binding.url?.value,
      });
    }
    
    return articles;
  }
  
  /**
   * Transform SPARQL analysis results to NewsAnalysis object
   */
  private transformAnalysisResults(result: SparqlResults): NewsAnalysis | null {
    if (result.results.bindings.length === 0) {
      return null;
    }
    
    // Extract basic analysis information from the first binding
    const binding = result.results.bindings[0];
    
    const analysis: NewsAnalysis = {
      topic: binding.topic.value,
      overallSentiment: {
        sentiment: (binding.overallSentiment.value || 'neutral') as 'positive' | 'negative' | 'neutral' | 'mixed',
        confidence: (binding.confidence.value || 'medium') as 'high' | 'medium' | 'low',
        rationale: binding.rationale.value,
      },
    };
    
    // Add market impact if available
    if (binding.shortTermImpact || binding.longTermImpact || binding.commentary) {
      analysis.marketImpact = {};
      
      if (binding.shortTermImpact) {
        analysis.marketImpact.shortTerm = binding.shortTermImpact.value as 'positive' | 'negative' | 'neutral';
      }
      
      if (binding.longTermImpact) {
        analysis.marketImpact.longTerm = binding.longTermImpact.value as 'positive' | 'negative' | 'neutral';
      }
      
      if (binding.commentary) {
        analysis.marketImpact.commentary = binding.commentary.value;
      }
    }
    
    // Extract key takeaways (may be multiple bindings)
    analysis.keyTakeaways = [];
    for (const b of result.results.bindings) {
      if (b.takeaway && !analysis.keyTakeaways.includes(b.takeaway.value)) {
        analysis.keyTakeaways.push(b.takeaway.value);
      }
    }
    
    // Extract sector impacts (may be multiple bindings)
    const sectors: Map<string, {
      sector: string;
      impact: 'positive' | 'negative' | 'neutral';
      reason: string;
    }> = new Map();
    
    for (const b of result.results.bindings) {
      if (b.sector && b.sectorImpactType && b.sectorReason) {
        sectors.set(b.sector.value, {
          sector: b.sector.value,
          impact: b.sectorImpactType.value as 'positive' | 'negative' | 'neutral',
          reason: b.sectorReason.value,
        });
      }
    }
    
    if (sectors.size > 0) {
      if (!analysis.marketImpact) {
        analysis.marketImpact = {};
      }
      
      analysis.marketImpact.sectors = Array.from(sectors.values());
    }
    
    // Extract article analysis (may be multiple bindings)
    const articleAnalysisMap: Map<string, {
      id: string;
      title: string;
      sentiment: 'positive' | 'negative' | 'neutral';
      impactLevel: 'high' | 'medium' | 'low';
      keyPoints: string[];
    }> = new Map();
    
    for (const b of result.results.bindings) {
      if (b.articleId && b.articleTitle && b.articleSentiment && b.articleImpactLevel) {
        const articleId = b.articleId.value;
        
        if (!articleAnalysisMap.has(articleId)) {
          articleAnalysisMap.set(articleId, {
            id: articleId,
            title: b.articleTitle.value,
            sentiment: b.articleSentiment.value as 'positive' | 'negative' | 'neutral',
            impactLevel: b.articleImpactLevel.value as 'high' | 'medium' | 'low',
            keyPoints: [],
          });
        }
        
        if (b.keyPoint) {
          const article = articleAnalysisMap.get(articleId)!;
          if (!article.keyPoints.includes(b.keyPoint.value)) {
            article.keyPoints.push(b.keyPoint.value);
          }
        }
      }
    }
    
    if (articleAnalysisMap.size > 0) {
      analysis.articleAnalysis = Array.from(articleAnalysisMap.values());
    }
    
    return analysis;
  }
  
  /**
   * Fallback method to get latest news using Perplexity
   */
  private async fallbackGetLatestNews(topic: string, limit: number): Promise<NewsArticle[]> {
    try {
      // Trigger the market news pipeline to get data
      const pipelineResult = await langGraphService.processMarketNews(topic, limit);
      
      if (pipelineResult.status !== 'completed' || !pipelineResult.outputs) {
        return [];
      }
      
      // Extract news articles from pipeline output
      const newsData = pipelineResult.outputs;
      
      if (!newsData.articles || !Array.isArray(newsData.articles)) {
        return [];
      }
      
      // Transform to NewsArticle objects
      return newsData.articles.map((article: any) => ({
        id: article.id || `news-${Math.random().toString(36).substring(2, 15)}`,
        title: article.title,
        summary: article.summary,
        category: article.category || 'General',
        source: article.source || 'Financial News',
        timestamp: article.timestamp || new Date().toISOString(),
        impact: article.impact as 'positive' | 'negative' | 'neutral' || 'neutral',
        relevance: article.relevance as 'high' | 'medium' | 'low' || 'medium',
        url: article.url || '#',
      }));
    } catch (error) {
      console.error('Error in fallback get latest news:', error);
      return [];
    }
  }
  
  /**
   * Fallback method to get news analysis using Perplexity
   */
  private async fallbackGetNewsAnalysis(topic: string): Promise<NewsAnalysis | null> {
    try {
      // First get the latest news
      const articles = await this.fallbackGetLatestNews(topic, 5);
      
      if (articles.length === 0) {
        return null;
      }
      
      // Then trigger the sentiment analysis pipeline
      const newsData = {
        topic,
        articles,
      };
      
      // Use direct access to the analyze handler
      const pipelineResult = await langGraphService.executePipeline({
        graphId: 'market_news_graph',
        inputs: newsData,
      });
      
      if (pipelineResult.status !== 'completed' || !pipelineResult.outputs) {
        return null;
      }
      
      // Extract sentiment analysis from pipeline output
      const analysisData = pipelineResult.outputs;
      
      // Create a NewsAnalysis object
      const analysis: NewsAnalysis = {
        topic: analysisData.topic || topic,
        overallSentiment: {
          sentiment: analysisData.overallSentiment?.sentiment || 'neutral',
          confidence: analysisData.overallSentiment?.confidence || 'medium',
          rationale: analysisData.overallSentiment?.rationale || 'Insufficient data for detailed analysis',
        },
      };
      
      // Add market impact if available
      if (analysisData.marketImpact) {
        analysis.marketImpact = {
          shortTerm: analysisData.marketImpact.shortTerm,
          longTerm: analysisData.marketImpact.longTerm,
          commentary: analysisData.marketImpact.commentary,
        };
        
        // Add sectors if available
        if (analysisData.marketImpact.sectors && Array.isArray(analysisData.marketImpact.sectors)) {
          analysis.marketImpact.sectors = analysisData.marketImpact.sectors;
        }
      }
      
      // Add key takeaways if available
      if (analysisData.keyTakeaways && Array.isArray(analysisData.keyTakeaways)) {
        analysis.keyTakeaways = analysisData.keyTakeaways;
      }
      
      // Add article analysis if available
      if (analysisData.articleAnalysis && Array.isArray(analysisData.articleAnalysis)) {
        analysis.articleAnalysis = analysisData.articleAnalysis;
      }
      
      return analysis;
    } catch (error) {
      console.error('Error in fallback get news analysis:', error);
      return null;
    }
  }
}

// Export a singleton instance for use throughout the application
export const marketNewsService = new MarketNewsService();
export default marketNewsService;