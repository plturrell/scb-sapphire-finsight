import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Tabs,
  Tab,
  Button,
  Alert,
  CircularProgress,
  Chip,
  IconButton,
  Tooltip,
  Divider,
  Paper,
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
} from '../components/icons';
import EnhancedFinanceCard from '../components/cards/EnhancedFinanceCard';
import VietnamMonteCarloHistory from '../components/VietnamMonteCarloHistory';
import VietnamMonteCarloParams from '../components/VietnamMonteCarloParams';
import VietnamMonteCarloCaseAnalysis from '../components/VietnamMonteCarloCaseAnalysis';
import VietnamMonteCarloLlmAnalysis from '../components/VietnamMonteCarloLlmAnalysis';
import VietnamMonteCarloProbabilityDistribution from '../components/VietnamMonteCarloProbabilityDistribution';
import VietnamMonteCarloSensitivity from '../components/VietnamMonteCarloSensitivity';
import EnhancedMonteCarloSimulation from '../components/EnhancedMonteCarloSimulation';
import EnhancedSankeyDiagram from '../components/EnhancedSankeyDiagram';
import PerplexityParticles from '../components/effects/PerplexityParticles';
import SCBrandedLogo from '../components/SCBrandedLogo';
import SplashScreen from '../components/SplashScreen';
import EnhancedTabContent from '../components/EnhancedTabContent';
import SCBUnifiedLayout from '../components/layout/SCBUnifiedLayout';
import useEnhancedMicroInteractions from '../hooks/useEnhancedMicroInteractions';
import { SCB_COLORS, SCB_TYPOGRAPHY, SCB_COMPONENTS, alphaColor } from '../utils/SCBrandAssets';

