import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSpring, animated, config } from '@react-spring/web';
import useEnhancedMicroInteractions from '../../hooks/useEnhancedMicroInteractions';
import { Box, Typography, useTheme, useMediaQuery, Fade } from '@mui/material';
import { SparklesIcon } from '../icons';
import PerplexityParticles from '../effects/PerplexityParticles';

// Define context types
interface AnimationContextType {
  // Global animation controls
  animationsEnabled: boolean;
  setAnimationsEnabled: (enabled: boolean) => void;
  animationIntensity: 'subtle' | 'medium' | 'full';
  setAnimationIntensity: (intensity: 'subtle' | 'medium' | 'full') => void;
  reducedMotion: boolean;
  
  // Loading states
  pageLoading: boolean;
  setPageLoading: (loading: boolean) => void;
  showSplashScreen: boolean;
  setShowSplashScreen: (show: boolean) => void;
  
  // Animation components
  PageFadeIn: React.FC<{ children: React.ReactNode; delay?: number }>;
  SlideUpIn: React.FC<{ children: React.ReactNode; delay?: number; distance?: number }>;
  PulseEffect: React.FC<{ children: React.ReactNode; intensity?: number }>;
  HighlightEffect: React.FC<{ children: React.ReactNode; color?: string }>;
  FloatingEffect: React.FC<{ children: React.ReactNode; amplitude?: number }>;
  
  // Particle effects
  ShowParticles: React.FC<{ type?: 'perplexity' | 'scb'; density?: 'low' | 'medium' | 'high' }>;
  
  // Animation methods
  applyFadeIn: (style?: React.CSSProperties) => object;
  applySlideUp: (style?: React.CSSProperties, delay?: number) => object;
  applyScale: (style?: React.CSSProperties, active?: boolean) => object;
  applyHighlight: (style?: React.CSSProperties, active?: boolean, color?: string) => object;
}

// Create context
const AnimationContext = createContext<AnimationContextType | undefined>(undefined);

// Provider component
export const AnimationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const preferReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  
  // Get our standardized micro-interactions
  const { 
    FadeIn, 
    SlideUp, 
    Pulse, 
    Highlight, 
    createAnimation,
    animated
  } = useEnhancedMicroInteractions();
  
  // State for animation settings
  const [animationsEnabled, setAnimationsEnabled] = useState(true);
  const [animationIntensity, setAnimationIntensity] = useState<'subtle' | 'medium' | 'full'>(
    preferReducedMotion ? 'subtle' : 'medium'
  );
  const [pageLoading, setPageLoading] = useState(false);
  const [showSplashScreen, setShowSplashScreen] = useState(false);
  
  // Detect reduced motion preference
  const reducedMotion = preferReducedMotion || animationIntensity === 'subtle';
  
  // Effect to respect user's motion preferences
  useEffect(() => {
    if (preferReducedMotion && animationIntensity !== 'subtle') {
      setAnimationIntensity('subtle');
    }
  }, [preferReducedMotion]);

  // Define reusable animation components
  const PageFadeIn: React.FC<{ children: React.ReactNode; delay?: number }> = ({ 
    children, 
    delay = 0 
  }) => {
    if (!animationsEnabled || reducedMotion) {
      return <>{children}</>;
    }
    
    return (
      <FadeIn delay={delay} duration={300}>
        {children}
      </FadeIn>
    );
  };

  const SlideUpIn: React.FC<{ 
    children: React.ReactNode; 
    delay?: number;
    distance?: number;
  }> = ({ 
    children, 
    delay = 0,
    distance = 20
  }) => {
    if (!animationsEnabled || reducedMotion) {
      return <>{children}</>;
    }
    
    return (
      <SlideUp delay={delay} duration={400} customConfig={{ distance }}>
        {children}
      </SlideUp>
    );
  };

  const PulseEffect: React.FC<{ 
    children: React.ReactNode; 
    intensity?: number 
  }> = ({ 
    children, 
    intensity = 1 
  }) => {
    if (!animationsEnabled || reducedMotion) {
      return <>{children}</>;
    }
    
    return (
      <Pulse intensity={animationIntensity === 'full' ? 'medium' : 'subtle'}>
        {children}
      </Pulse>
    );
  };

  const HighlightEffect: React.FC<{ 
    children: React.ReactNode; 
    color?: string 
  }> = ({ 
    children, 
    color = '#31ddc1' 
  }) => {
    if (!animationsEnabled || reducedMotion) {
      return <>{children}</>;
    }
    
    return (
      <Highlight 
        timing="gentle" 
        customConfig={{ 
          backgroundColor: `${color}30`,
        }}
      >
        {children}
      </Highlight>
    );
  };

  // Floating animation
  const FloatingEffect: React.FC<{ 
    children: React.ReactNode; 
    amplitude?: number 
  }> = ({ 
    children, 
    amplitude = 10
  }) => {
    const actualAmplitude = reducedMotion ? amplitude / 3 : amplitude;
    
    const float = useSpring({
      from: { translateY: 0 },
      to: async (next) => {
        while (animationsEnabled) {
          await next({ translateY: actualAmplitude });
          await next({ translateY: 0 });
          await next({ translateY: -actualAmplitude });
          await next({ translateY: 0 });
        }
      },
      config: { tension: 40, friction: 10, duration: 4000 },
      pause: !animationsEnabled || pageLoading,
    });
    
    return (
      <animated.div style={float}>
        {children}
      </animated.div>
    );
  };

  // Particle effects component
  const ShowParticles: React.FC<{ 
    type?: 'perplexity' | 'scb'; 
    density?: 'low' | 'medium' | 'high' 
  }> = ({ 
    type = 'scb', 
    density = 'medium' 
  }) => {
    const actualDensity = reducedMotion ? 'low' : density;
    
    if (!animationsEnabled) {
      return null;
    }
    
    return (
      <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', zIndex: 0 }}>
        <PerplexityParticles 
          colorScheme={type === 'perplexity' ? 'perplexity' : 'scb'}
          density={actualDensity}
          height="100%"
          width="100%"
          speed={reducedMotion ? 0.3 : 1}
          opacity={reducedMotion ? 0.3 : 0.6}
          interactivity={!reducedMotion}
        />
      </Box>
    );
  };

  // Animation method helpers
  const applyFadeIn = (style: React.CSSProperties = {}) => {
    if (!animationsEnabled || reducedMotion) {
      return style;
    }
    
    const fadeSpring = createAnimation('fade', {
      direction: 'in',
      timing: 'gentle',
      duration: 300,
    });
    
    return { ...fadeSpring, ...style };
  };

  const applySlideUp = (style: React.CSSProperties = {}, delay: number = 0) => {
    if (!animationsEnabled || reducedMotion) {
      return style;
    }
    
    const slideSpring = createAnimation('slide', {
      direction: 'up',
      timing: 'gentle',
      duration: 400,
      delay,
    });
    
    return { ...slideSpring, ...style };
  };

  const applyScale = (style: React.CSSProperties = {}, active: boolean = true) => {
    if (!animationsEnabled || reducedMotion) {
      return style;
    }
    
    const scaleSpring = createAnimation('scale', {
      direction: 'in',
      timing: 'wobbly',
      active,
    });
    
    return { ...scaleSpring, ...style };
  };

  const applyHighlight = (style: React.CSSProperties = {}, active: boolean = true, color: string = '#31ddc1') => {
    if (!animationsEnabled || reducedMotion) {
      return style;
    }
    
    const highlightSpring = createAnimation('highlight', {
      timing: 'gentle',
      active,
      customConfig: { backgroundColor: `${color}30` },
    });
    
    return { ...highlightSpring, ...style };
  };

  const contextValue: AnimationContextType = {
    // States
    animationsEnabled,
    setAnimationsEnabled,
    animationIntensity,
    setAnimationIntensity,
    reducedMotion,
    pageLoading,
    setPageLoading,
    showSplashScreen,
    setShowSplashScreen,
    
    // Components
    PageFadeIn,
    SlideUpIn,
    PulseEffect,
    HighlightEffect,
    FloatingEffect,
    ShowParticles,
    
    // Methods
    applyFadeIn,
    applySlideUp,
    applyScale,
    applyHighlight,
  };

  return (
    <AnimationContext.Provider value={contextValue}>
      {children}
    </AnimationContext.Provider>
  );
};

