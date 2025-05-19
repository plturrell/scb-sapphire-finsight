import React from 'react';
import { Card, CardContent, Typography, Button, Box } from '@mui/material';
import { History } from 'lucide-react';

interface VietnamMonteCarloHistoryProps {
  onViewSimulation: (id: string) => void;
  onCompare: (ids: string[]) => void;
  onNewSimulation: () => void;
}

export const VietnamMonteCarloHistory: React.FC<VietnamMonteCarloHistoryProps> = ({
  onViewSimulation,
  onCompare,
  onNewSimulation,
}) => {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          <History size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
          Monte Carlo Simulation History
        </Typography>
        
        <Typography variant="body2" paragraph>
          View and compare historical Monte Carlo simulations for Vietnam tariff impact analysis.
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
          <Button 
            variant="outlined" 
            size="small"
            onClick={() => onViewSimulation('sim-input-1')}
          >
            View Latest
          </Button>
          <Button 
            variant="outlined"
            size="small"
            onClick={() => onCompare(['sim-input-1', 'sim-input-2'])}
          >
            Compare
          </Button>
          <Button 
            variant="contained"
            size="small"
            onClick={onNewSimulation}
          >
            New Simulation
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default VietnamMonteCarloHistory;