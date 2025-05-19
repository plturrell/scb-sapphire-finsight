import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { AlertList } from './AlertList';
import { SimulationControls } from './SimulationControls';
import { CountrySelector } from './CountrySelector';
import { NotificationCenter } from '../services/NotificationCenter';
import { TariffAlert } from '../types';

// Import SankeyChart dynamically to avoid SSR issues with D3
const DynamicSankeyChart = dynamic(
  () => import('./SankeyChart'),
  { ssr: false }
);

interface TariffAlertDashboardProps {
  alerts: TariffAlert[];
  simulationData: any;
  simulationStatus: 'idle' | 'running' | 'paused' | 'complete';
  onRunSimulation: (config: any) => void;
  onPauseSimulation: () => void;
  onResumeSimulation: () => void;
  onStopSimulation: () => void;
  onStepSimulation: (steps: number) => void;
  onTriggerManualSearch: (params: any) => void;
}

/**
 * Tariff Alert Dashboard - main component for the tariff scanner system
 * Integrates real-time web search and Monte Carlo simulation
 */
export const TariffAlertDashboard: React.FC<TariffAlertDashboardProps> = ({
  alerts,
  simulationData,
  simulationStatus,
  onRunSimulation,
  onPauseSimulation,
  onResumeSimulation,
  onStopSimulation,
  onStepSimulation,
  onTriggerManualSearch
}) => {
  const [selectedCountry, setSelectedCountry] = useState('all');
  const [filteredAlerts, setFilteredAlerts] = useState(alerts);
  const [notifications, setNotifications] = useState<any[]>([]);
  
  // Filter alerts when selection changes
  useEffect(() => {
    if (selectedCountry === 'all') {
      setFilteredAlerts(alerts);
    } else {
      setFilteredAlerts(alerts.filter(alert => alert.country === selectedCountry));
    }
  }, [selectedCountry, alerts]);
  
  // Load notifications from storage
  useEffect(() => {
    const storedNotifications = NotificationCenter.getStoredNotifications();
    setNotifications(storedNotifications);
    
    // Listen for new notifications
    const handleNewNotification = (event: CustomEvent) => {
      setNotifications(NotificationCenter.getStoredNotifications());
    };
    
    window.addEventListener('tariffNotification', handleNewNotification as EventListener);
    
    return () => {
      window.removeEventListener('tariffNotification', handleNewNotification as EventListener);
    };
  }, []);
  
  const handleManualSearch = () => {
    const searchParams = {
      country: selectedCountry === 'all' ? 'ASEAN' : selectedCountry,
      sources: ['Reuters', 'Bloomberg', 'The Economist']
    };
    
    onTriggerManualSearch(searchParams);
  };
  
  const handleRunSimulation = (config: any) => {
    const simulationConfig = {
      ...config,
      country: selectedCountry === 'all' ? null : selectedCountry
    };
    
    onRunSimulation(simulationConfig);
  };
  
  return (
    <div className="tariff-alert-dashboard">
      <div className="dashboard-header p-4 border-b border-gray-200 bg-white">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <h1 className="text-xl font-semibold text-gray-900 mb-4 lg:mb-0">ASEAN Tariff Alert Dashboard</h1>
          
          <div className="dashboard-controls flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="w-full sm:w-48">
              <CountrySelector
                selectedCountry={selectedCountry}
                onChange={setSelectedCountry}
              />
            </div>
            
            <button 
              className="px-3 py-1.5 text-xs font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 inline-flex items-center justify-center"
              onClick={handleManualSearch}
            >
              Trigger Search
            </button>
          </div>
        </div>
      </div>
      
      <div className="dashboard-content grid grid-cols-1 lg:grid-cols-12 gap-6 p-6">
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Alerts section */}
          <div className="alerts-container">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-medium text-gray-900">Tariff Alerts</h2>
              <div className="bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded-full">
                {filteredAlerts.length}
              </div>
            </div>
            <AlertList alerts={filteredAlerts} />
          </div>
          
          {/* Notifications panel */}
          <div className="notifications-panel">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Notifications</h3>
            <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
              {notifications.length === 0 ? (
                <div className="p-4 text-center">
                  <p className="text-xs text-gray-500">No notifications yet</p>
                </div>
              ) : (
                <div className="notification-list max-h-[300px] overflow-y-auto">
                  {notifications.map(notification => (
                    <div 
                      key={notification.id}
                      className={`p-3 border-b border-gray-100 last:border-b-0 ${notification.read ? 'bg-white' : 'bg-blue-50'} hover:bg-gray-50 cursor-pointer`}
                      onClick={() => NotificationCenter.markAsRead(notification.id)}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-gray-900">{notification.title}</span>
                        <span className="text-[10px] text-gray-500">
                          {new Date(notification.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="text-xs text-gray-600">{notification.body}</div>
                      <div className="mt-1 flex justify-between items-center">
                        <div 
                          className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                            notification.priority === 'critical' ? 'bg-red-100 text-red-800' : 
                            notification.priority === 'high' ? 'bg-amber-100 text-amber-800' : 
                            notification.priority === 'medium' ? 'bg-blue-100 text-blue-800' : 
                            'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {notification.priority}
                        </div>
                        {!notification.read && (
                          <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="lg:col-span-8">
          {/* Visualization section */}
          <div className="visualization-container bg-white border border-gray-200 rounded-md p-4">
            <h2 className="text-sm font-medium text-gray-900 mb-4">Tariff Impact Visualization</h2>
            
            {simulationData?.flowData ? (
              <DynamicSankeyChart 
                data={simulationData.flowData}
                width={800}
                height={500}
                title={`Tariff Flow Analysis${selectedCountry !== 'all' ? ` - ${selectedCountry}` : ''}`}
                showAIControls={true}
              />
            ) : (
              <div className="no-simulation-data h-64 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-md bg-gray-50 p-6">
                <p className="text-sm text-gray-500 mb-4">Run a simulation to view tariff impact visualization</p>
                <button 
                  className="px-3 py-1.5 text-xs font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700"
                  onClick={() => handleRunSimulation({ timeHorizon: 24 })}
                >
                  Run Default Simulation
                </button>
              </div>
            )}
            
            {simulationStatus !== 'idle' && (
              <SimulationControls
                status={simulationStatus}
                progress={simulationData?.progress}
                onPause={onPauseSimulation}
                onResume={onResumeSimulation}
                onStop={onStopSimulation}
                onStep={() => onStepSimulation(100)}
                onRun={handleRunSimulation}
              />
            )}
            
            {simulationData?.results && (
              <div className="simulation-results mt-6 border-t border-gray-200 pt-4">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Simulation Results</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border rounded-md p-3 bg-gray-50">
                    <h4 className="text-xs font-medium text-gray-700 mb-2">Optimal Strategy</h4>
                    <ul className="text-xs text-gray-600 space-y-1">
                      {simulationData.results.optimalPath?.recommendations?.map((rec: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2">
                          <div className="flex-shrink-0 mt-0.5 w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-[10px] font-bold text-blue-700">{idx + 1}</span>
                          </div>
                          <p>{rec}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="border rounded-md p-3 bg-gray-50">
                    <h4 className="text-xs font-medium text-gray-700 mb-2">Risk Metrics</h4>
                    <div className="text-xs text-gray-600 space-y-2">
                      {simulationData.results.riskMetrics && Object.entries(simulationData.results.riskMetrics).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:</span>
                          <span className="font-medium">{typeof value === 'number' ? value.toFixed(2) : value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TariffAlertDashboard;
