import React, { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress, Fade } from '@mui/material';
import { a, useSpring } from '@react-spring/web';
import { SparklesIcon } from './icons';
import { BrandingHeader } from './common';

interface SplashScreenProps {
  onLoadComplete?: () => void;
  duration?: number;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ 
  onLoadComplete, 
  duration = 3500 
}) => {
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [showSplash, setShowSplash] = useState(true);

  // Logo animation
  const logoSpring = useSpring({
    from: { scale: 0.8, opacity: 0 },
    to: { scale: 1, opacity: 1 },
    config: { tension: 280, friction: 20 },
    delay: 300,
  });

  // Text animation
  const titleSpring = useSpring({
    from: { opacity: 0, transform: 'translateY(20px)' },
    to: { opacity: 1, transform: 'translateY(0)' },
    config: { tension: 280, friction: 20 },
    delay: 600,
  });

  // Subtitle animation
  const subtitleSpring = useSpring({
    from: { opacity: 0 },
    to: { opacity: 1 },
    config: { tension: 280, friction: 20 },
    delay: 900,
  });

  // Particles animation
  const [particles, setParticles] = useState<Array<{
    id: number;
    x: number;
    y: number;
    size: number;
    color: string;
    speed: number;
  }>>([]);

  // Initialize particles
  useEffect(() => {
    const particleCount = 20;
    const newParticles = Array.from({ length: particleCount }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 8 + 2,
      color: Math.random() > 0.5 ? '#042278' : '#31ddc1',
      speed: Math.random() * 2 + 0.5,
    }));
    setParticles(newParticles);
  }, []);

  // Simulate loading
  useEffect(() => {
    const loadingInterval = setInterval(() => {
      setLoadingProgress((prev) => {
        const next = prev + Math.random() * 10;
        return next > 100 ? 100 : next;
      });
    }, 150);

    const timer = setTimeout(() => {
      clearInterval(loadingInterval);
      setLoadingProgress(100);
      setShowSplash(false);
      if (onLoadComplete) onLoadComplete();
    }, duration);

    return () => {
      clearInterval(loadingInterval);
      clearTimeout(timer);
    };
  }, [duration, onLoadComplete]);

  return (
    <Fade in={showSplash} timeout={800}>
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f5f7fa',
          zIndex: 9999,
          overflow: 'hidden',
        }}
      >
        {/* Animated particles */}
        <Box sx={{ position: 'absolute', width: '100%', height: '100%', overflow: 'hidden' }}>
          {particles.map((particle) => (
            <Box
              key={particle.id}
              component={a.div}
              style={{
                position: 'absolute',
                left: `${particle.x}%`,
                top: `${particle.y}%`,
                opacity: Math.random() * 0.7 + 0.3,
                transition: `all ${3000 / particle.speed}ms ease-in-out`
              }}
              sx={{
                position: 'absolute',
                width: particle.size,
                height: particle.size,
                backgroundColor: particle.color,
                borderRadius: '50%',
                filter: 'blur(1px)',
              }}
            />
          ))}
        </Box>

        {/* Logo Section with SCB and SAP Fiori */}
        <a.div style={logoSpring}>
          <Box
            sx={{
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 6
            }}
          >
            {/* Enhanced Branding Header with both SCB and SAP Fiori */}
            <BrandingHeader 
              showSapFiori={true} 
              large={true} 
              centered={true} 
              animate={true}
            />
          </Box>
        </a.div>

        {/* Subtitle */}
        <a.div style={subtitleSpring}>
          <Typography
            variant="subtitle1"
            sx={{
              color: '#555',
              mb: 3,
              textAlign: 'center',
              maxWidth: 380,
              px: 2,
            }}
          >
            Powered by Perplexity AI & Monte Carlo Simulations
          </Typography>
        </a.div>

        {/* Loading indicator */}
        <Box sx={{ position: 'relative', mb: 1, width: 60, height: 60 }}>
          <CircularProgress
            variant="determinate"
            value={100}
            sx={{
              color: 'rgba(4, 34, 120, 0.1)',
              position: 'absolute',
              top: 0,
              left: 0,
            }}
            size={60}
            thickness={4}
          />
          <CircularProgress
            variant="determinate"
            value={loadingProgress}
            sx={{
              color: '#31ddc1',
              position: 'absolute',
              top: 0,
              left: 0,
              '& circle': {
                strokeLinecap: 'round',
              },
            }}
            size={60}
            thickness={4}
          />
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              bottom: 0,
              right: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography
              variant="caption"
              component="div"
              sx={{ color: '#042278', fontWeight: 600 }}
            >
              {Math.round(loadingProgress)}%
            </Typography>
          </Box>
        </Box>

        {/* Loading text */}
        <Typography
          variant="caption"
          sx={{
            color: '#666',
            opacity: 0.8,
            fontStyle: 'italic',
          }}
        >
          Initializing financial analytics...
        </Typography>
      </Box>
    </Fade>
  );
};

export default SplashScreen;