const UnifiedSCBDashboard = () => {
  const theme = useTheme();
  const capabilities = useDeviceCapabilities();
  const networkStatus = useNetworkAwareLoading();
  const { FadeIn, SlideUp, Pulse } = useEnhancedMicroInteractions();
  
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [activeVisualization, setActiveVisualization] = useState<'default' | 'enhanced' | 'flow'>('enhanced');
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
      color: SCB_COLORS.ACCENT,
      description: "Product categories represent the different types of goods exported from Vietnam.",
      nodes: ["Agricultural Products", "Electronics", "Textiles"]
    },
    { 
      category: "destination", 
      label: "Destinations", 
      color: SCB_COLORS.PRIMARY,
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
    setIsSimulationActive(false);
    
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
  
  // Section titles with animated borders
  const SectionTitle = ({ title, icon, chipText = null }) => (
    <Box sx={{ 
      position: 'relative', 
      mb: 3,
      display: 'flex',
      alignItems: 'center',
      gap: 2
    }}>
      <Box sx={{ 
        width: 40, 
        height: 40, 
        borderRadius: '50%', 
        bgcolor: alphaColor(SCB_COLORS.PRIMARY, 0.1),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {icon}
      </Box>
      <Box>
        <Typography variant="h5" component="h2" sx={{ fontWeight: SCB_TYPOGRAPHY.WEIGHT.BOLD, color: SCB_COLORS.PRIMARY }}>
          {title}
        </Typography>
        <Box sx={{ 
          height: 3, 
          width: 60, 
          bgcolor: SCB_COLORS.ACCENT,
          mt: 0.5,
          borderRadius: 1.5,
        }} />
      </Box>
      {chipText && (
        <Chip 
          label={chipText} 
          size="small"
          sx={{ 
            ml: 'auto', 
            bgcolor: alphaColor(SCB_COLORS.ACCENT, 0.1),
            color: SCB_COLORS.PRIMARY,
            fontWeight: SCB_TYPOGRAPHY.WEIGHT.MEDIUM
          }}
        />
      )}
    </Box>
  );

  return (
    <>
      {showSplash && <SplashScreen onLoadComplete={() => setShowSplash(false)} duration={2500} />}
      
      <SCBUnifiedLayout 
        title="Vietnam Tariff Analysis" 
        description="AI-Enhanced Financial Analytics for Vietnam tariff impact analysis"
        showParticles={showParticles}
        transitionEffect="slide-up"
      >
        <Box>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 2,
              mb: 3
            }}>
              <Box>
                <Typography variant="h4" component="h1" sx={{ 
                  fontWeight: SCB_TYPOGRAPHY.WEIGHT.BOLD,
                  display: 'flex',
                  alignItems: 'center',
                  color: SCB_COLORS.PRIMARY
                }}>
                  <FlagIcon 
                    size={32} 
                    animation="pulse" 
                    color={SCB_COLORS.ACCENT} 
                    style={{ marginRight: 12 }}
                  />
                  Vietnam Tariff Impact Analysis
                  {networkStatus === 'fast' && (
                    <SparklesIcon 
                      size={18} 
                      animation="pulse" 
                      color={SCB_COLORS.ACCENT} 
                      style={{ marginLeft: 8 }} 
                    />
                  )}
                </Typography>
                
                <Typography variant="body1" sx={{ 
                  color: SCB_COLORS.MEDIUM_GREY, 
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
                      fontWeight: SCB_TYPOGRAPHY.WEIGHT.MEDIUM,
                      backgroundColor: activeVisualization === 'default' ? alphaColor(SCB_COLORS.PRIMARY, 0.1) : undefined,
                      '& .MuiChip-icon': { 
                        color: activeVisualization === 'default' ? SCB_COLORS.PRIMARY : undefined
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
                      fontWeight: SCB_TYPOGRAPHY.WEIGHT.MEDIUM,
                      backgroundColor: activeVisualization === 'enhanced' ? alphaColor(SCB_COLORS.ACCENT, 0.1) : undefined,
                      '& .MuiChip-icon': { 
                        color: activeVisualization === 'enhanced' ? SCB_COLORS.ACCENT : undefined
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
                      fontWeight: SCB_TYPOGRAPHY.WEIGHT.MEDIUM,
                      backgroundColor: activeVisualization === 'flow' ? alphaColor(SCB_COLORS.INFO, 0.1) : undefined,
                      '& .MuiChip-icon': { 
                        color: activeVisualization === 'flow' ? SCB_COLORS.INFO : undefined
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
                      backgroundColor: showParticles ? alphaColor(SCB_COLORS.ACCENT, 0.05) : 'transparent',
                      color: showParticles ? SCB_COLORS.ACCENT : SCB_COLORS.MEDIUM_GREY
                    }}
                  >
                    <SparklesIcon size={18} animation={showParticles ? "pulse" : "none"} />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
            
            {/* Tabs */}
            <Box sx={{ 
              borderBottom: 1, 
              borderColor: 'divider', 
              mb: 3,
              backgroundColor: SCB_COLORS.WHITE,
              boxShadow: SCB_COMPONENTS.CARD.BOX_SHADOW,
              borderRadius: '8px 8px 0 0',
            }}>
              <Tabs 
                value={activeTab} 
                onChange={handleTabChange}
                aria-label="Vietnam tariff analysis tabs"
                variant={capabilities.screenSize === 'mobile' ? 'fullWidth' : 'standard'}
                sx={{
                  px: 2,
                  pt: 1,
                  '& .MuiTab-root': {
                    textTransform: 'none',
                    fontWeight: SCB_TYPOGRAPHY.WEIGHT.MEDIUM,
                    fontSize: SCB_TYPOGRAPHY.SIZE.MD,
                    minHeight: '56px'
                  },
                  '& .Mui-selected': {
                    color: SCB_COLORS.PRIMARY,
                    fontWeight: SCB_TYPOGRAPHY.WEIGHT.BOLD
                  },
                  '& .MuiTabs-indicator': {
                    backgroundColor: SCB_COLORS.ACCENT,
                    height: 3,
                    borderRadius: '3px 3px 0 0'
                  }
                }}
              >
                <Tab 
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <DataIcon variant="chart" size={18} color={SCB_COLORS.PRIMARY} style={{ marginRight: 8 }} />
                      Simulation
                    </Box>
                  }
                />
                <Tab 
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <ChartIcon variant="history" size={18} color={SCB_COLORS.PRIMARY} style={{ marginRight: 8 }} />
                      History
                    </Box>
                  }
                />
                <Tab 
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <SparklesIcon size={18} color={SCB_COLORS.PRIMARY} style={{ marginRight: 8 }} />
                      Insights
                    </Box>
                  }
                />
              </Tabs>
            </Box>

            {/* Dynamic background for added visual polish */}
            {showParticles && activeVisualization !== 'default' && (
              <Box sx={{ 
                position: 'fixed', 
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

            {/* Main content area with card styling */}
            <Paper sx={{
              p: capabilities.screenSize === 'mobile' ? 2 : 3,
              borderRadius: SCB_COMPONENTS.CARD.BORDER_RADIUS,
              boxShadow: SCB_COMPONENTS.CARD.BOX_SHADOW,
              backgroundColor: SCB_COLORS.WHITE,
              position: 'relative',
              zIndex: 1,
              overflow: 'hidden'
            }}>
              {/* Simulation Tab Content */}
              <EnhancedTabContent index={0} activeTab={activeTab} reduceAnimations={reduceAnimations}>
                <Box sx={{ position: 'relative', zIndex: 1 }}>
                  <Grid container spacing={capabilities.screenSize === 'mobile' ? 2 : 3} sx={{ width: '100%', mb: 3 }}>
                    <Grid item xs={12}>
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
                  
                  {/* Visualization Section Title */}
                  <SectionTitle 
                    title={
                      activeVisualization === 'default' ? "Standard Analysis" : 
                      activeVisualization === 'enhanced' ? "Enhanced Monte Carlo Simulation" : 
                      "Vietnam Trade Flow Analysis"
                    }
                    icon={
                      activeVisualization === 'default' ? 
                        <ChartIcon variant="line" size={20} color={SCB_COLORS.PRIMARY} /> : 
                      activeVisualization === 'enhanced' ? 
                        <SparklesIcon size={20} color={SCB_COLORS.ACCENT} /> : 
                        <DataIcon variant="sankey" size={20} color={SCB_COLORS.INFO} />
                    }
                    chipText={hasRunSimulation ? "Simulation completed" : null}
                  />
                  
                  {/* Visualization Content */}
                  {isSimulationActive ? (
                    <Box sx={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center', 
                      my: 6,
                      py: 6,
                      backgroundColor: alphaColor(SCB_COLORS.PRIMARY, 0.02),
                      borderRadius: SCB_COMPONENTS.CARD.BORDER_RADIUS
                    }}>
                      <CircularProgress 
                        size={60} 
                        sx={{ color: SCB_COLORS.ACCENT }}
                      />
                      <Typography variant="h6" sx={{ mt: 2, color: SCB_COLORS.PRIMARY }}>
                        Running Monte Carlo Simulation
                      </Typography>
                      <Typography variant="body2" color={SCB_COLORS.MEDIUM_GREY}>
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
                        width={capabilities.screenSize === 'mobile' ? window.innerWidth - 80 : 1000}
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
                      <Grid item xs={12} md={6}>
                        <VietnamMonteCarloCaseAnalysis data={simulationData.results.statistics} />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <VietnamMonteCarloProbabilityDistribution data={simulationData.results.statistics} />
                      </Grid>
                      <Grid item xs={12}>
                        <VietnamMonteCarloSensitivity sensitivityData={simulationData.results.sensitivity} />
                      </Grid>
                      
                      {/* Quick mode switchers at the bottom */}
                      <Grid item xs={12} sx={{ mt: 2 }}>
                        <Paper
                          elevation={0}
                          sx={{
                            p: 3,
                            border: '1px solid',
                            borderColor: alphaColor(SCB_COLORS.PRIMARY, 0.1),
                            borderRadius: SCB_COMPONENTS.CARD.BORDER_RADIUS,
                            bgcolor: alphaColor(SCB_COLORS.PRIMARY, 0.02),
                          }}
                        >
                          <Typography variant="subtitle1" sx={{ fontWeight: SCB_TYPOGRAPHY.WEIGHT.MEDIUM, mb: 1 }}>
                            Try our enhanced visualizations
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 2 }}>
                            <Button
                              variant="outlined"
                              startIcon={<SparklesIcon size={16} />}
                              onClick={() => toggleVisualization('enhanced')}
                              sx={{ 
                                textTransform: 'none',
                                borderColor: SCB_COLORS.ACCENT,
                                color: SCB_COLORS.ACCENT,
                                fontWeight: SCB_TYPOGRAPHY.WEIGHT.MEDIUM,
                                px: 3,
                                py: 1
                              }}
                            >
                              Enhanced Monte Carlo
                            </Button>
                            <Button
                              variant="outlined"
                              startIcon={<DataIcon variant="sankey" size={16} />}
                              onClick={() => toggleVisualization('flow')}
                              sx={{ 
                                textTransform: 'none',
                                borderColor: SCB_COLORS.INFO,
                                color: SCB_COLORS.INFO,
                                fontWeight: SCB_TYPOGRAPHY.WEIGHT.MEDIUM,
                                px: 3,
                                py: 1
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
                        borderColor: alphaColor(SCB_COLORS.PRIMARY, 0.2),
                        borderRadius: SCB_COMPONENTS.CARD.BORDER_RADIUS,
                        bgcolor: alphaColor(SCB_COLORS.PRIMARY, 0.02)
                      }}>
                        <Typography variant="h6" color={SCB_COLORS.PRIMARY} gutterBottom>
                          {activeVisualization === 'enhanced' ? 
                            "Enhanced Monte Carlo Simulation" : 
                            "Vietnam Trade Flow Analysis"}
                        </Typography>
                        <Typography variant="body2" color={SCB_COLORS.MEDIUM_GREY} sx={{ maxWidth: 600, mx: 'auto', mb: 3 }}>
                          {activeVisualization === 'enhanced' ? 
                            "Use our interactive Monte Carlo simulation with sophisticated visualizations to model tariff impacts." : 
                            "Visualize how tariff changes affect trade flows between Vietnam and major economic partners."}
                        </Typography>
                        <Button
                          variant="contained"
                          onClick={() => activeVisualization === 'enhanced' ? handleLegacySimulation() : toggleVisualization('enhanced')}
                          sx={{ 
                            textTransform: 'none',
                            bgcolor: SCB_COLORS.PRIMARY,
                            color: SCB_COLORS.WHITE,
                            fontWeight: SCB_TYPOGRAPHY.WEIGHT.MEDIUM,
                            px: 4,
                            py: 1.5,
                            '&:hover': { bgcolor: SCB_COMPONENTS.BUTTON.PRIMARY.HOVER }
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
                <SectionTitle 
                  title="Simulation History"
                  icon={<ChartIcon variant="history" size={20} color={SCB_COLORS.PRIMARY} />}
                />
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
                <SectionTitle 
                  title="AI-Driven Insights"
                  icon={<SparklesIcon size={20} color={SCB_COLORS.ACCENT} />}
                />
                <Box>
                  {!llmAnalysis ? (
                    <Alert 
                      severity="info" 
                      icon={<SparklesIcon size={20} color={SCB_COLORS.INFO} />}
                      sx={{ 
                        mb: 3,
                        borderRadius: SCB_COMPONENTS.CARD.BORDER_RADIUS,
                        border: `1px solid ${alphaColor(SCB_COLORS.INFO, 0.2)}`,
                        '& .MuiAlert-message': { display: 'flex', alignItems: 'center' }
                      }}
                    >
                      <Box>
                        <Typography variant="body1" sx={{ fontWeight: SCB_TYPOGRAPHY.WEIGHT.MEDIUM, mb: 0.5 }}>
                          AI-driven insights not available
                        </Typography>
                        <Typography variant="body2">
                          Run a simulation first to generate AI-driven insights and recommendations.
                        </Typography>
                        <Button
                          variant="outlined"
                          size="small"
                          sx={{ 
                            mt: 2, 
                            textTransform: 'none',
                            borderColor: SCB_COLORS.INFO,
                            color: SCB_COLORS.INFO
                          }}
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
                            mt: 4, 
                            p: 3, 
                            border: '1px solid', 
                            borderColor: alphaColor(SCB_COLORS.INFO, 0.2),
                            borderRadius: SCB_COMPONENTS.CARD.BORDER_RADIUS,
                            bgcolor: alphaColor(SCB_COLORS.INFO, 0.05)
                          }}
                        >
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6" fontWeight={SCB_TYPOGRAPHY.WEIGHT.BOLD} color={SCB_COLORS.PRIMARY}>
                              Visualize Tariff Impact on Trade Flows
                            </Typography>
                            <Button
                              variant="contained"
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
                                bgcolor: SCB_COLORS.INFO,
                                color: SCB_COLORS.WHITE,
                                fontWeight: SCB_TYPOGRAPHY.WEIGHT.MEDIUM,
                                '&:hover': { bgcolor: alphaColor(SCB_COLORS.INFO, 0.8) }
                              }}
                            >
                              View Flow Diagram
                            </Button>
                          </Box>
                          <Typography variant="body1" color={SCB_COLORS.MEDIUM_GREY}>
                            Explore how simulation results affect trade flows between Vietnam and major economic partners 
                            with our interactive Sankey diagram visualization.
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  )}
                </Box>
              </EnhancedTabContent>
            </Paper>
          </Box>
      </SCBUnifiedLayout>
    </>
  );
};

export default UnifiedSCBDashboard;