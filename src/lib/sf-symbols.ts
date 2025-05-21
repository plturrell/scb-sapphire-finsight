/**
 * SF Symbols integration for iOS/iPadOS native icon support
 * 
 * This module provides a bridge to use Apple's SF Symbols in the web application
 * with fallbacks to similar icons from other libraries for non-Apple platforms.
 */

import { useMemo } from 'react';
import { useDeviceCapabilities } from '../hooks/useDeviceCapabilities';

// SF Symbol rendering modes available in iOS 14+
export type SFSymbolRenderingMode = 
  | 'hierarchical' // iOS 15+ hierarchical coloring
  | 'palette' // iOS 15+ multi-color
  | 'monochrome' // Single color 
  | 'multicolor'; // iOS 14+ semantic colors

// SF Symbol weights available
export type SFSymbolWeight = 
  | 'ultralight'
  | 'thin'
  | 'light'
  | 'regular'
  | 'medium'
  | 'semibold'
  | 'bold'
  | 'heavy'
  | 'black';

// Symbol scales available in iOS
export type SFSymbolScale = 
  | 'small'
  | 'medium'
  | 'large';

// Symbol variants (iOS 15+)
export type SFSymbolVariant = 
  | 'none'
  | 'fill'
  | 'slash'
  | 'enclosedcircle'
  | 'enclosedSquare';

// Properties for the SF Symbol component
export interface SFSymbolProps {
  // Name of the SF Symbol
  name: string;
  
  // Appearance customization
  color?: string;
  secondaryColor?: string;
  tertiaryColor?: string;
  weight?: SFSymbolWeight;
  scale?: SFSymbolScale;
  variant?: SFSymbolVariant;
  renderingMode?: SFSymbolRenderingMode;
  
  // Size (in pixels)
  size?: number | string;
  
  // Animation (iOS 15+)
  animated?: boolean;
  animationVariant?: 'pulse' | 'bounce' | 'scale' | 'appear' | 'disappear';
  
  // Accessibility
  accessibilityLabel?: string;
  
  // Fallbacks for non-iOS platforms
  fallbackIcon?: React.ReactNode; // Custom fallback icon
  fallbackSVG?: string; // SVG path
  fallbackGlyph?: string; // Unicode glyph
}

