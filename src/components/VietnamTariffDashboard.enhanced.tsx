import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Tabs,
  Tab,
  Table,
  TableContainer,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Divider,
  Chip,
  IconButton,
  Tooltip,
  alpha,
  useTheme
} from '@mui/material';
import { useSpring, animated, config } from '@react-spring/web';
import { useDeviceCapabilities } from '../hooks/useDeviceCapabilities';
import { useNetworkAwareLoading } from '../hooks/useNetworkAwareLoading';
import { 
  FlagIcon, 
  ArrowIcon, 
  SparklesIcon, 
  ChartIcon, 
  DataIcon, 
  FinanceIcon,
  ChevronIcon
} from './icons';
import EnhancedFinanceCard from './cards/EnhancedFinanceCard';
import VietnamMonteCarloHistory from './VietnamMonteCarloHistory';
import VietnamMonteCarloParams from './VietnamMonteCarloParams';
import VietnamMonteCarloCaseAnalysis from './VietnamMonteCarloCaseAnalysis';
import VietnamMonteCarloLlmAnalysis from './VietnamMonteCarloLlmAnalysis';
import VietnamMonteCarloProbabilityDistribution from './VietnamMonteCarloProbabilityDistribution';
import VietnamMonteCarloSensitivity from './VietnamMonteCarloSensitivity';
import EnhancedMonteCarloSimulation from './EnhancedMonteCarloSimulation';
import EnhancedSankeyDiagram from './EnhancedSankeyDiagram';
import PerplexityParticles from './effects/PerplexityParticles';
import SCBrandedLogo from './SCBrandedLogo';
import useEnhancedMicroInteractions from '../hooks/useEnhancedMicroInteractions';

// Simple component for tab content with transitions
const EnhancedTabContent = ({ 
  children, 
  index, 
  activeTab, 
  reduceAnimations = false 
}) => {
  if (activeTab !== index) return null;
  
  return (
    <Box sx={{ 
      mt: 2,
      animation: reduceAnimations ? 'none' : 'fadeIn 0.3s',
      '@keyframes fadeIn': {
        '0%': {
          opacity: 0,
          transform: 'translateY(10px)'
        },
        '100%': {
          opacity: 1,
          transform: 'translateY(0)'
        }
      }
    }}>
      {children}
    </Box>
  );
};

// Simple page transition component
const PageTransition = ({ children, appear = true }) => {
  return (
    <Box sx={{ 
      animation: appear ? 'fadeIn 0.4s' : 'none',
      '@keyframes fadeIn': {
        '0%': {
          opacity: 0,
          transform: 'translateY(10px)'
        },
        '100%': {
          opacity: 1,
          transform: 'translateY(0)'
        }
      }
    }}>
      {children}
    </Box>
  );
};

// Standard colors for the application
const PRIMARY_COLOR = '#042278';
const ACCENT_COLOR = '#31ddc1';
const INFO_COLOR = '#2196f3';
const WARNING_COLOR = '#ed6c02';
const ERROR_COLOR = '#d32f2f';
const SUCCESS_COLOR = '#2e7d32';

