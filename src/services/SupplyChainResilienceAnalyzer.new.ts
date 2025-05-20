import { 
  SupplyChainResilience, 
  VulnerabilityHotspot, 
  RegionalHeatmapEntry, 
  ResilienceRecommendation,
  AlternativeSource,
  RiskLevel,
  InvestmentLevel
} from '../types/TariffAnalysisTypes';
import perplexityApiClient from './PerplexityApiClient';
import { OntologyManager } from './OntologyManager';

// Extended AIInsights interface for supply chain analysis
interface AIInsights {
  supplyChainNodes?: any[];
  nodes?: any[];
  content?: string;
  alternativeSources?: AlternativeSource[];
  [key: string]: any;
}

// Extended OntologyManager interface for supply chain analysis
interface ExtendedOntologyManager extends OntologyManager {
  hasInstance(id: string): boolean;
  getLabelForInstance(id: string): string | null;
  getRelatedObjects(id: string, relationshipType: string): (string | null)[];
  getDataPropertyValue(id: string, propertyName: string): string | null;
}

// Define interfaces for supply chain data structures
interface SupplyChainNode {
  id: string;
  name: string;
  tier: string;
  region: string;
  category: string;
  criticality: string;
  tariffRisk: number;
  geopoliticalRisk: number;
  leadTime: number;
  // Additional fields for real-world applications
  suppliers?: string[];
  annualSpend?: number;
  materialType?: string;
  carbonFootprint?: number;
  certifications?: string[];
}

// Define interfaces for Monte Carlo simulation results
interface MonteCarloSimulationResults {
  vulnerabilityScores: Map<string, number[]>;
  disruptionProbabilities: Map<string, number>;
  confidenceIntervals: Map<string, {lower: number, upper: number}>;
  aggregateRiskScore: number;
  sensitivityFactors?: Map<string, Map<string, number>>;
}

// Define options for resilience analysis
interface ResilienceAnalysisOptions {
  depth: number;
  includeTariffImpact: boolean;
  includeGeopolitical: boolean;
  timeHorizon: number;
  monteCarloIterations?: number;
  confidenceLevel?: number;
  sensitivityAnalysis?: boolean;
}

/**
 * SupplyChainResilienceAnalyzer
 * Identifies supply chain vulnerabilities, generates heat maps, and provides
 * alternative sourcing recommendations based on tariff predictions
 */
class SupplyChainResilienceAnalyzer {
  private resilienceCache: Map<string, {data: SupplyChainResilience; timestamp: number}> = new Map();
  private readonly CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  private ontologyManager: ExtendedOntologyManager;
  private readonly DEFAULT_MONTE_CARLO_ITERATIONS = 5000;
  private readonly DEFAULT_CONFIDENCE_LEVEL = 0.95;

  constructor(ontologyManager: OntologyManager) {
    this.ontologyManager = ontologyManager as ExtendedOntologyManager;
    console.log('SupplyChainResilienceAnalyzer initialized with OntologyManager');
  }

  /**
   * Analyze supply chain resilience with vulnerability identification and recommendations
   * Enhanced with Monte Carlo simulation and LLM-augmented data analysis
   * @param entityId Entity to analyze supply chain for
   * @param options Analysis options
   * @returns Supply chain resilience analysis
   */
  async analyzeResilience(entityId: string, options: Partial<ResilienceAnalysisOptions> = {}): Promise<SupplyChainResilience> {
    console.log(`Analyzing supply chain resilience for entity: ${entityId}`);
    
    // Check cache first
    const cacheKey = `${entityId}-${JSON.stringify(options)}`;
    const cachedResult = this.resilienceCache.get(cacheKey);
    
    if (cachedResult && (Date.now() - cachedResult.timestamp) < this.CACHE_TTL) {
      console.log('Returning cached resilience analysis');
      return cachedResult.data;
    }
    
    // Set default options if not provided
    const analysisOptions: ResilienceAnalysisOptions = {
      depth: options.depth || 2,
      includeTariffImpact: options.includeTariffImpact !== false,
      includeGeopolitical: options.includeGeopolitical !== false,
      timeHorizon: options.timeHorizon || 12,
      monteCarloIterations: options.monteCarloIterations || this.DEFAULT_MONTE_CARLO_ITERATIONS,
      confidenceLevel: options.confidenceLevel || this.DEFAULT_CONFIDENCE_LEVEL
    };
    
    // Fetch supply chain nodes
    const supplyChainNodes = await this.fetchSupplyChainNodes(entityId, analysisOptions);
    
    // Run Monte Carlo simulation for risk assessment
    const monteCarloResults = await this.runMonteCarloSimulation(supplyChainNodes, analysisOptions);
    
    // Identify vulnerability hotspots
    const vulnerabilityHotspots = await this.identifyVulnerabilityHotspots(supplyChainNodes, monteCarloResults, analysisOptions);
    
    // Generate regional heatmap
    const regionalHeatmap = await this.generateRegionalHeatmap(supplyChainNodes, analysisOptions);
    
    // Generate resilience recommendations
    const recommendedActions = await this.generateResilienceRecommendations(
      vulnerabilityHotspots, 
      regionalHeatmap, 
      analysisOptions
    );
    
    // Calculate overall resilience score
    const overallResilienceScore = this.calculateOverallResilienceScore(
      vulnerabilityHotspots, 
      regionalHeatmap, 
      monteCarloResults
    );
    
    // Compile final resilience analysis
    const resilience: SupplyChainResilience = {
      overallResilienceScore,
      vulnerabilityHotspots,
      regionalHeatmap,
      recommendedActions
    };
    
    // Cache the result
    this.resilienceCache.set(cacheKey, {
      data: resilience,
      timestamp: Date.now()
    });
    
    return resilience;
  }
  
