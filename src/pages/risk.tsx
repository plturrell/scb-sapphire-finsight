import React, { useState } from 'react';
import Head from 'next/head';
import { 
  AlertTriangle, 
  Shield, 
  TrendingUp, 
  BarChart2, 
  PieChart, 
  RefreshCw, 
  Download,
  ArrowDown,
  ArrowUp,
  Filter,
  ChevronDown
} from 'lucide-react';
import ScbBeautifulUI from '@/components/ScbBeautifulUI';

// Sample data for risk metrics
const riskScores = {
  market: 72,
  credit: 58,
  liquidity: 45,
  operational: 34,
  strategic: 61
};

const riskExposures = [
  { category: 'US Equities', value: 42, change: 3.2 },
  { category: 'European Equities', value: 27, change: -1.8 },
  { category: 'Fixed Income', value: 18, change: 0.5 },
  { category: 'Emerging Markets', value: 13, change: -4.2 },
  { category: 'Alternatives', value: 8, change: 1.7 },
];

const riskAlerts = [
  { 
    id: 1, 
    type: 'high', 
    title: 'Market Volatility Spike', 
    description: 'VIX has increased by 25% in the last 24 hours, indicating potential market instability.',
    timestamp: '2025-05-15T09:23:00Z' 
  },
  { 
    id: 2, 
    type: 'medium', 
    title: 'European Credit Exposure', 
    description: 'Current exposure to European credit exceeds recommended limits by 8%.',
    timestamp: '2025-05-14T16:45:00Z' 
  },
  { 
    id: 3, 
    type: 'low', 
    title: 'Liquidity Risk Assessment', 
    description: 'Monthly liquidity risk assessment shows improved metrics compared to previous months.',
    timestamp: '2025-05-14T11:12:00Z' 
  },
  { 
    id: 4, 
    type: 'high', 
    title: 'Operational Risk Alert', 
    description: 'Three failed trade settlements detected in the Asia desk operations.',
    timestamp: '2025-05-13T22:07:00Z' 
  },
];

