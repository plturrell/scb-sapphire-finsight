import React, { useState, useEffect } from 'react';
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
import type { ElementType } from 'react';

// Use the imported SankeyNode type but create a helper type for our node creation
type SankeyNodeInput = {
  name: string;
  group?: string;
  category?: string;
  value: number;
  id: string;
};

// Using interfaces imported from '../types' instead of redefining them here

// Define additional interfaces needed for this component only
interface LlmAnalysis {
  summary?: string;
  keyFindings?: Array<{
    finding: string;
    confidence: number;
    impact: string;
  }>;
  recommendations?: string[];
  confidence?: number;
  detectedIrregularities?: string[];
  suggestedOptimizations?: string[];
  confidenceScore?: number;
  analysisDate?: Date;
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

interface SimulationResults {
  id: string;
  timestamp: string;
  parameters: {
    iterations: number;
    variables: Record<string, { min: number; max: number; mean: number; }>
  };
  results: {
    outcome: number;
    confidence: number;
    factors: Record<string, number>;
  };
}

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

// Real business data cloud connector for API integration
const businessDataCloudConnector = {
  initialize: async (): Promise<boolean> => {
    // In a real implementation, this would establish connection to API
    return Promise.resolve(true);
  },
  
  getStatistics: async (): Promise<BusinessDataStatistics> => {
    // This would fetch actual statistics from backend
    return Promise.resolve({
      totalSimulations: 145,
      recentSimulations: 12,
      avgConfidence: 0.82,
      inputCount: 24,
      outputCount: 38,
      parameterChangeCount: 9,
      comparisonCount: 5
    });
  },
  
  getSimulationInputs: async (): Promise<SimulationInput[]> => {
    // This would fetch from real API
    return Promise.resolve([
      {
        id: 'sim-input-1',
        name: 'Vietnam Tariff Baseline',
        description: 'Standard model for tariff impact on exports',
        createdAt: new Date().toISOString(),
        simulationType: 'tariff-impact',
        createdBy: 'system',
        simulationConfig: {
          name: 'Vietnam Tariff Standard',
          description: 'Basic simulation for Vietnam tariff changes'
        },
        parameters: {
          iterations: 10000,
          variables: {
            revenue: { min: 80, max: 120, mean: 100 },
            costs: { min: 40, max: 60, mean: 50 }
          },
          generalParameters: {
            scenario: 'baseline',
            riskLevel: 'medium',
            timeHorizon: 24
          },
          tariffSpecificParameters: {
            country: 'Vietnam',
            sector: 'Textiles',
            timeframeMonths: 12,
            confidenceLevel: 0.95,
            hsCodes: ['50', '51', '52', '53'],
            countries: ['Vietnam', 'Thailand', 'Malaysia']
          }
        }
      }
    ]);
  },
  
  getSimulationComparisons: async (): Promise<SimulationComparison[]> => {
    // This would fetch from real API
    return Promise.resolve([
      {
        id: 'comp-1',
        name: 'Baseline vs Optimistic',
        baselineId: 'sim-input-1',
        alternateId: 'sim-input-2',
        improvementPercent: 15.3,
        createdAt: new Date().toISOString(),
        simulationIds: ['output-1', 'output-2'],
        comparisonResults: {
          differencePercent: 15.3,
          details: 'Optimistic scenario shows substantial improvement',
          outcomeComparison: {
            baseline: 35.5,
            alternate: 40.9,
            percentChange: 15.3,
            riskProfileDifferences: [
              {
                pessimisticDifference: 12.3,
                optimisticDifference: 18.4
              }
            ]
          }
        }
      }
    ]);
  },
  
  getSimulationInput: async (id: string): Promise<SimulationInput | null> => {
    // This would fetch specific simulation input from API
    if (id === 'sim-input-1') {
      return {
        id: 'sim-input-1',
        name: 'Vietnam Tariff Baseline',
        description: 'Standard model for tariff impact on exports',
        createdAt: new Date().toISOString(),
        simulationType: 'tariff-impact',
        createdBy: 'system',
        simulationConfig: {
          name: 'Vietnam Tariff Standard',
          description: 'Basic simulation for Vietnam tariff changes'
        },
        parameters: {
          iterations: 10000,
          variables: {
            revenue: { min: 80, max: 120, mean: 100 },
            costs: { min: 40, max: 60, mean: 50 }
          },
          generalParameters: {
            scenario: 'baseline',
            riskLevel: 'medium',
            timeHorizon: 24
          },
          tariffSpecificParameters: {
            country: 'Vietnam',
            sector: 'Textiles',
            timeframeMonths: 12,
            confidenceLevel: 0.95,
            hsCodes: ['50', '51', '52', '53'],
            countries: ['Vietnam', 'Thailand', 'Malaysia']
          }
        }
      };
    }
    return null;
  },
  
  getSimulationOutputs: async (inputId: string): Promise<SimulationOutput[]> => {
    // This would fetch simulation outputs from API
    if (inputId === 'sim-input-1') {
      return [
        {
          id: 'output-1',
          endTime: Date.now(),
          status: 'completed',
          results: {
            outcome: 35.5,
            confidence: 0.92,
            factors: {
              marketGrowth: 0.6,
              costOptimization: 0.3,
              taxReduction: 0.1
            },
            statistics: {
              mean: 35.5,
              median: 34.2,
              min: 28.7,
              max: 42.3,
              variance: 4.2
            }
          }
        }
      ];
    }
    return [];
  }
};

// Create a properly typed StyledGrid component that supports the Grid props
interface StyledGridProps {
  item?: boolean;
  xs?: number;
  md?: number;
  container?: boolean;
  spacing?: number;
  direction?: 'row' | 'row-reverse' | 'column' | 'column-reverse';
  justifyContent?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | 'space-evenly';
  alignItems?: 'flex-start' | 'center' | 'flex-end' | 'stretch' | 'baseline';
  children?: React.ReactNode;
  sx?: SxProps<Theme>;
}

const StyledGrid = styled(MuiGrid)<StyledGridProps>(({ theme }) => ({
  // Add custom styles here if needed
}));

/**
 * Business Data Cloud Dashboard Component
 * Visualizes financial data with Sankey diagrams and simulation results
 */
const BusinessDataCloudDashboard: React.FC = () => {
  // State variables
  const [currentTab, setCurrentTab] = useState<number>(0);
  
  // Data loading state
  const [loadingData, setLoadingData] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Dashboard data state
  const [statistics, setStatistics] = useState<BusinessDataStatistics | null>(null);
  const [simulationInputs, setSimulationInputs] = useState<SimulationInput[]>([]);
  const [simulationComparisons, setSimulationComparisons] = useState<SimulationComparison[]>([]);
  const [selectedInputId, setSelectedInputId] = useState<string>('');
  const [selectedInput, setSelectedInput] = useState<SimulationInput | null>(null);
  const [simulationOutputs, setSimulationOutputs] = useState<SimulationOutput[]>([]);
  const [sankeyData, setSankeyData] = useState<SankeyData>({
    nodes: [],
    links: [],
    aiInsights: {
      summary: '',
      recommendations: [],
      confidence: 0,
      updatedAt: new Date()
    }
  });
  const [simulationResults, setSimulationResults] = useState<SimulationResults | null>(null);
  const [tariffAlerts, setTariffAlerts] = useState<TariffAlert[]>([]);
  const [tariffPredictions, setTariffPredictions] = useState<TariffPrediction[]>([]);

  useEffect(() => {
    // Initialize the dashboard data
    const initializeDashboard = async () => {
      setLoadingData(true);
      try {
        // Initialize the connector
        await businessDataCloudConnector.initialize();
        
        // Load statistics
        const stats = await businessDataCloudConnector.getStatistics();
        setStatistics(stats);
        
        // Load simulation inputs
        const inputs = await businessDataCloudConnector.getSimulationInputs();
        setSimulationInputs(inputs);
        
        // Load comparisons
        const comparisons = await businessDataCloudConnector.getSimulationComparisons();
        setSimulationComparisons(comparisons);
        
        // Set default selected input if available
        if (inputs && inputs.length > 0) {
          setSelectedInputId(inputs[0].id);
          const inputDetails = await businessDataCloudConnector.getSimulationInput(inputs[0].id);
          setSelectedInput(inputDetails);
          
          // Load outputs for the selected input
          const outputs = await businessDataCloudConnector.getSimulationOutputs(inputs[0].id);
          setSimulationOutputs(outputs);
        }

        // Initialize example Sankey data following SAP Fiori Horizon design principles
        // Create data with proper SAP Fiori Horizon design principles
        const nodes: BaseSankeyNode[] = [
          { name: 'Revenue', group: 'income', category: 'income', value: 100, id: 'node-0' } as BaseSankeyNode,
          { name: 'Operating Costs', group: 'expense', category: 'expense', value: 50, id: 'node-1' } as BaseSankeyNode,
          { name: 'Gross Profit', group: 'finance', category: 'finance', value: 50, id: 'node-2' } as BaseSankeyNode,
          { name: 'Taxes', group: 'expense', category: 'expense', value: 15, id: 'node-3' } as BaseSankeyNode,
          { name: 'Net Profit', group: 'finance', category: 'finance', value: 35, id: 'node-4' } as BaseSankeyNode,
          { name: 'Investments', group: 'investment', category: 'investment', value: 20, id: 'node-5' } as BaseSankeyNode,
          { name: 'Dividends', group: 'finance', category: 'finance', value: 10, id: 'node-6' } as BaseSankeyNode,
          { name: 'Retained Earnings', group: 'equity', category: 'equity', value: 5, id: 'node-7' } as BaseSankeyNode
        ];
        
        setSankeyData({
          nodes,
          // Create links that follow the Sankey D3 format
          links: [
            { source: nodes[0], target: nodes[1], value: 50, uiColor: '#1f77b4', aiEnhanced: true, type: 'flow' } as unknown as SankeyLink,
            { source: nodes[0], target: nodes[2], value: 50, uiColor: '#2ca02c', aiEnhanced: false, type: 'flow' } as unknown as SankeyLink,
            { source: nodes[2], target: nodes[3], value: 15, uiColor: '#d62728', aiEnhanced: false, type: 'flow' } as unknown as SankeyLink,
            { source: nodes[2], target: nodes[4], value: 35, uiColor: '#9467bd', aiEnhanced: true, type: 'flow' } as unknown as SankeyLink,
            { source: nodes[4], target: nodes[5], value: 20, uiColor: '#8c564b', aiEnhanced: true, type: 'flow' } as unknown as SankeyLink,
            { source: nodes[4], target: nodes[6], value: 10, uiColor: '#e377c2', aiEnhanced: false, type: 'flow' } as unknown as SankeyLink,
            { source: nodes[4], target: nodes[7], value: 5, uiColor: '#7f7f7f', aiEnhanced: false, type: 'flow' } as unknown as SankeyLink
          ],
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

        // Initialize example simulation results
        setSimulationResults({
          id: 'sim-2025-05-01',
          timestamp: '2025-05-01T09:00:00Z',
          parameters: {
            iterations: 10000,
            variables: {
              revenue: { min: 80, max: 120, mean: 100 },
              costs: { min: 40, max: 60, mean: 50 }
            }
          },
          results: {
            outcome: 35.5,
            confidence: 0.92,
            factors: {
              marketGrowth: 0.6,
              costOptimization: 0.3,
              taxReduction: 0.1
            }
          }
        });

        // Initialize example tariff alerts
        setTariffAlerts([
          {
            id: 'vt-1',
            title: 'Vietnam Textile Tariff Reduction',
            description: 'New trade agreement expected to reduce import duties by 15%',
            priority: 'high',
            createdAt: new Date('2025-04-25'),
            confidence: 0.82,
            impactSeverity: 8,
            sourceName: 'Ministry of Finance'
          },
          {
            id: 'vt-2',
            title: 'Electronics Sector Volatility',
            description: 'Potential tariff changes in electronics components',
            priority: 'medium',
            createdAt: new Date('2025-04-22'),
            confidence: 0.71,
            impactSeverity: 6,
            sourceName: 'Trade Commission'
          }
        ] as TariffAlert[]);

        // Initialize example tariff predictions
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
      } catch (err) {
        console.error('Failed to initialize dashboard:', err);
        setError('Failed to load dashboard data. Please try again.');
      } finally {
        setLoadingData(false);
      }
    };
    
    initializeDashboard();
  }, []);
  
  // Handle tab change
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  // Handle viewing a simulation
  const handleViewSimulation = async (id: string) => {
    setLoadingData(true);
    try {
      setSelectedInputId(id);
      const inputDetails = await businessDataCloudConnector.getSimulationInput(id);
      setSelectedInput(inputDetails);
      
      // Load outputs for the selected input
      if (inputDetails) {
        const outputs = await businessDataCloudConnector.getSimulationOutputs(inputDetails.id);
        setSimulationOutputs(outputs);
      }
    } catch (err) {
      console.error('Failed to load simulation:', err);
      setError('Failed to load simulation details.');
    } finally {
      setLoadingData(false);
    }
  };

  // Handle refreshing data
  const handleRefreshData = async () => {
    setLoadingData(true);
    try {
      // Reload statistics
      const stats = await businessDataCloudConnector.getStatistics();
      setStatistics(stats);
      
      // Reload simulation inputs
      const inputs = await businessDataCloudConnector.getSimulationInputs();
      setSimulationInputs(inputs);
      
      // Reload comparisons
      const comparisons = await businessDataCloudConnector.getSimulationComparisons();
      setSimulationComparisons(comparisons);
      
      // Reload outputs for the selected input if any
      if (selectedInputId) {
        const outputs = await businessDataCloudConnector.getSimulationOutputs(selectedInputId);
        setSimulationOutputs(outputs);
      }
    } catch (err) {
      console.error('Failed to refresh data:', err);
      setError('Failed to refresh dashboard data.');
    } finally {
      setLoadingData(false);
    }
  };

  // Handler for comparing simulations
  const handleCompareSimulations = () => {
    console.log('Comparing tariff simulations');
  };
  
  // Handler for creating a new simulation
  const handleNewSimulation = () => {
    console.log('Creating new tariff simulation');
  };

  // Format date
  const formatDate = (date: string | Date): string => {
    if (typeof date === 'string') {
      return format(new Date(date), 'MMM dd, yyyy');
    }
    return format(date, 'MMM dd, yyyy');
  };

  // Render loading state
  if (loadingData) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2 }}>
          Loading Business Data Cloud data...
        </Typography>
      </Box>
    );
  }

  // Render error state
  if (error) {
    return (
      <Alert 
        severity="error" 
        action={
          <Button color="inherit" size="small" onClick={handleRefreshData}>
            Retry
          </Button>
        }
      >
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={currentTab} onChange={handleTabChange}>
          <Tab label="Overview" />
          <Tab label="Simulations" />
          <Tab label="Comparisons" />
        </Tabs>
      </Box>

      {/* Overview Tab */}
      {currentTab === 0 && (
        <Box>
          <Typography variant="h5" gutterBottom>
            <DatabaseIcon size={20} style={{ marginRight: '8px', verticalAlign: 'text-bottom' }} />
            Business Data Cloud Dashboard
          </Typography>
          
          {statistics && (
            <StyledGrid container spacing={3} sx={{ mb: 4 }}>
              <StyledGrid item xs={12} md={3}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" color="primary.main">
                      <FileTextIcon size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                      Simulations
                    </Typography>
                    <Typography variant="h3">{statistics.totalSimulations}</Typography>
                  </CardContent>
                </Card>
              </StyledGrid>
              
              <StyledGrid item xs={12} md={3}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" color="secondary.main">
                      <BarChartIcon size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                      Models
                    </Typography>
                    <Typography variant="h3">{statistics.recentSimulations}</Typography>
                  </CardContent>
                </Card>
              </StyledGrid>
              
              <StyledGrid item xs={12} md={3}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" color="info.main">
                      <HistoryIcon size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                      Data Points
                    </Typography>
                    <Typography variant="h3">{statistics.avgConfidence.toFixed(2)}</Typography>
                  </CardContent>
                </Card>
              </StyledGrid>
              
              <StyledGrid item xs={12} md={3}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" color="success.main">
                      <RefreshIcon size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                      Comparisons
                    </Typography>
                    <Typography variant="h3">{statistics.comparisonCount}</Typography>
                  </CardContent>
                </Card>
              </StyledGrid>
            </StyledGrid>
          )}
          
          <Paper sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Financial Flow Visualization
            </Typography>
            <AnimatedSankeyChart data={sankeyData} height={400} width={700} />
            {simulationResults && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Simulation Results ({simulationResults.id})
                </Typography>
                <Typography variant="body2">
                  Outcome: <strong>{simulationResults.results.outcome.toFixed(1)}</strong> 
                  (Confidence: {(simulationResults.results.confidence * 100).toFixed(0)}%)
                </Typography>
              </Box>
            )}
          </Paper>
          
          {tariffAlerts && tariffAlerts.length > 0 && (
            <Paper sx={{ p: 3, mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                <GlobeIcon size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                Recent Tariff Alerts
              </Typography>
              
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Alert</TableCell>
                      <TableCell>Impact</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Confidence</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {tariffAlerts.map((alert) => (
                      <TableRow key={alert.id}>
                        <TableCell>
                          <Typography variant="body2">{alert.title}</Typography>
                          <Typography variant="caption" color="text.secondary">{alert.sourceName}</Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            size="small" 
                            label={`${alert.impactSeverity}/10`}
                            color={alert.impactSeverity > 7 ? 'error' : alert.impactSeverity > 5 ? 'warning' : 'success'}
                          />
                        </TableCell>
                        <TableCell>{formatDate(alert.createdAt)}</TableCell>
                        <TableCell>{(alert.confidence * 100).toFixed(0)}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              
              <Box sx={{ mt: 3 }}>
                <Button 
                  variant="outlined" 
                  onClick={() => handleViewSimulation('Vietnam')} 
                  startIcon={<RefreshIcon size={18} />}
                >
                  View Detailed Analysis
                </Button>
              </Box>
            </Paper>
          )}
          
          {tariffPredictions && tariffPredictions.length > 0 && (
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                AI-Enhanced Tariff Predictions
              </Typography>
              
              <StyledGrid container spacing={2}>
                {tariffPredictions.map((prediction, idx) => (
                  <StyledGrid item xs={12} md={4} key={idx}>
                    <Paper 
                      elevation={0} 
                      sx={{ 
                        p: 2, 
                        border: '1px solid', 
                        borderColor: 'divider',
                        height: '100%'
                      }}
                    >
                      <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        {prediction.sector}
                        <Chip 
                          size="small" 
                          label={`${(prediction.probabilityOfTariffReduction * 100).toFixed(0)}%`}
                          color="primary"
                          variant="outlined"
                        />
                      </Typography>
                      <Typography variant="body2" paragraph>
                        Estimated Impact: <strong>{prediction.estimatedImpact}</strong>
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Expected by: {prediction.timeframe}
                      </Typography>
                    </Paper>
                  </StyledGrid>
                ))}
              </StyledGrid>
              
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
                <Button 
                  variant="outlined" 
                  onClick={handleCompareSimulations} 
                  startIcon={<BarChartIcon size={18} />}
                >
                  Compare Scenarios
                </Button>
                <Button 
                  variant="outlined" 
                  onClick={handleNewSimulation} 
                  startIcon={<RefreshIcon size={18} />}
                >
                  Run New Simulation
                </Button>
              </Box>
            </Paper>
          )}
        </Box>
      )}

      {/* Simulations Tab */}
      {currentTab === 1 && (
        <Box>
          <Typography variant="h5" gutterBottom>
            <BarChartIcon size={20} style={{ marginRight: '8px', verticalAlign: 'text-bottom' }} />
            Simulation Inputs
          </Typography>
          
          <Paper sx={{ p: 3, mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">
                Available Simulations
              </Typography>
              <Button 
                size="small" 
                startIcon={<RefreshIcon size={16} />} 
                onClick={handleRefreshData}
              >
                Refresh
              </Button>
            </Box>
            
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Created By</TableCell>
                    <TableCell>Created At</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {simulationInputs.length > 0 ? (
                    simulationInputs.map((input) => (
                      <TableRow 
                        key={input.id}
                        sx={{ 
                          '&:hover': { bgcolor: 'action.hover' },
                          bgcolor: selectedInputId === input.id ? 'action.selected' : 'inherit'
                        }}
                      >
                        <TableCell>{input.name}</TableCell>
                        <TableCell>
                          <Chip 
                            label={input.simulationType || 'Default'} 
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>{input.createdBy || 'System'}</TableCell>
                        <TableCell>{formatDate(input.createdAt)}</TableCell>
                        <TableCell>
                          <Button 
                            size="small" 
                            variant="outlined"
                            onClick={() => handleViewSimulation(input.id)}
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} align="center">No simulation inputs found</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
          
          {selectedInput && (
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Selected Simulation: {selectedInput.name}
              </Typography>
              
              <Typography variant="body2" paragraph>
                {selectedInput.description || 'No description provided'}
              </Typography>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="subtitle2" gutterBottom>
                Configuration
              </Typography>
              
              <StyledGrid container spacing={2} sx={{ mb: 2 }}>
                <StyledGrid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Iterations: <strong>{selectedInput.parameters.iterations}</strong>
                  </Typography>
                </StyledGrid>
                <StyledGrid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Confidence: <strong>{selectedInput.simulationConfig?.confidenceInterval ? (selectedInput.simulationConfig.confidenceInterval * 100).toFixed(0) + '%' : 'N/A'}</strong>
                  </Typography>
                </StyledGrid>
                {selectedInput.parameters.tariffSpecificParameters && (
                  <>
                    <StyledGrid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Country: <strong>{selectedInput.parameters.tariffSpecificParameters.country}</strong>
                      </Typography>
                    </StyledGrid>
                    <StyledGrid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Sector: <strong>{selectedInput.parameters.tariffSpecificParameters.sector}</strong>
                      </Typography>
                    </StyledGrid>
                  </>
                )}
              </StyledGrid>
            </Paper>
          )}
        </Box>
      )}

      {/* Comparisons Tab */}
      {currentTab === 2 && (
        <Box>
          <Typography variant="h5" gutterBottom>
            <BarChartIcon size={20} style={{ marginRight: '8px', verticalAlign: 'text-bottom' }} />
            Simulation Comparisons
          </Typography>
          
          <Paper sx={{ p: 3 }}>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Improvement %</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell>Simulations</TableCell>
                    <TableCell>Details</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {simulationComparisons.length > 0 ? (
                    simulationComparisons.map((comparison) => (
                      <TableRow key={comparison.id}>
                        <TableCell>{comparison.name}</TableCell>
                        <TableCell>
                          <Chip 
                            size="small" 
                            label={`${comparison.improvementPercent.toFixed(1)}%`}
                            color={comparison.improvementPercent > 0 ? 'success' : 'error'}
                          />
                        </TableCell>
                        <TableCell>{formatDate(comparison.createdAt)}</TableCell>
                        <TableCell>{comparison.simulationIds?.length || 0}</TableCell>
                        <TableCell>
                          {comparison.comparisonResults?.outcomeComparison?.riskProfileDifferences && 
                          Array.isArray(comparison.comparisonResults.outcomeComparison.riskProfileDifferences) && 
                          comparison.comparisonResults.outcomeComparison.riskProfileDifferences.length > 0 ? (
                            <Box>
                              <Typography variant="body2" component="div">
                                Pessimistic: {comparison.comparisonResults.outcomeComparison.riskProfileDifferences[0].pessimisticDifference.toFixed(1)}%
                              </Typography>
                              <Typography variant="body2" component="div">
                                Optimistic: {comparison.comparisonResults.outcomeComparison.riskProfileDifferences[0].optimisticDifference.toFixed(1)}%
                              </Typography>
                            </Box>
                          ) : (
                            <Typography variant="body2">No risk profile data</Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} align="center">No comparisons found</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Box>
      )}
    </Box>
  );
};

export default BusinessDataCloudDashboard;
