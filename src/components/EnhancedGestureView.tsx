import React, { useRef, useState, useEffect } from 'react';
import { useGestures, GestureState } from '../hooks/useGestures';
import { useDeviceCapabilities } from '../hooks/useDeviceCapabilities';
import { useApplePhysics } from '../hooks/useApplePhysics';
import haptics from '../lib/haptics';

export interface EnhancedGestureViewProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  
  // Gesture callbacks
  onSwipeLeft?: (state: GestureState) => void;
  onSwipeRight?: (state: GestureState) => void;
  onSwipeUp?: (state: GestureState) => void;
  onSwipeDown?: (state: GestureState) => void;
  onTap?: (state: GestureState) => void;
  onDoubleTap?: (state: GestureState) => void;
  onLongPress?: (state: GestureState) => void;
  onPinch?: (state: GestureState) => void;
  onRotate?: (state: GestureState) => void;
  onPan?: (state: GestureState) => void;
  onPencilInput?: (state: GestureState) => void;
  
  // Gesture options
  enableSwipe?: boolean;
  enableTap?: boolean;
  enableDoubleTap?: boolean;
  enableLongPress?: boolean;
  enablePinch?: boolean;
  enableRotate?: boolean;
  enablePan?: boolean;
  enablePencil?: boolean;
  
  // Visual feedback options
  visualFeedback?: boolean;
  hapticFeedback?: boolean;
  debugMode?: boolean;
  
  // Content transformation
  allowContentScaling?: boolean;
  allowContentRotation?: boolean;
  allowContentPanning?: boolean;
  
  // Initial transforms
  initialScale?: number;
  initialRotation?: number;
  
  // Limits
  minScale?: number;
  maxScale?: number;
  
  // Reset transform on double tap
  resetOnDoubleTap?: boolean;
  
  // Make container act like a scroll view
  scrollView?: boolean;
  overflowDirection?: 'vertical' | 'horizontal' | 'both' | 'none';
  bounceEffect?: boolean;
}

/**
 * EnhancedGestureView Component
 * 
 * A container component that supports iPad-specific gestures including swipes,
 * pinch-to-zoom, rotation, panning, and Apple Pencil input.
 */
