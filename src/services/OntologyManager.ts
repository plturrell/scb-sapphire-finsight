import { TariffAlert } from '../types';
import { Parser, Writer, Store } from 'n3';
import { DataFactory } from 'n3';
import { RedisDataStore } from './RedisDataStore';
import { NotificationCenter } from './NotificationCenter';

// Define RDF namespaces
const NAMESPACES = {
  rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
  rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
  owl: 'http://www.w3.org/2002/07/owl#',
  xsd: 'http://www.w3.org/2001/XMLSchema#',
  tas: 'http://scb.com/ontology/tariff-alert#',
  dc: 'http://purl.org/dc/elements/1.1/',
  prov: 'http://www.w3.org/ns/prov#',
  skos: 'http://www.w3.org/2004/02/skos/core#'
};

// Types
interface OntologyConfig {
  ontologyUrl?: string;
  onReady?: (ontology: OntologyManager) => void;
  redisDataStore?: RedisDataStore;
}

// Interface for tariff change
interface TariffChange {
  id?: string;
  title: string;
  description: string;
  country: string;
  rate: number;
  effectiveDate: Date;
  productCategories: string[];
  policy?: string;
}

// Interface for industry impact
interface IndustryImpact {
  id?: string;
  industry: string;
  severity: number;
  estimatedAnnualImpact: number;
  description: string;
  relatedTariffChangeId?: string;
  suggestedMitigations?: string[];
}

// Query result type
interface QueryResult {
  [key: string]: string;
}

/**
 * OntologyManager for the Tariff Alert Scanner system
 * Implements an RDF-based ontology system for storing and querying 
 * semantic information about tariffs, countries, products, and policies
 * 
 * This implementation uses the N3.js library for RDF parsing and querying
 */
export class OntologyManager {
  private ontologyUrl: string;
  private store: Store;
  private onReady?: (ontology: OntologyManager) => void;
  private isReady: boolean = false;
  private parser: Parser;
  private redisDataStore: RedisDataStore;
  private static instance: OntologyManager | null = null;
  
  constructor({ 
    ontologyUrl = '/ontologies/tariff-alert-scanner.ttl', 
    onReady,
    redisDataStore
  }: OntologyConfig = {}) {
    this.ontologyUrl = ontologyUrl;
    this.onReady = onReady;
    this.redisDataStore = redisDataStore || RedisDataStore.getInstance();
    
    // Initialize N3 store and parser
    this.store = new Store();
    this.parser = new Parser({ blankNodePrefix: '' });
    
    // Only load ontology on client side
    if (typeof window !== 'undefined') {
      this.loadOntology();
    }
  }
  
  /**
   * Get singleton instance
   */
  public static getInstance(config?: OntologyConfig): OntologyManager {
    if (!OntologyManager.instance) {
      OntologyManager.instance = new OntologyManager(config);
    }
    return OntologyManager.instance;
  }
  
  /**
   * Initialize the ontology manager
   */
  public async initialize(): Promise<boolean> {
    try {
      if (this.isReady) {
        return true;
      }
      
      await this.loadOntology();
      this.isReady = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize ontology manager:', error);
      return false;
    }
  }
  
