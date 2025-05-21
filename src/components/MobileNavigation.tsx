import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { 
  Home, BarChart3, Target, FileText, Settings, 
  Search, Bell, User, Grid, HelpCircle, Plus,
  ChevronDown, BookOpen
} from 'lucide-react';
import { Icons } from './IconExports';
import { haptics } from '../lib/haptics';
import { useSafeArea } from '../hooks/useSafeArea';

// Interface for navigation items
export interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
  isExternal?: boolean;
}

interface MobileNavigationProps {
  variant?: 'tab' | 'bottom' | 'swipe';
  showSearch?: boolean;
  showNotifications?: boolean;
  showAppFinder?: boolean;
  showLabel?: boolean;
  customItems?: NavItem[];
  activeItemHref?: string;
  onItemClick?: (item: NavItem) => void;
  className?: string;
  animatePageTransitions?: boolean;
  enableHaptics?: boolean;
  appearance?: 'light' | 'dark' | 'auto';
}

/**
 * MobileNavigation component - provides consistent navigation experience on mobile devices
 * Supports different variants (tab bar, bottom nav) and automatically handles safe areas
 */
const MobileNavigation: React.FC<MobileNavigationProps> = ({
  variant = 'bottom',
  showSearch = false,
  showNotifications = true,
  showAppFinder = false,
  showLabel = true,
  customItems,
  activeItemHref,
  onItemClick,
  className = '',
  animatePageTransitions = true,
  enableHaptics = true,
  appearance = 'light'
}) => {
  const router = useRouter();
  const { safeArea } = useSafeArea();
  const [activeItem, setActiveItem] = useState<string>(activeItemHref || router.pathname);
  const [hasHomeIndicator, setHasHomeIndicator] = useState(false);
  const [colorScheme, setColorScheme] = useState<'light' | 'dark'>(appearance === 'auto' ? 'light' : appearance);
  
  // Define default navigation items
  const defaultNavItems: NavItem[] = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    { name: 'Portfolio', href: '/portfolio', icon: Target, badge: 3 },
    { name: 'Reports', href: '/reports', icon: FileText }
  ];
  
  // Use custom items if provided, otherwise use defaults
  const navItems = customItems || defaultNavItems;
  
  // Check for home indicator (iPhone X and newer)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Simple detection for devices with home indicator
      const isDeviceWithHomeIndicator = 
        /iPhone/.test(navigator.userAgent) && 
        (window.screen.height >= 812 || window.screen.width >= 812);
      
      setHasHomeIndicator(isDeviceWithHomeIndicator);
    }
  }, []);
  
  // Update active item when route changes
  useEffect(() => {
    if (activeItemHref) {
      setActiveItem(activeItemHref);
    } else {
      setActiveItem(router.pathname);
    }
  }, [router.pathname, activeItemHref]);
  
  // Update color scheme based on appearance pref or system preference
  useEffect(() => {
    if (appearance === 'auto' && typeof window !== 'undefined') {
      const matcher = window.matchMedia('(prefers-color-scheme: dark)');
      setColorScheme(matcher.matches ? 'dark' : 'light');
      
      const handleChange = (e: MediaQueryListEvent) => {
        setColorScheme(e.matches ? 'dark' : 'light');
      };
      
      matcher.addEventListener('change', handleChange);
      return () => matcher.removeEventListener('change', handleChange);
    } else {
      setColorScheme(appearance === 'dark' ? 'dark' : 'light');
    }
  }, [appearance]);
  
  // Handle item click with haptic feedback
  const handleItemClick = (item: NavItem) => {
    // Skip if already active
    if (item.href === activeItem) return;
    
    // Add haptic feedback
    if (enableHaptics) {
      haptics.selection();
    }
    
    // Update active item
    setActiveItem(item.href);
    
    // Call custom handler if provided
    if (onItemClick) {
      onItemClick(item);
    }
    
    // Handle navigation
    if (item.isExternal) {
      window.open(item.href, '_blank');
    } else {
      router.push(item.href);
    }
  };
  
  // Determine if an item is active
  const isItemActive = (item: NavItem): boolean => {
    if (activeItemHref) {
      return item.href === activeItemHref;
    }
    return item.href === router.pathname;
  };
  
  // Render tab navigation
  if (variant === 'tab') {
    return (
      <nav className={`
        fixed top-0 left-0 right-0 z-40
        bg-white dark:bg-gray-900
        border-b border-gray-200 dark:border-gray-800
        ${className}
      `} style={{ paddingTop: `${safeArea.top}px` }}>
        <div className="flex items-center justify-between px-4 h-12">
          {showSearch && (
            <button className="p-2 text-gray-600 dark:text-gray-400">
              <Search className="w-5 h-5" />
            </button>
          )}
          
          <div className="flex items-center overflow-x-auto hide-scrollbar space-x-6">
            {navItems.map((item) => (
              <button
                key={item.href}
                className={`
                  flex items-center py-3 border-b-2 transition-colors -mb-px
                  ${isItemActive(item) 
                    ? 'border-[rgb(var(--scb-honolulu-blue))] text-[rgb(var(--scb-honolulu-blue))]' 
                    : 'border-transparent text-gray-600 dark:text-gray-400'}
                `}
                onClick={() => handleItemClick(item)}
              >
                <item.icon className="w-5 h-5 mr-2" />
                {showLabel && <span className="text-sm font-medium">{item.name}</span>}
                {item.badge && (
                  <span className="ml-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
          
          <div className="flex items-center">
            {showNotifications && (
              <button className="relative p-2 text-gray-600 dark:text-gray-400">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 bg-red-500 rounded-full w-2 h-2"></span>
              </button>
            )}
            
            {showAppFinder && (
              <button className="p-2 text-gray-600 dark:text-gray-400">
                <Grid className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </nav>
    );
  }
  
  // Render bottom navigation
  return (
    <nav className={`
      fixed bottom-0 left-0 right-0 z-40
      bg-white dark:bg-gray-900
      border-t border-gray-200 dark:border-gray-800
      ${className}
    `} style={{ paddingBottom: hasHomeIndicator ? `${safeArea.bottom}px` : '0px' }}>
      <div className="grid grid-cols-5 h-14">
        {navItems.slice(0, 5).map((item) => (
          <button
            key={item.href}
            className={`
              flex flex-col items-center justify-center relative
              ${isItemActive(item) 
                ? 'text-[rgb(var(--scb-honolulu-blue))]' 
                : 'text-gray-600 dark:text-gray-400'}
            `}
            onClick={() => handleItemClick(item)}
          >
            <item.icon className="w-6 h-6" />
            {showLabel && (
              <span className="text-xs mt-1 font-medium">{item.name}</span>
            )}
            {item.badge && (
              <span className="absolute top-0 right-1/3 bg-red-500 text-white text-xs rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                {item.badge > 9 ? '9+' : item.badge}
              </span>
            )}
          </button>
        ))}
      </div>
    </nav>
  );
};

export default MobileNavigation;