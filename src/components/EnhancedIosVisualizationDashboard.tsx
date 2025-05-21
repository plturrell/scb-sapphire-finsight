import React, { useState, useEffect } from 'react';
import EnhancedIOSDataVisualization from './charts/EnhancedIOSDataVisualization';
import EnhancedAppleTouchButton from './EnhancedAppleTouchButton';
import EnhancedIOSTabBar from './EnhancedIOSTabBar';
import useSafeArea from '../hooks/useSafeArea';
import { haptics } from '../lib/haptics';

// Mock data for visualization
const financialData = [
  { month: 'Jan', revenue: 5400, expenses: 4200, profit: 1200 },
  { month: 'Feb', revenue: 6100, expenses: 4500, profit: 1600 },
  { month: 'Mar', revenue: 5900, expenses: 4800, profit: 1100 },
  { month: 'Apr', revenue: 6800, expenses: 5100, profit: 1700 },
  { month: 'May', revenue: 7200, expenses: 5300, profit: 1900 },
  { month: 'Jun', revenue: 7800, expenses: 5600, profit: 2200 },
  { month: 'Jul', revenue: 7400, expenses: 5400, profit: 2000 },
  { month: 'Aug', revenue: 8100, expenses: 5900, profit: 2200 },
  { month: 'Sep', revenue: 8500, expenses: 6200, profit: 2300 },
  { month: 'Oct', revenue: 9200, expenses: 6500, profit: 2700 },
  { month: 'Nov', revenue: 9800, expenses: 6800, profit: 3000 },
  { month: 'Dec', revenue: 10500, expenses: 7200, profit: 3300 }
];

// Regional data for pie chart
const regionalData = [
  { region: 'North America', value: 42 },
  { region: 'Europe', value: 28 },
  { region: 'Asia Pacific', value: 18 },
  { region: 'Latin America', value: 8 },
  { region: 'Middle East', value: 4 }
];

// Colors with iOS feel
const iosColors = [
  '#007AFF', // blue
  '#34C759', // green
  '#FF9500', // orange
  '#FF3B30', // red
  '#5856D6', // purple
  '#FF2D55', // pink
  '#FFCC00', // yellow
  '#00C7BE'  // teal
];

interface EnhancedIosVisualizationDashboardProps {
  className?: string;
}

/**
 * Dashboard component showcasing iOS-optimized data visualizations
 * Implements Apple's Human Interface Guidelines for data visualization
 */
