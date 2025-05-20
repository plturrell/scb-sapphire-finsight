// SPARQL query capabilities for tariff data
import { TariffInfo, TariffChangeEvent } from '../services/SemanticTariffEngine';

/**
 * TariffSPARQL provides standardized SPARQL queries for working with tariff data
 * from semantic triplestores like Apache Jena.
 */
export class TariffSPARQL {
  private prefixes: Record<string, string> = {
    rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
    rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
    xsd: 'http://www.w3.org/2001/XMLSchema#',
    tariff: 'http://example.org/tariff/',
    dc: 'http://purl.org/dc/elements/1.1/',
    owl: 'http://www.w3.org/2002/07/owl#',
    skos: 'http://www.w3.org/2004/02/skos/core#',
    hs: 'http://example.org/hs-code/'
  };
  
  /**
   * Get prefix declarations for SPARQL queries
   */
  public getPrefixDeclarations(): string {
    const prefixStatements = Object.entries(this.prefixes).map(
      ([key, uri]) => `PREFIX ${key}: <${uri}>`
    );
    
    return prefixStatements.join('\n');
  }
  
  /**
   * Generate a SPARQL query to find tariff rates for a product
   */
  public getProductTariffQuery({
    product,
    hsCode,
    sourceCountry,
    destinationCountry,
    effectiveDate,
    includeExpired = false,
    limit = 10
  }: {
    product?: string;
    hsCode?: string;
    sourceCountry?: string;
    destinationCountry?: string;
    effectiveDate?: string;
    includeExpired?: boolean;
    limit?: number;
  }): string {
    // Start with prefix declarations
    const query = [
      this.getPrefixDeclarations(),
      '',
      'SELECT ?tariff ?description ?hsCode ?hsCodeLabel ?sourceCountry ?sourceCountryLabel',
      '       ?destinationCountry ?destinationCountryLabel ?rate ?currency ?effectiveDate ?expirationDate',
      '       ?confidence',
      'WHERE {'
    ];
    
    // Basic triple patterns
    query.push('  ?tariff rdf:type tariff:Tariff .');
    query.push('  ?tariff rdfs:label ?description .');
    
    // Optional HS code
    if (hsCode) {
      query.push('  ?tariff tariff:hasHSCode ?hsCode .');
      query.push(`  ?hsCode rdfs:label "${hsCode}"@en .`);
    } else {
      query.push('  OPTIONAL {');
      query.push('    ?tariff tariff:hasHSCode ?hsCode .');
      query.push('    ?hsCode rdfs:label ?hsCodeLabel .');
      query.push('  }');
    }
    
    // Optional source country
    if (sourceCountry) {
      query.push('  ?tariff tariff:hasSourceCountry ?sourceCountry .');
      query.push(`  ?sourceCountry rdfs:label "${sourceCountry}"@en .`);
    } else {
      query.push('  OPTIONAL {');
      query.push('    ?tariff tariff:hasSourceCountry ?sourceCountry .');
      query.push('    ?sourceCountry rdfs:label ?sourceCountryLabel .');
      query.push('  }');
    }
    
    // Optional destination country
    if (destinationCountry) {
      query.push('  ?tariff tariff:hasDestinationCountry ?destinationCountry .');
      query.push(`  ?destinationCountry rdfs:label "${destinationCountry}"@en .`);
    } else {
      query.push('  OPTIONAL {');
      query.push('    ?tariff tariff:hasDestinationCountry ?destinationCountry .');
      query.push('    ?destinationCountry rdfs:label ?destinationCountryLabel .');
      query.push('  }');
    }
    
    // Rate is required
    query.push('  ?tariff tariff:hasRate ?rate .');
    
    // Optional currency
    query.push('  OPTIONAL { ?tariff tariff:hasCurrency ?currency . }');
    
    // Effective date handling
    query.push('  ?tariff tariff:hasEffectiveDate ?effectiveDate .');
    
    if (effectiveDate) {
      // Filter tariffs that are in effect on the specified date
      query.push(`  FILTER (?effectiveDate <= "${effectiveDate}"^^xsd:date)`);
      
      if (!includeExpired) {
        query.push('  OPTIONAL { ?tariff tariff:hasExpirationDate ?expirationDate . }');
        query.push(`  FILTER (!BOUND(?expirationDate) || ?expirationDate >= "${effectiveDate}"^^xsd:date)`);
      }
    } else {
      // Handle current date for queries without a specified date
      const today = new Date().toISOString().split('T')[0];
      
      if (!includeExpired) {
        query.push('  OPTIONAL { ?tariff tariff:hasExpirationDate ?expirationDate . }');
        query.push(`  FILTER (!BOUND(?expirationDate) || ?expirationDate >= "${today}"^^xsd:date)`);
      }
    }
    
    // Product search in description
    if (product) {
      query.push(`  FILTER (CONTAINS(LCASE(?description), LCASE("${product}")))`);
    }
    
    // Optional confidence
    query.push('  OPTIONAL { ?tariff tariff:hasConfidence ?confidence . }');
    
    // Close WHERE clause
    query.push('}');
    
    // Add ordering and limit
    query.push('ORDER BY DESC(?confidence) ?effectiveDate');
    query.push(`LIMIT ${limit}`);
    
    return query.join('\n');
  }
  
