/**
 * SCB Animation System
 * 
 * This file defines standardized animations to be used across
 * all components for a consistent motion language.
 * 
 * Animations are organized by:
 * - Type (fade, slide, scale, etc.)
 * - Motion characteristics (timing, easing)
 * - Device adaptations (including reduced motion)
 */
import tokens from './tokens';

// Define function to create CSS keyframes string
const createKeyframes = (name: string, frames: string) => `
@keyframes ${name} {
  ${frames}
}`;

// Define function to create CSS animation
const createAnimation = (
  name: string, 
  duration: string = tokens.animation.duration.normal, 
  easing: string = tokens.animation.ease.inOut, 
  fillMode: string = 'both',
  delay: string = '0ms'
) => `
.animate-${name} {
  animation-name: ${name};
  animation-duration: ${duration};
  animation-timing-function: ${easing};
  animation-fill-mode: ${fillMode};
  animation-delay: ${delay};
}

@media (prefers-reduced-motion: reduce) {
  .animate-${name} {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
`;

// Helper for device-specific animations
const createDeviceVariant = (
  name: string, 
  device: string, 
  duration: string,
  easing: string = tokens.animation.ease.appleInOut
) => `
.animate-${name}-${device} {
  animation-name: ${name};
  animation-duration: ${duration};
  animation-timing-function: ${easing};
  animation-fill-mode: both;
}
`;

// =============================================================================
// KEYFRAME DEFINITIONS
// =============================================================================

// Fade animations
export const fadeInKeyframes = createKeyframes('fadeIn', `
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`);

export const fadeOutKeyframes = createKeyframes('fadeOut', `
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
`);

export const fadeInUpKeyframes = createKeyframes('fadeInUp', `
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`);

export const fadeInDownKeyframes = createKeyframes('fadeInDown', `
  from {
    opacity: 0;
    transform: translateY(-16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`);

// Slide animations
export const slideInRightKeyframes = createKeyframes('slideInRight', `
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
`);

export const slideOutRightKeyframes = createKeyframes('slideOutRight', `
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(100%);
  }
`);

export const slideInLeftKeyframes = createKeyframes('slideInLeft', `
  from {
    transform: translateX(-100%);
  }
  to {
    transform: translateX(0);
  }
`);

export const slideOutLeftKeyframes = createKeyframes('slideOutLeft', `
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(-100%);
  }
`);

// Scale animations
export const scaleInKeyframes = createKeyframes('scaleIn', `
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
`);

export const scaleOutKeyframes = createKeyframes('scaleOut', `
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(0.95);
  }
`);

// Specialized animations
export const pulseKeyframes = createKeyframes('pulse', `
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.05);
  }
`);

export const spinKeyframes = createKeyframes('spin', `
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`);

export const shimmerKeyframes = createKeyframes('shimmer', `
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
`);

// Button feedback animations
export const buttonPressKeyframes = createKeyframes('buttonPress', `
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(0.97);
  }
  100% {
    transform: scale(1);
  }
`);

// Ripple effect animation
export const rippleKeyframes = createKeyframes('ripple', `
  0% {
    transform: scale(0);
    opacity: 0.5;
  }
  100% {
    transform: scale(2);
    opacity: 0;
  }
`);

// =============================================================================
// ANIMATION DEFINITIONS
// =============================================================================

// Basic animations
export const fadeIn = createAnimation('fadeIn', tokens.animation.duration.normal);
export const fadeOut = createAnimation('fadeOut', tokens.animation.duration.normal);
export const fadeInUp = createAnimation('fadeInUp', tokens.animation.duration.normal);
export const fadeInDown = createAnimation('fadeInDown', tokens.animation.duration.normal);

export const slideInRight = createAnimation('slideInRight', tokens.animation.duration.normal);
export const slideOutRight = createAnimation('slideOutRight', tokens.animation.duration.normal);
export const slideInLeft = createAnimation('slideInLeft', tokens.animation.duration.normal);
export const slideOutLeft = createAnimation('slideOutLeft', tokens.animation.duration.normal);

