import React, { useState, useEffect, useRef } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import ScbBeautifulUI from '@/components/ScbBeautifulUI';
import SemanticTariffVisualizer from '../components/SemanticTariffVisualizer';
import semanticTariffEngine from '../services/SemanticTariffEngine';
import { useUIPreferences } from '@/context/UIPreferencesContext';
import { useIOS, useMediaQuery } from '../hooks/useResponsive';
import { useDeviceCapabilities } from '../hooks/useDeviceCapabilities';
import { useMicroInteractions } from '../hooks/useMicroInteractions';
import EnhancedTouchButton from '../components/EnhancedTouchButton';
import { HelpCircle, RefreshCw, Cpu, Database, Network, Search, BarChart2, FileText, PenTool, Download, Share2, Bell } from 'lucide-react';
import { useSFSymbolsSupport } from '@/lib/sf-symbols';
import SFSymbol from '@/components/SFSymbol';

/**
 * Semantic Tariff Engine Page
 * 
 * This page showcases the integration of Perplexity AI with Apache Jena through LangChain
 * for semantic tariff data processing and visualization.
 */
const SemanticTariffEnginePage: NextPage = () => {
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [isInitializing, setIsInitializing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('explorer');
  
  // Platform detection and UI enhancement hooks
  const isAppleDevice = useIOS();
  const [isPlatformDetected, setIsPlatformDetected] = useState(false);
  const { haptic } = useMicroInteractions();
  const { touchCapable } = useDeviceCapabilities();
  const { isDarkMode } = useUIPreferences();
  const { supported: sfSymbolsSupported } = useSFSymbolsSupport();
  
  // Reference for scrolling to sections
  const tabsRef = useRef<HTMLDivElement>(null);
  
  // Tariff engine categories with SF Symbols icons
  const tariffEngineCategories = [
    { id: 'explorer', label: 'Tariff Explorer', icon: 'magnifyingglass.circle.fill', badge: null },
    { id: 'architecture', label: 'Architecture', icon: 'square.stack.3d.up.fill', badge: null },
    { id: 'documentation', label: 'Documentation', icon: 'doc.text.fill', badge: null }
  ];
  
  // Multi-tasking mode detection for iPad
  const [isMultiTasking, setIsMultiTasking] = useState(false);
  const [mode, setMode] = useState<'full' | 'split-view' | 'slide-over'>('full');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('landscape');
  
  // Detect multi-tasking mode on iPad
  useEffect(() => {
    const checkMultiTaskingMode = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      // Set orientation
      setOrientation(width > height ? 'landscape' : 'portrait');
      
      // Typical iPad sizes in various modes (approximate)
      if (isAppleDevice) {
        // Detect if we're in multi-tasking mode
        if (width < 768 && width > 320) {
          setIsMultiTasking(true);
          setMode(width < 400 ? 'slide-over' : 'split-view');
        } else {
          setIsMultiTasking(false);
          setMode('full');
        }
      } else {
        setIsMultiTasking(false);
        setMode('full');
      }
    };
    
    // Run once immediately
    setIsPlatformDetected(true);
    checkMultiTaskingMode();
    
    // Add event listeners for changes
    window.addEventListener('resize', checkMultiTaskingMode);
    window.addEventListener('orientationchange', checkMultiTaskingMode);
    
    return () => {
      window.removeEventListener('resize', checkMultiTaskingMode);
      window.removeEventListener('orientationchange', checkMultiTaskingMode);
    };
  }, [isAppleDevice]);
  
  // Initialize the semantic tariff engine
  useEffect(() => {
    const initEngine = async () => {
      setIsInitializing(true);
      try {
        const success = await semanticTariffEngine.initialize();
        setIsInitialized(success);
      } catch (err) {
        console.error('Failed to initialize semantic tariff engine:', err);
        setError('Failed to initialize the semantic tariff engine. Please try again later.');
      } finally {
        setIsInitializing(false);
      }
    };
    
    initEngine();
  }, []);
  
  const handleTabChange = (tab: string) => {
    // Provide haptic feedback on Apple devices
    if (isAppleDevice) {
      haptic({ intensity: 'light' });
    }
    setActiveTab(tab);
    
    // Scroll to the tab section if needed
    if (tabsRef.current) {
      tabsRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };
  
  // SF Symbols Tariff Navigation Component
  const SFSymbolsTariffNavigation = () => {
    return (
      <div className="mb-6 -mx-4 px-4 overflow-x-auto">
        <div className={`flex space-x-3 py-2 ${isMultiTasking && mode === 'slide-over' ? 'min-w-max' : ''}`}>
          {tariffEngineCategories.map((category) => (
            <div 
              key={category.id}
              onClick={() => handleTabChange(category.id)}
              className={`flex flex-col items-center p-2 rounded-xl cursor-pointer transition-colors ${
                activeTab === category.id
                ? 'bg-[rgba(var(--scb-honolulu-blue),0.1)] dark:bg-[rgba(var(--scb-dark-blue),0.2)]'
                : 'hover:bg-[rgba(var(--scb-light-gray),0.3)] dark:hover:bg-[rgba(var(--scb-dark-gray),0.2)]'
              }`}
              style={{ minWidth: isMultiTasking && mode === 'slide-over' ? '64px' : '80px' }}
            >
              <div className={`relative flex items-center justify-center ${
                isMultiTasking && mode === 'slide-over' ? 'w-10 h-10' : 'w-12 h-12'
              } rounded-full mb-1 ${
                activeTab === category.id
                ? 'bg-[rgb(var(--scb-honolulu-blue))] text-white'
                : 'bg-[rgba(var(--scb-light-gray),0.3)] dark:bg-[rgba(var(--scb-dark-gray),0.3)] text-[rgb(var(--scb-dark-gray))]'
              }`}>
                <SFSymbol 
                  name={category.icon} 
                  size={isMultiTasking && mode === 'slide-over' ? 20 : 24}
                  color={activeTab === category.id ? 'white' : undefined}
                />
                
                {/* Badge indicator */}
                {category.badge && (
                  <div className="absolute -top-1 -right-1 min-w-5 h-5 flex items-center justify-center rounded-full bg-[rgb(var(--scb-notification))] text-white text-xs px-1">
                    {category.badge}
                  </div>
                )}
              </div>
              <span className={`text-center ${isMultiTasking && mode === 'slide-over' ? 'text-xs' : 'text-sm'} ${
                activeTab === category.id
                ? 'text-[rgb(var(--scb-honolulu-blue))] font-medium'
                : 'text-[rgb(var(--scb-dark-gray))]'
              }`}>
                {category.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  const handleReload = () => {
    // Provide haptic feedback on Apple devices
    if (isAppleDevice) {
      haptic({ intensity: 'medium' });
    }
    window.location.reload();
  };
  
  const handleShareClick = () => {
    // Provide haptic feedback on Apple devices
    if (isAppleDevice) {
      haptic({ intensity: 'medium' });
    }
    
    // Implement share functionality (e.g., open share sheet on iOS)
    alert('Sharing semantic tariff data...');
  };
  
  const handleExportClick = () => {
    // Provide haptic feedback on Apple devices
    if (isAppleDevice) {
      haptic({ intensity: 'medium' });
    }
    
    // Implement export functionality
    alert('Exporting semantic tariff data...');
  };

  return (
    <>
      <Head>
        <title>Semantic Tariff Engine | SCB Sapphire FinSight</title>
        <meta name="description" content="Semantic tariff data processing and visualization powered by Perplexity AI and Apache Jena" />
      </Head>
      
      <ScbBeautifulUI 
        showNewsBar={!isMultiTasking} 
        pageTitle="Semantic Tariff Engine" 
        showTabs={isAppleDevice}
      >
        <div className={`space-y-6 ${isMultiTasking && mode === 'slide-over' ? 'px-2' : ''}`}>
          {/* Hero Section */}
          <div className={`bg-[rgba(var(--scb-light-blue),0.2)] dark:bg-[rgba(var(--scb-dark-blue),0.2)] rounded-lg ${isMultiTasking && mode === 'slide-over' ? 'p-3' : 'p-6'}`}>
            <div className="flex flex-col items-center text-center">
              <div className="flex items-center gap-3 mb-4">
                <Cpu className="text-[rgb(var(--scb-honolulu-blue))]" size={isMultiTasking && mode === 'slide-over' ? 20 : 28} />
                <Network className="text-[rgb(var(--scb-american-green))]" size={isMultiTasking && mode === 'slide-over' ? 20 : 28} />
                <Database className="text-[rgb(var(--scb-purple))]" size={isMultiTasking && mode === 'slide-over' ? 20 : 28} />
              </div>
              <h1 className={`${isMultiTasking && mode === 'slide-over' ? 'text-xl' : 'text-3xl'} font-semibold text-[rgb(var(--scb-primary))] mb-4`}>
                Semantic Tariff Engine
              </h1>
              <p className={`${isMultiTasking && mode === 'slide-over' ? 'text-xs' : 'text-sm'} text-[rgb(var(--scb-dark-gray))] max-w-2xl mb-6`}>
                Integrating Perplexity AI's real-time search with Apache Jena's semantic reasoning 
                through LangChain as an integration layer to create a powerful tariff data system.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                <span className={`${isMultiTasking && mode === 'slide-over' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1'} bg-[rgba(var(--scb-honolulu-blue),0.2)] text-[rgb(var(--scb-honolulu-blue))] rounded-full`}>
                  Perplexity AI
                </span>
                <span className={`${isMultiTasking && mode === 'slide-over' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1'} bg-[rgba(var(--scb-american-green),0.2)] text-[rgb(var(--scb-american-green))] rounded-full`}>
                  Apache Jena
                </span>
                <span className={`${isMultiTasking && mode === 'slide-over' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1'} bg-[rgba(var(--scb-purple),0.2)] text-[rgb(var(--scb-purple))] rounded-full`}>
                  LangChain
                </span>
              </div>
            </div>
          </div>
          
          {/* Platform-specific action buttons */}
          {isAppleDevice && isPlatformDetected && (
            <div className="flex justify-end">
              <div className={`flex items-center ${isMultiTasking && mode === 'slide-over' ? 'gap-2' : 'gap-3'}`}>
                <EnhancedTouchButton
                  onClick={handleShareClick}
                  variant="secondary"
                  className="flex items-center gap-1"
                  size={isMultiTasking && mode === 'slide-over' ? 'xs' : 'sm'}
                >
                  <Share2 className={`${isMultiTasking && mode === 'slide-over' ? 'w-3 h-3' : 'w-4 h-4'}`} />
                  <span>Share</span>
                </EnhancedTouchButton>
                
                <EnhancedTouchButton
                  onClick={handleExportClick}
                  variant="secondary"
                  className="flex items-center gap-1"
                  size={isMultiTasking && mode === 'slide-over' ? 'xs' : 'sm'}
                >
                  <Download className={`${isMultiTasking && mode === 'slide-over' ? 'w-3 h-3' : 'w-4 h-4'}`} />
                  <span>Export</span>
                </EnhancedTouchButton>
              </div>
            </div>
          )}
          
          {/* Error Alert */}
          {error && (
            <div className="bg-[rgba(var(--destructive),0.1)] text-[rgb(var(--destructive))] px-4 py-3 rounded-md flex items-center">
              <HelpCircle className="mr-2" size={16} />
              <span>{error}</span>
            </div>
          )}
          
          {/* SF Symbols Navigation (for Apple devices) */}
          {isAppleDevice && isPlatformDetected && sfSymbolsSupported && (
            <SFSymbolsTariffNavigation />
          )}
          
          {/* Traditional Tabs - Only shown when SF Symbols navigation is not available */}
          {(!isAppleDevice || !isPlatformDetected || !sfSymbolsSupported) && (
            <div className={`border-b border-[rgb(var(--scb-border))]`} ref={tabsRef}>
              <div className="flex space-x-6">
                <button
                  className={`${isMultiTasking && mode === 'slide-over' ? 'text-xs py-2' : 'text-sm py-3'} pb-2 px-1 font-medium border-b-2 transition-colors ${
                    activeTab === 'explorer' 
                      ? 'border-[rgb(var(--scb-honolulu-blue))] text-[rgb(var(--scb-honolulu-blue))]' 
                      : 'border-transparent text-[rgb(var(--scb-dark-gray))] hover:text-[rgb(var(--scb-primary))]'
                  }`}
                  onClick={() => handleTabChange('explorer')}
                >
                  Tariff Explorer
                </button>
                <button
                  className={`${isMultiTasking && mode === 'slide-over' ? 'text-xs py-2' : 'text-sm py-3'} pb-2 px-1 font-medium border-b-2 transition-colors ${
                    activeTab === 'architecture' 
                      ? 'border-[rgb(var(--scb-honolulu-blue))] text-[rgb(var(--scb-honolulu-blue))]' 
                      : 'border-transparent text-[rgb(var(--scb-dark-gray))] hover:text-[rgb(var(--scb-primary))]'
                  }`}
                  onClick={() => handleTabChange('architecture')}
                >
                  Architecture
                </button>
                <button
                  className={`${isMultiTasking && mode === 'slide-over' ? 'text-xs py-2' : 'text-sm py-3'} pb-2 px-1 font-medium border-b-2 transition-colors ${
                    activeTab === 'documentation' 
                      ? 'border-[rgb(var(--scb-honolulu-blue))] text-[rgb(var(--scb-honolulu-blue))]' 
                      : 'border-transparent text-[rgb(var(--scb-dark-gray))] hover:text-[rgb(var(--scb-primary))]'
                  }`}
                  onClick={() => handleTabChange('documentation')}
                >
                  Documentation
                </button>
              </div>
            </div>
          )}
          
          {/* Tab content reference */}
          <div ref={tabsRef}></div>
          
          {/* Tab Panels */}
          <div className="mt-6">
            {/* Tariff Explorer Tab */}
            {activeTab === 'explorer' && (
              <>
                {isInitialized ? (
                  <SemanticTariffVisualizer 
                    isMultiTasking={isMultiTasking}
                    multiTaskingMode={mode}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 border border-[rgb(var(--scb-border))] rounded-lg">
                    <Search className="text-[rgb(var(--scb-dark-gray))] opacity-40 mb-4" size={isMultiTasking && mode === 'slide-over' ? 30 : 40} />
                    <h3 className={`font-medium text-[rgb(var(--scb-dark-gray))] ${isMultiTasking && mode === 'slide-over' ? 'text-sm' : 'text-lg'} mb-2`}>
                      {isInitializing ? 'Initializing Semantic Tariff Engine...' : 'Semantic Tariff Engine Not Initialized'}
                    </h3>
                    <p className={`text-[rgb(var(--scb-dark-gray))] opacity-70 text-center max-w-md mb-6 ${isMultiTasking && mode === 'slide-over' ? 'text-xs px-4' : 'text-sm px-6'}`}>
                      {isInitializing 
                        ? 'This may take a few moments. Please wait while we connect to the semantic services.'
                        : 'The semantic tariff engine failed to initialize. Please try reloading the page.'}
                    </p>
                    {!isInitializing && (
                      isAppleDevice && isPlatformDetected ? (
                        <EnhancedTouchButton
                          onClick={handleReload}
                          variant="primary"
                          size={isMultiTasking && mode === 'slide-over' ? 'xs' : 'sm'}
                        >
                          <RefreshCw className="mr-2" size={isMultiTasking && mode === 'slide-over' ? 12 : 16} />
                          Reload Page
                        </EnhancedTouchButton>
                      ) : (
                        <button 
                          className="bg-[rgb(var(--scb-honolulu-blue))] text-white font-medium px-4 py-2 rounded-md hover:bg-[rgba(var(--scb-honolulu-blue),0.9)] transition-colors"
                          onClick={handleReload}
                        >
                          <RefreshCw className="inline-block mr-2" size={16} />
                          Reload Page
                        </button>
                      )
                    )}
                  </div>
                )}
              </>
            )}
            
            {/* Architecture Tab */}
            {activeTab === 'architecture' && (
              <div className="bg-white dark:bg-[rgb(var(--scb-dark-background))] rounded-lg shadow-sm border border-[rgb(var(--scb-border))] p-6">
                <h2 className={`font-semibold text-[rgb(var(--scb-dark-gray))] ${isMultiTasking && mode === 'slide-over' ? 'text-lg' : 'text-xl'} mb-4`}>
                  System Architecture
                </h2>
                
                <p className={`text-[rgb(var(--scb-dark-gray))] ${isMultiTasking && mode === 'slide-over' ? 'text-xs' : 'text-sm'} mb-6`}>
                  The semantic tariff engine integrates three powerful technologies to create a comprehensive
                  system for tariff data processing and analysis:
                </p>
                
                <div className={`grid ${isMultiTasking ? 'grid-cols-1 gap-3' : 'md:grid-cols-3 gap-6'} mt-6 mb-8`}>
                  {/* Perplexity AI */}
                  <div className="bg-[rgba(var(--scb-light-blue),0.2)] dark:bg-[rgba(var(--scb-dark-blue),0.3)] p-5 rounded-lg border border-[rgb(var(--scb-border))]">
                    <div className="flex justify-center mb-4">
                      <Cpu className="text-[rgb(var(--scb-honolulu-blue))]" size={isMultiTasking && mode === 'slide-over' ? 32 : 40} />
                    </div>
                    <h3 className={`font-medium text-center ${isMultiTasking && mode === 'slide-over' ? 'text-sm' : 'text-base'} mb-3`}>
                      Perplexity AI
                    </h3>
                    <div className="border-t border-[rgb(var(--scb-border))] my-3"></div>
                    <ul className={`space-y-2 ${isMultiTasking && mode === 'slide-over' ? 'text-xs' : 'text-sm'} text-[rgb(var(--scb-dark-gray))]`}>
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>Real-time tariff information search</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>Up-to-date policy research</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>Impact analysis with reasoning</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>Data extraction from unstructured text</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>Support for structured JSON outputs</span>
                      </li>
                    </ul>
                  </div>
                  
                  {/* LangChain */}
                  <div className="bg-[rgba(var(--scb-light-green),0.2)] dark:bg-[rgba(var(--scb-dark-green),0.3)] p-5 rounded-lg border border-[rgb(var(--scb-border))]">
                    <div className="flex justify-center mb-4">
                      <Network className="text-[rgb(var(--scb-american-green))]" size={isMultiTasking && mode === 'slide-over' ? 32 : 40} />
                    </div>
                    <h3 className={`font-medium text-center ${isMultiTasking && mode === 'slide-over' ? 'text-sm' : 'text-base'} mb-3`}>
                      LangChain
                    </h3>
                    <div className="border-t border-[rgb(var(--scb-border))] my-3"></div>
                    <ul className={`space-y-2 ${isMultiTasking && mode === 'slide-over' ? 'text-xs' : 'text-sm'} text-[rgb(var(--scb-dark-gray))]`}>
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>Integration middleware</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>Data transformation pipeline</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>Output parsing to RDF</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>Template-based prompting</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>Error handling and retries</span>
                      </li>
                    </ul>
                  </div>
                  
                  {/* Apache Jena */}
                  <div className="bg-[rgba(var(--scb-light-purple),0.2)] dark:bg-[rgba(var(--scb-dark-purple),0.3)] p-5 rounded-lg border border-[rgb(var(--scb-border))]">
                    <div className="flex justify-center mb-4">
                      <Database className="text-[rgb(var(--scb-purple))]" size={isMultiTasking && mode === 'slide-over' ? 32 : 40} />
                    </div>
                    <h3 className={`font-medium text-center ${isMultiTasking && mode === 'slide-over' ? 'text-sm' : 'text-base'} mb-3`}>
                      Apache Jena
                    </h3>
                    <div className="border-t border-[rgb(var(--scb-border))] my-3"></div>
                    <ul className={`space-y-2 ${isMultiTasking && mode === 'slide-over' ? 'text-xs' : 'text-sm'} text-[rgb(var(--scb-dark-gray))]`}>
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>Semantic data storage</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>RDF triple representation</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>SPARQL query capabilities</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>Ontology-based reasoning</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>Data validation with SHACL</span>
                      </li>
                    </ul>
                  </div>
                </div>
                
                <div className="mt-8">
                  <h3 className={`font-medium text-[rgb(var(--scb-dark-gray))] ${isMultiTasking && mode === 'slide-over' ? 'text-sm' : 'text-lg'} mb-4`}>
                    Data Flow Architecture
                  </h3>
                  
                  <p className={`text-[rgb(var(--scb-dark-gray))] ${isMultiTasking && mode === 'slide-over' ? 'text-xs' : 'text-sm'} mb-4`}>
                    The data flows through a pipeline from Perplexity's search results, through LangChain's
                    structured output parsing, into Jena's RDF store where it becomes available for semantic
                    querying and reasoning.
                  </p>
                  
                  <div className="border border-[rgb(var(--scb-border))] rounded-lg p-5 mt-4">
                    <div className="space-y-5">
                      <div>
                        <div className="flex items-center mb-2">
                          <Search className="text-[rgb(var(--scb-honolulu-blue))] mr-3" size={isMultiTasking && mode === 'slide-over' ? 16 : 20} />
                          <span className={`font-medium text-[rgb(var(--scb-dark-gray))] ${isMultiTasking && mode === 'slide-over' ? 'text-xs' : 'text-sm'}`}>
                            1. Data Acquisition
                          </span>
                        </div>
                        <p className={`ml-8 text-[rgb(var(--scb-dark-gray))] ${isMultiTasking && mode === 'slide-over' ? 'text-xs' : 'text-sm'}`}>
                          Perplexity AI searches for tariff information using structured prompts designed
                          to extract specific tariff details in JSON format. This includes rates, countries,
                          product codes, effective dates, and policy information.
                        </p>
                      </div>
                      
                      <div>
                        <div className="flex items-center mb-2">
                          <PenTool className="text-[rgb(var(--scb-honolulu-blue))] mr-3" size={isMultiTasking && mode === 'slide-over' ? 16 : 20} />
                          <span className={`font-medium text-[rgb(var(--scb-dark-gray))] ${isMultiTasking && mode === 'slide-over' ? 'text-xs' : 'text-sm'}`}>
                            2. Data Transformation
                          </span>
                        </div>
                        <p className={`ml-8 text-[rgb(var(--scb-dark-gray))] ${isMultiTasking && mode === 'slide-over' ? 'text-xs' : 'text-sm'}`}>
                          LangChain processes the structured JSON output and converts it to RDF triples
                          following the tariff ontology schema. This creates semantic relationships between
                          entities like countries, products, and policies.
                        </p>
                      </div>
                      
                      <div>
                        <div className="flex items-center mb-2">
                          <Database className="text-[rgb(var(--scb-purple))] mr-3" size={isMultiTasking && mode === 'slide-over' ? 16 : 20} />
                          <span className={`font-medium text-[rgb(var(--scb-dark-gray))] ${isMultiTasking && mode === 'slide-over' ? 'text-xs' : 'text-sm'}`}>
                            3. Semantic Storage
                          </span>
                        </div>
                        <p className={`ml-8 text-[rgb(var(--scb-dark-gray))] ${isMultiTasking && mode === 'slide-over' ? 'text-xs' : 'text-sm'}`}>
                          Apache Jena stores the RDF triples in a queryable triplestore. This enables
                          semantic reasoning about relationships between tariffs, countries, and trade policies.
                        </p>
                      </div>
                      
                      <div>
                        <div className="flex items-center mb-2">
                          <BarChart2 className="text-[rgb(var(--scb-honolulu-blue))] mr-3" size={isMultiTasking && mode === 'slide-over' ? 16 : 20} />
                          <span className={`font-medium text-[rgb(var(--scb-dark-gray))] ${isMultiTasking && mode === 'slide-over' ? 'text-xs' : 'text-sm'}`}>
                            4. Analysis & Visualization
                          </span>
                        </div>
                        <p className={`ml-8 text-[rgb(var(--scb-dark-gray))] ${isMultiTasking && mode === 'slide-over' ? 'text-xs' : 'text-sm'}`}>
                          SPARQL queries extract insights from the semantic data model, which are then
                          visualized through interactive charts and tables. This supports advanced analysis
                          of tariff impacts and relationships.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Documentation Tab */}
            {activeTab === 'documentation' && (
              <div className="bg-white dark:bg-[rgb(var(--scb-dark-background))] rounded-lg shadow-sm border border-[rgb(var(--scb-border))] p-6">
                <h2 className={`font-semibold text-[rgb(var(--scb-dark-gray))] ${isMultiTasking && mode === 'slide-over' ? 'text-lg' : 'text-xl'} mb-6`}>
                  Technical Documentation
                </h2>
                
                <div className="space-y-8">
                  <div>
                    <h3 className={`font-medium text-[rgb(var(--scb-dark-gray))] ${isMultiTasking && mode === 'slide-over' ? 'text-sm' : 'text-base'} mb-3`}>
                      API Reference
                    </h3>
                    <p className={`text-[rgb(var(--scb-dark-gray))] ${isMultiTasking && mode === 'slide-over' ? 'text-xs' : 'text-sm'} mb-4`}>
                      The Semantic Tariff Engine exposes the following key methods for integration with
                      external systems:
                    </p>
                    <div className={`bg-[rgb(var(--scb-light-gray))] dark:bg-[rgba(var(--scb-dark-gray),0.3)] p-4 rounded-md font-mono ${isMultiTasking && mode === 'slide-over' ? 'text-xs' : 'text-sm'}`}>
                      <p className="mb-2"><strong>searchTariffs(params)</strong> - Search for tariff information</p>
                      <p className="mb-2"><strong>getTariffChangesByCountry(country, limit)</strong> - Get recent tariff changes</p>
                      <p className="mb-2"><strong>calculateTariffImpact(params)</strong> - Analyze tariff impact</p>
                      <p className="mb-2"><strong>executeSparqlQuery(query)</strong> - Run custom SPARQL queries</p>
                      <p><strong>importTariffData(data)</strong> - Import external tariff data</p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className={`font-medium text-[rgb(var(--scb-dark-gray))] ${isMultiTasking && mode === 'slide-over' ? 'text-sm' : 'text-base'} mb-3`}>
                      Ontology Schema
                    </h3>
                    <p className={`text-[rgb(var(--scb-dark-gray))] ${isMultiTasking && mode === 'slide-over' ? 'text-xs' : 'text-sm'} mb-4`}>
                      The tariff ontology defines the semantic data model using the following core classes
                      and relationships:
                    </p>
                    <div className={`bg-[rgb(var(--scb-light-gray))] dark:bg-[rgba(var(--scb-dark-gray),0.3)] p-4 rounded-md font-mono ${isMultiTasking && mode === 'slide-over' ? 'text-xs' : 'text-sm'}`}>
                      <p className="mb-2"><strong>tariff:Tariff</strong> - A duty imposed on imported/exported goods</p>
                      <p className="mb-2"><strong>tariff:Country</strong> - A nation or sovereign state</p>
                      <p className="mb-2"><strong>tariff:HSCode</strong> - Harmonized System Code for product classification</p>
                      <p className="mb-2"><strong>tariff:TariffChange</strong> - A recorded change in tariff rates or policies</p>
                      <p className="mb-2"><strong>tariff:Policy</strong> - A trade policy or agreement affecting tariffs</p>
                      <p><strong>tariff:DataSource</strong> - Source of tariff information</p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className={`font-medium text-[rgb(var(--scb-dark-gray))] ${isMultiTasking && mode === 'slide-over' ? 'text-sm' : 'text-base'} mb-3`}>
                      Integration with LangChain
                    </h3>
                    <p className={`text-[rgb(var(--scb-dark-gray))] ${isMultiTasking && mode === 'slide-over' ? 'text-xs' : 'text-sm'} mb-4`}>
                      LangChain is used as middleware to connect Perplexity AI with the semantic triplestore.
                      Key components include:
                    </p>
                    <div className={`bg-[rgb(var(--scb-light-gray))] dark:bg-[rgba(var(--scb-dark-gray),0.3)] p-4 rounded-md ${isMultiTasking && mode === 'slide-over' ? 'text-xs' : 'text-sm'}`}>
                      <ul className="space-y-2">
                        <li><strong>Structured Output Parsers</strong> - Convert API responses to structured data</li>
                        <li><strong>RDF Triple Extraction</strong> - Generate RDF from structured data</li>
                        <li><strong>Advanced Prompting Templates</strong> - Specialized prompts for tariff data</li>
                        <li><strong>Error Handling</strong> - Robust error recovery for API calls</li>
                        <li><strong>Data Validation</strong> - Validate output before semantic storage</li>
                      </ul>
                    </div>
                  </div>
                  
                  {!isMultiTasking && (
                    <div>
                      <h3 className="font-medium text-[rgb(var(--scb-dark-gray))] text-base mb-3">
                        SPARQL Query Examples
                      </h3>
                      <p className="text-[rgb(var(--scb-dark-gray))] text-sm mb-4">
                        The following SPARQL queries demonstrate how to extract insights from the semantic tariff data:
                      </p>
                      <div className="bg-[rgb(var(--scb-light-gray))] dark:bg-[rgba(var(--scb-dark-gray),0.3)] p-4 rounded-md font-mono text-sm whitespace-pre-wrap overflow-x-auto">
                        <p className="font-bold mb-2"># Query for tariffs between two countries</p>
                        <p className="mb-4">{`PREFIX tariff: <http://example.org/tariff/>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>

SELECT ?tariff ?rate ?effectiveDate
WHERE {
  ?tariff rdf:type tariff:Tariff .
  ?tariff tariff:hasSourceCountry ?sourceCountry .
  ?sourceCountry rdfs:label "China"@en .
  ?tariff tariff:hasDestinationCountry ?destCountry .
  ?destCountry rdfs:label "United States"@en .
  ?tariff tariff:hasRate ?rate .
  ?tariff tariff:hasEffectiveDate ?effectiveDate .
}`}</p>
                        
                        <p className="font-bold mb-2"># Query for recent tariff changes</p>
                        <p>{`PREFIX tariff: <http://example.org/tariff/>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>

SELECT ?change ?title ?oldRate ?newRate
WHERE {
  ?change rdf:type tariff:TariffChange .
  ?change rdfs:label ?title .
  ?change tariff:hasOldRate ?oldRate .
  ?change tariff:hasNewRate ?newRate .
  ?change tariff:hasAnnouncementDate ?date .
  FILTER (?date >= "2025-01-01"^^xsd:date)
}`}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Fixed notification button for iPad/iPhone */}
        {isAppleDevice && !isMultiTasking && (
          <div className="fixed bottom-6 right-6">
            <EnhancedTouchButton
              onClick={() => {
                haptic({ intensity: 'medium' });
                alert('Documentation panel opened');
              }}
              variant="primary"
              className="rounded-full p-3 shadow-lg"
            >
              <FileText size={20} />
            </EnhancedTouchButton>
          </div>
        )}
      </ScbBeautifulUI>
    </>
  );
};

export default SemanticTariffEnginePage;