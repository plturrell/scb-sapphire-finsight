/**
 * Enhanced Vietnam Tariff Dashboard with SCB Beautiful UI
 * Comprehensive dashboard with SCB styling, network-aware loading, and responsive design
 */

import React, { useState, useEffect } from 'react';
import { styled } from '@mui/material/styles';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  Button,
  Card,
  CardContent,
  Divider,
  Grid,
  Tab,
  Tabs,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  Globe,
  BarChart2,
  TrendingUp,
  Flag,
  AlertCircle,
  ChevronRight,
  Database,
  FileText,
  Zap,
  Bookmark,
  Calendar,
  DollarSign,
  RefreshCw,
  TrendingDown,
  CheckCircle,
  Shield,
  XCircle,
  ArrowUp,
  ArrowDown,
  Clock
} from 'lucide-react';
import { 
  mockVietnamTariffAlerts, 
  vietnamAiPredictions,
  vietnamTariffTrends,
  vietnamTradeCorrelations 
} from '../mock/vietnamTariffData';
import { VietnamMonteCarloHistory } from './VietnamMonteCarloHistory';
import { VietnamMonteCarloLlmAnalysis } from './VietnamMonteCarloLlmAnalysis';
import NetworkAwareDataLoader from './NetworkAwareDataLoader';
import { useNetworkAwareLoading } from '../hooks/useNetworkAwareLoading';
import { useDeviceCapabilities } from '../hooks/useDeviceCapabilities';
import { TariffAlert } from '../types';
import { EnhancedLoadingSpinner } from './EnhancedLoadingSpinner';

// Styled Components for SCB Beautiful UI
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

const StyledPaper = styled(Paper)(({ theme }) => ({
  border: '1px solid rgb(var(--scb-border))',
  borderRadius: '0.25rem',
  boxShadow: 'none',
  height: '100%'
}));

const StyledTab = styled(Tab)(({ theme }) => ({
  textTransform: 'none',
  fontWeight: 500,
  fontSize: '0.95rem',
  minHeight: 48,
  color: 'rgb(var(--scb-dark-gray))',
  '&.Mui-selected': {
    color: 'rgb(var(--scb-honolulu-blue))',
    fontWeight: 600
  }
}));

const StyledTabs = styled(Tabs)(({ theme }) => ({
  '& .MuiTabs-indicator': {
    backgroundColor: 'rgb(var(--scb-honolulu-blue))',
    height: 3
  }
}));

const StyledButton = styled(Button)(({ theme }) => ({
  textTransform: 'none',
  borderRadius: '0.375rem',
  fontWeight: 500,
  boxShadow: 'none',
  '&.MuiButton-contained': {
    backgroundColor: 'rgb(var(--scb-honolulu-blue))',
    color: 'white',
    '&:hover': {
      backgroundColor: 'rgba(var(--scb-honolulu-blue), 0.9)',
      boxShadow: '0 2px 4px rgba(var(--scb-honolulu-blue), 0.2)'
    }
  },
  '&.MuiButton-outlined': {
    borderColor: 'rgb(var(--scb-honolulu-blue))',
    color: 'rgb(var(--scb-honolulu-blue))',
    '&:hover': {
      backgroundColor: 'rgba(var(--scb-honolulu-blue), 0.05)'
    }
  }
}));

const StyledAlert = styled(Alert)(({ theme }) => ({
  borderRadius: '0.25rem',
  '&.MuiAlert-standardWarning': {
    backgroundColor: 'rgba(var(--scb-warning), 0.1)',
    color: 'rgb(var(--scb-dark-gray))'
  },
  '&.MuiAlert-standardError': {
    backgroundColor: 'rgba(var(--scb-muted-red), 0.1)',
    color: 'rgb(var(--scb-muted-red))'
  },
  '&.MuiAlert-standardInfo': {
    backgroundColor: 'rgba(var(--scb-honolulu-blue), 0.1)',
    color: 'rgb(var(--scb-honolulu-blue))'
  },
  '&.MuiAlert-standardSuccess': {
    backgroundColor: 'rgba(var(--scb-american-green), 0.1)',
    color: 'rgb(var(--scb-american-green))'
  }
}));