// Mapping between SF Symbol names and equivalent Lucide icons
// This helps ensure consistent icons across platforms
const SF_TO_LUCIDE_MAP: Record<string, string> = {
  // Navigation & Essentials
  'house': 'home',
  'house.fill': 'home',
  'magnifyingglass': 'search',
  'plus': 'plus',
  'minus': 'minus',
  'xmark': 'x',
  'checkmark': 'check',
  'chevron.right': 'chevron-right',
  'chevron.left': 'chevron-left',
  'chevron.up': 'chevron-up',
  'chevron.down': 'chevron-down',
  'arrow.right': 'arrow-right',
  'arrow.left': 'arrow-left',
  'arrow.up': 'arrow-up',
  'arrow.down': 'arrow-down',
  'ellipsis': 'more-horizontal',
  'gear': 'settings',
  'trash': 'trash-2',
  
  // Communication
  'bell': 'bell',
  'bell.fill': 'bell',
  'envelope': 'mail',
  'envelope.fill': 'mail',
  'message': 'message-square',
  'message.fill': 'message-square-dots',
  'phone': 'phone',
  'phone.fill': 'phone',
  
  // Media
  'play': 'play',
  'play.fill': 'play-circle',
  'pause': 'pause',
  'stop': 'square',
  'speaker': 'volume-2',
  'speaker.wave.1': 'volume-1',
  'speaker.wave.2': 'volume-2',
  'speaker.wave.3': 'volume',
  'speaker.slash': 'volume-x',
  
  // Weather & Nature
  'cloud': 'cloud',
  'cloud.fill': 'cloud',
  'cloud.rain': 'cloud-rain',
  'cloud.sun': 'cloud-sun',
  'sun.max': 'sun',
  'sun.max.fill': 'sun',
  'moon': 'moon',
  'moon.fill': 'moon',
  
  // Devices & Hardware
  'desktopcomputer': 'monitor',
  'laptopcomputer': 'laptop',
  'iphone': 'smartphone',
  'ipad': 'tablet',
  'applewatch': 'watch',
  'battery.100': 'battery',
  'battery.25': 'battery-low',
  'wifi': 'wifi',
  'wifi.slash': 'wifi-off',
  
  // Commerce
  'cart': 'shopping-cart',
  'cart.fill': 'shopping-cart',
  'creditcard': 'credit-card',
  'creditcard.fill': 'credit-card',
  'giftcard': 'gift',
  'giftcard.fill': 'gift',
  'banknote': 'dollar-sign',
  
  // SCB specific
  'chart.bar': 'bar-chart-2',
  'chart.pie': 'pie-chart',
  'chart.line.uptrend.xyaxis': 'line-chart',
  'doc.text': 'file-text',
  'folder': 'folder',
  'folder.fill': 'folder',
  'person': 'user',
  'person.fill': 'user',
  'person.2': 'users',
  'person.2.fill': 'users',
  'building': 'building',
  'building.fill': 'building',
  'building.2': 'buildings',
  'building.2.fill': 'buildings',
  'globe': 'globe',
  'network': 'share-2',
  'dollarsign.circle': 'circle-dollar-sign',
  'dollarsign.circle.fill': 'circle-dollar-sign',
  'clock': 'clock',
  'clock.fill': 'clock',
  'calendar': 'calendar',
  'calendar.fill': 'calendar',
  'graduationcap': 'graduation-cap',
  'info.circle': 'info',
  'exclamationmark.triangle': 'alert-triangle',
  'exclamationmark.circle': 'alert-circle',
  'lightbulb': 'lightbulb',
  'lightbulb.fill': 'lightbulb',
  'lock': 'lock',
  'lock.fill': 'lock',
  'unlock': 'unlock',
  'unlock.fill': 'unlock',
  'shield': 'shield',
  'shield.fill': 'shield',
  'bolt': 'zap',
  'bolt.fill': 'zap',
  'power': 'power',
  'target': 'target',
  'flag': 'flag',
  'flag.fill': 'flag',
  'bookmark': 'bookmark',
  'bookmark.fill': 'bookmark',
  'star': 'star',
  'star.fill': 'star',
  'heart': 'heart',
  'heart.fill': 'heart',
  'eye': 'eye',
  'eye.fill': 'eye',
  'eye.slash': 'eye-off',
  'hand.thumbsup': 'thumbs-up',
  'hand.thumbsdown': 'thumbs-down',
  'tag': 'tag',
  'tag.fill': 'tag',
  'link': 'link',
  'link.badge.plus': 'link',
  'paperclip': 'paperclip',
  'map': 'map',
  'map.fill': 'map',
  'location': 'map-pin',
  'location.fill': 'map-pin',
  'wand.and.stars': 'wand',
  'slider.horizontal.3': 'sliders',
  'gauge': 'gauge',
  'gauge.medium': 'gauge',
  'gauge.high': 'gauge',
  'speedometer': 'gauge',
  'lifepreserver': 'life-buoy',
  'hammer': 'tool',
  'wrench': 'wrench',
  'wrench.and.screwdriver': 'wrench',
  'printer': 'printer',
  'doc.on.doc': 'copy',
  'scissors': 'scissors',
  'pencil': 'pencil',
  'pencil.tip': 'pencil',
  'trash': 'trash',
  'trash.fill': 'trash',
  'archivebox': 'archive',
  'doc.text.magnifyingglass': 'file-search',
  'text.bubble': 'message-circle',
  'photo': 'image',
  'video': 'video',
  'mic': 'mic',
  'mic.fill': 'mic',
  'mic.slash': 'mic-off',
  'play.rectangle': 'play',
  'play.rectangle.fill': 'play',
  'pause.rectangle': 'pause',
  'pause.rectangle.fill': 'pause',
  'repeat': 'repeat',
  'shuffle': 'shuffle',
  'speaker.3': 'volume',
  'speaker.2': 'volume-1',
  'speaker.1': 'volume',
  'speaker.slash.fill': 'volume-x',
  'hare': 'rabbit',
  'tortoise': 'turtle',
  'flame': 'flame',
  'flame.fill': 'flame',
  'drop': 'droplet',
  'drop.fill': 'droplet',
  'snowflake': 'snowflake',
  'sparkles': 'sparkles',
  'wind': 'wind',
  'sun.dust': 'sun-dim',
  'moon.dust': 'moon',
  'cloud.heavyrain': 'cloud-rain',
  'cloud.fog': 'cloud-fog',
  'cloud.snow': 'cloud-snow',
  'cloud.bolt': 'cloud-lightning',
  'thermometer': 'thermometer',
  'humidity': 'droplet',
  'cpu': 'cpu',
  'memorychip': 'cpu',
  'desktopcomputer': 'desktop',
  'display': 'monitor',
  'laptopcomputer': 'laptop',
  'keyboard': 'keyboard',
  'mouse': 'mouse-pointer',
  'headphones': 'headphones',
  'printer.fill': 'printer',
  'scanner': 'scanner',
  'tv': 'tv',
  'tv.fill': 'tv',
  'gamecontroller': 'gamepad',
  'gamecontroller.fill': 'gamepad',
  'barcode': 'barcode',
  'qrcode': 'qr-code',
  'ticket': 'ticket',
  'ticket.fill': 'ticket',
  'car': 'car',
  'car.fill': 'car',
  'bus': 'bus',
  'bus.fill': 'bus',
  'airplane': 'plane',
  'airplane.departure': 'plane-takeoff',
  'airplane.arrival': 'plane-landing',
  'tram': 'train',
  'tram.fill': 'train',
  'bicycle': 'bike',
  'bicycle.fill': 'bike',
  'ferry': 'ship',
  'ferry.fill': 'ship',
  'fuelpump': 'fuel',
  'fuelpump.fill': 'fuel'
};

