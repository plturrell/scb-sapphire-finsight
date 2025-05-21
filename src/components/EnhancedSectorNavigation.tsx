import React, { useState, useEffect } from 'react';
import SFSymbol from './SFSymbol';
import { useSFSymbolsSupport } from '@/lib/sf-symbols';
import { useIOS, useResponsive } from '@/hooks/useResponsive';
import { useMicroInteractions } from '@/hooks/useMicroInteractions';
import { motion, AnimatePresence } from 'framer-motion';

interface SectorCategory {
  id: string;
  name: string;
  count: number;
  icon?: string; // SF Symbol name
}

interface EnhancedSectorNavigationProps {
  sectors: SectorCategory[];
  activeSector: string;
  onSectorChange: (sectorId: string) => void;
  className?: string;
  variant?: 'pill' | 'chip' | 'card' | 'segment';
}

/**
 * EnhancedSectorNavigation
 * 
 * A native-feeling iOS navigation component for company sectors,
 * using SF Symbols for icons with smooth animations and haptic feedback.
 */
export default function EnhancedSectorNavigation({
  sectors,
  activeSector,
  onSectorChange,
  className = '',
  variant = 'pill'
}: EnhancedSectorNavigationProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const { haptic } = useMicroInteractions();
  const isAppleDevice = useIOS();
  const { isMobile, isTablet } = useResponsive();
  const isSmallScreen = isMobile || isTablet;
  const { supported: sfSymbolsSupported } = useSFSymbolsSupport();
  
  // Map sector IDs to appropriate SF Symbol icons
  const getSectorIcon = (sectorId: string): string => {
    if (sectors.find(s => s.id === sectorId)?.icon) {
      return sectors.find(s => s.id === sectorId)?.icon || 'questionmark.circle';
    }
    
    // Default icons for common sectors
    const iconMap: Record<string, string> = {
      'all': 'square.grid.2x2.fill',
      'technology': 'desktopcomputer',
      'consumer-cyclical': 'cart.fill',
      'consumer-defensive': 'cart.badge.minus',
      'financial': 'dollarsign.circle.fill',
      'healthcare': 'cross.case.fill',
      'energy': 'bolt.fill',
      'industrial': 'gearshape.2.fill',
      'materials': 'hammer.fill',
      'real-estate': 'building.2.fill',
      'utilities': 'lightbulb.fill',
      'communication': 'antenna.radiowaves.left.and.right',
      'basic-materials': 'leaf.fill'
    };
    
    return iconMap[sectorId] || 'building.columns.fill';
  };
  
  // Handle sector selection with haptics and animation
  const handleSelect = (sectorId: string) => {
    if (sectorId === activeSector) return;
    
    // Provide haptic feedback on Apple devices
    if (isAppleDevice) {
      haptic({ intensity: 'light' });
    }
    
    // Add micro-animation
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300);
    
    // Notify parent component
    onSectorChange(sectorId);
  };

  // Enhance sectors with icons
  const enhancedSectors = sectors.map(sector => ({
    ...sector,
    icon: getSectorIcon(sector.id)
  }));
  
  // Chip-style variant (similar to iOS tags)
  if (variant === 'chip') {
    return (
      <div className={`w-full overflow-x-auto hide-scrollbar ${className}`}>
        <div className="flex flex-wrap gap-2 py-1">
          {enhancedSectors.map((sector) => (
            <motion.button
              key={sector.id}
              onClick={() => handleSelect(sector.id)}
              whileTap={{ scale: 0.95 }}
              className={`
                relative flex items-center rounded-full px-3 py-1.5 transition-colors
                ${activeSector === sector.id 
                  ? 'bg-[rgb(var(--scb-honolulu-blue))] text-white' 
                  : 'bg-[rgba(var(--scb-light-gray),0.3)] text-[rgb(var(--scb-dark-gray))]'
                }
              `}
            >
              {isAppleDevice && sfSymbolsSupported && (
                <SFSymbol 
                  name={sector.icon}
                  size={14}
                  color={activeSector === sector.id ? 'white' : 'rgb(var(--scb-dark-gray))'}
                  weight={activeSector === sector.id ? 'semibold' : 'regular'}
                  renderingMode="monochrome"
                  className="mr-1.5"
                />
              )}
              <span className="text-xs font-medium">{sector.name}</span>
              <span className={`
                ml-1.5 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-medium
                flex items-center justify-center
                ${activeSector === sector.id 
                  ? 'bg-white text-[rgb(var(--scb-honolulu-blue))]'
                  : 'bg-[rgba(var(--scb-light-gray),0.5)] text-[rgb(var(--scb-dark-gray))]'
                }
              `}>
                {sector.count}
              </span>
            </motion.button>
          ))}
        </div>
      </div>
    );
  }
  
  // Card-style variant
  if (variant === 'card') {
    return (
      <div className={`w-full ${className}`}>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {enhancedSectors.map((sector) => (
            <motion.button
              key={sector.id}
              onClick={() => handleSelect(sector.id)}
              whileTap={{ scale: 0.95 }}
              className={`
                flex flex-col items-center justify-center p-3 rounded-lg transition-all
                ${activeSector === sector.id 
                  ? 'bg-[rgb(var(--scb-honolulu-blue))] text-white shadow-md' 
                  : 'bg-[rgba(var(--scb-light-gray),0.2)] text-[rgb(var(--scb-dark-gray))]'
                }
                ${isAnimating && activeSector === sector.id ? 'scale-105' : ''}
              `}
            >
              <SFSymbol 
                name={sector.icon}
                size={isSmallScreen ? 26 : 24}
                color={activeSector === sector.id ? 'white' : 'rgb(var(--scb-dark-gray))'}
                weight={activeSector === sector.id ? 'semibold' : 'regular'}
                renderingMode={sfSymbolsSupported ? 'hierarchical' : 'monochrome'}
                animated={isAnimating && activeSector === sector.id}
                animationVariant="scale"
                className="mb-2"
              />
              <span className="text-xs font-medium truncate w-full text-center">
                {sector.name}
              </span>
              <span className={`
                mt-1 min-w-[20px] h-5 px-1 rounded-full text-[10px] font-medium 
                flex items-center justify-center
                ${activeSector === sector.id 
                  ? 'bg-white text-[rgb(var(--scb-honolulu-blue))]' 
                  : 'bg-white text-[rgb(var(--scb-dark-gray))]'
                }
              `}>
                {sector.count}
              </span>
            </motion.button>
          ))}
        </div>
      </div>
    );
  }
  
  // iOS Segmented Control style
  if (variant === 'segment') {
    return (
      <div className={`w-full ${className}`}>
        <div className={`
          w-full flex rounded-lg bg-[rgba(var(--scb-light-gray),0.3)] p-1
          ${isSmallScreen ? 'overflow-x-auto hide-scrollbar' : ''}
        `}>
          <div className={`${isSmallScreen ? 'flex min-w-max' : 'grid grid-cols-7 gap-1 w-full'}`}>
            {enhancedSectors.map((sector) => (
              <button
                key={sector.id}
                onClick={() => handleSelect(sector.id)}
                className={`
                  relative py-2 px-3.5 rounded-md transition-all duration-200
                  ${activeSector === sector.id 
                    ? 'bg-white text-[rgb(var(--scb-honolulu-blue))] shadow-sm' 
                    : 'text-[rgb(var(--scb-dark-gray))]'
                  }
                  ${isAnimating && activeSector === sector.id ? 'scale-[1.02]' : ''}
                  ${isSmallScreen ? 'flex-shrink-0' : ''}
                `}
              >
                <div className="flex flex-col items-center justify-center">
                  {isAppleDevice && sfSymbolsSupported && (
                    <SFSymbol 
                      name={sector.icon}
                      size={16}
                      color={activeSector === sector.id ? 'rgb(var(--scb-honolulu-blue))' : 'rgb(var(--scb-dark-gray))'}
                      weight={activeSector === sector.id ? 'semibold' : 'regular'}
                      renderingMode={sfSymbolsSupported ? 'hierarchical' : 'monochrome'}
                      animated={isAnimating && activeSector === sector.id}
                      animationVariant="scale"
                      className="mb-1"
                    />
                  )}
                  <span className="text-xs font-medium truncate">{sector.name}</span>
                  <span className={`
                    mt-1 text-[10px] font-medium px-1 rounded-full
                    ${activeSector === sector.id ? 'text-[rgb(var(--scb-honolulu-blue))]' : 'text-[rgb(var(--scb-dark-gray))]'}
                  `}>
                    {sector.count}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  // Default pill-style variant
  return (
    <div className={`w-full overflow-x-auto hide-scrollbar ${className}`}>
      <div className="flex flex-wrap gap-2 py-1">
        {enhancedSectors.map((sector) => (
          <button
            key={sector.id}
            onClick={() => handleSelect(sector.id)}
            className={`
              relative flex items-center px-3 py-1.5 rounded-full transition-colors
              ${activeSector === sector.id 
                ? 'bg-[rgb(var(--scb-honolulu-blue))] text-white' 
                : 'bg-[rgba(var(--scb-light-gray),0.5)] text-[rgb(var(--scb-dark-gray))]'
              }
              ${isAnimating && activeSector === sector.id ? 'scale-105' : ''}
            `}
          >
            <span className="text-xs font-medium">
              {sector.name} ({sector.count})
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}