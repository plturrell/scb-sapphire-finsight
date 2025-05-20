import { TariffModification, ScenarioComparison } from '../types/TariffAnalysisTypes';
import { SankeyData } from '../types';
import perplexityApiClient from './PerplexityApiClient';

/**
 * PredictiveScenarioBuilder
 * Advanced service for creating and simulating alternative tariff scenarios
 * with sophisticated visualization and comparison capabilities
 */
class PredictiveScenarioBuilder {
  // Cache for scenario simulations
  private scenarioCache: Map<string, ScenarioComparison> = new Map();
  
  /**
   * Create and simulate alternative tariff scenarios
   * @param baseScenario Current tariff environment to use as baseline
   * @param modifications User-defined modifications to simulate
   * @returns Comparative analysis of baseline vs modified scenario
   */
  async simulateAlternativeScenario(baseScenario: string, modifications: TariffModification[]): Promise<ScenarioComparison> {
    console.log(`Simulating alternative scenario based on ${baseScenario} with ${modifications.length} modifications`);
    
    // Generate a unique cache key for this scenario simulation
    const cacheKey = `${baseScenario}-${this.hashModifications(modifications)}`;
    
    // Check if we have a cached result for this exact scenario
    if (this.scenarioCache.has(cacheKey)) {
      console.log('Using cached scenario simulation results');
      return this.scenarioCache.get(cacheKey)!;
    }
    
    // Fetch scenario data using the Perplexity API
    const baselineData = await this.fetchScenarioData(baseScenario);
    
    // Create a modified version with the proposed changes
    const modifiedData = await this.applyTariffModifications(baselineData, modifications);
    
    // Generate comparative analysis
    const comparison = await this.generateComparison(baseScenario, baselineData, modifiedData, modifications);
    
    // Cache the results for future use
    this.scenarioCache.set(cacheKey, comparison);
    
    return comparison;
  }
  
  /**
   * Hash modifications to create a unique identifier
   */
  private hashModifications(modifications: TariffModification[]): string {
    return modifications
      .map(m => `${m.countryId}-${m.productCategoryId}-${m.modifiedRate}`)
      .sort()
      .join('|');
  }
  
  /**
   * Fetch scenario data from API or generate if needed
   */
  private async fetchScenarioData(scenarioId: string): Promise<any> {
    try {
      // Attempt to get scenario data from API
      const scenarioData = await perplexityApiClient.getSimulationInputs({
        scenarioId,
        forceFresh: false
      });
      
      return scenarioData;
    } catch (error) {
      console.error(`Failed to fetch scenario data for ${scenarioId}:`, error);
      throw new Error(`Unable to fetch base scenario ${scenarioId}`);
    }
  }
  
  /**
   * Apply tariff modifications to create a modified scenario
   */
  private async applyTariffModifications(baseData: any, modifications: TariffModification[]): Promise<any> {
    // Clone the base data
    const modifiedData = JSON.parse(JSON.stringify(baseData));
    
    // Apply each modification
    modifications.forEach(mod => {
      // Find the relevant tariff entry and modify it
      this.modifyTariffInData(modifiedData, mod);
    });
    
    return modifiedData;
  }
  
  /**
   * Modify a specific tariff in the data structure
   */
  private modifyTariffInData(data: any, modification: TariffModification): void {
    // Implementation depends on the exact data structure
    // This is a simplified version
    if (Array.isArray(data)) {
      for (const item of data) {
        if (item.countryId === modification.countryId && 
            item.productCategoryId === modification.productCategoryId) {
          // Update the tariff rate
          item.tariffRate = modification.modifiedRate;
          // Update effective date if needed
          if (modification.effectiveDate) {
            item.effectiveDate = modification.effectiveDate;
          }
          // Update description if provided
          if (modification.description) {
            item.description = modification.description;
          }
        }
      }
    }
  }
  
