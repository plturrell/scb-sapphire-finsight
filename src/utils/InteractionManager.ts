/**
 * InteractionManager provides unified interaction handling across all devices
 * ensuring consistent hover states, click behaviors, and touch interactions
 */
export class InteractionManager {
  /**
   * Handles interactions consistently across devices
   * @param element The DOM element to attach interactions to
   * @param handler The callback function to execute on interaction
   */
  static handleInteraction(element: HTMLElement, handler: () => void): void {
    // Create identical interaction for touch and mouse
    element.addEventListener('click', handler);
    
    // Handle hover states
    element.addEventListener('mouseenter', () => {
      element.classList.add('hover-state');
    });
    
    element.addEventListener('mouseleave', () => {
      element.classList.remove('hover-state');
    });
    
    // Simulate hover on touch devices
    if ('ontouchstart' in window) {
      element.addEventListener('touchstart', () => {
        element.classList.add('hover-state');
      });
      
      element.addEventListener('touchend', () => {
        setTimeout(() => element.classList.remove('hover-state'), 300);
      });
      
      // Prevent double-trigger of events
      element.addEventListener('touchstart', (e) => {
        e.preventDefault();
      });
    }
  }
  
  /**
   * Attaches drag behavior that works consistently across mouse and touch
   * @param element Element to make draggable
   */
  static attachDragBehavior(element: HTMLElement): void {
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let offsetX = 0;
    let offsetY = 0;
    
    const start = (clientX: number, clientY: number) => {
      isDragging = true;
      startX = clientX;
      startY = clientY;
      offsetX = element.offsetLeft;
      offsetY = element.offsetTop;
      element.classList.add('dragging');
    };
    
    const move = (clientX: number, clientY: number) => {
      if (!isDragging) return;
      
      const deltaX = clientX - startX;
      const deltaY = clientY - startY;
      
      element.style.left = `${offsetX + deltaX}px`;
      element.style.top = `${offsetY + deltaY}px`;
    };
    
    const end = () => {
      isDragging = false;
      element.classList.remove('dragging');
    };
    
    // Mouse events
    element.addEventListener('mousedown', (e) => {
      start(e.clientX, e.clientY);
    });
    
    window.addEventListener('mousemove', (e) => {
      move(e.clientX, e.clientY);
    });
    
    window.addEventListener('mouseup', () => {
      end();
    });
    
    // Touch events
    element.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        start(touch.clientX, touch.clientY);
      }
    });
    
    window.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        move(touch.clientX, touch.clientY);
      }
    });
    
    window.addEventListener('touchend', () => {
      end();
    });
  }
  
  /**
   * Ensures keyboard interactions are consistent
   * @param shortcutMap Map of key combinations to handlers
   */
  static registerKeyboardShortcuts(shortcutMap: Record<string, () => void>): void {
    window.addEventListener('keydown', (event) => {
      // Create a normalized key representation
      const keyCombo = [
        event.ctrlKey ? 'Ctrl' : '',
        event.shiftKey ? 'Shift' : '',
        event.altKey ? 'Alt' : '',
        event.key
      ].filter(Boolean).join('+');
      
      if (shortcutMap[keyCombo]) {
        event.preventDefault();
        shortcutMap[keyCombo]();
      }
    });
  }
}
