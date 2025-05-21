import React, { useState, useEffect, useRef } from 'react';
import { X, Minus, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { useApplePhysics } from '../hooks/useApplePhysics';
import { useDeviceCapabilities } from '../hooks/useDeviceCapabilities';

export interface SonomaDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  showToolbar?: boolean;
  closeOnEscape?: boolean;
  closeOnOutsideClick?: boolean;
  className?: string;
  width?: string | number;
  height?: string | number;
  maxWidth?: string | number;
  maxHeight?: string | number;
  position?: 'center' | 'top' | 'top-right' | 'right' | 'bottom-right' | 'bottom' | 'bottom-left' | 'left' | 'top-left';
  toolbarActions?: React.ReactNode;
  showBackButton?: boolean;
  showForwardButton?: boolean;
  onBack?: () => void;
  onForward?: () => void;
  showMinimize?: boolean;
  showMaximize?: boolean;
  onMinimize?: () => void;
  onMaximize?: () => void;
  isMaximized?: boolean;
  type?: 'standard' | 'toolbar' | 'sheet' | 'alert' | 'sidebar';
}

/**
 * Enhanced Sonoma Dialog Component
 * Mimics macOS Sonoma window styling with translucent materials and precise animations
 */
const EnhancedSonomaDialog: React.FC<SonomaDialogProps> = ({
  isOpen,
  onClose,
  title = '',
  subtitle,
  children,
  showToolbar = true,
  closeOnEscape = true,
  closeOnOutsideClick = true,
  className = '',
  width = 'auto',
  height = 'auto',
  maxWidth = '90vw',
  maxHeight = '90vh',
  position = 'center',
  toolbarActions,
  showBackButton = false,
  showForwardButton = false,
  onBack,
  onForward,
  showMinimize = false,
  showMaximize = false,
  onMinimize,
  onMaximize,
  isMaximized = false,
  type = 'standard'
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const { deviceType, prefersColorScheme } = useDeviceCapabilities();
  const physics = useApplePhysics({ motion: 'snappy' });
  
  // Handle controlled open/close state
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    } else {
      // When closing, wait for animation to complete
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, physics.spring.duration);
      return () => clearTimeout(timer);
    }
  }, [isOpen, physics.spring.duration]);
  
  // Add escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isOpen && closeOnEscape && e.key === 'Escape') {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeOnEscape, onClose]);
  
  // Handle outside click
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (closeOnOutsideClick && e.target === e.currentTarget) {
      onClose();
    }
  };
  
  // Prevent clicks inside the dialog from closing it
  const handleDialogClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
  };
  
  // Generate position classes
  const getPositionClasses = () => {
    switch (position) {
      case 'top':
        return 'top-8 left-1/2 transform -translate-x-1/2';
      case 'top-right':
        return 'top-8 right-8';
      case 'right':
        return 'right-8 top-1/2 transform -translate-y-1/2';
      case 'bottom-right':
        return 'bottom-8 right-8';
      case 'bottom':
        return 'bottom-8 left-1/2 transform -translate-x-1/2';
      case 'bottom-left':
        return 'bottom-8 left-8';
      case 'left':
        return 'left-8 top-1/2 transform -translate-y-1/2';
      case 'top-left':
        return 'top-8 left-8';
      case 'center':
      default:
        return 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2';
    }
  };
  
  // Generate dialog type classes
  const getDialogTypeClasses = () => {
    switch (type) {
      case 'sheet':
        return 'rounded-t-xl rounded-b-none bottom-0 left-0 right-0 top-auto transform-none w-full max-w-full';
      case 'alert':
        return 'rounded-lg shadow-xl max-w-md';
      case 'sidebar':
        return 'rounded-l-none rounded-r-lg h-screen top-0 bottom-0 right-0 left-auto transform-none';
      case 'toolbar':
      case 'standard':
      default:
        return 'rounded-xl shadow-xl';
    }
  };
  
  // Generate animation style
  const getAnimationStyle = () => {
    if (!isOpen) {
      return {
        opacity: 0,
        transform: type === 'sheet' 
          ? 'translateY(100%)' 
          : type === 'sidebar' 
            ? 'translateX(100%)' 
            : 'scale(0.95)',
        transition: `opacity ${physics.spring.duration * 0.8}ms ease-out, transform ${physics.spring.duration}ms cubic-bezier(0.32, 0.72, 0.22, 1.0)`
      };
    }
    
    return {
      opacity: 1,
      transform: type === 'sheet' 
        ? 'translateY(0)' 
        : type === 'sidebar' 
          ? 'translateX(0)' 
          : position === 'center' ? 'scale(1) translate(-50%, -50%)' : 'scale(1)',
      transition: `opacity ${physics.spring.duration * 0.8}ms ease-out, transform ${physics.spring.duration}ms cubic-bezier(0.16, 1.0, 0.22, 1.0)`
    };
  };
  
  // If not visible at all, don't render
  if (!isVisible) return null;
  
  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center ${
        prefersColorScheme === 'dark' ? 'bg-black/50 backdrop-blur-sm' : 'bg-black/30 backdrop-blur-sm'
      } transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0'}`}
      onClick={handleBackdropClick}
      aria-modal="true"
      role="dialog"
      aria-hidden={!isOpen}
    >
      <div
        ref={dialogRef}
        className={`
          overflow-hidden flex flex-col
          ${getDialogTypeClasses()}
          ${getPositionClasses()}
          ${className}
          ${prefersColorScheme === 'dark' 
            ? 'bg-[rgba(28,28,30,0.75)] border border-[rgba(255,255,255,0.12)]' 
            : 'bg-[rgba(247,247,247,0.75)] border border-[rgba(0,0,0,0.06)]'}
          backdrop-blur-xl backdrop-saturate-150
        `}
        style={{
          width,
          height,
          maxWidth,
          maxHeight,
          ...getAnimationStyle()
        }}
        onClick={handleDialogClick}
      >
        {/* Toolbar for macOS style window */}
        {showToolbar && (
          <div 
            className={`
              flex items-center px-3 py-2 border-b
              ${prefersColorScheme === 'dark' 
                ? 'border-[rgba(255,255,255,0.08)] bg-[rgba(28,28,30,0.3)]' 
                : 'border-[rgba(0,0,0,0.05)] bg-[rgba(247,247,247,0.5)]'}
            `}
          >
            <div className="flex items-center space-x-1.5">
              {/* Window controls */}
              <button
                onClick={onClose}
                className="w-3 h-3 rounded-full bg-[rgb(255,95,87)] flex items-center justify-center group"
                aria-label="Close"
              >
                <X size={8} className="text-[rgba(0,0,0,0.5)] opacity-0 group-hover:opacity-100" />
              </button>
              
              {showMinimize && (
                <button
                  onClick={onMinimize}
                  className="w-3 h-3 rounded-full bg-[rgb(255,189,46)] flex items-center justify-center group"
                  aria-label="Minimize"
                >
                  <Minus size={8} className="text-[rgba(0,0,0,0.5)] opacity-0 group-hover:opacity-100" />
                </button>
              )}
              
              {showMaximize && (
                <button
                  onClick={onMaximize}
                  className="w-3 h-3 rounded-full bg-[rgb(40,201,64)] flex items-center justify-center group"
                  aria-label={isMaximized ? "Exit Full Screen" : "Full Screen"}
                >
                  {isMaximized 
                    ? <Minus size={8} className="text-[rgba(0,0,0,0.5)] opacity-0 group-hover:opacity-100" />
                    : <Plus size={8} className="text-[rgba(0,0,0,0.5)] opacity-0 group-hover:opacity-100" />
                  }
                </button>
              )}
            </div>
            
            <div className="flex-1 flex items-center justify-center">
              <div className="flex items-center space-x-2">
                {/* Back/Forward buttons */}
                {showBackButton && (
                  <button
                    onClick={onBack}
                    className={`p-0.5 rounded ${prefersColorScheme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-black/5'}`}
                    aria-label="Back"
                  >
                    <ChevronLeft size={16} className={prefersColorScheme === 'dark' ? 'text-white/70' : 'text-black/70'} />
                  </button>
                )}
                
                {showForwardButton && (
                  <button
                    onClick={onForward}
                    className={`p-0.5 rounded ${prefersColorScheme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-black/5'}`}
                    aria-label="Forward"
                  >
                    <ChevronRight size={16} className={prefersColorScheme === 'dark' ? 'text-white/70' : 'text-black/70'} />
                  </button>
                )}
                
                {/* Title */}
                {title && (
                  <div className="text-center">
                    <h3 
                      className={`text-sm font-medium ${prefersColorScheme === 'dark' ? 'text-white/90' : 'text-black/90'}`}
                    >
                      {title}
                    </h3>
                    
                    {subtitle && (
                      <p 
                        className={`text-xs ${prefersColorScheme === 'dark' ? 'text-white/50' : 'text-black/50'}`}
                      >
                        {subtitle}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            {/* Additional toolbar actions */}
            <div className="flex items-center">
              {toolbarActions}
            </div>
          </div>
        )}
        
        {/* Content */}
        <div 
          className={`flex-1 overflow-auto ${
            prefersColorScheme === 'dark' 
              ? 'scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent' 
              : 'scrollbar-thin scrollbar-thumb-black/10 scrollbar-track-transparent'
          }`}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

export default EnhancedSonomaDialog;