import React from 'react';

/**
 * True Jony Ive Monochrome Icon System
 * 
 * "Simplicity is the ultimate sophistication" - Steve Jobs
 * "True simplicity is derived from so much more than just the absence of clutter and ornamentation. 
 * It's about bringing order to complexity." - Jony Ive
 * 
 * All icons use single color (#1d1d1f) - Apple's signature deep charcoal
 * Mathematical precision: 24x24px base, perfect circles, exact angles
 * No gradients, no colors, no visual noise - only essential form
 */

interface MonochromeIconProps {
  size?: number;
  className?: string;
  'aria-label'?: string;
}

const JONY_IVE_COLOR = '#1d1d1f'; // Apple's signature deep charcoal
const LIGHT_MODE_COLOR = '#1d1d1f';
const DARK_MODE_COLOR = '#f5f5f7'; // Apple's signature light gray

// Base icon wrapper with perfect proportions
const IconBase: React.FC<MonochromeIconProps & { children: React.ReactNode }> = ({ 
  size = 24, 
  className = '', 
  children, 
  'aria-label': ariaLabel 
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={`monochrome-icon ${className}`}
    aria-label={ariaLabel}
    style={{
      color: 'var(--icon-color, #1d1d1f)',
      transition: 'all 200ms cubic-bezier(0.25, 0.1, 0.25, 1.0)',
    }}
  >
    {children}
  </svg>
);

// Perfect geometric icons - mathematical precision
export const Home: React.FC<MonochromeIconProps> = (props) => (
  <IconBase {...props} aria-label="Home">
    <path
      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </IconBase>
);

export const Analytics: React.FC<MonochromeIconProps> = (props) => (
  <IconBase {...props} aria-label="Analytics">
    <path
      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </IconBase>
);

export const Portfolio: React.FC<MonochromeIconProps> = (props) => (
  <IconBase {...props} aria-label="Portfolio">
    <path
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </IconBase>
);

export const Settings: React.FC<MonochromeIconProps> = (props) => (
  <IconBase {...props} aria-label="Settings">
    <circle
      cx="12"
      cy="12"
      r="3"
      stroke="currentColor"
      strokeWidth="1.25"
    />
    <path
      d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </IconBase>
);

export const Search: React.FC<MonochromeIconProps> = (props) => (
  <IconBase {...props} aria-label="Search">
    <circle
      cx="11"
      cy="11"
      r="8"
      stroke="currentColor"
      strokeWidth="1.25"
    />
    <path
      d="M21 21l-4.35-4.35"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </IconBase>
);

export const Filter: React.FC<MonochromeIconProps> = (props) => (
  <IconBase {...props} aria-label="Filter">
    <path
      d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </IconBase>
);

export const User: React.FC<MonochromeIconProps> = (props) => (
  <IconBase {...props} aria-label="User">
    <path
      d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle
      cx="12"
      cy="7"
      r="4"
      stroke="currentColor"
      strokeWidth="1.25"
    />
  </IconBase>
);

export const Notifications: React.FC<MonochromeIconProps> = (props) => (
  <IconBase {...props} aria-label="Notifications">
    <path
      d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M13.73 21a2 2 0 01-3.46 0"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </IconBase>
);

export const ChevronRight: React.FC<MonochromeIconProps> = (props) => (
  <IconBase {...props} aria-label="Navigate">
    <path
      d="M9 18l6-6-6-6"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </IconBase>
);

export const Plus: React.FC<MonochromeIconProps> = (props) => (
  <IconBase {...props} aria-label="Add">
    <path
      d="M12 5v14m-7-7h14"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </IconBase>
);

export const Close: React.FC<MonochromeIconProps> = (props) => (
  <IconBase {...props} aria-label="Close">
    <path
      d="M18 6L6 18M6 6l12 12"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </IconBase>
);

export const Check: React.FC<MonochromeIconProps> = (props) => (
  <IconBase {...props} aria-label="Complete">
    <path
      d="M20 6L9 17l-5-5"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </IconBase>
);

export const Circle: React.FC<MonochromeIconProps> = (props) => (
  <IconBase {...props} aria-label="Circle">
    <circle
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="1.25"
    />
  </IconBase>
);

export const CheckCircle: React.FC<MonochromeIconProps> = (props) => (
  <IconBase {...props} aria-label="Check circle">
    <path
      d="M22 11.08V12a10 10 0 11-5.93-9.14"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M22 4L12 14.01l-3-3"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </IconBase>
);

export const AlertTriangle: React.FC<MonochromeIconProps> = (props) => (
  <IconBase {...props} aria-label="Alert triangle">
    <path
      d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12 9v4m0 4h.01"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </IconBase>
);

export const RotateCcw: React.FC<MonochromeIconProps> = (props) => (
  <IconBase {...props} aria-label="Rotate counter-clockwise">
    <path
      d="M3 12a9 9 0 109-9 9.75 9.75 0 00-6.74 2.74L3 8"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M3 3v5h5"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </IconBase>
);

export const FileText: React.FC<MonochromeIconProps> = (props) => (
  <IconBase {...props} aria-label="Text file">
    <path
      d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <polyline
      points="14,2 14,8 20,8"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <line
      x1="16"
      y1="13"
      x2="8"
      y2="13"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
    />
    <line
      x1="16"
      y1="17"
      x2="8"
      y2="17"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
    />
  </IconBase>
);

export const GitCommit: React.FC<MonochromeIconProps> = (props) => (
  <IconBase {...props} aria-label="Git commit">
    <circle
      cx="12"
      cy="12"
      r="3"
      stroke="currentColor"
      strokeWidth="1.25"
    />
    <path
      d="M12 1v6m0 8v6"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
    />
  </IconBase>
);

export const GitBranch: React.FC<MonochromeIconProps> = (props) => (
  <IconBase {...props} aria-label="Git branch">
    <line
      x1="6"
      y1="3"
      x2="6"
      y2="15"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
    />
    <circle
      cx="18"
      cy="6"
      r="3"
      stroke="currentColor"
      strokeWidth="1.25"
    />
    <circle
      cx="6"
      cy="18"
      r="3"
      stroke="currentColor"
      strokeWidth="1.25"
    />
    <path
      d="M18 9a9 9 0 01-9 9"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </IconBase>
);

export const RefreshCw: React.FC<MonochromeIconProps> = (props) => (
  <IconBase {...props} aria-label="Refresh">
    <path
      d="M3 12a9 9 0 019-9 9.75 9.75 0 016.74 2.74L21 8"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M21 3v5h-5"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M21 12a9 9 0 01-9 9 9.75 9.75 0 01-6.74-2.74L3 16"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M8 16H3v5"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </IconBase>
);

// System-wide CSS for monochrome icon color management
export const MonochromeIconCSS = `
  :root {
    --icon-color: #1d1d1f;
  }
  
  [data-theme="dark"] {
    --icon-color: #f5f5f7;
  }
  
  .monochrome-icon {
    color: var(--icon-color);
  }
  
  .monochrome-icon:hover {
    opacity: 0.7;
  }
  
  .monochrome-icon:active {
    opacity: 0.5;
  }
`;

// Monochrome icon provider for theme management
export const MonochromeIconProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  React.useEffect(() => {
    // Inject CSS for monochrome icons
    const style = document.createElement('style');
    style.textContent = MonochromeIconCSS;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return <>{children}</>;
};

// Export all icons in a single object for easy import
export const MonochromeIcons = {
  Home,
  Analytics,
  Portfolio,
  Settings,
  Search,
  Filter,
  User,
  Notifications,
  ChevronRight,
  Plus,
  Close,
  Check,
  Circle,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  FileText,
  GitCommit,
  GitBranch,
  RefreshCw,
};

export default MonochromeIcons;