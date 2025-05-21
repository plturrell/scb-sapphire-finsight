import React, { useState, useEffect } from 'react';
import ScbBeautifulUI from '@/components/ScbBeautifulUI';
import DataProductExplorer from '@/components/DataProductExplorer';
import EnhancedTouchButton from '@/components/EnhancedTouchButton';
import EnhancedLoadingSpinner from '@/components/EnhancedLoadingSpinner';
import useMultiTasking from '@/hooks/useMultiTasking';
import { useUIPreferences } from '@/context/UIPreferencesContext';
import { useMicroInteractions } from '@/hooks/useMicroInteractions';
import { haptics } from '@/lib/haptics';
import { useMediaQuery } from 'react-responsive';
import { Search, Filter, ArrowUpDown, Plus, Database, RefreshCw, DownloadCloud, Share2 } from 'lucide-react';

// Dummy data for demonstration
const dataProducts = [
  {
    id: 'dp-001',
    name: 'Company Data',
    description: 'General information about companies including financial data',
    type: 'Dataset',
    tables: 12,
    records: 4328,
    lastUpdated: '2025-05-10',
    category: 'Financial'
  },
  {
    id: 'dp-002',
    name: 'JournalEntry',
    description: 'Journal entry records with account postings and transaction details',
    type: 'Dataset',
    tables: 8,
    records: 12500,
    lastUpdated: '2025-05-15',
    category: 'Accounting'
  },
  {
    id: 'dp-003',
    name: 'CostCenter',
    description: 'Cost center data with allocations and resource assignments',
    type: 'Dataset',
    tables: 6,
    records: 824,
    lastUpdated: '2025-05-18',
    category: 'Controlling'
  },
  {
    id: 'dp-004',
    name: 'GeneralLedger',
    description: 'General ledger accounts with balances and transaction history',
    type: 'Dataset',
    tables: 10,
    records: 7652,
    lastUpdated: '2025-05-12',
    category: 'Accounting'
  },
  {
    id: 'dp-005',
    name: 'MonteCarloSimulation',
    description: 'Monte Carlo simulation input and output data',
    type: 'Model',
    tables: 3,
    records: 1200,
    lastUpdated: '2025-05-08',
    category: 'Analytics'
  }
];

