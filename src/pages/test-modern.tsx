import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import ModernLayout from '@/components/ModernLayout';
import { Sparkles, RefreshCw, Info, AlertTriangle, ChevronDown, ChevronUp, Sun, Moon } from 'lucide-react';
import Image from 'next/image';
import { EnhancedSankeyChart } from '@/components/charts';
import { initialSankeyData, forecastScenarioData } from '@/data/mockSankeyData';
import { IconSystemProvider } from '@/components/IconSystem';
import EnhancedIOSNavBar from '@/components/EnhancedIOSNavBar';
import EnhancedIOSTabBar from '@/components/EnhancedIOSTabBar';
import EnhancedIOSBreadcrumb from '@/components/EnhancedIOSBreadcrumb';
import { useDeviceCapabilities } from '@/hooks/useDeviceCapabilities';
import { useMultiTasking } from '@/hooks/useMultiTasking';
import haptics from '@/lib/haptics';
import { useSFSymbolsSupport } from '@/lib/sf-symbols';
import SFSymbol from '@/components/SFSymbol';

export default function TestModernPage() {
  const router = useRouter();
  const { deviceType, isAppleDevice, prefersColorScheme } = useDeviceCapabilities();
  const { isMultiTasking, mode } = useMultiTasking();
  
  const [dataMode, setDataMode] = useState<'standard' | 'aiEnhanced'>('standard');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(prefersColorScheme || 'light');
  const { supported: sfSymbolsSupported } = useSFSymbolsSupport();
  const [activeVisualization, setActiveVisualization] = useState<string>('sankey');
  
  // Detect if running on Apple device
  const isiOS = deviceType === 'mobile' && isAppleDevice;
  const isiPad = deviceType === 'tablet' && isAppleDevice;
  const isApplePlatform = isiOS || isiPad;
  
  // Determine if dark mode
  const isDark = theme === 'dark';
  
  // Visualization categories with SF Symbols icons
  const visualizationCategories = [
    { id: 'sankey', label: 'Sankey Flow', icon: 'arrow.triangle.branch', badge: null },
    { id: 'bar', label: 'Bar Chart', icon: 'chart.bar.fill', badge: null },
    { id: 'line', label: 'Line Chart', icon: 'chart.line.uptrend.xyaxis.fill', badge: null },
    { id: 'pie', label: 'Pie Chart', icon: 'chart.pie.fill', badge: null },
    { id: 'network', label: 'Network', icon: 'network', badge: null }
  ];
  
  // Breadcrumb items
  const breadcrumbItems = [
    { label: 'Dashboard', href: '/', icon: 'house' },
    { label: 'Demo', href: '/test-modern', icon: 'chart.bar' },
    { label: 'Sankey Chart', href: '/test-modern', icon: 'chart.line.uptrend.xyaxis' }
  ];
  
  // Tab items for bottom navigation
  const tabItems = [
    { key: 'home', label: 'Home', icon: 'house', href: '/' },
    { key: 'analytics', label: 'Analytics', icon: 'chart.bar', href: '/analytics' },
    { key: 'visualize', label: 'Visualize', icon: 'chart.line.uptrend.xyaxis', href: '/test-modern', badge: '1' },
    { key: 'data', label: 'Data', icon: 'folder', href: '/data-products' },
    { key: 'settings', label: 'Settings', icon: 'gear', href: '/settings' },
  ];
  
  // Navigation bar actions
  const navBarRightActions = [
    {
      icon: isDark ? 'sun.max.fill' : 'moon.fill',
      label: `Switch to ${isDark ? 'light' : 'dark'} mode`,
      onPress: () => {
        if (isApplePlatform) haptics.selection();
        toggleTheme();
      },
      variant: 'primary'
    },
    {
      icon: 'arrow.up.doc',
      label: 'Share chart',
      onPress: () => {
        if (isApplePlatform) haptics.selection();
        alert('Share functionality would open here');
      }
    },
    {
      icon: 'ellipsis.circle',
      label: 'More options',
      onPress: () => {
        if (isApplePlatform) haptics.selection();
        alert('More options would open here');
      }
    }
  ];
  
  // Simulate AI generation with a delay
  const generateAIEnhancedData = () => {
    if (dataMode === 'aiEnhanced') return;
    
    if (isApplePlatform) haptics.success();
    
    setIsGenerating(true);
    setTimeout(() => {
      setDataMode('aiEnhanced');
      setIsGenerating(false);
    }, 1500);
  };
  
  // Toggle theme
  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };
  
  // Handle visualization type change
  const handleVisualizationChange = (visType: string) => {
    if (isApplePlatform) {
      haptics.selection();
    }
    
    setActiveVisualization(visType);
    
    // In a real implementation, this would load the appropriate visualization type
    console.log(`Switching to visualization: ${visType}`);
  };
  
  // SF Symbols Visualization Categories Navigation Component
  const SFSymbolsVisualizationNavigation = () => {
    if (!isApplePlatform || !sfSymbolsSupported) {
      return null;
    }
    
    return (
      <div className={`mb-4 -mx-4 px-4 overflow-x-auto ${isDark ? 'bg-gray-800' : 'bg-white'} border-t border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} shadow-sm py-3`}>
        <div className="flex items-center space-x-3 overflow-x-auto pb-1 hide-scrollbar">
          {visualizationCategories.map((category) => (
            <div 
              key={category.id}
              onClick={() => handleVisualizationChange(category.id)}
              className={`flex flex-col items-center p-2 rounded-xl cursor-pointer transition-colors ${
                activeVisualization === category.id
                ? isDark 
                  ? 'bg-blue-900/30' 
                  : 'bg-blue-50'
                : isDark 
                  ? 'hover:bg-gray-700' 
                  : 'hover:bg-gray-100'
              }`}
              style={{ minWidth: isMultiTasking && mode === 'slide-over' ? '64px' : '80px' }}
            >
              <div className={`relative flex items-center justify-center ${
                isMultiTasking && mode === 'slide-over' ? 'w-10 h-10' : 'w-12 h-12'
              } rounded-full mb-1 ${
                activeVisualization === category.id
                ? isDark 
                  ? 'bg-blue-500' 
                  : 'bg-blue-500'
                : isDark 
                  ? 'bg-gray-700' 
                  : 'bg-gray-200'
              }`}>
                <SFSymbol 
                  name={category.icon} 
                  size={isMultiTasking && mode === 'slide-over' ? 22 : 24}
                  color={activeVisualization === category.id ? 'white' : undefined}
                />
                
                {/* Badge indicator */}
                {category.badge && (
                  <div className="absolute -top-1 -right-1 min-w-5 h-5 flex items-center justify-center rounded-full bg-red-500 text-white text-xs px-1">
                    {category.badge}
                  </div>
                )}
              </div>
              <span className={`text-center ${isMultiTasking && mode === 'slide-over' ? 'text-xs' : 'text-sm'} ${
                activeVisualization === category.id
                ? isDark ? 'text-blue-400 font-medium' : 'text-blue-600 font-medium'
                : isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                {category.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  // Current data based on mode
  const currentData = dataMode === 'standard' ? initialSankeyData : forecastScenarioData;
  
  return (
    <IconSystemProvider>
      <ModernLayout>
        {/* iOS-style Navigation Bar */}
        <EnhancedIOSNavBar
          title="Sankey Chart Demo"
          subtitle="Interactive Financial Visualization"
          largeTitle={!isMultiTasking || mode !== 'slide-over'}
          blurred={true}
          showBackButton={true}
          onBackButtonPress={() => router.push('/')}
          theme={isDark ? 'dark' : 'light'}
          rightActions={isMultiTasking && mode === 'slide-over' ? 
            [navBarRightActions[0]] : navBarRightActions}
          respectSafeArea={true}
          hapticFeedback={true}
          position="sticky"
        />
        
        {/* iOS-style Breadcrumb */}
        {(!isMultiTasking || mode !== 'slide-over') && (
          <div className={`px-4 py-2 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
            <EnhancedIOSBreadcrumb
              items={breadcrumbItems}
              showIcons={true}
              hapticFeedback={true}
              theme={isDark ? 'dark' : 'light'}
              compact={isMultiTasking}
            />
          </div>
        )}
        
        {/* Main Content */}
        <div className={`${isMultiTasking && mode === 'slide-over' 
          ? 'px-2 py-2 space-y-4 overflow-x-hidden' 
          : isMultiTasking && mode === 'split-view'
            ? 'px-4 py-3 space-y-5 max-w-4xl' 
            : 'px-6 py-4 space-y-6 max-w-6xl'} mx-auto`}>
        
          {/* SCB Banner Image */}
          <div className="w-full overflow-hidden rounded-md shadow-sm mb-6 max-h-[180px]">
            <Image 
              src="/images/banner.png" 
              alt="SCB Sapphire FinSight Banner" 
              width={1200} 
              height={180} 
              className="w-full object-cover"
              priority
            />
          </div>
          
          {/* SF Symbols Visualization Navigation */}
          {isApplePlatform && sfSymbolsSupported && (
            <SFSymbolsVisualizationNavigation />
          )}
          
          {/* Welcome Card */}
          <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-6 rounded-lg shadow-sm border`}>
            <div className="flex justify-between items-center mb-4">
              <h1 className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {activeVisualization === 'sankey' ? 'Enhanced Sankey Chart Demo' : 
                 activeVisualization === 'bar' ? 'Bar Chart Visualization' :
                 activeVisualization === 'line' ? 'Line Chart Visualization' :
                 activeVisualization === 'pie' ? 'Pie Chart Visualization' :
                 'Network Graph Visualization'}
              </h1>
              
              <button 
                onClick={toggleTheme}
                className="fiori-btn fiori-btn-ghost p-2.5 rounded-full"
                aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
              >
                {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              </button>
            </div>
            
            <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'} mb-6`}>
              {activeVisualization === 'sankey' ? 
                'This page demonstrates the new EnhancedSankeyChart component with SCB Beautiful UI styling and iOS-optimized navigation.' :
               activeVisualization === 'bar' ? 
                'Interactive bar chart visualization for financial data analysis with comparison capabilities and advanced filtering.' :
               activeVisualization === 'line' ? 
                'Time-series line chart with trend analysis, forecasting, and interactive data point exploration.' :
               activeVisualization === 'pie' ? 
                'Segmented pie chart visualization with drilldown capabilities and proportional analysis tools.' :
                'Interactive network graph showing relationships between financial entities with connection strength analysis.'}
            </p>
            
            {/* Controls */}
            <div className="flex flex-wrap gap-3 mb-4">
              <button 
                onClick={() => {
                  if (isApplePlatform) haptics.selection();
                  setDataMode('standard');
                }}
                className={`fiori-btn ${dataMode === 'standard' ? 'fiori-btn-primary' : 'fiori-btn-secondary'}`}
              >
                Standard Data
              </button>
              
              <button 
                onClick={generateAIEnhancedData}
                disabled={isGenerating}
                className={`fiori-btn ${dataMode === 'aiEnhanced' ? 'fiori-btn-primary' : 'fiori-btn-secondary'} flex items-center gap-1`}
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    AI-Enhanced Data
                  </>
                )}
              </button>
              
              <button 
                onClick={() => {
                  if (isApplePlatform) haptics.selection();
                  setIsExpanded(!isExpanded);
                }}
                className="fiori-btn fiori-btn-ghost flex items-center gap-1 text-gray-700"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="w-4 h-4" />
                    Collapse
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4" />
                    Expand
                  </>
                )}
              </button>
            </div>
          </div>
          
          {/* AI Message Bar - Show for standard mode to prompt AI enhancement */}
          {dataMode === 'standard' && (
            <div className="bg-[rgba(var(--scb-honolulu-blue),0.08)] border border-[rgba(var(--scb-honolulu-blue),0.2)] p-4 rounded-lg mb-6 flex items-center gap-3">
              <div className="flex-shrink-0">
                <Sparkles className="text-[rgb(var(--scb-american-green))] w-6 h-6" />
              </div>
              <div className="flex-grow">
                <h3 className="text-sm font-medium text-[rgb(var(--scb-dark-gray))]">
                  AI-Enhanced Analysis Available
                </h3>
                <p className="text-xs text-[rgb(var(--scb-dark-gray))]">
                  Click the "AI-Enhanced Data" button to see predictive flows and AI insights for your financial data.
                </p>
              </div>
              <button 
                onClick={generateAIEnhancedData}
                className="fiori-btn-primary text-xs px-4 py-1.5"
              >
                Generate
              </button>
            </div>
          )}
          
          {/* Visualizations */}
          <div className={`transition-all duration-500 ease-in-out ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg shadow-sm border ${isExpanded ? 'h-[700px]' : 'h-[500px]'}`}>
            {activeVisualization === 'sankey' ? (
              <EnhancedSankeyChart 
                data={currentData}
                width={1100}
                height={isExpanded ? 650 : 450}
                title="Financial Flow Analysis"
                subtitle={dataMode === 'aiEnhanced' ? "With AI-enhanced predictions" : "Standard analysis"}
                showAIControls={true}
                showLegend={true}
                isLoading={isGenerating}
                adaptiveLayout={true}
                onRegenerateClick={generateAIEnhancedData}
                onExpandChart={() => setIsExpanded(!isExpanded)}
                className="h-full w-full"
                animationDuration={800}
                theme={theme}
              />
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                <SFSymbol 
                  name={visualizationCategories.find(c => c.id === activeVisualization)?.icon || 'chart.bar.fill'} 
                  size={80}
                  color={isDark ? "#60a5fa" : "#3b82f6"}
                />
                
                <h3 className={`mt-6 text-xl font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {activeVisualization === 'bar' ? 'Bar Chart Visualization' :
                   activeVisualization === 'line' ? 'Line Chart Visualization' :
                   activeVisualization === 'pie' ? 'Pie Chart Visualization' :
                   'Network Graph Visualization'}
                </h3>
                
                <p className={`mt-3 max-w-md ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  {activeVisualization === 'bar' ? 
                    'Interactive bar chart for comparing financial metrics across categories with advanced filtering capabilities.' :
                   activeVisualization === 'line' ? 
                    'Time-series financial analysis with trend detection, anomaly highlighting, and forecast projections.' :
                   activeVisualization === 'pie' ? 
                    'Proportional analysis of financial allocations with interactive drilldown for detailed segment exploration.' :
                    'Network diagram showing connections and relationships between financial entities with strength indicators.'}
                </p>
                
                <button 
                  className="mt-6 fiori-btn fiori-btn-primary"
                  onClick={() => handleVisualizationChange('sankey')}
                >
                  Return to Sankey Chart
                </button>
              </div>
            )}
          </div>
          
          {/* Feature Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
            <div className="p-4 bg-[rgba(var(--scb-honolulu-blue),0.08)] rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">🎨 SCB Beautiful UI</h3>
              <p className="text-sm text-gray-600">
                Enhanced with SCB color variables, Fiori Horizon styling, and advanced interactive elements
              </p>
            </div>
            
            <div className="p-4 bg-[rgba(var(--scb-american-green),0.08)] rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">✨ AI Enhancements</h3>
              <p className="text-sm text-gray-600">
                View AI-based predictions, highlighted flows, and get intelligent financial recommendations
              </p>
            </div>
            
            <div className="p-4 bg-[rgba(var(--horizon-blue),0.08)] rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">📱 Responsive Design</h3>
              <p className="text-sm text-gray-600">
                Network-aware loading and device capability detection for optimal performance
              </p>
            </div>
            
            <div className="p-4 bg-[rgba(var(--horizon-neutral-gray),0.08)] rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">🌓 Dark Mode</h3>
              <p className="text-sm text-gray-600">
                Full dark mode support with appropriate contrast and colors for night viewing
              </p>
            </div>
            
            <div className="p-4 bg-[rgba(var(--scb-honolulu-blue),0.08)] rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">📊 Detailed Tooltips</h3>
              <p className="text-sm text-gray-600">
                Hover over nodes and links for detailed information with beautiful formatting
              </p>
            </div>
            
            <div className="p-4 bg-[rgba(var(--scb-american-green),0.08)] rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">⚡ Performance Optimized</h3>
              <p className="text-sm text-gray-600">
                Adaptive animations and rendering based on network conditions and device capabilities
              </p>
            </div>
          </div>
          
          {/* Key enhancements */}
          <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-6 rounded-lg shadow-sm border mt-6`}>
            <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-4`}>Key Component Enhancements</h2>
            
            <div className="space-y-3">
              <div className="flex items-start">
                <div className="w-3 h-3 bg-[rgb(var(--scb-american-green))] rounded-full mt-1.5 mr-3"></div>
                <div>
                  <span className={`${isDark ? 'text-white' : 'text-gray-900'} font-medium`}>Network-Aware Adaptivity</span>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Component automatically adjusts complexity based on network conditions and device capabilities</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="w-3 h-3 bg-[rgb(var(--scb-american-green))] rounded-full mt-1.5 mr-3"></div>
                <div>
                  <span className={`${isDark ? 'text-white' : 'text-gray-900'} font-medium`}>Dark Mode Support</span>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Full theming with appropriate colors for both light and dark modes</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="w-3 h-3 bg-[rgb(var(--scb-american-green))] rounded-full mt-1.5 mr-3"></div>
                <div>
                  <span className={`${isDark ? 'text-white' : 'text-gray-900'} font-medium`}>Accessibility</span>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>ARIA attributes, keyboard navigation, and proper color contrast for all users</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="w-3 h-3 bg-[rgb(var(--scb-american-green))] rounded-full mt-1.5 mr-3"></div>
                <div>
                  <span className={`${isDark ? 'text-white' : 'text-gray-900'} font-medium`}>Intelligent Animations</span>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Animations adapt or disable based on network speed and device performance</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="w-3 h-3 bg-[rgb(var(--scb-american-green))] rounded-full mt-1.5 mr-3"></div>
                <div>
                  <span className={`${isDark ? 'text-white' : 'text-gray-900'} font-medium`}>iOS-Optimized UI</span>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Native SF Symbols, iOS navigation patterns, and iPad multi-tasking support</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Demo Instructions */}
          <div className={`${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300'} p-6 rounded-lg border`}>
            <h3 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'} mb-3`}>🚀 Try These Features:</h3>
            <ol className={`space-y-2 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'} list-decimal list-inside`}>
              <li>Toggle between standard and AI-enhanced data</li>
              <li>Expand/collapse the chart height</li>
              <li>Switch between light and dark themes</li>
              <li>Hover over nodes and links for detailed information</li>
              <li>Click the AI insights button (sparkles) to view recommendations</li>
              <li>Toggle node labels on/off with the eye button</li>
              <li>Navigate using the iOS-style tab bar at the bottom</li>
              <li>Experience the haptic feedback on iOS devices</li>
            </ol>
          </div>
        </div>
        
        {/* iOS Tab Bar */}
        <EnhancedIOSTabBar
          items={tabItems}
          floating={true}
          blurred={true}
          showLabels={true}
          labelPosition="below"
          compact={isMultiTasking && mode === 'slide-over'}
          hapticFeedback={true}
          theme={theme}
          respectSafeArea={true}
        />
      </ModernLayout>
    </IconSystemProvider>
  );
}