  /**
   * Generate a comprehensive comparison between baseline and modified scenarios
   */
  private async generateComparison(baseScenarioId: string, 
                                  baseData: any, 
                                  modifiedData: any, 
                                  modifications: TariffModification[]): Promise<ScenarioComparison> {
    // Generate visualization data
    const baselineSankey = await this.generateSankeyData(baseData);
    const modifiedSankey = await this.generateSankeyData(modifiedData);
    
    // Analyze divergence points
    const divergencePoints = this.calculateDivergencePoints(baselineSankey, modifiedSankey);
    
    // Calculate impact metrics
    const totalTradeImpact = this.calculateTotalTradeImpact(baseData, modifiedData);
    const revenueChange = this.calculateRevenueChange(baseData, modifiedData);
    const marginChange = this.calculateMarginChange(baseData, modifiedData);
    const supplyChainDisruption = this.calculateSupplyChainDisruption(modifiedData);
    const timeToImplementation = this.estimateImplementationTime(modifications);
    
    // Calculate category impacts
    const categoryImpacts = this.calculateCategoryImpacts(baseData, modifiedData);
    
    // Generate recommendations
    const recommendations = await this.generateRecommendations(baseData, modifiedData, modifications);
    
    // Assess risks
    const riskAssessment = this.assessRisks(modifiedData, modifications);
    
    // Build the complete comparison object
    const comparison: ScenarioComparison = {
      baseScenarioId,
      modifiedScenarioId: `${baseScenarioId}-modified-${Date.now()}`,
      comparativeMetrics: {
        totalTradeImpact,
        revenueChange,
        marginChange,
        supplyChainDisruption,
        timeToImplementation
      },
      categoryImpacts,
      visualizationData: {
        baseline: baselineSankey,
        modified: modifiedSankey,
        divergencePoints
      },
      recommendations,
      riskAssessment
    };
    
    return comparison;
  }
  
  /**
   * Generate Sankey diagram data from scenario data
   */
  private async generateSankeyData(scenarioData: any): Promise<SankeyData> {
    // Implementation depends on the exact data structure
    // This would generate a proper Sankey diagram from the scenario data
    const sankeyData: SankeyData = {
      nodes: [],
      links: []
    };
    
    // Generate nodes and links based on scenario data
    // Simplified implementation
    if (Array.isArray(scenarioData)) {
      // Create country and product category nodes
      const countries = new Set<string>();
      const categories = new Set<string>();
      
      scenarioData.forEach(item => {
        countries.add(item.countryId);
        categories.add(item.productCategoryId);
      });
      
      // Add country nodes
      countries.forEach(country => {
        sankeyData.nodes.push({
          name: country,
          group: 'country'
        });
      });
      
      // Add category nodes
      categories.forEach(category => {
        sankeyData.nodes.push({
          name: category,
          group: 'category'
        });
      });
      
      // Add links between countries and categories
      scenarioData.forEach(item => {
        const sourceIndex = sankeyData.nodes.findIndex(n => n.name === item.countryId);
        const targetIndex = sankeyData.nodes.findIndex(n => n.name === item.productCategoryId);
        
        if (sourceIndex >= 0 && targetIndex >= 0) {
          sankeyData.links.push({
            source: sourceIndex,
            target: targetIndex,
            value: item.tradeVolume ? item.tradeVolume * (item.tariffRate / 100) : 5,
            uiColor: this.getTariffColor(item.tariffRate)
          });
        }
      });
    }
    
    return sankeyData;
  }
  
  /**
   * Get color based on tariff rate severity
   */
  private getTariffColor(tariffRate: number): string {
    if (tariffRate > 20) {
      return 'rgba(220, 53, 69, 0.7)'; // High impact - red
    } else if (tariffRate > 10) {
      return 'rgba(255, 193, 7, 0.7)'; // Medium impact - yellow
    } else {
      return 'rgba(25, 135, 84, 0.7)'; // Low impact - green
    }
  }
  
