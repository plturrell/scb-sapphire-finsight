import React, { useState } from 'react';
import { Settings, X, EyeOff, Eye, Type, ZapOff, PanelLeft, BellOff } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { motion } from '@/styles/motion';
import ThemeToggle from './ThemeToggle';
import ReducedMotionToggle from './ReducedMotionToggle';
import { useReducedMotionPreference } from '@/hooks/useReducedMotion';
import tokens from '@/styles/tokens';

type AccessibilityPanelProps = {
  className?: string;
  position?: 'top-right' | 'bottom-right' | 'bottom-left' | 'top-left';
};

// Tooltip component
const Tooltip: React.FC<{
  children: React.ReactNode;
  content: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
}> = ({ children, content, side = 'top' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const { prefersReducedMotion } = useReducedMotionPreference();

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onFocus={() => setIsVisible(true)}
        onBlur={() => setIsVisible(false)}
      >
        {children}
      </div>
      {isVisible && (
        <div
          role="tooltip"
          className={`absolute z-50 px-2 py-1 text-xs font-medium text-white bg-gray-900 dark:bg-gray-700 rounded shadow-lg whitespace-nowrap
            ${side === 'top' ? 'bottom-full left-1/2 transform -translate-x-1/2 mb-1' : ''}
            ${side === 'bottom' ? 'top-full left-1/2 transform -translate-x-1/2 mt-1' : ''}
            ${side === 'left' ? 'right-full top-1/2 transform -translate-y-1/2 mr-1' : ''}
            ${side === 'right' ? 'left-full top-1/2 transform -translate-y-1/2 ml-1' : ''}`}
          style={prefersReducedMotion ? {} : motion.animationPresets.fadeIn({
            duration: tokens.animation.duration.fast
          })}
        >
          {content}
        </div>
      )}
    </div>
  );
};

/**
 * Accessibility Panel component providing access to various accessibility settings
 */
