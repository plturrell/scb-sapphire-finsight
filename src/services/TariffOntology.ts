import { OntologyManager } from './OntologyManager';
import { TariffInfo, TariffSearchParams, TariffChangeEvent } from './SemanticTariffEngine';
import { v4 as uuidv4 } from 'uuid';

/**
 * TariffOntology class
 * 
 * Implements the Apache Jena-style RDF ontology for tariff data management
 * using semantic web principles. This class manages RDF triples representing 
 * tariff information, tariff changes, countries, and product categories.
 */
export class TariffOntology {
  private ontologyManager: OntologyManager;
  private baseNamespace: string = 'http://example.org/tariff-ontology#';
  private prefixes: Record<string, string> = {
    tariff: this.baseNamespace,
    rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
    rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
    xsd: 'http://www.w3.org/2001/XMLSchema#',
    owl: 'http://www.w3.org/2002/07/owl#',
    dc: 'http://purl.org/dc/elements/1.1/',
    skos: 'http://www.w3.org/2004/02/skos/core#',
    time: 'http://www.w3.org/2006/time#',
    geo: 'http://www.w3.org/2003/01/geo/wgs84_pos#',
    hs: 'http://example.org/harmonized-system#'
  };
  
  constructor(ontologyManager: OntologyManager) {
    this.ontologyManager = ontologyManager;
  }
  
  /**
   * Initialize the tariff ontology
   */
  public async initialize(): Promise<void> {
    try {
      // Define the core tariff ontology structure
      const ontologyDefinition = this.generateOntologyDefinition();
      
      // In a real implementation, this would load or create a Jena TDB store
      console.log('Tariff ontology initialized');
      
      return;
    } catch (error) {
      console.error('Failed to initialize tariff ontology:', error);
      throw error;
    }
  }
  