  /**
   * Generate a SPARQL query to find tariff changes for a country
   */
  public getTariffChangesByCountryQuery(country: string, limit: number = 10): string {
    // Start with prefix declarations
    const query = [
      this.getPrefixDeclarations(),
      '',
      'SELECT ?change ?title ?description ?country ?countryLabel ?hsCode ?hsCodeLabel',
      '       ?oldRate ?newRate ?effectiveDate ?announcementDate ?impactLevel ?confidence',
      'WHERE {'
    ];
    
    // Basic triple patterns
    query.push('  ?change rdf:type tariff:TariffChange .');
    query.push('  ?change rdfs:label ?title .');
    query.push('  OPTIONAL { ?change dc:description ?description . }');
    
    // Country filtering
    query.push('  ?change tariff:affectsCountry ?country .');
    query.push(`  ?country rdfs:label "${country}"@en .`);
    query.push('  ?country rdfs:label ?countryLabel .');
    
    // Optional HS code
    query.push('  OPTIONAL {');
    query.push('    ?change tariff:affectsHSCode ?hsCode .');
    query.push('    ?hsCode rdfs:label ?hsCodeLabel .');
    query.push('  }');
    
    // Optional rates
    query.push('  OPTIONAL { ?change tariff:hasOldRate ?oldRate . }');
    query.push('  OPTIONAL { ?change tariff:hasNewRate ?newRate . }');
    
    // Dates
    query.push('  OPTIONAL { ?change tariff:hasEffectiveDate ?effectiveDate . }');
    query.push('  OPTIONAL { ?change tariff:hasAnnouncementDate ?announcementDate . }');
    
    // Impact and confidence
    query.push('  OPTIONAL { ?change tariff:hasImpactLevel ?impactLevel . }');
    query.push('  OPTIONAL { ?change tariff:hasConfidence ?confidence . }');
    
    // Close WHERE clause
    query.push('}');
    
    // Add ordering and limit
    query.push('ORDER BY DESC(?announcementDate) DESC(?confidence)');
    query.push(`LIMIT ${limit}`);
    
    return query.join('\n');
  }
  
  /**
   * Generate a SPARQL query to find related countries for a tariff policy
   */
  public getRelatedCountriesForPolicyQuery(policyName: string): string {
    // Start with prefix declarations
    const query = [
      this.getPrefixDeclarations(),
      '',
      'SELECT ?country ?countryLabel',
      'WHERE {'
    ];
    
    // Basic triple patterns
    query.push('  ?policy rdf:type tariff:Policy .');
    query.push(`  ?policy rdfs:label "${policyName}"@en .`);
    query.push('  ?policy tariff:involvesCountry ?country .');
    query.push('  ?country rdfs:label ?countryLabel .');
    
    // Close WHERE clause
    query.push('}');
    
    // Add ordering
    query.push('ORDER BY ?countryLabel');
    
    return query.join('\n');
  }
  
