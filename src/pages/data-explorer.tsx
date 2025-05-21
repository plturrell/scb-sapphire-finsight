import React, { useState } from 'react';
import Head from 'next/head';
import { 
  Database, 
  Filter, 
  Download, 
  Search, 
  Grid, 
  List, 
  ChevronDown, 
  BarChart2, 
  PieChart, 
  LineChart,
  RefreshCw,
  Plus,
  Star,
  Info,
  FileText
} from 'lucide-react';
import ScbBeautifulUI from '@/components/ScbBeautifulUI';

// Sample data for data products
const dataProducts = [
  {
    id: 'dp-001',
    name: 'Global Market Indices',
    category: 'Financial Markets',
    lastUpdated: '2025-05-18T09:30:00Z',
    frequency: 'Real-time',
    size: '1.2 GB',
    favorited: true,
    description: 'Comprehensive dataset of global market indices with real-time updates and historical data'
  },
  {
    id: 'dp-002',
    name: 'Corporate Financial Statements',
    category: 'Company Analysis',
    lastUpdated: '2025-05-15T14:45:00Z',
    frequency: 'Quarterly',
    size: '4.7 GB',
    favorited: false,
    description: 'Quarterly and annual financial statements for all listed companies in major global exchanges'
  },
  {
    id: 'dp-003',
    name: 'Global Economic Indicators',
    category: 'Economics',
    lastUpdated: '2025-05-17T08:15:00Z',
    frequency: 'Monthly',
    size: '890 MB',
    favorited: true,
    description: 'Key economic indicators including GDP, inflation, employment, and trade data for major economies'
  },
  {
    id: 'dp-004',
    name: 'ESG Metrics and Ratings',
    category: 'Sustainability',
    lastUpdated: '2025-05-10T16:20:00Z',
    frequency: 'Monthly',
    size: '620 MB',
    favorited: false,
    description: 'Environmental, Social, and Governance metrics and ratings for global corporations'
  },
  {
    id: 'dp-005',
    name: 'Global Trade Data',
    category: 'International Trade',
    lastUpdated: '2025-05-12T11:10:00Z',
    frequency: 'Monthly',
    size: '3.1 GB',
    favorited: false,
    description: 'Import and export data by country, product category, and trading partners with historical trends'
  },
  {
    id: 'dp-006',
    name: 'Credit Ratings Database',
    category: 'Credit Analysis',
    lastUpdated: '2025-05-16T13:40:00Z',
    frequency: 'Weekly',
    size: '780 MB',
    favorited: true,
    description: 'Credit ratings and credit default risk metrics for corporate and sovereign debt'
  },
];

// Sample data for categories
const categories = [
  { id: 'all', name: 'All Categories', count: 28 },
  { id: 'financial', name: 'Financial Markets', count: 6 },
  { id: 'company', name: 'Company Analysis', count: 5 },
  { id: 'economics', name: 'Economics', count: 4 },
  { id: 'sustainability', name: 'Sustainability', count: 3 },
  { id: 'trade', name: 'International Trade', count: 5 },
  { id: 'credit', name: 'Credit Analysis', count: 3 },
  { id: 'alternative', name: 'Alternative Data', count: 2 },
];

