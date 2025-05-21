import React, { useState, useEffect } from 'react';
import SFSymbol from './SFSymbol';
import { useSFSymbolsSupport } from '@/lib/sf-symbols';
import { useIOS, useResponsive } from '@/hooks/useResponsive';
import { useSafeArea } from '@/hooks/useResponsive';
import { useMicroInteractions } from '@/hooks/useMicroInteractions';

interface MarketCategory {
  id: string;
  label: string;
  icon: string;
  badge: string | null;
}

interface EnhancedTradingNavigationProps {
  categories: MarketCategory[];
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  className?: string;
  variant?: 'default' | 'pill' | 'card' | 'circle';
}

/**
 * EnhancedTradingNavigation
 * 
 * A native-feeling iOS navigation component for the Trading dashboard,
 * using SF Symbols for icons with smooth animations and haptic feedback.
 * Provides different visualization variants to match the trading UI style.
 */
export default function EnhancedTradingNavigation({
  categories,
  activeCategory,
  onCategoryChange,
  className = '',
  variant = 'default'
}: EnhancedTradingNavigationProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const { haptic } = useMicroInteractions();
  const isAppleDevice = useIOS();
  const { isMobile, isTablet } = useResponsive();
  const isSmallScreen = isMobile || isTablet;
  const safeArea = useSafeArea();
  const { supported: sfSymbolsSupported } = useSFSymbolsSupport();
  
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
  
  // For mobile/tablet with circle variant on iOS devices 
  if (variant === 'circle' && isSmallScreen && isAppleDevice) {
    return (
      <div className={`w-full overflow-x-auto hide-scrollbar ${className}`}>
        <div className="flex space-x-4 min-w-max pb-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => handleSelect(category.id)}
              className="flex flex-col items-center"
            >
              <div className={`
                relative flex items-center justify-center w-14 h-14 rounded-full mb-1.5 transition-all duration-200
                ${activeCategory === category.id 
                  ? 'bg-[rgb(var(--scb-honolulu-blue))]' 
                  : 'bg-[rgba(var(--scb-light-gray),0.5)]'
                }
                ${isAnimating && activeCategory === category.id ? 'scale-110' : ''}
              `}>
                <SFSymbol 
                  name={category.icon}
                  size={26}
                  color={activeCategory === category.id ? 'white' : 'rgb(var(--scb-dark-gray))'}
                  weight={activeCategory === category.id ? 'semibold' : 'regular'}
                  renderingMode={sfSymbolsSupported ? 'hierarchical' : 'monochrome'}
                  animated={isAnimating && activeCategory === category.id}
                  animationVariant="scale"
                />
                
                {/* Badge indicator */}
                {category.badge && (
                  <span className={`
                    absolute -top-1 -right-1 min-w-[20px] h-5 px-1 
                    rounded-full text-xs font-medium flex items-center justify-center
                    bg-[rgb(var(--scb-muted-red))] text-white
                  `}>
                    {category.badge}
                  </span>
                )}
              </div>
              <span className={`
                text-xs font-medium text-center
                ${activeCategory === category.id 
                  ? 'text-[rgb(var(--scb-honolulu-blue))]' 
                  : 'text-[rgb(var(--scb-dark-gray))]'
                }
              `}>
                {category.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }
  
  // For mobile/tablet with bottom tab bar on iOS devices
  if (isSmallScreen && isAppleDevice) {
    return (
      <div className={`w-full ${className}`}>
        {/* iOS-style tab bar for small screens */}
        <div className={`
          fixed bottom-0 left-0 right-0 z-50 
          bg-[rgba(var(--scb-background),0.85)] backdrop-blur-md 
          border-t border-[rgba(var(--scb-border),0.3)]
          flex justify-around items-center px-2 pt-1.5
        `} style={{ paddingBottom: `${safeArea.bottom + 6}px` }}>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => handleSelect(category.id)}
              className={`
                relative flex flex-col items-center justify-center py-1 px-2
                transition-all duration-200 rounded-md
                ${isAnimating && activeCategory === category.id ? 'scale-110' : ''}
              `}
            >
              <div className={`
                relative ${activeCategory === category.id ? 'scale-110' : ''}
              `}>
                <SFSymbol 
                  name={category.icon}
                  size={24}
                  color={activeCategory === category.id ? 'rgb(var(--scb-honolulu-blue))' : 'rgb(var(--scb-dark-gray))'}
                  weight={activeCategory === category.id ? 'semibold' : 'regular'}
                  renderingMode={sfSymbolsSupported ? 'hierarchical' : 'monochrome'}
                  animated={isAnimating && activeCategory === category.id}
                  animationVariant="scale"
                />
                
                {/* Badge indicator positioned on icon */}
                {category.badge && (
                  <span className={`
                    absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 
                    rounded-full text-[10px] font-medium flex items-center justify-center
                    bg-[rgb(var(--scb-muted-red))] text-white
                  `}>
                    {category.badge}
                  </span>
                )}
              </div>
              
              <span className={`
                text-[10px] font-medium mt-1
                ${activeCategory === category.id 
                  ? 'text-[rgb(var(--scb-honolulu-blue))]' 
                  : 'text-[rgb(var(--scb-dark-gray))]'
                }
              `}>
                {category.label}
              </span>
            </button>
          ))}
        </div>
        
        {/* Spacer for fixed positioned tab bar */}
        <div style={{ height: `${safeArea.bottom + 60}px` }} />
      </div>
    );
  }
  
  // Card-style navigation variant
  if (variant === 'card') {
    return (
      <div className={`w-full overflow-x-auto hide-scrollbar ${className}`}>
        <div className="flex space-x-3 min-w-max p-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => handleSelect(category.id)}
              className={`
                relative p-3 rounded-lg transition-all duration-200
                ${activeCategory === category.id 
                  ? 'bg-[rgb(var(--scb-honolulu-blue))] text-white shadow-lg' 
                  : 'bg-[rgba(var(--scb-light-gray),0.3)] text-[rgb(var(--scb-dark-gray))] hover:bg-[rgba(var(--scb-light-gray),0.5)]'
                }
                ${isAnimating && activeCategory === category.id ? 'scale-105' : ''}
              `}
            >
              <div className="flex items-center">
                <SFSymbol 
                  name={category.icon}
                  size={20}
                  color={activeCategory === category.id ? 'white' : 'rgb(var(--scb-dark-gray))'}
                  weight={activeCategory === category.id ? 'semibold' : 'regular'}
                  renderingMode={sfSymbolsSupported ? 'hierarchical' : 'monochrome'}
                  animated={isAnimating && activeCategory === category.id}
                  animationVariant="scale"
                />
                <span className="ml-2 text-sm font-medium whitespace-nowrap">{category.label}</span>
              </div>
              
              {/* Badge indicator */}
              {category.badge && (
                <span className={`
                  absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 
                  rounded-full text-[10px] font-medium flex items-center justify-center
                  bg-[rgb(var(--scb-muted-red))] text-white
                `}>
                  {category.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    );
  }
  
  // Pill-style navigation variant
  if (variant === 'pill') {
    return (
      <div className={`w-full overflow-x-auto hide-scrollbar ${className}`}>
        <div className="inline-flex bg-[rgba(var(--scb-light-gray),0.3)] p-1 rounded-full">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => handleSelect(category.id)}
              className={`
                relative flex items-center rounded-full px-4 py-1.5 transition-all duration-200
                ${activeCategory === category.id 
                  ? 'bg-[rgb(var(--scb-honolulu-blue))] text-white shadow-sm' 
                  : 'text-[rgb(var(--scb-dark-gray))]'
                }
                ${isAnimating && activeCategory === category.id ? 'scale-105' : ''}
              `}
            >
              <SFSymbol 
                name={category.icon}
                size={16}
                color={activeCategory === category.id ? 'white' : 'rgb(var(--scb-dark-gray))'}
                weight={activeCategory === category.id ? 'semibold' : 'regular'}
                renderingMode={sfSymbolsSupported ? 'hierarchical' : 'monochrome'}
                animated={isAnimating && activeCategory === category.id}
                animationVariant="scale"
              />
              <span className="ml-2 text-sm font-medium whitespace-nowrap">{category.label}</span>
              
              {/* Badge for pill style */}
              {category.badge && (
                <span className={`
                  ml-1.5 min-w-[18px] h-[18px] px-1 
                  rounded-full text-[10px] font-medium flex items-center justify-center
                  ${activeCategory === category.id 
                    ? 'bg-white text-[rgb(var(--scb-honolulu-blue))]' 
                    : 'bg-[rgb(var(--scb-muted-red))] text-white'
                  }
                `}>
                  {category.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    );
  }
  
  // Default style navigation
  return (
    <div className={`w-full overflow-x-auto hide-scrollbar bg-white rounded-lg shadow-sm border border-[rgb(var(--scb-border))] p-1 ${className}`}>
      <div className="flex space-x-1 min-w-max">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => handleSelect(category.id)}
            className={`
              relative flex items-center justify-center px-4 py-2.5 rounded-md transition-all duration-200
              ${activeCategory === category.id 
                ? 'bg-[rgba(var(--scb-honolulu-blue),0.1)] text-[rgb(var(--scb-honolulu-blue))]' 
                : 'text-[rgb(var(--scb-dark-gray))] hover:bg-[rgba(var(--scb-light-gray),0.5)]'
              }
              ${isAnimating && activeCategory === category.id ? 'scale-105' : ''}
            `}
          >
            <div className="flex items-center">
              <SFSymbol 
                name={category.icon}
                size={18}
                color={activeCategory === category.id ? 'rgb(var(--scb-honolulu-blue))' : 'rgb(var(--scb-dark-gray))'}
                weight={activeCategory === category.id ? 'semibold' : 'regular'}
                renderingMode={sfSymbolsSupported ? 'hierarchical' : 'monochrome'}
                animated={isAnimating && activeCategory === category.id}
                animationVariant="scale"
              />
              <span className="ml-2 text-sm font-medium whitespace-nowrap">{category.label}</span>
            </div>
            
            {/* Badge indicator */}
            {category.badge && (
              <span className={`
                absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 
                rounded-full text-[10px] font-medium flex items-center justify-center
                ${activeCategory === category.id 
                  ? 'bg-[rgb(var(--scb-honolulu-blue))] text-white' 
                  : 'bg-[rgb(var(--scb-muted-red))] text-white'
                }
              `}>
                {category.badge}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}