import React, { ReactNode, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import ModernLayout from '@/components/ModernLayout';
import { IconSystemProvider } from '@/components/IconSystem';
import EnhancedIOSNavBar from '@/components/EnhancedIOSNavBar';
import EnhancedIOSTabBar from '@/components/EnhancedIOSTabBar';
import EnhancedIOSBreadcrumb from '@/components/EnhancedIOSBreadcrumb';
import { useDeviceCapabilities } from '@/hooks/useDeviceCapabilities';
import { useMultiTasking } from '@/hooks/useMultiTasking';
import haptics from '@/lib/haptics';

export interface NavBarAction {
  icon: string;
  label?: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'destructive';
  disabled?: boolean;
}

export interface BreadcrumbItem {
  label: string;
  href: string;
  icon?: string;
}

export interface TabItem {
  key: string;
  label: string;
  icon: string;
  href: string;
  badge?: number | string;
  badgeColor?: string;
  disabled?: boolean;
}

interface IOSOptimizedLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  showBreadcrumb?: boolean;
  breadcrumbItems?: BreadcrumbItem[];
  showTabBar?: boolean;
  tabItems?: TabItem[];
  navBarRightActions?: NavBarAction[];
  showBackButton?: boolean;
  customBackFunction?: () => void;
  largeTitle?: boolean;
  theme?: 'light' | 'dark' | 'auto';
}

/**
 * IOSOptimizedLayout
 * 
 * A consistent layout wrapper that provides iOS-style navigation components
 * across the application with SF Symbols integration, platform-specific
 * optimizations, and multi-tasking support.
 */
