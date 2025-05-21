import React from 'react';
import { useRouter } from 'next/router';
import { useDeviceCapabilities } from '../hooks/useDeviceCapabilities';
import { useApplePhysics } from '../hooks/useApplePhysics';
import { useSafeArea } from '../hooks/useSafeArea';
import { useSFSymbolsSupport } from '../lib/sf-symbols';
import EnhancedIOSIcon from './EnhancedIOSIcon';
import haptics from '../lib/haptics';

export interface NavBarAction {
  icon: string; // SF Symbol name
  label?: string; // Optional text for accessibility
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'destructive';
  disabled?: boolean;
}

export interface EnhancedIOSNavBarProps {
  title: string;
  showBackButton?: boolean;
  onBackButtonPress?: () => void;
  largeTitle?: boolean;
  transparent?: boolean;
  blurred?: boolean;
  leftActions?: NavBarAction[];
  rightActions?: NavBarAction[];
  centerComponent?: React.ReactNode;
  subtitle?: string;
  className?: string;
  theme?: 'light' | 'dark' | 'auto';
  position?: 'fixed' | 'absolute' | 'sticky' | 'relative';
  hapticFeedback?: boolean;
  animateTitle?: boolean;
  respectSafeArea?: boolean;
}

/**
 * Enhanced iOS Navigation Bar
 * 
 * A navigation bar component that follows iOS/iPadOS design guidelines
 * with support for SF Symbols, large titles, and other iOS-specific features.
 */
