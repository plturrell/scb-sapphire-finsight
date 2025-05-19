import {
  SimulationInput,
  SimulationOutput,
  ParameterHistory,
  SimulationComparison,
  UUID,
  generateUUID,
  getCurrentTimestamp
} from '../types/MonteCarloTypes';
import businessDataCloudConnector from './BusinessDataCloudConnector';

/**
 * Monte Carlo Storage Service
 * Manages storage of simulation inputs, outputs, parameter history, and comparisons
 * Implements the data storage layer from the enhanced technical specification
 */
export class MonteCarloStorageService {
  private static instance: MonteCarloStorageService;
  
  // In-memory storage for development/demo
  // In a production environment, these would be replaced with database calls
  private simulationInputs: Map<UUID, SimulationInput> = new Map();
  private simulationOutputs: Map<UUID, SimulationOutput> = new Map();
  private parameterHistory: Map<UUID, ParameterHistory> = new Map();
  private simulationComparisons: Map<UUID, SimulationComparison> = new Map();
  
  // Storage for input-output relationships (one input to many outputs)
  private inputToOutputs: Map<UUID, Set<UUID>> = new Map();
  
  // Initialize IndexedDB for browser storage
  private dbPromise: Promise<IDBDatabase> | null = null;
  private readonly DB_NAME = 'MonteCarloSimulationDB';
  private readonly DB_VERSION = 1;
  
  // Storage preference flag - if true, use Business Data Cloud, otherwise use IndexedDB/local storage
  private useBusinessDataCloud: boolean = true;

  private constructor() {
    if (typeof window !== 'undefined') {
      this.initDatabase();
      
      // Initialize Business Data Cloud connector
      if (this.useBusinessDataCloud) {
        businessDataCloudConnector.initialize().catch(error => {
          console.error('Failed to initialize Business Data Cloud connector, falling back to local storage', error);
          this.useBusinessDataCloud = false;
        });
      }
    }
  }
  
  /**
   * Get singleton instance
   */
  public static getInstance(): MonteCarloStorageService {
    if (!MonteCarloStorageService.instance) {
      MonteCarloStorageService.instance = new MonteCarloStorageService();
    }
    return MonteCarloStorageService.instance;
  }
  
  /**
   * Initialize the IndexedDB database
   */
  private initDatabase(): void {
    this.dbPromise = new Promise((resolve, reject) => {
      if (!indexedDB) {
        console.error('IndexedDB not supported');
        reject(new Error('IndexedDB not supported'));
        return;
      }
      
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);
      
      request.onerror = (event) => {
        console.error('Error opening IndexedDB', event);
        reject(new Error('Error opening IndexedDB'));
      };
      
      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        console.log('IndexedDB initialized successfully');
        resolve(db);
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object stores
        if (!db.objectStoreNames.contains('simulationInputs')) {
          db.createObjectStore('simulationInputs', { keyPath: 'id' });
        }
        
        if (!db.objectStoreNames.contains('simulationOutputs')) {
          const outputStore = db.createObjectStore('simulationOutputs', { keyPath: 'id' });
          outputStore.createIndex('inputId', 'inputId', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('parameterHistory')) {
          const historyStore = db.createObjectStore('parameterHistory', { keyPath: 'id' });
          historyStore.createIndex('simulationInputId', 'simulationInputId', { unique: false });
          historyStore.createIndex('parameterId', 'parameterId', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('simulationComparisons')) {
          db.createObjectStore('simulationComparisons', { keyPath: 'id' });
        }
      };
    });
  }
  
  /**
   * Execute a database operation with error handling
   */
  private async executeDbOperation<T>(
    operation: (db: IDBDatabase) => IDBRequest<T>
  ): Promise<T> {
    try {
      const db = await this.dbPromise;
      if (!db) {
        throw new Error('Database not initialized');
      }
      
      return new Promise((resolve, reject) => {
        const request = operation(db);
        
        request.onsuccess = () => {
          resolve(request.result);
        };
        
        request.onerror = (event) => {
          console.error('Database operation failed', event);
          reject(new Error('Database operation failed'));
        };
      });
    } catch (error) {
      console.error('Failed to execute database operation', error);
      throw error;
    }
  }
  
