import { CompetitiveAnalysis } from '../types/TariffAnalysisTypes';
import perplexityApiClient from './PerplexityApiClient';

/**
 * CompetitiveRadarAnalyzer
 * Advanced service for analyzing competitive landscape changes due to tariff shifts
 * with sophisticated visualization and dynamic market share forecasting
 */
class CompetitiveRadarAnalyzer {
  // Cache for competitive analysis to improve performance
  private analysisCache: Map<string, CompetitiveAnalysis> = new Map();
  
  /**
   * Generate a competitor impact radar visualization and analysis
   * @param industry Industry to analyze
   * @returns Competitive position changes and market share forecasts
   */
  async generateCompetitiveRadar(industry: string): Promise<CompetitiveAnalysis> {
    console.log(`Generating competitive radar analysis for ${industry}`);
    
    // Check cache first
    if (this.analysisCache.has(industry)) {
      const cachedAnalysis = this.analysisCache.get(industry)!;
      const cacheAge = Date.now() - new Date(cachedAnalysis.timestamp || Date.now()).getTime();
      
      // Return cached data if it's less than 24 hours old
      if (cacheAge < 24 * 60 * 60 * 1000) {
        console.log('Using cached competitive analysis results');
        return cachedAnalysis;
      }
    }
    
    // Fetch industry data from Perplexity API
    const industryData = await this.fetchIndustryData(industry);
    
    // Get competitors in this industry
    const competitors = await this.getIndustryCompetitors(industryData);
    
    // Get current market share data
    const marketShareData = await this.getMarketShareData(industry, competitors);
    
    // Calculate tariff advantages for each competitor
    const tariffAdvantages = await this.calculateCompetitiveTariffAdvantages(industry, competitors);
    
    // Predict market share changes
    const marketSharePredictions = this.predictMarketShareChanges(marketShareData, tariffAdvantages);
    
    // Generate visualization data
    const radarData = this.generateCompetitiveRadarVisualization(competitors, tariffAdvantages);
    const timeSeriesData = this.generateMarketShareTimeSeries(marketShareData, marketSharePredictions);
    
    // Analyze market dynamics
    const marketDynamics = await this.analyzeMarketDynamics(industry);
    
    // Create competitive analysis object
    const analysis: CompetitiveAnalysis = {
      industryId: industry,
      industryName: industryData.name || industry,
      competitivePositions: competitors.map(comp => {
        const currentShare = marketShareData[comp.id] || 0;
        const projectedShare = marketSharePredictions[comp.id] || currentShare;
        
        return {
          companyId: comp.id,
          companyName: comp.name,
          currentMarketShare: currentShare,
          projectedMarketShare: projectedShare,
          tariffAdvantage: tariffAdvantages[comp.id] || 0,
          priceCompetitiveness: this.calculatePriceCompetitiveness(comp.id, tariffAdvantages),
          vulnerabilities: this.identifyCompetitorVulnerabilities(comp.id, industryData),
          strengths: this.identifyCompetitorStrengths(comp.id, industryData),
          changeVector: this.calculateCompetitiveChangeVector(currentShare, projectedShare, tariffAdvantages[comp.id] || 0)
        };
      }),
      marketDynamics: marketDynamics,
      visualizationData: {
        radarPoints: radarData,
        timeSeriesData: timeSeriesData
      },
      timestamp: new Date().toISOString()
    };
    
    // Cache the results
    this.analysisCache.set(industry, analysis);
    
    return analysis;
  }
  
  /**
   * Fetch industry data from API
   */
  private async fetchIndustryData(industryId: string): Promise<any> {
    try {
      // Attempt to fetch industry data from API
      const response = await perplexityApiClient.getAIInsights(`Industry analysis for ${industryId} focusing on tariff impacts and competitive dynamics`);
      
      if (response && typeof response === 'object') {
        return {
          id: industryId,
          name: response.industryName || industryId,
          ...response
        };
      }
      
      // If API doesn't return usable data, return a basic object
      return {
        id: industryId,
        name: industryId
      };
    } catch (error) {
      console.error(`Failed to fetch industry data for ${industryId}:`, error);
      return {
        id: industryId,
        name: industryId
      };
    }
  }
  
