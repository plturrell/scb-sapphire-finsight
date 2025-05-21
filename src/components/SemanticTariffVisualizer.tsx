import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Box, 
  Flex, 
  Heading, 
  Text, 
  Select, 
  Input, 
  Button, 
  Tab, 
  TabList, 
  TabPanel, 
  TabPanels, 
  Tabs, 
  Table, 
  Thead, 
  Tbody, 
  Tr, 
  Th, 
  Td, 
  Badge, 
  Tooltip, 
  Spinner,
  useColorModeValue,
  IconButton,
  Collapse,
  VStack,
  HStack,
  Divider,
  useDisclosure
} from '@chakra-ui/react';
import { 
  SearchIcon, 
  InfoOutlineIcon, 
  ChevronDownIcon, 
  ChevronUpIcon,
  RepeatIcon,
  DownloadIcon
} from '@chakra-ui/icons';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
  Cell
} from 'recharts';
import { TariffInfo, TariffChangeEvent } from '../services/SemanticTariffEngine';
import semanticTariffEngine from '../services/SemanticTariffEngine';

// Type definitions for visualization data
interface CountryTariffData {
  countryName: string;
  averageTariff: number;
  tariffCount: number;
  color: string;
}

interface TariffTimelinePoint {
  date: string;
  rate: number;
  country: string;
}

interface TariffCategoryDistribution {
  category: string;
  count: number;
  color: string;
}

interface RelatedPolicyData {
  policyName: string;
  description: string;
  countries: string[];
  effectiveDate: string;
  impact: 'high' | 'medium' | 'low';
  color: string;
}

// Color scheme for visualizations
const COLORS = [
  '#0F5EA2', // Primary blue
  '#008D83', // Secondary green
  '#7C2D12', // Rust
  '#9F2B68', // Magenta
  '#404040', // Dark gray
  '#3A5311', // Olive
  '#2F4F4F', // Dark slate
  '#800020', // Burgundy
  '#023020', // Dark forest green
  '#4B0082', // Indigo
];

/**
 * Semantic Tariff Visualizer Component
 * 
 * This component provides visualizations and data exploration for
 * semantic tariff data from the integrated Perplexity/Jena/LangChain system.
 */
