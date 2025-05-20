import React from 'react';
import AnimatedIcon, { AnimatedIconProps } from './AnimatedIcon';

export interface ChevronIconProps extends AnimatedIconProps {
  direction?: 'right' | 'left' | 'up' | 'down';
  variant?: 'default' | 'double' | 'circle';
}

const ChevronIcon: React.FC<ChevronIconProps> = ({ 
  direction = 'right',
  variant = 'default',
  animation = 'pulse',
  hoverEffect = 'scale', // Changed from 'translate' to 'scale' which is valid
  color = 'currentColor',
  ...props 
}) => {
  const getTransform = () => {
    switch (direction) {
      case 'left':
        return 'rotate(180 12 12)';
      case 'up':
        return 'rotate(270 12 12)';
      case 'down':
        return 'rotate(90 12 12)';
      default: // right
        return '';
    }
  };

  const renderPath = () => {
    switch (variant) {
      case 'double':
        return (
          <g transform={getTransform()}>
            <path
              d="M13 17l5-5-5-5"
              fill="none"
              stroke={color}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M6 17l5-5-5-5"
              fill="none"
              stroke={color}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        );
      case 'circle':
        return (
          <g transform={getTransform()}>
            <circle cx="12" cy="12" r="10" fill="none" stroke={color} strokeWidth="1.5" />
            <path
              d="M10 8l4 4-4 4"
              fill="none"
              stroke={color}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        );
      default:
        return (
          <g transform={getTransform()}>
            <path
              d="M9 18l6-6-6-6"
              fill="none"
              stroke={color}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
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

export default ChevronIcon;