  /**
   * Generate the core ontology definition
   */
  private generateOntologyDefinition(): string {
    // This would define the classes, properties, and relationships
    // for tariff data in Turtle format
    return `
      @prefix tariff: <${this.prefixes.tariff}> .
      @prefix rdf: <${this.prefixes.rdf}> .
      @prefix rdfs: <${this.prefixes.rdfs}> .
      @prefix owl: <${this.prefixes.owl}> .
      @prefix xsd: <${this.prefixes.xsd}> .
      @prefix dc: <${this.prefixes.dc}> .
      @prefix skos: <${this.prefixes.skos}> .
      @prefix hs: <${this.prefixes.hs}> .
      
      # Classes
      tariff:Tariff a owl:Class ;
        rdfs:label "Tariff"@en ;
        rdfs:comment "A duty imposed on imported or exported goods"@en .
      
      tariff:Country a owl:Class ;
        rdfs:label "Country"@en ;
        rdfs:comment "A nation or sovereign state"@en .
      
      tariff:HSCode a owl:Class ;
        rdfs:label "HS Code"@en ;
        rdfs:comment "Harmonized System Code for product classification"@en .
      
      tariff:TariffChange a owl:Class ;
        rdfs:label "Tariff Change"@en ;
        rdfs:comment "A recorded change in tariff rates or policies"@en .
      
      tariff:ProductCategory a owl:Class ;
        rdfs:label "Product Category"@en ;
        rdfs:comment "A category of products for tariff classification"@en .
      
      tariff:DataSource a owl:Class ;
        rdfs:label "Data Source"@en ;
        rdfs:comment "Source of tariff information"@en .
      
      # Properties
      tariff:hasHSCode a owl:ObjectProperty ;
        rdfs:domain tariff:Tariff ;
        rdfs:range tariff:HSCode ;
        rdfs:label "has HS code"@en .
      
      tariff:hasSourceCountry a owl:ObjectProperty ;
        rdfs:domain tariff:Tariff ;
        rdfs:range tariff:Country ;
        rdfs:label "has source country"@en .
      
      tariff:hasDestinationCountry a owl:ObjectProperty ;
        rdfs:domain tariff:Tariff ;
        rdfs:range tariff:Country ;
        rdfs:label "has destination country"@en .
      
      tariff:hasRate a owl:DatatypeProperty ;
        rdfs:domain tariff:Tariff ;
        rdfs:range xsd:decimal ;
        rdfs:label "has rate"@en .
      
      tariff:hasEffectiveDate a owl:DatatypeProperty ;
        rdfs:domain tariff:Tariff ;
        rdfs:range xsd:date ;
        rdfs:label "has effective date"@en .
      
      tariff:hasExpirationDate a owl:DatatypeProperty ;
        rdfs:domain tariff:Tariff ;
        rdfs:range xsd:date ;
        rdfs:label "has expiration date"@en .
      
      tariff:hasConfidence a owl:DatatypeProperty ;
        rdfs:domain tariff:Tariff ;
        rdfs:range xsd:decimal ;
        rdfs:label "has confidence"@en .
      
      tariff:hasDataSource a owl:ObjectProperty ;
        rdfs:domain tariff:Tariff ;
        rdfs:range tariff:DataSource ;
        rdfs:label "has data source"@en .
      
      tariff:affectsCountry a owl:ObjectProperty ;
        rdfs:domain tariff:TariffChange ;
        rdfs:range tariff:Country ;
        rdfs:label "affects country"@en .
      
      tariff:hasOldRate a owl:DatatypeProperty ;
        rdfs:domain tariff:TariffChange ;
        rdfs:range xsd:decimal ;
        rdfs:label "has old rate"@en .
      
      tariff:hasNewRate a owl:DatatypeProperty ;
        rdfs:domain tariff:TariffChange ;
        rdfs:range xsd:decimal ;
        rdfs:label "has new rate"@en .
      
      tariff:hasAnnouncementDate a owl:DatatypeProperty ;
        rdfs:domain tariff:TariffChange ;
        rdfs:range xsd:date ;
        rdfs:label "has announcement date"@en .
      
      tariff:hasImpactLevel a owl:DatatypeProperty ;
        rdfs:domain tariff:TariffChange ;
        rdfs:range xsd:string ;
        rdfs:label "has impact level"@en .
      
      tariff:relatedToCountry a owl:ObjectProperty ;
        rdfs:domain tariff:TariffChange ;
        rdfs:range tariff:Country ;
        rdfs:label "related to country"@en .
    `;
  }
  
