import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useDeviceCapabilities } from '../hooks/useDeviceCapabilities';
import { useApplePhysics } from '../hooks/useApplePhysics';
import { useSafeArea, safeAreaCss } from '../hooks/useSafeArea';
import haptics from '../lib/haptics';

export interface IOSTabItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  activeIcon?: React.ReactNode; // Optional different icon for active state
  href: string;
  badge?: number | string; // Optional badge count/text
  badgeColor?: string; // Optional badge color
  disabled?: boolean;
}

export interface EnhancedIOSTabBarProps {
  items: IOSTabItem[];
  currentTab?: string;
  onChange?: (key: string) => void;
  className?: string;
  blurred?: boolean; // Use iOS-style blur effect
  floating?: boolean; // Make tab bar float with rounded corners like iOS 15+
  showLabels?: boolean; // Show or hide text labels
  labelPosition?: 'below' | 'beside'; // Position of label relative to icon
  compact?: boolean; // Compact mode for small screens
  allowScrolling?: boolean; // Allow horizontal scrolling on overflow
  translucent?: boolean; // Use translucent background
  hapticFeedback?: boolean; // Enable haptic feedback on tab change
  animated?: boolean; // Animate tab changes
  theme?: 'auto' | 'light' | 'dark'; // Force specific theme
  // For special cases (like avoiding camera cutout)
  centerOffset?: number;
  hideBorder?: boolean;
  // Safety features
  respectSafeArea?: boolean; // Adjust for safe areas
  adaptForStage?: boolean; // Adapt for Stage Manager on iPad
}

/**
 * Enhanced iOS Tab Bar
 * 
 * A tab bar navigation component that follows iOS design guidelines with
 * proper animations, haptic feedback, and automatic adaptation for
 * different iOS devices (including notches, home indicators, etc.)
 */
