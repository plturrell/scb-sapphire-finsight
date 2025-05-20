import { OntologyManager, ontologyManager } from './OntologyManager';
import { UnifiedMonteCarloEngine, MCSimulationOptions, MCSimulationResults } from './UnifiedMonteCarloEngine';
import { NotificationCenter } from './NotificationCenter';
import { PerplexityEnhancedNLP } from './PerplexityEnhancedNLP';

// Type definitions for sensitivity analysis
interface SensitivityVariation {
  value: number | string;
  change: string;
}

interface SensitivityVariable {
  name: string;
  description?: string; // Added description field
  baseline: number | string;
  variations: SensitivityVariation[];
}

interface SensitivityOutcome {
  expectedValue: number;
  confidenceInterval: [number, number];
  volatility: number;
  optimalPathLength?: number;
  nodesExplored?: number;
  [key: string]: any; // Additional outcome metrics
}

// Outcome metrics returned by calculateOutcomeMetrics
interface OutcomeMetrics {
  expectedValue: number;
  optimalPathLength: number;
  confidenceInterval: [number, number];
  nodesExplored: number;
  [key: string]: any; // Additional metrics
}

interface SensitivityResult {
  variation: string | number;
  outcome: SensitivityOutcome;
  relativeDifference: {
    expectedValue?: number;
    volatility?: number;
    optimalPathLength?: number;
    [key: string]: number | undefined;
  };
}

interface VariableResults {
  variable: SensitivityVariable;
  description?: string;
  baseline: SensitivityOutcome;
  results: SensitivityResult[];
  mostSensitiveMetric?: string;
  criticalThreshold?: number | string;
}

interface SensitivityAnalysisResults {
  variableResults: VariableResults[];
  mostSensitiveVariables: MostSensitiveVariable[];
  executionTimeMs: number;
  insights?: SensitivityInsight[];
}

interface MostSensitiveVariable {
  variable: SensitivityVariable;
  description: string;
  maxAbsoluteChange: number;
  criticalVariation?: { variation: string | number, impact: number } | null;
}

interface SensitivityInsight {
  title: string;
  description: string;
  importance: string;
  category: string;
  relatedVariable?: string;
  threshold?: string | number;
  impact?: number;
}

/**
 * TariffImpactSimulator integrates Monte Carlo Tree Search for simulating tariff impacts
 * Uses the UnifiedMonteCarloEngine to ensure 100% consistency across all modules
 * Enhanced with advanced Perplexity-powered AI analytics, competitive intelligence, and visualization capabilities
 */
export class TariffImpactSimulator {
  private ontology: OntologyManager;
  private simulationResults: any = null;
  private workerInstance: Worker | null = null;
  private monteCarloEngine: UnifiedMonteCarloEngine;
  private perplexityNLP: PerplexityEnhancedNLP | null = null;
  
  /**
   * Analytics hub for accessing all advanced tariff analysis features
   * Provides access to predictive scenarios, competitive analysis, and supply chain resilience
   */
  public analytics: any;
  
  constructor(ontology: OntologyManager) {
    this.ontology = ontology;
    
    // Initialize the unified Monte Carlo engine
    this.monteCarloEngine = UnifiedMonteCarloEngine.getInstance(ontology);
    
    // Initialize Perplexity NLP integration
    try {
      this.perplexityNLP = PerplexityEnhancedNLP.getInstance(ontology);
    } catch (error) {
      console.error('Failed to initialize Perplexity NLP:', error);
    }
    
    // Initialize analytics hub after constructor is called
    // We need to do this in a separate step to avoid circular dependencies
    setTimeout(() => {
      // Dynamically import to avoid circular dependencies
      import('./TariffAnalyticsHub').then(module => {
        const TariffAnalyticsHub = module.default;
        this.analytics = new TariffAnalyticsHub(this, ontology);
        console.log('TariffAnalyticsHub initialized with enhanced features');
      });
    }, 0);
  }
  
