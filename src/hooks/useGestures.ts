import { useState, useRef, useEffect, useMemo } from 'react';
import { useDeviceCapabilities } from './useDeviceCapabilities';
import { useApplePhysics } from './useApplePhysics';

// Types for gesture callbacks
export type GestureHandler = (event: any, gestureState: GestureState) => void;

// Gesture state object
export interface GestureState {
  // General gesture info
  active: boolean;
  timeElapsed: number;
  
  // Touch positions
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  deltaX: number;
  deltaY: number;
  absX: number;
  absY: number;
  
  // Velocity (px/ms)
  velocityX: number;
  velocityY: number;
  velocity: number;
  
  // Direction (-1, 0, 1)
  directionX: number;
  directionY: number;
  
  // Pinch/zoom
  scale: number;
  initialScale: number;
  distance: number;
  initialDistance: number;
  
  // Rotation
  rotation: number;
  initialRotation: number;
  
  // Multi-touch
  touchCount: number;
  
  // For Apple Pencil 
  pressure: number;
  tilt: { x: number, y: number };
  isPencil: boolean;
  
  // When gesture began
  startTime: number;
}

// Distance between two points
const getDistance = (p1: Touch, p2: Touch): number => {
  return Math.sqrt(
    Math.pow(p2.clientX - p1.clientX, 2) + 
    Math.pow(p2.clientY - p1.clientY, 2)
  );
};

// Angle between two points (in degrees)
const getAngle = (p1: Touch, p2: Touch): number => {
  return Math.atan2(p2.clientY - p1.clientY, p2.clientX - p1.clientX) * 180 / Math.PI;
};

// Platform-specific gesture configuration
interface PlatformGestureConfig {
  // Threshold for recognizing a swipe (pixels)
  swipeThreshold: number;
  // Threshold for recognizing a long press (ms)
  longPressThreshold: number;
  // Minimum velocity for a swipe (px/ms)
  swipeVelocityThreshold: number;
  // Threshold for diagonal swipe detection
  diagonalThreshold: number;
  // Threshold for detecting pinch (ratio change)
  pinchThreshold: number;
  // Time for velocity tracking (ms)
  velocityTrackingTime: number;
}

// Platform-specific gesture configurations
const PLATFORM_CONFIGS: Record<string, PlatformGestureConfig> = {
  ios: {
    swipeThreshold: 20, 
    longPressThreshold: 500,
    swipeVelocityThreshold: 0.3,
    diagonalThreshold: 0.3,
    pinchThreshold: 0.05,
    velocityTrackingTime: 100
  },
  ipados: {
    swipeThreshold: 25,
    longPressThreshold: 600,
    swipeVelocityThreshold: 0.25,
    diagonalThreshold: 0.3,
    pinchThreshold: 0.03,
    velocityTrackingTime: 100
  },
  default: {
    swipeThreshold: 30,
    longPressThreshold: 650,
    swipeVelocityThreshold: 0.2, 
    diagonalThreshold: 0.4,
    pinchThreshold: 0.1,
    velocityTrackingTime: 150
  }
};

// Options for gesture handler
export interface GestureOptions {
  // Whether to enable specific gestures
  enableSwipe?: boolean;
  enableTap?: boolean;
  enableLongPress?: boolean;
  enablePinch?: boolean;
  enableRotate?: boolean;
  enablePan?: boolean;
  enablePencil?: boolean;
  
  // Custom thresholds (overrides platform defaults)
  swipeThreshold?: number;
  longPressThreshold?: number;
  swipeVelocityThreshold?: number;
  diagonalThreshold?: number;
  pinchThreshold?: number;
  
  // Direction locking (only track swipes in main direction)
  lockDirection?: boolean;
  
  // Whether gestures should be platform-adaptive
  adaptToPlatform?: boolean;
  
  // Options for passive mode (not preventing default behavior)
  passive?: boolean;
  
  // Track velocity
  trackVelocity?: boolean;
  velocityTrackingTime?: number;
}

/**
 * Hook to handle iOS/iPadOS-style gestures with platform-specific behavior
 */
