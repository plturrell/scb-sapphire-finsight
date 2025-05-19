import { useEffect, useRef, useState } from 'react';
import { useSpring, animated, config } from '@react-spring/web';

interface HapticOptions {
  duration?: number;
  intensity?: 'light' | 'medium' | 'heavy';
}

// Haptic feedback utility
export function useHaptic() {
  const canVibrate = typeof navigator !== 'undefined' && 'vibrate' in navigator;

  const haptic = (options: HapticOptions = {}) => {
    if (!canVibrate) return;

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

// Ripple effect for touch interactions
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

  const RippleContainer = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
    <div
      ref={containerRef}
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

  return { RippleContainer };
}

// Spring animations for micro-interactions
export function useButtonAnimation() {
  const [isPressed, setIsPressed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const springProps = useSpring({
    scale: isPressed ? 0.95 : isHovered ? 1.05 : 1,
    shadow: isPressed ? 0 : isHovered ? 20 : 10,
    config: config.wobbly,
  });

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
    style: {
      transform: springProps.scale.to(s => `scale(${s})`),
      boxShadow: springProps.shadow.to(s => `0 ${s}px ${s * 2}px rgba(0, 0, 0, 0.1)`),
    },
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
  const animationRef = useRef<number>();

  useEffect(() => {
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

// Loading skeleton animation
export function useSkeletonAnimation() {
  const shimmerProps = useSpring({
    from: { backgroundPosition: '-200% 0' },
    to: { backgroundPosition: '200% 0' },
    config: { duration: 1500 },
    loop: true,
  });

  const SkeletonBox = ({ 
    width = '100%', 
    height = '20px', 
    className = '' 
  }: { 
    width?: string; 
    height?: string; 
    className?: string;
  }) => (
    <animated.div
      className={`bg-gray-200 rounded ${className}`}
      style={{
        width,
        height,
        backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
        backgroundSize: '200% 100%',
        ...shimmerProps,
      }}
    />
  );

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

// Pull to refresh
export function usePullToRefresh(onRefresh: () => Promise<void>) {
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef(0);
  const threshold = 80;

  const springProps = useSpring({
    transform: `translateY(${isPulling ? pullDistance : isRefreshing ? threshold : 0}px)`,
    opacity: pullDistance / threshold,
    config: config.stiff,
  });

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) {
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
      style: springProps,
      className: 'absolute top-0 left-0 right-0 flex justify-center items-center h-20',
    },
    isRefreshing,
  };
}