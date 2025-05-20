import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  IconButton,
  Collapse,
  Paper,
  Divider,
  useTheme,
  useMediaQuery,
  Chip
} from '@mui/material';
import { useSpring, animated } from '@react-spring/web';
import { ChevronIcon, NavIcon, SparklesIcon } from '../icons';
import SCBrandedLogo from '../SCBrandedLogo';

export interface HeaderAction {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
  badge?: number | string;
}

export interface ExpandableHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: string[];
  actions?: HeaderAction[];
  tags?: string[];
  expanded?: boolean;
  defaultExpanded?: boolean;
  onExpandToggle?: (expanded: boolean) => void;
  contextualHelp?: string;
  variant?: 'default' | 'fiori' | 'compact';
}

const ExpandableHeader: React.FC<ExpandableHeaderProps> = ({
  title,
  subtitle,
  breadcrumbs = [],
  actions = [],
  tags = [],
  expanded: controlledExpanded,
  defaultExpanded = true,
  onExpandToggle,
  contextualHelp,
  variant = 'default',
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [uncontrolledExpanded, setUncontrolledExpanded] = useState(defaultExpanded);
  
  // Use controlled or uncontrolled expanded state
  const expanded = controlledExpanded !== undefined ? controlledExpanded : uncontrolledExpanded;

  // Handle toggle
  const handleToggle = () => {
    const newExpandedState = !expanded;
    if (controlledExpanded === undefined) {
      setUncontrolledExpanded(newExpandedState);
    }
    if (onExpandToggle) {
      onExpandToggle(newExpandedState);
    }
  };

  // Animation for expand/collapse
  const chevronProps = useSpring({
    transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
    config: { tension: 300, friction: 20 },
  });

  // Animation for header content
  const headerProps = useSpring({
    opacity: 1,
    height: expanded ? 'auto' : isMobile ? 60 : 70,
    from: { opacity: 0, height: expanded ? 'auto' : isMobile ? 60 : 70 },
    config: { tension: 300, friction: 30 },
  });

  const AnimatedBox = animated(Box);
  const AnimatedPaper = animated(Paper);

  // SAP Fiori inspired styles
  const isFiori = variant === 'fiori';
  const headerBackground = isFiori ? '#f5f7f9' : '#fff';
  const accentColor = '#31ddc1';
  const primaryColor = '#042278';

  return (
    <AnimatedPaper
      elevation={isFiori ? 0 : 1}
      sx={{
        mb: 3,
        borderRadius: isFiori ? 0 : 1,
        border: isFiori ? 'none' : `1px solid ${theme.palette.divider}`,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* SAP Fiori style accent border */}
      {isFiori && (
        <Box sx={{ height: 4, width: '100%', backgroundColor: accentColor, position: 'absolute', top: 0, left: 0 }} />
      )}
      
      <AnimatedBox
        style={headerProps}
        sx={{
          p: isMobile ? 2 : 3,
          pt: isFiori ? (isMobile ? 2.5 : 3.5) : (isMobile ? 2 : 3),
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: headerBackground,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Top row with title and toggle */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            {/* Logo only in fiori mode */}
            {isFiori && (
              <Box sx={{ mr: 2, display: { xs: 'none', sm: 'block' } }}>
                <SCBrandedLogo variant="minimal" size="small" animated={false} />
              </Box>
            )}
            
            <Box>
              {/* Breadcrumbs */}
              {breadcrumbs.length > 0 && expanded && (
                <Box sx={{ display: 'flex', mb: 0.5 }}>
                  {breadcrumbs.map((crumb, index) => (
                    <React.Fragment key={index}>
                      <Typography
                        variant="caption"
                        sx={{
                          color: 'text.secondary',
                          '&:hover': { color: primaryColor, cursor: 'pointer' },
                        }}
                      >
                        {crumb}
                      </Typography>
                      {index < breadcrumbs.length - 1 && (
                        <ChevronIcon 
                          size={12} 
                          sx={{ margin: '0 4px' }} 
                          color="text.secondary" 
                          animation="none"
                        />
                      )}
                    </React.Fragment>
                  ))}
                </Box>
              )}
              
              {/* Title */}
              <Typography
                variant={isMobile ? 'h6' : 'h5'}
                component="h1"
                sx={{
                  fontWeight: 600,
                  color: primaryColor,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {title}
                {contextualHelp && (
                  <SparklesIcon 
                    size={20} 
                    sx={{ marginLeft: 8 }} 
                    animation="pulse"
                    color={accentColor}
                  />
                )}
              </Typography>
            </Box>
          </Box>
          
          {/* Expand/collapse button */}
          <animated.div style={chevronProps}>
            <IconButton onClick={handleToggle} size="small" sx={{ ml: 1 }}>
              <ChevronIcon 
                direction="down" 
                size={24} 
                animation="none" 
                hoverEffect="scale"
              />
            </IconButton>
          </animated.div>
        </Box>
        
        {/* Content that shows when expanded */}
        <Collapse in={expanded} timeout="auto">
          <Box sx={{ mt: 2 }}>
            {/* Subtitle */}
            {subtitle && (
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ 
                  mb: 2,
                  maxWidth: { xs: '100%', md: '80%', lg: '70%' },
                }}
              >
                {subtitle}
              </Typography>
            )}
            
            {/* Tags */}
            {tags.length > 0 && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                {tags.map((tag, index) => (
                  <Chip
                    key={index}
                    label={tag}
                    size="small"
                    variant={isFiori ? "outlined" : "filled"}
                    sx={{
                      backgroundColor: isFiori ? 'transparent' : `${accentColor}20`,
                      color: isFiori ? primaryColor : 'text.primary',
                      borderColor: isFiori ? accentColor : 'transparent',
                      '&:hover': {
                        backgroundColor: isFiori ? `${accentColor}10` : `${accentColor}30`,
                      },
                    }}
                  />
                ))}
              </Box>
            )}
            
            {/* Actions */}
            {actions.length > 0 && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
                {actions.map((action, index) => (
                  <Chip
                    key={index}
                    icon={action.icon}
                    label={action.label}
                    onClick={action.onClick}
                    color={action.variant === 'primary' ? 'primary' : 'default'}
                    variant={isFiori ? "outlined" : "filled"}
                    sx={{
                      borderColor: action.variant === 'primary' ? primaryColor : undefined,
                      backgroundColor: action.variant === 'primary' && !isFiori 
                        ? primaryColor 
                        : action.variant === 'secondary' && !isFiori
                          ? `${accentColor}30`
                          : undefined,
                      color: action.variant === 'primary' && !isFiori 
                        ? '#fff' 
                        : action.variant === 'primary' && isFiori
                          ? primaryColor
                          : 'text.primary',
                      '&:hover': {
                        backgroundColor: action.variant === 'primary' && !isFiori 
                          ? `${primaryColor}dd` 
                          : action.variant === 'secondary'
                            ? `${accentColor}40`
                            : undefined,
                      },
                    }}
                    deleteIcon={action.badge ? undefined : null}
                  />
                ))}
              </Box>
            )}
          </Box>
        </Collapse>
      </AnimatedBox>
      
      {/* Optional divider in fiori mode */}
      {isFiori && <Divider />}
    </AnimatedPaper>
  );
};

export default ExpandableHeader;