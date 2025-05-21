import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { useDeviceCapabilities } from '../hooks/useDeviceCapabilities';
import { useSFSymbolsSupport } from '../lib/sf-symbols';
import EnhancedIOSIcon from './EnhancedIOSIcon';
import SFSymbol from './SFSymbol';
import * as LucideIcons from 'lucide-react';

// Context for global icon system configuration
interface IconSystemContextType {
  // Quality level for icons based on device capabilities
  qualityLevel: 'high' | 'medium' | 'low'; 
  
  // Whether to use native platform icons (SF Symbols on iOS)
  useNativePlatformIcons: boolean;
  
  // Whether to use animations in icons
  animationsEnabled: boolean;
  
  // Whether to use interactive feedback for icons
  interactiveFeedbackEnabled: boolean;
  
  // Force a specific icon library
  forcedIconLibrary?: 'sf-symbols' | 'lucide' | 'unicode';
  
  // Theme for icons
  theme: 'light' | 'dark' | 'auto';
  
  // Whether to use semantic colors
  useSemanticColors: boolean;
  
  // Update settings
  updateSettings: (settings: Partial<Omit<IconSystemContextType, 'updateSettings'>>) => void;
}

const IconSystemContext = createContext<IconSystemContextType>({
  qualityLevel: 'high',
  useNativePlatformIcons: true,
  animationsEnabled: true,
  interactiveFeedbackEnabled: true,
  theme: 'auto',
  useSemanticColors: true,
  updateSettings: () => {},
});

/**
 * Icon System Provider
 * 
 * Provides global configuration for the icon system
 */
export function IconSystemProvider({ children }: { children: React.ReactNode }) {
  const { tier, prefersReducedMotion, prefersColorScheme } = useDeviceCapabilities();
  const { supported: sfSymbolsSupported } = useSFSymbolsSupport();
  
  // Initialize settings based on device capabilities
  const [settings, setSettings] = useState<Omit<IconSystemContextType, 'updateSettings'>>({
    qualityLevel: tier === 'high' ? 'high' : tier === 'medium' ? 'medium' : 'low',
    useNativePlatformIcons: true,
    animationsEnabled: !prefersReducedMotion,
    interactiveFeedbackEnabled: true,
    theme: prefersColorScheme === 'dark' ? 'dark' : 'light',
    useSemanticColors: true
  });
  
  // Update settings
  const updateSettings = (newSettings: Partial<Omit<IconSystemContextType, 'updateSettings'>>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };
  
  // Sync with device preferences
  useEffect(() => {
    setSettings(prev => ({
      ...prev,
      theme: prefersColorScheme === 'dark' ? 'dark' : 'light',
      animationsEnabled: prev.animationsEnabled && !prefersReducedMotion
    }));
  }, [prefersReducedMotion, prefersColorScheme]);
  
  return (
    <IconSystemContext.Provider value={{ ...settings, updateSettings }}>
      {children}
    </IconSystemContext.Provider>
  );
}

// Hook to use the icon system
export function useIconSystem() {
  return useContext(IconSystemContext);
}

/**
 * Icon component that uses the best icon system for the platform
 */
export interface IconProps {
  // Icon name (in SF Symbols format)
  name: string;
  
  // Display options
  size?: number | string;
  color?: string;
  secondaryColor?: string;
  
  // Interaction options
  interactive?: boolean;
  onClick?: () => void;
  
  // Accessibility
  label?: string;
  
  // Styling
  className?: string;
  style?: React.CSSProperties;
  
  // Animation
  animated?: boolean;
  animateOnMount?: boolean;
  
  // Platform override
  forcePlatform?: 'ios' | 'android' | 'web';
}

/**
 * Universal Icon Component
 * 
 * Uses the appropriate icon based on platform
 */
