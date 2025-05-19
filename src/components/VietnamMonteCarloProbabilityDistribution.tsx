import React, { useRef, useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Grid,
  Slider,
  Tooltip,
  IconButton,
  CircularProgress
} from '@mui/material';
import { Info, ZoomIn, ZoomOut, Download } from 'lucide-react';
import * as d3 from 'd3';

interface ProbabilityDistributionProps {
  data: number[] | null;
  metricName?: string;
  metricUnit?: string;
  loading?: boolean;
  caseBoundaries?: {
    pessimistic: [number, number]; // percentiles [0-100]
    realistic: [number, number];
    optimistic: [number, number];
  };
  onSliderChange?: (value: number) => void;
}

// Default case boundaries if not provided
const defaultCaseBoundaries = {
  pessimistic: [0, 5],
  realistic: [5, 95],
  optimistic: [95, 100]
};

// SCB color scheme as defined in the spec
const colors = {
  pessimistic: '#d60542', // red
  realistic: '#3267d4',   // medium blue
  optimistic: '#31ddc1',  // light blue/teal
  gridLines: '#8c94ac',   // gray
  background: '#f8f9fb',  // light gray
  primaryBlue: '#042278', // primary brand color
  purple: '#a87fff'       // highlighting elements
};

/**
 * Vietnam Monte Carlo Probability Distribution Visualization
 * Renders a histogram with probability distribution curve and case analysis boundaries
 */
