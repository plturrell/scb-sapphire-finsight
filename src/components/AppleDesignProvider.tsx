import React, { useEffect } from 'react';

/**
 * AppleDesignProvider
 * 
 * Applies Apple-inspired design enhancements application-wide
 * This component should be added near the top of the component tree
 * to ensure Apple design language is consistently applied throughout
 * the entire application on both desktop and mobile views.
 */
const AppleDesignProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    // Apply Apple font rendering rules
    document.documentElement.style.WebkitFontSmoothing = 'antialiased';
    document.documentElement.style.MozOsxFontSmoothing = 'grayscale';
    document.documentElement.style.textRendering = 'optimizeLegibility';
    
    // Add Apple-style classes to existing elements
    const applyAppleClasses = () => {
      // Apply to cards
      document.querySelectorAll('.MuiPaper-root, .card, [class*="paper"], [class*="card"]')
        .forEach(el => {
          el.classList.add('glass-effect');
          el.classList.add('thin-border');
        });
      
      // Apply to buttons
      document.querySelectorAll('button, .MuiButton-root, [class*="btn"]')
        .forEach(el => {
          el.classList.add('hover-lift');
        });
      
      // Apply to Brand logos
      document.querySelectorAll('.scb-logo, img[src*="logo"], img[alt*="logo"]')
        .forEach(el => {
          el.classList.add('filter', 'drop-shadow-sm');
        });
    };
    
    // Apply initially after a small delay to ensure DOM is ready
    setTimeout(applyAppleClasses, 300);
    
    // Apply on any content changes
    const observer = new MutationObserver(applyAppleClasses);
    observer.observe(document.body, { 
      childList: true, 
      subtree: true,
      attributeFilter: ['class']
    });
    
    // Mobile-specific enhancements
    const applyMobileEnhancements = () => {
      if (window.innerWidth < 768) {
        // Increase all touch targets
        document.querySelectorAll('button, .MuiButton-root, [role="button"], a, input, select')
          .forEach(el => {
            const rect = el.getBoundingClientRect();
            if (rect.height < 44) {
              (el as HTMLElement).style.minHeight = '44px';
            }
          });
      }
    };
    
    // Apply mobile enhancements on resize
    window.addEventListener('resize', applyMobileEnhancements);
    
    // Initial run
    applyMobileEnhancements();
    
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', applyMobileEnhancements);
    };
  }, []);
  
  return <>{children}</>;
};

export default AppleDesignProvider;