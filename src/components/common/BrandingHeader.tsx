import React from 'react';
import { Box, Typography } from '@mui/material';
import { motion } from 'framer-motion';

interface BrandingHeaderProps {
  compact?: boolean;
  showSapFiori?: boolean;
  large?: boolean;
  centered?: boolean;
  animate?: boolean;
}

/**
 * A reusable component for displaying SCB and SAP Fiori branding together
 * Enhanced with Apple-inspired design aesthetics
 * 
 * @param compact - Smaller size variant for constrained spaces
 * @param showSapFiori - Whether to display the SAP Fiori badge
 * @param large - Large display for splash screens
 * @param centered - Center align all elements
 * @param animate - Enable subtle animations (Apple-style)
 */
const BrandingHeader: React.FC<BrandingHeaderProps> = ({ 
  compact = false,
  showSapFiori = true,
  large = false,
  centered = false,
  animate = false
}) => {
  // Determine sizes based on mode
  let logoHeight = 40;
  let titleVariant = "h6";
  
  if (large) {
    logoHeight = 80;
    titleVariant = "h4";
  } else if (compact) {
    logoHeight = 24;
    titleVariant = "subtitle1";
  }
  
  // Apple-style drop shadow and transitions
  const appleLogoStyles = {
    filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))',
    transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    height: logoHeight,
    mr: large ? 2 : 1.5,
    ...(animate && { transform: 'translateZ(0)' }) // Hardware acceleration
  };
  
  // Apple-style typography
  const appleTitleStyles = {
    fontWeight: large ? 600 : 500, // SF Pro-inspired weights
    color: '#042278',
    letterSpacing: large ? '-0.022em' : '-0.01em', // SF Pro-style kerning
    textRendering: 'optimizeLegibility', // Apple-style text rendering
    fontSize: {
      xs: large ? '1.75rem' : compact ? '0.9rem' : '1.1rem', 
      md: large ? '2rem' : compact ? '1rem' : '1.25rem'
    },
    lineHeight: large ? 1.15 : 1.2, // Apple's tighter line heights
  };
  
  // Apple-style badge with ultra-thin border and subtle shadow
  const appleBadgeStyles = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(240, 240, 240, 0.8)', // More translucent
    backdropFilter: 'blur(8px)', // Apple-style blur
    WebkitBackdropFilter: 'blur(8px)', // Safari support
    borderRadius: '6px', // Apple's rounded corners
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)', // Subtle shadow
    border: '0.5px solid rgba(0, 0, 0, 0.05)', // Ultra-thin border
    px: large ? 2 : 1.5,
    py: large ? 0.5 : 0.25,
    mt: large ? 2 : 0.5,
    alignSelf: centered ? 'center' : 'flex-start',
    ml: (!centered && !compact && !large) ? 2 : 0,
    transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)', // Apple spring physics
    '&:hover': animate ? {
      transform: 'scale(1.02)',
      boxShadow: '0 2px 5px rgba(0, 0, 0, 0.05)'
    } : {}
  };
  
  // Apple-style animations
  const logoAnimations = animate ? {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] }
  } : {};
  
  const textAnimations = animate ? {
    initial: { opacity: 0, y: 5 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, delay: 0.1, ease: [0.23, 1, 0.32, 1] }
  } : {};
  
  const badgeAnimations = animate ? {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.4, delay: 0.2, ease: [0.23, 1, 0.32, 1] }
  } : {};
  
  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: centered ? 'center' : 'flex-start',
      width: '100%',
      className: 'branding-header'
    }}>
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center',
        justifyContent: centered ? 'center' : 'flex-start',
        width: '100%'
      }}>
        {/* SCB Logo */}
        {animate ? (
          <motion.div {...logoAnimations}>
            <Box
              component="img"
              src="/images/sc-logo.png"
              alt="Standard Chartered Bank"
              className="scb-logo"
              sx={appleLogoStyles}
            />
          </motion.div>
        ) : (
          <Box
            component="img"
            src="/images/sc-logo.png"
            alt="Standard Chartered Bank"
            className="scb-logo"
            sx={appleLogoStyles}
          />
        )}
        
        {/* App Name */}
        {animate ? (
          <motion.div {...textAnimations}>
            <Typography 
              variant={titleVariant} 
              component={large ? "h1" : "div"}
              sx={appleTitleStyles}
            >
              Finsight
            </Typography>
          </motion.div>
        ) : (
          <Typography 
            variant={titleVariant} 
            component={large ? "h1" : "div"}
            sx={appleTitleStyles}
          >
            Finsight
          </Typography>
        )}
      </Box>
      
      {/* SAP Fiori Badge */}
      {showSapFiori && (
        animate ? (
          <motion.div {...badgeAnimations}>
            <Box
              className="sap-fiori-badge"
              sx={appleBadgeStyles}
            >
              <Typography
                variant={large ? "body2" : "caption"}
                sx={{
                  fontWeight: 500, // SF Pro Medium
                  color: '#0a6ed1', // SAP Fiori blue
                  letterSpacing: '-0.01em'
                }}
              >
                Powered by SAP Fiori
              </Typography>
            </Box>
          </motion.div>
        ) : (
          <Box
            className="sap-fiori-badge"
            sx={appleBadgeStyles}
          >
            <Typography
              variant={large ? "body2" : "caption"}
              sx={{
                fontWeight: 500, // SF Pro Medium
                color: '#0a6ed1', // SAP Fiori blue
                letterSpacing: '-0.01em'
              }}
            >
              Powered by SAP Fiori
            </Typography>
          </Box>
        )
      )}
    </Box>
  );
};

export default BrandingHeader;