  // ============= SIMULATION INPUT METHODS =============
  
  /**
   * Save a simulation input to storage
   */
  public async saveSimulationInput(input: SimulationInput): Promise<UUID> {
    // Ensure the input has an ID and timestamp
    if (!input.id) {
      input.id = generateUUID();
    }
    
    if (!input.createdAt) {
      input.createdAt = getCurrentTimestamp();
    }
    
    if (this.useBusinessDataCloud) {
      try {
        // Store in Business Data Cloud
        await businessDataCloudConnector.saveSimulationInput(input);
        console.log(`Simulation input ${input.id} saved to Business Data Cloud`);
      } catch (error) {
        console.error('Error saving to Business Data Cloud, falling back to local storage', error);
        this.useBusinessDataCloud = false;
        
        // Fall back to IndexedDB
        if (this.dbPromise) {
          await this.executeDbOperation(db => {
            const transaction = db.transaction('simulationInputs', 'readwrite');
            const store = transaction.objectStore('simulationInputs');
            return store.put(input);
          });
        }
      }
    } else if (this.dbPromise) {
      // Store in IndexedDB
      await this.executeDbOperation(db => {
        const transaction = db.transaction('simulationInputs', 'readwrite');
        const store = transaction.objectStore('simulationInputs');
        return store.put(input);
      });
    }
    
    // Also keep in memory for faster access
    this.simulationInputs.set(input.id, input);
    
    return input.id;
  }
  
  /**
   * Get a simulation input by ID
   */
  public async getSimulationInput(id: UUID): Promise<SimulationInput | null> {
    // Try memory cache first
    if (this.simulationInputs.has(id)) {
      return this.simulationInputs.get(id) || null;
    }
    
    if (this.useBusinessDataCloud) {
      try {
        // Try to fetch from Business Data Cloud
        const input = await businessDataCloudConnector.getSimulationInput(id);
        
        if (input) {
          // Update memory cache
          this.simulationInputs.set(id, input);
          return input;
        }
      } catch (error) {
        console.error('Error fetching from Business Data Cloud, falling back to local storage', error);
        this.useBusinessDataCloud = false;
      }
    }
    
    if (this.dbPromise) {
      try {
        // Try to fetch from IndexedDB
        const input = await this.executeDbOperation<SimulationInput>(db => {
          const transaction = db.transaction('simulationInputs', 'readonly');
          const store = transaction.objectStore('simulationInputs');
          return store.get(id);
        });
        
        if (input) {
          // Update memory cache
          this.simulationInputs.set(id, input);
          return input;
        }
      } catch (error) {
        console.error('Error fetching simulation input from IndexedDB', error);
      }
    }
    
    return null;
  }
  
