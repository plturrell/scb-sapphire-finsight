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

/**
 * Vietnam Tariff Dashboard Component
 * Comprehensive dashboard for Vietnam tariff analysis with AI insights and Monte Carlo simulations
 * Following SAP Fiori Horizon design principles with SCB branding
 */
const VietnamTariffDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedSimulationId, setSelectedSimulationId] = useState<string | null>(null);
  const [selectedComparisonId, setSelectedComparisonId] = useState<string | null>(null);
  
  // Mock LLM analysis state - would be fetched from API in production
  const [llmAnalysis, setLlmAnalysis] = useState<any>({
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
  });

  // Handle tab changes
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // Handle view simulation
  const handleViewSimulation = (simulationId: string) => {
    setSelectedSimulationId(simulationId);
    setActiveTab(2); // Switch to Analysis tab
  };

  // Handle compare simulations
  const handleCompareSimulations = (comparisonId: string) => {
    setSelectedComparisonId(comparisonId);
    setActiveTab(2); // Switch to Analysis tab
  };

  // Handle new simulation
  const handleNewSimulation = () => {
    console.log('Creating new Vietnam simulation');
    // Logic to start new simulation
  };

  return (
    <Box>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ 
            '& .MuiTab-root': { 
              textTransform: 'none',
              fontWeight: 'medium',
              fontSize: '0.95rem',
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
                Simulation History
              </Box>
            }
          />
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <TrendingUp size={18} style={{ marginRight: '8px' }} />
                AI Insights
              </Box>
            }
          />
        </Tabs>
      </Box>

      {/* Overview Tab */}
      {activeTab === 0 && (
        <Box>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <Flag size={18} style={{ marginRight: '8px' }} />
                    Vietnam Tariff Impact Analysis
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    Comprehensive analysis of tariff impacts on Vietnamese trade with Monte Carlo simulations and AI-enhanced predictions.
                  </Typography>
                  
                  <Divider sx={{ mb: 3 }} />
                  
                  {/* Recent Alerts */}
                  <Typography variant="subtitle1" gutterBottom>
                    Recent Tariff Alerts
                  </Typography>
                  
                  <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
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
                        {mockVietnamTariffAlerts.slice(0, 3).map((alert) => (
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
                            <TableCell>{new Date(alert.publishDate).toLocaleDateString()}</TableCell>
                            <TableCell>{Math.round(alert.confidence * 100)}%</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  
                  {/* AI Predictions Summary */}
                  <Typography variant="subtitle1" gutterBottom>
                    AI-Enhanced Tariff Predictions
                  </Typography>
                  
                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    {vietnamAiPredictions.predictions.slice(0, 3).map((prediction, idx) => (
                      <Grid item xs={12} sm={6} md={4} key={idx}>
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
                            {prediction.category}
                            <Chip 
                              size="small" 
                              label={`${Math.round(prediction.confidence * 100)}%`}
                              color="primary"
                              variant="outlined"
                            />
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <Typography variant="body2">
                              Current: <strong>{prediction.currentTariff}%</strong>
                            </Typography>
                            <Typography variant="body2" sx={{ mx: 1 }}>
                              → 
                            </Typography>
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                fontWeight: 'bold', 
                                color: prediction.predictedTariff < prediction.currentTariff ? 'success.main' : 'error.main'
                              }}
                            >
                              {prediction.predictedTariff}%
                            </Typography>
                          </Box>
                          <Typography variant="caption" color="text.secondary">
                            {prediction.timeframe} | {prediction.impactLevel} impact
                          </Typography>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                  
                  <Button 
                    variant="outlined" 
                    size="small"
                    endIcon={<ChevronRight size={16} />}
                    onClick={() => setActiveTab(2)}
                    sx={{ mt: 1 }}
                  >
                    View AI Insights
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Simulation History Tab */}
      {activeTab === 1 && (
        <VietnamMonteCarloHistory 
          onViewSimulation={handleViewSimulation}
          onCompare={handleCompareSimulations}
          onNewSimulation={handleNewSimulation}
        />
      )}

      {/* AI Insights Tab */}
      {activeTab === 2 && (
        <Box>
          <VietnamMonteCarloLlmAnalysis 
            analysis={llmAnalysis}
            onGenerateReport={() => console.log('Generating report')}
            onViewDetailedAnalysis={() => console.log('Viewing detailed analysis')}
          />
          
          {selectedSimulationId && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Selected Simulation Details
                </Typography>
                <Typography variant="body2">
                  Simulation ID: {selectedSimulationId}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  View the simulation details and analysis results
                </Typography>
              </CardContent>
            </Card>
          )}
        </Box>
      )}
    </Box>
  );
};

export default VietnamTariffDashboard;
