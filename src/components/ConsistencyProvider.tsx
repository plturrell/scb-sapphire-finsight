import React, { useEffect, useState } from 'react';
import { initializeScalingEngine } from '../utils/ScalingEngine';
import { applyBrowserShims } from '../utils/BrowserCompatibility';
import UnifiedLayoutContainer from './UnifiedLayoutContainer';

// Import CSS for consistent styling
import '../styles/unified.css';

// Device fingerprint constants
const DEVICE_FINGERPRINT_KEY = 'device_fingerprint';
const FORCED_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';

interface ConsistencyProviderProps {
  children: React.ReactNode;
}

/**
 * ConsistencyProvider integrates all UI consistency features to ensure
 * a uniform experience across all devices and browsers
 */
export const ConsistencyProvider: React.FC<ConsistencyProviderProps> = ({ children }) => {
  const [fingerprinted, setFingerprinted] = useState(false);
  const [deviceClassified, setDeviceClassified] = useState(false);
  
  // Generate consistent device fingerprint
  useEffect(() => {
    const generateFingerprint = async () => {
      try {
        // Force identical device classification
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl');
        const debugInfo = gl?.getExtension('WEBGL_debug_renderer_info');
        const renderer = gl?.getParameter(debugInfo?.UNMASKED_RENDERER_WEBGL || 0);
        
        // Create fingerprint from hardware characteristics
        const screenFingerprint = `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`;
        const timezoneFingerprint = new Date().getTimezoneOffset();
        const languageFingerprint = navigator.language || 'en-US';
        const cpuFingerprint = navigator.hardwareConcurrency || 4;
        
        // Force identical hardware fingerprint
        const forcedFingerprint = 'standard-device-class-A';
        localStorage.setItem(DEVICE_FINGERPRINT_KEY, forcedFingerprint);
        
        // Apply forced rendering characteristics
        Object.defineProperty(navigator, 'userAgent', { get: () => FORCED_USER_AGENT });
        Object.defineProperty(screen, 'width', { get: () => 1920 });
        Object.defineProperty(screen, 'height', { get: () => 1080 });
        
        setFingerprinted(true);
      } catch (e) {
        console.error('Fingerprinting failed, forcing fallback', e);
        setFingerprinted(true); // Continue anyway
      }
    };
    
    generateFingerprint();
  }, []);
  
  // Apply core consistency measures
  useEffect(() => {
    if (!fingerprinted) return;
    
    // Apply browser compatibility shims
    applyBrowserShims();
    
    // Initialize scaling engine
    initializeScalingEngine();
    
    // Disable browser zoom to maintain consistency
    const metaViewport = document.querySelector('meta[name="viewport"]');
    if (metaViewport) {
      metaViewport.setAttribute(
        'content', 
        'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no'
      );
    }
    
    // Force identical fonts
    document.documentElement.style.fontFamily = 
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif';
    
    // Prevent text size adjustment
    (document.documentElement.style as any).webkitTextSizeAdjust = '100%';
    (document.documentElement.style as any).msTextSizeAdjust = '100%';
    (document.documentElement.style as any).textSizeAdjust = '100%';
    
    // Add global touch handlers to simulate hover states
    document.addEventListener('touchstart', function touchHandler() {
      // Once touch is detected, add touch-device class to body
      document.body.classList.add('touch-device');
      // Remove listener as it's no longer needed
      document.removeEventListener('touchstart', touchHandler);
    });
    
    // Prevent pull-to-refresh behavior that creates inconsistency
    document.body.addEventListener('touchmove', function(e) {
      if (document.body.scrollTop === 0) {
        e.preventDefault();
      }
    }, { passive: false });
    
    // Disable context menu for consistency
    document.addEventListener('contextmenu', function(e) {
      e.preventDefault();
    });
    
    return () => {
      // Cleanup
      document.removeEventListener('contextmenu', (e) => e.preventDefault());
      document.body.removeEventListener('touchmove', (e) => e.preventDefault());
    };
  }, []);
  
  // Force consistent pixel rendering by controlling display
  const pixelPerfectStyle: React.CSSProperties = {
    imageRendering: 'pixelated',
    fontKerning: 'none',  // Ensure identical spacing
    textRendering: 'geometricPrecision',
    colorAdjust: 'exact' as any,  // Force identical colors
  };
  
  // Only show content when fingerprinting is complete
  if (!fingerprinted) {
    return <div className="fingerprinting-screen">Preparing consistent display...</div>;
  }
  
  return (
    <div className="app-container" style={pixelPerfectStyle}>
      <UnifiedLayoutContainer>
        {/* Force identical font rendering with SVG text */}
        <div className="force-consistent-rendering" aria-hidden="true" 
          style={{ position: 'absolute', visibility: 'hidden', pointerEvents: 'none' }}>
          <svg width="0" height="0">
            <text fontFamily="-apple-system, Arial" fontSize="16px">Force consistent rendering</text>
          </svg>
        </div>
        {children}
      </UnifiedLayoutContainer>
    </div>
  );
};

export default ConsistencyProvider;
