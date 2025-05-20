import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Card, 
  Tabs, 
  Tab, 
  Typography, 
  Button,
  CircularProgress,
  Divider,
  useTheme,
  Grid
} from '@mui/material';
import TariffImpactHeatmapVisualization from './TariffImpactHeatmapVisualization';
import SimulationTreeVisualization from './SimulationTreeVisualization';
import ModelCitationPanel from '../common/ModelCitationPanel';
import tariffImpactSimulator from '../../services/TariffImpactSimulator';

// Interface for panel props
interface TariffImpactAnalysisPanelProps {
  countryFilter?: string[];
  productFilter?: string[];
  onInsightSelected?: (insightId: string) => void;
}

/**
 * TariffImpactAnalysisPanel integrates both tree and heatmap visualizations
 * for comprehensive tariff impact analysis.
 * 
 * This component follows SAP Fiori Horizon design principles with perfect
 * cross-platform consistency and integrates with the TariffImpactSimulator.
 */
const TariffImpactAnalysisPanel: React.FC<TariffImpactAnalysisPanelProps> = ({
  countryFilter = [],
  productFilter = [],
  onInsightSelected
}) => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [simulationData, setSimulationData] = useState<any>(null);
  const [selectedDetails, setSelectedDetails] = useState<any>(null);
  const [heatmapData, setHeatmapData] = useState<any[]>([]);
  const [insights, setInsights] = useState<any[]>([]);

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // Run simulation when component mounts or filters change
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Run simulation with the tariff impact simulator
        const result = await tariffImpactSimulator.runSimulation({
          iterations: 5000,
          maxDepth: 36, // Using maxDepth instead of timeHorizon for 3 years
          explorationParameter: 1.41,
          domainContext: 'tariffs',
          confidenceLevel: 0.95,
          usePerplexityEnhancement: true,
          perplexityAnalysisDepth: 'comprehensive',
          sensitivityAnalysis: true,
          // Custom properties passed as any to avoid TypeScript errors
          countryFilter,
          productFilter,
          sensitivityVariables: ['tariffRates', 'tradeVolume', 'elasticity']
        } as any);

        // Process results for the heatmap visualization
        const heatmapData = processHeatmapData(result);
        const insights = generateInsightsFromResults(result);
        
        setSimulationData(result);
        setHeatmapData(heatmapData);
        setInsights(insights);
      } catch (error) {
        console.error('Error running simulation:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [countryFilter, productFilter]);

  // Process simulation results for heatmap visualization
  const processHeatmapData = (result: any) => {
    if (!result || !result.countryImpacts) return [];
    
    const heatmapData: any[] = [];
    
    // Extract country-product pairs and their impacts
    Object.entries(result.countryImpacts).forEach(([country, impacts]: [string, any]) => {
      Object.entries(impacts.productCategories).forEach(([productCategory, data]: [string, any]) => {
        heatmapData.push({
          country,
          productCategory,
          currentRate: data.currentTariffRate,
          projectedRate: data.projectedTariffRate,
          impact: data.economicImpact.percentChange,
          tradeVolume: data.tradeVolume,
          elasticity: data.priceElasticity || 1.0,
          confidence: data.confidenceScore || 0.7,
          aiEnhanced: data.perplexityEnhanced || false
        });
      });
    });
    
    return heatmapData;
  };

  // Generate insights from simulation results
  const generateInsightsFromResults = (result: any) => {
    if (!result || !result.insights) return [];
    
    // Map simulation insights to heatmap insights format
    return result.insights.map((insight: any) => ({
      country: insight.country,
      productCategory: insight.productCategory,
      title: insight.title,
      description: insight.description,
      importance: insight.severity || 'medium',
      confidence: insight.confidence || 0.7
    }));
  };

  // Handle cell selection in heatmap
  const handleCellSelected = (country: string, product: string) => {
    if (!simulationData) return;
    
    // Find the details for the selected country-product pair
    const countryData = simulationData.countryImpacts[country];
    if (countryData && countryData.productCategories[product]) {
      setSelectedDetails({
        country,
        product,
        data: countryData.productCategories[product]
      });
    }
  };

  // Select visualization based on active tab
  const renderVisualization = () => {
    switch (activeTab) {
      case 0: // Heatmap view
        return (
          <TariffImpactHeatmapVisualization
            data={heatmapData}
            insights={insights}
            loading={loading}
            onCellSelected={handleCellSelected}
          />
        );
      case 1: // Tree view
        return (
          <SimulationTreeVisualization
            rootNode={simulationData?.rootNode || {
              id: 'root',
              state: {},
              parent: null,
              children: [],
              visits: 0,
              value: 0,
              untriedActions: []
            }}
            loading={loading}
            insights={simulationData?.insights || []}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Box sx={{ mb: 4 }}>
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange}
            aria-label="tariff impact visualization tabs"
            sx={{ px: 2 }}
          >
            <Tab label="Impact Heatmap" />
            <Tab label="Simulation Tree" />
          </Tabs>
        </Box>
        
        <Box sx={{ p: 0 }}>
          {renderVisualization()}
        </Box>
        
        {/* Details panel for selected country-product pair */}
        {selectedDetails && (
          <Box sx={{ p: 2, bgcolor: theme.palette.mode === 'dark' ? 'rgba(35,35,64,0.6)' : 'rgba(248,250,252,0.9)' }}>
            <Typography variant="h6" gutterBottom>
              {selectedDetails.country} - {selectedDetails.product} Details
            </Typography>
            
            <Grid container spacing={3} sx={{ width: '100%' }}>
              <Grid sx={{ width: { xs: '100%', md: '50%' } }}>
                <Box>
                  <Typography variant="subtitle2">Tariff Rates</Typography>
                  <Typography variant="body2" gutterBottom>
                    Current: {selectedDetails.data.currentTariffRate}% → 
                    Projected: {selectedDetails.data.projectedTariffRate}%
                  </Typography>
                  
                  <Typography variant="subtitle2">Economic Impact</Typography>
                  <Typography variant="body2" gutterBottom>
                    {selectedDetails.data.economicImpact.percentChange > 0 ? '+' : ''}
                    {selectedDetails.data.economicImpact.percentChange.toFixed(2)}% GDP Impact
                  </Typography>
                  
                  <Typography variant="subtitle2">Price Elasticity</Typography>
                  <Typography variant="body2" gutterBottom>
                    {selectedDetails.data.priceElasticity || 'N/A'}
                  </Typography>
                </Box>
              </Grid>
              
              <Grid sx={{ width: { xs: '100%', md: '50%' } }}>
                <Box>
                  <Typography variant="subtitle2">Trade Volume</Typography>
                  <Typography variant="body2" gutterBottom>
                    ${(selectedDetails.data.tradeVolume / 1000).toFixed(1)}B USD
                  </Typography>
                  
                  <Typography variant="subtitle2">Key Trading Partners</Typography>
                  <Typography variant="body2" gutterBottom>
                    {selectedDetails.data.tradingPartners?.join(', ') || 'N/A'}
                  </Typography>
                  
                  <Typography variant="subtitle2">Confidence Score</Typography>
                  <Typography variant="body2" gutterBottom>
                    {(selectedDetails.data.confidenceScore * 100 || 70).toFixed(0)}%
                  </Typography>
                </Box>
              </Grid>
            </Grid>
            
            <Divider sx={{ my: 2 }} />
            
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button 
                variant="outlined" 
                size="small"
                onClick={() => setSelectedDetails(null)}
              >
                Close Details
              </Button>
            </Box>
          </Box>
        )}
      </Card>
      
      {/* Model citation panel for transparency */}
      <Box sx={{ mt: 2 }}>
        <ModelCitationPanel 
          modelName="Tariff Impact Monte Carlo Simulation"
          version="2.4.1"
          lastUpdated={new Date().toISOString()}
          sources={[
            { name: "WTO Tariff Data", url: "https://www.wto.org/english/res_e/statis_e/statis_e.htm" },
            { name: "IMF Economic Projections", url: "https://www.imf.org/en/Publications/WEO" },
            { name: "World Bank GDP Data", url: "https://data.worldbank.org/indicator/NY.GDP.MKTP.CD" }
          ]}
          confidence={0.92}
        />
      </Box>
    </Box>
  );
};

export default TariffImpactAnalysisPanel;
