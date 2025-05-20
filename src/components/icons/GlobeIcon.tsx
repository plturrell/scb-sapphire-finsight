import React from 'react';
import AnimatedIcon, { AnimatedIconProps } from './AnimatedIcon';

export interface GlobeIconProps extends AnimatedIconProps {
  variant?: 'default' | 'world' | 'network';
}

const GlobeIcon: React.FC<GlobeIconProps> = ({ 
  variant = 'default',
  animation = 'spin', // Changed from 'rotate' to 'spin' which is a valid animation type
  hoverEffect = 'scale',
  color = 'currentColor',
  ...props 
}) => {
  const renderPath = () => {
    switch (variant) {
      case 'world':
        return (
          <>
            <circle cx="12" cy="12" r="10" fill="none" stroke={color} strokeWidth="1.5" />
            <path
              d="M12 2a15 15 0 0 1 4 10 15 15 0 0 1-4 10 15 15 0 0 1-4-10 15 15 0 0 1 4-10z"
              fill="none"
              stroke={color}
              strokeWidth="1.5"
            />
            <path
              d="M2 12h20M8 12a20 20 0 0 0 8 0"
              fill="none"
              stroke={color}
              strokeWidth="1.5"
            />
          </>
        );
      case 'network':
        return (
          <>
            <circle cx="12" cy="12" r="8" fill="none" stroke={color} strokeWidth="1.5" />
            <path
              d="M18.2 6.2l-1.4 1.4M6.2 18.2l-1.4 1.4M18.2 18.2l-1.4-1.4M6.2 6.2l-1.4-1.4"
              fill="none"
              stroke={color}
              strokeWidth="1.5"
            />
            <circle cx="12" cy="12" r="2" fill={color} />
            <circle cx="12" cy="3" r="1" fill={color} />
            <circle cx="3" cy="12" r="1" fill={color} />
            <circle cx="12" cy="21" r="1" fill={color} />
            <circle cx="21" cy="12" r="1" fill={color} />
          </>
        );
      default:
        return (
          <>
            <circle cx="12" cy="12" r="10" fill="none" stroke={color} strokeWidth="1.5" />
            <path
              d="M2 12h20"
              fill="none"
              stroke={color}
              strokeWidth="1.5"
            />
            <path
              d="M12 2a15 15 0 0 0 0 20 15 15 0 0 0 0-20"
              fill="none"
              stroke={color}
              strokeWidth="1.5"
            />
          </>
        );
    }
  };

  return (
    <AnimatedIcon
      animation={animation}
      hoverEffect={hoverEffect}
      color={color}
      {...props}
    >
      {renderPath()}
    </AnimatedIcon>
  );
};

export default GlobeIcon;