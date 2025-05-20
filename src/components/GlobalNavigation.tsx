import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Box,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Badge,
  Menu,
  MenuItem,
  Tooltip,
  alpha,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { SCB_COLORS, SCB_TYPOGRAPHY, alphaColor } from '../utils/SCBrandAssets';
import { BrandingHeader } from './common';
import { 
  SparklesIcon,
  ChartIcon,
  DataIcon
} from './icons';

// Icon components
const MenuIcon = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="12" x2="21" y2="12"></line>
    <line x1="3" y1="6" x2="21" y2="6"></line>
    <line x1="3" y1="18" x2="21" y2="18"></line>
  </svg>
);

const DashboardIcon = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"></rect>
    <rect x="14" y="3" width="7" height="7"></rect>
    <rect x="14" y="14" width="7" height="7"></rect>
    <rect x="3" y="14" width="7" height="7"></rect>
  </svg>
);

const AlertsIcon = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
  </svg>
);

const UserIcon = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
);

const SearchIcon = ({ size = 24, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);

/**
 * GlobalNavigation provides a consistent navigation experience across all devices
 * with responsive design for different screen sizes
 */
const GlobalNavigation: React.FC = () => {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [userMenuAnchor, setUserMenuAnchor] = useState(null);
  
  const navItems = [
    { text: 'Dashboard', icon: <DashboardIcon size={20} />, path: '/' },
    { text: 'Unified Dashboard', icon: <SparklesIcon size={20} />, path: '/unified-scb-dashboard' },
    { text: 'Monte Carlo', icon: <ChartIcon variant="chart" size={20} />, path: '/vietnam-monte-carlo' },
    { text: 'Reports', icon: <DataIcon variant="report" size={20} />, path: '/reports' },
    { text: 'Tariff Alerts', icon: <AlertsIcon size={20} />, path: '/tariff-alerts', badge: 3 },
  ];
  
  const toggleDrawer = (open) => (event) => {
    if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
      return;
    }
    setDrawerOpen(open);
  };
  
  const handleUserMenuOpen = (event) => {
    setUserMenuAnchor(event.currentTarget);
  };
  
  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };
  
  const isActive = (path) => {
    if (path === '/') {
      return router.pathname === path;
    }
    return router.pathname.startsWith(path);
  };
  
  return (
    <>
      <AppBar 
        position="sticky" 
        elevation={0}
        sx={{ 
          backgroundColor: SCB_COLORS.WHITE,
          color: SCB_COLORS.PRIMARY,
          borderBottom: '1px solid',
          borderColor: alphaColor(SCB_COLORS.PRIMARY, 0.1),
        }}
      >
        <Toolbar sx={{ minHeight: '64px' }}>
          {/* Mobile Menu Button */}
          {isMobile && (
            <IconButton 
              edge="start" 
              color="inherit" 
              aria-label="menu"
              onClick={toggleDrawer(true)}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          
          {/* Logo and Branding */}
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 0 }}>
            <BrandingHeader compact={isMobile} showSapFiori={false} />
          </Box>
          
          {/* Desktop Navigation */}
          {!isMobile && (
            <Box sx={{ ml: 4, display: 'flex' }}>
              {navItems.map((item) => (
                <Link href={item.path} key={item.text} passHref>
                  <Button
                    component="a"
                    color="inherit"
                    startIcon={item.icon}
                    sx={{ 
                      mx: 0.5, 
                      px: 2,
                      py: 1,
                      borderRadius: '4px',
                      textTransform: 'none',
                      fontWeight: SCB_TYPOGRAPHY.WEIGHT.MEDIUM,
                      color: isActive(item.path) ? SCB_COLORS.PRIMARY : SCB_COLORS.MEDIUM_GREY,
                      backgroundColor: isActive(item.path) ? alphaColor(SCB_COLORS.ACCENT, 0.1) : 'transparent',
                      '&:hover': {
                        backgroundColor: isActive(item.path) ? alphaColor(SCB_COLORS.ACCENT, 0.15) : alphaColor(SCB_COLORS.PRIMARY, 0.05),
                      }
                    }}
                  >
                    {item.badge ? (
                      <Badge badgeContent={item.badge} color="error" sx={{ '& .MuiBadge-badge': { top: -4, right: -8 } }}>
                        {item.text}
                      </Badge>
                    ) : (
                      item.text
                    )}
                  </Button>
                </Link>
              ))}
            </Box>
          )}
          
          <Box sx={{ flexGrow: 1 }} />
          
          {/* Search */}
          <Tooltip title="Search">
            <IconButton color="inherit" sx={{ ml: 1 }}>
              <SearchIcon size={20} />
            </IconButton>
          </Tooltip>
          
          {/* Alerts */}
          <Tooltip title="Notifications">
            <IconButton color="inherit" sx={{ ml: 1 }}>
              <Badge badgeContent={3} color="error">
                <AlertsIcon size={20} />
              </Badge>
            </IconButton>
          </Tooltip>
          
          {/* User Menu */}
          <Box sx={{ ml: 2 }}>
            <Tooltip title="Account">
              <IconButton
                onClick={handleUserMenuOpen}
                size="small"
                aria-controls={Boolean(userMenuAnchor) ? 'account-menu' : undefined}
                aria-haspopup="true"
                aria-expanded={Boolean(userMenuAnchor) ? 'true' : undefined}
                sx={{ 
                  ml: 1,
                  border: '2px solid',
                  borderColor: SCB_COLORS.ACCENT,
                  p: 0.5
                }}
              >
                <UserIcon size={20} color={SCB_COLORS.PRIMARY} />
              </IconButton>
            </Tooltip>
          </Box>
          
          <Menu
            id="account-menu"
            anchorEl={userMenuAnchor}
            open={Boolean(userMenuAnchor)}
            onClose={handleUserMenuClose}
            PaperProps={{
              sx: {
                mt: 1.5,
                minWidth: 200,
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                borderRadius: '8px',
                border: '1px solid',
                borderColor: alphaColor(SCB_COLORS.PRIMARY, 0.1),
              }
            }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <Box sx={{ px: 2, py: 1.5 }}>
              <Typography variant="subtitle2" fontWeight={SCB_TYPOGRAPHY.WEIGHT.BOLD}>
                Matthew Wilson
              </Typography>
              <Typography variant="caption" color={SCB_COLORS.MEDIUM_GREY}>
                SCB Analyst
              </Typography>
            </Box>
            <Divider />
            <MenuItem onClick={handleUserMenuClose}>
              <ListItemIcon>
                <UserIcon size={18} color={SCB_COLORS.PRIMARY} />
              </ListItemIcon>
              Profile
            </MenuItem>
            <MenuItem onClick={handleUserMenuClose}>
              <ListItemIcon>
                <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={SCB_COLORS.PRIMARY} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
              </ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      
      {/* Mobile Drawer */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={toggleDrawer(false)}
        sx={{
          '& .MuiDrawer-paper': {
            width: 280,
            boxSizing: 'border-box',
            borderRight: '1px solid',
            borderColor: alphaColor(SCB_COLORS.PRIMARY, 0.1),
          },
        }}
      >
        <Box sx={{ p: 2 }}>
          <BrandingHeader compact={false} showSapFiori={true} />
        </Box>
        <Divider />
        <List>
          {navItems.map((item) => (
            <Link href={item.path} key={item.text} passHref>
              <ListItem 
                button 
                component="a"
                selected={isActive(item.path)}
                onClick={toggleDrawer(false)}
                sx={{
                  py: 1.5,
                  borderLeft: '4px solid',
                  borderLeftColor: isActive(item.path) ? SCB_COLORS.ACCENT : 'transparent',
                  backgroundColor: isActive(item.path) ? alphaColor(SCB_COLORS.ACCENT, 0.05) : 'transparent',
                  '&:hover': {
                    backgroundColor: isActive(item.path) ? alphaColor(SCB_COLORS.ACCENT, 0.1) : alphaColor(SCB_COLORS.PRIMARY, 0.05),
                  },
                  '& .MuiListItemIcon-root': {
                    color: isActive(item.path) ? SCB_COLORS.PRIMARY : SCB_COLORS.MEDIUM_GREY,
                  },
                  '& .MuiTypography-root': {
                    fontWeight: isActive(item.path) ? SCB_TYPOGRAPHY.WEIGHT.MEDIUM : SCB_TYPOGRAPHY.WEIGHT.REGULAR,
                    color: isActive(item.path) ? SCB_COLORS.PRIMARY : SCB_COLORS.MEDIUM_GREY,
                  }
                }}
              >
                <ListItemIcon>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.text} />
                {item.badge && (
                  <Badge badgeContent={item.badge} color="error" />
                )}
              </ListItem>
            </Link>
          ))}
        </List>
        <Divider sx={{ mt: 'auto' }} />
        <List>
          <ListItem button>
            <ListItemIcon>
              <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={SCB_COLORS.MEDIUM_GREY} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
              </svg>
            </ListItemIcon>
            <ListItemText primary="Settings" />
          </ListItem>
          <ListItem button>
            <ListItemIcon>
              <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={SCB_COLORS.MEDIUM_GREY} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
            </ListItemIcon>
            <ListItemText primary="Logout" />
          </ListItem>
        </List>
      </Drawer>
    </>
  );
};

export default GlobalNavigation;