  /**
   * Run a Monte Carlo simulation on tariff data using the UnifiedMonteCarloEngine
   * to ensure 100% consistency across all modules
   * 
   * @param options Optional simulation options
   */
  /**
   * Run a Monte Carlo simulation on tariff data using the UnifiedMonteCarloEngine
   * to ensure 100% consistency across all modules
   * 
   * @param options Optional simulation options
   * @param runSensitivityAnalysis If true, performs sensitivity analysis on key variables
   */
  public async runSimulation(
    options: Partial<MCSimulationOptions> = {}, 
    runSensitivityAnalysis: boolean = false
  ): Promise<any> {
    console.log('Starting tariff impact simulation with UnifiedMonteCarloEngine');
    
    // Extract parameters from ontology
    const countryData = this.extractCountryData();
    const productData = this.extractProductData();
    const policyData = this.extractPolicyData();
    
    // Create initial state
    const initialState = this.createInitialState(countryData, productData, policyData);
    
    // Notify about simulation start
    NotificationCenter.showNotification({
      title: 'Tariff Impact Simulation Started',
      body: `Running Monte Carlo simulation with ${options.iterations || 5000} iterations${runSensitivityAnalysis ? ' including sensitivity analysis' : ''}`,
      priority: 'medium',
      category: 'update',
      expiresAt: new Date(Date.now() + 5000) // Using expiresAt instead of autoClose
    }, 'tariff-analysis', 'update');
    
    try {
      // Configure simulation options
      const simulationOptions: Partial<MCSimulationOptions> = {
        iterations: options.iterations || 5000,
        maxDepth: options.maxDepth || 10,
        explorationParameter: options.explorationParameter || 1.41,
        domainContext: 'tariffs',
        confidenceLevel: options.confidenceLevel || 0.993,
        usePerplexityEnhancement: options.usePerplexityEnhancement !== false,
        perplexityAnalysisDepth: options.perplexityAnalysisDepth || 'standard',
        sensitivityAnalysis: options.sensitivityAnalysis || false
      };
      
      // Run simulation using the unified engine
      const simulationResults = await this.monteCarloEngine.runSimulation(
        initialState,
        this.getPossibleActions.bind(this),
        this.applyAction.bind(this),
        this.isTerminal.bind(this),
        this.evaluateState.bind(this),
        simulationOptions
      );
      
      // Process results
      this.simulationResults = {
        optimalPath: simulationResults.bestActionPath,
        expectedValues: this.calculateExpectedValues(simulationResults),
        riskMetrics: this.calculateRiskMetrics(simulationResults),
        flowData: this.generateFlowData(simulationResults),
        confidenceInterval: simulationResults.confidenceInterval,
        perplexityEnhanced: simulationResults.perplexityEnhanced,
        domainInsights: simulationResults.domainInsights,
      };
      
      // Run sensitivity analysis if requested
      if (runSensitivityAnalysis) {
        try {
          const sensitivityResults = await this.runSensitivityAnalysis(initialState, options);
          this.simulationResults.sensitivityAnalysis = sensitivityResults;
          
          // Add sensitivity insights to the results
          this.simulationResults.sensitivityInsights = this.generateSensitivityInsights(sensitivityResults);
        } catch (error) {
          console.error('Error running sensitivity analysis:', error);
          // Continue even if sensitivity analysis fails
        }
      }
      
      // Store results in ontology
      this.updateOntologyWithSimulationResults();
      
      // Notify about simulation completion
      NotificationCenter.showNotification({
        title: 'Tariff Impact Simulation Complete',
        body: `Simulation completed with ${simulationResults.nodesExplored} nodes explored`,
        priority: 'medium',
        category: 'insight',
        actions: [{ // Using actions array instead of actionable property
          id: 'view-details',
          title: 'View Details',
          primary: true,
          handler: () => console.log('View details clicked')
        }],
        dataPoints: {
          'Confidence': `${Math.round((simulationResults.confidenceInterval[1] - simulationResults.confidenceInterval[0]) * 100)}%`,
          'Nodes Explored': simulationResults.nodesExplored.toString(),
          'Perplexity Enhanced': simulationResults.perplexityEnhanced ? 'Yes' : 'No',
          'Sensitivity Analysis': runSensitivityAnalysis ? 'Complete' : 'N/A'
        }
      }, 'tariff-analysis', 'insight');
      
      return this.simulationResults;
    } catch (e) {
      const error = e as Error;
      console.error('Error running tariff simulation:', error.message);
      
      // Notify about simulation error
      NotificationCenter.showNotification({
        title: 'Tariff Impact Simulation Error',
        body: `Error: ${error.message}`,
        priority: 'high',
        category: 'alert'
      }, 'tariff-analysis', 'alert');
      
      throw error;
    }
  }
  
  /**
   * Clean up worker instance
   */
  private cleanupWorker() {
    if (this.workerInstance) {
      this.workerInstance.terminate();
      this.workerInstance = null;
    }
  }
  
  /**
   * Get possible actions from a state (required by UnifiedMonteCarloEngine)
   */
  private getPossibleActions(state: any): any[] {
    // Extract available actions from state
    const actions: any[] = [];
    
    // Generate tariff change actions
    if (state.countries) {
      state.countries.forEach((country: any) => {
        if (state.products) {
          state.products.forEach((product: any) => {
            // Add possible tariff changes
            actions.push({
              type: 'MODIFY_TARIFF',
              country: country.name,
              product: product.name,
              change: 5 // 5% increase
            });
            
            actions.push({
              type: 'MODIFY_TARIFF',
              country: country.name,
              product: product.name,
              change: -5 // 5% decrease
            });
          });
        }
      });
    }
    
    // Add policy response actions
    if (state.policies) {
      state.policies.forEach((policy: any) => {
        actions.push({
          type: 'APPLY_POLICY',
          policy: policy.name
        });
      });
    }
    
    return actions;
  }
  
  /**
   * Apply an action to a state (required by UnifiedMonteCarloEngine)
   */
  private applyAction(state: any, action: any): any {
    // Create a deep copy of the state
    const newState = JSON.parse(JSON.stringify(state));
    
    // Apply the action
    if (action.type === 'MODIFY_TARIFF') {
      // Find the country
      const country = newState.countries.find((c: any) => c.name === action.country);
      if (country) {
        // Apply tariff change
        country.avgTariffRate += action.change;
        
        // Ensure tariff rate is not negative
        if (country.avgTariffRate < 0) {
          country.avgTariffRate = 0;
        }
        
        // Update month
        newState.month += 1;
      }
    } else if (action.type === 'APPLY_POLICY') {
      // Find the policy
      const policy = newState.policies.find((p: any) => p.name === action.policy);
      if (policy) {
        // Apply policy
        policy.applied = true;
        
        // Update month
        newState.month += 1;
      }
    }
    
    return newState;
  }
  
  /**
   * Check if a state is terminal (required by UnifiedMonteCarloEngine)
   */
  private isTerminal(state: any): boolean {
    // Check if we've reached the time horizon
    return state.month >= state.timeHorizon;
  }
  