const EnhancedIOSTabBar: React.FC<EnhancedIOSTabBarProps> = ({
  items,
  currentTab,
  onChange,
  className = '',
  blurred = true,
  floating = true,
  showLabels = true,
  labelPosition = 'below',
  compact = false,
  allowScrolling = false,
  translucent = true,
  hapticFeedback = true,
  animated = true,
  theme = 'auto',
  centerOffset = 0,
  hideBorder = false,
  respectSafeArea = true,
  adaptForStage = true
}) => {
  const router = useRouter();
  const { deviceType, isAppleDevice, prefersColorScheme, prefersReducedMotion } = useDeviceCapabilities();
  const { safeArea, hasHomeIndicator } = useSafeArea();
  const physics = useApplePhysics({ 
    motion: animated && !prefersReducedMotion ? 'emphasized' : 'subtle',
    respectReduceMotion: true
  });
  
  // Determine active tab based on router or prop
  const [activeTab, setActiveTab] = useState<string>('');
  
  // Effect to determine active tab based on router path
  useEffect(() => {
    if (currentTab) {
      setActiveTab(currentTab);
    } else {
      // Find matching tab based on current route
      const currentPath = router.pathname;
      const matchingTab = items.find(item => 
        currentPath === item.href || 
        (currentPath.startsWith(item.href) && item.href !== '/')
      );
      
      if (matchingTab) {
        setActiveTab(matchingTab.key);
      } else if (items.length > 0) {
        // Default to first tab if no match
        setActiveTab(items[0].key);
      }
    }
  }, [currentTab, router.pathname, items]);
  
  // Determine if we're on iOS for true iOS styling
  const isiOS = deviceType === 'mobile' && isAppleDevice;
  const isiPad = deviceType === 'tablet' && isAppleDevice;
  
  // Determine effective theme
  const effectiveTheme = theme === 'auto' ? prefersColorScheme : theme;
  const isDark = effectiveTheme === 'dark';
  
  // Determine tab bar height based on device and settings
  const getTabBarHeight = () => {
    const baseHeight = showLabels && labelPosition === 'below' ? 49 : 44;
    const safeAreaAdd = respectSafeArea && hasHomeIndicator ? safeArea.bottom : 0;
    
    if (compact) {
      return 44 + safeAreaAdd;
    }
    
    return baseHeight + safeAreaAdd;
  };
  
  // Get background style based on settings
  const getBackgroundStyle = () => {
    if (translucent) {
      return isDark
        ? 'bg-[rgba(29,29,31,0.72)] backdrop-blur-md backdrop-saturate-150'
        : 'bg-[rgba(249,249,251,0.72)] backdrop-blur-md backdrop-saturate-150';
    }
    
    return isDark
      ? 'bg-[rgb(29,29,31)]'
      : 'bg-[rgb(249,249,251)]';
  };
  
  // Get border style
  const getBorderStyle = () => {
    if (hideBorder || floating) return '';
    
    return isDark
      ? 'border-t border-[rgba(255,255,255,0.12)]'
      : 'border-t border-[rgba(0,0,0,0.1)]';
  };
  
  // Calculate tab width
  const getTabWidth = () => {
    if (allowScrolling) return 'auto';
    return `${100 / items.length}%`;
  };
  
  // Handle tab click
  const handleTabClick = (item: IOSTabItem) => {
    if (item.disabled) return;
    
    // Trigger haptic feedback if enabled and on iOS/iPadOS
    if (hapticFeedback && (isiOS || isiPad)) {
      haptics.selection();
    }
    
    // Set active tab
    setActiveTab(item.key);
    
    // Call onChange handler if provided
    if (onChange) {
      onChange(item.key);
    }
    
    // Navigate to tab href
    router.push(item.href);
  };
  
  return (
    <div
      className={`
        fixed bottom-0 left-0 right-0 z-50
        ${getBackgroundStyle()}
        ${getBorderStyle()}
        ${floating ? 'mx-2 mb-2 rounded-xl shadow-lg' : ''}
        ${className}
      `}
      style={{
        height: `${getTabBarHeight()}px`,
        transform: `translateY(${centerOffset}px)`,
        paddingBottom: respectSafeArea && hasHomeIndicator ? `${safeArea.bottom}px` : 0
      }}
    >
      {/* iOS-style blur effect */}
      {blurred && (
        <div 
          className="absolute inset-0 overflow-hidden"
          style={{ 
            borderRadius: floating ? '0.75rem' : 0,
            zIndex: -1 
          }}
        >
          <div 
            className={`
              absolute inset-0 
              ${isDark ? 'bg-[rgba(29,29,31,0.72)]' : 'bg-[rgba(249,249,251,0.72)]'}
              backdrop-blur-md backdrop-saturate-150
              ${floating ? 'rounded-xl' : ''}
              ${getBorderStyle()}
            `}
          ></div>
        </div>
      )}
      
      {/* Tab items container */}
      <div
        className={`
          flex items-center h-full
          ${allowScrolling ? 'overflow-x-auto scrollbar-none' : ''}
        `}
      >
        {items.map((item) => {
          const isActive = activeTab === item.key;
          const activeColor = isDark ? 'rgb(10, 132, 255)' : 'rgb(0, 122, 255)';
          const inactiveColor = isDark ? 'rgb(170, 170, 170)' : 'rgb(130, 130, 130)';
          
          return (
            <div
              key={item.key}
              className={`
                flex items-center justify-center relative
                ${item.disabled ? 'opacity-40' : ''}
                ${allowScrolling ? 'px-4' : ''}
              `}
              style={{
                width: getTabWidth(),
                transition: animated ? `opacity ${physics.duration}ms ease-in-out` : 'none'
              }}
              onClick={() => !item.disabled && handleTabClick(item)}
            >
              {/* Tab button */}
              <div
                className={`
                  flex ${labelPosition === 'below' ? 'flex-col' : 'flex-row'} 
                  items-center justify-center 
                  ${labelPosition === 'beside' ? 'gap-1.5' : 'gap-1'}
                  pt-1.5 pb-1
                  ${item.disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                {/* Icon */}
                <div 
                  className="relative"
                  style={{
                    color: isActive ? activeColor : inactiveColor,
                    transition: animated ? `color ${physics.duration}ms ease-in-out` : 'none'
                  }}
                >
                  {/* Show active or inactive icon */}
                  {isActive && item.activeIcon ? item.activeIcon : item.icon}
                  
                  {/* Badge (if present) */}
                  {item.badge && (
                    <div
                      className={`
                        absolute -top-1 -right-1 min-w-[16px] h-[16px]
                        rounded-full flex items-center justify-center
                        text-white text-[10px] font-bold
                        ${isActive ? 'scale-110' : 'scale-100'}
                      `}
                      style={{
                        backgroundColor: item.badgeColor || 'rgb(255, 59, 48)',
                        transition: animated ? `transform ${physics.duration}ms ease-in-out` : 'none',
                        padding: String(item.badge).length > 1 ? '0 4px' : '0'
                      }}
                    >
                      {item.badge}
                    </div>
                  )}
                </div>
                
                {/* Label */}
                {showLabels && (
                  <span
                    className={`text-[10px] ${labelPosition === 'below' ? 'pt-0.5' : ''}`}
                    style={{
                      color: isActive ? activeColor : inactiveColor,
                      fontWeight: isActive ? '500' : '400',
                      transition: animated ? `color ${physics.duration}ms ease-in-out, font-weight ${physics.duration}ms ease-in-out` : 'none'
                    }}
                  >
                    {item.label}
                  </span>
                )}
              </div>
              
              {/* Active indicator line - iOS 15+ style */}
              {isActive && !floating && (
                <div
                  className={`absolute ${labelPosition === 'below' ? '-top-[1px]' : 'bottom-1'} left-1/2 transform -translate-x-1/2 h-[2px] rounded-full`}
                  style={{
                    backgroundColor: activeColor,
                    width: '24px',
                    opacity: 0.8,
                    transition: animated ? `width ${physics.duration}ms ${physics.timing.standard}` : 'none'
                  }}
                />
              )}
              
              {/* Active indicator dot - floating style */}
              {isActive && floating && (
                <div
                  className="absolute -top-[1px] left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full"
                  style={{
                    backgroundColor: activeColor,
                    transition: animated ? `transform ${physics.duration}ms ${physics.timing.standard}` : 'none'
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default EnhancedIOSTabBar;