import { useEffect, useRef, useState } from 'react';
import React from 'react';

// Type definitions
interface HapticOptions {
  duration?: number;
  intensity?: 'light' | 'medium' | 'heavy';
}

// Haptic feedback utility
export function useHaptic() {
  const haptic = (options: HapticOptions = {}) => {
    if (typeof navigator === 'undefined' || !('vibrate' in navigator)) return;

    const { duration = 10, intensity = 'light' } = options;
    
    const patterns = {
      light: [duration],
      medium: [duration, duration / 2, duration],
      heavy: [duration * 2, duration, duration * 2],
    };

    navigator.vibrate(patterns[intensity]);
  };

  return haptic;
}

// Ripple effect for touch interactions using CSS
export function useRipple() {
  const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const createRipple = (event: React.MouseEvent | React.TouchEvent) => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    
    let x: number, y: number;
    
    if ('touches' in event) {
      x = event.touches[0].clientX - rect.left;
      y = event.touches[0].clientY - rect.top;
    } else {
      x = event.clientX - rect.left;
      y = event.clientY - rect.top;
    }

    const newRipple = { x, y, id: Date.now() };
    setRipples(prev => [...prev, newRipple]);

    // Remove ripple after animation
    setTimeout(() => {
      setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id));
    }, 600);
  };

  // Use React.forwardRef for better compatibility with Next.js
  const RippleContainer = React.forwardRef<HTMLDivElement, { 
    children: React.ReactNode; 
    className?: string 
  }>(function RippleContainer(props, ref) {
    const { children, className = '' } = props;
    
    return (
      <div
        ref={ref || containerRef}
        className={`relative overflow-hidden ${className}`}
        onMouseDown={createRipple}
        onTouchStart={createRipple}
      >
        {children}
        {ripples.map(ripple => (
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
        ))}
      </div>
    );
  });

  return { RippleContainer };
}

// Button animation hook using CSS
export function useButtonAnimation() {
  const [isPressed, setIsPressed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Get animation state
  const getClassName = () => {
    if (isPressed) return 'animate-button-pressed';
    if (isHovered) return 'animate-button-hover';
    return '';
  };

  // Generate CSS properties based on state
  const getStyle = () => {
    const scale = isPressed ? 0.95 : isHovered ? 1.05 : 1;
    const shadow = isPressed ? 0 : isHovered ? 20 : 10;
    
    return {
      transform: `scale(${scale})`,
      boxShadow: `0 ${shadow}px ${shadow * 2}px rgba(0, 0, 0, 0.1)`,
      transition: 'transform 200ms ease, box-shadow 200ms ease',
    };
  };

  const buttonProps = {
    onMouseEnter: () => setIsHovered(true),
    onMouseLeave: () => {
      setIsHovered(false);
      setIsPressed(false);
    },
    onMouseDown: () => setIsPressed(true),
    onMouseUp: () => setIsPressed(false),
    onTouchStart: () => setIsPressed(true),
    onTouchEnd: () => setIsPressed(false),
    className: getClassName(),
    style: getStyle(),
  };

  // Use a standard div with animation for the animated component
  const animated = {
    div: (props: React.HTMLProps<HTMLDivElement>) => (
      <div 
        {...props} 
        style={{
          ...props.style,
          transition: 'all 200ms ease',
        }}
      />
    ),
    span: (props: React.HTMLProps<HTMLSpanElement>) => (
      <span 
        {...props} 
        style={{
          ...props.style,
          transition: 'all 200ms ease',
        }}
      />
    )
  };

  return { buttonProps, animated };
}

// Smooth scroll with momentum
export function useSmoothScroll() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);
  const [velocity, setVelocity] = useState(0);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    // Safe DOM access for SSR compatibility
    if (typeof document === 'undefined') return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !scrollRef.current) return;

      const deltaY = e.clientY - startY;
      const newScrollTop = scrollTop - deltaY;
      
      scrollRef.current.scrollTop = newScrollTop;
      setVelocity(deltaY);
    };

    const handleMouseUp = () => {
      if (!isDragging) return;
      
      setIsDragging(false);
      
      // Apply momentum
      const deceleration = 0.95;
      let currentVelocity = velocity;
      
      const applyMomentum = () => {
        if (!scrollRef.current || Math.abs(currentVelocity) < 0.1) return;
        
        scrollRef.current.scrollTop -= currentVelocity;
        currentVelocity *= deceleration;
        
        animationRef.current = requestAnimationFrame(applyMomentum);
      };
      
      applyMomentum();
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isDragging, startY, scrollTop, velocity]);

  const scrollProps = {
    ref: scrollRef,
    onMouseDown: (e: React.MouseEvent) => {
      setIsDragging(true);
      setStartY(e.clientY);
      setScrollTop(scrollRef.current?.scrollTop || 0);
    },
    className: 'overflow-y-auto scrollbar-hide cursor-grab active:cursor-grabbing',
  };

  return { scrollProps };
}

// Loading skeleton animation using CSS
export function useSkeletonAnimation() {
  // Simple function to create a skeleton box component with CSS animation
  function SkeletonBox({ 
    width = '100%', 
    height = '20px', 
    className = '' 
  }: { 
    width?: string; 
    height?: string; 
    className?: string;
  }) {
    return (
      <div
        className={`bg-gray-200 rounded animate-shimmer ${className}`}
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

// Gesture interactions
export function useSwipeGesture(onSwipe: (direction: 'left' | 'right' | 'up' | 'down') => void) {
  const [touchStart, setTouchStart] = useState({ x: 0, y: 0 });
  const threshold = 50;

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart({
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    });
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
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

// Pull to refresh using CSS transitions
export function usePullToRefresh(onRefresh: () => Promise<void>) {
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef(0);
  const threshold = 80;

  // Use CSS for animations
  const getTransform = () => {
    if (isPulling) return `translateY(${pullDistance}px)`;
    if (isRefreshing) return `translateY(${threshold}px)`;
    return 'translateY(0)';
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (typeof window !== 'undefined' && window.scrollY === 0) {
      startY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling) return;

    const deltaY = e.touches[0].clientY - startY.current;
    if (deltaY > 0 && deltaY < threshold * 2) {
      setPullDistance(deltaY);
    }
  };

  const handleTouchEnd = async () => {
    if (!isPulling) return;

    setIsPulling(false);
    
    if (pullDistance > threshold) {
      setIsRefreshing(true);
      await onRefresh();
      setIsRefreshing(false);
    }
    
    setPullDistance(0);
  };

  return {
    containerProps: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
    refreshIndicatorProps: {
      style: {
        transform: getTransform(),
        opacity: pullDistance / threshold,
        transition: 'transform 300ms ease, opacity 300ms ease',
      },
      className: 'absolute top-0 left-0 right-0 flex justify-center items-center h-20',
    },
    isRefreshing,
  };
}

// Convenience export
export const useSpring = (props: any) => props; 

// Convenience helper to export all hooks
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