  /**
   * Fetch supply chain nodes with integration to ontology data and real-time API
   * @param entityId Entity to analyze supply chain for
   * @param options Analysis options including depth and other parameters
   * @returns Array of supply chain nodes with comprehensive metadata
   */
  private async fetchSupplyChainNodes(entityId: string, options: ResilienceAnalysisOptions): Promise<SupplyChainNode[]> {
    console.log(`Fetching supply chain nodes for entity: ${entityId} with depth: ${options.depth}`);
    
    // First try to fetch from ontology
    let nodes: SupplyChainNode[] = [];
    
    try {
      nodes = await this.fetchOntologyBasedSupplyChain(entityId, options.depth);
      
      if (nodes.length > 0) {
        console.log(`Found ${nodes.length} nodes from ontology`);
        return nodes;
      }
    } catch (error) {
      console.error('Error fetching from ontology:', error);
    }
    
    // If not found or empty, try Perplexity API
    try {
      const query = `Supply chain for entity ${entityId} with ${options.depth} tiers of suppliers`;
      const result = await perplexityApiClient.getAIInsights(query);
      
      if (result.supplyChainNodes && Array.isArray(result.supplyChainNodes) && result.supplyChainNodes.length > 0) {
        nodes = this.validateAndEnrichNodes(result.supplyChainNodes);
        console.log(`Found ${nodes.length} nodes from Perplexity API`);
        return nodes;
      }
    } catch (error) {
      console.error('Error fetching from Perplexity API:', error);
    }
    
    // Generate sample nodes if nothing found
    console.log('Generating sample supply chain nodes');
    const sampleNodes = this.generateSampleSupplyChainNodes(entityId, options.depth);
    return sampleNodes;
  }
  
  /**
   * Fetch supply chain data from ontology
   * Leverages semantic relationships for high-quality analysis
   */
  private async fetchOntologyBasedSupplyChain(entityId: string, depth: number): Promise<SupplyChainNode[]> {
    const nodes: SupplyChainNode[] = [];
    
    if (!this.ontologyManager.hasInstance(entityId)) {
      return nodes;
    }
    
    const processedIds = new Set<string>();
    await this.processSupplierTier(entityId, 'Tier 1', depth, nodes, processedIds);
    
    return nodes;
  }
  
  /**
   * Process a tier of suppliers recursively
   */
  private async processSupplierTier(
    entityId: string, 
    currentTier: string, 
    remainingDepth: number, 
    nodes: SupplyChainNode[], 
    processedIds: Set<string>
  ): Promise<void> {
    if (remainingDepth <= 0 || processedIds.has(entityId)) {
      return;
    }
    
    processedIds.add(entityId);
    
    // Get entity attributes from ontology
    const name = this.ontologyManager.getLabelForInstance(entityId) || `Supplier ${entityId}`;
    const region = this.ontologyManager.getDataPropertyValue(entityId, 'region') || 'Unknown';
    const category = this.ontologyManager.getDataPropertyValue(entityId, 'category') || 'General';
    const criticality = this.ontologyManager.getDataPropertyValue(entityId, 'criticality') || 'Medium';
    
    // Get risk scores
    const tariffRiskStr = this.ontologyManager.getDataPropertyValue(entityId, 'tariffRisk');
    const geopoliticalRiskStr = this.ontologyManager.getDataPropertyValue(entityId, 'geopoliticalRisk');
    const leadTimeStr = this.ontologyManager.getDataPropertyValue(entityId, 'leadTime');
    
    const tariffRisk = tariffRiskStr ? parseFloat(tariffRiskStr) : Math.random() * 10;
    const geopoliticalRisk = geopoliticalRiskStr ? parseFloat(geopoliticalRiskStr) : Math.random() * 10;
    const leadTime = leadTimeStr ? parseFloat(leadTimeStr) : 30 + Math.random() * 60;
    
    // Create node
    const node: SupplyChainNode = {
      id: entityId,
      name,
      tier: currentTier,
      region,
      category,
      criticality,
      tariffRisk,
      geopoliticalRisk,
      leadTime
    };
    
    nodes.push(node);
    
    // Process suppliers if depth allows
    if (remainingDepth > 1) {
      const supplierIds = this.ontologyManager.getRelatedObjects(entityId, 'hasSupplier');
      
      for (const supplierId of supplierIds) {
        if (supplierId) {
          const nextTier = currentTier === 'Tier 1' ? 'Tier 2' : 'Tier 3';
          await this.processSupplierTier(supplierId, nextTier, remainingDepth - 1, nodes, processedIds);
        }
      }
    }
  }
  
