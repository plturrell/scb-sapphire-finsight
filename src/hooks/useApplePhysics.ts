import { useState, useEffect, useMemo } from 'react';
import { useDeviceCapabilities } from './useDeviceCapabilities';

// Spring physics presets aligned with Apple's standards
type SpringPreset = {
  stiffness: number;
  damping: number;
  mass: number;
  duration: number;
};

// Constants definition for different motion types
export type AppleMotionType = 
  | 'standard' 
  | 'snappy' 
  | 'gentle' 
  | 'bouncy' 
  | 'emphasized'
  | 'subtle';

// Device-specific spring physics
type DeviceSpringPresets = {
  [key in 'desktop' | 'tablet' | 'mobile']: {
    [key in AppleMotionType]: SpringPreset;
  };
};

// Realistic approximation of Apple's spring physics across devices
const SPRING_PRESETS: DeviceSpringPresets = {
  desktop: {
    // Modeled after macOS transitions
    standard: { stiffness: 170, damping: 24, mass: 1, duration: 350 },
    snappy: { stiffness: 300, damping: 24, mass: 1, duration: 250 },
    gentle: { stiffness: 120, damping: 26, mass: 1, duration: 450 },
    bouncy: { stiffness: 240, damping: 18, mass: 1, duration: 400 },
    emphasized: { stiffness: 200, damping: 22, mass: 1.2, duration: 400 },
    subtle: { stiffness: 150, damping: 28, mass: 1, duration: 300 }
  },
  tablet: {
    // Modeled after iPadOS transitions
    standard: { stiffness: 200, damping: 25, mass: 1, duration: 320 },
    snappy: { stiffness: 320, damping: 22, mass: 1, duration: 220 },
    gentle: { stiffness: 150, damping: 30, mass: 1, duration: 400 },
    bouncy: { stiffness: 280, damping: 16, mass: 1, duration: 380 },
    emphasized: { stiffness: 240, damping: 20, mass: 1.2, duration: 380 },
    subtle: { stiffness: 180, damping: 30, mass: 1, duration: 280 }
  },
  mobile: {
    // Modeled after iOS transitions
    standard: { stiffness: 230, damping: 22, mass: 1, duration: 300 },
    snappy: { stiffness: 350, damping: 20, mass: 1, duration: 200 },
    gentle: { stiffness: 180, damping: 28, mass: 1, duration: 380 },
    bouncy: { stiffness: 300, damping: 14, mass: 1, duration: 350 },
    emphasized: { stiffness: 270, damping: 18, mass: 1.2, duration: 350 },
    subtle: { stiffness: 200, damping: 32, mass: 1, duration: 250 }
  }
};

// Default timing function modeled after Apple's acceleration curves
const TIMING_FUNCTIONS = {
  standard: 'cubic-bezier(0.42, 0, 0.58, 1)', // Apple's standard easing
  accelerate: 'cubic-bezier(0.4, 0.0, 1, 1)', // Ease-in
  decelerate: 'cubic-bezier(0.0, 0.0, 0.2, 1)', // Ease-out
  emphasizedAccelerate: 'cubic-bezier(0.3, 0.0, 0.8, 0.15)', // Emphasized ease-in
  emphasizedDecelerate: 'cubic-bezier(0.05, 0.7, 0.1, 1.0)' // Emphasized ease-out
};

// Default durations for non-spring animations (in ms)
const DURATIONS = {
  short: 200,
  standard: 350,
  medium: 500,
  long: 700
};

// Reduces motion when user prefers reduced motion
const REDUCED_MOTION_FACTOR = 0.7;

export interface ApplePhysicsConfig {
  motion: AppleMotionType;
  reduceForLowPower?: boolean;
  respectReduceMotion?: boolean;
}

export interface ApplePhysicsOutput {
  // Spring physics
  spring: SpringPreset;
  // Animation style for CSS
  cssTransition: (property: string) => string;
  cssSpring: (property: string) => string;
  // React animation config (for react-spring, framer-motion, etc.)
  config: SpringPreset & { duration: number };
  // Helper to determine if animations should be minimal
  shouldReduceMotion: boolean;
  // Device-specific timing and durations
  timing: typeof TIMING_FUNCTIONS;
  duration: number;
  // Platform information
  platform: 'desktop' | 'tablet' | 'mobile';
}

/**
 * Hook that provides platform-specific animation physics based on Apple's standards
 * Adapts to device capabilities, preferences, and platform characteristics
 */
