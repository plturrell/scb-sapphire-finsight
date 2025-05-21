import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Info, Map, AlertTriangle, Eye, EyeOff, ZoomIn, ZoomOut, RefreshCw, Download, Wifi, WifiOff } from 'lucide-react';
import { useDeviceCapabilities } from '@/hooks/useDeviceCapabilities';
import { useNetworkAwareLoading } from '@/hooks/useNetworkAwareLoading';

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

interface EnhancedVietnamGeoMapProps {
  provinces: VietnamProvinceData[];
  tradeCorridors?: TradeCorridorData[];
  width?: number;
  height?: number;
  selectedProvince?: string;
  onProvinceSelect?: (provinceId: string) => void;
  loading?: boolean;
  className?: string;
  theme?: 'light' | 'dark';
  showControls?: boolean;
  enableZoom?: boolean;
  initialZoom?: number;
  showLegend?: boolean;
  showCorridors?: boolean;
  adaptiveDetail?: boolean;
  exportable?: boolean;
}

/**
 * EnhancedVietnamGeoMap Component
 * An enhanced geographic map component for Vietnam with SCB Beautiful UI styling
 * that displays provincial-level tariff impacts across Vietnam and ASEAN
 */
const EnhancedVietnamGeoMap: React.FC<EnhancedVietnamGeoMapProps> = ({
  provinces,
  tradeCorridors = [],
  width = 800,
  height = 600,
  selectedProvince,
  onProvinceSelect,
  loading = false,
  className = '',
  theme: propTheme,
  showControls = true,
  enableZoom = true,
  initialZoom = 1,
  showLegend = true,
  showCorridors = true,
  adaptiveDetail = true,
  exportable = false
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [mapData, setMapData] = useState<any>(null);
  const [hoveredProvince, setHoveredProvince] = useState<VietnamProvinceData | null>(null);
  const [legendVisible, setLegendVisible] = useState<boolean>(showLegend);
  const [corridorsVisible, setCorridorsVisible] = useState<boolean>(showCorridors);
  const [currentZoom, setCurrentZoom] = useState<number>(initialZoom);
  const [mapLoaded, setMapLoaded] = useState<boolean>(false);
  
  const { prefersColorScheme, tier, reduceMotion } = useDeviceCapabilities();
  const { connection, strategy } = useNetworkAwareLoading();
  
  // Determine effective theme based on props or system preference
  const theme = propTheme || prefersColorScheme || 'light';
  
  // Adaptive detail level based on network and device tier
  const detailLevel = adaptiveDetail ? 
    (connection.type === 'slow-2g' || connection.type === '2g' || tier === 'low') ? 'low' :
    connection.type === '3g' ? 'medium' : 'high' : 'high';
  
  // Define SCB colors based on theme
  const scbColors = {
    light: {
      primaryBlue: 'rgb(var(--scb-honolulu-blue, 0, 114, 170))', // #0072AA
      secondaryGreen: 'rgb(var(--scb-american-green, 33, 170, 71))', // #21AA47
      purple: '#cc00dc',
      sun: 'rgb(var(--scb-sun, 255, 204, 0))', // #FFCC00
      persianRed: 'rgb(var(--scb-persian-red, 204, 0, 0))', // #CC0000
      background: 'white',
      cardBackground: 'white',
      text: '#333333',
      textSecondary: '#666666',
      border: '#e0e0e0',
      hoverBackground: 'rgba(0, 114, 170, 0.08)',
      tooltipBackground: 'white',
      tooltipBorder: '#e0e0e0',
      selectionRing: 'rgb(var(--scb-honolulu-blue, 0, 114, 170))',
      infoBackground: 'rgba(0, 114, 170, 0.08)',
      chipBackground: '#f5f5f5',
      chipBackgroundActive: 'rgba(0, 114, 170, 0.15)',
      mapWater: '#f0f7ff',
      networkIndicator: {
        good: 'rgb(var(--scb-american-green, 33, 170, 71))', // Green
        warning: 'rgb(var(--scb-sun, 255, 204, 0))', // Yellow
        bad: 'rgb(var(--scb-persian-red, 204, 0, 0))' // Red
      }
    },
    dark: {
      primaryBlue: 'rgb(0, 142, 211)', // Lighter for dark mode
      secondaryGreen: 'rgb(41, 204, 86)', // Lighter for dark mode
      purple: '#e838f1',
      sun: 'rgb(255, 214, 51)', // Lighter for dark mode
      persianRed: 'rgb(255, 99, 99)', // Lighter for dark mode
      background: '#121212',
      cardBackground: '#1e1e1e',
      text: '#e0e0e0',
      textSecondary: '#a0a0a0',
      border: '#333333',
      hoverBackground: 'rgba(0, 142, 211, 0.15)',
      tooltipBackground: '#242424',
      tooltipBorder: '#333333',
      selectionRing: 'rgb(0, 142, 211)',
      infoBackground: 'rgba(0, 142, 211, 0.1)',
      chipBackground: '#333333',
      chipBackgroundActive: 'rgba(0, 142, 211, 0.25)',
      mapWater: '#192a3b',
      networkIndicator: {
        good: 'rgb(41, 204, 86)', // Lighter green
        warning: 'rgb(255, 214, 51)', // Lighter yellow
        bad: 'rgb(255, 99, 99)' // Lighter red
      }
    }
  };
  
  const colors = scbColors[theme];

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
    
    // Simulate network-aware loading
    const loadTime = 
      connection.type === 'slow-2g' ? 1500 : 
      connection.type === '2g' ? 1000 : 
      connection.type === '3g' ? 500 : 0;
    
    const timer = setTimeout(() => {
      setMapData(mockGeoData);
      setMapLoaded(true);
    }, loadTime);
    
    return () => clearTimeout(timer);
  }, [provinces, connection.type]);

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
    
    // Store reference to SVG element
    svgRef.current = svg.node();
    
    // Add title for screen readers
    svg.append("title")
      .text("Vietnam Provincial Tariff Impact Map");
    
    // Create a description for screen readers
    svg.append("desc")
      .text("This map visualizes the tariff impact across different provinces in Vietnam, with color intensity representing the severity of impact.");
    
    // Create a group for map elements
    const g = svg.append('g');
    
    // Create a background rectangle for the map
    svg.append('rect')
      .attr('width', width)
      .attr('height', height)
      .attr('fill', colors.mapWater)
      .attr('rx', 8)
      .attr('ry', 8);
    
    // Create a projection for Vietnam (in a real impl would use proper projection)
    const projection = d3.geoMercator()
      .center([106.0, 16.0]) // Center coordinates of Vietnam
      .scale(width * 3.5 * currentZoom)
      .translate([width / 2, height / 2]);
    
    const pathGenerator = d3.geoPath().projection(projection);
    
    // Color scale for impact severity
    const impactColorScale = d3.scaleLinear<string>()
      .domain([-5, 0, 5])
      .range([colors.persianRed, theme === 'dark' ? '#444444' : '#f0f0f0', colors.secondaryGreen])
      .interpolate(d3.interpolateRgb);
    
    // In a real implementation, this would render actual province boundaries
    // For this mock version, we'll use circles for provinces
    g.selectAll('circle')
      .data(provinces)
      .enter()
      .append('circle')
      .attr('cx', d => projection(getProvinceCoordinates(d.id))[0])
      .attr('cy', d => projection(getProvinceCoordinates(d.id))[1])
      .attr('r', d => Math.sqrt(d.exportVolume + d.importVolume) / (detailLevel === 'low' ? 6 : 5))
      .attr('fill', d => impactColorScale(d.netImpact))
      .attr('stroke', d => d.id === selectedProvince ? colors.selectionRing : theme === 'dark' ? '#555555' : '#ffffff')
      .attr('stroke-width', d => d.id === selectedProvince ? 3 : 1)
      .attr('opacity', 0.85)
      .attr('tabindex', 0) // Make focusable for keyboard navigation
      .attr('aria-label', d => `${d.name} province with net tariff impact of ${d.netImpact}% and trade volume of ${d.exportVolume + d.importVolume} million USD`)
      .on('mouseover', (event, d) => {
        setHoveredProvince(d);
        
        // Show tooltip
        const tooltip = d3.select(tooltipRef.current);
        tooltip.style('opacity', 1)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 10) + 'px');
        
        // Highlight the province
        d3.select(event.target)
          .transition()
          .duration(reduceMotion ? 0 : 200)
          .attr('stroke-width', 3)
          .attr('stroke', colors.selectionRing)
          .attr('opacity', 1);
      })
      .on('mouseout', (event) => {
        setHoveredProvince(null);
        
        // Hide tooltip
        d3.select(tooltipRef.current).style('opacity', 0);
        
        // Return to normal state if not selected
        const provinceData = d3.select(event.target).datum() as VietnamProvinceData;
        if (provinceData.id !== selectedProvince) {
          d3.select(event.target)
            .transition()
            .duration(reduceMotion ? 0 : 200)
            .attr('stroke-width', 1)
            .attr('stroke', theme === 'dark' ? '#555555' : '#ffffff')
            .attr('opacity', 0.85);
        }
      })
      .on('click', (event, d) => {
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
    
    // Add labels for provinces if not using low detail
    if (detailLevel !== 'low') {
      g.selectAll('text')
        .data(provinces)
        .enter()
        .append('text')
        .attr('x', d => projection(getProvinceCoordinates(d.id))[0])
        .attr('y', d => projection(getProvinceCoordinates(d.id))[1] - 15)
        .attr('text-anchor', 'middle')
        .attr('font-size', detailLevel === 'high' ? '10px' : '9px')
        .attr('font-family', 'Proxima Nova, Arial, sans-serif')
        .attr('fill', colors.text)
        .attr('stroke', theme === 'dark' ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.5)')
        .attr('stroke-width', 0.5)
        .attr('paint-order', 'stroke')
        .text(d => d.name)
        .attr('aria-hidden', 'true'); // Hide from screen readers as they already get info from the circles
    }
    
    // Add trade corridors if available and enabled
    if (tradeCorridors && tradeCorridors.length > 0 && corridorsVisible) {
      // Create routes between Vietnam and trading partners
      const routeColorScale = d3.scaleLinear<string>()
        .domain([-5, 0, 5])
        .range([colors.persianRed, theme === 'dark' ? '#555555' : '#e0e0e0', colors.secondaryGreen])
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
      
      // Draw trade corridors with different styles based on detail level
      const corridorStyle = detailLevel === 'high' ? '5,5' : detailLevel === 'medium' ? '8,8' : '10,10';
      const corridorOpacity = detailLevel === 'high' ? 0.7 : detailLevel === 'medium' ? 0.6 : 0.5;
      
      // Filter corridors for low detail mode to reduce visual complexity
      const displayCorridors = detailLevel === 'low' 
        ? tradeCorridors.filter(c => c.volume > 100) // Only show major corridors
        : tradeCorridors;
      
      // Draw trade corridors
      g.selectAll('line')
        .data(displayCorridors)
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
        .attr('stroke-width', d => Math.log(d.volume) / (detailLevel === 'low' ? 3 : 2))
        .attr('stroke-dasharray', corridorStyle)
        .attr('opacity', corridorOpacity)
        .attr('aria-label', d => `Trade corridor to ${d.to} with volume of ${d.volume} million USD and tariff impact of ${d.tariffImpact}%`)
        .append('title')
        .text(d => `Trade with ${d.to}: ${d.volume}M USD, Tariff Impact: ${d.tariffImpact > 0 ? '+' : ''}${d.tariffImpact}%`);
      
      // Add trading partner labels if not in low detail mode
      if (detailLevel !== 'low') {
        g.selectAll('.partner-label')
          .data(displayCorridors)
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
          .attr('font-size', detailLevel === 'high' ? '10px' : '9px')
          .attr('font-family', 'Proxima Nova, Arial, sans-serif')
          .attr('fill', colors.text)
          .attr('stroke', theme === 'dark' ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.5)')
          .attr('stroke-width', 0.5)
          .attr('paint-order', 'stroke')
          .text(d => d.to.charAt(0).toUpperCase() + d.to.slice(1))
          .attr('aria-hidden', 'true');
      }
    }
    
    // Add legend if enabled
    if (legendVisible) {
      const legendX = width - (detailLevel === 'high' ? 150 : 130);
      const legendY = height - (detailLevel === 'high' ? 120 : 100);
      
      const legend = svg.append('g')
        .attr('transform', `translate(${legendX}, ${legendY})`)
        .attr('aria-label', 'Map legend');
      
      // Background for legend
      legend.append('rect')
        .attr('x', -10)
        .attr('y', -15)
        .attr('width', detailLevel === 'high' ? 130 : 110)
        .attr('height', detailLevel === 'high' ? 115 : 95)
        .attr('fill', theme === 'dark' ? 'rgba(30,30,30,0.8)' : 'rgba(255,255,255,0.8)')
        .attr('stroke', colors.border)
        .attr('rx', 4)
        .attr('ry', 4);
      
      // Legend title
      legend.append('text')
        .attr('x', 0)
        .attr('y', 0)
        .attr('font-size', '12px')
        .attr('font-weight', 'bold')
        .attr('font-family', 'Proxima Nova, Arial, sans-serif')
        .attr('fill', colors.text)
        .text('Tariff Impact');
      
      // Legend color scale
      const legendScale = [-5, -2.5, 0, 2.5, 5];
      const legendHeight = detailLevel === 'high' ? 15 : 13;
      
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
          .attr('font-size', detailLevel === 'high' ? '10px' : '9px')
          .attr('font-family', 'Proxima Nova, Arial, sans-serif')
          .attr('fill', colors.text)
          .text(`${value > 0 ? '+' : ''}${value}%`);
      });
    }
    
    // Add adaptive detail note if using low detail mode
    if (detailLevel === 'low' && adaptiveDetail) {
      const noteGroup = svg.append('g')
        .attr('transform', `translate(${width - 20}, ${20})`)
        .attr('text-anchor', 'end');
      
      noteGroup.append('rect')
        .attr('x', -190)
        .attr('y', -15)
        .attr('width', 190)
        .attr('height', 25)
        .attr('fill', theme === 'dark' ? 'rgba(30,30,30,0.8)' : 'rgba(255,255,255,0.8)')
        .attr('stroke', colors.border)
        .attr('rx', 4)
        .attr('ry', 4);
      
      noteGroup.append('text')
        .attr('y', 5)
        .attr('font-size', '10px')
        .attr('font-family', 'Proxima Nova, Arial, sans-serif')
        .attr('fill', colors.textSecondary)
        .text(`Simplified view for ${
          connection.type === 'slow-2g' || connection.type === '2g' 
            ? 'slow network' 
            : tier === 'low' 
              ? 'improved performance' 
              : 'current conditions'
        }`);
    }
    
    // Add zoom behavior if enabled
    if (enableZoom) {
      const zoom = d3.zoom()
        .scaleExtent([0.5, 5])
        .on('zoom', (event) => {
          g.attr('transform', event.transform);
          setCurrentZoom(event.transform.k);
        });
      
      svg.call(zoom as any);
    }
    
  }, [
    mapData, 
    provinces, 
    tradeCorridors, 
    width, 
    height, 
    selectedProvince, 
    onProvinceSelect, 
    legendVisible, 
    corridorsVisible, 
    currentZoom, 
    enableZoom,, 
    detailLevel, 
    reduceMotion, 
    theme, 
    colors, 
    adaptiveDetail, 
    tier
  ]);
  
  // Export map as PNG
  const exportMap = () => {
    if (!svgRef.current) return;
    
    const svg = svgRef.current;
    const serializer = new XMLSerializer();
    const svgData = serializer.serializeToString(svg);
    const canvas = document.createElement('canvas');
    canvas.width = width * 2; // Higher resolution
    canvas.height = height * 2; // Higher resolution
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = 'vietnam-tariff-impact-map.png';
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };
  
  // Get network status color
  const getNetworkStatusColor = () => {
    if (connection.type === 'offline') {
      return colors.networkIndicator.bad;
    } else if (connection.saveData || connection.type === 'slow-2g' || connection.type === '2g') {
      return colors.networkIndicator.warning;
    } else {
      return colors.networkIndicator.good;
    }
  };
  
  // Network status icon
  const NetworkIcon = connection.type === 'offline' ? WifiOff : Wifi;

  return (
    <div 
      className={`vietnam-geo-map relative ${className}`}
      style={{ color: colors.text }}
    >
      {/* Loading overlay */}
      {(loading || !mapLoaded) && (
        <div 
          className="absolute inset-0 flex flex-col items-center justify-center z-10"
          style={{ 
            backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.7)',
            borderRadius: '8px'
          }}
        >
          <div 
            className="animate-spin h-10 w-10 mb-3"
            style={{ 
              borderWidth: '3px',
              borderStyle: 'solid',
              borderColor: `${colors.primaryBlue} transparent transparent transparent`,
              borderRadius: '50%'
            }}
          ></div>
          <div 
            className="text-sm"
            style={{ color: colors.textSecondary }}
          >
            Loading geographic data...
          </div>
          
          {connection.type === 'slow-2g' || connection.type === '2g' ? (
            <div 
              className="mt-2 text-xs flex items-center gap-1"
              style={{ color: colors.textSecondary }}
            >
              <AlertTriangle size={12} style={{ color: colors.sun }} />
              <span>Slow network detected. Optimizing view...</span>
            </div>
          ) : null}
        </div>
      )}
      
      {/* Map container */}
      <div 
        ref={mapRef} 
        className="relative overflow-hidden"
        style={{ 
          width: width,
          height: height,
          border: `1px solid ${colors.border}`,
          borderRadius: '8px',
          backgroundColor: colors.background
        }}
        aria-label="Geographic visualization of Vietnam tariff impacts"
        role="img"
      >
        {/* Map will be rendered here */}
      </div>
      
      {/* Tooltip */}
      <div 
        ref={tooltipRef} 
        className="absolute opacity-0 pointer-events-none z-20 transition-opacity duration-200 horizon-tooltip"
        style={{
          backgroundColor: colors.tooltipBackground,
          color: colors.text,
          border: `1px solid ${colors.tooltipBorder}`,
          borderRadius: '6px',
          padding: '12px',
          boxShadow: theme === 'dark' ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.1)',
          maxWidth: '200px'
        }}
      >
        {hoveredProvince && (
          <div>
            <div 
              className="font-semibold mb-1 horizon-header"
              style={{ color: colors.text }}
            >
              {hoveredProvince.name}
            </div>
            <div 
              className="text-sm font-medium mb-1"
              style={{ color: hoveredProvince.netImpact > 0 ? colors.secondaryGreen : colors.persianRed }}
            >
              Net Impact: {hoveredProvince.netImpact > 0 ? '+' : ''}{hoveredProvince.netImpact}%
            </div>
            <div 
              className="text-sm"
              style={{ color: colors.textSecondary }}
            >
              Exports: {hoveredProvince.exportVolume}M USD
            </div>
            <div 
              className="text-sm"
              style={{ color: colors.textSecondary }}
            >
              Imports: {hoveredProvince.importVolume}M USD
            </div>
          </div>
        )}
      </div>
      
      {/* Controls and Info */}
      {showControls && (
        <div 
          className="mt-2 flex flex-wrap justify-between items-start gap-2"
          style={{ width: width }}
        >
          {/* Info Card */}
          <div 
            className="rounded-lg overflow-hidden"
            style={{ 
              backgroundColor: colors.cardBackground,
              border: `1px solid ${colors.border}`,
              boxShadow: theme === 'dark' ? '0 4px 12px rgba(0,0,0,0.2)' : '0 4px 12px rgba(0,0,0,0.05)',
              maxWidth: '350px'
            }}
          >
            <div className="p-3">
              <div 
                className="flex items-center gap-2 mb-2 font-medium text-sm horizon-header"
                style={{ color: colors.text }}
              >
                <Map size={16} style={{ color: colors.primaryBlue }} />
                Vietnam Provincial Impact Map
              </div>
              <div 
                className="text-xs mb-2"
                style={{ color: colors.textSecondary }}
              >
                This map visualizes tariff impacts across Vietnam provinces, with corridors showing major trading relationships.
              </div>
              <div className="flex gap-1 flex-wrap">
                <div 
                  className="text-xs py-1 px-2 rounded"
                  style={{ 
                    backgroundColor: colors.chipBackground,
                    color: colors.textSecondary
                  }}
                >
                  Circle Size = Trade Volume
                </div>
                <div 
                  className="text-xs py-1 px-2 rounded"
                  style={{ 
                    backgroundColor: colors.chipBackground,
                    color: colors.textSecondary
                  }}
                >
                  Color = Net Impact
                </div>
              </div>
              
              {/* Network status indicator */}
              <div 
                className="flex items-center gap-1 mt-2 text-xs"
                style={{ color: colors.textSecondary }}
              >
                <AlertTriangle size={12} style={{ color: colors.sun }} />
                <span>Approximate positioning for demonstration</span>
              </div>
              
              {adaptiveDetail && detailLevel !== 'high' && (
                <div 
                  className="flex items-center gap-1 mt-1 text-xs"
                  style={{ color: getNetworkStatusColor() }}
                >
                  <NetworkIcon size={12} />
                  <span>
                    {connection.type === 'slow-2g' || connection.type === '2g' 
                      ? 'Simplified view for slower connection' 
                      : tier === 'low' 
                        ? 'Optimized view for device performance' 
                        : 'Optimized view mode enabled'}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          {/* Control buttons */}
          <div className="flex flex-wrap gap-2">
            {/* Legend toggle */}
            <button
              className="flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium transition-colors"
              style={{ 
                backgroundColor: legendVisible ? colors.chipBackgroundActive : colors.chipBackground,
                color: legendVisible ? colors.primaryBlue : colors.textSecondary,
                border: `1px solid ${legendVisible ? colors.primaryBlue : colors.border}`
              }}
              onClick={() => setLegendVisible(!legendVisible)}
              aria-pressed={legendVisible}
              aria-label={`${legendVisible ? 'Hide' : 'Show'} map legend`}
            >
              {legendVisible ? <EyeOff size={14} /> : <Eye size={14} />}
              Legend
            </button>
            
            {/* Corridors toggle */}
            <button
              className="flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium transition-colors"
              style={{ 
                backgroundColor: corridorsVisible ? colors.chipBackgroundActive : colors.chipBackground,
                color: corridorsVisible ? colors.primaryBlue : colors.textSecondary,
                border: `1px solid ${corridorsVisible ? colors.primaryBlue : colors.border}`
              }}
              onClick={() => setCorridorsVisible(!corridorsVisible)}
              aria-pressed={corridorsVisible}
              aria-label={`${corridorsVisible ? 'Hide' : 'Show'} trade corridors`}
            >
              {corridorsVisible ? <EyeOff size={14} /> : <Eye size={14} />}
              Corridors
            </button>
            
            {/* Zoom controls if enabled */}
            {enableZoom && (
              <div 
                className="flex rounded overflow-hidden"
                style={{ border: `1px solid ${colors.border}` }}
              >
                <button
                  className="flex items-center justify-center p-1.5 transition-colors"
                  style={{ 
                    backgroundColor: colors.chipBackground,
                    color: colors.textSecondary,
                    borderRight: `1px solid ${colors.border}`
                  }}
                  onClick={() => setCurrentZoom(Math.max(0.5, currentZoom - 0.5))}
                  aria-label="Zoom out"
                  disabled={currentZoom <= 0.5}
                >
                  <ZoomOut size={14} />
                </button>
                <button
                  className="flex items-center justify-center p-1.5 transition-colors"
                  style={{ 
                    backgroundColor: colors.chipBackground,
                    color: colors.textSecondary,
                    borderRight: `1px solid ${colors.border}`
                  }}
                  onClick={() => setCurrentZoom(1)} // Reset zoom
                  aria-label="Reset zoom"
                >
                  <RefreshCw size={14} />
                </button>
                <button
                  className="flex items-center justify-center p-1.5 transition-colors"
                  style={{ 
                    backgroundColor: colors.chipBackground,
                    color: colors.textSecondary
                  }}
                  onClick={() => setCurrentZoom(Math.min(5, currentZoom + 0.5))}
                  aria-label="Zoom in"
                  disabled={currentZoom >= 5}
                >
                  <ZoomIn size={14} />
                </button>
              </div>
            )}
            
            {/* Export button if enabled */}
            {exportable && (
              <button
                className="flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium transition-colors"
                style={{ 
                  backgroundColor: colors.primaryBlue,
                  color: 'white'
                }}
                onClick={exportMap}
                aria-label="Export map as PNG"
              >
                <Download size={14} />
                Export
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedVietnamGeoMap;