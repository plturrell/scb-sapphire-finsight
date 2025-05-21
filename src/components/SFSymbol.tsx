import React, { useEffect } from 'react';
import { 
  useIcon, 
  SFSymbolProps, 
  SFSymbolsCSS,
  useSFSymbolsSupport
} from '../lib/sf-symbols';
import * as LucideIcons from 'lucide-react';

// Import styles once when component is first used
let stylesInjected = false;

interface SFSymbolComponentProps extends SFSymbolProps {
  className?: string;
  style?: React.CSSProperties;
}

/**
 * SFSymbol Component
 * 
 * A cross-platform icon component that uses SF Symbols on iOS/iPadOS
 * and automatically falls back to equivalent icons on other platforms.
 */
export default function SFSymbol({
  name,
  size = 24,
  color = 'currentColor',
  weight = 'regular',
  scale = 'medium',
  variant = 'none',
  renderingMode = 'monochrome',
  animated = false,
  animationVariant = 'pulse',
  accessibilityLabel,
  fallbackIcon,
  fallbackSVG,
  fallbackGlyph,
  secondaryColor,
  tertiaryColor,
  className = '',
  style = {},
}: SFSymbolComponentProps) {
  const icon = useIcon(name, {
    size,
    color,
    weight,
    scale,
    variant,
    renderingMode,
    animated,
    animationVariant,
    accessibilityLabel,
    fallbackIcon,
    fallbackSVG,
    fallbackGlyph,
    secondaryColor,
    tertiaryColor
  });
  
  const { supported } = useSFSymbolsSupport();
  
  // Inject SF Symbol CSS styles on first render
  useEffect(() => {
    if (!stylesInjected && typeof document !== 'undefined') {
      const styleEl = document.createElement('style');
      styleEl.textContent = SFSymbolsCSS;
      document.head.appendChild(styleEl);
      stylesInjected = true;
    }
  }, []);
  
  // Render SF Symbol for iOS/iPadOS
  if (icon.type === 'sf-symbol' && supported) {
    return (
      <span 
        className={`sf-symbol ${className}`}
        style={{
          fontSize: `${size}px`,
          color,
          ...style,
        }}
        dangerouslySetInnerHTML={{ __html: icon.html }}
        aria-label={accessibilityLabel || name.replace(/[.]/g, ' ')}
        role="img"
      />
    );
  }
  
  // Render Lucide icon for other platforms
  if (icon.type === 'lucide') {
    const LucideIcon = (LucideIcons as any)[icon.iconName.charAt(0).toUpperCase() + 
      icon.iconName.slice(1).replace(/-([a-z])/g, (g) => g[1].toUpperCase())];
    
    if (LucideIcon) {
      return (
        <LucideIcon
          size={size}
          color={color}
          className={className}
          style={style}
          aria-label={accessibilityLabel || name.replace(/[.]/g, ' ')}
        />
      );
    }
    
    // Fallback to glyph if Lucide icon not found
    return (
      <span
        className={`sf-symbol-fallback ${className}`}
        style={{
          fontSize: `${size}px`,
          color,
          display: 'inline-block',
          width: `${size}px`,
          height: `${size}px`,
          textAlign: 'center',
          lineHeight: 1,
          ...style,
        }}
        aria-label={accessibilityLabel || name.replace(/[.]/g, ' ')}
        role="img"
      >
        {fallbackGlyph || icon.fallbackGlyph}
      </span>
    );
  }
  
  // Fallback to custom icon or glyph
  return (
    <span
      className={`sf-symbol-fallback ${className}`}
      style={{
        fontSize: `${size}px`,
        color,
        display: 'inline-block',
        width: `${size}px`,
        height: `${size}px`,
        textAlign: 'center',
        lineHeight: 1,
        ...style,
      }}
      aria-label={accessibilityLabel || name.replace(/[.]/g, ' ')}
      role="img"
    >
      {fallbackIcon || fallbackGlyph || '?'}
    </span>
  );
}