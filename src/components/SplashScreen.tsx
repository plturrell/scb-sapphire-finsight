import React, { useEffect, useState } from 'react';
import Image from 'next/image';

interface SplashScreenProps {
  duration?: number; // Duration in ms before auto-hiding
  onComplete?: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ 
  duration = 2500,
  onComplete
}) => {
  const [visible, setVisible] = useState(true);
  const [phase, setPhase] = useState<'logo' | 'text' | 'fade'>('logo');
  
  useEffect(() => {
    // Phase 1: Show logo
    const textTimer = setTimeout(() => {
      setPhase('text');
    }, 800);
    
    // Phase 2: Show text
    const fadeTimer = setTimeout(() => {
      setPhase('fade');
    }, 1800);
    
    // Phase 3: Fade out and notify completion
    const hideTimer = setTimeout(() => {
      setVisible(false);
      if (onComplete) onComplete();
    }, duration);
    
    // Clean up timers
    return () => {
      clearTimeout(textTimer);
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, [duration, onComplete]);
  
  if (!visible) return null;
  
  return (
    <div 
      className="scb-splash"
      style={{ 
        opacity: phase === 'fade' ? 0 : 1,
      }}
    >
      <div className="flex flex-col items-center justify-center">
        <div className="relative w-[180px] h-[180px] mb-8">
          <Image
            src="/images/sc-logo.png"
            alt="Standard Chartered Bank"
            fill
            priority
            className="scb-splash-logo"
          />
        </div>
        
        <div 
          className="flex flex-col items-center"
          style={{ 
            opacity: phase === 'logo' ? 0 : 1,
            transform: phase === 'logo' ? 'translateY(20px)' : 'translateY(0)',
            transition: 'opacity 0.5s ease-out, transform 0.5s ease-out'
          }}
        >
          <h1 className="text-white text-3xl font-bold mb-2">FinSight</h1>
          <div className="bg-white h-0.5 w-16 mb-2" />
          <p className="text-white text-sm">SCB Sapphire Financial Platform</p>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;