export default function RiskManagement() {
  const [selectedPeriod, setSelectedPeriod] = useState('1m');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const refreshData = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1500);
  };

  return (
    <ScbBeautifulUI pageTitle="Risk Management" showNewsBar={false}>
      <Head>
        <title>Risk Management | SCB Sapphire FinSight</title>
      </Head>

      <div className="space-y-6">
        {/* Risk Dashboard Header */}
        <div className="flex flex-col sm:flex-row justify-between gap-4 bg-white p-5 rounded-lg shadow-sm border border-[rgb(var(--scb-border))]">
          <div>
            <h2 className="text-xl font-medium text-[rgb(var(--scb-dark-gray))]">
              Risk Management Dashboard
            </h2>
            <p className="text-sm text-[rgb(var(--scb-dark-gray))] opacity-80 mt-1">
              Comprehensive view of your organization's risk profile and metrics
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex bg-[rgba(var(--scb-light-gray),0.3)] rounded-md p-0.5">
              {['1d', '1w', '1m', '3m', '1y'].map((period) => (
                <button
                  key={period}
                  onClick={() => setSelectedPeriod(period)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md ${
                    selectedPeriod === period 
                      ? 'bg-[rgb(var(--scb-honolulu-blue))] text-white' 
                      : 'text-[rgb(var(--scb-dark-gray))]'
                  }`}
                >
                  {period.toUpperCase()}
                </button>
              ))}
            </div>
            
            <button 
              onClick={refreshData}
              disabled={isRefreshing}
              className="scb-btn-ghost p-2 rounded-full hover:bg-[rgba(var(--scb-light-gray),0.5)] transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
            
            <button className="scb-btn-ghost p-2 rounded-full hover:bg-[rgba(var(--scb-light-gray),0.5)] transition-colors">
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Risk Score Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {Object.entries(riskScores).map(([key, score]) => (
            <div key={key} className="bg-white rounded-lg shadow-sm border border-[rgb(var(--scb-border))] p-4">
              <div className="flex justify-between items-start">
                <h3 className="text-sm font-medium text-[rgb(var(--scb-dark-gray))] capitalize">
                  {key} Risk
                </h3>
                <div className={`px-2 py-0.5 rounded-full text-xs ${
                  score > 65 ? 'bg-[rgba(var(--scb-muted-red),0.1)] text-[rgb(var(--scb-muted-red))]' : 
                  score > 45 ? 'bg-[rgba(255,166,0,0.1)] text-[rgb(255,166,0)]' : 
                  'bg-[rgba(var(--scb-american-green),0.1)] text-[rgb(var(--scb-american-green))]'
                }`}>
                  {score > 65 ? 'High' : score > 45 ? 'Medium' : 'Low'}
                </div>
              </div>
              
              <div className="mt-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-2xl font-bold">{score}</span>
                  <span className="text-xs text-[rgb(var(--scb-dark-gray))] opacity-70">/ 100</span>
                </div>
                <div className="h-2 bg-[rgba(var(--scb-light-gray),0.5)] rounded-full">
                  <div 
                    className={`h-2 rounded-full ${
                      score > 65 ? 'bg-[rgb(var(--scb-muted-red))]' : 
                      score > 45 ? 'bg-[rgb(255,166,0)]' : 
                      'bg-[rgb(var(--scb-american-green))]'
                    }`}
                    style={{ width: `${score}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Risk Exposure and Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Risk Exposure */}
          <div className="bg-white rounded-lg shadow-sm border border-[rgb(var(--scb-border))] overflow-hidden">
            <div className="px-6 py-4 border-b border-[rgb(var(--scb-border))]">
              <h2 className="text-lg font-medium text-[rgb(var(--scb-dark-gray))]">Risk Exposure by Category</h2>
            </div>
            <div className="p-4">
              <div className="divide-y divide-[rgb(var(--scb-border))]">
                {riskExposures.map((item, index) => (
                  <div key={index} className="py-3 flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-[rgb(var(--scb-dark-gray))]">{item.category}</span>
                        <span className="text-sm font-medium text-[rgb(var(--scb-dark-gray))]">{item.value}%</span>
                      </div>
                      <div className="h-1.5 bg-[rgba(var(--scb-light-gray),0.3)] rounded-full">
                        <div 
                          className="h-1.5 bg-[rgb(var(--scb-honolulu-blue))] rounded-full"
                          style={{ width: `${item.value}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className={`ml-6 flex items-center ${
                      item.change > 0 
                        ? 'text-[rgb(var(--scb-american-green))]' 
                        : 'text-[rgb(var(--scb-muted-red))]'
                    }`}>
                      {item.change > 0 ? (
                        <ArrowUp className="w-3 h-3 mr-1" />
                      ) : (
                        <ArrowDown className="w-3 h-3 mr-1" />
                      )}
                      <span className="text-xs font-medium">
                        {Math.abs(item.change)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 pt-3 border-t border-[rgb(var(--scb-border))]">
                <div className="flex justify-between">
                  <div className="text-xs text-[rgb(var(--scb-dark-gray))] opacity-70">
                    Source: Risk Management System • {new Date().toLocaleDateString()}
                  </div>
                  <button className="text-xs text-[rgb(var(--scb-honolulu-blue))] font-medium">
                    View All Categories
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Risk Alerts */}
          <div className="bg-white rounded-lg shadow-sm border border-[rgb(var(--scb-border))] overflow-hidden">
            <div className="px-6 py-4 border-b border-[rgb(var(--scb-border))] flex justify-between items-center">
              <h2 className="text-lg font-medium text-[rgb(var(--scb-dark-gray))]">Risk Alerts</h2>
              <div className="relative">
                <select 
                  className="scb-input py-1.5 pl-3 pr-8 text-sm rounded-md appearance-none"
                  defaultValue="all"
                >
                  <option value="all">All Alerts</option>
                  <option value="high">High Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="low">Low Priority</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[rgb(var(--scb-dark-gray))]" />
              </div>
            </div>
            <div className="p-4">
              <div className="divide-y divide-[rgb(var(--scb-border))]">
                {riskAlerts.map((alert) => (
                  <div key={alert.id} className="py-3">
                    <div className="flex items-start">
                      <div className={`p-1 rounded-full mt-0.5 ${
                        alert.type === 'high' ? 'bg-[rgba(var(--scb-muted-red),0.1)]' : 
                        alert.type === 'medium' ? 'bg-[rgba(255,166,0,0.1)]' : 
                        'bg-[rgba(var(--scb-american-green),0.1)]'
                      }`}>
                        <AlertTriangle className={`w-4 h-4 ${
                          alert.type === 'high' ? 'text-[rgb(var(--scb-muted-red))]' : 
                          alert.type === 'medium' ? 'text-[rgb(255,166,0)]' : 
                          'text-[rgb(var(--scb-american-green))]'
                        }`} />
                      </div>
                      <div className="ml-3 flex-1">
                        <div className="flex justify-between">
                          <h3 className="text-sm font-medium text-[rgb(var(--scb-dark-gray))]">{alert.title}</h3>
                          <span className="text-xs text-[rgb(var(--scb-dark-gray))] opacity-70">
                            {formatDate(alert.timestamp)}
                          </span>
                        </div>
                        <p className="text-xs text-[rgb(var(--scb-dark-gray))] mt-1">
                          {alert.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 pt-3 border-t border-[rgb(var(--scb-border))]">
                <button className="text-sm text-[rgb(var(--scb-honolulu-blue))] font-medium">
                  View All Alerts
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Risk Management Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-[rgb(var(--scb-border))] overflow-hidden">
          <div className="px-6 py-4 border-b border-[rgb(var(--scb-border))]">
            <h2 className="text-lg font-medium text-[rgb(var(--scb-dark-gray))]">Risk Management Actions</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[rgba(var(--scb-light-gray),0.3)] rounded-lg p-4 hover:bg-[rgba(var(--scb-light-gray),0.5)] transition-colors cursor-pointer">
                <div className="flex items-center mb-3">
                  <div className="p-2 rounded-md bg-[rgba(var(--scb-honolulu-blue),0.1)]">
                    <BarChart2 className="w-5 h-5 text-[rgb(var(--scb-honolulu-blue))]" />
                  </div>
                  <h3 className="ml-3 text-sm font-medium text-[rgb(var(--scb-dark-gray))]">Risk Reports</h3>
                </div>
                <p className="text-xs text-[rgb(var(--scb-dark-gray))]">
                  View and generate detailed risk analysis reports for your portfolio
                </p>
              </div>
              
              <div className="bg-[rgba(var(--scb-light-gray),0.3)] rounded-lg p-4 hover:bg-[rgba(var(--scb-light-gray),0.5)] transition-colors cursor-pointer">
                <div className="flex items-center mb-3">
                  <div className="p-2 rounded-md bg-[rgba(var(--scb-american-green),0.1)]">
                    <TrendingUp className="w-5 h-5 text-[rgb(var(--scb-american-green))]" />
                  </div>
                  <h3 className="ml-3 text-sm font-medium text-[rgb(var(--scb-dark-gray))]">Stress Tests</h3>
                </div>
                <p className="text-xs text-[rgb(var(--scb-dark-gray))]">
                  Run stress tests and scenario analyses on your portfolio
                </p>
              </div>
              
              <div className="bg-[rgba(var(--scb-light-gray),0.3)] rounded-lg p-4 hover:bg-[rgba(var(--scb-light-gray),0.5)] transition-colors cursor-pointer">
                <div className="flex items-center mb-3">
                  <div className="p-2 rounded-md bg-[rgba(var(--scb-muted-red),0.1)]">
                    <AlertTriangle className="w-5 h-5 text-[rgb(var(--scb-muted-red))]" />
                  </div>
                  <h3 className="ml-3 text-sm font-medium text-[rgb(var(--scb-dark-gray))]">Alert Settings</h3>
                </div>
                <p className="text-xs text-[rgb(var(--scb-dark-gray))]">
                  Configure risk alerts and notification thresholds
                </p>
              </div>
              
              <div className="bg-[rgba(var(--scb-light-gray),0.3)] rounded-lg p-4 hover:bg-[rgba(var(--scb-light-gray),0.5)] transition-colors cursor-pointer">
                <div className="flex items-center mb-3">
                  <div className="p-2 rounded-md bg-[rgba(0,0,0,0.05)]">
                    <PieChart className="w-5 h-5 text-[rgb(var(--scb-dark-gray))]" />
                  </div>
                  <h3 className="ml-3 text-sm font-medium text-[rgb(var(--scb-dark-gray))]">Risk Allocation</h3>
                </div>
                <p className="text-xs text-[rgb(var(--scb-dark-gray))]">
                  Adjust risk allocations and exposure limits
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Disclaimer */}
        <div className="bg-[rgba(var(--scb-light-gray),0.5)] border border-[rgba(var(--scb-border),0.7)] rounded-lg p-4 flex items-start gap-3">
          <Shield className="w-5 h-5 text-[rgb(var(--scb-honolulu-blue))] mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-[rgb(var(--scb-dark-gray))]">Risk Management Information</h3>
            <p className="text-xs text-[rgb(var(--scb-dark-gray))] mt-1">
              This dashboard provides a comprehensive overview of your risk metrics and exposures. For detailed risk analysis and compliance reporting, please contact your risk officer.
            </p>
          </div>
        </div>
      </div>
    </ScbBeautifulUI>
  );
}