export default function DataExplorer() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshData = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1200);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  // Filter products based on search and category
  const filteredProducts = dataProducts.filter(product => {
    const matchesSearch = searchQuery === '' || 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || 
      product.category.toLowerCase().includes(selectedCategory.toLowerCase());
    
    return matchesSearch && matchesCategory;
  });

  return (
    <ScbBeautifulUI pageTitle="Data Explorer" showNewsBar={false}>
      <Head>
        <title>Data Explorer | SCB Sapphire FinSight</title>
      </Head>

      <div className="space-y-6">
        {/* Search and Filter Bar */}
        <div className="bg-white rounded-lg shadow-sm border border-[rgb(var(--scb-border))] p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-[rgb(var(--scb-dark-gray))]" />
              </div>
              <input
                type="text"
                placeholder="Search data products..."
                className="scb-input pl-10 w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex gap-2">
              <div className="relative flex-shrink-0">
                <select
                  className="scb-input pl-3 pr-8 appearance-none"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name} ({category.count})
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                  <ChevronDown className="h-4 w-4 text-[rgb(var(--scb-dark-gray))]" />
                </div>
              </div>
              
              <button 
                onClick={() => setViewMode('grid')} 
                className={`p-2 rounded-md ${
                  viewMode === 'grid' 
                    ? 'bg-[rgba(var(--scb-honolulu-blue),0.1)] text-[rgb(var(--scb-honolulu-blue))]' 
                    : 'text-[rgb(var(--scb-dark-gray))]'
                }`}
              >
                <Grid className="h-5 w-5" />
              </button>
              
              <button 
                onClick={() => setViewMode('list')} 
                className={`p-2 rounded-md ${
                  viewMode === 'list' 
                    ? 'bg-[rgba(var(--scb-honolulu-blue),0.1)] text-[rgb(var(--scb-honolulu-blue))]' 
                    : 'text-[rgb(var(--scb-dark-gray))]'
                }`}
              >
                <List className="h-5 w-5" />
              </button>
              
              <button 
                onClick={refreshData}
                className={`p-2 rounded-md text-[rgb(var(--scb-dark-gray))]`}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>
        
        {/* Data Products Display */}
        <div className="bg-white rounded-lg shadow-sm border border-[rgb(var(--scb-border))] p-6">
          {filteredProducts.length === 0 ? (
            <div className="py-16 flex flex-col items-center">
              <Database className="h-12 w-12 text-[rgb(var(--scb-dark-gray))] opacity-20 mb-4" />
              <h3 className="text-lg font-medium text-[rgb(var(--scb-dark-gray))]">No data products found</h3>
              <p className="text-sm text-[rgb(var(--scb-dark-gray))] opacity-70 mt-1">
                Try adjusting your search or filters
              </p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map(product => (
                <div 
                  key={product.id} 
                  className="border border-[rgb(var(--scb-border))] rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="bg-[rgba(var(--scb-light-gray),0.3)] px-5 py-4 border-b border-[rgb(var(--scb-border))]">
                    <div className="flex justify-between">
                      <h3 className="text-base font-medium text-[rgb(var(--scb-dark-gray))]">{product.name}</h3>
                      <button className="text-[rgb(var(--scb-dark-gray))] hover:text-[rgb(var(--scb-honolulu-blue))]">
                        <Star className={`h-5 w-5 ${product.favorited ? 'fill-current text-[rgb(var(--scb-honolulu-blue))]' : ''}`} />
                      </button>
                    </div>
                    <div className="mt-1 text-xs text-[rgb(var(--scb-dark-gray))]">
                      {product.category}
                    </div>
                  </div>
                  
                  <div className="p-5">
                    <p className="text-sm text-[rgb(var(--scb-dark-gray))] mb-4">
                      {product.description}
                    </p>
                    
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="px-3 py-2 bg-[rgba(var(--scb-light-gray),0.3)] rounded-md">
                        <div className="text-xs text-[rgb(var(--scb-dark-gray))] opacity-70">Updated</div>
                        <div className="text-sm text-[rgb(var(--scb-dark-gray))]">
                          {formatDate(product.lastUpdated)}
                        </div>
                      </div>
                      
                      <div className="px-3 py-2 bg-[rgba(var(--scb-light-gray),0.3)] rounded-md">
                        <div className="text-xs text-[rgb(var(--scb-dark-gray))] opacity-70">Frequency</div>
                        <div className="text-sm text-[rgb(var(--scb-dark-gray))]">{product.frequency}</div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button className="flex-1 scb-btn scb-btn-primary text-sm py-2">
                        Explore Data
                      </button>
                      <button className="p-2 scb-btn-ghost border border-[rgb(var(--scb-border))]">
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="divide-y divide-[rgb(var(--scb-border))]">
              {filteredProducts.map(product => (
                <div key={product.id} className="py-4 flex flex-col sm:flex-row gap-4">
                  <div className="sm:flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center">
                          <h3 className="text-base font-medium text-[rgb(var(--scb-dark-gray))]">{product.name}</h3>
                          {product.favorited && (
                            <Star className="h-4 w-4 ml-2 fill-current text-[rgb(var(--scb-honolulu-blue))]" />
                          )}
                        </div>
                        <div className="mt-1 text-xs text-[rgb(var(--scb-dark-gray))]">
                          {product.category} • {product.size} • Updated {formatDate(product.lastUpdated)}
                        </div>
                      </div>
                      
                      <div className="sm:hidden flex space-x-2">
                        <button className="p-2 scb-btn-ghost border border-[rgb(var(--scb-border))] rounded-md">
                          <Info className="h-4 w-4" />
                        </button>
                        <button className="p-2 scb-btn-ghost border border-[rgb(var(--scb-border))] rounded-md">
                          <Download className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    
                    <p className="text-sm text-[rgb(var(--scb-dark-gray))] mt-2">
                      {product.description}
                    </p>
                  </div>
                  
                  <div className="hidden sm:flex sm:items-center sm:space-x-2">
                    <button className="scb-btn scb-btn-primary text-sm">
                      Explore
                    </button>
                    <button className="p-2 scb-btn-ghost border border-[rgb(var(--scb-border))] rounded-md">
                      <Info className="h-4 w-4" />
                    </button>
                    <button className="p-2 scb-btn-ghost border border-[rgb(var(--scb-border))] rounded-md">
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Data Visualization Samples */}
        <div className="bg-white rounded-lg shadow-sm border border-[rgb(var(--scb-border))] overflow-hidden">
          <div className="px-6 py-4 border-b border-[rgb(var(--scb-border))]">
            <h2 className="text-lg font-medium text-[rgb(var(--scb-dark-gray))]">Data Visualization Samples</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="border border-[rgb(var(--scb-border))] rounded-lg overflow-hidden">
                <div className="bg-[rgba(var(--scb-light-gray),0.3)] px-4 py-3 border-b border-[rgb(var(--scb-border))]">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-medium text-[rgb(var(--scb-dark-gray))]">Market Performance</h3>
                    <LineChart className="h-4 w-4 text-[rgb(var(--scb-honolulu-blue))]" />
                  </div>
                </div>
                <div className="p-4 flex items-center justify-center h-40 bg-[rgba(var(--scb-light-gray),0.1)]">
                  <div className="text-center">
                    <LineChart className="h-10 w-10 mx-auto text-[rgb(var(--scb-dark-gray))] opacity-30" />
                    <p className="text-xs text-[rgb(var(--scb-dark-gray))] mt-2">
                      Line chart visualization
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="border border-[rgb(var(--scb-border))] rounded-lg overflow-hidden">
                <div className="bg-[rgba(var(--scb-light-gray),0.3)] px-4 py-3 border-b border-[rgb(var(--scb-border))]">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-medium text-[rgb(var(--scb-dark-gray))]">Sector Allocation</h3>
                    <PieChart className="h-4 w-4 text-[rgb(var(--scb-american-green))]" />
                  </div>
                </div>
                <div className="p-4 flex items-center justify-center h-40 bg-[rgba(var(--scb-light-gray),0.1)]">
                  <div className="text-center">
                    <PieChart className="h-10 w-10 mx-auto text-[rgb(var(--scb-dark-gray))] opacity-30" />
                    <p className="text-xs text-[rgb(var(--scb-dark-gray))] mt-2">
                      Pie chart visualization
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="border border-[rgb(var(--scb-border))] rounded-lg overflow-hidden">
                <div className="bg-[rgba(var(--scb-light-gray),0.3)] px-4 py-3 border-b border-[rgb(var(--scb-border))]">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-medium text-[rgb(var(--scb-dark-gray))]">Economic Indicators</h3>
                    <BarChart2 className="h-4 w-4 text-[rgb(var(--scb-muted-red))]" />
                  </div>
                </div>
                <div className="p-4 flex items-center justify-center h-40 bg-[rgba(var(--scb-light-gray),0.1)]">
                  <div className="text-center">
                    <BarChart2 className="h-10 w-10 mx-auto text-[rgb(var(--scb-dark-gray))] opacity-30" />
                    <p className="text-xs text-[rgb(var(--scb-dark-gray))] mt-2">
                      Bar chart visualization
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 text-center">
              <button className="scb-btn scb-btn-primary flex items-center mx-auto">
                <Plus className="h-4 w-4 mr-2" />
                <span>Create New Visualization</span>
              </button>
            </div>
          </div>
        </div>
        
        {/* Documentation */}
        <div className="bg-[rgba(var(--scb-light-gray),0.5)] border border-[rgba(var(--scb-border),0.7)] rounded-lg p-4 flex items-start gap-3">
          <FileText className="w-5 h-5 text-[rgb(var(--scb-honolulu-blue))] mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-[rgb(var(--scb-dark-gray))]">Data Documentation</h3>
            <p className="text-xs text-[rgb(var(--scb-dark-gray))] mt-1">
              Access comprehensive documentation and schema information for all data products. For custom data extracts and API access, please contact your account representative.
            </p>
            <div className="mt-2">
              <button className="text-xs font-medium text-[rgb(var(--scb-honolulu-blue))]">
                View Documentation
              </button>
            </div>
          </div>
        </div>
      </div>
    </ScbBeautifulUI>
  );
}