// Mapping of SF Symbol names to equivalent Unicode glyphs for platforms without symbol support
const SF_TO_UNICODE_MAP: Record<string, string> = {
  'house': '🏠',
  'magnifyingglass': '🔍',
  'plus': '+',
  'minus': '-',
  'xmark': '✕',
  'checkmark': '✓',
  'chevron.right': '›',
  'chevron.left': '‹',
  'chevron.up': '˄',
  'chevron.down': '˅',
  'arrow.right': '→',
  'arrow.left': '←',
  'arrow.up': '↑',
  'arrow.down': '↓',
  'ellipsis': '…',
  'gear': '⚙️',
  'trash': '🗑️',
  'bell': '🔔',
  'envelope': '✉️',
  'message': '💬',
  'phone': '📱',
  'play': '▶️',
  'pause': '⏸️',
  'stop': '⏹️',
  'speaker': '🔊',
  'speaker.slash': '🔇',
  'person': '👤',
  'person.2': '👥',
  'cart': '🛒',
  'dollarsign.circle': '💲',
  'clock': '🕒',
  'calendar': '📅',
  'info.circle': 'ℹ️',
  'exclamationmark.triangle': '⚠️',
  'exclamationmark.circle': '❗',
  'lightbulb': '💡',
  'lock': '🔒',
  'unlock': '🔓',
  'shield': '🛡️',
  'bolt': '⚡',
  'target': '🎯',
  'flag': '🚩',
  'bookmark': '🔖',
  'star': '⭐',
  'heart': '♥️',
  'eye': '👁️',
  'eye.slash': '👁️‍🗨️',
  'hand.thumbsup': '👍',
  'hand.thumbsdown': '👎'
};

/**
 * Hook to determine if SF Symbols are supported on the current device
 */
