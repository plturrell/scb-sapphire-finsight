import React, { useEffect, useRef } from 'react';
import { RegionalHeatmapEntry, RiskLevel } from '../types/TariffAnalysisTypes';

interface RegionalHeatmapViewProps {
  data: RegionalHeatmapEntry[];
}

/**
 * RegionalHeatmapView renders a fixed-size heatmap visualization
 * that appears identical across all devices
 */
export const RegionalHeatmapView: React.FC<RegionalHeatmapViewProps> = ({ data }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Color mapping for risk levels
  const getRiskColor = (risk: RiskLevel): string => {
    switch (risk) {
      case 'low': return '#4caf50';
      case 'medium': return '#ffc107';
      case 'high': return '#ff9800';
      case 'critical': return '#f44336';
      default: return '#9e9e9e';
    }
  };

  // Score color mapping
  const getScoreColor = (score: number): string => {
    const colors = [
      '#1a237e', '#283593', '#303f9f', '#3949ab', '#3f51b5',
      '#5c6bc0', '#7986cb', '#9fa8da', '#c5cae9', '#e8eaf6'
    ];
    const index = Math.min(Math.floor(score), 9);
    return colors[index];
  };

  useEffect(() => {
    if (!canvasRef.current || !data.length) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Define fixed grid layout
    const gridWidth = 800;
    const gridHeight = 600;
    const cellWidth = gridWidth / 5;
    const cellHeight = gridHeight / 4;
    
    // Render heatmap cells
    data.forEach((region, index) => {
      const row = Math.floor(index / 5);
      const col = index % 5;
      
      const x = col * cellWidth;
      const y = row * cellHeight;
      
      // Fill cell based on resilience score
      ctx.fillStyle = getScoreColor(region.resilienceScore);
      ctx.fillRect(x, y, cellWidth, cellHeight);
      
      // Add region name
      ctx.fillStyle = '#ffffff';
      ctx.font = '16px Arial';
      ctx.fillText(region.regionName, x + 10, y + 25);
      
      // Add risk indicators
      ctx.fillStyle = getRiskColor(region.tariffRiskLevel);
      ctx.fillRect(x + 10, y + 35, 15, 15);
      
      ctx.fillStyle = getRiskColor(region.geopoliticalRiskLevel);
      ctx.fillRect(x + 30, y + 35, 15, 15);
      
      ctx.fillStyle = getRiskColor(region.transitTimeRisk);
      ctx.fillRect(x + 50, y + 35, 15, 15);
      
      // Add score value
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px Arial';
      ctx.fillText(region.resilienceScore.toFixed(1), x + cellWidth - 40, y + cellHeight - 20);
    });
  }, [data]);

  return (
    <div className="visualization-container" style={{ width: '800px', height: '600px' }}>
      <canvas 
        ref={canvasRef}
        width={800} 
        height={600} 
        className="fixed-canvas"
      />
    </div>
  );
};

export default RegionalHeatmapView;
