// Export all hooks from this directory
export { useDeviceCapabilities } from './useDeviceCapabilities';

// Use dynamic imports with fallbacks for useMicroInteractions hooks 
// to handle potential issues with @react-spring/web
let useMicroInteractionsModule: any;

try {
  useMicroInteractionsModule = require('./useMicroInteractions');
} catch (error) {
  // Provide fallback implementations if the module fails to load
  useMicroInteractionsModule = {
    useHaptic: () => (options = {}) => {},
    useRipple: () => ({ RippleContainer: ({ children, className = '' }) => 
      <div className={className}>{children}</div> 
    }),
    useSpring: (config: any) => config,
    useMicroInteractions: () => ({}),
    useSwipeGesture: () => ({})
  };
  
  console.warn('Failed to load useMicroInteractions, using fallbacks');
}

export const {
  useMicroInteractions,
  useHaptic,
  useSpring,
  useRipple,
  useSwipeGesture
} = useMicroInteractionsModule;

export { useNetworkAwareLoading, useNetworkLazyLoad, useAdaptiveFetch } from './useNetworkAwareLoading';
export { default as useCache } from './useCache';