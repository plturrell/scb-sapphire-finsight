// Export all hooks from this directory
export { useDeviceCapabilities } from './useDeviceCapabilities';

// Handle potential @react-spring/web module issues
// Safe importing of useMicroInteractions 
let moduleExports: any = {};

// Define fallback types to match actual implementations
type HapticOptions = { duration?: number; intensity?: 'light' | 'medium' | 'heavy' };
type RippleContainerProps = { children: any; className?: string };

// Attempt to load the real module
try {
  // Try to load the real implementation
  moduleExports = require('./useMicroInteractions');
} catch (error) {
  // If module fails to load, create fallback implementations
  console.warn('Failed to load useMicroInteractions module, using fallbacks');
  
  // Simple fallback implementations
  const useHapticFallback = () => {
    return (_options?: HapticOptions) => {
      // No-op implementation
    };
  };
  
  const useRippleFallback = () => {
    return {
      RippleContainer: function RippleContainer(props: RippleContainerProps) {
        // Return a plain object representation instead of JSX
        return {
          type: 'div',
          props: {
            className: props.className || '',
            children: props.children
          }
        };
      }
    };
  };
  
  const useSpringFallback = (config: any) => {
    // Simply return the config as-is
    return config;
  };
  
  const useMicroInteractionsFallback = () => ({});
  
  const useSwipeGestureFallback = () => ({
    onTouchStart: () => {},
    onTouchEnd: () => {}
  });
  
  // Assign fallbacks to the export object
  moduleExports = {
    useHaptic: useHapticFallback,
    useRipple: useRippleFallback,
    useSpring: useSpringFallback,
    useMicroInteractions: useMicroInteractionsFallback,
    useSwipeGesture: useSwipeGestureFallback
  };
}

// Re-export from the module or fallbacks
export const useHaptic = moduleExports.useHaptic;
export const useRipple = moduleExports.useRipple;
export const useSpring = moduleExports.useSpring;
export const useMicroInteractions = moduleExports.useMicroInteractions;
export const useSwipeGesture = moduleExports.useSwipeGesture;

// Export other hooks normally
export { useNetworkAwareLoading, useNetworkLazyLoad, useAdaptiveFetch } from './useNetworkAwareLoading';
export { default as useCache } from './useCache';