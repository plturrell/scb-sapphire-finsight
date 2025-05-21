import React, { useMemo } from 'react';
import SFSymbol from './SFSymbol';
import { useDeviceCapabilities } from '../hooks/useDeviceCapabilities';
import { useIOSOptimizations } from '../lib/performance';
import { SFSymbolProps } from '../lib/sf-symbols';

interface EnhancedIOSIconProps extends Omit<SFSymbolProps, 'fallbackIcon'> {
  className?: string;
  style?: React.CSSProperties;
  /**
   * Automatically respond to iOS system appearance changes
   * (dark mode, high contrast, etc.)
   */
  adaptToSystem?: boolean;
  /**
   * Icon will respond to user interaction with subtle feedback
   */
  interactive?: boolean;
  /**
   * Subtle animation on mount (iOS only)
   */
  animateOnMount?: boolean;
  /**
   * Custom interactions
   */
  onTap?: () => void;
  onLongPress?: () => void;
  onDoubleTap?: () => void;
  /**
   * Role for icon (navigation, action, toggle, decoration)
   */
  role?: 'navigation' | 'action' | 'toggle' | 'decoration' | 'status' | 'critical';
}

/**
 * EnhancedIOSIcon Component
 * 
 * A highly optimized icon component for iOS/iPadOS that adapts to system settings,
 * provides native feel, and automatically scales with device capabilities.
 */
export default function EnhancedIOSIcon({
  name,
  size = 24,
  color = 'currentColor',
  weight = 'regular',
  scale = 'medium',
  variant,
  renderingMode,
  animated = false,
  animationVariant,
  accessibilityLabel,
  fallbackGlyph,
  secondaryColor,
  tertiaryColor,
  className = '',
  style = {},
  adaptToSystem = true,
  interactive = false,
  animateOnMount = false,
  onTap,
  onLongPress,
  onDoubleTap,
  role = 'decoration',
}: EnhancedIOSIconProps) {
  const { 
    deviceType, 
    isAppleDevice, 
    prefersColorScheme, 
    tier,
    prefersReducedMotion,
    screenSize
  } = useDeviceCapabilities();
  
  const { optimizations, isIOSDevice } = useIOSOptimizations();
  
  // Automatically determine weight based on device type and role
  const effectiveWeight = useMemo(() => {
    if (weight !== 'regular') return weight;
    
    // On iPad, use slightly lighter weights for a more refined look
    if (isAppleDevice && deviceType === 'tablet') {
      if (role === 'navigation') return 'medium';
      if (role === 'action') return 'semibold';
      if (role === 'critical') return 'semibold';
      if (role === 'status') return 'regular';
      if (role === 'toggle') return 'medium';
      return 'regular';
    }
    
    // On iPhone, use slightly bolder weights for better readability
    if (isAppleDevice && deviceType === 'mobile') {
      if (role === 'navigation') return 'medium';
      if (role === 'action') return 'semibold';
      if (role === 'critical') return 'bold';
      if (role === 'status') return 'medium';
      if (role === 'toggle') return 'semibold';
      return 'medium';
    }
    
    return weight;
  }, [weight, isAppleDevice, deviceType, role]);
  
  // Automatically determine variant based on device & role
  const effectiveVariant = useMemo(() => {
    if (variant) return variant;
    
    // On iOS, use filled variants for certain roles
    if (isAppleDevice) {
      if (role === 'action') return 'fill';
      if (role === 'critical') return 'fill';
      if (role === 'toggle') return 'fill';
    }
    
    return 'none';
  }, [variant, isAppleDevice, role]);
  
  // Automatically determine rendering mode based on device & role
  const effectiveRenderingMode = useMemo(() => {
    if (renderingMode) return renderingMode;
    
    // On iOS 15+, use hierarchical for navigation and status
    if (isAppleDevice) {
      if (role === 'navigation' || role === 'status') return 'hierarchical';
      if (role === 'critical') return 'multicolor';
    }
    
    return 'monochrome';
  }, [renderingMode, isAppleDevice, role]);
  
  // Automatically determine animation based on settings
  const effectiveAnimated = useMemo(() => {
    // Respect reduced motion setting
    if (prefersReducedMotion) return false;
    if (optimizations.reducedAnimations) return false;
    
    return animated || animateOnMount;
  }, [animated, animateOnMount, prefersReducedMotion, optimizations]);
  
  // Adapt scale based on device
  const effectiveScale = useMemo(() => {
    if (scale !== 'medium') return scale;
    
    // For smaller screens, use a smaller scale
    if (screenSize === 'mobile' && deviceType === 'mobile') {
      return 'small';
    }
    
    // For larger screens, use a larger scale
    if (screenSize === 'desktop' || deviceType === 'desktop') {
      return 'large';
    }
    
    return scale;
  }, [scale, screenSize, deviceType]);
  
  // Set interactive class
  const interactiveClass = interactive && isIOSDevice 
    ? 'ios-icon-interactive' 
    : '';
  
  // Adjust size based on device type (visual consistency across platforms)
  const effectiveSize = useMemo(() => {
    if (typeof size === 'string') return size;
    
    // Slightly adjust sizes for different platforms to maintain visual consistency
    if (isAppleDevice && deviceType === 'mobile') {
      // iPhone scaling
      return size * 0.95;
    } else if (isAppleDevice && deviceType === 'tablet') {
      // iPad scaling
      return size * 1.0;
    }
    
    return size;
  }, [size, isAppleDevice, deviceType]);
  
  // Handle tap interaction
  const handleClick = () => {
    onTap?.();
  };
  
  return (
    <span
      className={`enhanced-ios-icon ${interactiveClass} ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        userSelect: 'none',
        ...style
      }}
      onClick={interactive ? handleClick : undefined}
      role={role === 'action' || role === 'navigation' ? 'button' : 'img'}
      aria-label={accessibilityLabel}
    >
      <SFSymbol
        name={name}
        size={effectiveSize}
        color={color}
        weight={effectiveWeight}
        scale={effectiveScale}
        variant={effectiveVariant}
        renderingMode={effectiveRenderingMode}
        animated={effectiveAnimated}
        animationVariant={animateOnMount ? 'appear' : animationVariant}
        accessibilityLabel={accessibilityLabel}
        fallbackGlyph={fallbackGlyph}
        secondaryColor={secondaryColor}
        tertiaryColor={tertiaryColor}
      />
      
      {/* iOS-specific interactive feedback styles */}
      {interactive && isIOSDevice && (
        <style jsx>{`
          .ios-icon-interactive {
            cursor: pointer;
            transition: transform 0.2s ease-out, opacity 0.2s ease-out;
          }
          
          .ios-icon-interactive:active {
            transform: scale(0.9);
            opacity: 0.7;
          }
          
          @media (hover: hover) {
            .ios-icon-interactive:hover {
              opacity: 0.8;
            }
          }
        `}</style>
      )}
    </span>
  );
}