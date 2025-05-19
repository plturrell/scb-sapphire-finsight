import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Button,
  Tooltip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import { Info, Download as FileDownload, BarChart2 } from 'lucide-react';

export interface SensitivityParameter {
  name: string;
  impactFactor: number; // 0 to 1 scale
  correlation: number; // -1 to 1 scale
}

interface SensitivityAnalysisProps {
  parameters: SensitivityParameter[] | null;
  metricName?: string;
  loading?: boolean;
  onDetailedAnalysis?: () => void;
  onExportData?: () => void;
}

// SCB color scheme as defined in the spec
const colors = {
  primaryBlue: '#042278', // primary brand color
  secondaryGreen: '#31ddc1', // light blue/teal
  purple: '#a87fff',
  barBase: '#e0e0e0'
};

/**
 * Vietnam Monte Carlo Sensitivity Analysis
 * Displays parameter sensitivity and correlation with simulation outcomes
 */
export const VietnamMonteCarloSensitivity: React.FC<SensitivityAnalysisProps> = ({
  parameters,
  metricName = 'Revenue Impact',
  loading = false,
  onDetailedAnalysis,
  onExportData
}) => {
  // Function to determine bar color based on correlation
  const getCorrelationColor = (correlation: number): string => {
    if (correlation > 0.5) return '#388e3c'; // green for strong positive
    if (correlation > 0) return '#81c784'; // light green for positive
    if (correlation > -0.5) return '#ffb74d'; // orange for mild negative
    return '#e57373'; // red for strong negative
  };

  // Function to render impact factor bars
  const renderImpactBar = (impactFactor: number): JSX.Element => {
    const bars = Math.round(impactFactor * 10);
    
    return (
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Box sx={{ width: '100%', bgcolor: colors.barBase, mr: 1, borderRadius: '2px' }}>
          <Box
            sx={{
              width: `${impactFactor * 100}%`,
              height: 10,
              bgcolor: colors.purple,
              borderRadius: '2px'
            }}
          />
        </Box>
        <Typography variant="caption" sx={{ minWidth: '3rem', textAlign: 'right' }}>
          {impactFactor.toFixed(2)}
        </Typography>
      </Box>
    );
  };

  // Sort parameters by impact factor (highest first)
  const sortedParameters = parameters 
    ? [...parameters].sort((a, b) => b.impactFactor - a.impactFactor)
    : [];

  return (
    <Card elevation={2} sx={{ mb: 3 }}>
      <CardHeader
        title="Parameter Sensitivity Analysis"
        action={
          <Tooltip title="Analyze which parameters have the most impact on simulation results">
            <IconButton size="small">
              <Info />
            </IconButton>
          </Tooltip>
        }
        sx={{ 
          bgcolor: colors.primaryBlue, 
          color: 'white',
          '& .MuiCardHeader-action': { color: 'white' }
        }}
      />
      <CardContent>
        {parameters && parameters.length > 0 ? (
          <>
            <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Parameter</TableCell>
                    <TableCell align="center">Impact Factor</TableCell>
                    <TableCell align="center">Correlation</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sortedParameters.map((param) => (
                    <TableRow key={param.name}>
                      <TableCell component="th" scope="row">
                        {param.name}
                      </TableCell>
                      <TableCell>
                        {renderImpactBar(param.impactFactor)}
                      </TableCell>
                      <TableCell align="center">
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontWeight: 'bold', 
                            color: getCorrelationColor(param.correlation) 
                          }}
                        >
                          {param.correlation > 0 ? '+' : ''}{param.correlation.toFixed(2)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Typography variant="body2" sx={{ mb: 2 }}>
              <strong>Impact Factor</strong> indicates how strongly a parameter affects the {metricName.toLowerCase()}.
              <br />
              <strong>Correlation</strong> shows the direction of influence (positive or negative).
            </Typography>

            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Button
                variant="outlined"
                startIcon={<BarChart2 size={16} />}
                onClick={onDetailedAnalysis}
                size="small"
              >
                Detailed Analysis
              </Button>
              <Button
                variant="outlined"
                startIcon={<FileDownload size={16} />}
                onClick={onExportData}
                size="small"
              >
                Export Data
              </Button>
            </Box>
          </>
        ) : loading ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body1">
              Calculating sensitivity analysis...
            </Typography>
          </Box>
        ) : (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body1">
              Run the simulation to see parameter sensitivity
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default VietnamMonteCarloSensitivity;
