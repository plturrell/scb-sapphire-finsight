import React from 'react';
import AnimatedIcon, { AnimatedIconProps } from './AnimatedIcon';

export interface LoadingIconProps extends AnimatedIconProps {
  variant?: 'spinner' | 'dots' | 'circle';
}

const LoadingIcon: React.FC<LoadingIconProps> = ({
  variant = 'spinner',
  color = 'currentColor',
  animation = 'spin',
  ...props
}) => {
  return (
    <AnimatedIcon
      color={color}
      animation={animation}
      {...props}
    >
      {variant === 'spinner' && (
        <path
          d="M12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
      )}
      
      {variant === 'dots' && (
        <>
          <circle cx="5" cy="12" r="2" fill="currentColor" />
          <circle cx="12" cy="12" r="2" fill="currentColor" />
          <circle cx="19" cy="12" r="2" fill="currentColor" />
        </>
      )}
      
      {variant === 'circle' && (
        <>
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeDasharray="50" strokeDashoffset="10" fill="none" />
          <circle cx="12" cy="12" r="7" stroke="currentColor" strokeWidth="2" strokeDasharray="35" strokeDashoffset="7" fill="none" />
          <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" strokeDasharray="20" strokeDashoffset="5" fill="none" />
        </>
      )}
    </AnimatedIcon>
  );
};

export default LoadingIcon;