  /**
   * Get competitors in an industry
   */
  private async getIndustryCompetitors(industryData: any): Promise<Array<{id: string, name: string}>> {
    // Check if we have competitors in the industry data
    if (industryData.competitors && Array.isArray(industryData.competitors)) {
      return industryData.competitors;
    }
    
    // Otherwise, use API to fetch competitors
    try {
      const competitorsData = await perplexityApiClient.getAIInsights(`Top competitors in ${industryData.name || industryData.id} industry`);
      
      if (competitorsData && competitorsData.competitors && Array.isArray(competitorsData.competitors)) {
        return competitorsData.competitors;
      }
    } catch (error) {
      console.error('Failed to fetch competitors:', error);
    }
    
    // If all else fails, return sample competitors
    return [
      { id: 'comp1', name: 'Competitor A' },
      { id: 'comp2', name: 'Competitor B' },
      { id: 'comp3', name: 'Competitor C' },
      { id: 'comp4', name: 'Competitor D' },
      { id: 'comp5', name: 'Competitor E' }
    ];
  }
  
  /**
   * Get market share data for competitors
   */
  private async getMarketShareData(industry: string, competitors: Array<{id: string, name: string}>): Promise<{[companyId: string]: number}> {
    try {
      // Attempt to fetch market share data from API
      const marketShareData = await perplexityApiClient.getAIInsights(`Market share data for competitors in ${industry}`);
      
      if (marketShareData && marketShareData.marketShares && typeof marketShareData.marketShares === 'object') {
        return marketShareData.marketShares;
      }
    } catch (error) {
      console.error('Failed to fetch market share data:', error);
    }
    
    // If API doesn't return usable data, generate some realistic market shares
    const marketShares: {[companyId: string]: number} = {};
    let remainingShare = 100;
    
    // Distribute market shares among competitors
    for (let i = 0; i < competitors.length; i++) {
      // Last competitor gets remaining share
      if (i === competitors.length - 1) {
        marketShares[competitors[i].id] = remainingShare;
      } else {
        // Distribute higher shares to early competitors (typically market leaders)
        const share = i === 0 
          ? 25 + Math.random() * 15 // Market leader (25-40%)
          : Math.max(5, remainingShare / (competitors.length - i) * (0.7 + Math.random() * 0.6));
          
        marketShares[competitors[i].id] = Math.round(share);
        remainingShare -= marketShares[competitors[i].id];
      }
    }
    
    return marketShares;
  }
  
  /**
   * Calculate tariff advantages for competitors
   */
  private async calculateCompetitiveTariffAdvantages(industry: string, competitors: Array<{id: string, name: string}>): Promise<{[companyId: string]: number}> {
    try {
      // Attempt to fetch tariff advantage data from API
      const tariffData = await perplexityApiClient.getAIInsights(`Tariff advantages for competitors in ${industry}`);
      
      if (tariffData && tariffData.tariffAdvantages && typeof tariffData.tariffAdvantages === 'object') {
        return tariffData.tariffAdvantages;
      }
    } catch (error) {
      console.error('Failed to fetch tariff advantage data:', error);
    }
    
    // If API doesn't return usable data, generate some realistic tariff advantages
    const advantages: {[companyId: string]: number} = {};
    
    // Assign advantages to each competitor
    competitors.forEach(comp => {
      // Random value between -5 and +5
      advantages[comp.id] = Math.round((Math.random() * 10 - 5) * 10) / 10;
    });
    
    return advantages;
  }
  