export function useGestures(options: GestureOptions = {}) {
  const { 
    enableSwipe = true,
    enableTap = true,
    enableLongPress = true,
    enablePinch = true,
    enableRotate = true,
    enablePan = true,
    enablePencil = true,
    lockDirection = false,
    adaptToPlatform = true,
    passive = false,
    trackVelocity = true,
    ...customThresholds
  } = options;
  
  const { deviceType, isAppleDevice } = useDeviceCapabilities();
  
  // Determine platform for gesture config
  const platform = useMemo(() => {
    if (!adaptToPlatform) return 'default';
    
    if (isAppleDevice) {
      return deviceType === 'mobile' ? 'ios' : deviceType === 'tablet' ? 'ipados' : 'default';
    }
    
    return 'default';
  }, [adaptToPlatform, isAppleDevice, deviceType]);
  
  // Merge platform config with custom thresholds
  const config = useMemo(() => {
    return {
      ...PLATFORM_CONFIGS[platform in PLATFORM_CONFIGS ? platform : 'default'],
      ...customThresholds
    };
  }, [platform, customThresholds]);
  
  // State for tracking gestures
  const [state, setState] = useState<GestureState>({
    active: false,
    timeElapsed: 0,
    
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    deltaX: 0,
    deltaY: 0,
    absX: 0,
    absY: 0,
    
    velocityX: 0,
    velocityY: 0,
    velocity: 0,
    
    directionX: 0,
    directionY: 0,
    
    scale: 1,
    initialScale: 1,
    distance: 0,
    initialDistance: 0,
    
    rotation: 0,
    initialRotation: 0,
    
    touchCount: 0,
    
    pressure: 0,
    tilt: { x: 0, y: 0 },
    isPencil: false,
    
    startTime: 0
  });
  
  // Refs for tracking gesture state
  const gestureRef = useRef({
    active: false,
    positions: [] as { x: number, y: number, time: number }[],
    touchStartTime: 0,
    initialTouches: [] as Touch[],
    longPressTimer: null as NodeJS.Timeout | null,
    lastTap: { time: 0, x: 0, y: 0 },
    doubleTapTimer: null as NodeJS.Timeout | null
  });
  
  // Event handler refs
  const handlersRef = useRef({
    onSwipe: null as GestureHandler | null,
    onSwipeLeft: null as GestureHandler | null,
    onSwipeRight: null as GestureHandler | null,
    onSwipeUp: null as GestureHandler | null,
    onSwipeDown: null as GestureHandler | null,
    onTap: null as GestureHandler | null,
    onDoubleTap: null as GestureHandler | null,
    onLongPress: null as GestureHandler | null,
    onPinch: null as GestureHandler | null,
    onPinchStart: null as GestureHandler | null,
    onPinchEnd: null as GestureHandler | null,
    onRotate: null as GestureHandler | null,
    onRotateStart: null as GestureHandler | null,
    onRotateEnd: null as GestureHandler | null,
    onPan: null as GestureHandler | null,
    onPanStart: null as GestureHandler | null,
    onPanEnd: null as GestureHandler | null,
    onPencilInput: null as GestureHandler | null,
    onChange: null as GestureHandler | null
  });
  
  // Set up gesture handlers
  const setGestureHandlers = (handlers: Partial<typeof handlersRef.current>) => {
    handlersRef.current = { ...handlersRef.current, ...handlers };
  };
  
  // Calculate velocity based on position history
  const calculateVelocity = (): { velocityX: number, velocityY: number, velocity: number } => {
    const positions = gestureRef.current.positions;
    const now = Date.now();
    
    // Filter positions within tracking time window
    const recentPositions = positions.filter(
      pos => now - pos.time < config.velocityTrackingTime
    );
    
    if (recentPositions.length < 2) {
      return { velocityX: 0, velocityY: 0, velocity: 0 };
    }
    
    const newest = recentPositions[recentPositions.length - 1];
    const oldest = recentPositions[0];
    
    const timeElapsed = newest.time - oldest.time;
    
    if (timeElapsed === 0) {
      return { velocityX: 0, velocityY: 0, velocity: 0 };
    }
    
    // Calculate velocity in px/ms
    const velocityX = (newest.x - oldest.x) / timeElapsed;
    const velocityY = (newest.y - oldest.y) / timeElapsed;
    const velocity = Math.sqrt(velocityX * velocityX + velocityY * velocityY);
    
    return { velocityX, velocityY, velocity };
  };
  
  // Helper to determine swipe direction
  const getSwipeDirection = (
    deltaX: number, 
    deltaY: number, 
    velocity: number
  ): { directionX: number, directionY: number, type?: 'left' | 'right' | 'up' | 'down' } => {
    const { swipeThreshold, swipeVelocityThreshold, diagonalThreshold } = config;
    
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);
    
    // Check if it's a valid swipe
    const isSwipe = (absX > swipeThreshold || absY > swipeThreshold) && 
                    velocity > swipeVelocityThreshold;
    
    if (!isSwipe) {
      return { directionX: 0, directionY: 0 };
    }
    
    // Determine primary direction
    if (absX > absY && absX > diagonalThreshold * (absX + absY)) {
      // Horizontal swipe
      const directionX = deltaX > 0 ? 1 : -1;
      return { 
        directionX, 
        directionY: 0, 
        type: directionX > 0 ? 'right' : 'left' 
      };
    } else if (absY > absX && absY > diagonalThreshold * (absX + absY)) {
      // Vertical swipe
      const directionY = deltaY > 0 ? 1 : -1;
      return { 
        directionX: 0, 
        directionY, 
        type: directionY > 0 ? 'down' : 'up' 
      };
    } else {
      // Diagonal swipe - classify as the one with larger movement
      const directionX = deltaX > 0 ? 1 : -1;
      const directionY = deltaY > 0 ? 1 : -1;
      
      if (absX > absY) {
        return { 
          directionX, 
          directionY, 
          type: directionX > 0 ? 'right' : 'left' 
        };
      } else {
        return { 
          directionX, 
          directionY, 
          type: directionY > 0 ? 'down' : 'up' 
        };
      }
    }
  };
  
  // Update the gesture state and trigger handlers
  const updateGestureState = (
    touches: TouchList | Touch[], 
    event: TouchEvent | any,
    isEnd: boolean = false
  ) => {
    const currentTime = Date.now();
    const { touchStartTime, initialTouches } = gestureRef.current;
    
    // Skip processing if no touches
    if (touches.length === 0) return;
    
    // Current touch (first touch point)
    const touch = touches[0];
    
    // Calculate deltas
    const startX = initialTouches[0]?.clientX || 0;
    const startY = initialTouches[0]?.clientY || 0;
    const currentX = touch.clientX;
    const currentY = touch.clientY;
    const deltaX = currentX - startX;
    const deltaY = currentY - startY;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);
    
    // Track position for velocity calculation
    if (trackVelocity) {
      gestureRef.current.positions.push({
        x: currentX,
        y: currentY,
        time: currentTime
      });
      
      // Limit array size
      if (gestureRef.current.positions.length > 10) {
        gestureRef.current.positions.shift();
      }
    }
    
    // Calculate velocity
    const { velocityX, velocityY, velocity } = trackVelocity 
      ? calculateVelocity()
      : { velocityX: 0, velocityY: 0, velocity: 0 };
    
    // Get swipe direction
    const { directionX, directionY, type: swipeType } = getSwipeDirection(
      deltaX, deltaY, velocity
    );
    
    // Calculate pinch scale (for multi-touch)
    let scale = 1;
    let distance = 0;
    let rotation = 0;
    
    if (touches.length >= 2 && initialTouches.length >= 2) {
      // Calculate current distance between touch points
      distance = getDistance(touches[0], touches[1]);
      const initialDistance = getDistance(initialTouches[0], initialTouches[1]);
      
      // Calculate scale
      scale = initialDistance > 0 ? distance / initialDistance : 1;
      
      // Calculate rotation (if enabled)
      if (enableRotate) {
        const currentAngle = getAngle(touches[0], touches[1]);
        const initialAngle = getAngle(initialTouches[0], initialTouches[1]);
        rotation = currentAngle - initialAngle;
      }
    }
    
    // Get Apple Pencil data if available
    const pencilData = {
      pressure: 0,
      tilt: { x: 0, y: 0 },
      isPencil: false
    };
    
    // Check for Apple Pencil (if available in the event)
    if (enablePencil && 'force' in touch && 'radiusX' in touch && 'radiusY' in touch) {
      // These properties are typically available for Apple Pencil
      pencilData.pressure = (touch as any).force || 0;
      pencilData.tilt = { 
        x: (touch as any).radiusX || 0, 
        y: (touch as any).radiusY || 0 
      };
      
      // Non-zero force indicates Apple Pencil (typically)
      pencilData.isPencil = (touch as any).force > 0 && 
                          ((touch as any).touchType === 'stylus' || 
                           (touch as any).pointerType === 'pen');
    }
    
    // Elapsed time
    const timeElapsed = currentTime - touchStartTime;
    
    // Create updated state
    const newState = {
      active: !isEnd,
      timeElapsed,
      
      startX,
      startY,
      currentX,
      currentY,
      deltaX,
      deltaY,
      absX,
      absY,
      
      velocityX,
      velocityY,
      velocity,
      
      directionX,
      directionY,
      
      scale,
      initialScale: initialTouches.length >= 2 ? 1 : scale,
      distance,
      initialDistance: initialTouches.length >= 2 
        ? getDistance(initialTouches[0], initialTouches[1])
        : distance,
      
      rotation,
      initialRotation: initialTouches.length >= 2 ? 0 : rotation,
      
      touchCount: touches.length,
      
      ...pencilData,
      
      startTime: touchStartTime
    };
    
    // Update state
    setState(newState);
    
    // Trigger onChange handler
    if (handlersRef.current.onChange) {
      handlersRef.current.onChange(event, newState);
    }
    
    // Trigger specific handlers
    if (isEnd) {
      // Check for swipe
      if (enableSwipe && swipeType && newState.velocity > config.swipeVelocityThreshold) {
        if (handlersRef.current.onSwipe) {
          handlersRef.current.onSwipe(event, newState);
        }
        
        // Direction-specific handlers
        switch(swipeType) {
          case 'left':
            handlersRef.current.onSwipeLeft?.(event, newState);
            break;
          case 'right':
            handlersRef.current.onSwipeRight?.(event, newState);
            break;
          case 'up':
            handlersRef.current.onSwipeUp?.(event, newState);
            break;
          case 'down':
            handlersRef.current.onSwipeDown?.(event, newState);
            break;
        }
      }
      
      // Check for tap
      if (enableTap && 
          timeElapsed < config.longPressThreshold && 
          absX < config.swipeThreshold && 
          absY < config.swipeThreshold) {
        
        // Check for double tap
        const lastTap = gestureRef.current.lastTap;
        const timeSinceLastTap = currentTime - lastTap.time;
        const distFromLastTap = Math.sqrt(
          Math.pow(currentX - lastTap.x, 2) + 
          Math.pow(currentY - lastTap.y, 2)
        );
        
        if (timeSinceLastTap < 300 && distFromLastTap < 20) {
          // Double tap
          if (handlersRef.current.onDoubleTap) {
            handlersRef.current.onDoubleTap(event, newState);
          }
          
          // Reset last tap
          gestureRef.current.lastTap = { time: 0, x: 0, y: 0 };
        } else {
          // Single tap
          if (handlersRef.current.onTap) {
            handlersRef.current.onTap(event, newState);
          }
          
          // Track for potential double tap
          gestureRef.current.lastTap = { 
            time: currentTime, 
            x: currentX, 
            y: currentY 
          };
          
          // Clear previous double tap timer
          if (gestureRef.current.doubleTapTimer) {
            clearTimeout(gestureRef.current.doubleTapTimer);
          }
          
          // Set timer to clear last tap (if no double tap occurs)
          gestureRef.current.doubleTapTimer = setTimeout(() => {
            gestureRef.current.lastTap = { time: 0, x: 0, y: 0 };
          }, 300);
        }
      }
      
      // End of pinch gesture
      if (enablePinch && initialTouches.length >= 2 && handlersRef.current.onPinchEnd) {
        handlersRef.current.onPinchEnd(event, newState);
      }
      
      // End of rotation gesture
      if (enableRotate && initialTouches.length >= 2 && handlersRef.current.onRotateEnd) {
        handlersRef.current.onRotateEnd(event, newState);
      }
      
      // End of pan gesture
      if (enablePan && handlersRef.current.onPanEnd) {
        handlersRef.current.onPanEnd(event, newState);
      }
      
      // Reset gesture state
      gestureRef.current.active = false;
      gestureRef.current.positions = [];
      gestureRef.current.initialTouches = [];
    } else {
      // During gesture
      
      // Pinch detection
      if (enablePinch && touches.length >= 2) {
        const pinchChange = Math.abs(1 - scale);
        if (pinchChange > config.pinchThreshold) {
          if (handlersRef.current.onPinch) {
            handlersRef.current.onPinch(event, newState);
          }
        }
      }
      
      // Rotation detection
      if (enableRotate && touches.length >= 2 && 
          handlersRef.current.onRotate && Math.abs(rotation) > 5) {
        handlersRef.current.onRotate(event, newState);
      }
      
      // Pan detection (drag)
      if (enablePan && (absX > 5 || absY > 5) && handlersRef.current.onPan) {
        handlersRef.current.onPan(event, newState);
      }
      
      // Apple Pencil input
      if (enablePencil && pencilData.isPencil && handlersRef.current.onPencilInput) {
        handlersRef.current.onPencilInput(event, newState);
      }
    }
  };
  
  // Touch event handlers
  const handleTouchStart = (event: TouchEvent | React.TouchEvent) => {
    // Store initial touches
    const touches = event.touches;
    
    // Skip if no touches
    if (touches.length === 0) return;
    
    // Store touch start time and initial touches
    gestureRef.current.touchStartTime = Date.now();
    gestureRef.current.initialTouches = Array.from(touches);
    gestureRef.current.active = true;
    gestureRef.current.positions = [{
      x: touches[0].clientX,
      y: touches[0].clientY,
      time: gestureRef.current.touchStartTime
    }];
    
    // Create initial state update
    updateGestureState(touches, event);
    
    // Trigger start handlers
    if (touches.length >= 2) {
      if (enablePinch && handlersRef.current.onPinchStart) {
        handlersRef.current.onPinchStart(event, state);
      }
      
      if (enableRotate && handlersRef.current.onRotateStart) {
        handlersRef.current.onRotateStart(event, state);
      }
    }
    
    if (enablePan && handlersRef.current.onPanStart) {
      handlersRef.current.onPanStart(event, state);
    }
    
    // Set up long press timer
    if (enableLongPress && handlersRef.current.onLongPress) {
      gestureRef.current.longPressTimer = setTimeout(() => {
        // Only trigger if still active and hasn't moved much
        if (gestureRef.current.active && 
            state.absX < config.swipeThreshold && 
            state.absY < config.swipeThreshold) {
          handlersRef.current.onLongPress?.(event, state);
        }
      }, config.longPressThreshold);
    }
    
    // Prevent default if not passive
    if (!passive) {
      event.preventDefault();
    }
  };
  
  const handleTouchMove = (event: TouchEvent | React.TouchEvent) => {
    if (!gestureRef.current.active) return;
    
    // Update gesture state
    updateGestureState(event.touches, event);
    
    // Prevent default if not passive
    if (!passive) {
      event.preventDefault();
    }
  };
  
  const handleTouchEnd = (event: TouchEvent | React.TouchEvent) => {
    if (!gestureRef.current.active) return;
    
    // Clear long press timer
    if (gestureRef.current.longPressTimer) {
      clearTimeout(gestureRef.current.longPressTimer);
      gestureRef.current.longPressTimer = null;
    }
    
    // Use changedTouches for the touches that ended
    // but fall back to the last known touch positions if no changedTouches
    const touches = event.changedTouches.length > 0 
      ? event.changedTouches 
      : gestureRef.current.initialTouches;
    
    // Update and finalize gesture state
    updateGestureState(touches, event, true);
    
    // Prevent default if not passive
    if (!passive) {
      event.preventDefault();
    }
  };
  
  const handleTouchCancel = (event: TouchEvent | React.TouchEvent) => {
    // Clear long press timer
    if (gestureRef.current.longPressTimer) {
      clearTimeout(gestureRef.current.longPressTimer);
      gestureRef.current.longPressTimer = null;
    }
    
    // Reset gesture state
    gestureRef.current.active = false;
    gestureRef.current.positions = [];
    gestureRef.current.initialTouches = [];
    
    // Update state to inactive
    setState(prev => ({ ...prev, active: false }));
    
    // Prevent default if not passive
    if (!passive) {
      event.preventDefault();
    }
  };
  
  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (gestureRef.current.longPressTimer) {
        clearTimeout(gestureRef.current.longPressTimer);
      }
      
      if (gestureRef.current.doubleTapTimer) {
        clearTimeout(gestureRef.current.doubleTapTimer);
      }
    };
  }, []);
  
  // Return event handlers and state for external use
  return {
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
      onTouchCancel: handleTouchCancel
    },
    state,
    setGestureHandlers,
    gestureConfig: config
  };
}

export default useGestures;