import React, { useState, useEffect } from 'react';
import { Search, Database, AlertCircle, CheckCircle } from 'lucide-react';

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

export const DataProductExplorer: React.FC = () => {
  const [products, setProducts] = useState<DataProduct[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<DataProduct | null>(null);
  const [searchCriteria, setSearchCriteria] = useState({
    namespace: '',
    entityName: '',
    version: ''
  });
  const [loading, setLoading] = useState(false);
  const [health, setHealth] = useState<'healthy' | 'unhealthy' | 'unknown'>('unknown');

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

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Database size={24} />
            Data Product Explorer
          </h1>
          <div className="flex items-center gap-2">
            {health === 'healthy' ? (
              <CheckCircle className="text-green-500" size={20} />
            ) : health === 'unhealthy' ? (
              <AlertCircle className="text-red-500" size={20} />
            ) : null}
            <span className="text-sm text-gray-600">Redis Status: {health}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <input
            type="text"
            placeholder="Namespace"
            value={searchCriteria.namespace}
            onChange={(e) => setSearchCriteria({ ...searchCriteria, namespace: e.target.value })}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            placeholder="Entity Name"
            value={searchCriteria.entityName}
            onChange={(e) => setSearchCriteria({ ...searchCriteria, entityName: e.target.value })}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            placeholder="Version"
            value={searchCriteria.version}
            onChange={(e) => setSearchCriteria({ ...searchCriteria, version: e.target.value })}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          onClick={searchProducts}
          disabled={loading}
          className="w-full md:w-auto px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-center gap-2"
        >
          <Search size={20} />
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Search Results</h2>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {products.map((product) => (
              <div
                key={product.id}
                onClick={() => loadProduct(product)}
                className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div className="font-medium text-gray-900">{product.entityName}</div>
                <div className="text-sm text-gray-600">
                  {product.namespace} v{product.version}
                </div>
              </div>
            ))}
            {products.length === 0 && (
              <p className="text-gray-500 text-center py-8">No products found</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Product Details</h2>
          {selectedProduct ? (
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900">Entity Name</h3>
                <p className="text-gray-600">{selectedProduct.entityName}</p>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Namespace</h3>
                <p className="text-gray-600">{selectedProduct.namespace}</p>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Version</h3>
                <p className="text-gray-600">{selectedProduct.version}</p>
              </div>
              {selectedProduct.associations && selectedProduct.associations.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-900">Associations</h3>
                  <ul className="mt-2 space-y-1">
                    {selectedProduct.associations.map((assoc, idx) => (
                      <li key={idx} className="text-sm text-gray-600">
                        {assoc.from} → {assoc.to}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div>
                <h3 className="font-medium text-gray-900">Entity Data</h3>
                <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-x-auto">
                  {JSON.stringify(selectedProduct.entities, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">Select a product to view details</p>
          )}
        </div>
      </div>
    </div>
  );
};