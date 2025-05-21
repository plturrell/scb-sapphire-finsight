import React, { useState, useEffect, useRef } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ComposedChart,
  Area,
  Scatter,
} from 'recharts';
import { Maximize2, Download, Share, Info, RefreshCw, AlertCircle, Zap } from 'lucide-react';
import { motion } from '@/styles/motion';
import tokens from '@/styles/tokens';
import useDarkMode from '@/hooks/useDarkMode';
import useReducedMotion from '@/hooks/useReducedMotion';

// Define chart data type with flexibility for various chart types
type DataPoint = Record<string, any> & {
  name?: string;
  value?: number;
  date?: Date | string;
  label?: string;
  aiGenerated?: boolean;
  confidence?: number;
};

type ChartSeries = {
  id: string;
  name: string;
  data: DataPoint[];
  type?: 'line' | 'bar' | 'area' | 'scatter';
  color?: string;
  aiEnhanced?: boolean;
  stack?: string;
  yAxisId?: string;
  opacity?: number;
};

type ChartConfig = {
  type: 'line' | 'bar' | 'pie' | 'composed' | 'area';
  stacked?: boolean;
  showGrid?: boolean;
  showTooltip?: boolean;
  showLegend?: boolean;
  showXAxis?: boolean;
  showYAxis?: boolean;
  xAxisKey?: string;
  yAxisKey?: string;
  dateFormat?: string;
  aspectRatio?: number;
  valueFormatter?: (value: any) => string;
  tooltipFormatter?: (value: any, name: string, props: any) => string;
};

type EnhancedMultiChartProps = {
  series: ChartSeries[] | DataPoint[];
  config: ChartConfig;
  title?: string;
  subtitle?: string;
  height?: number | string;
  width?: number | string;
  showAIIndicators?: boolean;
  isLoading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  className?: string;
  animate?: boolean;
  showControls?: boolean;
  onRefresh?: () => void;
  allowFullscreen?: boolean;
};

/**
 * Enhanced chart component supporting multiple chart types with SCB UI styling
 * Features dark mode support, accessibility features, and AI indicators
 */
