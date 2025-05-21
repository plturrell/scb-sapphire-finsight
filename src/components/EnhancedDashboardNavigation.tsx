import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useIOSCompatibility } from '@/hooks/useIOSCompatibility';
import { useSFSymbolsSupport } from '@/hooks/useSFSymbolsSupport';
import { useMicroInteractions } from '@/hooks/useMicroInteractions';
import { Home, BarChart3, Sparkles, Settings, User, Building2, TrendingUp, Shield, PieChart, Activity } from 'lucide-react';

interface DashboardSection {
  id: string;
  label: string;
  sublabel?: string;
  icon: string;
  badge?: string;
  role?: 'executive' | 'analyst' | 'operations' | 'all';
}

interface EnhancedDashboardNavigationProps {
  sections: DashboardSection[];
  activeSection: string;
  onSectionChange: (sectionId: string) => void;
  variant?: 'tabs' | 'cards' | 'list' | 'segments' | 'grid' | 'pill';
  className?: string;
  userRole?: 'executive' | 'analyst' | 'operations';
}

const EnhancedDashboardNavigation: React.FC<EnhancedDashboardNavigationProps> = ({
  sections,
  activeSection,
  onSectionChange,
  variant = 'tabs',
  className = '',
  userRole = 'analyst'
}) => {
  const isIOS = useIOSCompatibility();
  const supportsSFSymbols = useSFSymbolsSupport();
  const { haptic, microScale } = useMicroInteractions();
  const [pressedSection, setPressedSection] = useState<string | null>(null);

  // Filter sections based on user role
  const filteredSections = sections.filter(section => 
    !section.role || section.role === 'all' || section.role === userRole
  );

  // SF Symbols mapping for dashboard sections
  const getSectionIcon = useCallback((sectionId: string): string => {
    if (!supportsSFSymbols) return sectionId;
    
    const iconMap: Record<string, string> = {
      // Dashboard views
      'overview': 'gauge.badge.plus',
      'analytics': 'chart.bar.xaxis.ascending',
      'portfolio': 'briefcase.fill',
      'risk': 'shield.lefthalf.filled.badge.checkmark',
      'performance': 'chart.line.uptrend.xyaxis',
      'allocation': 'chart.pie.fill',
      'simulation': 'waveform.path.ecg',
      'reports': 'doc.text.fill',
      
      // Role-based views
      'executive': 'crown.fill',
      'analyst': 'chart.bar.doc.horizontal.fill',
      'operations': 'gear.badge.checkmark',
      
      // Quick actions
      'settings': 'gearshape.fill',
      'help': 'questionmark.circle.fill',
      'notifications': 'bell.badge.fill',
      'profile': 'person.crop.circle.fill',
      
      // Data sections
      'assets': 'building.columns.fill',
      'trading': 'chart.line.flattrend.xyaxis',
      'market': 'globe.americas.fill'
    };
    
    return iconMap[sectionId] || 'square.grid.2x2';
  }, [supportsSFSymbols]);

  // Fallback icon mapping for non-SF Symbols platforms
  const getFallbackIcon = useCallback((sectionId: string) => {
    const iconMap: Record<string, React.ComponentType> = {
      'overview': Home,
      'analytics': BarChart3,
      'portfolio': Building2,
      'risk': Shield,
      'performance': TrendingUp,
      'allocation': PieChart,
      'simulation': Activity,
      'executive': User,
      'analyst': BarChart3,
      'operations': Settings,
      'settings': Settings,
      'help': Sparkles
    };
    
    return iconMap[sectionId] || Home;
  }, []);

  const handleSectionPress = useCallback((sectionId: string) => {
    if (isIOS) {
      haptic({ intensity: 'light' });
    }
    setPressedSection(sectionId);
    microScale();
    onSectionChange(sectionId);
    
    setTimeout(() => setPressedSection(null), 150);
  }, [isIOS, haptic, microScale, onSectionChange]);

  const renderIcon = (section: DashboardSection, size: number = 20) => {
    if (supportsSFSymbols) {
      return (
        <img 
          src={`sf-symbols:${getSectionIcon(section.id)}`}
          alt={section.label}
          width={size}
          height={size}
          style={{
            filter: activeSection === section.id 
              ? 'none' 
              : 'opacity(0.6)'
          }}
        />
      );
    } else {
      const IconComponent = getFallbackIcon(section.id);
      return (
        <IconComponent 
          size={size}
          className={activeSection === section.id 
            ? 'text-[rgb(var(--scb-honolulu-blue))]' 
            : 'text-gray-500'
          }
        />
      );
    }
  };

  // Common motion variants
  const itemVariants = {
    initial: { scale: 1, y: 0 },
    hover: { scale: 1.02, y: -1 },
    tap: { scale: 0.98, y: 0 }
  };

  if (variant === 'cards') {
    return (
      <div className={`grid grid-cols-2 lg:grid-cols-4 gap-3 ${className}`}>
        {filteredSections.map((section) => (
          <motion.button
            key={section.id}
            variants={itemVariants}
            initial="initial"
            whileHover="hover"
            whileTap="tap"
            onClick={() => handleSectionPress(section.id)}
            className={`
              relative p-4 rounded-2xl border transition-all duration-200
              ${activeSection === section.id
                ? isIOS 
                  ? 'bg-[rgb(var(--scb-honolulu-blue))]/10 border-[rgb(var(--scb-honolulu-blue))]/30 shadow-lg'
                  : 'bg-blue-50 border-blue-200 shadow-md'
                : isIOS
                  ? 'bg-white/80 border-gray-200/50 backdrop-blur-xl'
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }
            `}
            style={{
              transform: pressedSection === section.id ? 'scale(0.95)' : 'scale(1)',
            }}
          >
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="relative">
                {renderIcon(section, 24)}
                {section.badge && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                    {section.badge}
                  </span>
                )}
              </div>
              <div>
                <p className={`font-medium text-sm ${
                  activeSection === section.id 
                    ? 'text-[rgb(var(--scb-honolulu-blue))]' 
                    : 'text-gray-900'
                }`}>
                  {section.label}
                </p>
                {section.sublabel && (
                  <p className="text-xs text-gray-500 mt-1">{section.sublabel}</p>
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
        {filteredSections.map((section) => (
          <motion.button
            key={section.id}
            variants={itemVariants}
            initial="initial"
            whileHover="hover"
            whileTap="tap"
            onClick={() => handleSectionPress(section.id)}
            className={`
              relative p-6 rounded-xl border text-left transition-all duration-200
              ${activeSection === section.id
                ? isIOS 
                  ? 'bg-[rgb(var(--scb-honolulu-blue))]/5 border-[rgb(var(--scb-honolulu-blue))]/20'
                  : 'bg-blue-50 border-blue-200'
                : isIOS
                  ? 'bg-white/70 border-gray-200/30 backdrop-blur-sm'
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }
            `}
          >
            <div className="flex items-start space-x-4">
              <div className="relative flex-shrink-0">
                {renderIcon(section, 28)}
                {section.badge && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                    {section.badge}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className={`font-semibold text-base ${
                  activeSection === section.id 
                    ? 'text-[rgb(var(--scb-honolulu-blue))]' 
                    : 'text-gray-900'
                }`}>
                  {section.label}
                </h3>
                {section.sublabel && (
                  <p className="text-sm text-gray-600 mt-1">{section.sublabel}</p>
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
        {filteredSections.map((section) => (
          <motion.button
            key={section.id}
            variants={itemVariants}
            initial="initial"
            whileHover="hover"
            whileTap="tap"
            onClick={() => handleSectionPress(section.id)}
            className={`
              w-full flex items-center justify-between p-4 rounded-xl transition-all duration-200
              ${activeSection === section.id
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
                {renderIcon(section, 22)}
                {section.badge && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-medium">
                    {section.badge}
                  </span>
                )}
              </div>
              <div className="text-left">
                <p className="font-medium">{section.label}</p>
                {section.sublabel && (
                  <p className={`text-sm ${
                    activeSection === section.id ? 'text-[rgb(var(--scb-honolulu-blue))]/70' : 'text-gray-500'
                  }`}>
                    {section.sublabel}
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
        <div className="flex relative">
          <AnimatePresence>
            {activeSection && (
              <motion.div
                layoutId="activeSegment"
                className={`absolute inset-y-1 ${isIOS ? 'bg-white/90 backdrop-blur-sm' : 'bg-white'} rounded-lg shadow-sm`}
                style={{
                  left: `${(filteredSections.findIndex(s => s.id === activeSection) / filteredSections.length) * 100}%`,
                  width: `${100 / filteredSections.length}%`,
                }}
                transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              />
            )}
          </AnimatePresence>
          {filteredSections.map((section) => (
            <button
              key={section.id}
              onClick={() => handleSectionPress(section.id)}
              className={`
                relative flex-1 flex items-center justify-center space-x-2 py-3 px-4 text-sm font-medium transition-colors duration-200
                ${activeSection === section.id
                  ? 'text-[rgb(var(--scb-honolulu-blue))]'
                  : 'text-gray-600 hover:text-gray-900'
                }
              `}
            >
              <div className="relative">
                {renderIcon(section, 18)}
                {section.badge && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-medium">
                    {section.badge}
                  </span>
                )}
              </div>
              <span className="hidden sm:inline">{section.label}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Default: tabs variant
  return (
    <div className={`border-b border-gray-200 ${className}`}>
      <nav className="-mb-px flex space-x-8">
        {filteredSections.map((section) => (
          <motion.button
            key={section.id}
            variants={itemVariants}
            initial="initial"
            whileHover="hover"
            whileTap="tap"
            onClick={() => handleSectionPress(section.id)}
            className={`
              relative flex items-center space-x-2 py-4 px-1 text-sm font-medium transition-colors duration-200
              ${activeSection === section.id
                ? 'text-[rgb(var(--scb-honolulu-blue))] border-b-2 border-[rgb(var(--scb-honolulu-blue))]'
                : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent'
              }
            `}
          >
            <div className="relative">
              {renderIcon(section, 20)}
              {section.badge && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-medium">
                  {section.badge}
                </span>
              )}
            </div>
            <span>{section.label}</span>
          </motion.button>
        ))}
      </nav>
    </div>
  );
};

export default EnhancedDashboardNavigation;