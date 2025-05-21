import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { ChevronDown, Filter, RefreshCw, ArrowUp, ArrowDown, Settings, Download, AlertTriangle } from 'lucide-react';
import ScbBeautifulUI from '@/components/ScbBeautifulUI';
import { useIOS } from '@/hooks/useResponsive';
import { useDeviceCapabilities } from '@/hooks/useDeviceCapabilities';
import { useMicroInteractions } from '@/hooks/useMicroInteractions';
import { useSFSymbolsSupport } from '@/lib/sf-symbols';
import SFSymbol from '@/components/SFSymbol';
import EnhancedTradingNavigation from '@/components/EnhancedTradingNavigation';
import { useUIPreferences } from '@/context/UIPreferencesContext';

// Trading page for SCB Sapphire FinSight
export default function Trading() {
  const [orderType, setOrderType] = useState('market');
  const [marketView, setMarketView] = useState('main');
  const [isLoading, setIsLoading] = useState(false);
  
  // Platform detection and UI enhancement hooks
  const isAppleDevice = useIOS();
  const [isPlatformDetected, setIsPlatformDetected] = useState(false);
  const { haptic } = useMicroInteractions();
  const { touchCapable } = useDeviceCapabilities();
  const { isDarkMode } = useUIPreferences();
  const { supported: sfSymbolsSupported } = useSFSymbolsSupport();
  
  // Market view categories with SF Symbols icons
  const marketCategories = [
    { id: 'main', label: 'Main Markets', icon: 'chart.bar.fill', badge: '4' },
    { id: 'forex', label: 'Forex', icon: 'dollarsign.circle.fill', badge: '6' },
    { id: 'crypto', label: 'Crypto', icon: 'bitcoinsign.circle.fill', badge: '5' },
    { id: 'commodities', label: 'Commodities', icon: 'chart.line.uptrend.xyaxis.fill', badge: '3' },
    { id: 'bonds', label: 'Bonds', icon: 'banknote.fill', badge: '2' },
    { id: 'futures', label: 'Futures', icon: 'timer', badge: null }
  ];
  
  // Platform detection effect
  useEffect(() => {
    setIsPlatformDetected(true);
  }, []);

  const refreshMarketData = () => {
    // Provide haptic feedback on Apple devices
    if (isAppleDevice) {
      haptic({ intensity: 'medium' });
    }
    
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
    }, 1500);
  };
  
  // Handle market view change
  const handleMarketViewChange = (view: string) => {
    // Provide haptic feedback on Apple devices
    if (isAppleDevice) {
      haptic({ intensity: 'light' });
    }
    
    setMarketView(view);
  };
  
  // Enhanced Trading Navigation component selector based on device and platform
  const renderTradingNavigation = () => {
    // Classic dropdown for non-Apple devices
    if (!isAppleDevice || !isPlatformDetected) {
      return (
        <div className="relative">
          <select 
            value={marketView}
            onChange={(e) => handleMarketViewChange(e.target.value)}
            className="scb-input py-1.5 pl-3 pr-8 text-sm rounded-md dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
          >
            {marketCategories.map((category) => (
              <option key={category.id} value={category.id}>{category.label}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[rgb(var(--scb-dark-gray))] dark:text-gray-300" />
        </div>
      );
    }
    
    // Enhanced navigation based on platform detection
    return (
      <EnhancedTradingNavigation
        categories={marketCategories}
        activeCategory={marketView}
        onCategoryChange={handleMarketViewChange}
        variant="circle"
        className="mb-2"
      />
    );
  };

  return (
    <ScbBeautifulUI pageTitle="Trading Desk" showNewsBar={true}>
      <Head>
        <title>Trading Desk | SCB Sapphire FinSight</title>
      </Head>

      <div className="space-y-6">
        {/* Market Overview Panel */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-[rgb(var(--scb-border))] dark:border-gray-700 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[rgb(var(--scb-border))] dark:border-gray-700">
            <h2 className="text-lg font-medium text-[rgb(var(--scb-dark-gray))] dark:text-gray-200">Market Overview</h2>
            <div className="flex items-center gap-2">
              <button 
                onClick={refreshMarketData}
                className="scb-btn-ghost p-2 rounded-full hover:bg-[rgba(var(--scb-light-gray),0.5)] dark:hover:bg-gray-700 transition-colors"
                disabled={isLoading}
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
              
              {/* Only show dropdown when SF Symbols are not available */}
              {(!isAppleDevice || !isPlatformDetected || !sfSymbolsSupported) && (
                <div className="relative">
                  <select 
                    value={marketView}
                    onChange={(e) => handleMarketViewChange(e.target.value)}
                    className="scb-input py-1.5 pl-3 pr-8 text-sm rounded-md dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
                  >
                    <option value="main">Main Markets</option>
                    <option value="forex">Forex</option>
                    <option value="crypto">Crypto</option>
                    <option value="commodities">Commodities</option>
                    <option value="bonds">Bonds</option>
                    <option value="futures">Futures</option>
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[rgb(var(--scb-dark-gray))] dark:text-gray-300" />
                </div>
              )}
            </div>
          </div>
          
          {/* SF Symbols Market Navigation */}
          {isAppleDevice && isPlatformDetected && sfSymbolsSupported && (
            <SFSymbolsMarketNavigation />
          )}
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Market indices cards */}
              <div className="p-4 rounded-md border border-[rgb(var(--scb-border))] bg-[rgba(var(--scb-light-gray),0.3)]">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xs text-[rgb(var(--scb-dark-gray))] font-medium">S&P 500</h3>
                    <p className="text-xl font-bold">4,532.12</p>
                  </div>
                  <div className="flex items-center text-[rgb(var(--scb-american-green))]">
                    <ArrowUp className="w-4 h-4 mr-1" />
                    <span className="text-sm font-medium">1.4%</span>
                  </div>
                </div>
                <div className="mt-2">
                  <div className="h-1 bg-[rgba(var(--scb-american-green),0.2)] rounded-full">
                    <div className="h-1 bg-[rgb(var(--scb-american-green))] rounded-full" style={{ width: '70%' }}></div>
                  </div>
                </div>
              </div>
              
              <div className="p-4 rounded-md border border-[rgb(var(--scb-border))] bg-[rgba(var(--scb-light-gray),0.3)]">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xs text-[rgb(var(--scb-dark-gray))] font-medium">NASDAQ</h3>
                    <p className="text-xl font-bold">14,239.88</p>
                  </div>
                  <div className="flex items-center text-[rgb(var(--scb-american-green))]">
                    <ArrowUp className="w-4 h-4 mr-1" />
                    <span className="text-sm font-medium">1.8%</span>
                  </div>
                </div>
                <div className="mt-2">
                  <div className="h-1 bg-[rgba(var(--scb-american-green),0.2)] rounded-full">
                    <div className="h-1 bg-[rgb(var(--scb-american-green))] rounded-full" style={{ width: '80%' }}></div>
                  </div>
                </div>
              </div>
              
              <div className="p-4 rounded-md border border-[rgb(var(--scb-border))] bg-[rgba(var(--scb-light-gray),0.3)]">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xs text-[rgb(var(--scb-dark-gray))] font-medium">FTSE 100</h3>
                    <p className="text-xl font-bold">7,245.86</p>
                  </div>
                  <div className="flex items-center text-[rgb(var(--scb-muted-red))]">
                    <ArrowDown className="w-4 h-4 mr-1" />
                    <span className="text-sm font-medium">0.3%</span>
                  </div>
                </div>
                <div className="mt-2">
                  <div className="h-1 bg-[rgba(var(--scb-muted-red),0.2)] rounded-full">
                    <div className="h-1 bg-[rgb(var(--scb-muted-red))] rounded-full" style={{ width: '30%' }}></div>
                  </div>
                </div>
              </div>
              
              <div className="p-4 rounded-md border border-[rgb(var(--scb-border))] bg-[rgba(var(--scb-light-gray),0.3)]">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xs text-[rgb(var(--scb-dark-gray))] font-medium">Nikkei 225</h3>
                    <p className="text-xl font-bold">28,545.68</p>
                  </div>
                  <div className="flex items-center text-[rgb(var(--scb-american-green))]">
                    <ArrowUp className="w-4 h-4 mr-1" />
                    <span className="text-sm font-medium">0.9%</span>
                  </div>
                </div>
                <div className="mt-2">
                  <div className="h-1 bg-[rgba(var(--scb-american-green),0.2)] rounded-full">
                    <div className="h-1 bg-[rgb(var(--scb-american-green))] rounded-full" style={{ width: '60%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Trading Platform */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Form */}
          <div className="bg-white rounded-lg shadow-sm border border-[rgb(var(--scb-border))] overflow-hidden">
            <div className="px-6 py-4 border-b border-[rgb(var(--scb-border))]">
              <h2 className="text-lg font-medium text-[rgb(var(--scb-dark-gray))]">New Order</h2>
            </div>
            <div className="p-6">
              <form className="space-y-4">
                <div>
                  <label className="block text-sm text-[rgb(var(--scb-dark-gray))] mb-1">Symbol</label>
                  <input type="text" placeholder="e.g. AAPL" className="scb-input w-full" />
                </div>
                
                <div>
                  <label className="block text-sm text-[rgb(var(--scb-dark-gray))] mb-1">Order Type</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setOrderType('market')}
                      className={`py-2 px-4 rounded-md text-sm ${
                        orderType === 'market' 
                          ? 'bg-[rgb(var(--scb-honolulu-blue))] text-white' 
                          : 'bg-[rgba(var(--scb-light-gray),0.5)] text-[rgb(var(--scb-dark-gray))]'
                      }`}
                    >
                      Market
                    </button>
                    <button
                      type="button"
                      onClick={() => setOrderType('limit')}
                      className={`py-2 px-4 rounded-md text-sm ${
                        orderType === 'limit' 
                          ? 'bg-[rgb(var(--scb-honolulu-blue))] text-white' 
                          : 'bg-[rgba(var(--scb-light-gray),0.5)] text-[rgb(var(--scb-dark-gray))]'
                      }`}
                    >
                      Limit
                    </button>
                  </div>
                </div>
                
                {orderType === 'limit' && (
                  <div>
                    <label className="block text-sm text-[rgb(var(--scb-dark-gray))] mb-1">Limit Price</label>
                    <input type="number" step="0.01" className="scb-input w-full" />
                  </div>
                )}
                
                <div>
                  <label className="block text-sm text-[rgb(var(--scb-dark-gray))] mb-1">Quantity</label>
                  <input type="number" className="scb-input w-full" />
                </div>
                
                <div className="pt-4 flex gap-4">
                  <button
                    type="button"
                    className="flex-1 py-2 px-4 bg-[rgb(var(--scb-american-green))] text-white rounded-md hover:bg-[rgba(var(--scb-american-green),0.9)] transition-colors"
                  >
                    Buy
                  </button>
                  <button
                    type="button"
                    className="flex-1 py-2 px-4 bg-[rgb(var(--scb-muted-red))] text-white rounded-md hover:bg-[rgba(var(--scb-muted-red),0.9)] transition-colors"
                  >
                    Sell
                  </button>
                </div>
              </form>
            </div>
          </div>
          
          {/* Watchlist */}
          <div className="bg-white rounded-lg shadow-sm border border-[rgb(var(--scb-border))] overflow-hidden lg:col-span-2">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[rgb(var(--scb-border))]">
              <h2 className="text-lg font-medium text-[rgb(var(--scb-dark-gray))]">Watchlist</h2>
              <div className="flex items-center gap-2">
                <button className="scb-btn-ghost p-2 rounded-full hover:bg-[rgba(var(--scb-light-gray),0.5)] transition-colors">
                  <Filter className="w-4 h-4" />
                </button>
                <button className="scb-btn-ghost p-2 rounded-full hover:bg-[rgba(var(--scb-light-gray),0.5)] transition-colors">
                  <Settings className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[rgba(var(--scb-light-gray),0.5)] border-b border-[rgb(var(--scb-border))]">
                    <th className="px-6 py-3 text-left text-xs font-medium text-[rgb(var(--scb-dark-gray))] uppercase tracking-wider">Symbol</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[rgb(var(--scb-dark-gray))] uppercase tracking-wider">Last Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[rgb(var(--scb-dark-gray))] uppercase tracking-wider">Change</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[rgb(var(--scb-dark-gray))] uppercase tracking-wider">Change %</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[rgb(var(--scb-dark-gray))] uppercase tracking-wider">Volume</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgb(var(--scb-border))]">
                  <tr className="hover:bg-[rgba(var(--scb-light-gray),0.3)]">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[rgb(var(--scb-dark-gray))]">AAPL</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[rgb(var(--scb-dark-gray))]">176.45</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[rgb(var(--scb-american-green))]">+2.34</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[rgb(var(--scb-american-green))]">+1.34%</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[rgb(var(--scb-dark-gray))]">45.2M</td>
                  </tr>
                  <tr className="hover:bg-[rgba(var(--scb-light-gray),0.3)]">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[rgb(var(--scb-dark-gray))]">MSFT</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[rgb(var(--scb-dark-gray))]">354.74</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[rgb(var(--scb-american-green))]">+4.21</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[rgb(var(--scb-american-green))]">+1.20%</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[rgb(var(--scb-dark-gray))]">22.8M</td>
                  </tr>
                  <tr className="hover:bg-[rgba(var(--scb-light-gray),0.3)]">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[rgb(var(--scb-dark-gray))]">GOOGL</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[rgb(var(--scb-dark-gray))]">142.30</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[rgb(var(--scb-muted-red))]">-0.87</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[rgb(var(--scb-muted-red))]">-0.61%</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[rgb(var(--scb-dark-gray))]">18.5M</td>
                  </tr>
                  <tr className="hover:bg-[rgba(var(--scb-light-gray),0.3)]">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[rgb(var(--scb-dark-gray))]">AMZN</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[rgb(var(--scb-dark-gray))]">178.25</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[rgb(var(--scb-american-green))]">+3.12</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[rgb(var(--scb-american-green))]">+1.78%</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[rgb(var(--scb-dark-gray))]">30.1M</td>
                  </tr>
                  <tr className="hover:bg-[rgba(var(--scb-light-gray),0.3)]">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[rgb(var(--scb-dark-gray))]">TSLA</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[rgb(var(--scb-dark-gray))]">245.61</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[rgb(var(--scb-american-green))]">+5.78</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[rgb(var(--scb-american-green))]">+2.41%</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[rgb(var(--scb-dark-gray))]">56.7M</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
        {/* Disclaimer */}
        <div className="bg-[rgba(var(--scb-light-gray),0.5)] border border-[rgba(var(--scb-dark-gray),0.1)] rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-[rgb(var(--scb-dark-gray))] mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-[rgb(var(--scb-dark-gray))]">Trading Disclaimer</h3>
            <p className="text-xs text-[rgb(var(--scb-dark-gray))] mt-1">
              This demo shows example data only. All information presented is for illustrative purposes and does not constitute financial advice. Actual trading functionality is not implemented in this demo.
            </p>
          </div>
        </div>
      </div>
    </ScbBeautifulUI>
  );
}