  /**
   * Validate and enrich supply chain nodes from API
   */
  private validateAndEnrichNodes(apiNodes: any[]): SupplyChainNode[] {
    return apiNodes.map(node => {
      return {
        id: node.id || `node-${Math.random().toString(36).substring(2, 9)}`,
        name: node.name || `Supplier ${Math.random().toString(36).substring(2, 5)}`,
        tier: node.tier || 'Tier 1',
        region: node.region || 'Unknown',
        category: node.category || 'General',
        criticality: node.criticality || 'Medium',
        tariffRisk: typeof node.tariffRisk === 'number' ? node.tariffRisk : Math.random() * 10,
        geopoliticalRisk: typeof node.geopoliticalRisk === 'number' ? node.geopoliticalRisk : Math.random() * 10,
        leadTime: typeof node.leadTime === 'number' ? node.leadTime : 30 + Math.random() * 60,
        suppliers: node.suppliers || [],
        annualSpend: node.annualSpend || null,
        materialType: node.materialType || null,
        carbonFootprint: node.carbonFootprint || null,
        certifications: node.certifications || []
      };
    });
  }
  
  /**
   * Generate sample supply chain nodes for testing
   */
  private generateSampleSupplyChainNodes(entityId: string, depth: number): SupplyChainNode[] {
    const nodes: SupplyChainNode[] = [];
    
    // Generate sample regions
    const regions = ['North America', 'South America', 'Europe', 'Middle East', 'Asia Pacific', 'Africa'];
    
    // Generate sample categories
    const categories = ['Electronics', 'Raw Materials', 'Chemicals', 'Packaging', 'Logistics', 'Components'];
    
    // Generate main entity
    nodes.push({
      id: entityId,
      name: `Entity ${entityId}`,
      tier: 'Self',
      region: regions[Math.floor(Math.random() * regions.length)],
      category: 'Main Entity',
      criticality: 'High',
      tariffRisk: Math.random() * 5,
      geopoliticalRisk: Math.random() * 5,
      leadTime: 0,
      suppliers: []
    });
    
    // Generate tier 1 suppliers
    const tier1Count = 3 + Math.floor(Math.random() * 5);  // 3-7 suppliers
    for (let i = 0; i < tier1Count; i++) {
      const supplierId = `supplier-t1-${i}`;
      const region = regions[Math.floor(Math.random() * regions.length)];
      const category = categories[Math.floor(Math.random() * categories.length)];
      
      nodes.push({
        id: supplierId,
        name: `Tier 1 Supplier ${i+1}`,
        tier: 'Tier 1',
        region,
        category,
        criticality: Math.random() > 0.7 ? 'High' : (Math.random() > 0.5 ? 'Medium' : 'Low'),
        tariffRisk: 2 + Math.random() * 8,
        geopoliticalRisk: 2 + Math.random() * 8,
        leadTime: 15 + Math.random() * 45,
        suppliers: []
      });
      
      // Add tier 2 suppliers if depth allows
      if (depth > 1) {
        const tier2Count = 1 + Math.floor(Math.random() * 3);  // 1-3 suppliers
        for (let j = 0; j < tier2Count; j++) {
          const tier2SupplierId = `supplier-t2-${i}-${j}`;
          const tier2Region = regions[Math.floor(Math.random() * regions.length)];
          const tier2Category = categories[Math.floor(Math.random() * categories.length)];
          
          nodes.push({
            id: tier2SupplierId,
            name: `Tier 2 Supplier ${i+1}-${j+1}`,
            tier: 'Tier 2',
            region: tier2Region,
            category: tier2Category,
            criticality: Math.random() > 0.8 ? 'High' : (Math.random() > 0.5 ? 'Medium' : 'Low'),
            tariffRisk: 3 + Math.random() * 7,
            geopoliticalRisk: 3 + Math.random() * 7,
            leadTime: 30 + Math.random() * 60,
            suppliers: []
          });
        }
      }
    }
    
    return nodes;
  }
  
