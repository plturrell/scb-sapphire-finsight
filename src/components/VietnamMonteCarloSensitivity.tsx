import React, { useState } from 'react';
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
  Paper,
  useTheme,
  useMediaQuery,
  Collapse,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import { Info, ChevronDown, ChevronUp } from 'lucide-react';
import { useResponsive } from '../hooks/useResponsive';
import { useHaptic } from '../hooks/useMicroInteractions';
import TouchButton from './TouchButton';
import { FinanceIcon, DataIcon, ChartIcon } from './icons';

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
  // Get device capabilities
  const { isMobile, isTablet } = useResponsive();
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));
  const haptic = useHaptic();
  
  // Mobile-specific state
  const [expanded, setExpanded] = useState(!isSmallScreen);
  
  // Toggle expanded state for mobile view
  const toggleExpanded = () => {
    setExpanded(!expanded);
    if (isMobile) {
      haptic({ intensity: 'medium' });
    }
  };
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
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <FinanceIcon 
                variant="percentage" 
                size={20} 
                className="mr-2 text-white"
                animation="none"
                hoverAnimation
              />
              <Typography variant={isSmallScreen ? 'subtitle1' : 'h6'} component="div">
                Parameter Sensitivity
              </Typography>
            </Box>
            {isSmallScreen && (
              <IconButton size="small" onClick={toggleExpanded}>
                {expanded ? <ChevronUp size={16} color="white" /> : <ChevronDown size={16} color="white" />}
              </IconButton>
            )}
          </Box>
        }
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
          '& .MuiCardHeader-action': { color: 'white' },
          p: isSmallScreen ? 1 : 2
        }}
      />
      <Collapse in={expanded} timeout="auto" unmountOnExit={false}>
        <CardContent sx={{ p: isSmallScreen ? 1 : 2 }}>
          {parameters && parameters.length > 0 ? (
            <>
              {isSmallScreen ? (
                // Mobile-optimized view
                <List disablePadding sx={{ mb: 2 }}>
                  {sortedParameters.slice(0, 5).map((param) => (
                    <ListItem 
                      key={param.name} 
                      disablePadding 
                      sx={{ 
                        py: 1,
                        borderBottom: `1px solid ${theme.palette.divider}`
                      }}
                    >
                      <ListItemText
                        primary={
                          <Typography variant="body2" noWrap sx={{ maxWidth: '100%' }}>
                            {param.name}
                          </Typography>
                        }
                        secondary={
                          <Box sx={{ mt: 0.5 }}>
                            {renderImpactBar(param.impactFactor)}
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                display: 'block',
                                textAlign: 'right',
                                fontWeight: 'bold', 
                                color: getCorrelationColor(param.correlation),
                                mt: 0.5
                              }}
                            >
                              Correlation: {param.correlation > 0 ? '+' : ''}{param.correlation.toFixed(2)}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                // Desktop view
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
              )}

              <Box 
                sx={{ 
                  mb: 2, 
                  bgcolor: theme.palette.mode === 'light' ? 'rgba(41, 98, 255, 0.05)' : 'rgba(41, 98, 255, 0.1)',
                  p: 1.5,
                  borderRadius: 1,
                  borderLeft: `4px solid ${theme.palette.primary.main}`
                }}
              >
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontSize: isSmallScreen ? '0.75rem' : '0.875rem',
                    lineHeight: 1.5
                  }}
                >
                  <strong>Impact Factor</strong> indicates how strongly a parameter affects the {metricName.toLowerCase()}.
                  <br />
                  <strong>Correlation</strong> shows the direction of influence (positive or negative).
                </Typography>
              </Box>

              <Box sx={{ 
                display: 'flex', 
                flexDirection: isSmallScreen ? 'column' : 'row',
                gap: isSmallScreen ? 1 : 2,
                justifyContent: isSmallScreen ? 'stretch' : 'space-between' 
              }}>
                {isSmallScreen ? (
                  <>
                    <TouchButton
                      fullWidth
                      variant="secondary"
                      leftIcon={
                        <ChartIcon 
                          variant="bar" 
                          size={16} 
                          animation="none" 
                          hoverAnimation 
                        />
                      }
                      onClick={onDetailedAnalysis}
                    >
                      Detailed Analysis
                    </TouchButton>
                    <TouchButton
                      fullWidth
                      variant="secondary"
                      leftIcon={
                        <DataIcon 
                          variant="table" 
                          size={16} 
                          animation="none" 
                          hoverAnimation 
                        />
                      }
                      onClick={onExportData}
                    >
                      Export Data
                    </TouchButton>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outlined"
                      startIcon={
                        <ChartIcon 
                          variant="bar" 
                          size={16} 
                          animation="none" 
                          hoverAnimation 
                        />
                      }
                      onClick={onDetailedAnalysis}
                      size="small"
                    >
                      Detailed Analysis
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={
                        <DataIcon 
                          variant="table" 
                          size={16} 
                          animation="none" 
                          hoverAnimation 
                        />
                      }
                      onClick={onExportData}
                      size="small"
                    >
                      Export Data
                    </Button>
                  </>
                )}
              </Box>
            </>
          ) : loading ? (
            <Box sx={{ p: isSmallScreen ? 2 : 3, textAlign: 'center' }}>
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
                <ChartIcon 
                  variant="line" 
                  size={24} 
                  animation="pulse" 
                  color={theme.palette.primary.main}
                />
              </Box>
              <Typography variant="body2">
                Calculating sensitivity analysis...
              </Typography>
            </Box>
          ) : (
            <Box sx={{ p: isSmallScreen ? 2 : 3, textAlign: 'center' }}>
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
                <FinanceIcon 
                  variant="percentage" 
                  size={24} 
                  animation="none"
                  hoverAnimation
                  hoverEffect="scale"
                  color={theme.palette.text.secondary}
                />
              </Box>
              <Typography variant="body2">
                Run simulation to see parameter sensitivity
              </Typography>
            </Box>
          )}
        </CardContent>
      </Collapse>
      
      {/* Mobile collapsed view summary */}
      {isSmallScreen && !expanded && parameters && parameters.length > 0 && (
        <CardContent sx={{ p: 1 }}>
          {sortedParameters.length > 0 && (
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                <Typography variant="caption" noWrap sx={{ maxWidth: '65%' }}>
                  {sortedParameters[0].name}
                </Typography>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    fontWeight: 'bold', 
                    color: getCorrelationColor(sortedParameters[0].correlation)
                  }}
                >
                  {sortedParameters[0].correlation > 0 ? '+' : ''}{sortedParameters[0].correlation.toFixed(2)}
                </Typography>
              </Box>
              {renderImpactBar(sortedParameters[0].impactFactor)}
            </Box>
          )}
          <Button 
            size="small" 
            fullWidth 
            onClick={toggleExpanded} 
            sx={{ mt: 1, textTransform: 'none' }}
            startIcon={
              <DataIcon 
                variant="table" 
                size={16} 
                animation="none" 
                hoverAnimation 
              />
            }
          >
            View All Parameters
          </Button>
        </CardContent>
      )}
    </Card>
  );
};

export default VietnamMonteCarloSensitivity;