  /**
   * Calculate divergence points between baseline and modified Sankey diagrams
   */
  private calculateDivergencePoints(baseline: SankeyData, modified: SankeyData): Array<{
    nodeId: string;
    baselineValue: number;
    modifiedValue: number;
    percentDivergence: number;
  }> {
    const divergencePoints: Array<{
      nodeId: string;
      baselineValue: number;
      modifiedValue: number;
      percentDivergence: number;
    }> = [];
    
    // Identify nodes that exist in both diagrams
    const baselineNodeMap = new Map<string, any>();
    baseline.nodes.forEach((node, index) => {
      baselineNodeMap.set(node.name, {
        index,
        value: this.calculateNodeValue(baseline, index)
      });
    });
    
    modified.nodes.forEach((node, index) => {
      if (baselineNodeMap.has(node.name)) {
        const baselineNode = baselineNodeMap.get(node.name)!;
        const modifiedValue = this.calculateNodeValue(modified, index);
        
        // Calculate percentage divergence
        const percentDivergence = baselineNode.value > 0 
          ? ((modifiedValue - baselineNode.value) / baselineNode.value) * 100
          : 0;
        
        // Only include significant divergences
        if (Math.abs(percentDivergence) > 1) {
          divergencePoints.push({
            nodeId: node.name,
            baselineValue: baselineNode.value,
            modifiedValue: modifiedValue,
            percentDivergence: percentDivergence
          });
        }
      }
    });
    
    // Sort by absolute divergence (largest first)
    return divergencePoints.sort((a, b) => 
      Math.abs(b.percentDivergence) - Math.abs(a.percentDivergence)
    );
  }
  
  /**
   * Calculate total value for a node based on its links
   */
  private calculateNodeValue(sankey: SankeyData, nodeIndex: number): number {
    // Sum the values of links into and out of this node
    return sankey.links.reduce((sum, link) => {
      if (link.source === nodeIndex || link.target === nodeIndex) {
        return sum + link.value;
      }
      return sum;
    }, 0);
  }
  
  /**
   * Calculate total trade impact
   */
  private calculateTotalTradeImpact(baseData: any, modifiedData: any): number {
    // Implementation depends on the exact data structure
    // This is a simplified version
    let baselineTotal = 0;
    let modifiedTotal = 0;
    
    if (Array.isArray(baseData) && Array.isArray(modifiedData)) {
      baselineTotal = baseData.reduce((sum, item) => 
        sum + (item.tradeVolume || 0) * (item.tariffRate || 0) / 100, 0);
      
      modifiedTotal = modifiedData.reduce((sum, item) => 
        sum + (item.tradeVolume || 0) * (item.tariffRate || 0) / 100, 0);
    }
    
    return modifiedTotal - baselineTotal;
  }
  
  /**
   * Calculate revenue change
   */
  private calculateRevenueChange(baseData: any, modifiedData: any): number {
    // Simplified implementation - in reality would use more complex calculations
    return this.calculateTotalTradeImpact(baseData, modifiedData) * 1.5;
  }
  
  /**
   * Calculate margin change
   */
  private calculateMarginChange(baseData: any, modifiedData: any): number {
    // Simplified implementation - in reality would use more complex calculations
    return this.calculateTotalTradeImpact(baseData, modifiedData) * 0.3;
  }
  
  /**
   * Calculate supply chain disruption score
   */
  private calculateSupplyChainDisruption(modifiedData: any): number {
    // Simplified implementation - in reality would use more complex calculations
    if (Array.isArray(modifiedData)) {
      // Count the number of significant tariff changes
      const significantChanges = modifiedData.filter(item => item.tariffRate > 15).length;
      // Normalize to a 0-10 scale
      return Math.min(10, significantChanges * 2);
    }
    return 0;
  }
  
