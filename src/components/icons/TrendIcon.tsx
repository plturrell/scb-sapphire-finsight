import React from 'react';
import AnimatedIcon, { AnimatedIconProps } from './AnimatedIcon';

export interface TrendIconProps extends AnimatedIconProps {
  variant?: 'up' | 'down' | 'horizontal';
  showArrow?: boolean;
}

const TrendIcon: React.FC<TrendIconProps> = ({ 
  variant = 'up',
  showArrow = true,
  animation = 'pulse',
  hoverEffect = 'scale',
  color = 'currentColor',
  ...props 
}) => {
  const renderPath = () => {
    switch (variant) {
      case 'down':
        return (
          <>
            <path
              d="M22 17l-8.5 4-5-3L3 17"
              fill="none"
              stroke={color}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M22 10l-8.5 4-5-3L3 10"
              fill="none"
              stroke={color}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M22 3l-8.5 4-5-3L3 3"
              fill="none"
              stroke={color}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {showArrow && (
              <path
                d="M19 21v-5h-5"
                fill="none"
                stroke={color}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
          </>
        );
      case 'horizontal':
        return (
          <>
            <path
              d="M3 8h4l3 3h4l3-3h4"
              fill="none"
              stroke={color}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M3 16h4l3-3h4l3 3h4"
              fill="none"
              stroke={color}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {showArrow && (
              <>
                <path
                  d="M21 5l-3 3 3 3"
                  fill="none"
                  stroke={color}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M3 19l3-3-3-3"
                  fill="none"
                  stroke={color}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </>
            )}
          </>
        );
      default: // up
        return (
          <>
            <path
              d="M22 7l-8.5-4-5 3L3 7"
              fill="none"
              stroke={color}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M22 14l-8.5-4-5 3L3 14"
              fill="none"
              stroke={color}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M22 21l-8.5-4-5 3L3 21"
              fill="none"
              stroke={color}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {showArrow && (
              <path
                d="M19 3v5h-5"
                fill="none"
                stroke={color}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
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

export default TrendIcon;