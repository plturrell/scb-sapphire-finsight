import { OntologyManager } from './OntologyManager';

/**
 * TariffImpactSimulator integrates Monte Carlo Tree Search for simulating tariff impacts
 * Uses the existing Monte Carlo Tree Search capabilities of SCB Sapphire FinSight
 */
export class TariffImpactSimulator {
  private ontology: OntologyManager;
  private simulationResults: any = null;
  private workerInstance: Worker | null = null;
  
  constructor(ontology: OntologyManager) {
    this.ontology = ontology;
  }
  
  /**
   * Run a Monte Carlo simulation on tariff data
   */
  public async runSimulation(): Promise<any> {
    // Extract parameters from ontology
    const countryData = this.extractCountryData();
    const productData = this.extractProductData();
    const policyData = this.extractPolicyData();
    
    // Configure MCTS with parameters
    const mctsConfig = {
      initialState: this.createInitialState(countryData, productData, policyData),
      maxIterations: 5000,
      explorationParameter: 1.41,
      timeHorizon: 24, // 24 months
      scenarios: ['baseline', 'escalation', 'resolution']
    };
    
    // Use our existing monte carlo worker
    return new Promise((resolve, reject) => {
      try {
        if (typeof window === 'undefined') {
          reject(new Error('Cannot run simulation outside browser environment'));
          return;
        }
        
        this.workerInstance = new Worker('/workers/monteCarloWorker.js');
        
        this.workerInstance.onmessage = (event) => {
          const { type, data } = event.data;
          
          if (type === 'SIMULATION_COMPLETE') {
            this.simulationResults = {
              optimalPath: data.results.optimalPath,
              expectedValues: data.results.expectedValue,
              riskMetrics: data.results.riskMetrics,
              flowData: data.flowData
            };
            
            // Store results in ontology
            this.updateOntologyWithSimulationResults();
            
            resolve(this.simulationResults);
            this.cleanupWorker();
          } else if (type === 'SIMULATION_ERROR') {
            reject(new Error(data.message));
            this.cleanupWorker();
          }
        };
        
        this.workerInstance.onerror = (error) => {
          reject(error);
          this.cleanupWorker();
        };
        
        // Start the simulation
        this.workerInstance.postMessage({
          type: 'START_SIMULATION',
          config: mctsConfig
        });
      } catch (error) {
        reject(error);
      }
    });
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
  private calculateLinkValue(tariffRate: string, category: string) {
    // Calculate link value based on tariff rate and trade volume
    const tradeVolume = parseFloat(this.ontology.getDataPropertyValue(category, 'tas:hasTradeVolume') as string);
    const rate = parseFloat(tariffRate);
    
    if (!isNaN(tradeVolume) && !isNaN(rate)) {
      // Scale the link based on trade volume and tariff rate
      return (tradeVolume * (rate / 100)) / 10; // Scale for visualization
    }
    
    return 1; // Default value
  }
  
  /**
   * Check if a tariff change has been enhanced by AI
   */
  private isAIEnhanced(tariffChange: string) {
    // Check if this tariff change has been enhanced by AI predictions
    const relatedAlerts = this.ontology.getEntitiesByRelation('tas:relatesTo', tariffChange);
    
    // Check if any alerts have high confidence level
    return relatedAlerts.some(alert => {
      const confidence = parseFloat(this.ontology.getDataPropertyValue(alert, 'tas:hasConfidenceLevel') as string);
      return confidence >= 0.8;
    });
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

export default TariffImpactSimulator;
