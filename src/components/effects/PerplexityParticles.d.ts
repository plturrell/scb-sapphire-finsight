import React from 'react';

export interface PerplexityParticlesProps {
  active?: boolean;
  color?: string;
  size?: number;
  speed?: number;
  count?: number;
  opacity?: number;
  className?: string;
  style?: React.CSSProperties;
}

declare const PerplexityParticles: React.FC<PerplexityParticlesProps>;

export default PerplexityParticles;