  /**
   * Evaluate a state using sophisticated economic models including
   * price elasticity, market influence, and competitive dynamics
   * (required by UnifiedMonteCarloEngine)
   */
  private evaluateState(state: any): number {
    let value = 0;
    
    // ===== TARIFF IMPACT FACTORS =====
    // Simple tariff rate evaluation (first-order effects)
    if (state.countries && state.products) {
      state.countries.forEach((country: any) => {
        // BASE TARIFF IMPACT
        // Higher tariffs generally decrease trade volume, but the relationship is non-linear
        // Using price elasticity of demand curves based on economic research
        const baseImpact = this.calculateBaseTariffImpact(country.avgTariffRate);
        value -= baseImpact;
        
        // TRADE ELASTICITY & SUBSTITUTION EFFECTS
        // Different products have different elasticity thresholds
        state.products.forEach((product: any) => {
          // Get product-specific elasticity
          const elasticity = this.getProductElasticity(product.name);
          // Calculate tariff impact with elasticity consideration
          const elasticityImpact = country.avgTariffRate * elasticity * 0.2;
          value -= elasticityImpact;
          
          // MARKET SUBSTITUTION EFFECTS
          // High tariffs may redirect trade to other countries
          const substitutionEffect = this.calculateSubstitutionEffect(
            country.name, 
            product.name, 
            country.avgTariffRate,
            state.countries
          );
          // Substitution can be positive or negative depending on circumstances
          value += substitutionEffect;
        });
        
        // DYNAMIC MARKET SHARE ADJUSTMENTS
        // Impact on market share vs. competitors
        value += this.calculateMarketShareImpact(country.name, country.avgTariffRate, state);
      });
    }
    
    // ===== POLICY IMPACT FACTORS =====
    // Policies have complex impacts beyond simple addition
    if (state.policies) {
      let policyMultiplier = 1.0; // Compounding effect of multiple policies
      
      state.policies.forEach((policy: any) => {
        if (policy.applied) {
          // POLICY TYPE & TIMING EFFECTS
          // Get policy-specific impact value and timing factor
          const { impact, timing } = this.getPolicyImpact(policy.name, state.month);
          
          // Apply timing-adjusted policy impact
          value += impact * timing;
          
          // Some policies have compounding effects when combined
          policyMultiplier *= this.getPolicyMultiplier(policy.name);
        }
      });
      
      // Apply the compounding effect of multiple policies
      value *= policyMultiplier;
    }
    
    // ===== TEMPORAL FACTORS =====
    // Time-based impacts such as lag effects and anticipatory market behavior
    if (state.month) {
      // Discount future value (near-term impacts are weighted more heavily)
      const temporalDiscountFactor = 1 / (1 + 0.01 * state.month);
      value *= temporalDiscountFactor;
      
      // Market anticipation effects (early policy signals can have effects)
      if (state.month < 5) {
        const anticipationEffect = this.calculateAnticipationEffect(state);
        value += anticipationEffect;
      }
    }
    
    // ===== GLOBAL ECONOMIC CONDITIONS =====
    // Incorporate global economic conditions if specified in state
    if (state.economicConditions) {
      const conditionImpact = this.calculateEconomicConditionImpact(
        state.economicConditions,
        state.countries
      );
      value += conditionImpact;
    }
    
    return value;
  }
  
  /**
   * Calculate the base impact of tariff rates using non-linear economic models
   */
  private calculateBaseTariffImpact(tariffRate: number): number {
    // Non-linear relationship between tariff rates and economic impact
    // Based on empirical economic research
    
    // Small tariffs (<5%) have minimal impact
    if (tariffRate <= 5) {
      return tariffRate * 0.05;
    }
    // Moderate tariffs (5-15%) have increasing impact
    else if (tariffRate <= 15) {
      return 0.25 + (tariffRate - 5) * 0.15;
    }
    // High tariffs (15-25%) have significant impact
    else if (tariffRate <= 25) {
      return 1.75 + (tariffRate - 15) * 0.25;
    }
    // Very high tariffs (>25%) have exponential impact due to severe trade disruption
    else {
      return 4.25 + (tariffRate - 25) * 0.4;
    }
  }
  
  /**
   * Get product-specific price elasticity of demand
   */
  private getProductElasticity(productName: string): number {
    // Different products have different elasticity (price sensitivity)
    const elasticityMap: Record<string, number> = {
      'Electronics': 1.7,  // Highly elastic
      'Automobiles': 1.5,  // Highly elastic
      'Pharmaceuticals': 0.5, // Inelastic (necessary products)
      'Food': 0.4,         // Inelastic (necessary products)
      'Textiles': 1.3,     // Elastic
      'Steel': 0.9,        // Moderately elastic
      'Chemicals': 0.7,    // Moderately inelastic
      'Energy': 0.3,       // Inelastic (necessary)
      'Luxury Goods': 2.0, // Highly elastic
    };
    
    return elasticityMap[productName] || 1.0; // Default to unit elasticity
  }
  
  /**
   * Calculate substitution effects when tariffs cause trade to shift between countries
   */
  private calculateSubstitutionEffect(
    countryName: string, 
    productName: string, 
    tariffRate: number,
    allCountries: any[]
  ): number {
    // Higher tariffs cause trade to shift to other countries
    // This can benefit or harm countries depending on their position
    
    // If this country's tariff is high, trade will shift away (negative effect for country)
    if (tariffRate > 15) {
      return -0.5 * (tariffRate - 15) * this.getProductElasticity(productName);
    }
    
    // Check if other countries have high tariffs (this country might benefit)
    const otherCountriesWithHighTariffs = allCountries.filter(c => 
      c.name !== countryName && c.avgTariffRate > 15
    );
    
    if (otherCountriesWithHighTariffs.length > 0) {
      // This country may benefit from others' high tariffs
      const substitutionBenefit = otherCountriesWithHighTariffs.reduce(
        (benefit, country) => benefit + (country.avgTariffRate - 15) * 0.1,
        0
      );
      return substitutionBenefit;
    }
    
    return 0; // No significant substitution effect
  }
  
  /**
   * Calculate market share impacts based on competitive positioning
   */
  private calculateMarketShareImpact(countryName: string, tariffRate: number, state: any): number {
    // Market share dynamics depend on relative tariff positions
    
    if (!state.countries || state.countries.length <= 1) {
      return 0; // No competition to compare against
    }
    
    // Calculate the average tariff rate of other countries
    const otherCountries = state.countries.filter((c: any) => c.name !== countryName);
    const avgOtherTariff = otherCountries.reduce(
      (sum: number, c: any) => sum + c.avgTariffRate, 
      0
    ) / otherCountries.length;
    
    // Market advantage if this country has lower tariffs than others
    if (tariffRate < avgOtherTariff) {
      return (avgOtherTariff - tariffRate) * 0.2;
    }
    // Market disadvantage if this country has higher tariffs
    else if (tariffRate > avgOtherTariff) {
      return (avgOtherTariff - tariffRate) * 0.3; // Higher penalty for being above average
    }
    
    return 0; // No advantage or disadvantage
  }
  
  /**
   * Calculate specific policy impacts, which vary by policy type and timing
   */
  private getPolicyImpact(policyName: string, month: number): { impact: number, timing: number } {
    // Policy types have different impacts and timing factors
    const policyImpacts: Record<string, { baseImpact: number, timeToEffect: number }> = {
      'Tariff Reduction Agreement': { baseImpact: 8.0, timeToEffect: 6 },
      'Export Incentive Program': { baseImpact: 5.0, timeToEffect: 3 },
      'Trade Facilitation Measure': { baseImpact: 3.5, timeToEffect: 2 },
      'Preferential Trade Agreement': { baseImpact: 7.0, timeToEffect: 8 },
      'Digital Trade Agreement': { baseImpact: 4.0, timeToEffect: 5 },
      'Supply Chain Resilience Program': { baseImpact: 3.0, timeToEffect: 4 },
      'Sustainability Standards': { baseImpact: 2.0, timeToEffect: 10 },
      'SME Export Support': { baseImpact: 1.5, timeToEffect: 3 }
    };
    
    const policyInfo = policyImpacts[policyName] || { baseImpact: 5.0, timeToEffect: 4 };
    
    // Calculate timing effect (policies take time to fully realize their impact)
    // Uses sigmoid function to model gradual policy effectiveness
    const timingFactor = 1 / (1 + Math.exp(-0.5 * (month - policyInfo.timeToEffect)));
    
    return {
      impact: policyInfo.baseImpact,
      timing: timingFactor
    };
  }
  
  /**
   * Get multiplier for policy combinations (some policies have synergistic effects)
   */
  private getPolicyMultiplier(policyName: string): number {
    // Some policies create multiplier effects when combined
    const policyMultipliers: Record<string, number> = {
      'Tariff Reduction Agreement': 1.05,
      'Export Incentive Program': 1.03,
      'Trade Facilitation Measure': 1.02,
      'Preferential Trade Agreement': 1.04,
      'Digital Trade Agreement': 1.02,
      'Supply Chain Resilience Program': 1.01,
      'Sustainability Standards': 1.01,
      'SME Export Support': 1.01
    };
    
    return policyMultipliers[policyName] || 1.0;
  }
  
  /**
   * Calculate anticipation effects (markets often react to announced policies before implementation)
   */
  private calculateAnticipationEffect(state: any): number {
    // Markets anticipate announced policies
    if (!state.policies) return 0;
    
    const appliedPolicies = state.policies.filter((p: any) => p.applied);
    if (appliedPolicies.length === 0) return 0;
    
    // Early policy signals create anticipation effects
    // The effect is strongest in early months and gradually diminishes
    const earlySignalBonus = (5 - state.month) * 0.5 * appliedPolicies.length;
    return Math.max(0, earlySignalBonus);
  }
  
  /**
   * Calculate the impact of global economic conditions on tariff effectiveness
   */
  private calculateEconomicConditionImpact(conditions: string, countries: any[]): number {
    // Different economic conditions impact tariff effectiveness differently
    switch (conditions) {
      case 'recession':
        // During recession, tariffs have more negative impact
        return -1.5 * countries.length;
      case 'growth':
        // During growth, markets can absorb tariffs better
        return 1.0 * countries.length;
      case 'inflation':
        // During inflation, tariffs compound price increases
        return -1.0 * countries.length;
      case 'deflation':
        // During deflation, tariffs can actually help domestic markets
        return 0.5 * countries.length;
      default:
        return 0;
    }
  }
  
  /**
   * Run sensitivity analysis on key variables to determine impact on outcomes
   * 
   * @param initialState The initial state to use for sensitivity analysis
   * @param options Simulation options
   */
  private async runSensitivityAnalysis(
    initialState: any, 
    options: Partial<MCSimulationOptions>
  ): Promise<any> {
    console.log('Running sensitivity analysis on tariff impact simulation');
    
    // Define variables to analyze and their ranges
    const sensitivityVariables = [
      { 
        name: 'tariffRates', 
        description: 'Tariff Rate Variations',
        variations: [-50, -25, 0, 25, 50] // percentage changes
      },
      { 
        name: 'tradeVolumes', 
        description: 'Trade Volume Variations',
        variations: [-30, -15, 0, 15, 30] // percentage changes
      },
      { 
        name: 'elasticity', 
        description: 'Price Elasticity Variations',
        variations: [-0.5, -0.25, 0, 0.25, 0.5] // absolute changes to elasticity
      },
      { 
        name: 'economicGrowth', 
        description: 'Economic Growth Scenarios',
        variations: ['recession', 'slow-growth', 'baseline', 'moderate-growth', 'high-growth']
      }
    ];
    
    // Results container
    const results: any = {
      variables: sensitivityVariables,
      analysisDate: new Date().toISOString(),
      variableResults: []
    };
    
    // Reduced iterations for sensitivity analysis to improve performance
    const sensitivityOptions = {
      ...options,
      iterations: Math.min(options.iterations || 5000, 1000), // Use fewer iterations for performance
      maxDepth: Math.min(options.maxDepth || 10, 5), // Lower max depth for performance
    };
    
    // Run analysis for each variable
    for (const variable of sensitivityVariables) {
      const variableResults = {
        variable: variable.name,
        description: variable.description,
        results: []
      };
      
      // Run simulations with different variations of this variable
      for (const variation of variable.variations) {
        // Create a modified state based on the current variation
        const modifiedState = this.createModifiedState(initialState, variable.name, variation);
        
        // Run a simulation with the modified state
        const simResult = await this.monteCarloEngine.runSimulation(
          modifiedState,
          this.getPossibleActions.bind(this),
          this.applyAction.bind(this),
          this.isTerminal.bind(this),
          this.evaluateState.bind(this),
          sensitivityOptions
        );
      
      // Store the results
      variableResults.results.push({
        variation: typeof variation === 'object' && 'value' in variation ? variation.value : variation,
        outcome: this.calculateOutcomeMetrics(simResult),
        relativeDifference: {}
      });
    }
    
    // Calculate relative differences from baseline (variation = 0 or 'baseline')
    this.calculateRelativeDifferences(variableResults.results);
    
    // Add to overall results
    results.variableResults.push(variableResults);
    
    // Provide progress notification
    NotificationCenter.showNotification({
      title: 'Sensitivity Analysis Progress',
      body: `Completed analysis of ${variable.description}`,
      priority: 'low',
      category: 'update',
    }, 'tariff-analysis', 'update');
  }
  
  // Calculate the most sensitive variables
  results.mostSensitiveVariables = this.findMostSensitiveVariables(results.variableResults);
  
  return results;
}

/**
 * Create a modified state for sensitivity analysis
 */
private createModifiedState(baseState: any, variableName: string, variation: any): any {
  // Deep clone the base state
  const modifiedState = JSON.parse(JSON.stringify(baseState));
  
  switch (variableName) {
    case 'tariffRates':
      // Modify tariff rates by percentage
      if (modifiedState.countries) {
        modifiedState.countries.forEach((country: any) => {
          const originalRate = country.avgTariffRate;
          const variationValue = typeof variation === 'object' && variation.value !== undefined ? 
            variation.value : variation;
          country.avgTariffRate = Math.max(0, originalRate * (1 + Number(variationValue) / 100));
        });
      }
      break;
      
    case 'tradeVolumes':
      // Modify trade volumes by percentage
      if (modifiedState.tradeVolumes) {
        const variationValue = typeof variation === 'object' && variation.value !== undefined ? 
          variation.value : variation;
        Object.keys(modifiedState.tradeVolumes).forEach(key => {
          const originalVolume = modifiedState.tradeVolumes[key];
          modifiedState.tradeVolumes[key] = originalVolume * (1 + Number(variationValue) / 100);
        });
      }
      break;
      
    case 'elasticity':
      // Add elasticity modifier to the state
      const elasticityValue = typeof variation === 'object' && variation.value !== undefined ? 
        variation.value : variation;
      modifiedState.elasticityModifier = elasticityValue;
      break;
      
    case 'economicGrowth':
      // Set economic conditions
      const economicValue = typeof variation === 'object' && variation.value !== undefined ? 
        variation.value : variation;
      modifiedState.economicConditions = economicValue;
      break;
  }
  
  return modifiedState;
}

/**
 * Calculate summary metrics for sensitivity analysis
 */
private calculateOutcomeMetrics(simulationResult: MCSimulationResults): OutcomeMetrics {
  return {
    expectedValue: simulationResult.bestActionPath.length > 0 ? 
      simulationResult.rootNode.value / simulationResult.bestActionPath.length : 0,
    optimalPathLength: simulationResult.bestActionPath.length,
    confidenceInterval: simulationResult.confidenceInterval,
    nodesExplored: simulationResult.nodesExplored
  };
}

/**
 * Calculate relative differences from baseline for sensitivity results
 */
private calculateRelativeDifferences(results: SensitivityResult[]): void {
  // Find the baseline result (variation = 0 or 'baseline')
  const baseline = results.find(r => 
    r.variation === 0 || r.variation === 'baseline'
  );
  
  if (!baseline) return;
  
  // Calculate relative differences for each variation
  results.forEach(result => {
    if (result === baseline) {
      result.relativeDifference = { expectedValue: 0, optimalPathLength: 0 };
      return;
    }
    
    // Calculate percentage differences
    result.relativeDifference = {
      expectedValue: baseline.outcome.expectedValue !== 0 ?
        ((result.outcome.expectedValue - baseline.outcome.expectedValue) / 
         Math.abs(baseline.outcome.expectedValue)) * 100 : 0,
      optimalPathLength: baseline.outcome.optimalPathLength !== 0 ?
        ((result.outcome.optimalPathLength - baseline.outcome.optimalPathLength) / 
         baseline.outcome.optimalPathLength) * 100 : 0
    };
  });
}

/**
 * Find the most sensitive variables based on outcome variations
 */
private findMostSensitiveVariables(variableResults: VariableResults[]): MostSensitiveVariable[] {
  const sensitivities = variableResults.map(variable => {
    // Calculate the maximum absolute change in expected value
    const maxAbsChange = Math.max(
      ...variable.results
        .filter((r: SensitivityResult) => r.relativeDifference.expectedValue !== undefined)
        .map((r: SensitivityResult) => Math.abs(r.relativeDifference.expectedValue))
    );
    
    return {
      variable: variable.variable,
      description: variable.description,
      maxAbsoluteChange: maxAbsChange,
      // Get the specific variation that caused the max change
      criticalVariation: this.findCriticalVariation(variable.results)
    };
  });
  
  // Sort by sensitivity (highest first)
  return sensitivities.sort((a, b) => b.maxAbsoluteChange - a.maxAbsoluteChange);
}

/**
 * Find the critical variation that caused the biggest change
 */
private findCriticalVariation(results: SensitivityResult[]): { variation: string | number, impact: number } | null {
  if (!results || results.length === 0) return null;
  
  let maxAbsChange = 0;
  let criticalResult: SensitivityResult | null = null;
  
  for (const result of results) {
    if (!result.relativeDifference || !result.relativeDifference.expectedValue) continue;
    
    const absChange = Math.abs(result.relativeDifference.expectedValue);
    
    if (absChange > maxAbsChange) {
      maxAbsChange = absChange;
      criticalResult = result;
    }
  }
  
  return criticalResult && criticalResult.relativeDifference.expectedValue !== undefined ? {
    variation: criticalResult.variation,
    impact: criticalResult.relativeDifference.expectedValue
  } : null;
}

/**
 * Generate insights from sensitivity analysis results
 */
private generateSensitivityInsights(sensitivityResults: SensitivityAnalysisResults): SensitivityInsight[] {
  const insights: SensitivityInsight[] = [];
  
  // Get the two most sensitive variables
  const mostSensitive = sensitivityResults.mostSensitiveVariables.slice(0, 2);
  
  // Generate main insight about most sensitive variable
  if (mostSensitive.length > 0) {
    const topVariable = mostSensitive[0];
    
    insights.push({
      title: `${topVariable.description} Is Most Impactful`,
      description: `Changes in ${topVariable.description.toLowerCase()} have the largest impact on outcomes, with up to ${topVariable.maxAbsoluteChange.toFixed(1)}% change in expected value.`,
      importance: 'high',
      category: 'sensitivity'
    });
    
    // Add insight about critical variation
    if (topVariable.criticalVariation) {
      const direction = topVariable.criticalVariation.impact > 0 ? 'positive' : 'negative';
      insights.push({
        title: `Critical Threshold Identified`,
        description: `A ${topVariable.criticalVariation.variation} change in ${topVariable.description.toLowerCase()} results in a significant ${direction} impact of ${Math.abs(topVariable.criticalVariation.impact).toFixed(1)}% on expected outcomes.`,
        importance: 'high',
        category: 'threshold'
      });
    }
  }
  
  // Generate insights about economic conditions if available
  const economicResults = sensitivityResults.variableResults.find(
    (v) => v.variable.name === 'economicGrowth'
  );
  
  if (economicResults) {
    // Find the worst economic scenario
    const worstScenario = economicResults.results.reduce(
      (worst: SensitivityResult | null, current: SensitivityResult) => {
        return (!worst || current.outcome.expectedValue < worst.outcome.expectedValue) ? 
          current : worst;
      }, null
    );
    
    if (worstScenario && worstScenario.relativeDifference.expectedValue !== undefined) {
      insights.push({
        title: `${worstScenario.variation} Economic Scenario Risk`,
        description: `The ${worstScenario.variation} economic scenario shows a ${Math.abs(worstScenario.relativeDifference.expectedValue).toFixed(1)}% decrease in expected value compared to baseline.`,
        importance: 'medium',
        category: 'risk'
      });
      
      // Add resilience insight for variables with low sensitivity
      const lowSensitivityVariables = sensitivityResults.mostSensitiveVariables
        .slice(-2) // Get the two least sensitive variables
        .filter(v => v.maxAbsoluteChange < 5); // Only if they're truly low sensitivity
        
      if (lowSensitivityVariables.length > 0) {
        insights.push({
          title: 'Resilience Factors Identified',
          description: `The simulation shows low sensitivity to changes in ${lowSensitivityVariables.map((v) => v.description.toLowerCase()).join(', ')}, indicating resilience in these areas.`,
          importance: 'medium',
          category: 'resilience'
        });
      }
    }
  }
    
  return insights;
}
  
