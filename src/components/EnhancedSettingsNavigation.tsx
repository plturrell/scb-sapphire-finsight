import React, { useState, useEffect } from 'react';
import SFSymbol from './SFSymbol';
import { useSFSymbolsSupport } from '@/lib/sf-symbols';
import { useIOS, useResponsive } from '@/hooks/useResponsive';
import { useMicroInteractions } from '@/hooks/useMicroInteractions';
import { motion, AnimatePresence } from 'framer-motion';

interface SettingsSection {
  id: string;
  name: string;
  icon: string; // SF Symbol name
  description?: string;
  badge?: string | number;
  isNew?: boolean;
}

interface EnhancedSettingsNavigationProps {
  sections: SettingsSection[];
  activeSection: string;
  onSectionChange: (sectionId: string) => void;
  className?: string;
  variant?: 'list' | 'grid' | 'tabs' | 'segments';
  showDescriptions?: boolean;
}

/**
 * EnhancedSettingsNavigation
 * 
 * A native-feeling iOS navigation component for settings sections,
 * using SF Symbols for icons with smooth animations and haptic feedback.
 */
export default function EnhancedSettingsNavigation({
  sections,
  activeSection,
  onSectionChange,
  className = '',
  variant = 'list',
  showDescriptions = false
}: EnhancedSettingsNavigationProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const { haptic } = useMicroInteractions();
  const isAppleDevice = useIOS();
  const { isMobile, isTablet } = useResponsive();
  const isSmallScreen = isMobile || isTablet;
  const { supported: sfSymbolsSupported } = useSFSymbolsSupport();
  
  // Handle section selection with haptics and animation
  const handleSelect = (sectionId: string) => {
    if (sectionId === activeSection) return;
    
    // Provide haptic feedback on Apple devices
    if (isAppleDevice) {
      haptic({ intensity: 'light' });
    }
    
    // Add micro-animation
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300);
    
    // Notify parent component
    onSectionChange(sectionId);
  };
  
  // Grid variant - iOS-style settings grid
  if (variant === 'grid') {
    return (
      <div className={`w-full ${className}`}>
        <motion.div 
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {sections.map((section, index) => (
            <motion.button
              key={section.id}
              onClick={() => handleSelect(section.id)}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05, duration: 0.2 }}
              whileTap={{ scale: 0.95 }}
              className={`
                relative p-4 rounded-xl transition-all duration-200 text-center
                ${activeSection === section.id 
                  ? 'bg-[rgb(var(--scb-honolulu-blue))] text-white shadow-lg' 
                  : 'bg-[rgba(var(--scb-light-gray),0.3)] text-[rgb(var(--scb-dark-gray))] hover:bg-[rgba(var(--scb-light-gray),0.5)]'
                }
                ${isAnimating && activeSection === section.id ? 'scale-105' : ''}
                border border-[rgba(var(--scb-border),0.2)]
              `}
            >
              <div className={`
                w-12 h-12 rounded-xl flex items-center justify-center mb-2 mx-auto
                ${activeSection === section.id 
                  ? 'bg-white bg-opacity-20' 
                  : 'bg-[rgba(var(--scb-honolulu-blue),0.1)]'
                }
              `}>
                <SFSymbol 
                  name={section.icon}
                  size={24}
                  color={activeSection === section.id ? 'white' : 'rgb(var(--scb-honolulu-blue))'}
                  weight={activeSection === section.id ? 'semibold' : 'regular'}
                  renderingMode={sfSymbolsSupported ? 'hierarchical' : 'monochrome'}
                  animated={isAnimating && activeSection === section.id}
                  animationVariant="scale"
                />
              </div>
              
              <span className="text-sm font-medium block">{section.name}</span>
              
              {section.badge && (
                <span className={`
                  absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 rounded-full text-xs font-medium
                  flex items-center justify-center
                  ${section.isNew 
                    ? 'bg-[rgb(var(--scb-american-green))] text-white' 
                    : 'bg-[rgb(var(--scb-muted-red))] text-white'
                  }
                `}>
                  {section.badge}
                </span>
              )}
            </motion.button>
          ))}
        </motion.div>
      </div>
    );
  }
  
  // Tabs variant
  if (variant === 'tabs') {
    return (
      <div className={`w-full ${className}`}>
        <div className="flex overflow-x-auto hide-scrollbar -mb-px">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => handleSelect(section.id)}
              className={`
                relative flex items-center px-4 py-3 whitespace-nowrap border-b-2 transition-colors
                ${activeSection === section.id 
                  ? 'border-[rgb(var(--scb-honolulu-blue))] text-[rgb(var(--scb-honolulu-blue))]' 
                  : 'border-transparent text-[rgb(var(--scb-dark-gray))] hover:text-[rgb(var(--scb-honolulu-blue))]'
                }
                ${isAnimating && activeSection === section.id ? 'scale-105' : ''}
              `}
            >
              <SFSymbol 
                name={section.icon}
                size={16}
                color={activeSection === section.id ? 'rgb(var(--scb-honolulu-blue))' : 'rgb(var(--scb-dark-gray))'}
                weight={activeSection === section.id ? 'semibold' : 'regular'}
                renderingMode={sfSymbolsSupported ? 'hierarchical' : 'monochrome'}
                animated={isAnimating && activeSection === section.id}
                animationVariant="scale"
                className="mr-2"
              />
              <span className="font-medium">{section.name}</span>
              {section.badge && (
                <span className={`
                  ml-2 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-medium
                  flex items-center justify-center
                  ${section.isNew 
                    ? 'bg-[rgb(var(--scb-american-green))] text-white' 
                    : 'bg-[rgb(var(--scb-muted-red))] text-white'
                  }
                `}>
                  {section.badge}
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
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => handleSelect(section.id)}
                className={`
                  relative py-2 px-3 rounded-md transition-all duration-200
                  ${activeSection === section.id 
                    ? 'bg-white text-[rgb(var(--scb-honolulu-blue))] shadow-sm' 
                    : 'text-[rgb(var(--scb-dark-gray))]'
                  }
                  ${isAnimating && activeSection === section.id ? 'scale-[1.02]' : ''}
                  ${isSmallScreen ? 'flex-shrink-0' : ''}
                `}
              >
                <div className="flex flex-col items-center justify-center">
                  <SFSymbol 
                    name={section.icon}
                    size={18}
                    color={activeSection === section.id ? 'rgb(var(--scb-honolulu-blue))' : 'rgb(var(--scb-dark-gray))'}
                    weight={activeSection === section.id ? 'semibold' : 'regular'}
                    renderingMode={sfSymbolsSupported ? 'hierarchical' : 'monochrome'}
                    animated={isAnimating && activeSection === section.id}
                    animationVariant="scale"
                    className="mb-1"
                  />
                  <span className="text-xs font-medium truncate">{section.name}</span>
                  {section.badge && (
                    <span className={`
                      absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full text-[9px] font-medium
                      flex items-center justify-center
                      ${section.isNew 
                        ? 'bg-[rgb(var(--scb-american-green))] text-white' 
                        : 'bg-[rgb(var(--scb-muted-red))] text-white'
                      }
                    `}>
                      {section.badge}
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
  
  // Default iOS-style list variant
  return (
    <div className={`w-full ${className}`}>
      <div className="bg-white rounded-lg shadow-sm border border-[rgb(var(--scb-border))] overflow-hidden">
        {sections.map((section, index) => (
          <motion.button
            key={section.id}
            onClick={() => handleSelect(section.id)}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05, duration: 0.2 }}
            className={`
              w-full px-4 py-4 flex items-center justify-between transition-colors
              ${activeSection === section.id 
                ? 'bg-[rgba(var(--scb-honolulu-blue),0.1)] text-[rgb(var(--scb-honolulu-blue))]' 
                : 'text-[rgb(var(--scb-dark-gray))] hover:bg-[rgba(var(--scb-light-gray),0.3)]'
              }
              ${index > 0 ? 'border-t border-[rgb(var(--scb-border))]' : ''}
              ${isAnimating && activeSection === section.id ? 'scale-[1.02]' : ''}
            `}
          >
            <div className="flex items-center flex-1">
              <div className={`
                w-10 h-10 rounded-lg flex items-center justify-center mr-3
                ${activeSection === section.id 
                  ? 'bg-[rgb(var(--scb-honolulu-blue))]' 
                  : 'bg-[rgba(var(--scb-honolulu-blue),0.1)]'
                }
              `}>
                <SFSymbol 
                  name={section.icon}
                  size={20}
                  color={activeSection === section.id ? 'white' : 'rgb(var(--scb-honolulu-blue))'}
                  weight={activeSection === section.id ? 'semibold' : 'regular'}
                  renderingMode={sfSymbolsSupported ? 'hierarchical' : 'monochrome'}
                  animated={isAnimating && activeSection === section.id}
                  animationVariant="scale"
                />
              </div>
              
              <div className="flex-1 text-left">
                <h3 className="font-medium text-base">{section.name}</h3>
                {showDescriptions && section.description && (
                  <p className={`
                    text-sm mt-1 opacity-80
                    ${activeSection === section.id 
                      ? 'text-[rgb(var(--scb-honolulu-blue))]' 
                      : 'text-[rgb(var(--scb-dark-gray))]'
                    }
                  `}>
                    {section.description}
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex items-center">
              {section.badge && (
                <span className={`
                  mr-2 min-w-[20px] h-5 px-1.5 rounded-full text-xs font-medium
                  flex items-center justify-center
                  ${section.isNew 
                    ? 'bg-[rgb(var(--scb-american-green))] text-white' 
                    : activeSection === section.id 
                      ? 'bg-[rgb(var(--scb-honolulu-blue))] text-white' 
                      : 'bg-[rgba(var(--scb-light-gray),0.5)] text-[rgb(var(--scb-dark-gray))]'
                  }
                `}>
                  {section.badge}
                </span>
              )}
              
              <SFSymbol 
                name="chevron.right"
                size={14}
                color={activeSection === section.id ? 'rgb(var(--scb-honolulu-blue))' : 'rgb(var(--scb-dark-gray))'}
                weight="medium"
                renderingMode="monochrome"
                className="opacity-60"
              />
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}