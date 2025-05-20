/**
 * ScalingEngine maintains uniform scaling and layout across all devices
 * by applying proportional transforms instead of responsive layout changes
 */
export class ScalingEngine {
  private static readonly baseWidth = 1200;
  private static readonly baseHeight = 800;
  private static container: HTMLElement | null = null;
  private static resizeObserver: ResizeObserver | null = null;
  
  /**
   * Initialize the scaling engine and attach resize listeners
   */
  static initialize(): void {
    window.addEventListener('DOMContentLoaded', () => {
      ScalingEngine.container = document.querySelector('.scale-container');
      if (!ScalingEngine.container) {
        console.error('ScalingEngine: .scale-container not found');
        return;
      }
      
      // Set fixed positioning for the container
      ScalingEngine.container.style.position = 'absolute';
      ScalingEngine.container.style.width = `${ScalingEngine.baseWidth}px`;
      ScalingEngine.container.style.height = `${ScalingEngine.baseHeight}px`;
      ScalingEngine.container.style.transformOrigin = 'top left';
      
      // Apply initial scaling
      ScalingEngine.updateScale();
      
      // Observe parent container for size changes
      const parent = ScalingEngine.container.parentElement;
      if (parent && 'ResizeObserver' in window) {
        ScalingEngine.resizeObserver = new ResizeObserver(() => {
          ScalingEngine.updateScale();
        });
        ScalingEngine.resizeObserver.observe(parent);
      } else {
        // Fallback to window resize
        window.addEventListener('resize', ScalingEngine.updateScale);
      }
    });
  }
  
  /**
   * Calculate and apply appropriate scaling
   */
  static updateScale(): void {
    if (!ScalingEngine.container) return;
    
    const parent = ScalingEngine.container.parentElement;
    if (!parent) return;
    
    const availableWidth = parent.clientWidth;
    const availableHeight = parent.clientHeight;
    
    // Calculate scale to fit entire UI in viewport without responsive reflow
    const scaleX = availableWidth / ScalingEngine.baseWidth;
    const scaleY = availableHeight / ScalingEngine.baseHeight;
    const scale = Math.min(scaleX, scaleY, 1); // Cap at 1x for large screens
    
    // Apply transform to maintain exact proportions
    ScalingEngine.container.style.transform = `scale(${scale})`;
    
    // Center the scaled content
    const scaledWidth = ScalingEngine.baseWidth * scale;
    const scaledHeight = ScalingEngine.baseHeight * scale;
    
    const leftOffset = (availableWidth - scaledWidth) / 2;
    const topOffset = (availableHeight - scaledHeight) / 2;
    
    ScalingEngine.container.style.left = `${leftOffset}px`;
    ScalingEngine.container.style.top = `${topOffset}px`;
  }
  
  /**
   * Clean up resources
   */
  static destroy(): void {
    if (ScalingEngine.resizeObserver) {
      ScalingEngine.resizeObserver.disconnect();
    }
    window.removeEventListener('resize', ScalingEngine.updateScale);
  }
}

// Auto-initialize when imported
export const initializeScalingEngine = (): void => {
  ScalingEngine.initialize();
};
