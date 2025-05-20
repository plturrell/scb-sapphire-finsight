import React from 'react';
import AnimatedIcon, { AnimatedIconProps } from './AnimatedIcon';

export interface ChartIconProps extends AnimatedIconProps {
  variant?: 'bar' | 'line' | 'pie' | 'trending-up' | 'trending-down';
}

const ChartIcon: React.FC<ChartIconProps> = ({
  variant = 'bar',
  color = 'rgb(var(--scb-honolulu-blue))',
  animation = 'none',
  ...props
}) => {
  return (
    <AnimatedIcon
      color={color}
      animation={animation}
      {...props}
    >
      {variant === 'bar' && (
        <>
          <line x1="18" y1="20" x2="18" y2="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <line x1="12" y1="20" x2="12" y2="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <line x1="6" y1="20" x2="6" y2="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <line x1="3" y1="20" x2="21" y2="20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </>
      )}
      
      {variant === 'line' && (
        <>
          <line x1="4" y1="20" x2="4" y2="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <line x1="4" y1="20" x2="20" y2="20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path 
            d="M4 12L8.5 13.5L12.5 8L16 11L20 6" 
            stroke="currentColor" 
            strokeWidth="2" 
            fill="none" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
          <circle cx="8.5" cy="13.5" r="1" fill="currentColor" />
          <circle cx="12.5" cy="8" r="1" fill="currentColor" />
          <circle cx="16" cy="11" r="1" fill="currentColor" />
          <circle cx="20" cy="6" r="1" fill="currentColor" />
        </>
      )}
      
      {variant === 'pie' && (
        <>
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
          <path 
            d="M12 2L12 12L20 12" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
          />
          <path 
            d="M12 12L17.5 18.5" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
          />
        </>
      )}
      
      {variant === 'trending-up' && (
        <>
          <line x1="22" y1="7" x2="13" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <polyline points="22 7 17 7 17 12" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <path 
            d="M2 17L8 11L13 15" 
            stroke="currentColor" 
            strokeWidth="2"
            fill="none" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />
        </>
      )}
      
      {variant === 'trending-down' && (
        <>
          <line x1="22" y1="17" x2="13" y2="9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <polyline points="22 17 17 17 17 12" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <path 
            d="M2 7L8 13L13 9" 
            stroke="currentColor" 
            strokeWidth="2"
            fill="none" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />
        </>
      )}
    </AnimatedIcon>
  );
};

export default ChartIcon;