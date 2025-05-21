import React, { useState, useEffect } from 'react';
import ModernLayout from '@/components/ModernLayout';
import { Sparkles, RefreshCw, Info, AlertTriangle, ChevronDown, ChevronUp, Sun, Moon } from 'lucide-react';
import Image from 'next/image';
import { EnhancedSankeyChart } from '@/components/charts';
import { initialSankeyData, forecastScenarioData } from '@/data/mockSankeyData';

export default function TestModernPage() {
  const [dataMode, setDataMode] = useState<'standard' | 'aiEnhanced'>('standard');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  
  // Simulate AI generation with a delay
  const generateAIEnhancedData = () => {
    if (dataMode === 'aiEnhanced') return;
    
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
  
  // Current data based on mode
  const currentData = dataMode === 'standard' ? initialSankeyData : forecastScenarioData;
  
  return (
    <ModernLayout>
      <div className="space-y-6">
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
        
        {/* Welcome Card */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-semibold text-gray-900">Enhanced Sankey Chart Demo</h1>
            
            <button 
              onClick={toggleTheme}
              className="fiori-btn fiori-btn-ghost p-2.5 rounded-full"
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
            >
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>
          </div>
          
          <p className="text-gray-600 mb-6">
            This page demonstrates the new EnhancedSankeyChart component with SCB Beautiful UI styling.
          </p>
          
          {/* Controls */}
          <div className="flex flex-wrap gap-3 mb-4">
            <button 
              onClick={() => setDataMode('standard')}
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
              onClick={() => setIsExpanded(!isExpanded)}
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
        
        {/* The EnhancedSankeyChart */}
        <div className={`transition-all duration-500 ease-in-out bg-white rounded-lg shadow-sm border border-gray-200 ${isExpanded ? 'h-[700px]' : 'h-[500px]'}`}>
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
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mt-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Key Component Enhancements</h2>
          
          <div className="space-y-3">
            <div className="flex items-start">
              <div className="w-3 h-3 bg-[rgb(var(--scb-american-green))] rounded-full mt-1.5 mr-3"></div>
              <div>
                <span className="text-gray-900 font-medium">Network-Aware Adaptivity</span>
                <p className="text-sm text-gray-600">Component automatically adjusts complexity based on network conditions and device capabilities</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="w-3 h-3 bg-[rgb(var(--scb-american-green))] rounded-full mt-1.5 mr-3"></div>
              <div>
                <span className="text-gray-900 font-medium">Dark Mode Support</span>
                <p className="text-sm text-gray-600">Full theming with appropriate colors for both light and dark modes</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="w-3 h-3 bg-[rgb(var(--scb-american-green))] rounded-full mt-1.5 mr-3"></div>
              <div>
                <span className="text-gray-900 font-medium">Accessibility</span>
                <p className="text-sm text-gray-600">ARIA attributes, keyboard navigation, and proper color contrast for all users</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="w-3 h-3 bg-[rgb(var(--scb-american-green))] rounded-full mt-1.5 mr-3"></div>
              <div>
                <span className="text-gray-900 font-medium">Intelligent Animations</span>
                <p className="text-sm text-gray-600">Animations adapt or disable based on network speed and device performance</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="w-3 h-3 bg-[rgb(var(--scb-american-green))] rounded-full mt-1.5 mr-3"></div>
              <div>
                <span className="text-gray-900 font-medium">SCB Beautiful UI Integration</span>
                <p className="text-sm text-gray-600">Consistent with all SCB design variables, Fiori Horizon patterns, and SCB Prosper Sans typography</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Demo Instructions */}
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-300">
          <h3 className="font-medium text-gray-900 mb-3">🚀 Try These Features:</h3>
          <ol className="space-y-2 text-sm text-gray-700 list-decimal list-inside">
            <li>Toggle between standard and AI-enhanced data</li>
            <li>Expand/collapse the chart height</li>
            <li>Switch between light and dark themes</li>
            <li>Hover over nodes and links for detailed information</li>
            <li>Click the AI insights button (sparkles) to view recommendations</li>
            <li>Toggle node labels on/off with the eye button</li>
            <li>Download the visualization as SVG</li>
          </ol>
        </div>
      </div>
    </ModernLayout>
  );
}