import React from 'react';
import AnimatedIcon, { AnimatedIconProps } from './AnimatedIcon';

const SearchIcon: React.FC<AnimatedIconProps> = ({
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
      <circle 
        cx="11" 
        cy="11" 
        r="8" 
        stroke="currentColor" 
        strokeWidth="2" 
        fill="none" 
      />
      <line 
        x1="16.5" 
        y1="16.5" 
        x2="21" 
        y2="21" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
      />
    </AnimatedIcon>
  );
};

export default SearchIcon;