const IOSOptimizedLayout: React.FC<IOSOptimizedLayoutProps> = ({
  children,
  title,
  subtitle,
  showBreadcrumb = true,
  breadcrumbItems = [],
  showTabBar = true,
  tabItems = [],
  navBarRightActions = [],
  showBackButton = true,
  customBackFunction,
  largeTitle = true,
  theme = 'auto'
}) => {
  const router = useRouter();
  const { deviceType, isAppleDevice, prefersColorScheme } = useDeviceCapabilities();
  const { isMultiTasking, mode } = useMultiTasking();
  
  // Default theme based on device preferences
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>(
    theme === 'auto' ? (prefersColorScheme || 'light') : theme as 'light' | 'dark'
  );
  
  // Update theme when preferences change
  useEffect(() => {
    if (theme === 'auto') {
      setCurrentTheme(prefersColorScheme || 'light');
    }
  }, [prefersColorScheme, theme]);
  
  // Detect if running on Apple device
  const isiOS = deviceType === 'mobile' && isAppleDevice;
  const isiPad = deviceType === 'tablet' && isAppleDevice;
  const isApplePlatform = isiOS || isiPad;
  
  // Determine if dark mode
  const isDark = currentTheme === 'dark';
  
  // Default tab items if none provided
  const defaultTabItems: TabItem[] = [
    { key: 'home', label: 'Home', icon: 'house', href: '/' },
    { key: 'analytics', label: 'Analytics', icon: 'chart.bar', href: '/analytics' },
    { key: 'data', label: 'Data', icon: 'folder', href: '/data-products' },
    { key: 'portfolio', label: 'Portfolio', icon: 'briefcase', href: '/portfolio' },
    { key: 'settings', label: 'Settings', icon: 'gear', href: '/settings' },
  ];
  
  // Default breadcrumb items based on current path
  const getDefaultBreadcrumbItems = (): BreadcrumbItem[] => {
    const path = router.pathname;
    const pathSegments = path.split('/').filter(segment => segment);
    
    // Always start with home
    const items: BreadcrumbItem[] = [
      { label: 'Home', href: '/', icon: 'house' },
    ];
    
    // Build breadcrumb based on path segments
    let currentPath = '';
    for (const segment of pathSegments) {
      currentPath += `/${segment}`;
      
      // Convert path segment to readable label
      let label = segment
        .replace(/-/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      // Add segment to breadcrumb
      items.push({
        label,
        href: currentPath,
        icon: getIconForPath(segment)
      });
    }
    
    return items;
  };
  
  // Helper to determine appropriate icon for path segment
  const getIconForPath = (pathSegment: string): string => {
    const iconMap: Record<string, string> = {
      'analytics': 'chart.bar',
      'portfolio': 'briefcase',
      'reports': 'doc.text',
      'data-products': 'folder',
      'settings': 'gear',
      'financial-simulation': 'function',
      'knowledge-dashboard': 'lightbulb',
      'tariff-alerts': 'exclamationmark.triangle',
      'vietnam-tariff-dashboard': 'map',
      'vietnam-monte-carlo': 'dice',
      'sankey-demo': 'arrow.triangle.branch',
      'test-modern': 'hammer',
      'mobile': 'iphone',
      'help': 'questionmark.circle',
      'companies': 'building.2',
      'risk': 'shield',
      'trading': 'chart.line.uptrend.xyaxis'
    };
    
    return iconMap[pathSegment] || 'doc';
  };
  
  // Use provided tab items or default ones
  const effectiveTabItems = tabItems.length > 0 ? tabItems : defaultTabItems;
  
  // Use provided breadcrumb items or generate default ones
  const effectiveBreadcrumbItems = breadcrumbItems.length > 0 
    ? breadcrumbItems 
    : getDefaultBreadcrumbItems();
  
  // Handle back button press
  const handleBackPress = () => {
    if (isApplePlatform) haptics.navigation();
    
    if (customBackFunction) {
      customBackFunction();
    } else {
      router.back();
    }
  };
  
  return (
    <IconSystemProvider>
      <ModernLayout>
        {/* iOS-style Navigation Bar */}
        <EnhancedIOSNavBar
          title={title}
          subtitle={subtitle}
          largeTitle={largeTitle && (!isMultiTasking || mode !== 'slide-over')}
          blurred={true}
          showBackButton={showBackButton}
          onBackButtonPress={handleBackPress}
          theme={isDark ? 'dark' : 'light'}
          rightActions={isMultiTasking && mode === 'slide-over' && navBarRightActions.length > 1 
            ? [navBarRightActions[0]] // Show only the first action in slide-over mode
            : navBarRightActions}
          respectSafeArea={true}
          hapticFeedback={true}
          position="sticky"
        />
        
        {/* iOS-style Breadcrumb - Hide in slide-over mode */}
        {showBreadcrumb && (!isMultiTasking || mode !== 'slide-over') && (
          <div className={`px-4 py-2 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
            <EnhancedIOSBreadcrumb
              items={effectiveBreadcrumbItems}
              showIcons={true}
              hapticFeedback={true}
              theme={isDark ? 'dark' : 'light'}
              compact={isMultiTasking}
            />
          </div>
        )}
        
        {/* Main Content - Adjust spacing based on multi-tasking mode */}
        <div className={`${isMultiTasking && mode === 'slide-over' 
          ? 'px-2 py-2 space-y-4 overflow-x-hidden pb-20' 
          : isMultiTasking && mode === 'split-view'
            ? 'px-4 py-3 space-y-5 max-w-4xl pb-20' 
            : 'px-6 py-4 space-y-6 max-w-6xl pb-24'} mx-auto`}>
          {children}
        </div>
        
        {/* iOS Tab Bar */}
        {showTabBar && (
          <EnhancedIOSTabBar
            items={effectiveTabItems}
            floating={true}
            blurred={true}
            showLabels={true}
            labelPosition="below"
            compact={isMultiTasking && mode === 'slide-over'}
            hapticFeedback={true}
            theme={isDark ? 'dark' : 'light'}
            respectSafeArea={true}
          />
        )}
      </ModernLayout>
    </IconSystemProvider>
  );
};

export default IOSOptimizedLayout;