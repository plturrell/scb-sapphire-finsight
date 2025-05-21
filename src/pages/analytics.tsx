import React, { useState, useEffect } from 'react';
import ScbBeautifulUI from '@/components/ScbBeautifulUI';
import DetailedAnalyticsTable from '@/components/DetailedAnalyticsTable.enhanced';
import EnhancedIOSDataVisualization from '@/components/charts/EnhancedIOSDataVisualization';
import MultiTaskingChart from '@/components/charts/MultiTaskingChart';
import { TransactionSector } from '@/types';
import { useMediaQuery } from 'react-responsive';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

// iOS colors for better integration with Apple platforms
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

const sectorData: TransactionSector[] = [
  { name: 'Aluminum', revenue: 500000, accounts: 120, income: 45000, assets: 2500000, deposits: 1800000, yield: 5.2, rowWa: 3.5, change: 2.5 },
  { name: 'Automotive', revenue: 750000, accounts: 85, income: 68000, assets: 3200000, deposits: 2100000, yield: 6.1, rowWa: 4.2, change: -1.2 },
  { name: 'Cement', revenue: 420000, accounts: 95, income: 38000, assets: 1900000, deposits: 1400000, yield: 4.8, rowWa: 3.1, change: 3.8 },
  { name: 'Chemical', revenue: 680000, accounts: 110, income: 61000, assets: 2800000, deposits: 2000000, yield: 5.6, rowWa: 3.8, change: 1.5 },
  { name: 'Diversified', revenue: 890000, accounts: 145, income: 80000, assets: 3600000, deposits: 2500000, yield: 6.3, rowWa: 4.5, change: 4.2 },
  { name: 'Gems', revenue: 320000, accounts: 75, income: 29000, assets: 1500000, deposits: 1100000, yield: 4.2, rowWa: 2.8, change: -0.5 },
  { name: 'Construction', revenue: 580000, accounts: 105, income: 52000, assets: 2400000, deposits: 1700000, yield: 5.1, rowWa: 3.4, change: 2.1 },
  { name: 'Real Estate', revenue: 720000, accounts: 90, income: 65000, assets: 3100000, deposits: 2200000, yield: 5.9, rowWa: 4.0, change: 3.6 },
  { name: 'Telecom', revenue: 820000, accounts: 125, income: 74000, assets: 3400000, deposits: 2400000, yield: 6.2, rowWa: 4.3, change: 2.8 },
  { name: 'Others', revenue: 550000, accounts: 130, income: 50000, assets: 2300000, deposits: 1600000, yield: 5.0, rowWa: 3.3, change: 1.8 },
];

const trendData = [
  { month: 'Jan', revenue: 420000, accounts: 85 },
  { month: 'Feb', revenue: 450000, accounts: 88 },
  { month: 'Mar', revenue: 480000, accounts: 92 },
  { month: 'Apr', revenue: 510000, accounts: 95 },
  { month: 'May', revenue: 540000, accounts: 98 },
  { month: 'Jun', revenue: 570000, accounts: 102 },
];

const pieData = [
  { name: 'Diversified', value: 25, color: iosColors[0] },
  { name: 'Telecom', value: 20, color: iosColors[1] },
  { name: 'Automotive', value: 18, color: iosColors[2] },
  { name: 'Real Estate', value: 15, color: iosColors[3] },
  { name: 'Others', value: 22, color: iosColors[4] },
];