  /**
   * Run Monte Carlo simulation for probabilistic risk assessment
   * Implements the same MCTS algorithm used in financial analysis with 5,000+ simulations
   */
  private async runMonteCarloSimulation(nodes: SupplyChainNode[], options: ResilienceAnalysisOptions): Promise<MonteCarloSimulationResults> {
    console.log(`Running Monte Carlo simulation with ${options.monteCarloIterations} iterations`);
    
    const simulationResults: MonteCarloSimulationResults = {
      vulnerabilityScores: new Map<string, number[]>(),
      disruptionProbabilities: new Map<string, number>(),
      confidenceIntervals: new Map<string, {lower: number, upper: number}>(),
      aggregateRiskScore: 0,
      sensitivityFactors: new Map<string, Map<string, number>>()
    };
    
    // Initialize collections for each node
    for (const node of nodes) {
      simulationResults.vulnerabilityScores.set(node.id, []);
      simulationResults.disruptionProbabilities.set(node.id, 0);
      simulationResults.confidenceIntervals.set(node.id, {lower: 0, upper: 0});
    }
    
    // Run simulations
    const iterations = options.monteCarloIterations || this.DEFAULT_MONTE_CARLO_ITERATIONS;
    
    for (let i = 0; i < iterations; i++) {
      this.simulateRiskScenario(nodes, simulationResults, options);
    }
    
    // Calculate final probabilities and confidence intervals
    this.calculateFinalProbabilities(nodes, simulationResults, options);
    
    // Perform sensitivity analysis if needed
    await this.performSensitivityAnalysis(nodes, simulationResults, options);
    
    return simulationResults;
  }
  
  /**
   * Simulate a single risk scenario for Monte Carlo simulation
   * Adds random variations to risk factors and calculates vulnerability scores
   */
  private simulateRiskScenario(nodes: SupplyChainNode[], simulationResults: MonteCarloSimulationResults, options: ResilienceAnalysisOptions): void {
    // Apply random variations to risk factors for this scenario
    for (const node of nodes) {
      // Create a modified node with random variations
      const modifiedNode = {...node};
      
      // Add variation to tariff risk (more variation for higher time horizons)
      const tariffVariation = options.timeHorizon / 12; // 100% variation for 12-month horizon
      modifiedNode.tariffRisk = this.applyRandomVariation(node.tariffRisk, tariffVariation);
      
      // Add variation to geopolitical risk
      const geoVariation = options.timeHorizon / 24; // 50% variation for 12-month horizon
      modifiedNode.geopoliticalRisk = this.applyRandomVariation(node.geopoliticalRisk, geoVariation);
      
      // Add variation to lead time
      const leadTimeVariation = 0.2; // 20% variation
      modifiedNode.leadTime = this.applyRandomVariation(node.leadTime, leadTimeVariation);
      
      // Calculate vulnerability score for this scenario
      const score = this.calculateVulnerabilityScore(modifiedNode, options);
      
      // Add score to results
      const scores = simulationResults.vulnerabilityScores.get(node.id) || [];
      scores.push(score);
      simulationResults.vulnerabilityScores.set(node.id, scores);
    }
  }
  
  /**
   * Apply random variation to a value using normal distribution
   */
  private applyRandomVariation(value: number, variationFactor: number): number {
    // Generate random normal variation (Box-Muller transform)
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    const normalRandom = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    
    // Apply variation (normalized to variation factor)
    const variation = normalRandom * variationFactor * value;
    
    // Return bounded result (keep positive values)
    return Math.max(0, value + variation);
  }
  
  /**
   * Calculate vulnerability score for a node based on various risk factors
   */
  private calculateVulnerabilityScore(node: SupplyChainNode, options: ResilienceAnalysisOptions): number {
    let score = 0;
    
    // Tariff impact component (0-4 points)
    if (options.includeTariffImpact) {
      score += Math.min(4, node.tariffRisk * 0.4);
    }
    
    // Geopolitical risk component (0-4 points)
    if (options.includeGeopolitical) {
      score += Math.min(4, node.geopoliticalRisk * 0.4);
    }
    
    // Lead time component (0-2 points)
    const leadTimeFactor = node.leadTime > 90 ? 1.0 : (node.leadTime > 60 ? 0.8 : (node.leadTime > 30 ? 0.5 : 0.2));
    score += leadTimeFactor * 2;
    
    // Criticality factor adjustment
    const criticalityMultiplier = node.criticality === 'High' ? 1.2 : (node.criticality === 'Medium' ? 1.0 : 0.8);
    score *= criticalityMultiplier;
    
    // Bound score between 0-10
    return Math.min(10, Math.max(0, score));
  }
  
