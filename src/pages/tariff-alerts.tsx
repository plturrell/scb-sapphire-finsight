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

// Mock data for initial development
import { mockTariffAlerts } from '../mock/tariffAlerts';

const TariffAlertsDashboard: NextPage = () => {
  const [alerts, setAlerts] = useState<TariffAlert[]>([]);
  const [filteredAlerts, setFilteredAlerts] = useState<TariffAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([]);
  const [sankeyData, setSankeyData] = useState<SankeyData | null>(null);
  const [simulationInProgress, setSimulationInProgress] = useState(false);
  
  // Initialize services
  useEffect(() => {
    const initializeServices = async () => {
      try {
        setIsLoading(true);
        
        // In a real implementation, these would be initialized and loaded
        // For now, we'll use mock data
        setAlerts(mockTariffAlerts);
        setFilteredAlerts(mockTariffAlerts);
        
        // In real implementation:
        // const ontologyManager = new OntologyManager();
        // await ontologyManager.loadOntology();
        // const webSearchService = new WebSearchService(ontologyManager);
        // await webSearchService.performSearch();
        
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to initialize services:', error);
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
      
      // In a real implementation, this would call the service
      // const ontologyManager = new OntologyManager();
      // await ontologyManager.loadOntology();
      // const simulator = new TariffImpactSimulator(ontologyManager);
      // const results = await simulator.runSimulation();
      // const sankeyData = simulator.generateSankeyData();
      
      // For demo purposes, simulate a delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock Sankey data
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
          { source: 0, target: 3, value: 20, uiColor: "rgba(0, 114, 170, 0.6)", aiEnhanced: true },
          { source: 0, target: 4, value: 15, uiColor: "rgba(0, 114, 170, 0.6)" },
          { source: 1, target: 4, value: 25, uiColor: "rgba(0, 114, 170, 0.6)" },
          { source: 1, target: 5, value: 18, uiColor: "rgba(0, 114, 170, 0.6)", aiEnhanced: true },
          { source: 2, target: 3, value: 22, uiColor: "rgba(0, 114, 170, 0.6)" },
          { source: 2, target: 5, value: 12, uiColor: "rgba(0, 114, 170, 0.6)" },
          { source: 3, target: 6, value: 15, uiColor: "rgba(33, 170, 71, 0.6)" },
          { source: 3, target: 8, value: 5, uiColor: "rgba(33, 170, 71, 0.6)" },
          { source: 4, target: 7, value: 20, uiColor: "rgba(33, 170, 71, 0.6)", aiEnhanced: true },
          { source: 5, target: 6, value: 13, uiColor: "rgba(33, 170, 71, 0.6)" },
          { source: 5, target: 7, value: 8, uiColor: "rgba(33, 170, 71, 0.6)" }
        ],
        aiInsights: {
          summary: "AI-enhanced analysis of tariff impacts across ASEAN countries.",
          recommendations: [
            "Monitor changes in Vietnam's electronics tariffs in response to regional tensions.",
            "Consider diversifying textile suppliers beyond Malaysia to mitigate risk.",
            "Prepare contingency plans for automotive supply chain disruptions."
          ],
          confidence: 0.85,
          updatedAt: new Date()
        }
      });
      
      setSimulationInProgress(false);
    } catch (error) {
      console.error('Failed to run impact simulation:', error);
      setSimulationInProgress(false);
    }
  };
  
  const refreshAlerts = async () => {
    setIsLoading(true);
    
    // In a real implementation, this would refresh from services
    // const ontologyManager = new OntologyManager();
    // await ontologyManager.loadOntology();
    // const webSearchService = new WebSearchService(ontologyManager);
    // await webSearchService.performSearch();
    
    // For now, simulate a delay and use mock data
    await new Promise(resolve => setTimeout(resolve, 1000));
    setAlerts(mockTariffAlerts);
    
    setIsLoading(false);
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
