/**
 * Jena Client Service
 * Provides functionality to interact with the Apache Jena RDF store
 */

import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { JenaConfig } from './JenaConfig';
import { JenaCacheService } from '../redis/JenaCacheService';

/**
 * Types for SPARQL query results
 */
export interface SparqlBinding {
  [key: string]: {
    type: string;
    value: string;
    datatype?: string;
    'xml:lang'?: string;
  };
}

export interface SparqlResults {
  head: {
    vars: string[];
    link?: string[];
  };
  results: {
    bindings: SparqlBinding[];
  };
}

export interface SparqlAskResult {
  head: {};
  boolean: boolean;
}

export interface SparqlConstructResult {
  [key: string]: { [predicate: string]: { [object: string]: boolean } };
}

export interface JenaClientOptions {
  endpoint?: string;
  dataset?: string;
  auth?: {
    username?: string;
    password?: string;
    useAuth?: boolean;
  };
  headers?: Record<string, string>;
  timeout?: number;
}

/**
 * Jena Client for interacting with Apache Jena triplestore
 */
export class JenaClient {
  private client: AxiosInstance;
  private baseEndpoint: string;
  private dataset: string;
  private defaultHeaders: Record<string, string>;
  
  constructor(options?: JenaClientOptions) {
    // Use provided options or fallback to JenaConfig
    this.baseEndpoint = options?.endpoint || JenaConfig.baseEndpoint;
    this.dataset = options?.dataset || JenaConfig.dataset;
    
    // Set up default headers
    this.defaultHeaders = {
      'Accept': 'application/sparql-results+json,application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
      ...(options?.headers || {}),
    };
    
    // Create axios client
    this.client = axios.create({
      baseURL: this.baseEndpoint,
      timeout: options?.timeout || 30000,
    });
    
    // Set up authentication if needed
    const useAuth = options?.auth?.useAuth !== undefined 
      ? options.auth.useAuth 
      : JenaConfig.auth.useAuth;
      
    if (useAuth) {
      const username = options?.auth?.username || JenaConfig.auth.username;
      const password = options?.auth?.password || JenaConfig.auth.password;
      
      if (username && password) {
        this.client.defaults.auth = {
          username,
          password,
        };
      }
    }
    
    console.log(`Initialized Jena client for endpoint: ${this.baseEndpoint}`);
  }
  
  /**
   * Execute a SPARQL query
   */
  public async query<T = SparqlResults>(
    query: string, 
    options?: { 
      dataset?: string; 
      bypassCache?: boolean;
      timeout?: number;
      [key: string]: any;
    }
  ): Promise<T> {
    const dataset = options?.dataset || this.dataset;
    const endpoint = `${this.baseEndpoint}/${dataset}/query`;
    const bypassCache = options?.bypassCache || false;
    
    // Prepare query parameters
    const params = new URLSearchParams();
    params.append('query', query);
    
    // Add any additional parameters
    if (options) {
      Object.entries(options).forEach(([key, value]) => {
        if (key !== 'dataset' && key !== 'bypassCache' && key !== 'timeout') {
          params.append(key, String(value));
        }
      });
    }
    
    // Create cache parameters
    const cacheParams = {
      query,
      dataset,
      ...options,
    };
    
    // Try to get from cache if not bypassing
    if (!bypassCache) {
      const cachedResult = await JenaCacheService.getCachedQueryResult<T>(cacheParams);
      if (cachedResult !== null) {
        console.log(`Cache hit for SPARQL query in dataset ${dataset}`);
        return cachedResult;
      }
    }
    
    // Request configuration
    const config: AxiosRequestConfig = {
      headers: this.defaultHeaders,
    };
    
    // Set timeout if specified
    if (options?.timeout) {
      config.timeout = options.timeout;
    }
    
    try {
      // Execute the query
      const response = await this.client.post(endpoint, params, config);
      const result = response.data as T;
      
      // Cache the result for future use
      await JenaCacheService.cacheQueryResult(cacheParams, result);
      
      return result;
    } catch (error) {
      console.error('Error executing SPARQL query:', error);
      throw error;
    }
  }
  
