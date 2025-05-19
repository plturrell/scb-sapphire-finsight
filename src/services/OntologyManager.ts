import { TariffAlert } from '../types';

/**
 * OntologyManager for the Tariff Alert Scanner system
 * Implements an RDF-based ontology system for storing and querying 
 * semantic information about tariffs, countries, products, and policies
 */
class OntologyManager {
  private ontologyUrl: string;
  private store: any; // This would be a proper RDF store like rdflib.js in a full implementation
  private onReady?: (ontology: OntologyManager) => void;
  private isReady: boolean = false;
  
  constructor({ 
    ontologyUrl = '/ontologies/tariff-alert-scanner.ttl', 
    onReady 
  }: { 
    ontologyUrl?: string;
    onReady?: (ontology: OntologyManager) => void;
  }) {
    this.ontologyUrl = ontologyUrl;
    this.onReady = onReady;
    this.store = this.createStore();
    
    // Only load ontology on client side
    if (typeof window !== 'undefined') {
      this.loadOntology();
    }
  }
  
  /**
   * Creates the RDF store
   */
  private createStore() {
    // In a full implementation, this would initialize rdflib.js or similar
    // For now, we'll use a simple object store
    return {
      triples: [] as Triple[],
      classes: new Map<string, ClassDefinition>(),
      instances: new Map<string, InstanceDefinition>(),
      
      // Mock query execution
      executeQuery(query: string) {
        console.log('Executing SPARQL query:', query);
        // Mock implementation that would actually parse and run SPARQL
        
        // Extract the class name from a simple class query
        if (query.includes('rdf:type')) {
          const classMatch = query.match(/\?instance rdf:type (tas:[A-Za-z]+)/);
          if (classMatch && classMatch[1]) {
            const className = classMatch[1];
            return Array.from(this.instances.values())
              .filter(instance => instance.classes.includes(className))
              .map(instance => ({ instance: instance.uri }));
          }
        }
        
        return [];
      },
      
      // Add triples to the store
      addTriple(subject: string, predicate: string, object: string | number) {
        this.triples.push({ subject, predicate, object });
        
        // Update instance maps
        if (predicate === 'rdf:type' && typeof object === 'string') {
          if (!this.instances.has(subject)) {
            this.instances.set(subject, { 
              uri: subject, 
              classes: [object],
              labels: {},
              properties: new Map()
            });
          } else {
            const instance = this.instances.get(subject)!;
            if (!instance.classes.includes(object)) {
              instance.classes.push(object);
            }
          }
        }
        
        // Track labels
        if (predicate === 'rdfs:label' && typeof object === 'string') {
          const match = object.match(/"(.+)"@([a-z]+)/);
          if (match) {
            const [_, text, lang] = match;
            if (!this.instances.has(subject)) {
              this.instances.set(subject, { 
                uri: subject, 
                classes: [],
                labels: { [lang]: text },
                properties: new Map()
              });
            } else {
              const instance = this.instances.get(subject)!;
              instance.labels[lang] = text;
            }
          }
        }
        
        // Track data properties
        if (predicate.startsWith('tas:has') || predicate.startsWith('dc:')) {
          if (this.instances.has(subject)) {
            const instance = this.instances.get(subject)!;
            instance.properties.set(predicate, object);
          }
        }
      },
      
      // Parse and add turtle statements
      addTurtleStatements(turtleText: string) {
        // Simple parsing of turtle format statements
        const statements = turtleText.split('\n').filter(line => line.trim() !== '');
        
        statements.forEach(statement => {
          // Basic parsing, would be replaced by proper RDF library
          const parts = statement.split(' ');
          if (parts.length >= 3) {
            const subject = parts[0];
            const predicate = parts[1];
            // Join the rest for the object, which might contain spaces
            let object = parts.slice(2).join(' ').trim();
            
            // Remove trailing period if present
            if (object.endsWith(' .')) {
              object = object.slice(0, -2);
            } else if (object.endsWith('.')) {
              object = object.slice(0, -1);
            }
            
            // Handle numeric values
            if (object.match(/^"[0-9]+"(\^\^xsd:(integer|decimal|float))?$/)) {
              const numMatch = object.match(/^"([0-9]+(\.[0-9]+)?)".*$/);
              if (numMatch) {
                this.addTriple(subject, predicate, parseFloat(numMatch[1]));
                return;
              }
            }
            
            this.addTriple(subject, predicate, object);
          }
        });
      }
    };
  }
  
  /**
   * Load the ontology from the provided URL
   */
  public async loadOntology() {
    try {
      // Skip ontology loading during build (SSG)
      if (typeof window === 'undefined') {
        console.log('Skipping ontology loading during server-side rendering');
        return;
      }
      
      const response = await fetch(this.ontologyUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch ontology: ${response.status} ${response.statusText}`);
      }
      
      const turtleData = await response.text();
      
      // Parse Turtle RDF into the store
      await this.parseOntology(turtleData);
      
      console.log('Ontology loaded successfully');
      this.isReady = true;
      
      // Call the onReady callback with this instance
      if (this.onReady) {
        this.onReady(this);
      }
    } catch (error) {
      console.error('Failed to load ontology:', error);
    }
  }
  
  /**
   * Parse the ontology data into the store
   */
  private async parseOntology(turtleData: string) {
    // In a full implementation, this would use a proper RDF library
    // For now, we'll do some basic parsing
    
    // Split into statements
    const statements = turtleData.split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#'));
    
    // Load into our simple store
    this.store.addTurtleStatements(statements.join('\n'));
    
    return true;
  }
  
  /**
   * Get all instances of a specific class
   */
  public getInstancesOfClass(className: string) {
    // Query the RDF store for all instances of the given class
    const results = this.store.executeQuery(`
      PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
      PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
      PREFIX tas: <http://example.org/tariff-alert-scanner#>
      
      SELECT ?instance WHERE {
        ?instance rdf:type ${className} .
      }
    `);
    
    return results.map(result => result.instance);
  }
  
  /**
   * Get the label for a specific instance
   */
  public getLabelForInstance(instanceUri: string) {
    // Check cached instances first
    if (this.store.instances.has(instanceUri)) {
      const instance = this.store.instances.get(instanceUri);
      if (instance.labels && instance.labels['en']) {
        return instance.labels['en'];
      }
    }
    
    // Otherwise do a query
    const query = `
      PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
      
      SELECT ?label WHERE {
        <${instanceUri}> rdfs:label ?label .
        FILTER(LANG(?label) = 'en')
      }
    `;
    
    const results = this.store.executeQuery(query);
    return results.length > 0 ? results[0].label.value : instanceUri.split('#').pop();
  }
  
  /**
   * Add a tariff alert to the ontology
   */
  public addTariffAlert(alertData: TariffAlert) {
    // Create a new tariff alert instance in the ontology
    const alertId = `tas:TariffAlert_${Date.now()}`;
    const statements = [
      `${alertId} a tas:TariffAlert prov:Entity .`,
      `${alertId} rdfs:label "${alertData.title}"@en .`,
      `${alertId} tas:hasAlertTimestamp "${new Date().toISOString()}"^^xsd:dateTime .`,
      `${alertId} tas:hasConfidenceLevel ${alertData.confidence} .`,
      `${alertId} tas:hasPriority tas:${alertData.priority}Priority .`,
      `${alertId} prov:wasGeneratedBy tas:WebSearchMonitoring .`,
      `${alertId} prov:wasAttributedTo tas:TariffAlertScannerAgent .`,
      `${alertId} dc:description "${alertData.description}"@en .`,
    ];
    
    // Add country relationship if available
    if (alertData.country) {
      statements.push(`${alertId} tas:concernsCountry tas:${alertData.country.replace(/\s+/g, '')} .`);
    }
    
    // Add source information
    if (alertData.sourceUrl) {
      const sourceId = `tas:Source_${encodeURIComponent(alertData.sourceUrl)}`;
      statements.push(`${sourceId} a tas:NewsSource .`);
      statements.push(`${sourceId} rdfs:label "${alertData.sourceName}"@en .`);
      statements.push(`${alertId} prov:hadPrimarySource ${sourceId} .`);
    }
    
    // Add to the store
    this.store.addTurtleStatements(statements.join('\n'));
    
    return alertId;
  }
  
  /**
   * Add a tariff change to the ontology
   */
  public addTariffChange(changeData: TariffChange) {
    const changeId = `tas:TariffChange_${Date.now()}`;
    const statements = [
      `${changeId} a tas:TariffChange .`,
      `${changeId} rdfs:label "${changeData.title}"@en .`,
      `${changeId} tas:hasEffectiveDate "${changeData.effectiveDate.toISOString()}"^^xsd:dateTime .`,
      `${changeId} tas:hasTariffRate ${changeData.rate} .`,
      `${changeId} dc:description "${changeData.description}"@en .`,
    ];
    
    // Add country
    if (changeData.country) {
      statements.push(`${changeId} tas:concernsCountry tas:${changeData.country.replace(/\s+/g, '')} .`);
    }
    
    // Add product categories
    if (changeData.productCategories) {
      changeData.productCategories.forEach(category => {
        statements.push(`${changeId} tas:affectsProductCategory tas:${category.replace(/\s+/g, '')} .`);
      });
    }
    
    // Add policy
    if (changeData.policy) {
      statements.push(`${changeId} tas:implementsPolicy tas:${changeData.policy.replace(/\s+/g, '')} .`);
    }
    
    // Add to the store
    this.store.addTurtleStatements(statements.join('\n'));
    
    return changeId;
  }
  
  /**
   * Get the related object for a relationship
   */
  public getRelatedObject(subjectUri: string, predicateUri: string) {
    // In a full implementation, this would use a SPARQL query
    // For our simple store, we'll do a linear search
    const triple = this.store.triples.find(
      t => t.subject === subjectUri && t.predicate === predicateUri
    );
    
    return triple ? triple.object : null;
  }
  
  /**
   * Get all related objects for a relationship
   */
  public getRelatedObjects(subjectUri: string, predicateUri: string) {
    // For our simple store, we'll do a filter
    return this.store.triples
      .filter(t => t.subject === subjectUri && t.predicate === predicateUri)
      .map(t => t.object);
  }
  
  /**
   * Get a data property value
   */
  public getDataPropertyValue(subjectUri: string, predicateUri: string) {
    // Check instance cache first
    if (this.store.instances.has(subjectUri)) {
      const instance = this.store.instances.get(subjectUri);
      if (instance.properties.has(predicateUri)) {
        return instance.properties.get(predicateUri);
      }
    }
    
    // Fall back to triple search
    const triple = this.store.triples.find(
      t => t.subject === subjectUri && t.predicate === predicateUri
    );
    
    return triple ? triple.object : null;
  }
  
  /**
   * Add industry impact to the ontology
   */
  public addIndustryImpact(impactData: IndustryImpact) {
    const impactId = `tas:IndustryImpact_${Date.now()}`;
    const statements = [
      `${impactId} a tas:IndustryImpact .`,
      `${impactId} rdfs:label "${impactData.industry} Impact"@en .`,
      `${impactId} tas:hasImpactSeverity ${impactData.severity} .`,
      `${impactId} tas:hasEstimatedAnnualImpact ${impactData.estimatedAnnualImpact} .`,
      `${impactId} dc:description "${impactData.description}"@en .`,
    ];
    
    // Add related tariff changes
    if (impactData.relatedTariffChangeId) {
      statements.push(`${impactData.relatedTariffChangeId} tas:indicatesImpact ${impactId} .`);
    }
    
    // Add to the store
    this.store.addTurtleStatements(statements.join('\n'));
    
    return impactId;
  }
  
  /**
   * Get entities by relation
   */
  public getEntitiesByRelation(predicateUri: string, objectUri: string) {
    // For our simple store, do a filter
    return this.store.triples
      .filter(t => t.predicate === predicateUri && t.object === objectUri)
      .map(t => t.subject);
  }
  
  /**
   * Execute a SPARQL query
   */
  public query(sparqlQuery: string) {
    return this.store.executeQuery(sparqlQuery);
  }
  
  /**
   * Check if the ontology is ready
   */
  public isOntologyReady() {
    return this.isReady;
  }
}

/**
 * Simple types for our RDF store
 */
interface Triple {
  subject: string;
  predicate: string;
  object: string | number;
}

interface ClassDefinition {
  uri: string;
  properties: string[];
}

interface InstanceDefinition {
  uri: string;
  classes: string[];
  labels: Record<string, string>;
  properties: Map<string, string | number>;
}

// Export singleton instance
export const ontologyManager = new OntologyManager({});

// Export class for direct use
export { OntologyManager };
