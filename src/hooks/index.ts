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
export { default as useReducedMotion } from './useReducedMotion';

// Export Apple-specific hooks
export { default as useApplePhysics } from './useApplePhysics';
export { useSafeArea, safeAreaCss } from './useSafeArea';
export { default as useMultiTasking } from './useMultiTasking';
export { default as useGestures } from './useGestures';
export { default as useDragAndDrop } from './useDragAndDrop';