  /**
   * Generate a SPARQL query to find policies affecting a specific product category
   */
  public getPoliciesForProductCategoryQuery(category: string): string {
    // Start with prefix declarations
    const query = [
      this.getPrefixDeclarations(),
      '',
      'SELECT ?policy ?policyLabel ?description ?implementationDate ?countries',
      'WHERE {'
    ];
    
    // Basic triple patterns
    query.push('  ?policy rdf:type tariff:Policy .');
    query.push('  ?policy rdfs:label ?policyLabel .');
    query.push('  OPTIONAL { ?policy dc:description ?description . }');
    query.push('  OPTIONAL { ?policy tariff:hasImplementationDate ?implementationDate . }');
    
    // Find policies that affect this product category
    query.push('  ?tariff tariff:implementsPolicy ?policy .');
    query.push('  ?tariff rdfs:label ?tariffLabel .');
    query.push(`  FILTER (CONTAINS(LCASE(?tariffLabel), LCASE("${category}")))`);
    
    // Gather countries as a group concat
    query.push('  OPTIONAL {');
    query.push('    SELECT ?policy (GROUP_CONCAT(?countryLabel; SEPARATOR=", ") AS ?countries)');
    query.push('    WHERE {');
    query.push('      ?policy tariff:involvesCountry ?country .');
    query.push('      ?country rdfs:label ?countryLabel .');
    query.push('    }');
    query.push('    GROUP BY ?policy');
    query.push('  }');
    
    // Close WHERE clause
    query.push('}');
    
    // Add ordering
    query.push('ORDER BY DESC(?implementationDate)');
    
    return query.join('\n');
  }
  
  /**
   * Generate a SPARQL query to find average tariff rates by country
   */
  public getAverageTariffRatesByCountryQuery(): string {
    // Start with prefix declarations
    const query = [
      this.getPrefixDeclarations(),
      '',
      'SELECT ?destinationCountryLabel (AVG(?rate) AS ?averageRate) (COUNT(?tariff) AS ?tariffCount)',
      'WHERE {'
    ];
    
    // Basic triple patterns
    query.push('  ?tariff rdf:type tariff:Tariff .');
    query.push('  ?tariff tariff:hasRate ?rate .');
    query.push('  ?tariff tariff:hasDestinationCountry ?destinationCountry .');
    query.push('  ?destinationCountry rdfs:label ?destinationCountryLabel .');
    
    // Only consider current tariffs
    const today = new Date().toISOString().split('T')[0];
    query.push('  ?tariff tariff:hasEffectiveDate ?effectiveDate .');
    query.push(`  FILTER (?effectiveDate <= "${today}"^^xsd:date)`);
    query.push('  OPTIONAL { ?tariff tariff:hasExpirationDate ?expirationDate . }');
    query.push(`  FILTER (!BOUND(?expirationDate) || ?expirationDate >= "${today}"^^xsd:date)`);
    
    // Close WHERE clause
    query.push('}');
    
    // Group by country
    query.push('GROUP BY ?destinationCountryLabel');
    
    // Order by average rate, highest first
    query.push('ORDER BY DESC(?averageRate)');
    
    return query.join('\n');
  }
  
  /**
   * Generate a SPARQL query to find a country's tariff relationship with other countries
   */
  public getCountryTariffRelationshipsQuery(country: string): string {
    // Start with prefix declarations
    const query = [
      this.getPrefixDeclarations(),
      '',
      'SELECT ?relatedCountryLabel ?direction (AVG(?rate) AS ?averageRate) (COUNT(?tariff) AS ?tariffCount)',
      'WHERE {'
    ];
    
    // Query for both incoming and outgoing tariffs
    query.push('  {');
    // Incoming tariffs (as destination country)
    query.push('    ?tariff rdf:type tariff:Tariff .');
    query.push('    ?tariff tariff:hasRate ?rate .');
    query.push('    ?tariff tariff:hasDestinationCountry ?destCountry .');
    query.push(`    ?destCountry rdfs:label "${country}"@en .`);
    query.push('    ?tariff tariff:hasSourceCountry ?relatedCountry .');
    query.push('    ?relatedCountry rdfs:label ?relatedCountryLabel .');
    query.push('    BIND("incoming" AS ?direction)');
    query.push('  } UNION {');
    // Outgoing tariffs (as source country)
    query.push('    ?tariff rdf:type tariff:Tariff .');
    query.push('    ?tariff tariff:hasRate ?rate .');
    query.push('    ?tariff tariff:hasSourceCountry ?sourceCountry .');
    query.push(`    ?sourceCountry rdfs:label "${country}"@en .`);
    query.push('    ?tariff tariff:hasDestinationCountry ?relatedCountry .');
    query.push('    ?relatedCountry rdfs:label ?relatedCountryLabel .');
    query.push('    BIND("outgoing" AS ?direction)');
    query.push('  }');
    
    // Only consider current tariffs
    const today = new Date().toISOString().split('T')[0];
    query.push('  ?tariff tariff:hasEffectiveDate ?effectiveDate .');
    query.push(`  FILTER (?effectiveDate <= "${today}"^^xsd:date)`);
    query.push('  OPTIONAL { ?tariff tariff:hasExpirationDate ?expirationDate . }');
    query.push(`  FILTER (!BOUND(?expirationDate) || ?expirationDate >= "${today}"^^xsd:date)`);
    
    // Close WHERE clause
    query.push('}');
    
    // Group by related country and direction
    query.push('GROUP BY ?relatedCountryLabel ?direction');
    
    // Order by direction and average rate
    query.push('ORDER BY ?direction DESC(?averageRate)');
    
    return query.join('\n');
  }
  
