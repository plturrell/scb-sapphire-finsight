import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useDeviceCapabilities } from '../hooks/useDeviceCapabilities';
import { useNetworkAwareLoading } from '../hooks/useNetworkAwareLoading';

interface EnhancedSplashScreenProps {
  duration?: number; // Duration in ms before auto-hiding
  onComplete?: () => void;
  theme?: 'light' | 'dark';
  logoSrc?: string;
  appName?: string;
  appTagline?: string;
}

/**
 * EnhancedSplashScreen Component
 * A visually appealing splash screen with SCB Beautiful UI styling
 * and network-aware optimizations
 */
const EnhancedSplashScreen: React.FC<EnhancedSplashScreenProps> = ({ 
  duration = 2500,
  onComplete,
  theme: propTheme,
  logoSrc = '/images/sc-logo.png',
  appName = 'FinSight',
  appTagline = 'SCB Sapphire Financial Platform'
}) => {
  const [visible, setVisible] = useState(true);
  const [phase, setPhase] = useState<'logo' | 'text' | 'fade'>('logo');
  
  const { prefersColorScheme, tier, reducedMotion } = useDeviceCapabilities();
  const { connection, strategy } = useNetworkAwareLoading();
  
  // Determine effective theme based on props or system preference
  const theme = propTheme || prefersColorScheme || 'light';
  
  // Determine if we should use animations based on device capabilities
  const shouldAnimate = !reducedMotion && tier !== 'low' && 
    connection.type !== 'slow-2g' && connection.type !== '2g' && !connection.saveData;
  
  // SCB colors for light/dark themes
  const colors = {
    light: {
      primary: 'rgb(var(--scb-honolulu-blue, 0, 114, 170))', // #0072AA
      secondary: 'rgb(var(--scb-american-green, 33, 170, 71))', // #21AA47
      accent: '#cc00dc', // SCB purple
      background: '#0072AA', // SCB blue
      text: '#ffffff',
      divider: '#ffffff'
    },
    dark: {
      primary: 'rgb(0, 142, 211)', // Lighter blue for dark mode
      secondary: 'rgb(41, 204, 86)', // Lighter green for dark mode
      accent: '#e838f1', // Lighter purple for dark mode
      background: '#001e2e', // Dark navy for dark mode
      text: '#ffffff',
      divider: '#ffffff'
    }
  };
  
  const currentColors = colors[theme];
  
  // Adapt timings based on network conditions and device capabilities
  const calculatePhaseTiming = () => {
    // Speedup for low-end devices or slow connections
    const speedFactor = 
      tier === 'low' || connection.type === 'slow-2g' || connection.saveData 
        ? 0.7 
        : 1;
    
    // If reduced motion is enabled, move quickly through phases
    const textDelay = reducedMotion ? 300 : 800 * speedFactor;
    const fadeDelay = reducedMotion ? 500 : 1800 * speedFactor;
    const totalDuration = reducedMotion ? 800 : duration * speedFactor;
    
    return { textDelay, fadeDelay, totalDuration };
  };
  
  useEffect(() => {
    const { textDelay, fadeDelay, totalDuration } = calculatePhaseTiming();
    
    // Phase 1: Show logo
    const textTimer = setTimeout(() => {
      setPhase('text');
    }, textDelay);
    
    // Phase 2: Show text
    const fadeTimer = setTimeout(() => {
      setPhase('fade');
    }, fadeDelay);
    
    // Phase 3: Fade out and notify completion
    const hideTimer = setTimeout(() => {
      setVisible(false);
      if (onComplete) onComplete();
    }, totalDuration);
    
    // Clean up timers
    return () => {
      clearTimeout(textTimer);
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, [duration, onComplete, reducedMotion, tier, connection.type, connection.saveData]);
  
  if (!visible) return null;
  
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center horizon-splash"
      style={{ 
        opacity: phase === 'fade' ? 0 : 1,
        transition: shouldAnimate ? 'opacity 0.7s ease-out' : 'opacity 0.3s ease-out',
        backgroundColor: currentColors.background,
      }}
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="flex flex-col items-center justify-center">
        {/* Optimized image loading based on connection */}
        <div 
          className="relative w-[180px] h-[180px] mb-8"
          style={{
            transform: shouldAnimate && phase === 'logo' ? 'scale(0.95)' : 'scale(1)',
            transition: shouldAnimate ? 'transform 0.8s ease-out' : 'none'
          }}
        >
          <Image
            src={logoSrc}
            alt="Standard Chartered Bank"
            fill
            priority={connection.type !== 'slow-2g' && connection.type !== '2g'}
            quality={strategy.compressionQuality * 100}
            className="scb-splash-logo"
            style={{
              objectFit: 'contain',
              filter: `${theme === 'dark' ? 'brightness(1.1)' : 'none'}`
            }}
          />
        </div>
        
        <div 
          className="flex flex-col items-center"
          style={{ 
            opacity: phase === 'logo' ? 0 : 1,
            transform: shouldAnimate && phase === 'logo' ? 'translateY(20px)' : 'translateY(0)',
            transition: shouldAnimate 
              ? 'opacity 0.5s ease-out, transform 0.5s ease-out' 
              : 'opacity 0.3s ease-out'
          }}
          aria-hidden={phase === 'logo'}
        >
          <h1 
            className="text-white text-3xl font-bold mb-2 horizon-header"
            style={{ color: currentColors.text }}
          >
            {appName}
          </h1>
          <div 
            className="h-0.5 w-16 mb-2" 
            style={{ backgroundColor: currentColors.divider }}
          />
          <p 
            className="text-sm"
            style={{ color: currentColors.text }}
          >
            {appTagline}
          </p>
        </div>
      </div>
    </div>
  );
};

export default EnhancedSplashScreen;