  /**
   * List all simulation inputs, optionally filtered and sorted
   * Retrieves from Business Data Cloud if available, otherwise falls back to local storage
   */
  public async listSimulationInputs(options?: {
    simulationType?: string;
    createdBy?: string;
    sortBy?: 'createdAt' | 'name';
    sortDirection?: 'asc' | 'desc';
    limit?: number;
    offset?: number;
  }): Promise<SimulationInput[]> {
    if (this.useBusinessDataCloud) {
      try {
        // Fetch all inputs from Business Data Cloud
        const inputs = await businessDataCloudConnector.getSimulationInputs();
        
        // Update memory cache
        inputs.forEach(input => {
          this.simulationInputs.set(input.id, input);
        });
        
        // Apply filtering and sorting
        let filteredInputs = [...inputs];
        
        // Filter by simulation type
        if (options?.simulationType) {
          filteredInputs = filteredInputs.filter(input => 
            input.simulationType === options.simulationType
          );
        }
        
        // Filter by creator
        if (options?.createdBy) {
          filteredInputs = filteredInputs.filter(input => 
            input.createdBy === options.createdBy
          );
        }
        
        // Sort inputs
        if (options?.sortBy) {
          filteredInputs.sort((a, b) => {
            if (options.sortBy === 'createdAt') {
              return options.sortDirection === 'asc' 
                ? a.createdAt - b.createdAt 
                : b.createdAt - a.createdAt;
            } else { // sortBy === 'name'
              return options.sortDirection === 'asc' 
                ? a.name.localeCompare(b.name) 
                : b.name.localeCompare(a.name);
            }
          });
        } else {
          // Default sort by createdAt desc
          filteredInputs.sort((a, b) => b.createdAt - a.createdAt);
        }
        
        // Apply pagination
        if (options?.offset !== undefined && options?.limit !== undefined) {
          filteredInputs = filteredInputs.slice(
            options.offset, 
            options.offset + options.limit
          );
        } else if (options?.limit !== undefined) {
          filteredInputs = filteredInputs.slice(0, options.limit);
        }
        
        return filteredInputs;
      } catch (error) {
        console.error('Error fetching from Business Data Cloud, falling back to local storage', error);
        this.useBusinessDataCloud = false;
      }
    }
    let inputs: SimulationInput[] = [];
    
    if (this.dbPromise) {
      try {
        // Fetch from IndexedDB
        const allInputs = await this.executeDbOperation<SimulationInput[]>(db => {
          const transaction = db.transaction('simulationInputs', 'readonly');
          const store = transaction.objectStore('simulationInputs');
          return store.getAll();
        });
        
        inputs = allInputs;
        
        // Update memory cache
        allInputs.forEach(input => {
          this.simulationInputs.set(input.id, input);
        });
      } catch (error) {
        console.error('Error listing simulation inputs', error);
        // Fall back to memory cache
        inputs = Array.from(this.simulationInputs.values());
      }
    } else {
      // Use memory cache only
      inputs = Array.from(this.simulationInputs.values());
    }
    
    // Apply filters
    if (options) {
      if (options.simulationType) {
        inputs = inputs.filter(input => 
          input.simulationType === options.simulationType
        );
      }
      
      if (options.createdBy) {
        inputs = inputs.filter(input => 
          input.createdBy === options.createdBy
        );
      }
      
      // Apply sorting
      const sortBy = options.sortBy || 'createdAt';
      const sortDirection = options.sortDirection || 'desc';
      
      inputs.sort((a, b) => {
        let comparison = 0;
        
        if (sortBy === 'createdAt') {
          comparison = a.createdAt - b.createdAt;
        } else if (sortBy === 'name') {
          comparison = a.name.localeCompare(b.name);
        }
        
        return sortDirection === 'asc' ? comparison : -comparison;
      });
      
      // Apply pagination
      if (options.offset !== undefined || options.limit !== undefined) {
        const offset = options.offset || 0;
        const limit = options.limit || inputs.length;
        inputs = inputs.slice(offset, offset + limit);
      }
    }
    
    return inputs;
  }
  
  /**
   * Delete a simulation input and all related outputs and history
   */
  public async deleteSimulationInput(id: UUID): Promise<boolean> {
    // Delete from IndexedDB
    if (this.dbPromise) {
      try {
        // Delete related outputs first
        const outputs = await this.listSimulationOutputs(id);
        for (const output of outputs) {
          await this.deleteSimulationOutput(output.id);
        }
        
        // Delete related parameter history
        const history = await this.getParameterHistoryForSimulation(id);
        for (const entry of history) {
          await this.deleteParameterHistory(entry.id);
        }
        
        // Delete the input itself
        await this.executeDbOperation(db => {
          const transaction = db.transaction('simulationInputs', 'readwrite');
          const store = transaction.objectStore('simulationInputs');
          return store.delete(id);
        });
      } catch (error) {
        console.error('Error deleting simulation input', error);
        return false;
      }
    }
    
    // Delete from memory cache
    this.simulationInputs.delete(id);
    this.inputToOutputs.delete(id);
    
    return true;
  }
  
