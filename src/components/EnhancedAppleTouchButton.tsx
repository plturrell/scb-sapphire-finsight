import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useDeviceCapabilities } from '../hooks/useDeviceCapabilities';
import { useApplePhysics } from '../hooks/useApplePhysics';
import haptics from '../lib/haptics';
import { useSafeArea, safeAreaCss } from '../hooks/useSafeArea';

export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type ButtonVariant = 
  | 'primary'    // Primary action (main CTA)
  | 'secondary'  // Secondary actions
  | 'tertiary'   // Less important actions
  | 'ghost'      // Subtle actions
  | 'destructive' // Destructive actions (delete, remove)
  | 'link'       // Link-style button
  | 'icon'       // Icon-only button
  | 'SF'         // SF Symbol style button (iOS specific)
  | 'macOS'      // macOS button style
  | 'iPadOS';    // iPadOS button style

export interface EnhancedAppleTouchButtonProps {
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onLongPress?: () => void;
  longPressThreshold?: number; // Time in ms for long press detection
  size?: ButtonSize;
  variant?: ButtonVariant;
  href?: string;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  className?: string;
  id?: string;
  ariaLabel?: string;
  type?: 'button' | 'submit' | 'reset';
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full'; // Border radius options
  hapticFeedback?: boolean; // Enable haptic feedback
  hapticPattern?: 'selection' | 'impact' | 'success' | 'warning' | 'error' | 'action'; // Haptic pattern
  pressAnimation?: boolean; // Enable press animation
  // iOS-specific options
  SFSymbolName?: string; // SF Symbol name (iOS only)
  SFSymbolWeight?: 'ultralight' | 'thin' | 'light' | 'regular' | 'medium' | 'semibold' | 'bold' | 'heavy' | 'black'; // SF Symbol weight
  // macOS-specific options
  neumorphic?: boolean; // Enable neumorphic design for macOS
  // Active state
  isActive?: boolean; // For navigation or toggle buttons
  dynamicIslandSafe?: boolean; // Ensure button is not covered by Dynamic Island on iPhone
  safeAreaBottom?: boolean; // Ensure button respects bottom safe area for home bar
  // Animation behavior
  animateOnMount?: boolean; // Animate when component mounts
  animationDelay?: number; // Delay before animation starts in ms
}

/**
 * Enhanced Apple Touch Button
 * 
 * A button component that follows Apple's design guidelines for different platforms
 * (iOS, iPadOS, macOS) with haptic feedback, animations, and accessibility features.
 */