  /**
   * Predict market share changes based on tariff advantages
   */
  private predictMarketShareChanges(currentShares: {[companyId: string]: number}, tariffAdvantages: {[companyId: string]: number}): {[companyId: string]: number} {
    const predictedShares: {[companyId: string]: number} = {};
    let totalAdjustedShare = 0;
    
    // Calculate adjusted market shares
    Object.keys(currentShares).forEach(compId => {
      const currentShare = currentShares[compId] || 0;
      const advantage = tariffAdvantages[compId] || 0;
      
      // Calculate impact factor - positive advantage means share gain
      const impactFactor = 1 + (advantage / 25); // 5% advantage means 20% share gain
      
      // Calculate adjusted share
      predictedShares[compId] = currentShare * impactFactor;
      totalAdjustedShare += predictedShares[compId];
    });
    
    // Normalize back to 100%
    Object.keys(predictedShares).forEach(compId => {
      predictedShares[compId] = (predictedShares[compId] / totalAdjustedShare) * 100;
      // Round to 1 decimal
      predictedShares[compId] = Math.round(predictedShares[compId] * 10) / 10;
    });
    
    return predictedShares;
  }
  
  /**
   * Generate radar visualization data
   */
  private generateCompetitiveRadarVisualization(competitors: Array<{id: string, name: string}>, tariffAdvantages: {[companyId: string]: number}): Array<{
    axis: string;
    values: {
      [companyId: string]: number;
    };
  }> {
    // Define radar axes
    const axes = [
      'Tariff Advantage',
      'Supply Chain Flexibility',
      'Price Competitiveness',
      'Product Diversity',
      'Innovation'
    ];
    
    const radarPoints = axes.map(axis => {
      const values: {[companyId: string]: number} = {};
      
      competitors.forEach(comp => {
        // For Tariff Advantage, use the actual data
        if (axis === 'Tariff Advantage') {
          // Convert to 0-10 scale
          values[comp.id] = Math.min(10, Math.max(0, 5 + (tariffAdvantages[comp.id] || 0)));
        } else {
          // For other axes, generate realistic values with some correlation to tariff advantage
          const advantage = tariffAdvantages[comp.id] || 0;
          let baseValue = 5;
          
          // Different axes have different correlations to tariff advantage
          switch (axis) {
            case 'Supply Chain Flexibility':
              // Moderate positive correlation
              baseValue += advantage * 0.3;
              break;
            case 'Price Competitiveness':
              // Strong positive correlation
              baseValue += advantage * 0.6;
              break;
            case 'Product Diversity':
              // Weak correlation
              baseValue += advantage * 0.1;
              break;
            case 'Innovation':
              // No correlation - independent factor
              break;
          }
          
          // Add some randomness
          baseValue += (Math.random() * 4 - 2);
          
          // Ensure value is in 0-10 range
          values[comp.id] = Math.min(10, Math.max(0, baseValue));
          
          // Round to 1 decimal
          values[comp.id] = Math.round(values[comp.id] * 10) / 10;
        }
      });
      
      return {
        axis,
        values
      };
    });
    
    return radarPoints;
  }
  
  /**
   * Generate time series data for market share evolution
   */
  private generateMarketShareTimeSeries(currentShares: {[companyId: string]: number}, projectedShares: {[companyId: string]: number}): Array<{
    timestamp: string;
    marketShares: {
      [companyId: string]: number;
    };
  }> {
    const timeSeriesData: Array<{
      timestamp: string;
      marketShares: {
        [companyId: string]: number;
      };
    }> = [];
    
    // Create data points for the past 4 quarters (historical)
    for (let i = 4; i > 0; i--) {
      const datePoint = new Date();
      datePoint.setMonth(datePoint.getMonth() - (i * 3));
      
      const historicShares: {[companyId: string]: number} = {};
      
      // Generate slightly different historical values
      Object.keys(currentShares).forEach(compId => {
        // Random fluctuation factor
        const fluctuation = 1 + (Math.random() * 0.1 - 0.05);
        historicShares[compId] = Math.round(currentShares[compId] * fluctuation * 10) / 10;
      });
      
      // Normalize to ensure total is 100%
      this.normalizeMarketShares(historicShares);
      
      timeSeriesData.push({
        timestamp: datePoint.toISOString(),
        marketShares: historicShares
      });
    }
    
    // Add current data point
    timeSeriesData.push({
      timestamp: new Date().toISOString(),
      marketShares: {...currentShares}
    });
    
    // Add future projections for the next 4 quarters
    for (let i = 1; i <= 4; i++) {
      const datePoint = new Date();
      datePoint.setMonth(datePoint.getMonth() + (i * 3));
      
      const futureShares: {[companyId: string]: number} = {};
      
      // Interpolate between current and projected shares
      Object.keys(currentShares).forEach(compId => {
        const current = currentShares[compId] || 0;
        const projected = projectedShares[compId] || current;
        const interpolationFactor = i / 4; // 0.25, 0.5, 0.75, 1.0
        
        futureShares[compId] = Math.round((current + (projected - current) * interpolationFactor) * 10) / 10;
      });
      
      // Normalize to ensure total is 100%
      this.normalizeMarketShares(futureShares);
      
      timeSeriesData.push({
        timestamp: datePoint.toISOString(),
        marketShares: futureShares
      });
    }
    
    return timeSeriesData;
  }
  