  /**
   * Generate a SPARQL query to find tariff exemptions
   */
  public getTariffExemptionsQuery(country?: string): string {
    // Start with prefix declarations
    const query = [
      this.getPrefixDeclarations(),
      '',
      'SELECT ?tariff ?tariffLabel ?exemption ?exemptionLabel ?hsCodeLabel ?sourceCountryLabel ?destinationCountryLabel',
      'WHERE {'
    ];
    
    // Basic triple patterns
    query.push('  ?tariff rdf:type tariff:Tariff .');
    query.push('  ?tariff rdfs:label ?tariffLabel .');
    query.push('  ?tariff tariff:hasExemption ?exemption .');
    query.push('  ?exemption rdfs:label ?exemptionLabel .');
    
    // Optional country filter
    if (country) {
      query.push('  {');
      query.push('    ?tariff tariff:hasSourceCountry ?sourceCountry .');
      query.push(`    ?sourceCountry rdfs:label "${country}"@en .`);
      query.push('    ?sourceCountry rdfs:label ?sourceCountryLabel .');
      query.push('  } UNION {');
      query.push('    ?tariff tariff:hasDestinationCountry ?destinationCountry .');
      query.push(`    ?destinationCountry rdfs:label "${country}"@en .`);
      query.push('    ?destinationCountry rdfs:label ?destinationCountryLabel .');
      query.push('  }');
    } else {
      // Optional labels for countries if not filtered
      query.push('  OPTIONAL {');
      query.push('    ?tariff tariff:hasSourceCountry ?sourceCountry .');
      query.push('    ?sourceCountry rdfs:label ?sourceCountryLabel .');
      query.push('  }');
      query.push('  OPTIONAL {');
      query.push('    ?tariff tariff:hasDestinationCountry ?destinationCountry .');
      query.push('    ?destinationCountry rdfs:label ?destinationCountryLabel .');
      query.push('  }');
    }
    
    // Get HS code if available
    query.push('  OPTIONAL {');
    query.push('    ?tariff tariff:hasHSCode ?hsCode .');
    query.push('    ?hsCode rdfs:label ?hsCodeLabel .');
    query.push('  }');
    
    // Close WHERE clause
    query.push('}');
    
    // Order by tariff label
    query.push('ORDER BY ?tariffLabel ?exemptionLabel');
    
    return query.join('\n');
  }
  
  /**
   * Generate a SPARQL query to find tariff rate trends over time
   */
  public getTariffRateTrendsQuery(hsCode: string, country?: string, period: number = 5): string {
    // Calculate the date from X years ago
    const today = new Date();
    const startDate = new Date();
    startDate.setFullYear(today.getFullYear() - period);
    const startDateStr = startDate.toISOString().split('T')[0];
    const todayStr = today.toISOString().split('T')[0];
    
    // Start with prefix declarations
    const query = [
      this.getPrefixDeclarations(),
      '',
      'SELECT ?year (AVG(?rate) AS ?averageRate) (COUNT(?tariff) AS ?tariffCount)',
      'WHERE {'
    ];
    
    // Basic triple patterns
    query.push('  ?tariff rdf:type tariff:Tariff .');
    query.push('  ?tariff tariff:hasRate ?rate .');
    query.push('  ?tariff tariff:hasHSCode ?hsCode .');
    query.push(`  ?hsCode rdfs:label "${hsCode}"@en .`);
    
    // Optional country filter
    if (country) {
      query.push('  {');
      query.push('    ?tariff tariff:hasSourceCountry ?sourceCountry .');
      query.push(`    ?sourceCountry rdfs:label "${country}"@en .`);
      query.push('  } UNION {');
      query.push('    ?tariff tariff:hasDestinationCountry ?destinationCountry .');
      query.push(`    ?destinationCountry rdfs:label "${country}"@en .`);
      query.push('  }');
    }
    
    // Date range
    query.push('  ?tariff tariff:hasEffectiveDate ?effectiveDate .');
    query.push(`  FILTER (?effectiveDate >= "${startDateStr}"^^xsd:date && ?effectiveDate <= "${todayStr}"^^xsd:date)`);
    
    // Extract year from effective date
    query.push('  BIND(YEAR(?effectiveDate) AS ?year)');
    
    // Close WHERE clause
    query.push('}');
    
    // Group by year
    query.push('GROUP BY ?year');
    
    // Order by year
    query.push('ORDER BY ?year');
    
    return query.join('\n');
  }
  