const EnhancedAppleTouchButton: React.FC<EnhancedAppleTouchButtonProps> = ({
  children,
  onClick,
  onLongPress,
  longPressThreshold = 500,
  size = 'md',
  variant = 'primary',
  href,
  disabled = false,
  loading = false,
  fullWidth = false,
  leadingIcon,
  trailingIcon,
  className = '',
  id,
  ariaLabel,
  type = 'button',
  rounded = 'md',
  hapticFeedback = true,
  hapticPattern = 'impact',
  pressAnimation = true,
  SFSymbolName,
  SFSymbolWeight = 'regular',
  neumorphic = false,
  isActive = false,
  dynamicIslandSafe = false,
  safeAreaBottom = false,
  animateOnMount = false,
  animationDelay = 0
}) => {
  const router = useRouter();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isPressed, setIsPressed] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  
  const { deviceType, prefersColorScheme, isAppleDevice } = useDeviceCapabilities();
  const physics = useApplePhysics({
    motion: pressAnimation ? 'snappy' : 'standard'
  });
  const { hasDynamicIsland } = useSafeArea();
  
  // Platform detection
  const isiOS = deviceType === 'mobile' && isAppleDevice;
  const isiPadOS = deviceType === 'tablet' && isAppleDevice;
  const ismacOS = deviceType === 'desktop' && isAppleDevice;
  
  // Adapt variant based on platform if using platform-specific variants
  const effectiveVariant = variant === 'SF' && !isiOS ? 'primary' :
                          variant === 'macOS' && !ismacOS ? 'primary' :
                          variant === 'iPadOS' && !isiPadOS ? 'primary' :
                          variant;
  
  // Handle mount animation
  useEffect(() => {
    if (animateOnMount) {
      const timer = setTimeout(() => {
        setIsMounted(true);
      }, animationDelay);
      
      return () => {
        clearTimeout(timer);
      };
    } else {
      setIsMounted(true);
    }
  }, [animateOnMount, animationDelay]);
  
  // Size classes
  const getSizeClasses = (): string => {
    // Base sizes with increased touch targets for mobile
    const baseSize = {
      xs: isiOS || isiPadOS ? 'px-2.5 py-1.5 text-xs min-h-[36px]' : 'px-2 py-1 text-xs',
      sm: isiOS || isiPadOS ? 'px-3 py-2 text-sm min-h-[40px]' : 'px-2.5 py-1.5 text-sm',
      md: isiOS || isiPadOS ? 'px-4 py-2.5 text-base min-h-[44px]' : 'px-3 py-2 text-base',
      lg: isiOS || isiPadOS ? 'px-5 py-3 text-lg min-h-[52px]' : 'px-4 py-2.5 text-lg',
      xl: isiOS || isiPadOS ? 'px-6 py-3.5 text-xl min-h-[60px]' : 'px-5 py-3 text-xl'
    }[size];
    
    // For icon buttons, use square dimensions
    if (effectiveVariant === 'icon' || SFSymbolName) {
      return {
        xs: 'p-1 w-7 h-7',
        sm: 'p-1.5 w-8 h-8',
        md: 'p-2 w-10 h-10',
        lg: 'p-2.5 w-12 h-12',
        xl: 'p-3 w-14 h-14'
      }[size];
    }
    
    return baseSize;
  };
  
  // Rounded classes
  const getRoundedClasses = (): string => {
    return {
      none: 'rounded-none',
      sm: 'rounded-sm',
      md: 'rounded-md',
      lg: 'rounded-lg',
      full: 'rounded-full'
    }[rounded];
  };
  
  // Variant classes - platform-specific styling
  const getVariantClasses = (): string => {
    const isDark = prefersColorScheme === 'dark';
    
    // iOS specific styling
    if (isiOS && (effectiveVariant === 'SF' || effectiveVariant === 'primary')) {
      return isDark
        ? 'bg-[#0A84FF] text-white active:bg-[#0870D8]'
        : 'bg-[#007AFF] text-white active:bg-[#0063D1]';
    }
    
    // iPadOS specific styling
    if (isiPadOS && (effectiveVariant === 'iPadOS' || effectiveVariant === 'primary')) {
      return isDark
        ? 'bg-[#0A84FF] text-white active:bg-[#0870D8]'
        : 'bg-[#007AFF] text-white active:bg-[#0063D1]';
    }
    
    // macOS specific styling with neumorphic effect
    if (ismacOS && (effectiveVariant === 'macOS' || effectiveVariant === 'primary')) {
      if (neumorphic) {
        return isDark
          ? 'bg-[#2A2A2C] text-white border border-[#3A3A3C] shadow-sm active:shadow-inner active:bg-[#252527]'
          : 'bg-[#F5F5F7] text-[#1D1D1F] border border-[#E5E5EA] shadow-sm active:shadow-inner active:bg-[#EBEBED]';
      }
      
      return isDark
        ? 'bg-[#0A84FF] text-white active:bg-[#0870D8]'
        : 'bg-[#007AFF] text-white active:bg-[#0063D1]';
    }
    
    // Generic variants mapped to SCB colors
    switch (effectiveVariant) {
      case 'primary':
        return 'bg-[rgb(var(--scb-honolulu-blue))] text-white hover:bg-[rgb(var(--scb-honolulu-blue-dark))] active:bg-[rgb(var(--scb-honolulu-blue-dark))]';
      case 'secondary':
        return isDark 
          ? 'bg-[rgba(255,255,255,0.1)] text-white hover:bg-[rgba(255,255,255,0.15)] active:bg-[rgba(255,255,255,0.2)]'
          : 'bg-[rgba(0,0,0,0.05)] text-[rgb(var(--scb-dark-gray))] hover:bg-[rgba(0,0,0,0.1)] active:bg-[rgba(0,0,0,0.15)]';
      case 'tertiary':
        return isDark
          ? 'bg-transparent text-white border border-[rgba(255,255,255,0.15)] hover:bg-[rgba(255,255,255,0.05)] active:bg-[rgba(255,255,255,0.1)]'
          : 'bg-transparent text-[rgb(var(--scb-dark-gray))] border border-[rgba(0,0,0,0.15)] hover:bg-[rgba(0,0,0,0.03)] active:bg-[rgba(0,0,0,0.06)]';
      case 'ghost':
        return isDark
          ? 'bg-transparent text-white hover:bg-[rgba(255,255,255,0.05)] active:bg-[rgba(255,255,255,0.1)]'
          : 'bg-transparent text-[rgb(var(--scb-dark-gray))] hover:bg-[rgba(0,0,0,0.03)] active:bg-[rgba(0,0,0,0.06)]';
      case 'destructive':
        return isDark
          ? 'bg-[rgb(255,69,58)] text-white hover:bg-[rgb(215,59,48)] active:bg-[rgb(200,55,45)]'
          : 'bg-[rgb(255,59,48)] text-white hover:bg-[rgb(215,50,40)] active:bg-[rgb(200,45,35)]';
      case 'link':
        return isDark
          ? 'bg-transparent text-[#0A84FF] hover:underline active:text-[#0870D8]'
          : 'bg-transparent text-[#007AFF] hover:underline active:text-[#0063D1]';
      case 'icon':
        return isDark
          ? 'bg-transparent text-white hover:bg-[rgba(255,255,255,0.1)] active:bg-[rgba(255,255,255,0.15)]'
          : 'bg-transparent text-[rgb(var(--scb-dark-gray))] hover:bg-[rgba(0,0,0,0.05)] active:bg-[rgba(0,0,0,0.1)]';
      default:
        return 'bg-[rgb(var(--scb-honolulu-blue))] text-white hover:bg-[rgb(var(--scb-honolulu-blue-dark))] active:bg-[rgb(var(--scb-honolulu-blue-dark))]';
    }
  };
  
  // Active state classes
  const getActiveStateClasses = (): string => {
    if (!isActive) return '';
    
    const isDark = prefersColorScheme === 'dark';
    
    switch (effectiveVariant) {
      case 'primary':
      case 'SF':
      case 'macOS':
      case 'iPadOS':
        return 'bg-[rgb(var(--scb-honolulu-blue-dark))]';
      case 'secondary':
        return isDark ? 'bg-[rgba(255,255,255,0.2)]' : 'bg-[rgba(0,0,0,0.15)]';
      case 'tertiary':
        return isDark ? 'bg-[rgba(255,255,255,0.1)]' : 'bg-[rgba(0,0,0,0.06)]';
      case 'ghost':
        return isDark ? 'bg-[rgba(255,255,255,0.1)]' : 'bg-[rgba(0,0,0,0.06)]';
      case 'destructive':
        return 'bg-[rgb(200,45,35)]';
      case 'link':
        return 'underline';
      case 'icon':
        return isDark ? 'bg-[rgba(255,255,255,0.15)]' : 'bg-[rgba(0,0,0,0.1)]';
      default:
        return '';
    }
  };
  
  // Disabled state classes
  const getDisabledClasses = (): string => {
    const isDark = prefersColorScheme === 'dark';
    
    return isDark
      ? 'opacity-50 cursor-not-allowed bg-[rgba(255,255,255,0.1)] text-[rgba(255,255,255,0.5)]'
      : 'opacity-50 cursor-not-allowed bg-[rgba(0,0,0,0.05)] text-[rgba(0,0,0,0.5)]';
  };
  
  // Combine all classes
  const buttonClasses = `
    font-medium flex items-center justify-center transition-all
    ${getSizeClasses()}
    ${getRoundedClasses()}
    ${disabled ? getDisabledClasses() : getVariantClasses()}
    ${isActive && !disabled ? getActiveStateClasses() : ''}
    ${fullWidth ? 'w-full' : ''}
    ${safeAreaBottom ? `mb-[${safeAreaCss.bottom}]` : ''}
    ${dynamicIslandSafe && hasDynamicIsland ? `mt-[${safeAreaCss.dynamicIslandTop}]` : ''}
    ${className}
  `;
  
  // Animation style for button press effect
  const getAnimationStyle = () => {
    if (!pressAnimation) return {};
    
    const scale = isPressed ? 0.97 : 1;
    
    return {
      transform: `scale(${scale})`,
      transition: `transform ${physics.spring.duration * 0.6}ms cubic-bezier(0.25, 0.1, 0.25, 1.0)`
    };
  };
  
  // Animation style for mount effect
  const getMountAnimationStyle = () => {
    if (!animateOnMount) return {};
    
    return {
      opacity: isMounted ? 1 : 0,
      transform: isMounted ? 'scale(1)' : 'scale(0.95)',
      transition: `opacity ${physics.spring.duration * 0.8}ms ease-out, transform ${physics.spring.duration}ms cubic-bezier(0.16, 1.0, 0.22, 1.0)`
    };
  };
  
  // Handle button click with haptic feedback
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || loading) return;
    
    // Trigger haptic feedback if enabled
    if (hapticFeedback && (isiOS || isiPadOS)) {
      switch (hapticPattern) {
        case 'selection':
          haptics.selection();
          break;
        case 'impact':
          haptics.medium();
          break;
        case 'success':
          haptics.success();
          break;
        case 'warning':
          haptics.warning();
          break;
        case 'error':
          haptics.error();
          break;
        case 'action':
        default:
          haptics.action();
          break;
      }
    }
    
    // Clear any pending long press timer
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    
    // Handle navigation if href is provided
    if (href) {
      router.push(href);
      return;
    }
    
    // Execute onClick handler if provided
    if (onClick) {
      onClick(e);
    }
  };
  
  // Handle touch start event
  const handleTouchStart = () => {
    if (disabled || loading) return;
    
    setIsPressed(true);
    
    // Set up long press timer if onLongPress is provided
    if (onLongPress) {
      longPressTimer.current = setTimeout(() => {
        // Trigger long press haptic
        if (hapticFeedback && (isiOS || isiPadOS)) {
          haptics.heavy();
        }
        
        onLongPress();
        longPressTimer.current = null;
      }, longPressThreshold);
    }
  };
  
  // Handle touch end event
  const handleTouchEnd = () => {
    if (disabled || loading) return;
    
    setIsPressed(false);
    
    // Clear any pending long press timer
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };
  
  // Handle mouse down event (for non-touch devices)
  const handleMouseDown = () => {
    if (disabled || loading) return;
    
    setIsPressed(true);
  };
  
  // Handle mouse up event (for non-touch devices)
  const handleMouseUp = () => {
    if (disabled || loading) return;
    
    setIsPressed(false);
  };
  
  // Render SF Symbol if provided (iOS only)
  const renderSFSymbol = () => {
    if (!SFSymbolName || !isiOS) return null;
    
    return (
      <span
        className="sf-symbol"
        style={{
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro", sans-serif',
          fontWeight: {
            ultralight: 100,
            thin: 200,
            light: 300,
            regular: 400,
            medium: 500,
            semibold: 600,
            bold: 700,
            heavy: 800,
            black: 900
          }[SFSymbolWeight]
        }}
      >
        {SFSymbolName}
      </span>
    );
  };
  
  return (
    <button
      ref={buttonRef}
      id={id}
      type={type}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      disabled={disabled || loading}
      aria-disabled={disabled || loading}
      aria-label={ariaLabel}
      aria-pressed={isActive}
      className={buttonClasses}
      style={{
        ...getAnimationStyle(),
        ...getMountAnimationStyle()
      }}
    >
      {/* Loading indicator */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div 
            className={`animate-spin rounded-full border-2 border-current opacity-30 h-5 w-5 border-r-transparent`}
            style={{ borderTopColor: 'currentColor' }}
          ></div>
        </div>
      )}
      
      {/* Button contents with proper opacity when loading */}
      <div className={`flex items-center justify-center ${loading ? 'opacity-0' : 'opacity-100'}`}>
        {/* SF Symbol */}
        {SFSymbolName && renderSFSymbol()}
        
        {/* Leading icon */}
        {leadingIcon && <span className="mr-2 -ml-1">{leadingIcon}</span>}
        
        {/* Button text */}
        {children}
        
        {/* Trailing icon */}
        {trailingIcon && <span className="ml-2 -mr-1">{trailingIcon}</span>}
      </div>
    </button>
  );
};

export default EnhancedAppleTouchButton;