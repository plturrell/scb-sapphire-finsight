/**
 * Apache Jena Configuration for SCB Sapphire
 * 
 * This file configures the connection to the Apache Jena triplestore
 * including authentication, endpoints, and query defaults.
 */
export const JenaConfig = {
  // Base endpoint for the Apache Jena Fuseki server
  baseEndpoint: process.env.JENA_ENDPOINT || 'http://localhost:3030',
  
  // Dataset name in Jena
  dataset: process.env.JENA_DATASET || 'scb-sapphire',
  
  // Authentication credentials
  auth: {
    username: process.env.JENA_USERNAME || 'admin',
    password: process.env.JENA_PASSWORD || '',
    useAuth: process.env.JENA_USE_AUTH === 'true',
  },

  // SPARQL endpoint paths
  endpoints: {
    query: '/query',
    update: '/update',
    upload: '/data',
    graph: '/data'
  },

  // Default prefixes for SPARQL queries
  defaultPrefixes: `
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
    PREFIX owl: <http://www.w3.org/2002/07/owl#>
    PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
    PREFIX scb: <http://standardchartered.com/ontology/>
    PREFIX finance: <http://standardchartered.com/ontology/finance/>
    PREFIX tariff: <http://standardchartered.com/ontology/tariff/>
    PREFIX company: <http://standardchartered.com/ontology/company/>
    PREFIX market: <http://standardchartered.com/ontology/market/>
    PREFIX geo: <http://www.w3.org/2003/01/geo/wgs84_pos#>
    PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
  `,

  // Connection settings
  connection: {
    timeout: 30000, // 30 seconds
    retryAttempts: 3,
    retryDelay: 1000, // 1 second between retries
  },

  // Logging settings
  logging: {
    queryLogging: process.env.NODE_ENV !== 'production',
    errorLogging: true,
    performanceLogging: process.env.NODE_ENV !== 'production',
  }
};

/**
 * Helper function to build a full SPARQL endpoint URL
 */
export function buildEndpointUrl(endpointType: keyof typeof JenaConfig.endpoints): string {
  const { baseEndpoint, dataset, endpoints } = JenaConfig;
  return `${baseEndpoint}/${dataset}${endpoints[endpointType]}`;
}

/**
 * Helper function to add default prefixes to a SPARQL query
 */
export function addDefaultPrefixes(query: string): string {
  return `${JenaConfig.defaultPrefixes}\n${query}`;
}