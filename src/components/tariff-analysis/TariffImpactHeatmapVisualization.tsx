import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Chip, 
  Select, 
  MenuItem,
  FormControl,
  InputLabel,
  Slider,
  Switch,
  FormControlLabel,
  Grid,
  Tooltip,
  CircularProgress,
  IconButton
} from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import PerplexityEnhancementBadge from '../common/PerplexityEnhancementBadge';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import RefreshIcon from '@mui/icons-material/Refresh';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

// Styled components following SAP Fiori Horizon design principles
const HeatmapContainer = styled(Box)(({ theme }) => ({
  height: '550px',
  width: '100%',
  position: 'relative',
  overflow: 'hidden',
  background: theme.palette.mode === 'dark' 
    ? 'linear-gradient(180deg, rgba(18,18,24,1) 0%, rgba(35,35,64,0.95) 100%)' 
    : 'linear-gradient(180deg, rgba(248,250,252,1) 0%, rgba(240,244,249,0.95) 100%)',
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[3],
  '& svg': {
    fontFamily: theme.typography.fontFamily,
  },
  transition: 'all 0.3s ease-in-out',
}));

const FullscreenContainer = styled(Box)(({ theme }) => ({
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  zIndex: 1300,
  background: theme.palette.background.paper,
  padding: theme.spacing(3),
}));

const ControlsContainer = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  display: 'flex',
  flexWrap: 'wrap',
  gap: theme.spacing(2),
  alignItems: 'center',
}));

const LegendContainer = styled(Box)(({ theme }) => ({
  position: 'absolute',
  bottom: theme.spacing(2),
  right: theme.spacing(2),
  padding: theme.spacing(1),
  backgroundColor: theme.palette.mode === 'dark' 
    ? 'rgba(35,35,64,0.8)' 
    : 'rgba(255,255,255,0.8)',
  borderRadius: theme.shape.borderRadius,
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(0.5),
}));

const CellTooltip = styled(Box)(({ theme }) => ({
  position: 'absolute',
  pointerEvents: 'none',
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(1.5),
  boxShadow: theme.shadows[3],
  maxWidth: '300px',
  zIndex: 1000,
  transition: 'opacity 0.3s, transform 0.3s',
  opacity: 0,
  transform: 'translateY(10px)',
  '&.visible': {
    opacity: 1,
    transform: 'translateY(0)',
  },
}));

const InsightBadge = styled(Chip)(({ theme }) => ({
  position: 'absolute',
  top: theme.spacing(1),
  right: theme.spacing(1),
  background: 'linear-gradient(45deg, #0070F2 0%, #0A6ED1 100%)',
  color: '#ffffff',
  border: 'none',
  '&.critical': {
    background: 'linear-gradient(45deg, #BB0000 0%, #E00000 100%)',
  },
  '&.warning': {
    background: 'linear-gradient(45deg, #E9730C 0%, #F39633 100%)',
  },
  zIndex: 2,
}));

// Types for the component
interface TariffData {
  country: string;
  productCategory: string;
  currentRate: number;
  projectedRate: number;
  impact: number;
  tradeVolume: number;
  elasticity: number;
  confidence: number;
  aiEnhanced?: boolean;
}

interface HeatmapInsight {
  country: string;
  productCategory: string;
  title: string;
  description: string;
  importance: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
}

interface TariffImpactHeatmapVisualizationProps {
  data?: TariffData[];
  insights?: HeatmapInsight[];
  loading?: boolean;
  width?: number;
  height?: number;
  onCellSelected?: (country: string, product: string) => void;
}

/**
 * TariffImpactHeatmapVisualization provides an interactive heatmap view of tariff impacts
 * across countries and product categories.
 * 
 * Follows SAP Fiori Horizon design principles with Perplexity.ai enhancements.
 */