  /**
   * Execute a SPARQL update (INSERT/DELETE/etc.)
   */
  public async update(
    update: string, 
    options?: { 
      dataset?: string;
      timeout?: number;
    }
  ): Promise<void> {
    const dataset = options?.dataset || this.dataset;
    const endpoint = `${this.baseEndpoint}/${dataset}/update`;
    
    // Prepare update parameters
    const params = new URLSearchParams();
    params.append('update', update);
    
    // Request configuration
    const config: AxiosRequestConfig = {
      headers: {
        ...this.defaultHeaders,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    };
    
    // Set timeout if specified
    if (options?.timeout) {
      config.timeout = options.timeout;
    }
    
    try {
      // Execute the update
      await this.client.post(endpoint, params, config);
      
      // Clear cached queries that might be affected by this update
      // This is a simple approach; in production you might want more selective cache invalidation
      await JenaCacheService.clearAllQueryCache();
    } catch (error) {
      console.error('Error executing SPARQL update:', error);
      throw error;
    }
  }
  
  /**
   * Execute a SPARQL ASK query
   */
  public async ask(
    query: string, 
    options?: { 
      dataset?: string; 
      bypassCache?: boolean;
      timeout?: number;
    }
  ): Promise<boolean> {
    if (!query.toLowerCase().includes('ask')) {
      query = `ASK { ${query} }`;
    }
    
    const result = await this.query<SparqlAskResult>(query, options);
    return result.boolean;
  }
  
  /**
   * Execute a SPARQL SELECT query
   */
  public async select(
    query: string, 
    options?: { 
      dataset?: string; 
      bypassCache?: boolean;
      timeout?: number;
    }
  ): Promise<SparqlResults> {
    if (!query.toLowerCase().includes('select')) {
      throw new Error('Query must be a SELECT query');
    }
    
    return await this.query<SparqlResults>(query, options);
  }
  
  /**
   * Execute a SPARQL CONSTRUCT query
   */
  public async construct(
    query: string, 
    options?: { 
      dataset?: string; 
      bypassCache?: boolean;
      timeout?: number;
    }
  ): Promise<SparqlConstructResult> {
    if (!query.toLowerCase().includes('construct')) {
      throw new Error('Query must be a CONSTRUCT query');
    }
    
    const constructOptions = {
      ...options,
      headers: {
        'Accept': 'application/ld+json',
      },
    };
    
    return await this.query<SparqlConstructResult>(query, constructOptions);
  }
  
  /**
   * Upload RDF data to a graph
   */
  public async uploadData(
    data: string, 
    options?: { 
      dataset?: string;
      graph?: string;
      format?: string;
      timeout?: number;
    }
  ): Promise<void> {
    const dataset = options?.dataset || this.dataset;
    let endpoint = `${this.baseEndpoint}/${dataset}/data`;
    
    // Add graph parameter if specified
    if (options?.graph) {
      endpoint += `?graph=${encodeURIComponent(options.graph)}`;
    }
    
    // Determine content type based on format
    let contentType = 'text/turtle';
    if (options?.format) {
      switch (options.format.toLowerCase()) {
        case 'json-ld':
        case 'jsonld':
          contentType = 'application/ld+json';
          break;
        case 'rdf+xml':
        case 'rdfxml':
          contentType = 'application/rdf+xml';
          break;
        case 'n-triples':
        case 'ntriples':
          contentType = 'application/n-triples';
          break;
        case 'turtle':
        case 'ttl':
          contentType = 'text/turtle';
          break;
      }
    }
    
    // Request configuration
    const config: AxiosRequestConfig = {
      headers: {
        ...this.defaultHeaders,
        'Content-Type': contentType,
      },
    };
    
    // Set timeout if specified
    if (options?.timeout) {
      config.timeout = options.timeout;
    }
    
    try {
      // Upload the data
      await this.client.put(endpoint, data, config);
      
      // Clear cached queries that might be affected by this update
      await JenaCacheService.clearAllQueryCache();
    } catch (error) {
      console.error('Error uploading RDF data:', error);
      throw error;
    }
  }
  
  /**
   * Delete a graph
   */
  public async deleteGraph(
    graph: string, 
    options?: { 
      dataset?: string;
      timeout?: number;
    }
  ): Promise<void> {
    const dataset = options?.dataset || this.dataset;
    const endpoint = `${this.baseEndpoint}/${dataset}/data?graph=${encodeURIComponent(graph)}`;
    
    // Request configuration
    const config: AxiosRequestConfig = {
      headers: this.defaultHeaders,
    };
    
    // Set timeout if specified
    if (options?.timeout) {
      config.timeout = options.timeout;
    }
    
    try {
      // Delete the graph
      await this.client.delete(endpoint, config);
      
      // Clear cached queries that might be affected by this deletion
      await JenaCacheService.clearAllQueryCache();
    } catch (error) {
      console.error('Error deleting graph:', error);
      throw error;
    }
  }
  
  /**
   * Check if the Jena server is available
   */
  public async ping(): Promise<boolean> {
    try {
      // Try to access the server info endpoint
      const response = await this.client.get('$/ping', {
        timeout: 5000,
      });
      
      return response.status === 200;
    } catch (error) {
      console.error('Error pinging Jena server:', error);
      return false;
    }
  }
  
  /**
   * Get server information
   */
  public async getServerInfo(): Promise<any> {
    try {
      const response = await this.client.get('$/server');
      return response.data;
    } catch (error) {
      console.error('Error getting Jena server info:', error);
      throw error;
    }
  }
  
  /**
   * List all datasets
   */
  public async listDatasets(): Promise<string[]> {
    try {
      const response = await this.client.get('$/datasets');
      return response.data.datasets || [];
    } catch (error) {
      console.error('Error listing Jena datasets:', error);
      throw error;
    }
  }
  
  /**
   * List all graphs in a dataset
   */
  public async listGraphs(dataset?: string): Promise<string[]> {
    const ds = dataset || this.dataset;
    
    try {
      const response = await this.query<SparqlResults>(
        'SELECT DISTINCT ?g WHERE { GRAPH ?g { ?s ?p ?o } }',
        { dataset: ds }
      );
      
      return response.results.bindings.map(binding => binding.g.value);
    } catch (error) {
      console.error(`Error listing graphs in dataset ${ds}:`, error);
      throw error;
    }
  }
}

// Export a singleton instance for use throughout the application
export const jenaClient = new JenaClient();
export default jenaClient;