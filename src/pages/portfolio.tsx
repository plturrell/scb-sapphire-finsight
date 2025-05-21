import React, { useState, useEffect } from 'react';
import ScbBeautifulUI from '@/components/ScbBeautifulUI';
import MetricCard from '@/components/MetricCard';
import EnhancedIOSDataVisualization from '@/components/charts/EnhancedIOSDataVisualization';
import MultiTaskingChart from '@/components/charts/MultiTaskingChart';
import EnhancedTouchButton from '@/components/EnhancedTouchButton';
import { useMultiTasking } from '@/hooks/useMultiTasking';
import { useDeviceCapabilities } from '@/hooks/useDeviceCapabilities';
import { useUIPreferences } from '@/context/UIPreferencesContext';
import IOSOptimizedLayout from '@/components/layout/IOSOptimizedLayout';
import { useMediaQuery } from 'react-responsive';
import { haptics } from '@/lib/haptics';
import { useSFSymbolsSupport } from '@/lib/sf-symbols';
import { ICONS } from '@/components/IconSystem';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

// iOS-specific colors for better integration with Apple platforms
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

const portfolioData = [
  { region: 'United Kingdom', planned: 75, actual: 82 },
  { region: 'India', planned: 65, actual: 70 },
  { region: 'Bangladesh', planned: 58, actual: 60 },
  { region: 'United States', planned: 85, actual: 88 },
  { region: 'United Arab Emirates', planned: 62, actual: 65 },
  { region: 'China', planned: 78, actual: 80 },
  { region: 'Korea', planned: 55, actual: 58 },
];

const taskData = [
  { id: '1', task: 'Review annual budget allocation', status: 'completed', dueDate: '2025-01-15' },
  { id: '2', task: 'Provide personal details for company records', status: 'pending', dueDate: '2025-01-20' },
  { id: '3', task: 'Update compliance certifications', status: 'overdue', dueDate: '2025-01-10' },
  { id: '4', task: 'Complete Q4 performance review', status: 'pending', dueDate: '2025-01-25' },
];