  /**
   * Calculate expected values from simulation results
   */
  private calculateExpectedValues(simulationResults: MCSimulationResults): any {
    // Extract the best action path
    const bestActionPath = simulationResults.bestActionPath;
    
    // Calculate expected values
    return {
      expectedTariffChange: bestActionPath.reduce((total: number, action: any) => {
        if (action.type === 'MODIFY_TARIFF') {
          return total + action.change;
        }
        return total;
      }, 0),
      expectedPoliciesApplied: bestActionPath.filter((action: any) => action.type === 'APPLY_POLICY').length,
      confidenceLevel: simulationResults.confidenceInterval ? 
        (simulationResults.confidenceInterval[1] - simulationResults.confidenceInterval[0]) : 0.95
    };
  }
  
  /**
   * Calculate risk metrics from simulation results
   */
  private calculateRiskMetrics(simulationResults: MCSimulationResults): any {
    // Calculate risk metrics
    return {
      riskExposure: simulationResults.bestActionPath.length > 0 ? 
        simulationResults.bestActionPath.length * 0.1 : 0,
      confidenceInterval: simulationResults.confidenceInterval || [0, 0],
      maxDepthReached: simulationResults.maxDepthReached || 0,
      nodesExplored: simulationResults.nodesExplored || 0
    };
  }
  
  /**
   * Generate flow data for visualization from simulation results
   */
  private generateFlowData(simulationResults: MCSimulationResults): any {
    // Generate flow data for Sankey diagram
    const nodes: string[] = [];
    const links: any[] = [];
    
    // Add nodes and links based on best action path
    let prevNode = 'Start';
    nodes.push(prevNode);
    
    simulationResults.bestActionPath.forEach((action: any, index: number) => {
      let nodeName = '';
      
      if (action.type === 'MODIFY_TARIFF') {
        nodeName = `${action.country} ${action.change > 0 ? '+' : ''}${action.change}% on ${action.product}`;
      } else if (action.type === 'APPLY_POLICY') {
        nodeName = `Apply ${action.policy}`;
      } else {
        nodeName = `Step ${index + 1}`;
      }
      
      // Add node if not already present
      if (!nodes.includes(nodeName)) {
        nodes.push(nodeName);
      }
      
      // Add link
      links.push({
        source: prevNode,
        target: nodeName,
        value: 1
      });
      
      prevNode = nodeName;
    });
    
    // Add final node
    const finalNode = 'End';
    nodes.push(finalNode);
    links.push({
      source: prevNode,
      target: finalNode,
      value: 1
    });
    
    return { nodes, links };
  }
  
  /**
   * Extract country data from the ontology
   */
  private extractCountryData() {
    const countries = this.ontology.getInstancesOfClass('tas:ASEANCountry');
    
    return countries.map(country => {
      const countryName = this.ontology.getLabelForInstance(country);
      
      // Get tariff changes for this country
      const tariffChanges = this.ontology.getEntitiesByRelation('tas:concernsCountry', country);
      
      // Calculate average tariff rate
      let totalRate = 0;
      let changeCount = 0;
      
      tariffChanges.forEach(change => {
        const rate = parseFloat(this.ontology.getDataPropertyValue(change, 'tas:hasTariffRate') as string);
        if (!isNaN(rate)) {
          totalRate += rate;
          changeCount++;
        }
      });
      
      const avgTariffRate = changeCount > 0 ? totalRate / changeCount : 0;
      
      // Get industry impacts
      const impacts: any[] = [];
      tariffChanges.forEach(change => {
        const impactEntities = this.ontology.getRelatedObjects(change, 'tas:indicatesImpact');
        
        impactEntities.forEach(impact => {
          impacts.push({
            name: this.ontology.getLabelForInstance(impact as string),
            severity: parseInt(this.ontology.getDataPropertyValue(impact as string, 'tas:hasImpactSeverity') as string),
            estimatedImpact: parseFloat(this.ontology.getDataPropertyValue(impact as string, 'tas:hasEstimatedAnnualImpact') as string)
          });
        });
      });
      
      return {
        name: countryName,
        uri: country,
        avgTariffRate,
        impacts,
        tariffChanges: tariffChanges.length
      };
    });
  }
  
  /**
   * Extract product data from the ontology
   */
  private extractProductData() {
    const products = this.ontology.getInstancesOfClass('tas:ProductCategory');
    
    return products.map(product => {
      const productName = this.ontology.getLabelForInstance(product);
      const tradeVolume = parseFloat(this.ontology.getDataPropertyValue(product, 'tas:hasTradeVolume') as string) || 0;
      
      return {
        name: productName,
        uri: product,
        tradeVolume,
        // Add other relevant product properties
      };
    });
  }
  
  /**
   * Extract policy data from the ontology
   */
  private extractPolicyData() {
    const policies = this.ontology.getInstancesOfClass('tas:TariffPolicy');
    
    return policies.map(policy => {
      const policyName = this.ontology.getLabelForInstance(policy);
      
      return {
        name: policyName,
        uri: policy,
        // Add other relevant policy properties
      };
    });
  }
  
