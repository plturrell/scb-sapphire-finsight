// ===== CORE RDF/SEMANTIC WEB STRUCTURES =====

// Base RDF types
export type RDFTermType = 'NamedNode' | 'BlankNode' | 'Literal' | 'Variable' | 'DefaultGraph';
export type DataType = 'string' | 'integer' | 'decimal' | 'double' | 'boolean' | 'dateTime' | 'date' | 'anyURI';

export interface RDFTerm {
  termType: RDFTermType;
  value: string;
  datatype?: NamedNode;
  language?: string;
  equals(other: RDFTerm): boolean;
}

export interface NamedNode extends RDFTerm {
  termType: 'NamedNode';
  value: string; // IRI
}

export interface BlankNode extends RDFTerm {
  termType: 'BlankNode';
  value: string; // Blank node identifier
}

export interface Literal extends RDFTerm {
  termType: 'Literal';
  value: string;
  datatype: NamedNode;
  language?: string;
}

export interface Variable extends RDFTerm {
  termType: 'Variable';
  value: string; // Variable name without '?'
}

export interface DefaultGraph extends RDFTerm {
  termType: 'DefaultGraph';
  value: '';
}

// RDF Triple and Quad structures
export interface RDFTriple {
  subject: NamedNode | BlankNode | Variable;
  predicate: NamedNode | Variable;
  object: NamedNode | BlankNode | Literal | Variable;
}

export interface RDFQuad extends RDFTriple {
  graph: NamedNode | BlankNode | DefaultGraph | Variable;
}

// ===== PERPLEXITY.AI SEARCH RESULT STRUCTURES =====

export interface PerplexitySearchQuery {
  query: string;
  searchType: 'web' | 'academic' | 'news' | 'code';
  language?: string;
  region?: string;
  timeRange?: 'day' | 'week' | 'month' | 'year' | 'all';
  maxResults?: number;
  includeImages?: boolean;
  includeCitations?: boolean;
}

export interface PerplexitySource {
  id: string;
  title: string;
  url: string;
  domain: string;
  publishedDate?: Date;
  author?: string;
  snippet: string;
  relevanceScore: number;
  credibilityScore: number;
  sourceType: 'website' | 'academic' | 'news' | 'blog' | 'social' | 'government';
}

export interface PerplexityCitation {
  id: string;
  sourceId: string;
  text: string;
  startIndex: number;
  endIndex: number;
  confidence: number;
  context: string;
}

export interface PerplexitySearchResult {
  query: PerplexitySearchQuery;
  searchId: string;
  timestamp: Date;
  
  // Main response
  answer: string;
  confidence: number;
  
  // Sources and citations
  sources: PerplexitySource[];
  citations: PerplexityCitation[];
  
  // Metadata
  processingTime: number;
  totalSources: number;
  languageDetected: string;
  
  // Related queries
  relatedQueries: string[];
  followUpQuestions: string[];
}

// ===== RDF VOCABULARY AND ONTOLOGY STRUCTURES =====

export interface RDFVocabulary {
  prefix: string;
  namespace: string;
  description?: string;
  version?: string;
  terms: Map<string, RDFVocabularyTerm>;
}

export interface RDFVocabularyTerm {
  localName: string;
  iri: string;
  type: 'Class' | 'Property' | 'Individual';
  label?: Map<string, string>; // language -> label
  comment?: Map<string, string>; // language -> comment
  domain?: NamedNode[];
  range?: NamedNode[];
  subClassOf?: NamedNode[];
  subPropertyOf?: NamedNode[];
}

// Standard vocabularies
export const VOCABULARIES = {
  RDF: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
  RDFS: 'http://www.w3.org/2000/01/rdf-schema#',
  OWL: 'http://www.w3.org/2002/07/owl#',
  DC: 'http://purl.org/dc/elements/1.1/',
  DCTERMS: 'http://purl.org/dc/terms/',
  FOAF: 'http://xmlns.com/foaf/0.1/',
  SCHEMA: 'https://schema.org/',
  PROV: 'http://www.w3.org/ns/prov#',
  SKOS: 'http://www.w3.org/2004/02/skos/core#',
} as const;

// Custom vocabulary for Perplexity search results
export const PERPLEXITY_VOCAB = 'https://perplexity.ai/vocab/';

export interface PerplexityOntology {
  SearchResult: NamedNode;
  SearchQuery: NamedNode;
  Source: NamedNode;
  Citation: NamedNode;
  
  // Properties
  hasQuery: NamedNode;
  hasSource: NamedNode;
  hasCitation: NamedNode;
  hasAnswer: NamedNode;
  hasConfidence: NamedNode;
  hasRelevanceScore: NamedNode;
  hasCredibilityScore: NamedNode;
  publishedAt: NamedNode;
  searchedAt: NamedNode;
}

// ===== SPARQL QUERY STRUCTURES =====

export type SPARQLQueryType = 'SELECT' | 'CONSTRUCT' | 'ASK' | 'DESCRIBE';

export interface SPARQLSelectQuery {
  type: 'SELECT';
  variables: Variable[];
  distinct?: boolean;
  where: SPARQLPattern[];
  groupBy?: Variable[];
  having?: SPARQLExpression[];
  orderBy?: SPARQLOrderCondition[];
  limit?: number;
  offset?: number;
}

export interface SPARQLConstructQuery {
  type: 'CONSTRUCT';
  template: RDFTriple[];
  where: SPARQLPattern[];
}

export interface SPARQLAskQuery {
  type: 'ASK';
  where: SPARQLPattern[];
}

export interface SPARQLDescribeQuery {
  type: 'DESCRIBE';
  resources: (NamedNode | Variable)[];
  where?: SPARQLPattern[];
}

export type SPARQLQuery = SPARQLSelectQuery | SPARQLConstructQuery | SPARQLAskQuery | SPARQLDescribeQuery;

export interface SPARQLPattern {
  type: 'triple' | 'optional' | 'union' | 'filter' | 'bind' | 'service';
}

export interface SPARQLTriplePattern extends SPARQLPattern {
  type: 'triple';
  subject: NamedNode | BlankNode | Variable;
  predicate: NamedNode | Variable;
  object: NamedNode | BlankNode | Literal | Variable;
}

export interface SPARQLOptionalPattern extends SPARQLPattern {
  type: 'optional';
  patterns: SPARQLPattern[];
}

export interface SPARQLUnionPattern extends SPARQLPattern {
  type: 'union';
  alternatives: SPARQLPattern[][];
}

export interface SPARQLFilterPattern extends SPARQLPattern {
  type: 'filter';
  expression: SPARQLExpression;
}

export interface SPARQLBindPattern extends SPARQLPattern {
  type: 'bind';
  expression: SPARQLExpression;
  variable: Variable;
}

export interface SPARQLExpression {
  type: 'operation' | 'function' | 'term';
}

export interface SPARQLOrderCondition {
  variable: Variable;
  direction: 'ASC' | 'DESC';
}

// ===== ETL PIPELINE STRUCTURES =====

export interface ETLConfiguration {
  name: string;
  description: string;
  version: string;
  
  // Source configuration
  source: {
    type: 'perplexity' | 'file' | 'sparql' | 'api';
    configuration: Record<string, any>;
  };
  
  // Transformation configuration
  transforms: TransformationStep[];
  
  // Target configuration
  target: {
    type: 'jena-tdb' | 'sparql-endpoint' | 'file' | 'memory';
    configuration: Record<string, any>;
  };
  
  // Pipeline settings
  batchSize: number;
  parallelism: number;
  errorHandling: 'stop' | 'skip' | 'retry';
  retryAttempts: number;
}

export interface TransformationStep {
  id: string;
  name: string;
  type: 'extract' | 'transform' | 'validate' | 'enrich' | 'filter';
  configuration: Record<string, any>;
  dependencies: string[];
}

export interface ETLContext {
  pipelineId: string;
  runId: string;
  timestamp: Date;
  configuration: ETLConfiguration;
  variables: Map<string, any>;
  statistics: ETLStatistics;
}

export interface ETLStatistics {
  recordsProcessed: number;
  recordsSucceeded: number;
  recordsSkipped: number;
  recordsFailed: number;
  triplesGenerated: number;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  errors: ETLError[];
}

export interface ETLError {
  stepId: string;
  timestamp: Date;
  errorType: string;
  message: string;
  recordId?: string;
  stackTrace?: string;
}

// ===== PERPLEXITY TO RDF TRANSFORMATION =====

export interface PerplexityExtractor {
  extractSearchResults(query: PerplexitySearchQuery): Promise<PerplexitySearchResult[]>;
  extractSource(source: PerplexitySource): Promise<SourceMetadata>;
  extractCitations(citations: PerplexityCitation[]): Promise<CitationData[]>;
}

export interface SourceMetadata {
  uri: string;
  title: string;
  description?: string;
  author?: string;
  publishedDate?: Date;
  domain: string;
  contentType: string;
  language: string;
  extractedEntities: ExtractedEntity[];
  keywords: string[];
}

export interface ExtractedEntity {
  text: string;
  type: 'PERSON' | 'ORGANIZATION' | 'LOCATION' | 'EVENT' | 'CONCEPT';
  uri?: string;
  confidence: number;
  startIndex: number;
  endIndex: number;
}

export interface CitationData {
  citationUri: string;
  sourceUri: string;
  quotedText: string;
  context: string;
  position: {
    start: number;
    end: number;
  };
  confidence: number;
}

export interface RDFMapper {
  mapSearchResult(result: PerplexitySearchResult): RDFQuad[];
  mapSource(source: SourceMetadata): RDFQuad[];
  mapCitation(citation: CitationData): RDFQuad[];
  generateProvenance(context: ETLContext): RDFQuad[];
}

// ===== JENA TDB INTERFACE =====

export interface JenaTDBConfiguration {
  location: string;
  unionDefaultGraph?: boolean;
  enableStats?: boolean;
  cacheSize?: number;
  syncPolicy?: 'immediate' | 'delayed' | 'manual';
}

export interface JenaTDBDataset {
  configuration: JenaTDBConfiguration;
  
  // Dataset operations
  getDefaultModel(): JenaModel;
  getNamedModel(graphUri: string): JenaModel;
  listNames(): string[];
  containsNamedModel(graphUri: string): boolean;
  
  // Transaction support
  begin(): Transaction;
  commit(): void;
  abort(): void;
  isInTransaction(): boolean;
  
  // SPARQL operations
  query(query: SPARQLQuery): SPARQLResultSet;
  update(updateString: string): void;
  
  // Bulk operations
  addQuads(quads: RDFQuad[]): void;
  removeQuads(quads: RDFQuad[]): void;
  
  // Statistics
  size(): number;
  isEmpty(): boolean;
  getStatistics(): DatasetStatistics;
}

export interface JenaModel {
  // Triple operations
  add(triple: RDFTriple): void;
  remove(triple: RDFTriple): void;
  contains(triple: RDFTriple): boolean;
  listStatements(): RDFTriple[];
  
  // Resource operations
  getResource(uri: string): JenaResource;
  createResource(uri?: string): JenaResource;
  createProperty(uri: string): JenaProperty;
  createLiteral(value: string, datatype?: string, language?: string): Literal;
  
  // Query operations
  query(query: SPARQLQuery): SPARQLResultSet;
  
  // I/O operations
  read(input: string, format: RDFFormat): void;
  write(format: RDFFormat): string;
  
  // Statistics
  size(): number;
  isEmpty(): boolean;
}

export interface JenaResource {
  uri: string;
  isAnon(): boolean;
  
  // Property operations
  addProperty(property: JenaProperty, value: RDFTerm): void;
  removeProperty(property: JenaProperty, value?: RDFTerm): void;
  getProperty(property: JenaProperty): RDFTerm | null;
  listProperties(property?: JenaProperty): Array<{ property: JenaProperty; value: RDFTerm }>;
  hasProperty(property: JenaProperty, value?: RDFTerm): boolean;
  
  // Type operations
  addType(type: JenaResource): void;
  removeType(type: JenaResource): void;
  hasType(type: JenaResource): boolean;
  listTypes(): JenaResource[];
}

export interface JenaProperty {
  uri: string;
  namespace: string;
  localName: string;
}

export type RDFFormat = 'TURTLE' | 'N-TRIPLES' | 'RDF/XML' | 'JSON-LD' | 'N-QUADS' | 'TRIG';

export interface Transaction {
  id: string;
  startTime: Date;
  readOnly: boolean;
  
  commit(): void;
  abort(): void;
  isActive(): boolean;
}

export interface DatasetStatistics {
  totalTriples: number;
  totalQuads: number;
  namedGraphs: number;
  subjects: number;
  predicates: number;
  objects: number;
  literals: number;
  bnodes: number;
  lastUpdated: Date;
}

