import React from 'react';
import AnimatedIcon, { AnimatedIconProps } from './AnimatedIcon';

export interface AlertIconProps extends AnimatedIconProps {
  variant?: 'alert' | 'warning' | 'info';
}

const AlertIcon: React.FC<AlertIconProps> = ({
  variant = 'alert',
  color,
  animation = 'pulse',
  ...props
}) => {
  // Determine color based on variant if not explicitly provided
  const getColor = () => {
    if (color) return color;
    
    switch (variant) {
      case 'alert':
        return 'rgb(var(--scb-muted-red))';
      case 'warning': 
        return 'rgb(var(--scb-yellow))';
      case 'info':
        return 'rgb(var(--scb-honolulu-blue))';
      default:
        return 'currentColor';
    }
  };

  return (
    <AnimatedIcon
      color={getColor()}
      animation={animation}
      {...props}
    >
      {variant === 'alert' ? (
        <>
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
          <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <line x1="12" y1="16" x2="12.01" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </>
      ) : variant === 'warning' ? (
        <>
          <path 
            d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" 
            stroke="currentColor" 
            strokeWidth="2" 
            fill="none" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
          <line x1="12" y1="9" x2="12" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <line x1="12" y1="17" x2="12.01" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
          <line x1="12" y1="16" x2="12" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <line x1="12" y1="8" x2="12.01" y2="8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </>
      )}
    </AnimatedIcon>
  );
};

export default AlertIcon;