const TariffImpactHeatmapVisualization: React.FC<TariffImpactHeatmapVisualizationProps> = ({
  data = [],
  insights = [],
  loading = false,
  width = 1000,
  height = 550,
  onCellSelected
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const theme = useTheme();
  const [metric, setMetric] = useState<'impact' | 'currentRate' | 'projectedRate' | 'tradeVolume'>('impact');
  const [isColorblindMode, setIsColorblindMode] = useState<boolean>(false);
  const [selectedInsightLevel, setSelectedInsightLevel] = useState<string>('all');
  const [threshold, setThreshold] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [selectedCell, setSelectedCell] = useState<{country: string, product: string} | null>(null);
  
  // Define colors based on SAP Fiori Horizon palette with colorblind-safe options
  const fioriColors = {
    // Standard palette
    positive: '#107E3E', // Green
    negative: '#BB0000', // Red
    neutral: '#6A6D70', // Grey
    highlight: '#0070F2', // Blue
    
    // For colorblind accessibility
    positiveColorblind: '#0000BB', // Blue
    negativeColorblind: '#DDAA00', // Yellow
    
    // Scale for impact visualization (red-yellow-green)
    negativeScale: d3.scaleSequential(d3.interpolateReds)
      .domain([0, 100]),
    
    positiveScale: d3.scaleSequential(d3.interpolateGreens)
      .domain([0, 100]),
      
    // Colorblind-safe scale (blue to yellow)
    colorblindScale: d3.scaleSequential(d3.interpolateViridis)
      .domain([0, 100])
  };

  // Process data to extract unique countries and product categories
  const countries = Array.from(new Set(data.map(d => d.country))).sort();
  const productCategories = Array.from(new Set(data.map(d => d.productCategory))).sort();
  
  // Create cell data for the heatmap
  const getCellData = useCallback(() => {
    const cellData: any[] = [];
    
    countries.forEach((country, i) => {
      productCategories.forEach((product, j) => {
        const item = data.find(d => d.country === country && d.productCategory === product);
        
        if (item) {
          // Determine if cell has associated insight
          const hasInsight = insights.some(
            insight => insight.country === country && 
                      insight.productCategory === product &&
                      (selectedInsightLevel === 'all' || 
                       insight.importance === selectedInsightLevel)
          );
          
          // Get the highest priority insight for this cell
          const cellInsight = insights
            .filter(i => i.country === country && i.productCategory === product)
            .sort((a, b) => {
              const importanceScore = {
                'low': 1,
                'medium': 2,
                'high': 3,
                'critical': 4
              };
              return importanceScore[b.importance] - importanceScore[a.importance];
            })[0];
            
          const value = item[metric];
          const absValue = Math.abs(value);
          
          // Only include if above threshold
          if (absValue >= threshold) {
            cellData.push({
              country,
              product,
              value,
              countryIndex: i,
              productIndex: j,
              tradeVolume: item.tradeVolume,
              confidence: item.confidence,
              aiEnhanced: item.aiEnhanced,
              hasInsight,
              insight: cellInsight,
              row: i,
              col: j
            });
          }
        }
      });
    });
    
    return cellData;
  }, [data, countries, productCategories, metric, threshold, insights, selectedInsightLevel]);

  // Render the heatmap visualization
  useEffect(() => {
    if (loading || !svgRef.current) return;
    
    // Clear previous visualization
    d3.select(svgRef.current).selectAll('*').remove();
    
    const cellData = getCellData();
    if (cellData.length === 0) return;
    
    // Setup dimensions
    const svg = d3.select(svgRef.current);
    const margin = { top: 60, right: 20, bottom: 40, left: 120 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    
    // Calculate cell dimensions
    const cellWidth = innerWidth / productCategories.length;
    const cellHeight = innerHeight / countries.length;
    
    // Create container
    const container = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)
      .attr('class', 'viz-container');
    
    // Add patterns for colorblind mode
    if (isColorblindMode) {
      addColorblindPatterns(svg);
    }
    
    // Create scales
    const xScale = d3.scaleBand()
      .domain(productCategories)
      .range([0, innerWidth])
      .padding(0.05);
      
    const yScale = d3.scaleBand()
      .domain(countries)
      .range([0, innerHeight])
      .padding(0.05);
    
    // Create color scale based on metric
    const getColor = (d: any) => {
      // For impact, use red for negative, green for positive
      if (metric === 'impact') {
        const value = d.value;
        const absValue = Math.abs(value);
        const normalizedValue = Math.min(100, absValue * 10); // Scale for visualization
        
        if (isColorblindMode) {
          return fioriColors.colorblindScale(normalizedValue);
        } else {
          return value < 0 ? 
            fioriColors.negativeScale(normalizedValue) : 
            fioriColors.positiveScale(normalizedValue);
        }
      } 
      // For other metrics, use a continuous scale
      else {
        const maxValue = Math.max(...data.map(item => item[metric]));
        const normalizedValue = (d.value / maxValue) * 100;
        
        return isColorblindMode ? 
          fioriColors.colorblindScale(normalizedValue) :
          d3.interpolateBlues(normalizedValue / 100);
      }
    };
    
    // Add cells
    container.selectAll('.cell')
      .data(cellData)
      .enter()
      .append('rect')
      .attr('class', 'cell')
      .attr('x', d => xScale(d.product) || 0)
      .attr('y', d => yScale(d.country) || 0)
      .attr('width', xScale.bandwidth())
      .attr('height', yScale.bandwidth())
      .attr('fill', d => getColor(d))
      .attr('stroke', d => d.hasInsight ? '#FFC107' : 'none')
      .attr('stroke-width', d => d.hasInsight ? 2 : 0)
      .attr('rx', 2)
      .attr('ry', 2)
      .style('opacity', d => d.confidence ? 0.3 + (d.confidence * 0.7) : 1)
      .on('mouseover', (event, d) => showTooltip(event, d))
      .on('mouseout', hideTooltip)
      .on('click', (event, d) => {
        setSelectedCell({country: d.country, product: d.product});
        if (onCellSelected) onCellSelected(d.country, d.product);
      })
      .transition()
      .duration(500)
      .style('opacity', d => d.confidence ? 0.3 + (d.confidence * 0.7) : 1);
    
    // Add AI enhancement indicators for cells
    container.selectAll('.ai-indicator')
      .data(cellData.filter(d => d.aiEnhanced))
      .enter()
      .append('circle')
      .attr('class', 'ai-indicator')
      .attr('cx', d => (xScale(d.product) || 0) + xScale.bandwidth() - 5)
      .attr('cy', d => (yScale(d.country) || 0) + 5)
      .attr('r', 3)
      .attr('fill', theme.palette.primary.main)
      .attr('stroke', theme.palette.background.paper)
      .attr('stroke-width', 1);
    
    // Add insight indicators
    container.selectAll('.insight-indicator')
      .data(cellData.filter(d => d.hasInsight && d.insight))
      .enter()
      .append('circle')
      .attr('class', 'insight-indicator')
      .attr('cx', d => (xScale(d.product) || 0) + 5)
      .attr('cy', d => (yScale(d.country) || 0) + 5)
      .attr('r', 3)
      .attr('fill', d => {
        switch (d.insight.importance) {
          case 'critical': return '#BB0000';
          case 'high': return '#E9730C';
          case 'medium': return '#0A6ED1';
          default: return '#6A6D70';
        }
      })
      .attr('stroke', theme.palette.background.paper)
      .attr('stroke-width', 1);
    
    // Add trade volume indicators (size of dot in center)
    container.selectAll('.volume-indicator')
      .data(cellData)
      .enter()
      .append('circle')
      .attr('class', 'volume-indicator')
      .attr('cx', d => (xScale(d.product) || 0) + xScale.bandwidth() / 2)
      .attr('cy', d => (yScale(d.country) || 0) + yScale.bandwidth() / 2)
      .attr('r', d => Math.max(2, Math.min(6, (d.tradeVolume / 1000) * 5)))
      .attr('fill', 'white')
      .attr('opacity', 0.5)
      .attr('stroke', 'none');
    
    // Add X axis (product categories)
    container.append('g')
      .attr('transform', `translate(0, ${innerHeight})`)
      .call(d3.axisBottom(xScale))
      .selectAll('text')
      .attr('transform', 'rotate(-45)')
      .style('text-anchor', 'end')
      .attr('dx', '-.8em')
      .attr('dy', '.15em')
      .style('font-size', '10px');
    
    // Add Y axis (countries)
    container.append('g')
      .call(d3.axisLeft(yScale))
      .selectAll('text')
      .style('font-size', '10px');
    
    // Add title
    container.append('text')
      .attr('x', innerWidth / 2)
      .attr('y', -margin.top / 2)
      .attr('text-anchor', 'middle')
      .style('font-size', '16px')
      .style('font-weight', 'bold')
      .text(`Tariff ${metric === 'impact' ? 'Impact' : 
            metric === 'currentRate' ? 'Current Rates' : 
            metric === 'projectedRate' ? 'Projected Rates' : 
            'Trade Volume'} Heatmap`);
  }, [width, height, data, countries, productCategories, metric, isColorblindMode, theme, selectedInsightLevel, threshold, loading, getCellData, onCellSelected]);

  // Add colorblind patterns
  const addColorblindPatterns = (svg: d3.Selection<SVGSVGElement, unknown, null, undefined>) => {
    const defs = svg.append('defs');
    
    // Pattern: Diagonal lines
    defs.append('pattern')
      .attr('id', 'pattern-diagonal')
      .attr('patternUnits', 'userSpaceOnUse')
      .attr('width', 8)
      .attr('height', 8)
      .append('path')
      .attr('d', 'M-2,2 l4,-4 M0,8 l8,-8 M6,10 l4,-4')
      .attr('stroke', '#000')
      .attr('stroke-width', 1.5)
      .attr('stroke-linecap', 'square');
    
    // Pattern: Dots
    defs.append('pattern')
      .attr('id', 'pattern-dots')
      .attr('patternUnits', 'userSpaceOnUse')
      .attr('width', 8)
      .attr('height', 8)
      .append('circle')
      .attr('cx', 4)
      .attr('cy', 4)
      .attr('r', 2)
      .attr('fill', '#000');
    
    // Pattern: Grid
    defs.append('pattern')
      .attr('id', 'pattern-grid')
      .attr('patternUnits', 'userSpaceOnUse')
      .attr('width', 8)
      .attr('height', 8)
      .append('path')
      .attr('d', 'M0,0 v8 h8 v-8 h-8 M0,4 h8 M4,0 v8')
      .attr('stroke', '#000')
      .attr('stroke-width', 1)
      .attr('fill', 'none');
  };

  // Display tooltip when hovering over a cell
  const showTooltip = (event: any, d: any) => {
    if (!tooltipRef.current) return;
    
    const tooltip = tooltipRef.current;
    const rect = event.target.getBoundingClientRect();
    const svgRect = svgRef.current?.getBoundingClientRect();
    
    if (!svgRect) return;
    
    tooltip.innerHTML = `
      <div style="font-weight: bold;">${d.country} - ${d.product}</div>
      <div>Impact: ${d.value > 0 ? '+' : ''}${d.value.toFixed(2)}%</div>
      <div>Trade Volume: $${(d.tradeVolume / 1000).toFixed(1)}B</div>
      ${d.confidence ? `<div>Confidence: ${(d.confidence * 100).toFixed(0)}%</div>` : ''}
      ${d.aiEnhanced ? '<div style="color: #0070F2;"><em>Perplexity Enhanced</em></div>' : ''}
    `;
    
    tooltip.style.left = `${event.clientX - svgRect.left + 10}px`;
    tooltip.style.top = `${event.clientY - svgRect.top + 10}px`;
    tooltip.classList.add('visible');
  };

  // Hide tooltip when mouse leaves a cell
  const hideTooltip = () => {
    if (tooltipRef.current) {
      tooltipRef.current.classList.remove('visible');
    }
  };

  // Filter insights based on the selected cell
  const filteredInsights = selectedCell 
    ? insights.filter(i => 
        i.country === selectedCell.country && 
        i.productCategory === selectedCell.product)
    : insights.filter(i => 
        selectedInsightLevel === 'all' || 
        i.importance === selectedInsightLevel);

  // Handle threshold change
  const handleThresholdChange = (event: Event, newValue: number | number[]) => {
    setThreshold(newValue as number);
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <Card sx={{ mb: 3, position: 'relative' }}>
      <CardContent sx={{ p: isFullscreen ? 4 : 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box display="flex" alignItems="center">
            <Typography variant="h6">
              Tariff Impact Analysis
            </Typography>
            <PerplexityEnhancementBadge showDetails />
            <Tooltip title="This visualization shows the projected impact of tariff changes across countries and product categories">
              <IconButton size="small" sx={{ ml: 1 }}>
                <InfoOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
          <Box>
            <IconButton onClick={toggleFullscreen} size="small">
              {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
            </IconButton>
          </Box>
        </Box>
        
        <ControlsContainer>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel id="metric-select-label">Metric</InputLabel>
            <Select
              labelId="metric-select-label"
              value={metric}
              label="Metric"
              onChange={(e) => setMetric(e.target.value as any)}
            >
              <MenuItem value="impact">Tariff Impact</MenuItem>
              <MenuItem value="currentRate">Current Rate</MenuItem>
              <MenuItem value="projectedRate">Projected Rate</MenuItem>
              <MenuItem value="tradeVolume">Trade Volume</MenuItem>
            </Select>
          </FormControl>
          
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel id="insight-select-label">Insights</InputLabel>
            <Select
              labelId="insight-select-label"
              value={selectedInsightLevel}
              label="Insights"
              onChange={(e) => setSelectedInsightLevel(e.target.value)}
            >
              <MenuItem value="all">All Insights</MenuItem>
              <MenuItem value="critical">Critical Only</MenuItem>
              <MenuItem value="high">High & Critical</MenuItem>
              <MenuItem value="medium">Medium & Above</MenuItem>
              <MenuItem value="low">Low & Above</MenuItem>
            </Select>
          </FormControl>
          
          <Box sx={{ width: 180, mx: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Threshold: {threshold}%
            </Typography>
            <Slider
              size="small"
              value={threshold}
              onChange={handleThresholdChange}
              aria-label="Threshold"
              min={0}
              max={10}
              step={0.5}
            />
          </Box>
          
          <FormControlLabel
            control={
              <Switch
                checked={isColorblindMode}
                onChange={(e) => setIsColorblindMode(e.target.checked)}
                name="colorblindMode"
                size="small"
              />
            }
            label="Colorblind Mode"
          />
        </ControlsContainer>
        
        <Box sx={{ position: 'relative' }}>
          <HeatmapContainer sx={{ height: isFullscreen ? 'calc(100vh - 200px)' : '550px' }}>
            {loading ? (
              <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                <CircularProgress />
              </Box>
            ) : (
              <>
                <svg 
                  ref={svgRef} 
                  width="100%" 
                  height="100%" 
                  viewBox={`0 0 ${width} ${height}`}
                  preserveAspectRatio="xMidYMid meet"
                />
                <CellTooltip ref={tooltipRef} />
                
                {/* Legend */}
                <LegendContainer>
                  <Typography variant="caption" fontWeight="bold">
                    {metric === 'impact' ? 'Impact' : 
                     metric === 'currentRate' ? 'Current Rate' : 
                     metric === 'projectedRate' ? 'Projected Rate' : 
                     'Trade Volume'}
                  </Typography>
                  
                  {metric === 'impact' && (
                    <Box display="flex" alignItems="center">
                      <Box 
                        width={20} 
                        height={10} 
                        bgcolor={isColorblindMode ? fioriColors.colorblindScale(20) : fioriColors.negativeScale(20)} 
                        mr={0.5} 
                      />
                      <Typography variant="caption">Negative</Typography>
                      
                      <Box 
                        width={20} 
                        height={10} 
                        bgcolor={isColorblindMode ? fioriColors.colorblindScale(80) : fioriColors.positiveScale(80)} 
                        mx={0.5} 
                      />
                      <Typography variant="caption">Positive</Typography>
                    </Box>
                  )}
                  
                  <Box display="flex" alignItems="center">
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          bgcolor: theme.palette.primary.main,
                          mr: 0.5
                        }}
                      />
                      <Typography variant="caption" fontSize="0.65rem">AI Enhanced</Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          bgcolor: '#E9730C',
                          mr: 0.5
                        }}
                      />
                      <Typography variant="caption" fontSize="0.65rem">Has Insights</Typography>
                    </Box>
                  </Box>
                </LegendContainer>
              </>
            )}
          </HeatmapContainer>
        </Box>
        
        {/* Insights Panel */}
        {filteredInsights.length > 0 && (
          <Box mt={2} p={2} bgcolor={theme.palette.mode === 'dark' ? 'rgba(35,35,64,0.6)' : 'rgba(248,250,252,0.9)'} borderRadius={1}>
            <Typography variant="subtitle1" gutterBottom>
              {selectedCell ? `Insights for ${selectedCell.country} - ${selectedCell.product}` : 'Key Insights'}
              <Chip 
                size="small" 
                label={`${filteredInsights.length} Found`} 
                color="primary" 
                sx={{ ml: 1, height: 20, fontSize: '0.6rem' }}
              />
            </Typography>
            
            <Grid container spacing={2} sx={{ width: '100%' }}>
              {filteredInsights.slice(0, 3).map((insight, index) => (
                <Grid sx={{ width: { xs: '100%', md: '33.33%' } }} key={index}>
                  <Card variant="outlined" sx={{ position: 'relative', height: '100%' }}>
                    <CardContent>
                      <InsightBadge 
                        size="small"
                        label={insight.importance.toUpperCase()} 
                        className={insight.importance}
                      />
                      
                      <Typography variant="subtitle2" gutterBottom>
                        {insight.title}
                      </Typography>
                      
                      <Typography variant="body2" color="text.secondary">
                        {insight.description}
                      </Typography>
                      
                      <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="caption" color="text.secondary">
                          {insight.country} - {insight.productCategory}
                        </Typography>
                        
                        <Chip 
                          size="small" 
                          label={`${(insight.confidence * 100).toFixed(0)}%`} 
                          color={insight.confidence > 0.8 ? "success" : "primary"} 
                          variant="outlined"
                          sx={{ height: 20, fontSize: '0.6rem' }}
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
            
            {filteredInsights.length > 3 && (
              <Typography variant="caption" color="primary" sx={{ display: 'block', mt: 1, textAlign: 'right' }}>
                +{filteredInsights.length - 3} more insights available
              </Typography>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default TariffImpactHeatmapVisualization;
