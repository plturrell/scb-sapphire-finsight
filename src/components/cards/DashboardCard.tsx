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
      className={`fiori-tile border border-[rgb(var(--scb-border))] rounded-md overflow-hidden bg-white ${className}`}
      style={{ boxShadow: '0 2px 6px rgba(0, 0, 0, 0.05)' }}
    >
      <div className="flex items-center justify-between p-4 border-b border-[rgb(var(--scb-border))]">
        <div>
          <h3 className="scb-section-header text-[rgb(var(--scb-honolulu-blue))] mb-0">{title}</h3>
          {subtitle && <p className="scb-supplementary mt-1">{subtitle}</p>}
        </div>
        
        <div className="flex items-center gap-2">
          {headerAction}
          
          {expandable && (
            <button
              className="p-1 rounded hover:bg-[rgba(var(--scb-honolulu-blue),0.05)]"
              onClick={onToggleExpand}
              aria-label={expanded ? 'Collapse' : 'Expand'}
            >
              {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          )}
          
          {exportable && (
            <button
              className="p-1 rounded hover:bg-[rgba(var(--scb-honolulu-blue),0.05)]"
              onClick={onExport}
              aria-label="Export"
            >
              <ExternalLink size={16} />
            </button>
          )}
          
          {menuItems && menuItems.length > 0 && (
            <div className="relative">
              <button
                className="p-1 rounded hover:bg-[rgba(var(--scb-honolulu-blue),0.05)]"
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label="More options"
              >
                <MoreHorizontal size={16} />
              </button>
              
              {menuOpen && (
                <div 
                  className="absolute right-0 top-full mt-1 bg-white border border-[rgb(var(--scb-border))] rounded-md shadow-md z-10 w-48"
                  onBlur={() => setMenuOpen(false)}
                >
                  <ul>
                    {menuItems.map((item, index) => (
                      <li key={index}>
                        <button
                          className="w-full text-left px-4 py-2 hover:bg-[rgba(var(--scb-honolulu-blue),0.05)] scb-data-label"
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
      
      <div className={`p-4 ${expandable ? (expanded ? 'max-h-full' : 'max-h-[300px] overflow-y-auto') : ''}`}>
        {children}
      </div>
    </div>
  );
};

export default DashboardCard;
