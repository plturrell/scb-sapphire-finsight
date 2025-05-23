import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import ScbBeautifulUI from '@/components/ScbBeautifulUI';
import EnhancedForceDirectedGraph from '@/components/EnhancedForceDirectedGraph';
import EnhancedTouchButton from '@/components/EnhancedTouchButton';
import EnhancedLoadingSpinner from '@/components/EnhancedLoadingSpinner';
import EnhancedIOSNavBar from '@/components/EnhancedIOSNavBar';
import EnhancedIOSTabBar from '@/components/EnhancedIOSTabBar';
import EnhancedIOSBreadcrumb from '@/components/EnhancedIOSBreadcrumb';
import { IconSystemProvider } from '@/components/IconSystem';
import { ICONS } from '@/components/IconSystem';
import useMultiTasking from '@/hooks/useMultiTasking';
import { haptics } from '@/lib/haptics';
import { useMediaQuery } from 'react-responsive';
import { useUIPreferences } from '@/context/UIPreferencesContext';
import { 
  Sparkles, RefreshCw, Info, BarChart3, PieChart, HelpCircle, 
  ChevronRight, Filter, GridIcon, Search, Settings, Download, Share2 
} from 'lucide-react';
import * as d3 from 'd3';

// Define GraphNode interface similar to the one in ForceDirectedGraph.tsx
interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  label: string;
  group: string;
  value: number;
  aiGenerated?: boolean;
  confidence?: number;
  description?: string;
}

// Sample data for the force-directed graph visualization
const generateKnowledgeGraphData = (includePredictions = false) => {
  const baseNodes = [
    { id: '1', label: 'Financial Markets', group: 'Financial', value: 8, description: 'Global financial markets overview' },
    { id: '2', label: 'Economic Indicators', group: 'Economic', value: 6, description: 'Key economic indicators and trends' },
    { id: '3', label: 'Regulatory Changes', group: 'Regulatory', value: 5, description: 'Recent regulatory updates affecting banking' },
    { id: '4', label: 'Interest Rates', group: 'Financial', value: 7, description: 'Interest rate trends and forecasts' },
    { id: '5', label: 'Market Volatility', group: 'Market', value: 4, description: 'Analysis of market volatility factors' },
    { id: '6', label: 'Credit Risk', group: 'Risk', value: 5, description: 'Credit risk assessment and management' },
    { id: '7', label: 'Consumer Banking', group: 'Client', value: 4, description: 'Consumer banking trends and insights' },
    { id: '8', label: 'Digital Banking', group: 'Technology', value: 6, description: 'Digital transformation in banking' },
    { id: '9', label: 'Corporate Finance', group: 'Financial', value: 5, description: 'Corporate finance strategies and insights' },
    { id: '10', label: 'Investment Management', group: 'Financial', value: 7, description: 'Investment management approaches' },
    { id: '11', label: 'SCB Strategy', group: 'Internal', value: 8, description: 'Standard Chartered Bank strategic initiatives' },
    { id: '12', label: 'Competitive Analysis', group: 'Market', value: 5, description: 'Analysis of banking competitors' },
  ];
  
  // Add AI-generated nodes when predictions are included
  const aiNodes = [
    { 
      id: '13', 
      label: 'ESG Investments', 
      group: 'Market', 
      value: 7, 
      aiGenerated: true,
      confidence: 0.92,
      description: 'Environmental, Social, and Governance investment trends' 
    },
    { 
      id: '14', 
      label: 'Fintech Disruption', 
      group: 'Technology', 
      value: 8, 
      aiGenerated: true,
      confidence: 0.87,
      description: 'Impact of fintech innovations on traditional banking' 
    },
    { 
      id: '15', 
      label: 'Emerging Markets', 
      group: 'Economic', 
      value: 6, 
      aiGenerated: true,
      confidence: 0.78,
      description: 'Growth opportunities in emerging markets' 
    },
  ];
  
  const nodes = includePredictions ? [...baseNodes, ...aiNodes] : baseNodes;
  
  const baseLinks = [
    { source: '1', target: '4', value: 3 },
    { source: '1', target: '5', value: 4 },
    { source: '1', target: '10', value: 5 },
    { source: '2', target: '1', value: 4 },
    { source: '2', target: '4', value: 5 },
    { source: '3', target: '6', value: 3 },
    { source: '3', target: '11', value: 4 },
    { source: '4', target: '6', value: 3 },
    { source: '5', target: '10', value: 2 },
    { source: '6', target: '9', value: 3 },
    { source: '7', target: '8', value: 4 },
    { source: '7', target: '11', value: 3 },
    { source: '8', target: '12', value: 2 },
    { source: '9', target: '10', value: 4 },
    { source: '10', target: '11', value: 3 },
    { source: '11', target: '12', value: 4 },
  ];
  
  // Add AI-generated links when predictions are included
  const aiLinks = [
    { source: '13', target: '10', value: 4, aiGenerated: true, confidence: 0.92 },
    { source: '13', target: '11', value: 5, aiGenerated: true, confidence: 0.85 },
    { source: '14', target: '8', value: 5, aiGenerated: true, confidence: 0.89 },
    { source: '14', target: '12', value: 3, aiGenerated: true, confidence: 0.76 },
    { source: '15', target: '1', value: 4, aiGenerated: true, confidence: 0.82 },
    { source: '15', target: '2', value: 5, aiGenerated: true, confidence: 0.90 },
    { source: '15', target: '9', value: 3, aiGenerated: true, confidence: 0.73 },
    // Additional connections between existing nodes
    { source: '1', target: '8', value: 3, aiGenerated: true, confidence: 0.78 },
    { source: '2', target: '9', value: 3, aiGenerated: true, confidence: 0.81 },
  ];
  
  const links = includePredictions ? [...baseLinks, ...aiLinks] : baseLinks;
  
  return {
    nodes,
    links,
    aiMetadata: includePredictions ? {
      generatedAt: new Date(),
      confidenceScore: 0.85,
      dataSource: ['SCB Market Research', 'Financial Times Analysis', 'Bloomberg Data', 'Internal Reports'],
      insightSummary: 'Analysis reveals strong connections between emerging markets, ESG investments and fintech disruption. These areas represent significant growth opportunities and strategic importance for SCB.'
    } : undefined
  };
};