  /**
   * Parse SPARQL results into TariffInfo objects
   */
  public parseTariffResults(sparqlResults: any): TariffInfo[] {
    if (!sparqlResults || !sparqlResults.results || !sparqlResults.results.bindings) {
      return [];
    }
    
    const bindings = sparqlResults.results.bindings;
    const tariffs: TariffInfo[] = [];
    
    for (const binding of bindings) {
      const tariff: TariffInfo = {
        id: binding.tariff?.value || '',
        hsCode: binding.hsCodeLabel?.value || '',
        description: binding.description?.value || '',
        sourceCountry: binding.sourceCountryLabel?.value || '',
        destinationCountry: binding.destinationCountryLabel?.value || '',
        rate: parseFloat(binding.rate?.value) || 0,
        effectiveDate: binding.effectiveDate?.value || '',
        source: {
          id: 'sparql-query',
          name: 'Semantic Tariff Database',
          type: 'database',
          description: 'Tariff data from semantic triple store',
          reliability: 0.95
        },
        confidence: parseFloat(binding.confidence?.value) || 0.9,
        lastUpdated: new Date().toISOString()
      };
      
      // Optional fields
      if (binding.expirationDate?.value) {
        tariff.expirationDate = binding.expirationDate.value;
      }
      
      if (binding.currency?.value) {
        tariff.currency = binding.currency.value;
      }
      
      tariffs.push(tariff);
    }
    
    return tariffs;
  }
  
  /**
   * Parse SPARQL results into TariffChangeEvent objects
   */
  public parseTariffChangeResults(sparqlResults: any): TariffChangeEvent[] {
    if (!sparqlResults || !sparqlResults.results || !sparqlResults.results.bindings) {
      return [];
    }
    
    const bindings = sparqlResults.results.bindings;
    const changes: TariffChangeEvent[] = [];
    
    for (const binding of bindings) {
      const change: TariffChangeEvent = {
        id: binding.change?.value || '',
        title: binding.title?.value || '',
        description: binding.description?.value || '',
        country: binding.countryLabel?.value || '',
        productCategories: [],
        effectiveDate: binding.effectiveDate?.value || new Date().toISOString().split('T')[0],
        announcementDate: binding.announcementDate?.value || new Date().toISOString().split('T')[0],
        source: {
          id: 'sparql-query',
          name: 'Semantic Tariff Database',
          type: 'database',
          description: 'Tariff change data from semantic triple store',
          reliability: 0.95
        },
        impactLevel: (binding.impactLevel?.value as 'low' | 'medium' | 'high') || 'medium',
        relatedCountries: [],
        confidence: parseFloat(binding.confidence?.value) || 0.9
      };
      
      // Optional fields
      if (binding.hsCodeLabel?.value) {
        change.hsCode = binding.hsCodeLabel.value;
      }
      
      if (binding.oldRate?.value) {
        change.oldRate = parseFloat(binding.oldRate.value);
      }
      
      if (binding.newRate?.value) {
        change.newRate = parseFloat(binding.newRate.value);
      }
      
      // Add to product categories if available
      if (binding.productCategory?.value) {
        change.productCategories.push(binding.productCategory.value);
      }
      
      // Add to related countries if available
      if (binding.relatedCountry?.value) {
        change.relatedCountries.push(binding.relatedCountry.value);
      }
      
      changes.push(change);
    }
    
    return changes;
  }
}

// Create and export a singleton instance
const tariffSPARQL = new TariffSPARQL();

export default tariffSPARQL;