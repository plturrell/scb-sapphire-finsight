import React, { useEffect, useState } from 'react';
import { Database, Server, Calendar, ChevronRight, ExternalLink, Share2 } from 'lucide-react';
import { haptics } from '@/lib/haptics';
import EnhancedTouchButton from './EnhancedTouchButton';
import { useUIPreferences } from '@/context/UIPreferencesContext';
import { useMicroInteractions } from '@/hooks/useMicroInteractions';

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
  multiTaskingMode?: 'full' | 'split-view' | 'slide-over' | string;
  orientation?: 'portrait' | 'landscape';
}

const DataProductExplorer: React.FC<DataProductExplorerProps> = ({
  products,
  isAppleDevice = false,
  isMultiTasking = false,
  multiTaskingMode = 'full',
  orientation = 'portrait'
}) => {
  // Get UI preferences for dark mode
  const { isDarkMode, preferences } = useUIPreferences();
  const { haptic } = useMicroInteractions();
  const [isSafeAreaInset, setIsSafeAreaInset] = useState(false);

  // Check for iOS safe area insets (notch/home indicator) for better layout
  useEffect(() => {
    if (isAppleDevice) {
      // Check for environment with safe area insets (notches, etc)
      const hasSafeArea = window.innerHeight > window.screen.height || 
                        (window.screen.height - window.innerHeight > 50);
      setIsSafeAreaInset(hasSafeArea);
    }
  }, [isAppleDevice]);

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // Handle product selection
  const handleProductSelect = (product: DataProduct) => {
    // Provide haptic feedback on Apple devices using hooks-based haptic feedback
    if (isAppleDevice) {
      haptic({ intensity: 'medium' });
    }
    
    // In a real app, this would navigate to the product detail page
    alert(`Viewing details for ${product.name}`);
  };
  
  // Handle view schema
  const handleViewSchema = (e: React.MouseEvent, productId: string) => {
    e.stopPropagation(); // Prevent triggering the parent card click
    
    // Provide haptic feedback on Apple devices
    if (isAppleDevice) {
      haptic({ intensity: 'light' });
    }
    
    // In a real app, this would open the schema viewer
    alert(`Viewing schema for product ID: ${productId}`);
  };
  
  // Handle share
  const handleShareProduct = (e: React.MouseEvent, product: DataProduct) => {
    e.stopPropagation(); // Prevent triggering the parent card click
    
    if (isAppleDevice) {
      haptic({ intensity: 'medium' });
    }
    
    // In a real app, this would use the Web Share API for iOS devices
    alert(`Sharing ${product.name}`);
  };

  // Determine grid layout based on multi-tasking mode and orientation
  const getGridLayout = () => {
    if (isMultiTasking) {
      if (multiTaskingMode === 'slide-over') {
        return 'grid-cols-1 gap-3'; // Single column for Slide Over mode
      } else if (multiTaskingMode === 'split-view') {
        return orientation === 'portrait' 
          ? 'grid-cols-1 gap-3' // Single column for Split View in portrait
          : 'grid-cols-2 gap-3'; // Two columns for Split View in landscape
      }
    }
    
    // Default responsive grid for non-multi-tasking
    return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4';
  };

  return (
    <div className={isSafeAreaInset && isAppleDevice ? 'pb-6' : ''}>
      {products.length === 0 ? (
        <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} border shadow-sm rounded-lg p-6 md:p-12 text-center`}>
          <Database className={`h-12 w-12 mx-auto ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
          <h3 className={`mt-4 text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            No data products found
          </h3>
          <p className={`mt-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Try adjusting your search or filter criteria to find what you're looking for.
          </p>
        </div>
      ) : (
        <div className={`grid ${getGridLayout()}`}>
          {products.map((product) => (
            <div
              key={product.id}
              className={`
                ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-[rgb(var(--scb-border))]'}
                border shadow-sm rounded-lg overflow-hidden
                transition-all duration-200
                ${isAppleDevice ? 
                  'hover:shadow-md active:scale-[0.985] cursor-pointer touch-action-manipulation' : 
                  'hover:shadow'}
                ${isMultiTasking && multiTaskingMode === 'slide-over' ? 'p-3' : 'p-4'}
              `}
              onClick={() => handleProductSelect(product)}
              style={isAppleDevice ? { WebkitTapHighlightColor: 'transparent' } : undefined}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center">
                  <div className={`
                    rounded-md p-2 mr-3 
                    ${product.category === 'Financial' ? 
                      isDarkMode ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-600' : 
                     product.category === 'Accounting' ? 
                      isDarkMode ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-600' : 
                     product.category === 'Controlling' ? 
                      isDarkMode ? 'bg-purple-900/30 text-purple-300' : 'bg-purple-100 text-purple-600' : 
                      isDarkMode ? 'bg-orange-900/30 text-orange-300' : 'bg-orange-100 text-orange-600'}
                  `}>
                    <Database className={`${isMultiTasking && multiTaskingMode === 'slide-over' ? 'h-4 w-4' : 'h-5 w-5'}`} />
                  </div>
                  <div>
                    <h3 className={`${isMultiTasking && multiTaskingMode === 'slide-over' ? 'text-sm' : 'text-base'} font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'} truncate`}>
                      {product.name}
                    </h3>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mt-0.5`}>
                      {product.type} • {product.category}
                    </p>
                  </div>
                </div>
                
                <div className={`${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  <ChevronRight className={`${isMultiTasking && multiTaskingMode === 'slide-over' ? 'h-4 w-4' : 'h-5 w-5'}`} />
                </div>
              </div>
              
              <p className={`
                text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mt-3 mb-2
                ${isMultiTasking && multiTaskingMode === 'slide-over' ? 'line-clamp-1' : 
                 isMultiTasking && multiTaskingMode === 'split-view' ? 'line-clamp-2' : 'line-clamp-2'}
              `}>
                {product.description}
              </p>
              
              <div className={`grid grid-cols-3 gap-2 text-xs mt-3 ${isMultiTasking && multiTaskingMode === 'slide-over' ? 'text-xs' : 'text-xs'}`}>
                <div className="flex flex-col">
                  <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Tables</span>
                  <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{product.tables}</span>
                </div>
                <div className="flex flex-col">
                  <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Records</span>
                  <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {product.records.toLocaleString()}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Updated</span>
                  <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {formatDate(product.lastUpdated)}
                  </span>
                </div>
              </div>
              
              <div className={`mt-4 pt-3 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-100'} ${isMultiTasking && multiTaskingMode === 'slide-over' ? 'flex justify-between items-center' : 'flex justify-between items-center'}`}>
                {isAppleDevice ? (
                  <>
                    <EnhancedTouchButton
                      onClick={(e) => handleViewSchema(e as React.MouseEvent, product.id)}
                      variant={isDarkMode ? "dark" : "secondary"}
                      size={isMultiTasking && multiTaskingMode === 'slide-over' ? 'xs' : 'sm'}
                      className="flex items-center gap-1"
                    >
                      <Server className={`${isMultiTasking && multiTaskingMode === 'slide-over' ? 'w-3 h-3' : 'w-4 h-4'}`} />
                      <span>View Schema</span>
                    </EnhancedTouchButton>
                    
                    {/* Share button for iOS */}
                    <EnhancedTouchButton
                      onClick={(e) => handleShareProduct(e as React.MouseEvent, product)}
                      variant={isDarkMode ? "dark" : "secondary"}
                      size={isMultiTasking && multiTaskingMode === 'slide-over' ? 'xs' : 'sm'}
                      className="flex items-center gap-1"
                    >
                      <Share2 className={`${isMultiTasking && multiTaskingMode === 'slide-over' ? 'w-3 h-3' : 'w-4 h-4'}`} />
                      {!isMultiTasking || multiTaskingMode !== 'slide-over' ? <span>Share</span> : null}
                    </EnhancedTouchButton>
                  </>
                ) : (
                  <>
                    <button
                      className={`text-sm flex items-center gap-1 ${
                        isDarkMode 
                          ? 'text-blue-400 hover:text-blue-300'
                          : 'text-blue-600 hover:text-blue-800'
                      }`}
                      onClick={(e) => handleViewSchema(e, product.id)}
                    >
                      <Server className="h-4 w-4" />
                      View Schema
                    </button>
                    
                    <button
                      className={`text-sm flex items-center gap-1 ${
                        isDarkMode 
                          ? 'text-blue-400 hover:text-blue-300'
                          : 'text-blue-600 hover:text-blue-800'
                      }`}
                      onClick={(e) => handleShareProduct(e, product)}
                    >
                      <Share2 className="h-4 w-4" />
                      Share
                    </button>
                  </>
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