const SemanticTariffVisualizer: React.FC = () => {
  // State for search parameters
  const [product, setProduct] = useState<string>('');
  const [hsCode, setHsCode] = useState<string>('');
  const [sourceCountry, setSourceCountry] = useState<string>('');
  const [destinationCountry, setDestinationCountry] = useState<string>('');
  
  // State for search results
  const [tariffResults, setTariffResults] = useState<TariffInfo[]>([]);
  const [tariffChanges, setTariffChanges] = useState<TariffChangeEvent[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // State for visualization data
  const [countryTariffData, setCountryTariffData] = useState<CountryTariffData[]>([]);
  const [tariffTimeline, setTariffTimeline] = useState<TariffTimelinePoint[]>([]);
  const [categoryDistribution, setCategoryDistribution] = useState<TariffCategoryDistribution[]>([]);
  const [relatedPolicies, setRelatedPolicies] = useState<RelatedPolicyData[]>([]);
  
  // UI state
  const { isOpen, onToggle } = useDisclosure();
  const [activeTab, setActiveTab] = useState<number>(0);
  
  // Function to search for tariff information
  const searchTariffs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Use our server-side API to avoid CORS issues
      const response = await fetch('/api/tariff-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          product,
          hsCode,
          sourceCountry,
          destinationCountry
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error: ${response.status} - ${errorText}`);
      }
      
      const searchResponse = await response.json();
      
      // Convert the API response to TariffInfo objects
      const results: TariffInfo[] = Array.isArray(searchResponse.data)
        ? searchResponse.data.map((item: any) => ({
            id: `perplexity-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            hsCode: item.hsCode || hsCode || 'Unknown',
            description: item.description || product || 'No description available',
            sourceCountry: item.sourceCountry || sourceCountry || 'Unknown',
            destinationCountry: item.destinationCountry || destinationCountry || 'Unknown',
            rate: typeof item.rate === 'number' ? item.rate : parseFloat(item.rate) || 0,
            currency: item.currency || '%',
            effectiveDate: item.effectiveDate || new Date().toISOString().split('T')[0],
            expirationDate: item.expirationDate,
            exemptions: item.exemptions,
            specialConditions: item.specialConditions,
            source: {
              id: 'perplexity-tariff-search',
              name: 'Perplexity Tariff Search',
              type: 'api',
              description: 'Tariff data from Perplexity AI search',
              reliability: 0.85
            },
            confidence: typeof item.confidence === 'number' ? item.confidence : 0.8,
            lastUpdated: new Date().toISOString()
          }))
        : [];
      
      setTariffResults(results);
      
      // If we have a country, use mock tariff changes for now
      if (sourceCountry || destinationCountry) {
        const country = sourceCountry || destinationCountry;
        // In a full implementation, this would call the backend API
        const mockChanges: TariffChangeEvent[] = [
          {
            id: `mock-change-1-${Date.now()}`,
            title: `${country} tariff rate adjustment for ${product || 'imported goods'}`,
            description: `Recent changes to import tariffs affecting goods from ${sourceCountry || 'various countries'}`,
            country: country,
            productCategories: [product || 'General'],
            effectiveDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            announcementDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            source: {
              id: 'mock-data',
              name: 'Tariff Database',
              type: 'database',
              description: 'Mock tariff change data',
              reliability: 0.9
            },
            impactLevel: 'medium',
            relatedCountries: [sourceCountry || 'China', 'United States', 'European Union'].filter(c => c !== country),
            confidence: 0.85
          },
          {
            id: `mock-change-2-${Date.now()}`,
            title: `New trade agreement affecting ${country}`,
            description: `Implementation of free trade provisions between ${country} and partner nations`,
            country: country,
            productCategories: ['Electronics', 'Automotive', 'Textiles'],
            effectiveDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            announcementDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            oldRate: 12.5,
            newRate: 5.0,
            source: {
              id: 'mock-data',
              name: 'Tariff Database',
              type: 'database',
              description: 'Mock tariff change data',
              reliability: 0.9
            },
            impactLevel: 'high',
            relatedCountries: ['Japan', 'South Korea', 'Singapore'],
            confidence: 0.9
          }
        ];
        setTariffChanges(mockChanges);
      }
      
      // Generate visualization data
      generateVisualizationData(results);
      
    } catch (err) {
      console.error('Error searching tariffs:', err);
      setError('Failed to search tariffs. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [product, hsCode, sourceCountry, destinationCountry]);
  
  // Function to generate visualization data from tariff results
  const generateVisualizationData = useCallback((results: TariffInfo[]) => {
    if (results.length === 0) return;
    
    // Generate country tariff data
    const countryMap = new Map<string, { total: number, count: number }>();
    
    results.forEach(tariff => {
      const country = tariff.destinationCountry;
      if (!country) return;
      
      const existing = countryMap.get(country);
      if (existing) {
        existing.total += tariff.rate;
        existing.count += 1;
      } else {
        countryMap.set(country, { total: tariff.rate, count: 1 });
      }
    });
    
    const countryData: CountryTariffData[] = Array.from(countryMap.entries()).map(
      ([countryName, data], index) => ({
        countryName,
        averageTariff: data.total / data.count,
        tariffCount: data.count,
        color: COLORS[index % COLORS.length]
      })
    );
    
    setCountryTariffData(countryData);
    
    // Generate tariff timeline data
    const timeline: TariffTimelinePoint[] = results
      .filter(tariff => tariff.effectiveDate)
      .map(tariff => ({
        date: tariff.effectiveDate,
        rate: tariff.rate,
        country: tariff.destinationCountry
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    setTariffTimeline(timeline);
    
    // Generate category distribution
    const categoryMap = new Map<string, number>();
    
    results.forEach(tariff => {
      // Extract category from description
      const description = tariff.description.toLowerCase();
      let category = 'Other';
      
      if (description.includes('electronic') || description.includes('computer')) {
        category = 'Electronics';
      } else if (description.includes('textile') || description.includes('cloth')) {
        category = 'Textiles';
      } else if (description.includes('food') || description.includes('agriculture')) {
        category = 'Agriculture';
      } else if (description.includes('metal') || description.includes('steel')) {
        category = 'Metals';
      } else if (description.includes('chemical') || description.includes('pharmaceutical')) {
        category = 'Chemicals';
      } else if (description.includes('automotive') || description.includes('vehicle')) {
        category = 'Automotive';
      }
      
      const count = categoryMap.get(category) || 0;
      categoryMap.set(category, count + 1);
    });
    
    const categories: TariffCategoryDistribution[] = Array.from(categoryMap.entries()).map(
      ([category, count], index) => ({
        category,
        count,
        color: COLORS[index % COLORS.length]
      })
    );
    
    setCategoryDistribution(categories);
    
    // Generate related policy data
    // In a real implementation, this would come from the semantic tariff engine
    // For demonstration, we'll generate mock data
    const mockPolicies: RelatedPolicyData[] = [
      {
        policyName: 'RCEP Agreement',
        description: 'Regional Comprehensive Economic Partnership affecting Asia-Pacific trade',
        countries: ['China', 'Japan', 'South Korea', 'Australia', 'New Zealand'],
        effectiveDate: '2022-01-01',
        impact: 'high',
        color: COLORS[0]
      },
      {
        policyName: 'EU-Vietnam FTA',
        description: 'Free Trade Agreement between EU and Vietnam',
        countries: ['European Union', 'Vietnam'],
        effectiveDate: '2020-08-01',
        impact: 'medium',
        color: COLORS[1]
      },
      {
        policyName: 'USMCA',
        description: 'United States-Mexico-Canada Agreement',
        countries: ['United States', 'Mexico', 'Canada'],
        effectiveDate: '2020-07-01',
        impact: 'high',
        color: COLORS[2]
      },
    ];
    
    setRelatedPolicies(mockPolicies);
  }, []);
  
  // Function to render the confidence badge
  const renderConfidenceBadge = (confidence: number) => {
    let color = 'red';
    if (confidence >= 0.9) {
      color = 'green';
    } else if (confidence >= 0.7) {
      color = 'yellow';
    }
    
    return (
      <Tooltip label={`AI confidence score: ${(confidence * 100).toFixed(0)}%`}>
        <Badge colorScheme={color} fontSize="sm" ml={2}>
          {(confidence * 100).toFixed(0)}%
        </Badge>
      </Tooltip>
    );
  };
  
  // Function to render impact level badge
  const renderImpactBadge = (impact: 'high' | 'medium' | 'low') => {
    const colorMap = {
      high: 'red',
      medium: 'yellow',
      low: 'green'
    };
    
    return (
      <Badge colorScheme={colorMap[impact]} fontSize="sm">
        {impact.toUpperCase()}
      </Badge>
    );
  };
  
  // Country selection options
  const countryOptions = [
    'United States',
    'China',
    'European Union',
    'Japan',
    'South Korea',
    'Vietnam',
    'Australia',
    'India',
    'Brazil',
    'Mexico',
    'Thailand',
    'Indonesia'
  ];
  
  // Background colors for light/dark mode
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const emptyStateBgColor = useColorModeValue('gray.50', 'gray.900');
  
  return (
    <Box 
      bg={bgColor} 
      boxShadow="md" 
      borderRadius="lg" 
      p={4} 
      mb={8}
    >
      <Heading size="lg" mb={4}>Semantic Tariff Explorer</Heading>
      
      {/* Search form */}
      <Flex direction="column" mb={6} p={4} borderWidth="1px" borderRadius="md" borderColor={borderColor}>
        <Flex justify="space-between" align="center" mb={2}>
          <Heading size="md">Search Criteria</Heading>
          <IconButton
            aria-label="Toggle search options"
            icon={isOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
            onClick={onToggle}
            variant="ghost"
          />
        </Flex>
        
        <Collapse in={isOpen} animateOpacity>
          <VStack spacing={4} align="stretch" mt={2}>
            <HStack>
              <Box flex="1">
                <Text mb={1}>Product</Text>
                <Input
                  placeholder="e.g., Electronics, Textiles"
                  value={product}
                  onChange={(e) => setProduct(e.target.value)}
                />
              </Box>
              <Box flex="1">
                <Text mb={1}>HS Code</Text>
                <Input
                  placeholder="e.g., 8471.30"
                  value={hsCode}
                  onChange={(e) => setHsCode(e.target.value)}
                />
              </Box>
            </HStack>
            
            <HStack>
              <Box flex="1">
                <Text mb={1}>Source Country</Text>
                <Select
                  placeholder="Select source country"
                  value={sourceCountry}
                  onChange={(e) => setSourceCountry(e.target.value)}
                >
                  {countryOptions.map(country => (
                    <option key={`source-${country}`} value={country}>{country}</option>
                  ))}
                </Select>
              </Box>
              <Box flex="1">
                <Text mb={1}>Destination Country</Text>
                <Select
                  placeholder="Select destination country"
                  value={destinationCountry}
                  onChange={(e) => setDestinationCountry(e.target.value)}
                >
                  {countryOptions.map(country => (
                    <option key={`dest-${country}`} value={country}>{country}</option>
                  ))}
                </Select>
              </Box>
            </HStack>
          </VStack>
        </Collapse>
        
        <Flex justify="flex-end" mt={4}>
          <Button
            leftIcon={<SearchIcon />}
            colorScheme="blue"
            onClick={searchTariffs}
            isLoading={isLoading}
            loadingText="Searching"
          >
            Search Tariffs
          </Button>
        </Flex>
      </Flex>
      
      {/* Results and visualizations */}
      {error && (
        <Box mb={4} p={3} bg="red.100" color="red.800" borderRadius="md">
          <Text>{error}</Text>
        </Box>
      )}
      
      {isLoading ? (
        <Flex justify="center" align="center" py={10}>
          <Spinner size="xl" thickness="4px" color="blue.500" />
        </Flex>
      ) : (
        tariffResults.length > 0 && (
          <Tabs variant="enclosed" onChange={(index) => setActiveTab(index)} colorScheme="blue">
            <TabList>
              <Tab>Tariff Results</Tab>
              <Tab>Country Analysis</Tab>
              <Tab>Tariff Timeline</Tab>
              <Tab>Category Distribution</Tab>
              <Tab>Related Policies</Tab>
            </TabList>
            
            <TabPanels>
              {/* Tariff Results Tab */}
              <TabPanel>
                <Box overflowX="auto">
                  <Table variant="simple" size="sm">
                    <Thead>
                      <Tr>
                        <Th>HS Code</Th>
                        <Th>Description</Th>
                        <Th>Source Country</Th>
                        <Th>Destination Country</Th>
                        <Th isNumeric>Rate</Th>
                        <Th>Effective Date</Th>
                        <Th>Confidence</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {tariffResults.map((tariff, index) => (
                        <Tr key={`tariff-${index}`}>
                          <Td>{tariff.hsCode}</Td>
                          <Td>{tariff.description}</Td>
                          <Td>{tariff.sourceCountry}</Td>
                          <Td>{tariff.destinationCountry}</Td>
                          <Td isNumeric>{tariff.rate}%</Td>
                          <Td>{tariff.effectiveDate}</Td>
                          <Td>{renderConfidenceBadge(tariff.confidence)}</Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </Box>
                
                {tariffChanges.length > 0 && (
                  <Box mt={8}>
                    <Heading size="md" mb={4}>Recent Tariff Changes</Heading>
                    <Table variant="simple" size="sm">
                      <Thead>
                        <Tr>
                          <Th>Title</Th>
                          <Th>Country</Th>
                          <Th isNumeric>Old Rate</Th>
                          <Th isNumeric>New Rate</Th>
                          <Th>Effective Date</Th>
                          <Th>Impact</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {tariffChanges.map((change, index) => (
                          <Tr key={`change-${index}`}>
                            <Td>{change.title}</Td>
                            <Td>{change.country}</Td>
                            <Td isNumeric>{change.oldRate !== undefined ? `${change.oldRate}%` : 'N/A'}</Td>
                            <Td isNumeric>{change.newRate !== undefined ? `${change.newRate}%` : 'N/A'}</Td>
                            <Td>{change.effectiveDate}</Td>
                            <Td>{renderImpactBadge(change.impactLevel)}</Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </Box>
                )}
              </TabPanel>
              
              {/* Country Analysis Tab */}
              <TabPanel>
                {countryTariffData.length > 0 ? (
                  <Box>
                    <Heading size="md" mb={4}>Average Tariff Rates by Country</Heading>
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={countryTariffData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="countryName" />
                        <YAxis label={{ value: 'Average Tariff Rate (%)', angle: -90, position: 'insideLeft' }} />
                        <RechartsTooltip
                          formatter={(value, name, props) => [`${value.toFixed(2)}%`, 'Average Tariff']}
                          labelFormatter={(label) => `Country: ${label}`}
                        />
                        <Legend />
                        <Bar dataKey="averageTariff" name="Average Tariff Rate (%)">
                          {countryTariffData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                    
                    <Box mt={8}>
                      <Heading size="md" mb={4}>Tariff Count by Country</Heading>
                      <ResponsiveContainer width="100%" height={400}>
                        <PieChart>
                          <Pie
                            data={countryTariffData}
                            dataKey="tariffCount"
                            nameKey="countryName"
                            cx="50%"
                            cy="50%"
                            outerRadius={150}
                            fill="#8884d8"
                            label={({ countryName, tariffCount }) => `${countryName}: ${tariffCount}`}
                          >
                            {countryTariffData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <RechartsTooltip 
                            formatter={(value, name, props) => [value, 'Tariff Count']}
                            labelFormatter={(label) => `Country: ${label}`}
                          />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </Box>
                  </Box>
                ) : (
                  <Box p={4} textAlign="center">
                    <Text>No country analysis data available</Text>
                  </Box>
                )}
              </TabPanel>
              
              {/* Tariff Timeline Tab */}
              <TabPanel>
                {tariffTimeline.length > 0 ? (
                  <Box>
                    <Heading size="md" mb={4}>Tariff Rate Timeline</Heading>
                    <ResponsiveContainer width="100%" height={400}>
                      <LineChart data={tariffTimeline}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis label={{ value: 'Tariff Rate (%)', angle: -90, position: 'insideLeft' }} />
                        <RechartsTooltip
                          formatter={(value, name, props) => [`${value}%`, 'Tariff Rate']}
                          labelFormatter={(label) => `Date: ${label}`}
                        />
                        <Legend />
                        <Line type="monotone" dataKey="rate" name="Tariff Rate (%)" stroke="#0F5EA2" activeDot={{ r: 8 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </Box>
                ) : (
                  <Box p={4} textAlign="center">
                    <Text>No timeline data available</Text>
                  </Box>
                )}
              </TabPanel>
              
              {/* Category Distribution Tab */}
              <TabPanel>
                {categoryDistribution.length > 0 ? (
                  <Box>
                    <Heading size="md" mb={4}>Product Category Distribution</Heading>
                    <ResponsiveContainer width="100%" height={400}>
                      <PieChart>
                        <Pie
                          data={categoryDistribution}
                          dataKey="count"
                          nameKey="category"
                          cx="50%"
                          cy="50%"
                          outerRadius={150}
                          fill="#8884d8"
                          label={({ category, count }) => `${category}: ${count}`}
                        >
                          {categoryDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip 
                          formatter={(value, name, props) => [value, 'Tariff Count']}
                          labelFormatter={(label) => `Category: ${label}`}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                ) : (
                  <Box p={4} textAlign="center">
                    <Text>No category distribution data available</Text>
                  </Box>
                )}
              </TabPanel>
              
              {/* Related Policies Tab */}
              <TabPanel>
                {relatedPolicies.length > 0 ? (
                  <Box>
                    <Heading size="md" mb={4}>Related Trade Policies</Heading>
                    <VStack spacing={4} align="stretch">
                      {relatedPolicies.map((policy, index) => (
                        <Box 
                          key={`policy-${index}`}
                          p={4}
                          borderWidth="1px"
                          borderRadius="md"
                          borderColor={borderColor}
                          borderLeftWidth="4px"
                          borderLeftColor={policy.color}
                        >
                          <Flex justify="space-between" align="center">
                            <Heading size="sm">{policy.policyName}</Heading>
                            {renderImpactBadge(policy.impact)}
                          </Flex>
                          <Text mt={2}>{policy.description}</Text>
                          <Text mt={2} fontSize="sm" color="gray.600">
                            <strong>Effective Date:</strong> {policy.effectiveDate}
                          </Text>
                          <Flex mt={2} wrap="wrap">
                            {policy.countries.map((country, countryIndex) => (
                              <Badge 
                                key={`country-${countryIndex}`}
                                m={1} 
                                colorScheme="blue"
                              >
                                {country}
                              </Badge>
                            ))}
                          </Flex>
                        </Box>
                      ))}
                    </VStack>
                  </Box>
                ) : (
                  <Box p={4} textAlign="center">
                    <Text>No related policy data available</Text>
                  </Box>
                )}
              </TabPanel>
            </TabPanels>
          </Tabs>
        )
      )}
      
      {!isLoading && tariffResults.length === 0 && (
        <Flex 
          direction="column" 
          align="center" 
          justify="center" 
          py={10}
          borderWidth="1px"
          borderRadius="md"
          borderColor={borderColor}
          bg={emptyStateBgColor}
        >
          <SearchIcon boxSize={10} color="gray.400" mb={4} />
          <Text fontSize="lg" fontWeight="medium" mb={2}>No tariff data found</Text>
          <Text color="gray.500" textAlign="center" maxW="md">
            Search for tariff information using the options above.
            <br />
            Try specifying a product, HS code, or country of interest.
          </Text>
        </Flex>
      )}
    </Box>
  );
};

export default SemanticTariffVisualizer;