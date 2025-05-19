import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import { Box, Typography, Chip, Card, CardContent } from '@mui/material';
import { Map, AlertTriangle } from 'lucide-react';

// SCB color palette
const SCB_COLORS = {
  primaryBlue: '#0F5EA2',
  secondaryGreen: '#008D83',
  neutralLight: '#E5E5E5',
  neutralDark: '#333333',
  alertRed: '#D0021B',
  alertAmber: '#F5A623',
};

interface VietnamProvinceData {
  id: string;
  name: string;
  netImpact: number;
  exportVolume: number;
  importVolume: number;
}

interface TradeCorridorData {
  from: string;
  to: string;
  volume: number;
  tariffImpact: number;
}

interface VietnamGeoMapProps {
  provinces: VietnamProvinceData[];
  tradeCorridors?: TradeCorridorData[];
  width?: number;
  height?: number;
  selectedProvince?: string;
  onProvinceSelect?: (provinceId: string) => void;
  loading?: boolean;
}

/**
 * Vietnam Geographic Map Component
 * Displays provincial-level tariff impacts across Vietnam and ASEAN
 * Implements accessibility features for screen readers
 */
const VietnamGeoMap: React.FC<VietnamGeoMapProps> = ({
  provinces,
  tradeCorridors = [],
  width = 800,
  height = 600,
  selectedProvince,
  onProvinceSelect,
  loading = false
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [mapData, setMapData] = useState<any>(null);
  const [hoveredProvince, setHoveredProvince] = useState<VietnamProvinceData | null>(null);
  const [legendVisible, setLegendVisible] = useState<boolean>(true);
  
  // Load Vietnam and ASEAN GeoJSON on component mount
  useEffect(() => {
    // In a real implementation, this would load actual GeoJSON data
    // This is a simplified mock implementation for demonstration
    const mockGeoData = {
      type: "FeatureCollection",
      features: provinces.map(province => ({
        type: "Feature",
        id: province.id,
        properties: {
          name: province.name,
          ...province
        },
        geometry: {
          type: "Point",
          coordinates: getProvinceCoordinates(province.id)
        }
      }))
    };
    
    setMapData(mockGeoData);
  }, [provinces]);
  
  // Get mock coordinates for provinces (in a real impl, would use actual GeoJSON)
  const getProvinceCoordinates = (provinceId: string): [number, number] => {
    // Mock coordinates for demonstration
    const coordinates: {[key: string]: [number, number]} = {
      'hanoi': [105.8342, 21.0278],
      'hochiminh': [106.6297, 10.8231],
      'danang': [108.2022, 16.0544],
      'haiphong': [106.6881, 20.8449],
      'cantho': [105.7852, 10.0341],
      'binhduong': [106.6767, 10.9808],
      'dongna': [106.8296, 11.0686],
      'vungtau': [107.0843, 10.346],
      'khanhhoa': [109.1926, 12.2388],
      'angiang': [105.4202, 10.3881]
    };
    
    return coordinates[provinceId] || [106.0, 16.0]; // Default to center of Vietnam
  };
  
  // Render the map when data is available
  useEffect(() => {
    if (!mapData || !mapRef.current) return;
    
    // Clear previous rendering
    d3.select(mapRef.current).select('svg').remove();
    
    const svg = d3.select(mapRef.current)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('aria-label', 'Geographic map of Vietnam showing tariff impacts by province')
      .attr('role', 'img'); // Accessibility
    
    // Add title for screen readers
    svg.append("title")
      .text("Vietnam Provincial Tariff Impact Map");
    
    // Create a description for screen readers
    svg.append("desc")
      .text("This map visualizes the tariff impact across different provinces in Vietnam, with color intensity representing the severity of impact.");
    
    const g = svg.append('g');
    
    // Create a projection for Vietnam (in a real impl would use proper projection)
    const projection = d3.geoMercator()
      .center([106.0, 16.0]) // Center coordinates of Vietnam
      .scale(width * 3.5)
      .translate([width / 2, height / 2]);
    
    const pathGenerator = d3.geoPath().projection(projection);
    
    // Color scale for impact severity
    const impactColorScale = d3.scaleLinear<string>()
      .domain([-5, 0, 5])
      .range([SCB_COLORS.alertRed, SCB_COLORS.neutralLight, SCB_COLORS.secondaryGreen])
      .interpolate(d3.interpolateRgb);
    
    // In a real implementation, this would render actual province boundaries
    // For this mock version, we'll use circles for provinces
    g.selectAll('circle')
      .data(provinces)
      .enter()
      .append('circle')
      .attr('cx', d => projection(getProvinceCoordinates(d.id))[0])
      .attr('cy', d => projection(getProvinceCoordinates(d.id))[1])
      .attr('r', d => Math.sqrt(d.exportVolume + d.importVolume) / 5)
      .attr('fill', d => impactColorScale(d.netImpact))
      .attr('stroke', d => d.id === selectedProvince ? SCB_COLORS.primaryBlue : '#fff')
      .attr('stroke-width', d => d.id === selectedProvince ? 3 : 1)
      .attr('opacity', 0.8)
      .attr('tabindex', 0) // Make focusable for keyboard navigation
      .attr('aria-label', d => `${d.name} province with net tariff impact of ${d.netImpact}% and trade volume of ${d.exportVolume + d.importVolume} million USD`)
      .on('mouseover', (event, d) => {
        setHoveredProvince(d);
        
        // Show tooltip
        const tooltip = d3.select(tooltipRef.current);
        tooltip.style('opacity', 1)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 10) + 'px');
      })
      .on('mouseout', () => {
        setHoveredProvince(null);
        
        // Hide tooltip
        d3.select(tooltipRef.current).style('opacity', 0);
      })
      .on('click', (_, d) => {
        if (onProvinceSelect) {
          onProvinceSelect(d.id);
        }
      })
      // Keyboard accessibility
      .on('keydown', (event, d) => {
        if (event.key === 'Enter' || event.key === ' ') {
          if (onProvinceSelect) {
            onProvinceSelect(d.id);
          }
        }
      });
    
    // Add labels for provinces
    g.selectAll('text')
      .data(provinces)
      .enter()
      .append('text')
      .attr('x', d => projection(getProvinceCoordinates(d.id))[0])
      .attr('y', d => projection(getProvinceCoordinates(d.id))[1] - 15)
      .attr('text-anchor', 'middle')
      .attr('font-size', '10px')
      .attr('font-family', 'Proxima Nova, Arial, sans-serif')
      .attr('fill', SCB_COLORS.neutralDark)
      .text(d => d.name)
      .attr('aria-hidden', 'true'); // Hide from screen readers as they already get info from the circles
    
    // Add trade corridors if available
    if (tradeCorridors && tradeCorridors.length > 0) {
      // Create routes between Vietnam and trading partners
      const routeColorScale = d3.scaleLinear<string>()
        .domain([-5, 0, 5])
        .range([SCB_COLORS.alertRed, SCB_COLORS.neutralLight, SCB_COLORS.secondaryGreen])
        .interpolate(d3.interpolateRgb);
      
      // Define positions for trading partners (in real implementation, would use actual coordinates)
      const tradingPartnerPositions: {[key: string]: [number, number]} = {
        'singapore': [103.8198, 1.3521],
        'thailand': [100.5018, 13.7563],
        'china': [116.4074, 39.9042],
        'usa': [77.0369, 38.9072], // Washington DC
        'japan': [139.6917, 35.6895],
        'southkorea': [126.9780, 37.5665],
        'eu': [4.3517, 50.8503], // Brussels as EU center
        'malaysia': [101.6869, 3.1390]
      };
      
      // Draw trade corridors
      g.selectAll('line')
        .data(tradeCorridors)
        .enter()
        .append('line')
        .attr('x1', () => projection([106.0, 16.0])[0]) // Center of Vietnam
        .attr('y1', () => projection([106.0, 16.0])[1])
        .attr('x2', d => {
          const coords = tradingPartnerPositions[d.to] || [0, 0];
          return projection(coords)[0];
        })
        .attr('y2', d => {
          const coords = tradingPartnerPositions[d.to] || [0, 0];
          return projection(coords)[1];
        })
        .attr('stroke', d => routeColorScale(d.tariffImpact))
        .attr('stroke-width', d => Math.log(d.volume) / 2)
        .attr('stroke-dasharray', '5,5')
        .attr('opacity', 0.6)
        .attr('aria-label', d => `Trade corridor to ${d.to} with volume of ${d.volume} million USD and tariff impact of ${d.tariffImpact}%`)
        .append('title')
        .text(d => `Trade with ${d.to}: ${d.volume}M USD, Tariff Impact: ${d.tariffImpact > 0 ? '+' : ''}${d.tariffImpact}%`);
      
      // Add trading partner labels
      g.selectAll('.partner-label')
        .data(tradeCorridors)
        .enter()
        .append('text')
        .attr('class', 'partner-label')
        .attr('x', d => {
          const coords = tradingPartnerPositions[d.to] || [0, 0];
          return projection(coords)[0];
        })
        .attr('y', d => {
          const coords = tradingPartnerPositions[d.to] || [0, 0];
          return projection(coords)[1] - 10;
        })
        .attr('text-anchor', 'middle')
        .attr('font-size', '10px')
        .attr('font-family', 'Proxima Nova, Arial, sans-serif')
        .attr('fill', SCB_COLORS.neutralDark)
        .text(d => d.to.charAt(0).toUpperCase() + d.to.slice(1))
        .attr('aria-hidden', 'true');
    }
    
    // Add legend
    if (legendVisible) {
      const legend = svg.append('g')
        .attr('transform', `translate(${width - 150}, ${height - 120})`)
        .attr('aria-label', 'Map legend');
      
      // Legend title
      legend.append('text')
        .attr('x', 0)
        .attr('y', 0)
        .attr('font-size', '12px')
        .attr('font-weight', 'bold')
        .attr('font-family', 'Proxima Nova, Arial, sans-serif')
        .text('Tariff Impact');
      
      // Legend color scale
      const legendScale = [-5, -2.5, 0, 2.5, 5];
      const legendHeight = 15;
      
      legendScale.forEach((value, i) => {
        legend.append('rect')
          .attr('x', 0)
          .attr('y', 20 + i * legendHeight)
          .attr('width', 15)
          .attr('height', legendHeight)
          .attr('fill', impactColorScale(value));
        
        legend.append('text')
          .attr('x', 20)
          .attr('y', 20 + i * legendHeight + 10)
          .attr('font-size', '10px')
          .attr('font-family', 'Proxima Nova, Arial, sans-serif')
          .text(`${value > 0 ? '+' : ''}${value}%`);
      });
    }
    
  }, [mapData, provinces, tradeCorridors, width, height, selectedProvince, onProvinceSelect, legendVisible]);
  
  return (
    <Box className="vietnam-geo-map" position="relative">
      {loading && (
        <Box 
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          display="flex"
          alignItems="center"
          justifyContent="center"
          bgcolor="rgba(255,255,255,0.7)"
          zIndex={2}
        >
          <div className="animate-spin h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full"></div>
        </Box>
      )}
      
      <Box 
        ref={mapRef} 
        width={width} 
        height={height} 
        border={`1px solid ${SCB_COLORS.neutralLight}`}
        borderRadius="4px"
        overflow="hidden"
        bgcolor="#fff"
        aria-label="Geographic visualization of Vietnam tariff impacts"
        role="img"
        position="relative"
      >
        {/* Map will be rendered here */}
      </Box>
      
      {/* Tooltip */}
      <div 
        ref={tooltipRef} 
        style={{
          position: 'absolute',
          opacity: 0,
          background: 'white',
          border: `1px solid ${SCB_COLORS.neutralLight}`,
          borderRadius: '4px',
          padding: '10px',
          pointerEvents: 'none',
          zIndex: 10,
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          transition: 'opacity 0.2s'
        }}
      >
        {hoveredProvince && (
          <div>
            <Typography variant="subtitle2" gutterBottom>
              {hoveredProvince.name}
            </Typography>
            <Typography variant="body2" color={hoveredProvince.netImpact > 0 ? SCB_COLORS.secondaryGreen : SCB_COLORS.alertRed}>
              Net Impact: {hoveredProvince.netImpact > 0 ? '+' : ''}{hoveredProvince.netImpact}%
            </Typography>
            <Typography variant="body2">
              Exports: {hoveredProvince.exportVolume}M USD
            </Typography>
            <Typography variant="body2">
              Imports: {hoveredProvince.importVolume}M USD
            </Typography>
          </div>
        )}
      </div>
      
      {/* Controls and Info */}
      <Box mt={2} display="flex" justifyContent="space-between">
        <Card sx={{ maxWidth: 350 }}>
          <CardContent>
            <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <Map size={16} style={{ marginRight: '8px' }} />
              Vietnam Provincial Impact Map
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              This map visualizes tariff impacts across Vietnam provinces, with corridors showing major trading relationships.
            </Typography>
            <Box display="flex" gap={1} flexWrap="wrap">
              <Chip 
                size="small" 
                label="Circle Size = Trade Volume" 
                sx={{ bgcolor: '#f5f5f5' }}
              />
              <Chip 
                size="small" 
                label="Color = Net Impact" 
                sx={{ bgcolor: '#f5f5f5' }}
              />
            </Box>
            <Box display="flex" alignItems="center" mt={2}>
              <AlertTriangle size={14} color={SCB_COLORS.alertAmber} style={{ marginRight: '8px' }} />
              <Typography variant="caption" color="text.secondary">
                This visualization uses approximate geographic positioning for demonstration purposes.
              </Typography>
            </Box>
          </CardContent>
        </Card>
        
        <Box display="flex" gap={1}>
          <Chip 
            label="Toggle Legend" 
            variant={legendVisible ? "filled" : "outlined"}
            onClick={() => setLegendVisible(!legendVisible)}
            color="primary"
          />
        </Box>
      </Box>
    </Box>
  );
};

export default VietnamGeoMap;
