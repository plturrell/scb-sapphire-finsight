import React from 'react';
import AnimatedIcon, { AnimatedIconProps } from './AnimatedIcon';

export interface DataIconProps extends AnimatedIconProps {
  variant?: 'sankey' | 'heatmap' | 'scatter' | 'bubble' | 'radar' | 'candlestick' | 'table' | 'bar';
}

const DataIcon: React.FC<DataIconProps> = ({
  variant = 'sankey',
  color = 'currentColor',
  animation = 'none',
  ...props
}) => {
  return (
    <AnimatedIcon
      color={color}
      animation={animation}
      {...props}
    >
      {variant === 'sankey' && (
        <>
          <path
            d="M3 6H8C9.65685 6 11 7.34315 11 9C11 10.6569 9.65685 12 8 12H3V6Z"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
          />
          <path
            d="M3 12H8C9.65685 12 11 13.3431 11 15C11 16.6569 9.65685 18 8 18H3V12Z"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
          />
          <path
            d="M21 6H16C14.3431 6 13 7.34315 13 9C13 10.6569 14.3431 12 16 12H21V6Z"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
          />
          <path
            d="M21 12H16C14.3431 12 13 13.3431 13 15C13 16.6569 14.3431 18 16 18H21V12Z"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
          />
          <path
            d="M11 9C11 7.34315 12.3431 6 14 6L13 9L14 12C12.3431 12 11 10.6569 11 9Z"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
          />
          <path
            d="M11 15C11 13.3431 12.3431 12 14 12L13 15L14 18C12.3431 18 11 16.6569 11 15Z"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
          />
        </>
      )}
      
      {variant === 'heatmap' && (
        <>
          <rect x="3" y="3" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="2" fill="none" />
          <rect x="10" y="3" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="2" fill="none" />
          <rect x="17" y="3" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="2" fill="none" />
          <rect x="3" y="10" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="2" fill="none" />
          <rect x="10" y="10" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="2" fill="none" />
          <rect x="17" y="10" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="2" fill="none" />
          <rect x="3" y="17" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="2" fill="none" />
          <rect x="10" y="17" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="2" fill="none" />
          <rect x="17" y="17" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="2" fill="none" />
        </>
      )}
      
      {variant === 'scatter' && (
        <>
          <circle cx="6" cy="6" r="2" stroke="currentColor" strokeWidth="2" fill="none" />
          <circle cx="14" cy="8" r="2" stroke="currentColor" strokeWidth="2" fill="none" />
          <circle cx="8" cy="12" r="2" stroke="currentColor" strokeWidth="2" fill="none" />
          <circle cx="18" cy="12" r="2" stroke="currentColor" strokeWidth="2" fill="none" />
          <circle cx="10" cy="18" r="2" stroke="currentColor" strokeWidth="2" fill="none" />
          <circle cx="16" cy="16" r="2" stroke="currentColor" strokeWidth="2" fill="none" />
          <line x1="3" y1="22" x2="21" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <line x1="3" y1="22" x2="3" y2="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </>
      )}
      
      {variant === 'bubble' && (
        <>
          <circle cx="8" cy="8" r="5" stroke="currentColor" strokeWidth="2" fill="none" />
          <circle cx="16" cy="16" r="4" stroke="currentColor" strokeWidth="2" fill="none" />
          <circle cx="18" cy="8" r="3" stroke="currentColor" strokeWidth="2" fill="none" />
          <circle cx="6" cy="16" r="2" stroke="currentColor" strokeWidth="2" fill="none" />
          <line x1="3" y1="22" x2="21" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <line x1="3" y1="22" x2="3" y2="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </>
      )}
      
      {variant === 'radar' && (
        <>
          <circle cx="12" cy="12" r="2" stroke="currentColor" strokeWidth="2" fill="none" />
          <circle cx="12" cy="12" r="6" stroke="currentColor" strokeWidth="2" fill="none" />
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
          <line x1="12" y1="2" x2="12" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <line x1="2" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <line x1="4.92893" y1="4.92893" x2="19.0711" y2="19.0711" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <line x1="4.92893" y1="19.0711" x2="19.0711" y2="4.92893" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </>
      )}
      
      {variant === 'candlestick' && (
        <>
          <line x1="6" y1="4" x2="6" y2="20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <line x1="12" y1="8" x2="12" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <line x1="18" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <rect x="4" y="8" width="4" height="8" rx="1" stroke="currentColor" strokeWidth="2" fill="none" />
          <rect x="10" y="10" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="2" fill="none" />
          <rect x="16" y="12" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="2" fill="none" />
        </>
      )}
      
      {variant === 'table' && (
        <>
          <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" fill="none" />
          <line x1="3" y1="9" x2="21" y2="9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <line x1="3" y1="15" x2="21" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <line x1="9" y1="3" x2="9" y2="21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <line x1="15" y1="3" x2="15" y2="21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </>
      )}
      
      {variant === 'bar' && (
        <>
          <rect x="3" y="4" width="4" height="16" rx="1" stroke="currentColor" strokeWidth="2" fill="none" />
          <rect x="10" y="8" width="4" height="12" rx="1" stroke="currentColor" strokeWidth="2" fill="none" />
          <rect x="17" y="6" width="4" height="14" rx="1" stroke="currentColor" strokeWidth="2" fill="none" />
          <line x1="3" y1="22" x2="21" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </>
      )}
    </AnimatedIcon>
  );
};

export default DataIcon;