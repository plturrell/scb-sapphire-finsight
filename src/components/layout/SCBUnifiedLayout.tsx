import React from 'react';
import { Box, useTheme, useMediaQuery } from '@mui/material';
import Head from 'next/head';
import GlobalNavigation from '../GlobalNavigation';
import PageTransition from '../transitions/PageTransition';
import { SCB_COLORS } from '../../utils/SCBrandAssets';

interface SCBUnifiedLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  showParticles?: boolean;
  transitionEffect?: 'fade' | 'slide-up' | 'slide-down' | 'slide-left' | 'slide-right' | 'zoom' | 'none';
}

/**
 * Unified layout component for Standard Chartered Bank application
 * Ensures consistent navigation, branding, and user experience across all pages
 */
const SCBUnifiedLayout: React.FC<SCBUnifiedLayoutProps> = ({
  children,
  title = 'SCB Sapphire FinSight',
  description = 'AI-Enhanced Financial Analytics for Standard Chartered Bank',
  showParticles = true,
  transitionEffect = 'slide-up',
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <>
      <Head>
        <title>{`${title} | SCB Sapphire`}</title>
        <meta name="description" content={description} />
      </Head>

      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        minHeight: '100vh',
        bgcolor: SCB_COLORS.BACKGROUND
      }}>
        {/* Global Navigation - consistent across all pages */}
        <GlobalNavigation />

        {/* Main content area */}
        <PageTransition effect={transitionEffect} duration={400}>
          <Box 
            p={isMobile ? 2 : 3}
            sx={{
              position: 'relative',
              zIndex: 1,
              flex: 1
            }}
          >
            {children}
          </Box>
        </PageTransition>

        {/* Footer with SCB branding */}
        <Box 
          component="footer"
          sx={{ 
            p: 2, 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: '1px solid',
            borderColor: `${SCB_COLORS.LIGHT_GREY}`,
            bgcolor: SCB_COLORS.WHITE,
            fontSize: '0.75rem',
            color: SCB_COLORS.MEDIUM_GREY,
          }}
        >
          <Box>
            © 2025 Standard Chartered Bank. All rights reserved.
          </Box>
          <Box>
            Sapphire FinSight
          </Box>
        </Box>
      </Box>
    </>
  );
};

export default SCBUnifiedLayout;