const EnhancedMultiChart: React.FC<EnhancedMultiChartProps> = ({
  series,
  config,
  title,
  subtitle,
  height = 300,
  width = '100%',
  showAIIndicators = true,
  isLoading = false,
  error = null,
  emptyMessage = 'No data available',
  className = '',
  animate = true,
  showControls = true,
  onRefresh,
  allowFullscreen = true,
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const { isDarkMode } = useDarkMode();
  const prefersReducedMotion = useReducedMotion();
  
  // Normalize series data to handle both array of series and single series
  const normalizedSeries = Array.isArray(series) && series.length > 0
    ? 'id' in series[0]
      ? series as ChartSeries[]
      : [{ id: 'default', name: 'Data', data: series as DataPoint[] }]
    : [];
  
  // Check if data is empty
  const isEmpty = normalizedSeries.length === 0 || 
    normalizedSeries.every(s => !s.data || s.data.length === 0);

  // SCB color palette from design tokens
  const chartColors = [
    tokens.colors.honoluluBlue[500],   // Primary SCB blue
    tokens.colors.americanGreen[500],  // SCB green
    tokens.colors.honoluluBlue[300],   // Light blue
    tokens.colors.americanGreen[300],  // Light green
    tokens.colors.honoluluBlue[700],   // Dark blue
    tokens.colors.americanGreen[700],  // Dark green
    '#F59E0B',                        // Amber
    '#8B5CF6',                        // Purple
    '#EC4899',                        // Pink
  ];

  // Dark mode color overrides
  const darkModeColors = [
    tokens.colors.honoluluBlue[400],   // Brighter blue for dark mode
    tokens.colors.americanGreen[400],  // Brighter green
    tokens.colors.honoluluBlue[200],   // Very light blue
    tokens.colors.americanGreen[200],  // Very light green
    tokens.colors.honoluluBlue[600],   // Slightly darker blue
    tokens.colors.americanGreen[600],  // Slightly darker green
    '#FBBF24',                        // Brighter amber
    '#A78BFA',                        // Brighter purple
    '#F472B6',                        // Brighter pink
  ];

  // Use appropriate color scheme based on dark mode
  const colors = isDarkMode ? darkModeColors : chartColors;

  // Handle fullscreen toggle
  const toggleFullscreen = () => {
    if (allowFullscreen) {
      setFullscreen(!fullscreen);
    }
  };

  // Handle download chart as PNG
  const downloadChart = () => {
    if (!chartRef.current) return;
    
    // Use html2canvas or similar library to create PNG
    // This is a placeholder implementation
    console.log('Downloading chart...');
    
    // Show success indicator
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 1500);
  };

  // Format value for tooltip and axes
  const formatValue = (value: any): string => {
    if (config.valueFormatter) {
      return config.valueFormatter(value);
    }
    
    if (typeof value === 'number') {
      // Basic number formatting with thousands separators
      return value.toLocaleString();
    }
    
    if (value instanceof Date) {
      return value.toLocaleDateString();
    }
    
    return String(value);
  };

  // Effect to handle fullscreen view
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && fullscreen) {
        setFullscreen(false);
      }
    };
    
    if (fullscreen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [fullscreen]);

  // Custom tooltip component with SCB styling
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) {
      return null;
    }
    
    return (
      <div className={`p-3 rounded-md shadow-lg 
      ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
        <p className={`font-medium text-sm mb-1 
        ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
          {label}
        </p>
        {payload.map((entry: any, index: number) => (
          <div key={`tooltip-item-${index}`} className="flex items-center mb-1 last:mb-0">
            <div 
              className="w-3 h-3 rounded-full mr-2" 
              style={{ backgroundColor: entry.color }}
            />
            <span className={`text-xs font-medium mr-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              {entry.name}:
            </span>
            <span className={`text-xs font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
              {formatValue(entry.value)}
            </span>
            
            {/* AI confidence indicator */}
            {showAIIndicators && entry.payload?.aiGenerated && (
              <div className="ml-2 flex items-center">
                <Zap className={`h-3 w-3 ${isDarkMode ? 'text-blue-400' : 'text-blue-500'}`} />
                {entry.payload?.confidence && (
                  <span className={`text-xs ml-1 ${isDarkMode ? 'text-blue-400' : 'text-blue-500'}`}>
                    {Math.round(entry.payload.confidence * 100)}%
                  </span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  // Placeholder component for loading state
  const LoadingOverlay = () => (
    <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 z-10">
      <div className="flex flex-col items-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500 mb-2"></div>
        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Loading data...</span>
      </div>
    </div>
  );

  // Placeholder component for error state
  const ErrorOverlay = ({ message }: { message: string }) => (
    <div className="absolute inset-0 flex items-center justify-center bg-white/90 dark:bg-gray-900/90 z-10">
      <div className="flex flex-col items-center text-center max-w-md px-4">
        <AlertCircle className="h-10 w-10 text-red-500 mb-2" />
        <span className="text-base font-medium text-gray-900 dark:text-gray-100 mb-1">
          Unable to load chart data
        </span>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {message || 'An error occurred while fetching the chart data. Please try again later.'}
        </p>
        {onRefresh && (
          <button 
            onClick={onRefresh}
            className="mt-3 px-4 py-2 bg-primary-500 text-white rounded-md text-sm font-medium
            hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );

  // Empty state component
  const EmptyState = ({ message }: { message: string }) => (
    <div className="absolute inset-0 flex items-center justify-center bg-white/90 dark:bg-gray-900/90 z-10">
      <div className="flex flex-col items-center text-center max-w-md px-4">
        <Info className="h-10 w-10 text-gray-400 mb-2" />
        <span className="text-base font-medium text-gray-700 dark:text-gray-300 mb-1">
          {message}
        </span>
        {onRefresh && (
          <button 
            onClick={onRefresh}
            className="mt-3 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 
            rounded-md text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-600 
            focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Refresh
          </button>
        )}
      </div>
    </div>
  );

  // AI indicator badge
  const AIBadge = () => (
    <div className={`absolute top-3 right-12 flex items-center space-x-1 py-1 px-2 rounded-full 
    bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700`}>
      <Zap className="h-3 w-3 text-blue-500 dark:text-blue-400" />
      <span className="text-xs font-medium text-blue-700 dark:text-blue-400">
        AI Enhanced
      </span>
    </div>
  );

  // Animation configuration
  const getAnimationProps = () => {
    if (!animate || prefersReducedMotion) {
      return { isAnimationActive: false };
    }
    
    return {
      isAnimationActive: true,
      animationDuration: 1000,
      animationEasing: 'ease-out',
    };
  };

  // Handle any series with AI enhanced data
  const hasAIEnhancedData = normalizedSeries.some(series => 
    series.aiEnhanced || series.data.some(item => item.aiGenerated)
  );

  // Determine the chart component based on the type
  const renderChart = () => {
    const animationProps = getAnimationProps();
    
    switch (config.type) {
      case 'line':
        return (
          <LineChart data={normalizedSeries[0]?.data || []}>
            {config.showGrid && (
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke={isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} 
              />
            )}
            {config.showXAxis && (
              <XAxis 
                dataKey={config.xAxisKey || 'name'} 
                tick={{ fill: isDarkMode ? '#CBD5E0' : '#4A5568' }}
                tickLine={{ stroke: isDarkMode ? '#CBD5E0' : '#4A5568' }}
                axisLine={{ stroke: isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)' }}
              />
            )}
            {config.showYAxis && (
              <YAxis 
                tick={{ fill: isDarkMode ? '#CBD5E0' : '#4A5568' }}
                tickLine={{ stroke: isDarkMode ? '#CBD5E0' : '#4A5568' }}
                axisLine={{ stroke: isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)' }}
                tickFormatter={formatValue}
              />
            )}
            {config.showTooltip && <Tooltip content={<CustomTooltip />} />}
            {config.showLegend && (
              <Legend 
                wrapperStyle={{ 
                  paddingTop: 10,
                  color: isDarkMode ? '#CBD5E0' : '#4A5568',
                }}
              />
            )}
            
            {normalizedSeries.map((s, i) => (
              <Line
                key={s.id}
                type="monotone"
                dataKey={config.yAxisKey || 'value'}
                name={s.name}
                data={s.data}
                stroke={s.color || colors[i % colors.length]}
                strokeWidth={2}
                dot={s.data.map(d => d.aiGenerated ? 
                  { stroke: s.color || colors[i % colors.length], strokeWidth: 2, r: 6 } : 
                  { stroke: s.color || colors[i % colors.length], strokeWidth: 2, r: 4 }
                )}
                activeDot={{ r: 6, strokeWidth: 1 }}
                {...animationProps}
              />
            ))}
          </LineChart>
        );
      
      case 'bar':
        return (
          <BarChart data={normalizedSeries[0]?.data || []}>
            {config.showGrid && (
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke={isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} 
              />
            )}
            {config.showXAxis && (
              <XAxis 
                dataKey={config.xAxisKey || 'name'} 
                tick={{ fill: isDarkMode ? '#CBD5E0' : '#4A5568' }}
                tickLine={{ stroke: isDarkMode ? '#CBD5E0' : '#4A5568' }}
                axisLine={{ stroke: isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)' }}
              />
            )}
            {config.showYAxis && (
              <YAxis 
                tick={{ fill: isDarkMode ? '#CBD5E0' : '#4A5568' }}
                tickLine={{ stroke: isDarkMode ? '#CBD5E0' : '#4A5568' }}
                axisLine={{ stroke: isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)' }}
                tickFormatter={formatValue}
              />
            )}
            {config.showTooltip && <Tooltip content={<CustomTooltip />} />}
            {config.showLegend && (
              <Legend 
                wrapperStyle={{ 
                  paddingTop: 10,
                  color: isDarkMode ? '#CBD5E0' : '#4A5568',
                }}
              />
            )}
            
            {normalizedSeries.map((s, i) => (
              <Bar
                key={s.id}
                dataKey={config.yAxisKey || 'value'}
                name={s.name}
                data={s.data}
                fill={s.color || colors[i % colors.length]}
                stackId={config.stacked ? 'stack' : undefined}
                {...animationProps}
              >
                {/* Special styling for AI generated data points */}
                {showAIIndicators && s.data.map((entry, index) => {
                  if (entry.aiGenerated) {
                    return (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={s.color || colors[i % colors.length]}
                        stroke="#1E88E5"
                        strokeWidth={2}
                      />
                    );
                  }
                  return null;
                })}
              </Bar>
            ))}
          </BarChart>
        );
      
      case 'pie':
        return (
          <PieChart>
            <Pie
              data={normalizedSeries[0]?.data || []}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              nameKey={config.xAxisKey || 'name'}
              {...animationProps}
            >
              {(normalizedSeries[0]?.data || []).map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color || colors[index % colors.length]}
                  stroke={isDarkMode ? '#1F2937' : '#FFFFFF'}
                  strokeWidth={entry.aiGenerated && showAIIndicators ? 2 : 1}
                />
              ))}
            </Pie>
            {config.showTooltip && <Tooltip content={<CustomTooltip />} />}
            {config.showLegend && (
              <Legend 
                wrapperStyle={{ 
                  paddingTop: 10,
                  color: isDarkMode ? '#CBD5E0' : '#4A5568',
                }}
              />
            )}
          </PieChart>
        );
      
      case 'composed':
        return (
          <ComposedChart data={normalizedSeries[0]?.data || []}>
            {config.showGrid && (
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke={isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} 
              />
            )}
            {config.showXAxis && (
              <XAxis 
                dataKey={config.xAxisKey || 'name'} 
                tick={{ fill: isDarkMode ? '#CBD5E0' : '#4A5568' }}
                tickLine={{ stroke: isDarkMode ? '#CBD5E0' : '#4A5568' }}
                axisLine={{ stroke: isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)' }}
              />
            )}
            {config.showYAxis && (
              <YAxis 
                tick={{ fill: isDarkMode ? '#CBD5E0' : '#4A5568' }}
                tickLine={{ stroke: isDarkMode ? '#CBD5E0' : '#4A5568' }}
                axisLine={{ stroke: isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)' }}
                tickFormatter={formatValue}
              />
            )}
            {config.showTooltip && <Tooltip content={<CustomTooltip />} />}
            {config.showLegend && (
              <Legend 
                wrapperStyle={{ 
                  paddingTop: 10,
                  color: isDarkMode ? '#CBD5E0' : '#4A5568',
                }}
              />
            )}
            
            {normalizedSeries.map((s, i) => {
              switch (s.type) {
                case 'bar':
                  return (
                    <Bar
                      key={s.id}
                      dataKey={config.yAxisKey || 'value'}
                      name={s.name}
                      data={s.data}
                      fill={s.color || colors[i % colors.length]}
                      stackId={s.stack}
                      yAxisId={s.yAxisId || 0}
                      {...animationProps}
                    />
                  );
                case 'area':
                  return (
                    <Area
                      key={s.id}
                      type="monotone"
                      dataKey={config.yAxisKey || 'value'}
                      name={s.name}
                      data={s.data}
                      fill={s.color || colors[i % colors.length]}
                      stroke={s.color || colors[i % colors.length]}
                      fillOpacity={s.opacity || 0.6}
                      yAxisId={s.yAxisId || 0}
                      {...animationProps}
                    />
                  );
                case 'scatter':
                  return (
                    <Scatter
                      key={s.id}
                      name={s.name}
                      data={s.data}
                      fill={s.color || colors[i % colors.length]}
                      yAxisId={s.yAxisId || 0}
                      {...animationProps}
                    />
                  );
                case 'line':
                default:
                  return (
                    <Line
                      key={s.id}
                      type="monotone"
                      dataKey={config.yAxisKey || 'value'}
                      name={s.name}
                      data={s.data}
                      stroke={s.color || colors[i % colors.length]}
                      strokeWidth={2}
                      dot={{ stroke: s.color || colors[i % colors.length], strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, strokeWidth: 1 }}
                      yAxisId={s.yAxisId || 0}
                      {...animationProps}
                    />
                  );
              }
            })}
          </ComposedChart>
        );
      
      case 'area':
        return (
          <ComposedChart data={normalizedSeries[0]?.data || []}>
            {config.showGrid && (
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke={isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} 
              />
            )}
            {config.showXAxis && (
              <XAxis 
                dataKey={config.xAxisKey || 'name'} 
                tick={{ fill: isDarkMode ? '#CBD5E0' : '#4A5568' }}
                tickLine={{ stroke: isDarkMode ? '#CBD5E0' : '#4A5568' }}
                axisLine={{ stroke: isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)' }}
              />
            )}
            {config.showYAxis && (
              <YAxis 
                tick={{ fill: isDarkMode ? '#CBD5E0' : '#4A5568' }}
                tickLine={{ stroke: isDarkMode ? '#CBD5E0' : '#4A5568' }}
                axisLine={{ stroke: isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)' }}
                tickFormatter={formatValue}
              />
            )}
            {config.showTooltip && <Tooltip content={<CustomTooltip />} />}
            {config.showLegend && (
              <Legend 
                wrapperStyle={{ 
                  paddingTop: 10,
                  color: isDarkMode ? '#CBD5E0' : '#4A5568',
                }}
              />
            )}
            
            {normalizedSeries.map((s, i) => (
              <Area
                key={s.id}
                type="monotone"
                dataKey={config.yAxisKey || 'value'}
                name={s.name}
                data={s.data}
                fill={s.color || colors[i % colors.length]}
                stroke={s.color || colors[i % colors.length]}
                fillOpacity={s.opacity || 0.6}
                stackId={config.stacked ? 'stack' : undefined}
                {...animationProps}
              />
            ))}
          </ComposedChart>
        );
      
      default:
        return <div>Unsupported chart type</div>;
    }
  };

  const chartClasses = `
    ${fullscreen ? 'fixed inset-0 z-50 flex items-center justify-center bg-white dark:bg-gray-900 p-4' : ''}
    ${className}
  `;

  const containerClasses = `
    relative rounded-lg border shadow-sm overflow-hidden
    ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} 
    ${fullscreen ? 'w-full h-full max-w-7xl max-h-screen flex flex-col' : ''}
  `;

  // Apply animations to the chart container if not in reduced motion mode
  const chartContainerStyle = !prefersReducedMotion && animate 
    ? motion.animationPresets.fadeIn({
        duration: tokens.animation.duration.normal,
        delay: '100ms'
      })
    : {};
    
  // Animation for chart controls
  const controlsAnimation = !prefersReducedMotion && animate
    ? motion.animationPresets.fadeInUp({
        duration: tokens.animation.duration.normal,
        delay: '200ms'
      })
    : {};

  return (
    <div className={chartClasses} ref={chartRef} style={chartContainerStyle}>
      <div className={containerClasses}>
        {/* Chart header with title, subtitle, and controls */}
        {(title || subtitle || showControls) && (
          <div className={`px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between
          border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="mb-2 sm:mb-0">
              {title && (
                <h3 className={`text-base font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {subtitle}
                </p>
              )}
            </div>
            
            {showControls && (
              <div 
                className="flex items-center space-x-2"
                style={controlsAnimation}
              >
                {onRefresh && (
                  <button
                    aria-label="Refresh data"
                    className={`p-1.5 rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-gray-300
                    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500
                    transition-colors ${prefersReducedMotion ? 'transition-none' : 'duration-200'}`}
                    onClick={onRefresh}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                )}
                
                <button
                  aria-label="Download chart"
                  className={`p-1.5 rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-gray-300
                  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500
                  transition-colors ${prefersReducedMotion ? 'transition-none' : 'duration-200'}`}
                  onClick={downloadChart}
                >
                  <Download className="h-4 w-4" />
                </button>
                
                {allowFullscreen && (
                  <button
                    aria-label={fullscreen ? "Exit fullscreen" : "View fullscreen"}
                    className={`p-1.5 rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-gray-300
                    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500
                    transition-colors ${prefersReducedMotion ? 'transition-none' : 'duration-200'}`}
                    onClick={toggleFullscreen}
                  >
                    <Maximize2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}
          </div>
        )}
        
        {/* Chart container */}
        <div className={`p-3 ${fullscreen ? 'flex-1' : ''}`}>
          <div className="relative w-full h-full" style={{ height: fullscreen ? '100%' : height, width }}>
            {showAIIndicators && hasAIEnhancedData && <AIBadge />}
            
            {/* Show loading, error, or empty states */}
            {isLoading && <LoadingOverlay />}
            {error && <ErrorOverlay message={error} />}
            {!isLoading && !error && isEmpty && <EmptyState message={emptyMessage} />}
            
            {/* The actual chart */}
            {!isLoading && !error && !isEmpty && (
              <ResponsiveContainer width="100%" height="100%">
                {renderChart()}
              </ResponsiveContainer>
            )}
          </div>
        </div>
        
        {/* Downloaded indicator */}
        {downloaded && (
          <div 
            className={`absolute bottom-4 left-1/2 transform -translate-x-1/2 
            py-2 px-4 rounded-md shadow-md bg-green-600 text-white text-sm font-medium
            ${prefersReducedMotion ? '' : 'animate-fadeIn'}`}
          >
            Chart downloaded successfully
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedMultiChart;