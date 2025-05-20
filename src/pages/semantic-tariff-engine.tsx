import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Flex, 
  Heading, 
  Text, 
  Container, 
  VStack, 
  Button, 
  useColorModeValue, 
  Tabs, 
  TabList, 
  TabPanels, 
  Tab, 
  TabPanel,
  Alert,
  AlertIcon,
  Divider,
  SimpleGrid,
  Icon,
  HStack,
  Tag
} from '@chakra-ui/react';
import { FcDataProtection, FcFinePrint, FcMultipleDevices } from 'react-icons/fc';
import { GiArtificialIntelligence } from 'react-icons/gi';
import { RiDatabaseLine } from 'react-icons/ri';
import { FaDatabase, FaNetworkWired, FaSearch } from 'react-icons/fa';
import { useRouter } from 'next/router';

import SemanticTariffVisualizer from '../components/SemanticTariffVisualizer';
import semanticTariffEngine from '../services/SemanticTariffEngine';

/**
 * Semantic Tariff Engine Page
 * 
 * This page showcases the integration of Perplexity AI with Apache Jena through LangChain
 * for semantic tariff data processing and visualization.
 */
const SemanticTariffEnginePage: React.FC = () => {
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [isInitializing, setIsInitializing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  
  // Colors
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const featureBg = useColorModeValue('blue.50', 'blue.900');
  
  // Initialize the semantic tariff engine
  useEffect(() => {
    const initEngine = async () => {
      setIsInitializing(true);
      try {
        const success = await semanticTariffEngine.initialize();
        setIsInitialized(success);
      } catch (err) {
        console.error('Failed to initialize semantic tariff engine:', err);
        setError('Failed to initialize the semantic tariff engine. Please try again later.');
      } finally {
        setIsInitializing(false);
      }
    };
    
    initEngine();
  }, []);
  
  return (
    <Container maxW="container.xl" py={8}>
      {/* Hero Section */}
      <Flex 
        direction="column" 
        align="center" 
        textAlign="center"
        bg={useColorModeValue('blue.50', 'blue.900')}
        p={8}
        borderRadius="lg"
        mb={8}
      >
        <HStack spacing={4} mb={4}>
          <Icon as={GiArtificialIntelligence} boxSize={10} color="blue.500" />
          <Icon as={FaNetworkWired} boxSize={10} color="green.500" />
          <Icon as={FaDatabase} boxSize={10} color="purple.500" />
        </HStack>
        <Heading size="xl" mb={4}>Semantic Tariff Engine</Heading>
        <Text fontSize="lg" maxW="2xl" mb={6}>
          Integrating Perplexity AI's real-time search with Apache Jena's semantic reasoning 
          through LangChain as an integration layer to create a powerful tariff data system.
        </Text>
        <HStack>
          <Tag size="lg" colorScheme="blue" borderRadius="full">Perplexity AI</Tag>
          <Tag size="lg" colorScheme="green" borderRadius="full">Apache Jena</Tag>
          <Tag size="lg" colorScheme="purple" borderRadius="full">LangChain</Tag>
        </HStack>
      </Flex>
      
      {/* Error Alert */}
      {error && (
        <Alert status="error" mb={6} borderRadius="md">
          <AlertIcon />
          {error}
        </Alert>
      )}
      
      {/* Main Content */}
      <Tabs colorScheme="blue" variant="enclosed" isLazy>
        <TabList>
          <Tab>Tariff Explorer</Tab>
          <Tab>Architecture</Tab>
          <Tab>Documentation</Tab>
        </TabList>
        
        <TabPanels>
          {/* Tariff Explorer Tab */}
          <TabPanel px={0}>
            {isInitialized ? (
              <SemanticTariffVisualizer />
            ) : (
              <Flex 
                direction="column" 
                align="center" 
                justify="center" 
                py={20}
                borderWidth="1px"
                borderRadius="md"
                borderColor={borderColor}
              >
                <Icon as={FaSearch} boxSize={10} color="gray.400" mb={4} />
                <Text fontSize="lg" fontWeight="medium" mb={2}>
                  {isInitializing ? 'Initializing Semantic Tariff Engine...' : 'Semantic Tariff Engine Not Initialized'}
                </Text>
                <Text color="gray.500" textAlign="center" maxW="md" mb={6}>
                  {isInitializing 
                    ? 'This may take a few moments. Please wait while we connect to the semantic services.'
                    : 'The semantic tariff engine failed to initialize. Please try reloading the page.'}
                </Text>
                {!isInitializing && (
                  <Button 
                    colorScheme="blue" 
                    onClick={() => router.reload()}
                  >
                    Reload Page
                  </Button>
                )}
              </Flex>
            )}
          </TabPanel>
          
          {/* Architecture Tab */}
          <TabPanel>
            <Box bg={bgColor} p={6} borderRadius="lg" boxShadow="md" mb={8}>
              <Heading size="lg" mb={4}>System Architecture</Heading>
              <Text mb={4}>
                The semantic tariff engine integrates three powerful technologies to create a comprehensive
                system for tariff data processing and analysis:
              </Text>
              
              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8} mt={8}>
                {/* Perplexity AI */}
                <Box 
                  bg={featureBg} 
                  p={6} 
                  borderRadius="md" 
                  borderWidth="1px"
                  borderColor={borderColor}
                >
                  <Flex justify="center" mb={4}>
                    <Icon as={GiArtificialIntelligence} boxSize={16} color="blue.500" />
                  </Flex>
                  <Heading size="md" mb={2} textAlign="center">Perplexity AI</Heading>
                  <Divider my={4} />
                  <VStack align="start" spacing={3}>
                    <Text>• Real-time tariff information search</Text>
                    <Text>• Up-to-date policy research</Text>
                    <Text>• Impact analysis with reasoning</Text>
                    <Text>• Data extraction from unstructured text</Text>
                    <Text>• Support for structured JSON outputs</Text>
                  </VStack>
                </Box>
                
                {/* LangChain */}
                <Box 
                  bg={featureBg} 
                  p={6} 
                  borderRadius="md" 
                  borderWidth="1px"
                  borderColor={borderColor}
                >
                  <Flex justify="center" mb={4}>
                    <Icon as={FaNetworkWired} boxSize={16} color="green.500" />
                  </Flex>
                  <Heading size="md" mb={2} textAlign="center">LangChain</Heading>
                  <Divider my={4} />
                  <VStack align="start" spacing={3}>
                    <Text>• Integration middleware</Text>
                    <Text>• Data transformation pipeline</Text>
                    <Text>• Output parsing to RDF</Text>
                    <Text>• Template-based prompting</Text>
                    <Text>• Error handling and retries</Text>
                  </VStack>
                </Box>
                
                {/* Apache Jena */}
                <Box 
                  bg={featureBg} 
                  p={6} 
                  borderRadius="md" 
                  borderWidth="1px"
                  borderColor={borderColor}
                >
                  <Flex justify="center" mb={4}>
                    <Icon as={FaDatabase} boxSize={16} color="purple.500" />
                  </Flex>
                  <Heading size="md" mb={2} textAlign="center">Apache Jena</Heading>
                  <Divider my={4} />
                  <VStack align="start" spacing={3}>
                    <Text>• Semantic data storage</Text>
                    <Text>• RDF triple representation</Text>
                    <Text>• SPARQL query capabilities</Text>
                    <Text>• Ontology-based reasoning</Text>
                    <Text>• Data validation with SHACL</Text>
                  </VStack>
                </Box>
              </SimpleGrid>
              
              <Box mt={8}>
                <Heading size="md" mb={4}>Data Flow Architecture</Heading>
                <Text mb={4}>
                  The data flows through a pipeline from Perplexity's search results, through LangChain's
                  structured output parsing, into Jena's RDF store where it becomes available for semantic
                  querying and reasoning.
                </Text>
                
                <Box 
                  p={6}
                  borderWidth="1px"
                  borderRadius="md"
                  borderColor={borderColor}
                  mt={4}
                >
                  <VStack spacing={4} align="stretch">
                    <HStack>
                      <Icon as={FaSearch} boxSize={6} color="blue.500" />
                      <Text fontWeight="bold">1. Data Acquisition</Text>
                    </HStack>
                    <Text pl={10}>
                      Perplexity AI searches for tariff information using structured prompts designed
                      to extract specific tariff details in JSON format. This includes rates, countries,
                      product codes, effective dates, and policy information.
                    </Text>
                    
                    <HStack>
                      <Icon as={FcDataProtection} boxSize={6} />
                      <Text fontWeight="bold">2. Data Transformation</Text>
                    </HStack>
                    <Text pl={10}>
                      LangChain processes the structured JSON output and converts it to RDF triples
                      following the tariff ontology schema. This creates semantic relationships between
                      entities like countries, products, and policies.
                    </Text>
                    
                    <HStack>
                      <Icon as={RiDatabaseLine} boxSize={6} color="purple.500" />
                      <Text fontWeight="bold">3. Semantic Storage</Text>
                    </HStack>
                    <Text pl={10}>
                      Apache Jena stores the RDF triples in a queryable triplestore. This enables
                      semantic reasoning about relationships between tariffs, countries, and trade policies.
                    </Text>
                    
                    <HStack>
                      <Icon as={FcFinePrint} boxSize={6} />
                      <Text fontWeight="bold">4. Analysis & Visualization</Text>
                    </HStack>
                    <Text pl={10}>
                      SPARQL queries extract insights from the semantic data model, which are then
                      visualized through interactive charts and tables. This supports advanced analysis
                      of tariff impacts and relationships.
                    </Text>
                  </VStack>
                </Box>
              </Box>
            </Box>
          </TabPanel>
          
          {/* Documentation Tab */}
          <TabPanel>
            <Box bg={bgColor} p={6} borderRadius="lg" boxShadow="md">
              <Heading size="lg" mb={4}>Technical Documentation</Heading>
              
              <VStack spacing={8} align="stretch">
                <Box>
                  <Heading size="md" mb={3}>API Reference</Heading>
                  <Text mb={4}>
                    The Semantic Tariff Engine exposes the following key methods for integration with
                    external systems:
                  </Text>
                  <Box 
                    p={4} 
                    borderWidth="1px" 
                    borderRadius="md" 
                    fontFamily="mono" 
                    fontSize="sm"
                    bg={useColorModeValue('gray.50', 'gray.700')}
                  >
                    <Text mb={2}><strong>searchTariffs(params)</strong> - Search for tariff information</Text>
                    <Text mb={2}><strong>getTariffChangesByCountry(country, limit)</strong> - Get recent tariff changes</Text>
                    <Text mb={2}><strong>calculateTariffImpact(params)</strong> - Analyze tariff impact</Text>
                    <Text mb={2}><strong>executeSparqlQuery(query)</strong> - Run custom SPARQL queries</Text>
                    <Text><strong>importTariffData(data)</strong> - Import external tariff data</Text>
                  </Box>
                </Box>
                
                <Box>
                  <Heading size="md" mb={3}>Ontology Schema</Heading>
                  <Text mb={4}>
                    The tariff ontology defines the semantic data model using the following core classes
                    and relationships:
                  </Text>
                  <Box 
                    p={4} 
                    borderWidth="1px" 
                    borderRadius="md" 
                    fontFamily="mono" 
                    fontSize="sm"
                    bg={useColorModeValue('gray.50', 'gray.700')}
                  >
                    <Text mb={2}><strong>tariff:Tariff</strong> - A duty imposed on imported/exported goods</Text>
                    <Text mb={2}><strong>tariff:Country</strong> - A nation or sovereign state</Text>
                    <Text mb={2}><strong>tariff:HSCode</strong> - Harmonized System Code for product classification</Text>
                    <Text mb={2}><strong>tariff:TariffChange</strong> - A recorded change in tariff rates or policies</Text>
                    <Text mb={2}><strong>tariff:Policy</strong> - A trade policy or agreement affecting tariffs</Text>
                    <Text><strong>tariff:DataSource</strong> - Source of tariff information</Text>
                  </Box>
                </Box>
                
                <Box>
                  <Heading size="md" mb={3}>Integration with LangChain</Heading>
                  <Text mb={4}>
                    LangChain is used as middleware to connect Perplexity AI with the semantic triplestore.
                    Key components include:
                  </Text>
                  <Box 
                    p={4} 
                    borderWidth="1px" 
                    borderRadius="md" 
                    bg={useColorModeValue('gray.50', 'gray.700')}
                  >
                    <VStack align="start" spacing={3}>
                      <Text><strong>Structured Output Parsers</strong> - Convert API responses to structured data</Text>
                      <Text><strong>RDF Triple Extraction</strong> - Generate RDF from structured data</Text>
                      <Text><strong>Advanced Prompting Templates</strong> - Specialized prompts for tariff data</Text>
                      <Text><strong>Error Handling</strong> - Robust error recovery for API calls</Text>
                      <Text><strong>Data Validation</strong> - Validate output before semantic storage</Text>
                    </VStack>
                  </Box>
                </Box>
                
                <Box>
                  <Heading size="md" mb={3}>SPARQL Query Examples</Heading>
                  <Text mb={4}>
                    The following SPARQL queries demonstrate how to extract insights from the semantic tariff data:
                  </Text>
                  <Box 
                    p={4} 
                    borderWidth="1px" 
                    borderRadius="md" 
                    fontFamily="mono" 
                    fontSize="sm"
                    bg={useColorModeValue('gray.50', 'gray.700')}
                    whiteSpace="pre-wrap"
                    overflowX="auto"
                  >
                    <Text fontWeight="bold" mb={2}># Query for tariffs between two countries</Text>
                    <Text mb={4}>{`PREFIX tariff: <http://example.org/tariff/>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>

SELECT ?tariff ?rate ?effectiveDate
WHERE {
  ?tariff rdf:type tariff:Tariff .
  ?tariff tariff:hasSourceCountry ?sourceCountry .
  ?sourceCountry rdfs:label "China"@en .
  ?tariff tariff:hasDestinationCountry ?destCountry .
  ?destCountry rdfs:label "United States"@en .
  ?tariff tariff:hasRate ?rate .
  ?tariff tariff:hasEffectiveDate ?effectiveDate .
}`}</Text>
                    
                    <Text fontWeight="bold" mb={2}># Query for recent tariff changes</Text>
                    <Text>{`PREFIX tariff: <http://example.org/tariff/>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>

SELECT ?change ?title ?oldRate ?newRate
WHERE {
  ?change rdf:type tariff:TariffChange .
  ?change rdfs:label ?title .
  ?change tariff:hasOldRate ?oldRate .
  ?change tariff:hasNewRate ?newRate .
  ?change tariff:hasAnnouncementDate ?date .
  FILTER (?date >= "2025-01-01"^^xsd:date)
}`}</Text>
                  </Box>
                </Box>
              </VStack>
            </Box>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Container>
  );
};

export default SemanticTariffEnginePage;