  // ============= SIMULATION OUTPUT METHODS =============
  
  /**
   * Save a simulation output to storage
   */
  public async saveSimulationOutput(output: SimulationOutput): Promise<UUID> {
    // Ensure the output has an ID
    if (!output.id) {
      output.id = generateUUID();
    }
    
    if (this.dbPromise) {
      // Store in IndexedDB
      await this.executeDbOperation(db => {
        const transaction = db.transaction('simulationOutputs', 'readwrite');
        const store = transaction.objectStore('simulationOutputs');
        return store.put(output);
      });
    }
    
    // Also keep in memory for faster access
    this.simulationOutputs.set(output.id, output);
    
    // Update input-output relationship
    let outputsForInput = this.inputToOutputs.get(output.inputId);
    if (!outputsForInput) {
      outputsForInput = new Set<UUID>();
      this.inputToOutputs.set(output.inputId, outputsForInput);
    }
    outputsForInput.add(output.id);
    
    return output.id;
  }
  
  /**
   * Get a simulation output by ID
   */
  public async getSimulationOutput(id: UUID): Promise<SimulationOutput | null> {
    // Try memory cache first
    if (this.simulationOutputs.has(id)) {
      return this.simulationOutputs.get(id) || null;
    }
    
    if (this.dbPromise) {
      try {
        // Try to fetch from IndexedDB
        const output = await this.executeDbOperation<SimulationOutput>(db => {
          const transaction = db.transaction('simulationOutputs', 'readonly');
          const store = transaction.objectStore('simulationOutputs');
          return store.get(id);
        });
        
        if (output) {
          // Update memory cache
          this.simulationOutputs.set(id, output);
          
          // Update input-output relationship
          let outputsForInput = this.inputToOutputs.get(output.inputId);
          if (!outputsForInput) {
            outputsForInput = new Set<UUID>();
            this.inputToOutputs.set(output.inputId, outputsForInput);
          }
          outputsForInput.add(output.id);
          
          return output;
        }
      } catch (error) {
        console.error('Error fetching simulation output', error);
      }
    }
    
    return null;
  }
  
  /**
   * List all simulation outputs for a given input
   */
  public async listSimulationOutputs(inputId: UUID): Promise<SimulationOutput[]> {
    let outputs: SimulationOutput[] = [];
    
    if (this.dbPromise) {
      try {
        // Fetch from IndexedDB using the inputId index
        outputs = await this.executeDbOperation<SimulationOutput[]>(db => {
          const transaction = db.transaction('simulationOutputs', 'readonly');
          const store = transaction.objectStore('simulationOutputs');
          const index = store.index('inputId');
          return index.getAll(inputId);
        });
        
        // Update memory cache
        outputs.forEach(output => {
          this.simulationOutputs.set(output.id, output);
          
          // Update input-output relationship
          let outputsForInput = this.inputToOutputs.get(output.inputId);
          if (!outputsForInput) {
            outputsForInput = new Set<UUID>();
            this.inputToOutputs.set(output.inputId, outputsForInput);
          }
          outputsForInput.add(output.id);
        });
      } catch (error) {
        console.error('Error listing simulation outputs', error);
      }
    }
    
    // Check memory cache if db fetch failed or not available
    if (outputs.length === 0 && this.inputToOutputs.has(inputId)) {
      const outputIds = this.inputToOutputs.get(inputId) || new Set<UUID>();
      outputs = Array.from(outputIds)
        .map(id => this.simulationOutputs.get(id))
        .filter((output): output is SimulationOutput => output !== undefined);
    }
    
    return outputs;
  }
  
