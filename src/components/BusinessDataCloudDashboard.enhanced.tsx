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
import { styled } from '@mui/material/styles';
import { format } from 'date-fns';
import { 
  Database as DatabaseIcon, 
  BarChart as BarChartIcon, 
  History as HistoryIcon, 
  RefreshCw as RefreshIcon, 
  FileText as FileTextIcon, 
  Globe as GlobeIcon,
  Sparkles,
  AlertTriangle,
  TrendingUp
} from 'lucide-react';
import EnhancedAnimatedSankeyChart from './charts/EnhancedAnimatedSankeyChart';
import { mockVietnamTariffAlerts } from '../mock/vietnamTariffData';
import { SankeyData, SankeyNode as BaseSankeyNode, SankeyLink, TariffAlert } from '../types';
import type { SxProps } from '@mui/system';
import type { Theme } from '@mui/material/styles';
import NetworkAwareDataLoader from './NetworkAwareDataLoader';
import { useNetworkAwareLoading } from '@/hooks/useNetworkAwareLoading';
import { useDeviceCapabilities } from '@/hooks/useDeviceCapabilities';
import EnhancedTouchButton from './EnhancedTouchButton';
import { EnhancedInlineSpinner } from './EnhancedLoadingSpinner';

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
    generalParameters?: Record<string, any>;
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

interface TariffPrediction {
  sector: string;
  probabilityOfTariffReduction: number;
  estimatedImpact: string;
  timeframe: string;
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
            riskProfileDifferences: [
              {
                pessimisticDifference: 12.3,
                optimisticDifference: 18.4
              }
            ]
          }
        }
      });
    }
    
    return items;
  }
};

// SCB styled components
const StyledCard = styled(Card)(({ theme }) => ({
  height: '100%',
  border: '1px solid',
  borderColor: 'rgb(var(--scb-border))',
  borderRadius: '0.25rem',
  boxShadow: 'none',
  transition: 'box-shadow 0.2s, transform 0.2s',
  '&:hover': {
    boxShadow: '0 4px 6px rgba(var(--scb-honolulu-blue), 0.1)',
    transform: 'translateY(-2px)'
  }
}));

const StyledCardContent = styled(CardContent)({
  padding: '1rem',
  '&:last-child': {
    paddingBottom: '1rem'
  }
});

const StyledPaper = styled(Paper)(({ theme }) => ({
  borderRadius: '0.25rem',
  border: '1px solid rgb(var(--scb-border))',
  boxShadow: 'none'
}));

const StyledTab = styled(Tab)({
  textTransform: 'none',
  minWidth: 0,
  padding: '0.75rem 1rem',
  marginRight: '1rem',
  fontWeight: 500,
  '&.Mui-selected': {
    color: 'rgb(var(--scb-honolulu-blue))',
    fontWeight: 600
  }
});

const StyledButton = styled(Button)({
  textTransform: 'none',
  borderRadius: '0.375rem',
  padding: '0.5rem 1rem',
  fontWeight: 500,
  '&.MuiButton-outlined': {
    borderColor: 'rgb(var(--scb-honolulu-blue))',
    color: 'rgb(var(--scb-honolulu-blue))'
  },
  '&.MuiButton-contained': {
    backgroundColor: 'rgb(var(--scb-honolulu-blue))',
    color: 'white'
  }
});

const StyledChip = styled(Chip)({
  borderRadius: '1rem',
  fontSize: '0.75rem',
  fontWeight: 500,
  height: 'auto',
  padding: '0.25rem 0',
  '&.MuiChip-filledPrimary': {
    backgroundColor: 'rgba(var(--scb-honolulu-blue), 0.1)',
    color: 'rgb(var(--scb-honolulu-blue))',
    border: '1px solid rgba(var(--scb-honolulu-blue), 0.2)'
  },
  '&.MuiChip-filledSuccess': {
    backgroundColor: 'rgba(var(--scb-american-green), 0.1)',
    color: 'rgb(var(--scb-american-green))',
    border: '1px solid rgba(var(--scb-american-green), 0.2)'
  },
  '&.MuiChip-filledError': {
    backgroundColor: 'rgba(var(--scb-muted-red), 0.1)',
    color: 'rgb(var(--scb-muted-red))',
    border: '1px solid rgba(var(--scb-muted-red), 0.2)'
  }
});