  /**
   * Add tariff information to the ontology
   */
  public async addTariffInfo(tariff: TariffInfo): Promise<string> {
    try {
      // Generate a new URI for the tariff if one doesn't exist
      const tariffId = tariff.id || `tariff:T_${uuidv4()}`;
      
      // Convert to RDF statements
      const statements = [
        `${tariffId} a tariff:Tariff .`,
        `${tariffId} rdfs:label "${tariff.description.replace(/"/g, '\\"')}"@en .`,
        `${tariffId} tariff:hasRate "${tariff.rate}"^^xsd:decimal .`
      ];
      
      // Add HS code
      if (tariff.hsCode) {
        const hsCodeId = `hs:${tariff.hsCode.replace(/\s+/g, '_')}`;
        statements.push(`${tariffId} tariff:hasHSCode ${hsCodeId} .`);
        statements.push(`${hsCodeId} a tariff:HSCode .`);
        statements.push(`${hsCodeId} rdfs:label "${tariff.hsCode}"@en .`);
      }
      
      // Add countries
      if (tariff.sourceCountry) {
        const sourceCountryId = `tariff:${tariff.sourceCountry.replace(/\s+/g, '_')}`;
        statements.push(`${tariffId} tariff:hasSourceCountry ${sourceCountryId} .`);
        statements.push(`${sourceCountryId} a tariff:Country .`);
        statements.push(`${sourceCountryId} rdfs:label "${tariff.sourceCountry}"@en .`);
      }
      
      if (tariff.destinationCountry) {
        const destCountryId = `tariff:${tariff.destinationCountry.replace(/\s+/g, '_')}`;
        statements.push(`${tariffId} tariff:hasDestinationCountry ${destCountryId} .`);
        statements.push(`${destCountryId} a tariff:Country .`);
        statements.push(`${destCountryId} rdfs:label "${tariff.destinationCountry}"@en .`);
      }
      
      // Add dates
      if (tariff.effectiveDate) {
        statements.push(`${tariffId} tariff:hasEffectiveDate "${tariff.effectiveDate}"^^xsd:date .`);
      }
      
      if (tariff.expirationDate) {
        statements.push(`${tariffId} tariff:hasExpirationDate "${tariff.expirationDate}"^^xsd:date .`);
      }
      
      // Add exemptions
      if (tariff.exemptions && tariff.exemptions.length > 0) {
        tariff.exemptions.forEach((exemption, index) => {
          const exemptionId = `${tariffId}_exemption_${index}`;
          statements.push(`${exemptionId} a tariff:Exemption .`);
          statements.push(`${exemptionId} rdfs:label "${exemption.replace(/"/g, '\\"')}"@en .`);
          statements.push(`${tariffId} tariff:hasExemption ${exemptionId} .`);
        });
      }
      
      // Add special conditions
      if (tariff.specialConditions && tariff.specialConditions.length > 0) {
        tariff.specialConditions.forEach((condition, index) => {
          const conditionId = `${tariffId}_condition_${index}`;
          statements.push(`${conditionId} a tariff:SpecialCondition .`);
          statements.push(`${conditionId} rdfs:label "${condition.replace(/"/g, '\\"')}"@en .`);
          statements.push(`${tariffId} tariff:hasSpecialCondition ${conditionId} .`);
        });
      }
      
      // Add data source
      if (tariff.source) {
        const sourceId = `tariff:source_${tariff.source.id.replace(/\s+/g, '_')}`;
        statements.push(`${tariffId} tariff:hasDataSource ${sourceId} .`);
        statements.push(`${sourceId} a tariff:DataSource .`);
        statements.push(`${sourceId} rdfs:label "${tariff.source.name.replace(/"/g, '\\"')}"@en .`);
        statements.push(`${sourceId} tariff:hasReliability "${tariff.source.reliability}"^^xsd:decimal .`);
        
        if (tariff.source.url) {
          statements.push(`${sourceId} tariff:hasUrl "${tariff.source.url}"^^xsd:anyURI .`);
        }
      }
      
      // Add confidence level
      if (tariff.confidence) {
        statements.push(`${tariffId} tariff:hasConfidence "${tariff.confidence}"^^xsd:decimal .`);
      }
      
      // Add last updated
      if (tariff.lastUpdated) {
        statements.push(`${tariffId} tariff:lastUpdated "${tariff.lastUpdated}"^^xsd:dateTime .`);
      }
      
      // In a real implementation, we would add these statements to the Jena TDB store
      // For now, we'll just log them for demonstration
      // console.log('Adding tariff statements to ontology:', statements);
      
      return tariffId;
    } catch (error) {
      console.error('Error adding tariff info to ontology:', error);
      throw error;
    }
  }
  
