import React from 'react';
import { Database, Server, Calendar, ChevronRight, ExternalLink } from 'lucide-react';
import { haptics } from '@/lib/haptics';
import EnhancedTouchButton from './EnhancedTouchButton';

interface DataProduct {
  id: string;
  name: string;
  description: string;
  type: string;
  tables: number;
  records: number;
  lastUpdated: string;
  category: string;
}

interface DataProductExplorerProps {
  products: DataProduct[];
  isAppleDevice?: boolean;
  isMultiTasking?: boolean;
  multiTaskingMode?: string;
}

const DataProductExplorer: React.FC<DataProductExplorerProps> = ({
  products,
  isAppleDevice = false,
  isMultiTasking = false,
  multiTaskingMode = 'fullscreen'
}) => {
  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // Handle product selection
  const handleProductSelect = (product: DataProduct) => {
    // Provide haptic feedback on Apple devices
    if (isAppleDevice) {
      haptics.selection();
    }
    
    // In a real app, this would navigate to the product detail page
    alert(`Viewing details for ${product.name}`);
  };
  
  // Handle view schema
  const handleViewSchema = (e: React.MouseEvent, productId: string) => {
    e.stopPropagation(); // Prevent triggering the parent card click
    
    // Provide haptic feedback on Apple devices
    if (isAppleDevice) {
      haptics.light();
    }
    
    // In a real app, this would open the schema viewer
    alert(`Viewing schema for product ID: ${productId}`);
  };

  return (
    <div>
      {products.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-12 text-center">
          <Database className="h-12 w-12 mx-auto text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No data products found</h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Try adjusting your search or filter criteria to find what you're looking for.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <div
              key={product.id}
              className={`
                bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden
                transition-transform duration-150
                ${isAppleDevice ? 'hover:scale-[1.02] active:scale-[0.98] cursor-pointer' : ''}
                ${isMultiTasking && multiTaskingMode === 'slide-over' ? 'p-3' : 'p-4'}
              `}
              onClick={() => handleProductSelect(product)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center">
                  <div className={`
                    rounded-md p-2 mr-3 
                    ${product.category === 'Financial' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300' : 
                     product.category === 'Accounting' ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-300' : 
                     product.category === 'Controlling' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300' : 
                     'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-300'}
                  `}>
                    <Database className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-medium text-gray-900 dark:text-white truncate">
                      {product.name}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {product.type} • {product.category}
                    </p>
                  </div>
                </div>
                
                <div className="text-gray-400 dark:text-gray-500">
                  <ChevronRight className="h-5 w-5" />
                </div>
              </div>
              
              <p className={`
                text-sm text-gray-600 dark:text-gray-300 mt-4 mb-3
                ${isMultiTasking && multiTaskingMode === 'slide-over' ? 'line-clamp-1' : 'line-clamp-2'}
              `}>
                {product.description}
              </p>
              
              <div className="grid grid-cols-3 gap-2 text-xs mt-3">
                <div className="flex flex-col">
                  <span className="text-gray-500 dark:text-gray-400">Tables</span>
                  <span className="font-medium text-gray-900 dark:text-white">{product.tables}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-gray-500 dark:text-gray-400">Records</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {product.records.toLocaleString()}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-gray-500 dark:text-gray-400">Updated</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatDate(product.lastUpdated)}
                  </span>
                </div>
              </div>
              
              <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
                {isAppleDevice ? (
                  <EnhancedTouchButton
                    variant="secondary"
                    label="View Schema"
                    iconLeft={<Server className="w-4 h-4" />}
                    onClick={(e) => handleViewSchema(e as React.MouseEvent, product.id)}
                    compact={true}
                    size="small"
                    fullWidth={false}
                  />
                ) : (
                  <button
                    className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1"
                    onClick={(e) => handleViewSchema(e, product.id)}
                  >
                    <Server className="h-4 w-4" />
                    View Schema
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DataProductExplorer;