export function useSFSymbolsSupport() {
  const { deviceType, isAppleDevice, browserInfo } = useDeviceCapabilities();
  
  const sfSymbolsSupport = useMemo(() => {
    // Check if running on an iOS/iPadOS device with Safari
    const isValidAppleDevice = isAppleDevice && 
      (deviceType === 'mobile' || deviceType === 'tablet');
    
    // Check browser and OS version (SF Symbols supported on iOS 13+)
    const hasOSSupport = /iPhone OS 1[3-9]|iPad.*OS 1[3-9]/.test(navigator.userAgent);
    
    // Check if running on Safari or WebKit-based browser
    const isSafariOrWebKit = /Safari|AppleWebKit/.test(navigator.userAgent) && 
      !/Chrome|Android/.test(navigator.userAgent);
    
    return {
      supported: isValidAppleDevice && hasOSSupport && isSafariOrWebKit,
      hierarchicalSupported: /iPhone OS 1[5-9]|iPad.*OS 1[5-9]/.test(navigator.userAgent),
      paletteSupported: /iPhone OS 1[5-9]|iPad.*OS 1[5-9]/.test(navigator.userAgent),
      animationSupported: /iPhone OS 1[5-9]|iPad.*OS 1[5-9]/.test(navigator.userAgent),
      isAppleDevice,
      deviceType
    };
  }, [isAppleDevice, deviceType, browserInfo]);
  
  return sfSymbolsSupport;
}

/**
 * Get CSS styles for SF Symbol based on props
 */
export function getSFSymbolStyles(props: SFSymbolProps) {
  const { 
    color = 'currentColor',
    secondaryColor,
    tertiaryColor,
    weight = 'regular',
    scale = 'medium',
    variant = 'none',
    renderingMode = 'monochrome',
    size = 24,
    animated = false,
    animationVariant = 'pulse'
  } = props;
  
  // Map weight to numerical value required by SF Symbols
  const weightValues: Record<SFSymbolWeight, number> = {
    'ultralight': 100,
    'thin': 200,
    'light': 300,
    'regular': 400,
    'medium': 500,
    'semibold': 600,
    'bold': 700,
    'heavy': 800,
    'black': 900
  };
  
  // Convert size to number if it's a string
  const sizeValue = typeof size === 'string' ? parseInt(size, 10) : size;
  
  // Base style
  const baseStyle: React.CSSProperties = {
    fontSize: `${sizeValue}px`,
    lineHeight: 1,
    fontWeight: weightValues[weight],
    color,
    fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
    fontFeatureSettings: '"liga", "case"',
    textRendering: 'optimizeLegibility',
    WebkitFontSmoothing: 'antialiased',
    MozOsxFontSmoothing: 'grayscale',
    display: 'inline-block',
    width: `${sizeValue}px`,
    height: `${sizeValue}px`,
    textAlign: 'center',
    verticalAlign: 'middle'
  };
  
  // Add rendering mode specific styles
  if (renderingMode === 'hierarchical') {
    baseStyle.WebkitSymbolVariant = 'hierarchical';
    baseStyle.fontVariationSettings = "'OPSZ' 40";
  } 
  else if (renderingMode === 'palette') {
    baseStyle.WebkitSymbolVariant = 'palette';
    baseStyle.WebkitSymbolPaletteColors = [
      color, 
      secondaryColor || color, 
      tertiaryColor || secondaryColor || color
    ].join(', ');
  }
  else if (renderingMode === 'multicolor') {
    baseStyle.WebkitSymbolVariant = 'multicolor';
  }
  
  // Add scale-specific styles
  const scaleValues: Record<SFSymbolScale, string> = {
    'small': 'small',
    'medium': 'medium',
    'large': 'large'
  };
  baseStyle.WebkitSymbolScale = scaleValues[scale];
  
  // Add variant-specific styles
  if (variant !== 'none') {
    baseStyle.WebkitSymbolVariant = variant;
  }
  
  // Add animation if supported
  if (animated) {
    switch (animationVariant) {
      case 'pulse':
        baseStyle.animation = 'sf-symbol-pulse 1.5s infinite';
        break;
      case 'bounce':
        baseStyle.animation = 'sf-symbol-bounce 1s infinite';
        break;
      case 'scale':
        baseStyle.animation = 'sf-symbol-scale 1.5s infinite';
        break;
      case 'appear':
        baseStyle.animation = 'sf-symbol-appear 0.3s forwards';
        break;
      case 'disappear':
        baseStyle.animation = 'sf-symbol-disappear 0.3s forwards';
        break;
    }
  }
  
  return baseStyle;
}

