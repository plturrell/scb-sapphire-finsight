import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Card,
  CardContent,
  Grid as MuiGrid,
  Tabs,
  Tab,
  Button,
  Alert,
  Chip,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import { 
  Database as DatabaseIcon, 
  BarChart as BarChartIcon, 
  History as HistoryIcon, 
  RefreshCw as RefreshIcon, 
  FileText as FileTextIcon, 
  Globe as GlobeIcon 
} from 'lucide-react';
import AnimatedSankeyChart from './AnimatedSankeyChart';
import { styled } from '@mui/material/styles';
import { format } from 'date-fns';
import { mockVietnamTariffAlerts } from '../mock/vietnamTariffData';
import { SankeyData, SankeyNode as BaseSankeyNode, SankeyLink, TariffAlert } from '../types';
import type { SxProps } from '@mui/system';
import type { Theme } from '@mui/material/styles';
import NetworkAwareDataLoader from './NetworkAwareDataLoader';
import { useNetworkAwareLoading, useAdaptiveFetch } from '@/hooks/useNetworkAwareLoading';
import { useDeviceCapabilities } from '@/hooks/useDeviceCapabilities';

// Define additional interfaces needed for this component
interface BusinessDataStatistics {
  totalSimulations: number;
  recentSimulations: number;
  avgConfidence: number;
  inputCount: number;
  outputCount: number;
  parameterChangeCount: number;
  comparisonCount: number;
}

interface SimulationConfig {
  name: string;
  description: string;
  iterations?: number;
  confidenceInterval?: number;
}

interface TariffSpecificParameters {
  country: string;
  sector: string;
  timeframeMonths: number;
  confidenceLevel: number;
  hsCodes?: string[];
  countries?: string[];
}

interface SimulationInput {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  simulationType?: string;
  createdBy?: string;
  simulationConfig?: SimulationConfig;
  parameters: {
    iterations: number;
    variables: Record<string, { min: number; max: number; mean: number; }>;
    generalParameters?: Record<string, string | number | boolean>;
    tariffSpecificParameters?: TariffSpecificParameters;
  };
}

interface SimulationOutput {
  id: string;
  endTime?: number;
  status?: 'running' | 'completed' | 'failed' | 'queued';
  results: {
    outcome: number;
    confidence: number;
    factors: Record<string, number>;
    statistics?: {
      mean: number;
      median: number;
      min: number;
      max: number;
      variance: number;
    }
  };
}

interface ComparisonOutcome {
  baseline: number;
  alternate: number;
  percentChange: number;
  riskProfileDifferences?: Array<{
    pessimisticDifference: number;
    optimisticDifference: number;
  }>;
}

interface SimulationComparison {
  id: string;
  name: string;
  baselineId: string;
  alternateId: string;
  improvementPercent: number;
  createdAt: string;
  simulationIds?: string[];
  comparisonResults?: {
    differencePercent: number;
    details: string;
    outcomeComparison?: ComparisonOutcome;
  };
}

// Network-enhanced business data cloud connector
const businessDataCloudConnector = {
  initialize: async (): Promise<boolean> => {
    return Promise.resolve(true);
  },
  
  getStatistics: async (): Promise<BusinessDataStatistics> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      totalSimulations: 145,
      recentSimulations: 12,
      avgConfidence: 0.82,
      inputCount: 24,
      outputCount: 38,
      parameterChangeCount: 9,
      comparisonCount: 5
    };
  },
  
  getSimulationInputs: async (offset: number = 0, limit: number = 20): Promise<SimulationInput[]> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Generate paginated data
    const items = [];
    for (let i = offset; i < offset + limit && i < 50; i++) {
      items.push({
        id: `sim-input-${i}`,
        name: `Vietnam Tariff Scenario ${i}`,
        description: `Simulation model for tariff impact analysis ${i}`,
        createdAt: new Date(Date.now() - i * 86400000).toISOString(),
        simulationType: 'tariff-impact',
        createdBy: 'system',
        simulationConfig: {
          name: `Vietnam Tariff Config ${i}`,
          description: `Configuration for simulation ${i}`
        },
        parameters: {
          iterations: 10000 + i * 100,
          variables: {
            revenue: { min: 80 + i, max: 120 + i, mean: 100 + i },
            costs: { min: 40, max: 60, mean: 50 }
          },
          generalParameters: {
            scenario: i % 3 === 0 ? 'baseline' : i % 3 === 1 ? 'optimistic' : 'pessimistic',
            riskLevel: i % 2 === 0 ? 'medium' : 'high',
            timeHorizon: 24
          },
          tariffSpecificParameters: {
            country: 'Vietnam',
            sector: ['Textiles', 'Electronics', 'Agriculture'][i % 3],
            timeframeMonths: 12,
            confidenceLevel: 0.95,
            hsCodes: ['50', '51', '52', '53'],
            countries: ['Vietnam', 'Thailand', 'Malaysia']
          }
        }
      });
    }
    
    return items;
  },
  
  getSimulationComparisons: async (offset: number = 0, limit: number = 10): Promise<SimulationComparison[]> => {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const items = [];
    for (let i = offset; i < offset + limit && i < 20; i++) {
      items.push({
        id: `comp-${i}`,
        name: `Comparison ${i}: Baseline vs Alternative`,
        baselineId: `sim-input-${i}`,
        alternateId: `sim-input-${i + 1}`,
        improvementPercent: 10 + Math.random() * 20,
        createdAt: new Date(Date.now() - i * 86400000).toISOString(),
        simulationIds: [`output-${i}`, `output-${i + 1}`],
        comparisonResults: {
          differencePercent: 10 + Math.random() * 20,
          details: `Scenario comparison showing ${i % 2 === 0 ? 'improvement' : 'decline'}`,
          outcomeComparison: {
            baseline: 35.5 + i,
            alternate: 40.9 + i,
            percentChange: 15.3,
            riskProfileDifferences: []
          }
        }
      });
    }
    
    return items;
  }
};