export const scaleIn = createAnimation('scaleIn', tokens.animation.duration.normal);
export const scaleOut = createAnimation('scaleOut', tokens.animation.duration.normal);

export const pulse = createAnimation('pulse', tokens.animation.duration.slow, tokens.animation.ease.inOut, 'both', '0ms');
export const spin = createAnimation('spin', tokens.animation.duration.slower, 'linear', 'none', '0ms');
export const shimmer = createAnimation('shimmer', '1.5s', 'linear', 'none', '0ms');

export const buttonPress = createAnimation('buttonPress', tokens.animation.duration.fast, tokens.animation.ease.inOut);
export const ripple = createAnimation('ripple', tokens.animation.duration.normal, tokens.animation.ease.out);

// Device-specific animation variants
export const fadeInIOS = createDeviceVariant('fadeIn', 'ios', tokens.animation.duration.fast, tokens.animation.ease.appleOut);
export const fadeOutIOS = createDeviceVariant('fadeOut', 'ios', tokens.animation.duration.fast, tokens.animation.ease.appleIn);

export const slideInRightIOS = createDeviceVariant('slideInRight', 'ios', tokens.animation.duration.normal, tokens.animation.ease.appleOut);
export const slideOutRightIOS = createDeviceVariant('slideOutRight', 'ios', tokens.animation.duration.normal, tokens.animation.ease.appleIn);

export const scaleInIOS = createDeviceVariant('scaleIn', 'ios', tokens.animation.duration.fast, tokens.animation.ease.appleOut);
export const scaleOutIOS = createDeviceVariant('scaleOut', 'ios', tokens.animation.duration.fast, tokens.animation.ease.appleIn);

// Combined keyframes and animations
export const animations = `
${fadeInKeyframes}
${fadeOutKeyframes}
${fadeInUpKeyframes}
${fadeInDownKeyframes}
${slideInRightKeyframes}
${slideOutRightKeyframes}
${slideInLeftKeyframes}
${slideOutLeftKeyframes}
${scaleInKeyframes}
${scaleOutKeyframes}
${pulseKeyframes}
${spinKeyframes}
${shimmerKeyframes}
${buttonPressKeyframes}
${rippleKeyframes}

${fadeIn}
${fadeOut}
${fadeInUp}
${fadeInDown}
${slideInRight}
${slideOutRight}
${slideInLeft}
${slideOutLeft}
${scaleIn}
${scaleOut}
${pulse}
${spin}
${shimmer}
${buttonPress}
${ripple}

${fadeInIOS}
${fadeOutIOS}
${slideInRightIOS}
${slideOutRightIOS}
${scaleInIOS}
${scaleOutIOS}

/* Animation utilities */
.animate-once {
  animation-iteration-count: 1;
}

.animate-twice {
  animation-iteration-count: 2;
}

.animate-infinite {
  animation-iteration-count: infinite;
}

.animation-reverse {
  animation-direction: reverse;
}

.animation-alternate {
  animation-direction: alternate;
}

.animation-delay-100 {
  animation-delay: 100ms;
}

.animation-delay-200 {
  animation-delay: 200ms;
}

.animation-delay-300 {
  animation-delay: 300ms;
}

.animation-delay-500 {
  animation-delay: 500ms;
}

.animation-delay-700 {
  animation-delay: 700ms;
}

.animation-delay-1000 {
  animation-delay: 1000ms;
}

/* Network-aware animation classes */
.network-slow .animate-fadeIn,
.network-slow .animate-fadeInUp,
.network-slow .animate-scaleIn,
.network-slow .animate-slideInRight {
  animation-duration: 10ms !important;
}
`;

// =============================================================================
// EXPORTS
// =============================================================================

export default {
  animations,
  // Add specific animation functions here that can be imported individually
  createKeyframes,
  createAnimation,
};