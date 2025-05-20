import React from 'react';
import { Box, BoxProps, Typography } from '@mui/material';
import { useSpring, animated } from '@react-spring/web';
import { FinanceIcon, SparklesIcon } from './icons';

export interface SCBrandedLogoProps extends BoxProps {
  variant?: 'full' | 'compact' | 'minimal';
  size?: 'small' | 'medium' | 'large';
  animated?: boolean;
  showTagline?: boolean;
}

const SCBrandedLogo: React.FC<SCBrandedLogoProps> = ({
  variant = 'full',
  size = 'medium',
  animated = true,
  showTagline = true,
  ...boxProps
}) => {
  // Size mappings
  const sizeMap = {
    small: {
      container: 40,
      icon: 24,
      sparkles: 12,
      titleSize: 'subtitle1',
      taglineSize: 'caption',
    },
    medium: {
      container: 60,
      icon: 36,
      sparkles: 16,
      titleSize: 'h6',
      taglineSize: 'caption',
    },
    large: {
      container: 80,
      icon: 48,
      sparkles: 20,
      titleSize: 'h5',
      taglineSize: 'body2',
    },
  };

  const currentSize = sizeMap[size];

  // Animation springs
  const logoSpring = useSpring({
    from: { scale: animated ? 0.9 : 1, opacity: animated ? 0 : 1 },
    to: { scale: 1, opacity: 1 },
    config: { tension: 280, friction: 20 },
  });

  const sparkleSpring = useSpring({
    from: {
      opacity: animated ? 0 : 1,
      transform: animated ? 'rotate(-20deg) scale(0.8)' : 'rotate(0deg) scale(1)',
    },
    to: {
      opacity: 1,
      transform: 'rotate(0deg) scale(1)',
    },
    config: { tension: 200, friction: 10 },
    delay: 300,
  });

  const textSpring = useSpring({
    from: { opacity: animated ? 0 : 1, transform: animated ? 'translateY(5px)' : 'translateY(0px)' },
    to: { opacity: 1, transform: 'translateY(0px)' },
    config: { tension: 280, friction: 20 },
    delay: 200,
  });

  const AnimatedBox = animated(Box);

  return (
    <Box
      display="flex"
      alignItems="center"
      {...boxProps}
    >
      {/* Logo Icon */}
      <AnimatedBox style={logoSpring}>
        <Box
          sx={{
            width: currentSize.container,
            height: currentSize.container,
            borderRadius: '12%',
            backgroundColor: '#fff',
            boxShadow: variant !== 'minimal' ? '0 4px 12px rgba(0, 0, 0, 0.1)' : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <FinanceIcon
            variant="investment"
            size={currentSize.icon}
            color="#042278"
            animation={animated ? "pulse" : "none"}
          />
          <AnimatedBox style={sparkleSpring} sx={{ position: 'absolute', top: 5, right: 5 }}>
            <SparklesIcon
              size={currentSize.sparkles}
              color="#31ddc1"
              animation={animated ? "pulse" : "none"}
            />
          </AnimatedBox>
        </Box>
      </AnimatedBox>

      {/* Text (only for full and compact variants) */}
      {variant !== 'minimal' && (
        <AnimatedBox
          style={textSpring}
          sx={{ ml: 1.5, display: 'flex', flexDirection: 'column' }}
        >
          <Typography
            variant={currentSize.titleSize as any}
            component="h2"
            sx={{
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: '#042278',
              lineHeight: 1.2,
            }}
          >
            {variant === 'full' ? 'SCB Sapphire FinSight' : 'Sapphire'}
          </Typography>
          
          {showTagline && (
            <Typography
              variant={currentSize.taglineSize as any}
              sx={{
                color: '#666',
                lineHeight: 1.2,
                mt: 0.2,
              }}
            >
              {variant === 'full' 
                ? 'Financial Intelligence Platform' 
                : 'SCB Finance'}
            </Typography>
          )}
        </AnimatedBox>
      )}
    </Box>
  );
};

export default SCBrandedLogo;