// Main component with SCB styling enhancements
const EnhancedBusinessDataCloudDashboard: React.FC = () => {
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
  const [tariffAlerts, setTariffAlerts] = useState<TariffAlert[]>([]);
  const [tariffPredictions, setTariffPredictions] = useState<TariffPrediction[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Format date
  const formatDate = (date: string | Date): string => {
    if (typeof date === 'string') {
      return format(new Date(date), 'MMM dd, yyyy');
    }
    return format(date, 'MMM dd, yyyy');
  };

  // Fetch simulation inputs
  const fetchSimulationInputs = useCallback(
    async (offset: number, limit: number) => {
      return businessDataCloudConnector.getSimulationInputs(offset, limit);
    },
    []
  );

  // Fetch comparisons
  const fetchComparisons = useCallback(
    async (offset: number, limit: number) => {
      return businessDataCloudConnector.getSimulationComparisons(offset, limit);
    },
    []
  );

  // Initialize dashboard data
  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        await businessDataCloudConnector.initialize();
        
        // Load statistics
        const stats = await businessDataCloudConnector.getStatistics();
        setStatistics(stats);
        
        // Initialize Sankey data with SCB styling
        const nodes: BaseSankeyNode[] = [
          { name: 'Revenue', group: 'income', category: 'income', value: 100, id: 'node-0' },
          { name: 'Operating Costs', group: 'expense', category: 'expense', value: 50, id: 'node-1' },
          { name: 'Gross Profit', group: 'finance', category: 'finance', value: 50, id: 'node-2' },
          { name: 'Taxes', group: 'expense', category: 'expense', value: 15, id: 'node-3' },
          { name: 'Net Profit', group: 'finance', category: 'finance', value: 35, id: 'node-4' },
          { name: 'Investments', group: 'investment', category: 'investment', value: 20, id: 'node-5' },
          { name: 'Dividends', group: 'finance', category: 'finance', value: 10, id: 'node-6' },
          { name: 'Retained Earnings', group: 'equity', category: 'equity', value: 5, id: 'node-7' }
        ];
        
        // Create links with SCB color scheme
        const links: SankeyLink[] = [
          { source: nodes[0], target: nodes[1], value: 50, uiColor: 'rgb(var(--scb-honolulu-blue))', aiEnhanced: true, type: 'flow' } as unknown as SankeyLink,
          { source: nodes[0], target: nodes[2], value: 50, uiColor: 'rgb(var(--scb-american-green))', aiEnhanced: false, type: 'flow' } as unknown as SankeyLink,
          { source: nodes[2], target: nodes[3], value: 15, uiColor: 'rgb(var(--scb-muted-red))', aiEnhanced: false, type: 'flow' } as unknown as SankeyLink,
          { source: nodes[2], target: nodes[4], value: 35, uiColor: 'rgb(var(--scb-honolulu-blue))', aiEnhanced: true, type: 'flow' } as unknown as SankeyLink,
          { source: nodes[4], target: nodes[5], value: 20, uiColor: 'rgb(var(--scb-honolulu-blue))', aiEnhanced: true, type: 'flow' } as unknown as SankeyLink,
          { source: nodes[4], target: nodes[6], value: 10, uiColor: 'rgb(var(--scb-honolulu-blue))', aiEnhanced: false, type: 'flow' } as unknown as SankeyLink,
          { source: nodes[4], target: nodes[7], value: 5, uiColor: 'rgb(var(--scb-honolulu-blue))', aiEnhanced: false, type: 'flow' } as unknown as SankeyLink
        ];
        
        setSankeyData({
          nodes,
          links,
          aiInsights: {
            summary: 'Financial flow analysis shows healthy profit margins with strategic investments.',
            recommendations: [
              'Consider increasing investment allocation for higher long-term growth',
              'Review operating costs for potential optimization'
            ],
            confidence: 0.85,
            updatedAt: new Date('2025-05-01')
          }
        });
        
        // Load mock tariff alerts
        setTariffAlerts(mockVietnamTariffAlerts);
        
        // Initialize tariff predictions
        setTariffPredictions([
          {
            sector: 'Textiles',
            probabilityOfTariffReduction: 0.68,
            estimatedImpact: '+5.2% export volume',
            timeframe: 'Q3 2025'
          },
          {
            sector: 'Electronics',
            probabilityOfTariffReduction: 0.42,
            estimatedImpact: '+2.1% export volume',
            timeframe: 'Q1 2026'
          },
          {
            sector: 'Agriculture',
            probabilityOfTariffReduction: 0.23,
            estimatedImpact: '+0.8% export volume',
            timeframe: 'Q2 2026'
          }
        ]);
        
        setLoading(false);
      } catch (error) {
        console.error('Failed to initialize dashboard:', error);
        setError('Failed to load dashboard data. Please try again.');
        setLoading(false);
      }
    };
    
    initializeDashboard();
  }, [connection.type]);

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const stats = await businessDataCloudConnector.getStatistics();
      setStatistics(stats);
      setRefreshing(false);
    } catch (error) {
      console.error('Failed to refresh data:', error);
      setRefreshing(false);
      setError('Failed to refresh data. Please try again.');
    }
  };

  // Determine optimal page size based on network
  const getOptimalPageSize = () => {
    if (connection.saveData || connection.type === 'slow-2g') return 5;
    if (connection.type === '2g') return 10;
    if (connection.type === '3g') return 20;
    return 30;
  };

  // Loading state with SCB styling
  if (loading) {
    return (
      <Box className="fiori-tile" display="flex" flexDirection="column" alignItems="center" justifyContent="center" p={6} minHeight="500px">
        <Box className="w-16 h-16 border-4 border-[rgba(var(--scb-honolulu-blue),0.2)] border-t-[rgb(var(--scb-honolulu-blue))] rounded-full animate-spin mb-4"></Box>
        <Typography variant="h5" className="text-[rgb(var(--scb-dark-gray))]" gutterBottom>
          Loading Dashboard Data
        </Typography>
        <Typography variant="body2" className="text-[rgb(var(--scb-dark-gray))] opacity-70">
          Please wait while we fetch your business data...
        </Typography>
      </Box>
    );
  }

  // Error state with SCB styling
  if (error) {
    return (
      <Box className="fiori-tile" display="flex" flexDirection="column" alignItems="center" justifyContent="center" p={6} minHeight="400px" textAlign="center">
        <Box className="w-16 h-16 rounded-full bg-[rgba(var(--scb-muted-red),0.1)] flex items-center justify-center mb-4">
          <AlertTriangle className="w-8 h-8 text-[rgb(var(--scb-muted-red))]" />
        </Box>
        <Typography variant="h5" className="text-[rgb(var(--scb-dark-gray))]" gutterBottom>
          Unable to Load Dashboard
        </Typography>
        <Typography variant="body2" className="text-[rgb(var(--scb-dark-gray))] opacity-70 max-w-md mb-6">
          {error}
        </Typography>
        <EnhancedTouchButton 
          variant="primary" 
          size="md" 
          onClick={() => window.location.reload()}
          leftIcon={<RefreshIcon className="w-4 h-4" />}
        >
          Try Again
        </EnhancedTouchButton>
      </Box>
    );
  }

  return (
    <Box className="space-y-6">
      {/* Dashboard Header with SCB styling */}
      <StyledPaper elevation={0} className="fiori-tile p-5">
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h5" className="flex items-center text-[rgb(var(--scb-honolulu-blue))] font-semibold">
              <DatabaseIcon className="w-5 h-5 mr-2" /> 
              Business Data Cloud Dashboard
            </Typography>
            <Typography variant="body2" className="text-[rgb(var(--scb-dark-gray))] mt-1">
              Financial data analytics and simulation platform
            </Typography>
          </Box>
          
          <Box display="flex" alignItems="center" gap={2}>
            {/* Network Status Indicator with SCB styling */}
            <Box display={{ xs: 'none', md: 'flex' }} alignItems="center" gap={1}>
              <Box 
                component="span" 
                className={`inline-block w-2 h-2 rounded-full ${
                  connection.type === 'wifi' || connection.type === '4g' 
                    ? 'bg-[rgb(var(--scb-american-green))]' 
                    : connection.type === '3g' 
                      ? 'bg-[rgb(245,152,0)]' 
                      : 'bg-[rgb(var(--scb-muted-red))]'
                }`}
              />
              <Typography variant="caption" className="text-[rgb(var(--scb-dark-gray))] font-medium">
                {connection.type.toUpperCase()}
              </Typography>
              
              {connection.saveData && (
                <StyledChip 
                  label="Data Saver" 
                  size="small" 
                  color="primary"
                  className="horizon-chip"
                />
              )}
            </Box>
            
            {/* Refresh Button with SCB styling */}
            <EnhancedTouchButton
              variant="secondary"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              leftIcon={refreshing ? <EnhancedInlineSpinner size="sm" /> : <RefreshIcon className="w-4 h-4" />}
            >
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </EnhancedTouchButton>
          </Box>
        </Box>
      </StyledPaper>
      
      {/* Statistics Cards with SCB styling */}
      {statistics && (
        <MuiGrid container spacing={3} className="grid-responsive">
          <MuiGrid item xs={12} md={3}>
            <StyledCard className="fiori-tile">
              <StyledCardContent>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <FileTextIcon className="w-4 h-4 text-[rgb(var(--scb-honolulu-blue))]" />
                  <Typography variant="subtitle2" className="text-[rgb(var(--scb-dark-gray))]">
                    Total Simulations
                  </Typography>
                </Box>
                <Typography variant="h4" className="text-[rgb(var(--scb-honolulu-blue))] font-bold mb-1">
                  {statistics.totalSimulations}
                </Typography>
                <Box mt={1}>
                  <StyledChip 
                    label={`${statistics.recentSimulations} new this month`} 
                    size="small" 
                    color="primary"
                    className="horizon-chip-blue"
                  />
                </Box>
              </StyledCardContent>
            </StyledCard>
          </MuiGrid>
          
          <MuiGrid item xs={12} md={3}>
            <StyledCard className="fiori-tile">
              <StyledCardContent>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <TrendingUp className="w-4 h-4 text-[rgb(var(--scb-american-green))]" />
                  <Typography variant="subtitle2" className="text-[rgb(var(--scb-dark-gray))]">
                    Average Confidence
                  </Typography>
                </Box>
                <Typography variant="h4" className="text-[rgb(var(--scb-american-green))] font-bold mb-1">
                  {(statistics.avgConfidence * 100).toFixed(1)}%
                </Typography>
                <Box mt={1} display="flex" alignItems="center">
                  <StyledChip 
                    icon={<Sparkles className="w-3 h-3" />}
                    label="AI-enhanced" 
                    size="small" 
                    color="success"
                    className="horizon-chip-green"
                  />
                </Box>
              </StyledCardContent>
            </StyledCard>
          </MuiGrid>
          
          <MuiGrid item xs={12} md={3}>
            <StyledCard className="fiori-tile">
              <StyledCardContent>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <BarChartIcon className="w-4 h-4 text-[rgb(var(--scb-honolulu-blue))]" />
                  <Typography variant="subtitle2" className="text-[rgb(var(--scb-dark-gray))]">
                    Data Points
                  </Typography>
                </Box>
                <Typography variant="h4" className="text-[rgb(var(--scb-honolulu-blue))] font-bold mb-1">
                  {statistics.inputCount + statistics.outputCount}
                </Typography>
                <Box mt={1}>
                  <StyledChip 
                    label={`${statistics.inputCount} inputs, ${statistics.outputCount} outputs`} 
                    size="small" 
                    color="primary"
                    className="horizon-chip-blue"
                  />
                </Box>
              </StyledCardContent>
            </StyledCard>
          </MuiGrid>
          
          <MuiGrid item xs={12} md={3}>
            <StyledCard className="fiori-tile">
              <StyledCardContent>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <HistoryIcon className="w-4 h-4 text-[rgb(var(--scb-honolulu-blue))]" />
                  <Typography variant="subtitle2" className="text-[rgb(var(--scb-dark-gray))]">
                    Comparisons
                  </Typography>
                </Box>
                <Typography variant="h4" className="text-[rgb(var(--scb-honolulu-blue))] font-bold mb-1">
                  {statistics.comparisonCount}
                </Typography>
                <Box mt={1}>
                  <StyledChip 
                    label="Scenario analysis" 
                    size="small" 
                    color="primary"
                    className="horizon-chip-blue"
                  />
                </Box>
              </StyledCardContent>
            </StyledCard>
          </MuiGrid>
        </MuiGrid>
      )}
      
      {/* Main Content with Tabs - SCB styled */}
      <StyledPaper elevation={0} className="fiori-tile p-0 flex-1 flex flex-col overflow-hidden">
        <Box sx={{ borderBottom: 1, borderColor: 'rgb(var(--scb-border))' }}>
          <Tabs 
            value={selectedTab} 
            onChange={handleTabChange}
            variant={capabilities.screenSize === 'mobile' ? "scrollable" : "standard"}
            scrollButtons="auto"
            TabIndicatorProps={{
              style: {
                backgroundColor: 'rgb(var(--scb-honolulu-blue))',
                height: '3px'
              }
            }}
          >
            <StyledTab label={
              <Box display="flex" alignItems="center" gap={1}>
                <DatabaseIcon size={16} /> Overview
              </Box>
            } />
            <StyledTab label={
              <Box display="flex" alignItems="center" gap={1}>
                <BarChartIcon size={16} /> Simulations
              </Box>
            } />
            <StyledTab label={
              <Box display="flex" alignItems="center" gap={1}>
                <GlobeIcon size={16} /> Tariff Alerts
              </Box>
            } />
            <StyledTab label={
              <Box display="flex" alignItems="center" gap={1}>
                <HistoryIcon size={16} /> Comparisons
              </Box>
            } />
          </Tabs>
        </Box>
        
        <Box p={3} flex={1} overflow="auto">
          {/* Overview Tab with SCB Styling */}
          {selectedTab === 0 && (
            <Box className="space-y-6">
              {/* Enhanced Sankey Chart with AI insights */}
              {sankeyData && (
                <StyledPaper elevation={0} className="p-5">
                  <Box display="flex" justifyContent="space-between" alignItems="start" mb={3}>
                    <Box>
                      <Typography variant="h6" className="text-[rgb(var(--scb-dark-gray))]">
                        Financial Flow Visualization
                      </Typography>
                      <Typography variant="body2" className="text-[rgb(var(--scb-dark-gray))] opacity-80">
                        End-to-end financial flow with impact analysis
                      </Typography>
                    </Box>
                    <StyledChip 
                      icon={<Sparkles className="w-3 h-3" />}
                      label="AI-enhanced" 
                      size="small" 
                      color="success"
                      className="horizon-chip-green"
                    />
                  </Box>
                  
                  <EnhancedAnimatedSankeyChart 
                    data={sankeyData}
                    width={800}
                    height={400}
                    showAIControls={true}
                    title="SCB Vietnam Financial Flow"
                    subtitle="Dynamic visualization of financial relationships"
                    autoAnimate={true}
                  />
                  
                  {/* AI Insights Panel with SCB styling */}
                  <Box mt={3} p={2} className="bg-[rgba(var(--scb-american-green),0.05)] border-l-4 border-[rgb(var(--scb-american-green))] rounded">
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <Sparkles className="w-4 h-4 text-[rgb(var(--scb-american-green))]" />
                      <Typography variant="subtitle2" className="text-[rgb(var(--scb-dark-gray))]">
                        AI Insights
                      </Typography>
                      <Typography variant="caption" className="text-[rgb(var(--scb-american-green))]">
                        {(sankeyData.aiInsights.confidence * 100).toFixed(0)}% confidence
                      </Typography>
                    </Box>
                    
                    <Typography variant="body2" className="text-[rgb(var(--scb-dark-gray))] mb-2">
                      {sankeyData.aiInsights.summary}
                    </Typography>
                    
                    {sankeyData.aiInsights.recommendations && (
                      <Box>
                        <Typography variant="caption" fontWeight="medium" className="text-[rgb(var(--scb-dark-gray))] mb-1">
                          Recommendations:
                        </Typography>
                        <Box component="ul" className="text-xs text-[rgb(var(--scb-dark-gray))] space-y-1 pl-5">
                          {sankeyData.aiInsights.recommendations.map((rec, idx) => (
                            <Box component="li" key={idx}>{rec}</Box>
                          ))}
                        </Box>
                      </Box>
                    )}
                    
                    <Box mt={2} pt={1} borderTop={1} borderColor="rgba(var(--scb-american-green),0.2)" display="flex" justifyContent="space-between">
                      <Typography variant="caption" className="text-[rgb(var(--scb-dark-gray))] opacity-70">
                        Updated: {formatDate(sankeyData.aiInsights.updatedAt)}
                      </Typography>
                    </Box>
                  </Box>
                </StyledPaper>
              )}
              
              {/* Tariff Alerts and Predictions with SCB styling */}
              <MuiGrid container spacing={3}>
                <MuiGrid item xs={12} md={8}>
                  <StyledPaper elevation={0} className="p-5">
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <AlertTriangle className="w-4 h-4 text-[rgb(var(--scb-honolulu-blue))]" />
                        <Typography variant="h6" className="text-[rgb(var(--scb-dark-gray))]">
                          Recent Tariff Alerts
                        </Typography>
                      </Box>
                      
                      <EnhancedTouchButton
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedTab(2)}
                      >
                        View All
                      </EnhancedTouchButton>
                    </Box>
                    
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell className="text-xs font-medium text-[rgb(var(--scb-dark-gray))] uppercase tracking-wider">
                              Alert
                            </TableCell>
                            <TableCell className="text-xs font-medium text-[rgb(var(--scb-dark-gray))] uppercase tracking-wider">
                              Priority
                            </TableCell>
                            <TableCell className="text-xs font-medium text-[rgb(var(--scb-dark-gray))] uppercase tracking-wider">
                              Date
                            </TableCell>
                            <TableCell className="text-xs font-medium text-[rgb(var(--scb-dark-gray))] uppercase tracking-wider">
                              Confidence
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {tariffAlerts.map((alert) => (
                            <TableRow key={alert.id} hover>
                              <TableCell>
                                <Typography variant="body2" className="text-[rgb(var(--scb-dark-gray))]">
                                  {alert.title}
                                </Typography>
                                <Typography variant="caption" className="text-[rgb(var(--scb-dark-gray))] opacity-70">
                                  {alert.description}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <StyledChip
                                  label={alert.priority}
                                  size="small"
                                  color={
                                    alert.priority === 'high' 
                                      ? 'error' 
                                      : alert.priority === 'medium' 
                                        ? 'primary' 
                                        : 'success'
                                  }
                                  className={
                                    alert.priority === 'high'
                                      ? 'horizon-chip-red'
                                      : alert.priority === 'medium'
                                        ? 'horizon-chip-blue'
                                        : 'horizon-chip-green'
                                  }
                                />
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" className="text-[rgb(var(--scb-dark-gray))]">
                                  {formatDate(alert.createdAt)}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Box display="flex" alignItems="center" gap={0.5}>
                                  <Sparkles className="w-3 h-3 text-[rgb(var(--scb-american-green))]" />
                                  <Typography variant="body2" className="text-[rgb(var(--scb-dark-gray))]">
                                    {(alert.confidence * 100).toFixed(0)}%
                                  </Typography>
                                </Box>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </StyledPaper>
                </MuiGrid>
                
                <MuiGrid item xs={12} md={4}>
                  <StyledPaper elevation={0} className="p-5">
                    <Box display="flex" alignItems="center" gap={1} mb={3}>
                      <Sparkles className="w-4 h-4 text-[rgb(var(--scb-american-green))]" />
                      <Typography variant="h6" className="text-[rgb(var(--scb-dark-gray))]">
                        AI Tariff Predictions
                      </Typography>
                    </Box>
                    
                    <Box className="space-y-3">
                      {tariffPredictions.map((prediction, idx) => (
                        <StyledPaper 
                          key={idx} 
                          elevation={0} 
                          className="p-3 border border-[rgb(var(--scb-border))] hover:bg-[rgba(var(--scb-light-gray),0.5)]"
                        >
                          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                            <Typography variant="subtitle2" className="text-[rgb(var(--scb-dark-gray))]">
                              {prediction.sector}
                            </Typography>
                            <StyledChip
                              label={`${(prediction.probabilityOfTariffReduction * 100).toFixed(0)}%`}
                              size="small"
                              color="success"
                              className="horizon-chip-green"
                            />
                          </Box>
                          
                          <MuiGrid container spacing={1}>
                            <MuiGrid item xs={6}>
                              <Box display="flex" alignItems="center" gap={0.5}>
                                <TrendingUp className="w-3 h-3 text-[rgb(var(--scb-honolulu-blue))]" />
                                <Typography variant="caption" className="text-[rgb(var(--scb-dark-gray))]">
                                  {prediction.estimatedImpact}
                                </Typography>
                              </Box>
                            </MuiGrid>
                            <MuiGrid item xs={6}>
                              <Typography variant="caption" className="text-[rgb(var(--scb-dark-gray))]">
                                {prediction.timeframe}
                              </Typography>
                            </MuiGrid>
                          </MuiGrid>
                        </StyledPaper>
                      ))}
                    </Box>
                    
                    <Box mt={3} display="flex" justifyContent="center">
                      <EnhancedTouchButton
                        variant="secondary"
                        size="sm"
                        onClick={() => setSelectedTab(1)}
                        leftIcon={<BarChartIcon className="w-4 h-4" />}
                      >
                        Run New Simulation
                      </EnhancedTouchButton>
                    </Box>
                  </StyledPaper>
                </MuiGrid>
              </MuiGrid>
            </Box>
          )}
          
          {/* Simulations Tab with SCB Styling */}
          {selectedTab === 1 && (
            <StyledPaper elevation={0} className="p-5">
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h6" className="text-[rgb(var(--scb-dark-gray))]">
                  Simulation Models
                </Typography>
                
                <EnhancedTouchButton
                  variant="primary"
                  size="sm"
                  leftIcon={<BarChartIcon className="w-4 h-4" />}
                >
                  New Simulation
                </EnhancedTouchButton>
              </Box>
              
              <NetworkAwareDataLoader
                fetchFunction={fetchSimulationInputs}
                totalItems={50}
                itemsPerPage={getOptimalPageSize()}
              >
                {(data, loading, error) => (
                  <>
                    {loading ? (
                      <Box display="flex" justifyContent="center" alignItems="center" p={3}>
                        <EnhancedInlineSpinner />
                        <Typography variant="body2" sx={{ ml: 2 }}>
                          Loading simulations...
                        </Typography>
                      </Box>
                    ) : error ? (
                      <Alert 
                        severity="error" 
                        icon={<AlertTriangle className="text-[rgb(var(--scb-muted-red))]" />}
                      >
                        {error}
                      </Alert>
                    ) : (
                      <TableContainer>
                        <Table>
                          <TableHead>
                            <TableRow>
                              <TableCell className="text-xs font-medium text-[rgb(var(--scb-dark-gray))] uppercase tracking-wider">
                                Name
                              </TableCell>
                              <TableCell className="text-xs font-medium text-[rgb(var(--scb-dark-gray))] uppercase tracking-wider">
                                Type
                              </TableCell>
                              <TableCell className="text-xs font-medium text-[rgb(var(--scb-dark-gray))] uppercase tracking-wider">
                                Created By
                              </TableCell>
                              <TableCell className="text-xs font-medium text-[rgb(var(--scb-dark-gray))] uppercase tracking-wider">
                                Created At
                              </TableCell>
                              <TableCell className="text-xs font-medium text-[rgb(var(--scb-dark-gray))] uppercase tracking-wider">
                                Actions
                              </TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {data.map((input) => (
                              <TableRow 
                                key={input.id} 
                                hover 
                                selected={selectedInputId === input.id}
                                className={selectedInputId === input.id ? 'bg-[rgba(var(--scb-honolulu-blue),0.05)]' : ''}
                              >
                                <TableCell>
                                  <Typography variant="body2" className="text-[rgb(var(--scb-dark-gray))]">
                                    {input.name}
                                  </Typography>
                                  <Typography variant="caption" className="text-[rgb(var(--scb-dark-gray))] opacity-70">
                                    {input.description.substring(0, 50)}...
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <StyledChip
                                    label={input.simulationType}
                                    size="small"
                                    color="primary"
                                    className="horizon-chip-blue"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Typography variant="body2" className="text-[rgb(var(--scb-dark-gray))]">
                                    {input.createdBy}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Typography variant="body2" className="text-[rgb(var(--scb-dark-gray))]">
                                    {formatDate(input.createdAt)}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Box display="flex" gap={1}>
                                    <EnhancedTouchButton
                                      variant="secondary"
                                      size="xs"
                                      onClick={() => setSelectedInputId(input.id)}
                                    >
                                      View
                                    </EnhancedTouchButton>
                                    <EnhancedTouchButton
                                      variant="ghost"
                                      size="xs"
                                      leftIcon={<BarChartIcon className="w-3 h-3" />}
                                    >
                                      Run
                                    </EnhancedTouchButton>
                                  </Box>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    )}
                  </>
                )}
              </NetworkAwareDataLoader>
            </StyledPaper>
          )}
          
          {/* Tariff Alerts Tab with SCB Styling */}
          {selectedTab === 2 && (
            <StyledPaper elevation={0} className="p-5">
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Box>
                  <Typography variant="h6" className="text-[rgb(var(--scb-dark-gray))]">
                    Tariff Alerts & Notifications
                  </Typography>
                  <Typography variant="body2" className="text-[rgb(var(--scb-dark-gray))] opacity-80">
                    Real-time tariff changes and impact analysis
                  </Typography>
                </Box>
                
                <EnhancedTouchButton
                  variant="secondary"
                  size="sm"
                  leftIcon={<RefreshIcon className="w-4 h-4" />}
                  onClick={handleRefresh}
                  disabled={refreshing}
                >
                  {refreshing ? 'Refreshing...' : 'Refresh Alerts'}
                </EnhancedTouchButton>
              </Box>
              
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell className="text-xs font-medium text-[rgb(var(--scb-dark-gray))] uppercase tracking-wider">
                        Alert
                      </TableCell>
                      <TableCell className="text-xs font-medium text-[rgb(var(--scb-dark-gray))] uppercase tracking-wider">
                        Source
                      </TableCell>
                      <TableCell className="text-xs font-medium text-[rgb(var(--scb-dark-gray))] uppercase tracking-wider">
                        Priority
                      </TableCell>
                      <TableCell className="text-xs font-medium text-[rgb(var(--scb-dark-gray))] uppercase tracking-wider">
                        Impact
                      </TableCell>
                      <TableCell className="text-xs font-medium text-[rgb(var(--scb-dark-gray))] uppercase tracking-wider">
                        Date
                      </TableCell>
                      <TableCell className="text-xs font-medium text-[rgb(var(--scb-dark-gray))] uppercase tracking-wider">
                        Actions
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {tariffAlerts.map((alert) => (
                      <TableRow key={alert.id} hover>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" className="text-[rgb(var(--scb-dark-gray))] font-medium">
                              {alert.title}
                            </Typography>
                            <Typography variant="caption" className="text-[rgb(var(--scb-dark-gray))] opacity-70">
                              {alert.description}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" className="text-[rgb(var(--scb-dark-gray))]">
                            {alert.sourceName}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <StyledChip
                            label={alert.priority}
                            size="small"
                            color={
                              alert.priority === 'high' 
                                ? 'error' 
                                : alert.priority === 'medium' 
                                  ? 'primary' 
                                  : 'success'
                            }
                            className={
                              alert.priority === 'high'
                                ? 'horizon-chip-red'
                                : alert.priority === 'medium'
                                  ? 'horizon-chip-blue'
                                  : 'horizon-chip-green'
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <StyledChip
                              label={`${alert.impactSeverity}/10`}
                              size="small"
                              color={
                                alert.impactSeverity > 7 
                                  ? 'error' 
                                  : alert.impactSeverity > 5 
                                    ? 'primary' 
                                    : 'success'
                              }
                              className={
                                alert.impactSeverity > 7
                                  ? 'horizon-chip-red'
                                  : alert.impactSeverity > 5
                                    ? 'horizon-chip-blue'
                                    : 'horizon-chip-green'
                              }
                            />
                            <Box display="flex" alignItems="center" gap={0.5}>
                              <Sparkles className="w-3 h-3 text-[rgb(var(--scb-american-green))]" />
                              <Typography variant="caption" className="text-[rgb(var(--scb-american-green))]">
                                {(alert.confidence * 100).toFixed(0)}%
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" className="text-[rgb(var(--scb-dark-gray))]">
                            {formatDate(alert.createdAt)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <EnhancedTouchButton
                            variant="secondary"
                            size="xs"
                            leftIcon={<BarChartIcon className="w-3 h-3" />}
                          >
                            Analyze
                          </EnhancedTouchButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </StyledPaper>
          )}
          
          {/* Comparisons Tab with SCB Styling */}
          {selectedTab === 3 && (
            <StyledPaper elevation={0} className="p-5">
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h6" className="text-[rgb(var(--scb-dark-gray))]">
                  Simulation Comparisons
                </Typography>
                
                <EnhancedTouchButton
                  variant="primary"
                  size="sm"
                  leftIcon={<BarChartIcon className="w-4 h-4" />}
                >
                  New Comparison
                </EnhancedTouchButton>
              </Box>
              
              <NetworkAwareDataLoader
                fetchFunction={fetchComparisons}
                totalItems={20}
                itemsPerPage={getOptimalPageSize()}
              >
                {(data, loading, error) => (
                  <>
                    {loading ? (
                      <Box display="flex" justifyContent="center" alignItems="center" p={3}>
                        <EnhancedInlineSpinner />
                        <Typography variant="body2" sx={{ ml: 2 }}>
                          Loading comparisons...
                        </Typography>
                      </Box>
                    ) : error ? (
                      <Alert 
                        severity="error" 
                        icon={<AlertTriangle className="text-[rgb(var(--scb-muted-red))]" />}
                      >
                        {error}
                      </Alert>
                    ) : (
                      <MuiGrid container spacing={3}>
                        {data.map((comparison) => (
                          <MuiGrid item xs={12} md={6} key={comparison.id}>
                            <StyledCard className="fiori-tile">
                              <Box p={2} borderBottom={1} borderColor="rgb(var(--scb-border))">
                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                  <Typography variant="subtitle1" className="text-[rgb(var(--scb-dark-gray))]">
                                    {comparison.name}
                                  </Typography>
                                  <StyledChip
                                    label={`${comparison.improvementPercent.toFixed(1)}% ${comparison.improvementPercent > 0 ? 'improvement' : 'decline'}`}
                                    size="small"
                                    color={comparison.improvementPercent > 0 ? 'success' : 'error'}
                                    className={comparison.improvementPercent > 0 ? 'horizon-chip-green' : 'horizon-chip-red'}
                                  />
                                </Box>
                              </Box>
                              
                              <StyledCardContent>
                                <MuiGrid container spacing={2}>
                                  <MuiGrid item xs={6}>
                                    <Box p={1.5} className="bg-[rgba(var(--scb-light-gray),0.5)] rounded">
                                      <Typography variant="caption" className="text-[rgb(var(--scb-dark-gray))] opacity-70">
                                        Baseline
                                      </Typography>
                                      <Typography variant="body1" className="text-[rgb(var(--scb-dark-gray))] font-medium">
                                        {comparison.comparisonResults?.outcomeComparison?.baseline.toFixed(1)}
                                      </Typography>
                                    </Box>
                                  </MuiGrid>
                                  
                                  <MuiGrid item xs={6}>
                                    <Box p={1.5} className="bg-[rgba(var(--scb-light-gray),0.5)] rounded">
                                      <Typography variant="caption" className="text-[rgb(var(--scb-dark-gray))] opacity-70">
                                        Alternative
                                      </Typography>
                                      <Typography variant="body1" className="text-[rgb(var(--scb-dark-gray))] font-medium">
                                        {comparison.comparisonResults?.outcomeComparison?.alternate.toFixed(1)}
                                      </Typography>
                                    </Box>
                                  </MuiGrid>
                                </MuiGrid>
                                
                                <Box mt={2} p={1.5} className="bg-[rgba(var(--scb-light-gray),0.5)] rounded">
                                  <Typography variant="caption" className="text-[rgb(var(--scb-dark-gray))] opacity-70">
                                    Details
                                  </Typography>
                                  <Typography variant="body2" className="text-[rgb(var(--scb-dark-gray))]">
                                    {comparison.comparisonResults?.details}
                                  </Typography>
                                </Box>
                                
                                <Divider sx={{ my: 2 }} />
                                
                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                  <Typography variant="caption" className="text-[rgb(var(--scb-dark-gray))] opacity-70">
                                    Created: {formatDate(comparison.createdAt)}
                                  </Typography>
                                  
                                  <EnhancedTouchButton
                                    variant="secondary"
                                    size="xs"
                                  >
                                    View Details
                                  </EnhancedTouchButton>
                                </Box>
                              </StyledCardContent>
                            </StyledCard>
                          </MuiGrid>
                        ))}
                      </MuiGrid>
                    )}
                  </>
                )}
              </NetworkAwareDataLoader>
            </StyledPaper>
          )}
        </Box>
      </StyledPaper>
    </Box>
  );
};

export default EnhancedBusinessDataCloudDashboard;