  /**
   * Update a simulation output (e.g., to update progress or add results)
   */
  public async updateSimulationOutput(
    id: UUID, 
    updates: Partial<SimulationOutput>
  ): Promise<boolean> {
    // Get current output
    const currentOutput = await this.getSimulationOutput(id);
    if (!currentOutput) {
      return false;
    }
    
    // Apply updates
    const updatedOutput = { ...currentOutput, ...updates };
    
    if (this.dbPromise) {
      // Update in IndexedDB
      await this.executeDbOperation(db => {
        const transaction = db.transaction('simulationOutputs', 'readwrite');
        const store = transaction.objectStore('simulationOutputs');
        return store.put(updatedOutput);
      });
    }
    
    // Update memory cache
    this.simulationOutputs.set(id, updatedOutput);
    
    return true;
  }
  
  /**
   * Delete a simulation output
   */
  public async deleteSimulationOutput(id: UUID): Promise<boolean> {
    const output = await this.getSimulationOutput(id);
    if (!output) {
      return false;
    }
    
    if (this.dbPromise) {
      // Delete from IndexedDB
      await this.executeDbOperation(db => {
        const transaction = db.transaction('simulationOutputs', 'readwrite');
        const store = transaction.objectStore('simulationOutputs');
        return store.delete(id);
      });
    }
    
    // Update input-output relationship
    const outputsForInput = this.inputToOutputs.get(output.inputId);
    if (outputsForInput) {
      outputsForInput.delete(id);
      if (outputsForInput.size === 0) {
        this.inputToOutputs.delete(output.inputId);
      }
    }
    
    // Delete from memory cache
    this.simulationOutputs.delete(id);
    
    return true;
  }
  
  // ============= PARAMETER HISTORY METHODS =============
  
  /**
   * Record a parameter change in history
   */
  public async recordParameterChange(
    parameterId: string,
    simulationInputId: UUID,
    previousValue: any,
    newValue: any,
    changedBy: string
  ): Promise<UUID> {
    const history: ParameterHistory = {
      id: generateUUID(),
      parameterId,
      simulationInputId,
      timestamp: getCurrentTimestamp(),
      previousValue,
      newValue,
      changedBy
    };
    
    if (this.dbPromise) {
      // Store in IndexedDB
      await this.executeDbOperation(db => {
        const transaction = db.transaction('parameterHistory', 'readwrite');
        const store = transaction.objectStore('parameterHistory');
        return store.put(history);
      });
    }
    
    // Store in memory
    this.parameterHistory.set(history.id, history);
    
    return history.id;
  }
  
  /**
   * Get parameter history for a simulation
   */
  public async getParameterHistoryForSimulation(
    simulationInputId: UUID
  ): Promise<ParameterHistory[]> {
    let history: ParameterHistory[] = [];
    
    if (this.dbPromise) {
      try {
        // Fetch from IndexedDB using the simulationInputId index
        history = await this.executeDbOperation<ParameterHistory[]>(db => {
          const transaction = db.transaction('parameterHistory', 'readonly');
          const store = transaction.objectStore('parameterHistory');
          const index = store.index('simulationInputId');
          return index.getAll(simulationInputId);
        });
        
        // Update memory cache
        history.forEach(entry => {
          this.parameterHistory.set(entry.id, entry);
        });
      } catch (error) {
        console.error('Error fetching parameter history', error);
      }
    }
    
    // Check memory cache if db fetch failed or not available
    if (history.length === 0) {
      history = Array.from(this.parameterHistory.values())
        .filter(entry => entry.simulationInputId === simulationInputId);
    }
    
    return history;
  }
  
