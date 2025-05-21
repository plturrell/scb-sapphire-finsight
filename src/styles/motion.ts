/**
 * SCB Motion System
 * 
 * This file provides utilities for handling motion preferences and
 * applying appropriate animations based on device capabilities and user preferences.
 */
import tokens from './tokens';

// Motion preference detection utilities
export const motionPreferences = {
  /**
   * Checks if the user has requested reduced motion
   */
  prefersReducedMotion: () => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  },

  /**
   * Checks if the device has high-end capabilities for animations
   */
  isHighPerformanceDevice: () => {
    if (typeof window === 'undefined') return false;
    
    // Use navigator.deviceMemory if available (Chrome)
    if ('deviceMemory' in navigator) {
      return (navigator as any).deviceMemory >= 4; // 4GB+ RAM
    }
    
    // Use hardwareConcurrency as a fallback
    if ('hardwareConcurrency' in navigator) {
      return navigator.hardwareConcurrency >= 4; // 4+ cores
    }
    
    // Default to true for desktop devices
    return !('ontouchstart' in window);
  },

  /**
   * Checks if the device is an iOS device
   */
  isIOSDevice: () => {
    if (typeof window === 'undefined') return false;
    
    const ua = navigator.userAgent;
    return /iPad|iPhone|iPod/.test(ua) || 
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  },

  /**
   * Checks if the device is a high-end iOS device (newer models)
   */
  isHighEndIOSDevice: () => {
    if (typeof window === 'undefined') return false;
    
    const ua = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(ua) || 
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      
    if (!isIOS) return false;
    
    // Try to detect newer iOS devices by features
    // This is an approximation since exact device detection is challenging
    if ('maxTouchPoints' in navigator) {
      return navigator.maxTouchPoints >= 5;
    }
    
    return true; // Assume high-end for iOS if we can't tell
  },

  /**
   * Gets network connection speed if available
   */
  getNetworkSpeed: (): 'slow' | 'medium' | 'fast' | 'unknown' => {
    if (typeof navigator === 'undefined' || !('connection' in navigator)) {
      return 'unknown';
    }
    
    const connection = (navigator as any).connection;
    
    if (!connection) return 'unknown';
    
    // Handle effective connection type
    if (connection.effectiveType) {
      switch (connection.effectiveType) {
        case 'slow-2g':
        case '2g':
          return 'slow';
        case '3g':
          return 'medium';
        case '4g':
          return 'fast';
        default:
          return 'unknown';
      }
    }
    
    // Fallback to downlink
    if (connection.downlink) {
      if (connection.downlink < 1) return 'slow';
      if (connection.downlink < 5) return 'medium';
      return 'fast';
    }
    
    return 'unknown';
  }
};

// Animation duration adjustments based on preferences
export const getAdjustedDuration = (
  baseDuration: string = tokens.animation.duration.normal,
  options?: {
    reduceForSlowNetwork?: boolean,
    reduceForReducedMotion?: boolean,
    boostForHighEnd?: boolean
  }
): string => {
  const opts = {
    reduceForSlowNetwork: true,
    reduceForReducedMotion: true,
    boostForHighEnd: false,
    ...options
  };

  // Convert base duration to number (ms)
  const baseDurationMs = parseInt(baseDuration.replace('ms', ''));
  
  if (opts.reduceForReducedMotion && motionPreferences.prefersReducedMotion()) {
    return '10ms'; // Minimal duration
  }
  
  const networkSpeed = motionPreferences.getNetworkSpeed();
  if (opts.reduceForSlowNetwork && networkSpeed === 'slow') {
    return Math.min(baseDurationMs, 100) + 'ms'; // Significant reduction
  }
  
  if (opts.boostForHighEnd && motionPreferences.isHighPerformanceDevice()) {
    // High-end devices can handle more complex/longer animations
    return Math.floor(baseDurationMs * 1.2) + 'ms';
  }
  
  return baseDuration;
};

// Animation easing adjustments based on device
export const getAdjustedEasing = (
  baseEasing: string = tokens.animation.ease.inOut
): string => {
  // Use Apple-optimized easing for iOS devices
  if (motionPreferences.isIOSDevice()) {
    // Map standard easings to Apple-optimized versions
    switch (baseEasing) {
      case tokens.animation.ease.in:
        return tokens.animation.ease.appleIn;
      case tokens.animation.ease.out:
        return tokens.animation.ease.appleOut;
      case tokens.animation.ease.inOut:
        return tokens.animation.ease.appleInOut;
      default:
        return baseEasing;
    }
  }
  
  return baseEasing;
};