const VietnamTariffDashboard = () => {
  const theme = useTheme();
  const capabilities = useDeviceCapabilities();
  const networkStatus = useNetworkAwareLoading();
  const { FadeIn, SlideUp } = useEnhancedMicroInteractions();
  
  const [activeTab, setActiveTab] = useState(0);
  const [activeVisualization, setActiveVisualization] = useState<'default' | 'enhanced' | 'flow'>('default');
  const [simulationData, setSimulationData] = useState(null);
  const [llmAnalysis, setLlmAnalysis] = useState(null);
  const [reduceAnimations, setReduceAnimations] = useState(networkStatus === 'slow');
  const [isSimulationActive, setIsSimulationActive] = useState(false);
  const [showParticles, setShowParticles] = useState(networkStatus !== 'slow');
  const [hasRunSimulation, setHasRunSimulation] = useState(false);
  
  // Sankey diagram data
  const [flowData, setFlowData] = useState({
    nodes: [
      { name: "Agricultural Products", category: "source", value: 10 },
      { name: "Electronics", category: "source", value: 20 },
      { name: "Textiles", category: "source", value: 15 },
      { name: "EU", category: "destination", value: 20 },
      { name: "ASEAN", category: "destination", value: 15 },
      { name: "United States", category: "destination", value: 10 }
    ],
    links: [
      { source: 0, target: 3, value: 5 },
      { source: 0, target: 4, value: 3 },
      { source: 0, target: 5, value: 2 },
      { source: 1, target: 3, value: 8 },
      { source: 1, target: 4, value: 7 },
      { source: 1, target: 5, value: 5 },
      { source: 2, target: 3, value: 7 },
      { source: 2, target: 4, value: 5 },
      { source: 2, target: 5, value: 3 }
    ]
  });
  
  // Node groups for Sankey diagram
  const nodeGroups = [
    { 
      category: "source", 
      label: "Product Categories", 
      color: ACCENT_COLOR,
      description: "Product categories represent the different types of goods exported from Vietnam.",
      nodes: ["Agricultural Products", "Electronics", "Textiles"]
    },
    { 
      category: "destination", 
      label: "Destinations", 
      color: PRIMARY_COLOR,
      description: "Destination markets for Vietnamese exports, showing the flow of goods to different regions.",
      nodes: ["EU", "ASEAN", "United States"]
    }
  ];
  
  // Parameters for Monte Carlo simulation
  const simulationParameters = [
    {
      name: 'baseTariff',
      label: 'Base Tariff Rate',
      value: 5.0,
      min: 0,
      max: 15,
      step: 0.1,
      description: 'The current base tariff rate for this product category',
      impact: 'high',
      unit: '%'
    },
    {
      name: 'ftaImpact',
      label: 'FTA Impact',
      value: -2.5,
      min: -10,
      max: 5,
      step: 0.5,
      description: 'Impact of Free Trade Agreements on the baseline tariff',
      impact: 'high',
      unit: '%'
    },
    {
      name: 'exchangeRate',
      label: 'Currency Fluctuation',
      value: 2.0,
      min: -5,
      max: 5,
      step: 0.5,
      description: 'Expected currency fluctuation as a factor in effective rates',
      impact: 'medium',
      unit: '%'
    },
    {
      name: 'volatility',
      label: 'Policy Volatility',
      value: 30,
      min: 0,
      max: 100,
      step: 5,
      description: 'Expected volatility in trade policy over the forecast period',
      impact: 'medium',
      unit: ''
    },
    {
      name: 'tradeDiversion',
      label: 'Trade Diversion',
      value: 1.5,
      min: -5,
      max: 5,
      step: 0.5,
      description: 'Estimated trade diversion effects on effective tariff rates',
      impact: 'low',
      unit: '%'
    }
  ];
  
  // Handler for tab changes
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  // Toggle visualization mode
  const toggleVisualization = (mode: 'default' | 'enhanced' | 'flow') => {
    setActiveVisualization(mode);
  };
  
  // Handler for simulation completion from EnhancedMonteCarloSimulation
  const handleSimulationComplete = (results) => {
    console.log('Simulation completed with results:', results);
    setHasRunSimulation(true);
    
    // Update flow data based on simulation results
    const updatedFlowData = { ...flowData };
    
    // Adjust node values based on simulation outcome
    updatedFlowData.nodes = updatedFlowData.nodes.map(node => {
      if (node.category === 'source') {
        // Adjust source node values based on simulation outcome
        return {
          ...node,
          value: node.value * (1 + results.outcome / 100) // Apply percentage impact
        };
      }
      return node;
    });
    
    // Adjust link values proportionally
    updatedFlowData.links = updatedFlowData.links.map(link => {
      // Apply different adjustments based on source-destination pairs
      const sourceNode = updatedFlowData.nodes[link.source as number];
      const targetNode = updatedFlowData.nodes[link.target as number];
      
      let adjustmentFactor = 1;
      
      // Apply scenario-specific adjustments
      if (sourceNode.name === 'Electronics' && targetNode.name === 'EU') {
        // Electronics to EU gets the most positive impact from FTAs
        adjustmentFactor = 1 + Math.max(0, results.outcome) / 80;
      } else if (sourceNode.name === 'Agricultural Products' && targetNode.name === 'United States') {
        // Agricultural products to US are most vulnerable to tariff increases
        adjustmentFactor = 1 - Math.abs(Math.min(0, results.outcome)) / 80;
      } else {
        // General adjustment based on outcome direction
        adjustmentFactor = 1 + results.outcome / 200;
      }
      
      return {
        ...link,
        value: Math.max(1, link.value * adjustmentFactor) // Ensure minimum value of 1
      };
    });
    
    setFlowData(updatedFlowData);
    
    // Prepare LLM analysis data
    const analysisData = {
      insights: [
        `The analysis indicates a ${results.outcome > 0 ? 'positive' : 'negative'} ${Math.abs(results.outcome).toFixed(1)}% impact on Vietnamese tariff trade flows.`,
        `${results.tradeImpacts.exports > 0 ? 'Increased' : 'Decreased'} export potential by ${Math.abs(results.tradeImpacts.exports).toFixed(1)}% across key markets.`,
        `Supply chain resilience ${results.outcome > 0 ? 'improved' : 'decreased'} with ${Math.abs(results.outcome).toFixed(1)}% overall trade impact.`,
        ...results.insights.slice(0, 2)
      ],
      recommendations: [
        "Optimize product classification for preferential duty rates.",
        "Diversify supply chain through multiple ASEAN partners.",
        "Implement tariff management tools for optimizing duty planning.",
        "Develop sourcing strategies to minimize duty exposure."
      ]
    };
    
    setLlmAnalysis(analysisData);
    setSimulationData({
      results: {
        statistics: {
          mean: 125000000 * (1 + results.outcome/100),
          median: 122500000 * (1 + results.outcome/100),
          min: 98000000 * (1 + results.outcome/100),
          max: 152000000 * (1 + results.outcome/100),
          standardDeviation: 12000000
        },
        scenarios: {
          pessimistic: { probability: 0.2, meanValue: 105000000 * (1 + results.tradeImpacts.imports/100) },
          realistic: { probability: 0.6, meanValue: 125000000 * (1 + results.outcome/100) },
          optimistic: { probability: 0.2, meanValue: 145000000 * (1 + results.tradeImpacts.exports/100) }
        },
        sensitivity: [
          { parameter: "Tariff Rates", impact: 0.85 },
          { parameter: "Exchange Rate", impact: 0.65 },
          { parameter: "Trade Volume", impact: 0.45 }
        ]
      }
    });
  };
  
  // Handler for starting the legacy simulation
  const handleLegacySimulation = () => {
    console.log('Starting legacy simulation');
    setIsSimulationActive(true);
    
    // Simulate data loading after a delay
    setTimeout(() => {
      setIsSimulationActive(false);
      setHasRunSimulation(true);
      setSimulationData({
        results: {
          statistics: {
            mean: 125000000,
            median: 122500000,
            min: 98000000,
            max: 152000000,
            standardDeviation: 12000000
          },
          scenarios: {
            pessimistic: { probability: 0.2, meanValue: 105000000 },
            realistic: { probability: 0.6, meanValue: 125000000 },
            optimistic: { probability: 0.2, meanValue: 145000000 }
          },
          sensitivity: [
            { parameter: "Tariff Rates", impact: 0.85 },
            { parameter: "Exchange Rate", impact: 0.65 },
            { parameter: "Trade Volume", impact: 0.45 }
          ]
        }
      });
      setLlmAnalysis({
        insights: [
          "The analysis indicates a potential 17% increase in tariff costs for Vietnamese imports.",
          "Supply chain resilience will decrease if alternative sourcing is not established.",
          "Medium-term exchange rate forecasts suggest further cost increases."
        ],
        recommendations: [
          "Consider establishing alternative supply chains through Thailand.",
          "Hedge currency exposure for the next 6-12 months.",
          "Explore tariff classification optimization strategies for electronics components."
        ]
      });
    }, 2000);
  };
  
  // Handler for viewing an existing simulation
  const handleViewSimulation = (id) => {
    console.log(`Viewing simulation ${id}`);
  };
  
  // Handler for comparing simulations
  const handleCompareSimulations = (ids) => {
    console.log(`Comparing simulations ${ids}`);
  };

  return (
    <PageTransition>
      <Box p={capabilities.screenSize === 'mobile' ? 2 : 3}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2
        }}>
          <Box>
            <Typography variant="h4" component="h1" sx={{ 
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              color: PRIMARY_COLOR
            }}>
              <FlagIcon 
                size={32} 
                animation="pulse" 
                color={ACCENT_COLOR} 
                style={{ marginRight: 12 }}
              />
              Vietnam Tariff Impact Analysis
              {networkStatus === 'fast' && (
                <SparklesIcon 
                  size={18} 
                  animation="pulse" 
                  color={ACCENT_COLOR} 
                  style={{ marginLeft: 8 }} 
                />
              )}
            </Typography>
            
            <Typography variant="body1" sx={{ 
              mb: 3, 
              color: 'text.secondary', 
              maxWidth: '800px',
              ml: 5
            }}>
              Enhanced dashboard for analyzing tariff impacts on Vietnam trade relations using Monte Carlo simulations, SAP business data integration, and AI-driven insights.
            </Typography>
          </Box>
          
          {/* Visualization mode selector */}
          <Box component={FadeIn} sx={{ 
            display: 'flex', 
            gap: 1,
            flexWrap: 'wrap',
            justifyContent: 'flex-end'
          }}>
            <Tooltip title="Standard visualization">
              <Chip
                label="Standard"
                icon={<ChartIcon variant="line" size={16} />}
                onClick={() => toggleVisualization('default')}
                color={activeVisualization === 'default' ? 'primary' : 'default'}
                sx={{ 
                  fontWeight: 500,
                  backgroundColor: activeVisualization === 'default' ? alpha(PRIMARY_COLOR, 0.1) : undefined,
                  '& .MuiChip-icon': { 
                    color: activeVisualization === 'default' ? PRIMARY_COLOR : undefined
                  }
                }}
              />
            </Tooltip>
            <Tooltip title="Enhanced Monte Carlo visualization">
              <Chip
                label="Enhanced"
                icon={<SparklesIcon size={16} />}
                onClick={() => toggleVisualization('enhanced')}
                color={activeVisualization === 'enhanced' ? 'primary' : 'default'}
                sx={{ 
                  fontWeight: 500,
                  backgroundColor: activeVisualization === 'enhanced' ? alpha(ACCENT_COLOR, 0.1) : undefined,
                  '& .MuiChip-icon': { 
                    color: activeVisualization === 'enhanced' ? ACCENT_COLOR : undefined
                  }
                }}
              />
            </Tooltip>
            <Tooltip title="Supply chain flow visualization">
              <Chip
                label="Flow"
                icon={<DataIcon variant="sankey" size={16} />}
                onClick={() => toggleVisualization('flow')}
                color={activeVisualization === 'flow' ? 'primary' : 'default'}
                sx={{ 
                  fontWeight: 500,
                  backgroundColor: activeVisualization === 'flow' ? alpha(INFO_COLOR, 0.1) : undefined,
                  '& .MuiChip-icon': { 
                    color: activeVisualization === 'flow' ? INFO_COLOR : undefined
                  }
                }}
              />
            </Tooltip>
            <Tooltip title="Toggle animation effects">
              <IconButton 
                size="small" 
                onClick={() => setShowParticles(!showParticles)}
                sx={{ 
                  border: '1px solid',
                  borderColor: 'divider',
                  backgroundColor: showParticles ? alpha(ACCENT_COLOR, 0.05) : 'transparent',
                  color: showParticles ? ACCENT_COLOR : 'text.secondary'
                }}
              >
                <SparklesIcon size={18} animation={showParticles ? "pulse" : "none"} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        
        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange}
            aria-label="Vietnam tariff analysis tabs"
            variant={capabilities.screenSize === 'mobile' ? 'fullWidth' : 'standard'}
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 500,
                minHeight: '48px'
              },
              '& .Mui-selected': {
                color: PRIMARY_COLOR,
                fontWeight: 600
              },
              '& .MuiTabs-indicator': {
                backgroundColor: PRIMARY_COLOR,
                height: 3
              }
            }}
          >
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <DataIcon variant="chart" size={16} color={PRIMARY_COLOR} style={{ marginRight: 8 }} />
                  Simulation
                </Box>
              }
            />
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <ChartIcon variant="history" size={16} color={PRIMARY_COLOR} style={{ marginRight: 8 }} />
                  History
                </Box>
              }
            />
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <SparklesIcon size={16} color={PRIMARY_COLOR} style={{ marginRight: 8 }} />
                  Insights
                </Box>
              }
            />
          </Tabs>
        </Box>

        {/* Dynamic background for added visual polish */}
        {showParticles && activeVisualization !== 'default' && (
          <Box sx={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            opacity: 0.03, 
            pointerEvents: 'none', 
            zIndex: 0 
          }}>
            <PerplexityParticles 
              height="100%" 
              width="100%" 
              particleCount={20} 
              colorScheme="scb" 
              speed={0.2}
            />
          </Box>
        )}

        {/* Simulation Tab Content */}
        <EnhancedTabContent index={0} activeTab={activeTab} reduceAnimations={reduceAnimations}>
          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <Grid container spacing={capabilities.screenSize === 'mobile' ? 2 : 3} sx={{ width: '100%' }}>
              <Grid sx={{ width: '100%' }}>
                {/* Enhanced branding card */}
                <EnhancedFinanceCard
                  title="Vietnam Tariff Impact Analysis"
                  value={activeVisualization === 'default' ? "Standard Visualization" : 
                         activeVisualization === 'enhanced' ? "Enhanced Monte Carlo" : "Supply Chain Flow"}
                  subtitle="AI-powered analysis with SAP Business Data Cloud integration"
                  icon={<FlagIcon size={28} animation="pulse" variant="default" />}
                  variant="fiori"
                  status={activeVisualization === 'default' ? "info" : 
                          activeVisualization === 'enhanced' ? "success" : "warning"}
                />
              </Grid>
            </Grid>
            
            {/* Visualization Content */}
            {isSimulationActive ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 4 }}>
                <CircularProgress 
                  size={60} 
                  sx={{ color: ACCENT_COLOR }}
                />
                <Typography variant="h6" sx={{ mt: 2 }}>Running Monte Carlo Simulation</Typography>
                <Typography variant="body2" color="text.secondary">
                  Analyzing tariff impacts across multiple scenarios...
                </Typography>
              </Box>
            ) : activeVisualization === 'enhanced' ? (
              // Enhanced Monte Carlo Visualization
              <Box mt={3}>
                <EnhancedMonteCarloSimulation 
                  parameters={simulationParameters}
                  onSimulationComplete={handleSimulationComplete}
                  showParticles={showParticles}
                  highPerformance={networkStatus !== 'slow'}
                  historyMode={hasRunSimulation && !!simulationData}
                  selectedResult={hasRunSimulation && simulationData ? {
                    outcome: (simulationData.results.statistics.mean - 125000000) / 1250000, // Approximate percentage change
                    confidence: 0.85,
                    iterations: 5000,
                    distributionData: Array.from({ length: 41 }, (_, i) => ({
                      x: -10 + i * 0.5,
                      y: Math.exp(-0.5 * Math.pow((-10 + i * 0.5 - (simulationData.results.statistics.mean - 125000000) / 1250000) / 3, 2)) * 100
                    })),
                    status: simulationData.results.statistics.mean > 125000000 ? 'success' : 'error',
                    insights: llmAnalysis ? llmAnalysis.insights : [],
                    tradeImpacts: {
                      imports: (simulationData.results.scenarios.pessimistic.meanValue - 105000000) / 1050000,
                      exports: (simulationData.results.scenarios.optimistic.meanValue - 145000000) / 1450000,
                      balance: (simulationData.results.statistics.mean - 125000000) / 1250000 * 0.4
                    },
                    duration: 3500
                  } : null}
                  mode={llmAnalysis ? 'analysis' : 'standard'}
                  aiEnhanced={true}
                />
              </Box>
            ) : activeVisualization === 'flow' ? (
              // Sankey Flow Visualization
              <Box mt={3}>
                <EnhancedSankeyDiagram 
                  data={flowData}
                  nodeGroups={nodeGroups}
                  width={capabilities.screenSize === 'mobile' ? window.innerWidth - 40 : 1000}
                  height={500}
                  title="Vietnam Trade Flow Analysis"
                  subtitle={hasRunSimulation ? 
                    "Visualization of Vietnam's trade flows with impact adjustments from Monte Carlo simulation" : 
                    "Run a simulation to see how tariff changes affect the trade flows between regions"
                  }
                  aiEnhanced={true}
                  loading={isSimulationActive}
                  showLegend={true}
                  showControls={true}
                  reduceAnimations={reduceAnimations}
                />
              </Box>
            ) : simulationData ? (
              // Legacy visualization with simulation results
              <Grid container spacing={3} sx={{ mt: 1, width: '100%' }}>
                <Grid sx={{ width: { xs: '100%', md: '50%' } }}>
                  <VietnamMonteCarloCaseAnalysis data={simulationData.results.statistics} />
                </Grid>
                <Grid sx={{ width: { xs: '100%', md: '50%' } }}>
                  <VietnamMonteCarloProbabilityDistribution data={simulationData.results.statistics} />
                </Grid>
                <Grid sx={{ width: { xs: '100%', md: '100%' } }}>
                  <VietnamMonteCarloSensitivity sensitivityData={simulationData.results.sensitivity} />
                </Grid>
                
                {/* Quick mode switchers at the bottom */}
                <Grid sx={{ width: '100%', mt: 2 }}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 2,
                      bgcolor: alpha(PRIMARY_COLOR, 0.02),
                    }}
                  >
                    <Typography variant="subtitle2" gutterBottom>
                      Try our enhanced visualizations
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 1 }}>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<SparklesIcon size={16} />}
                        onClick={() => toggleVisualization('enhanced')}
                        sx={{ 
                          textTransform: 'none',
                          borderColor: ACCENT_COLOR,
                          color: ACCENT_COLOR,
                        }}
                      >
                        Enhanced Monte Carlo
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<DataIcon variant="sankey" size={16} />}
                        onClick={() => toggleVisualization('flow')}
                        sx={{ 
                          textTransform: 'none',
                          borderColor: INFO_COLOR,
                          color: INFO_COLOR,
                        }}
                      >
                        Supply Chain Flow
                      </Button>
                    </Box>
                  </Paper>
                </Grid>
              </Grid>
            ) : (
              // Parameter input for new simulation
              activeVisualization === 'default' ? (
                <VietnamMonteCarloParams onStartSimulation={handleLegacySimulation} />
              ) : (
                <Box sx={{ 
                  mt: 3, 
                  textAlign: 'center', 
                  py: 6,
                  border: '1px dashed',
                  borderColor: 'divider',
                  borderRadius: 2,
                  bgcolor: alpha(PRIMARY_COLOR, 0.01)
                }}>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    {activeVisualization === 'enhanced' ? 
                      "Enhanced Monte Carlo Simulation" : 
                      "Vietnam Trade Flow Analysis"}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto', mb: 3 }}>
                    {activeVisualization === 'enhanced' ? 
                      "Use our interactive Monte Carlo simulation with sophisticated visualizations to model tariff impacts." : 
                      "Visualize how tariff changes affect trade flows between Vietnam and major economic partners."}
                  </Typography>
                  <Button
                    variant="contained"
                    onClick={() => toggleVisualization('enhanced')}
                    sx={{ 
                      textTransform: 'none',
                      bgcolor: PRIMARY_COLOR,
                      '&:hover': { bgcolor: alpha(PRIMARY_COLOR, 0.9) }
                    }}
                    startIcon={
                      activeVisualization === 'enhanced' ? 
                        <DataIcon variant="chart" size={18} /> : 
                        <SparklesIcon size={18} />
                    }
                  >
                    {activeVisualization === 'enhanced' ? 
                      "Run Enhanced Simulation" : 
                      "Switch to Enhanced Simulation"}
                  </Button>
                </Box>
              )
            )}
          </Box>
        </EnhancedTabContent>

        {/* History Tab */}
        <EnhancedTabContent index={1} activeTab={activeTab} reduceAnimations={reduceAnimations}>
          <VietnamMonteCarloHistory 
            onViewSimulation={handleViewSimulation}
            onCompare={(ids) => handleCompareSimulations(ids[0])}
            onNewSimulation={() => {
              setActiveTab(0);
              setActiveVisualization('enhanced');
              setTimeout(() => {
                // After tab animation completes, focus on simulation
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }, 300);
            }}
          />
        </EnhancedTabContent>

        {/* Insights Tab with improved visualization */}
        <EnhancedTabContent index={2} activeTab={activeTab} reduceAnimations={reduceAnimations}>
          <Box>
            {!llmAnalysis ? (
              <Alert 
                severity="info" 
                icon={<SparklesIcon size={20} color={INFO_COLOR} />}
                sx={{ 
                  mb: 2,
                  '& .MuiAlert-message': { display: 'flex', alignItems: 'center' }
                }}
              >
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 500, mb: 0.5 }}>
                    AI-driven insights not available
                  </Typography>
                  <Typography variant="body2">
                    Run a simulation first to generate AI-driven insights and recommendations.
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    sx={{ mt: 1, textTransform: 'none' }}
                    onClick={() => {
                      setActiveTab(0);
                      setActiveVisualization('enhanced');
                    }}
                  >
                    Go to Simulation
                  </Button>
                </Box>
              </Alert>
            ) : (
              <Box>
                <VietnamMonteCarloLlmAnalysis 
                  analysis={llmAnalysis}
                  onGenerateReport={() => console.log('Generate report')}
                  onViewDetailedAnalysis={() => console.log('View detailed analysis')}
                />
                
                {/* Enhanced data flow visualization option */}
                {activeVisualization !== 'flow' && (
                  <Box 
                    component={FadeIn} 
                    sx={{ 
                      mt: 3, 
                      p: 2, 
                      border: '1px solid', 
                      borderColor: 'divider',
                      borderRadius: 2,
                      bgcolor: alpha(INFO_COLOR, 0.05)
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="subtitle1" fontWeight={600}>
                        Visualize Tariff Impact on Trade Flows
                      </Typography>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<DataIcon variant="sankey" size={16} />}
                        onClick={() => {
                          toggleVisualization('flow');
                          // If not on simulation tab, switch to it
                          if (activeTab !== 0) {
                            setActiveTab(0);
                          }
                        }}
                        sx={{ 
                          textTransform: 'none',
                          borderColor: INFO_COLOR,
                          color: INFO_COLOR,
                        }}
                      >
                        View Flow Diagram
                      </Button>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Explore how simulation results affect trade flows between Vietnam and major economic partners 
                      with our interactive Sankey diagram visualization.
                    </Typography>
                  </Box>
                )}
              </Box>
            )}
          </Box>
        </EnhancedTabContent>
      </Box>
    </PageTransition>
  );
};

export default VietnamTariffDashboard;