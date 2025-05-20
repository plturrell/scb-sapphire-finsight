import React from 'react';
import { Box, Typography, Container, Link, Grid } from '@mui/material';
import { BrandingHeader } from './common';

/**
 * Standard Chartered Bank branded footer with SAP Fiori integration
 */
const SCBrandingFooter: React.FC = () => {
  return (
    <Box
      component="footer"
      sx={{
        py: 3,
        px: 2,
        mt: 'auto',
        backgroundColor: '#f8f9fa',
        borderTop: '1px solid',
        borderColor: 'rgba(0, 0, 0, 0.12)'
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Box sx={{ mb: 2 }}>
              <BrandingHeader showSapFiori={true} />
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 300 }}>
              Financial insights and analytics powered by Standard Chartered Bank and SAP Fiori technology.
            </Typography>
          </Grid>
          
          <Grid item xs={12} md={2}>
            <Typography variant="subtitle2" color="text.primary" fontWeight={600} gutterBottom>
              Resources
            </Typography>
            <Box component="ul" sx={{ p: 0, m: 0, listStyle: 'none' }}>
              {['Documentation', 'API', 'Support', 'Community'].map((item) => (
                <Box component="li" key={item} sx={{ py: 0.5 }}>
                  <Link href="#" color="text.secondary" underline="hover" sx={{ fontSize: '0.875rem' }}>
                    {item}
                  </Link>
                </Box>
              ))}
            </Box>
          </Grid>
          
          <Grid item xs={12} md={2}>
            <Typography variant="subtitle2" color="text.primary" fontWeight={600} gutterBottom>
              Company
            </Typography>
            <Box component="ul" sx={{ p: 0, m: 0, listStyle: 'none' }}>
              {['About', 'Blog', 'Careers', 'Press'].map((item) => (
                <Box component="li" key={item} sx={{ py: 0.5 }}>
                  <Link href="#" color="text.secondary" underline="hover" sx={{ fontSize: '0.875rem' }}>
                    {item}
                  </Link>
                </Box>
              ))}
            </Box>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Typography variant="subtitle2" color="text.primary" fontWeight={600} gutterBottom>
              Legal
            </Typography>
            <Box component="ul" sx={{ p: 0, m: 0, listStyle: 'none' }}>
              {['Terms', 'Privacy', 'Cookies', 'Compliance'].map((item) => (
                <Box component="li" key={item} sx={{ py: 0.5 }}>
                  <Link href="#" color="text.secondary" underline="hover" sx={{ fontSize: '0.875rem' }}>
                    {item}
                  </Link>
                </Box>
              ))}
            </Box>
          </Grid>
        </Grid>
        
        <Box sx={{ mt: 3, pt: 3, borderTop: '1px solid', borderColor: 'rgba(0, 0, 0, 0.12)' }}>
          <Typography variant="body2" color="text.secondary" align="center">
            © {new Date().getFullYear()} Standard Chartered Bank. All rights reserved.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default SCBrandingFooter;