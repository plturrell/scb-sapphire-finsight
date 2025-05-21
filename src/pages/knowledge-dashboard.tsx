import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Sparkles, RefreshCw, Info, BarChart3, PieChart, HelpCircle, ChevronRight, Filter, GridIcon, Search, Settings } from 'lucide-react';
import EnhancedForceDirectedGraph from '@/components/EnhancedForceDirectedGraph';
import EnhancedSankeyChart from '@/components/charts/EnhancedSankeyChart';
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
  
  // Function to regenerate the graph with AI insights
  const regenerateWithAI = () => {
    setIsLoading(true);
    setTimeout(() => {
      setGraphData(generateKnowledgeGraphData(true));
      setShowAiInsights(true);
      setIsLoading(false);
    }, 1500);
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
    <div className="min-h-screen flex flex-col">
      {/* Light gray top header with SCB logo */}
      <header className="bg-[#f2f2f2] border-b border-[rgb(var(--scb-border))]">
        <div className="container mx-auto px-4 py-2 flex justify-between items-center">
          <div className="flex items-center">
            <Image
              src="/images/sc-logo.png"
              alt="Standard Chartered Bank"
              width={180}
              height={40}
              className="h-8 w-auto"
            />
            <div className="h-6 w-px bg-gray-300 mx-4"></div>
            <h1 className="text-xl font-medium text-[rgb(var(--scb-primary))]">Sapphire FinSight</h1>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Search..."
                className="fiori-input py-1.5 pl-8 pr-3 text-sm w-48"
              />
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
            
            <button className="fiori-btn-ghost rounded-full p-1.5">
              <Settings className="w-5 h-5 text-gray-600" />
            </button>
            
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[rgb(var(--scb-primary))] flex items-center justify-center">
                <span className="text-white text-sm font-medium">JS</span>
              </div>
            </div>
          </div>
        </div>
      </header>
      
      {/* Main content */}
      <main className="flex-1 bg-[rgba(var(--scb-light-bg),0.5)] p-6">
        <div className="container mx-auto">
          {/* Dashboard header */}
          <div className="mb-6">
            <h2 className="text-2xl font-medium text-[rgb(var(--scb-primary))]">Knowledge Dashboard</h2>
            <p className="text-gray-600 mt-1">Visualize and explore financial knowledge connections</p>
          </div>
          
          {/* Group filter badges */}
          <div className="mb-6 flex flex-wrap gap-2">
            {['All', 'Financial', 'Market', 'Economic', 'Regulatory', 'Risk', 'Technology', 'Client', 'Internal'].map(group => (
              <button
                key={group}
                onClick={() => setSelectedGroup(group === 'All' ? null : group)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  (group === 'All' && !selectedGroup) || selectedGroup === group
                    ? 'bg-[rgb(var(--scb-primary))] text-white'
                    : 'bg-white text-gray-700 border border-[rgb(var(--scb-border))] hover:bg-gray-50'
                }`}
              >
                {group}
              </button>
            ))}
          </div>
          
          {/* Fiori Launch Pad Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Main visualization - spans 2x2 */}
            <div className="col-span-full lg:col-span-2 lg:row-span-2 bg-white rounded-lg shadow-sm border border-[rgb(var(--scb-border))] p-5 h-[600px]">
              <div className="h-full">
                <EnhancedForceDirectedGraph
                  data={filteredData}
                  title="Knowledge Graph Explorer"
                  showControls={true}
                  showLegend={true}
                  onRegenerateClick={!showAiInsights ? regenerateWithAI : undefined}
                />
              </div>
            </div>
            
            {/* Other dashboard tiles */}
            {demoTiles.filter(tile => tile.id !== 'knowledge-graph').map(tile => (
              <div 
                key={tile.id}
                className={`bg-white rounded-lg shadow-sm border border-[rgb(var(--scb-border))] p-4 hover:shadow-md transition-shadow ${
                  tile.size === 'medium' ? 'lg:col-span-2' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    {tile.icon}
                    <h3 className="text-base font-medium ml-2 text-[rgb(var(--scb-dark-text))]">{tile.title}</h3>
                  </div>
                  {tile.badge && (
                    <span className="bg-[rgba(var(--scb-accent),0.1)] text-[rgb(var(--scb-accent))] text-xs px-2 py-0.5 rounded">
                      {tile.badge}
                    </span>
                  )}
                </div>
                
                <p className="text-sm text-gray-600 mb-4">{tile.description}</p>
                
                {tile.link ? (
                  <Link href={tile.link} className="flex items-center text-[rgb(var(--scb-primary))] text-sm font-medium">
                    <span>Open</span>
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Link>
                ) : (
                  <button className="flex items-center text-[rgb(var(--scb-primary))] text-sm font-medium">
                    <span>Open</span>
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </button>
                )}
              </div>
            ))}
          </div>
          
          {/* AI Insights Panel - only shown when AI data is available */}
          {showAiInsights && graphData.aiMetadata && (
            <div className="mt-6 bg-white rounded-lg shadow-sm border border-[rgb(var(--scb-border))] p-5">
              <div className="flex items-start gap-3">
                <div className="bg-[rgba(var(--scb-accent),0.1)] p-2 rounded-full">
                  <Sparkles className="w-5 h-5 text-[rgb(var(--scb-accent))]" />
                </div>
                
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-[rgb(var(--scb-primary))]">AI-Generated Insights</h3>
                  <p className="text-gray-700 mt-2">{graphData.aiMetadata.insightSummary}</p>
                  
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-[rgba(var(--scb-light-bg),0.5)] p-3 rounded-md">
                      <h4 className="text-sm font-medium text-[rgb(var(--scb-primary))]">Key Focus Areas</h4>
                      <ul className="mt-2 space-y-1 text-sm">
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
                    
                    <div className="bg-[rgba(var(--scb-light-bg),0.5)] p-3 rounded-md">
                      <h4 className="text-sm font-medium text-[rgb(var(--scb-primary))]">Strategic Implications</h4>
                      <ul className="mt-2 space-y-1 text-sm">
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
                    
                    <div className="bg-[rgba(var(--scb-light-bg),0.5)] p-3 rounded-md">
                      <h4 className="text-sm font-medium text-[rgb(var(--scb-primary))]">Risk Assessment</h4>
                      <ul className="mt-2 space-y-1 text-sm">
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
                  
                  <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Info className="w-3.5 h-3.5" />
                      <span>Confidence Score: {(graphData.aiMetadata.confidenceScore * 100).toFixed(0)}%</span>
                    </div>
                    <div>
                      Generated: {new Date(graphData.aiMetadata.generatedAt).toLocaleString()}
                    </div>
                    <div className="flex items-center gap-1">
                      <span>Sources:</span>
                      <div className="flex flex-wrap gap-1">
                        {graphData.aiMetadata.dataSource.map((source, idx) => (
                          <span key={idx} className="scb-chip scb-chip-blue text-[10px] py-0.5 px-2">
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
      </main>
      
      {/* Footer */}
      <footer className="bg-[rgb(var(--scb-primary))] text-white py-4">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <p className="text-sm opacity-90">© {new Date().getFullYear()} Standard Chartered Bank. All rights reserved.</p>
            </div>
            <div className="flex gap-6">
              <a href="#" className="text-sm opacity-90 hover:opacity-100">Privacy Policy</a>
              <a href="#" className="text-sm opacity-90 hover:opacity-100">Terms of Use</a>
              <a href="#" className="text-sm opacity-90 hover:opacity-100">Help & Support</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default KnowledgeDashboard;