const DataProductsPage: React.FC = () => {
  const [isMounted, setIsMounted] = useState(false);
  const [isPlatformDetected, setPlatformDetected] = useState(false);
  const [isAppleDevice, setIsAppleDevice] = useState(false);
  const [isIPad, setIsIPad] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Categories for filtering
  const categories = ['All', 'Financial', 'Accounting', 'Controlling', 'Analytics'];
  
  const isSmallScreen = useMediaQuery({ maxWidth: 768 });
  const { mode, isMultiTasking, orientation } = useMultiTasking();
  const { isDarkMode, preferences } = useUIPreferences();
  const { haptic } = useMicroInteractions();
  
  // Detect platform when component mounts
  useEffect(() => {
    setIsMounted(true);
    
    // Check if we're on an Apple platform
    const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    
    // Check if we're on iPad specifically
    const isIpad = /iPad/.test(navigator.userAgent) || 
      (navigator.platform === 'MacIntel' && 
      navigator.maxTouchPoints > 1 &&
      !navigator.userAgent.includes('iPhone'));
    
    setIsAppleDevice(isIOS);
    setIsIPad(isIpad);
    setPlatformDetected(true);
  }, []);
  
  // Filter data products based on search query and category
  const filteredProducts = dataProducts.filter(product => {
    const matchesSearch = 
      searchQuery === '' || 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesCategory = 
      !selectedCategory || 
      selectedCategory === 'All' ||
      product.category === selectedCategory;
      
    return matchesSearch && matchesCategory;
  });
  
  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };
  
  // Handle category selection with haptic feedback
  const handleCategorySelect = (category: string) => {
    // Provide haptic feedback on Apple devices
    if (isAppleDevice) {
      haptic({ intensity: 'light' });
    }
    
    setSelectedCategory(category === 'All' ? null : category);
  };
  
  // Handle creating a new data product
  const handleCreateNew = () => {
    // Provide haptic feedback on Apple devices
    if (isAppleDevice) {
      haptic({ intensity: 'medium' });
    }
    
    alert('This would open a modal to create a new data product');
  };
  
  // Handle refresh data products
  const handleRefresh = () => {
    if (isAppleDevice) {
      haptic({ intensity: 'medium' });
    }
    
    setIsRefreshing(true);
    
    // Simulate a data refresh
    setTimeout(() => {
      setIsRefreshing(false);
      
      // Success haptic feedback when complete
      if (isAppleDevice) {
        haptic({ intensity: 'heavy' });
      }
    }, 1500);
  };
  
  // Handle download export
  const handleDownload = () => {
    if (isAppleDevice) {
      haptic({ intensity: 'medium' });
    }
    
    alert('Downloading data products as CSV...');
  };
  
  // Handle share
  const handleShare = () => {
    if (isAppleDevice) {
      haptic({ intensity: 'medium' });
    }
    
    alert('Opening share dialog...');
  };
  
  return (
    <ScbBeautifulUI 
      showNewsBar={!isSmallScreen && !isMultiTasking} 
      pageTitle="Data Products" 
      showTabs={isAppleDevice}
    >
      <div className={`space-y-6 ${isMultiTasking && mode === 'slide-over' ? 'px-2' : ''}`}>
        <div className={`flex ${isMultiTasking && mode === 'slide-over' ? 'flex-col gap-3' : 'flex-col md:flex-row gap-4'} justify-between items-start md:items-center`}>
          <div>
            <h1 className={`${isMultiTasking && mode === 'slide-over' ? 'text-xl' : 'text-2xl'} font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Data Products</h1>
            <p className={`mt-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Browse and manage standard data products</p>
          </div>
          
          {/* Action Buttons */}
          <div className={`flex items-center ${isMultiTasking && mode === 'slide-over' ? 'gap-2 w-full justify-end' : 'gap-3'}`}>
            {isAppleDevice && isPlatformDetected ? (
              <>
                <EnhancedTouchButton
                  onClick={handleRefresh}
                  variant={isDarkMode ? "dark" : "secondary"}
                  size={isMultiTasking && mode === 'slide-over' ? 'xs' : 'sm'}
                  className="flex items-center gap-1"
                >
                  <RefreshCw className={`${isRefreshing ? 'animate-spin' : ''} ${isMultiTasking && mode === 'slide-over' ? 'w-3 h-3' : 'w-4 h-4'}`} />
                  {!isMultiTasking && <span>Refresh</span>}
                </EnhancedTouchButton>
                
                <EnhancedTouchButton
                  onClick={handleDownload}
                  variant={isDarkMode ? "dark" : "secondary"}
                  size={isMultiTasking && mode === 'slide-over' ? 'xs' : 'sm'}
                  className="flex items-center gap-1"
                >
                  <DownloadCloud className={`${isMultiTasking && mode === 'slide-over' ? 'w-3 h-3' : 'w-4 h-4'}`} />
                  {!isMultiTasking && <span>Export</span>}
                </EnhancedTouchButton>
                
                <EnhancedTouchButton
                  onClick={handleCreateNew}
                  variant="primary"
                  size={isMultiTasking && mode === 'slide-over' ? 'xs' : 'sm'}
                  className="flex items-center gap-1"
                >
                  <Plus className={`${isMultiTasking && mode === 'slide-over' ? 'w-3 h-3' : 'w-4 h-4'}`} />
                  <span>{isMultiTasking && mode === 'slide-over' ? 'New' : 'Create New'}</span>
                </EnhancedTouchButton>
              </>
            ) : (
              <>
                <button 
                  className={`px-3 py-1.5 rounded-md shadow-sm flex items-center gap-1.5 ${
                    isDarkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                  onClick={handleRefresh}
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
                
                <button 
                  className={`px-3 py-1.5 rounded-md shadow-sm flex items-center gap-1.5 ${
                    isDarkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                  onClick={handleDownload}
                >
                  <DownloadCloud className="w-4 h-4" />
                  Export
                </button>
                
                <button 
                  className="bg-blue-600 text-white px-4 py-2 rounded-md shadow-sm flex items-center gap-2 hover:bg-blue-700"
                  onClick={handleCreateNew}
                >
                  <Plus className="w-4 h-4" />
                  Create New
                </button>
              </>
            )}
          </div>
        </div>
        
        {/* Search and Filter */}
        <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-[rgb(var(--scb-border))]'} shadow-sm rounded-lg p-4 border`}>
          <div className={`flex ${isMultiTasking && mode === 'slide-over' ? 'flex-col gap-3' : 'flex-col md:flex-row gap-4'}`}>
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className={`${isMultiTasking && mode === 'slide-over' ? 'h-4 w-4' : 'h-5 w-5'} ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`} />
              </div>
              <input
                type="text"
                className={`block w-full ${isMultiTasking && mode === 'slide-over' ? 'text-sm pl-9 py-1.5' : 'pl-10 py-2'} pr-3 rounded-md ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-[rgb(var(--scb-honolulu-blue))] focus:border-[rgb(var(--scb-honolulu-blue))]'
                } border focus:outline-none focus:ring-2 transition-colors`}
                placeholder="Search data products..."
                value={searchQuery}
                onChange={handleSearchChange}
              />
            </div>
            
            <div className={`flex gap-2 overflow-x-auto ${isMultiTasking && mode === 'slide-over' ? 'pb-0.5' : 'pb-1'}`}>
              {categories.map(category => (
                isAppleDevice && isPlatformDetected ? (
                  <EnhancedTouchButton
                    key={category}
                    onClick={() => handleCategorySelect(category)}
                    variant={(category === 'All' && !selectedCategory) || category === selectedCategory ? 'primary' : isDarkMode ? 'dark' : 'secondary'}
                    size={isMultiTasking && mode === 'slide-over' ? 'xs' : 'sm'}
                    className="whitespace-nowrap"
                  >
                    {category}
                  </EnhancedTouchButton>
                ) : (
                  <button
                    key={category}
                    className={`px-3 py-2 rounded-md text-sm whitespace-nowrap ${
                      (category === 'All' && !selectedCategory) || category === selectedCategory
                        ? isDarkMode
                          ? 'bg-blue-900 text-blue-200'
                          : 'bg-blue-100 text-blue-800'
                        : isDarkMode
                          ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    } transition-colors`}
                    onClick={() => handleCategorySelect(category)}
                  >
                    {category}
                  </button>
                )
              ))}
            </div>
          </div>
        </div>
        
        {/* Data Products Explorer */}
        <DataProductExplorer 
          products={filteredProducts}
          isAppleDevice={isAppleDevice}
          isMultiTasking={isMultiTasking}
          multiTaskingMode={mode}
        />
      </div>
    </ScbBeautifulUI>
  );
};

export default DataProductsPage;