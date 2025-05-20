import React from 'react';
import AnimatedIcon, { AnimatedIconProps } from './AnimatedIcon';

export interface FlagIconProps extends AnimatedIconProps {
  variant?: 'default' | 'rectangle' | 'triangle';
}

const FlagIcon: React.FC<FlagIconProps> = ({ 
  variant = 'default',
  animation = 'pulse',
  hoverEffect = 'scale',
  color = 'currentColor',
  ...props 
}) => {
  const renderPath = () => {
    switch (variant) {
      case 'rectangle':
        return (
          <>
            <path
              d="M4 22V4M4 4h14l-4 4 4 4H4"
              fill="none"
              stroke={color}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M4 12h12l-4 4 4 4H4"
              fill="none"
              stroke={color}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </>
        );
      case 'triangle':
        return (
          <>
            <path
              d="M4 22V4M4 4l10 2-10 6"
              fill="none"
              stroke={color}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M4 12l10 2-10 6"
              fill="none"
              stroke={color}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </>
        );
      default:
        return (
          <>
            <path
              d="M4 22V4M4 4h10.4c.5 0 .8.4.8.8v6.4c0 .5-.3.8-.8.8H4"
              fill="none"
              stroke={color}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M4 12h8.4c.5 0 .8.4.8.8v6.4c0 .5-.3.8-.8.8H4"
              fill="none"
              stroke={color}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
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

export default FlagIcon;