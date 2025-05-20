import React, { useEffect, useState, useRef } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Slider, 
  Button, 
  Chip, 
  Divider,
  CircularProgress,
  useTheme,
  alpha
} from '@mui/material';
import { useSpring, animated, config } from '@react-spring/web';
import { 
  FinanceIcon, 
  ChartIcon, 
  SparklesIcon, 
  DataIcon, 
  TrendIcon,
  AlertIcon,
  ChevronIcon,
  ArrowIcon
} from './icons';
import PerplexityParticles from './effects/PerplexityParticles';
import useEnhancedMicroInteractions from '../hooks/useEnhancedMicroInteractions';

// Standard colors for the application
const PRIMARY_COLOR = '#042278';
const ACCENT_COLOR = '#31ddc1';
const INFO_COLOR = '#2196f3';
const WARNING_COLOR = '#ed6c02';
const ERROR_COLOR = '#d32f2f';
const SUCCESS_COLOR = '#2e7d32';

// Chart canvas dimensions
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 400;

// Particle types for the simulation visualization
interface Particle {
  x: number;
  y: number;
  radius: number;
  color: string;
  vx: number;
  vy: number;
  opacity: number;
  life: number;
  maxLife: number;
}

interface SimulationParameter {
  name: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  description: string;
  impact: 'high' | 'medium' | 'low';
  unit?: string;
}

interface SimulationResult {
  outcome: number;
  confidence: number;
  iterations: number;
  distributionData: Array<{ x: number; y: number; }>;
  status: 'success' | 'warning' | 'error' | 'info';
  insights: string[];
  tradeImpacts: {
    imports: number;
    exports: number;
    balance: number;
  };
  duration: number;
}

interface EnhancedMonteCarloSimulationProps {
  parameters?: SimulationParameter[];
  defaultIterations?: number;
  onSimulationComplete?: (results: SimulationResult) => void;
  showParticles?: boolean;
  highPerformance?: boolean;
  title?: string;
  historyMode?: boolean;
  selectedResult?: SimulationResult;
  mode?: 'standard' | 'comparison' | 'analysis';
  aiEnhanced?: boolean;
}