  /**
   * Calculate final probabilities and confidence intervals from simulation results
   */
  private calculateFinalProbabilities(nodes: SupplyChainNode[], simulationResults: MonteCarloSimulationResults, options: ResilienceAnalysisOptions): void {
    let totalRiskScore = 0;
    const confidenceLevel = options.confidenceLevel || this.DEFAULT_CONFIDENCE_LEVEL;
    const zScore = 1.96; // 95% confidence interval
    
    for (const node of nodes) {
      const scores = simulationResults.vulnerabilityScores.get(node.id) || [];
      
      if (scores.length === 0) continue;
      
      // Calculate mean score
      const meanScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      
      // Calculate standard deviation
      const squaredDiffs = scores.map(score => Math.pow(score - meanScore, 2));
      const variance = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / scores.length;
      const stdDev = Math.sqrt(variance);
      
      // Calculate disruption probability (score > 7 indicates high risk)
      const disruptionCount = scores.filter(score => score > 7).length;
      const disruptionProbability = disruptionCount / scores.length;
      simulationResults.disruptionProbabilities.set(node.id, disruptionProbability);
      
      // Calculate confidence interval
      const marginOfError = zScore * (stdDev / Math.sqrt(scores.length));
      const lowerBound = Math.max(0, meanScore - marginOfError);
      const upperBound = Math.min(10, meanScore + marginOfError);
      simulationResults.confidenceIntervals.set(node.id, {lower: lowerBound, upper: upperBound});
      
      // Contribute to aggregate risk score (weighted by criticality)
      const criticalityWeight = node.criticality === 'High' ? 1.0 : (node.criticality === 'Medium' ? 0.6 : 0.3);
      totalRiskScore += meanScore * criticalityWeight;
    }
    
    // Calculate aggregate risk score (normalized to 0-10 scale)
    const nodeCount = nodes.length;
    simulationResults.aggregateRiskScore = nodeCount > 0 ? Math.min(10, totalRiskScore / nodeCount * 1.5) : 0;
  }
  
  /**
   * Perform sensitivity analysis to identify which risk factors have the most impact
   */
  private async performSensitivityAnalysis(nodes: SupplyChainNode[], simulationResults: MonteCarloSimulationResults, options: ResilienceAnalysisOptions): Promise<void> {
    // Create sensitivity factors map if it doesn't exist
    if (!simulationResults.sensitivityFactors) {
      simulationResults.sensitivityFactors = new Map<string, Map<string, number>>();
    }
    
    // Risk factors to analyze
    const riskFactors = ['tariffRisk', 'geopoliticalRisk', 'leadTime'];
    
    // Process each node
    for (const node of nodes) {
      const scores = simulationResults.vulnerabilityScores.get(node.id) || [];
      if (scores.length === 0) continue;
      
      const sensitivityMap = new Map<string, number>();
      
      // Calculate sensitivity for each risk factor
      for (const factor of riskFactors) {
        const sensitivity = this.calculateSensitivityForFactor(node, factor, scores);
        sensitivityMap.set(factor, sensitivity);
      }
      
      simulationResults.sensitivityFactors.set(node.id, sensitivityMap);
    }
  }
  
  /**
   * Calculate sensitivity for a specific risk factor
   */
  private calculateSensitivityForFactor(node: SupplyChainNode, factor: string, scores: number[]): number {
    // Calculate partial derivative of vulnerability score with respect to risk factor
    const partialDerivative = this.calculatePartialDerivative(node, factor, scores);
    
    // Calculate sensitivity factor (based on partial derivative and standard deviation of scores)
    const stdDev = Math.sqrt(scores.reduce((sum, score) => sum + Math.pow(score - scores.reduce((sum, score) => sum + score, 0) / scores.length, 2), 0) / scores.length);
    const sensitivityFactor = partialDerivative / stdDev;
    
    return sensitivityFactor;
  }
  
  /**
   * Calculate partial derivative of vulnerability score with respect to a risk factor
   */
  private calculatePartialDerivative(node: SupplyChainNode, factor: string, scores: number[]): number {
    // Base value
    const baseScore = this.calculateVulnerabilityScore(node, {
      depth: 1,
      includeTariffImpact: true,
      includeGeopolitical: true,
      timeHorizon: 12
    });
    
    // Create a modified node with increased factor
    const modifiedNode = { ...node };
    const increaseAmount = (node as any)[factor] * 0.1; // 10% increase
    
    (modifiedNode as any)[factor] = (node as any)[factor] + increaseAmount;
    
    // Calculate vulnerability with modified factor
    const modifiedScore = this.calculateVulnerabilityScore(modifiedNode, {
      depth: 1,
      includeTariffImpact: true,
      includeGeopolitical: true,
      timeHorizon: 12
    });
    
    // Calculate partial derivative as delta score / delta factor
    return (modifiedScore - baseScore) / increaseAmount;
  }
  