  /**
   * Create initial state for Monte Carlo Tree Search
   */
  private createInitialState(countryData: any[], productData: any[], policyData: any[]) {
    // Create initial state for MCTS
    return {
      countries: countryData,
      products: productData,
      policies: policyData,
      currentMonth: 0,
      tariffRates: this.buildTariffRateMatrix(countryData, productData),
      tradeVolumes: this.buildTradeVolumeMatrix(countryData, productData)
    };
  }
  
  /**
   * Build tariff rate matrix
   */
  private buildTariffRateMatrix(countryData: any[], productData: any[]) {
    // Create a matrix of tariff rates for country-product combinations
    const matrix: Record<string, Record<string, number>> = {};
    
    countryData.forEach(country => {
      matrix[country.name] = {};
      
      productData.forEach(product => {
        // Query ontology for specific tariff rate
        const tariffChanges = this.ontology.query(`
          PREFIX tas: <http://example.org/tariff-alert-scanner#>
          SELECT ?rate WHERE {
            ?change tas:concernsCountry <${country.uri}> .
            ?change tas:affectsProductCategory <${product.uri}> .
            ?change tas:hasTariffRate ?rate .
          }
          ORDER BY DESC(?date)
          LIMIT 1
        `);
        
        if (tariffChanges.length > 0) {
          matrix[country.name][product.name] = parseFloat(tariffChanges[0].rate as string);
        } else {
          matrix[country.name][product.name] = 0; // Default
        }
      });
    });
    
    return matrix;
  }
  
  /**
   * Build trade volume matrix
   */
  private buildTradeVolumeMatrix(countryData: any[], productData: any[]) {
    // Create a matrix of trade volumes for country-product combinations
    const matrix: Record<string, Record<string, number>> = {};
    
    countryData.forEach(country => {
      matrix[country.name] = {};
      
      productData.forEach(product => {
        // For now, we'll use the product's overall trade volume
        // In a real implementation, we would have country-specific volumes
        matrix[country.name][product.name] = product.tradeVolume || 0;
      });
    });
    
    return matrix;
  }
  
  /**
   * Update ontology with simulation results
   */
  private updateOntologyWithSimulationResults() {
    // Skip if no results
    if (!this.simulationResults) return null;
    
    // Create simulation report in the ontology
    const reportId = `tas:MCTSSimulationReport_${Date.now()}`;
    
    const statements = [
      `${reportId} a mctsagent:SimulationReport prov:Entity .`,
      `${reportId} rdfs:label "Monte Carlo Tariff Simulation Report"@en .`,
      `${reportId} prov:wasGeneratedBy mctsagent:TariffSimulationActivity .`,
      `${reportId} prov:wasAttributedTo tas:TariffAlertScannerAgent .`,
      `${reportId} prov:generatedAtTime "${new Date().toISOString()}"^^xsd:dateTime .`,
      `${reportId} dc:description "Simulation of tariff impacts across ASEAN countries over 24 months."@en .`
    ];
    
    // Add simulation data
    if (this.simulationResults.expectedValues) {
      // Expected values for each country
      Object.entries(this.simulationResults.expectedValues).forEach(([country, value]) => {
        statements.push(`${reportId} mctsagent:hasCountryImpact [ 
          mctsagent:forCountry tas:${(country as string).replace(/\s+/g, '')} ;
          mctsagent:hasExpectedValue "${value}"^^xsd:decimal 
        ] .`);
      });
    }
    
    // Risk metrics
    if (this.simulationResults.riskMetrics) {
      Object.entries(this.simulationResults.riskMetrics).forEach(([metricName, value]) => {
        statements.push(`${reportId} mctsagent:hasRiskMetric [ 
          mctsagent:metricName "${metricName}"@en ;
          mctsagent:metricValue "${value}"^^xsd:decimal 
        ] .`);
      });
    }
    
    // Add to ontology
    this.ontology.store.addTurtleStatements(statements.join('\n'));
    
    return reportId;
  }
  
  /**
   * Generate Sankey data from simulation results
   */
  public generateSankeyData() {
    if (!this.simulationResults) return null;
    
    // Leverage the flowData if it exists (should be provided by monteCarloWorker)
    if (this.simulationResults.flowData) {
      return this.simulationResults.flowData;
    }
    
    // Otherwise, generate from ontology and simulation results
    return this.generateSankeyDataFromOntology();
  }
  
  /**
   * Generate Sankey data from ontology
   */
  private generateSankeyDataFromOntology() {
    // Generate nodes
    const nodes: any[] = [];
    const links: any[] = [];
    
    // Get ASEAN countries
    const aseanCountries = this.ontology.getInstancesOfClass('tas:ASEANCountry');
    
    // Get product categories
    const productCategories = this.ontology.getInstancesOfClass('tas:ProductCategory');
    
    // Add country nodes
    aseanCountries.forEach(country => {
      nodes.push({
        name: this.ontology.getLabelForInstance(country),
        group: 'country'
      });
    });
    
    // Add product category nodes
    productCategories.forEach(category => {
      nodes.push({
        name: this.ontology.getLabelForInstance(category),
        group: 'product'
      });
    });
    
    // Add policy nodes
    const policies = this.ontology.getInstancesOfClass('tas:TariffPolicy');
    policies.forEach(policy => {
      nodes.push({
        name: this.ontology.getLabelForInstance(policy),
        group: 'policy'
      });
    });
    
    // Get tariff changes and create links
    const tariffChanges = this.ontology.getInstancesOfClass('tas:TariffChange');
    
    tariffChanges.forEach(tariffChange => {
      // Get associated country
      const country = this.ontology.getRelatedObject(tariffChange, 'tas:concernsCountry');
      if (!country) return;
      
      const countryName = this.ontology.getLabelForInstance(country as string);
      const countryIndex = nodes.findIndex(n => n.name === countryName);
      
      // Get affected product categories
      const categories = this.ontology.getRelatedObjects(tariffChange, 'tas:affectsProductCategory');
      
      categories.forEach(category => {
        if (!category) return;
        
        const categoryName = this.ontology.getLabelForInstance(category as string);
        const categoryIndex = nodes.findIndex(n => n.name === categoryName);
        
        // Create country -> category link
        if (countryIndex >= 0 && categoryIndex >= 0) {
          const tariffRate = this.ontology.getDataPropertyValue(tariffChange, 'tas:hasTariffRate');
          
          links.push({
            source: countryIndex,
            target: categoryIndex,
            value: this.calculateLinkValue(tariffRate as string, category as string),
            uiColor: 'rgba(0, 114, 170, 0.6)', // SCB Honolulu Blue
            aiEnhanced: this.isAIEnhanced(tariffChange)
          });
        }
        
        // Get associated policy
        const policy = this.ontology.getRelatedObject(tariffChange, 'tas:implementsPolicy');
        if (policy) {
          const policyName = this.ontology.getLabelForInstance(policy as string);
          const policyIndex = nodes.findIndex(n => n.name === policyName);
          
          // Create category -> policy link
          if (categoryIndex >= 0 && policyIndex >= 0) {
            links.push({
              source: categoryIndex,
              target: policyIndex,
              value: this.calculateLinkValue(tariffRate as string, category as string) * 0.8,
              uiColor: 'rgba(33, 170, 71, 0.6)', // SCB American Green
              aiEnhanced: this.isAIEnhanced(tariffChange)
            });
          }
        }
      });
    });
    
    return {
      nodes,
      links,
      aiInsights: this.generateAIInsights()
    };
  }
  