// Demo tiles data for the dashboard
const demoTiles = [
  {
    id: 'knowledge-graph',
    title: 'Knowledge Graph',
    icon: <GridIcon className="w-5 h-5 text-[rgb(var(--scb-primary))]" />,
    description: 'Visualize connections between financial knowledge areas',
    size: 'large',
    component: 'force-graph'
  },
  {
    id: 'financial-flows',
    title: 'Financial Flows',
    icon: <BarChart3 className="w-5 h-5 text-[rgb(var(--scb-accent))]" />,
    description: 'Track how financial resources move through your organization',
    size: 'medium',
    link: '/sankey-demo'
  },
  {
    id: 'market-insights',
    title: 'Market Insights',
    icon: <PieChart className="w-5 h-5 text-[rgb(var(--horizon-blue))]" />,
    description: 'Get the latest market trends and opportunities',
    size: 'small',
    badge: 'New'
  },
  {
    id: 'joule-assistant',
    title: 'Joule Assistant',
    icon: <Sparkles className="w-5 h-5 text-[rgb(var(--scb-accent))]" />,
    description: 'Get AI-powered insights and recommendations',
    size: 'small'
  },
  {
    id: 'risk-analysis',
    title: 'Risk Analysis',
    icon: <Info className="w-5 h-5 text-[rgb(var(--horizon-red))]" />,
    description: 'Identify and assess potential risks',
    size: 'small'
  },
  {
    id: 'learning-center',
    title: 'Learning Center',
    icon: <HelpCircle className="w-5 h-5 text-[rgb(var(--horizon-purple))]" />,
    description: 'Access training and educational resources',
    size: 'small'
  }
];