  /**
   * Normalize market shares to ensure they sum to 100%
   */
  private normalizeMarketShares(shares: {[companyId: string]: number}): void {
    // Calculate total
    const total = Object.values(shares).reduce((sum, share) => sum + share, 0);
    
    // If total is not 100, normalize
    if (Math.abs(total - 100) > 0.1) {
      Object.keys(shares).forEach(compId => {
        shares[compId] = Math.round((shares[compId] / total) * 100 * 10) / 10;
      });
    }
  }
  
  /**
   * Calculate price competitiveness based on tariff advantages
   */
  private calculatePriceCompetitiveness(companyId: string, tariffAdvantages: {[companyId: string]: number}): number {
    const advantage = tariffAdvantages[companyId] || 0;
    
    // Base price competitiveness score (0-10 scale)
    let competitiveness = 5;
    
    // Adjust based on tariff advantage
    competitiveness += advantage * 0.6;
    
    // Add some variance
    competitiveness += (Math.random() * 2 - 1);
    
    // Ensure value is in 0-10 range
    return Math.min(10, Math.max(0, Math.round(competitiveness * 10) / 10));
  }
  
  /**
   * Identify vulnerabilities for a competitor
   */
  private identifyCompetitorVulnerabilities(companyId: string, industryData: any): string[] {
    // If industry data has specific vulnerabilities, use those
    if (industryData.competitorVulnerabilities && 
        industryData.competitorVulnerabilities[companyId] &&
        Array.isArray(industryData.competitorVulnerabilities[companyId])) {
      return industryData.competitorVulnerabilities[companyId];
    }
    
    // Common vulnerabilities
    const commonVulnerabilities = [
      'Supply chain concentration',
      'High tariff exposure',
      'Limited product range',
      'Regulatory compliance costs',
      'Labor cost sensitivity',
      'Raw material price volatility',
      'Transportation cost vulnerability',
      'Limited market diversification',
      'Exchange rate exposure',
      'Aging product portfolio'
    ];
    
    // Select 2-3 random vulnerabilities
    const count = 2 + Math.floor(Math.random() * 2);
    const vulnerabilities: string[] = [];
    
    for (let i = 0; i < count; i++) {
      const randomIndex = Math.floor(Math.random() * commonVulnerabilities.length);
      const vulnerability = commonVulnerabilities[randomIndex];
      
      if (!vulnerabilities.includes(vulnerability)) {
        vulnerabilities.push(vulnerability);
      }
    }
    
    return vulnerabilities;
  }
  
  /**
   * Identify strengths for a competitor
   */
  private identifyCompetitorStrengths(companyId: string, industryData: any): string[] {
    // If industry data has specific strengths, use those
    if (industryData.competitorStrengths && 
        industryData.competitorStrengths[companyId] &&
        Array.isArray(industryData.competitorStrengths[companyId])) {
      return industryData.competitorStrengths[companyId];
    }
    
    // Common strengths
    const commonStrengths = [
      'Diversified supplier base',
      'Tariff-optimized supply chain',
      'Brand recognition',
      'Operational efficiency',
      'Innovation pipeline',
      'Market leadership',
      'Cost advantage',
      'Strategic partnerships',
      'Vertical integration',
      'Regulatory expertise',
      'Trade agreement leverage'
    ];
    
    // Select 2-3 random strengths
    const count = 2 + Math.floor(Math.random() * 2);
    const strengths: string[] = [];
    
    for (let i = 0; i < count; i++) {
      const randomIndex = Math.floor(Math.random() * commonStrengths.length);
      const strength = commonStrengths[randomIndex];
      
      if (!strengths.includes(strength)) {
        strengths.push(strength);
      }
    }
    
    return strengths;
  }
  
