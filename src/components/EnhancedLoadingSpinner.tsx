import React, { useMemo } from 'react';
import { Icon } from './IconSystem';
import { useDeviceCapabilities } from '../hooks/useDeviceCapabilities';
import { useIOSOptimizations } from '../lib/performance';

interface EnhancedLoadingSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  variant?: 'default' | 'primary' | 'muted' | 'inverted';
  message?: string;
  className?: string;
  fullPage?: boolean;
  theme?: 'light' | 'dark';
}

/**
 * Enhanced Loading Spinner with SCB beautiful styling
 * Now optimized for iOS with native feel
 */
const EnhancedLoadingSpinner: React.FC<EnhancedLoadingSpinnerProps> = ({
  size = 'md',
  variant = 'default',
  message,
  className = '',
  fullPage = false,
  theme: propTheme
}) => {
  const { deviceType, isAppleDevice, prefersColorScheme, prefersReducedMotion } = useDeviceCapabilities();
  const { optimizations, isIOSDevice } = useIOSOptimizations();
  
  // Determine effective theme based on props or system preference
  const theme = propTheme || prefersColorScheme || 'light';
  const isDarkMode = theme === 'dark';
  
  // Size mappings
  const sizeClasses = {
    xs: 'h-4 w-4',
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };
  
  // Pixel sizes for icons
  const sizePx = {
    xs: 16,
    sm: 24,
    md: 32,
    lg: 48
  };

  // Variant mappings to SCB colors
  const variantClasses = {
    default: 'border-b-[rgb(var(--scb-honolulu-blue))]',
    primary: 'border-b-[rgb(var(--scb-american-green))]',
    muted: 'border-b-[rgb(var(--scb-dark-gray))]',
    inverted: 'border-b-white'
  };
  
  // Colors for each variant
  const variantColors = {
    default: isDarkMode ? 'rgb(0, 142, 211)' : 'rgb(0, 114, 170)', // SCB blue
    primary: isDarkMode ? 'rgb(41, 204, 86)' : 'rgb(33, 170, 71)', // SCB green
    muted: isDarkMode ? 'rgb(160, 160, 160)' : 'rgb(102, 102, 102)', // SCB gray
    inverted: 'white'
  };

  // Text size based on spinner size
  const textSizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };
  
  // Use native iOS spinner when available
  const useNativeSpinner = useMemo(() => {
    // Use SF Symbol spinner on iOS/iPadOS
    return isIOSDevice && !optimizations.reducedAnimations;
  }, [isIOSDevice, optimizations.reducedAnimations]);
  
  // Loading indicator based on platform and capabilities
  const LoadingIndicator = useMemo(() => {
    if (useNativeSpinner) {
      return (
        <Icon
          name="arrow.clockwise" // iOS system loading indicator
          size={sizePx[size]}
          color={variantColors[variant]}
          animated={true}
          className="animate-spin"
        />
      );
    }
    
    // Fallback for non-iOS or reduced-motion
    return (
      <div className={`${sizeClasses[size]} animate-spin rounded-full border-2 border-[rgba(var(--scb-light-gray),0.3)] ${variantClasses[variant]}`}></div>
    );
  }, [
    useNativeSpinner, 
    size, 
    variant, 
    sizeClasses, 
    variantClasses,
    variantColors
  ]);

  // For full page loading
  if (fullPage) {
    return (
      <div className={`fixed inset-0 ${isDarkMode ? 'bg-[#121212] bg-opacity-80' : 'bg-white bg-opacity-80'} backdrop-blur-sm z-50 flex flex-col items-center justify-center`}>
        {LoadingIndicator}
        {message && (
          <p className={`mt-4 ${textSizeClasses[size]} ${isDarkMode ? 'text-[#e0e0e0]' : 'text-[rgb(var(--scb-dark-gray))]'}`}>{message}</p>
        )}
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center p-4 ${className}`}>
      {LoadingIndicator}
      {message && (
        <p className={`mt-2 ${textSizeClasses[size]} ${isDarkMode ? 'text-[#e0e0e0]' : 'text-[rgb(var(--scb-dark-gray))]'}`}>{message}</p>
      )}
    </div>
  );
};

/**
 * Enhanced Inline Loading Spinner - can be used inline with text
 * Now using native iOS spinner when available
 */
export const EnhancedInlineSpinner: React.FC<{
  size?: 'xs' | 'sm' | 'md';
  className?: string;
  theme?: 'light' | 'dark';
  color?: string;
}> = ({
  size = 'sm',
  className = '',
  theme: propTheme,
  color
}) => {
  const { deviceType, isAppleDevice, prefersColorScheme } = useDeviceCapabilities();
  const { optimizations, isIOSDevice } = useIOSOptimizations();
  
  // Determine effective theme based on props or system preference
  const theme = propTheme || prefersColorScheme || 'light';
  const isDarkMode = theme === 'dark';
  
  // Size maps for different platforms
  const sizeMap = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5'
  };
  
  // Pixel sizes for icons
  const sizePx = {
    xs: 12,
    sm: 16,
    md: 20
  };
  
  // Default color based on theme
  const defaultColor = isDarkMode
    ? 'rgb(0, 142, 211)' // Brighter blue for dark mode
    : 'rgb(0, 114, 170)'; // Standard SCB blue
  
  // Use provided color or default
  const spinnerColor = color || defaultColor;
  
  // Use native iOS spinner when available
  if (isIOSDevice && !optimizations.reducedAnimations) {
    return (
      <Icon
        name="arrow.triangle.2.circlepath" // iOS system inline loading indicator
        size={sizePx[size]}
        color={spinnerColor}
        animated={true}
        className={`inline-block ${className}`}
      />
    );
  }

  // Fallback for non-iOS
  return (
    <Icon
      name="loader" // Lucide loader icon
      size={sizePx[size]}
      color={spinnerColor}
      className={`animate-spin inline-block ${className}`}
    />
  );
};

/**
 * Enhanced Loading Button - Button with loading state
 * Now with platform-specific optimizations for iOS
 */
export const EnhancedLoadingButton: React.FC<{
  loading: boolean;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost';
  icon?: string; // Optional icon (SF Symbol name)
  theme?: 'light' | 'dark';
  loadingText?: string; // Optional loading text
}> = ({
  loading,
  children,
  className = '',
  onClick,
  disabled = false,
  variant = 'primary',
  icon,
  theme: propTheme,
  loadingText
}) => {
  const { deviceType, isAppleDevice, prefersColorScheme } = useDeviceCapabilities();
  const { optimizations, isIOSDevice } = useIOSOptimizations();
  
  // Determine effective theme based on props or system preference
  const theme = propTheme || prefersColorScheme || 'light';
  const isDarkMode = theme === 'dark';
  
  const baseClasses = 'scb-btn inline-flex items-center justify-center gap-2 rounded-md transition-colors';
  const variantClasses = {
    primary: 'scb-btn-primary',
    secondary: 'scb-btn-secondary',
    ghost: 'scb-btn-ghost'
  };
  
  // Platform-specific styles for iOS 
  const iosClasses = isIOSDevice ? 'active:scale-[0.97] active:opacity-[0.93]' : '';
  
  // Loading state text (iOS often shows loading text)
  const displayText = loading && loadingText ? loadingText : children;
  
  // Determine spinner color based on variant and theme
  const spinnerColor = variant === 'primary' 
    ? 'white' 
    : (isDarkMode ? 'rgb(0, 142, 211)' : 'rgb(0, 114, 170)');

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${iosClasses} ${className}`}
      onClick={onClick}
      disabled={loading || disabled}
      style={{
        // Apply iOS-specific styles for better native feel
        WebkitTapHighlightColor: 'transparent',
        ...(isIOSDevice ? { 
          fontWeight: 500,
          letterSpacing: '0.01em',
        } : {})
      }}
    >
      {/* Show icon or loading spinner */}
      {loading ? (
        <EnhancedInlineSpinner size="sm" color={spinnerColor} theme={theme} />
      ) : icon ? (
        <Icon name={icon} size={18} color="currentColor" />
      ) : null}
      
      {displayText}
    </button>
  );
};