const EnhancedIOSNavBar: React.FC<EnhancedIOSNavBarProps> = ({
  title,
  showBackButton = false,
  onBackButtonPress,
  largeTitle = false,
  transparent = false,
  blurred = true,
  leftActions = [],
  rightActions = [],
  centerComponent,
  subtitle,
  className = '',
  theme = 'auto',
  position = 'sticky',
  hapticFeedback = true,
  animateTitle = true,
  respectSafeArea = true
}) => {
  const router = useRouter();
  const { deviceType, isAppleDevice, prefersColorScheme, prefersReducedMotion } = useDeviceCapabilities();
  const { safeArea, hasNotch, hasHomeIndicator } = useSafeArea();
  const { supported: sfSymbolsSupported } = useSFSymbolsSupport();
  const physics = useApplePhysics({
    motion: animateTitle && !prefersReducedMotion ? 'emphasized' : 'subtle',
    respectReduceMotion: true
  });

  // Determine if we're on iOS/iPadOS
  const isiOS = deviceType === 'mobile' && isAppleDevice;
  const isiPad = deviceType === 'tablet' && isAppleDevice;
  const isApplePlatform = isiOS || isiPad;
  
  // Determine effective theme
  const effectiveTheme = theme === 'auto' ? prefersColorScheme : theme;
  const isDark = effectiveTheme === 'dark';
  
  // Handle back button press
  const handleBackPress = () => {
    if (hapticFeedback && isApplePlatform) {
      haptics.navigation();
    }
    
    if (onBackButtonPress) {
      onBackButtonPress();
    } else {
      // Default to router back if no custom handler
      router.back();
    }
  };
  
  // Determine status bar height based on device
  const getStatusBarHeight = () => {
    if (!respectSafeArea) return 0;
    
    if (hasNotch) {
      return safeArea.top || 47; // iPhone with notch/Dynamic Island
    } else if (isApplePlatform) {
      return safeArea.top || 20; // iPhone without notch or iPad
    }
    
    return 0; // Non-Apple platforms
  };
  
  // Calculate navbar height
  const getNavBarHeight = () => {
    const statusBarHeight = getStatusBarHeight();
    const baseHeight = 44; // Standard iOS navbar height
    
    return statusBarHeight + baseHeight;
  };
  
  // Handle action press
  const handleActionPress = (action: NavBarAction) => {
    if (action.disabled) return;
    
    if (hapticFeedback && isApplePlatform) {
      haptics.selection();
    }
    
    action.onPress();
  };
  
  // Get background style based on settings
  const getBackgroundStyle = () => {
    if (transparent) {
      return 'bg-transparent';
    }
    
    if (blurred) {
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
    if (transparent) return '';
    
    return isDark
      ? 'border-b border-[rgba(255,255,255,0.12)]'
      : 'border-b border-[rgba(0,0,0,0.1)]';
  };
  
  // Get title color
  const getTitleColor = () => {
    return isDark ? 'text-white' : 'text-gray-900';
  };
  
  // Get subtitle color
  const getSubtitleColor = () => {
    return isDark ? 'text-gray-400' : 'text-gray-500';
  };
  
  // Render action button
  const renderActionButton = (action: NavBarAction) => {
    const getColor = () => {
      if (action.disabled) {
        return isDark ? 'rgb(110, 110, 115)' : 'rgb(175, 175, 180)';
      }
      
      switch (action.variant) {
        case 'primary':
          return isDark ? 'rgb(10, 132, 255)' : 'rgb(0, 122, 255)';
        case 'destructive':
          return isDark ? 'rgb(255, 69, 58)' : 'rgb(255, 59, 48)';
        case 'secondary':
        default:
          return isDark ? 'rgb(255, 255, 255)' : 'rgb(38, 38, 38)';
      }
    };
    
    return (
      <button
        key={`${action.icon}-${action.label || ''}`}
        className={`
          flex items-center justify-center
          h-8 min-w-8 px-1.5
          ${action.disabled ? 'opacity-50' : 'active:opacity-70'}
          transition-opacity duration-200
        `}
        onClick={() => handleActionPress(action)}
        disabled={action.disabled}
        aria-label={action.label}
      >
        <EnhancedIOSIcon
          name={action.icon}
          size={24}
          color={getColor()}
          role="action"
          interactive={!action.disabled}
          adaptToSystem={true}
        />
      </button>
    );
  };
  
  return (
    <div
      className={`
        ${position} top-0 left-0 right-0 z-40
        ${getBackgroundStyle()}
        ${getBorderStyle()}
        flex flex-col
        ${className}
      `}
      style={{
        paddingTop: getStatusBarHeight(),
      }}
    >
      {/* Standard navbar content */}
      <div 
        className="flex items-center h-11 px-4"
        style={{
          transition: animateTitle ? `opacity ${physics.duration}ms ease-in-out` : 'none'
        }}
      >
        {/* Left side: Back button and left actions */}
        <div className="flex items-center flex-1 min-w-0">
          {showBackButton && (
            <button
              className="flex items-center mr-2 active:opacity-70"
              onClick={handleBackPress}
              aria-label="Back"
            >
              <EnhancedIOSIcon
                name="chevron.backward"
                size={22}
                color={isDark ? 'rgb(10, 132, 255)' : 'rgb(0, 122, 255)'}
                role="navigation"
                interactive={true}
                adaptToSystem={true}
              />
              {isApplePlatform && <span className="text-sm ml-0.5 text-blue-500">Back</span>}
            </button>
          )}
          
          {/* Left actions */}
          {leftActions.map(renderActionButton)}
        </div>
        
        {/* Center: Title or custom component */}
        <div className="flex-2 text-center">
          {centerComponent || (
            <div className="flex flex-col items-center">
              <h1 
                className={`font-semibold truncate max-w-[200px] ${getTitleColor()}`}
                style={{ 
                  fontSize: largeTitle ? '22px' : '17px',
                  lineHeight: largeTitle ? '28px' : '22px',
                }}
              >
                {title}
              </h1>
              
              {subtitle && (
                <p className={`text-xs ${getSubtitleColor()}`}>
                  {subtitle}
                </p>
              )}
            </div>
          )}
        </div>
        
        {/* Right side: Right actions */}
        <div className="flex items-center justify-end flex-1 min-w-0 ml-2">
          {rightActions.map(renderActionButton)}
        </div>
      </div>
      
      {/* Large title section - only shown when largeTitle is true */}
      {largeTitle && (
        <div 
          className="px-5 pt-2 pb-2"
          style={{
            transition: animateTitle ? `opacity ${physics.duration}ms ease-in-out, transform ${physics.duration}ms ease-out` : 'none'
          }}
        >
          <h1 
            className={`font-bold text-3xl ${getTitleColor()}`}
            style={{
              fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif"
            }}
          >
            {title}
          </h1>
          
          {subtitle && (
            <p className={`text-sm mt-0.5 ${getSubtitleColor()}`}>
              {subtitle}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default EnhancedIOSNavBar;