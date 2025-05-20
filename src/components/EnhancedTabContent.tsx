import React from 'react';
import { Box } from '@mui/material';
import { useSpring, animated } from '@react-spring/web';
import useEnhancedMicroInteractions from '../hooks/useEnhancedMicroInteractions';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  activeTab: number;
  reduceAnimations?: boolean;
}

const EnhancedTabContent: React.FC<TabPanelProps> = ({
  children,
  index,
  activeTab,
  reduceAnimations = false,
}) => {
  const isActive = activeTab === index;
  
  // Get standardized animations
  const { FadeIn, SlideUp } = useEnhancedMicroInteractions();
  
  // Create spring animation for tab transitions
  const animationProps = useSpring({
    opacity: isActive ? 1 : 0,
    transform: isActive 
      ? 'translateY(0)' 
      : index < activeTab 
        ? 'translateY(-30px)' 
        : 'translateY(30px)',
    display: isActive ? 'block' : 'none',
    config: {
      tension: 280,
      friction: 30,
      duration: reduceAnimations ? 150 : 300,
    },
  });
  
  return (
    <animated.div style={reduceAnimations ? { display: isActive ? 'block' : 'none' } : animationProps}>
      <Box sx={{ pt: 1 }}>
        {children}
      </Box>
    </animated.div>
  );
};

export default EnhancedTabContent;