  /**
   * Get history for a specific parameter
   */
  public async getParameterHistory(
    parameterId: string
  ): Promise<ParameterHistory[]> {
    let history: ParameterHistory[] = [];
    
    if (this.dbPromise) {
      try {
        // Fetch from IndexedDB using the parameterId index
        history = await this.executeDbOperation<ParameterHistory[]>(db => {
          const transaction = db.transaction('parameterHistory', 'readonly');
          const store = transaction.objectStore('parameterHistory');
          const index = store.index('parameterId');
          return index.getAll(parameterId);
        });
        
        // Update memory cache
        history.forEach(entry => {
          this.parameterHistory.set(entry.id, entry);
        });
      } catch (error) {
        console.error('Error fetching parameter history', error);
      }
    }
    
    // Check memory cache if db fetch failed or not available
    if (history.length === 0) {
      history = Array.from(this.parameterHistory.values())
        .filter(entry => entry.parameterId === parameterId);
    }
    
    // Sort by timestamp (most recent first)
    history.sort((a, b) => b.timestamp - a.timestamp);
    
    return history;
  }
  
  /**
   * Delete parameter history entry
   */
  public async deleteParameterHistory(id: UUID): Promise<boolean> {
    if (this.dbPromise) {
      // Delete from IndexedDB
      await this.executeDbOperation(db => {
        const transaction = db.transaction('parameterHistory', 'readwrite');
        const store = transaction.objectStore('parameterHistory');
        return store.delete(id);
      });
    }
    
    // Delete from memory cache
    this.parameterHistory.delete(id);
    
    return true;
  }
  
  // ============= SIMULATION COMPARISON METHODS =============
  
  /**
   * Save a simulation comparison
   */
  public async saveSimulationComparison(
    comparison: SimulationComparison
  ): Promise<UUID> {
    // Ensure the comparison has an ID and timestamp
    if (!comparison.id) {
      comparison.id = generateUUID();
    }
    
    if (!comparison.createdAt) {
      comparison.createdAt = getCurrentTimestamp();
    }
    
    if (this.dbPromise) {
      // Store in IndexedDB
      await this.executeDbOperation(db => {
        const transaction = db.transaction('simulationComparisons', 'readwrite');
        const store = transaction.objectStore('simulationComparisons');
        return store.put(comparison);
      });
    }
    
    // Store in memory
    this.simulationComparisons.set(comparison.id, comparison);
    
    return comparison.id;
  }
  
  /**
   * Get a simulation comparison by ID
   */
  public async getSimulationComparison(
    id: UUID
  ): Promise<SimulationComparison | null> {
    // Try memory cache first
    if (this.simulationComparisons.has(id)) {
      return this.simulationComparisons.get(id) || null;
    }
    
    if (this.dbPromise) {
      try {
        // Try to fetch from IndexedDB
        const comparison = await this.executeDbOperation<SimulationComparison>(db => {
          const transaction = db.transaction('simulationComparisons', 'readonly');
          const store = transaction.objectStore('simulationComparisons');
          return store.get(id);
        });
        
        if (comparison) {
          // Update memory cache
          this.simulationComparisons.set(id, comparison);
          return comparison;
        }
      } catch (error) {
        console.error('Error fetching simulation comparison', error);
      }
    }
    
    return null;
  }
  
  /**
   * List all simulation comparisons
   */
  public async listSimulationComparisons(): Promise<SimulationComparison[]> {
    let comparisons: SimulationComparison[] = [];
    
    if (this.dbPromise) {
      try {
        // Fetch from IndexedDB
        comparisons = await this.executeDbOperation<SimulationComparison[]>(db => {
          const transaction = db.transaction('simulationComparisons', 'readonly');
          const store = transaction.objectStore('simulationComparisons');
          return store.getAll();
        });
        
        // Update memory cache
        comparisons.forEach(comparison => {
          this.simulationComparisons.set(comparison.id, comparison);
        });
      } catch (error) {
        console.error('Error listing simulation comparisons', error);
      }
    }
    
    // Check memory cache if db fetch failed or not available
    if (comparisons.length === 0) {
      comparisons = Array.from(this.simulationComparisons.values());
    }
    
    // Sort by createdAt (most recent first)
    comparisons.sort((a, b) => b.createdAt - a.createdAt);
    
    return comparisons;
  }
  
