import React, { useState, useEffect } from 'react';
import perplexityRateLimiter, { UsageMetrics } from '@/services/PerplexityRateLimiter';
import { Activity, AlertCircle, BarChart3, Clock, RefreshCw, Info, CheckCircle, XCircle, Wifi, WifiOff, Zap } from 'lucide-react';
import { useDeviceCapabilities } from '@/hooks/useDeviceCapabilities';
import { useNetworkAwareLoading } from '@/hooks/useNetworkAwareLoading';

interface EnhancedPerplexityUsageStatsProps {
  className?: string;
  compact?: boolean;
  onReset?: () => void;
  theme?: 'light' | 'dark';
  showNetworkInfo?: boolean;
  showResetButton?: boolean;
  initialTab?: 'summary' | 'history';
  expandable?: boolean;
}

/**
 * EnhancedPerplexityUsageStats Component
 * A usage statistics component for Perplexity API with SCB Beautiful UI styling
 */
export default function EnhancedPerplexityUsageStats({
  className = '',
  compact = false,
  onReset,
  theme: propTheme,
  showNetworkInfo = true,
  showResetButton = true,
  initialTab = 'summary',
  expandable = true
}: EnhancedPerplexityUsageStatsProps) {
  const [metrics, setMetrics] = useState<UsageMetrics | null>(null);
  const [limits, setLimits] = useState<{
    maxRequestsPerMinute: number;
    maxRequestsPerHour: number;
    maxRequestsPerDay: number;
    maxTokensPerDay: number;
  } | null>(null);
  const [activeTab, setActiveTab] = useState<'summary' | 'history'>(initialTab);
  const [expanded, setExpanded] = useState(!compact);
  
  const { prefersColorScheme, tier } = useDeviceCapabilities();
  const { connection } = useNetworkAwareLoading();
  
  // Determine effective theme based on props or system preference
  const theme = propTheme || prefersColorScheme || 'light';
  
  // Define SCB colors based on theme
  const colors = {
    light: {
      primary: 'rgb(var(--scb-honolulu-blue, 0, 114, 170))', // #0072AA
      secondary: 'rgb(var(--scb-american-green, 33, 170, 71))', // #21AA47
      accent: '#cc00dc', // SCB purple
      background: 'white',
      cardBackground: 'white',
      text: '#333333',
      textLight: '#666666',
      textMuted: '#888888',
      border: '#e0e0e0',
      progressBackground: '#f0f0f0',
      headerBackground: '#f9f9f9',
      warningBackground: 'rgba(255, 204, 0, 0.1)',
      warningBorder: 'rgba(255, 204, 0, 0.3)',
      warningText: '#806600',
      errorBackground: 'rgba(204, 0, 0, 0.1)',
      errorBorder: 'rgba(204, 0, 0, 0.3)',
      errorText: '#cc0000',
      successBackground: 'rgba(33, 170, 71, 0.1)',
      successBorder: 'rgba(33, 170, 71, 0.3)',
      successText: '#21AA47',
      buttonHover: 'rgba(0, 114, 170, 0.08)',
      progress: {
        good: 'rgb(var(--scb-american-green, 33, 170, 71))', // Green
        warning: 'rgb(var(--scb-sun, 255, 204, 0))', // Yellow
        danger: 'rgb(var(--scb-persian-red, 204, 0, 0))' // Red
      },
      networkIndicator: {
        good: 'rgb(var(--scb-american-green, 33, 170, 71))', // Green
        warning: 'rgb(var(--scb-sun, 255, 204, 0))', // Yellow
        bad: 'rgb(var(--scb-persian-red, 204, 0, 0))' // Red
      }
    },
    dark: {
      primary: 'rgb(0, 142, 211)', // Lighter for dark mode
      secondary: 'rgb(41, 204, 86)', // Lighter for dark mode
      accent: '#e838f1', // Lighter purple for dark mode
      background: '#121212',
      cardBackground: '#1e1e1e',
      text: '#e0e0e0',
      textLight: '#a0a0a0',
      textMuted: '#777777',
      border: '#333333',
      progressBackground: '#333333',
      headerBackground: '#252525',
      warningBackground: 'rgba(255, 214, 51, 0.15)',
      warningBorder: 'rgba(255, 214, 51, 0.3)',
      warningText: '#ffdc73',
      errorBackground: 'rgba(255, 99, 99, 0.15)',
      errorBorder: 'rgba(255, 99, 99, 0.3)',
      errorText: '#ff6363',
      successBackground: 'rgba(41, 204, 86, 0.15)',
      successBorder: 'rgba(41, 204, 86, 0.3)',
      successText: '#29cc56',
      buttonHover: 'rgba(0, 142, 211, 0.15)',
      progress: {
        good: 'rgb(41, 204, 86)', // Lighter green
        warning: 'rgb(255, 214, 51)', // Lighter yellow
        danger: 'rgb(255, 99, 99)' // Lighter red
      },
      networkIndicator: {
        good: 'rgb(41, 204, 86)', // Lighter green
        warning: 'rgb(255, 214, 51)', // Lighter yellow
        bad: 'rgb(255, 99, 99)' // Lighter red
      }
    }
  };
  
  const currentColors = colors[theme];
  
  // Fetch metrics on mount and periodically
  useEffect(() => {
    const fetchMetrics = () => {
      const currentMetrics = perplexityRateLimiter.getMetrics();
      const currentLimits = perplexityRateLimiter.getLimits();
      setMetrics(currentMetrics);
      setLimits(currentLimits);
    };
    
    fetchMetrics();
    
    // Adjust polling rate based on network conditions
    const interval = setInterval(fetchMetrics, 
      connection.type === 'slow-2g' || connection.type === '2g' ? 30000 : // 30s for slow connections
      connection.type === '3g' ? 20000 : // 20s for 3G
      10000 // 10s for fast connections
    );
    
    return () => clearInterval(interval);
  }, [connection.type]);
  
  const handleReset = () => {
    perplexityRateLimiter.resetMetrics();
    setMetrics(perplexityRateLimiter.getMetrics());
    if (onReset) onReset();
  };
  
  // Calculate progress percentages with SCB colors
  const calculateProgress = (used: number, limit: number) => {
    const percentage = Math.min(100, Math.round((used / limit) * 100));
    const thresholdColor = 
      percentage > 90 ? currentColors.progress.danger :
      percentage > 75 ? currentColors.progress.warning :
      currentColors.progress.good;
    
    return { percentage, thresholdColor };
  };
  
  // Toggle expanded view (for compact mode)
  const toggleExpanded = () => {
    if (expandable) {
      setExpanded(!expanded);
    }
  };
  
  // Get network status color
  const getNetworkStatusColor = () => {
    if (connection.type === 'offline') {
      return currentColors.networkIndicator.bad;
    } else if (connection.saveData || connection.type === 'slow-2g' || connection.type === '2g') {
      return currentColors.networkIndicator.warning;
    } else {
      return currentColors.networkIndicator.good;
    }
  };
  
  // Network status icon
  const NetworkIcon = connection.type === 'offline' ? WifiOff : 
    (connection.type === 'slow-2g' || connection.type === '2g') ? AlertCircle : Wifi;
  
  // Loading skeleton
  if (!metrics || !limits) {
    return (
      <div 
        className={`rounded-lg p-4 ${className}`}
        style={{ 
          backgroundColor: currentColors.cardBackground,
          border: `1px solid ${currentColors.border}`,
          borderRadius: '8px'
        }}
      >
        <div className="animate-pulse flex items-center gap-2">
          <div 
            className="h-4 w-1/3 rounded"
            style={{ backgroundColor: currentColors.progressBackground }}
          ></div>
          <div 
            className="h-4 w-1/4 rounded ml-auto"
            style={{ backgroundColor: currentColors.progressBackground }}
          ></div>
        </div>
        <div className="animate-pulse mt-4 space-y-3">
          <div 
            className="h-4 w-full rounded"
            style={{ backgroundColor: currentColors.progressBackground }}
          ></div>
          <div 
            className="h-4 w-full rounded"
            style={{ backgroundColor: currentColors.progressBackground }}
          ></div>
          <div 
            className="h-4 w-full rounded"
            style={{ backgroundColor: currentColors.progressBackground }}
          ></div>
        </div>
      </div>
    );
  }
  
  // Format time until quota reset
  const getTimeUntilReset = () => {
    const resetTime = new Date(metrics.quotaResets).getTime();
    const now = Date.now();
    const diffMs = Math.max(0, resetTime - now);
    
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };
  
  // If compact mode is enabled and not expanded, show a simplified version
  if (compact && !expanded) {
    const { percentage: dayPercentage, thresholdColor: dayColor } = calculateProgress(
      metrics.requestsLast24h, 
      limits.maxRequestsPerDay
    );
    
    const { percentage: tokenPercentage, thresholdColor: tokenColor } = calculateProgress(
      metrics.tokensUsed24h, 
      limits.maxTokensPerDay
    );
    
    const isWarning = metrics.tokensUsed24h > limits.maxTokensPerDay * 0.8 || 
                      metrics.requestsLast24h > limits.maxRequestsPerDay * 0.8;
    
    return (
      <div 
        className={`rounded-lg ${className}`}
        style={{ 
          backgroundColor: currentColors.cardBackground,
          border: `1px solid ${currentColors.border}`,
          borderRadius: '8px'
        }}
      >
        <div 
          className="px-3 py-2 flex items-center justify-between rounded-t-lg"
          style={{ 
            backgroundColor: isWarning ? currentColors.warningBackground : currentColors.headerBackground,
            borderBottom: `1px solid ${isWarning ? currentColors.warningBorder : currentColors.border}`,
          }}
        >
          <div className="flex items-center gap-1">
            <Activity 
              className="w-4 h-4"
              style={{ color: isWarning ? currentColors.warningText : currentColors.primary }}
            />
            <span 
              className="text-xs font-medium"
              style={{ color: isWarning ? currentColors.warningText : currentColors.text }}
            >
              Perplexity API Usage
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <div 
              className="text-xs flex items-center gap-1"
              style={{ color: currentColors.textLight }}
            >
              <Clock className="w-3 h-3" />
              <span>Resets: {getTimeUntilReset()}</span>
            </div>
            
            {expandable && (
              <button 
                onClick={toggleExpanded}
                className="text-xs p-1 rounded"
                style={{ color: currentColors.primary }}
                aria-label="Expand details"
              >
                <Info size={14} />
              </button>
            )}
          </div>
        </div>
        
        <div className="p-3 space-y-2">
          <div className="flex items-center gap-2">
            <span 
              className="text-xs w-14"
              style={{ color: currentColors.textLight }}
            >
              Requests:
            </span>
            <div 
              className="h-2 flex-1 rounded-full overflow-hidden"
              style={{ backgroundColor: currentColors.progressBackground }}
            >
              <div 
                className="h-full"
                style={{ 
                  width: `${dayPercentage}%`,
                  backgroundColor: dayColor
                }}
              />
            </div>
            <span 
              className="text-xs font-medium"
              style={{ color: currentColors.text }}
            >
              {metrics.requestsLast24h}/{limits.maxRequestsPerDay}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <span 
              className="text-xs w-14"
              style={{ color: currentColors.textLight }}
            >
              Tokens:
            </span>
            <div 
              className="h-2 flex-1 rounded-full overflow-hidden"
              style={{ backgroundColor: currentColors.progressBackground }}
            >
              <div 
                className="h-full"
                style={{ 
                  width: `${tokenPercentage}%`,
                  backgroundColor: tokenColor
                }}
              />
            </div>
            <span 
              className="text-xs font-medium"
              style={{ color: currentColors.text }}
            >
              {(metrics.tokensUsed24h / 1000).toFixed(1)}k/{(limits.maxTokensPerDay / 1000).toFixed(0)}k
            </span>
          </div>
          
          {/* Network status indicator */}
          {showNetworkInfo && (
            <div 
              className="flex items-center justify-end gap-1 mt-1 text-2xs"
              style={{ color: currentColors.textMuted }}
            >
              <NetworkIcon 
                className="w-3 h-3" 
                style={{ color: getNetworkStatusColor() }} 
              />
              <span>
                {connection.type === 'offline' ? 'Offline' : 
                  connection.type === 'slow-2g' ? 'Very slow connection' :
                  connection.type === '2g' ? 'Slow connection' : ''}
                {connection.saveData ? ' (Data saver)' : ''}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }
  
  // Full expanded view
  return (
    <div 
      className={`rounded-lg ${className}`}
      style={{ 
        backgroundColor: currentColors.cardBackground,
        border: `1px solid ${currentColors.border}`,
        borderRadius: '8px'
      }}
    >
      <div 
        className="px-4 py-3 flex items-center justify-between border-b"
        style={{ 
          backgroundColor: currentColors.headerBackground,
          borderColor: currentColors.border
        }}
      >
        <h3 
          className="font-medium flex items-center gap-2 horizon-header"
          style={{ color: currentColors.text }}
        >
          <BarChart3 
            className="w-5 h-5"
            style={{ color: currentColors.accent }}
          />
          Perplexity API Usage
        </h3>
        
        {/* Tab switches */}
        <div className="flex text-sm">
          <button
            className="px-3 py-1 rounded-l transition-colors"
            style={{ 
              backgroundColor: activeTab === 'summary' ? currentColors.primary : 'transparent',
              color: activeTab === 'summary' ? 'white' : currentColors.textLight
            }}
            onClick={() => setActiveTab('summary')}
          >
            Summary
          </button>
          <button
            className="px-3 py-1 rounded-r transition-colors"
            style={{ 
              backgroundColor: activeTab === 'history' ? currentColors.primary : 'transparent',
              color: activeTab === 'history' ? 'white' : currentColors.textLight
            }}
            onClick={() => setActiveTab('history')}
          >
            History
          </button>
        </div>
      </div>
      
      {activeTab === 'summary' && (
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div 
              className="flex items-center gap-2"
              style={{ color: currentColors.textLight }}
            >
              <Clock className="w-4 h-4" />
              <span className="text-sm">Resets in {getTimeUntilReset()}</span>
            </div>
            
            {showResetButton && (
              <button
                onClick={handleReset}
                className="text-xs py-1 px-2 rounded flex items-center gap-1 transition-colors"
                style={{ 
                  backgroundColor: 'transparent',
                  color: currentColors.primary,
                  border: `1px solid ${currentColors.border}`,
                  ':hover': { backgroundColor: currentColors.buttonHover }
                }}
              >
                <RefreshCw size={12} />
                Reset Metrics
              </button>
            )}
          </div>
          
          <div className="space-y-4">
            {/* Requests per day */}
            <div>
              <div className="flex justify-between mb-1">
                <span 
                  className="text-sm font-medium"
                  style={{ color: currentColors.text }}
                >
                  Requests (24h)
                </span>
                <span 
                  className="text-sm"
                  style={{ color: currentColors.textLight }}
                >
                  {metrics.requestsLast24h}/{limits.maxRequestsPerDay}
                </span>
              </div>
              <div 
                className="h-3 w-full rounded-full overflow-hidden"
                style={{ backgroundColor: currentColors.progressBackground }}
              >
                <div 
                  style={{ 
                    width: `${calculateProgress(metrics.requestsLast24h, limits.maxRequestsPerDay).percentage}%`, 
                    height: '100%',
                    backgroundColor: calculateProgress(metrics.requestsLast24h, limits.maxRequestsPerDay).thresholdColor
                  }}
                />
              </div>
            </div>
            
            {/* Requests per hour */}
            <div>
              <div className="flex justify-between mb-1">
                <span 
                  className="text-sm font-medium"
                  style={{ color: currentColors.text }}
                >
                  Requests (Hour)
                </span>
                <span 
                  className="text-sm"
                  style={{ color: currentColors.textLight }}
                >
                  {metrics.requestsLastHour}/{limits.maxRequestsPerHour}
                </span>
              </div>
              <div 
                className="h-3 w-full rounded-full overflow-hidden"
                style={{ backgroundColor: currentColors.progressBackground }}
              >
                <div 
                  style={{ 
                    width: `${calculateProgress(metrics.requestsLastHour, limits.maxRequestsPerHour).percentage}%`, 
                    height: '100%',
                    backgroundColor: calculateProgress(metrics.requestsLastHour, limits.maxRequestsPerHour).thresholdColor
                  }}
                />
              </div>
            </div>
            
            {/* Requests per minute */}
            <div>
              <div className="flex justify-between mb-1">
                <span 
                  className="text-sm font-medium"
                  style={{ color: currentColors.text }}
                >
                  Requests (Minute)
                </span>
                <span 
                  className="text-sm"
                  style={{ color: currentColors.textLight }}
                >
                  {metrics.requestsLastMinute}/{limits.maxRequestsPerMinute}
                </span>
              </div>
              <div 
                className="h-3 w-full rounded-full overflow-hidden"
                style={{ backgroundColor: currentColors.progressBackground }}
              >
                <div 
                  style={{ 
                    width: `${calculateProgress(metrics.requestsLastMinute, limits.maxRequestsPerMinute).percentage}%`, 
                    height: '100%',
                    backgroundColor: calculateProgress(metrics.requestsLastMinute, limits.maxRequestsPerMinute).thresholdColor
                  }}
                />
              </div>
            </div>
            
            {/* Token usage */}
            <div>
              <div className="flex justify-between mb-1">
                <span 
                  className="text-sm font-medium"
                  style={{ color: currentColors.text }}
                >
                  Token Usage (24h)
                </span>
                <span 
                  className="text-sm"
                  style={{ color: currentColors.textLight }}
                >
                  {metrics.tokensUsed24h.toLocaleString()}/{limits.maxTokensPerDay.toLocaleString()}
                </span>
              </div>
              <div 
                className="h-3 w-full rounded-full overflow-hidden"
                style={{ backgroundColor: currentColors.progressBackground }}
              >
                <div 
                  style={{ 
                    width: `${calculateProgress(metrics.tokensUsed24h, limits.maxTokensPerDay).percentage}%`, 
                    height: '100%',
                    backgroundColor: calculateProgress(metrics.tokensUsed24h, limits.maxTokensPerDay).thresholdColor
                  }}
                />
              </div>
            </div>
          </div>
          
          {/* Network status indicator */}
          {showNetworkInfo && (
            <div 
              className="mt-4 p-2 rounded-md flex items-center gap-2"
              style={{ 
                backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                color: currentColors.textLight
              }}
            >
              <NetworkIcon 
                className="w-4 h-4" 
                style={{ color: getNetworkStatusColor() }} 
              />
              <div className="text-sm">
                <span>
                  Network: {
                    connection.type === 'offline' ? 'Offline' : 
                    connection.type === 'slow-2g' ? 'Very slow' :
                    connection.type === '2g' ? 'Slow' :
                    connection.type === '3g' ? 'Medium' :
                    connection.type === '4g' ? 'Good' :
                    connection.type === 'wifi' ? 'Fast' : 'Unknown'
                  }
                </span>
                {connection.saveData && (
                  <span className="ml-1">(Data saver mode)</span>
                )}
                {connection.downlink > 0 && (
                  <span className="ml-1">({Math.round(connection.downlink * 10) / 10} Mbps)</span>
                )}
              </div>
            </div>
          )}
          
          {/* Warnings */}
          {metrics.tokensUsed24h > limits.maxTokensPerDay * 0.8 && (
            <div 
              className="mt-4 p-3 rounded-md flex items-start gap-2"
              style={{ 
                backgroundColor: currentColors.warningBackground,
                borderLeft: `3px solid ${currentColors.warningBorder}`
              }}
            >
              <AlertCircle 
                className="w-5 h-5 flex-shrink-0 mt-0.5"
                style={{ color: currentColors.warningText }}
              />
              <div>
                <p 
                  className="text-sm"
                  style={{ color: currentColors.warningText }}
                >
                  You've used over 80% of your daily token quota.
                </p>
                <p 
                  className="text-xs mt-1"
                  style={{ color: currentColors.warningText }}
                >
                  Non-critical API requests will be throttled to prevent quota exhaustion.
                </p>
              </div>
            </div>
          )}
          
          {/* Compact mode toggle */}
          {expandable && compact && (
            <button 
              onClick={toggleExpanded}
              className="mt-4 text-xs w-full py-1.5 rounded transition-colors"
              style={{ 
                color: currentColors.textLight,
                border: `1px solid ${currentColors.border}`,
                ':hover': { backgroundColor: currentColors.buttonHover }
              }}
            >
              Compact View
            </button>
          )}
        </div>
      )}
      
      {activeTab === 'history' && (
        <div className="p-4">
          <h4 
            className="text-sm font-medium mb-3 horizon-header"
            style={{ color: currentColors.text }}
          >
            Recent API Calls
          </h4>
          
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {metrics.history.length === 0 ? (
              <p 
                className="text-sm italic"
                style={{ color: currentColors.textLight }}
              >
                No API calls recorded yet
              </p>
            ) : (
              metrics.history
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                .slice(0, 10)
                .map((record, index) => {
                  const recordTime = new Date(record.timestamp);
                  const timeString = recordTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  
                  return (
                    <div 
                      key={index}
                      className="text-xs px-3 py-2 rounded-md"
                      style={{ 
                        backgroundColor: record.success 
                          ? (theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)')
                          : currentColors.errorBackground,
                        borderLeft: record.success ? 'none' : `2px solid ${currentColors.errorBorder}`
                      }}
                    >
                      <div className="flex justify-between">
                        <span 
                          className="font-medium"
                          style={{ color: currentColors.text }}
                        >
                          {record.endpoint}
                        </span>
                        <span style={{ color: currentColors.textLight }}>{timeString}</span>
                      </div>
                      <div className="flex justify-between mt-1">
                        <span 
                          className="flex items-center gap-1"
                          style={{ color: currentColors.textLight }}
                        >
                          <Zap className="w-3 h-3" />
                          {record.model} ({record.tokens} tokens)
                        </span>
                        <span 
                          className="flex items-center gap-1"
                          style={{ 
                            color: record.success ? currentColors.successText : currentColors.errorText
                          }}
                        >
                          {record.success ? (
                            <>
                              <CheckCircle className="w-3 h-3" />
                              {record.latencyMs}ms
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3" />
                              Failed
                            </>
                          )}
                        </span>
                      </div>
                    </div>
                  );
                })
            )}
          </div>
          
          {metrics.history.length > 0 && showResetButton && (
            <button
              onClick={handleReset}
              className="mt-4 w-full text-sm py-1.5 rounded flex items-center justify-center gap-1 transition-colors"
              style={{ 
                backgroundColor: 'transparent',
                color: currentColors.primary,
                border: `1px solid ${currentColors.border}`,
                ':hover': { backgroundColor: currentColors.buttonHover }
              }}
            >
              <RefreshCw size={14} />
              Clear History
            </button>
          )}
          
          {/* Compact mode toggle */}
          {expandable && compact && (
            <button 
              onClick={toggleExpanded}
              className="mt-4 text-xs w-full py-1.5 rounded transition-colors"
              style={{ 
                color: currentColors.textLight,
                border: `1px solid ${currentColors.border}`,
                ':hover': { backgroundColor: currentColors.buttonHover }
              }}
            >
              Compact View
            </button>
          )}
        </div>
      )}
    </div>
  );
}