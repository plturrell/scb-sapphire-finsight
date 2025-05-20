import React, { useState, useEffect, useRef } from 'react';
import { Loader } from 'lucide-react';
import { animated, useSpring } from '@react-spring/web';
import { useHaptic } from '../hooks/useMicroInteractions';

interface TouchButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'glass';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  className?: string;
  children: React.ReactNode;
  hapticFeedback?: boolean;
  hapticIntensity?: 'light' | 'medium' | 'heavy';
  animationStyle?: 'press' | 'bounce' | 'ripple' | 'glow' | 'none';
  disableAnimation?: boolean;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onMouseDown?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onMouseUp?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onTouchStart?: (event: React.TouchEvent<HTMLButtonElement>) => void;
  onTouchEnd?: (event: React.TouchEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
}

export default function TouchButton({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  className = '',
  children,
  disabled,
  hapticFeedback = true,
  hapticIntensity = 'light',
  animationStyle = 'press',
  disableAnimation = false,
  ...props
}: TouchButtonProps) {
  // State for ripple effect
  const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([]);
  const buttonRef = useRef<HTMLButtonElement>(null);
  
  // Haptic feedback hook
  const triggerHaptic = useHaptic();
  
  // Animation states
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  
  // Spring animation for the button
  const springProps = useSpring({
    scale: disableAnimation ? 1 : (isPressed ? 
      (animationStyle === 'press' ? 0.95 : animationStyle === 'bounce' ? 0.9 : 1) : 
      (isHovered && animationStyle === 'bounce' ? 1.05 : 1)),
    shadow: disableAnimation ? 5 : (isPressed ? 0 : isHovered ? 15 : 5),
    glow: disableAnimation ? 0 : (isHovered && animationStyle === 'glow' ? 1 : 0),
    config: { tension: 300, friction: 10 },
  });
  
  const baseClasses = 'relative overflow-hidden inline-flex items-center justify-center font-medium rounded-lg transition-colors duration-200 touch-manipulation focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = {
    primary: 'bg-primary text-white hover:bg-primary-dark focus:ring-primary dark:bg-blue-600 dark:hover:bg-blue-700',
    secondary: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-primary dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600',
    ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-primary dark:text-gray-200 dark:hover:bg-gray-700',
    danger: 'bg-destructive text-white hover:bg-red-700 focus:ring-destructive dark:bg-red-700 dark:hover:bg-red-800',
    glass: 'backdrop-blur-md backdrop-saturate-150 bg-white/80 text-gray-800 border border-white/30 hover:bg-white/90 focus:ring-primary dark:bg-gray-800/50 dark:text-white dark:border-gray-700/30 dark:hover:bg-gray-700/60',
  };
  
  const sizeClasses = {
    sm: 'min-h-[36px] px-3 py-1.5 text-sm gap-1.5',
    md: 'min-h-[44px] px-4 py-2 text-base gap-2',
    lg: 'min-h-[52px] px-6 py-3 text-lg gap-3',
  };
  
  const widthClass = fullWidth ? 'w-full' : '';
  
  const combinedClasses = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    widthClass,
    className
  ].filter(Boolean).join(' ');

  // Ripple effect function
  const createRipple = (event: React.MouseEvent | React.TouchEvent) => {
    if (!buttonRef.current || animationStyle !== 'ripple' || disableAnimation) return;

    const button = buttonRef.current;
    const rect = button.getBoundingClientRect();
    
    let x: number, y: number;
    
    if ('touches' in event) {
      x = event.touches[0].clientX - rect.left;
      y = event.touches[0].clientY - rect.top;
    } else {
      x = event.clientX - rect.left;
      y = event.clientY - rect.top;
    }

    const newRipple = { x, y, id: Date.now() };
    setRipples(prev => [...prev, newRipple]);

    // Remove ripple after animation
    setTimeout(() => {
      setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id));
    }, 800);
  };

  // Mouse/Touch event handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || isLoading || disableAnimation) return;
    
    setIsPressed(true);
    if (hapticFeedback) {
      triggerHaptic({ intensity: hapticIntensity });
    }
    
    if (animationStyle === 'ripple') {
      createRipple(e);
    }
    
    props.onMouseDown?.(e);
  };
  
  const handleTouchStart = (e: React.TouchEvent<HTMLButtonElement>) => {
    if (disabled || isLoading || disableAnimation) return;
    
    setIsPressed(true);
    if (hapticFeedback) {
      triggerHaptic({ intensity: hapticIntensity });
    }
    
    if (animationStyle === 'ripple') {
      createRipple(e);
    }
    
    props.onTouchStart?.(e);
  };
  
  const handleMouseUp = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || isLoading || disableAnimation) return;
    
    setIsPressed(false);
    props.onMouseUp?.(e);
  };
  
  const handleTouchEnd = (e: React.TouchEvent<HTMLButtonElement>) => {
    if (disabled || isLoading || disableAnimation) return;
    
    setIsPressed(false);
    props.onTouchEnd?.(e);
  };

  return (
    <animated.button
      ref={buttonRef}
      className={combinedClasses}
      disabled={disabled || isLoading}
      onMouseEnter={() => !disableAnimation && setIsHovered(true)}
      onMouseLeave={() => !disableAnimation && setIsHovered(false)}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{
        transform: springProps.scale.to(s => `scale(${s})`),
        boxShadow: springProps.shadow.to(s => `0 ${s * 0.05}rem ${s * 0.1}rem rgba(0, 0, 0, 0.1)`),
        ...(animationStyle === 'glow' && !disableAnimation ? {
          boxShadow: springProps.glow.to(
            g => `0 0 ${g * 20}px rgba(var(--primary), ${g * 0.5})`
          )
        } : {}),
      }}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader className="w-4 h-4 animate-spin" />
          <span>Loading...</span>
        </>
      ) : (
        <>
          {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
          <span>{children}</span>
          {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
        </>
      )}
      
      {/* Ripple effect elements */}
      {animationStyle === 'ripple' && !disableAnimation && ripples.map(ripple => (
        <span
          key={ripple.id}
          className="absolute pointer-events-none"
          style={{
            left: ripple.x,
            top: ripple.y,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <span 
            className="block rounded-full bg-white dark:bg-gray-200 animate-ripple"
            style={{
              position: 'absolute',
              width: '5px',
              height: '5px',
              backgroundColor: 'rgba(255, 255, 255, 0.7)',
              animation: 'ripple 800ms ease-out forwards',
            }}
          />
        </span>
      ))}
      
      {/* Add keyframes style for ripple animation */}
      <style>{`
        @keyframes ripple {
          0% {
            width: 0;
            height: 0;
            opacity: 0.6;
          }
          100% {
            width: 300px;
            height: 300px;
            opacity: 0;
          }
        }
      `}</style>
    </animated.button>
  );
}

// Specialized mobile-friendly FAB (Floating Action Button)
interface FABProps {
  onClick: () => void;
  icon: React.ReactNode;
  label?: string;
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center';
  className?: string;
  variant?: 'primary' | 'secondary' | 'glass';
  hapticFeedback?: boolean;
  hapticIntensity?: 'light' | 'medium' | 'heavy';
  animationStyle?: 'scale' | 'bounce' | 'ripple' | 'pulse' | 'none';
}

export function FAB({
  onClick,
  icon,
  label,
  position = 'bottom-right',
  className = '',
  variant = 'primary',
  hapticFeedback = true,
  hapticIntensity = 'medium',
  animationStyle = 'scale',
}: FABProps) {
  // State for animations
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [ripples, setRipples] = useState<Array<{ id: number }>>([]);
  const fabRef = useRef<HTMLButtonElement>(null);
  
  // Haptic feedback hook
  const triggerHaptic = useHaptic();
  
  // Animation with react-spring
  const springProps = useSpring({
    scale: isPressed ? 
      (animationStyle === 'scale' ? 0.9 : animationStyle === 'bounce' ? 0.85 : 1) : 
      (isHovered && animationStyle === 'bounce' ? 1.1 : 1),
    rotate: isHovered && animationStyle === 'bounce' ? 5 : 0,
    shadow: isPressed ? 0 : isHovered ? 24 : 16,
    config: { 
      tension: 300, 
      friction: animationStyle === 'bounce' ? 8 : 10,
    },
  });
  
  // Ripple effect for 'ripple' animation style
  const addRipple = () => {
    if (animationStyle !== 'ripple') return;
    
    const newRipple = { id: Date.now() };
    setRipples(prev => [...prev, newRipple]);
    
    // Remove ripple after animation
    setTimeout(() => {
      setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id));
    }, 1000);
  };
  
  // Pulse animation for 'pulse' style
  useEffect(() => {
    if (animationStyle !== 'pulse') return;
    
    const interval = setInterval(() => {
      setIsPressed(true);
      setTimeout(() => setIsPressed(false), 300);
    }, 3000);
    
    return () => clearInterval(interval);
  }, [animationStyle]);
  
  // Handler for clicks
  const handleClick = (e: React.MouseEvent) => {
    if (hapticFeedback) {
      triggerHaptic({ intensity: hapticIntensity });
    }
    
    if (animationStyle === 'ripple') {
      addRipple();
    }
    
    onClick();
  };
  
  const handleTouch = () => {
    if (hapticFeedback) {
      triggerHaptic({ intensity: hapticIntensity });
    }
    
    if (animationStyle === 'ripple') {
      addRipple();
    }
  };
  
  const positionClasses = {
    'bottom-right': 'bottom-6 right-6 safe-bottom safe-right',
    'bottom-left': 'bottom-6 left-6 safe-bottom safe-left',
    'bottom-center': 'bottom-6 left-1/2 -translate-x-1/2 safe-bottom',
  };
  
  const variantClasses = {
    primary: 'bg-primary dark:bg-blue-600 text-white',
    secondary: 'bg-white dark:bg-gray-800 text-gray-800 dark:text-white border border-gray-200 dark:border-gray-700',
    glass: 'backdrop-blur-md backdrop-saturate-150 bg-white/80 dark:bg-gray-800/60 text-gray-800 dark:text-white border border-white/30 dark:border-gray-700/30',
  };
  
  return (
    <animated.button
      ref={fabRef}
      onClick={handleClick}
      onTouchStart={handleTouch}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onTouchEnd={() => setIsPressed(false)}
      className={`
        fixed z-40 rounded-full touch-manipulation overflow-hidden
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary
        ${label ? 'px-6 py-4' : 'p-4'}
        ${positionClasses[position]}
        ${variantClasses[variant]}
        ${className}
      `}
      style={{
        transform: springProps.scale.to(s => 
          `scale(${s}) ${springProps.rotate.to(r => `rotate(${r}deg)`)}`
        ),
        boxShadow: springProps.shadow.to(s => 
          `0 ${s * 0.03}rem ${s * 0.08}rem rgba(0, 0, 0, 0.2)`
        ),
      }}
      aria-label={label || 'Floating action button'}
    >
      <div className="flex items-center gap-2 relative z-10">
        <div className={`${animationStyle === 'pulse' ? 'animate-pulse' : ''}`}>
          {icon}
        </div>
        {label && <span className="font-medium">{label}</span>}
      </div>
      
      {/* Ripple animations */}
      {animationStyle === 'ripple' && ripples.map(ripple => (
        <span
          key={ripple.id}
          className="absolute inset-0 rounded-full bg-white dark:bg-gray-200 opacity-30 animate-fab-ripple"
        />
      ))}
      
      {/* Add animation styles */}
      <style>{`
        @keyframes fab-ripple {
          0% {
            transform: scale(0);
            opacity: 0.4;
          }
          100% {
            transform: scale(3);
            opacity: 0;
          }
        }
      `}</style>
    </animated.button>
  );
}

