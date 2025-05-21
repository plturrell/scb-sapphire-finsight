import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import ScbBeautifulUI from '@/components/ScbBeautifulUI';
import EnhancedForceDirectedGraph from '@/components/EnhancedForceDirectedGraph';
import EnhancedTouchButton from '@/components/EnhancedTouchButton';
import EnhancedLoadingSpinner from '@/components/EnhancedLoadingSpinner';
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
  
  const isSmallScreen = useMediaQuery({ maxWidth: 768 });
  const { mode, isMultiTasking, orientation } = useMultiTasking();
  const { isDarkMode, preferences } = useUIPreferences();
  
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
    <ScbBeautifulUI 
      showNewsBar={!isSmallScreen && !isMultiTasking} 
      pageTitle="Knowledge Dashboard" 
      showTabs={isAppleDevice}
    >
      <div className={`${isMultiTasking && mode === 'slide-over' ? 'px-3 py-2' : 'px-6 py-4'} max-w-6xl mx-auto`}>
        {/* Dashboard header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className={`text-2xl font-semibold ${
              isDarkMode ? 'text-white' : 'text-[rgb(var(--scb-primary))]'
            }`}>Knowledge Dashboard</h1>
            <p className={`mt-1 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>Visualize and explore financial knowledge connections</p>
          </div>
          
          {/* Platform-specific action buttons for Apple devices */}
          {isAppleDevice && (
            <div className={`flex ${isMultiTasking && mode === 'slide-over' ? 'gap-2' : 'gap-3'}`}>
              <EnhancedTouchButton
                onClick={handleDownloadClick}
                variant={isDarkMode ? "dark" : "secondary"}
                className="flex items-center gap-1"
                size={isMultiTasking && mode === 'slide-over' ? 'sm' : 'default'}
              >
                <Download className={`${isMultiTasking && mode === 'slide-over' ? 'w-3 h-3' : 'w-4 h-4'}`} />
                <span>Download</span>
              </EnhancedTouchButton>
              
              <EnhancedTouchButton
                onClick={handleShareClick}
                variant={isDarkMode ? "dark" : "secondary"}
                className="flex items-center gap-1"
                size={isMultiTasking && mode === 'slide-over' ? 'sm' : 'default'}
              >
                <Share2 className={`${isMultiTasking && mode === 'slide-over' ? 'w-3 h-3' : 'w-4 h-4'}`} />
                <span>Share</span>
              </EnhancedTouchButton>
            </div>
          )}
        </div>
        
        {/* Group filter badges */}
        <div className={`mb-6 flex flex-wrap ${isMultiTasking && mode === 'slide-over' ? 'gap-1.5' : 'gap-2'}`}>
          {['All', 'Financial', 'Market', 'Economic', 'Regulatory', 'Risk', 'Technology', 'Client', 'Internal'].map(group => (
            isAppleDevice ? (
              <EnhancedTouchButton
                key={group}
                onClick={() => handleGroupSelect(group === 'All' ? null : group)}
                variant={(group === 'All' && !selectedGroup) || selectedGroup === group ? 'primary' : 'secondary'}
                size={isMultiTasking && mode === 'slide-over' ? 'xs' : 'sm'}
                className={`rounded-full ${isMultiTasking && mode === 'slide-over' ? 'text-xs py-1 px-2' : ''}`}
              >
                {group}
              </EnhancedTouchButton>
            ) : (
              <button
                key={group}
                onClick={() => handleGroupSelect(group === 'All' ? null : group)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  (group === 'All' && !selectedGroup) || selectedGroup === group
                    ? 'bg-[rgb(var(--scb-primary))] text-white'
                    : isDarkMode 
                      ? 'bg-gray-700 text-gray-300 border border-gray-600 hover:bg-gray-600'
                      : 'bg-white text-gray-700 border border-[rgb(var(--scb-border))] hover:bg-gray-50'
                }`}
              >
                {group}
              </button>
            )
          ))}
        </div>
        
        {/* Fiori Launch Pad Grid */}
        <div className={`grid grid-cols-1 ${isMultiTasking && mode === 'slide-over' ? 'gap-3' : 'md:grid-cols-2 lg:grid-cols-4 gap-5'}`}>
          {/* Main visualization - spans 2x2 */}
          <div className={`${isMultiTasking ? 'col-span-1' : 'col-span-full lg:col-span-2 lg:row-span-2'} 
            ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-[rgb(var(--scb-border))]'} 
            rounded-lg shadow-sm border p-5 
            ${isMultiTasking ? (mode === 'slide-over' ? 'h-[400px]' : 'h-[500px]') : 'h-[600px]'}`}>
            <div className="h-full">
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
                />
              )}
            </div>
          </div>
          
          {/* Other dashboard tiles */}
          {(!isMultiTasking || mode !== 'slide-over' || !isAppleDevice) && 
            demoTiles.filter(tile => tile.id !== 'knowledge-graph').map(tile => (
              <div 
                key={tile.id}
                className={`${
                  isDarkMode ? 'bg-gray-800 border-gray-700 hover:shadow-lg' : 'bg-white border-[rgb(var(--scb-border))] hover:shadow-md'
                } rounded-lg shadow-sm border p-4 ${preferences.enableAnimations ? 'transition-shadow' : ''} ${
                  tile.size === 'medium' && !isMultiTasking ? 'lg:col-span-2' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    {tile.icon}
                    <h3 className={`text-base font-medium ml-2 ${
                      isDarkMode ? 'text-white' : 'text-[rgb(var(--scb-dark-text))]'
                    }`}>{tile.title}</h3>
                  </div>
                  {tile.badge && (
                    <span className={`${
                      isDarkMode ? 'bg-opacity-20 bg-blue-500' : 'bg-[rgba(var(--scb-accent),0.1)]'
                    } text-[rgb(var(--scb-accent))] text-xs px-2 py-0.5 rounded`}>
                      {tile.badge}
                    </span>
                  )}
                </div>
                
                <p className={`text-sm mb-4 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>{tile.description}</p>
                
                {isAppleDevice ? (
                  <EnhancedTouchButton
                    onClick={() => handleTileClick(tile.id, tile.link)}
                    variant={isDarkMode ? "dark-ghost" : "ghost"}
                    size="sm"
                    className={`flex items-center text-sm font-medium ${
                      isDarkMode ? 'text-blue-400' : 'text-[rgb(var(--scb-primary))]'
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
                        isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-[rgb(var(--scb-primary))]'
                      } ${preferences.enableAnimations ? 'transition-colors' : ''}`}
                      onClick={() => handleTileClick(tile.id, tile.link)}
                    >
                      <span>Open</span>
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Link>
                  ) : (
                    <button 
                      className={`flex items-center text-sm font-medium ${
                        isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-[rgb(var(--scb-primary))]'
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
            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-[rgb(var(--scb-border))]'
          } rounded-lg shadow-sm border ${isMultiTasking && mode === 'slide-over' ? 'p-3' : 'p-5'}`}>
            <div className="flex items-start gap-3">
              <div className={`${
                isDarkMode ? 'bg-blue-900 bg-opacity-30' : 'bg-[rgba(var(--scb-accent),0.1)]'
              } p-2 rounded-full flex-shrink-0`}>
                <Sparkles className={`${isMultiTasking && mode === 'slide-over' ? 'w-4 h-4' : 'w-5 h-5'} text-[rgb(var(--scb-accent))]`} />
              </div>
              
              <div className="flex-1">
                <h3 className={`${isMultiTasking && mode === 'slide-over' ? 'text-base' : 'text-lg'} font-medium ${
                  isDarkMode ? 'text-white' : 'text-[rgb(var(--scb-primary))]'
                }`}>AI-Generated Insights</h3>
                <p className={`${isMultiTasking && mode === 'slide-over' ? 'text-xs' : 'text-sm'} ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                } mt-2`}>{graphData.aiMetadata.insightSummary}</p>
                
                <div className={`mt-4 grid grid-cols-1 ${isMultiTasking && mode === 'slide-over' ? 'gap-2' : 'md:grid-cols-3 gap-4'}`}>
                  <div className={`${
                    isDarkMode ? 'bg-gray-700' : 'bg-[rgba(var(--scb-light-bg),0.5)]'
                  } p-3 rounded-md`}>
                    <h4 className={`${isMultiTasking && mode === 'slide-over' ? 'text-xs' : 'text-sm'} font-medium ${
                      isDarkMode ? 'text-white' : 'text-[rgb(var(--scb-primary))]'
                    }`}>Key Focus Areas</h4>
                    <ul className={`mt-2 space-y-1 ${isMultiTasking && mode === 'slide-over' ? 'text-[10px]' : 'text-sm'} ${
                      isDarkMode ? 'text-gray-300' : ''
                    }`}>
                      <li className="flex items-start gap-1">
                        <span className="text-[rgb(var(--scb-accent))] mt-1">•</span>
                        <span>ESG Investments (High Confidence)</span>
                      </li>
                      <li className="flex items-start gap-1">
                        <span className="text-[rgb(var(--scb-accent))] mt-1">•</span>
                        <span>Fintech Disruption</span>
                      </li>
                      <li className="flex items-start gap-1">
                        <span className="text-[rgb(var(--scb-accent))] mt-1">•</span>
                        <span>Emerging Markets</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div className={`${
                    isDarkMode ? 'bg-gray-700' : 'bg-[rgba(var(--scb-light-bg),0.5)]'
                  } p-3 rounded-md`}>
                    <h4 className={`${isMultiTasking && mode === 'slide-over' ? 'text-xs' : 'text-sm'} font-medium ${
                      isDarkMode ? 'text-white' : 'text-[rgb(var(--scb-primary))]'
                    }`}>Strategic Implications</h4>
                    <ul className={`mt-2 space-y-1 ${isMultiTasking && mode === 'slide-over' ? 'text-[10px]' : 'text-sm'} ${
                      isDarkMode ? 'text-gray-300' : ''
                    }`}>
                      <li className="flex items-start gap-1">
                        <span className="text-[rgb(var(--scb-accent))] mt-1">•</span>
                        <span>Strengthen digital banking to counter fintech disruption</span>
                      </li>
                      <li className="flex items-start gap-1">
                        <span className="text-[rgb(var(--scb-accent))] mt-1">•</span>
                        <span>Develop comprehensive ESG investment offerings</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div className={`${
                    isDarkMode ? 'bg-gray-700' : 'bg-[rgba(var(--scb-light-bg),0.5)]'
                  } p-3 rounded-md`}>
                    <h4 className={`${isMultiTasking && mode === 'slide-over' ? 'text-xs' : 'text-sm'} font-medium ${
                      isDarkMode ? 'text-white' : 'text-[rgb(var(--scb-primary))]'
                    }`}>Risk Assessment</h4>
                    <ul className={`mt-2 space-y-1 ${isMultiTasking && mode === 'slide-over' ? 'text-[10px]' : 'text-sm'} ${
                      isDarkMode ? 'text-gray-300' : ''
                    }`}>
                      <li className="flex items-start gap-1">
                        <span className="text-[rgb(var(--scb-accent))] mt-1">•</span>
                        <span>Market volatility in emerging markets</span>
                      </li>
                      <li className="flex items-start gap-1">
                        <span className="text-[rgb(var(--scb-accent))] mt-1">•</span>
                        <span>Increased competition from fintech companies</span>
                      </li>
                    </ul>
                  </div>
                </div>
                
                <div className={`mt-4 flex flex-wrap items-center ${isMultiTasking && mode === 'slide-over' ? 'gap-2 text-[10px]' : 'gap-3 text-xs'} ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
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
                        <span key={idx} className={`${
                          isDarkMode ? 'bg-blue-900 bg-opacity-40 text-blue-300' : 'horizon-chip horizon-chip-blue'
                        } ${isMultiTasking && mode === 'slide-over' ? 'text-[8px] py-0 px-1.5' : 'text-[10px] py-0.5 px-2'} rounded`}>
                          {source}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ScbBeautifulUI>
  );
};

export default KnowledgeDashboard;