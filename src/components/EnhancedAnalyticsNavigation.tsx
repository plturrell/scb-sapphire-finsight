import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useIOSCompatibility } from '@/hooks/useIOSCompatibility';
import { useSFSymbolsSupport } from '@/hooks/useSFSymbolsSupport';
import { useMicroInteractions } from '@/hooks/useMicroInteractions';
import { BarChart3, DollarSign, Users, TrendingUp, PieChart, AlertTriangle, Settings } from 'lucide-react';

interface AnalyticsCategory {
  id: string;
  label: string;
  sublabel?: string;
  icon: string;
  badge?: string;
  count?: number;
}

interface EnhancedAnalyticsNavigationProps {
  categories: AnalyticsCategory[];
  activeCategory: string;
  onCategoryChange: (categoryId: string) => void;
  variant?: 'tabs' | 'cards' | 'list' | 'segments' | 'grid' | 'pill';
  className?: string;
  timeFilter?: string;
}

const EnhancedAnalyticsNavigation: React.FC<EnhancedAnalyticsNavigationProps> = ({
  categories,
  activeCategory,
  onCategoryChange,
  variant = 'cards',
  className = '',
  timeFilter
}) => {
  const isIOS = useIOSCompatibility();
  const supportsSFSymbols = useSFSymbolsSupport();
  const { haptic, microScale } = useMicroInteractions();
  const [pressedCategory, setPressedCategory] = useState<string | null>(null);

  // SF Symbols mapping for analytics categories
  const getCategoryIcon = useCallback((categoryId: string): string => {
    if (!supportsSFSymbols) return categoryId;
    
    const iconMap: Record<string, string> = {
      // Analytics views
      'overview': 'chart.bar.doc.horizontal',
      'revenue': 'dollarsign.circle.fill',
      'accounts': 'person.2.fill',
      'performance': 'chart.line.uptrend.xyaxis.fill',
      'sectors': 'rectangle.3.group.fill',
      'risk': 'exclamationmark.triangle.fill',
      'custom': 'slider.horizontal.3',
      
      // Detailed analytics
      'trends': 'chart.line.uptrend.xyaxis',
      'comparison': 'rectangle.2.swap',
      'forecasting': 'crystal.ball.fill',
      'insights': 'lightbulb.fill',
      'reports': 'doc.text.fill',
      'metrics': 'gauge.badge.plus',
      
      // Financial metrics
      'profitability': 'chart.pie.fill',
      'growth': 'arrow.up.right.circle.fill',
      'efficiency': 'speedometer',
      'liquidity': 'drop.fill',
      'volatility': 'waveform.path.ecg',
      
      // Time-based analysis
      'daily': 'calendar.badge.clock',
      'weekly': 'calendar',
      'monthly': 'calendar.circle.fill',
      'quarterly': 'calendar.badge.plus',
      'yearly': 'calendar.badge.exclamationmark'
    };
    
    return iconMap[categoryId] || 'chart.bar.fill';
  }, [supportsSFSymbols]);

  // Fallback icon mapping for non-SF Symbols platforms
  const getFallbackIcon = useCallback((categoryId: string) => {
    const iconMap: Record<string, React.ComponentType> = {
      'overview': BarChart3,
      'revenue': DollarSign,
      'accounts': Users,
      'performance': TrendingUp,
      'sectors': PieChart,
      'risk': AlertTriangle,
      'custom': Settings,
      'trends': TrendingUp,
      'comparison': BarChart3,
      'forecasting': TrendingUp,
      'insights': BarChart3,
      'reports': BarChart3,
      'metrics': BarChart3,
      'profitability': PieChart,
      'growth': TrendingUp,
      'efficiency': BarChart3,
      'liquidity': DollarSign,
      'volatility': TrendingUp
    };
    
    return iconMap[categoryId] || BarChart3;
  }, []);

  const handleCategoryPress = useCallback((categoryId: string) => {
    if (isIOS) {
      haptic({ intensity: 'light' });
    }
    setPressedCategory(categoryId);
    microScale();
    onCategoryChange(categoryId);
    
    setTimeout(() => setPressedCategory(null), 150);
  }, [isIOS, haptic, microScale, onCategoryChange]);

  const renderIcon = (category: AnalyticsCategory, size: number = 20) => {
    if (supportsSFSymbols) {
      return (
        <img 
          src={`sf-symbols:${getCategoryIcon(category.id)}`}
          alt={category.label}
          width={size}
          height={size}
          style={{
            filter: activeCategory === category.id 
              ? 'none' 
              : 'opacity(0.6)'
          }}
        />
      );
    } else {
      const IconComponent = getFallbackIcon(category.id);
      return (
        <IconComponent 
          size={size}
          className={activeCategory === category.id 
            ? 'text-[rgb(var(--scb-honolulu-blue))]' 
            : 'text-gray-500'
          }
        />
      );
    }
  };

  const getBadgeColor = (badge: string) => {
    if (badge.startsWith('+')) return 'bg-green-500';
    if (badge.startsWith('-')) return 'bg-red-500';
    if (badge.includes('%')) return 'bg-blue-500';
    return 'bg-gray-500';
  };

  // Common motion variants
  const itemVariants = {
    initial: { scale: 1, y: 0 },
    hover: { scale: 1.02, y: -1 },
    tap: { scale: 0.98, y: 0 }
  };

  if (variant === 'cards') {
    return (
      <div className={`grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3 ${className}`}>
        {categories.map((category) => (
          <motion.button
            key={category.id}
            variants={itemVariants}
            initial="initial"
            whileHover="hover"
            whileTap="tap"
            onClick={() => handleCategoryPress(category.id)}
            className={`
              relative p-3 rounded-xl border transition-all duration-200 min-h-[80px]
              ${activeCategory === category.id
                ? isIOS 
                  ? 'bg-[rgb(var(--scb-honolulu-blue))]/10 border-[rgb(var(--scb-honolulu-blue))]/30 shadow-lg'
                  : 'bg-blue-50 border-blue-200 shadow-md'
                : isIOS
                  ? 'bg-white/80 border-gray-200/50 backdrop-blur-xl'
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }
            `}
            style={{
              transform: pressedCategory === category.id ? 'scale(0.95)' : 'scale(1)',
            }}
          >
            <div className="flex flex-col items-center text-center space-y-2 h-full justify-center">
              <div className="relative">
                {renderIcon(category, 24)}
                {category.badge && (
                  <span className={`absolute -top-1 -right-1 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium ${getBadgeColor(category.badge)}`}>
                    {category.badge.length > 3 ? category.badge.substring(0, 2) + '..' : category.badge}
                  </span>
                )}
                {category.count && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                    {category.count > 99 ? '99+' : category.count}
                  </span>
                )}
              </div>
              <div className="flex-1 flex flex-col justify-center">
                <p className={`font-medium text-xs leading-tight ${
                  activeCategory === category.id 
                    ? 'text-[rgb(var(--scb-honolulu-blue))]' 
                    : 'text-gray-900'
                }`}>
                  {category.label}
                </p>
                {category.sublabel && (
                  <p className="text-xs text-gray-500 mt-1 leading-tight">{category.sublabel}</p>
                )}
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    );
  }

  if (variant === 'grid') {
    return (
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}>
        {categories.map((category) => (
          <motion.button
            key={category.id}
            variants={itemVariants}
            initial="initial"
            whileHover="hover"
            whileTap="tap"
            onClick={() => handleCategoryPress(category.id)}
            className={`
              relative p-4 rounded-xl border text-left transition-all duration-200
              ${activeCategory === category.id
                ? isIOS 
                  ? 'bg-[rgb(var(--scb-honolulu-blue))]/5 border-[rgb(var(--scb-honolulu-blue))]/20'
                  : 'bg-blue-50 border-blue-200'
                : isIOS
                  ? 'bg-white/70 border-gray-200/30 backdrop-blur-sm'
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }
            `}
          >
            <div className="flex items-start space-x-3">
              <div className="relative flex-shrink-0">
                {renderIcon(category, 28)}
                {category.badge && (
                  <span className={`absolute -top-1 -right-1 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium ${getBadgeColor(category.badge)}`}>
                    {category.badge.length > 4 ? category.badge.substring(0, 3) + '..' : category.badge}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className={`font-semibold text-sm ${
                  activeCategory === category.id 
                    ? 'text-[rgb(var(--scb-honolulu-blue))]' 
                    : 'text-gray-900'
                }`}>
                  {category.label}
                </h3>
                {category.sublabel && (
                  <p className="text-xs text-gray-600 mt-1">{category.sublabel}</p>
                )}
                {timeFilter && (
                  <p className="text-xs text-gray-500 mt-1">{timeFilter}</p>
                )}
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    );
  }

  if (variant === 'list') {
    return (
      <div className={`space-y-2 ${className}`}>
        {categories.map((category) => (
          <motion.button
            key={category.id}
            variants={itemVariants}
            initial="initial"
            whileHover="hover"
            whileTap="tap"
            onClick={() => handleCategoryPress(category.id)}
            className={`
              w-full flex items-center justify-between p-3 rounded-xl transition-all duration-200
              ${activeCategory === category.id
                ? isIOS 
                  ? 'bg-[rgb(var(--scb-honolulu-blue))]/8 text-[rgb(var(--scb-honolulu-blue))]'
                  : 'bg-blue-50 text-blue-700'
                : isIOS
                  ? 'bg-white/60 text-gray-900 backdrop-blur-sm hover:bg-white/80'
                  : 'bg-white text-gray-900 hover:bg-gray-50'
              }
            `}
          >
            <div className="flex items-center space-x-3">
              <div className="relative">
                {renderIcon(category, 20)}
                {category.badge && (
                  <span className={`absolute -top-1 -right-1 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-medium ${getBadgeColor(category.badge)}`}>
                    {category.badge.length > 3 ? category.badge.substring(0, 2) : category.badge}
                  </span>
                )}
              </div>
              <div className="text-left">
                <p className="font-medium text-sm">{category.label}</p>
                {category.sublabel && (
                  <p className={`text-xs ${
                    activeCategory === category.id ? 'text-[rgb(var(--scb-honolulu-blue))]/70' : 'text-gray-500'
                  }`}>
                    {category.sublabel}
                  </p>
                )}
              </div>
            </div>
            {isIOS && (
              <svg width="8" height="14" viewBox="0 0 8 14" className="text-gray-400">
                <path
                  d="M1 1l6 6-6 6"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </motion.button>
        ))}
      </div>
    );
  }

  if (variant === 'segments') {
    return (
      <div className={`${isIOS ? 'bg-gray-100/80 backdrop-blur-sm' : 'bg-gray-100'} p-1 rounded-xl ${className}`}>
        <div className="flex relative overflow-x-auto">
          <AnimatePresence>
            {activeCategory && (
              <motion.div
                layoutId="activeAnalyticsSegment"
                className={`absolute inset-y-1 ${isIOS ? 'bg-white/90 backdrop-blur-sm' : 'bg-white'} rounded-lg shadow-sm`}
                style={{
                  left: `${(categories.findIndex(c => c.id === activeCategory) / categories.length) * 100}%`,
                  width: `${100 / categories.length}%`,
                }}
                transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              />
            )}
          </AnimatePresence>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => handleCategoryPress(category.id)}
              className={`
                relative flex-1 flex items-center justify-center space-x-2 py-2 px-3 text-xs font-medium transition-colors duration-200 min-w-0
                ${activeCategory === category.id
                  ? 'text-[rgb(var(--scb-honolulu-blue))]'
                  : 'text-gray-600 hover:text-gray-900'
                }
              `}
            >
              <div className="relative flex-shrink-0">
                {renderIcon(category, 16)}
                {category.badge && (
                  <span className={`absolute -top-1 -right-1 text-white text-xs rounded-full h-3 w-3 flex items-center justify-center font-medium ${getBadgeColor(category.badge)}`}>
                    {category.badge.length > 1 ? category.badge[0] : category.badge}
                  </span>
                )}
              </div>
              <span className="hidden sm:inline truncate">{category.label}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Default: tabs variant
  return (
    <div className={`border-b border-gray-200 ${className}`}>
      <nav className="-mb-px flex space-x-6 overflow-x-auto">
        {categories.map((category) => (
          <motion.button
            key={category.id}
            variants={itemVariants}
            initial="initial"
            whileHover="hover"
            whileTap="tap"
            onClick={() => handleCategoryPress(category.id)}
            className={`
              relative flex items-center space-x-2 py-3 px-1 text-sm font-medium transition-colors duration-200 whitespace-nowrap
              ${activeCategory === category.id
                ? 'text-[rgb(var(--scb-honolulu-blue))] border-b-2 border-[rgb(var(--scb-honolulu-blue))]'
                : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent'
              }
            `}
          >
            <div className="relative">
              {renderIcon(category, 18)}
              {category.badge && (
                <span className={`absolute -top-1 -right-1 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-medium ${getBadgeColor(category.badge)}`}>
                  {category.badge.length > 3 ? category.badge.substring(0, 2) : category.badge}
                </span>
              )}
            </div>
            <span>{category.label}</span>
          </motion.button>
        ))}
      </nav>
    </div>
  );
};

export default EnhancedAnalyticsNavigation;