  /**
   * Add tariff change information to the ontology
   */
  public async addTariffChange(change: TariffChangeEvent): Promise<string> {
    try {
      // Generate a new URI for the change if one doesn't exist
      const changeId = change.id || `tariff:change_${uuidv4()}`;
      
      // Convert to RDF statements
      const statements = [
        `${changeId} a tariff:TariffChange .`,
        `${changeId} rdfs:label "${change.title.replace(/"/g, '\\"')}"@en .`,
        `${changeId} dc:description "${change.description.replace(/"/g, '\\"')}"@en .`
      ];
      
      // Add country
      if (change.country) {
        const countryId = `tariff:${change.country.replace(/\s+/g, '_')}`;
        statements.push(`${changeId} tariff:affectsCountry ${countryId} .`);
        statements.push(`${countryId} a tariff:Country .`);
        statements.push(`${countryId} rdfs:label "${change.country}"@en .`);
      }
      
      // Add HS code
      if (change.hsCode) {
        const hsCodeId = `hs:${change.hsCode.replace(/\s+/g, '_')}`;
        statements.push(`${changeId} tariff:affectsHSCode ${hsCodeId} .`);
        statements.push(`${hsCodeId} a tariff:HSCode .`);
        statements.push(`${hsCodeId} rdfs:label "${change.hsCode}"@en .`);
      }
      
      // Add product categories
      if (change.productCategories && change.productCategories.length > 0) {
        change.productCategories.forEach(category => {
          const categoryId = `tariff:category_${category.replace(/\s+/g, '_')}`;
          statements.push(`${changeId} tariff:affectsProductCategory ${categoryId} .`);
          statements.push(`${categoryId} a tariff:ProductCategory .`);
          statements.push(`${categoryId} rdfs:label "${category}"@en .`);
        });
      }
      
      // Add rates
      if (change.oldRate !== undefined) {
        statements.push(`${changeId} tariff:hasOldRate "${change.oldRate}"^^xsd:decimal .`);
      }
      
      if (change.newRate !== undefined) {
        statements.push(`${changeId} tariff:hasNewRate "${change.newRate}"^^xsd:decimal .`);
      }
      
      // Add dates
      if (change.effectiveDate) {
        statements.push(`${changeId} tariff:hasEffectiveDate "${change.effectiveDate}"^^xsd:date .`);
      }
      
      if (change.announcementDate) {
        statements.push(`${changeId} tariff:hasAnnouncementDate "${change.announcementDate}"^^xsd:date .`);
      }
      
      // Add source
      if (change.source) {
        const sourceId = `tariff:source_${change.source.id.replace(/\s+/g, '_')}`;
        statements.push(`${changeId} tariff:hasDataSource ${sourceId} .`);
        statements.push(`${sourceId} a tariff:DataSource .`);
        statements.push(`${sourceId} rdfs:label "${change.source.name.replace(/"/g, '\\"')}"@en .`);
        statements.push(`${sourceId} tariff:hasReliability "${change.source.reliability}"^^xsd:decimal .`);
        
        if (change.source.url) {
          statements.push(`${sourceId} tariff:hasUrl "${change.source.url}"^^xsd:anyURI .`);
        }
      }
      
      // Add impact level
      if (change.impactLevel) {
        statements.push(`${changeId} tariff:hasImpactLevel "${change.impactLevel}"^^xsd:string .`);
      }
      
      // Add related countries
      if (change.relatedCountries && change.relatedCountries.length > 0) {
        change.relatedCountries.forEach(country => {
          const countryId = `tariff:${country.replace(/\s+/g, '_')}`;
          statements.push(`${changeId} tariff:relatedToCountry ${countryId} .`);
          statements.push(`${countryId} a tariff:Country .`);
          statements.push(`${countryId} rdfs:label "${country}"@en .`);
        });
      }
      
      // Add confidence
      if (change.confidence) {
        statements.push(`${changeId} tariff:hasConfidence "${change.confidence}"^^xsd:decimal .`);
      }
      
      // In a real implementation, we would add these statements to the Jena TDB store
      // For now, we'll just log them for demonstration
      // console.log('Adding tariff change statements to ontology:', statements);
      
      return changeId;
    } catch (error) {
      console.error('Error adding tariff change to ontology:', error);
      throw error;
    }
  }
  
  /**
   * Search for tariff information
   */
  public async searchTariffs(params: TariffSearchParams): Promise<TariffInfo[]> {
    try {
      // In a real implementation, this would query the Jena TDB store with SPARQL
      // For demonstration, we'll return mock data
      
      // Build a SPARQL query based on search parameters
      const query = this.buildTariffSearchQuery(params);
      
      // For now, return mock data
      return this.getMockTariffResults(params);
    } catch (error) {
      console.error('Error searching tariffs in ontology:', error);
      throw error;
    }
  }
  
