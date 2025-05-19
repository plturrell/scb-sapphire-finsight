import React, { useState, useEffect } from 'react';
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
  CircularProgress,
  Alert,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  Tab,
  Tabs
} from '@mui/material';
import {
  Globe,
  BarChart2,
  TrendingUp,
  Flag,
  AlertCircle,
  ChevronRight
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
import { useNetworkAwareLoading, useAdaptiveFetch } from '@/hooks/useNetworkAwareLoading';
import { useDeviceCapabilities } from '@/hooks/useDeviceCapabilities';

/**
 * Vietnam Tariff Dashboard Component - Network Enhanced
 * Comprehensive dashboard with network-aware loading strategies
 */
const VietnamTariffDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedSimulationId, setSelectedSimulationId] = useState<string | null>(null);
  const [selectedComparisonId, setSelectedComparisonId] = useState<string | null>(null);
  
  // Network awareness hooks
  const { connection, strategy } = useNetworkAwareLoading();
  const capabilities = useDeviceCapabilities();
  
  // Determine if we should load heavy visualizations
  const loadHeavyContent = connection.type !== '2g' && 
                          connection.type !== 'slow-2g' && 
                          !connection.saveData;

  // Use adaptive fetching for AI analysis
  const { data: llmAnalysis, loading: llmLoading } = useAdaptiveFetch<any>(
    '/api/vietnam-tariff/llm-analysis'
  );

  // Mock data fetch function for network-aware loader
  const fetchTariffAlerts = async (offset: number, limit: number) => {
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
    return mockVietnamTariffAlerts.slice(offset, offset + limit);
  };

  // Handle tab changes
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
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

  // Render network status indicator
  const NetworkStatus = () => (
    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 2 }}>
      <Chip 
        label={`${connection.type.toUpperCase()}`} 
        color={connection.type === 'wifi' || connection.type === '4g' ? 'success' : 'warning'}
        size="small"
      />
      {connection.saveData && (
        <Chip label="Data Saver" color="info" size="small" />
      )}
      {capabilities.tier === 'low' && (
        <Chip label="Low-End Device" color="warning" size="small" />
      )}
    </Box>
  );

  return (
    <Box>
      <NetworkStatus />
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          variant={capabilities.screenSize === 'mobile' ? 'scrollable' : 'standard'}
          scrollButtons="auto"
          sx={{ 
            '& .MuiTab-root': { 
              textTransform: 'none',
              fontWeight: 'medium',
              fontSize: capabilities.screenSize === 'mobile' ? '0.875rem' : '0.95rem',
              minHeight: 48,
            },
            '& .Mui-selected': {
              color: '#042278',
              fontWeight: 'bold',
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#31ddc1',
              height: 3,
            }
          }}
        >
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Globe size={18} style={{ marginRight: '8px' }} />
                Overview
              </Box>
            }
          />
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <BarChart2 size={18} style={{ marginRight: '8px' }} />
                History
              </Box>
            }
          />
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <TrendingUp size={18} style={{ marginRight: '8px' }} />
                Insights
              </Box>
            }
          />
        </Tabs>
      </Box>

      {/* Overview Tab */}
      {activeTab === 0 && (
        <Box>
          <Grid container spacing={capabilities.screenSize === 'mobile' ? 2 : 3}>
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <Flag size={18} style={{ marginRight: '8px' }} />
                    Vietnam Tariff Impact Analysis
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    {connection.saveData 
                      ? 'Data-optimized view of tariff impacts'
                      : 'Comprehensive analysis of tariff impacts on Vietnamese trade with Monte Carlo simulations and AI-enhanced predictions.'}
                  </Typography>
                  
                  <Divider sx={{ mb: 3 }} />
                  
                  {/* Recent Alerts - Network Aware */}
                  <Typography variant="subtitle1" gutterBottom>
                    Recent Tariff Alerts
                  </Typography>
                  
                  <NetworkAwareDataLoader
                    fetchFunction={fetchTariffAlerts}
                    itemsPerPage={getOptimalTableRows()}
                    totalItems={mockVietnamTariffAlerts.length}
                  >
                    {(alerts, loading, error) => (
                      <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
                        <Table size={capabilities.screenSize === 'mobile' ? 'small' : 'medium'}>
                          <TableHead>
                            <TableRow>
                              <TableCell>Alert</TableCell>
                              {capabilities.tier !== 'low' && <TableCell>Impact</TableCell>}
                              <TableCell>Date</TableCell>
                              {loadHeavyContent && <TableCell>Confidence</TableCell>}
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {alerts.map((alert: any) => (
                              <TableRow key={alert.id}>
                                <TableCell>
                                  <Typography variant="body2">{alert.title}</Typography>
                                  {capabilities.screenSize !== 'mobile' && (
                                    <Typography variant="caption" color="text.secondary">
                                      {alert.sourceName}
                                    </Typography>
                                  )}
                                </TableCell>
                                {capabilities.tier !== 'low' && (
                                  <TableCell>
                                    <Chip
                                      label={`${alert.impactSeverity}/10`}
                                      size="small"
                                      color={alert.impactSeverity > 7 ? 'error' : 
                                             alert.impactSeverity > 4 ? 'warning' : 'success'}
                                    />
                                  </TableCell>
                                )}
                                <TableCell>
                                  <Typography variant="caption">
                                    {new Date(alert.createdAt).toLocaleDateString()}
                                  </Typography>
                                </TableCell>
                                {loadHeavyContent && (
                                  <TableCell>
                                    <Typography variant="caption">
                                      {(alert.confidence * 100).toFixed(0)}%
                                    </Typography>
                                  </TableCell>
                                )}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    )}
                  </NetworkAwareDataLoader>

                  {/* AI Predictions Summary - Only for good connections */}
                  {loadHeavyContent && (
                    <>
                      <Typography variant="subtitle1" gutterBottom>
                        AI Predictions Summary
                      </Typography>
                      
                      <Grid container spacing={2}>
                        {vietnamAiPredictions.slice(0, 3).map((prediction, index) => (
                          <Grid item xs={12} md={4} key={index}>
                            <Paper 
                              variant="outlined" 
                              sx={{ 
                                p: 2, 
                                height: '100%',
                                backgroundColor: index === 0 ? '#f8f9fa' : 'transparent'
                              }}
                            >
                              <Typography variant="body2" fontWeight="medium" gutterBottom>
                                {prediction.sector}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Tariff reduction: {(prediction.probabilityOfTariffReduction * 100).toFixed(0)}%
                              </Typography>
                              <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                                Impact: {prediction.estimatedImpact}
                              </Typography>
                              <Typography variant="caption" display="block">
                                Timeframe: {prediction.timeframe}
                              </Typography>
                            </Paper>
                          </Grid>
                        ))}
                      </Grid>
                    </>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Quick Actions - Responsive */}
            <Grid item xs={12} md={capabilities.tier === 'low' ? 12 : 6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Quick Actions
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Button
                      variant="contained"
                      fullWidth
                      onClick={handleNewSimulation}
                      startIcon={<BarChart2 size={18} />}
                      disabled={connection.type === 'offline'}
                    >
                      New Simulation
                    </Button>
                    <Button
                      variant="outlined"
                      fullWidth
                      startIcon={<TrendingUp size={18} />}
                      onClick={() => setActiveTab(2)}
                      disabled={connection.type === 'offline'}
                    >
                      View Analysis
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Trade Correlations - Only for fast connections */}
            {loadHeavyContent && capabilities.tier !== 'low' && (
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Trade Correlations
                    </Typography>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Products</TableCell>
                            <TableCell align="right">Correlation</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {vietnamTradeCorrelations.slice(0, 4).map((correlation, index) => (
                            <TableRow key={index}>
                              <TableCell>{correlation.productA} ↔ {correlation.productB}</TableCell>
                              <TableCell align="right">
                                <Typography
                                  variant="body2"
                                  color={correlation.correlationScore > 0.7 ? 'success.main' :
                                         correlation.correlationScore > 0.5 ? 'warning.main' : 'text.secondary'}
                                >
                                  {correlation.correlationScore.toFixed(2)}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>
        </Box>
      )}

      {/* History Tab */}
      {activeTab === 1 && (
        <VietnamMonteCarloHistory 
          onViewSimulation={handleViewSimulation}
          onCompareSimulations={handleCompareSimulations}
          fullAccess={loadHeavyContent}
        />
      )}

      {/* AI Insights Tab - Progressive Loading */}
      {activeTab === 2 && (
        <Box>
          {llmLoading ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
              <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                Loading AI insights...
              </Typography>
            </Box>
          ) : connection.type === 'offline' ? (
            <Alert severity="warning">
              You are offline. Please check your internet connection to view AI insights.
            </Alert>
          ) : (
            <VietnamMonteCarloLlmAnalysis 
              simulationId={selectedSimulationId} 
              comparisonId={selectedComparisonId}
              reducedMode={!loadHeavyContent}
            />
          )}
        </Box>
      )}
    </Box>
  );
};

export default VietnamTariffDashboard;