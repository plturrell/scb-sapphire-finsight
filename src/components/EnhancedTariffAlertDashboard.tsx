import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { EnhancedTariffAlertList } from './EnhancedTariffAlertList';
import { EnhancedSimulationControls } from './EnhancedSimulationControls';
import { EnhancedCountrySelector } from './EnhancedCountrySelector';
import { NotificationCenter } from '../services/NotificationCenter';
import { TariffAlert } from '../types';

// Import SankeyChart dynamically to avoid SSR issues with D3
const DynamicSankeyChart = dynamic(
  () => import('./charts/EnhancedSankeyChart'),
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
  className?: string;
}

/**
 * Enhanced Tariff Alert Dashboard with SCB beautiful styling
 * Integrates real-time web search and Monte Carlo simulation
 * Follows Fiori Horizon design patterns with SCB color variables
 * Provides responsive layout and optimized for mobile and desktop
 */
export const EnhancedTariffAlertDashboard: React.FC<TariffAlertDashboardProps> = ({
  alerts,
  simulationData,
  simulationStatus,
  onRunSimulation,
  onPauseSimulation,
  onResumeSimulation,
  onStopSimulation,
  onStepSimulation,
  onTriggerManualSearch,
  className = ""
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
    <div className={`${className}`}>
      {/* Dashboard Header */}
      <div className="fiori-shell-header px-4 py-3">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <h1 className="text-xl font-medium text-white mb-4 lg:mb-0">ASEAN Tariff Alert Dashboard</h1>
          
          <div className="dashboard-controls flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="w-full sm:w-48">
              <EnhancedCountrySelector
                selectedCountry={selectedCountry}
                onChange={setSelectedCountry}
              />
            </div>
            
            <button 
              className="fiori-btn fiori-btn-secondary bg-white text-xs touch-min-h"
              onClick={handleManualSearch}
            >
              Trigger Search
            </button>
          </div>
        </div>
      </div>
      
      {/* Dashboard Content */}
      <div className="bg-[rgb(var(--scb-light-gray))] min-h-screen">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-4 md:p-6">
          {/* Alerts Column */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            {/* Alerts section */}
            <EnhancedTariffAlertList 
              alerts={filteredAlerts} 
              title="Tariff Alerts"
            />
            
            {/* Notifications panel */}
            <div className="fiori-tile h-full flex flex-col">
              <div className="px-4 py-3 border-b border-[rgb(var(--scb-border))]">
                <h3 className="text-base font-medium text-[rgb(var(--scb-dark-gray))]">Notifications</h3>
              </div>
              
              {notifications.length === 0 ? (
                <div className="p-8 text-center flex-grow">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[rgba(var(--scb-light-gray),0.5)] mb-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[rgb(var(--scb-dark-gray))] opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                  </div>
                  <p className="text-sm text-[rgb(var(--scb-dark-gray))]">No notifications yet</p>
                </div>
              ) : (
                <div className="overflow-y-auto flex-grow">
                  <ul className="divide-y divide-[rgb(var(--scb-border))]">
                    {notifications.map(notification => (
                      <li 
                        key={notification.id}
                        className={`px-4 py-3 hover:bg-[rgba(var(--scb-light-gray),0.3)] cursor-pointer transition-colors touch-manipulation ${notification.read ? '' : 'bg-[rgba(var(--scb-honolulu-blue),0.05)]'}`}
                        onClick={() => NotificationCenter.markAsRead(notification.id)}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-[rgb(var(--scb-dark-gray))]">{notification.title}</span>
                          <span className="text-xs text-[rgb(var(--scb-dark-gray))] opacity-70">
                            {new Date(notification.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className="text-xs text-[rgb(var(--scb-dark-gray))]">{notification.body}</div>
                        <div className="mt-2 flex justify-between items-center">
                          <div 
                            className={`horizon-chip text-[10px] ${
                              notification.priority === 'critical' ? 'horizon-chip-red' : 
                              notification.priority === 'high' ? 'bg-[rgba(var(--warning),0.1)] text-[rgb(var(--warning))]' : 
                              notification.priority === 'medium' ? 'horizon-chip-blue' : 
                              'bg-[rgba(var(--scb-dark-gray),0.1)] text-[rgb(var(--scb-dark-gray))]'
                            }`}
                          >
                            {notification.priority}
                          </div>
                          {!notification.read && (
                            <div className="w-2 h-2 rounded-full bg-[rgb(var(--scb-honolulu-blue))]"></div>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
          
          {/* Visualization Column */}
          <div className="lg:col-span-8">
            <div className="fiori-tile h-full overflow-hidden">
              <div className="px-4 py-3 border-b border-[rgb(var(--scb-border))]">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-medium text-[rgb(var(--scb-dark-gray))]">
                    Tariff Impact Visualization {selectedCountry !== 'all' ? ` - ${selectedCountry}` : ''}
                  </h3>
                </div>
              </div>
              
              <div className="p-4">
                {simulationData?.flowData ? (
                  <DynamicSankeyChart 
                    data={simulationData.flowData}
                    width={800}
                    height={500}
                    title={`Tariff Flow Analysis${selectedCountry !== 'all' ? ` - ${selectedCountry}` : ''}`}
                    showAIControls={true}
                  />
                ) : (
                  <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-[rgb(var(--scb-border))] rounded-md bg-[rgba(var(--scb-light-gray),0.3)] p-6">
                    <p className="text-sm text-[rgb(var(--scb-dark-gray))] mb-4">Run a simulation to view tariff impact visualization</p>
                    <button 
                      className="fiori-btn fiori-btn-primary text-xs touch-min-h"
                      onClick={() => handleRunSimulation({ timeHorizon: 24 })}
                    >
                      Run Default Simulation
                    </button>
                  </div>
                )}
                
                {simulationStatus !== 'idle' && (
                  <EnhancedSimulationControls
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
                  <div className="mt-6 border-t border-[rgb(var(--scb-border))] pt-4">
                    <h3 className="text-sm font-medium text-[rgb(var(--scb-dark-gray))] mb-3">Simulation Results</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="fiori-tile p-3 bg-[rgba(var(--scb-light-gray),0.2)]">
                        <h4 className="text-xs font-medium text-[rgb(var(--scb-dark-gray))] mb-2">Optimal Strategy</h4>
                        <ul className="text-xs text-[rgb(var(--scb-dark-gray))] space-y-2">
                          {simulationData.results.optimalPath?.recommendations?.map((rec: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-2">
                              <div className="flex-shrink-0 mt-0.5 w-5 h-5 rounded-full bg-[rgba(var(--scb-honolulu-blue),0.1)] flex items-center justify-center">
                                <span className="text-[10px] font-bold text-[rgb(var(--scb-honolulu-blue))]">{idx + 1}</span>
                              </div>
                              <p>{rec}</p>
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div className="fiori-tile p-3 bg-[rgba(var(--scb-light-gray),0.2)]">
                        <h4 className="text-xs font-medium text-[rgb(var(--scb-dark-gray))] mb-2">Risk Metrics</h4>
                        <div className="text-xs text-[rgb(var(--scb-dark-gray))] space-y-2">
                          {simulationData.results.riskMetrics && Object.entries(simulationData.results.riskMetrics).map(([key, value]) => (
                            <div key={key} className="flex justify-between items-center py-1 border-b border-[rgba(var(--scb-border),0.5)] last:border-b-0">
                              <span>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</span>
                              <span className={`font-medium ${
                                typeof value === 'number' && value < 0 ? 'text-[rgb(var(--scb-muted-red))]' : 
                                typeof value === 'number' && value > 0 ? 'text-[rgb(var(--scb-american-green))]' : 
                                'text-[rgb(var(--scb-honolulu-blue))]'
                              }`}>
                                {typeof value === 'number' ? value.toFixed(2) : value}
                              </span>
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
      </div>
    </div>
  );
};

export default EnhancedTariffAlertDashboard;