  /**
   * Build a SPARQL query for tariff search
   */
  private buildTariffSearchQuery(params: TariffSearchParams): string {
    const queryParts = [
      `PREFIX tariff: <${this.prefixes.tariff}>`,
      `PREFIX rdf: <${this.prefixes.rdf}>`,
      `PREFIX rdfs: <${this.prefixes.rdfs}>`,
      `PREFIX xsd: <${this.prefixes.xsd}>`,
      
      `SELECT ?tariff ?hsCode ?description ?sourceCountry ?destCountry ?rate ?effectiveDate ?expirationDate ?confidence`,
      `WHERE {`,
      `  ?tariff rdf:type tariff:Tariff .`,
      `  ?tariff rdfs:label ?description .`,
      `  ?tariff tariff:hasRate ?rate .`
    ];
    
    // Add optional parameters
    if (params.hsCode) {
      queryParts.push(`  ?tariff tariff:hasHSCode ?hsCodeEntity .`);
      queryParts.push(`  ?hsCodeEntity rdfs:label "${params.hsCode}"@en .`);
    } else {
      queryParts.push(`  OPTIONAL { ?tariff tariff:hasHSCode ?hsCodeEntity . ?hsCodeEntity rdfs:label ?hsCode . }`);
    }
    
    if (params.originCountry) {
      queryParts.push(`  ?tariff tariff:hasSourceCountry ?sourceCountryEntity .`);
      queryParts.push(`  ?sourceCountryEntity rdfs:label "${params.originCountry}"@en .`);
    } else {
      queryParts.push(`  OPTIONAL { ?tariff tariff:hasSourceCountry ?sourceCountryEntity . ?sourceCountryEntity rdfs:label ?sourceCountry . }`);
    }
    
    if (params.destinationCountry) {
      queryParts.push(`  ?tariff tariff:hasDestinationCountry ?destCountryEntity .`);
      queryParts.push(`  ?destCountryEntity rdfs:label "${params.destinationCountry}"@en .`);
    } else {
      queryParts.push(`  OPTIONAL { ?tariff tariff:hasDestinationCountry ?destCountryEntity . ?destCountryEntity rdfs:label ?destCountry . }`);
    }
    
    if (params.effectiveDate) {
      queryParts.push(`  ?tariff tariff:hasEffectiveDate ?effectiveDate .`);
      queryParts.push(`  FILTER (?effectiveDate <= "${params.effectiveDate}"^^xsd:date)`);
      
      if (!params.includeExpired) {
        queryParts.push(`  OPTIONAL { ?tariff tariff:hasExpirationDate ?expirationDate . }`);
        queryParts.push(`  FILTER (!BOUND(?expirationDate) || ?expirationDate >= "${params.effectiveDate}"^^xsd:date)`);
      }
    } else {
      queryParts.push(`  OPTIONAL { ?tariff tariff:hasEffectiveDate ?effectiveDate . }`);
      queryParts.push(`  OPTIONAL { ?tariff tariff:hasExpirationDate ?expirationDate . }`);
      
      if (!params.includeExpired) {
        const today = new Date().toISOString().split('T')[0];
        queryParts.push(`  FILTER (!BOUND(?expirationDate) || ?expirationDate >= "${today}"^^xsd:date)`);
      }
    }
    
    // Add product search
    if (params.product) {
      queryParts.push(`  FILTER (CONTAINS(LCASE(?description), LCASE("${params.product}")))`);
    }
    
    // Add confidence
    queryParts.push(`  OPTIONAL { ?tariff tariff:hasConfidence ?confidence . }`);
    
    // Close the query
    queryParts.push(`}`);
    
    // Add limit if specified
    if (params.limit) {
      queryParts.push(`LIMIT ${params.limit}`);
    }
    
    return queryParts.join('\n');
  }
  