  /**
   * Estimate implementation time in months
   */
  private estimateImplementationTime(modifications: TariffModification[]): number {
    // Implementation time increases with number of changes and their magnitude
    const baseTime = 3; // Base time in months
    const complexityFactor = Math.sqrt(modifications.length) * 0.5;
    const magnitudeFactor = modifications.reduce((sum, mod) => 
      sum + Math.abs(mod.modifiedRate - mod.originalRate) * 0.1, 0);
    
    return Math.round(baseTime + complexityFactor + magnitudeFactor);
  }
  
  /**
   * Calculate impacts by product category
   */
  private calculateCategoryImpacts(baseData: any, modifiedData: any): {
    [categoryId: string]: {
      baseValue: number;
      modifiedValue: number;
      percentChange: number;
      confidence: number;
    }
  } {
    const impacts: {
      [categoryId: string]: {
        baseValue: number;
        modifiedValue: number;
        percentChange: number;
        confidence: number;
      }
    } = {};
    
    if (Array.isArray(baseData) && Array.isArray(modifiedData)) {
      // Group data by category
      const baseByCategory = this.groupByCategory(baseData);
      const modifiedByCategory = this.groupByCategory(modifiedData);
      
      // Calculate impact for each category
      new Set([...Object.keys(baseByCategory), ...Object.keys(modifiedByCategory)]).forEach(category => {
        const baseValue = baseByCategory[category] || 0;
        const modifiedValue = modifiedByCategory[category] || 0;
        const percentChange = baseValue > 0 
          ? ((modifiedValue - baseValue) / baseValue) * 100
          : 0;
          
        impacts[category] = {
          baseValue,
          modifiedValue,
          percentChange,
          confidence: this.calculateConfidence(percentChange)
        };
      });
    }
    
    return impacts;
  }
  
  /**
   * Group data by category and sum trade impact
   */
  private groupByCategory(data: any[]): {[categoryId: string]: number} {
    const result: {[categoryId: string]: number} = {};
    
    data.forEach(item => {
      const category = item.productCategoryId;
      const impact = (item.tradeVolume || 0) * (item.tariffRate || 0) / 100;
      
      if (!result[category]) {
        result[category] = 0;
      }
      
      result[category] += impact;
    });
    
    return result;
  }
  
  /**
   * Calculate confidence score based on change magnitude
   */
  private calculateConfidence(percentChange: number): number {
    // Higher changes have lower confidence
    const absChange = Math.abs(percentChange);
    return Math.max(0.5, 1 - (absChange / 200));
  }
  
  /**
   * Generate recommendations based on scenario comparison
   */
  private async generateRecommendations(baseData: any, modifiedData: any, modifications: TariffModification[]): Promise<Array<{
    action: string;
    impact: number;
    confidence: number;
    timeframe: 'immediate' | 'short-term' | 'medium-term' | 'long-term';
    description: string;
  }>> {
    // In a real implementation, this would use AI to generate recommendations
    // For now, use a simplified rule-based approach
    const recommendations: Array<{
      action: string;
      impact: number;
      confidence: number;
      timeframe: 'immediate' | 'short-term' | 'medium-term' | 'long-term';
      description: string;
    }> = [];
    
    // Sort modifications by impact
    const sortedMods = [...modifications].sort((a, b) => 
      Math.abs(b.modifiedRate - b.originalRate) - Math.abs(a.modifiedRate - a.originalRate)
    );
    
    // Generate recommendations for top modifications
    for (let i = 0; i < Math.min(3, sortedMods.length); i++) {
      const mod = sortedMods[i];
      const increasing = mod.modifiedRate > mod.originalRate;
      
      recommendations.push({
        action: increasing ? 'Adapt Supply Chain' : 'Leverage Reduced Tariffs',
        impact: Math.abs(mod.modifiedRate - mod.originalRate) * 0.5,
        confidence: 0.7 + (Math.random() * 0.2), // Simulated confidence
        timeframe: this.determineTimeframe(mod),
        description: this.generateRecommendationDescription(mod, increasing)
      });
    }
    
    // Add general recommendation based on overall impact
    const totalImpact = this.calculateTotalTradeImpact(baseData, modifiedData);
    if (Math.abs(totalImpact) > 10) {
      recommendations.push({
        action: totalImpact > 0 ? 'Strategic Repositioning' : 'Market Expansion',
        impact: Math.abs(totalImpact) * 0.2,
        confidence: 0.65,
        timeframe: 'medium-term',
        description: totalImpact > 0 
          ? 'Consider strategic repositioning of supply chain and manufacturing to mitigate increased tariff burden'
          : 'Explore market expansion opportunities in regions with reduced tariff barriers'
      });
    }
    
    return recommendations;
  }
  