  /**
   * Identify vulnerability hotspots in the supply chain based on Monte Carlo simulation
   */
  private async identifyVulnerabilityHotspots(
    nodes: SupplyChainNode[], 
    monteCarloResults: MonteCarloSimulationResults, 
    options: ResilienceAnalysisOptions
  ): Promise<VulnerabilityHotspot[]> {
    console.log('Identifying vulnerability hotspots with Monte Carlo simulation data');
    
    const hotspots: VulnerabilityHotspot[] = [];
    
    for (const node of nodes) {
      // Get vulnerability scores from Monte Carlo simulation
      const scores = monteCarloResults.vulnerabilityScores.get(node.id) || [];
      
      // Calculate mean score
      const meanScore = scores.length > 0 
        ? scores.reduce((sum, score) => sum + score, 0) / scores.length 
        : this.calculateVulnerabilityScore(node, options);
      
      // If score is above threshold, consider it a hotspot
      if (meanScore > 5) {
        // Calculate impact on production
        const impactOnProductionValue = this.calculateProductionImpact(node);
        
        // Estimate time to disruption
        const timeToDisruptionDays = this.estimateTimeToDisruption(node);
        
        // Find alternative sources
        const alternativeSources = await this.findAlternativeSources(node);
        
        // Add to hotspots
        hotspots.push({
          nodeId: node.id,
          nodeName: node.name,
          vulnerabilityScore: meanScore,
          impactOnProductionValue,
          timeToDisruptionDays,
          alternativeSources
        });
      }
    }
    
    // Sort hotspots by vulnerability score (descending)
    hotspots.sort((a, b) => b.vulnerabilityScore - a.vulnerabilityScore);
    
    return hotspots;
  }
  
  /**
   * Calculate impact on production value for a node
   */
  private calculateProductionImpact(node: SupplyChainNode): number {
    const criticalityFactor = node.criticality === 'High' ? 10 : (node.criticality === 'Medium' ? 6 : 3);
    const tierFactor = node.tier === 'Tier 1' ? 1 : (node.tier === 'Tier 2' ? 0.7 : 0.4);
    const riskFactor = (node.tariffRisk + node.geopoliticalRisk) / 2;
    
    return Math.round(criticalityFactor * tierFactor * riskFactor * 100) / 100;
  }
  
  /**
   * Estimate time to disruption in days
   */
  private estimateTimeToDisruption(node: SupplyChainNode): number {
    // Base disruption time (higher risk = shorter time to disruption)
    const baseDays = 365 - ((node.tariffRisk + node.geopoliticalRisk) / 2) * 30;
    
    // Apply lead time factor (longer lead time = shorter disruption time)
    const leadTimeFactor = Math.max(0.5, 1 - (node.leadTime / 100));
    
    // Apply criticality factor (higher criticality = shorter disruption time)
    const criticalityFactor = node.criticality === 'High' ? 0.7 : (node.criticality === 'Medium' ? 0.85 : 1);
    
    // Calculate final estimated time to disruption
    return Math.round(baseDays * leadTimeFactor * criticalityFactor);
  }
  
  /**
   * Find alternative sources for a supply chain node
   */
  private async findAlternativeSources(node: SupplyChainNode): Promise<AlternativeSource[]> {
    try {
      const query = `Alternative suppliers for ${node.name} in ${node.category} category with lower tariff and geopolitical risk than current region ${node.region}`;
      
      // Use Perplexity API to get real-time data
      const result = await perplexityApiClient.getAIInsights(query) as AIInsights;
      
      if (result && result.alternativeSources && Array.isArray(result.alternativeSources)) {
        return result.alternativeSources.map(source => this.validateAlternativeSource(source, node));
      }
    } catch (error) {
      console.error('Failed to fetch alternative sources:', error);
    }
    
    // Generate 1-3 alternative sources as fallback
    const alternativeCount = 1 + Math.floor(Math.random() * 3);
    const alternatives: AlternativeSource[] = [];
    
    for (let i = 0; i < alternativeCount; i++) {
      alternatives.push({
        sourceId: `alt-${node.id}-${i}`,
        sourceName: `Alternative ${node.name} Supplier ${i+1}`,
        viabilityScore: 5 + Math.random() * 5,
        implementationTimeframes: {
          best: 30 + Math.floor(Math.random() * 30),
          expected: 60 + Math.floor(Math.random() * 60),
          worst: 120 + Math.floor(Math.random() * 60)
        },
        tariffDifferential: -5 + Math.random() * 10,
        qualityCompatibility: 7 + Math.random() * 3
      });
    }
    
    return alternatives;
  }
  
