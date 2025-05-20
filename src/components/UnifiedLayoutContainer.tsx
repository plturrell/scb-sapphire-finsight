import React from 'react';

/**
 * UnifiedLayoutContainer provides a fixed-size container that maintains
 * consistent dimensions and scaling across all devices.
 */
interface UnifiedLayoutContainerProps {
  children: React.ReactNode;
  className?: string;
}

export const UnifiedLayoutContainer: React.FC<UnifiedLayoutContainerProps> = ({ children, className }) => {
  return (
    <div className={`fixed-layout-container ${className || ''}`} style={{ width: '1200px', height: '800px' }}>
      {/* Fixed-size container that will be identical across all devices */}
      <div className="scale-container">{children}</div>
    </div>
  );
};

export default UnifiedLayoutContainer;