  /**
   * Determine timeframe for a recommendation
   */
  private determineTimeframe(modification: TariffModification): 'immediate' | 'short-term' | 'medium-term' | 'long-term' {
    const impact = Math.abs(modification.modifiedRate - modification.originalRate);
    
    if (impact > 20) return 'immediate';
    if (impact > 10) return 'short-term';
    if (impact > 5) return 'medium-term';
    return 'long-term';
  }
  
  /**
   * Generate description for a recommendation
   */
  private generateRecommendationDescription(modification: TariffModification, increasing: boolean): string {
    if (increasing) {
      return `Adapt to increased tariffs (${modification.originalRate}% to ${modification.modifiedRate}%) ` +
             `for products from ${modification.countryId} by exploring alternative sourcing or pass-through strategies`;
    } else {
      return `Capitalize on reduced tariffs (${modification.originalRate}% to ${modification.modifiedRate}%) ` +
             `for products from ${modification.countryId} by increasing import volume and optimizing supply chains`;
    }
  }
  
  /**
   * Assess risks based on modifications
   */
  private assessRisks(modifiedData: any, modifications: TariffModification[]): {
    overallRisk: number;
    riskFactors: Array<{
      factor: string;
      severity: number;
      likelihood: number;
      mitigationOptions: string[];
    }>;
  } {
    const riskFactors: Array<{
      factor: string;
      severity: number;
      likelihood: number;
      mitigationOptions: string[];
    }> = [];
    
    // Assess supply chain disruption risk
    const disruptionRisk = this.calculateSupplyChainDisruption(modifiedData);
    if (disruptionRisk > 3) {
      riskFactors.push({
        factor: 'Supply Chain Disruption',
        severity: disruptionRisk / 10,
        likelihood: 0.7,
        mitigationOptions: [
          'Diversify supplier base',
          'Increase safety stock levels',
          'Implement advanced monitoring systems'
        ]
      });
    }
    
    // Assess cost increase risk
    const significantIncreases = modifications.filter(m => 
      m.modifiedRate > m.originalRate && (m.modifiedRate - m.originalRate) > 10
    );
    
    if (significantIncreases.length > 0) {
      riskFactors.push({
        factor: 'Cost Increase',
        severity: Math.min(1, significantIncreases.length * 0.2),
        likelihood: 0.9,
        mitigationOptions: [
          'Negotiate with suppliers',
          'Explore pricing adjustments',
          'Optimize product mix'
        ]
      });
    }
    
    // Assess regulatory compliance risk
    const highTariffs = modifications.filter(m => m.modifiedRate > 25);
    if (highTariffs.length > 0) {
      riskFactors.push({
        factor: 'Regulatory Compliance',
        severity: 0.6,
        likelihood: 0.8,
        mitigationOptions: [
          'Strengthen compliance team',
          'Implement automated validation systems',
          'Regular audit and review'
        ]
      });
    }
    
    // Calculate overall risk
    const overallRisk = riskFactors.reduce((sum, factor) => 
      sum + (factor.severity * factor.likelihood), 0) / Math.max(1, riskFactors.length);
    
    return {
      overallRisk,
      riskFactors
    };
  }
}

// Create instance before exporting
const predictiveScenarioBuilder = new PredictiveScenarioBuilder();
export default predictiveScenarioBuilder;
