import React, { useRef, useState, useEffect } from 'react';
import { useSpring, animated, config } from '@react-spring/web';
import { Box, useTheme } from '@mui/material';

export type TransitionEffect = 
  | 'fade' 
  | 'slide-up' 
  | 'slide-down' 
  | 'slide-left' 
  | 'slide-right' 
  | 'zoom' 
  | 'flip' 
  | 'push-left' 
  | 'push-right'
  | 'none';

export interface PageTransitionProps {
  children: React.ReactNode;
  path?: string;
  effect?: TransitionEffect;
  duration?: number;
  delay?: number;
  direction?: 'enter' | 'exit' | 'both';
  style?: React.CSSProperties;
  persist?: boolean;
  disabled?: boolean;
  onAnimationComplete?: () => void;
}

const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  path,
  effect = 'fade',
  duration = 350,
  delay = 0,
  direction = 'both',
  style = {},
  persist = false,
  disabled = false,
  onAnimationComplete,
}) => {
  const theme = useTheme();
  const [isVisible, setIsVisible] = useState(false);
  const [key, setKey] = useState(path || Math.random().toString());
  const prevPathRef = useRef(path);
  
  useEffect(() => {
    // Handle path changes
    if (path !== prevPathRef.current) {
      if (persist) {
        setIsVisible(false);
        setTimeout(() => {
          setKey(path || Math.random().toString());
          setIsVisible(true);
        }, duration);
      } else {
        setKey(path || Math.random().toString());
        setIsVisible(true);
      }
      prevPathRef.current = path;
    } else if (!isVisible) {
      setIsVisible(true);
    }
  }, [path, persist, duration, isVisible]);
  
  // Get animation properties based on effect type
  const getAnimationProps = () => {
    // Common config options
    const springConfig = {
      tension: 280,
      friction: 60,
      duration,
      delay,
    };
    
    // Default (empty) animation
    let from = {};
    let to = {};
    
    // Generate animation properties based on the effect
    switch (effect) {
      case 'fade':
        from = { opacity: 0 };
        to = { opacity: 1 };
        break;
        
      case 'slide-up':
        from = { opacity: 0, transform: 'translateY(40px)' };
        to = { opacity: 1, transform: 'translateY(0)' };
        break;
        
      case 'slide-down':
        from = { opacity: 0, transform: 'translateY(-40px)' };
        to = { opacity: 1, transform: 'translateY(0)' };
        break;
        
      case 'slide-left':
        from = { opacity: 0, transform: 'translateX(40px)' };
        to = { opacity: 1, transform: 'translateX(0)' };
        break;
        
      case 'slide-right':
        from = { opacity: 0, transform: 'translateX(-40px)' };
        to = { opacity: 1, transform: 'translateX(0)' };
        break;
        
      case 'zoom':
        from = { opacity: 0, transform: 'scale(0.95)' };
        to = { opacity: 1, transform: 'scale(1)' };
        break;
        
      case 'flip':
        from = { opacity: 0, transform: 'perspective(1000px) rotateX(10deg)' };
        to = { opacity: 1, transform: 'perspective(1000px) rotateX(0deg)' };
        break;
        
      case 'push-left':
        from = { opacity: 0, transform: 'perspective(1000px) translateX(100px) rotateY(-10deg)' };
        to = { opacity: 1, transform: 'perspective(1000px) translateX(0) rotateY(0deg)' };
        break;
        
      case 'push-right':
        from = { opacity: 0, transform: 'perspective(1000px) translateX(-100px) rotateY(10deg)' };
        to = { opacity: 1, transform: 'perspective(1000px) translateX(0) rotateY(0deg)' };
        break;
        
      case 'none':
      default:
        from = { opacity: 1 };
        to = { opacity: 1 };
        break;
    }
    
    // Determine which animation stages to apply based on direction
    const animFrom = direction === 'exit' || direction === 'both' ? from : to;
    const animTo = direction === 'enter' || direction === 'both' ? to : from;
    
    return { from: animFrom, to: animTo, config: springConfig };
  };
  
  // Create spring animation
  const animProps = getAnimationProps();
  const isInitialRender = useRef(true);
  
  useEffect(() => {
    isInitialRender.current = false;
  }, []);
  
  const springProps = useSpring({
    ...animProps.from,
    to: isVisible ? animProps.to : animProps.from,
    config: {
      ...config.gentle,
      ...animProps.config,
    },
    onRest: () => {
      if (isVisible && onAnimationComplete) {
        onAnimationComplete();
      }
    },
    immediate: disabled || isInitialRender.current,
  });
  
  // If animations disabled, render without animation wrapper
  if (disabled) {
    return <>{children}</>;
  }
  
  return (
    <animated.div key={key} style={{ ...springProps, ...style, width: '100%' }}>
      {children}
    </animated.div>
  );
};

export default PageTransition;