import React, { useState, useEffect } from 'react';
import perplexityRateLimiter, { UsageMetrics } from '@/services/PerplexityRateLimiter';
import { Activity, AlertCircle, BarChart3, Clock } from 'lucide-react';

interface PerplexityUsageStatsProps {
  className?: string;
  compact?: boolean;
  onReset?: () => void;
}

export default function PerplexityUsageStats({ 
  className = '', 
  compact = false,
  onReset
}: PerplexityUsageStatsProps) {
  const [metrics, setMetrics] = useState<UsageMetrics | null>(null);
  const [limits, setLimits] = useState<{
    maxRequestsPerMinute: number;
    maxRequestsPerHour: number;
    maxRequestsPerDay: number;
    maxTokensPerDay: number;
  } | null>(null);
  const [activeTab, setActiveTab] = useState<'summary' | 'history'>('summary');
  
  // Fetch metrics on mount and periodically
  useEffect(() => {
    const fetchMetrics = () => {
      const currentMetrics = perplexityRateLimiter.getMetrics();
      const currentLimits = perplexityRateLimiter.getLimits();
      setMetrics(currentMetrics);
      setLimits(currentLimits);
    };
    
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 10000); // Refresh every 10 seconds
    
    return () => clearInterval(interval);
  }, []);
  
  const handleReset = () => {
    perplexityRateLimiter.resetMetrics();
    setMetrics(perplexityRateLimiter.getMetrics());
    if (onReset) onReset();
  };
  
  // Calculate progress percentages
  const calculateProgress = (used: number, limit: number) => {
    const percentage = Math.min(100, Math.round((used / limit) * 100));
    const thresholdClass = 
      percentage > 90 ? 'bg-red-500' :
      percentage > 75 ? 'bg-yellow-500' :
      percentage > 50 ? 'bg-blue-500' :
      'bg-green-500';
    
    return { percentage, thresholdClass };
  };
  
  if (!metrics || !limits) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
        <div className="animate-pulse flex items-center gap-2">
          <div className="h-4 w-1/3 bg-gray-200 rounded"></div>
          <div className="h-4 w-1/4 bg-gray-200 rounded ml-auto"></div>
        </div>
        <div className="animate-pulse mt-4 space-y-3">
          <div className="h-4 w-full bg-gray-200 rounded"></div>
          <div className="h-4 w-full bg-gray-200 rounded"></div>
          <div className="h-4 w-full bg-gray-200 rounded"></div>
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
  
  // If compact mode is enabled, show a simplified version
  if (compact) {
    const { percentage: dayPercentage, thresholdClass: dayClass } = calculateProgress(
      metrics.requestsLast24h, 
      limits.maxRequestsPerDay
    );
    
    const { percentage: tokenPercentage, thresholdClass: tokenClass } = calculateProgress(
      metrics.tokensUsed24h, 
      limits.maxTokensPerDay
    );
    
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-3 ${className}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1">
            <Activity className="w-4 h-4 text-gray-500" />
            <span className="text-xs font-medium text-gray-700">Perplexity API Usage</span>
          </div>
          <div className="text-xs text-gray-500 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>Resets in {getTimeUntilReset()}</span>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600 w-14">Requests:</span>
            <div className="h-2 flex-1 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={`h-full ${dayClass}`} 
                style={{ width: `${dayPercentage}%` }}
              />
            </div>
            <span className="text-xs font-medium">{metrics.requestsLast24h}/{limits.maxRequestsPerDay}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600 w-14">Tokens:</span>
            <div className="h-2 flex-1 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={`h-full ${tokenClass}`} 
                style={{ width: `${tokenPercentage}%` }}
              />
            </div>
            <span className="text-xs font-medium">{metrics.tokensUsed24h}/{limits.maxTokensPerDay}</span>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      <div className="border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <h3 className="font-medium text-gray-900 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-purple-500" />
          Perplexity API Usage
        </h3>
        
        {/* Tab switches */}
        <div className="flex text-sm">
          <button
            className={`px-3 py-1 ${activeTab === 'summary' ? 'bg-gray-100 text-gray-800 font-medium rounded-l' : 'text-gray-500'}`}
            onClick={() => setActiveTab('summary')}
          >
            Summary
          </button>
          <button
            className={`px-3 py-1 ${activeTab === 'history' ? 'bg-gray-100 text-gray-800 font-medium rounded-r' : 'text-gray-500'}`}
            onClick={() => setActiveTab('history')}
          >
            History
          </button>
        </div>
      </div>
      
      {activeTab === 'summary' && (
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">Resets in {getTimeUntilReset()}</span>
            </div>
            
            <button
              onClick={handleReset}
              className="text-xs bg-gray-50 hover:bg-gray-100 text-gray-600 py-1 px-2 rounded border border-gray-200"
            >
              Reset Metrics
            </button>
          </div>
          
          <div className="space-y-4">
            {/* Requests per day */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">Requests (24h)</span>
                <span className="text-sm text-gray-600">{metrics.requestsLast24h}/{limits.maxRequestsPerDay}</span>
              </div>
              <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={calculateProgress(metrics.requestsLast24h, limits.maxRequestsPerDay).thresholdClass} 
                  style={{ width: `${calculateProgress(metrics.requestsLast24h, limits.maxRequestsPerDay).percentage}%`, height: '100%' }}
                />
              </div>
            </div>
            
            {/* Requests per hour */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">Requests (Hour)</span>
                <span className="text-sm text-gray-600">{metrics.requestsLastHour}/{limits.maxRequestsPerHour}</span>
              </div>
              <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={calculateProgress(metrics.requestsLastHour, limits.maxRequestsPerHour).thresholdClass} 
                  style={{ width: `${calculateProgress(metrics.requestsLastHour, limits.maxRequestsPerHour).percentage}%`, height: '100%' }}
                />
              </div>
            </div>
            
            {/* Requests per minute */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">Requests (Minute)</span>
                <span className="text-sm text-gray-600">{metrics.requestsLastMinute}/{limits.maxRequestsPerMinute}</span>
              </div>
              <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={calculateProgress(metrics.requestsLastMinute, limits.maxRequestsPerMinute).thresholdClass} 
                  style={{ width: `${calculateProgress(metrics.requestsLastMinute, limits.maxRequestsPerMinute).percentage}%`, height: '100%' }}
                />
              </div>
            </div>
            
            {/* Token usage */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">Token Usage (24h)</span>
                <span className="text-sm text-gray-600">{metrics.tokensUsed24h.toLocaleString()}/{limits.maxTokensPerDay.toLocaleString()}</span>
              </div>
              <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={calculateProgress(metrics.tokensUsed24h, limits.maxTokensPerDay).thresholdClass} 
                  style={{ width: `${calculateProgress(metrics.tokensUsed24h, limits.maxTokensPerDay).percentage}%`, height: '100%' }}
                />
              </div>
            </div>
          </div>
          
          {/* Warnings */}
          {metrics.tokensUsed24h > limits.maxTokensPerDay * 0.8 && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-yellow-800">You've used over 80% of your daily token quota.</p>
                <p className="text-xs text-yellow-700 mt-1">Non-critical API requests will be throttled to prevent quota exhaustion.</p>
              </div>
            </div>
          )}
        </div>
      )}
      
      {activeTab === 'history' && (
        <div className="p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Recent API Calls</h4>
          
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {metrics.history.length === 0 ? (
              <p className="text-sm text-gray-500 italic">No API calls recorded yet</p>
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
                      className={`text-xs px-3 py-2 rounded-md ${record.success ? 'bg-gray-50' : 'bg-red-50 border-l-2 border-red-400'}`}
                    >
                      <div className="flex justify-between">
                        <span className="font-medium">{record.endpoint}</span>
                        <span className="text-gray-500">{timeString}</span>
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-gray-600">{record.model} ({record.tokens} tokens)</span>
                        <span className={`${record.success ? 'text-green-500' : 'text-red-500'}`}>
                          {record.success ? `${record.latencyMs}ms` : 'Failed'}
                        </span>
                      </div>
                    </div>
                  );
                })
            )}
          </div>
          
          {metrics.history.length > 0 && (
            <button
              onClick={handleReset}
              className="mt-4 w-full text-sm bg-gray-50 hover:bg-gray-100 text-gray-700 py-1.5 rounded border border-gray-200"
            >
              Clear History
            </button>
          )}
        </div>
      )}
    </div>
  );
}