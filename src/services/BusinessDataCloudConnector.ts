import { SimulationInput, SimulationOutput, ParameterHistory, SimulationComparison, UUID } from '../types/MonteCarloTypes';

/**
 * Business Data Cloud Connector
 * 
 * Connects to SAP Business Data Cloud to retrieve and store simulation data
 * This service provides a layer between the application and the Business Data Cloud
 * In this implementation, we're reading from local data_products directory
 * In production, this would connect to the actual SAP Business Data Cloud API
 */
class BusinessDataCloudConnector {
  private dataCache: {
    inputs: SimulationInput[];
    outputs: SimulationOutput[];
    parameterChanges: ParameterHistory[];
    comparisons: SimulationComparison[];
  } = {
    inputs: [],
    outputs: [],
    parameterChanges: [],
    comparisons: []
  };

  private initialized = false;

  /**
   * Initialize the connector by loading data from Business Data Cloud
   */
  public async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // In production, these would be API calls to SAP Business Data Cloud
      // For this simulation, we're loading from the data_products directory
      const inputsResponse = await fetch('/api/data-products/MonteCarloSimulationInput_v1.MonteCarloSimulationInput.json');
      const outputsResponse = await fetch('/api/data-products/MonteCarloSimulationOutput_v1.MonteCarloSimulationOutput.json');
      const paramHistoryResponse = await fetch('/api/data-products/MonteCarloParameterHistory_v1.MonteCarloParameterHistory.json');
      
      // Parse responses
      const inputsData = await inputsResponse.json();
      const outputsData = await outputsResponse.json();
      const paramHistoryData = await paramHistoryResponse.json();

      // Map data from Business Data Cloud format to our application types
      this.dataCache.inputs = inputsData.data.map(this.mapInputFromBDC);
      this.dataCache.outputs = outputsData.data.map(this.mapOutputFromBDC);
      this.dataCache.parameterChanges = paramHistoryData.data.map(this.mapParameterChangeFromBDC);
      
      // Create some sample comparisons
      this.generateSampleComparisons();
      
