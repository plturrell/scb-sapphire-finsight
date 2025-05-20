/**
 * BrowserCompatibility provides shims and polyfills to ensure consistent
 * rendering and behavior across all browsers and devices
 */
export class BrowserCompatibility {
  /**
   * Apply all browser shims and polyfills
   */
  static applyShims(): void {
    BrowserCompatibility.applyRenderingShims();
    BrowserCompatibility.applyAnimationShims();
    BrowserCompatibility.applyEventShims();
    BrowserCompatibility.applyFontShims();
    BrowserCompatibility.applyColorSpaceShims();
  }
  
  /**
   * Force identical WebGL rendering path across browsers
   */
  private static applyRenderingShims(): void {
    // Force WebGL rendering path to be identical
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl', { 
        powerPreference: 'high-performance',
        preserveDrawingBuffer: true,
        antialias: true
      });
      
      // Force specific WebGL settings if available
      if (gl) {
        gl.getExtension('OES_standard_derivatives');
        gl.getExtension('EXT_shader_texture_lod');
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
      }
    } catch (e) {
      console.warn('WebGL shim application failed', e);
    }
    
    // Force hardware acceleration
    document.body.style.transform = 'translateZ(0)';
    document.body.style.backfaceVisibility = 'hidden';
  }
  
  /**
   * Apply animation and timing shims
   */
  private static applyAnimationShims(): void {
    // Polyfill requestAnimationFrame for consistent animation timing
    if (!window.requestAnimationFrame) {
      window.requestAnimationFrame = function(callback) {
        return window.setTimeout(callback, 1000 / 60);
      };
    }
    
    if (!window.cancelAnimationFrame) {
      window.cancelAnimationFrame = function(id) {
        clearTimeout(id);
      };
    }
    
    // Force identical animation timing
    if (typeof document.hidden === 'undefined') {
      (document as any).hidden = false;
    }
  }
  
  /**
   * Apply event handling shims
   */
  private static applyEventShims(): void {
    // Normalize touch events
    if (!window.TouchEvent && 'ontouchstart' in window) {
      (window as any).TouchEvent = function() {};
    }
    
    // Normalize pointer events
    if (!window.PointerEvent && 'MSPointerEvent' in window) {
      (window as any).PointerEvent = (window as any).MSPointerEvent;
    }
    
    // Handle passive event listeners consistently
    try {
      const opts = Object.defineProperty({}, 'passive', {
        get: function() {
          (window as any).supportsPassiveEvents = true;
          return true;
        }
      });
      window.addEventListener('test', null as any, opts);
      window.removeEventListener('test', null as any, opts);
    } catch (e) {
      (window as any).supportsPassiveEvents = false;
    }
  }
  
  /**
   * Apply font rendering shims
   */
  private static applyFontShims(): void {
    // Force identical font rendering
    (document.documentElement.style as any).fontDisplay = 'block';
    
    // Preload critical fonts
    const preloadFonts = ['Arial', 'Roboto', 'Helvetica Neue', 'SC Prosper Sans'];
    preloadFonts.forEach(font => {
      const testElement = document.createElement('div');
      testElement.style.fontFamily = font;
      testElement.style.position = 'absolute';
      testElement.style.top = '-9999px';
      testElement.style.left = '-9999px';
      testElement.textContent = 'Font Preload';
      document.body.appendChild(testElement);
      
      // Remove after a short delay
      setTimeout(() => {
        document.body.removeChild(testElement);
      }, 100);
    });
  }

  /**
   * Detect and apply color space optimizations (P3, HDR, etc.)
   */
  private static applyColorSpaceShims(): void {
    // Detect P3 color space support
    const supportsP3 = (() => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        const ctx = canvas.getContext('2d');
        if (!ctx) return false;
        
        // Test P3 color space with a value outside sRGB gamut
        ctx.fillStyle = 'color(display-p3 1 0 1)';
        ctx.fillRect(0, 0, 1, 1);
        
        // If getData returns a color, P3 is supported
        const data = ctx.getImageData(0, 0, 1, 1).data;
        return !(data[0] === 255 && data[1] === 0 && data[2] === 255);
      } catch (e) {
        return false;
      }
    })();

    // Apply P3 color space support to :root if available
    if (supportsP3) {
      (window as any).supportsP3ColorSpace = true;
      document.documentElement.classList.add('supports-p3');
      
      // Apply P3 optimizations
      document.head.insertAdjacentHTML('beforeend', `
        <style>
          .supports-p3 {
            --p3-red: color(display-p3 1 0 0);
            --p3-green: color(display-p3 0 1 0);
            --p3-blue: color(display-p3 0 0 1);
            --p3-magenta: color(display-p3 1 0 1);
            --p3-cyan: color(display-p3 0 1 1);
            --p3-yellow: color(display-p3 1 1 0);
            
            /* SCB P3 Colors */
            --p3-honolulu-blue: color(display-p3 0 0.447 0.666);
            --p3-american-green: color(display-p3 0.129 0.666 0.278);
            --p3-muted-red: color(display-p3 0.827 0.216 0.196);
            
            /* Apple P3 Colors */
            --p3-apple-blue: color(display-p3 0 0.478 1);
            --p3-apple-green: color(display-p3 0.204 0.780 0.349);
            --p3-apple-indigo: color(display-p3 0.345 0.337 0.839);
            --p3-apple-orange: color(display-p3 1 0.584 0);
            --p3-apple-pink: color(display-p3 1 0.176 0.333);
            --p3-apple-purple: color(display-p3 0.686 0.322 0.871);
            --p3-apple-red: color(display-p3 1 0.231 0.188);
            --p3-apple-teal: color(display-p3 0.353 0.784 0.98);
            --p3-apple-yellow: color(display-p3 1 0.8 0);
          }

          /* Enhanced visuals for P3 displays */
          .supports-p3 .scb-logo {
            filter: saturate(1.1) brightness(1.05);
          }
          
          .supports-p3 .premium-visualization {
            filter: saturate(1.15);
          }

          /* P3-optimized gradients for enhanced visuals */
          .supports-p3 .premium-gradient {
            background: linear-gradient(
              to right,
              color(display-p3 0 0.447 0.666),
              color(display-p3 0.129 0.666 0.278)
            );
          }
        </style>
      `);
    } else {
      (window as any).supportsP3ColorSpace = false;
    }

    // Detect HDR support
    const supportsHDR = (() => {
      try {
        // Check if CSS properties related to HDR exist
        return window.matchMedia('(dynamic-range: high)').matches;
      } catch (e) {
        return false;
      }
    })();

    if (supportsHDR) {
      (window as any).supportsHDR = true;
      document.documentElement.classList.add('supports-hdr');
    } else {
      (window as any).supportsHDR = false;
    }
  }
}

/**
 * Initialize browser compatibility shims
 */
export const applyBrowserShims = (): void => {
  // Apply on DOM content loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      BrowserCompatibility.applyShims();
    });
  } else {
    BrowserCompatibility.applyShims();
  }
};

/**
 * Check if display supports P3 color space
 */
export const supportsP3ColorSpace = (): boolean => {
  return !!(window as any).supportsP3ColorSpace;
};

/**
 * Check if display supports HDR
 */
export const supportsHDR = (): boolean => {
  return !!(window as any).supportsHDR;
};