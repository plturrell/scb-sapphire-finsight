/**
 * SCB Haptic Feedback System
 * 
 * Provides iOS-style haptic feedback patterns for interactive elements
 * Uses the native iOS haptic engine when available, with fallbacks for other platforms
 */

// Haptic feedback intensity levels matching Apple's system
export type HapticIntensity = 'light' | 'medium' | 'heavy' | 'rigid' | 'soft';

// Haptic feedback patterns matching iOS system haptics
export type HapticPattern = 
  | 'selection' // Light tap for selection changes (low intensity)
  | 'impact' // Impact feedback for UI elements (configurable intensity)
  | 'success' // Success notification pattern (3 increasing pulses)
  | 'warning' // Warning notification pattern (3 faster pulses)
  | 'error' // Error notification pattern (single strong pulse)
  | 'sequence' // Custom sequence of pulses with specified timing
  | 'navigation' // Navigation feedback (tap when moving between views)
  | 'action' // Action confirmation (button press, form submit)
  | 'toggle' // Toggle state change

// Check if the device supports haptic feedback
const hasHapticSupport = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  
  // Check for native iOS haptics
  const hasNativeHaptics = !!(
    navigator.vibrate || 
    (window as any).Haptics || 
    (window as any).ReactNativeWebView || 
    (navigator as any).vibrate
  );
  
  // Check for experimental Chrome haptics
  const hasChromeHaptics = !!(
    (navigator as any).vibrate || 
    ('vibrate' in navigator)
  );
  
  return hasNativeHaptics || hasChromeHaptics;
};

/**
 * Gets the appropriate vibration pattern based on the desired haptic feedback
 * @param pattern The haptic pattern to use
 * @param intensity The intensity of the haptic feedback
 * @returns Vibration pattern array in milliseconds [vibration, pause, vibration, ...]
 */
const getVibrationPattern = (
  pattern: HapticPattern,
  intensity: HapticIntensity = 'medium'
): number[] => {
  // Intensity multipliers
  const intensityMap: Record<HapticIntensity, number> = {
    light: 0.7,
    medium: 1,
    heavy: 1.5,
    rigid: 1.2,
    soft: 0.8
  };
  
  // Base durations for each pattern (in ms)
  const baseDuration = Math.floor(50 * intensityMap[intensity]);
  const shortPause = 30;
  const mediumPause = 60;
  const longPause = 100;
  
  // Generate pattern based on haptic type
  switch (pattern) {
    case 'selection':
      return [baseDuration * 0.8];
    
    case 'impact':
      return [baseDuration];
    
    case 'success':
      return [
        baseDuration * 0.7, shortPause, 
        baseDuration, shortPause, 
        baseDuration * 1.2
      ];
    
    case 'warning':
      return [
        baseDuration, shortPause, 
        baseDuration, shortPause, 
        baseDuration
      ];
    
    case 'error':
      return [
        baseDuration * 1.5, longPause, 
        baseDuration * 0.8, shortPause, 
        baseDuration * 1.2
      ];
      
    case 'navigation':
      return [baseDuration * 0.6];
      
    case 'action':
      return [baseDuration * 1.1];
      
    case 'toggle':
      return [baseDuration * 0.5];
      
    case 'sequence':
      return [
        baseDuration * 0.5, shortPause,
        baseDuration * 0.7, shortPause,
        baseDuration * 0.9, shortPause,
        baseDuration * 1.1
      ];
      
    default:
      return [baseDuration];
  }
};

/**
 * Trigger haptic feedback with the specified pattern and intensity
 */
export const triggerHaptic = (
  pattern: HapticPattern = 'impact',
  intensity: HapticIntensity = 'medium'
): void => {
  // Skip haptics for non-supporting devices
  if (!hasHapticSupport()) return;
  
  try {
    // Get the appropriate vibration pattern
    const vibrationPattern = getVibrationPattern(pattern, intensity);
    
    // Try to use the native vibration API if available
    if (navigator.vibrate) {
      navigator.vibrate(vibrationPattern);
      return;
    }
    
    // iOS-specific haptics via WebView bridge (if available)
    const iosHaptics = (window as any).webkit?.messageHandlers?.hapticFeedback;
    if (iosHaptics) {
      iosHaptics.postMessage({
        type: pattern,
        intensity: intensity
      });
      return;
    }
    
    // React Native WebView bridge (if available)
    const reactNativeWebView = (window as any).ReactNativeWebView;
    if (reactNativeWebView) {
      reactNativeWebView.postMessage(JSON.stringify({
        type: 'haptic',
        hapticType: pattern,
        hapticIntensity: intensity
      }));
      return;
    }
    
    // Fallback to standard vibration if available
    if ((navigator as any).vibrate) {
      (navigator as any).vibrate(vibrationPattern);
    }
  } catch (error) {
    console.warn('Haptic feedback failed:', error);
  }
};

// Convenience methods for common haptic patterns
export const haptics = {
  selection: () => triggerHaptic('selection', 'light'),
  light: () => triggerHaptic('impact', 'light'),
  medium: () => triggerHaptic('impact', 'medium'),
  heavy: () => triggerHaptic('impact', 'heavy'),
  success: () => triggerHaptic('success', 'medium'),
  warning: () => triggerHaptic('warning', 'medium'),
  error: () => triggerHaptic('error', 'heavy'),
  toggle: () => triggerHaptic('toggle', 'light'),
  action: () => triggerHaptic('action', 'medium'),
  navigation: () => triggerHaptic('navigation', 'light'),
  sequence: () => triggerHaptic('sequence', 'medium'),
  
  // Additional context-specific haptics
  tap: () => triggerHaptic('selection', 'light'),
  press: () => triggerHaptic('impact', 'medium'),
  longPress: () => triggerHaptic('impact', 'heavy'),
  slide: () => triggerHaptic('impact', 'soft'),
  pop: () => triggerHaptic('impact', 'rigid'),
  
  // Check if haptics are supported
  isSupported: hasHapticSupport
};

export default haptics;