      this.initialized = true;
      console.log('Business Data Cloud connector initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Business Data Cloud connector:', error);
      // Fall back to empty data
      this.dataCache = {
        inputs: [],
        outputs: [],
        parameterChanges: [],
        comparisons: []
      };
      this.initialized = true; // Mark as initialized to prevent further attempts
    }
  }

  /**
   * Map input from Business Data Cloud format to application format
   */
  private mapInputFromBDC(bdcInput: any): SimulationInput {
    return {
      id: bdcInput.id,
      name: bdcInput.name,
      description: bdcInput.description || '',
      createdBy: bdcInput.createdBy,
      createdAt: bdcInput.createdAt,
      simulationType: bdcInput.simulationType,
      parameters: {
        generalParameters: bdcInput.parameters.generalParameters.map((param: any) => ({
          id: param.id,
          name: param.name,
          value: param.value,
          minValue: param.minValue,
          maxValue: param.maxValue,
          distributionType: param.distributionType,
          parameterType: param.parameterType,
          unit: param.unit,
          description: param.description
        })),
        tariffSpecificParameters: {
          hsCodes: bdcInput.parameters.tariffSpecificParameters.hsCodes,
          countries: bdcInput.parameters.tariffSpecificParameters.countries,
          tradeAgreements: bdcInput.parameters.tariffSpecificParameters.tradeAgreements,
          exchangeRates: bdcInput.parameters.tariffSpecificParameters.exchangeRates.map((rate: any) => ({
            fromCurrency: rate.fromCurrency,
            toCurrency: rate.toCurrency,
            rate: rate.rate,
            minRate: rate.minRate,
            maxRate: rate.maxRate
          }))
        }
      },
      simulationConfig: {
        iterations: bdcInput.simulationConfig.iterations,
        confidenceInterval: bdcInput.simulationConfig.confidenceInterval,
        scenarioThresholds: {
          pessimistic: bdcInput.simulationConfig.scenarioThresholds.pessimistic,
          realistic: bdcInput.simulationConfig.scenarioThresholds.realistic,
          optimistic: bdcInput.simulationConfig.scenarioThresholds.optimistic
        },
        precision: bdcInput.simulationConfig.precision
      }
    };
  }

  /**
   * Map output from Business Data Cloud format to application format
   */
  private mapOutputFromBDC(bdcOutput: any): SimulationOutput {
    return {
      id: bdcOutput.id,
      inputId: bdcOutput.simulationInputId,
      startTime: bdcOutput.startTime,
      endTime: bdcOutput.endTime,
      status: bdcOutput.status,
      progressPercentage: bdcOutput.progressPercentage,
      results: bdcOutput.results ? {
        summary: {
          mean: bdcOutput.results.statistics.mean,
          median: bdcOutput.results.statistics.median,
          standardDeviation: bdcOutput.results.statistics.standardDeviation,
          min: bdcOutput.results.statistics.min,
          max: bdcOutput.results.statistics.max,
          variance: bdcOutput.results.statistics.variance || 
            (bdcOutput.results.statistics.standardDeviation * bdcOutput.results.statistics.standardDeviation)
        },
        percentiles: bdcOutput.results.statistics.percentiles || [],
        scenarios: {
          pessimistic: bdcOutput.results.scenarios.pessimistic,
          realistic: bdcOutput.results.scenarios.realistic,
          optimistic: bdcOutput.results.scenarios.optimistic
        },
        sensitivityAnalysis: bdcOutput.results.sensitivityAnalysis || [],
        distributionData: bdcOutput.results.distributionData || [],
        rawResults: bdcOutput.results.rawResults
      } : undefined,
      llmAnalysis: bdcOutput.llmAnalysis ? {
        insights: bdcOutput.llmAnalysis.insights || [],
        recommendations: bdcOutput.llmAnalysis.recommendations || [],
        riskFactors: bdcOutput.llmAnalysis.riskFactors || [],
        riskAssessment: bdcOutput.llmAnalysis.riskAssessment
      } : undefined,
      computeMetrics: bdcOutput.computeMetrics
    };
  }

  /**
   * Map parameter change from Business Data Cloud format to application format
   */
  private mapParameterChangeFromBDC(bdcParamChange: any): ParameterHistory {
    return {
      id: bdcParamChange.id,
      simulationInputId: bdcParamChange.simulationInputId,
      parameterId: bdcParamChange.parameterId,
      previousValue: bdcParamChange.previousValue,
      newValue: bdcParamChange.newValue,
      timestamp: bdcParamChange.timestamp,
      changedBy: bdcParamChange.changedBy
    };
  }

  /**
   * Generate sample comparisons between simulations
   */
  private generateSampleComparisons(): void {
    // Create a comparison between footwear and electronics
    if (this.dataCache.inputs.length >= 2) {
      const comparison1: SimulationComparison = {
        id: 'c1e2d3b4-a5b6-4c7d-8e9f-0a1b2c3d4e5f',
        name: 'Footwear vs. Electronics Tariff Comparison',
        description: 'Comparative analysis of tariff impacts on footwear (HS 6402.99) and electronics (HS 8528.72)',
        createdAt: Date.now(),
        simulationIds: [
          this.dataCache.inputs[0].id,
          this.dataCache.inputs[1].id
        ],
        comparisonResults: {
          differenceMatrix: [
            {
              parameter: 'baseTariffRate',
              differences: [
                {
                  sim1Id: this.dataCache.inputs[0].id,
                  sim2Id: this.dataCache.inputs[1].id,
                  absoluteDifference: -5.0,
                  percentageDifference: -20.0
                }
              ]
            },
            {
              parameter: 'importVolume',
              differences: [
                {
                  sim1Id: this.dataCache.inputs[0].id,
                  sim2Id: this.dataCache.inputs[1].id,
                  absoluteDifference: -0.4,
                  percentageDifference: -7.69
                }
              ]
            },
            {
              parameter: 'exchangeRate',
              differences: [
                {
                  sim1Id: this.dataCache.inputs[0].id,
                  sim2Id: this.dataCache.inputs[1].id,
                  absoluteDifference: -300,
                  percentageDifference: -1.28
                }
              ]
            }
          ],
          outcomeComparison: {
            meanDifferences: [
              {
                sim1Id: this.dataCache.inputs[0].id,
                sim2Id: this.dataCache.inputs[1].id,
                absoluteDifference: -4.28,
                percentageDifference: -21.0
              }
            ],
            riskProfileDifferences: []
          }
        }
      };

      // Create a comparison between textiles and agricultural products
      const comparison2: SimulationComparison = {
        id: 'd2e3f4c5-b6a7-5d8e-9f0a-1b2c3d4e5f6g',
        name: 'Textile vs. Agricultural Products',
        description: 'Comparison between textile (HS 6104.43) and agricultural (HS 1006.30) tariff projections',
        createdAt: Date.now(),
        simulationIds: [
          this.dataCache.inputs[2].id,
          this.dataCache.inputs[3].id
        ],
        comparisonResults: {
          differenceMatrix: [
            {
              parameter: 'baseTariffRate',
              differences: [
                {
                  sim1Id: this.dataCache.inputs[2].id,
                  sim2Id: this.dataCache.inputs[3].id,
                  absoluteDifference: 12.0,
                  percentageDifference: 66.67
                }
              ]
            },
            {
              parameter: 'importVolume',
              differences: [
                {
                  sim1Id: this.dataCache.inputs[2].id,
                  sim2Id: this.dataCache.inputs[3].id,
                  absoluteDifference: -0.7,
                  percentageDifference: -20.0
                }
              ]
            },
            {
              parameter: 'exchangeRate',
              differences: [
                {
                  sim1Id: this.dataCache.inputs[2].id,
                  sim2Id: this.dataCache.inputs[3].id,
                  absoluteDifference: -100,
                  percentageDifference: -0.43
                }
              ]
            }
          ],
          outcomeComparison: {
            meanDifferences: [
              {
                sim1Id: this.dataCache.inputs[2].id,
                sim2Id: this.dataCache.inputs[3].id,
                absoluteDifference: 12.04,
                percentageDifference: 66.7
              }
            ],
            riskProfileDifferences: []
          }
        }
      };

      this.dataCache.comparisons = [comparison1, comparison2];
    }
  }

  /**
   * Get all simulation inputs
   */
  public async getSimulationInputs(): Promise<SimulationInput[]> {
    if (!this.initialized) await this.initialize();
    return this.dataCache.inputs;
  }

  /**
   * Get a specific simulation input
   */
  public async getSimulationInput(id: UUID): Promise<SimulationInput | null> {
    if (!this.initialized) await this.initialize();
    return this.dataCache.inputs.find(input => input.id === id) || null;
  }

  /**
   * Get all simulation outputs for a specific input
   */
  public async getSimulationOutputs(simulationInputId: UUID): Promise<SimulationOutput[]> {
    if (!this.initialized) await this.initialize();
    return this.dataCache.outputs.filter(output => output.inputId === simulationInputId);
  }

  /**
   * Get a specific simulation output
   */
  public async getSimulationOutput(id: UUID): Promise<SimulationOutput | null> {
    if (!this.initialized) await this.initialize();
    return this.dataCache.outputs.find(output => output.id === id) || null;
  }

  /**
   * Get parameter changes for a specific simulation
   */
  public async getParameterChanges(simulationInputId: UUID): Promise<ParameterHistory[]> {
    if (!this.initialized) await this.initialize();
    return this.dataCache.parameterChanges.filter(change => change.simulationInputId === simulationInputId);
  }

  /**
   * Get all simulation comparisons
   */
  public async getSimulationComparisons(): Promise<SimulationComparison[]> {
    if (!this.initialized) await this.initialize();
    return this.dataCache.comparisons;
  }

  /**
   * Get a specific simulation comparison
   */
  public async getSimulationComparison(id: UUID): Promise<SimulationComparison | null> {
    if (!this.initialized) await this.initialize();
    return this.dataCache.comparisons.find(comparison => comparison.id === id) || null;
  }

  /**
   * Save a simulation input to Business Data Cloud
   * In a real implementation, this would make an API call to SAP Business Data Cloud
   * For this simulation, we're just updating the local cache
   */
  public async saveSimulationInput(input: SimulationInput): Promise<SimulationInput> {
    if (!this.initialized) await this.initialize();
    
    // Check if this is an update or new record
    const existingIndex = this.dataCache.inputs.findIndex(i => i.id === input.id);
    
    if (existingIndex >= 0) {
      // Update existing
      this.dataCache.inputs[existingIndex] = input;
    } else {
      // Add new
      this.dataCache.inputs.push(input);
    }
    
    console.log(`Simulation input ${input.id} saved to Business Data Cloud`);
    return input;
  }

  /**
   * Save a simulation output to Business Data Cloud
   */
  public async saveSimulationOutput(output: SimulationOutput): Promise<SimulationOutput> {
    if (!this.initialized) await this.initialize();
    
    // Check if this is an update or new record
    const existingIndex = this.dataCache.outputs.findIndex(o => o.id === output.id);
    
    if (existingIndex >= 0) {
      // Update existing
      this.dataCache.outputs[existingIndex] = output;
    } else {
      // Add new
      this.dataCache.outputs.push(output);
    }
    
    console.log(`Simulation output ${output.id} saved to Business Data Cloud`);
    return output;
  }

  /**
   * Save a parameter change to Business Data Cloud
   */
  public async saveParameterChange(change: ParameterHistory): Promise<ParameterHistory> {
    if (!this.initialized) await this.initialize();
    
    // Parameter changes are always new records
    this.dataCache.parameterChanges.push(change);
    
    console.log(`Parameter change ${change.id} saved to Business Data Cloud`);
    return change;
  }

  /**
   * Save a simulation comparison to Business Data Cloud
   */
  public async saveSimulationComparison(comparison: SimulationComparison): Promise<SimulationComparison> {
    if (!this.initialized) await this.initialize();
    
    // Check if this is an update or new record
    const existingIndex = this.dataCache.comparisons.findIndex(c => c.id === comparison.id);
    
    if (existingIndex >= 0) {
      // Update existing
      this.dataCache.comparisons[existingIndex] = comparison;
    } else {
      // Add new
      this.dataCache.comparisons.push(comparison);
    }
    
    console.log(`Simulation comparison ${comparison.id} saved to Business Data Cloud`);
    return comparison;
  }

  /**
   * Get counts of various entities
   */
  public async getStatistics(): Promise<{
    inputCount: number;
    outputCount: number;
    parameterChangeCount: number;
    comparisonCount: number;
  }> {
    if (!this.initialized) await this.initialize();
    
    return {
      inputCount: this.dataCache.inputs.length,
      outputCount: this.dataCache.outputs.length,
      parameterChangeCount: this.dataCache.parameterChanges.length,
      comparisonCount: this.dataCache.comparisons.length
    };
  }
}

// Create a singleton instance
const businessDataCloudConnector = new BusinessDataCloudConnector();

export default businessDataCloudConnector;
