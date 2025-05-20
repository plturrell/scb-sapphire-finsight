import React from 'react';
import { 
  Box, 
  Typography, 
  Container, 
  Grid, 
  Paper, 
  Divider 
} from '@mui/material';
import { BrandingHeader, SCBrandingFooter } from '../components/common';
import ModernLayout from '../components/ModernLayout';

/**
 * Showcase page for SCB/SAP Fiori branding elements
 */
const BrandingShowcase: React.FC = () => {
  return (
    <ModernLayout>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom mb={4}>
          Standard Chartered Bank & SAP Fiori Branding
        </Typography>
        
        <Grid container spacing={4}>
          {/* BrandingHeader Component */}
          <Grid item xs={12}>
            <Paper sx={{ p: 4, mb: 4 }}>
              <Typography variant="h5" gutterBottom>
                BrandingHeader Component
              </Typography>
              <Typography variant="body1" paragraph>
                The BrandingHeader component provides consistent branding across the application with
                various display options.
              </Typography>
              
              <Grid container spacing={4} sx={{ mt: 2 }}>
                <Grid item xs={12} md={6}>
                  <Box sx={{ 
                    p: 3, 
                    border: '1px dashed', 
                    borderColor: 'divider',
                    borderRadius: 1,
                    mb: 2
                  }}>
                    <Typography variant="subtitle2" gutterBottom sx={{ color: 'text.secondary' }}>
                      Default
                    </Typography>
                    <BrandingHeader />
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Box sx={{ 
                    p: 3, 
                    border: '1px dashed', 
                    borderColor: 'divider',
                    borderRadius: 1,
                    mb: 2
                  }}>
                    <Typography variant="subtitle2" gutterBottom sx={{ color: 'text.secondary' }}>
                      Compact (for headers)
                    </Typography>
                    <BrandingHeader compact={true} />
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Box sx={{ 
                    p: 3, 
                    border: '1px dashed', 
                    borderColor: 'divider',
                    borderRadius: 1,
                    mb: 2
                  }}>
                    <Typography variant="subtitle2" gutterBottom sx={{ color: 'text.secondary' }}>
                      Large (for splash screens)
                    </Typography>
                    <BrandingHeader large={true} />
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Box sx={{ 
                    p: 3, 
                    border: '1px dashed', 
                    borderColor: 'divider',
                    borderRadius: 1,
                    mb: 2
                  }}>
                    <Typography variant="subtitle2" gutterBottom sx={{ color: 'text.secondary' }}>
                      Centered (for featured sections)
                    </Typography>
                    <BrandingHeader centered={true} />
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Box sx={{ 
                    p: 3, 
                    border: '1px dashed', 
                    borderColor: 'divider',
                    borderRadius: 1,
                    mb: 2
                  }}>
                    <Typography variant="subtitle2" gutterBottom sx={{ color: 'text.secondary' }}>
                      Without SAP Fiori
                    </Typography>
                    <BrandingHeader showSapFiori={false} />
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Box sx={{ 
                    p: 3, 
                    border: '1px dashed', 
                    borderColor: 'divider',
                    borderRadius: 1,
                    mb: 2,
                    bgcolor: '#f5f7fa'
                  }}>
                    <Typography variant="subtitle2" gutterBottom sx={{ color: 'text.secondary' }}>
                      Splash Screen Style
                    </Typography>
                    <BrandingHeader large={true} centered={true} />
                  </Box>
                </Grid>
              </Grid>
              
              <Divider sx={{ my: 4 }} />
              
              <Typography variant="h6" gutterBottom>
                Usage
              </Typography>
              <Box 
                component="pre" 
                sx={{ 
                  p: 2, 
                  bgcolor: 'grey.100', 
                  borderRadius: 1,
                  overflowX: 'auto'
                }}
              >
                {`// Standard usage
<BrandingHeader />

// Compact for headers
<BrandingHeader compact={true} showSapFiori={false} />

// Large for splash screens
<BrandingHeader large={true} centered={true} />

// For mobile drawers
<BrandingHeader compact={isMobile} showSapFiori={true} />`}
              </Box>
            </Paper>
          </Grid>
          
          {/* SCBrandingFooter Component */}
          <Grid item xs={12}>
            <Paper sx={{ p: 4 }}>
              <Typography variant="h5" gutterBottom>
                SCBrandingFooter Component
              </Typography>
              <Typography variant="body1" paragraph>
                Consistent footer component with SCB and SAP Fiori branding.
              </Typography>
              
              <Box sx={{ 
                p: 0,
                border: '1px dashed', 
                borderColor: 'divider',
                borderRadius: 1,
                mb: 2
              }}>
                <SCBrandingFooter />
              </Box>
              
              <Divider sx={{ my: 4 }} />
              
              <Typography variant="h6" gutterBottom>
                Usage
              </Typography>
              <Box 
                component="pre" 
                sx={{ 
                  p: 2, 
                  bgcolor: 'grey.100', 
                  borderRadius: 1,
                  overflowX: 'auto'
                }}
              >
                {`// Import the footer component
import { SCBrandingFooter } from '../components/common';

// Include at the bottom of layouts
<SCBrandingFooter />`}
              </Box>
            </Paper>
          </Grid>
          
          {/* Branding Guidelines */}
          <Grid item xs={12}>
            <Paper sx={{ p: 4 }}>
              <Typography variant="h5" gutterBottom>
                Branding Guidelines
              </Typography>
              <Typography variant="body1" paragraph>
                Colors, typography, and spacing guidelines for consistent branding.
              </Typography>
              
              <Grid container spacing={3} sx={{ mt: 2 }}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Colors
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box sx={{ width: 80, height: 40, backgroundColor: '#042278', mr: 2, borderRadius: 1 }} />
                      <Typography variant="body2">
                        SCB Blue: #042278
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box sx={{ width: 80, height: 40, backgroundColor: '#31ddc1', mr: 2, borderRadius: 1 }} />
                      <Typography variant="body2">
                        SCB Teal: #31ddc1
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box sx={{ width: 80, height: 40, backgroundColor: '#0a6ed1', mr: 2, borderRadius: 1 }} />
                      <Typography variant="body2">
                        SAP Fiori Blue: #0a6ed1
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box sx={{ width: 80, height: 40, backgroundColor: '#f0f0f0', mr: 2, borderRadius: 1, border: '1px solid', borderColor: 'divider' }} />
                      <Typography variant="body2">
                        SAP Fiori Badge Background: #f0f0f0
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Typography
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box>
                      <Typography variant="h4" sx={{ color: '#042278', fontWeight: 700 }}>
                        Finsight
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        Application name (large)
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="h6" sx={{ color: '#042278', fontWeight: 600 }}>
                        Finsight
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        Application name (default)
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="subtitle1" sx={{ color: '#042278', fontWeight: 600 }}>
                        Finsight
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        Application name (compact)
                      </Typography>
                    </Box>
                    <Box 
                      sx={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        bgcolor: '#f0f0f0', 
                        borderRadius: '4px',
                        px: 1.5, 
                        py: 0.25
                      }}
                    >
                      <Typography variant="caption" sx={{ fontWeight: 600, color: '#0a6ed1' }}>
                        Powered by SAP Fiori
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </ModernLayout>
  );
};

export default BrandingShowcase;