  /**
   * Delete a simulation comparison
   */
  public async deleteSimulationComparison(id: UUID): Promise<boolean> {
    if (this.dbPromise) {
      // Delete from IndexedDB
      await this.executeDbOperation(db => {
        const transaction = db.transaction('simulationComparisons', 'readwrite');
        const store = transaction.objectStore('simulationComparisons');
        return store.delete(id);
      });
    }
    
    // Delete from memory cache
    this.simulationComparisons.delete(id);
    
    return true;
  }
  
  // ============= DATA RETENTION METHODS =============
  
  /**
   * Implement tiered storage with data retention policies
   * This would move older simulations to cold storage or remove them
   * based on the retention policy
   */
  public async applyDataRetentionPolicy(
    options: {
      detailedRetentionDays?: number;
      summaryRetentionDays?: number;
      coldStorageThresholdDays?: number;
    } = {}
  ): Promise<void> {
    const detailedRetentionDays = options.detailedRetentionDays || 90; // 3 months
    const summaryRetentionDays = options.summaryRetentionDays || 365; // 1 year
    
    const now = Date.now();
    const detailedThreshold = now - (detailedRetentionDays * 24 * 60 * 60 * 1000);
    const summaryThreshold = now - (summaryRetentionDays * 24 * 60 * 60 * 1000);
    
    // Get all simulation outputs
    const allInputs = await this.listSimulationInputs();
    
    for (const input of allInputs) {
      const outputs = await this.listSimulationOutputs(input.id);
      
      for (const output of outputs) {
        if (output.startTime < summaryThreshold) {
          // Delete outputs older than summary threshold
          await this.deleteSimulationOutput(output.id);
          continue;
        }
        
        if (output.startTime < detailedThreshold && output.results) {
          // For outputs between detailed and summary threshold, 
          // keep only summary data and remove raw results
          const updatedOutput = { ...output };
          
          // Remove detailed data but keep summary
          if (updatedOutput.results) {
            // Remove raw results (potentially large)
            delete updatedOutput.results.rawResults;
            
            // Reduce distribution data resolution
            if (updatedOutput.results.distributionData.length > 20) {
              updatedOutput.results.distributionData = 
                this.reduceDistributionResolution(updatedOutput.results.distributionData, 20);
            }
          }
          
          await this.updateSimulationOutput(output.id, updatedOutput);
        }
      }
      
      // Clean up parameter history that's older than detailed threshold
      const history = await this.getParameterHistoryForSimulation(input.id);
      for (const entry of history) {
        if (entry.timestamp < detailedThreshold) {
          await this.deleteParameterHistory(entry.id);
        }
      }
      
      // Delete inputs that have no outputs
      const remainingOutputs = await this.listSimulationOutputs(input.id);
      if (remainingOutputs.length === 0) {
        await this.deleteSimulationInput(input.id);
      }
    }
  }
  
  /**
   * Reduce the resolution of distribution data for storage optimization
   */
  private reduceDistributionResolution(
    distributionData: any[],
    targetBins: number
  ): any[] {
    if (distributionData.length <= targetBins) {
      return distributionData;
    }
    
    const ratio = Math.ceil(distributionData.length / targetBins);
    const reducedData = [];
    
    for (let i = 0; i < distributionData.length; i += ratio) {
      const bin = distributionData[i];
      let frequency = bin.frequency;
      let cumulative = bin.cumulative;
      
      // Sum frequencies for bins being merged
      for (let j = 1; j < ratio && i + j < distributionData.length; j++) {
        frequency += distributionData[i + j].frequency;
        cumulative = distributionData[i + j].cumulative; // Take the last cumulative value
      }
      
      reducedData.push({
        bin: bin.bin,
        frequency,
        cumulative
      });
    }
    
    return reducedData;
  }
}

// Export singleton instance
export const monteCarloStorageService = MonteCarloStorageService.getInstance();
export default monteCarloStorageService;
