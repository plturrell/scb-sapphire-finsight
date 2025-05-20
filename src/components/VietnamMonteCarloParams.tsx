import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Slider,
  Switch,
  FormControlLabel,
  Tooltip,
  IconButton,
  Divider,
  Button,
  Paper,
  Collapse,
  useTheme,
  useMediaQuery,
  Badge
} from '@mui/material';
import { Info, Plus, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { DistributionType, SimulationConfig, SimulationParameter } from '../types/MonteCarloTypes';
import { useResponsive } from '../hooks/useResponsive';
import { useButtonAnimation, useHaptic } from '../hooks/useMicroInteractions';
import TouchButton, { SegmentedControl } from './TouchButton';

// Type alias for backward compatibility 
export type TariffParameter = SimulationParameter;

// Component-specific interfaces
export interface SimulationSettings {
  precision: 'Preview' | 'Medium' | 'High';
  iterations: number;
  caseBoundaries: {
    pessimistic: [number, number]; // percentage range [0-100]
    realistic: [number, number];
    optimistic: [number, number];
  };
}

export interface VietnamMonteCarloConfig {
  productInfo: {
    hsCode: string;
    productDescription?: string;
    section?: string;
    sectionDescription?: string;
  };
  tariffParameters: TariffParameter[];
  financialParameters: TariffParameter[];
  simulationSettings: SimulationSettings;
}

interface VietnamMonteCarloParamsProps {
  initialConfig?: Partial<VietnamMonteCarloConfig>;
  onConfigChange?: (config: VietnamMonteCarloConfig) => void;
  onRunSimulation?: (config: VietnamMonteCarloConfig) => void;
}

const defaultConfig: VietnamMonteCarloConfig = {
  productInfo: {
    hsCode: '',
    productDescription: '',
    section: '',
    sectionDescription: ''
  },
  tariffParameters: [
    {
      id: 'baseTariffRate',
      name: 'Base Tariff Rate',
      value: 25,
      min: 15,
      max: 35,
      distribution: 'Normal',
      distributionType: 'Normal',
      parameterType: 'Percentage',
      description: 'Baseline tariff rate applied to imported goods',
      unit: '%'
    },
    {
      id: 'tradeAgreement',
      name: 'Trade Agreement',
      value: 'CPTPP',
      min: 'CPTPP',
      max: 'MFN',
      distribution: 'Uniform',
      distributionType: 'Uniform',
      parameterType: 'Enum',
      description: 'Trade agreement that determines preferential tariff rates'
    }
  ],
  financialParameters: [
    {
      id: 'importVolume',
      name: 'Import Volume',
      value: 5.2,
      min: 4.5,
      max: 6.0,
      distribution: 'Normal',
      distributionType: 'Normal',
      parameterType: 'Numeric',
      description: 'Volume of imports in millions of USD',
      unit: 'M'
    },
    {
      id: 'exchangeRate',
      name: 'Exchange Rate',
      value: 23500,
      min: 23000,
      max: 24200,
      distribution: 'Normal',
      distributionType: 'Normal',
      parameterType: 'Currency',
      description: 'VND to USD exchange rate',
      unit: 'VND/USD'
    }
  ],
  simulationSettings: {
    precision: 'Preview',
    iterations: 1000,
    caseBoundaries: {
      pessimistic: [0, 5],
      realistic: [5, 95],
      optimistic: [95, 100]
    }
  }
};

// Helper function to format values with units
const formatValue = (value: number | string, unit?: string): string => {
  if (typeof value === 'number') {
    return unit ? `${value}${unit}` : value.toString();
  }
  return value.toString();
};

/**
 * Vietnam Monte Carlo Parameter Configuration Panel
 * Enhanced with responsive design and mobile touch optimizations
 */
export const VietnamMonteCarloParams: React.FC<VietnamMonteCarloParamsProps> = ({
  initialConfig,
  onConfigChange,
  onRunSimulation
}) => {
  // Responsive hooks
  const { isMobile, isTablet } = useResponsive();
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));
  const haptic = useHaptic();
  
  // Collapsible sections for mobile view
  const [expandedSections, setExpandedSections] = useState({
    productInfo: true,
    tariffParameters: !isSmallScreen,
    financialParameters: !isSmallScreen,
    simulationSettings: !isSmallScreen
  });

  // Merge initial config with defaults
  const [config, setConfig] = useState<VietnamMonteCarloConfig>({
    ...defaultConfig,
    ...initialConfig
  });

  // Update parent component when config changes
  useEffect(() => {
    if (onConfigChange) {
      onConfigChange(config);
    }
  }, [config, onConfigChange]);

  // Handle HS code changes
  const handleHSCodeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const hsCode = event.target.value;
    setConfig({
      ...config,
      productInfo: {
        ...config.productInfo,
        hsCode
      }
    });

    // In a real implementation, we would fetch product descriptions based on HS code
    // This is a simplified mock implementation
    if (hsCode.length === 8) {
      // Simulate API fetch delay
      setTimeout(() => {
        let productDescription = '';
        let section = '';
        let sectionDescription = '';

        // Mock product descriptions based on HS code prefix
        if (hsCode.startsWith('85')) {
          productDescription = 'Electrical machinery and equipment';
          section = 'XVI';
          sectionDescription = 'Machinery and mechanical appliances; electrical equipment';
        } else if (hsCode.startsWith('61')) {
          productDescription = 'Articles of apparel and clothing accessories, knitted or crocheted';
          section = 'XI';
          sectionDescription = 'Textiles and textile articles';
        } else if (hsCode.startsWith('90')) {
          productDescription = 'Optical, photographic, measuring, checking, precision instruments';
          section = 'XVIII';
          sectionDescription = 'Optical, photographic, measuring instruments';
        }

        setConfig({
          ...config,
          productInfo: {
            hsCode,
            productDescription,
            section,
            sectionDescription
          }
        });
        
        if (isMobile && productDescription) {
          haptic({ intensity: 'light' });
        }
      }, 500);
    }
  };

  // Handle parameter changes
  const handleParameterChange = (
    paramType: 'tariffParameters' | 'financialParameters',
    paramId: string,
    field: keyof TariffParameter,
    value: any
  ) => {
    setConfig({
      ...config,
      [paramType]: config[paramType].map(param => 
        param.id === paramId ? { ...param, [field]: value } : param
      )
    });
  };

  // Handle simulation settings changes
  const handleSimulationSettingChange = (setting: keyof SimulationSettings, value: any) => {
    setConfig({
      ...config,
      simulationSettings: {
        ...config.simulationSettings,
        [setting]: value
      }
    });

    // Update iterations based on precision
    if (setting === 'precision') {
      const iterations = 
        value === 'Preview' ? 1000 :
        value === 'Medium' ? 5000 : 10000;
      
      setConfig({
        ...config,
        simulationSettings: {
          ...config.simulationSettings,
          precision: value as 'Preview' | 'Medium' | 'High',
          iterations
        }
      });
      
      // Add haptic feedback on mobile
      if (isMobile) {
        haptic({ 
          intensity: value === 'High' ? 'medium' : 'light',
          duration: value === 'High' ? 15 : 10
        });
      }
    }
  };

  // Handle case boundary changes
  const handleCaseBoundaryChange = (
    caseType: keyof SimulationSettings['caseBoundaries'],
    index: 0 | 1,
    value: number
  ) => {
    const boundaries = { ...config.simulationSettings.caseBoundaries };
    boundaries[caseType][index] = value;

    // Ensure boundaries don't overlap
    if (caseType === 'pessimistic' && index === 1) {
      boundaries.realistic[0] = value;
    } else if (caseType === 'realistic' && index === 0) {
      boundaries.pessimistic[1] = value;
    } else if (caseType === 'realistic' && index === 1) {
      boundaries.optimistic[0] = value;
    } else if (caseType === 'optimistic' && index === 0) {
      boundaries.realistic[1] = value;
    }

    setConfig({
      ...config,
      simulationSettings: {
        ...config.simulationSettings,
        caseBoundaries: boundaries
      }
    });
  };

  // Add new parameter
  const addParameter = (paramType: 'tariffParameters' | 'financialParameters') => {
    const newParam: TariffParameter = {
      id: `custom-${Date.now()}`,
      name: 'Custom Parameter',
      value: 0,
      min: 0,
      max: 100,
      distribution: 'Normal',
      distributionType: 'Normal',
      parameterType: paramType === 'tariffParameters' ? 'Percentage' : 'Numeric',
      description: 'Custom parameter description'
    };

    setConfig({
      ...config,
      [paramType]: [...config[paramType], newParam]
    });
    
    if (isMobile) {
      haptic({ intensity: 'medium' });
    }
  };

  // Run simulation
  const handleRunSimulation = () => {
    if (onRunSimulation) {
      onRunSimulation(config);
      
      if (isMobile) {
        haptic({ intensity: 'heavy', duration: 20 });
      }
    }
  };
  
  // Toggle section expansion (mobile optimization)
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections({
      ...expandedSections,
      [section]: !expandedSections[section]
    });
    
    if (isMobile) {
      haptic({ intensity: 'light' });
    }
  };
  
  // Section header with mobile-optimized collapsible functionality
  const SectionHeader = ({ title, section, helpText }: { title: string, section: keyof typeof expandedSections, helpText: string }) => (
    <Box 
      sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 1,
        cursor: isSmallScreen ? 'pointer' : 'default',
        py: isSmallScreen ? 1 : 0
      }}
      onClick={isSmallScreen ? () => toggleSection(section) : undefined}
    >
      <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
        {title}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Tooltip title={helpText}>
          <IconButton size="small">
            <HelpCircle size={16} />
          </IconButton>
        </Tooltip>
        
        {isSmallScreen && (
          <IconButton size="small" onClick={(e) => { 
            e.stopPropagation(); 
            toggleSection(section); 
          }}>
            {expandedSections[section] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </IconButton>
        )}
      </Box>
    </Box>
  );
  
  // Render precision controls optimized for mobile
  const renderPrecisionControls = () => {
    if (isMobile) {
      // Mobile-optimized precision control
      return (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>Precision</Typography>
          <SegmentedControl
            options={[
              { value: 'Preview', label: 'Preview', icon: <Badge badgeContent="1K" color="primary" sx={{ '& .MuiBadge-badge': { fontSize: '0.6rem' } }} /> },
              { value: 'Medium', label: 'Medium', icon: <Badge badgeContent="5K" color="primary" sx={{ '& .MuiBadge-badge': { fontSize: '0.6rem' } }} /> },
              { value: 'High', label: 'High', icon: <Badge badgeContent="10K" color="primary" sx={{ '& .MuiBadge-badge': { fontSize: '0.6rem' } }} /> }
            ]}
            value={config.simulationSettings.precision}
            onChange={(value) => handleSimulationSettingChange('precision', value)}
            fullWidth
          />
        </Box>
      );
    }
    
    // Desktop version
    return (
      <Box>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>Precision</Typography>
        <FormControl component="fieldset">
          <Grid container spacing={2}>
            <Grid sx={{ width: 'auto' }}>
              <FormControlLabel
                value="Preview"
                control={
                  <Switch
                    checked={config.simulationSettings.precision === 'Preview'}
                    onChange={() => handleSimulationSettingChange('precision', 'Preview')}
                    color="primary"
                  />
                }
                label="Preview (1,000 iterations)"
                labelPlacement="end"
              />
            </Grid>
            <Grid sx={{ width: 'auto' }}>
              <FormControlLabel
                value="Medium"
                control={
                  <Switch
                    checked={config.simulationSettings.precision === 'Medium'}
                    onChange={() => handleSimulationSettingChange('precision', 'Medium')}
                    color="primary"
                  />
                }
                label="Medium (5,000 iterations)"
                labelPlacement="end"
              />
            </Grid>
            <Grid sx={{ width: 'auto' }}>
              <FormControlLabel
                value="High"
                control={
                  <Switch
                    checked={config.simulationSettings.precision === 'High'}
                    onChange={() => handleSimulationSettingChange('precision', 'High')}
                    color="primary"
                  />
                }
                label="High (10,000 iterations)"
                labelPlacement="end"
              />
            </Grid>
          </Grid>
        </FormControl>
      </Box>
    );
  };

  return (
    <Card elevation={2} sx={{ mb: 3 }}>
      <CardHeader
        title="Parameter Configuration"
        action={
          <Tooltip title="Configure simulation parameters for Vietnam tariffs">
            <IconButton size="small">
              <Info />
            </IconButton>
          </Tooltip>
        }
        sx={{ 
          bgcolor: '#042278', 
          color: 'white',
          '& .MuiCardHeader-action': { color: 'white' },
          position: 'sticky',
          top: 0,
          zIndex: 10
        }}
      />
      <CardContent>
        {/* Product Information */}
        <Paper elevation={0} sx={{ p: 2, mb: 3, border: '1px solid #e0e0e0' }}>
          <SectionHeader 
            title="Product Information" 
            section="productInfo"
            helpText="Enter the 8-digit HS code to identify the product category" 
          />
          
          <Collapse in={expandedSections.productInfo}>
            <Grid container spacing={2}>
              <Grid sx={{ width: { xs: '100%', md: '50%' } }}>
                <TextField
                  label="HS Code"
                  value={config.productInfo.hsCode}
                  onChange={handleHSCodeChange}
                  fullWidth
                  placeholder="e.g., 85287280"
                  helperText="Enter 8-digit HS code"
                  sx={{ mb: 2 }}
                  inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
                />
              </Grid>
              <Grid sx={{ width: { xs: '100%', md: '50%' } }}>
                <TextField
                  label="Product Description"
                  value={config.productInfo.productDescription}
                  disabled
                  fullWidth
                  sx={{ mb: 2 }}
                />
              </Grid>
              <Grid sx={{ width: { xs: '100%', md: '50%' } }}>
                <TextField
                  label="Section"
                  value={config.productInfo.section}
                  disabled
                  fullWidth
                />
              </Grid>
              <Grid sx={{ width: { xs: '100%', md: '50%' } }}>
                <TextField
                  label="Section Description"
                  value={config.productInfo.sectionDescription}
                  disabled
                  fullWidth
                />
              </Grid>
            </Grid>
          </Collapse>
        </Paper>

        {/* Tariff Parameters */}
        <Paper elevation={0} sx={{ p: 2, mb: 3, border: '1px solid #e0e0e0' }}>
          <SectionHeader 
            title="Tariff Parameters" 
            section="tariffParameters"
            helpText="Configure tariff-related parameters for the simulation" 
          />

          <Collapse in={expandedSections.tariffParameters}>
            {config.tariffParameters.map((param, index) => (
              <Box key={param.id} sx={{ mb: 3 }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid sx={{ width: '100%' }}>
                    <Typography variant="subtitle2">
                      {param.name}: {formatValue(param.value, param.unit)}
                    </Typography>
                  </Grid>
                  <Grid sx={{ width: { xs: '100%', md: '50%' } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="caption" sx={{ mr: 1, minWidth: isMobile ? '40px' : 'auto' }}>Min:</Typography>
                      <TextField
                        size="small"
                        value={param.min}
                        onChange={(e) => handleParameterChange(
                          'tariffParameters',
                          param.id,
                          'min',
                          typeof param.min === 'number' ? Number(e.target.value) : e.target.value
                        )}
                        sx={{ width: '100%' }}
                        inputProps={typeof param.min === 'number' ? { inputMode: 'decimal' } : {}}
                      />
                    </Box>
                  </Grid>
                  <Grid sx={{ width: { xs: '100%', md: '50%' } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="caption" sx={{ mr: 1, minWidth: isMobile ? '40px' : 'auto' }}>Max:</Typography>
                      <TextField
                        size="small"
                        value={param.max}
                        onChange={(e) => handleParameterChange(
                          'tariffParameters',
                          param.id,
                          'max',
                          typeof param.max === 'number' ? Number(e.target.value) : e.target.value
                        )}
                        sx={{ width: '100%' }}
                        inputProps={typeof param.max === 'number' ? { inputMode: 'decimal' } : {}}
                      />
                    </Box>
                  </Grid>
                  <Grid sx={{ width: '100%' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="caption" sx={{ mr: 1, minWidth: isMobile ? '90px' : 'auto' }}>Distribution:</Typography>
                      <FormControl size="small" sx={{ width: isMobile ? '100%' : '200px' }}>
                        <Select
                          value={param.distribution}
                          onChange={(e) => handleParameterChange(
                            'tariffParameters',
                            param.id,
                            'distribution',
                            e.target.value as DistributionType
                          )}
                        >
                          <MenuItem value="Normal">Normal</MenuItem>
                          <MenuItem value="Uniform">Uniform</MenuItem>
                        </Select>
                      </FormControl>
                      <Tooltip title={param.description}>
                        <IconButton size="small" sx={{ ml: 1 }}>
                          <Info size={16} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Grid>
                </Grid>
                {index < config.tariffParameters.length - 1 && (
                  <Divider sx={{ my: 2 }} />
                )}
              </Box>
            ))}

            {isMobile ? (
              <TouchButton
                variant="secondary"
                leftIcon={<Plus size={16} />}
                onClick={(e) => addParameter('tariffParameters')}
                fullWidth
              >
                Add Parameter
              </TouchButton>
            ) : (
              <Button
                variant="outlined"
                startIcon={<Plus size={16} />}
                onClick={() => addParameter('tariffParameters')}
                size="small"
                sx={{ mt: 1 }}
              >
                Add Parameter
              </Button>
            )}
          </Collapse>
        </Paper>

        {/* Financial Parameters */}
        <Paper elevation={0} sx={{ p: 2, mb: 3, border: '1px solid #e0e0e0' }}>
          <SectionHeader 
            title="Financial Parameters" 
            section="financialParameters"
            helpText="Configure financial parameters for the simulation" 
          />

          <Collapse in={expandedSections.financialParameters}>
            {config.financialParameters.map((param, index) => (
              <Box key={param.id} sx={{ mb: 3 }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid sx={{ width: '100%' }}>
                    <Typography variant="subtitle2">
                      {param.name}: {formatValue(param.value, param.unit)}
                    </Typography>
                  </Grid>
                  <Grid sx={{ width: { xs: '100%', md: '50%' } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="caption" sx={{ mr: 1, minWidth: isMobile ? '40px' : 'auto' }}>Min:</Typography>
                      <TextField
                        size="small"
                        value={param.min}
                        onChange={(e) => handleParameterChange(
                          'financialParameters',
                          param.id,
                          'min',
                          typeof param.min === 'number' ? Number(e.target.value) : e.target.value
                        )}
                        sx={{ width: '100%' }}
                        inputProps={typeof param.min === 'number' ? { inputMode: 'decimal' } : {}}
                      />
                    </Box>
                  </Grid>
                  <Grid sx={{ width: { xs: '100%', md: '50%' } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="caption" sx={{ mr: 1, minWidth: isMobile ? '40px' : 'auto' }}>Max:</Typography>
                      <TextField
                        size="small"
                        value={param.max}
                        onChange={(e) => handleParameterChange(
                          'financialParameters',
                          param.id,
                          'max',
                          typeof param.max === 'number' ? Number(e.target.value) : e.target.value
                        )}
                        sx={{ width: '100%' }}
                        inputProps={typeof param.max === 'number' ? { inputMode: 'decimal' } : {}}
                      />
                    </Box>
                  </Grid>
                  <Grid sx={{ width: '100%' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="caption" sx={{ mr: 1, minWidth: isMobile ? '90px' : 'auto' }}>Distribution:</Typography>
                      <FormControl size="small" sx={{ width: isMobile ? '100%' : '200px' }}>
                        <Select
                          value={param.distribution}
                          onChange={(e) => handleParameterChange(
                            'financialParameters',
                            param.id,
                            'distribution',
                            e.target.value as DistributionType
                          )}
                        >
                          <MenuItem value="Normal">Normal</MenuItem>
                          <MenuItem value="Uniform">Uniform</MenuItem>
                        </Select>
                      </FormControl>
                      <Tooltip title={param.description}>
                        <IconButton size="small" sx={{ ml: 1 }}>
                          <Info size={16} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Grid>
                </Grid>
                {index < config.financialParameters.length - 1 && (
                  <Divider sx={{ my: 2 }} />
                )}
              </Box>
            ))}

            {isMobile ? (
              <TouchButton
                variant="secondary"
                leftIcon={<Plus size={16} />}
                onClick={(e) => addParameter('financialParameters')}
                fullWidth
              >
                Add Parameter
              </TouchButton>
            ) : (
              <Button
                variant="outlined"
                startIcon={<Plus size={16} />}
                onClick={() => addParameter('financialParameters')}
                size="small"
                sx={{ mt: 1 }}
              >
                Add Parameter
              </Button>
            )}
          </Collapse>
        </Paper>

        {/* Simulation Settings */}
        <Paper elevation={0} sx={{ p: 2, mb: 3, border: '1px solid #e0e0e0' }}>
          <SectionHeader 
            title="Simulation Settings" 
            section="simulationSettings"
            helpText="Configure detailed settings for the Monte Carlo simulation" 
          />

          <Collapse in={expandedSections.simulationSettings}>
            <Grid container spacing={2}>
              <Grid sx={{ width: '100%' }}>
                {renderPrecisionControls()}
              </Grid>

              <Grid sx={{ width: '100%' }}>
                <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
                  Iterations: {config.simulationSettings.iterations.toLocaleString()}
                </Typography>
              </Grid>

              <Grid sx={{ width: '100%' }}>
                <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>Case Boundaries</Typography>
                
                <Grid container spacing={2}>
                  <Grid sx={{ width: '100%' }}>
                    <Typography variant="body2">
                      Pessimistic: {config.simulationSettings.caseBoundaries.pessimistic[0]}% - {config.simulationSettings.caseBoundaries.pessimistic[1]}%
                    </Typography>
                    <Slider
                      value={config.simulationSettings.caseBoundaries.pessimistic}
                      onChange={(_, value) => handleCaseBoundaryChange('pessimistic', 1, (value as number[])[1])}
                      valueLabelDisplay="auto"
                      min={0}
                      max={100}
                      disabled
                      sx={{
                        color: '#d60542',
                        '& .MuiSlider-thumb': {
                          display: 'none'
                        }
                      }}
                    />
                  </Grid>
                  
                  <Grid sx={{ width: '100%' }}>
                    <Typography variant="body2">
                      Realistic: {config.simulationSettings.caseBoundaries.realistic[0]}% - {config.simulationSettings.caseBoundaries.realistic[1]}%
                    </Typography>
                    <Slider
                      value={config.simulationSettings.caseBoundaries.realistic}
                      onChange={(_, value) => {
                        const values = value as number[];
                        handleCaseBoundaryChange('realistic', 0, values[0]);
                        handleCaseBoundaryChange('realistic', 1, values[1]);
                      }}
                      valueLabelDisplay="auto"
                      min={0}
                      max={100}
                      sx={{ 
                        color: '#3267d4',
                        '& .MuiSlider-thumb': {
                          width: isMobile ? 24 : 16,
                          height: isMobile ? 24 : 16,
                        }
                      }}
                    />
                  </Grid>
                  
                  <Grid sx={{ width: '100%' }}>
                    <Typography variant="body2">
                      Optimistic: {config.simulationSettings.caseBoundaries.optimistic[0]}% - {config.simulationSettings.caseBoundaries.optimistic[1]}%
                    </Typography>
                    <Slider
                      value={config.simulationSettings.caseBoundaries.optimistic}
                      onChange={(_, value) => handleCaseBoundaryChange('optimistic', 0, (value as number[])[0])}
                      valueLabelDisplay="auto"
                      min={0}
                      max={100}
                      disabled
                      sx={{
                        color: '#31ddc1',
                        '& .MuiSlider-thumb': {
                          display: 'none'
                        }
                      }}
                    />
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </Collapse>
        </Paper>

        {isMobile ? (
          <TouchButton
            variant="primary"
            onClick={(e) => handleRunSimulation()}
            fullWidth
            className="bg-primary text-white hover:bg-primary-dark"
          >
            Run Simulation
          </TouchButton>
        ) : (
          <Button
            variant="contained"
            fullWidth
            onClick={handleRunSimulation}
            sx={{ 
              mt: 2, 
              bgcolor: '#042278', 
              '&:hover': { 
                bgcolor: '#031a5e' 
              }
            }}
          >
            Run Simulation
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default VietnamMonteCarloParams;