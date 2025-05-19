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
  Paper
} from '@mui/material';
import { Info, Plus, HelpCircle } from 'lucide-react';
import { DistributionType, SimulationConfig, SimulationParameter } from '../types/MonteCarloTypes';

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
 * Allows users to configure Monte Carlo simulation parameters specific to Vietnam tariffs
 */
export const VietnamMonteCarloParams: React.FC<VietnamMonteCarloParamsProps> = ({
  initialConfig,
  onConfigChange,
  onRunSimulation
}) => {
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
      description: 'Custom parameter description'
    };

    setConfig({
      ...config,
      [paramType]: [...config[paramType], newParam]
    });
  };

  // Run simulation
  const handleRunSimulation = () => {
    if (onRunSimulation) {
      onRunSimulation(config);
    }
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
          '& .MuiCardHeader-action': { color: 'white' }
        }}
      />
      <CardContent>
        {/* Product Information */}
        <Paper elevation={0} sx={{ p: 2, mb: 3, border: '1px solid #e0e0e0' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
              Product Information
            </Typography>
            <Tooltip title="Enter the 8-digit HS code to identify the product category">
              <IconButton size="small">
                <HelpCircle size={16} />
              </IconButton>
            </Tooltip>
          </Box>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                label="HS Code"
                value={config.productInfo.hsCode}
                onChange={handleHSCodeChange}
                fullWidth
                placeholder="e.g., 85287280"
                helperText="Enter 8-digit HS code"
                sx={{ mb: 2 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Product Description"
                value={config.productInfo.productDescription}
                disabled
                fullWidth
                sx={{ mb: 2 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Section"
                value={config.productInfo.section}
                disabled
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Section Description"
                value={config.productInfo.sectionDescription}
                disabled
                fullWidth
              />
            </Grid>
          </Grid>
        </Paper>

        {/* Tariff Parameters */}
        <Paper elevation={0} sx={{ p: 2, mb: 3, border: '1px solid #e0e0e0' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
              Tariff Parameters
            </Typography>
            <Tooltip title="Configure tariff-related parameters for the simulation">
              <IconButton size="small">
                <HelpCircle size={16} />
              </IconButton>
            </Tooltip>
          </Box>

          {config.tariffParameters.map((param, index) => (
            <Box key={param.id} sx={{ mb: 3 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12}>
                  <Typography variant="subtitle2">
                    {param.name}: {formatValue(param.value, param.unit)}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="caption" sx={{ mr: 1 }}>Min:</Typography>
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
                    />
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="caption" sx={{ mr: 1 }}>Max:</Typography>
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
                    />
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="caption" sx={{ mr: 1 }}>Distribution:</Typography>
                    <FormControl size="small" sx={{ width: '200px' }}>
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

          <Button
            variant="outlined"
            startIcon={<Plus size={16} />}
            onClick={() => addParameter('tariffParameters')}
            size="small"
            sx={{ mt: 1 }}
          >
            Add Parameter
          </Button>
        </Paper>

        {/* Financial Parameters */}
        <Paper elevation={0} sx={{ p: 2, mb: 3, border: '1px solid #e0e0e0' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
              Financial Parameters
            </Typography>
            <Tooltip title="Configure financial parameters for the simulation">
              <IconButton size="small">
                <HelpCircle size={16} />
              </IconButton>
            </Tooltip>
          </Box>

          {config.financialParameters.map((param, index) => (
            <Box key={param.id} sx={{ mb: 3 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12}>
                  <Typography variant="subtitle2">
                    {param.name}: {formatValue(param.value, param.unit)}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="caption" sx={{ mr: 1 }}>Min:</Typography>
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
                    />
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="caption" sx={{ mr: 1 }}>Max:</Typography>
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
                    />
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="caption" sx={{ mr: 1 }}>Distribution:</Typography>
                    <FormControl size="small" sx={{ width: '200px' }}>
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

          <Button
            variant="outlined"
            startIcon={<Plus size={16} />}
            onClick={() => addParameter('financialParameters')}
            size="small"
            sx={{ mt: 1 }}
          >
            Add Parameter
          </Button>
        </Paper>

        {/* Simulation Settings */}
        <Paper elevation={0} sx={{ p: 2, mb: 3, border: '1px solid #e0e0e0' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
              Simulation Settings
            </Typography>
            <Tooltip title="Configure detailed settings for the Monte Carlo simulation">
              <IconButton size="small">
                <HelpCircle size={16} />
              </IconButton>
            </Tooltip>
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Precision</Typography>
              <FormControl component="fieldset">
                <Grid container spacing={2}>
                  <Grid item>
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
                  <Grid item>
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
                  <Grid item>
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
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
                Iterations: {config.simulationSettings.iterations.toLocaleString()}
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>Case Boundaries</Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
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
                
                <Grid item xs={12}>
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
                    sx={{ color: '#3267d4' }}
                  />
                </Grid>
                
                <Grid item xs={12}>
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
        </Paper>

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
      </CardContent>
    </Card>
  );
};

export default VietnamMonteCarloParams;