const StyledTableHead = styled(TableHead)(({ theme }) => ({
  '& .MuiTableCell-head': {
    backgroundColor: 'rgba(var(--scb-light-gray), 0.5)',
    color: 'rgb(var(--scb-dark-gray))',
    fontWeight: 600,
    borderBottom: '2px solid rgb(var(--scb-border))'
  }
}));

const StyledChip = styled('span')<{ variant: 'success' | 'warning' | 'error' | 'info' }>(({ theme, variant }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  padding: '0.25rem 0.625rem',
  borderRadius: '1rem',
  fontSize: '0.75rem',
  fontWeight: 500,
  gap: '0.375rem',
  ...(variant === 'success' && {
    color: 'rgb(var(--scb-american-green))',
    backgroundColor: 'rgba(var(--scb-american-green), 0.1)',
    border: '1px solid rgba(var(--scb-american-green), 0.2)'
  }),
  ...(variant === 'warning' && {
    color: 'rgb(var(--horizon-neutral-gray))',
    backgroundColor: 'rgba(var(--warning), 0.1)',
    border: '1px solid rgba(var(--warning), 0.2)'
  }),
  ...(variant === 'error' && {
    color: 'rgb(var(--scb-muted-red))',
    backgroundColor: 'rgba(var(--scb-muted-red), 0.1)',
    border: '1px solid rgba(var(--scb-muted-red), 0.2)'
  }),
  ...(variant === 'info' && {
    color: 'rgb(var(--scb-honolulu-blue))',
    backgroundColor: 'rgba(var(--scb-honolulu-blue), 0.1)',
    border: '1px solid rgba(var(--scb-honolulu-blue), 0.2)'
  })
}));

// Network Status Badge Component
const NetworkStatusBadge: React.FC<{ status: string; saveData: boolean; className?: string }> = ({ 
  status, 
  saveData,
  className
}) => {
  let variant: 'success' | 'warning' | 'error' | 'info' = 'info';
  
  if (status === 'wifi' || status === '4g') {
    variant = 'success';
  } else if (status === '3g') {
    variant = 'info';
  } else if (status === '2g' || status === 'slow-2g') {
    variant = 'warning';
  } else if (status === 'offline') {
    variant = 'error';
  }
  
  return (
    <StyledChip 
      variant={variant} 
      className={className}
    >
      {status === 'wifi' ? <Zap size={12} /> : 
       status === 'offline' ? <XCircle size={12} /> : 
       <RefreshCw size={12} />}
      {status.toUpperCase()}
      {saveData && <Shield size={12} />}
    </StyledChip>
  );
};

// Define LLM analysis type
interface LLMAnalysis {
  status: string;
  summary: string;
  confidence: number;
  keyFindings: Array<{ finding: string; confidence: number }>;
  keyInsights: string[];
  riskAssessment: {
    text: string;
    riskLevel: string;
    probabilityOfNegativeImpact: number;
  };
  recommendations: string[];
  confidenceScore: number;
  insightSources: string[];
}

const VietnamTariffDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedSimulationId, setSelectedSimulationId] = useState<string | null>(null);
  const [selectedComparisonId, setSelectedComparisonId] = useState<string | null>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Network awareness hooks
  const { connection, strategy } = useNetworkAwareLoading();
  const capabilities = useDeviceCapabilities();
  
  // Determine if we should load heavy visualizations
  const loadHeavyContent = connection.type !== '2g' && 
                          connection.type !== 'slow-2g' && 
                          !connection.saveData;

  // Initialize default LLM analysis
  const defaultLlmAnalysis: LLMAnalysis = {
    status: 'complete',
    summary: 'Comprehensive analysis of Vietnam\'s tariff landscape indicates significant opportunities in electronics and machinery sectors through EU-Vietnam FTA implementation, while agricultural imports require strategic hedging against ASEAN regulatory changes.',
    confidence: 0.89,
    keyFindings: [
      { finding: 'Electronics sector shows 7.2% projected growth with tariff reductions', confidence: 0.92 },
      { finding: 'RCEP accelerates textile tariff reductions by 2.1% annually', confidence: 0.87 },
      { finding: 'Agricultural imports from Thailand face new safeguard measures', confidence: 0.85 },
      { finding: 'EU-Vietnam FTA creates 4.2% tariff reduction in machinery', confidence: 0.91 },
      { finding: 'Exchange rate-tariff correlation stands at 0.62', confidence: 0.83 }
    ],
    keyInsights: [
      'Vietnam electronics sector projected to benefit most from tariff reductions with 7.2% growth',
      'RCEP implementation accelerates textile tariff reductions by an additional 2.1% annually',
      'Agricultural imports from Thailand show increased price sensitivity due to new safeguards',
      'EU-Vietnam FTA creating significant opportunities in machinery sector with 4.2% tariff reduction',
      'Currency exchange rate fluctuations have moderate correlation (0.62) with tariff effectiveness'
    ],
    riskAssessment: {
      text: 'Overall risk assessment indicates moderate exposure to tariff policy changes, with electronics and machinery showing resilience while agriculture faces potential challenges.',
      riskLevel: 'medium',
      probabilityOfNegativeImpact: 0.42
    },
    recommendations: [
      'Prioritize EU machinery imports to maximize FTA benefits and cost savings',
      'Establish supply chain contingencies for agricultural products to mitigate Thailand import duty increases',
      'Consider accelerating electronics exports to Singapore before end of quarter to leverage current rates',
      'Develop dual-supplier strategy across ASEAN to balance against potential tariff volatility',
      'Implement monthly tariff impact assessments for high-volume product categories'
    ],
    confidenceScore: 0.89,
    insightSources: ['Bloomberg Intelligence', 'SCB Research', 'Vietnam Ministry of Finance']
  };

  const [llmAnalysis, setLlmAnalysis] = useState<LLMAnalysis>(defaultLlmAnalysis);
  const [llmLoading, setLlmLoading] = useState<boolean>(false);

  // Mock data fetch function for network-aware loader
  const fetchTariffAlerts = async (offset: number, limit: number): Promise<TariffAlert[]> => {
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
    if (!Array.isArray(mockVietnamTariffAlerts)) {
      console.warn('mockVietnamTariffAlerts is not an array');
      return [];
    }
    return mockVietnamTariffAlerts.slice(offset, offset + limit);
  };

  // Handle tab changes
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    
    // Simulate loading for AI Insights tab
    if (newValue === 2 && !llmLoading) {
      setLlmLoading(true);
      setTimeout(() => {
        setLlmLoading(false);
      }, 1500);
    }
  };

  // Handle view simulation
  const handleViewSimulation = (simulationId: string) => {
    setSelectedSimulationId(simulationId);
    setActiveTab(2);
  };

  // Handle compare simulations
  const handleCompareSimulations = (comparisonId: string) => {
    setSelectedComparisonId(comparisonId);
    setActiveTab(2);
  };

  // Handle new simulation
  const handleNewSimulation = () => {
    console.log('Creating new Vietnam simulation');
  };

  // Determine optimal content rendering based on network
  const getOptimalTableRows = () => {
    if (connection.saveData || connection.type === 'slow-2g') return 3;
    if (connection.type === '2g') return 5;
    if (connection.type === '3g') return 10;
    return 15;
  };

  // Format date for better UI
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch (e) {
      return dateString;
    }
  };

  // Get impact chip style
  const getImpactChip = (impact: number) => {
    if (impact > 7) {
      return (
        <StyledChip variant="error">
          <AlertCircle size={12} />
          High ({impact}/10)
        </StyledChip>
      );
    } else if (impact > 4) {
      return (
        <StyledChip variant="warning">
          <Clock size={12} />
          Medium ({impact}/10)
        </StyledChip>
      );
    } else {
      return (
        <StyledChip variant="success">
          <CheckCircle size={12} />
          Low ({impact}/10)
        </StyledChip>
      );
    }
  };

  // Get trend indicator
  const getTrendIndicator = (value: number) => {
    if (value > 0) {
      return (
        <Box component="span" sx={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: 0.5, 
          color: 'rgb(var(--scb-american-green))'
        }}>
          <ArrowUp size={14} />
          +{value.toFixed(1)}%
        </Box>
      );
    } else if (value < 0) {
      return (
        <Box component="span" sx={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: 0.5, 
          color: 'rgb(var(--scb-muted-red))'
        }}>
          <ArrowDown size={14} />
          {value.toFixed(1)}%
        </Box>
      );
    }
    return null;
  };

  return (
    <Box className="fiori-tile-container">
      {/* Network Status Badge */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight="medium" color="rgb(var(--scb-dark-gray))">
          Vietnam Tariff Analysis
        </Typography>
        <NetworkStatusBadge 
          status={connection.type} 
          saveData={connection.saveData}
        />
      </Box>
      
      <Box sx={{ borderBottom: 1, borderColor: 'rgb(var(--scb-border))', mb: 3 }}>
        <StyledTabs 
          value={activeTab} 
          onChange={handleTabChange}
          variant={isMobile ? 'scrollable' : 'standard'}
          scrollButtons="auto"
          aria-label="Vietnam tariff dashboard tabs"
        >
          <StyledTab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Globe size={18} />
                Overview
              </Box>
            }
          />
          <StyledTab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <BarChart2 size={18} />
                Simulation History
              </Box>
            }
          />
          <StyledTab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingUp size={18} />
                AI Insights
              </Box>
            }
          />
        </StyledTabs>
      </Box>

      {/* Overview Tab */}
      {activeTab === 0 && (
        <Box>
          <Grid container spacing={isMobile ? 2 : 3}>
            <Grid item xs={12}>
              <StyledCard>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <div className="w-8 h-8 rounded-full bg-[rgba(var(--scb-honolulu-blue),0.1)] flex items-center justify-center">
                      <Flag className="w-4 h-4 text-[rgb(var(--scb-honolulu-blue))]" />
                    </div>
                    <Typography variant="h6" color="rgb(var(--scb-dark-gray))">
                      Vietnam Tariff Impact Analysis
                    </Typography>
                  </Box>

                  <Typography variant="body2" color="rgb(var(--scb-dark-gray))" sx={{ mb: 3 }}>
                    {connection.saveData 
                      ? 'Data-optimized view of tariff impacts'
                      : 'Comprehensive analysis of tariff impacts on Vietnamese trade with Monte Carlo simulations and AI-enhanced predictions.'}
                  </Typography>
                  
                  <Divider sx={{ mb: 3, borderColor: 'rgb(var(--scb-border))' }} />
                  
                  {/* Recent Alerts - Network Aware with SCB Styling */}
                  <Box className="fiori-tile" sx={{ mb: 3, p: 0, border: 'none' }}>
                    <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Typography variant="subtitle1" color="rgb(var(--scb-dark-gray))" fontWeight="medium">
                        Recent Tariff Alerts
                      </Typography>
                      <StyledChip variant="info">
                        <Database size={12} />
                        Live Data
                      </StyledChip>
                    </Box>
                    
                    <NetworkAwareDataLoader
                      fetchFunction={fetchTariffAlerts}
                      itemsPerPage={getOptimalTableRows()}
                      totalItems={mockVietnamTariffAlerts.length}
                    >
                      {(alerts, loading, error) => (
                        <>
                          {loading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                              <EnhancedLoadingSpinner message="Loading tariff alerts..." />
                            </Box>
                          ) : error ? (
                            <StyledAlert severity="error" sx={{ m: 2 }}>
                              {error}
                            </StyledAlert>
                          ) : (
                            <TableContainer component={Paper} sx={{ boxShadow: 'none', border: 'none' }}>
                              <Table size={isMobile ? 'small' : 'medium'}>
                                <StyledTableHead>
                                  <TableRow>
                                    <TableCell>Alert</TableCell>
                                    {!isMobile && <TableCell>Impact</TableCell>}
                                    <TableCell>Date</TableCell>
                                    {loadHeavyContent && !isMobile && <TableCell>Confidence</TableCell>}
                                  </TableRow>
                                </StyledTableHead>
                                <TableBody>
                                  {alerts.map((alert: any) => (
                                    <TableRow key={alert.id} sx={{ 
                                      '&:hover': { 
                                        backgroundColor: 'rgba(var(--scb-honolulu-blue), 0.05)' 
                                      }
                                    }}>
                                      <TableCell>
                                        <Box>
                                          <Typography variant="body2" fontWeight="medium" color="rgb(var(--scb-dark-gray))">
                                            {alert.title}
                                          </Typography>
                                          {!isMobile && (
                                            <Typography variant="caption" color="rgb(var(--scb-dark-gray))" sx={{ opacity: 0.7 }}>
                                              {alert.sourceName}
                                            </Typography>
                                          )}
                                          {isMobile && getImpactChip(alert.impactSeverity)}
                                        </Box>
                                      </TableCell>
                                      {!isMobile && (
                                        <TableCell>
                                          {getImpactChip(alert.impactSeverity)}
                                        </TableCell>
                                      )}
                                      <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                          <Calendar size={14} className="text-[rgb(var(--scb-dark-gray))]" />
                                          <Typography variant="caption" color="rgb(var(--scb-dark-gray))">
                                            {formatDate(alert.publishDate)}
                                          </Typography>
                                        </Box>
                                      </TableCell>
                                      {loadHeavyContent && !isMobile && (
                                        <TableCell>
                                          <StyledChip variant={alert.confidence > 0.8 ? 'success' : alert.confidence > 0.6 ? 'info' : 'warning'}>
                                            {Math.round(alert.confidence * 100)}%
                                          </StyledChip>
                                        </TableCell>
                                      )}
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </TableContainer>
                          )}
                        </>
                      )}
                    </NetworkAwareDataLoader>
                  </Box>

                  {/* AI Predictions Summary - Only for good connections */}
                  {loadHeavyContent && (
                    <Box className="fiori-tile" sx={{ p: 0, border: 'none' }}>
                      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography variant="subtitle1" color="rgb(var(--scb-dark-gray))" fontWeight="medium">
                          AI-Enhanced Tariff Predictions
                        </Typography>
                        <StyledChip variant="info">
                          <Zap size={12} />
                          AI-Powered
                        </StyledChip>
                      </Box>
                      
                      <Grid container spacing={2} sx={{ px: 2, pb: 2 }}>
                        {Array.isArray(vietnamAiPredictions?.predictions) && vietnamAiPredictions.predictions.slice(0, 3).map((prediction, index) => (
                          <Grid item xs={12} sm={6} md={4} key={index}>
                            <StyledPaper sx={{ p: 2 }}>
                              <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                                <Typography variant="subtitle2" color="rgb(var(--scb-dark-gray))" fontWeight="medium">
                                  {prediction.category}
                                </Typography>
                                <StyledChip variant={
                                  prediction.confidence > 0.8 ? 'success' :
                                  prediction.confidence > 0.6 ? 'info' : 'warning'
                                }>
                                  {Math.round(prediction.confidence * 100)}%
                                </StyledChip>
                              </Box>
                              
                              <Box sx={{ mb: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                                  <Typography variant="body2" color="rgb(var(--scb-dark-gray))">
                                    Current: <span className="font-medium">{prediction.currentTariff}%</span>
                                  </Typography>
                                  <ArrowRight size={14} className="text-[rgb(var(--scb-dark-gray))]" />
                                  <Typography 
                                    variant="body2" 
                                    fontWeight="medium"
                                    color={prediction.predictedTariff < prediction.currentTariff 
                                      ? 'rgb(var(--scb-american-green))' 
                                      : 'rgb(var(--scb-muted-red))'}
                                  >
                                    {prediction.predictedTariff}%
                                  </Typography>
                                </Box>
                                
                                <Typography 
                                  variant="caption" 
                                  color={prediction.predictedTariff < prediction.currentTariff 
                                    ? 'rgb(var(--scb-american-green))' 
                                    : 'rgb(var(--scb-muted-red))'}
                                  sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                                >
                                  {prediction.predictedTariff < prediction.currentTariff ? (
                                    <ArrowDown size={12} />
                                  ) : (
                                    <ArrowUp size={12} />
                                  )}
                                  {Math.abs(prediction.predictedTariff - prediction.currentTariff).toFixed(1)}% change
                                </Typography>
                              </Box>
                              
                              <Divider sx={{ my: 1, borderColor: 'rgba(var(--scb-border), 0.5)' }} />
                              
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                                <Typography variant="caption" color="rgb(var(--scb-dark-gray))" sx={{ opacity: 0.7 }}>
                                  {prediction.timeframe}
                                </Typography>
                                <Typography variant="caption" color="rgb(var(--scb-dark-gray))" sx={{ opacity: 0.7 }}>
                                  {prediction.impactLevel} impact
                                </Typography>
                              </Box>
                            </StyledPaper>
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  )}
                </CardContent>
              </StyledCard>
            </Grid>

            {/* Quick Actions - Responsive */}
            <Grid item xs={12} md={capabilities.tier === 'low' ? 12 : 6}>
              <StyledCard>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                    <div className="w-8 h-8 rounded-full bg-[rgba(var(--scb-american-green),0.1)] flex items-center justify-center">
                      <Zap className="w-4 h-4 text-[rgb(var(--scb-american-green))]" />
                    </div>
                    <Typography variant="h6" color="rgb(var(--scb-dark-gray))">
                      Quick Actions
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <StyledButton
                      variant="contained"
                      fullWidth
                      onClick={handleNewSimulation}
                      startIcon={<BarChart2 size={18} />}
                      disabled={connection.type === 'offline'}
                      className="fiori-btn-primary"
                    >
                      New Simulation
                    </StyledButton>
                    <StyledButton
                      variant="outlined"
                      fullWidth
                      startIcon={<TrendingUp size={18} />}
                      onClick={() => setActiveTab(2)}
                      disabled={connection.type === 'offline'}
                      className="fiori-btn-secondary"
                    >
                      View Analysis
                    </StyledButton>
                    
                    <StyledButton
                      variant="outlined"
                      fullWidth
                      startIcon={<Bookmark size={18} />}
                      onClick={() => setActiveTab(1)}
                      disabled={connection.type === 'offline'}
                      className="fiori-btn-secondary"
                    >
                      Saved Simulations
                    </StyledButton>
                  </Box>
                </CardContent>
              </StyledCard>
            </Grid>

            {/* Trade Correlations - Only for fast connections */}
            {loadHeavyContent && capabilities.tier !== 'low' && (
              <Grid item xs={12} md={6}>
                <StyledCard>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                      <div className="w-8 h-8 rounded-full bg-[rgba(var(--scb-honolulu-blue),0.1)] flex items-center justify-center">
                        <TrendingUp className="w-4 h-4 text-[rgb(var(--scb-honolulu-blue))]" />
                      </div>
                      <Typography variant="h6" color="rgb(var(--scb-dark-gray))">
                        Trade Correlations
                      </Typography>
                    </Box>
                    
                    <TableContainer>
                      <Table size="small">
                        <StyledTableHead>
                          <TableRow>
                            <TableCell>Products</TableCell>
                            <TableCell>Correlation</TableCell>
                            <TableCell align="right">Change</TableCell>
                          </TableRow>
                        </StyledTableHead>
                        <TableBody>
                          {Array.isArray(vietnamTradeCorrelations?.influences) && vietnamTradeCorrelations.influences.slice(0, 4).map((correlation, index) => (
                            <TableRow key={index} sx={{ 
                              '&:hover': { 
                                backgroundColor: 'rgba(var(--scb-honolulu-blue), 0.05)' 
                              }
                            }}>
                              <TableCell>
                                <Typography variant="body2" color="rgb(var(--scb-dark-gray))">
                                  {correlation.productA} ↔ {correlation.productB}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <StyledChip 
                                  variant={
                                    correlation.correlationScore > 0.7 ? 'success' :
                                    correlation.correlationScore > 0.5 ? 'info' : 'warning'
                                  }
                                >
                                  {correlation.correlationScore.toFixed(2)}
                                </StyledChip>
                              </TableCell>
                              <TableCell align="right">
                                {getTrendIndicator(correlation.monthlyChange || 0)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                    
                    <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
                      <StyledButton
                        variant="text"
                        size="small"
                        className="fiori-btn-ghost"
                        endIcon={<ChevronRight size={16} />}
                        onClick={() => setActiveTab(2)}
                      >
                        View All Correlations
                      </StyledButton>
                    </Box>
                  </CardContent>
                </StyledCard>
              </Grid>
            )}
            
            {/* Financial Impact - Only for fast connections */}
            {loadHeavyContent && (
              <Grid item xs={12}>
                <StyledCard>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                      <div className="w-8 h-8 rounded-full bg-[rgba(var(--scb-american-green),0.1)] flex items-center justify-center">
                        <DollarSign className="w-4 h-4 text-[rgb(var(--scb-american-green))]" />
                      </div>
                      <Typography variant="h6" color="rgb(var(--scb-dark-gray))">
                        Financial Impact Summary
                      </Typography>
                    </Box>
                    
                    <Grid container spacing={3}>
                      {[
                        { label: 'Estimated Annual Savings', value: '$1.28M', change: 3.4, icon: <TrendingUp size={16} /> },
                        { label: 'Average Tariff Reduction', value: '4.2%', change: 1.2, icon: <ArrowDown size={16} /> },
                        { label: 'Potential New Opportunities', value: '9', change: 5.1, icon: <Zap size={16} /> },
                        { label: 'Risk Exposure Level', value: 'Medium', change: -1.5, icon: <Shield size={16} /> }
                      ].map((item, index) => (
                        <Grid item xs={12} sm={6} md={3} key={index}>
                          <StyledPaper sx={{ p: 2 }}>
                            <Typography variant="body2" color="rgb(var(--scb-dark-gray))" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                              {item.icon}
                              {item.label}
                            </Typography>
                            <Typography variant="h5" fontWeight="medium" color="rgb(var(--scb-dark-gray))">
                              {item.value}
                            </Typography>
                            <Box sx={{ mt: 1 }}>
                              {getTrendIndicator(item.change)}
                            </Box>
                          </StyledPaper>
                        </Grid>
                      ))}
                    </Grid>
                  </CardContent>
                </StyledCard>
              </Grid>
            )}
          </Grid>
        </Box>
      )}

      {/* History Tab */}
      {activeTab === 1 && (
        <VietnamMonteCarloHistory 
          onViewSimulation={handleViewSimulation}
          onCompare={(ids) => handleCompareSimulations(ids[0])}
          onNewSimulation={handleNewSimulation}
        />
      )}

      {/* AI Insights Tab - Progressive Loading */}
      {activeTab === 2 && (
        <Box>
          {llmLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
              <EnhancedLoadingSpinner message="Loading AI insights and analysis..." />
            </Box>
          ) : connection.type === 'offline' ? (
            <StyledAlert severity="warning" sx={{ mb: 3 }}>
              You are offline. Please check your internet connection to view AI insights.
            </StyledAlert>
          ) : (
            <VietnamMonteCarloLlmAnalysis 
              analysis={llmAnalysis}
              onGenerateReport={() => console.log('Generate report')}
              onViewDetailedAnalysis={() => console.log('View detailed analysis')}
            />
          )}
          
          {selectedSimulationId && !llmLoading && (
            <StyledCard sx={{ mt: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <div className="w-8 h-8 rounded-full bg-[rgba(var(--scb-honolulu-blue),0.1)] flex items-center justify-center">
                    <FileText className="w-4 h-4 text-[rgb(var(--scb-honolulu-blue))]" />
                  </div>
                  <Typography variant="h6" color="rgb(var(--scb-dark-gray))">
                    Selected Simulation Details
                  </Typography>
                </Box>
                
                <Box sx={{ p: 2, backgroundColor: 'rgba(var(--scb-light-gray), 0.3)', borderRadius: '0.25rem', mb: 2 }}>
                  <Typography variant="body2" color="rgb(var(--scb-dark-gray))" fontWeight="medium">
                    Simulation ID: <span className="font-mono">{selectedSimulationId}</span>
                  </Typography>
                </Box>
                
                <Typography variant="body2" color="rgb(var(--scb-dark-gray))">
                  View the simulation details and analysis results. This simulation was run with the latest tariff data and includes detailed AI-powered insights.
                </Typography>
                
                <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                  <StyledButton
                    variant="outlined"
                    startIcon={<FileText size={18} />}
                    onClick={() => console.log('Export simulation')}
                    className="fiori-btn-secondary"
                  >
                    Export Report
                  </StyledButton>
                  <StyledButton
                    variant="contained"
                    startIcon={<TrendingUp size={18} />}
                    onClick={() => console.log('View detailed analysis')}
                    className="fiori-btn-primary"
                  >
                    View Analysis
                  </StyledButton>
                </Box>
              </CardContent>
            </StyledCard>
          )}
        </Box>
      )}
    </Box>
  );
};

export default VietnamTariffDashboard;