import React, { useState, useEffect } from 'react';
import SFSymbol from './SFSymbol';
import { useSFSymbolsSupport } from '@/lib/sf-symbols';
import { useIOS, useResponsive } from '@/hooks/useResponsive';
import { useMicroInteractions } from '@/hooks/useMicroInteractions';
import { motion, AnimatePresence } from 'framer-motion';

interface HelpCategory {
  id: string;
  name: string;
  icon?: React.ComponentType<any> | string; // Lucide icon component or SF Symbol name
  count?: number;
  description?: string;
}

interface EnhancedHelpNavigationProps {
  categories: HelpCategory[];
  activeCategory: string;
  onCategoryChange: (categoryId: string) => void;
  className?: string;
  variant?: 'tabs' | 'cards' | 'list' | 'segments';
  showDescriptions?: boolean;
}

/**
 * EnhancedHelpNavigation
 * 
 * A native-feeling iOS navigation component for help categories,
 * using SF Symbols for icons with smooth animations and haptic feedback.
 */
export default function EnhancedHelpNavigation({
  categories,
  activeCategory,
  onCategoryChange,
  className = '',
  variant = 'tabs',
  showDescriptions = false
}: EnhancedHelpNavigationProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const { haptic } = useMicroInteractions();
  const isAppleDevice = useIOS();
  const { isMobile, isTablet } = useResponsive();
  const isSmallScreen = isMobile || isTablet;
  const { supported: sfSymbolsSupported } = useSFSymbolsSupport();
  
  // Map help category IDs to appropriate SF Symbol icons
  const getCategoryIcon = (categoryId: string): string => {
    // Check if the category already has an SF Symbol icon
    const category = categories.find(c => c.id === categoryId);
    if (category && typeof category.icon === 'string') {
      return category.icon;
    }
    
    // Default icons for common help categories
    const iconMap: Record<string, string> = {
      'all': 'square.grid.2x2.fill',
      'getting-started': 'play.circle.fill',
      'data-analysis': 'chart.bar.xaxis',
      'reporting': 'doc.text.fill',
      'api': 'terminal.fill',
      'account': 'person.crop.circle.fill',
      'security': 'shield.checkerboard',
      'troubleshooting': 'wrench.and.screwdriver.fill',
      'billing': 'creditcard.fill',
      'integration': 'link.circle.fill',
      'mobile': 'iphone',
      'desktop': 'desktopcomputer',
      'tutorials': 'play.rectangle.fill',
      'faq': 'questionmark.circle.fill',
      'contact': 'phone.circle.fill',
      'documentation': 'book.closed.fill'
    };
    
    return iconMap[categoryId] || 'questionmark.circle';
  };
  
  // Handle category selection with haptics and animation
  const handleSelect = (categoryId: string) => {
    if (categoryId === activeCategory) return;
    
    // Provide haptic feedback on Apple devices
    if (isAppleDevice) {
      haptic({ intensity: 'light' });
    }
    
    // Add micro-animation
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300);
    
    // Notify parent component
    onCategoryChange(categoryId);
  };

  // Enhance categories with SF Symbol icons
  const enhancedCategories = categories.map(category => ({
    ...category,
    sfIcon: getCategoryIcon(category.id)
  }));
  
  // Card-style variant with descriptions
  if (variant === 'cards') {
    return (
      <div className={`w-full ${className}`}>
        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {enhancedCategories.map((category, index) => (
            <motion.button
              key={category.id}
              onClick={() => handleSelect(category.id)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileTap={{ scale: 0.95 }}
              className={`
                relative p-4 rounded-xl transition-all duration-200 text-left
                ${activeCategory === category.id 
                  ? 'bg-[rgb(var(--scb-honolulu-blue))] text-white shadow-lg' 
                  : 'bg-[rgba(var(--scb-light-gray),0.2)] text-[rgb(var(--scb-dark-gray))] hover:bg-[rgba(var(--scb-light-gray),0.4)]'
                }
                ${isAnimating && activeCategory === category.id ? 'scale-105' : ''}
                border border-[rgba(var(--scb-border),0.3)]
              `}
            >
              <div className="flex items-start">
                <div className={`
                  flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center mb-3
                  ${activeCategory === category.id 
                    ? 'bg-white bg-opacity-20' 
                    : 'bg-[rgba(var(--scb-honolulu-blue),0.1)]'
                  }
                `}>
                  <SFSymbol 
                    name={category.sfIcon}
                    size={24}
                    color={activeCategory === category.id ? 'white' : 'rgb(var(--scb-honolulu-blue))'}
                    weight={activeCategory === category.id ? 'semibold' : 'regular'}
                    renderingMode={sfSymbolsSupported ? 'hierarchical' : 'monochrome'}
                    animated={isAnimating && activeCategory === category.id}
                    animationVariant="scale"
                  />
                </div>
                
                {category.count && (
                  <span className={`
                    absolute top-3 right-3 min-w-[20px] h-5 px-1.5 rounded-full text-xs font-medium
                    flex items-center justify-center
                    ${activeCategory === category.id 
                      ? 'bg-white text-[rgb(var(--scb-honolulu-blue))]' 
                      : 'bg-[rgb(var(--scb-muted-red))] text-white'
                    }
                  `}>
                    {category.count}
                  </span>
                )}
              </div>
              
              <div>
                <h3 className="font-medium text-base mb-1">{category.name}</h3>
                {showDescriptions && category.description && (
                  <p className={`
                    text-sm opacity-80 line-clamp-2
                    ${activeCategory === category.id ? 'text-white' : 'text-[rgb(var(--scb-dark-gray))]'}
                  `}>
                    {category.description}
                  </p>
                )}
              </div>
            </motion.button>
          ))}
        </motion.div>
      </div>
    );
  }
  
  // List-style variant
  if (variant === 'list') {
    return (
      <div className={`w-full ${className}`}>
        <div className="bg-white rounded-lg shadow-sm border border-[rgb(var(--scb-border))] overflow-hidden">
          {enhancedCategories.map((category, index) => (
            <button
              key={category.id}
              onClick={() => handleSelect(category.id)}
              className={`
                w-full px-4 py-3 flex items-center justify-between transition-colors
                ${activeCategory === category.id 
                  ? 'bg-[rgba(var(--scb-honolulu-blue),0.1)] text-[rgb(var(--scb-honolulu-blue))]' 
                  : 'text-[rgb(var(--scb-dark-gray))] hover:bg-[rgba(var(--scb-light-gray),0.3)]'
                }
                ${index > 0 ? 'border-t border-[rgb(var(--scb-border))]' : ''}
              `}
            >
              <div className="flex items-center">
                <SFSymbol 
                  name={category.sfIcon}
                  size={20}
                  color={activeCategory === category.id ? 'rgb(var(--scb-honolulu-blue))' : 'rgb(var(--scb-dark-gray))'}
                  weight={activeCategory === category.id ? 'semibold' : 'regular'}
                  renderingMode={sfSymbolsSupported ? 'hierarchical' : 'monochrome'}
                  animated={isAnimating && activeCategory === category.id}
                  animationVariant="scale"
                  className="mr-3"
                />
                <span className="font-medium">{category.name}</span>
              </div>
              
              {category.count && (
                <span className={`
                  min-w-[20px] h-5 px-1.5 rounded-full text-xs font-medium
                  flex items-center justify-center
                  ${activeCategory === category.id 
                    ? 'bg-[rgb(var(--scb-honolulu-blue))] text-white' 
                    : 'bg-[rgba(var(--scb-light-gray),0.5)] text-[rgb(var(--scb-dark-gray))]'
                  }
                `}>
                  {category.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    );
  }
  
  // iOS Segmented Control style
  if (variant === 'segments') {
    return (
      <div className={`w-full ${className}`}>
        <div className={`
          flex rounded-lg bg-[rgba(var(--scb-light-gray),0.3)] p-1
          ${isSmallScreen ? 'overflow-x-auto hide-scrollbar' : ''}
        `}>
          <div className={`${isSmallScreen ? 'flex min-w-max' : 'grid grid-cols-5 gap-1 w-full'}`}>
            {enhancedCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleSelect(category.id)}
                className={`
                  relative py-2 px-3 rounded-md transition-all duration-200
                  ${activeCategory === category.id 
                    ? 'bg-white text-[rgb(var(--scb-honolulu-blue))] shadow-sm' 
                    : 'text-[rgb(var(--scb-dark-gray))]'
                  }
                  ${isAnimating && activeCategory === category.id ? 'scale-[1.02]' : ''}
                  ${isSmallScreen ? 'flex-shrink-0' : ''}
                `}
              >
                <div className="flex flex-col items-center justify-center">
                  <SFSymbol 
                    name={category.sfIcon}
                    size={18}
                    color={activeCategory === category.id ? 'rgb(var(--scb-honolulu-blue))' : 'rgb(var(--scb-dark-gray))'}
                    weight={activeCategory === category.id ? 'semibold' : 'regular'}
                    renderingMode={sfSymbolsSupported ? 'hierarchical' : 'monochrome'}
                    animated={isAnimating && activeCategory === category.id}
                    animationVariant="scale"
                    className="mb-1"
                  />
                  <span className="text-xs font-medium truncate">{category.name}</span>
                  {category.count && (
                    <span className={`
                      mt-1 text-[10px] font-medium px-1 rounded-full
                      ${activeCategory === category.id ? 'text-[rgb(var(--scb-honolulu-blue))]' : 'text-[rgb(var(--scb-dark-gray))]'}
                    `}>
                      {category.count}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  // Default tabs variant
  return (
    <div className={`w-full ${className}`}>
      <div className="flex overflow-x-auto hide-scrollbar -mb-px">
        {enhancedCategories.map((category) => (
          <button
            key={category.id}
            onClick={() => handleSelect(category.id)}
            className={`
              relative flex items-center px-4 py-3 whitespace-nowrap border-b-2 transition-colors
              ${activeCategory === category.id 
                ? 'border-[rgb(var(--scb-honolulu-blue))] text-[rgb(var(--scb-honolulu-blue))]' 
                : 'border-transparent text-[rgb(var(--scb-dark-gray))] hover:text-[rgb(var(--scb-honolulu-blue))]'
              }
              ${isAnimating && activeCategory === category.id ? 'scale-105' : ''}
            `}
          >
            <SFSymbol 
              name={category.sfIcon}
              size={16}
              color={activeCategory === category.id ? 'rgb(var(--scb-honolulu-blue))' : 'rgb(var(--scb-dark-gray))'}
              weight={activeCategory === category.id ? 'semibold' : 'regular'}
              renderingMode={sfSymbolsSupported ? 'hierarchical' : 'monochrome'}
              animated={isAnimating && activeCategory === category.id}
              animationVariant="scale"
              className="mr-2"
            />
            <span className="font-medium">{category.name}</span>
            {category.count && (
              <span className={`
                ml-2 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-medium
                flex items-center justify-center
                ${activeCategory === category.id 
                  ? 'bg-[rgb(var(--scb-honolulu-blue))] text-white' 
                  : 'bg-[rgba(var(--scb-light-gray),0.5)] text-[rgb(var(--scb-dark-gray))]'
                }
              `}>
                {category.count}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}