// Custom hook to use animations
export const useAppAnimations = () => {
  const context = useContext(AnimationContext);
  if (context === undefined) {
    throw new Error('useAppAnimations must be used within an AnimationProvider');
  }
  return context;
};

// Animation toggle component
export const AnimationToggle = () => {
  const { animationsEnabled, setAnimationsEnabled, animationIntensity, setAnimationIntensity } = useAppAnimations();
  
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Typography variant="subtitle2" sx={{ mr: 2 }}>
          Animations
        </Typography>
        <Box
          component="button"
          onClick={() => setAnimationsEnabled(!animationsEnabled)}
          sx={{
            width: 40,
            height: 24,
            borderRadius: 12,
            bgcolor: animationsEnabled ? '#31ddc1' : '#ccc',
            position: 'relative',
            transition: 'background-color 0.3s',
            border: 'none',
            cursor: 'pointer',
            '&:focus': {
              outline: 'none',
              boxShadow: '0 0 0 2px #31ddc155',
            },
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              width: 20,
              height: 20,
              borderRadius: '50%',
              bgcolor: '#fff',
              top: 2,
              left: animationsEnabled ? 18 : 2,
              transition: 'left 0.3s',
              boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            }}
          />
          {animationsEnabled && (
            <SparklesIcon
              size={10}
              color="#fff"
              animation="pulse"
              style={{ position: 'absolute', top: 7, left: 5 }}
            />
          )}
        </Box>
      </Box>
      
      {animationsEnabled && (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="subtitle2" sx={{ mr: 2 }}>
            Intensity
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {(['subtle', 'medium', 'full'] as const).map((level) => (
              <Box
                key={level}
                component="button"
                onClick={() => setAnimationIntensity(level)}
                sx={{
                  px: 2,
                  py: 1,
                  borderRadius: 1,
                  bgcolor: animationIntensity === level ? '#31ddc1' : '#f5f5f5',
                  color: animationIntensity === level ? '#fff' : '#666',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: animationIntensity === level ? 'bold' : 'normal',
                  '&:focus': {
                    outline: 'none',
                    boxShadow: '0 0 0 2px #31ddc155',
                  },
                }}
              >
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </Box>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default useAppAnimations;