const EnhancedMonteCarloSimulation: React.FC<EnhancedMonteCarloSimulationProps> = ({
  parameters = [],
  defaultIterations = 1000,
  onSimulationComplete,
  showParticles = true,
  highPerformance = true,
  title = "Monte Carlo Tariff Simulation",
  historyMode = false,
  selectedResult,
  mode = 'standard',
  aiEnhanced = true,
}) => {
  const theme = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const particlesRef = useRef<Particle[]>([]);
  
  const [iterations, setIterations] = useState(defaultIterations);
  const [paramValues, setParamValues] = useState<{[key: string]: number}>({});
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<SimulationResult | null>(
    selectedResult || null
  );
  const [currentIteration, setCurrentIteration] = useState(0);
  const [showAnimation, setShowAnimation] = useState(false);
  const [simulationDone, setSimulationDone] = useState(historyMode);
  const [reduceAnimations, setReduceAnimations] = useState(false);
  
  // Get our micro-interactions
  const { 
    createAnimation, 
    FadeIn, 
    Pulse, 
    animated: animatedComponents
  } = useEnhancedMicroInteractions();

  // Initialize parameters
  useEffect(() => {
    const initialParams: {[key: string]: number} = {};
    parameters.forEach(param => {
      initialParams[param.name] = param.value;
    });
    setParamValues(initialParams);
  }, [parameters]);

  // Handle parameter changes
  const handleParamChange = (name: string, value: number) => {
    setParamValues(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Set up the canvas and animation
  useEffect(() => {
    if (!canvasRef.current || !showAnimation) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set up canvas
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    
    // Initialize particles
    const particleCount = highPerformance ? 150 : 80;
    const particles: Particle[] = [];
    
    for (let i = 0; i < particleCount; i++) {
      particles.push(createParticle());
    }
    
    particlesRef.current = particles;
    
    // Animation function
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw axis
      drawAxis(ctx);
      
      // Update and draw particles
      particlesRef.current.forEach((particle, index) => {
        // Update particle
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.life += 1;
        
        // Boundary checks with bounce
        if (particle.x - particle.radius < 50 || particle.x + particle.radius > canvas.width - 30) {
          particle.vx = -particle.vx * 0.8;
          particle.x += particle.vx;
        }
        
        if (particle.y - particle.radius < 50 || particle.y + particle.radius > canvas.height - 30) {
          particle.vy = -particle.vy * 0.8;
          particle.y += particle.vy;
        }
        
        // Fade out old particles
        if (particle.life > particle.maxLife) {
          particle.opacity -= 0.01;
          if (particle.opacity <= 0) {
            // Replace with new particle
            particlesRef.current[index] = createParticle();
          }
        }
        
        // Draw particle
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fillStyle = `${particle.color}${Math.floor(particle.opacity * 255).toString(16).padStart(2, '0')}`;
        ctx.fill();
      });
      
      // Draw distribution curve when simulation is running/complete
      if (isRunning || simulationDone) {
        drawDistribution(ctx);
      }
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [showAnimation, highPerformance, isRunning, simulationDone]);

  // Create a single particle
  const createParticle = (): Particle => {
    // Ensure particles start within the chart area
    const x = Math.random() * (CANVAS_WIDTH - 100) + 50;
    const y = Math.random() * (CANVAS_HEIGHT - 100) + 50;
    const radius = Math.random() * 3 + 1;
    
    // Color palette
    const colors = [
      PRIMARY_COLOR,
      ACCENT_COLOR,
      alpha(PRIMARY_COLOR, 0.7),
      alpha(ACCENT_COLOR, 0.7),
    ];
    
    const color = colors[Math.floor(Math.random() * colors.length)];
    const speed = Math.random() * 0.5 + 0.1;
    const angle = Math.random() * Math.PI * 2;
    
    return {
      x,
      y,
      radius,
      color,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      opacity: Math.random() * 0.5 + 0.3,
      life: 0,
      maxLife: Math.random() * 300 + 200,
    };
  };

  // Draw the axis and labels
  const drawAxis = (ctx: CanvasRenderingContext2D) => {
    ctx.save();
    
    // X-axis
    ctx.beginPath();
    ctx.moveTo(50, CANVAS_HEIGHT - 30);
    ctx.lineTo(CANVAS_WIDTH - 30, CANVAS_HEIGHT - 30);
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Y-axis
    ctx.beginPath();
    ctx.moveTo(50, 50);
    ctx.lineTo(50, CANVAS_HEIGHT - 30);
    ctx.stroke();
    
    // Labels
    ctx.font = '12px Arial';
    ctx.fillStyle = '#666';
    ctx.textAlign = 'center';
    
    // X-axis tick marks and labels
    for (let i = 0; i < 5; i++) {
      const x = 50 + (CANVAS_WIDTH - 80) * (i / 4);
      ctx.beginPath();
      ctx.moveTo(x, CANVAS_HEIGHT - 30);
      ctx.lineTo(x, CANVAS_HEIGHT - 25);
      ctx.stroke();
      
      // Value labels for the x-axis
      const value = (-10 + i * 10).toFixed(0);
      ctx.fillText(value + '%', x, CANVAS_HEIGHT - 10);
    }
    
    // Y-axis tick marks and labels
    for (let i = 0; i < 5; i++) {
      const y = CANVAS_HEIGHT - 30 - (CANVAS_HEIGHT - 80) * (i / 4);
      ctx.beginPath();
      ctx.moveTo(50, y);
      ctx.lineTo(45, y);
      ctx.stroke();
      
      // Probability labels
      const prob = (i * 25).toFixed(0);
      ctx.textAlign = 'right';
      ctx.fillText(prob + '%', 40, y + 4);
    }
    
    // Axis titles
    ctx.font = '14px Arial';
    ctx.fillStyle = '#444';
    ctx.textAlign = 'center';
    ctx.fillText('Tariff Impact (%)', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 2);
    
    ctx.save();
    ctx.translate(15, CANVAS_HEIGHT / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Probability', 0, 0);
    ctx.restore();
    
    ctx.restore();
  };

  // Draw the distribution curve based on simulation results
  const drawDistribution = (ctx: CanvasRenderingContext2D) => {
    if (!results?.distributionData) return;
    
    ctx.save();
    
    // Fill area under curve
    ctx.beginPath();
    ctx.moveTo(50, CANVAS_HEIGHT - 30);
    
    // Map data points to canvas coordinates
    results.distributionData.forEach((point, index) => {
      // Normalize values to fit the canvas
      const x = 50 + (CANVAS_WIDTH - 80) * ((point.x + 10) / 20); // Map -10 to 10 to canvas width
      const y = CANVAS_HEIGHT - 30 - (CANVAS_HEIGHT - 80) * (point.y / 100); // Map 0-100% to canvas height
      
      if (index === 0) {
        ctx.moveTo(x, CANVAS_HEIGHT - 30);
        ctx.lineTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    
    // Complete the path back to the x-axis
    ctx.lineTo(CANVAS_WIDTH - 30, CANVAS_HEIGHT - 30);
    ctx.closePath();
    
    // Fill with gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, `${ACCENT_COLOR}60`);
    gradient.addColorStop(1, `${ACCENT_COLOR}10`);
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Draw the curve
    ctx.beginPath();
    
    results.distributionData.forEach((point, index) => {
      const x = 50 + (CANVAS_WIDTH - 80) * ((point.x + 10) / 20);
      const y = CANVAS_HEIGHT - 30 - (CANVAS_HEIGHT - 80) * (point.y / 100);
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    
    ctx.strokeStyle = ACCENT_COLOR;
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // Highlight the outcome point
    if (results.outcome !== undefined) {
      const outcomeX = 50 + (CANVAS_WIDTH - 80) * ((results.outcome + 10) / 20);
      const outcomeIndex = Math.floor((results.outcome + 10) / 20 * results.distributionData.length);
      const outcomePoint = results.distributionData[outcomeIndex] || results.distributionData[0];
      const outcomeY = CANVAS_HEIGHT - 30 - (CANVAS_HEIGHT - 80) * (outcomePoint.y / 100);
      
      // Draw vertical line to the outcome
      ctx.beginPath();
      ctx.moveTo(outcomeX, CANVAS_HEIGHT - 30);
      ctx.lineTo(outcomeX, outcomeY);
      ctx.setLineDash([5, 3]);
      ctx.strokeStyle = '#666';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Draw point at the outcome
      ctx.beginPath();
      ctx.arc(outcomeX, outcomeY, 6, 0, Math.PI * 2);
      ctx.fillStyle = PRIMARY_COLOR;
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Label the outcome
      ctx.font = 'bold 12px Arial';
      ctx.fillStyle = PRIMARY_COLOR;
      ctx.textAlign = 'center';
      ctx.fillText(`${results.outcome.toFixed(2)}%`, outcomeX, outcomeY - 15);
    }
    
    ctx.restore();
  };

  // Run the Monte Carlo simulation
  const runSimulation = () => {
    if (isRunning) return;
    
    setIsRunning(true);
    setProgress(0);
    setCurrentIteration(0);
    setShowAnimation(true);
    
    // Simulate running the Monte Carlo algorithm
    const totalIterations = iterations;
    let currentIter = 0;
    const startTime = Date.now();
    
    // Create a simple normal distribution for demo purposes
    const generateDistribution = () => {
      const data = [];
      // Generate bell curve data points
      for (let i = -10; i <= 10; i += 0.5) {
        // Calculate bell curve height at this x value
        // Mean around some value influenced by parameters
        const paramSum = Object.values(paramValues).reduce((a, b) => a + b, 0);
        const mean = (paramSum / (parameters.length || 1)) * 0.1;
        
        // Standard deviation based on the variance of parameters
        const stdDev = 3 - Math.min(2, paramValues.volatility / 50) || 3;
        
        // Bell curve formula
        const y = (1 / (stdDev * Math.sqrt(2 * Math.PI))) * 
                 Math.exp(-0.5 * Math.pow((i - mean) / stdDev, 2));
        
        // Scale to percentage (0-100)
        const scaledY = y * 100 * 2.5;
        
        data.push({ x: i, y: scaledY });
      }
      return data;
    };
    
    // Simulate the iterative process of Monte Carlo
    const simulationTimer = setInterval(() => {
      // Update progress
      currentIter += Math.floor(Math.random() * 50) + 10;
      if (currentIter > totalIterations) currentIter = totalIterations;
      
      const newProgress = (currentIter / totalIterations) * 100;
      setProgress(newProgress);
      setCurrentIteration(currentIter);
      
      // Complete simulation when done
      if (currentIter >= totalIterations) {
        clearInterval(simulationTimer);
        
        // Generate final results
        const distributionData = generateDistribution();
        const paramSum = Object.values(paramValues).reduce((a, b) => a + b, 0);
        const baseOutcome = (paramSum / (parameters.length || 1)) * 0.1;
        
        // Add some randomness to the outcome
        const outcome = baseOutcome + (Math.random() * 2 - 1);
        
        // Determine status based on outcome
        let status: 'success' | 'warning' | 'error' | 'info' = 'info';
        if (outcome > 2) status = 'success';
        else if (outcome < -2) status = 'error';
        else if (Math.abs(outcome) > 1) status = 'warning';
        
        // Create simulation results
        const simulationResults: SimulationResult = {
          outcome,
          confidence: Math.random() * 0.2 + 0.7, // 70-90% confidence
          iterations: totalIterations,
          distributionData,
          status,
          insights: [
            'Tariff reductions will likely have a positive impact on electronics exports',
            'Agricultural imports may face increased duties under new regulations',
            'EU trade agreement provides most favorable tariff conditions compared to regional alternatives',
            'Currency fluctuations have moderate impact on effective tariff rates',
            'Secondary effects on supply chain costs projected to be minimal'
          ],
          tradeImpacts: {
            imports: outcome * -0.8, // Opposite effect on imports
            exports: outcome * 1.2,  // Slightly higher impact on exports
            balance: outcome * 0.4   // Net effect on trade balance
          },
          duration: Date.now() - startTime
        };
        
        setResults(simulationResults);
        setIsRunning(false);
        setSimulationDone(true);
        
        // Callback with results
        if (onSimulationComplete) {
          onSimulationComplete(simulationResults);
        }
      }
    }, 50); // Update every 50ms for smooth progress
    
    // Cleanup
    return () => clearInterval(simulationTimer);
  };

  // Reset the simulation
  const resetSimulation = () => {
    setSimulationDone(false);
    setResults(null);
    setProgress(0);
    setCurrentIteration(0);
  };

  // Prepare animation properties
  const progressSpring = useSpring({
    width: `${progress}%`,
    config: config.molasses,
  });
  
  const parameterSpring = useSpring({
    opacity: isRunning ? 0.6 : 1,
    transform: isRunning ? 'scale(0.98)' : 'scale(1)',
    config: config.gentle,
  });
  
  const resultsSpringProps = useSpring({
    opacity: results ? 1 : 0,
    transform: results ? 'translateY(0px)' : 'translateY(20px)',
    config: config.gentle,
  });

  return (
    <Box>
      {/* Title with animation */}
      <Box 
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 3,
        }}
      >
        <Typography 
          variant="h5" 
          component={FadeIn}
          sx={{ 
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            color: PRIMARY_COLOR,
          }}
        >
          <DataIcon
            variant="sankey"
            size={28} 
            style={{ marginRight: 12 }} 
            animation={isRunning ? "pulse" : "none"}
            color={ACCENT_COLOR}
          />
          {title}
          {aiEnhanced && (
            <SparklesIcon
              size={16}
              style={{ marginLeft: 8 }}
              animation="pulse"
              color={ACCENT_COLOR}
            />
          )}
        </Typography>
        
        {/* Mode indicator */}
        <Chip
          label={mode.charAt(0).toUpperCase() + mode.slice(1)}
          size="small"
          color={
            mode === 'comparison' ? 'info' :
            mode === 'analysis' ? 'success' : 
            'default'
          }
          variant="outlined"
          sx={{ fontWeight: 500 }}
        />
      </Box>
      
      <Grid container spacing={3}>
        {/* Parameters Panel */}
        <Grid sx={{ 
          width: { 
            xs: '100%', 
            md: mode === 'analysis' ? '100%' : '33.33%' 
          } 
        }}>
          <animated.div 
            style={parameterSpring}
          >
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 2,
                border: '1px solid',
                borderColor: theme.palette.divider,
                backgroundColor: '#fafafa',
                mb: { xs: 3, md: 0 },
              }}
            >
            <Typography 
              variant="subtitle1"
              gutterBottom
              sx={{
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <FinanceIcon
                variant="investment"
                size={18}
                style={{ marginRight: 8 }}
                animation="none"
                color={PRIMARY_COLOR}
              />
              Simulation Parameters
            </Typography>
            
            {/* Iteration slider */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">
                  Iterations
                </Typography>
                <Typography variant="body2" fontWeight={500}>
                  {iterations.toLocaleString()}
                </Typography>
              </Box>
              <Slider
                value={iterations}
                min={100}
                max={10000}
                step={100}
                onChange={(_, value) => setIterations(value as number)}
                disabled={isRunning}
                sx={{
                  '& .MuiSlider-thumb': {
                    backgroundColor: PRIMARY_COLOR,
                  },
                  '& .MuiSlider-track': {
                    backgroundColor: PRIMARY_COLOR,
                  },
                }}
              />
            </Box>
            
            {/* Model parameters */}
            <Box sx={{ mb: 2 }}>
              {parameters.map(param => (
                <Box key={param.name} sx={{ mb: 2 }}>
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="body2">
                        {param.label}
                      </Typography>
                      
                      {/* Parameter impact indicator */}
                      <Chip
                        label={param.impact}
                        size="small"
                        sx={{
                          ml: 1,
                          height: 20,
                          fontSize: '0.6rem',
                          backgroundColor: 
                            param.impact === 'high' ? alpha(ERROR_COLOR, 0.1) :
                            param.impact === 'medium' ? alpha(WARNING_COLOR, 0.1) :
                            alpha(SUCCESS_COLOR, 0.1),
                          color:
                            param.impact === 'high' ? ERROR_COLOR :
                            param.impact === 'medium' ? WARNING_COLOR :
                            SUCCESS_COLOR,
                          fontWeight: 600,
                        }}
                      />
                    </Box>
                    <Typography variant="body2" fontWeight={500}>
                      {paramValues[param.name]?.toFixed(1)}{param.unit}
                    </Typography>
                  </Box>
                  
                  <Slider
                    value={paramValues[param.name] || param.value}
                    min={param.min}
                    max={param.max}
                    step={param.step}
                    onChange={(_, value) => handleParamChange(param.name, value as number)}
                    disabled={isRunning}
                    sx={{
                      '& .MuiSlider-thumb': {
                        backgroundColor: 
                          param.impact === 'high' ? ERROR_COLOR :
                          param.impact === 'medium' ? WARNING_COLOR :
                          SUCCESS_COLOR,
                      },
                      '& .MuiSlider-track': {
                        backgroundColor: 
                          param.impact === 'high' ? ERROR_COLOR :
                          param.impact === 'medium' ? WARNING_COLOR :
                          SUCCESS_COLOR,
                      },
                    }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {param.description}
                  </Typography>
                </Box>
              ))}
            </Box>
            
            {/* Action buttons */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
              <Button
                variant="outlined"
                onClick={resetSimulation}
                disabled={isRunning || (!simulationDone && !historyMode)}
                sx={{ 
                  textTransform: 'none',
                  borderColor: PRIMARY_COLOR,
                  color: PRIMARY_COLOR,
                }}
              >
                Reset
              </Button>
              <Button
                variant="contained"
                onClick={runSimulation}
                disabled={isRunning || historyMode}
                sx={{ 
                  textTransform: 'none',
                  backgroundColor: PRIMARY_COLOR,
                  '&:hover': {
                    backgroundColor: alpha(PRIMARY_COLOR, 0.9),
                  },
                }}
                startIcon={
                  isRunning ? 
                  <CircularProgress size={16} color="inherit" /> : 
                  <ArrowIcon size={16} animation="none" color="white" />
                }
              >
                {isRunning ? 'Running...' : historyMode ? 'Simulation Complete' : 'Run Simulation'}
              </Button>
            </Box>
            </Paper>
          </animated.div>
        </Grid>
        
        {/* Visualization Panel */}
        <Grid sx={{ 
          width: { 
            xs: '100%', 
            md: mode === 'analysis' ? '100%' : '66.67%' 
          } 
        }}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 2,
              border: '1px solid',
              borderColor: theme.palette.divider,
              position: 'relative',
              overflow: 'hidden',
              height: mode === 'analysis' ? 'auto' : 500,
            }}
          >
            {/* Background particles */}
            {showParticles && !reduceAnimations && (
              <Box 
                sx={{ 
                  position: 'absolute', 
                  top: 0, 
                  left: 0, 
                  right: 0, 
                  bottom: 0,
                  opacity: 0.1,
                  pointerEvents: 'none',
                }}
              >
                <PerplexityParticles 
                  count={30}
                  color="#042278"
                  speed={0.3}
                  opacity={0.2}
                  style={{ width: '100%', height: '100%' }}
                />
              </Box>
            )}
            
            {/* Progress bar */}
            {isRunning && (
              <Box 
                sx={{ 
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 4,
                  backgroundColor: alpha(ACCENT_COLOR, 0.2),
                  zIndex: 2,
                }}
              >
                <animated.div
                  style={{
                    ...progressSpring,
                    height: '100%',
                    backgroundColor: ACCENT_COLOR,
                  }}
                />
              </Box>
            )}
            
            {/* Simulation status */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <ChartIcon
                  variant="bar"
                  size={18}
                  style={{ marginRight: 8 }}
                  animation={isRunning ? "pulse" : "none"}
                  color={ACCENT_COLOR}
                />
                Distribution Visualization
              </Typography>
              
              {isRunning ? (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box 
                    component={Pulse}
                    sx={{ 
                      width: 8, 
                      height: 8, 
                      borderRadius: '50%', 
                      backgroundColor: ACCENT_COLOR,
                      mr: 1,
                    }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    Running iteration {currentIteration.toLocaleString()} of {iterations.toLocaleString()}
                  </Typography>
                </Box>
              ) : results ? (
                <Chip
                  label={`Completed • ${results.iterations.toLocaleString()} iterations`}
                  size="small"
                  color="success"
                  sx={{ height: 24 }}
                />
              ) : (
                <Typography variant="caption" color="text.secondary">
                  Configure parameters and run simulation
                </Typography>
              )}
            </Box>
            
            {/* Canvas for simulation visualization */}
            <Box 
              sx={{ 
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: 420,
                position: 'relative',
              }}
            >
              <canvas
                ref={canvasRef}
                style={{
                  width: '100%',
                  height: '100%',
                  display: showAnimation ? 'block' : 'none',
                }}
              />
              
              {!showAnimation && !isRunning && (
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    width: '100%',
                  }}
                >
                  <DataIcon
                    variant="bar"
                    size={60}
                    animation="pulse"
                    color={alpha(PRIMARY_COLOR, 0.3)}
                  />
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ mt: 2, maxWidth: 300, textAlign: 'center' }}
                  >
                    Run the simulation to see the distribution visualization
                  </Typography>
                </Box>
              )}
            </Box>
            
            {/* Simulation Results */}
            {results && (
              <animated.div
                style={{
                  ...resultsSpringProps,
                  marginTop: 20,
                }}
              >
                <Divider sx={{ my: 2 }} />
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography
                    variant="subtitle1"
                    sx={{
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <SparklesIcon
                      size={18}
                      style={{ marginRight: 8 }}
                      animation="pulse"
                      color={ACCENT_COLOR}
                    />
                    Simulation Results
                  </Typography>
                  
                  <Chip
                    label={`${(results.confidence * 100).toFixed(0)}% confidence`}
                    size="small"
                    color="info"
                    sx={{ height: 24 }}
                  />
                </Box>
                
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  {/* Outcome */}
                  <Grid sx={{ width: { xs: '100%', sm: '33.33%' } }}>
                    <Box
                      sx={{
                        p: 2,
                        border: '1px solid',
                        borderColor: theme.palette.divider,
                        borderRadius: 1,
                        backgroundColor: alpha(
                          results.status === 'success' ? SUCCESS_COLOR :
                          results.status === 'warning' ? WARNING_COLOR :
                          results.status === 'error' ? ERROR_COLOR :
                          INFO_COLOR, 0.05
                        ),
                      }}
                    >
                      <Typography variant="overline" color="text.secondary">
                        Tariff Impact
                      </Typography>
                      <Typography
                        variant="h5"
                        sx={{
                          fontWeight: 600,
                          color: 
                            results.status === 'success' ? SUCCESS_COLOR :
                            results.status === 'warning' ? WARNING_COLOR :
                            results.status === 'error' ? ERROR_COLOR :
                            INFO_COLOR,
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        {results.outcome > 0 ? '+' : ''}{results.outcome.toFixed(2)}%
                        <TrendIcon
                          variant={results.outcome >= 0 ? 'up' : 'down'}
                          size={16}
                          style={{ marginLeft: 8 }}
                          animation="pulse"
                          color="currentColor"
                        />
                      </Typography>
                    </Box>
                  </Grid>
                  
                  {/* Trade balance impacts */}
                  <Grid sx={{ width: { xs: '100%', sm: '66.67%' } }}>
                    <Box
                      sx={{
                        p: 2,
                        border: '1px solid',
                        borderColor: theme.palette.divider,
                        borderRadius: 1,
                      }}
                    >
                      <Typography variant="overline" color="text.secondary">
                        Trade Impacts
                      </Typography>
                      <Grid container spacing={1}>
                        <Grid sx={{ width: '33.33%' }}>
                          <Typography variant="caption" color="text.secondary">
                            Imports
                          </Typography>
                          <Typography
                            variant="body1"
                            sx={{
                              fontWeight: 600,
                              color: results.tradeImpacts.imports >= 0 ? SUCCESS_COLOR : ERROR_COLOR,
                            }}
                          >
                            {results.tradeImpacts.imports > 0 ? '+' : ''}{results.tradeImpacts.imports.toFixed(2)}%
                          </Typography>
                        </Grid>
                        <Grid sx={{ width: '33.33%' }}>
                          <Typography variant="caption" color="text.secondary">
                            Exports
                          </Typography>
                          <Typography
                            variant="body1"
                            sx={{
                              fontWeight: 600,
                              color: results.tradeImpacts.exports >= 0 ? SUCCESS_COLOR : ERROR_COLOR,
                            }}
                          >
                            {results.tradeImpacts.exports > 0 ? '+' : ''}{results.tradeImpacts.exports.toFixed(2)}%
                          </Typography>
                        </Grid>
                        <Grid sx={{ width: '33.33%' }}>
                          <Typography variant="caption" color="text.secondary">
                            Balance
                          </Typography>
                          <Typography
                            variant="body1"
                            sx={{
                              fontWeight: 600,
                              color: results.tradeImpacts.balance >= 0 ? SUCCESS_COLOR : ERROR_COLOR,
                            }}
                          >
                            {results.tradeImpacts.balance > 0 ? '+' : ''}{results.tradeImpacts.balance.toFixed(2)}%
                          </Typography>
                        </Grid>
                      </Grid>
                    </Box>
                  </Grid>
                
                  {/* Insights */}
                  {mode === 'analysis' && (
                    <Grid sx={{ width: '100%' }}>
                      <Box
                        sx={{
                          p: 2,
                          border: '1px solid',
                          borderColor: theme.palette.divider,
                          borderRadius: 1,
                          bgcolor: alpha(PRIMARY_COLOR, 0.03),
                        }}
                      >
                        <Typography 
                          variant="subtitle2"
                          gutterBottom
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                          }}
                        >
                          <SparklesIcon
                            size={16}
                            style={{ marginRight: 6 }}
                            animation="pulse"
                            color={ACCENT_COLOR}
                          />
                          AI-Enhanced Insights
                        </Typography>
                        <Box component="ul" sx={{ pl: 2, mb: 0, mt: 1 }}>
                          {results.insights.map((insight, index) => (
                            <Typography 
                              component="li" 
                              variant="body2" 
                              key={index}
                              sx={{
                                mb: 0.5,
                                color: 'text.primary',
                              }}
                            >
                              {insight}
                            </Typography>
                          ))}
                        </Box>
                      </Box>
                    </Grid>
                  )}
                </Grid>
              </animated.div>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

// Default parameters for demonstration
EnhancedMonteCarloSimulation.defaultProps = {
  parameters: [
    {
      name: 'baseTariff',
      label: 'Base Tariff Rate',
      value: 5.0,
      min: 0,
      max: 15,
      step: 0.1,
      description: 'The current base tariff rate for this product category',
      impact: 'high',
      unit: '%'
    },
    {
      name: 'ftaImpact',
      label: 'FTA Impact',
      value: -2.5,
      min: -10,
      max: 5,
      step: 0.5,
      description: 'Impact of Free Trade Agreements on the baseline tariff',
      impact: 'high',
      unit: '%'
    },
    {
      name: 'exchangeRate',
      label: 'Currency Fluctuation',
      value: 2.0,
      min: -5,
      max: 5,
      step: 0.5,
      description: 'Expected currency fluctuation as a factor in effective rates',
      impact: 'medium',
      unit: '%'
    },
    {
      name: 'volatility',
      label: 'Policy Volatility',
      value: 30,
      min: 0,
      max: 100,
      step: 5,
      description: 'Expected volatility in trade policy over the forecast period',
      impact: 'medium',
      unit: ''
    },
    {
      name: 'tradeDiversion',
      label: 'Trade Diversion',
      value: 1.5,
      min: -5,
      max: 5,
      step: 0.5,
      description: 'Estimated trade diversion effects on effective tariff rates',
      impact: 'low',
      unit: '%'
    }
  ]
};

export default EnhancedMonteCarloSimulation;