export const VietnamMonteCarloProbabilityDistribution: React.FC<ProbabilityDistributionProps> = ({
  data,
  metricName = 'Revenue Impact',
  metricUnit = '$M',
  loading = false,
  caseBoundaries = defaultCaseBoundaries,
  onSliderChange
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [sliderValue, setSliderValue] = useState<number>(50);
  const [sliderMetric, setSliderMetric] = useState<number | null>(null);
  const [percentileInfo, setPercentileInfo] = useState<{
    value: number | null;
    percentile: number | null;
  }>({ value: null, percentile: null });

  // Format numbers for display
  const formatNumber = (num: number): string => {
    if (Math.abs(num) >= 1_000_000) {
      return `${(num / 1_000_000).toFixed(1)}M`;
    } else if (Math.abs(num) >= 1_000) {
      return `${(num / 1_000).toFixed(1)}K`;
    } else {
      return num.toFixed(2);
    }
  };

  // Format currency values
  const formatCurrency = (num: number): string => {
    if (metricUnit === '$M') {
      return `$${formatNumber(num)}`;
    } else if (metricUnit === '$K') {
      return `$${formatNumber(num * 1000)}`;
    } else {
      return `${formatNumber(num)}${metricUnit}`;
    }
  };

  // Handle slider change
  const handleSliderChange = (_event: Event, newValue: number | number[]) => {
    const value = Array.isArray(newValue) ? newValue[0] : newValue;
    setSliderValue(value);
    
    if (onSliderChange) {
      onSliderChange(value);
    }
    
    // Calculate metric value at this percentile
    if (data && data.length > 0) {
      const sortedData = [...data].sort((a, b) => a - b);
      const index = Math.floor((value / 100) * sortedData.length);
      const metricValue = sortedData[Math.min(index, sortedData.length - 1)];
      setSliderMetric(metricValue);
    }
  };

  // Render the probability distribution visualization
  useEffect(() => {
    if (!data || data.length === 0 || !svgRef.current) return;

    // Clear previous visualization
    d3.select(svgRef.current).selectAll('*').remove();

    // Set up dimensions
    const margin = { top: 20, right: 30, bottom: 60, left: 50 };
    const width = svgRef.current.clientWidth - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    // Create SVG
    const svg = d3.select(svgRef.current)
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Sort data and calculate min/max values
    const sortedData = [...data].sort((a, b) => a - b);
    const minValue = sortedData[0];
    const maxValue = sortedData[sortedData.length - 1];
    const range = maxValue - minValue;
    const padding = range * 0.05;

    // X scale
    const x = d3.scaleLinear()
      .domain([minValue - padding, maxValue + padding])
      .range([0, width]);

    // Calculate histogram bins
    const numBins = Math.min(50, Math.ceil(Math.sqrt(data.length)));
    const histogram = d3.histogram<number, number>()
      .value(d => d)
      .domain(x.domain())
      .thresholds(x.ticks(numBins));

    const bins = histogram(data);

    // Y scale (for histogram)
    const y = d3.scaleLinear()
      .domain([0, d3.max(bins, d => d.length) || 0])
      .range([height, 0]);

    // Create X axis
    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x).tickFormat(d => formatCurrency(d as number)))
      .attr('color', colors.gridLines)
      .selectAll('text')
      .attr('transform', 'translate(-10,5)rotate(-45)')
      .style('text-anchor', 'end')
      .style('font-size', '10px');

    // Create Y axis
    svg.append('g')
      .call(d3.axisLeft(y).ticks(5).tickFormat(d => `${d}`))
      .attr('color', colors.gridLines);

    // Add X axis label
    svg.append('text')
      .attr('text-anchor', 'middle')
      .attr('x', width / 2)
      .attr('y', height + margin.bottom - 5)
      .style('font-size', '12px')
      .text(metricName);

    // Add Y axis label
    svg.append('text')
      .attr('text-anchor', 'middle')
      .attr('transform', 'rotate(-90)')
      .attr('y', -margin.left + 15)
      .attr('x', -height / 2)
      .style('font-size', '12px')
      .text('Frequency');

    // Calculate percentile values for case boundaries
    const getPercentileValue = (percentile: number) => {
      const index = Math.floor((percentile / 100) * sortedData.length);
      return sortedData[Math.min(index, sortedData.length - 1)];
    };

    const boundaries = {
      pessimistic: [
        getPercentileValue(caseBoundaries.pessimistic[0]),
        getPercentileValue(caseBoundaries.pessimistic[1])
      ],
      realistic: [
        getPercentileValue(caseBoundaries.realistic[0]),
        getPercentileValue(caseBoundaries.realistic[1])
      ],
      optimistic: [
        getPercentileValue(caseBoundaries.optimistic[0]),
        getPercentileValue(caseBoundaries.optimistic[1])
      ]
    };

    // Draw histogram bars with case coloring
    svg.selectAll('rect')
      .data(bins)
      .enter()
      .append('rect')
      .attr('x', d => x(d.x0 as number))
      .attr('width', d => Math.max(0, x(d.x1 as number) - x(d.x0 as number) - 1))
      .attr('y', d => y(d.length))
      .attr('height', d => height - y(d.length))
      .attr('fill', d => {
        const binMidpoint = ((d.x0 as number) + (d.x1 as number)) / 2;
        if (binMidpoint <= boundaries.pessimistic[1]) {
          return colors.pessimistic;
        } else if (binMidpoint <= boundaries.realistic[1]) {
          return colors.realistic;
        } else {
          return colors.optimistic;
        }
      })
      .attr('opacity', 0.8)
      .on('mouseover', function(event, d) {
        const [mouseX, mouseY] = d3.pointer(event);
        
        if (tooltipRef.current) {
          const tooltip = d3.select(tooltipRef.current);
          const binStart = formatCurrency(d.x0 as number);
          const binEnd = formatCurrency(d.x1 as number);
          const count = d.length;
          const percentage = ((count / data.length) * 100).toFixed(1);
          
          tooltip.html(`
            <div style="font-weight: bold">${binStart} to ${binEnd}</div>
            <div>Count: ${count} (${percentage}%)</div>
          `);
          
          tooltip
            .style('left', `${mouseX + margin.left + 15}px`)
            .style('top', `${mouseY + margin.top - 25}px`)
            .style('visibility', 'visible');
        }
        
        d3.select(this)
          .attr('opacity', 1)
          .attr('stroke', '#000')
          .attr('stroke-width', 1);
      })
      .on('mouseout', function() {
        if (tooltipRef.current) {
          d3.select(tooltipRef.current)
            .style('visibility', 'hidden');
        }
        
        d3.select(this)
          .attr('opacity', 0.8)
          .attr('stroke', 'none');
      });

    // Calculate kernel density estimation for the distribution curve
    const kde = kernelDensityEstimator(kernelEpanechnikov(0.7), x.ticks(100));
    const density = kde(data);

    // Y scale for density curve (separate from histogram)
    const yDensity = d3.scaleLinear()
      .domain([0, d3.max(density, d => d[1]) || 0])
      .range([height, 0]);

    // Draw density curve
    svg.append('path')
      .datum(density)
      .attr('fill', 'none')
      .attr('stroke', colors.purple)
      .attr('stroke-width', 2)
      .attr('stroke-linejoin', 'round')
      .attr('d', d3.line<[number, number]>()
        .curve(d3.curveBasis)
        .x(d => x(d[0]))
        .y(d => yDensity(d[1]))
      );

    // Draw case division lines
    const drawCaseLine = (value: number, color: string, label: string) => {
      const xPos = x(value);
      
      // Draw vertical line
      svg.append('line')
        .attr('x1', xPos)
        .attr('x2', xPos)
        .attr('y1', 0)
        .attr('y2', height)
        .attr('stroke', color)
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '5,5');
      
      // Add label
      svg.append('text')
        .attr('x', xPos)
        .attr('y', height + 30)
        .attr('text-anchor', 'middle')
        .style('font-size', '10px')
        .style('fill', color)
        .text(label);
    };

    // Draw case boundary lines
    drawCaseLine(boundaries.pessimistic[1], colors.pessimistic, 'Pessimistic');
    drawCaseLine(boundaries.realistic[1], colors.optimistic, 'Optimistic');

    // Draw key percentile indicators
    [5, 25, 50, 75, 95].forEach(percentile => {
      const value = getPercentileValue(percentile);
      const xPos = x(value);
      
      // Skip if too close to case boundaries
      if (
        Math.abs(xPos - x(boundaries.pessimistic[1])) < 30 ||
        Math.abs(xPos - x(boundaries.realistic[1])) < 30
      ) {
        return;
      }
      
      // Only draw P50 (median) with label
      if (percentile === 50) {
        svg.append('line')
          .attr('x1', xPos)
          .attr('x2', xPos)
          .attr('y1', 0)
          .attr('y2', height)
          .attr('stroke', colors.primaryBlue)
          .attr('stroke-width', 2);
        
        svg.append('text')
          .attr('x', xPos)
          .attr('y', height + 30)
          .attr('text-anchor', 'middle')
          .style('font-size', '10px')
          .style('fill', colors.primaryBlue)
          .text('Median');
      } else {
        // Draw small tick marks for other percentiles
        svg.append('line')
          .attr('x1', xPos)
          .attr('x2', xPos)
          .attr('y1', height - 5)
          .attr('y2', height + 5)
          .attr('stroke', colors.gridLines)
          .attr('stroke-width', 1);
        
        svg.append('text')
          .attr('x', xPos)
          .attr('y', height + 15)
          .attr('text-anchor', 'middle')
          .style('font-size', '8px')
          .style('fill', colors.gridLines)
          .text(`P${percentile}`);
      }
    });

    // Draw slider position indicator
    if (sliderMetric !== null) {
      const sliderX = x(sliderMetric);
      
      svg.append('line')
        .attr('x1', sliderX)
        .attr('x2', sliderX)
        .attr('y1', 0)
        .attr('y2', height)
        .attr('stroke', '#000')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '3,3');
      
      svg.append('circle')
        .attr('cx', sliderX)
        .attr('cy', height / 2)
        .attr('r', 5)
        .attr('fill', '#000');
    }

    // Update percentile info for display
    if (data && sliderValue !== null) {
      const sortedData = [...data].sort((a, b) => a - b);
      const index = Math.floor((sliderValue / 100) * sortedData.length);
      const value = sortedData[Math.min(index, sortedData.length - 1)];
      
      setPercentileInfo({
        value,
        percentile: sliderValue
      });
    }

    // Helper functions for kernel density estimation
    function kernelDensityEstimator(kernel: (v: number) => number, X: number[]) {
      return function(V: number[]) {
        return X.map(x => [x, d3.mean(V, v => kernel(x - v)) || 0]);
      };
    }

    function kernelEpanechnikov(k: number) {
      return function(v: number) {
        return Math.abs(v /= k) <= 1 ? 0.75 * (1 - v * v) / k : 0;
      };
    }
  }, [data, caseBoundaries, metricName, metricUnit, sliderMetric]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      // Redraw the chart on window resize
      if (data && data.length > 0) {
        d3.select(svgRef.current).selectAll('*').remove();
        // The useEffect above will redraw the chart
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [data]);

  return (
    <Card elevation={2} sx={{ mb: 3, height: '100%' }}>
      <CardHeader
        title={`Probability Distribution - ${metricName}`}
        action={
          <Box sx={{ display: 'flex' }}>
            <Tooltip title="Download as PNG">
              <IconButton size="small" sx={{ mr: 1 }}>
                <Download size={16} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Zoom in">
              <IconButton size="small" sx={{ mr: 1 }}>
                <ZoomIn size={16} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Zoom out">
              <IconButton size="small">
                <ZoomOut size={16} />
              </IconButton>
            </Tooltip>
          </Box>
        }
        sx={{ 
          bgcolor: '#042278', 
          color: 'white',
          '& .MuiCardHeader-action': { color: 'white' }
        }}
      />
      <CardContent sx={{ position: 'relative', height: 'calc(100% - 72px)' }}>
        {loading ? (
          <Box 
            sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center',
              height: '100%'
            }}
          >
            <CircularProgress />
            <Typography variant="body2" sx={{ ml: 2 }}>
              Running simulation...
            </Typography>
          </Box>
        ) : data && data.length > 0 ? (
          <>
            <Box sx={{ height: 400 }}>
              <svg ref={svgRef} width="100%" height="400" />
              <div 
                ref={tooltipRef} 
                style={{
                  position: 'absolute',
                  visibility: 'hidden',
                  backgroundColor: 'white',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  padding: '8px',
                  pointerEvents: 'none',
                  fontSize: '12px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
              />
            </Box>
            
            <Box sx={{ mt: 3 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={3}>
                  <Typography variant="body2">
                    Percentile selector:
                  </Typography>
                </Grid>
                <Grid item xs={12} md={7}>
                  <Slider
                    value={sliderValue}
                    onChange={handleSliderChange as any}
                    aria-labelledby="percentile-slider"
                    valueLabelDisplay="auto"
                    step={1}
                    min={0}
                    max={100}
                    valueLabelFormat={value => `P${value}`}
                    sx={{ color: colors.primaryBlue }}
                  />
                </Grid>
                <Grid item xs={12} md={2}>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', textAlign: 'right' }}>
                    {percentileInfo.value !== null ? 
                      `${formatCurrency(percentileInfo.value)}` : ''}
                  </Typography>
                </Grid>
              </Grid>
              
              <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
                At the {sliderValue}th percentile, the {metricName.toLowerCase()} is {
                  percentileInfo.value !== null ? formatCurrency(percentileInfo.value) : ''
                }
              </Typography>
            </Box>
          </>
        ) : (
          <Box 
            sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center',
              height: '100%'
            }}
          >
            <Typography variant="body1">
              Run the simulation to see probability distribution
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default VietnamMonteCarloProbabilityDistribution;