// ===== SPARQL RESULT STRUCTURES =====

export interface SPARQLResultSet {
  type: 'select' | 'construct' | 'ask' | 'describe';
  variables?: Variable[];
  bindings?: SPARQLBinding[];
  boolean?: boolean;
  graph?: RDFQuad[];
}

export interface SPARQLBinding {
  [variableName: string]: RDFTerm;
}

// ===== ETL PIPELINE IMPLEMENTATION =====

export interface ETLPipeline {
  configuration: ETLConfiguration;
  context: ETLContext;
  
  // Pipeline execution
  execute(): Promise<ETLResult>;
  pause(): void;
  resume(): void;
  stop(): void;
  
  // Progress monitoring
  getProgress(): ETLProgress;
  getStatistics(): ETLStatistics;
  
  // Event handling
  onProgress(callback: (progress: ETLProgress) => void): void;
  onError(callback: (error: ETLError) => void): void;
  onComplete(callback: (result: ETLResult) => void): void;
}

export interface ETLProgress {
  stepId: string;
  stepName: string;
  recordsProcessed: number;
  totalRecords: number;
  percentage: number;
  estimatedTimeRemaining: number;
}

export interface ETLResult {
  success: boolean;
  statistics: ETLStatistics;
  outputLocation?: string;
  generatedTriples: number;
  errors: ETLError[];
  warnings: string[];
}

// ===== PERPLEXITY-SPECIFIC ETL COMPONENTS =====

export interface PerplexityETLPipeline extends ETLPipeline {
  // Perplexity-specific operations
  searchAndExtract(queries: PerplexitySearchQuery[]): Promise<PerplexitySearchResult[]>;
  transformToRDF(results: PerplexitySearchResult[]): Promise<RDFQuad[]>;
  loadToJena(quads: RDFQuad[]): Promise<void>;
  
  // Quality assessment
  validateResults(results: PerplexitySearchResult[]): ValidationReport;
  assessDataQuality(quads: RDFQuad[]): QualityReport;
}

export interface ValidationReport {
  totalResults: number;
  validResults: number;
  invalidResults: number;
  warnings: string[];
  errors: string[];
  qualityScore: number;
}

export interface QualityReport {
  totalTriples: number;
  validTriples: number;
  duplicateTriples: number;
  orphanedNodes: number;
  brokenReferences: number;
  qualityScore: number;
  recommendations: string[];
}

// ===== SCHEMA MAPPING AND ALIGNMENT =====

export interface SchemaMapping {
  id: string;
  name: string;
  sourceSchema: string;
  targetSchema: string;
  mappings: PropertyMapping[];
  transformations: SchemaTransformation[];
}

export interface PropertyMapping {
  sourceProperty: string;
  targetProperty: string;
  mappingType: 'direct' | 'computed' | 'lookup' | 'constant';
  transformation?: string;
  defaultValue?: any;
  required: boolean;
}

export interface SchemaTransformation {
  name: string;
  inputProperties: string[];
  outputProperty: string;
  transformFunction: string;
  parameters: Record<string, any>;
}

// ===== CONFIGURATION BUILDERS =====

export class PerplexityETLBuilder {
  private config: Partial<ETLConfiguration> = {};
  
  withName(name: string): PerplexityETLBuilder {
    this.config.name = name;
    return this;
  }
  
  withDescription(description: string): PerplexityETLBuilder {
    this.config.description = description;
    return this;
  }
  
  withBatchSize(size: number): PerplexityETLBuilder {
    this.config.batchSize = size;
    return this;
  }
  
  withParallelism(parallelism: number): PerplexityETLBuilder {
    this.config.parallelism = parallelism;
    return this;
  }
  
  withErrorHandling(strategy: 'stop' | 'skip' | 'retry'): PerplexityETLBuilder {
    this.config.errorHandling = strategy;
    return this;
  }
  
  // Source configuration
  fromPerplexity(apiKey: string, baseUrl?: string): PerplexityETLBuilder {
    this.config.source = {
      type: 'perplexity',
      configuration: { apiKey, baseUrl }
    };
    return this;
  }
  
  fromFile(filePath: string, format: RDFFormat): PerplexityETLBuilder {
    this.config.source = {
      type: 'file',
      configuration: { filePath, format }
    };
    return this;
  }
  