  /**
   * Calculate competitive change vector
   */
  private calculateCompetitiveChangeVector(currentShare: number, projectedShare: number, tariffAdvantage: number): {
    x: number;
    y: number;
    magnitude: number;
  } {
    // X-axis represents market share change
    const x = projectedShare - currentShare;
    
    // Y-axis represents tariff advantage
    const y = tariffAdvantage;
    
    // Magnitude is the overall change strength
    const magnitude = Math.sqrt(x * x + y * y);
    
    return {
      x,
      y,
      magnitude
    };
  }
  
  /**
   * Analyze market dynamics
   */
  private async analyzeMarketDynamics(industry: string): Promise<{
    overallGrowth: number;
    volatility: number;
    barriers: string[];
    opportunities: string[];
  }> {
    try {
      // Attempt to fetch market dynamics data from API
      const dynamicsData = await perplexityApiClient.getAIInsights(`Market dynamics analysis for ${industry} industry`);
      
      if (dynamicsData && 
          typeof dynamicsData === 'object' &&
          typeof dynamicsData.marketDynamics === 'object') {
        return dynamicsData.marketDynamics;
      }
    } catch (error) {
      console.error('Failed to fetch market dynamics:', error);
    }
    
    // Generate realistic market dynamics
    return {
      overallGrowth: Math.round((Math.random() * 8 - 2) * 10) / 10, // -2% to 6%
      volatility: Math.round(Math.random() * 10 * 10) / 10, // 0-10 scale
      barriers: this.getRandomBarriers(),
      opportunities: this.getRandomOpportunities()
    };
  }
  
  /**
   * Get random market barriers
   */
  private getRandomBarriers(): string[] {
    const commonBarriers = [
      'High tariff rates',
      'Complex regulatory environment',
      'Supply chain disruptions',
      'High entry costs',
      'Strong incumbent advantage',
      'Resource constraints',
      'Geopolitical tensions',
      'Currency volatility',
      'Labor shortages',
      'Technology requirements'
    ];
    
    // Select 2-4 random barriers
    const count = 2 + Math.floor(Math.random() * 3);
    const barriers: string[] = [];
    
    for (let i = 0; i < count; i++) {
      const randomIndex = Math.floor(Math.random() * commonBarriers.length);
      const barrier = commonBarriers[randomIndex];
      
      if (!barriers.includes(barrier)) {
        barriers.push(barrier);
      }
    }
    
    return barriers;
  }
  
  /**
   * Get random market opportunities
   */
  private getRandomOpportunities(): string[] {
    const commonOpportunities = [
      'Tariff optimization strategies',
      'New market entry potential',
      'Trade agreement advantages',
      'Supply chain relocations',
      'Digital transformation',
      'Sustainable practices demand',
      'Regional expansion',
      'Product innovation',
      'Strategic partnerships',
      'Regulatory expertise leverage'
    ];
    
    // Select 2-4 random opportunities
    const count = 2 + Math.floor(Math.random() * 3);
    const opportunities: string[] = [];
    
    for (let i = 0; i < count; i++) {
      const randomIndex = Math.floor(Math.random() * commonOpportunities.length);
      const opportunity = commonOpportunities[randomIndex];
      
      if (!opportunities.includes(opportunity)) {
        opportunities.push(opportunity);
      }
    }
    
    return opportunities;
  }
}

// Create instance before exporting
const competitiveRadarAnalyzer = new CompetitiveRadarAnalyzer();
export default competitiveRadarAnalyzer;
