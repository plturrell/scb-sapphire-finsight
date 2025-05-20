import React, { useState } from 'react';
import { animated, useSpring } from '@react-spring/web';

export interface AnimatedIconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
  className?: string;
  animation?: 'pulse' | 'bounce' | 'spin' | 'morph' | 'wobble' | 'none';
  hoverAnimation?: boolean;
  hoverEffect?: 'scale' | 'rotate' | 'color' | 'strokeWidth' | 'none';
  // Additional style props
  style?: React.CSSProperties;
  sx?: any; // For Material-UI styling
}

/**
 * Base component for all animated icons
 * Provides consistent styling and animation options
 */
export const AnimatedIcon: React.FC<React.PropsWithChildren<AnimatedIconProps>> = ({
  size = 24,
  color = 'currentColor',
  strokeWidth = 2,
  className = '',
  animation = 'none',
  hoverAnimation = true,
  hoverEffect = 'scale',
  children,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  
  // Base animations
  const getBaseAnimation = () => {
    switch (animation) {
      case 'pulse':
        return {
          from: { opacity: 0.8, scale: 0.95 },
          to: async (next: any) => {
            while (true) {
              await next({ opacity: 1, scale: 1 });
              await next({ opacity: 0.8, scale: 0.95 });
            }
          },
          config: { duration: 1500 },
        };
      case 'bounce':
        return {
          from: { translateY: 0 },
          to: async (next: any) => {
            while (true) {
              await next({ translateY: -3 });
              await next({ translateY: 0 });
            }
          },
          config: { tension: 300, friction: 10 },
        };
      case 'spin':
        return {
          from: { rotate: 0 },
          to: { rotate: 360 },
          loop: true,
          config: { duration: 3000 },
        };
      case 'wobble':
        return {
          from: { rotate: 0 },
          to: async (next: any) => {
            while (true) {
              await next({ rotate: -5 });
              await next({ rotate: 5 });
              await next({ rotate: 0 });
              await new Promise(resolve => setTimeout(resolve, 2000));
            }
          },
          config: { tension: 300, friction: 10 },
        };
      default:
        return {};
    }
  };
  
  // Hover animations
  const getHoverAnimation = () => {
    if (!hoverAnimation) return {};
    
    switch (hoverEffect) {
      case 'scale':
        return {
          scale: isHovered ? 1.15 : 1,
        };
      case 'rotate':
        return {
          rotate: isHovered ? 15 : 0,
        };
      case 'color':
        // This is handled via stroke/fill
        return {};
      case 'strokeWidth':
        // This is handled via stroke-width
        return {};
      default:
        return {};
    }
  };
  
  // Combine animations
  const springProps = useSpring({
    ...getBaseAnimation(),
    ...getHoverAnimation(),
    config: { tension: 300, friction: 15 },
  });
  
  // Handle hover styles for color and stroke-width
  const getHoverStyles = () => {
    if (!hoverAnimation) return {};
    
    const styles: Record<string, any> = {};
    
    if (hoverEffect === 'color' && isHovered) {
      // Enhanced color when hovered
      return { 
        filter: 'brightness(1.2) saturate(1.2)',
        transition: 'filter 0.2s ease-in-out',
      };
    }
    
    if (hoverEffect === 'strokeWidth' && isHovered) {
      return { 
        strokeWidth: strokeWidth + 0.5,
        transition: 'stroke-width 0.2s ease-in-out',
      };
    }
    
    return styles;
  };
  
  return (
    <animated.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        ...springProps,
        ...getHoverStyles(),
      }}
    >
      {children}
    </animated.svg>
  );
};

// Export the base icon component
export default AnimatedIcon;