  /**
   * Load the ontology from the provided URL
   */
  public async loadOntology(): Promise<boolean> {
    try {
      // Skip ontology loading during build (SSG)
      if (typeof window === 'undefined') {
        console.log('Skipping ontology loading during server-side rendering');
        return true;
      }
      
      console.log(`Loading ontology from ${this.ontologyUrl}`);
      
      // Try to get ontology from Redis cache first
      const cachedOntology = await this.redisDataStore.get('ontology:cache');
      let turtleData: string;
      
      if (cachedOntology) {
        console.log('Using cached ontology from Redis');
        turtleData = cachedOntology;
      } else {
        // Fetch from file if not cached
        const response = await fetch(this.ontologyUrl);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch ontology: ${response.status} ${response.statusText}`);
        }
        
        turtleData = await response.text();
        
        // Cache the ontology in Redis
        await this.redisDataStore.set('ontology:cache', turtleData, 60 * 60); // 1 hour TTL
      }
      
      // Parse the ontology and load into store
      await this.parseOntology(turtleData);
      
      console.log('Ontology loaded successfully');
      this.isReady = true;
      
      // Load additional tariff alert instances from Redis
      await this.loadTariffAlertsFromRedis();
      
      // Call the onReady callback with this instance
      if (this.onReady) {
        this.onReady(this);
      }
      
      return true;
    } catch (error) {
      console.error('Failed to load ontology:', error);
      
      // Notify about the failure
      NotificationCenter.showNotification({
        title: 'Ontology Loading Error',
        body: `Failed to load tariff ontology: ${(error as Error).message}`,
        priority: 'high',
        category: 'alert',
        module: 'tariff-analysis'
      });
      
      return false;
    }
  }
  
  /**
   * Parse the ontology data into the store
   */
  private async parseOntology(turtleData: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.parser.parse(turtleData, (error, quad, prefixes) => {
        if (error) {
          reject(error);
          return;
        }
        
        if (quad) {
          this.store.addQuad(quad);
        } else {
          // No more quads, parsing complete
          console.log(`Loaded ${this.store.size} triples into the ontology`);
          resolve(true);
        }
      });
    });
  }
  
  /**
   * Load tariff alerts from Redis to add to the ontology
   */
  private async loadTariffAlertsFromRedis(): Promise<void> {
    try {
      // Get recent alerts from Redis
      const result = await this.redisDataStore.getTariffAlerts(1, 100);
      
      if (result.alerts && result.alerts.length > 0) {
        console.log(`Loading ${result.alerts.length} tariff alerts from Redis into ontology`);
        
        for (const alert of result.alerts) {
          // Only add to ontology if not already present
          const alertId = `tas:TariffAlert_${alert.id || ''}`;
          const exists = this.store.getQuads(this.expandUri(alertId), null, null, null).length > 0;
          
          if (!exists) {
            this.addTariffAlert(alert);
          }
        }
      }
    } catch (error) {
      console.error('Error loading tariff alerts from Redis:', error);
    }
  }
  
  /**
   * Get all instances of a specific class
   */
  public getInstancesOfClass(className: string): string[] {
    const typeProperty = this.expandUri(`${NAMESPACES.rdf}type`);
    const classUri = this.expandUri(className);
    
    const quads = this.store.getQuads(null, typeProperty, classUri, null);
    return quads.map(quad => quad.subject.value);
  }
  
  /**
   * Get the label for a specific instance
   */
  public getLabelForInstance(instanceUri: string): string {
    const labelProperty = this.expandUri(`${NAMESPACES.rdfs}label`);
    const fullUri = this.expandUri(instanceUri);
    
    const quads = this.store.getQuads(fullUri, labelProperty, null, null);
    
    if (quads.length > 0) {
      // Try to find English label first
      const enLabel = quads.find(quad => 
        quad.object.termType === 'Literal' && quad.object.language === 'en'
      );
      
      if (enLabel && enLabel.object.termType === 'Literal') {
        return enLabel.object.value;
      }
      
      // Fall back to any label
      if (quads[0].object.termType === 'Literal') {
        return quads[0].object.value;
      }
    }
    
    // Fall back to URI fragment
    return instanceUri.split('#').pop() || instanceUri;
  }
  
  /**
   * Add a tariff alert to the ontology
   */
  public addTariffAlert(alertData: TariffAlert): string {
    const alertId = `tas:TariffAlert_${alertData.id || Date.now()}`;
    const alertUri = this.expandUri(alertId);
    
    // Add the tariff alert to the ontology
    // Type triple
    this.store.addQuad(
      alertUri,
      this.expandUri(`${NAMESPACES.rdf}type`),
      this.expandUri(`${NAMESPACES.tas}TariffAlert`)
    );
    
    // Label triple
    this.store.addQuad(
      alertUri,
      this.expandUri(`${NAMESPACES.rdfs}label`),
      DataFactory.literal(alertData.title, 'en')
    );
    
    // Add timestamp
    this.store.addQuad(
      alertUri,
      this.expandUri(`${NAMESPACES.tas}alertTimestamp`),
      DataFactory.literal(
        alertData.createdAt.toISOString(),
        DataFactory.namedNode(`${NAMESPACES.xsd}dateTime`)
      )
    );
    
    // Add confidence level
    this.store.addQuad(
      alertUri,
      this.expandUri(`${NAMESPACES.tas}confidenceLevel`),
      DataFactory.literal(String(alertData.confidence), 
        DataFactory.namedNode(`${NAMESPACES.xsd}decimal`))
    );
    
    // Add priority
    this.store.addQuad(
      alertUri,
      this.expandUri(`${NAMESPACES.tas}priority`),
      this.expandUri(`${NAMESPACES.tas}${alertData.priority}Priority`)
    );
    
    // Add description
    this.store.addQuad(
      alertUri,
      this.expandUri(`${NAMESPACES.dc}description`),
      DataFactory.literal(alertData.description, 'en')
    );
    
    // Add country relationship
    if (alertData.country) {
      const countryId = `tas:${alertData.country.replace(/\s+/g, '')}`;
      const countryUri = this.expandUri(countryId);
      
      // Ensure country exists
      if (this.store.getQuads(countryUri, null, null, null).length === 0) {
        // Add country to ontology
        this.store.addQuad(
          countryUri,
          this.expandUri(`${NAMESPACES.rdf}type`),
          this.expandUri(`${NAMESPACES.tas}Country`)
        );
        
        this.store.addQuad(
          countryUri,
          this.expandUri(`${NAMESPACES.rdfs}label`),
          DataFactory.literal(alertData.country, 'en')
        );
      }
      
      // Link alert to country
      this.store.addQuad(
        alertUri,
        this.expandUri(`${NAMESPACES.tas}affectsCountry`),
        countryUri
      );
    }
    
    // Add product categories
    if (alertData.productCategories && alertData.productCategories.length > 0) {
      for (const category of alertData.productCategories) {
        const productId = `tas:${category.replace(/\s+/g, '')}`;
        const productUri = this.expandUri(productId);
        
        // Ensure product exists
        if (this.store.getQuads(productUri, null, null, null).length === 0) {
          // Add product to ontology
          this.store.addQuad(
            productUri,
            this.expandUri(`${NAMESPACES.rdf}type`),
            this.expandUri(`${NAMESPACES.tas}Product`)
          );
          
          this.store.addQuad(
            productUri,
            this.expandUri(`${NAMESPACES.rdfs}label`),
            DataFactory.literal(category, 'en')
          );
        }
        
        // Link alert to product
        this.store.addQuad(
          alertUri,
          this.expandUri(`${NAMESPACES.tas}affectsProduct`),
          productUri
        );
      }
    }
    
    // Add effective date if available
    if (alertData.effectiveDate) {
      this.store.addQuad(
        alertUri,
        this.expandUri(`${NAMESPACES.tas}effectiveDate`),
        DataFactory.literal(
          alertData.effectiveDate.toISOString(),
          DataFactory.namedNode(`${NAMESPACES.xsd}dateTime`)
        )
      );
    }
    
    // Add source information if available
    if (alertData.sourceUrl) {
      const sourceId = `tas:Source_${encodeURIComponent(alertData.sourceUrl).substring(0, 20)}`;
      const sourceUri = this.expandUri(sourceId);
      
      // Add source
      this.store.addQuad(
        sourceUri,
        this.expandUri(`${NAMESPACES.rdf}type`),
        this.expandUri(`${NAMESPACES.tas}InformationSource`)
      );
      
      this.store.addQuad(
        sourceUri,
        this.expandUri(`${NAMESPACES.rdfs}label`),
        DataFactory.literal(alertData.sourceName || 'Information Source', 'en')
      );
      
      this.store.addQuad(
        sourceUri,
        this.expandUri(`${NAMESPACES.tas}sourceUrl`),
        DataFactory.literal(alertData.sourceUrl)
      );
      
      // Link alert to source
      this.store.addQuad(
        alertUri,
        this.expandUri(`${NAMESPACES.prov}hadPrimarySource`),
        sourceUri
      );
    }
    
    return alertId;
  }
  
  /**
   * Add a tariff change to the ontology
   */
  public addTariffChange(changeData: TariffChange): string {
    const changeId = `tas:TariffChange_${changeData.id || Date.now()}`;
    const changeUri = this.expandUri(changeId);
    
    // Type triple
    this.store.addQuad(
      changeUri,
      this.expandUri(`${NAMESPACES.rdf}type`),
      this.expandUri(`${NAMESPACES.tas}TariffChange`)
    );
    
    // Label
    this.store.addQuad(
      changeUri,
      this.expandUri(`${NAMESPACES.rdfs}label`),
      DataFactory.literal(changeData.title, 'en')
    );
    
    // Effective date
    this.store.addQuad(
      changeUri,
      this.expandUri(`${NAMESPACES.tas}effectiveDate`),
      DataFactory.literal(
        changeData.effectiveDate.toISOString(),
        DataFactory.namedNode(`${NAMESPACES.xsd}dateTime`)
      )
    );
    
    // Tariff rate
    this.store.addQuad(
      changeUri,
      this.expandUri(`${NAMESPACES.tas}tariffRate`),
      DataFactory.literal(String(changeData.rate), 
        DataFactory.namedNode(`${NAMESPACES.xsd}decimal`))
    );
    
    // Description
    this.store.addQuad(
      changeUri,
      this.expandUri(`${NAMESPACES.dc}description`),
      DataFactory.literal(changeData.description, 'en')
    );
    
    // Add country
    if (changeData.country) {
      const countryId = `tas:${changeData.country.replace(/\s+/g, '')}`;
      const countryUri = this.expandUri(countryId);
      
      // Ensure country exists
      if (this.store.getQuads(countryUri, null, null, null).length === 0) {
        this.store.addQuad(
          countryUri,
          this.expandUri(`${NAMESPACES.rdf}type`),
          this.expandUri(`${NAMESPACES.tas}Country`)
        );
        
        this.store.addQuad(
          countryUri,
          this.expandUri(`${NAMESPACES.rdfs}label`),
          DataFactory.literal(changeData.country, 'en')
        );
      }
      
      // Link
      this.store.addQuad(
        changeUri,
        this.expandUri(`${NAMESPACES.tas}concernsCountry`),
        countryUri
      );
    }
    
    // Add product categories
    if (changeData.productCategories && changeData.productCategories.length > 0) {
      for (const category of changeData.productCategories) {
        const productId = `tas:${category.replace(/\s+/g, '')}`;
        const productUri = this.expandUri(productId);
        
        // Ensure product exists
        if (this.store.getQuads(productUri, null, null, null).length === 0) {
          this.store.addQuad(
            productUri,
            this.expandUri(`${NAMESPACES.rdf}type`),
            this.expandUri(`${NAMESPACES.tas}Product`)
          );
          
          this.store.addQuad(
            productUri,
            this.expandUri(`${NAMESPACES.rdfs}label`),
            DataFactory.literal(category, 'en')
          );
        }
        
        // Link
        this.store.addQuad(
          changeUri,
          this.expandUri(`${NAMESPACES.tas}affectsProduct`),
          productUri
        );
      }
    }
    
    // Add policy if available
    if (changeData.policy) {
      const policyId = `tas:${changeData.policy.replace(/\s+/g, '')}`;
      const policyUri = this.expandUri(policyId);
      
      // Ensure policy exists
      if (this.store.getQuads(policyUri, null, null, null).length === 0) {
        this.store.addQuad(
          policyUri,
          this.expandUri(`${NAMESPACES.rdf}type`),
          this.expandUri(`${NAMESPACES.tas}TradePolicy`)
        );
        
        this.store.addQuad(
          policyUri,
          this.expandUri(`${NAMESPACES.rdfs}label`),
          DataFactory.literal(changeData.policy, 'en')
        );
      }
      
      // Link
      this.store.addQuad(
        changeUri,
        this.expandUri(`${NAMESPACES.tas}implementsPolicy`),
        policyUri
      );
    }
    
    return changeId;
  }
  
  /**
   * Add industry impact to the ontology
   */
  public addIndustryImpact(impactData: IndustryImpact): string {
    const impactId = `tas:IndustryImpact_${impactData.id || Date.now()}`;
    const impactUri = this.expandUri(impactId);
    
    // Type triple
    this.store.addQuad(
      impactUri,
      this.expandUri(`${NAMESPACES.rdf}type`),
      this.expandUri(`${NAMESPACES.tas}IndustryImpact`)
    );
    
    // Label
    this.store.addQuad(
      impactUri,
      this.expandUri(`${NAMESPACES.rdfs}label`),
      DataFactory.literal(`${impactData.industry} Impact`, 'en')
    );
    
    // Severity
    this.store.addQuad(
      impactUri,
      this.expandUri(`${NAMESPACES.tas}impactSeverity`),
      DataFactory.literal(String(impactData.severity), 
        DataFactory.namedNode(`${NAMESPACES.xsd}decimal`))
    );
    
    // Annual impact
    this.store.addQuad(
      impactUri,
      this.expandUri(`${NAMESPACES.tas}estimatedAnnualImpact`),
      DataFactory.literal(String(impactData.estimatedAnnualImpact), 
        DataFactory.namedNode(`${NAMESPACES.xsd}decimal`))
    );
    
    // Description
    this.store.addQuad(
      impactUri,
      this.expandUri(`${NAMESPACES.dc}description`),
      DataFactory.literal(impactData.description, 'en')
    );
    
    // Link to related tariff change if provided
    if (impactData.relatedTariffChangeId) {
      const changeUri = this.expandUri(impactData.relatedTariffChangeId);
      
      this.store.addQuad(
        changeUri,
        this.expandUri(`${NAMESPACES.tas}indicatesImpact`),
        impactUri
      );
    }
    
    // Add suggested mitigations if available
    if (impactData.suggestedMitigations && impactData.suggestedMitigations.length > 0) {
      for (let i = 0; i < impactData.suggestedMitigations.length; i++) {
        const mitigation = impactData.suggestedMitigations[i];
        
        this.store.addQuad(
          impactUri,
          this.expandUri(`${NAMESPACES.tas}suggestsMitigation`),
          DataFactory.literal(mitigation, 'en')
        );
      }
    }
    
    return impactId;
  }
  
  /**
   * Get the related object for a relationship
   */
  public getRelatedObject(subjectUri: string, predicateUri: string): string | null {
    const subject = this.expandUri(subjectUri);
    const predicate = this.expandUri(predicateUri);
    
    const quads = this.store.getQuads(subject, predicate, null, null);
    
    if (quads.length > 0) {
      return quads[0].object.value;
    }
    
    return null;
  }
  
  /**
   * Get all related objects for a relationship
   */
  public getRelatedObjects(subjectUri: string, predicateUri: string): string[] {
    const subject = this.expandUri(subjectUri);
    const predicate = this.expandUri(predicateUri);
    
    const quads = this.store.getQuads(subject, predicate, null, null);
    
    return quads.map(quad => quad.object.value);
  }
  
  /**
   * Get a data property value
   */
  public getDataPropertyValue(subjectUri: string, predicateUri: string): string | number | null {
    const subject = this.expandUri(subjectUri);
    const predicate = this.expandUri(predicateUri);
    
    const quads = this.store.getQuads(subject, predicate, null, null);
    
    if (quads.length > 0 && quads[0].object.termType === 'Literal') {
      const literal = quads[0].object;
      
      // Handle numeric literals
      if (literal.datatype) {
        const datatypeStr = literal.datatype.value;
        if (datatypeStr.endsWith('decimal') || 
            datatypeStr.endsWith('integer') || 
            datatypeStr.endsWith('float')) {
          return Number(literal.value);
        }
      }
      
      return literal.value;
    }
    
    return null;
  }
  
  /**
   * Get entities by relation (inverse relation lookup)
   */
  public getEntitiesByRelation(predicateUri: string, objectUri: string): string[] {
    const predicate = this.expandUri(predicateUri);
    const object = this.expandUri(objectUri);
    
    const quads = this.store.getQuads(null, predicate, object, null);
    
    return quads.map(quad => quad.subject.value);
  }
  
  /**
   * Execute a SPARQL-like query (simplified implementation)
   * This is a basic implementation that supports a subset of SPARQL
   */
  public query(queryStr: string): QueryResult[] {
    // Extract triple patterns from simplified SPARQL-like syntax
    const whereClauseMatch = queryStr.match(/WHERE\s*{([^}]+)}/i);
    
    if (!whereClauseMatch) {
      console.error('Query must include WHERE clause');
      return [];
    }
    
    const whereClause = whereClauseMatch[1].trim();
    const triplesPattern = whereClause.split('.').filter(s => s.trim());
    
    // Extract variable names from SELECT clause
    const selectMatch = queryStr.match(/SELECT\s+([^\s]+)/i);
    if (!selectMatch) {
      console.error('Query must include SELECT');
      return [];
    }
    
    const variableNames = selectMatch[1].split(/\s+/).filter(s => s.trim());
    
    // Parse each triple pattern and execute
    // This is a very simplified implementation that only handles basic patterns
    const results = [];
    
    for (const patternStr of triplesPattern) {
      const parts = patternStr.trim().split(/\s+/);
      if (parts.length < 3) continue;
      
      const subject = parts[0].startsWith('?') ? null : this.expandUri(parts[0]);
      const predicate = parts[1].startsWith('?') ? null : this.expandUri(parts[1]);
      const object = parts[2].startsWith('?') ? null : this.expandUri(parts[2]);
      
      const matchingQuads = this.store.getQuads(subject, predicate, object, null);
      
      // Extract variable values from matching quads
      for (const quad of matchingQuads) {
        const result: QueryResult = {};
        
        // Map variables to actual values
        for (const varName of variableNames) {
          if (varName === '?subject' && parts[0].startsWith('?')) {
            result[varName] = quad.subject.value;
          } else if (varName === '?predicate' && parts[1].startsWith('?')) {
            result[varName] = quad.predicate.value;
          } else if (varName === '?object' && parts[2].startsWith('?')) {
            result[varName] = quad.object.value;
          }
        }
        
        if (Object.keys(result).length > 0) {
          results.push(result);
        }
      }
    }
    
    return results;
  }
  
  /**
   * Expand a URI using the defined namespaces
   */
  private expandUri(uri: string): any {
    // If already a full URI, return as-is
    if (uri.startsWith('http://') || uri.startsWith('https://')) {
      return DataFactory.namedNode(uri);
    }
    
    // Handle prefixed URIs
    const parts = uri.split(':');
    if (parts.length === 2) {
      const prefix = parts[0];
      const localName = parts[1];
      
      if (NAMESPACES[prefix]) {
        return DataFactory.namedNode(`${NAMESPACES[prefix]}${localName}`);
      }
    }
    
    // Default handling for unknown prefixes
    return DataFactory.namedNode(uri);
  }
  
  /**
   * Check if the ontology is ready
   */
  public isOntologyReady(): boolean {
    return this.isReady;
  }
  
  /**
   * Get statistics about the ontology
   */
  public getOntologyStats(): { tripleCount: number; classCount: number; } {
    // Count classes
    const classType = this.expandUri(`${NAMESPACES.owl}Class`);
    const rdfType = this.expandUri(`${NAMESPACES.rdf}type`);
    const classQuads = this.store.getQuads(null, rdfType, classType, null);
    
    return {
      tripleCount: this.store.size,
      classCount: classQuads.length
    };
  }
  
  /**
   * Export ontology to Turtle format
   */
  public exportToTurtle(): Promise<string> {
    return new Promise((resolve, reject) => {
      const writer = new Writer({ 
        prefixes: NAMESPACES 
      });
      
      // Add all quads to the writer
      for (const quad of this.store.getQuads(null, null, null, null)) {
        writer.addQuad(quad);
      }
      
      // Write to string
      writer.end((error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      });
    });
  }
  
  /**
   * Create a Tariff Alert from SPARQL query results
   */
  public createTariffAlertFromQueryResults(results: QueryResult[]): TariffAlert[] {
    return results.map(result => {
      const alertUri = result['?subject'] || result['?alert'] || '';
      
      // Get alert properties
      const title = this.getLabelForInstance(alertUri) || 'Tariff Alert';
      const description = this.getDataPropertyValue(alertUri, `${NAMESPACES.dc}description`) || '';
      
      // Get country
      const countryUri = this.getRelatedObject(alertUri, `${NAMESPACES.tas}affectsCountry`);
      const country = countryUri ? this.getLabelForInstance(countryUri) : 'Unknown';
      
      // Get products
      const productUris = this.getRelatedObjects(alertUri, `${NAMESPACES.tas}affectsProduct`);
      const productCategories = productUris.map(uri => this.getLabelForInstance(uri));
      
      // Get impact level
      const impactLevel = this.getDataPropertyValue(alertUri, `${NAMESPACES.tas}impactSeverity`);
      const impactSeverity = typeof impactLevel === 'number' ? impactLevel : 5;
      
      // Get confidence
      const confidenceValue = this.getDataPropertyValue(alertUri, `${NAMESPACES.tas}confidenceLevel`);
      const confidence = typeof confidenceValue === 'number' ? confidenceValue : 0.8;
      
      // Get source
      const sourceUri = this.getRelatedObject(alertUri, `${NAMESPACES.prov}hadPrimarySource`);
      const sourceName = sourceUri ? this.getLabelForInstance(sourceUri) : '';
      const sourceUrl = sourceUri ? 
        this.getDataPropertyValue(sourceUri, `${NAMESPACES.tas}sourceUrl`) as string : '';
      
      // Get dates
      const publishDateStr = this.getDataPropertyValue(alertUri, `${NAMESPACES.tas}alertTimestamp`);
      const publishDate = typeof publishDateStr === 'string' ? new Date(publishDateStr) : new Date();
      
      const effectiveDateStr = this.getDataPropertyValue(alertUri, `${NAMESPACES.tas}effectiveDate`);
      const effectiveDate = typeof effectiveDateStr === 'string' ? new Date(effectiveDateStr) : undefined;
      
      // Get priority
      const priorityUri = this.getRelatedObject(alertUri, `${NAMESPACES.tas}priority`);
      let priority: 'Critical' | 'high' | 'medium' | 'low' = 'medium';
      
      if (priorityUri) {
        const priorityLabel = this.getLabelForInstance(priorityUri).toLowerCase();
        if (priorityLabel.includes('critical')) priority = 'Critical';
        else if (priorityLabel.includes('high')) priority = 'high';
        else if (priorityLabel.includes('low')) priority = 'low';
      }
      
      // Create alert
      return {
        id: alertUri.split('_').pop(),
        title,
        description: description as string,
        country,
        impactSeverity,
        confidence,
        sourceUrl,
        sourceName,
        publishDate,
        createdAt: new Date(),
        effectiveDate,
        priority,
        productCategories,
        aiEnhanced: true
      };
    });
  }
}

// Export singleton instance
export const ontologyManager = OntologyManager.getInstance();

// Export class for direct use
export default OntologyManager;