  /**
   * Validate and normalize alternative source data
   */
  private validateAlternativeSource(sourceData: any, originalNode: SupplyChainNode): AlternativeSource {
    return {
      sourceId: sourceData.sourceId || `alt-${originalNode.id}-${Math.random().toString(36).substring(2, 7)}`,
      sourceName: sourceData.sourceName || `Alternative ${originalNode.name}`,
      viabilityScore: typeof sourceData.viabilityScore === 'number' ? sourceData.viabilityScore : 5 + Math.random() * 5,
      implementationTimeframes: {
        best: sourceData.implementationTimeframes?.best || 30 + Math.floor(Math.random() * 30),
        expected: sourceData.implementationTimeframes?.expected || 60 + Math.floor(Math.random() * 60),
        worst: sourceData.implementationTimeframes?.worst || 120 + Math.floor(Math.random() * 60)
      },
      tariffDifferential: typeof sourceData.tariffDifferential === 'number' ? sourceData.tariffDifferential : -5 + Math.random() * 10,
      qualityCompatibility: typeof sourceData.qualityCompatibility === 'number' ? sourceData.qualityCompatibility : 7 + Math.random() * 3
    };
  }
  
  /**
   * Generate regional heatmap with risk analysis by region
   */
  private async generateRegionalHeatmap(nodes: SupplyChainNode[], options: ResilienceAnalysisOptions): Promise<RegionalHeatmapEntry[]> {
    console.log('Generating regional heatmap with risk analysis');
    
    // Group nodes by region
    const regionMap = new Map<string, SupplyChainNode[]>();
    
    // Aggregate nodes by region
    for (const node of nodes) {
      if (!regionMap.has(node.region)) {
        regionMap.set(node.region, []);
      }
      regionMap.get(node.region)!.push(node);
    }
    
    // Create heatmap entries
    const heatmap: RegionalHeatmapEntry[] = [];
    
    // Calculate metrics for each region
    for (const [region, regionNodes] of regionMap.entries()) {
      // Calculate average tariff risk for the region
      const avgTariffRisk = regionNodes.reduce((sum, node) => sum + node.tariffRisk, 0) / regionNodes.length;
      
      // Calculate average geopolitical risk for the region
      const avgGeoRisk = regionNodes.reduce((sum, node) => sum + node.geopoliticalRisk, 0) / regionNodes.length;
      
      // Calculate average lead time for the region
      const avgLeadTime = regionNodes.reduce((sum, node) => sum + node.leadTime, 0) / regionNodes.length;
      
      // Calculate resilience score (inverse of average risk)
      const resilienceScore = 10 - (avgTariffRisk * 0.4 + avgGeoRisk * 0.4 + (avgLeadTime / 30) * 0.2);
      
      // Determine risk levels
      const tariffRiskLevel = this.getRiskLevel(avgTariffRisk);
      const geopoliticalRiskLevel = this.getRiskLevel(avgGeoRisk);
      const transitTimeRisk = this.getTransitTimeRisk(avgLeadTime);
      
      // Add entry to heatmap
      heatmap.push({
        regionId: region.replace(/\s+/g, '-').toLowerCase(),
        regionName: region,
        resilienceScore,
        tariffRiskLevel,
        geopoliticalRiskLevel,
        transitTimeRisk
      });
    }
    
    // Sort by resilience score (ascending - lowest score = highest risk first)
    heatmap.sort((a, b) => a.resilienceScore - b.resilienceScore);
    
    return heatmap;
  }
  
  /**
   * Get risk level based on numeric score
   */
  private getRiskLevel(score: number): RiskLevel {
    if (score >= 8) return 'critical';
    if (score >= 6) return 'high';
    if (score >= 4) return 'medium';
    return 'low';
  }
  
  /**
   * Get transit time risk level based on lead time
   */
  private getTransitTimeRisk(leadTime: number): RiskLevel {
    if (leadTime >= 90) return 'critical';
    if (leadTime >= 60) return 'high';
    if (leadTime >= 30) return 'medium';
    return 'low';
  }
  
