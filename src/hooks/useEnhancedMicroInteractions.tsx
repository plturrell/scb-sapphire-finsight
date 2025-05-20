import React from 'react';
import { useSpring, animated, config, SpringConfig } from '@react-spring/web';

// Define the available micro-interaction types
export type MicroInteractionType = 
  | 'pulse'
  | 'bounce'
  | 'shake'
  | 'tilt'
  | 'scale'
  | 'highlight'
  | 'fade'
  | 'slide'
  | 'expand'
  | 'rotate'
  | 'flash';

// Define the available spring presets
export type SpringPreset = 
  | 'gentle' 
  | 'wobbly' 
  | 'stiff' 
  | 'slow' 
  | 'molasses'
  | 'default';

export interface MicroInteractionOptions {
  active?: boolean;
  direction?: 'up' | 'down' | 'left' | 'right' | 'in' | 'out';
  intensity?: 'subtle' | 'medium' | 'strong';
  timing?: number | SpringPreset;
  repeat?: boolean | number;
  delay?: number;
  duration?: number;
  customConfig?: SpringConfig;
  onComplete?: () => void;
}

// Define color-related types
export type ColorType = string | { from: string; to: string };

// Hook for creating standardized micro-interactions
export const useEnhancedMicroInteractions = () => {
  // Animation configuration creator
  const getAnimationConfig = (
    type: MicroInteractionType,
    options: MicroInteractionOptions = {}
  ) => {
    const {
      active = true,
      direction = 'up',
      intensity = 'medium',
      timing = 'default',
      repeat = false,
      delay = 0,
      duration,
      customConfig,
      onComplete,
    } = options;
    
    // Intensity mappings
    const intensityScale = {
      subtle: 0.5,
      medium: 1,
      strong: 1.5,
    };
    
    const scale = intensityScale[intensity];
    
    // Config based on timing presets
    let springConfig: SpringConfig;
    
    if (typeof timing === 'number') {
      springConfig = {
        duration: timing,
      };
    } else {
      switch (timing) {
        case 'gentle':
          springConfig = config.gentle;
          break;
        case 'wobbly':
          springConfig = config.wobbly;
          break;
        case 'stiff':
          springConfig = config.stiff;
          break;
        case 'slow':
          springConfig = config.slow;
          break;
        case 'molasses':
          springConfig = config.molasses;
          break;
        case 'default':
        default:
          springConfig = { tension: 300, friction: 10 };
          break;
      }
    }
    
    // Override with duration if provided
    if (duration !== undefined) {
      springConfig.duration = duration;
    }
    
    // Apply custom config overrides
    if (customConfig) {
      springConfig = { ...springConfig, ...customConfig };
    }
    
    // Set repeat behavior
    const loop = repeat === true 
      ? { loop: true } 
      : typeof repeat === 'number' 
        ? { loop: { times: repeat } } 
        : {};
    
    // Initial and active states for different animation types
    let from = {};
    let to = {};
    
    switch (type) {
      case 'pulse':
        from = { scale: 1 };
        to = { scale: 1 + (0.05 * scale) };
        break;
        
      case 'bounce':
        from = { translateY: 0 };
        to = { translateY: -5 * scale };
        break;
        
      case 'shake':
        from = { rotate: 0 };
        to = { rotate: 3 * scale }; // Simplified to avoid Hook issues
        break;
        
      case 'tilt':
        const tiltMap = {
          left: { rotateZ: -5 * scale },
          right: { rotateZ: 5 * scale },
          up: { rotateX: 5 * scale },
          down: { rotateX: -5 * scale },
        };
        from = { rotateX: 0, rotateZ: 0 };
        to = tiltMap[direction === 'in' || direction === 'out' ? 'right' : direction];
        break;
        
      case 'scale':
        const scaleMap = {
          in: { scale: 1 + (0.1 * scale) },
          out: { scale: 1 - (0.1 * scale) },
        };
        from = { scale: 1 };
        to = scaleMap[direction === 'up' || direction === 'left' ? 'in' : 'out'];
        break;
        
      case 'highlight':
        from = { backgroundColor: 'rgba(255, 255, 255, 0)' };
        to = { backgroundColor: `rgba(49, 221, 193, ${0.2 * scale})` };
        break;
        
      case 'fade':
        const fadeMap = {
          in: { opacity: 1 },
          out: { opacity: 0 },
        };
        from = { opacity: direction === 'in' ? 0 : 1 };
        to = fadeMap[direction as 'in' | 'out'];
        break;
        
      case 'slide':
        const offsetMap = {
          up: { translateY: -20 * scale },
          down: { translateY: 20 * scale },
          left: { translateX: -20 * scale },
          right: { translateX: 20 * scale },
        };
        from = { translateX: 0, translateY: 0 };
        to = offsetMap[direction];
        break;
        
      case 'expand':
        const expandMap = {
          up: { height: `calc(100% + ${20 * scale}px)` },
          down: { height: `calc(100% + ${20 * scale}px)` },
          left: { width: `calc(100% + ${20 * scale}px)` },
          right: { width: `calc(100% + ${20 * scale}px)` },
          in: { width: `calc(100% + ${20 * scale}px)`, height: `calc(100% + ${20 * scale}px)` },
          out: { width: `calc(100% - ${20 * scale}px)`, height: `calc(100% - ${20 * scale}px)` },
        };
        from = { width: '100%', height: '100%' };
        to = expandMap[direction];
        break;
        
      case 'rotate':
        from = { rotate: 0 };
        to = { rotate: 360 * scale };
        break;
        
      case 'flash':
        from = { opacity: 1 };
        to = { opacity: 0.5 }; // Simplified to avoid Hook issues
        break;
    }
    
    return {
      from,
      to: active ? to : from,
      config: springConfig,
      delay,
      onRest: onComplete,
      ...loop,
    };
  };
  
  // Animation factory using the configuration
  const createAnimation = (
    type: MicroInteractionType,
    options: MicroInteractionOptions = {}
  ) => {
    const animationConfig = getAnimationConfig(type, options);
    return useSpring(animationConfig);
  };

  // Create reusable components for common animations
  const createAnimatedComponent = (type: MicroInteractionType, defaultOptions: MicroInteractionOptions = {}) => {
    // This returns a React component that will properly use hooks at render time
    const AnimatedComponent = ({ 
      children, 
      style = {}, 
      ...customOptions 
    }: { 
      children: React.ReactNode; 
      style?: React.CSSProperties; 
      [key: string]: any;
    }) => {
      // Merge options at render time
      const options = { ...defaultOptions, ...customOptions };
      // Use the hook inside the component function
      const animationProps = useSpring(getAnimationConfig(type, options));
      
      return (
        <animated.div style={{ ...animationProps, ...style }}>
          {children}
        </animated.div>
      );
    };
    
    // Give the component a display name for better debugging
    AnimatedComponent.displayName = `Animated${type.charAt(0).toUpperCase() + type.slice(1)}`;
    
    return AnimatedComponent;
  };

  // Create a wrapper that conditionally applies an animation
  const withAnimation = (
    Component: React.ComponentType<any>,
    type: MicroInteractionType, 
    options: MicroInteractionOptions = {}
  ) => {
    // Create a proper component that uses hooks at render time
    const WithAnimationComponent = (props: any) => {
      // Use the hook inside the component function
      const animationProps = useSpring(getAnimationConfig(type, options));
      return <Component {...props} style={{ ...animationProps, ...props.style }} />;
    };
    
    // Give the component a display name for better debugging
    WithAnimationComponent.displayName = `WithAnimation(${Component.displayName || Component.name || 'Component'})`;
    
    return WithAnimationComponent;
  };

  // Predefined animated components
  const Pulse = createAnimatedComponent('pulse', { repeat: true, timing: 'gentle' });
  const Bounce = createAnimatedComponent('bounce', { repeat: true, timing: 'wobbly' });
  const Shake = createAnimatedComponent('shake');
  const FadeIn = createAnimatedComponent('fade', { direction: 'in' });
  const FadeOut = createAnimatedComponent('fade', { direction: 'out' });
  const SlideUp = createAnimatedComponent('slide', { direction: 'up' });
  const SlideDown = createAnimatedComponent('slide', { direction: 'down' });
  const SlideLeft = createAnimatedComponent('slide', { direction: 'left' });
  const SlideRight = createAnimatedComponent('slide', { direction: 'right' });
  const ScaleUp = createAnimatedComponent('scale', { direction: 'in' });
  const ScaleDown = createAnimatedComponent('scale', { direction: 'out' });
  const Rotate = createAnimatedComponent('rotate', { repeat: true });
  const Flash = createAnimatedComponent('flash');
  const Highlight = createAnimatedComponent('highlight', { timing: 'gentle' });

  return {
    // Animation creator
    createAnimation,
    
    // Component creator
    createAnimatedComponent,
    
    // HOC
    withAnimation,
    
    // Predefined components
    Pulse,
    Bounce,
    Shake,
    FadeIn,
    FadeOut,
    SlideUp,
    SlideDown,
    SlideLeft,
    SlideRight,
    ScaleUp,
    ScaleDown,
    Rotate,
    Flash,
    Highlight,
    
    // Animated element
    animated,
  };
};

export default useEnhancedMicroInteractions;