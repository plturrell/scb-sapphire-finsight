import React, { useState, useEffect } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import DashboardLayout from '../components/layout/DashboardLayout';
import TariffAlertList from '../components/TariffAlertList';
import TariffAlertFilters from '../components/TariffAlertFilters';
import TariffImpactVisualization from '../components/TariffImpactVisualization';
import { OntologyManager } from '../services/OntologyManager';
import { WebSearchService } from '../services/WebSearchService';
import NotificationDispatcher from '../services/NotificationDispatcher';
import TariffImpactSimulator from '../services/TariffImpactSimulator';
import { TariffAlert, TariffChange, SankeyData } from '../types';
import { RefreshCw, Filter, Search, AlertTriangle, Info } from 'lucide-react';

// Use real data from APIs

const TariffAlertsDashboard: NextPage = () => {
  const [alerts, setAlerts] = useState<TariffAlert[]>([]);
  const [filteredAlerts, setFilteredAlerts] = useState<TariffAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([]);
  const [sankeyData, setSankeyData] = useState<SankeyData | null>(null);
  const [simulationInProgress, setSimulationInProgress] = useState(false);
  
  // Initialize services and load data from real API
  useEffect(() => {
    const initializeServices = async () => {
      try {
        setIsLoading(true);
        
        // Fetch real tariff alerts from the API
        const response = await fetch('/api/tariff-data');
        if (!response.ok) {
          throw new Error(`Failed to fetch tariff data: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success && Array.isArray(data.alerts)) {
          setAlerts(data.alerts);
          setFilteredAlerts(data.alerts);
        } else {
          console.warn('API returned unexpected data format:', data);
          // Fallback to mock data if API fails or returns unexpected format
          setAlerts(mockTariffAlerts);
          setFilteredAlerts(mockTariffAlerts);
        }
        
        // Initialize ontology and web search service for real-time updates
        const ontologyManager = new OntologyManager();
        await ontologyManager.loadOntology();
        const webSearchService = new WebSearchService(ontologyManager);
        
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to initialize services:', error);
        // Fallback to mock data if API fails
        setAlerts(mockTariffAlerts);
        setFilteredAlerts(mockTariffAlerts);
        setIsLoading(false);
      }
    };
    
    initializeServices();
    
    // Initialize WebSocket for real-time updates
    const ws = NotificationDispatcher.initializeWebSocket();
    
    // Event listener for tariff alerts from the notification system
    const handleTariffAlerts = (event: CustomEvent) => {
      const newAlerts = event.detail;
      if (Array.isArray(newAlerts) && newAlerts.length > 0) {
        setAlerts(prevAlerts => {
          // Merge new alerts
          const combined = [...prevAlerts];
          newAlerts.forEach(newAlert => {
            const existingIndex = combined.findIndex(a => a.id === newAlert.id);
            if (existingIndex >= 0) {
              combined[existingIndex] = newAlert;
            } else {
              combined.push(newAlert);
            }
          });
          return combined;
        });
      }
    };
    
    window.addEventListener('tariff-alerts', handleTariffAlerts as EventListener);
    
    return () => {
      window.removeEventListener('tariff-alerts', handleTariffAlerts as EventListener);
      if (ws) ws.close();
    };
  }, []);
  
  // Filter alerts when filters or search query changes
  useEffect(() => {
    const filterAlerts = () => {
      let filtered = [...alerts];
      
      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(alert => 
          alert.title.toLowerCase().includes(query) || 
          alert.description.toLowerCase().includes(query) ||
          alert.country.toLowerCase().includes(query)
        );
      }
      
      // Filter by selected countries
      if (selectedCountries.length > 0) {
        filtered = filtered.filter(alert => 
          selectedCountries.includes(alert.country)
        );
      }
      
      // Filter by selected priorities
      if (selectedPriorities.length > 0) {
        filtered = filtered.filter(alert => 
          selectedPriorities.includes(alert.priority)
        );
      }
      
      setFilteredAlerts(filtered);
    };
    
    filterAlerts();
  }, [alerts, searchQuery, selectedCountries, selectedPriorities]);
  
  const runImpactSimulation = async () => {
    try {
      setSimulationInProgress(true);
      
      // Initialize services for simulation
      const ontologyManager = new OntologyManager();
      await ontologyManager.loadOntology();
      const simulator = new TariffImpactSimulator(ontologyManager);
      
      // Get data about the selected countries
      const countriesToSimulate = selectedCountries.length > 0 
        ? selectedCountries 
        : alerts.map(a => a.country).filter((c, i, arr) => arr.indexOf(c) === i);
      
      // Configuration for simulation based on UI state
      const simulationConfig = {
        countries: countriesToSimulate,
        includedAlerts: filteredAlerts.map(a => a.id),
        timeframe: 24, // 24 months
        confidence: 0.8,
        includeSecondOrderEffects: true
      };
      
      // Run the simulation via API
      const response = await fetch('/api/tariff-simulation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(simulationConfig)
      });
      
      if (!response.ok) {
        throw new Error(`Simulation API error: ${response.status}`);
      }
      
      const simulationResults = await response.json();
      
      if (simulationResults.success && simulationResults.data?.sankeyData) {
        setSankeyData(simulationResults.data.sankeyData);
      } else {
        // Fallback to simple visualization if API fails or returns unexpected format
        console.warn('Simulation API returned unexpected data format:', simulationResults);
        
        // Generate basic Sankey data from available alerts
        const countries = new Set(filteredAlerts.map(a => a.country));
        const products = new Set(filteredAlerts.flatMap(a => a.productCategories || []));
        
        const nodes = [
          ...Array.from(countries).map(name => ({ name, group: "country" })),
          ...Array.from(products).map(name => ({ name, group: "product" })),
          { name: "FTA", group: "policy" },
          { name: "Protectionist", group: "policy" },
          { name: "WTO Rules", group: "policy" }
        ];
        
        // Create basic links based on available data
        const links = [];
        
        // Country to product links
        filteredAlerts.forEach(alert => {
          const countryIndex = nodes.findIndex(n => n.name === alert.country);
          if (countryIndex === -1) return;
          
          (alert.productCategories || []).forEach(product => {
            const productIndex = nodes.findIndex(n => n.name === product);
            if (productIndex === -1) return;
            
            links.push({
              source: countryIndex,
              target: productIndex,
              value: 10 + Math.floor(alert.impactSeverity * 2),
              uiColor: "rgba(0, 114, 170, 0.6)",
              aiEnhanced: alert.aiEnhanced
            });
          });
        });
        
        // Product to policy links (simplified)
        nodes.filter(n => n.group === "product").forEach((product, index) => {
          const productIndex = nodes.findIndex(n => n.name === product.name);
          const policyIndex = Math.floor(Math.random() * 3) + nodes.filter(n => n.group !== "policy").length;
          
          links.push({
            source: productIndex,
            target: policyIndex,
            value: 5 + Math.floor(Math.random() * 20),
            uiColor: "rgba(33, 170, 71, 0.6)"
          });
        });
        
        // Create fallback Sankey data
        setSankeyData({
          nodes,
          links,
          aiInsights: {
            summary: "Simplified tariff impact analysis based on available alert data.",
            recommendations: [
              "Monitor changes in tariff policies affecting your key product categories.",
              "Consider diversifying suppliers to mitigate tariff-related risks.",
              "Review impact severity metrics for your most critical trade corridors."
            ],
            confidence: 0.7,
            updatedAt: new Date()
          }
        });
      }
      
      setSimulationInProgress(false);
    } catch (error) {
      console.error('Failed to run impact simulation:', error);
      
      // Generate minimal fallback visualization
      setSankeyData({
        nodes: [
          { name: "Singapore", group: "country" },
          { name: "Malaysia", group: "country" },
          { name: "Vietnam", group: "country" },
          { name: "Electronics", group: "product" },
          { name: "Textiles", group: "product" },
          { name: "Automotive", group: "product" },
          { name: "FTA", group: "policy" },
          { name: "Protectionist", group: "policy" },
          { name: "WTO Rules", group: "policy" }
        ],
        links: [
          { source: 0, target: 3, value: 20, uiColor: "rgba(0, 114, 170, 0.6)" },
          { source: 0, target: 4, value: 15, uiColor: "rgba(0, 114, 170, 0.6)" },
          { source: 1, target: 4, value: 25, uiColor: "rgba(0, 114, 170, 0.6)" },
          { source: 1, target: 5, value: 18, uiColor: "rgba(0, 114, 170, 0.6)" },
          { source: 2, target: 3, value: 22, uiColor: "rgba(0, 114, 170, 0.6)" },
          { source: 2, target: 5, value: 12, uiColor: "rgba(0, 114, 170, 0.6)" },
          { source: 3, target: 6, value: 15, uiColor: "rgba(33, 170, 71, 0.6)" },
          { source: 3, target: 8, value: 5, uiColor: "rgba(33, 170, 71, 0.6)" },
          { source: 4, target: 7, value: 20, uiColor: "rgba(33, 170, 71, 0.6)" },
          { source: 5, target: 6, value: 13, uiColor: "rgba(33, 170, 71, 0.6)" },
          { source: 5, target: 7, value: 8, uiColor: "rgba(33, 170, 71, 0.6)" }
        ],
        aiInsights: {
          summary: "Fallback analysis due to simulation error.",
          recommendations: [
            "Please try again with fewer selected countries or alerts.",
            "Check network connectivity and try again later."
          ],
          confidence: 0.5,
          updatedAt: new Date()
        }
      });
      
      setSimulationInProgress(false);
    }
  };
  
  const refreshAlerts = async () => {
    setIsLoading(true);
    
    try {
      // Fetch fresh data from API with refresh flag to force data products check
      const response = await fetch('/api/tariff-data?refresh=true');
      
      if (!response.ok) {
        throw new Error(`Failed to refresh tariff data: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && Array.isArray(data.alerts)) {
        setAlerts(data.alerts);
      } else {
        console.warn('API returned unexpected data format during refresh:', data);
        // Don't update state if API returns unexpected format
      }
    } catch (error) {
      console.error('Failed to refresh alerts:', error);
      // Don't update state if API fails - keep existing data
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <>
      <Head>
        <title>Tariff Alert Scanner | SCB Sapphire FinSight</title>
        <meta name="description" content="Monitor and analyze tariff changes affecting your supply chain" />
      </Head>
      
      <DashboardLayout>
        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">Tariff Alert Scanner</h1>
            <p className="mt-1 text-sm text-gray-600">
              Monitor and analyze tariff changes affecting your global supply chain
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left panel - Filters & Alerts */}
            <div className="col-span-1 space-y-6">
              {/* Search & Filters */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Filter size={18} className="text-gray-500" />
                    <h2 className="text-sm font-medium">Filters</h2>
                  </div>
                  <button 
                    className="text-sm text-blue-600 hover:text-blue-800"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCountries([]);
                      setSelectedPriorities([]);
                    }}
                  >
                    Reset
                  </button>
                </div>
                
                <div className="p-4">
                  {/* Search input */}
                  <div className="relative mb-4">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <Search size={16} className="text-gray-400" />
                    </div>
                    <input
                      type="text"
                      className="w-full py-2 pl-10 pr-4 text-sm text-gray-900 bg-gray-50 rounded-md border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Search tariff alerts..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  
                  {/* Country filter */}
                  <TariffAlertFilters 
                    alerts={alerts}
                    selectedCountries={selectedCountries}
                    setSelectedCountries={setSelectedCountries}
                    selectedPriorities={selectedPriorities}
                    setSelectedPriorities={setSelectedPriorities}
                  />
                </div>
              </div>
              
              {/* Alert List */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={18} className="text-amber-500" />
                    <h2 className="text-sm font-medium">Recent Alerts</h2>
                    {filteredAlerts.length > 0 && (
                      <span className="bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded-full">
                        {filteredAlerts.length}
                      </span>
                    )}
                  </div>
                  <button 
                    className="p-1 rounded-full hover:bg-gray-100 text-gray-500"
                    onClick={refreshAlerts}
                    disabled={isLoading}
                  >
                    <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
                  </button>
                </div>
                
                <TariffAlertList 
                  alerts={filteredAlerts}
                  isLoading={isLoading}
                />
              </div>
            </div>
            
            {/* Right panel - Visualization */}
            <div className="col-span-1 lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full">
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Info size={18} className="text-blue-500" />
                    <h2 className="text-sm font-medium">Tariff Impact Visualization</h2>
                  </div>
                  <button 
                    className="px-3 py-1.5 text-xs font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                    onClick={runImpactSimulation}
                    disabled={simulationInProgress}
                  >
                    {simulationInProgress ? 'Running...' : 'Run Impact Simulation'}
                  </button>
                </div>
                
                <TariffImpactVisualization 
                  data={sankeyData}
                  isLoading={simulationInProgress} 
                />
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </>
  );
};

export default TariffAlertsDashboard;