const EnhancedGestureView: React.FC<EnhancedGestureViewProps> = ({
  children,
  className = '',
  style = {},
  
  // Gesture callbacks
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  onTap,
  onDoubleTap,
  onLongPress,
  onPinch,
  onRotate,
  onPan,
  onPencilInput,
  
  // Gesture options
  enableSwipe = true,
  enableTap = true,
  enableDoubleTap = true,
  enableLongPress = true,
  enablePinch = true,
  enableRotate = true,
  enablePan = true,
  enablePencil = true,
  
  // Visual feedback options
  visualFeedback = true,
  hapticFeedback = true,
  debugMode = false,
  
  // Content transformation
  allowContentScaling = false,
  allowContentRotation = false,
  allowContentPanning = false,
  
  // Initial transforms
  initialScale = 1,
  initialRotation = 0,
  
  // Limits
  minScale = 0.5,
  maxScale = 3,
  
  // Reset transform on double tap
  resetOnDoubleTap = true,
  
  // Scroll view behavior
  scrollView = false,
  overflowDirection = 'vertical',
  bounceEffect = true
}) => {
  // Component refs
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  
  // Platform detection
  const { deviceType, isAppleDevice, prefersReducedMotion } = useDeviceCapabilities();
  const physics = useApplePhysics({ motion: 'emphasized' });
  const isPad = deviceType === 'tablet' && isAppleDevice;
  
  // Transformation state
  const [scale, setScale] = useState(initialScale);
  const [rotation, setRotation] = useState(initialRotation);
  const [translateX, setTranslateX] = useState(0);
  const [translateY, setTranslateY] = useState(0);
  
  // Visual feedback state
  const [isTapping, setIsTapping] = useState(false);
  const [isLongPressing, setIsLongPressing] = useState(false);
  const [isSwiping, setIsSwiping] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<string | null>(null);
  const [bounce, setBounce] = useState({ 
    x: 0, 
    y: 0, 
    active: false 
  });
  
  // Scroll positions (for scroll view mode)
  const [scrollPosition, setScrollPosition] = useState({ x: 0, y: 0 });
  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollBounds, setScrollBounds] = useState({ 
    minX: 0, 
    maxX: 0, 
    minY: 0, 
    maxY: 0 
  });
  
  // Initialize gesture hook
  const { handlers, state, setGestureHandlers } = useGestures({
    enableSwipe,
    enableTap,
    enableLongPress,
    enablePinch,
    enableRotate,
    enablePan,
    enablePencil,
    passive: scrollView, // Use passive mode if acting as scroll view
    adaptToPlatform: true // Use platform-specific settings
  });
  
  // Set up gesture handlers
  useEffect(() => {
    setGestureHandlers({
      // Swipe handlers
      onSwipeLeft: (event, gestureState) => {
        if (hapticFeedback) haptics.medium();
        if (visualFeedback) {
          setIsSwiping(true);
          setSwipeDirection('left');
          setTimeout(() => {
            setIsSwiping(false);
            setSwipeDirection(null);
          }, 300);
        }
        if (onSwipeLeft) onSwipeLeft(gestureState);
      },
      
      onSwipeRight: (event, gestureState) => {
        if (hapticFeedback) haptics.medium();
        if (visualFeedback) {
          setIsSwiping(true);
          setSwipeDirection('right');
          setTimeout(() => {
            setIsSwiping(false);
            setSwipeDirection(null);
          }, 300);
        }
        if (onSwipeRight) onSwipeRight(gestureState);
      },
      
      onSwipeUp: (event, gestureState) => {
        if (hapticFeedback) haptics.medium();
        if (visualFeedback) {
          setIsSwiping(true);
          setSwipeDirection('up');
          setTimeout(() => {
            setIsSwiping(false);
            setSwipeDirection(null);
          }, 300);
        }
        if (onSwipeUp) onSwipeUp(gestureState);
      },
      
      onSwipeDown: (event, gestureState) => {
        if (hapticFeedback) haptics.medium();
        if (visualFeedback) {
          setIsSwiping(true);
          setSwipeDirection('down');
          setTimeout(() => {
            setIsSwiping(false);
            setSwipeDirection(null);
          }, 300);
        }
        if (onSwipeDown) onSwipeDown(gestureState);
      },
      
      // Tap handlers
      onTap: (event, gestureState) => {
        if (hapticFeedback) haptics.light();
        if (visualFeedback) {
          setIsTapping(true);
          setTimeout(() => setIsTapping(false), 150);
        }
        if (onTap) onTap(gestureState);
      },
      
      onDoubleTap: (event, gestureState) => {
        if (hapticFeedback) haptics.medium();
        if (visualFeedback) {
          setIsTapping(true);
          setTimeout(() => setIsTapping(false), 150);
        }
        
        // Reset transforms on double tap (if enabled)
        if (resetOnDoubleTap && (allowContentScaling || allowContentRotation || allowContentPanning)) {
          setScale(initialScale);
          setRotation(initialRotation);
          setTranslateX(0);
          setTranslateY(0);
        }
        
        if (onDoubleTap) onDoubleTap(gestureState);
      },
      
      onLongPress: (event, gestureState) => {
        if (hapticFeedback) haptics.heavy();
        if (visualFeedback) {
          setIsLongPressing(true);
          setTimeout(() => setIsLongPressing(false), 300);
        }
        if (onLongPress) onLongPress(gestureState);
      },
      
      // Pinch handler
      onPinch: (event, gestureState) => {
        if (allowContentScaling) {
          // Update scale within limits
          const newScale = initialScale * gestureState.scale;
          const clampedScale = Math.min(Math.max(newScale, minScale), maxScale);
          setScale(clampedScale);
        }
        
        if (onPinch) onPinch(gestureState);
      },
      
      // Rotation handler
      onRotate: (event, gestureState) => {
        if (allowContentRotation) {
          // Update rotation
          setRotation(initialRotation + gestureState.rotation);
        }
        
        if (onRotate) onRotate(gestureState);
      },
      
      // Pan handler
      onPan: (event, gestureState) => {
        if (scrollView) {
          // Act as a scroll view
          handleScrollView(gestureState);
        } else if (allowContentPanning) {
          // Update position
          setTranslateX(gestureState.deltaX);
          setTranslateY(gestureState.deltaY);
        }
        
        if (onPan) onPan(gestureState);
      },
      
      // Apple Pencil handler
      onPencilInput: (event, gestureState) => {
        // Handle Apple Pencil input with pressure and tilt
        if (onPencilInput) onPencilInput(gestureState);
      }
    });
  }, [
    hapticFeedback, visualFeedback, 
    onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown,
    onTap, onDoubleTap, onLongPress,
    onPinch, onRotate, onPan, onPencilInput,
    allowContentScaling, allowContentRotation, allowContentPanning,
    initialScale, initialRotation, minScale, maxScale,
    resetOnDoubleTap, scrollView
  ]);
  
  // Calculate scroll bounds for scroll view mode
  useEffect(() => {
    if (!scrollView || !containerRef.current || !contentRef.current) return;
    
    const calculateScrollBounds = () => {
      const containerRect = containerRef.current?.getBoundingClientRect();
      const contentRect = contentRef.current?.getBoundingClientRect();
      
      if (!containerRect || !contentRect) return;
      
      const canScrollX = overflowDirection === 'horizontal' || overflowDirection === 'both';
      const canScrollY = overflowDirection === 'vertical' || overflowDirection === 'both';
      
      const boundsX = canScrollX 
        ? { 
            minX: containerRect.width - contentRect.width,
            maxX: 0
          }
        : { minX: 0, maxX: 0 };
        
      const boundsY = canScrollY
        ? {
            minY: containerRect.height - contentRect.height,
            maxY: 0
          }
        : { minY: 0, maxY: 0 };
      
      setScrollBounds({
        minX: Math.min(0, boundsX.minX), // Only allow scrolling if content is larger
        maxX: Math.max(0, boundsX.maxX),
        minY: Math.min(0, boundsY.minY),
        maxY: Math.max(0, boundsY.maxY)
      });
    };
    
    calculateScrollBounds();
    
    // Recalculate on resize
    window.addEventListener('resize', calculateScrollBounds);
    return () => window.removeEventListener('resize', calculateScrollBounds);
  }, [scrollView, overflowDirection]);
  
  // Handle scroll view behavior
  const handleScrollView = (gestureState: GestureState) => {
    if (!scrollView) return;
    
    const { deltaX, deltaY, velocityX, velocityY } = gestureState;
    
    // Calculate new scroll position
    let newX = scrollPosition.x + deltaX;
    let newY = scrollPosition.y + deltaY;
    
    // Apply bounds with bounce effect
    const isBouncing = {
      x: newX > scrollBounds.maxX || newX < scrollBounds.minX,
      y: newY > scrollBounds.maxY || newY < scrollBounds.minY
    };
    
    // Bounce effect - reduce movement when out of bounds
    if (bounceEffect) {
      if (newX > scrollBounds.maxX) {
        newX = scrollBounds.maxX + (newX - scrollBounds.maxX) * 0.2;
      } else if (newX < scrollBounds.minX) {
        newX = scrollBounds.minX + (newX - scrollBounds.minX) * 0.2;
      }
      
      if (newY > scrollBounds.maxY) {
        newY = scrollBounds.maxY + (newY - scrollBounds.maxY) * 0.2;
      } else if (newY < scrollBounds.minY) {
        newY = scrollBounds.minY + (newY - scrollBounds.minY) * 0.2;
      }
      
      setBounce({
        x: isBouncing.x ? -deltaX * 0.1 : 0,
        y: isBouncing.y ? -deltaY * 0.1 : 0,
        active: isBouncing.x || isBouncing.y
      });
    } else {
      // Clamp to bounds without bounce
      newX = Math.max(Math.min(newX, scrollBounds.maxX), scrollBounds.minX);
      newY = Math.max(Math.min(newY, scrollBounds.maxY), scrollBounds.minY);
    }
    
    // Update scroll position
    setScrollPosition({ x: newX, y: newY });
    
    // Update scrolling state for visual feedback
    setIsScrolling(true);
  };
  
  // Handle bounce animation end
  useEffect(() => {
    if (bounce.active) {
      const timeout = setTimeout(() => {
        setBounce({ x: 0, y: 0, active: false });
      }, 300);
      
      return () => clearTimeout(timeout);
    }
  }, [bounce.active]);
  
  // Handle scroll momentum after releasing
  useEffect(() => {
    if (!state.active && isScrolling) {
      const { velocityX, velocityY } = state;
      
      // Apply momentum if significant velocity
      if (Math.abs(velocityX) > 0.1 || Math.abs(velocityY) > 0.1) {
        const friction = 0.95;
        let vx = velocityX * 100; // Convert to pixels/frame
        let vy = velocityY * 100;
        
        let currentX = scrollPosition.x;
        let currentY = scrollPosition.y;
        
        // Momentum animation frame
        const animateMomentum = () => {
          // Apply friction
          vx *= friction;
          vy *= friction;
          
          // Update position
          currentX += vx;
          currentY += vy;
          
          // Apply bounds
          if (currentX > scrollBounds.maxX) {
            currentX = scrollBounds.maxX;
            vx = 0;
          } else if (currentX < scrollBounds.minX) {
            currentX = scrollBounds.minX;
            vx = 0;
          }
          
          if (currentY > scrollBounds.maxY) {
            currentY = scrollBounds.maxY;
            vy = 0;
          } else if (currentY < scrollBounds.minY) {
            currentY = scrollBounds.minY;
            vy = 0;
          }
          
          // Update scroll position
          setScrollPosition({ x: currentX, y: currentY });
          
          // Continue animation if velocity is significant
          if (Math.abs(vx) > 0.1 || Math.abs(vy) > 0.1) {
            requestAnimationFrame(animateMomentum);
          } else {
            setIsScrolling(false);
          }
        };
        
        // Start momentum animation
        requestAnimationFrame(animateMomentum);
      } else {
        setIsScrolling(false);
      }
    }
  }, [state.active, isScrolling, scrollPosition, scrollBounds]);
  
  // Create transform style for content
  const getContentTransform = () => {
    if (scrollView) {
      // Scroll view mode
      return {
        transform: `translate(${scrollPosition.x + (bounce.active ? bounce.x : 0)}px, ${scrollPosition.y + (bounce.active ? bounce.y : 0)}px)`,
        transition: bounce.active ? `transform ${physics.spring.duration * 0.3}ms cubic-bezier(0.25, 0.1, 0.25, 1.0)` : 'none'
      };
    }
    
    // Transform mode
    return {
      transform: `
        translate(${translateX}px, ${translateY}px)
        scale(${scale})
        rotate(${rotation}deg)
      `,
      transition: state.active ? 'none' : `transform ${physics.spring.duration * 0.3}ms cubic-bezier(0.25, 0.1, 0.25, 1.0)`
    };
  };
  
  // Create container classes for visual feedback
  const getContainerClasses = () => {
    let feedbackClasses = '';
    
    if (isTapping) feedbackClasses += ' tap-feedback';
    if (isLongPressing) feedbackClasses += ' long-press-feedback';
    if (isSwiping) feedbackClasses += ` swipe-${swipeDirection}-feedback`;
    
    return `relative overflow-hidden touch-manipulation ${
      scrollView ? `scroll-container ${overflowDirection}-scroll` : ''
    } ${feedbackClasses} ${className}`;
  };
  
  return (
    <div
      ref={containerRef}
      className={getContainerClasses()}
      style={{
        ...style,
        // Styling for visual feedback effects
        '--tap-color': 'rgba(0, 122, 255, 0.1)',
        '--long-press-color': 'rgba(0, 122, 255, 0.15)',
        '--swipe-color': 'rgba(0, 122, 255, 0.05)',
      } as React.CSSProperties}
      {...handlers}
    >
      {/* Content with transforms */}
      <div 
        ref={contentRef}
        className={`gesture-content ${isScrolling ? 'momentum-scrolling' : ''}`}
        style={getContentTransform()}
      >
        {children}
      </div>
      
      {/* Debug overlay */}
      {debugMode && (
        <div className="absolute bottom-2 right-2 bg-black/70 text-white p-2 rounded text-xs">
          <div>Active: {state.active ? 'Yes' : 'No'}</div>
          <div>Scale: {scale.toFixed(2)}</div>
          <div>Rotation: {rotation.toFixed(1)}°</div>
          <div>Position: {translateX.toFixed(0)}, {translateY.toFixed(0)}</div>
          <div>Touches: {state.touchCount}</div>
          <div>Velocity: {state.velocity.toFixed(2)}</div>
          {state.isPencil && (
            <>
              <div>Pencil: Yes</div>
              <div>Pressure: {state.pressure.toFixed(2)}</div>
            </>
          )}
        </div>
      )}
      
      <style jsx>{`
        .tap-feedback::after {
          content: '';
          position: absolute;
          inset: 0;
          background-color: var(--tap-color);
          opacity: 1;
          animation: fadeOut 0.15s ease-out forwards;
          pointer-events: none;
        }
        
        .long-press-feedback::after {
          content: '';
          position: absolute;
          inset: 0;
          background-color: var(--long-press-color);
          opacity: 1;
          animation: pulse 0.3s ease-out;
          pointer-events: none;
        }
        
        .swipe-left-feedback::after,
        .swipe-right-feedback::after,
        .swipe-up-feedback::after,
        .swipe-down-feedback::after {
          content: '';
          position: absolute;
          inset: 0;
          background-color: var(--swipe-color);
          opacity: 1;
          animation: swipeEffect 0.3s ease-out forwards;
          pointer-events: none;
        }
        
        .vertical-scroll {
          overflow-y: hidden;
          overflow-x: hidden;
        }
        
        .horizontal-scroll {
          overflow-x: hidden;
          overflow-y: hidden;
        }
        
        .both-scroll {
          overflow: hidden;
        }
        
        .momentum-scrolling {
          will-change: transform;
        }
        
        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        
        @keyframes pulse {
          0% { opacity: 0.7; }
          50% { opacity: 1; }
          100% { opacity: 0; }
        }
        
        @keyframes swipeEffect {
          0% { opacity: 0.7; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default EnhancedGestureView;