export function useApplePhysics(config: ApplePhysicsConfig): ApplePhysicsOutput {
  const { 
    motion = 'standard',
    reduceForLowPower = true,
    respectReduceMotion = true
  } = config;
  
  const { 
    deviceType,
    tier,
    prefersReducedMotion,
    battery
  } = useDeviceCapabilities();
  
  // Determine platform type (desktop, tablet, mobile)
  const platform = useMemo(() => {
    if (deviceType === 'mobile') return 'mobile';
    if (deviceType === 'tablet') return 'tablet';
    return 'desktop';
  }, [deviceType]);
  
  // Check if we should reduce motion based on preferences and device state
  const shouldReduceMotion = useMemo(() => {
    if (respectReduceMotion && prefersReducedMotion) return true;
    if (reduceForLowPower && tier === 'low') return true;
    if (reduceForLowPower && battery?.level && battery.level < 0.2 && !battery.charging) return true;
    return false;
  }, [respectReduceMotion, prefersReducedMotion, reduceForLowPower, tier, battery]);
  
  // Get the appropriate spring preset
  const spring = useMemo(() => {
    const basePreset = SPRING_PRESETS[platform][motion];
    
    if (shouldReduceMotion) {
      // Reduce animation complexity when needed
      return {
        ...basePreset,
        duration: basePreset.duration * REDUCED_MOTION_FACTOR,
        stiffness: basePreset.stiffness * 1.2, // Stiffer springs = faster settling
        damping: basePreset.damping * 1.3 // Higher damping = less oscillation
      };
    }
    
    return basePreset;
  }, [platform, motion, shouldReduceMotion]);
  
  // Adjusted duration based on device and preferences
  const duration = useMemo(() => {
    const baseDuration = DURATIONS.standard;
    
    if (shouldReduceMotion) {
      return baseDuration * REDUCED_MOTION_FACTOR;
    }
    
    return baseDuration;
  }, [shouldReduceMotion]);
  
  // Generate CSS transition string
  const cssTransition = (property: string) => {
    const timingFunction = shouldReduceMotion ? TIMING_FUNCTIONS.standard : TIMING_FUNCTIONS.standard;
    return `${property} ${duration}ms ${timingFunction}`;
  };
  
  // Generate CSS spring animation
  const cssSpring = (property: string) => {
    return `${property} ${spring.duration}ms cubic-bezier(${spring.stiffness * 0.001}, ${spring.damping * 0.01}, 0.1, 1)`;
  };
  
  return {
    spring,
    cssTransition,
    cssSpring,
    config: {
      ...spring,
      duration: spring.duration
    },
    shouldReduceMotion,
    timing: TIMING_FUNCTIONS,
    duration,
    platform
  };
}

// Helper for creating keyframe animations with Apple-like timing
export function createAppleKeyframes(
  name: string,
  keyframes: string,
  options?: { 
    duration?: number; 
    motion?: AppleMotionType; 
    iterationCount?: number | 'infinite';
    fillMode?: 'forwards' | 'backwards' | 'both' | 'none';
  }
) {
  const { 
    duration = DURATIONS.standard,
    motion = 'standard',
    iterationCount = 1,
    fillMode = 'forwards'
  } = options || {};
  
  // Get the relevant timing function based on motion type
  let timingFunction = TIMING_FUNCTIONS.standard;
  if (motion === 'snappy') timingFunction = TIMING_FUNCTIONS.accelerate;
  if (motion === 'gentle') timingFunction = TIMING_FUNCTIONS.decelerate;
  if (motion === 'emphasized') timingFunction = TIMING_FUNCTIONS.emphasizedDecelerate;
  
  return `
    @keyframes ${name} {
      ${keyframes}
    }
    .${name} {
      animation-name: ${name};
      animation-duration: ${duration}ms;
      animation-timing-function: ${timingFunction};
      animation-fill-mode: ${fillMode};
      animation-iteration-count: ${iterationCount};
    }
  `;
}

// Export common Apple animation patterns
export const appleAnimations = {
  fadeIn: createAppleKeyframes(
    'scb-apple-fade-in',
    `
      from { opacity: 0; }
      to { opacity: 1; }
    `,
    { duration: 300, motion: 'gentle' }
  ),
  fadeOut: createAppleKeyframes(
    'scb-apple-fade-out',
    `
      from { opacity: 1; }
      to { opacity: 0; }
    `,
    { duration: 250, motion: 'gentle' }
  ),
  scaleIn: createAppleKeyframes(
    'scb-apple-scale-in',
    `
      from { transform: scale(0.95); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    `,
    { duration: 350, motion: 'emphasized' }
  ),
  slideInRight: createAppleKeyframes(
    'scb-apple-slide-in-right',
    `
      from { transform: translateX(20px); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    `,
    { duration: 350, motion: 'standard' }
  ),
  slideInUp: createAppleKeyframes(
    'scb-apple-slide-in-up',
    `
      from { transform: translateY(20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    `,
    { duration: 350, motion: 'standard' }
  ),
  pulse: createAppleKeyframes(
    'scb-apple-pulse',
    `
      0% { transform: scale(1); }
      50% { transform: scale(1.05); }
      100% { transform: scale(1); }
    `,
    { duration: 1000, motion: 'bouncy', iterationCount: 'infinite' }
  )
};

export default useApplePhysics;