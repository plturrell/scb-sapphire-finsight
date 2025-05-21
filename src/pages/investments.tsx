import React, { useState, useEffect } from 'react';
import ScbBeautifulUI from '@/components/ScbBeautifulUI';
import { useUIPreferences } from '@/context/UIPreferencesContext';
import MetricCard from '@/components/MetricCard';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { RefreshCw, Info, Filter, Download, Share2 } from 'lucide-react';
import EnhancedTouchButton from '@/components/EnhancedTouchButton';

// Sample investment data
const investmentAllocationData = [
  { name: 'Equities', value: 45, color: '#0072AA' },
  { name: 'Fixed Income', value: 30, color: '#21AA47' },
  { name: 'Alternatives', value: 15, color: '#D13732' },
  { name: 'Cash', value: 10, color: '#FFCC00' },
];

const investmentPerformanceData = [
  { month: 'Jan', returns: 2.4, benchmark: 2.1 },
  { month: 'Feb', returns: -1.2, benchmark: -0.8 },
  { month: 'Mar', returns: 3.5, benchmark: 3.0 },
  { month: 'Apr', returns: 1.8, benchmark: 1.5 },
  { month: 'May', returns: 2.2, benchmark: 2.3 },
  { month: 'Jun', returns: 0.5, benchmark: 0.7 },
  { month: 'Jul', returns: 3.1, benchmark: 2.9 },
  { month: 'Aug', returns: -0.3, benchmark: -0.2 },
];

const topHoldingsData = [
  { name: 'AAPL', value: 18500, change: 3.2, sector: 'Technology' },
  { name: 'MSFT', value: 15200, change: 1.8, sector: 'Technology' },
  { name: 'AMZN', value: 12700, change: -0.5, sector: 'Consumer' },
  { name: 'GOOGL', value: 11200, change: 2.1, sector: 'Technology' },
  { name: 'BRK.B', value: 10500, change: 0.9, sector: 'Financials' },
];

const marketInsights = [
  { id: 1, title: 'Global Market Volatility Increasing', date: 'Today', urgent: true },
  { id: 2, title: 'Central Bank Policy Shifts Expected', date: 'Yesterday' },
  { id: 3, title: 'ESG Investments Outperforming Market', date: '2 days ago' },
  { id: 4, title: 'Emerging Markets: New Opportunities', date: '3 days ago' },
];

