import React from 'react';
import { Box, Typography, Container, Grid, Paper, Divider, Button } from '@mui/material';
import { Link, Globe, Database } from 'lucide-react';
import VietnamTariffDashboard from '../components/VietnamTariffDashboard.enhanced';
import BusinessDataCloudDashboard from '../components/BusinessDataCloudDashboard.enhanced';

/**
 * Vietnam Tariff Dashboard Page
 * Comprehensive analysis of Vietnam tariff data with AI-enhanced insights and Monte Carlo simulations
 * Integrates with Business Data Cloud for enhanced analytics
 */
const VietnamTariffDashboardPage: React.FC = () => {
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ 
          fontWeight: 'bold',
          color: '#042278', 
          display: 'flex',
          alignItems: 'center'
        }}>
          <Globe size={28} style={{ marginRight: '12px' }} />
          Vietnam Tariff Analysis Dashboard
        </Typography>
        <Typography variant="body1" sx={{ mb: 2, maxWidth: '800px' }}>
          Comprehensive analysis of Vietnam's tariff policies and trade impacts with AI-enhanced predictions.
          Leveraging Monte Carlo simulations to model potential scenarios and impacts across sectors.
        </Typography>
        <Divider sx={{ mb: 3 }} />
      </Box>

      {/* Main Dashboard Content */}
      <Grid container spacing={4}>
        <Grid item xs={12}>
          <VietnamTariffDashboard />
        </Grid>
        
        <Grid item xs={12}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
              <Database size={20} style={{ marginRight: '8px' }} />
              Business Data Cloud Integration
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              The Vietnam Tariff Dashboard integrates seamlessly with SAP Business Data Cloud to provide real-time
              analytics, historical trend analysis, and AI-enhanced predictions. This integration leverages the
              power of Monte Carlo simulations to model potential trade impact scenarios with confidence metrics.
            </Typography>
            <Button 
              variant="contained" 
              color="primary" 
              endIcon={<Link size={16} />}
              href="/financial-simulation"
              sx={{ mr: 2 }}
            >
              Financial Simulations
            </Button>
            <Button 
              variant="outlined"
              endIcon={<Globe size={16} />}
              href="/vietnam-monte-carlo-enhanced"
            >
              Monte Carlo Analysis
            </Button>
          </Paper>
          <BusinessDataCloudDashboard />
        </Grid>
      </Grid>
    </Container>
  );
};

export default VietnamTariffDashboardPage;