export function Icon({
  name,
  size = 24,
  color,
  secondaryColor,
  interactive = false,
  onClick,
  label,
  className = '',
  style = {},
  animated = false,
  animateOnMount = false,
  forcePlatform
}: IconProps) {
  const {
    useNativePlatformIcons,
    animationsEnabled,
    interactiveFeedbackEnabled,
    forcedIconLibrary,
    theme,
    useSemanticColors
  } = useIconSystem();
  
  const { isAppleDevice, deviceType } = useDeviceCapabilities();
  const { supported: sfSymbolsSupported } = useSFSymbolsSupport();
  
  // Determine which icon system to use
  const shouldUseSFSymbols = useMemo(() => {
    if (forcedIconLibrary === 'sf-symbols') return true;
    if (forcedIconLibrary === 'lucide') return false;
    if (forcedIconLibrary === 'unicode') return false;
    
    if (forcePlatform === 'ios') return true;
    if (forcePlatform === 'android' || forcePlatform === 'web') return false;
    
    return useNativePlatformIcons && isAppleDevice && sfSymbolsSupported;
  }, [
    forcedIconLibrary, 
    forcePlatform, 
    useNativePlatformIcons, 
    isAppleDevice, 
    sfSymbolsSupported
  ]);
  
  // Determine if icon should be interactive
  const shouldBeInteractive = interactive && interactiveFeedbackEnabled;
  
  // Determine if animation should be enabled
  const shouldAnimate = (animated || animateOnMount) && animationsEnabled;
  
  // Use enhanced iOS icon when appropriate
  if (shouldUseSFSymbols) {
    return (
      <EnhancedIOSIcon
        name={name}
        size={size}
        color={color}
        secondaryColor={secondaryColor}
        interactive={shouldBeInteractive}
        animated={shouldAnimate}
        animateOnMount={animateOnMount}
        accessibilityLabel={label}
        className={className}
        style={style}
        renderingMode={useSemanticColors ? 'hierarchical' : 'monochrome'}
        onTap={onClick}
        role={interactive ? 'action' : 'decoration'}
        adaptToSystem={true}
      />
    );
  }
  
  // Fallback to Lucide icons
  const iconName = name.replace(/\./g, '-').replace(/^[^a-zA-Z]+/, '');
  const formattedIconName = iconName.charAt(0).toUpperCase() + 
    iconName.slice(1).replace(/-([a-z])/g, (g) => g[1].toUpperCase());
  
  const LucideIcon = (LucideIcons as any)[formattedIconName] || LucideIcons.HelpCircle;
  
  if (LucideIcon) {
    return (
      <span 
        className={`scb-icon ${shouldBeInteractive ? 'interactive' : ''} ${className}`}
        onClick={onClick}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          ...style
        }}
        role={interactive ? 'button' : 'img'}
        aria-label={label}
      >
        <LucideIcon 
          size={size} 
          color={color || 'currentColor'} 
        />
        
        {shouldBeInteractive && (
          <style jsx>{`
            .interactive {
              cursor: pointer;
              transition: transform 0.15s ease-out, opacity 0.15s ease-out;
            }
            
            .interactive:active {
              transform: scale(0.9);
              opacity: 0.7;
            }
            
            @media (hover: hover) {
              .interactive:hover {
                opacity: 0.8;
              }
            }
          `}</style>
        )}
        
        {shouldAnimate && animateOnMount && (
          <style jsx>{`
            @keyframes fadeIn {
              from { opacity: 0; transform: scale(0.8); }
              to { opacity: 1; transform: scale(1); }
            }
            
            .scb-icon {
              animation: fadeIn 0.3s ease-out forwards;
            }
          `}</style>
        )}
      </span>
    );
  }
  
  // Fallback to generic icon
  return (
    <span 
      className={`scb-icon-fallback ${className}`}
      style={{
        display: 'inline-block',
        width: typeof size === 'number' ? `${size}px` : size,
        height: typeof size === 'number' ? `${size}px` : size,
        lineHeight: typeof size === 'number' ? `${size}px` : size,
        textAlign: 'center',
        fontSize: typeof size === 'number' ? `${size * 0.7}px` : size,
        color: color || 'currentColor',
        ...style
      }}
      onClick={onClick}
      role={interactive ? 'button' : 'img'}
      aria-label={label}
    >
      ?
    </span>
  );
}

/**
 * Common SCB Icon Library
 */
export const ICONS = {
  // Navigation
  HOME: 'house.fill',
  SEARCH: 'magnifyingglass',
  BACK: 'chevron.left',
  FORWARD: 'chevron.right',
  MENU: 'line.3.horizontal',
  SETTINGS: 'gear',
  CLOSE: 'xmark',
  
  // Actions
  ADD: 'plus',
  REMOVE: 'minus',
  EDIT: 'pencil',
  DELETE: 'trash',
  SHARE: 'square.and.arrow.up',
  DOWNLOAD: 'arrow.down.doc',
  UPLOAD: 'arrow.up.doc',
  REFRESH: 'arrow.clockwise',
  
  // Status
  SUCCESS: 'checkmark.circle.fill',
  WARNING: 'exclamationmark.triangle.fill',
  ERROR: 'xmark.circle.fill',
  INFO: 'info.circle.fill',
  HELP: 'questionmark.circle',
  
  // Finance
  MONEY: 'banknote',
  CHART: 'chart.line.uptrend.xyaxis',
  CURRENCY: 'dollarsign.circle',
  CALCULATOR: 'function',
  WALLET: 'wallet.pass',
  CARD: 'creditcard',
  BANK: 'building.columns',
  
  // Communication
  MESSAGE: 'message',
  EMAIL: 'envelope',
  PHONE: 'phone',
  VIDEO: 'video',
  BELL: 'bell',
  
  // Files & Data
  FILE: 'doc',
  FOLDER: 'folder',
  IMAGE: 'photo',
  VIDEO_FILE: 'film',
  AUDIO: 'waveform',
  PDF: 'doc.text',
  
  // Users
  USER: 'person.circle',
  USERS: 'person.2',
  ADMIN: 'person.badge.shield',
  
  // Misc
  CALENDAR: 'calendar',
  CLOCK: 'clock',
  LOCK: 'lock',
  UNLOCK: 'lock.open',
  STAR: 'star',
  HEART: 'heart',
  PIN: 'mappin',
  TAG: 'tag',
  LINK: 'link',
  GLOBE: 'globe',
};

export default { 
  Icon, 
  ICONS, 
  IconSystemProvider, 
  useIconSystem,
  EnhancedIOSIcon,
  SFSymbol
};