const EnhancedIosVisualizationDashboard: React.FC<EnhancedIosVisualizationDashboardProps> = ({
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [selectedData, setSelectedData] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const { safeArea } = useSafeArea();
  
  // Handle refresh animation
  useEffect(() => {
    if (isRefreshing) {
      const timer = setTimeout(() => {
        setIsRefreshing(false);
        haptics.success();
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [isRefreshing]);
  
  // Tabs for the bottom navigation
  const tabs = [
    { id: 'overview', label: 'Overview', icon: 'chart.pie.fill' },
    { id: 'financial', label: 'Financial', icon: 'dollarsign.circle.fill' },
    { id: 'regions', label: 'Regions', icon: 'globe' },
    { id: 'settings', label: 'Settings', icon: 'gear' }
  ];
  
  // Handle tab change
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    haptics.selection();
    
    // Reset selected data when changing tabs
    setSelectedData(null);
  };
  
  // Handle data point selection
  const handleDataPointSelect = (point: any) => {
    setSelectedData(point);
  };
  
  // Render bar chart
  const renderBarChart = (dimensions: any, interactionState: any, helpers: any) => {
    const { width, height, margin, innerWidth, innerHeight } = dimensions;
    const { activeIndex, isExpanded } = interactionState;
    const { formatCurrency, formatDate, triggerHaptic } = helpers;
    
    // Calculate scales
    const data = financialData;
    const maxValue = Math.max(...data.map(d => d.revenue));
    const barWidth = innerWidth / data.length * 0.7;
    const barSpacing = innerWidth / data.length * 0.3;
    
    // Event handlers
    const handleBarClick = (index: number) => {
      triggerHaptic('selection');
      setSelectedData(data[index]);
    };
    
    return (
      <svg width={width} height={height} className="overflow-visible">
        <g transform={`translate(${margin.left},${margin.top})`}>
          {/* Y axis */}
          <line
            x1={0}
            y1={0}
            x2={0}
            y2={innerHeight}
            stroke="#E5E5EA"
            strokeWidth={1}
          />
          
          {/* X axis */}
          <line
            x1={0}
            y1={innerHeight}
            x2={innerWidth}
            y2={innerHeight}
            stroke="#E5E5EA"
            strokeWidth={1}
          />
          
          {/* Horizontal grid lines */}
          {[0.25, 0.5, 0.75].map((factor) => (
            <line
              key={`grid-${factor}`}
              x1={0}
              y1={innerHeight * (1 - factor)}
              x2={innerWidth}
              y2={innerHeight * (1 - factor)}
              stroke="#E5E5EA"
              strokeWidth={1}
              strokeDasharray="4,4"
            />
          ))}
          
          {/* Bars */}
          {data.map((d, i) => {
            const barHeight = (d.revenue / maxValue) * innerHeight;
            const expensesHeight = (d.expenses / maxValue) * innerHeight;
            const x = (innerWidth / data.length) * i + barSpacing / 2;
            
            return (
              <g 
                key={`bar-${i}`}
                onClick={() => handleBarClick(i)}
                style={{ cursor: 'pointer' }}
              >
                {/* Revenue bar */}
                <rect
                  x={x}
                  y={innerHeight - barHeight}
                  width={barWidth}
                  height={barHeight}
                  fill={iosColors[0]}
                  fillOpacity={activeIndex === i ? 1 : 0.8}
                  rx={isExpanded ? 4 : 2}
                  className="transition-all duration-300"
                />
                
                {/* Expenses bar */}
                <rect
                  x={x + barWidth / 4}
                  y={innerHeight - expensesHeight}
                  width={barWidth / 2}
                  height={expensesHeight}
                  fill={iosColors[2]}
                  fillOpacity={activeIndex === i ? 0.9 : 0.6}
                  rx={isExpanded ? 3 : 1}
                  className="transition-all duration-300"
                />
                
                {/* Month label */}
                <text
                  x={x + barWidth / 2}
                  y={innerHeight + 15}
                  textAnchor="middle"
                  fontSize={isExpanded ? 12 : 10}
                  fill="#8E8E93"
                >
                  {d.month}
                </text>
                
                {/* Value labels (only show for active index or expanded view) */}
                {(activeIndex === i || isExpanded) && (
                  <>
                    <text
                      x={x + barWidth / 2}
                      y={innerHeight - barHeight - 8}
                      textAnchor="middle"
                      fontSize={isExpanded ? 12 : 10}
                      fontWeight="500"
                      fill="#007AFF"
                    >
                      {formatCurrency(d.revenue)}
                    </text>
                    <text
                      x={x + barWidth / 2}
                      y={innerHeight - expensesHeight - 8}
                      textAnchor="middle"
                      fontSize={isExpanded ? 12 : 10}
                      fontWeight="500"
                      fill="#FF9500"
                    >
                      {formatCurrency(d.expenses)}
                    </text>
                  </>
                )}
              </g>
            );
          })}
        </g>
      </svg>
    );
  };
  
  // Render pie chart
  const renderPieChart = (dimensions: any, interactionState: any, helpers: any) => {
    const { width, height, margin } = dimensions;
    const { activeIndex, isExpanded } = interactionState;
    const { formatPercentage, triggerHaptic } = helpers;
    
    const data = regionalData;
    const total = data.reduce((sum, d) => sum + d.value, 0);
    const radius = Math.min(width, height) / 2 - (isExpanded ? 80 : 40);
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Calculate pie slices
    let startAngle = 0;
    const slices = data.map((d, i) => {
      const angle = (d.value / total) * 2 * Math.PI;
      const slice = {
        startAngle,
        endAngle: startAngle + angle,
        value: d.value,
        region: d.region,
        color: iosColors[i % iosColors.length],
        index: i
      };
      startAngle += angle;
      return slice;
    });
    
    // Calculate SVG path for a pie slice
    const getSlicePath = (slice: any, isActive: boolean) => {
      const innerRadius = isActive ? 0.5 * radius : 0; // Create donut when active
      
      // Calculate points
      const startX = centerX + Math.cos(slice.startAngle) * radius;
      const startY = centerY + Math.sin(slice.startAngle) * radius;
      const endX = centerX + Math.cos(slice.endAngle) * radius;
      const endY = centerY + Math.sin(slice.endAngle) * radius;
      
      const innerStartX = centerX + Math.cos(slice.startAngle) * innerRadius;
      const innerStartY = centerY + Math.sin(slice.startAngle) * innerRadius;
      const innerEndX = centerX + Math.cos(slice.endAngle) * innerRadius;
      const innerEndY = centerY + Math.sin(slice.endAngle) * innerRadius;
      
      // Create SVG arc path
      const largeArcFlag = slice.endAngle - slice.startAngle > Math.PI ? 1 : 0;
      
      let path = `M ${startX} ${startY}`;
      path += ` A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`;
      
      if (isActive) {
        // Add inner arc for donut
        path += ` L ${innerEndX} ${innerEndY}`;
        path += ` A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${innerStartX} ${innerStartY}`;
        path += ` L ${startX} ${startY}`;
      } else {
        // Regular pie slice
        path += ` L ${centerX} ${centerY}`;
        path += ` L ${startX} ${startY}`;
      }
      
      return path;
    };
    
    // Handle slice click
    const handleSliceClick = (slice: any) => {
      triggerHaptic('selection');
      setSelectedData(slice);
    };
    
    return (
      <svg width={width} height={height} className="overflow-visible">
        <g>
          {/* Pie slices */}
          {slices.map((slice, i) => {
            const isActive = activeIndex === i;
            const offset = isActive ? 10 : 0;
            const sliceAngle = (slice.startAngle + slice.endAngle) / 2;
            const offsetX = Math.cos(sliceAngle) * offset;
            const offsetY = Math.sin(sliceAngle) * offset;
            
            return (
              <g key={`slice-${i}`} onClick={() => handleSliceClick(slice)}>
                <path
                  d={getSlicePath(slice, isActive)}
                  fill={slice.color}
                  fillOpacity={isActive ? 1 : 0.8}
                  stroke="white"
                  strokeWidth={isActive ? 2 : 1}
                  transform={isActive ? `translate(${offsetX}, ${offsetY})` : ''}
                  className="transition-all duration-300 cursor-pointer"
                />
                
                {/* Labels for expanded view */}
                {isExpanded && (
                  <g>
                    <text
                      x={centerX + Math.cos(sliceAngle) * (radius * 0.7) + offsetX}
                      y={centerY + Math.sin(sliceAngle) * (radius * 0.7) + offsetY}
                      textAnchor="middle"
                      fontSize={12}
                      fontWeight="600"
                      fill="white"
                      pointerEvents="none"
                    >
                      {formatPercentage(slice.value, 0)}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
          
          {/* Center label */}
          <text
            x={centerX}
            y={centerY - 8}
            textAnchor="middle"
            fontSize={isExpanded ? 14 : 12}
            fontWeight="600"
            fill="#333333"
            className="dark:fill-white"
          >
            {selectedData
              ? selectedData.region || selectedData.value
              : 'Regional'}
          </text>
          <text
            x={centerX}
            y={centerY + 12}
            textAnchor="middle"
            fontSize={isExpanded ? 12 : 10}
            fontWeight="400"
            fill="#8E8E93"
          >
            {selectedData
              ? `${formatPercentage(selectedData.value, 1)}`
              : 'Distribution'}
          </text>
        </g>
      </svg>
    );
  };
  
  // Render line chart
  const renderLineChart = (dimensions: any, interactionState: any, helpers: any) => {
    const { width, height, margin, innerWidth, innerHeight } = dimensions;
    const { activeIndex, isExpanded } = interactionState;
    const { formatCurrency, triggerHaptic } = helpers;
    
    const data = financialData;
    const maxProfit = Math.max(...data.map(d => d.profit));
    const minProfit = Math.min(...data.map(d => d.profit));
    const padding = (maxProfit - minProfit) * 0.1;
    
    // Helper to calculate point positions
    const getX = (index: number) => (innerWidth / (data.length - 1)) * index;
    const getY = (value: number) => innerHeight - ((value - minProfit + padding) / ((maxProfit - minProfit) + padding * 2)) * innerHeight;
    
    // Generate path for the line
    let path = '';
    data.forEach((d, i) => {
      const x = getX(i);
      const y = getY(d.profit);
      if (i === 0) {
        path += `M ${x} ${y}`;
      } else {
        path += ` L ${x} ${y}`;
      }
    });
    
    // Handle point click
    const handlePointClick = (index: number) => {
      triggerHaptic('selection');
      setSelectedData(data[index]);
    };
    
    return (
      <svg width={width} height={height} className="overflow-visible">
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={iosColors[0]} stopOpacity="0.8" />
            <stop offset="100%" stopColor={iosColors[0]} stopOpacity="0.1" />
          </linearGradient>
          <clipPath id="chartClip">
            <rect x="0" y="0" width={innerWidth} height={innerHeight} />
          </clipPath>
        </defs>
        
        <g transform={`translate(${margin.left},${margin.top})`}>
          {/* Grid lines */}
          <line
            x1={0}
            y1={innerHeight}
            x2={innerWidth}
            y2={innerHeight}
            stroke="#E5E5EA"
            strokeWidth={1}
          />
          
          {[0.25, 0.5, 0.75].map((factor) => (
            <line
              key={`grid-${factor}`}
              x1={0}
              y1={innerHeight * factor}
              x2={innerWidth}
              y2={innerHeight * factor}
              stroke="#E5E5EA"
              strokeWidth={1}
              strokeDasharray="4,4"
            />
          ))}
          
          {/* Area under the line */}
          <clipPath id="areaClip">
            <path d={`${path} L ${getX(data.length - 1)} ${innerHeight} L ${getX(0)} ${innerHeight} Z`} />
          </clipPath>
          
          <rect
            x={0}
            y={0}
            width={innerWidth}
            height={innerHeight}
            fill="url(#lineGradient)"
            clipPath="url(#areaClip)"
          />
          
          {/* Line */}
          <path
            d={path}
            fill="none"
            stroke={iosColors[0]}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          
          {/* Data points */}
          {data.map((d, i) => {
            const x = getX(i);
            const y = getY(d.profit);
            
            return (
              <g key={`point-${i}`} onClick={() => handlePointClick(i)}>
                <circle
                  cx={x}
                  cy={y}
                  r={activeIndex === i ? 6 : isExpanded ? 4 : 3}
                  fill={activeIndex === i ? 'white' : iosColors[0]}
                  stroke={iosColors[0]}
                  strokeWidth={activeIndex === i ? 3 : 1.5}
                  className="transition-all duration-300 cursor-pointer"
                />
                
                {/* Value label for active point */}
                {(activeIndex === i || (isExpanded && i % 3 === 0)) && (
                  <text
                    x={x}
                    y={y - 12}
                    textAnchor="middle"
                    fontSize={isExpanded ? 12 : 10}
                    fontWeight="500"
                    fill="#007AFF"
                  >
                    {formatCurrency(d.profit)}
                  </text>
                )}
                
                {/* Month label for expanded view */}
                {isExpanded && (
                  <text
                    x={x}
                    y={innerHeight + 15}
                    textAnchor="middle"
                    fontSize={10}
                    fill="#8E8E93"
                  >
                    {d.month}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </svg>
    );
  };
  
  // Render chart legends
  const renderBarChartLegend = (isActive: boolean) => {
    return (
      <div className="flex items-center justify-center gap-4 text-sm">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm bg-blue-500"></div>
          <span>Revenue</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm bg-orange-500"></div>
          <span>Expenses</span>
        </div>
      </div>
    );
  };
  
  const renderPieChartLegend = (isActive: boolean) => {
    return (
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs">
        {regionalData.map((item, index) => (
          <div key={item.region} className="flex items-center gap-1">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: iosColors[index % iosColors.length] }}
            ></div>
            <span>{item.region}</span>
          </div>
        ))}
      </div>
    );
  };
  
  const renderLineChartLegend = (isActive: boolean) => {
    return (
      <div className="flex justify-center gap-4 text-sm">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          <span>Profit</span>
        </div>
      </div>
    );
  };
  
  // Additional chart details for expanded view
  const renderBarChartDetails = () => {
    if (!selectedData) return null;
    
    return (
      <div className="p-4 grid grid-cols-3 gap-4 text-center">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
          <p className="text-xs text-gray-500 dark:text-gray-400">Revenue</p>
          <p className="text-lg font-medium text-blue-600 dark:text-blue-400">
            ${selectedData.revenue.toLocaleString()}
          </p>
        </div>
        <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg">
          <p className="text-xs text-gray-500 dark:text-gray-400">Expenses</p>
          <p className="text-lg font-medium text-orange-600 dark:text-orange-400">
            ${selectedData.expenses.toLocaleString()}
          </p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
          <p className="text-xs text-gray-500 dark:text-gray-400">Profit</p>
          <p className="text-lg font-medium text-green-600 dark:text-green-400">
            ${selectedData.profit.toLocaleString()}
          </p>
        </div>
      </div>
    );
  };
  
  // Render dashboard tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="px-4 pt-3 pb-16">
            <h1 className="text-xl font-semibold mb-1">Financial Overview</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Annual performance metrics
            </p>
            
            {/* Key metrics cards */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Revenue</p>
                <p className="text-2xl font-semibold">$85.9M</p>
                <p className="text-xs text-green-500">↑ 12.4% YoY</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Profit</p>
                <p className="text-2xl font-semibold">$21.8M</p>
                <p className="text-xs text-green-500">↑ 8.2% YoY</p>
              </div>
            </div>
            
            {/* Charts */}
            <div className="space-y-6">
              <EnhancedIOSDataVisualization
                data={financialData}
                type="bar"
                title="Monthly Performance"
                subtitle="Revenue vs. Expenses"
                height={220}
                colors={iosColors}
                enableInteraction={true}
                enableHaptics={true}
                renderChart={renderBarChart}
                renderLegend={renderBarChartLegend}
                renderCardContent={renderBarChartDetails}
                onDataPointSelect={handleDataPointSelect}
              />
              
              <EnhancedIOSDataVisualization
                data={regionalData}
                type="pie"
                title="Regional Distribution"
                subtitle="Revenue by region"
                height={220}
                colors={iosColors}
                enableInteraction={true}
                enableHaptics={true}
                renderChart={renderPieChart}
                renderLegend={renderPieChartLegend}
                onDataPointSelect={handleDataPointSelect}
              />
            </div>
          </div>
        );
        
      case 'financial':
        return (
          <div className="px-4 pt-3 pb-16">
            <h1 className="text-xl font-semibold mb-1">Financial Analysis</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Profit trends and metrics
            </p>
            
            <EnhancedIOSDataVisualization
              data={financialData}
              type="line"
              title="Profit Trends"
              subtitle="Monthly profit analysis"
              height={300}
              colors={iosColors}
              enableInteraction={true}
              enableHaptics={true}
              renderChart={renderLineChart}
              renderLegend={renderLineChartLegend}
              onDataPointSelect={handleDataPointSelect}
            />
            
            <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
              <h3 className="text-base font-medium mb-2">Performance Metrics</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Average Monthly Revenue</span>
                  <span className="font-medium">$7.63M</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Average Monthly Expenses</span>
                  <span className="font-medium">$5.55M</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Average Monthly Profit</span>
                  <span className="font-medium">$2.08M</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Profit Margin</span>
                  <span className="font-medium text-green-500">27.2%</span>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'regions':
        return (
          <div className="px-4 pt-3 pb-16">
            <h1 className="text-xl font-semibold mb-1">Regional Analysis</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Performance by region
            </p>
            
            <EnhancedIOSDataVisualization
              data={regionalData}
              type="pie"
              title="Revenue Distribution"
              subtitle="By region"
              height={300}
              colors={iosColors}
              enableInteraction={true}
              enableHaptics={true}
              renderChart={renderPieChart}
              renderLegend={renderPieChartLegend}
              onDataPointSelect={handleDataPointSelect}
            />
            
            <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-base font-medium">Regional Details</h3>
              </div>
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {regionalData.map((region, index) => (
                  <div 
                    key={region.region} 
                    className="p-4 flex items-center justify-between"
                    onClick={() => handleDataPointSelect(region)}
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: iosColors[index % iosColors.length] }}
                      ></div>
                      <span>{region.region}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{region.value}%</span>
                      <svg width="6" height="10" viewBox="0 0 6 10" fill="none">
                        <path d="M1 1L5 5L1 9" stroke="#8E8E93" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      
      case 'settings':
        return (
          <div className="px-4 pt-3 pb-16">
            <h1 className="text-xl font-semibold mb-1">Settings</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Dashboard preferences
            </p>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-base font-medium">Appearance</h3>
              </div>
              
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                <div className="p-4 flex items-center justify-between">
                  <span>Theme</span>
                  <span className="text-gray-500">System</span>
                </div>
                <div className="p-4 flex items-center justify-between">
                  <span>Chart Style</span>
                  <span className="text-gray-500">Modern</span>
                </div>
                <div className="p-4 flex items-center justify-between">
                  <span>Haptic Feedback</span>
                  <div className="relative inline-block w-10 h-6 transition duration-200 ease-in-out bg-green-400 rounded-full">
                    <div className="absolute top-0.5 left-0.5 w-5 h-5 transition duration-100 ease-in-out transform bg-white rounded-full"></div>
                  </div>
                </div>
              </div>
              
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <EnhancedAppleTouchButton
                  label="Refresh Data"
                  variant="secondary"
                  className="w-full"
                  onClick={() => {
                    setIsRefreshing(true);
                    haptics.medium();
                  }}
                  isLoading={isRefreshing}
                />
              </div>
            </div>
          </div>
        );
      
      default:
        return (
          <div className="p-4">
            <p>Select a tab to view content</p>
          </div>
        );
    }
  };

  return (
    <div 
      className={`
        min-h-screen bg-gray-100 dark:bg-gray-900
        text-gray-900 dark:text-white
        ${className}
      `}
      style={{
        paddingBottom: `${Math.max(safeArea.bottom, 16)}px`,
      }}
    >
      {/* Content */}
      <div 
        className={`
          pb-16
          ${isRefreshing ? 'animate-pulse' : ''}
        `}
      >
        {renderTabContent()}
      </div>
      
      {/* Bottom tab bar */}
      <EnhancedIOSTabBar
        items={tabs.map(tab => ({
          id: tab.id,
          label: tab.label,
          icon: tab.icon
        }))}
        activeItemId={activeTab}
        onChange={handleTabChange}
        respectSafeArea={true}
        floating={false}
        className="border-t border-gray-200 dark:border-gray-700"
      />
    </div>
  );
};

export default EnhancedIosVisualizationDashboard;