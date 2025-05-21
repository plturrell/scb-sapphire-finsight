import React from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useDeviceCapabilities } from '../hooks/useDeviceCapabilities';
import { useApplePhysics } from '../hooks/useApplePhysics';
import { useSFSymbolsSupport } from '../lib/sf-symbols';
import EnhancedIOSIcon from './EnhancedIOSIcon';
import haptics from '../lib/haptics';

export interface BreadcrumbItem {
  label: string;
  href: string;
  icon?: string; // SF Symbol name
}

export interface EnhancedIOSBreadcrumbProps {
  items: BreadcrumbItem[];
  compact?: boolean;
  showIcons?: boolean;
  showHome?: boolean;
  className?: string;
  onItemClick?: (item: BreadcrumbItem) => void;
  maxItems?: number; // Max number of items to display before truncating
  hapticFeedback?: boolean;
  animateTransitions?: boolean;
  separator?: 'chevron' | 'slash' | 'dot';
  theme?: 'light' | 'dark' | 'auto';
}

/**
 * Enhanced iOS Breadcrumb Navigation
 * 
 * A breadcrumb component with iOS-style appearance and SF Symbols integration
 * Responsive design that automatically truncates on small screens with proper ellipsis
 */
const EnhancedIOSBreadcrumb: React.FC<EnhancedIOSBreadcrumbProps> = ({
  items,
  compact = false,
  showIcons = true,
  showHome = true,
  className = '',
  onItemClick,
  maxItems = 4,
  hapticFeedback = true,
  animateTransitions = true,
  separator = 'chevron',
  theme = 'auto'
}) => {
  const router = useRouter();
  const { deviceType, isAppleDevice, prefersColorScheme, prefersReducedMotion } = useDeviceCapabilities();
  const { supported: sfSymbolsSupported } = useSFSymbolsSupport();
  const physics = useApplePhysics({
    motion: 'gentle',
    respectReduceMotion: true
  });

  // Determine if we're on iOS
  const isiOS = deviceType === 'mobile' && isAppleDevice;
  const isiPad = deviceType === 'tablet' && isAppleDevice;
  
  // Determine effective theme
  const effectiveTheme = theme === 'auto' ? prefersColorScheme : theme;
  const isDark = effectiveTheme === 'dark';
  
  // Calculate visible items with truncation
  const visibleItems = React.useMemo(() => {
    if (items.length <= maxItems) {
      return items;
    }
    
    // If we need to truncate, keep first and last items
    const firstItem = items[0];
    const lastItems = items.slice(items.length - (maxItems - 1));
    
    return [firstItem, { label: '...', href: '', icon: 'ellipsis' }, ...lastItems];
  }, [items, maxItems]);
  
  // Add home item if needed
  const allItems = React.useMemo(() => {
    if (showHome && (items.length === 0 || items[0].href !== '/')) {
      return [{ label: 'Home', href: '/', icon: 'house' }, ...visibleItems];
    }
    return visibleItems;
  }, [visibleItems, showHome, items]);
  
  // Handle item click
  const handleItemClick = (item: BreadcrumbItem, index: number) => {
    // Don't navigate for ellipsis or custom handler
    if (item.label === '...') return;
    
    // Provide haptic feedback on iOS/iPadOS
    if (hapticFeedback && (isiOS || isiPad)) {
      haptics.navigation();
    }
    
    // Call custom handler if provided
    if (onItemClick) {
      onItemClick(item);
    }
  };
  
  // Get separator based on selection
  const getSeparator = () => {
    switch (separator) {
      case 'slash':
        return (
          <span className="mx-1 text-gray-400">
            {sfSymbolsSupported ? (
              <EnhancedIOSIcon 
                name="slash" 
                size={12}
                color={isDark ? 'rgb(180, 180, 185)' : 'rgb(150, 150, 155)'}
                role="decoration"
              />
            ) : (
              <span>/</span>
            )}
          </span>
        );
      case 'dot':
        return (
          <span className="mx-1 text-gray-400">
            {sfSymbolsSupported ? (
              <EnhancedIOSIcon 
                name="circle.fill" 
                size={4}
                color={isDark ? 'rgb(180, 180, 185)' : 'rgb(150, 150, 155)'}
                role="decoration"
              />
            ) : (
              <span>•</span>
            )}
          </span>
        );
      case 'chevron':
      default:
        return (
          <span className="mx-1 text-gray-400">
            {sfSymbolsSupported ? (
              <EnhancedIOSIcon 
                name="chevron.right" 
                size={12}
                color={isDark ? 'rgb(180, 180, 185)' : 'rgb(150, 150, 155)'}
                role="decoration"
              />
            ) : (
              <span>&gt;</span>
            )}
          </span>
        );
    }
  };
  
  return (
    <nav 
      aria-label="Breadcrumb" 
      className={`flex items-center py-2 overflow-x-auto scrollbar-none ${className}`}
    >
      <ol className="flex items-center flex-nowrap">
        {allItems.map((item, index) => {
          const isLast = index === allItems.length - 1;
          const isEllipsis = item.label === '...';
          
          return (
            <li 
              key={`${item.label}-${index}`} 
              className={`
                flex items-center whitespace-nowrap
                ${isLast ? 'font-medium' : ''}
                ${animateTransitions && !prefersReducedMotion ? 'transition-all duration-300' : ''}
              `}
            >
              {index > 0 && getSeparator()}
              
              {isEllipsis ? (
                <span className="px-1 text-gray-400">
                  <EnhancedIOSIcon 
                    name="ellipsis" 
                    size={16}
                    color={isDark ? 'rgb(180, 180, 185)' : 'rgb(150, 150, 155)'}
                    role="decoration"
                  />
                </span>
              ) : (
                <Link
                  href={item.href}
                  className={`
                    flex items-center text-sm
                    ${compact ? 'py-0.5 px-1' : 'py-1 px-1.5'}
                    ${isLast ? 
                      (isDark ? 'text-white' : 'text-gray-900') : 
                      (isDark ? 'text-blue-400' : 'text-blue-600')
                    }
                    ${!isLast && 'hover:underline'}
                    rounded
                    ${animateTransitions && !prefersReducedMotion ? 'transition-all duration-200' : ''}
                  `}
                  onClick={() => handleItemClick(item, index)}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {showIcons && item.icon && (
                    <span className="mr-1">
                      <EnhancedIOSIcon 
                        name={item.icon}
                        size={14}
                        color={isLast ? 
                          (isDark ? 'rgb(255, 255, 255)' : 'rgb(38, 38, 38)') : 
                          (isDark ? 'rgb(96, 165, 250)' : 'rgb(37, 99, 235)')
                        }
                        variant={isLast ? 'fill' : 'none'}
                        weight={isLast ? 'semibold' : 'regular'}
                        role="decoration"
                      />
                    </span>
                  )}
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default EnhancedIOSBreadcrumb;