  /**
   * Calculate link value for Sankey diagram
   */
  private calculateLinkValue(tariffRate: string, category: string): number {
    // Calculate link value based on tariff rate and category impact
    const rate = parseFloat(tariffRate.replace('%', ''));
    
    // Apply category-specific multipliers according to economic impact
    const categoryMultiplier = 
      category === 'Agriculture' ? 1.2 : 
      category === 'Electronics' ? 0.9 : 
      category === 'Automotive' ? 1.5 :
      category === 'Pharmaceuticals' ? 0.7 :
      category === 'Textiles' ? 1.1 : 1.0;
    
    // Return the scaled link value
    return isNaN(rate) ? 1 : rate * categoryMultiplier;
  }
  
  /**
   * Check if a tariff change has been enhanced by AI
   */
  private isAIEnhanced(tariffChange: string): boolean {
    // Check the ontology to see if this tariff change has AI enhancements
    // Use the OntologyManager public methods instead of accessing private store
    return this.ontology.getRelatedObject(
      tariffChange,
      'tas:hasAIEnhancement'
    ) !== null;
  }
  
  /**
   * Generate AI insights for the visualization
   */
  private generateAIInsights() {
    // Use simulation results if available
    if (this.simulationResults && this.simulationResults.optimalPath) {
      return {
        summary: "AI-enhanced analysis of tariff impacts based on Monte Carlo simulation results.",
        recommendations: this.simulationResults.optimalPath.recommendations || [
          "Monitor changes in tariff rates for key product categories.",
          "Consider diversifying suppliers to mitigate tariff impacts.",
          "Prepare contingency plans for potential tariff escalations."
        ],
        confidence: 0.85,
        updatedAt: new Date()
      };
    }
    
    // Otherwise check ontology for relevant analysis
    const reports = this.ontology.getInstancesOfClass('tas:TariffAnalysis');
    
    if (reports.length === 0) {
      return {
        summary: "No recent tariff analysis available. Run a simulation for more detailed insights.",
        recommendations: [
          "Configure the system to monitor key countries and product categories.",
          "Run Monte Carlo simulations to predict potential tariff impacts."
        ],
        confidence: 0.5,
        updatedAt: new Date()
      };
    }
    
    // Sort by date and take most recent
    const sortedReports = reports.sort((a, b) => {
      const dateA = new Date(this.ontology.getDataPropertyValue(a, 'prov:generatedAtTime') as string);
      const dateB = new Date(this.ontology.getDataPropertyValue(b, 'prov:generatedAtTime') as string);
      return dateB.getTime() - dateA.getTime();
    });
    
    const latestReport = sortedReports[0];
    const description = this.ontology.getDataPropertyValue(latestReport, 'dc:description');
    
    // Generate AI recommendations
    const recommendations: string[] = [];
    
    // Get recent alerts to derive recommendations
    const recentAlerts = this.ontology.getInstancesOfClass('tas:TariffAlert').slice(0, 5);
    recentAlerts.forEach(alert => {
      const tariffChange = this.ontology.getRelatedObject(alert, 'tas:relatesTo');
      if (tariffChange) {
        const country = this.ontology.getRelatedObject(tariffChange as string, 'tas:concernsCountry');
        if (!country) return;
        
        const countryName = this.ontology.getLabelForInstance(country as string);
        const rate = this.ontology.getDataPropertyValue(tariffChange as string, 'tas:hasTariffRate');
        
        recommendations.push(`Monitor ${countryName} exports subject to new ${rate}% tariff rate.`);
      }
    });
    
    // If we have industry impacts, add recommendations based on them
    const impacts = this.ontology.getInstancesOfClass('tas:IndustryImpact');
    if (impacts.length > 0) {
      // Sort by severity
      const sortedImpacts = impacts.sort((a, b) => {
        const severityA = parseInt(this.ontology.getDataPropertyValue(a, 'tas:hasImpactSeverity') as string);
        const severityB = parseInt(this.ontology.getDataPropertyValue(b, 'tas:hasImpactSeverity') as string);
        return severityB - severityA;
      });
      
      // Add recommendation for highest impact industry
      const highestImpact = sortedImpacts[0];
      const impactLabel = this.ontology.getLabelForInstance(highestImpact);
      const severity = this.ontology.getDataPropertyValue(highestImpact, 'tas:hasImpactSeverity');
      
      recommendations.push(`Prioritize risk mitigation for ${impactLabel} (severity: ${severity}/10).`);
    }
    
    return {
      summary: description as string || "Analysis of recent tariff changes affecting ASEAN countries.",
      recommendations: recommendations.length > 0 ? recommendations : [
        "Setup regular monitoring for key product categories.",
        "Consider diversification strategies to reduce tariff exposure."
      ],
      confidence: 0.75,
      updatedAt: new Date()
    };
  }
}

// Create instance before exporting
const tariffImpactSimulator = new TariffImpactSimulator(ontologyManager);
export default tariffImpactSimulator;
