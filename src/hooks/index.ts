// Export all hooks from this directory
export { useDeviceCapabilities } from './useDeviceCapabilities';

// Export hooks from useMicroInteractions
export { 
  useHaptic,
  useRipple,
  useButtonAnimation,
  useSpring,
  useSmoothScroll,
  useSkeletonAnimation,
  useSwipeGesture,
  usePullToRefresh,
  useMicroInteractions
} from './useMicroInteractions';

// Export other hooks normally
export { useNetworkAwareLoading, useNetworkLazyLoad, useAdaptiveFetch } from './useNetworkAwareLoading';
export { default as useCache } from './useCache';