/**
 * Main hook for getting the appropriate icon based on platform
 */
export function useIcon(sfSymbolName: string, props?: Partial<SFSymbolProps>) {
  const { supported } = useSFSymbolsSupport();
  const { deviceType } = useDeviceCapabilities();
  
  // Combine default props with user props
  const combinedProps: SFSymbolProps = {
    name: sfSymbolName,
    size: 24,
    color: 'currentColor',
    weight: 'regular',
    scale: 'medium',
    variant: 'none',
    renderingMode: 'monochrome',
    animated: false,
    ...props
  };
  
  // Get appropriate icon based on platform
  return useMemo(() => {
    // For iOS/iPadOS with SF Symbols support, use SF Symbol
    if (supported) {
      const styles = getSFSymbolStyles(combinedProps);
      
      return {
        type: 'sf-symbol' as const,
        html: `<span class="sf-symbol" style="${Object.entries(styles).map(([key, value]) => 
          `${key.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value}`).join('; ')}"
          aria-label="${combinedProps.accessibilityLabel || sfSymbolName.replace(/[.]/g, ' ')}"
          role="img"
        >
          ${sfSymbolName}
        </span>`,
        fallbackIconName: SF_TO_LUCIDE_MAP[sfSymbolName] || 'help-circle',
        fallbackGlyph: SF_TO_UNICODE_MAP[sfSymbolName] || '?',
        props: combinedProps
      };
    }
    
    // For Android mobile/tablet, prefer Material Design-like icons from Lucide
    if ((deviceType === 'mobile' || deviceType === 'tablet') && !supported) {
      return {
        type: 'lucide' as const,
        iconName: SF_TO_LUCIDE_MAP[sfSymbolName] || 'help-circle',
        fallbackGlyph: SF_TO_UNICODE_MAP[sfSymbolName] || '?',
        props: combinedProps
      };
    }
    
    // For desktop, prefer Lucide icons
    return {
      type: 'lucide' as const,
      iconName: SF_TO_LUCIDE_MAP[sfSymbolName] || 'help-circle',
      fallbackGlyph: SF_TO_UNICODE_MAP[sfSymbolName] || '?',
      props: combinedProps
    };
  }, [sfSymbolName, supported, deviceType, combinedProps]);
}

// CSS to be injected for SF Symbol animations
export const SFSymbolsCSS = `
@supports (-webkit-touch-callout: none) {
  @keyframes sf-symbol-pulse {
    0% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.6; transform: scale(0.95); }
    100% { opacity: 1; transform: scale(1); }
  }
  
  @keyframes sf-symbol-bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-5px); }
  }
  
  @keyframes sf-symbol-scale {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.2); }
  }
  
  @keyframes sf-symbol-appear {
    0% { opacity: 0; transform: scale(0.8); }
    100% { opacity: 1; transform: scale(1); }
  }
  
  @keyframes sf-symbol-disappear {
    0% { opacity: 1; transform: scale(1); }
    100% { opacity: 0; transform: scale(0.8); }
  }
  
  /* SF Symbol class for Safari */
  .sf-symbol {
    -webkit-user-select: none;
    user-select: none;
    font-feature-settings: "liga", "case";
    text-rendering: optimizeLegibility;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
}
`;

export default { 
  useIcon, 
  useSFSymbolsSupport, 
  getSFSymbolStyles,
  SFSymbolsCSS,
  SF_TO_LUCIDE_MAP,
  SF_TO_UNICODE_MAP
};