// Animation delay calculation for staggered animations
export const getStaggeredDelay = (
  index: number, 
  baseDelay: number = 50, 
  maxDelay: number = 500
): string => {
  // Cap the delay at maxDelay
  const delay = Math.min(index * baseDelay, maxDelay);
  
  // Check if we should reduce delays for performance reasons
  if (motionPreferences.prefersReducedMotion()) {
    return '0ms';
  }
  
  const networkSpeed = motionPreferences.getNetworkSpeed();
  if (networkSpeed === 'slow') {
    return '0ms'; // No delay for slow networks
  }
  
  return `${delay}ms`;
};

// Factory function to create animation style objects
export const createAnimationStyle = (
  animationName: string,
  options?: {
    duration?: string,
    easing?: string,
    delay?: string | number,
    fillMode?: string,
    iterations?: number | 'infinite',
    direction?: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse',
    adjustForPreferences?: boolean
  }
) => {
  const opts = {
    duration: tokens.animation.duration.normal,
    easing: tokens.animation.ease.inOut,
    delay: '0ms',
    fillMode: 'both',
    iterations: 1,
    direction: 'normal' as const,
    adjustForPreferences: true,
    ...options
  };
  
  // Apply preference-based adjustments if needed
  if (opts.adjustForPreferences) {
    opts.duration = getAdjustedDuration(opts.duration);
    opts.easing = getAdjustedEasing(opts.easing);
  }
  
  // Format delay if it's a number
  const delay = typeof opts.delay === 'number' ? `${opts.delay}ms` : opts.delay;
  
  return {
    animationName,
    animationDuration: opts.duration,
    animationTimingFunction: opts.easing,
    animationDelay: delay,
    animationFillMode: opts.fillMode,
    animationIterationCount: opts.iterations,
    animationDirection: opts.direction
  };
};

// Animation presets for common scenarios
export const animationPresets = {
  fadeIn: (options?: any) => createAnimationStyle('fadeIn', options),
  fadeOut: (options?: any) => createAnimationStyle('fadeOut', options),
  fadeInUp: (options?: any) => createAnimationStyle('fadeInUp', options),
  fadeInDown: (options?: any) => createAnimationStyle('fadeInDown', options),
  slideInRight: (options?: any) => createAnimationStyle('slideInRight', options),
  slideOutRight: (options?: any) => createAnimationStyle('slideOutRight', options),
  slideInLeft: (options?: any) => createAnimationStyle('slideInLeft', options),
  slideOutLeft: (options?: any) => createAnimationStyle('slideOutLeft', options),
  scaleIn: (options?: any) => createAnimationStyle('scaleIn', options),
  scaleOut: (options?: any) => createAnimationStyle('scaleOut', options),
  pulse: (options?: any) => createAnimationStyle('pulse', { iterations: 'infinite', ...options }),
  spin: (options?: any) => createAnimationStyle('spin', { iterations: 'infinite', easing: 'linear', ...options }),
  shimmer: (options?: any) => createAnimationStyle('shimmer', { iterations: 'infinite', duration: '1.5s', easing: 'linear', ...options }),
  buttonPress: (options?: any) => createAnimationStyle('buttonPress', { duration: tokens.animation.duration.fast, ...options }),
  ripple: (options?: any) => createAnimationStyle('ripple', { duration: tokens.animation.duration.normal, easing: tokens.animation.ease.out, ...options }),
};

// Hook utility for React components to check motion preferences
export const useMotionPreferences = () => {
  // This would actually be implemented as a React hook with useState, useEffect, etc.
  // For now, return static values
  return {
    prefersReducedMotion: motionPreferences.prefersReducedMotion(),
    isHighPerformanceDevice: motionPreferences.isHighPerformanceDevice(),
    isIOSDevice: motionPreferences.isIOSDevice(),
    networkSpeed: motionPreferences.getNetworkSpeed(),
    getAdjustedDuration,
    getAdjustedEasing,
    getStaggeredDelay,
    createAnimationStyle,
    animationPresets
  };
};

export default {
  motionPreferences,
  getAdjustedDuration,
  getAdjustedEasing,
  getStaggeredDelay,
  createAnimationStyle,
  animationPresets,
  useMotionPreferences
};