// Main component with network-aware enhancements
const BusinessDataCloudDashboard: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState(0);
  const { connection, strategy } = useNetworkAwareLoading();
  const capabilities = useDeviceCapabilities();
  
  // State management
  const [loading, setLoading] = useState(true);
  const [sankeyData, setSankeyData] = useState<SankeyData | null>(null);
  const [statistics, setStatistics] = useState<BusinessDataStatistics | null>(null);
  const [selectedInputId, setSelectedInputId] = useState<string | null>(null);
  const [selectedInput, setSelectedInput] = useState<SimulationInput | null>(null);
  const [simulationOutputs, setSimulationOutputs] = useState<SimulationOutput[]>([]);

  // Use adaptive fetch for statistics
  const { data: statsData, loading: statsLoading } = useAdaptiveFetch<BusinessDataStatistics>(
    '/api/business-data/statistics'
  );

  // Fetch simulation inputs with network-aware loader
  const fetchSimulationInputs = useCallback(
    async (offset: number, limit: number) => {
      return businessDataCloudConnector.getSimulationInputs(offset, limit);
    },
    []
  );

  // Fetch comparisons with network-aware loader
  const fetchComparisons = useCallback(
    async (offset: number, limit: number) => {
      return businessDataCloudConnector.getSimulationComparisons(offset, limit);
    },
    []
  );

  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        await businessDataCloudConnector.initialize();
        
        // Load statistics
        const stats = await businessDataCloudConnector.getStatistics();
        setStatistics(stats);
        
        // Initialize Sankey data based on network conditions
        const nodeCount = connection.type === '2g' || connection.saveData ? 5 : 8;
        const nodes: BaseSankeyNode[] = [
          { name: 'Revenue', group: 'income', category: 'income', value: 100, id: 'node-0' },
          { name: 'Operating Costs', group: 'expense', category: 'expense', value: 50, id: 'node-1' },
          { name: 'Gross Profit', group: 'finance', category: 'finance', value: 50, id: 'node-2' },
        ];
        
        if (nodeCount > 3) {
          nodes.push(
            { name: 'Taxes', group: 'expense', category: 'expense', value: 15, id: 'node-3' },
            { name: 'Net Profit', group: 'finance', category: 'finance', value: 35, id: 'node-4' }
          );
        }
        
        if (nodeCount > 5) {
          nodes.push(
            { name: 'Investments', group: 'investment', category: 'investment', value: 20, id: 'node-5' },
            { name: 'Dividends', group: 'finance', category: 'finance', value: 10, id: 'node-6' },
            { name: 'Retained Earnings', group: 'equity', category: 'equity', value: 5, id: 'node-7' }
          );
        }
        
        setSankeyData({ nodes, links: [], aiInsights: {} });
        setLoading(false);
      } catch (error) {
        console.error('Failed to initialize dashboard:', error);
        setLoading(false);
      }
    };
    
    initializeDashboard();
  }, [connection]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  const TabPanel: React.FC<{ children: React.ReactNode; value: number; index: number }> = ({ children, value, index }) => (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );

  // Determine optimal table size based on network
  const getOptimalPageSize = () => {
    if (connection.saveData || connection.type === 'slow-2g') return 5;
    if (connection.type === '2g') return 10;
    if (connection.type === '3g') return 20;
    return 30;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Paper 
        elevation={0}
        sx={{ 
          p: 3,
          borderRadius: 3,
          background: 'linear-gradient(135deg, #f5f5f5 0%, #fafafa 100%)'
        }}
      >
        <MuiGrid container spacing={3}>
          {/* Header with network status */}
          <MuiGrid item xs={12}>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
              <Typography variant="h4" fontWeight="bold" color="primary">
                Business Data Cloud Dashboard
              </Typography>
              <Box display="flex" gap={1}>
                <Chip 
                  label={`${connection.type.toUpperCase()}`} 
                  color={connection.type === 'wifi' || connection.type === '4g' ? 'success' : 'warning'}
                  size="small"
                />
                {connection.saveData && (
                  <Chip label="Data Saver" color="info" size="small" />
                )}
                <Button
                  startIcon={<RefreshIcon />}
                  variant="outlined"
                  size="small"
                  onClick={() => window.location.reload()}
                >
                  Refresh
                </Button>
              </Box>
            </Box>
          </MuiGrid>

          {/* Statistics Cards - Responsive based on network */}
          {statistics && (
            <MuiGrid item xs={12}>
              <MuiGrid container spacing={2}>
                <MuiGrid item xs={12} md={capabilities.tier === 'low' ? 6 : 3}>
                  <Card>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        Total Simulations
                      </Typography>
                      <Typography variant="h5" component="h2">
                        {statistics.totalSimulations}
                      </Typography>
                    </CardContent>
                  </Card>
                </MuiGrid>
                {(capabilities.tier !== 'low' || connection.type !== '2g') && (
                  <>
                    <MuiGrid item xs={12} md={3}>
                      <Card>
                        <CardContent>
                          <Typography color="textSecondary" gutterBottom>
                            Average Confidence
                          </Typography>
                          <Typography variant="h5" component="h2">
                            {(statistics.avgConfidence * 100).toFixed(1)}%
                          </Typography>
                        </CardContent>
                      </Card>
                    </MuiGrid>
                    <MuiGrid item xs={12} md={3}>
                      <Card>
                        <CardContent>
                          <Typography color="textSecondary" gutterBottom>
                            Active Inputs
                          </Typography>
                          <Typography variant="h5" component="h2">
                            {statistics.inputCount}
                          </Typography>
                        </CardContent>
                      </Card>
                    </MuiGrid>
                  </>
                )}
              </MuiGrid>
            </MuiGrid>
          )}

          {/* Main Content Area with Tabs */}
          <MuiGrid item xs={12}>
            <Paper sx={{ borderRadius: 2, boxShadow: 2 }}>
              <Tabs
                value={selectedTab}
                onChange={handleTabChange}
                variant={capabilities.screenSize === 'mobile' ? "scrollable" : "standard"}
                scrollButtons="auto"
              >
                <Tab icon={<DatabaseIcon />} label="Overview" />
                <Tab icon={<BarChartIcon />} label="Simulations" />
                <Tab icon={<HistoryIcon />} label="History" />
                <Tab icon={<FileTextIcon />} label="Comparisons" />
              </Tabs>

              <TabPanel value={selectedTab} index={0}>
                {/* Sankey Chart - Simplified for slow connections */}
                {sankeyData && (
                  <Box mb={4}>
                    <Typography variant="h6" gutterBottom>
                      Financial Flow Visualization
                    </Typography>
                    {connection.type === '2g' || connection.saveData ? (
                      <Alert severity="info">
                        Simplified visualization shown due to network conditions
                      </Alert>
                    ) : (
                      <AnimatedSankeyChart 
                        data={sankeyData}
                        width={800}
                        height={400}
                      />
                    )}
                  </Box>
                )}
              </TabPanel>

              <TabPanel value={selectedTab} index={1}>
                {/* Simulations with network-aware loader */}
                <NetworkAwareDataLoader
                  fetchFunction={fetchSimulationInputs}
                  totalItems={50}
                  itemsPerPage={getOptimalPageSize()}
                >
                  {(data, loading, error) => (
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Name</TableCell>
                            <TableCell>Type</TableCell>
                            <TableCell>Created</TableCell>
                            {capabilities.tier !== 'low' && (
                              <TableCell>Confidence</TableCell>
                            )}
                            <TableCell>Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {data.map((input) => (
                            <TableRow key={input.id}>
                              <TableCell>{input.name}</TableCell>
                              <TableCell>{input.simulationType}</TableCell>
                              <TableCell>{format(new Date(input.createdAt), 'MMM dd, yyyy')}</TableCell>
                              {capabilities.tier !== 'low' && (
                                <TableCell>
                                  {input.parameters.tariffSpecificParameters?.confidenceLevel ?? '-'}
                                </TableCell>
                              )}
                              <TableCell>
                                <Button size="small">View</Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </NetworkAwareDataLoader>
              </TabPanel>

              <TabPanel value={selectedTab} index={3}>
                {/* Comparisons with network-aware loader */}
                <NetworkAwareDataLoader
                  fetchFunction={fetchComparisons}
                  totalItems={20}
                  itemsPerPage={getOptimalPageSize()}
                >
                  {(data, loading, error) => (
                    <MuiGrid container spacing={2}>
                      {data.map((comparison) => (
                        <MuiGrid item xs={12} md={capabilities.tier === 'low' ? 12 : 6} key={comparison.id}>
                          <Card>
                            <CardContent>
                              <Typography variant="h6">{comparison.name}</Typography>
                              <Typography color="textSecondary">
                                Improvement: {comparison.improvementPercent.toFixed(1)}%
                              </Typography>
                              <Typography variant="body2">
                                {comparison.comparisonResults?.details}
                              </Typography>
                            </CardContent>
                          </Card>
                        </MuiGrid>
                      ))}
                    </MuiGrid>
                  )}
                </NetworkAwareDataLoader>
              </TabPanel>
            </Paper>
          </MuiGrid>
        </MuiGrid>
      </Paper>
    </Box>
  );
};

export default BusinessDataCloudDashboard;