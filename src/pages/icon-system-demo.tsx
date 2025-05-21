import React, { useState } from 'react';
import { Icon, ICONS, IconSystemProvider } from '../components/IconSystem';
import { useDeviceCapabilities } from '../hooks/useDeviceCapabilities';
import { useIOSOptimizations, useIOSPerformanceMonitoring } from '../lib/performance';
import SFSymbol from '../components/SFSymbol';
import EnhancedIOSIcon from '../components/EnhancedIOSIcon';

/**
 * Icon System Demo Page
 * 
 * Showcases the world-class icon system with iOS/iPadOS optimization.
 */
export default function IconSystemDemo() {
  const { isAppleDevice, deviceType, prefersColorScheme } = useDeviceCapabilities();
  const { optimizations, isIOSDevice } = useIOSOptimizations();
  const { metrics, startMonitoring, stopMonitoring, isMonitoring } = useIOSPerformanceMonitoring();
  
  const [iconSize, setIconSize] = useState(32);
  const [showAnimated, setShowAnimated] = useState(true);
  const [showInteractive, setShowInteractive] = useState(true);
  const [selectedIcon, setSelectedIcon] = useState<string | null>(null);
  const [forcePlatform, setForcePlatform] = useState<'ios' | 'android' | 'web' | null>(null);
  const [iconColor, setIconColor] = useState('#0072AA'); // SCB blue
  
  // Toggle iOS performance monitoring
  const toggleMonitoring = () => {
    if (isMonitoring) {
      stopMonitoring();
    } else {
      startMonitoring();
    }
  };
  
  // Get all icons
  const allIcons = Object.entries(ICONS);
  
  // Theme based on system preference
  const theme = prefersColorScheme || 'light';
  const isDarkMode = theme === 'dark';
  
  // Background and text colors based on theme
  const bgColor = isDarkMode ? '#121212' : '#f5f5f7';
  const textColor = isDarkMode ? '#f5f5f7' : '#1d1d1f';
  const cardBg = isDarkMode ? '#1d1d1f' : 'white';
  const cardBorder = isDarkMode ? '#2d2d2f' : '#e0e0e0';
  
  return (
    <IconSystemProvider>
      <div style={{ 
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        color: textColor,
        backgroundColor: bgColor,
        minHeight: '100vh',
        padding: '2rem',
      }}>
        <header style={{ 
          marginBottom: '2rem',
          borderBottom: `1px solid ${cardBorder}`,
          paddingBottom: '1rem',
        }}>
          <h1 style={{ 
            fontSize: '1.875rem', 
            marginBottom: '0.5rem',
            fontWeight: 600 
          }}>
            SCB World-Class Icon System
          </h1>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Icon 
              name={isIOSDevice ? 'apple.logo' : 'globe'} 
              size={24} 
              color={iconColor}
            />
            <span>
              Detected platform: <strong>{isAppleDevice ? 'Apple' : 'Non-Apple'}</strong>
              {isAppleDevice && <span> ({deviceType})</span>}
            </span>
          </div>
          
          {isIOSDevice && (
            <div style={{ 
              marginTop: '1rem', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '1rem',
              flexWrap: 'wrap',
            }}>
              <button 
                onClick={toggleMonitoring}
                style={{
                  padding: '0.5rem 0.75rem',
                  borderRadius: '0.5rem',
                  backgroundColor: isMonitoring ? '#CC0000' : '#0072AA',
                  color: 'white',
                  border: 'none',
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <Icon 
                  name={isMonitoring ? 'stop.circle' : 'gauge'} 
                  size={16} 
                  color="white"
                />
                {isMonitoring ? 'Stop iOS Monitoring' : 'Start iOS Monitoring'}
              </button>
              
              {isMonitoring && (
                <div style={{ 
                  fontSize: '0.875rem',
                  display: 'flex',
                  gap: '1rem',
                  flexWrap: 'wrap',
                }}>
                  <span>FPS: {metrics.averageFPS.toFixed(1)}</span>
                  <span>
                    Thermal: 
                    <span style={{ 
                      color: metrics.thermalState === 'normal' ? '#36B37E' : 
                             metrics.thermalState === 'fair' ? '#FFAB00' :
                             metrics.thermalState === 'serious' ? '#FF5630' : 
                             metrics.thermalState === 'critical' ? '#FF0000' : textColor,
                      marginLeft: '0.25rem',
                      fontWeight: 500,
                    }}>
                      {metrics.thermalState}
                    </span>
                  </span>
                  {metrics.lowPowerModeEnabled && (
                    <span style={{ color: '#FFAB00', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Icon name="bolt.slash.fill" size={12} color="#FFAB00" />
                      Low Power Mode
                    </span>
                  )}
                  {optimizations.reducedAnimations && (
                    <span style={{ color: '#FFAB00', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Icon name="slowmo" size={12} color="#FFAB00" />
                      Reduced Animations
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </header>
        
        <div style={{ 
          display: 'flex', 
          gap: '2rem', 
          alignItems: 'flex-start',
          flexDirection: isIOSDevice && deviceType === 'mobile' ? 'column' : 'row',
        }}>
          {/* Controls */}
          <div style={{ 
            backgroundColor: cardBg,
            padding: '1.5rem',
            borderRadius: '1rem',
            boxShadow: isDarkMode ? '0 4px 12px rgba(0, 0, 0, 0.3)' : '0 4px 12px rgba(0, 0, 0, 0.05)',
            border: `1px solid ${cardBorder}`,
            minWidth: '280px',
            position: 'sticky',
            top: '1rem',
          }}>
            <h2 style={{ 
              fontSize: '1.25rem', 
              marginBottom: '1rem',
              fontWeight: 600 
            }}>
              Icon Settings
            </h2>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: 500,
              }}>
                Icon Size: {iconSize}px
              </label>
              <input
                type="range"
                min="16"
                max="64"
                value={iconSize}
                onChange={(e) => setIconSize(parseInt(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: 500,
              }}>
                Icon Color
              </label>
              <input
                type="color"
                value={iconColor}
                onChange={(e) => setIconColor(e.target.value)}
                style={{ width: '100%', height: '2.5rem' }}
              />
            </div>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ 
                display: 'flex', 
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.5rem',
                cursor: 'pointer',
              }}>
                <input
                  type="checkbox"
                  checked={showAnimated}
                  onChange={() => setShowAnimated(!showAnimated)}
                />
                <span>Show Animated Icons</span>
              </label>
              
              <label style={{ 
                display: 'flex', 
                alignItems: 'center',
                gap: '0.5rem',
                cursor: 'pointer',
              }}>
                <input
                  type="checkbox"
                  checked={showInteractive}
                  onChange={() => setShowInteractive(!showInteractive)}
                />
                <span>Show Interactive Icons</span>
              </label>
            </div>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: 500,
              }}>
                Force Platform
              </label>
              <select
                value={forcePlatform || ''}
                onChange={(e) => setForcePlatform(e.target.value as any || null)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  borderRadius: '0.5rem',
                  border: `1px solid ${cardBorder}`,
                  backgroundColor: cardBg,
                  color: textColor,
                }}
              >
                <option value="">Auto-detect</option>
                <option value="ios">iOS (SF Symbols)</option>
                <option value="android">Android (Material)</option>
                <option value="web">Web (Lucide)</option>
              </select>
            </div>
            
            {selectedIcon && (
              <div style={{ 
                marginTop: '1.5rem',
                padding: '1rem',
                backgroundColor: isDarkMode ? '#2d2d2f' : '#f5f5f7',
                borderRadius: '0.5rem',
              }}>
                <h3 style={{ 
                  fontSize: '1rem', 
                  marginBottom: '0.5rem',
                  fontWeight: 600 
                }}>
                  Selected Icon: {selectedIcon}
                </h3>
                <div style={{ 
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '0.5rem',
                }}>
                  <div style={{ 
                    padding: '1rem', 
                    borderRadius: '0.5rem', 
                    backgroundColor: cardBg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column',
                    gap: '0.5rem',
                  }}>
                    <Icon
                      name={ICONS[selectedIcon as keyof typeof ICONS]}
                      size={iconSize}
                      color={iconColor}
                      interactive={showInteractive}
                      animated={showAnimated}
                      forcePlatform={forcePlatform as any}
                    />
                    <span style={{ fontSize: '0.75rem' }}>Universal</span>
                  </div>
                  <div style={{ 
                    padding: '1rem', 
                    borderRadius: '0.5rem', 
                    backgroundColor: cardBg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column',
                    gap: '0.5rem',
                  }}>
                    <SFSymbol
                      name={ICONS[selectedIcon as keyof typeof ICONS]}
                      size={iconSize}
                      color={iconColor}
                      animated={showAnimated}
                    />
                    <span style={{ fontSize: '0.75rem' }}>SF Symbol</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Icon Grid */}
          <div style={{ flex: 1 }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem'
            }}>
              <h2 style={{ 
                fontSize: '1.25rem', 
                fontWeight: 600 
              }}>
                Icon Library
              </h2>
              <span style={{ fontSize: '0.875rem' }}>
                {allIcons.length} icons available
              </span>
            </div>
            
            <div style={{ 
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
              gap: '1rem',
            }}>
              {allIcons.map(([name, symbol]) => (
                <div
                  key={name}
                  onClick={() => setSelectedIcon(name)}
                  style={{ 
                    padding: '1rem',
                    borderRadius: '0.75rem',
                    backgroundColor: selectedIcon === name 
                      ? (isDarkMode ? '#2D5DA8' : '#E1EBFA') 
                      : cardBg,
                    border: `1px solid ${selectedIcon === name 
                      ? (isDarkMode ? '#4D7DCC' : '#B3D1FF') 
                      : cardBorder}`,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.75rem',
                    boxShadow: isDarkMode ? '0 2px 8px rgba(0, 0, 0, 0.2)' : '0 2px 8px rgba(0, 0, 0, 0.03)',
                    transition: 'all 0.2s ease-out',
                  }}
                >
                  <Icon
                    name={symbol}
                    size={iconSize}
                    color={iconColor}
                    interactive={showInteractive}
                    animated={showAnimated}
                    forcePlatform={forcePlatform as any}
                  />
                  <span style={{ 
                    fontSize: '0.75rem',
                    textAlign: 'center',
                    wordBreak: 'break-word',
                    color: selectedIcon === name 
                      ? (isDarkMode ? 'white' : '#0072AA') 
                      : textColor,
                  }}>
                    {name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* iOS Specific Demo Section */}
        {isIOSDevice && (
          <div style={{ marginTop: '3rem' }}>
            <h2 style={{ 
              fontSize: '1.25rem', 
              marginBottom: '1.5rem',
              fontWeight: 600,
              borderBottom: `1px solid ${cardBorder}`,
              paddingBottom: '0.5rem',
            }}>
              iOS-Specific Icon Enhancements
            </h2>
            
            <div style={{ 
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '1.5rem',
            }}>
              {/* Rendering Modes */}
              <div style={{ 
                backgroundColor: cardBg,
                padding: '1.5rem',
                borderRadius: '1rem',
                boxShadow: isDarkMode ? '0 4px 12px rgba(0, 0, 0, 0.3)' : '0 4px 12px rgba(0, 0, 0, 0.05)',
                border: `1px solid ${cardBorder}`,
              }}>
                <h3 style={{ 
                  fontSize: '1rem', 
                  marginBottom: '1rem',
                  fontWeight: 600 
                }}>
                  Rendering Modes
                </h3>
                
                <div style={{ 
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '1rem',
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <EnhancedIOSIcon
                      name="chart.bar.fill"
                      size={48}
                      color={iconColor}
                      renderingMode="monochrome"
                    />
                    <p style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>Monochrome</p>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <EnhancedIOSIcon
                      name="chart.bar.fill"
                      size={48}
                      color={iconColor}
                      renderingMode="hierarchical"
                    />
                    <p style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>Hierarchical</p>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <EnhancedIOSIcon
                      name="chart.bar.fill"
                      size={48}
                      color={iconColor}
                      renderingMode="palette"
                      secondaryColor={isDarkMode ? '#4D7DCC' : '#B3D1FF'}
                    />
                    <p style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>Palette</p>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <EnhancedIOSIcon
                      name="chart.bar.fill"
                      size={48}
                      renderingMode="multicolor"
                    />
                    <p style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>Multicolor</p>
                  </div>
                </div>
              </div>
              
              {/* Weights */}
              <div style={{ 
                backgroundColor: cardBg,
                padding: '1.5rem',
                borderRadius: '1rem',
                boxShadow: isDarkMode ? '0 4px 12px rgba(0, 0, 0, 0.3)' : '0 4px 12px rgba(0, 0, 0, 0.05)',
                border: `1px solid ${cardBorder}`,
              }}>
                <h3 style={{ 
                  fontSize: '1rem', 
                  marginBottom: '1rem',
                  fontWeight: 600 
                }}>
                  Weights
                </h3>
                
                <div style={{ 
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '1rem',
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <EnhancedIOSIcon
                      name="star.fill"
                      size={40}
                      color={iconColor}
                      weight="light"
                    />
                    <p style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>Light</p>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <EnhancedIOSIcon
                      name="star.fill"
                      size={40}
                      color={iconColor}
                      weight="regular"
                    />
                    <p style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>Regular</p>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <EnhancedIOSIcon
                      name="star.fill"
                      size={40}
                      color={iconColor}
                      weight="bold"
                    />
                    <p style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>Bold</p>
                  </div>
                </div>
              </div>
              
              {/* Animations */}
              <div style={{ 
                backgroundColor: cardBg,
                padding: '1.5rem',
                borderRadius: '1rem',
                boxShadow: isDarkMode ? '0 4px 12px rgba(0, 0, 0, 0.3)' : '0 4px 12px rgba(0, 0, 0, 0.05)',
                border: `1px solid ${cardBorder}`,
              }}>
                <h3 style={{ 
                  fontSize: '1rem', 
                  marginBottom: '1rem',
                  fontWeight: 600 
                }}>
                  Animations
                </h3>
                
                <div style={{ 
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '1rem',
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <EnhancedIOSIcon
                      name="bell.fill"
                      size={40}
                      color={iconColor}
                      animated={true}
                      animationVariant="pulse"
                    />
                    <p style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>Pulse</p>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <EnhancedIOSIcon
                      name="bell.fill"
                      size={40}
                      color={iconColor}
                      animated={true}
                      animationVariant="bounce"
                    />
                    <p style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>Bounce</p>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <EnhancedIOSIcon
                      name="bell.fill"
                      size={40}
                      color={iconColor}
                      animated={true}
                      animationVariant="scale"
                    />
                    <p style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>Scale</p>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <EnhancedIOSIcon
                      name="bell.fill"
                      size={40}
                      color={iconColor}
                      animateOnMount={true}
                    />
                    <p style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>Appear</p>
                  </div>
                </div>
              </div>
              
              {/* Variants */}
              <div style={{ 
                backgroundColor: cardBg,
                padding: '1.5rem',
                borderRadius: '1rem',
                boxShadow: isDarkMode ? '0 4px 12px rgba(0, 0, 0, 0.3)' : '0 4px 12px rgba(0, 0, 0, 0.05)',
                border: `1px solid ${cardBorder}`,
              }}>
                <h3 style={{ 
                  fontSize: '1rem', 
                  marginBottom: '1rem',
                  fontWeight: 600 
                }}>
                  Variants
                </h3>
                
                <div style={{ 
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '1rem',
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <EnhancedIOSIcon
                      name="person"
                      size={40}
                      color={iconColor}
                    />
                    <p style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>Default</p>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <EnhancedIOSIcon
                      name="person"
                      size={40}
                      color={iconColor}
                      variant="fill"
                    />
                    <p style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>Fill</p>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <EnhancedIOSIcon
                      name="person"
                      size={40}
                      color={iconColor}
                      variant="slash"
                    />
                    <p style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>Slash</p>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <EnhancedIOSIcon
                      name="person"
                      size={40}
                      color={iconColor}
                      variant="enclosedcircle"
                    />
                    <p style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>Circle</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </IconSystemProvider>
  );
}