export default function Investments() {
  const { isDarkMode, preferences } = useUIPreferences();
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1500);
  };
  
  return (
    <ScbBeautifulUI pageTitle="Investment Portfolio">
      <div className="space-y-6">
        {/* Header with controls */}
        <div className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-4 rounded-lg ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border`}>
          <div>
            <h1 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Investment Portfolio</h1>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Comprehensive view of your investment assets and performance</p>
          </div>
          
          <div className="flex items-center gap-2">
            <EnhancedTouchButton
              onClick={handleRefresh}
              variant={isDarkMode ? "dark" : "secondary"}
              size="sm"
              className="flex items-center gap-1"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </EnhancedTouchButton>
            
            <EnhancedTouchButton
              variant={isDarkMode ? "dark" : "secondary"}
              size="sm"
              className="flex items-center gap-1"
            >
              <Filter className="h-4 w-4" />
              <span>Filter</span>
            </EnhancedTouchButton>
          </div>
        </div>
        
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total Portfolio Value"
            value={2345670}
            change={2.8}
            period="This Month"
            format="currency"
          />
          <MetricCard
            title="YTD Return"
            value={8.7}
            change={1.2}
            period="vs Benchmark 7.5%"
            format="percentage"
          />
          <MetricCard
            title="Dividend Yield"
            value={3.2}
            change={0.3}
            period="vs Last Year"
            format="percentage"
          />
          <MetricCard
            title="Risk Score"
            value={62}
            change={-3}
            period="Moderate"
            format="number"
          />
        </div>
        
        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Asset Allocation */}
          <div className={`rounded-lg ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border shadow-sm overflow-hidden`}>
            <div className={`px-4 py-3 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} flex justify-between items-center`}>
              <h3 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Asset Allocation</h3>
              <EnhancedTouchButton
                variant="ghost"
                size="xs"
                className={`${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}
              >
                <Info className="h-4 w-4" />
              </EnhancedTouchButton>
            </div>
            <div className="p-4">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={investmentAllocationData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}%`}
                    >
                      {investmentAllocationData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => `${value}%`}
                      contentStyle={{
                        borderRadius: 4,
                        backgroundColor: isDarkMode ? '#1f2937' : 'white',
                        borderColor: isDarkMode ? '#374151' : '#e5e7eb',
                        color: isDarkMode ? 'white' : 'black'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              <div className="mt-4 flex flex-wrap justify-center gap-3">
                {investmentAllocationData.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                    <span className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {item.name}: {item.value}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Performance Chart */}
          <div className={`rounded-lg ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border shadow-sm overflow-hidden`}>
            <div className={`px-4 py-3 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} flex justify-between items-center`}>
              <h3 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Performance vs Benchmark</h3>
              <div className="flex items-center gap-2">
                <EnhancedTouchButton
                  variant="ghost"
                  size="xs"
                  className={`${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}
                >
                  <Download className="h-4 w-4" />
                </EnhancedTouchButton>
                <EnhancedTouchButton
                  variant="ghost"
                  size="xs"
                  className={`${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}
                >
                  <Share2 className="h-4 w-4" />
                </EnhancedTouchButton>
              </div>
            </div>
            <div className="p-4">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={investmentPerformanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} />
                    <XAxis 
                      dataKey="month" 
                      tick={{ fill: isDarkMode ? '#9ca3af' : '#6b7280' }}
                    />
                    <YAxis 
                      tickFormatter={(value) => `${value}%`}
                      tick={{ fill: isDarkMode ? '#9ca3af' : '#6b7280' }}
                    />
                    <Tooltip 
                      formatter={(value) => `${value}%`}
                      contentStyle={{
                        borderRadius: 4,
                        backgroundColor: isDarkMode ? '#1f2937' : 'white',
                        borderColor: isDarkMode ? '#374151' : '#e5e7eb',
                        color: isDarkMode ? 'white' : 'black'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="returns" 
                      name="Portfolio" 
                      stroke="#0072AA" 
                      strokeWidth={2}
                      activeDot={{ r: 6 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="benchmark" 
                      name="Benchmark" 
                      stroke="#21AA47" 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              
              <div className="mt-4 flex justify-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#0072AA]"></div>
                  <span className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Portfolio</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#21AA47]"></div>
                  <span className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Benchmark</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Top Holdings */}
        <div className={`rounded-lg ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border shadow-sm overflow-hidden`}>
          <div className={`px-4 py-3 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <h3 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Top Holdings</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={`text-xs ${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-50 text-gray-500'}`}>
                <tr>
                  <th className="px-4 py-2 text-left">Security</th>
                  <th className="px-4 py-2 text-left">Sector</th>
                  <th className="px-4 py-2 text-right">Value</th>
                  <th className="px-4 py-2 text-right">Daily Change</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                {topHoldingsData.map((holding) => (
                  <tr key={holding.name} className={`${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
                    <td className={`px-4 py-3 font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{holding.name}</td>
                    <td className={`px-4 py-3 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>{holding.sector}</td>
                    <td className={`px-4 py-3 text-right ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                      ${holding.value.toLocaleString()}
                    </td>
                    <td className={`px-4 py-3 text-right text-sm font-medium ${
                      holding.change >= 0 
                        ? 'text-green-500' 
                        : 'text-red-500'
                    }`}>
                      {holding.change >= 0 ? '+' : ''}{holding.change}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Market Insights */}
        <div className={`rounded-lg ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border shadow-sm overflow-hidden`}>
          <div className={`px-4 py-3 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <h3 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Market Insights</h3>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {marketInsights.map((insight) => (
              <div key={insight.id} className={`flex items-center justify-between p-4 ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
                <div className="flex items-start gap-3">
                  {insight.urgent && (
                    <div className={`${isDarkMode ? 'bg-red-900/20' : 'bg-red-100'} p-1.5 rounded-full`}>
                      <Info className="h-4 w-4 text-red-500" />
                    </div>
                  )}
                  <div>
                    <h4 className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{insight.title}</h4>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{insight.date}</p>
                  </div>
                </div>
                <EnhancedTouchButton
                  variant={isDarkMode ? "dark" : "secondary"}
                  size="xs"
                >
                  View Details
                </EnhancedTouchButton>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ScbBeautifulUI>
  );
}