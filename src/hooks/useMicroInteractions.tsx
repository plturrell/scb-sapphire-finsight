// Simple microinteraction hooks with CSS animations (no react-spring dependency)
import { useState, useRef, useEffect } from 'react';

// Simple type definitions
type HapticOptions = {
  duration?: number;
  intensity?: 'light' | 'medium' | 'heavy';
};

// Haptic feedback - simplified
export function useHaptic() {
  const haptic = function(options: HapticOptions = {}) {
    // Only use vibration API if it exists
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      const duration = options.duration || 10;
      const intensity = options.intensity || 'light';
      
      // Simple pattern mapping
      let pattern;
      if (intensity === 'light') {
        pattern = [duration];
      } else if (intensity === 'medium') {
        pattern = [duration, duration / 2, duration];
      } else {
        pattern = [duration * 2, duration, duration * 2];
      }
      
      navigator.vibrate(pattern);
    }
  };
  
  return haptic;
}

// Ripple effect using CSS
export function useRipple() {
  // Simple state management for ripples
  const [ripples, setRipples] = useState([]);
  const containerRef = useRef(null);
  
  // Create ripple handler
  const createRipple = function(event) {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    
    let x, y;
    
    // Handle touch and mouse events
    if (event.touches) {
      x = event.touches[0].clientX - rect.left;
      y = event.touches[0].clientY - rect.top;
    } else {
      x = event.clientX - rect.left;
      y = event.clientY - rect.top;
    }
    
    // Create new ripple with unique ID
    const id = Date.now();
    const newRipple = { x, y, id };
    
    // Update ripples state
    setRipples(function(prev) {
      return [...prev, newRipple];
    });
    
    // Remove ripple after animation completes
    setTimeout(function() {
      setRipples(function(prev) {
        return prev.filter(function(ripple) {
          return ripple.id !== id;
        });
      });
    }, 600);
  };
  
  // Component for ripple container
  const RippleContainer = function(props) {
    const { children, className = '' } = props;
    
    return (
      <div
        ref={containerRef}
        className={'relative overflow-hidden ' + className}
        onMouseDown={createRipple}
        onTouchStart={createRipple}
      >
        {children}
        {ripples.map(function(ripple) {
          return (
            <span
              key={ripple.id}
              className="absolute pointer-events-none animate-ripple"
              style={{
                left: ripple.x,
                top: ripple.y,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <span className="block w-0 h-0 rounded-full bg-current opacity-30 animate-ripple-expand" />
            </span>
          );
        })}
      </div>
    );
  };
  
  return { RippleContainer };
}

// Button animation hook
export function useButtonAnimation() {
  const [isPressed, setIsPressed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  // Get CSS class based on state
  const getClassName = function() {
    if (isPressed) return 'animate-button-pressed';
    if (isHovered) return 'animate-button-hover';
    return '';
  };
  
  // Get inline styles based on state
  const getStyle = function() {
    const scale = isPressed ? 0.95 : isHovered ? 1.05 : 1;
    const shadow = isPressed ? 0 : isHovered ? 20 : 10;
    
    return {
      transform: 'scale(' + scale + ')',
      boxShadow: '0 ' + shadow + 'px ' + (shadow * 2) + 'px rgba(0, 0, 0, 0.1)',
      transition: 'transform 200ms ease, box-shadow 200ms ease',
    };
  };
  
  // Event handlers
  const buttonProps = {
    onMouseEnter: function() { setIsHovered(true); },
    onMouseLeave: function() { 
      setIsHovered(false);
      setIsPressed(false);
    },
    onMouseDown: function() { setIsPressed(true); },
    onMouseUp: function() { setIsPressed(false); },
    onTouchStart: function() { setIsPressed(true); },
    onTouchEnd: function() { setIsPressed(false); },
    className: getClassName(),
    style: getStyle(),
  };
  
  // Simple animated component factory
  const animated = {
    div: function(props) {
      return (
        <div 
          {...props} 
          style={{
            ...props.style,
            transition: 'all 200ms ease',
          }}
        />
      );
    },
    span: function(props) {
      return (
        <span 
          {...props} 
          style={{
            ...props.style,
            transition: 'all 200ms ease',
          }}
        />
      );
    }
  };
  
  return { buttonProps, animated };
}

// Simple spring animation replacement
export function useSpring(props) {
  return props;
}

// Smooth scroll with momentum (simplified)
export function useSmoothScroll() {
  const scrollRef = useRef(null);
  
  const scrollProps = {
    ref: scrollRef,
    className: 'overflow-y-auto',
  };
  
  return { scrollProps };
}

// Loading skeleton animation
export function useSkeletonAnimation() {
  function SkeletonBox(props) {
    const { 
      width = '100%', 
      height = '20px', 
      className = '' 
    } = props;
    
    return (
      <div
        className={'bg-gray-200 rounded animate-shimmer ' + className}
        style={{
          width,
          height,
          backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
          backgroundSize: '200% 100%',
          backgroundPosition: '-200% 0',
        }}
      />
    );
  }
  
  return { SkeletonBox };
}

// Gesture detection
export function useSwipeGesture(onSwipe) {
  const [touchStart, setTouchStart] = useState({ x: 0, y: 0 });
  const threshold = 50;
  
  const handleTouchStart = function(e) {
    setTouchStart({
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    });
  };
  
  const handleTouchEnd = function(e) {
    const touchEnd = {
      x: e.changedTouches[0].clientX,
      y: e.changedTouches[0].clientY,
    };
    
    const deltaX = touchEnd.x - touchStart.x;
    const deltaY = touchEnd.y - touchStart.y;
    
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      if (Math.abs(deltaX) > threshold) {
        onSwipe(deltaX > 0 ? 'right' : 'left');
      }
    } else {
      if (Math.abs(deltaY) > threshold) {
        onSwipe(deltaY > 0 ? 'down' : 'up');
      }
    }
  };
  
  return {
    onTouchStart: handleTouchStart,
    onTouchEnd: handleTouchEnd,
  };
}

// Pull to refresh (simplified)
export function usePullToRefresh(onRefresh) {
  // Return minimal props to avoid complexities
  return {
    containerProps: {},
    refreshIndicatorProps: {},
    isRefreshing: false,
  };
}

// Convenience export for all hooks
export function useMicroInteractions() {
  const haptic = useHaptic();
  const { RippleContainer } = useRipple();
  const { buttonProps, animated } = useButtonAnimation();
  const { scrollProps } = useSmoothScroll();
  const { SkeletonBox } = useSkeletonAnimation();
  
  return {
    haptic,
    RippleContainer,
    buttonProps,
    animated,
    scrollProps,
    SkeletonBox,
  };
}