const AccessibilityPanel: React.FC<AccessibilityPanelProps> = ({
  className = '',
  position = 'bottom-right'
}) => {
  const [open, setOpen] = useState(false);
  const [fontScale, setFontScale] = useState(100);
  const [highContrast, setHighContrast] = useState(false);
  const [hideAnimations, setHideAnimations] = useState(false);
  const [reduceSidebars, setReduceSidebars] = useState(false);
  const [hideNotifications, setHideNotifications] = useState(false);
  
  const { prefersReducedMotion } = useReducedMotionPreference();

  // Position styles
  const positionStyles = {
    'top-right': 'top-4 right-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-left': 'top-4 left-4',
  };

  // Handle font scaling
  const handleFontScaleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newScale = parseInt(e.target.value);
    setFontScale(newScale);
    
    // Apply font scaling to root element
    document.documentElement.style.fontSize = `${newScale}%`;
  };

  // Apply high contrast mode
  const toggleHighContrast = () => {
    const newValue = !highContrast;
    setHighContrast(newValue);
    
    if (newValue) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
  };

  // Hide animations (in addition to reduced motion)
  const toggleHideAnimations = () => {
    const newValue = !hideAnimations;
    setHideAnimations(newValue);
    
    if (newValue) {
      document.documentElement.classList.add('hide-animations');
    } else {
      document.documentElement.classList.remove('hide-animations');
    }
  };

  // Reduce sidebars for more content space
  const toggleReduceSidebars = () => {
    const newValue = !reduceSidebars;
    setReduceSidebars(newValue);
    
    if (newValue) {
      document.documentElement.classList.add('reduce-sidebars');
    } else {
      document.documentElement.classList.remove('reduce-sidebars');
    }
  };

  // Hide notifications
  const toggleHideNotifications = () => {
    const newValue = !hideNotifications;
    setHideNotifications(newValue);
    
    if (newValue) {
      document.documentElement.classList.add('hide-notifications');
    } else {
      document.documentElement.classList.remove('hide-notifications');
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          aria-label="Accessibility settings"
          className={`fixed ${positionStyles[position]} z-50 p-3 rounded-full bg-primary-500 text-white
          shadow-lg hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500
          transition-colors ${prefersReducedMotion ? 'transition-none' : 'duration-200'} ${className}`}
        >
          <Settings className="h-5 w-5" />
        </button>
      </Dialog.Trigger>
      
      <Dialog.Portal>
        <Dialog.Overlay 
          className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
          style={prefersReducedMotion ? {} : motion.animationPresets.fadeIn({
            duration: tokens.animation.duration.normal
          })}
        />
        
        <Dialog.Content
          className="fixed right-0 top-0 h-full w-full sm:w-96 max-w-full bg-white dark:bg-gray-800 shadow-xl z-50 overflow-y-auto"
          style={prefersReducedMotion ? {} : motion.animationPresets.slideInRight({
            duration: tokens.animation.duration.normal,
            easing: tokens.animation.ease.inOut
          })}
        >
          <div className="p-6 flex flex-col h-full">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-4 mb-6">
              <Dialog.Title className="text-xl font-medium text-gray-900 dark:text-white">
                Accessibility Settings
              </Dialog.Title>
              
              <Dialog.Close asChild>
                <button
                  aria-label="Close"
                  className="p-1 rounded-full text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200
                  focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <X className="h-5 w-5" />
                </button>
              </Dialog.Close>
            </div>
            
            <div className="flex-1 space-y-6">
              {/* Theme section */}
              <section>
                <h3 className="text-md font-medium text-gray-900 dark:text-white mb-3">
                  Display Theme
                </h3>
                <div className="pl-2">
                  <ThemeToggle variant="dropdown" showLabel size="md" />
                </div>
              </section>
              
              {/* Motion section */}
              <section>
                <h3 className="text-md font-medium text-gray-900 dark:text-white mb-3">
                  Animation & Motion
                </h3>
                <div className="pl-2 space-y-3">
                  <ReducedMotionToggle variant="switch" size="md" />
                  
                  <div className="flex items-center">
                    <Tooltip content="Completely disable all animations">
                      <button
                        aria-label={hideAnimations ? "Enable animations" : "Disable all animations"}
                        onClick={toggleHideAnimations}
                        className={`flex items-center space-x-2 py-1 px-2 rounded
                        ${hideAnimations
                          ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                      >
                        <ZapOff className="h-4 w-4" />
                        <span className="text-sm">Hide All Animations</span>
                      </button>
                    </Tooltip>
                    <div className="ml-2">
                      <input
                        type="checkbox"
                        id="hide-animations"
                        checked={hideAnimations}
                        onChange={toggleHideAnimations}
                        className="sr-only"
                      />
                      <label
                        htmlFor="hide-animations"
                        className={`relative inline-flex h-5 w-10 flex-shrink-0 
                        cursor-pointer rounded-full border-2 border-transparent 
                        transition-colors duration-200 ${prefersReducedMotion ? 'transition-none' : ''}
                        focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
                        ${hideAnimations ? 'bg-primary-500' : 'bg-gray-200 dark:bg-gray-700'}`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 
                          transform rounded-full bg-white shadow ring-0 
                          transition duration-200 ${prefersReducedMotion ? 'transition-none' : ''}
                          ${hideAnimations ? 'translate-x-5' : 'translate-x-0'}`}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </section>
              
              {/* Font scaling section */}
              <section>
                <h3 className="text-md font-medium text-gray-900 dark:text-white mb-3">
                  Text Size
                </h3>
                <div className="pl-2">
                  <div className="flex items-center space-x-3">
                    <Type className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    <input
                      type="range"
                      min="75"
                      max="150"
                      step="5"
                      value={fontScale}
                      onChange={handleFontScaleChange}
                      className="flex-1 h-2 rounded-lg appearance-none bg-gray-200 dark:bg-gray-700 cursor-pointer"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[3rem] text-right">
                      {fontScale}%
                    </span>
                  </div>
                  <div className="flex justify-between mt-2 px-3">
                    <button 
                      onClick={() => {
                        setFontScale(75);
                        document.documentElement.style.fontSize = '75%';
                      }}
                      className="text-xs text-gray-500 dark:text-gray-400 hover:text-primary-500 dark:hover:text-primary-400"
                    >
                      A
                    </button>
                    <button 
                      onClick={() => {
                        setFontScale(100);
                        document.documentElement.style.fontSize = '100%';
                      }}
                      className="text-sm text-gray-500 dark:text-gray-400 hover:text-primary-500 dark:hover:text-primary-400"
                    >
                      A
                    </button>
                    <button 
                      onClick={() => {
                        setFontScale(125);
                        document.documentElement.style.fontSize = '125%';
                      }}
                      className="text-base text-gray-500 dark:text-gray-400 hover:text-primary-500 dark:hover:text-primary-400"
                    >
                      A
                    </button>
                    <button 
                      onClick={() => {
                        setFontScale(150);
                        document.documentElement.style.fontSize = '150%';
                      }}
                      className="text-lg text-gray-500 dark:text-gray-400 hover:text-primary-500 dark:hover:text-primary-400"
                    >
                      A
                    </button>
                  </div>
                </div>
              </section>
              
              {/* Other accessibility options */}
              <section>
                <h3 className="text-md font-medium text-gray-900 dark:text-white mb-3">
                  Additional Options
                </h3>
                <div className="pl-2 space-y-3">
                  {/* High contrast mode */}
                  <div className="flex items-center">
                    <Tooltip content="Increase contrast for better readability">
                      <button
                        aria-label={highContrast ? "Disable high contrast" : "Enable high contrast"}
                        onClick={toggleHighContrast}
                        className={`flex items-center space-x-2 py-1 px-2 rounded
                        ${highContrast
                          ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                      >
                        <Eye className="h-4 w-4" />
                        <span className="text-sm">High Contrast Mode</span>
                      </button>
                    </Tooltip>
                    <div className="ml-2">
                      <input
                        type="checkbox"
                        id="high-contrast"
                        checked={highContrast}
                        onChange={toggleHighContrast}
                        className="sr-only"
                      />
                      <label
                        htmlFor="high-contrast"
                        className={`relative inline-flex h-5 w-10 flex-shrink-0 
                        cursor-pointer rounded-full border-2 border-transparent 
                        transition-colors duration-200 ${prefersReducedMotion ? 'transition-none' : ''}
                        focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
                        ${highContrast ? 'bg-primary-500' : 'bg-gray-200 dark:bg-gray-700'}`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 
                          transform rounded-full bg-white shadow ring-0 
                          transition duration-200 ${prefersReducedMotion ? 'transition-none' : ''}
                          ${highContrast ? 'translate-x-5' : 'translate-x-0'}`}
                        />
                      </label>
                    </div>
                  </div>

                  {/* Reduce sidebars */}
                  <div className="flex items-center">
                    <Tooltip content="Minimize sidebar width for more content space">
                      <button
                        aria-label={reduceSidebars ? "Restore sidebars" : "Reduce sidebars"}
                        onClick={toggleReduceSidebars}
                        className={`flex items-center space-x-2 py-1 px-2 rounded
                        ${reduceSidebars
                          ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                      >
                        <PanelLeft className="h-4 w-4" />
                        <span className="text-sm">Reduce Sidebars</span>
                      </button>
                    </Tooltip>
                    <div className="ml-2">
                      <input
                        type="checkbox"
                        id="reduce-sidebars"
                        checked={reduceSidebars}
                        onChange={toggleReduceSidebars}
                        className="sr-only"
                      />
                      <label
                        htmlFor="reduce-sidebars"
                        className={`relative inline-flex h-5 w-10 flex-shrink-0 
                        cursor-pointer rounded-full border-2 border-transparent 
                        transition-colors duration-200 ${prefersReducedMotion ? 'transition-none' : ''}
                        focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
                        ${reduceSidebars ? 'bg-primary-500' : 'bg-gray-200 dark:bg-gray-700'}`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 
                          transform rounded-full bg-white shadow ring-0 
                          transition duration-200 ${prefersReducedMotion ? 'transition-none' : ''}
                          ${reduceSidebars ? 'translate-x-5' : 'translate-x-0'}`}
                        />
                      </label>
                    </div>
                  </div>

                  {/* Hide notifications */}
                  <div className="flex items-center">
                    <Tooltip content="Disable non-critical notifications">
                      <button
                        aria-label={hideNotifications ? "Enable notifications" : "Disable notifications"}
                        onClick={toggleHideNotifications}
                        className={`flex items-center space-x-2 py-1 px-2 rounded
                        ${hideNotifications
                          ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                      >
                        <BellOff className="h-4 w-4" />
                        <span className="text-sm">Hide Notifications</span>
                      </button>
                    </Tooltip>
                    <div className="ml-2">
                      <input
                        type="checkbox"
                        id="hide-notifications"
                        checked={hideNotifications}
                        onChange={toggleHideNotifications}
                        className="sr-only"
                      />
                      <label
                        htmlFor="hide-notifications"
                        className={`relative inline-flex h-5 w-10 flex-shrink-0 
                        cursor-pointer rounded-full border-2 border-transparent 
                        transition-colors duration-200 ${prefersReducedMotion ? 'transition-none' : ''}
                        focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
                        ${hideNotifications ? 'bg-primary-500' : 'bg-gray-200 dark:bg-gray-700'}`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 
                          transform rounded-full bg-white shadow ring-0 
                          transition duration-200 ${prefersReducedMotion ? 'transition-none' : ''}
                          ${hideNotifications ? 'translate-x-5' : 'translate-x-0'}`}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </section>
            </div>
            
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700 mt-6">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Your accessibility preferences are saved locally and will be applied 
                automatically when you return to this site.
              </p>
              
              <button
                onClick={() => {
                  // Reset all preferences
                  setFontScale(100);
                  setHighContrast(false);
                  setHideAnimations(false);
                  setReduceSidebars(false);
                  setHideNotifications(false);
                  
                  // Update document
                  document.documentElement.style.fontSize = '100%';
                  document.documentElement.classList.remove('high-contrast');
                  document.documentElement.classList.remove('hide-animations');
                  document.documentElement.classList.remove('reduce-sidebars');
                  document.documentElement.classList.remove('hide-notifications');
                }}
                className="mt-3 w-full py-2 px-4 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300
                hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-sm font-medium
                transition-colors duration-200 ${prefersReducedMotion ? 'transition-none' : ''}"
              >
                Reset All Settings
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default AccessibilityPanel;