const KnowledgeDashboard: React.FC = () => {
  const [graphData, setGraphData] = useState(generateKnowledgeGraphData(false));
  const [isLoading, setIsLoading] = useState(false);
  const [showAiInsights, setShowAiInsights] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  
  // Platform detection state
  const [isMounted, setIsMounted] = useState(false);
  const [isPlatformDetected, setPlatformDetected] = useState(false);
  const [isAppleDevice, setIsAppleDevice] = useState(false);
  const [isIPad, setIsIPad] = useState(false);
  
  const router = useRouter();
  const isSmallScreen = useMediaQuery({ maxWidth: 768 });
  const { mode, isMultiTasking, orientation } = useMultiTasking();
  const { isDark: isDark, preferences } = useUIPreferences();
  
  // Active tab state for the iOS tab bar
  const [activeTab, setActiveTab] = useState('knowledge');
  
  // iOS tab bar configuration
  const tabItems = [
    {
      key: 'dashboard',
      label: 'Dashboard',
      icon: ICONS.HOME,
      href: '/dashboard',
    },
    {
      key: 'analytics',
      label: 'Analytics',
      icon: 'chart.bar.xaxis',
      href: '/financial-simulation'
    },
    {
      key: 'knowledge',
      label: 'Knowledge',
      icon: 'network',
      activeIcon: 'network.fill',
      href: '/knowledge-dashboard',
      sfSymbolVariant: 'fill'
    },
    {
      key: 'reports',
      label: 'Reports',
      icon: 'doc.text',
      href: '/reports',
      badge: '3',
    },
    {
      key: 'settings',
      label: 'Settings',
      icon: ICONS.SETTINGS,
      href: '/settings',
    },
  ];
  
  // Breadcrumb items
  const breadcrumbItems = [
    { label: 'Home', href: '/', icon: 'house' },
    { label: 'Knowledge', href: '/knowledge-dashboard', icon: 'network' }
  ];
  
  // Detect platform on mount
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
  
  // Function to regenerate the graph with AI insights with haptic feedback
  const regenerateWithAI = () => {
    // Provide haptic feedback on Apple devices
    if (isAppleDevice) {
      haptics.medium();
    }
    
    setIsLoading(true);
    setTimeout(() => {
      setGraphData(generateKnowledgeGraphData(true));
      setShowAiInsights(true);
      setIsLoading(false);
      
      // Success haptic feedback when complete on Apple devices
      if (isAppleDevice) {
        haptics.success();
      }
    }, 1500);
  };
  
  // Handle group selection with haptic feedback
  const handleGroupSelect = (group: string | null) => {
    // Provide haptic feedback on Apple devices
    if (isAppleDevice) {
      haptics.selection();
    }
    
    setSelectedGroup(group);
  };
  
  // Knowledge domain categories with SF Symbols icons
  const knowledgeDomains = [
    { id: 'all', label: 'All', icon: 'network', badge: graphData.nodes.length },
    { id: 'financial', label: 'Financial', icon: 'dollarsign.circle.fill', badge: graphData.nodes.filter(n => n.group === 'Financial').length },
    { id: 'market', label: 'Market', icon: 'chart.bar.fill', badge: graphData.nodes.filter(n => n.group === 'Market').length },
    { id: 'economic', label: 'Economic', icon: 'chart.line.uptrend.xyaxis.fill', badge: graphData.nodes.filter(n => n.group === 'Economic').length },
    { id: 'regulatory', label: 'Regulatory', icon: 'building.columns.fill', badge: graphData.nodes.filter(n => n.group === 'Regulatory').length },
    { id: 'risk', label: 'Risk', icon: 'exclamationmark.triangle.fill', badge: graphData.nodes.filter(n => n.group === 'Risk').length },
    { id: 'technology', label: 'Technology', icon: 'desktopcomputer', badge: graphData.nodes.filter(n => n.group === 'Technology').length },
    { id: 'client', label: 'Client', icon: 'person.2.fill', badge: graphData.nodes.filter(n => n.group === 'Client').length },
    { id: 'internal', label: 'Internal', icon: 'building.2.fill', badge: graphData.nodes.filter(n => n.group === 'Internal').length }
  ];
  
  // Handle tile click with haptic feedback
  const handleTileClick = (tileId: string, link?: string) => {
    // Provide haptic feedback on Apple devices
    if (isAppleDevice) {
      haptics.medium();
    }
    
    // Navigate to the link if provided
    if (link) {
      window.location.href = link;
    } else {
      console.log(`Opening tile: ${tileId}`);
      // In a real application, we would open the tile's content
    }
  };
  
  // Handle download action with haptic feedback
  const handleDownloadClick = () => {
    if (isAppleDevice) {
      haptics.medium();
    }
    
    // In a real application, this would trigger a download
    alert('Downloading knowledge graph as PDF...');
  };

  // Handle share action with haptic feedback
  const handleShareClick = () => {
    if (isAppleDevice) {
      haptics.medium();
    }
    
    // In a real application, this would open a share dialog
    alert('Opening share dialog...');
  };
  
  // Handle tab changes
  const handleTabChange = (key: string) => {
    setActiveTab(key);
    // Navigate to the corresponding page
    const selectedTab = tabItems.find(item => item.key === key);
    if (selectedTab && selectedTab.href) {
      router.push(selectedTab.href);
    }
  };
  
  // SF Symbols Knowledge Domain Navigation component
  const SFSymbolsDomainsNavigation = () => {
    if (!isAppleDevice || !isPlatformDetected) {
      return null;
    }
    
    return (
      <div className={`rounded-lg overflow-x-auto ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm border ${isDark ? 'border-gray-700' : 'border-[rgb(var(--scb-border))]'} p-1 mb-4`}>
        <div className="flex items-center overflow-x-auto hide-scrollbar pb-1">
          {knowledgeDomains.map((domain) => (
            <button 
              key={domain.id}
              onClick={() => handleGroupSelect(domain.id === 'all' ? null : domain.id)}
              className={`
                flex flex-col items-center justify-center p-2 min-w-[72px] rounded-lg transition-colors
                ${(domain.id === 'all' && !selectedGroup) || (selectedGroup && domain.id === selectedGroup.toLowerCase())
                  ? isDark 
                    ? 'bg-blue-900/30 text-blue-400' 
                    : 'bg-blue-50 text-blue-600'
                  : isDark 
                    ? 'text-gray-300 hover:bg-gray-700' 
                    : 'text-gray-600 hover:bg-gray-100'
                }
              `}
            >
              <div className="relative">
                <span className="sf-symbol text-xl" role="img">{domain.icon}</span>
                
                {/* Badge */}
                {domain.badge && (
                  <span className={`
                    absolute -top-1 -right-1 text-white text-[10px] font-bold rounded-full min-w-[16px] h-[16px] 
                    flex items-center justify-center
                    ${isDark ? 'bg-blue-600' : 'bg-red-500'}
                  `}>
                    {domain.badge > 99 ? '99+' : domain.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium mt-1">{domain.label}</span>
            </button>
          ))}
        </div>
      </div>
    );
  };
  
  // Filter data by group if a group is selected
  const filteredData = React.useMemo(() => {
    if (!selectedGroup) return graphData;
    
    const nodes = graphData.nodes.filter(node => 
      node.group.toLowerCase() === selectedGroup.toLowerCase()
    );
    
    const nodeIds = new Set(nodes.map(n => n.id));
    
    const links = graphData.links.filter(link => {
      const sourceId = typeof link.source === 'string' ? link.source : (link.source as GraphNode).id;
      const targetId = typeof link.target === 'string' ? link.target : (link.target as GraphNode).id;
      return nodeIds.has(sourceId) && nodeIds.has(targetId);
    });
    
    return { ...graphData, nodes, links };
  }, [graphData, selectedGroup]);

  return (
    <React.Fragment>
      <Head>
        <title>Knowledge Dashboard | SCB Sapphire</title>
        <meta name="description" content="Visualize and explore financial knowledge connections with the SCB Sapphire knowledge graph" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </Head>
      <ScbBeautifulUI 
        showNewsBar={!isSmallScreen && !isMultiTasking} 
        showSearchBar={true} 
        showTabs={false}
        pageTitle="Knowledge Dashboard"
      >
        <IconSystemProvider>
          {isAppleDevice && isPlatformDetected ? (
            <div className={`min-h-screen ${isSmallScreen ? 'pb-20' : 'pb-16'} ${isPlatformDetected ? (isDark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900') : ''}`}>
              {/* iOS Navigation Bar - Adapted for iPad multi-tasking */}
              <EnhancedIOSNavBar 
                title="Knowledge Dashboard"
                subtitle={isMultiTasking && mode === 'slide-over' ? null : "Financial Knowledge Explorer"}
                largeTitle={!isMultiTasking || mode !== 'slide-over'}
                blurred={true}
                showBackButton={false}
                theme={isDark ? 'dark' : 'light'}
                rightActions={isMultiTasking && mode === 'slide-over' ? [
                  {
                    icon: 'square.and.arrow.down',
                    label: null, // No label in slide-over mode
                    onPress: handleDownloadClick,
                    variant: 'primary',
                    size: 'small'
                  }
                ] : [
                  {
                    icon: 'square.and.arrow.down',
                    label: 'Export',
                    onPress: handleDownloadClick,
                    variant: 'primary'
                  },
                  {
                    icon: 'square.and.arrow.up',
                    label: 'Share',
                    onPress: handleShareClick
                  }
                ]}
                respectSafeArea={true}
                hapticFeedback={true}
                multiTaskingMode={mode}
                isMultiTasking={isMultiTasking}
                compactFormatting={isMultiTasking}
              />
              
              {/* Breadcrumb Navigation - Hide in slide-over mode to save space */}
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
              
              {/* Main content container - adjusted padding for multi-tasking */}
              <div className={`${isMultiTasking && mode === 'slide-over' 
                ? 'px-2 py-2 overflow-x-hidden' 
                : isMultiTasking && mode === 'split-view'
                  ? 'px-4 py-3 max-w-4xl' 
                  : 'px-6 py-4 max-w-6xl'} mx-auto`}>
        {/* Remove dashboard header since it's in the navbar */}
        
        {/* SF Symbols Knowledge Domain Navigation for Apple devices */}
        {isAppleDevice && isPlatformDetected ? (
          <SFSymbolsDomainsNavigation />
        ) : (
          /* Traditional filter badges for non-Apple devices */
          <div className={`mt-2 mb-6 flex flex-wrap ${isMultiTasking && mode === 'slide-over' ? 'gap-1.5' : 'gap-2'}`}>
            {['All', 'Financial', 'Market', 'Economic', 'Regulatory', 'Risk', 'Technology', 'Client', 'Internal'].map(group => (
              <button
                key={group}
                onClick={() => handleGroupSelect(group === 'All' ? null : group)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  (group === 'All' && !selectedGroup) || selectedGroup === group
                    ? 'bg-[rgb(var(--scb-primary))] text-white'
                    : isDark 
                      ? 'bg-gray-700 text-gray-300 border border-gray-600 hover:bg-gray-600'
                      : 'bg-white text-gray-700 border border-[rgb(var(--scb-border))] hover:bg-gray-50'
                }`}
              >
                {group}
              </button>
            ))}
          </div>
        )}
        
        {/* Fiori Launch Pad Grid */}
        <div className={`grid grid-cols-1 ${isMultiTasking && mode === 'slide-over' ? 'gap-3' : 'md:grid-cols-2 lg:grid-cols-4 gap-5'}`}>
          {/* Main visualization - spans 2x2 */}
          <div className={`${isMultiTasking ? 'col-span-1' : 'col-span-full lg:col-span-2 lg:row-span-2'} 
            ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-[rgb(var(--scb-border))]'} 
            rounded-lg shadow-sm border ${isMultiTasking && mode === 'slide-over' ? 'p-3' : 'p-4'} 
            ${isMultiTasking ? (mode === 'slide-over' ? 'h-[380px]' : 'h-[500px]') : 'h-[580px]'}`}>
            <div className="flex justify-between items-center mb-3">
              <h2 className={`${isMultiTasking && mode === 'slide-over' ? 'text-base' : 'text-lg'} font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Knowledge Graph Explorer
              </h2>
              
              {/* Generate AI insights button for iOS devices */}
              {isAppleDevice && isPlatformDetected && !showAiInsights && (
                <EnhancedTouchButton
                  onClick={regenerateWithAI}
                  variant={isDark ? "dark" : "primary"}
                  size={isMultiTasking && mode === 'slide-over' ? 'xs' : 'sm'}
                  className="flex items-center gap-1"
                >
                  <Sparkles className={`${isMultiTasking && mode === 'slide-over' ? 'w-3 h-3' : 'w-4 h-4'}`} />
                  {!isMultiTasking && <span>Generate AI Insights</span>}
                </EnhancedTouchButton>
              )}
            </div>
            
            <div className="h-[calc(100%-32px)]">
              {isLoading ? (
                <div className="h-full flex items-center justify-center">
                  <EnhancedLoadingSpinner
                    variant="primary"
                    size="lg"
                    message="Generating insights..."
                    isAppleDevice={isAppleDevice}
                  />
                </div>
              ) : (
                <EnhancedForceDirectedGraph
                  data={filteredData}
                  title="Knowledge Graph Explorer"
                  showControls={true}
                  showLegend={!isMultiTasking || mode !== 'slide-over'}
                  isAppleDevice={isAppleDevice}
                  isIPad={isIPad}
                  isMultiTasking={isMultiTasking}
                  multiTaskingMode={mode}
                  orientation={orientation}
                  enableHaptics={isAppleDevice}
                  onRegenerateClick={!showAiInsights ? regenerateWithAI : undefined}
                  darkMode={isDark}
                />
              )}
            </div>
            
            {/* Interactive hint for iOS devices */}
            {isAppleDevice && !isLoading && (
              <div className={`text-xs text-center mt-2 ${isDark ? 'text-blue-400 opacity-70' : 'text-blue-600 opacity-70'}`}>
                {isMultiTasking && mode === 'slide-over'
                  ? 'Tap nodes for details'
                  : 'Tap and drag nodes to explore connections'
                }
              </div>
            )}
          </div>
          
          {/* Other dashboard tiles */}
          {(!isMultiTasking || mode !== 'slide-over' || !isAppleDevice) && 
            demoTiles.filter(tile => tile.id !== 'knowledge-graph').map(tile => (
              <div 
                key={tile.id}
                className={`${
                  isDark ? 'bg-gray-800 border-gray-700 hover:shadow-lg' : 'bg-white border-[rgb(var(--scb-border))] hover:shadow-md'
                } rounded-lg shadow-sm border p-4 ${preferences.enableAnimations ? 'transition-shadow' : ''} ${
                  tile.size === 'medium' && !isMultiTasking ? 'lg:col-span-2' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    {tile.icon}
                    <h3 className={`text-base font-medium ml-2 ${
                      isDark ? 'text-white' : 'text-[rgb(var(--scb-dark-text))]'
                    }`}>{tile.title}</h3>
                  </div>
                  {tile.badge && (
                    <span className={`${
                      isDark ? 'bg-opacity-20 bg-blue-500' : 'bg-[rgba(var(--scb-accent),0.1)]'
                    } text-[rgb(var(--scb-accent))] text-xs px-2 py-0.5 rounded`}>
                      {tile.badge}
                    </span>
                  )}
                </div>
                
                <p className={`text-sm mb-4 ${
                  isDark ? 'text-gray-300' : 'text-gray-600'
                }`}>{tile.description}</p>
                
                {isAppleDevice ? (
                  <EnhancedTouchButton
                    onClick={() => handleTileClick(tile.id, tile.link)}
                    variant={isDark ? "dark-ghost" : "ghost"}
                    size="sm"
                    className={`flex items-center text-sm font-medium ${
                      isDark ? 'text-blue-400' : 'text-[rgb(var(--scb-primary))]'
                    }`}
                  >
                    <span>Open</span>
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </EnhancedTouchButton>
                ) : (
                  tile.link ? (
                    <Link 
                      href={tile.link} 
                      className={`flex items-center text-sm font-medium ${
                        isDark ? 'text-blue-400 hover:text-blue-300' : 'text-[rgb(var(--scb-primary))]'
                      } ${preferences.enableAnimations ? 'transition-colors' : ''}`}
                      onClick={() => handleTileClick(tile.id, tile.link)}
                    >
                      <span>Open</span>
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Link>
                  ) : (
                    <button 
                      className={`flex items-center text-sm font-medium ${
                        isDark ? 'text-blue-400 hover:text-blue-300' : 'text-[rgb(var(--scb-primary))]'
                      } ${preferences.enableAnimations ? 'transition-colors' : ''}`}
                      onClick={() => handleTileClick(tile.id)}
                    >
                      <span>Open</span>
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </button>
                  )
                )}
              </div>
            ))
          }
        </div>
        
        {/* AI Insights Panel - only shown when AI data is available */}
        {showAiInsights && graphData.aiMetadata && (
          <div className={`mt-6 ${
            isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-[rgb(var(--scb-border))]'
          } rounded-lg shadow-sm border ${isMultiTasking && mode === 'slide-over' ? 'p-3' : 'p-4'} ${isAppleDevice ? 'shadow-sm' : ''}`}>
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center">
                <div className={`${
                  isDark ? 'bg-blue-900 bg-opacity-30' : 'bg-[rgba(var(--scb-accent),0.1)]'
                } p-2 rounded-full mr-3 flex-shrink-0`}>
                  <Sparkles className={`${isMultiTasking && mode === 'slide-over' ? 'w-4 h-4' : 'w-5 h-5'} text-[rgb(var(--scb-accent))]`} />
                </div>
                <h3 className={`${isMultiTasking && mode === 'slide-over' ? 'text-base' : 'text-lg'} font-medium ${
                  isDark ? 'text-white' : 'text-[rgb(var(--scb-primary))]'
                }`}>AI-Generated Insights</h3>
              </div>
              
              {/* Actions for iOS devices */}
              {isAppleDevice && (
                <div className="flex items-center gap-2">
                  <EnhancedTouchButton
                    onClick={handleShareClick}
                    variant={isDark ? "dark" : "secondary"}
                    size={isMultiTasking && mode === 'slide-over' ? 'xs' : 'sm'}
                    className="flex items-center gap-1"
                  >
                    <Share2 className={`${isMultiTasking && mode === 'slide-over' ? 'w-3 h-3' : 'w-4 h-4'}`} />
                    {!isMultiTasking && <span>Share</span>}
                  </EnhancedTouchButton>
                </div>
              )}
            </div>
            
            <p className={`${isMultiTasking && mode === 'slide-over' ? 'text-xs' : 'text-sm'} ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            } mb-4`}>{graphData.aiMetadata.insightSummary}</p>
            
            <div className={`grid grid-cols-1 ${isMultiTasking && mode === 'slide-over' ? 'gap-2' : isMultiTasking ? 'md:grid-cols-2 gap-3' : 'md:grid-cols-3 gap-4'}`}>
              <div 
                className={`${
                  isDark ? 'bg-gray-700' : 'bg-[rgba(var(--scb-light-bg),0.5)]'
                } p-3 rounded-md ${isAppleDevice ? 'cursor-pointer hover:opacity-95 active:opacity-90' : ''}`}
                onClick={() => {
                  if (isAppleDevice) {
                    haptics.light();
                    // In a real app, this would show details
                  }
                }}
              >
                <h4 className={`${isMultiTasking && mode === 'slide-over' ? 'text-xs' : 'text-sm'} font-medium ${
                  isDark ? 'text-white' : 'text-[rgb(var(--scb-primary))]'
                }`}>Key Focus Areas</h4>
                <ul className={`mt-2 space-y-1 ${isMultiTasking && mode === 'slide-over' ? 'text-[10px]' : 'text-sm'} ${
                  isDark ? 'text-gray-300' : ''
                }`}>
                  <li className="flex items-start gap-1">
                    <span className={`${isDark ? 'text-blue-400' : 'text-[rgb(var(--scb-accent))]'} mt-1`}>•</span>
                    <span>ESG Investments (High Confidence)</span>
                  </li>
                  <li className="flex items-start gap-1">
                    <span className={`${isDark ? 'text-blue-400' : 'text-[rgb(var(--scb-accent))]'} mt-1`}>•</span>
                    <span>Fintech Disruption</span>
                  </li>
                  <li className="flex items-start gap-1">
                    <span className={`${isDark ? 'text-blue-400' : 'text-[rgb(var(--scb-accent))]'} mt-1`}>•</span>
                    <span>Emerging Markets</span>
                  </li>
                </ul>
              </div>
              
              <div 
                className={`${
                  isDark ? 'bg-gray-700' : 'bg-[rgba(var(--scb-light-bg),0.5)]'
                } p-3 rounded-md ${isAppleDevice ? 'cursor-pointer hover:opacity-95 active:opacity-90' : ''}`}
                onClick={() => {
                  if (isAppleDevice) {
                    haptics.light();
                    // In a real app, this would show details
                  }
                }}
              >
                <h4 className={`${isMultiTasking && mode === 'slide-over' ? 'text-xs' : 'text-sm'} font-medium ${
                  isDark ? 'text-white' : 'text-[rgb(var(--scb-primary))]'
                }`}>Strategic Implications</h4>
                <ul className={`mt-2 space-y-1 ${isMultiTasking && mode === 'slide-over' ? 'text-[10px]' : 'text-sm'} ${
                  isDark ? 'text-gray-300' : ''
                }`}>
                  <li className="flex items-start gap-1">
                    <span className={`${isDark ? 'text-blue-400' : 'text-[rgb(var(--scb-accent))]'} mt-1`}>•</span>
                    <span>Strengthen digital banking to counter fintech disruption</span>
                  </li>
                  <li className="flex items-start gap-1">
                    <span className={`${isDark ? 'text-blue-400' : 'text-[rgb(var(--scb-accent))]'} mt-1`}>•</span>
                    <span>Develop comprehensive ESG investment offerings</span>
                  </li>
                </ul>
              </div>
              
              <div 
                className={`${
                  isDark ? 'bg-gray-700' : 'bg-[rgba(var(--scb-light-bg),0.5)]'
                } p-3 rounded-md ${isAppleDevice ? 'cursor-pointer hover:opacity-95 active:opacity-90' : ''} ${isMultiTasking && mode === 'slide-over' ? 'col-span-1' : ''}`}
                onClick={() => {
                  if (isAppleDevice) {
                    haptics.light();
                    // In a real app, this would show details
                  }
                }}
              >
                <h4 className={`${isMultiTasking && mode === 'slide-over' ? 'text-xs' : 'text-sm'} font-medium ${
                  isDark ? 'text-white' : 'text-[rgb(var(--scb-primary))]'
                }`}>Risk Assessment</h4>
                <ul className={`mt-2 space-y-1 ${isMultiTasking && mode === 'slide-over' ? 'text-[10px]' : 'text-sm'} ${
                  isDark ? 'text-gray-300' : ''
                }`}>
                  <li className="flex items-start gap-1">
                    <span className={`${isDark ? 'text-blue-400' : 'text-[rgb(var(--scb-accent))]'} mt-1`}>•</span>
                    <span>Market volatility in emerging markets</span>
                  </li>
                  <li className="flex items-start gap-1">
                    <span className={`${isDark ? 'text-blue-400' : 'text-[rgb(var(--scb-accent))]'} mt-1`}>•</span>
                    <span>Increased competition from fintech companies</span>
                  </li>
                </ul>
              </div>
            </div>
            
            <div className={`mt-4 flex flex-wrap items-center ${isMultiTasking && mode === 'slide-over' ? 'gap-2 text-[10px]' : 'gap-3 text-xs'} ${
              isDark ? 'text-gray-400' : 'text-gray-500'
            }`}>
              <div className="flex items-center gap-1">
                <Info className={`${isMultiTasking && mode === 'slide-over' ? 'w-3 h-3' : 'w-3.5 h-3.5'}`} />
                <span>Confidence Score: {(graphData.aiMetadata.confidenceScore * 100).toFixed(0)}%</span>
              </div>
              <div>
                Generated: {new Date(graphData.aiMetadata.generatedAt).toLocaleString()}
              </div>
              <div className="flex items-center gap-1">
                <span>Sources:</span>
                <div className="flex flex-wrap gap-1">
                  {graphData.aiMetadata.dataSource.map((source, idx) => (
                    <span 
                      key={idx} 
                      className={`${
                        isDark ? 'bg-blue-900 bg-opacity-40 text-blue-300' : 'horizon-chip horizon-chip-blue'
                      } ${isMultiTasking && mode === 'slide-over' ? 'text-[8px] py-0 px-1.5' : 'text-[10px] py-0.5 px-2'} rounded ${isAppleDevice ? 'cursor-pointer' : ''}`}
                      onClick={() => {
                        if (isAppleDevice) {
                          haptics.light();
                          // In a real app, this would show source details
                        }
                      }}
                    >
                      {source}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            
            {/* iOS-specific action button */}
            {isAppleDevice && (
              <div className={`mt-3 ${isMultiTasking && mode === 'slide-over' ? 'text-center' : 'text-right'}`}>
                <EnhancedTouchButton
                  onClick={() => {
                    if (isAppleDevice) {
                      haptics.medium();
                      alert('Viewing detailed AI analysis...');
                    }
                  }}
                  variant={isDark ? "dark" : "link"}
                  size={isMultiTasking && mode === 'slide-over' ? 'xs' : 'sm'}
                >
                  View Full Analysis
                </EnhancedTouchButton>
              </div>
            )}
          </div>
        )}
      
      {/* iOS Tab Bar Navigation */}
      {isAppleDevice && isPlatformDetected && (
        <EnhancedIOSTabBar
          items={tabItems}
          currentTab={activeTab}
          onChange={handleTabChange}
          respectSafeArea={true}
          hapticFeedback={true}
          blurred={true}
          showLabels={!isMultiTasking || mode !== 'slide-over'} // Hide labels in slide-over mode
          theme={isDark ? 'dark' : 'light'}
          floating={!isMultiTasking || mode !== 'slide-over'}
          compact={isMultiTasking}
          multiTaskingMode={mode}
        />
      )}
      
      {/* iOS-specific bottom safe area spacer for notched devices */}
      {isAppleDevice && (
        <div className="h-6 sm:h-4 md:h-2"></div>
      )}
    </div>
    </div>
  ) : (
    <div className={`${isMultiTasking && mode === 'slide-over' ? 'px-3 py-2' : 'px-6 py-4'} max-w-6xl mx-auto`}>
      {/* Original content for non-Apple devices - just a summary for brevity */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-[rgb(var(--scb-primary))]'}`}>
            Knowledge Dashboard
          </h1>
          <p className={`mt-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            Visualize and explore financial knowledge connections
          </p>
        </div>
      </div>
      
      {/* Rest of the non-Apple device content would go here */}
    </div>
  )}
  </IconSystemProvider>
</ScbBeautifulUI>
</React.Fragment>
);
};

export default KnowledgeDashboard;