/**
 * Enhanced Skeleton Loading Animation for content placeholders
 */
export const EnhancedSkeletonLoader: React.FC<{
  width?: string;
  height?: string;
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  className?: string;
}> = ({
  width = '100%',
  height = '1.5rem',
  rounded = 'md',
  className = ''
}) => {
  const roundedClasses = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    full: 'rounded-full'
  };

  return (
    <div 
      className={`skeleton bg-[rgba(var(--scb-light-gray),0.3)] ${roundedClasses[rounded]} ${className}`}
      style={{ width, height }}
    ></div>
  );
};

/**
 * Enhanced Page Loader - Specifically for page transitions
 * Now with iOS-native appearance
 */
export const EnhancedPageLoader: React.FC<{
  message?: string;
  theme?: 'light' | 'dark';
  logo?: boolean; // Whether to show the SCB logo
  progressIndicator?: boolean; // Whether to show progress indicator
  progress?: number; // Progress value (0-100) if known
}> = ({ 
  message = 'Loading...', 
  theme: propTheme,
  logo = true,
  progressIndicator = false,
  progress
}) => {
  const { deviceType, isAppleDevice, prefersColorScheme } = useDeviceCapabilities();
  const { optimizations, isIOSDevice } = useIOSOptimizations();
  
  // Determine effective theme based on props or system preference
  const theme = propTheme || prefersColorScheme || 'light';
  const isDarkMode = theme === 'dark';
  
  // Background color based on theme
  const bgColor = isDarkMode ? '#121212' : 'white';
  const textColor = isDarkMode ? '#e0e0e0' : 'rgb(var(--scb-dark-gray))';
  
  // Use native iOS spinner for loading
  const LoadingSpinner = () => {
    if (isIOSDevice && !optimizations.reducedAnimations) {
      return (
        <Icon
          name="rays" // iOS system page loading indicator
          size={48}
          color={isDarkMode ? 'rgb(0, 142, 211)' : 'rgb(0, 114, 170)'}
          animated={true}
          className="animate-spin mb-4"
        />
      );
    }
    
    // Fallback for non-iOS
    return (
      <div className="inline-block mb-4">
        <div className="relative">
          <div className={`h-16 w-16 animate-spin rounded-full border-4 border-[rgba(var(--scb-honolulu-blue),0.1)] border-t-[rgb(var(--scb-honolulu-blue))]`}></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className={`h-10 w-10 rounded-full ${isDarkMode ? 'bg-[#121212]' : 'bg-white'}`}></div>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div 
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center transition-opacity duration-300`}
      style={{ backgroundColor: bgColor }}
    >
      <div className="w-full max-w-xs p-6 text-center">
        {/* Logo (optional) */}
        {logo && (
          <div className="mb-6">
            <div className="inline-block w-16 h-16 rounded-xl bg-gradient-to-tr from-[rgb(var(--scb-honolulu-blue))] to-[rgb(var(--scb-lagoon-blue))] p-3">
              <Icon
                name="dollarsign.circle.fill"
                size={40}
                color="white"
                animated={!progressIndicator && !optimizations.reducedAnimations}
              />
            </div>
          </div>
        )}
        
        {/* Loading indicator */}
        {!progressIndicator && <LoadingSpinner />}
        
        {/* Progress bar (iOS style) */}
        {progressIndicator && typeof progress === 'number' && (
          <div className="mb-6 w-full">
            <div 
              className={`w-full h-1.5 rounded-full ${isDarkMode ? 'bg-[#2d2d2f]' : 'bg-[#f0f0f0]'} overflow-hidden`}
            >
              <div 
                className="h-full bg-[rgb(var(--scb-honolulu-blue))] rounded-full transition-all duration-300 ease-out"
                style={{ width: `${Math.max(5, Math.min(100, progress))}%` }}
              />
            </div>
            <div className="text-right mt-1 text-xs text-[#888888]">
              {Math.round(progress)}%
            </div>
          </div>
        )}
        
        {/* Message */}
        <p className={`text-sm ${isDarkMode ? 'text-[#e0e0e0]' : 'text-[rgb(var(--scb-dark-gray))]'}`}>
          {message}
        </p>
      </div>
    </div>
  );
};

export { EnhancedLoadingSpinner };
export default EnhancedLoadingSpinner;