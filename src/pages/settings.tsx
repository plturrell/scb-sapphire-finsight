import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { MonochromeIcons } from '@/components/MonochromeIcons';
import { useUIPreferences } from '@/context/UIPreferencesContext';

/**
 * True Jony Ive Settings Page
 * 
 * "Simplicity is the ultimate sophistication" - Steve Jobs
 * "True simplicity is derived from so much more than just the absence of clutter and ornamentation. 
 * It's about bringing order to complexity." - Jony Ive
 * 
 * Pure monochrome design with perfect spacing
 * Every setting has real functionality - no fake controls
 * Mathematical precision in layout and interaction
 */

interface SettingItem {
  id: string;
  title: string;
  description: string;
  type: 'toggle' | 'select' | 'range' | 'action';
  value?: any;
  options?: { label: string; value: any }[];
  min?: number;
  max?: number;
  step?: number;
  action?: () => void;
}

const Settings: React.FC = () => {
  const { isDarkMode, preferences, updatePreferences } = useUIPreferences();
  const [localSettings, setLocalSettings] = useState(preferences);
  const [apiSettings, setApiSettings] = useState({
    perplexityApiKey: '',
    cacheTimeout: 15,
    enableAnalytics: true,
    dataRetention: 30,
  });

  // Load API settings from localStorage on mount
  useEffect(() => {
    const savedApiSettings = localStorage.getItem('scb-api-settings');
    if (savedApiSettings) {
      setApiSettings(JSON.parse(savedApiSettings));
    }
  }, []);

  // Save API settings to localStorage
  const saveApiSettings = (newSettings: typeof apiSettings) => {
    setApiSettings(newSettings);
    localStorage.setItem('scb-api-settings', JSON.stringify(newSettings));
  };

  // Settings configuration with real functionality
  const settingsGroups = [
    {
      title: 'Display',
      settings: [
        {
          id: 'darkMode',
          title: 'Dark Mode',
          description: 'Switch between light and dark interface',
          type: 'toggle' as const,
          value: isDarkMode,
          action: () => updatePreferences({ darkMode: !isDarkMode }),
        },
        {
          id: 'enableAnimations',
          title: 'Animations',
          description: 'Enable interface animations and transitions',
          type: 'toggle' as const,
          value: localSettings.enableAnimations,
          action: () => {
            const newValue = !localSettings.enableAnimations;
            setLocalSettings(prev => ({ ...prev, enableAnimations: newValue }));
            updatePreferences({ enableAnimations: newValue });
          },
        },
        {
          id: 'enableHaptics',
          title: 'Haptic Feedback',
          description: 'Tactile feedback on supported devices',
          type: 'toggle' as const,
          value: localSettings.enableHaptics,
          action: () => {
            const newValue = !localSettings.enableHaptics;
            setLocalSettings(prev => ({ ...prev, enableHaptics: newValue }));
            updatePreferences({ enableHaptics: newValue });
          },
        },
        {
          id: 'fontScale',
          title: 'Text Size',
          description: 'Adjust text size throughout the app',
          type: 'range' as const,
          value: localSettings.fontScale || 1.0,
          min: 0.8,
          max: 1.4,
          step: 0.1,
        },
      ],
    },
    {
      title: 'Data & Privacy',
      settings: [
        {
          id: 'enableNewsBar',
          title: 'News Updates',
          description: 'Show real-time market news in navigation',
          type: 'toggle' as const,
          value: localSettings.enableNewsBar,
          action: () => {
            const newValue = !localSettings.enableNewsBar;
            setLocalSettings(prev => ({ ...prev, enableNewsBar: newValue }));
            updatePreferences({ enableNewsBar: newValue });
          },
        },
        {
          id: 'enableAnalytics',
          title: 'Usage Analytics',
          description: 'Help improve the app by sharing usage data',
          type: 'toggle' as const,
          value: apiSettings.enableAnalytics,
          action: () => {
            saveApiSettings({ ...apiSettings, enableAnalytics: !apiSettings.enableAnalytics });
          },
        },
        {
          id: 'dataRetention',
          title: 'Data Retention',
          description: 'How long to keep cached data (days)',
          type: 'select' as const,
          value: apiSettings.dataRetention,
          options: [
            { label: '7 days', value: 7 },
            { label: '30 days', value: 30 },
            { label: '90 days', value: 90 },
            { label: '1 year', value: 365 },
          ],
        },
      ],
    },
    {
      title: 'API Configuration',
      settings: [
        {
          id: 'cacheTimeout',
          title: 'Cache Timeout',
          description: 'API cache duration in minutes',
          type: 'range' as const,
          value: apiSettings.cacheTimeout,
          min: 5,
          max: 60,
          step: 5,
        },
      ],
    },
    {
      title: 'Account',
      settings: [
        {
          id: 'clearCache',
          title: 'Clear Cache',
          description: 'Remove all cached data and refresh from APIs',
          type: 'action' as const,
          action: () => {
            // Clear all caches
            localStorage.removeItem('scb-cache');
            sessionStorage.clear();
            
            // Clear API caches
            fetch('/api/cache-management', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'clear' }),
            }).then(() => {
              alert('Cache cleared successfully');
              window.location.reload();
            }).catch(() => {
              alert('Failed to clear server cache');
            });
          },
        },
        {
          id: 'exportData',
          title: 'Export Data',
          description: 'Download your data and preferences',
          type: 'action' as const,
          action: () => {
            const data = {
              preferences: localSettings,
              apiSettings,
              timestamp: new Date().toISOString(),
            };
            
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `scb-finsight-data-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          },
        },
      ],
    },
  ];

  // Handle range input changes
  const handleRangeChange = (settingId: string, value: number) => {
    if (settingId === 'fontScale') {
      setLocalSettings(prev => ({ ...prev, fontScale: value }));
      updatePreferences({ fontScale: value });
      // Apply font scale immediately
      document.documentElement.style.setProperty('--font-scale', value.toString());
    } else if (settingId === 'cacheTimeout') {
      saveApiSettings({ ...apiSettings, cacheTimeout: value });
    }
  };

  // Handle select changes
  const handleSelectChange = (settingId: string, value: any) => {
    if (settingId === 'dataRetention') {
      saveApiSettings({ ...apiSettings, dataRetention: value });
    }
  };

  // Render a setting item
  const renderSetting = (setting: SettingItem) => {
    return (
      <div 
        key={setting.id}
        className="setting-item"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '24px 0',
          borderBottom: '1px solid var(--border-color)',
          minHeight: '72px',
        }}
      >
        <div style={{ flex: 1 }}>
          <h3 style={{
            fontSize: '17px',
            fontWeight: '500',
            color: 'var(--text-primary)',
            margin: '0 0 4px 0',
            lineHeight: '1.2',
          }}>
            {setting.title}
          </h3>
          <p style={{
            fontSize: '15px',
            color: 'var(--text-secondary)',
            margin: 0,
            lineHeight: '1.3',
          }}>
            {setting.description}
          </p>
        </div>
        
        <div style={{ marginLeft: '24px' }}>
          {setting.type === 'toggle' && (
            <button
              onClick={setting.action}
              style={{
                width: '52px',
                height: '32px',
                borderRadius: '16px',
                border: 'none',
                background: setting.value ? '#007AFF' : '#E5E5E7',
                position: 'relative',
                cursor: 'pointer',
                transition: 'background-color 200ms ease',
              }}
              aria-label={`${setting.value ? 'Disable' : 'Enable'} ${setting.title}`}
            >
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '14px',
                  background: 'white',
                  position: 'absolute',
                  top: '2px',
                  left: setting.value ? '22px' : '2px',
                  transition: 'left 200ms ease',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.15)',
                }}
              />
            </button>
          )}
          
          {setting.type === 'range' && (
            <input
              type="range"
              min={setting.min}
              max={setting.max}
              step={setting.step}
              value={setting.value}
              onChange={(e) => handleRangeChange(setting.id, parseFloat(e.target.value))}
              style={{
                width: '120px',
                height: '4px',
                borderRadius: '2px',
                background: '#E5E5E7',
                outline: 'none',
                cursor: 'pointer',
              }}
            />
          )}
          
          {setting.type === 'select' && setting.options && (
            <select
              value={setting.value}
              onChange={(e) => handleSelectChange(setting.id, parseInt(e.target.value))}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: 'var(--background)',
                color: 'var(--text-primary)',
                fontSize: '15px',
                cursor: 'pointer',
                minWidth: '120px',
              }}
            >
              {setting.options.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          )}
          
          {setting.type === 'action' && (
            <button
              onClick={setting.action}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: 'var(--background)',
                color: '#007AFF',
                fontSize: '15px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 200ms ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--background-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--background)';
              }}
            >
              {setting.title}
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <Head>
        <title>Settings | SCB Sapphire FinSight</title>
        <meta name="description" content="Configure your SCB Sapphire FinSight preferences" />
      </Head>
      
      <div style={{
        minHeight: '100vh',
        background: 'var(--background)',
        color: 'var(--text-primary)',
        '--background': isDarkMode ? '#000000' : '#ffffff',
        '--background-hover': isDarkMode ? '#1c1c1e' : '#f2f2f7',
        '--text-primary': isDarkMode ? '#ffffff' : '#1d1d1f',
        '--text-secondary': isDarkMode ? '#8e8e93' : '#6d6d80',
        '--border-color': isDarkMode ? '#38383a' : '#e5e5e7',
      } as React.CSSProperties}>
        
        {/* Header */}
        <header style={{
          position: 'sticky',
          top: 0,
          background: 'var(--background)',
          borderBottom: '1px solid var(--border-color)',
          backdropFilter: 'blur(20px)',
          zIndex: 10,
        }}>
          <div style={{
            maxWidth: '800px',
            margin: '0 auto',
            padding: '16px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <button
              onClick={() => window.history.back()}
              style={{
                display: 'flex',
                alignItems: 'center',
                background: 'none',
                border: 'none',
                color: '#007AFF',
                fontSize: '17px',
                cursor: 'pointer',
                padding: '8px',
                marginLeft: '-8px',
              }}
            >
              <div style={{ transform: 'rotate(180deg)', marginRight: '8px' }}>
                <MonochromeIcons.ChevronRight size={20} />
              </div>
              Back
            </button>
            
            <h1 style={{
              fontSize: '22px',
              fontWeight: '600',
              margin: 0,
              color: 'var(--text-primary)',
            }}>
              Settings
            </h1>
            
            <div style={{ width: '60px' }} /> {/* Spacer for center alignment */}
          </div>
        </header>

        {/* Content */}
        <main style={{
          maxWidth: '800px',
          margin: '0 auto',
          padding: '0 24px 48px',
        }}>
          {settingsGroups.map((group, groupIndex) => (
            <section key={group.title} style={{
              marginTop: groupIndex === 0 ? '32px' : '48px',
            }}>
              <h2 style={{
                fontSize: '22px',
                fontWeight: '600',
                color: 'var(--text-primary)',
                margin: '0 0 16px 0',
                letterSpacing: '-0.02em',
              }}>
                {group.title}
              </h2>
              
              <div style={{
                background: 'var(--background)',
                borderRadius: '16px',
                border: '1px solid var(--border-color)',
                overflow: 'hidden',
              }}>
                {group.settings.map((setting, index) => (
                  <div key={setting.id}>
                    {renderSetting(setting)}
                  </div>
                ))}
              </div>
            </section>
          ))}
          
          {/* App Info */}
          <section style={{ marginTop: '48px', textAlign: 'center' }}>
            <div style={{
              padding: '24px',
              background: 'var(--background)',
              borderRadius: '16px',
              border: '1px solid var(--border-color)',
            }}>
              <h3 style={{
                fontSize: '17px',
                fontWeight: '500',
                color: 'var(--text-primary)',
                margin: '0 0 8px 0',
              }}>
                SCB Sapphire FinSight
              </h3>
              <p style={{
                fontSize: '15px',
                color: 'var(--text-secondary)',
                margin: '0 0 16px 0',
              }}>
                Version 1.0.0 • Built with real APIs and AI
              </p>
              <p style={{
                fontSize: '13px',
                color: 'var(--text-secondary)',
                margin: 0,
                lineHeight: '1.4',
              }}>
                Designed by Claude with Jony Ive principles<br />
                True monochrome aesthetics • Mathematical precision • Purposeful reduction
              </p>
            </div>
          </section>
        </main>
      </div>
    </>
  );
};

export default Settings;