import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Database, 
  AlertCircle, 
  CheckCircle, 
  RefreshCw, 
  ChevronRight, 
  HelpCircle,
  Info,
  Code,
  Layers,
  GitBranch,
  Filter,
  Download
} from 'lucide-react';
import EnhancedTouchButton from './EnhancedTouchButton';
import { EnhancedInlineSpinner } from './EnhancedLoadingSpinner';

interface DataProduct {
  id: string;
  namespace: string;
  version: string;
  entityName: string;
  entities: Record<string, any>;
  associations?: Array<{
    from: string;
    to: string;
  }>;
  metadata?: Record<string, any>;
}

export const EnhancedDataProductExplorer: React.FC = () => {
  const [products, setProducts] = useState<DataProduct[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<DataProduct | null>(null);
  const [searchCriteria, setSearchCriteria] = useState({
    namespace: '',
    entityName: '',
    version: ''
  });
  const [loading, setLoading] = useState(false);
  const [health, setHealth] = useState<'healthy' | 'unhealthy' | 'unknown'>('unknown');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    associations: true,
    entities: false
  });

  useEffect(() => {
    checkHealth();
  }, []);

  const checkHealth = async () => {
    try {
      const response = await fetch('/api/data-products/health');
      const data = await response.json();
      setHealth(data.status);
    } catch (error) {
      setHealth('unhealthy');
    }
  };

  const searchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchCriteria.namespace) params.append('namespace', searchCriteria.namespace);
      if (searchCriteria.entityName) params.append('entityName', searchCriteria.entityName);
      if (searchCriteria.version) params.append('version', searchCriteria.version);

      const response = await fetch(`/api/data-products/search?${params}`);
      const data = await response.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error('Error searching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProduct = async (product: DataProduct) => {
    try {
      const response = await fetch(
        `/api/data-products/${product.namespace}/${product.entityName}/${product.version}`
      );
      const data = await response.json();
      setSelectedProduct(data);
    } catch (error) {
      console.error('Error loading product:', error);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections({
      ...expandedSections,
      [section]: !expandedSections[section]
    });
  };

  const handleExport = () => {
    if (!selectedProduct) return;
    
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(selectedProduct, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `${selectedProduct.namespace}_${selectedProduct.entityName}_${selectedProduct.version}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-[rgb(var(--scb-american-green))]';
      case 'unhealthy':
        return 'text-[rgb(var(--scb-muted-red))]';
      default:
        return 'text-[rgb(var(--scb-dark-gray))]';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header with SCB styling */}
      <div className="fiori-tile p-5">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-[rgba(var(--scb-honolulu-blue),0.1)] flex items-center justify-center">
              <Database size={20} className="text-[rgb(var(--scb-honolulu-blue))]" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-[rgb(var(--scb-dark-gray))]">
                Data Product Explorer
              </h1>
              <p className="text-sm text-[rgb(var(--scb-dark-gray))] opacity-70">
                Browse and search data products in the Business Data Cloud
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
              health === 'healthy' 
                ? 'bg-[rgba(var(--scb-american-green),0.1)]' 
                : health === 'unhealthy'
                  ? 'bg-[rgba(var(--scb-muted-red),0.1)]'
                  : 'bg-[rgba(var(--scb-dark-gray),0.1)]'
            }`}>
              {health === 'healthy' ? (
                <CheckCircle className="text-[rgb(var(--scb-american-green))]" size={16} />
              ) : health === 'unhealthy' ? (
                <AlertCircle className="text-[rgb(var(--scb-muted-red))]" size={16} />
              ) : (
                <Info className="text-[rgb(var(--scb-dark-gray))]" size={16} />
              )}
              <span className={`text-xs font-medium ${getStatusColor(health)}`}>
                Redis Status: {health}
              </span>
            </div>
            
            <EnhancedTouchButton
              variant="ghost"
              size="sm"
              onClick={checkHealth}
              leftIcon={<RefreshCw className="w-4 h-4" />}
            >
              Refresh
            </EnhancedTouchButton>
          </div>
        </div>

        {/* Search panel with SCB styling */}
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="namespace" className="text-xs font-medium text-[rgb(var(--scb-dark-gray))]">
                Namespace
              </label>
              <div className="relative">
                <input
                  id="namespace"
                  type="text"
                  placeholder="e.g. BusinessArea_v1"
                  value={searchCriteria.namespace}
                  onChange={(e) => setSearchCriteria({ ...searchCriteria, namespace: e.target.value })}
                  className="fiori-input w-full pl-3 pr-10 py-2 text-sm"
                />
                <Code className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--scb-dark-gray))] opacity-50" />
              </div>
            </div>
            
            <div className="space-y-1.5">
              <label htmlFor="entityName" className="text-xs font-medium text-[rgb(var(--scb-dark-gray))]">
                Entity Name
              </label>
              <div className="relative">
                <input
                  id="entityName"
                  type="text"
                  placeholder="e.g. BusinessArea"
                  value={searchCriteria.entityName}
                  onChange={(e) => setSearchCriteria({ ...searchCriteria, entityName: e.target.value })}
                  className="fiori-input w-full pl-3 pr-10 py-2 text-sm"
                />
                <Layers className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--scb-dark-gray))] opacity-50" />
              </div>
            </div>
            
            <div className="space-y-1.5">
              <label htmlFor="version" className="text-xs font-medium text-[rgb(var(--scb-dark-gray))]">
                Version
              </label>
              <div className="relative">
                <input
                  id="version"
                  type="text"
                  placeholder="e.g. 1.0.0"
                  value={searchCriteria.version}
                  onChange={(e) => setSearchCriteria({ ...searchCriteria, version: e.target.value })}
                  className="fiori-input w-full pl-3 pr-10 py-2 text-sm"
                />
                <GitBranch className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--scb-dark-gray))] opacity-50" />
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-3">
            <EnhancedTouchButton
              variant="ghost"
              size="md"
              onClick={() => setSearchCriteria({ namespace: '', entityName: '', version: '' })}
              leftIcon={<Filter className="w-4 h-4" />}
            >
              Clear Filters
            </EnhancedTouchButton>
            
            <EnhancedTouchButton
              variant="primary"
              size="md"
              onClick={searchProducts}
              disabled={loading}
              leftIcon={loading ? <EnhancedInlineSpinner size="sm" /> : <Search className="w-4 h-4" />}
            >
              {loading ? 'Searching...' : 'Search Products'}
            </EnhancedTouchButton>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Search Results with SCB styling */}
        <div className="fiori-tile flex flex-col h-full">
          <div className="flex items-center justify-between border-b border-[rgb(var(--scb-border))] px-5 py-3">
            <h2 className="font-medium text-[rgb(var(--scb-dark-gray))]">Search Results</h2>
            <span className="text-xs text-[rgb(var(--scb-dark-gray))] bg-[rgba(var(--scb-light-gray),0.5)] px-2 py-0.5 rounded">
              {products.length} products
            </span>
          </div>
          
          <div className="flex-1 p-5 overflow-hidden">
            <div className="space-y-2.5 max-h-96 overflow-y-auto">
              {products.map((product) => (
                <div
                  key={product.id}
                  onClick={() => loadProduct(product)}
                  className={`p-3 border border-[rgb(var(--scb-border))] rounded-lg hover:bg-[rgba(var(--scb-light-gray),0.5)] cursor-pointer transition-colors ${
                    selectedProduct?.id === product.id ? 'bg-[rgba(var(--scb-honolulu-blue),0.05)] border-[rgb(var(--scb-honolulu-blue))]' : ''
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <div className="font-medium text-[rgb(var(--scb-dark-gray))]">{product.entityName}</div>
                      <div className="text-xs text-[rgb(var(--scb-dark-gray))] opacity-70 mt-0.5">
                        {product.namespace} <span className="font-medium">v{product.version}</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[rgb(var(--scb-dark-gray))] opacity-60" />
                  </div>
                </div>
              ))}
            </div>
            
            {products.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-14 h-14 rounded-full bg-[rgba(var(--scb-light-gray),0.2)] flex items-center justify-center mb-3">
                  <Search className="w-6 h-6 text-[rgb(var(--scb-dark-gray))] opacity-60" />
                </div>
                <p className="text-[rgb(var(--scb-dark-gray))] font-medium mb-1">No products found</p>
                <p className="text-xs text-[rgb(var(--scb-dark-gray))] opacity-70 max-w-xs">
                  Try adjusting your search criteria or use fewer filters
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Product Details with SCB styling */}
        <div className="fiori-tile flex flex-col h-full">
          <div className="flex items-center justify-between border-b border-[rgb(var(--scb-border))] px-5 py-3">
            <h2 className="font-medium text-[rgb(var(--scb-dark-gray))]">Product Details</h2>
            
            {selectedProduct && (
              <EnhancedTouchButton
                variant="ghost"
                size="xs"
                onClick={handleExport}
                leftIcon={<Download className="w-3.5 h-3.5" />}
              >
                Export
              </EnhancedTouchButton>
            )}
          </div>
          
          <div className="flex-1 p-5 overflow-auto">
            {selectedProduct ? (
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-3 bg-[rgba(var(--scb-light-gray),0.1)] border border-[rgb(var(--scb-border))] rounded">
                    <div className="text-xs text-[rgb(var(--scb-dark-gray))] opacity-70 mb-1">Entity Name</div>
                    <div className="text-sm font-medium text-[rgb(var(--scb-dark-gray))]">
                      {selectedProduct.entityName}
                    </div>
                  </div>
                  
                  <div className="p-3 bg-[rgba(var(--scb-light-gray),0.1)] border border-[rgb(var(--scb-border))] rounded">
                    <div className="text-xs text-[rgb(var(--scb-dark-gray))] opacity-70 mb-1">Namespace</div>
                    <div className="text-sm font-medium text-[rgb(var(--scb-dark-gray))]">
                      {selectedProduct.namespace}
                    </div>
                  </div>
                  
                  <div className="p-3 bg-[rgba(var(--scb-light-gray),0.1)] border border-[rgb(var(--scb-border))] rounded">
                    <div className="text-xs text-[rgb(var(--scb-dark-gray))] opacity-70 mb-1">Version</div>
                    <div className="text-sm font-medium text-[rgb(var(--scb-dark-gray))]">
                      {selectedProduct.version}
                    </div>
                  </div>
                </div>
                
                {selectedProduct.associations && selectedProduct.associations.length > 0 && (
                  <div className="border border-[rgb(var(--scb-border))] rounded overflow-hidden">
                    <div 
                      className="flex items-center justify-between p-3 bg-[rgba(var(--scb-light-gray),0.2)] cursor-pointer"
                      onClick={() => toggleSection('associations')}
                    >
                      <div className="flex items-center gap-2">
                        <GitBranch className="w-4 h-4 text-[rgb(var(--scb-honolulu-blue))]" />
                        <h3 className="font-medium text-[rgb(var(--scb-dark-gray))]">Associations</h3>
                        <span className="text-xs font-medium bg-[rgba(var(--scb-honolulu-blue),0.1)] text-[rgb(var(--scb-honolulu-blue))] px-1.5 py-0.5 rounded">
                          {selectedProduct.associations.length}
                        </span>
                      </div>
                      <ChevronRight 
                        className={`w-4 h-4 text-[rgb(var(--scb-dark-gray))] transition-transform ${
                          expandedSections.associations ? 'rotate-90' : ''
                        }`} 
                      />
                    </div>
                    
                    {expandedSections.associations && (
                      <div className="p-3 text-sm">
                        <ul className="space-y-1.5">
                          {selectedProduct.associations.map((assoc, idx) => (
                            <li key={idx} className="flex items-center gap-2 text-sm text-[rgb(var(--scb-dark-gray))]">
                              <div className="w-1.5 h-1.5 rounded-full bg-[rgb(var(--scb-honolulu-blue))] opacity-70"></div>
                              <span>{assoc.from}</span>
                              <ChevronRight className="w-3 h-3 text-[rgb(var(--scb-dark-gray))] opacity-60" />
                              <span>{assoc.to}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="border border-[rgb(var(--scb-border))] rounded overflow-hidden">
                  <div 
                    className="flex items-center justify-between p-3 bg-[rgba(var(--scb-light-gray),0.2)] cursor-pointer"
                    onClick={() => toggleSection('entities')}
                  >
                    <div className="flex items-center gap-2">
                      <Code className="w-4 h-4 text-[rgb(var(--scb-honolulu-blue))]" />
                      <h3 className="font-medium text-[rgb(var(--scb-dark-gray))]">Entity Data</h3>
                    </div>
                    <ChevronRight 
                      className={`w-4 h-4 text-[rgb(var(--scb-dark-gray))] transition-transform ${
                        expandedSections.entities ? 'rotate-90' : ''
                      }`} 
                    />
                  </div>
                  
                  {expandedSections.entities && (
                    <pre className="p-4 bg-[rgba(var(--scb-light-gray),0.05)] text-xs text-[rgb(var(--scb-dark-gray))] font-mono overflow-x-auto">
                      {JSON.stringify(selectedProduct.entities, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center h-full">
                <div className="w-14 h-14 rounded-full bg-[rgba(var(--scb-light-gray),0.2)] flex items-center justify-center mb-3">
                  <HelpCircle className="w-6 h-6 text-[rgb(var(--scb-dark-gray))] opacity-60" />
                </div>
                <p className="text-[rgb(var(--scb-dark-gray))] font-medium mb-1">No product selected</p>
                <p className="text-xs text-[rgb(var(--scb-dark-gray))] opacity-70 max-w-xs">
                  Select a product from the results list to view its details
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};