  fromSPARQLEndpoint(endpoint: string, credentials?: any): PerplexityETLBuilder {
    this.config.source = {
      type: 'sparql',
      configuration: { endpoint, credentials }
    };
    return this;
  }
  
  // Transformation configuration
  addExtraction(extractor: string, config: any): PerplexityETLBuilder {
    if (!this.config.transforms) this.config.transforms = [];
    this.config.transforms.push({
      id: `extract-${Date.now()}`,
      name: extractor,
      type: 'extract',
      configuration: config,
      dependencies: []
    });
    return this;
  }
  
  addTransformation(transformer: string, config: any): PerplexityETLBuilder {
    if (!this.config.transforms) this.config.transforms = [];
    this.config.transforms.push({
      id: `transform-${Date.now()}`,
      name: transformer,
      type: 'transform',
      configuration: config,
      dependencies: []
    });
    return this;
  }
  
  addValidation(validator: string, config: any): PerplexityETLBuilder {
    if (!this.config.transforms) this.config.transforms = [];
    this.config.transforms.push({
      id: `validate-${Date.now()}`,
      name: validator,
      type: 'validate',
      configuration: config,
      dependencies: []
    });
    return this;
  }
  
  addEnrichment(enricher: string, config: any): PerplexityETLBuilder {
    if (!this.config.transforms) this.config.transforms = [];
    this.config.transforms.push({
      id: `enrich-${Date.now()}`,
      name: enricher,
      type: 'enrich',
      configuration: config,
      dependencies: []
    });
    return this;
  }
  
  // Target configuration
  toJenaTDB(location: string, config?: JenaTDBConfiguration): PerplexityETLBuilder {
    this.config.target = {
      type: 'jena-tdb',
      configuration: { location, ...config }
    };
    return this;
  }
  
  toSPARQLEndpoint(endpoint: string, credentials?: any): PerplexityETLBuilder {
    this.config.target = {
      type: 'sparql-endpoint',
      configuration: { endpoint, credentials }
    };
    return this;
  }
  
  toFile(filePath: string, format: RDFFormat): PerplexityETLBuilder {
    this.config.target = {
      type: 'file',
      configuration: { filePath, format }
    };
    return this;
  }
  
  build(): ETLConfiguration {
    return {
      name: this.config.name || 'Unnamed Pipeline',
      description: this.config.description || '',
      version: '1.0.0',
      source: this.config.source || { type: 'perplexity', configuration: {} },
      transforms: this.config.transforms || [],
      target: this.config.target || { type: 'memory', configuration: {} },
      batchSize: this.config.batchSize || 100,
      parallelism: this.config.parallelism || 1,
      errorHandling: this.config.errorHandling || 'stop',
      retryAttempts: this.config.retryAttempts || 3
    };
  }
}

// ===== EXAMPLE USAGE INTERFACES =====

export interface PerplexityKnowledgeGraph {
  dataset: JenaTDBDataset;
  ontology: PerplexityOntology;
  
  // Query operations
  findSources(query: string): Promise<SourceMetadata[]>;
  findCitations(sourceUri: string): Promise<CitationData[]>;
  findRelatedQueries(query: string): Promise<string[]>;
  
  // Analytics
  getSourceCredibilityScore(sourceUri: string): Promise<number>;
  getTopicCoverage(topic: string): Promise<CoverageReport>;
  getSearchTrends(timeframe: 'day' | 'week' | 'month'): Promise<TrendReport>;
}

export interface CoverageReport {
  topic: string;
  totalSources: number;
  uniqueDomains: number;
  averageCredibility: number;
  dateRange: {
    earliest: Date;
    latest: Date;
  };
  sourceTypes: Map<string, number>;
}

export interface TrendReport {
  timeframe: string;
  queries: Array<{
    query: string;
    frequency: number;
    trend: 'rising' | 'falling' | 'stable';
  }>;
  topics: Array<{
    topic: string;
    mentions: number;
    sentiment: number;
  }>;
}

// Export all main interfaces
export {
  RDFTerm, RDFTriple, RDFQuad,
  PerplexitySearchQuery, PerplexitySearchResult,
  SPARQLQuery, SPARQLResultSet,
  ETLConfiguration, ETLPipeline,
  JenaTDBDataset, JenaModel,
  PerplexityETLPipeline,
  PerplexityKnowledgeGraph
};