export default function Analytics() {
  const [isMounted, setIsMounted] = useState(false);
  const [isPlatformDetected, setPlatformDetected] = useState(false);
  const [isAppleDevice, setIsAppleDevice] = useState(false);
  const [isIPad, setIsIPad] = useState(false);
  const [selectedSector, setSelectedSector] = useState<any>(null);
  
  const isSmallScreen = useMediaQuery({ maxWidth: 768 });

  // Detect platform when component mounts
  useEffect(() => {
    setIsMounted(true);
    
    // Check if we're on an Apple platform
    const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    
    // Check if we're on iPad specifically
    const isIpad = /iPad/.test(navigator.userAgent) || 
      (navigator.platform === 'MacIntel' && 
      navigator.maxTouchPoints > 1 &&
      !navigator.userAgent.includes('iPhone'));
    
    setIsAppleDevice(isIOS);
    setIsIPad(isIpad);
    setPlatformDetected(true);
  }, []);

  // Handle chart sector selection
  const handleSectorSelect = (sector: any) => {
    setSelectedSector(sector);
  };

  // Render line chart with iOS optimizations if on Apple device
  const renderLineChart = (dimensions: any, interactionState: any, helpers: any) => {
    const { width, height, margin, innerWidth, innerHeight } = dimensions;
    const { formatCurrency } = helpers || {};
    
    return (
      <ResponsiveContainer width={width} height={height}>
        <LineChart data={trendData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
          <XAxis 
            dataKey="month" 
            tick={{ fontSize: interactionState?.isCompact ? 10 : 12 }}
            stroke="#8E8E93"
          />
          <YAxis 
            yAxisId="left" 
            orientation="left" 
            stroke={iosColors[0]}
            tickFormatter={(value) => formatCurrency ? formatCurrency(value, 'USD').split('.')[0] : `$${value/1000}k`}
            fontSize={interactionState?.isCompact ? 10 : 12}
          />
          <YAxis 
            yAxisId="right" 
            orientation="right" 
            stroke={iosColors[1]}
            fontSize={interactionState?.isCompact ? 10 : 12}
          />
          <Tooltip 
            contentStyle={{
              borderRadius: 8,
              backgroundColor: 'rgba(255,255,255,0.95)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              border: '1px solid rgba(0,0,0,0.05)'
            }}
            formatter={(value: any, name: string) => {
              if (name === 'Revenue') {
                return formatCurrency ? formatCurrency(value, 'USD') : `$${value.toLocaleString()}`;
              }
              return value;
            }}
          />
          <Line 
            yAxisId="left" 
            type="monotone" 
            dataKey="revenue" 
            stroke={iosColors[0]}
            strokeWidth={3}
            animationDuration={1000}
            dot={{ r: 4, fill: 'white', stroke: iosColors[0], strokeWidth: 2 }}
            activeDot={{ r: 6, fill: iosColors[0], stroke: 'white', strokeWidth: 2 }}
            name="Revenue" 
          />
          <Line 
            yAxisId="right" 
            type="monotone" 
            dataKey="accounts" 
            stroke={iosColors[1]}
            strokeWidth={3}
            animationDuration={1000}
            dot={{ r: 4, fill: 'white', stroke: iosColors[1], strokeWidth: 2 }}
            activeDot={{ r: 6, fill: iosColors[1], stroke: 'white', strokeWidth: 2 }}
            name="Accounts" 
          />
        </LineChart>
      </ResponsiveContainer>
    );
  };

  // Render pie chart with iOS optimizations if on Apple device
  const renderPieChart = (dimensions: any, interactionState: any, helpers: any) => {
    const { width, height } = dimensions;
    const { formatPercentage } = helpers || {};
    const { activeIndex } = interactionState || {};
    
    return (
      <ResponsiveContainer width={width} height={height}>
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            innerRadius={activeIndex !== null ? 40 : 0}
            outerRadius={80}
            fill={iosColors[0]}
            dataKey="value"
            animationDuration={800}
            animationBegin={0}
            paddingAngle={2}
            label={({ name, value }) => `${name}: ${value}%`}
            labelLine={false}
          >
            {pieData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.color} 
                stroke="white" 
                strokeWidth={activeIndex === index ? 2 : 0}
              />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{
              borderRadius: 8,
              backgroundColor: 'rgba(255,255,255,0.95)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              border: '1px solid rgba(0,0,0,0.05)'
            }}
            formatter={(value: any) => formatPercentage ? formatPercentage(value, 0) : `${value}%`}
          />
        </PieChart>
      </ResponsiveContainer>
    );
  };

  // Render iPad-optimized multitasking chart
  const renderMultiTaskingChart = (dimensions: any, interactionState: any) => {
    const { width, height } = dimensions;
    const { isCompact } = interactionState;
    
    return (
      <ResponsiveContainer width={width} height={height}>
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            outerRadius={isCompact ? 60 : 80}
            fill={iosColors[0]}
            dataKey="value"
            label={({ name, value }) => isCompact ? `${value}%` : `${name}: ${value}%`}
          >
            {pieData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{
              borderRadius: 8,
              backgroundColor: 'rgba(255,255,255,0.95)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              border: '1px solid rgba(0,0,0,0.05)'
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    );
  };

  // Render legend for pie chart
  const renderPieLegend = (isActive: boolean) => {
    return (
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs">
        {pieData.map((item, index) => (
          <div key={item.name} className="flex items-center gap-1">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: item.color }}
            ></div>
            <span>{item.name}: {item.value}%</span>
          </div>
        ))}
      </div>
    );
  };

  // Render legend for line chart
  const renderLineLegend = (isActive: boolean) => {
    return (
      <div className="flex justify-center gap-4 text-sm">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: iosColors[0] }}></div>
          <span>Revenue</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: iosColors[1] }}></div>
          <span>Accounts</span>
        </div>
      </div>
    );
  };

  // Conditional rendering based on detected platform
  const renderCharts = () => {
    // Use iOS-optimized visualizations on Apple devices
    if (isAppleDevice && isPlatformDetected) {
      return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <EnhancedIOSDataVisualization
            data={trendData}
            type="line"
            title="Revenue & Account Growth"
            subtitle="Monthly trends"
            height={320}
            colors={iosColors}
            enableInteraction={true}
            enableHaptics={true}
            renderChart={renderLineChart}
            renderLegend={renderLineLegend}
            onDataPointSelect={handleSectorSelect}
          />
          
          <EnhancedIOSDataVisualization
            data={pieData}
            type="pie"
            title="Revenue by Sector"
            subtitle="Percentage distribution"
            height={320}
            colors={iosColors}
            enableInteraction={true}
            enableHaptics={true}
            renderChart={renderPieChart}
            renderLegend={renderPieLegend}
            onDataPointSelect={handleSectorSelect}
          />
        </div>
      );
    } 
    
    // Use iPad-optimized multitasking charts on iPad
    if (isIPad && isPlatformDetected) {
      return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MultiTaskingChart
            data={trendData}
            chartType="line"
            title="Revenue & Account Growth"
            height={320}
            colors={iosColors}
            enableInteraction={true}
            enableDragAndDrop={true}
            renderChart={renderMultiTaskingChart}
            renderLegend={(isCompact) => renderLineLegend(isCompact)}
          />
          
          <MultiTaskingChart
            data={pieData}
            chartType="pie"
            title="Revenue by Sector"
            height={320}
            colors={iosColors}
            enableInteraction={true}
            enableDragAndDrop={true}
            renderChart={renderMultiTaskingChart}
            renderLegend={(isCompact) => renderPieLegend(isCompact)}
          />
        </div>
      );
    }
    
    // Fallback to standard charts
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Revenue & Account Growth</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis yAxisId="left" orientation="left" stroke="#4A5FDB" />
              <YAxis yAxisId="right" orientation="right" stroke="#1ED760" />
              <Tooltip />
              <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#4A5FDB" name="Revenue" />
              <Line yAxisId="right" type="monotone" dataKey="accounts" stroke="#1ED760" name="Accounts" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Revenue by Sector</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}%`}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  return (
    <ScbBeautifulUI showNewsBar={!isSmallScreen} pageTitle="Analytics" showTabs={isAppleDevice}>
      <div className="space-y-6">
        <div>
          <p className="text-gray-600 mt-1">Transaction Banking Performance Overview</p>
        </div>

        {/* Responsive table - use enhanced on iPad for multitasking */}
        <DetailedAnalyticsTable data={sectorData} />

        {/* Charts - dynamically rendered based on platform */}
        {renderCharts()}

        {/* Key Insights section - adapt for iOS styling on Apple devices */}
        <div className={`
          bg-white rounded-lg shadow p-6
          ${isAppleDevice ? 'shadow-sm dark:bg-gray-800 dark:border dark:border-gray-700' : ''}
        `}>
          <h3 className={`
            text-lg font-semibold mb-4
            ${isAppleDevice ? 'text-[rgb(var(--scb-honolulu-blue))]' : ''}
          `}>
            Key Insights
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`
              p-4 bg-blue-50 rounded-lg
              ${isAppleDevice ? 'bg-opacity-50 dark:bg-blue-900/20 dark:text-blue-100' : ''}
            `}>
              <h4 className="font-semibold text-blue-900 dark:text-blue-100">Top Performer</h4>
              <p className="text-sm text-blue-700 dark:text-blue-200 mt-1">Diversified sector showing 4.2% growth</p>
            </div>
            <div className={`
              p-4 bg-green-50 rounded-lg
              ${isAppleDevice ? 'bg-opacity-50 dark:bg-green-900/20 dark:text-green-100' : ''}
            `}>
              <h4 className="font-semibold text-green-900 dark:text-green-100">Strongest Yield</h4>
              <p className="text-sm text-green-700 dark:text-green-200 mt-1">Diversified sector at 6.3% yield</p>
            </div>
            <div className={`
              p-4 bg-yellow-50 rounded-lg
              ${isAppleDevice ? 'bg-opacity-50 dark:bg-yellow-900/20 dark:text-yellow-100' : ''}
            `}>
              <h4 className="font-semibold text-yellow-900 dark:text-yellow-100">Watch Area</h4>
              <p className="text-sm text-yellow-700 dark:text-yellow-200 mt-1">Automotive showing -1.2% decline</p>
            </div>
          </div>
        </div>
      </div>
    </ScbBeautifulUI>
  );
}