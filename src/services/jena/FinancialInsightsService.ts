/**
 * Financial Insights Service
 * Provides functionality to retrieve and manage financial insights from Jena
 */

import jenaClient, { SparqlResults } from './JenaClient';
import { langGraphService } from '../langgraph';

/**
 * Financial Insight interface
 */
export interface FinancialInsight {
  id: string;
  topic: string;
  summary: string;
  timestamp: string;
  keyTrends?: Array<{
    trend: string;
    impact: string;
  }>;
  metrics?: Array<{
    name: string;
    value: string;
    unit: string;
    trend: 'up' | 'down' | 'stable';
  }>;
  risks?: Array<{
    risk: string;
    severity: 'high' | 'medium' | 'low';
    mitigation?: string;
  }>;
  opportunities?: Array<{
    opportunity: string;
    potential: 'high' | 'medium' | 'low';
    timeframe: 'short' | 'medium' | 'long-term';
  }>;
}

/**
 * Financial Recommendation interface
 */
export interface FinancialRecommendation {
  id: string;
  topic: string;
  summary: string;
  recommendations: Array<{
    title: string;
    description: string;
    timeframe: 'Immediate' | 'Short-term' | 'Medium-term' | 'Long-term';
    riskLevel: 'Low' | 'Moderate' | 'High';
    potentialOutcome?: string;
    alternatives?: string[];
  }>;
  prioritizedActions?: string[];
  considerations?: string[];
  timestamp: string;
}

/**
 * Financial Insights Service
 */
export class FinancialInsightsService {
  /**
   * Get financial insights by topic
   */
  public async getInsightsByTopic(
    topic: string,
    options?: {
      limit?: number;
      offset?: number;
    }
  ): Promise<FinancialInsight[]> {
    const limit = options?.limit || 5;
    const offset = options?.offset || 0;
    
    try {
      // Construct SPARQL query for getting financial insights
      const query = `
        PREFIX scb: <http://scb.com/ontology#>
        PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
        
        SELECT *
        WHERE {
          ?id a scb:FinancialInsight ;
             scb:hasTopic ?topic ;
             scb:hasSummary ?summary ;
             scb:hasTimestamp ?timestamp .
          
          FILTER(CONTAINS(LCASE(?topic), LCASE("${topic}")))
          
          # Key trends
          OPTIONAL {
            ?id scb:hasTrend ?trendNode .
            ?trendNode scb:hasTrendDescription ?trend ;
                      scb:hasTrendImpact ?impact .
          }
          
          # Metrics
          OPTIONAL {
            ?id scb:hasMetric ?metricNode .
            ?metricNode scb:hasMetricName ?metricName ;
                       scb:hasMetricValue ?metricValue ;
                       scb:hasMetricUnit ?metricUnit ;
                       scb:hasMetricTrend ?metricTrend .
          }
          
          # Risks
          OPTIONAL {
            ?id scb:hasRisk ?riskNode .
            ?riskNode scb:hasRiskDescription ?risk ;
                     scb:hasRiskSeverity ?severity .
            OPTIONAL { ?riskNode scb:hasRiskMitigation ?mitigation }
          }
          
          # Opportunities
          OPTIONAL {
            ?id scb:hasOpportunity ?opportunityNode .
            ?opportunityNode scb:hasOpportunityDescription ?opportunity ;
                           scb:hasOpportunityPotential ?potential ;
                           scb:hasOpportunityTimeframe ?timeframe .
          }
        }
        ORDER BY DESC(xsd:dateTime(?timestamp))
        LIMIT ${limit}
        OFFSET ${offset}
      `;
      
      // Execute the query
      const result = await jenaClient.select(query);
      
      // Transform SPARQL results to FinancialInsight objects
      return this.transformInsightResults(result);
    } catch (error) {
      console.error('Error getting financial insights:', error);
      
      // If Jena query fails, fall back to Perplexity
      return this.fallbackGetInsights(topic);
    }
  }
  
  /**
   * Get financial recommendations
   */
  public async getRecommendationsByTopic(
    topic: string,
    options?: {
      limit?: number;
      offset?: number;
    }
  ): Promise<FinancialRecommendation[]> {
    const limit = options?.limit || 3;
    const offset = options?.offset || 0;
    
    try {
      // Construct SPARQL query for getting recommendations
      const query = `
        PREFIX scb: <http://scb.com/ontology#>
        PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
        
        SELECT *
        WHERE {
          ?id a scb:FinancialRecommendation ;
             scb:hasTopic ?topic ;
             scb:hasSummary ?summary ;
             scb:hasTimestamp ?timestamp .
          
          FILTER(CONTAINS(LCASE(?topic), LCASE("${topic}")))
          
          # Recommendations
          OPTIONAL {
            ?id scb:hasRecommendation ?recNode .
            ?recNode scb:hasTitle ?recTitle ;
                    scb:hasDescription ?recDescription ;
                    scb:hasTimeframe ?recTimeframe ;
                    scb:hasRiskLevel ?recRiskLevel .
            OPTIONAL { ?recNode scb:hasPotentialOutcome ?recOutcome }
          }
          
          # Alternatives for recommendations
          OPTIONAL {
            ?recNode scb:hasAlternative ?alternative .
          }
          
          # Prioritized actions
          OPTIONAL {
            ?id scb:hasPrioritizedAction ?action .
          }
          
          # Considerations
          OPTIONAL {
            ?id scb:hasConsideration ?consideration .
          }
        }
        ORDER BY DESC(xsd:dateTime(?timestamp))
        LIMIT ${limit}
        OFFSET ${offset}
      `;
      
      // Execute the query
      const result = await jenaClient.select(query);
      
      // Transform SPARQL results to FinancialRecommendation objects
      return this.transformRecommendationResults(result);
    } catch (error) {
      console.error('Error getting financial recommendations:', error);
      
      // If Jena query fails, fall back to Perplexity
      return this.fallbackGetRecommendations(topic);
    }
  }
  
  /**
   * Refresh financial insights by triggering the LangGraph pipeline
   */
  public async refreshFinancialInsights(topic: string): Promise<{ success: boolean; message: string }> {
    try {
      // Trigger LangGraph pipeline to refresh financial insights
      const pipelineResult = await langGraphService.processFinancialInsights(topic);
      
      if (pipelineResult.status === 'completed') {
        return {
          success: true,
          message: `Successfully refreshed financial insights for ${topic}`,
        };
      } else {
        return {
          success: false,
          message: `Failed to refresh financial insights for ${topic}: ${pipelineResult.error || 'Unknown error'}`,
        };
      }
    } catch (error) {
      console.error('Error refreshing financial insights:', error);
      return {
        success: false,
        message: `Error refreshing financial insights for ${topic}: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }
  
  /**
   * Transform SPARQL insight results to FinancialInsight objects
   */
  private transformInsightResults(result: SparqlResults): FinancialInsight[] {
    if (result.results.bindings.length === 0) {
      return [];
    }
    
    // Group bindings by insight ID
    const insightsMap = new Map<string, FinancialInsight>();
    
    // Process each binding
    for (const binding of result.results.bindings) {
      const id = binding.id.value;
      
      // Create a new insight if we haven't seen this ID yet
      if (!insightsMap.has(id)) {
        insightsMap.set(id, {
          id,
          topic: binding.topic.value,
          summary: binding.summary.value,
          timestamp: binding.timestamp.value,
          keyTrends: [],
          metrics: [],
          risks: [],
          opportunities: [],
        });
      }
      
      const insight = insightsMap.get(id)!;
      
      // Add trend if available and not already added
      if (binding.trend && binding.impact) {
        const trendExists = insight.keyTrends!.some(t => 
          t.trend === binding.trend.value && t.impact === binding.impact.value
        );
        
        if (!trendExists) {
          insight.keyTrends!.push({
            trend: binding.trend.value,
            impact: binding.impact.value,
          });
        }
      }
      
      // Add metric if available and not already added
      if (binding.metricName && binding.metricValue && binding.metricUnit && binding.metricTrend) {
        const metricExists = insight.metrics!.some(m => 
          m.name === binding.metricName.value && 
          m.value === binding.metricValue.value &&
          m.unit === binding.metricUnit.value
        );
        
        if (!metricExists) {
          insight.metrics!.push({
            name: binding.metricName.value,
            value: binding.metricValue.value,
            unit: binding.metricUnit.value,
            trend: binding.metricTrend.value as 'up' | 'down' | 'stable',
          });
        }
      }
      
      // Add risk if available and not already added
      if (binding.risk && binding.severity) {
        const riskExists = insight.risks!.some(r => 
          r.risk === binding.risk.value && r.severity === binding.severity.value
        );
        
        if (!riskExists) {
          insight.risks!.push({
            risk: binding.risk.value,
            severity: binding.severity.value as 'high' | 'medium' | 'low',
            mitigation: binding.mitigation?.value,
          });
        }
      }
      
      // Add opportunity if available and not already added
      if (binding.opportunity && binding.potential && binding.timeframe) {
        const opportunityExists = insight.opportunities!.some(o => 
          o.opportunity === binding.opportunity.value && 
          o.potential === binding.potential.value
        );
        
        if (!opportunityExists) {
          insight.opportunities!.push({
            opportunity: binding.opportunity.value,
            potential: binding.potential.value as 'high' | 'medium' | 'low',
            timeframe: binding.timeframe.value as 'short' | 'medium' | 'long-term',
          });
        }
      }
    }
    
    // Clean up empty arrays
    for (const insight of insightsMap.values()) {
      if (insight.keyTrends!.length === 0) delete insight.keyTrends;
      if (insight.metrics!.length === 0) delete insight.metrics;
      if (insight.risks!.length === 0) delete insight.risks;
      if (insight.opportunities!.length === 0) delete insight.opportunities;
    }
    
    // Convert map to array and sort by timestamp (newest first)
    return Array.from(insightsMap.values())
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }
  
  /**
   * Transform SPARQL recommendation results to FinancialRecommendation objects
   */
  private transformRecommendationResults(result: SparqlResults): FinancialRecommendation[] {
    if (result.results.bindings.length === 0) {
      return [];
    }
    
    // Group bindings by recommendation ID
    const recommendationsMap = new Map<string, FinancialRecommendation>();
    
    // Helper map to track recommendation alternatives
    const alternativesMap = new Map<string, string[]>();
    
    // Process each binding
    for (const binding of result.results.bindings) {
      const id = binding.id.value;
      
      // Create a new recommendation if we haven't seen this ID yet
      if (!recommendationsMap.has(id)) {
        recommendationsMap.set(id, {
          id,
          topic: binding.topic.value,
          summary: binding.summary.value,
          timestamp: binding.timestamp.value,
          recommendations: [],
          prioritizedActions: [],
          considerations: [],
        });
      }
      
      const recommendation = recommendationsMap.get(id)!;
      
      // Add recommendation if available
      if (binding.recNode && binding.recTitle && binding.recDescription && 
          binding.recTimeframe && binding.recRiskLevel) {
        
        const recNodeId = binding.recNode.value;
        const recExists = recommendation.recommendations.some(r => 
          r.title === binding.recTitle.value && r.description === binding.recDescription.value
        );
        
        if (!recExists) {
          const rec = {
            title: binding.recTitle.value,
            description: binding.recDescription.value,
            timeframe: binding.recTimeframe.value as 'Immediate' | 'Short-term' | 'Medium-term' | 'Long-term',
            riskLevel: binding.recRiskLevel.value as 'Low' | 'Moderate' | 'High',
            potentialOutcome: binding.recOutcome?.value,
            alternatives: [],
          };
          
          recommendation.recommendations.push(rec);
          
          // Initialize alternatives tracking
          if (!alternativesMap.has(recNodeId)) {
            alternativesMap.set(recNodeId, []);
          }
        }
        
        // Add alternative if available
        if (binding.alternative) {
          const alternatives = alternativesMap.get(recNodeId) || [];
          if (!alternatives.includes(binding.alternative.value)) {
            alternatives.push(binding.alternative.value);
          }
          alternativesMap.set(recNodeId, alternatives);
        }
      }
      
      // Add prioritized action if available
      if (binding.action) {
        if (!recommendation.prioritizedActions!.includes(binding.action.value)) {
          recommendation.prioritizedActions!.push(binding.action.value);
        }
      }
      
      // Add consideration if available
      if (binding.consideration) {
        if (!recommendation.considerations!.includes(binding.consideration.value)) {
          recommendation.considerations!.push(binding.consideration.value);
        }
      }
    }
    
    // Attach alternatives to their respective recommendations
    for (const recommendation of recommendationsMap.values()) {
      for (let i = 0; i < recommendation.recommendations.length; i++) {
        const rec = recommendation.recommendations[i];
        const recNodeId = result.results.bindings.find(b => 
          b.recTitle?.value === rec.title && b.recDescription?.value === rec.description
        )?.recNode?.value;
        
        if (recNodeId) {
          const alternatives = alternativesMap.get(recNodeId);
          if (alternatives && alternatives.length > 0) {
            rec.alternatives = alternatives;
          } else {
            delete rec.alternatives;
          }
        }
      }
    }
    
    // Clean up empty arrays
    for (const recommendation of recommendationsMap.values()) {
      if (recommendation.prioritizedActions!.length === 0) delete recommendation.prioritizedActions;
      if (recommendation.considerations!.length === 0) delete recommendation.considerations;
    }
    
    // Convert map to array and sort by timestamp (newest first)
    return Array.from(recommendationsMap.values())
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }
  
  /**
   * Fallback method to get insights using Perplexity
   */
  private async fallbackGetInsights(topic: string): Promise<FinancialInsight[]> {
    try {
      // Trigger the financial insights pipeline
      const pipelineResult = await langGraphService.processFinancialInsights(topic);
      
      if (pipelineResult.status !== 'completed' || !pipelineResult.outputs) {
        return [];
      }
      
      // Extract insights from pipeline output
      const insightData = pipelineResult.outputs;
      
      // Create a FinancialInsight object
      const insight: FinancialInsight = {
        id: `insight:${topic.replace(/\s+/g, '_').toLowerCase()}:${Date.now()}`,
        topic: insightData.topic || topic,
        summary: insightData.summary || `Financial insights for ${topic}`,
        timestamp: new Date().toISOString(),
      };
      
      // Add key trends if available
      if (insightData.keyTrends && Array.isArray(insightData.keyTrends) && insightData.keyTrends.length > 0) {
        insight.keyTrends = insightData.keyTrends.map((trend: any) => ({
          trend: trend.trend,
          impact: trend.impact,
        }));
      }
      
      // Add metrics if available
      if (insightData.metrics && Array.isArray(insightData.metrics) && insightData.metrics.length > 0) {
        insight.metrics = insightData.metrics.map((metric: any) => ({
          name: metric.name,
          value: metric.value,
          unit: metric.unit || '',
          trend: metric.trend || 'stable',
        }));
      }
      
      // Add risks if available
      if (insightData.risks && Array.isArray(insightData.risks) && insightData.risks.length > 0) {
        insight.risks = insightData.risks.map((risk: any) => ({
          risk: risk.risk,
          severity: risk.severity || 'medium',
          mitigation: risk.mitigation,
        }));
      }
      
      // Add opportunities if available
      if (insightData.opportunities && Array.isArray(insightData.opportunities) && insightData.opportunities.length > 0) {
        insight.opportunities = insightData.opportunities.map((opportunity: any) => ({
          opportunity: opportunity.opportunity,
          potential: opportunity.potential || 'medium',
          timeframe: opportunity.timeframe || 'medium',
        }));
      }
      
      return [insight];
    } catch (error) {
      console.error('Error in fallback get insights:', error);
      return [];
    }
  }
  
  /**
   * Fallback method to get recommendations using Perplexity
   */
  private async fallbackGetRecommendations(topic: string): Promise<FinancialRecommendation[]> {
    try {
      // First get insights
      const insights = await this.fallbackGetInsights(topic);
      
      if (insights.length === 0) {
        return [];
      }
      
      // Then trigger the recommendations pipeline using the insight
      const pipelineResult = await langGraphService.executePipeline({
        graphId: 'financial_insights_graph',
        inputs: insights[0],
      });
      
      if (pipelineResult.status !== 'completed' || !pipelineResult.outputs) {
        return [];
      }
      
      // Extract recommendations from pipeline output
      const recData = pipelineResult.outputs;
      
      // Create a FinancialRecommendation object
      const recommendation: FinancialRecommendation = {
        id: `recommendation:${topic.replace(/\s+/g, '_').toLowerCase()}:${Date.now()}`,
        topic: recData.topic || topic,
        summary: recData.summary || `Recommendations for ${topic}`,
        recommendations: [],
        timestamp: new Date().toISOString(),
      };
      
      // Add recommendations if available
      if (recData.recommendations && Array.isArray(recData.recommendations)) {
        recommendation.recommendations = recData.recommendations.map((rec: any) => ({
          title: rec.title,
          description: rec.description,
          timeframe: rec.timeframe || 'Medium-term',
          riskLevel: rec.riskLevel || 'Moderate',
          potentialOutcome: rec.potentialOutcome,
          alternatives: rec.alternatives && Array.isArray(rec.alternatives) ? rec.alternatives : undefined,
        }));
      }
      
      // Add prioritized actions if available
      if (recData.prioritizedActions && Array.isArray(recData.prioritizedActions)) {
        recommendation.prioritizedActions = recData.prioritizedActions;
      }
      
      // Add considerations if available
      if (recData.considerations && Array.isArray(recData.considerations)) {
        recommendation.considerations = recData.considerations;
      }
      
      return [recommendation];
    } catch (error) {
      console.error('Error in fallback get recommendations:', error);
      return [];
    }
  }
}

// Export a singleton instance for use throughout the application
export const financialInsightsService = new FinancialInsightsService();
export default financialInsightsService;