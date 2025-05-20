import React, { ReactNode } from 'react';
import { ChevronDown, ChevronUp, ExternalLink, MoreHorizontal } from 'lucide-react';

export interface DashboardCardProps {
  title: string;
  subtitle?: string;
  className?: string;
  children: ReactNode;
  expandable?: boolean;
  expanded?: boolean;
  onToggleExpand?: () => void;
  headerAction?: ReactNode;
  exportable?: boolean;
  onExport?: () => void;
  menuItems?: { label: string; onClick: () => void }[];
}

/**
 * Base card component for the SCB Sapphire FinSight dashboard
 * Follows SAP Fiori Horizon design principles with SCB branding
 */
const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  subtitle,
  className = '',
  children,
  expandable = false,
  expanded = false,
  onToggleExpand,
  headerAction,
  exportable = false,
  onExport,
  menuItems,
}) => {
  const [menuOpen, setMenuOpen] = React.useState(false);
  
  return (
    <div 
      className={`fiori-tile border border-[rgb(var(--scb-border))] dark:border-gray-700/40 rounded-lg overflow-hidden bg-white dark:bg-gray-800/80 backdrop-blur-md dark:backdrop-blur-xl backdrop-saturate-150 dark:backdrop-saturate-125 ${className}`}
      style={{ 
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        background: 'rgba(255, 255, 255, 0.85)',
        transition: 'all 0.3s ease'
      }}
    >
      <div className="flex items-center justify-between p-4 border-b border-[rgb(var(--scb-border))] dark:border-gray-700/40">
        <div>
          <h3 className="scb-section-header text-[rgb(var(--scb-honolulu-blue))] dark:text-blue-300 mb-0 transition-colors">{title}</h3>
          {subtitle && <p className="scb-supplementary dark:text-gray-300 mt-1 transition-colors">{subtitle}</p>}
        </div>
        
        <div className="flex items-center gap-2">
          {headerAction}
          
          {expandable && (
            <button
              className="p-1 rounded hover:bg-[rgba(var(--scb-honolulu-blue),0.05)] dark:hover:bg-blue-500/10 text-gray-500 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
              onClick={onToggleExpand}
              aria-label={expanded ? 'Collapse' : 'Expand'}
            >
              {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          )}
          
          {exportable && (
            <button
              className="p-1 rounded hover:bg-[rgba(var(--scb-honolulu-blue),0.05)] dark:hover:bg-blue-500/10 text-gray-500 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
              onClick={onExport}
              aria-label="Export"
            >
              <ExternalLink size={16} />
            </button>
          )}
          
          {menuItems && menuItems.length > 0 && (
            <div className="relative">
              <button
                className="p-1 rounded hover:bg-[rgba(var(--scb-honolulu-blue),0.05)] dark:hover:bg-blue-500/10 text-gray-500 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label="More options"
              >
                <MoreHorizontal size={16} />
              </button>
              
              {menuOpen && (
                <div 
                  className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800/90 backdrop-blur-md backdrop-saturate-150 border border-[rgb(var(--scb-border))] dark:border-gray-700/50 rounded-md shadow-lg z-10 w-48"
                  onBlur={() => setMenuOpen(false)}
                  style={{
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)'
                  }}
                >
                  <ul>
                    {menuItems.map((item, index) => (
                      <li key={index}>
                        <button
                          className="w-full text-left px-4 py-2 hover:bg-[rgba(var(--scb-honolulu-blue),0.05)] dark:hover:bg-blue-500/10 scb-data-label dark:text-gray-200 transition-colors"
                          onClick={() => {
                            item.onClick();
                            setMenuOpen(false);
                          }}
                        >
                          {item.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      <div className={`p-4 ${expandable ? (expanded ? 'max-h-full' : 'max-h-[300px] overflow-y-auto') : ''} dark:text-gray-200`}>
        {children}
      </div>
    </div>
  );
};

export default DashboardCard;
