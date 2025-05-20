import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Chip, 
  Divider,
  useTheme,
  alpha,
  IconButton
} from '@mui/material';
import { useSpring, animated, config } from '@react-spring/web';
import { 
  ChartIcon, 
  FinanceIcon, 
  SparklesIcon, 
  TrendIcon,
  ChevronIcon
} from '../icons';

export interface EnhancedFinanceCardProps {
  title: string;
  value: string | number;
  previousValue?: string | number;
  change?: number;
  changeType?: 'percentage' | 'absolute';
  changeLabel?: string;
  icon?: React.ReactNode;
  iconType?: 'finance' | 'chart' | 'trend';
  iconVariant?: string;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  tags?: string[];
  aiEnhanced?: boolean;
  variant?: 'default' | 'fiori' | 'dashboard';
  size?: 'small' | 'medium' | 'large';
  onClick?: () => void;
  hoverEffect?: boolean;
  expandable?: boolean;
  footerContent?: React.ReactNode;
  style?: React.CSSProperties;
  backgroundColor?: string;
  status?: 'default' | 'success' | 'warning' | 'error' | 'info';
}

const EnhancedFinanceCard: React.FC<EnhancedFinanceCardProps> = ({
  title,
  value,
  previousValue,
  change,
  changeType = 'percentage',
  changeLabel,
  icon,
  iconType = 'finance',
  iconVariant = 'currency',
  subtitle,
  trend = 'neutral',
  tags = [],
  aiEnhanced = false,
  variant = 'default',
  size = 'medium',
  onClick,
  hoverEffect = true,
  expandable = false,
  footerContent,
  style = {},
  backgroundColor,
  status = 'default',
}) => {
  const theme = useTheme();
  const [isHovered, setIsHovered] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Handle hover
  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => setIsHovered(false);
  
  // Handle expand/collapse
  const handleExpandToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };
  
  // Handle click
  const handleClick = () => {
    if (onClick) onClick();
  };
  
  // Size mappings
  const sizeMap = {
    small: {
      p: 1.5,
      titleSize: 'body2',
      valueSize: 'h6',
      iconSize: 24,
      chipSize: 'small',
    },
    medium: {
      p: 2.5,
      titleSize: 'subtitle2',
      valueSize: 'h5',
      iconSize: 32,
      chipSize: 'medium',
    },
    large: {
      p: 3,
      titleSize: 'subtitle1',
      valueSize: 'h4',
      iconSize: 40,
      chipSize: 'medium',
    },
  };
  
  const currentSize = sizeMap[size];
  
  // Get color scheme based on status
  const getStatusColors = () => {
    switch (status) {
      case 'success':
        return { main: theme.palette.success.main, light: alpha(theme.palette.success.main, 0.1) };
      case 'warning':
        return { main: theme.palette.warning.main, light: alpha(theme.palette.warning.main, 0.1) };
      case 'error':
        return { main: theme.palette.error.main, light: alpha(theme.palette.error.main, 0.1) };
      case 'info':
        return { main: theme.palette.info.main, light: alpha(theme.palette.info.main, 0.1) };
      default:
        return { main: '#042278', light: alpha('#042278', 0.07) };
    }
  };
  
  const statusColors = getStatusColors();
  
  // Get trend-related colors and icons
  const trendColor = trend === 'up' 
    ? theme.palette.success.main 
    : trend === 'down' 
      ? theme.palette.error.main 
      : theme.palette.text.secondary;
  
  // Different styling based on variant
  const isFiori = variant === 'fiori';
  const isDashboard = variant === 'dashboard';
  
  // Get background color
  const bgColor = backgroundColor || (isFiori 
    ? '#f5f7f9' 
    : isDashboard 
      ? alpha(statusColors.light, 0.7)
      : '#fff');
  
  // Spring animations
  const cardSpring = useSpring({
    transform: hoverEffect && isHovered ? 'translateY(-4px)' : 'translateY(0px)',
    boxShadow: hoverEffect && isHovered 
      ? '0 8px 24px rgba(0,0,0,0.12)' 
      : '0 2px 12px rgba(0,0,0,0.08)',
    config: config.wobbly,
  });
  
  const valueSpring = useSpring({
    number: typeof value === 'number' ? value : 0,
    from: { number: typeof previousValue === 'number' ? previousValue : 0 },
    config: { tension: 300, friction: 30 },
  });
  
  const iconSpring = useSpring({
    transform: isHovered ? 'scale(1.1)' : 'scale(1.0)',
    config: config.wobbly,
  });
  
  const expandSpring = useSpring({
    transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
    config: { tension: 300, friction: 30 },
  });
  
  const expandedContentSpring = useSpring({
    opacity: isExpanded ? 1 : 0,
    height: isExpanded ? 'auto' : 0,
    config: { tension: 300, friction: 30 },
  });
  
  // Generate the appropriate icon
  const renderIcon = () => {
    if (icon) return icon;
    
    switch (iconType) {
      case 'chart':
        return (
          <ChartIcon
            size={currentSize.iconSize}
            variant={iconVariant as any || 'bar'}
            animation={isHovered ? 'pulse' : 'none'}
            color={statusColors.main}
          />
        );
      case 'trend':
        return (
          <TrendIcon
            size={currentSize.iconSize}
            variant={(trend === 'down' ? 'down' : 'up') as any}
            animation={isHovered ? 'pulse' : 'none'}
            color={statusColors.main}
          />
        );
      default:
        return (
          <FinanceIcon
            size={currentSize.iconSize}
            variant={iconVariant as any || 'currency'}
            animation={isHovered ? 'pulse' : 'none'}
            color={statusColors.main}
          />
        );
    }
  };
  
  // Trend indicator component
  const TrendIndicator = () => {
    if (change === undefined) return null;
    
    const isPositive = change >= 0;
    const formattedChange = changeType === 'percentage'
      ? `${isPositive ? '+' : ''}${change.toFixed(1)}%`
      : `${isPositive ? '+' : ''}${change.toLocaleString()}`;
    
    return (
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        mt: 0.5, 
        color: isPositive ? theme.palette.success.main : theme.palette.error.main 
      }}>
        <TrendIcon
          size={16}
          variant={isPositive ? 'up' : 'down'}
          animation={isHovered ? 'pulse' : 'none'}
          color="currentColor"
        />
        <Typography 
          variant="caption" 
          sx={{ ml: 0.5, fontWeight: 600 }}
        >
          {formattedChange}
          {changeLabel && <span style={{ color: theme.palette.text.secondary, fontWeight: 'normal' }}> {changeLabel}</span>}
        </Typography>
      </Box>
    );
  };
  
  const AnimatedCard = animated(Paper);
  const AnimatedBox = animated(Box);
  
  return (
    <AnimatedCard
      style={{ ...cardSpring, ...style }}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      elevation={0}
      sx={{
        borderRadius: isFiori ? 0 : 1,
        border: isFiori ? `1px solid ${theme.palette.divider}` : '1px solid transparent',
        backgroundColor: bgColor,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'background-color 0.3s',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Fiori-style top accent */}
      {isFiori && (
        <Box 
          sx={{ 
            height: 3, 
            width: '100%', 
            backgroundColor: statusColors.main, 
            position: 'absolute', 
            top: 0, 
            left: 0,
          }} 
        />
      )}
      
      {/* Card Content */}
      <Box sx={{ p: currentSize.p, pt: isFiori ? currentSize.p + 0.5 : currentSize.p }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          {/* Title and Value */}
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography 
                variant={currentSize.titleSize as any} 
                color="text.secondary"
                sx={{ fontWeight: 500 }}
              >
                {title}
              </Typography>
              
              {aiEnhanced && (
                <SparklesIcon 
                  size={14} 
                  style={{ marginLeft: 6 }} 
                  animation={isHovered ? 'pulse' : 'none'} 
                  color="#31ddc1"
                />
              )}
            </Box>
            
            <Box sx={{ mt: 0.5, display: 'flex', alignItems: 'baseline' }}>
              <Typography 
                variant={currentSize.valueSize as any} 
                sx={{ 
                  fontWeight: 600, 
                  color: theme.palette.text.primary,
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  maxWidth: '100%',
                }}
              >
                {typeof value === 'number' 
                  ? animated.span(
                    // @ts-ignore
                    { children: valueSpring.number.to(n => n.toLocaleString(undefined, { maximumFractionDigits: 2 })) })
                  : value}
              </Typography>
            </Box>
            
            {/* Subtitle */}
            {subtitle && (
              <Typography 
                variant="caption" 
                color="text.secondary"
                sx={{ display: 'block', mt: 0.5 }}
              >
                {subtitle}
              </Typography>
            )}
            
            {/* Trend Indicator */}
            <TrendIndicator />
          </Box>
          
          {/* Icon */}
          <AnimatedBox style={iconSpring} sx={{ ml: 2 }}>
            {renderIcon()}
          </AnimatedBox>
        </Box>
        
        {/* Tags */}
        {tags.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 2 }}>
            {tags.map((tag, index) => (
              <Chip
                key={index}
                label={tag}
                size="small"
                variant={isFiori ? "outlined" : "filled"}
                sx={{
                  backgroundColor: isFiori ? 'transparent' : alpha(statusColors.main, 0.1),
                  color: isFiori ? statusColors.main : theme.palette.text.primary,
                  borderColor: isFiori ? statusColors.main : 'transparent',
                  height: 20,
                  '& .MuiChip-label': {
                    px: 1,
                    fontSize: '0.625rem',
                  },
                }}
              />
            ))}
          </Box>
        )}
        
        {/* Expandable content toggle */}
        {expandable && (
          <>
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1, cursor: 'pointer' }}>
              <IconButton size="small" onClick={handleExpandToggle}>
                <animated.div style={expandSpring}>
                  <ChevronIcon direction="down" size={20} animation="none" />
                </animated.div>
              </IconButton>
            </Box>
            
            {/* Expanded content */}
            <animated.div style={expandedContentSpring}>
              <Box sx={{ mt: 1 }}>
                <Divider sx={{ my: 1 }} />
                {footerContent}
              </Box>
            </animated.div>
          </>
        )}
      </Box>
    </AnimatedCard>
  );
};

export default EnhancedFinanceCard;