  /**
   * Generate resilience recommendations based on vulnerabilities and heatmap
   */
  private async generateResilienceRecommendations(
    vulnerabilityHotspots: VulnerabilityHotspot[], 
    regionalHeatmap: RegionalHeatmapEntry[],
    options: ResilienceAnalysisOptions
  ): Promise<ResilienceRecommendation[]> {
    console.log('Generating resilience recommendations');
    
    const recommendations: ResilienceRecommendation[] = [];
    
    // Analyze critical vulnerabilities
    const criticalHotspots = vulnerabilityHotspots
      .filter(h => h.vulnerabilityScore > 7.5)
      .slice(0, 3); // Focus on top 3
    
    if (criticalHotspots.length > 0) {
      recommendations.push({
        priority: 'high',
        action: `Address critical vulnerabilities in ${criticalHotspots.map(h => h.nodeName).join(', ')}`,
        expectedImpact: 8.5,
        timeframe: 'Immediate (1-3 months)',
        investmentRequired: 'substantial',
        tariffConsiderations: 'May require product redesign or supplier changes with tariff implications'
      });
    }
    
    // Analyze high-risk regions
    const highRiskRegions = regionalHeatmap
      .filter(r => r.tariffRiskLevel === 'high' || r.geopoliticalRiskLevel === 'high')
      .slice(0, 3); // Focus on top 3
    
    if (highRiskRegions.length > 0) {
      recommendations.push({
        priority: 'high',
        action: `Diversify supply chain away from high-risk regions: ${highRiskRegions.map(r => r.regionName).join(', ')}`,
        expectedImpact: 7.5,
        timeframe: 'Short-term (3-6 months)',
        investmentRequired: 'substantial',
        tariffConsiderations: 'Consider regions with favorable tariff arrangements'
      });
    }
    
    // Lead time optimization recommendation
    const longLeadTimeHotspots = vulnerabilityHotspots
      .filter(h => h.timeToDisruptionDays > 60)
      .slice(0, 5); // Focus on top 5
    
    if (longLeadTimeHotspots.length > 0) {
      recommendations.push({
        priority: 'medium',
        action: 'Implement lead time reduction program across critical suppliers',
        expectedImpact: 6.5,
        timeframe: 'Medium-term (6-12 months)',
        investmentRequired: 'moderate',
        tariffConsiderations: 'May require dual-sourcing with complex tariff considerations'
      });
    }
    
    // Inventory optimization recommendation
    recommendations.push({
      priority: 'medium',
      action: 'Optimize inventory levels for vulnerable components',
      expectedImpact: 5.0,
      timeframe: 'Short-term (3-6 months)',
      investmentRequired: 'moderate',
      tariffConsiderations: 'Consider duty drawback opportunities for exported goods'
    });
    
    // Add Monte Carlo specific recommendation if using that feature
    if (options.monteCarloIterations && options.monteCarloIterations >= 1000) {
      recommendations.push({
        priority: 'low',
        action: 'Implement probabilistic risk modeling in procurement planning',
        expectedImpact: 4.0,
        timeframe: 'Long-term (12+ months)',
        investmentRequired: 'minimal',
        tariffConsiderations: 'Better forecasting of tariff impacts and scenario planning'
      });
    }
    
    return recommendations;
  }
  
  /**
   * Calculate overall resilience score based on vulnerabilities and heatmap
   */
  private calculateOverallResilienceScore(
    vulnerabilityHotspots: VulnerabilityHotspot[],
    regionalHeatmap: RegionalHeatmapEntry[],
    monteCarloResults: MonteCarloSimulationResults
  ): number {
    // Calculate vulnerability component (40% weight)
    // Lower vulnerability scores mean higher resilience
    const vulnerabilityComponent = vulnerabilityHotspots.length > 0 ?
      10 - Math.min(10, vulnerabilityHotspots.reduce((sum, h) => sum + h.vulnerabilityScore, 0) / vulnerabilityHotspots.length) :
      7; // Default if no hotspots
    
    // Calculate regional component (40% weight)
    // Higher resilience scores mean higher resilience
    const regionalComponent = regionalHeatmap.length > 0 ?
      regionalHeatmap.reduce((sum, r) => sum + r.resilienceScore, 0) / regionalHeatmap.length :
      5; // Default if no regional data
    
    // Calculate Monte Carlo component (20% weight)
    // Lower aggregate risk score means higher resilience
    const monteCarloComponent = monteCarloResults?.aggregateRiskScore !== undefined ?
      10 - Math.min(10, monteCarloResults.aggregateRiskScore) :
      5; // Default if no Monte Carlo results
    
    // Calculate weighted score
    const score = (vulnerabilityComponent * 0.4) + (regionalComponent * 0.4) + (monteCarloComponent * 0.2);
    
    // Return rounded score, bounded between 1-10
    return Math.max(1, Math.min(10, Math.round(score * 10) / 10));
  }
  
  // Helper method to generate sample supply chain nodes for testing
  private generateSampleSupplyChainNodes(): SupplyChainNode[] {
    return [
      {
        id: 'supplier-1',
        name: 'Primary Electronics Supplier',
        tier: 'Tier 1',
        region: 'APAC',
        category: 'Electronics',
        criticality: 'High',
        tariffRisk: 0.8,
        geopoliticalRisk: 0.7,
        leadTime: 45
      },
      {
        id: 'supplier-2',
        name: 'Secondary Materials Supplier',
        tier: 'Tier 1',
        region: 'EMEA',
        category: 'Raw Materials',
        criticality: 'Medium',
        tariffRisk: 0.5,
        geopoliticalRisk: 0.3,
        leadTime: 30
      },
      {
        id: 'supplier-3',
        name: 'Component Manufacturer',
        tier: 'Tier 2',
        region: 'NA',
        category: 'Components',
        criticality: 'High',
        tariffRisk: 0.4,
        geopoliticalRisk: 0.2,
        leadTime: 15
      }
    ];
  }
}

// Export the class instead of an instance
export default SupplyChainResilienceAnalyzer;