export default function Portfolio() {
  const [selectedBarData, setSelectedBarData] = useState<any>(null);
  const [activePortfolioCategory, setActivePortfolioCategory] = useState('overview');
  const [isPlatformDetected, setPlatformDetected] = useState(false);
  
  const isSmallScreen = useMediaQuery({ maxWidth: 768 });
  const { mode, isMultiTasking } = useMultiTasking();
  const { isAppleDevice, deviceType } = useDeviceCapabilities();
  const { isDarkMode } = useUIPreferences();
  const { supported: sfSymbolsSupported } = useSFSymbolsSupport();
  
  // Determine if it's an iPad
  const isIPad = deviceType === 'tablet' && isAppleDevice;
  
  // Effect to detect platform
  useEffect(() => {
    setPlatformDetected(true);
  }, []);
  
  // Portfolio categories with SF Symbols icons
  const portfolioCategories = [
    { id: 'overview', label: 'Overview', icon: 'chart.pie.fill', badge: null },
    { id: 'regions', label: 'Regions', icon: 'globe.asia.australia', badge: '7' },
    { id: 'assets', label: 'Assets', icon: 'building.columns.fill', badge: '$3.2M' },
    { id: 'performance', label: 'Performance', icon: 'chart.line.uptrend.xyaxis.fill', badge: '+6.3%' },
    { id: 'tasks', label: 'Tasks', icon: 'checklist', badge: '4' },
    { id: 'compliance', label: 'Compliance', icon: 'lock.shield.fill', badge: null },
    { id: 'documents', label: 'Documents', icon: 'doc.on.doc.fill', badge: '12' }
  ];

  // Handle bar data selection
  const handleBarSelect = (data: any) => {
    setSelectedBarData(data);
    
    // Provide haptic feedback on Apple devices
    if (isAppleDevice) {
      haptics.selection();
    }
  };

  // Handle button click with haptic feedback
  const handleButtonClick = () => {
    if (isAppleDevice) {
      haptics.medium();
    }
  };
  
  // Handle portfolio category selection
  const handleCategorySelect = (categoryId: string) => {
    // Provide haptic feedback on Apple devices
    if (isAppleDevice) {
      haptics.selection();
    }
    setActivePortfolioCategory(categoryId);
    // In a real app, this would update the displayed content
    console.log(`Selected portfolio category: ${categoryId}`);
  };
  
  // SF Symbols Portfolio Categories Navigation component
  const SFSymbolsPortfolioNavigation = () => {
    if (!isAppleDevice || !isPlatformDetected || !sfSymbolsSupported) {
      return null;
    }
    
    return (
      <div className={`rounded-lg overflow-x-auto ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm border ${isDarkMode ? 'border-gray-700' : 'border-[rgb(var(--scb-border))]'} p-1 mb-4`}>
        <div className="flex items-center overflow-x-auto hide-scrollbar pb-1">
          {portfolioCategories.map((category) => (
            <button 
              key={category.id}
              onClick={() => handleCategorySelect(category.id)}
              className={`
                flex flex-col items-center justify-center p-2 min-w-[72px] rounded-lg transition-colors
                ${activePortfolioCategory === category.id
                  ? isDarkMode 
                    ? 'bg-blue-900/30 text-blue-400' 
                    : 'bg-blue-50 text-blue-600'
                  : isDarkMode 
                    ? 'text-gray-300 hover:bg-gray-700' 
                    : 'text-gray-600 hover:bg-gray-100'
                }
              `}
            >
              <div className="relative">
                <span className="sf-symbol text-xl" role="img">{category.icon}</span>
                
                {/* Badge */}
                {category.badge && (
                  <span className={`
                    absolute -top-1 -right-1 text-white text-[10px] font-bold rounded-full min-w-[16px] h-[16px] 
                    flex items-center justify-center px-1
                    ${category.badge.startsWith('+') 
                      ? isDarkMode ? 'bg-green-600' : 'bg-green-500' 
                      : category.badge.startsWith('$')
                        ? isDarkMode ? 'bg-purple-600' : 'bg-purple-500'
                        : isDarkMode ? 'bg-blue-600' : 'bg-red-500'
                    }
                  `}>
                    {category.badge.length > 4 ? category.badge.substring(0, 3) + '..' : category.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium mt-1">{category.label}</span>
            </button>
          ))}
        </div>
      </div>
    );
  };
  
  // Navigation bar actions
  const navBarActions = [
    {
      icon: 'plus',
      label: 'Add Task',
      onPress: () => {
        if (isAppleDevice) haptics.medium();
        alert('Adding a new task...');
      }
    },
    {
      icon: 'rectangle.stack.badge.plus',
      label: 'Add Collection',
      onPress: () => {
        if (isAppleDevice) haptics.medium();
        alert('Adding a new collection...');
      }
    }
  ];
  
  // Tab items for navigation
  const tabItems = [
    {
      key: 'dashboard',
      label: 'Dashboard',
      icon: 'gauge',
      href: '/dashboard',
    },
    {
      key: 'analytics',
      label: 'Analytics',
      icon: 'chart.bar.xaxis',
      href: '/analytics',
    },
    {
      key: 'portfolio',
      label: 'Portfolio',
      icon: 'briefcase',
      href: '/portfolio',
    },
    {
      key: 'reports',
      label: 'Reports',
      icon: 'doc.text',
      href: '/reports',
    },
    {
      key: 'settings',
      label: 'Settings',
      icon: 'gearshape',
      href: '/settings',
    },
  ];
  
  // Breadcrumb items
  const breadcrumbItems = [
    { label: 'Home', href: '/', icon: 'house' },
    { label: 'Portfolio', href: '/portfolio', icon: 'briefcase' },
  ];

  // Render bar chart with iOS optimizations
  const renderBarChart = (dimensions: any, interactionState: any, helpers: any) => {
    const { width, height } = dimensions;
    
    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={portfolioData} margin={{ top: 5, right: 20, left: 5, bottom: 80 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
          <XAxis 
            dataKey="region" 
            angle={-45} 
            textAnchor="end" 
            height={80}
            tick={{ fontSize: interactionState?.isCompact ? 10 : 12 }}
            stroke="#8E8E93"
          />
          <YAxis 
            tick={{ fontSize: interactionState?.isCompact ? 10 : 12 }}
            stroke="#8E8E93"
          />
          <Tooltip 
            contentStyle={{
              borderRadius: 8,
              backgroundColor: 'rgba(255,255,255,0.95)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              border: '1px solid rgba(0,0,0,0.05)'
            }}
          />
          <Legend wrapperStyle={{ fontSize: interactionState?.isCompact ? 10 : 12 }} />
          <Bar 
            dataKey="planned" 
            fill={iosColors[5]} 
            name="Planned" 
            radius={[4, 4, 0, 0]}
            animationDuration={1000}
            activeBar={{ fill: iosColors[5], stroke: 'white', strokeWidth: 2 }}
          />
          <Bar 
            dataKey="actual" 
            fill={iosColors[0]} 
            name="Actual" 
            radius={[4, 4, 0, 0]}
            animationDuration={1200}
            animationBegin={200}
            activeBar={{ fill: iosColors[0], stroke: 'white', strokeWidth: 2 }}
          />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  // Render iPad-optimized multitasking bar chart
  const renderMultiTaskingBarChart = (dimensions: any, interactionState: any) => {
    const { width, height } = dimensions;
    const { isCompact } = interactionState;
    
    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={portfolioData} margin={{ top: 5, right: 20, left: 5, bottom: isCompact ? 60 : 80 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="region" 
            angle={-45} 
            textAnchor="end" 
            height={isCompact ? 60 : 80}
            tick={{ fontSize: isCompact ? 9 : 11 }}
          />
          <YAxis tick={{ fontSize: isCompact ? 9 : 11 }} />
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: isCompact ? 9 : 11 }} />
          <Bar 
            dataKey="planned" 
            fill={iosColors[5]} 
            name="Planned" 
            radius={[4, 4, 0, 0]}
          />
          <Bar 
            dataKey="actual" 
            fill={iosColors[0]} 
            name="Actual" 
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  // Render legend for bar chart
  const renderBarLegend = (isActive: boolean) => {
    return (
      <div className="flex justify-center gap-4 text-sm">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: iosColors[5] }}></div>
          <span>Planned</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: iosColors[0] }}></div>
          <span>Actual</span>
        </div>
      </div>
    );
  };

  // Conditional rendering based on detected platform
  const renderCharts = () => {
    // Use iOS-optimized visualizations on Apple devices
    if (isAppleDevice && isPlatformDetected && !isIPad) {
      return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <EnhancedIOSDataVisualization
            data={portfolioData}
            type="bar"
            title="Regional Performance"
            subtitle="Planned vs. Actual"
            height={360}
            colors={iosColors}
            enableInteraction={true}
            enableHaptics={true}
            renderChart={renderBarChart}
            renderLegend={renderBarLegend}
            onDataPointSelect={handleBarSelect}
          />
          
          <div className={`
            bg-white rounded-lg shadow-sm p-6 
            dark:bg-gray-800 dark:border-gray-700
          `}>
            <h3 className="scb-section-header text-lg font-medium mb-4 dark:text-white">Tasks</h3>
            <div className="space-y-3">
              {taskData.map((task) => (
                <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg dark:border-gray-700">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">{task.task}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Due: {task.dueDate}</p>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      task.status === 'completed'
                        ? 'bg-[rgba(var(--scb-american-green),0.1)] text-[rgb(var(--scb-american-green))] scb-badge scb-badge-positive dark:bg-green-900/20 dark:text-green-400'
                        : task.status === 'overdue'
                        ? 'bg-[rgba(var(--scb-muted-red),0.1)] text-[rgb(var(--scb-muted-red))] scb-badge scb-badge-negative dark:bg-red-900/20 dark:text-red-400'
                        : 'bg-[rgba(var(--scb-honolulu-blue),0.1)] text-[rgb(var(--scb-honolulu-blue))] scb-badge scb-badge-neutral dark:bg-blue-900/20 dark:text-blue-400'
                    }`}
                  >
                    {task.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    } 
    
    // Use iPad-optimized multitasking charts on iPad
    if (isIPad && isPlatformDetected) {
      return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MultiTaskingChart
            data={portfolioData}
            chartType="bar"
            title="Regional Performance"
            subtitle="Planned vs. Actual"
            height={360}
            colors={iosColors}
            enableInteraction={true}
            enableDragAndDrop={true}
            renderChart={renderMultiTaskingBarChart}
            renderLegend={(isCompact) => renderBarLegend(isCompact)}
          />
          
          <div className={`
            bg-white rounded-lg shadow-sm border border-[rgb(var(--scb-border))] p-6 fiori-tile
            dark:bg-gray-800 dark:border-gray-700
            ${isMultiTasking && mode === 'slide-over' ? 'p-4' : 'p-6'}
          `}>
            <h3 className={`
              scb-section-header text-lg font-medium mb-4 dark:text-white
              ${isMultiTasking && mode === 'slide-over' ? 'text-base mb-3' : 'text-lg mb-4'}
            `}>
              Tasks
            </h3>
            <div className="space-y-3">
              {taskData.map((task) => (
                <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg dark:border-gray-700">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">{task.task}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Due: {task.dueDate}</p>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      task.status === 'completed'
                        ? 'bg-[rgba(var(--scb-american-green),0.1)] text-[rgb(var(--scb-american-green))] scb-badge scb-badge-positive dark:bg-green-900/20 dark:text-green-400'
                        : task.status === 'overdue'
                        ? 'bg-[rgba(var(--scb-muted-red),0.1)] text-[rgb(var(--scb-muted-red))] scb-badge scb-badge-negative dark:bg-red-900/20 dark:text-red-400'
                        : 'bg-[rgba(var(--scb-honolulu-blue),0.1)] text-[rgb(var(--scb-honolulu-blue))] scb-badge scb-badge-neutral dark:bg-blue-900/20 dark:text-blue-400'
                    }`}
                  >
                    {task.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }
    
    // Fallback to standard charts
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-[rgb(var(--scb-border))] p-6 fiori-tile">
          <h3 className="scb-section-header text-lg font-medium mb-4">Regional Performance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={portfolioData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="region" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="planned" fill="#9CA3AF" name="Planned" />
              <Bar dataKey="actual" fill="#4A5FDB" name="Actual" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-[rgb(var(--scb-border))] p-6 fiori-tile">
          <h3 className="scb-section-header text-lg font-medium mb-4">Tasks</h3>
          <div className="space-y-3">
            {taskData.map((task) => (
              <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{task.task}</p>
                  <p className="text-sm text-gray-600">Due: {task.dueDate}</p>
                </div>
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    task.status === 'completed'
                      ? 'bg-[rgba(var(--scb-american-green),0.1)] text-[rgb(var(--scb-american-green))] scb-badge scb-badge-positive'
                      : task.status === 'overdue'
                      ? 'bg-[rgba(var(--scb-muted-red),0.1)] text-[rgb(var(--scb-muted-red))] scb-badge scb-badge-negative'
                      : 'bg-[rgba(var(--scb-honolulu-blue),0.1)] text-[rgb(var(--scb-honolulu-blue))] scb-badge scb-badge-neutral'
                  }`}
                >
                  {task.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Render buttons based on platform
  const renderButtons = () => {
    if (isAppleDevice && isPlatformDetected) {
      return (
        <div className="space-y-4">
          {[
            { title: 'Personal Data Collection', desc: 'Provide personal details for company records', bgColor: 'bg-yellow-50 dark:bg-yellow-900/10' },
            { title: 'Compliance Data Collection', desc: 'Complete mandatory compliance questionnaire', bgColor: 'bg-blue-50 dark:bg-blue-900/10' },
            { title: 'Update Profile', desc: 'Update your professional and contact details', bgColor: 'bg-green-50 dark:bg-green-900/10' }
          ].map((item, idx) => (
            <div key={idx} className={`flex items-center justify-between p-4 ${item.bgColor} rounded-lg`}>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{item.title}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{item.desc}</p>
              </div>
              <EnhancedTouchButton
                variant="primary"
                label="Start"
                onClick={handleButtonClick}
              />
            </div>
          ))}
        </div>
      );
    }
    
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
          <div>
            <p className="font-medium text-gray-900">Personal Data Collection</p>
            <p className="text-sm text-gray-600">Provide personal details for company records</p>
          </div>
          <button className="px-4 py-2 bg-[rgb(var(--scb-honolulu-blue))] text-white rounded-lg hover:opacity-90 transition-opacity fiori-btn fiori-btn-primary">
            Start
          </button>
        </div>
        <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
          <div>
            <p className="font-medium text-gray-900">Compliance Data Collection</p>
            <p className="text-sm text-gray-600">Complete mandatory compliance questionnaire</p>
          </div>
          <button className="px-4 py-2 bg-[rgb(var(--scb-honolulu-blue))] text-white rounded-lg hover:opacity-90 transition-opacity fiori-btn fiori-btn-primary">
            Start
          </button>
        </div>
        <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
          <div>
            <p className="font-medium text-gray-900">Update Profile</p>
            <p className="text-sm text-gray-600">Update your professional and contact details</p>
          </div>
          <button className="px-4 py-2 bg-[rgb(var(--scb-honolulu-blue))] text-white rounded-lg hover:opacity-90 transition-opacity fiori-btn fiori-btn-primary">
            Start
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      {isAppleDevice ? (
        <IOSOptimizedLayout
          title="Asia Portfolio"
          subtitle="Transaction Banking Overview"
          showBreadcrumb={true}
          breadcrumbItems={breadcrumbItems}
          showTabBar={true}
          tabItems={tabItems}
          navBarRightActions={navBarActions}
          showBackButton={true}
          largeTitle={true}
          theme={isDarkMode ? 'dark' : 'light'}
        >
          <div className="space-y-6">
            <div>
              <p className={`scb-data-label ${isDarkMode ? 'text-gray-400' : 'text-[rgb(var(--scb-dark-gray))]'} mt-1`}>
                Sofia - Transaction Banking CFO
              </p>
            </div>
            
            {/* SF Symbols Portfolio Categories Navigation */}
            {isAppleDevice && isPlatformDetected && sfSymbolsSupported && (
              <SFSymbolsPortfolioNavigation />
            )}

            <div className={`grid grid-cols-1 ${
              isMultiTasking && mode === 'slide-over'
                ? 'gap-3'
                : isMultiTasking
                  ? 'md:grid-cols-2 gap-4'
                  : 'md:grid-cols-2 lg:grid-cols-4 gap-6'
            }`}>
              <MetricCard
                title="Total Revenue"
                value={14.32}
                change={6.3}
                period="YoY Income"
                format="percentage"
              />
              <MetricCard
                title="RoRWA"
                value={6.3}
                change={6.3}
                period="Risk-adjusted returns"
                format="percentage"
              />
              <MetricCard
                title="Sustainable Finance"
                value={50789}
                period="Mobilization"
                format="currency"
              />
              <MetricCard
                title="Tasks"
                value="7 overdue"
                period="3 tasks need attention"
                format="string"
              />
            </div>

            {/* Dynamically render charts based on platform */}
            {renderCharts()}

            <div className={`
              ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-[rgb(var(--scb-border))]'} 
              rounded-lg shadow-sm p-6
              ${isMultiTasking && mode === 'slide-over' ? 'p-4' : 'p-6'}
            `}>
              <h3 className={`
                scb-section-header text-lg font-medium mb-4 ${isDarkMode ? 'text-white' : ''}
                ${isMultiTasking && mode === 'slide-over' ? 'text-base mb-3' : 'text-lg mb-4'}
              `}>
                Personal & Additional Data Collection
              </h3>
              {renderButtons()}
            </div>
          </div>
        </IOSOptimizedLayout>
      ) : (
        <ScbBeautifulUI showNewsBar={!isSmallScreen} pageTitle="Asia Portfolio" showTabs={false}>
          <div className="space-y-6">
            <div>
              <p className="scb-data-label text-[rgb(var(--scb-dark-gray))] mt-1">
                Sofia - Transaction Banking CFO
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard
                title="Total Revenue"
                value={14.32}
                change={6.3}
                period="YoY Income"
                format="percentage"
              />
              <MetricCard
                title="RoRWA"
                value={6.3}
                change={6.3}
                period="Risk-adjusted returns"
                format="percentage"
              />
              <MetricCard
                title="Sustainable Finance"
                value={50789}
                period="Mobilization"
                format="currency"
              />
              <MetricCard
                title="Tasks"
                value="7 overdue"
                period="3 tasks need attention"
                format="string"
              />
            </div>

            {/* Dynamically render charts based on platform */}
            {renderCharts()}

            <div className="bg-white rounded-lg shadow-sm border border-[rgb(var(--scb-border))] p-6">
              <h3 className="scb-section-header text-lg font-medium mb-4">
                Personal & Additional Data Collection
              </h3>
              {renderButtons()}
            </div>
          </div>
        </ScbBeautifulUI>
      )}
    </>
  );
}