  /**
   * Get tariff changes by country
   */
  public async getTariffChangesByCountry(country: string, limit: number = 10): Promise<TariffChangeEvent[]> {
    try {
      // In a real implementation, this would query the Jena TDB store with SPARQL
      // For demonstration, we'll return mock data
      
      // Build a SPARQL query for tariff changes by country
      const query = `
        PREFIX tariff: <${this.prefixes.tariff}>
        PREFIX rdf: <${this.prefixes.rdf}>
        PREFIX rdfs: <${this.prefixes.rdfs}>
        PREFIX dc: <${this.prefixes.dc}>
        
        SELECT ?change ?title ?description ?country ?hsCode ?oldRate ?newRate 
               ?effectiveDate ?announcementDate ?impactLevel ?confidence
        WHERE {
          ?change rdf:type tariff:TariffChange .
          ?change rdfs:label ?title .
          ?change dc:description ?description .
          
          ?change tariff:affectsCountry ?countryEntity .
          ?countryEntity rdfs:label "${country}"@en .
          
          OPTIONAL { ?change tariff:affectsHSCode ?hsCodeEntity . ?hsCodeEntity rdfs:label ?hsCode . }
          OPTIONAL { ?change tariff:hasOldRate ?oldRate . }
          OPTIONAL { ?change tariff:hasNewRate ?newRate . }
          OPTIONAL { ?change tariff:hasEffectiveDate ?effectiveDate . }
          OPTIONAL { ?change tariff:hasAnnouncementDate ?announcementDate . }
          OPTIONAL { ?change tariff:hasImpactLevel ?impactLevel . }
          OPTIONAL { ?change tariff:hasConfidence ?confidence . }
        }
        ORDER BY DESC(?announcementDate)
        LIMIT ${limit}
      `;
      
      // For now, return mock data
      return this.getMockTariffChangeResults(country, limit);
    } catch (error) {
      console.error(`Error getting tariff changes for ${country}:`, error);
      throw error;
    }
  }
  
  /**
   * Execute a SPARQL query
   */
  public async executeSparqlQuery(query: string): Promise<any[]> {
    try {
      // In a real implementation, this would execute the query against the Jena TDB store
      // For demonstration, we'll log the query and return mock data
      console.log('Executing SPARQL query:', query);
      
      // Parse the query to determine what kind of response to mock
      if (query.toLowerCase().includes('tariff:tariff')) {
        return this.getMockTariffResults({});
      } else if (query.toLowerCase().includes('tariff:tariffchange')) {
        return this.getMockTariffChangeResults('Global', 5);
      } else {
        return [];
      }
    } catch (error) {
      console.error('Error executing SPARQL query:', error);
      throw error;
    }
  }
  
  /**
   * Get mock tariff results for demonstration
   */
  private getMockTariffResults(params: TariffSearchParams): TariffInfo[] {
    // Create some mock results
    const results: TariffInfo[] = [];
    
    // Filter source country if specified
    const countries = params.originCountry 
      ? [params.originCountry] 
      : ['China', 'United States', 'European Union', 'Japan', 'South Korea'];
    
    // Filter destination country if specified
    const destinations = params.destinationCountry
      ? [params.destinationCountry]
      : ['United States', 'European Union', 'China', 'Vietnam', 'India'];
    
    // Filter product categories based on product search
    let productCategories = ['Electronics', 'Textiles', 'Automotive', 'Chemicals', 'Agricultural Products'];
    if (params.product) {
      const searchTerm = params.product.toLowerCase();
      if (searchTerm.includes('electron')) {
        productCategories = ['Electronics', 'Semiconductor Components', 'Electrical Equipment'];
      } else if (searchTerm.includes('auto') || searchTerm.includes('car')) {
        productCategories = ['Automotive', 'Vehicle Parts', 'Transportation Equipment'];
      } else if (searchTerm.includes('food') || searchTerm.includes('agri')) {
        productCategories = ['Agricultural Products', 'Processed Foods', 'Beverages'];
      }
    }
    
    // Generate mock results
    const limit = params.limit || 5;
    for (let i = 0; i < limit; i++) {
      const sourceIdx = i % countries.length;
      const destIdx = (i + 1) % destinations.length;
      const productIdx = i % productCategories.length;
      
      // Skip if source and destination are the same
      if (countries[sourceIdx] === destinations[destIdx]) {
        continue;
      }
      
      results.push({
        id: `tariff:T_${uuidv4()}`,
        hsCode: `${8500 + i}.${10 + i}`,
        description: `Import duty on ${productCategories[productIdx]} from ${countries[sourceIdx]}`,
        sourceCountry: countries[sourceIdx],
        destinationCountry: destinations[destIdx],
        rate: 5 + (i * 2.5),
        effectiveDate: new Date(2025, 0, 1 + i).toISOString().split('T')[0],
        exemptions: i % 2 === 0 ? ['Humanitarian aid', 'Research samples'] : undefined,
        specialConditions: i % 3 === 0 ? ['Subject to quota restrictions', 'Requires special licensing'] : undefined,
        source: {
          id: 'mock-data',
          name: 'Example Database',
          type: 'database',
          description: 'Mock tariff data for demonstration',
          reliability: 0.9
        },
        confidence: 0.95 - (i * 0.05),
        lastUpdated: new Date().toISOString()
      });
    }
    
    return results;
  }
  
  /**
   * Get mock tariff change results for demonstration
   */
  private getMockTariffChangeResults(country: string, limit: number): TariffChangeEvent[] {
    // Create some mock results
    const results: TariffChangeEvent[] = [];
    
    const productCategories = ['Electronics', 'Textiles', 'Automotive', 'Steel', 'Agricultural Products'];
    const impactLevels: Array<'low' | 'medium' | 'high'> = ['low', 'medium', 'high'];
    const relatedCountries = ['United States', 'China', 'European Union', 'Japan', 'South Korea', 'Vietnam'];
    
    // Generate mock results
    for (let i = 0; i < limit; i++) {
      const productIdx = i % productCategories.length;
      const impactIdx = i % impactLevels.length;
      
      // Create dates with more recent ones first
      const announcementDate = new Date();
      announcementDate.setDate(announcementDate.getDate() - (i * 15));
      
      const effectiveDate = new Date(announcementDate);
      effectiveDate.setMonth(effectiveDate.getMonth() + 1);
      
      // Filter related countries to not include the main country
      const related = relatedCountries.filter(c => c !== country);
      
      results.push({
        id: `tariff:change_${uuidv4()}`,
        title: `${country} ${i % 2 === 0 ? 'increases' : 'reduces'} ${productCategories[productIdx]} tariffs`,
        description: `${country} has announced ${i % 2 === 0 ? 'an increase' : 'a reduction'} in import duties for ${productCategories[productIdx]} products, affecting trade with ${related[0]} and ${related[1]}.`,
        country: country,
        hsCode: `${8500 + i}.${10 + i}`,
        productCategories: [productCategories[productIdx]],
        oldRate: 5 + (i * 1.5),
        newRate: i % 2 === 0 ? 7.5 + (i * 1.5) : 2.5 + (i * 1.5),
        effectiveDate: effectiveDate.toISOString().split('T')[0],
        announcementDate: announcementDate.toISOString().split('T')[0],
        source: {
          id: 'mock-news',
          name: 'Example News Source',
          type: 'website',
          description: 'Mock tariff news for demonstration',
          reliability: 0.85
        },
        impactLevel: impactLevels[impactIdx],
        relatedCountries: [related[0], related[1]],
        confidence: 0.9 - (i * 0.05)
      });
    }
    
    return results;
  }
}