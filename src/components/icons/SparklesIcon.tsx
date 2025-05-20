import React from 'react';
import AnimatedIcon, { AnimatedIconProps } from './AnimatedIcon';

const SparklesIcon: React.FC<AnimatedIconProps> = ({
  color = 'rgb(var(--scb-accent))',
  animation = 'pulse',
  ...props
}) => {
  return (
    <AnimatedIcon
      color={color}
      animation={animation}
      {...props}
    >
      <path
        d="M12 3L14.5 8.5L20 10L14.5 12.5L12 18L9.5 12.5L4 10L9.5 8.5L12 3Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M5 17L6 19L8 20L6 21L5 23L4 21L2 20L4 19L5 17Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M18 17L19 19L21 20L19 21L18 23L17 21L15 20L17 19L18 17Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </AnimatedIcon>
  );
};

export default SparklesIcon;