// Mobile-optimized segmented control
interface SegmentedControlProps {
  options: { value: string; label: string; icon?: React.ReactNode }[];
  value: string;
  onChange: (value: string) => void;
  fullWidth?: boolean;
  className?: string;
  variant?: 'solid' | 'outline' | 'glass';
  hapticFeedback?: boolean;
  hapticIntensity?: 'light' | 'medium' | 'heavy';
  animationScale?: boolean;
}

export function SegmentedControl({
  options,
  value,
  onChange,
  fullWidth = false,
  className = '',
  variant = 'solid',
  hapticFeedback = true,
  hapticIntensity = 'light',
  animationScale = true,
}: SegmentedControlProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [pressedIndex, setPressedIndex] = useState<number | null>(null);
  
  // Haptic feedback hook
  const triggerHaptic = useHaptic();
  
  // Handle selection change
  const handleSelect = (optionValue: string, index: number) => {
    if (hapticFeedback) {
      triggerHaptic({ intensity: hapticIntensity });
    }
    
    onChange(optionValue);
  };
  
  // Container styling based on variant
  const containerClasses = {
    solid: 'border border-gray-300 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-800',
    outline: 'bg-transparent p-0.5 gap-0.5 overflow-visible', 
    glass: 'backdrop-blur-md backdrop-saturate-150 bg-white/70 dark:bg-gray-800/50 border border-white/30 dark:border-gray-700/30',
  };
  
  // Button styling based on variant and selection
  const getButtonClasses = (isActive: boolean, index: number) => {
    // Base classes
    const base = 'flex-1 py-2 px-4 text-sm font-medium transition-all touch-manipulation relative z-0';
    
    // Focus classes
    const focus = 'focus:outline-none focus:z-10';
    
    // Animation classes
    const animation = animationScale ? 'active:scale-95' : '';
    
    // Variant-specific styling
    const variantStyle = {
      solid: {
        active: 'bg-primary dark:bg-blue-600 text-white',
        inactive: 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700',
        border: index > 0 ? 'border-l border-gray-300 dark:border-gray-700' : '',
      },
      outline: {
        active: 'bg-primary dark:bg-blue-600 text-white shadow-md',
        inactive: 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700',
        border: 'rounded-md',
      },
      glass: {
        active: 'bg-primary/80 dark:bg-blue-600/90 backdrop-blur-md text-white shadow-sm',
        inactive: 'bg-white/70 dark:bg-gray-800/60 text-gray-800 dark:text-gray-200 hover:bg-white/80 dark:hover:bg-gray-700/70',
        border: index > 0 ? 'border-l border-white/20 dark:border-gray-700/30' : '',
      },
    };
    
    return [
      base,
      focus,
      animation,
      isActive ? variantStyle[variant].active : variantStyle[variant].inactive,
      variantStyle[variant].border,
    ].join(' ');
  };
  
  return (
    <div
      className={`
        inline-flex rounded-lg
        ${containerClasses[variant]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      role="group"
    >
      {options.map((option, index) => {
        const isActive = value === option.value;
        const isHovered = hoveredIndex === index;
        const isPressed = pressedIndex === index;
        
        return (
          <button
            key={option.value}
            onClick={() => handleSelect(option.value, index)}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
            onMouseDown={() => setPressedIndex(index)}
            onMouseUp={() => setPressedIndex(null)}
            onTouchStart={() => {
              setPressedIndex(index);
              if (hapticFeedback) {
                triggerHaptic({ intensity: hapticIntensity });
              }
            }}
            onTouchEnd={() => setPressedIndex(null)}
            className={getButtonClasses(isActive, index)}
            style={{
              transform: isPressed && animationScale ? 'scale(0.97)' : 'scale(1)',
              transition: 'transform 0.2s, background-color 0.2s, color 0.2s',
            }}
          >
            <div className="flex items-center justify-center gap-2">
              {option.icon && (
                <div 
                  className={`transition-transform ${isActive ? 'scale-110' : isHovered ? 'scale-105' : 'scale-100'}`}
                >
                  {option.icon}
                </div>
              )}
              <span>{option.label}</span>
            </div>
            
            {variant === 'outline' && isActive && (
              <div 
                className="absolute inset-0 rounded-md pointer-events-none"
                style={{
                  boxShadow: '0 0 0 2px rgba(var(--primary), 0.5)',
                  zIndex: -1,
                }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}