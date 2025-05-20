import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Box, Typography, IconButton, Divider, Avatar } from '@mui/material';
import JouleAssistant from './JouleAssistant';

/**
 * EnhancedJouleContainer
 * 
 * Premium SAP Joule-inspired container that follows all SAP Fiori 
 * design principles while adding luxury touches for an exceptional
 * experience that positions Joule as a world-class AI assistant.
 */
interface EnhancedJouleContainerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialNewsItem?: any;
}

const EnhancedJouleContainer: React.FC<EnhancedJouleContainerProps> = ({ 
  open, 
  onOpenChange, 
  initialNewsItem 
}) => {
  const [animationComplete, setAnimationComplete] = useState(false);
  const [tooltipVisible, setTooltipVisible] = useState(false);

  // Reset animation state when closed
  useEffect(() => {
    if (!open) {
      setTimeout(() => setAnimationComplete(false), 500);
    }
  }, [open]);

  // SAP Fiori color palette
  const sapColor = {
    fioriBlue: '#0a6ed1',
    jouleLight: '#cc00dc',
    jouleDark: '#9700a3',
    surfaceLight: 'rgba(255, 255, 255, 0.95)',
    neutral: '#6a6d70',
    lightShade: '#f5f6f7',
    border: 'rgba(0, 0, 0, 0.08)'
  };

  // Fiori-inspired animations
  const panelVariants = {
    hidden: { 
      x: '100%', 
      opacity: 0.5,
      boxShadow: '0px 0px 0px rgba(0, 0, 0, 0)' 
    },
    visible: { 
      x: 0, 
      opacity: 1,
      boxShadow: '-5px 0px 25px rgba(0, 0, 0, 0.15)',
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 30,
        mass: 1,
        delayChildren: 0.15,
        staggerChildren: 0.1
      }
    },
    exit: { 
      x: '100%', 
      opacity: 0,
      boxShadow: '0px 0px 0px rgba(0, 0, 0, 0)',
      transition: { 
        type: 'spring',
        stiffness: 400,
        damping: 40,
        mass: 0.8
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 500,
        damping: 25
      }
    }
  };

  // Joule particle effect configuration
  const particles = Array.from({ length: 15 }).map((_, i) => ({
    id: i,
    size: 2 + Math.random() * 4,
    x: Math.random() * 100,
    y: Math.random() * 100,
    duration: 3 + Math.random() * 4,
    delay: Math.random() * 2
  }));

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-y-0 right-0 z-50 flex"
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={panelVariants}
          onAnimationComplete={() => setAnimationComplete(true)}
        >
          {/* Main Joule Panel */}
          <Box
            sx={{
              width: { xs: '100vw', sm: '450px' },
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              bgcolor: sapColor.surfaceLight,
              borderLeft: `1px solid ${sapColor.border}`,
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              overflowY: 'hidden',
              position: 'relative'
            }}
          >
            {/* Joule Header */}
            <Box
              sx={{
                px: 3,
                py: 2.5,
                background: `linear-gradient(135deg, ${sapColor.jouleDark} 0%, ${sapColor.jouleLight} 100%)`,
                color: 'white',
                position: 'relative',
                overflow: 'hidden',
                borderBottom: '1px solid rgba(0,0,0,0.1)'
              }}
            >
              {/* Particle Animation Effect */}
              <Box sx={{ position: 'absolute', inset: 0, overflow: 'hidden', opacity: 0.5 }}>
                {particles.map(particle => (
                  <Box
                    key={particle.id}
                    component={motion.div}
                    sx={{
                      position: 'absolute',
                      width: particle.size,
                      height: particle.size,
                      borderRadius: '50%',
                      backgroundColor: 'rgba(255,255,255,0.8)',
                      filter: 'blur(0.5px)',
                    }}
                    initial={{ 
                      x: `${particle.x}%`, 
                      y: `${particle.y}%`, 
                      opacity: 0 
                    }}
                    animate={{ 
                      y: '-100%',
                      opacity: [0, 0.8, 0],
                      transition: {
                        duration: particle.duration,
                        delay: particle.delay,
                        repeat: Infinity,
                        ease: 'linear'
                      }
                    }}
                  />
                ))}
              </Box>
              
              <motion.div
                className="flex justify-between items-start"
                variants={itemVariants}
              >
                <div className="flex items-center">
                  {/* Joule Avatar */}
                  <Avatar
                    sx={{
                      bgcolor: 'white',
                      color: sapColor.jouleLight,
                      width: 40,
                      height: 40,
                      mr: 2,
                      fontWeight: 700,
                      fontSize: '1.2rem',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                    }}
                  >
                    J
                  </Avatar>
                  
                  <div>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 600,
                        fontSize: '1.25rem',
                        letterSpacing: '-0.01em',
                        mb: 0.5
                      }}
                    >
                      Joule
                    </Typography>
                    
                    <motion.div
                      variants={itemVariants}
                      className="flex items-center"
                    >
                      <Typography 
                        variant="caption"
                        sx={{ 
                          opacity: 0.9,
                          fontSize: '0.7rem',
                          letterSpacing: 0.2,
                          mr: 1
                        }}
                      >
                        POWERED BY
                      </Typography>
                      <Box
                        sx={{
                          backgroundColor: 'white',
                          color: sapColor.fioriBlue,
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          px: 1.2,
                          py: 0.3,
                          borderRadius: '4px',
                          letterSpacing: '-0.01em',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                          position: 'relative',
                          '&:hover': {
                            transform: 'scale(1.03)',
                            transition: 'transform 0.2s ease'
                          }
                        }}
                        onMouseEnter={() => setTooltipVisible(true)}
                        onMouseLeave={() => setTooltipVisible(false)}
                      >
                        SAP Fiori
                        
                        {/* SAP Fiori Tooltip */}
                        <AnimatePresence>
                          {tooltipVisible && (
                            <motion.div
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 5 }}
                              className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-50 w-56 p-2 rounded-lg shadow-lg"
                              style={{
                                backgroundColor: 'rgba(255,255,255,0.95)',
                                backdropFilter: 'blur(8px)',
                                border: '0.5px solid rgba(0,0,0,0.1)'
                              }}
                            >
                              <Typography
                                variant="caption"
                                sx={{ 
                                  display: 'block', 
                                  color: 'text.primary',
                                  fontSize: '0.7rem',
                                  fontWeight: 500
                                }}
                              >
                                SAP Fiori is the design system that brings great user experiences to enterprise software, creating harmony through business applications.
                              </Typography>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </Box>
                    </motion.div>
                  </div>
                </div>
                
                {/* Close Button */}
                <IconButton
                  onClick={() => onOpenChange(false)}
                  sx={{
                    color: 'white',
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,0.15)'
                    },
                    transition: 'background-color 0.2s ease',
                    padding: 1
                  }}
                  size="small"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </IconButton>
              </motion.div>
              
              {/* AI Capabilities */}
              <motion.div 
                className="flex flex-wrap gap-2 mt-3"
                variants={itemVariants}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    bgcolor: 'rgba(255,255,255,0.2)',
                    borderRadius: '100px',
                    px: 1.5,
                    py: 0.5,
                    fontSize: '0.675rem',
                    backdropFilter: 'blur(4px)',
                    WebkitBackdropFilter: 'blur(4px)'
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                  </svg>
                  SCB Data Integration
                </Box>
                
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    bgcolor: 'rgba(255,255,255,0.2)',
                    borderRadius: '100px',
                    px: 1.5,
                    py: 0.5,
                    fontSize: '0.675rem',
                    backdropFilter: 'blur(4px)',
                    WebkitBackdropFilter: 'blur(4px)'
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                    <line x1="22" y1="12" x2="2" y2="12"></line>
                    <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path>
                    <line x1="6" y1="16" x2="6.01" y2="16"></line>
                    <line x1="10" y1="16" x2="10.01" y2="16"></line>
                  </svg>
                  Real-time Analytics
                </Box>
                
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    bgcolor: 'rgba(255,255,255,0.2)',
                    borderRadius: '100px',
                    px: 1.5,
                    py: 0.5,
                    fontSize: '0.675rem',
                    backdropFilter: 'blur(4px)',
                    WebkitBackdropFilter: 'blur(4px)'
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                    <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"></path>
                    <line x1="16" y1="8" x2="2" y2="22"></line>
                    <line x1="17.5" y1="15" x2="9" y2="15"></line>
                  </svg>
                  Enterprise Security
                </Box>
              </motion.div>
            </Box>
            
            {/* CRISP Design Badge - SAP Fiori Hallmark */}
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                right: 0,
                transform: 'translate(40%, -40%) rotate(45deg)',
                width: 120,
                height: 16,
                bgcolor: sapColor.fioriBlue,
                color: 'white',
                fontSize: '0.6rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                letterSpacing: '0.05em',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                zIndex: 1
              }}
            >
              CRISP DESIGN
            </Box>
            
            {/* Content */}
            <Box
              sx={{
                flex: 1,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              {animationComplete && (
                <JouleAssistant 
                  open={open} 
                  onOpenChange={onOpenChange} 
                  initialNewsItem={initialNewsItem}
                />
              )}
            </Box>
          </Box>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default EnhancedJouleContainer;