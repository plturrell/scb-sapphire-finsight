import React, { useRef, useEffect, useState } from 'react';
import { useDeviceCapabilities } from '@/hooks/useDeviceCapabilities';
import { supportsP3ColorSpace } from '@/utils/BrowserCompatibility';

interface WebGLChartProps {
  data: number[];
  width?: number;
  height?: number;
  colors?: string[];
  lineWidth?: number;
  animate?: boolean;
  animationDuration?: number;
  showAxis?: boolean;
  className?: string;
  title?: string;
  description?: string;
}

/**
 * Hardware-accelerated WebGL chart component for high-performance data visualization
 * Automatically adapts rendering quality based on device capabilities
 */
const WebGLChart: React.FC<WebGLChartProps> = ({
  data,
  width = 500,
  height = 300,
  colors = ['#0072AA', '#21AA47', '#D33732', '#78ADD2', '#A4D0A0'],
  lineWidth = 2,
  animate = true,
  animationDuration = 1000,
  showAxis = true,
  className = '',
  title,
  description
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [animationProgress, setAnimationProgress] = useState(0);
  const { deviceTier, hardware } = useDeviceCapabilities();
  const supportsP3 = supportsP3ColorSpace();
  
  // Convert hex colors to WebGL-friendly RGB format
  const glColors = colors.map(hex => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    return [r, g, b, 1.0];
  });

  // Enhanced P3 colors if supported
  const p3Colors = supportsP3 ? [
    [0, 0.447, 0.666, 1.0], // Honolulu Blue in P3
    [0.129, 0.666, 0.278, 1.0], // American Green in P3
    [0.827, 0.216, 0.196, 1.0], // Muted Red in P3
    [0.471, 0.678, 0.824, 1.0], // Iceberg in P3
    [0.643, 0.816, 0.627, 1.0], // Eton Blue in P3
  ] : glColors;

  // Select color set based on display capabilities
  const chartColors = supportsP3 ? p3Colors : glColors;
  
  // Adjust rendering quality based on device capabilities
  const qualityMultiplier = (() => {
    if (deviceTier === 'high') return 1.0;
    if (deviceTier === 'medium') return 0.75;
    return 0.5;
  })();
  
  // Adjust anti-aliasing based on device tier
  const enableAntialiasing = deviceTier !== 'low';
  
  // Vertex shader for line rendering
  const vertexShaderSource = `
    attribute vec2 a_position;
    uniform vec2 u_resolution;
    uniform float u_progress;
    
    void main() {
      // Scale to animation progress if needed
      vec2 position = a_position;
      if (position.x > u_progress) {
        position.x = u_progress;
      }
      
      // Convert from pixel space to clip space (-1 to +1)
      vec2 zeroToOne = position / u_resolution;
      vec2 zeroToTwo = zeroToOne * 2.0;
      vec2 clipSpace = zeroToTwo - 1.0;
      
      gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
    }
  `;
  
  // Fragment shader for line coloring with anti-aliasing
  const fragmentShaderSource = `
    precision mediump float;
    uniform vec4 u_color;
    uniform float u_antialias;
    
    void main() {
      // Apply anti-aliasing if enabled
      float smoothEdge = u_antialias > 0.5 ? 0.05 : 0.0;
      float alpha = smoothstep(0.0, smoothEdge, 1.0 - abs(gl_FragCoord.y - floor(gl_FragCoord.y) - 0.5) * 2.0);
      gl_FragColor = vec4(u_color.rgb, u_color.a * alpha);
    }
  `;
  
  // Initialize WebGL context and render chart
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Set canvas size with device pixel ratio for retina displays
    const pixelRatio = window.devicePixelRatio || 1;
    canvas.width = width * pixelRatio * qualityMultiplier;
    canvas.height = height * pixelRatio * qualityMultiplier;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    
    // Get WebGL context with performance preference
    const gl = canvas.getContext('webgl', {
      antialias: enableAntialiasing,
      powerPreference: 'high-performance',
      alpha: true,
      premultipliedAlpha: false
    });
    
    if (!gl) {
      console.error('WebGL not supported');
      return;
    }
    
    // Create shaders
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    
    if (!vertexShader || !fragmentShader) return;
    
    // Create program
    const program = createProgram(gl, vertexShader, fragmentShader);
    if (!program) return;
    
    // Set up attribute and uniform locations
    const positionAttributeLocation = gl.getAttribLocation(program, 'a_position');
    const resolutionUniformLocation = gl.getUniformLocation(program, 'u_resolution');
    const colorUniformLocation = gl.getUniformLocation(program, 'u_color');
    const progressUniformLocation = gl.getUniformLocation(program, 'u_progress');
    const antialiasUniformLocation = gl.getUniformLocation(program, 'u_antialias');
    
    // Create buffer
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    
    // Normalize data for chart display
    const normalizedData = normalizeData(data, canvas.width, canvas.height);
    
    // Convert normalized data to WebGL positions
    const positions = [];
    for (let i = 0; i < normalizedData.length; i++) {
      const x = (i / (normalizedData.length - 1)) * canvas.width;
      const y = canvas.height - (normalizedData[i] * canvas.height);
      positions.push(x, y);
    }
    
    // Tell WebGL to use our program
    gl.useProgram(program);
    
    // Initialize animation
    let startTime: number | null = null;
    let animationFrameId: number;
    
    // Animation loop
    const render = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsedTime = timestamp - startTime;
      
      let progress = animate ? Math.min(elapsedTime / animationDuration, 1.0) : 1.0;
      setAnimationProgress(progress);
      
      // Clear the canvas
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      
      // Set the viewport to match canvas dimensions
      gl.viewport(0, 0, canvas.width, canvas.height);
      
      // Enable position attribute
      gl.enableVertexAttribArray(positionAttributeLocation);
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);
      
      // Set uniforms
      gl.uniform2f(resolutionUniformLocation, canvas.width, canvas.height);
      gl.uniform1f(progressUniformLocation, progress * canvas.width);
      gl.uniform1f(antialiasUniformLocation, enableAntialiasing ? 1.0 : 0.0);
      
      // Draw line segments with progressive colors
      for (let i = 1; i < normalizedData.length; i++) {
        const segmentPositions = new Float32Array([
          positions[(i-1) * 2], positions[(i-1) * 2 + 1],
          positions[i * 2], positions[i * 2 + 1]
        ]);
        
        gl.bufferData(gl.ARRAY_BUFFER, segmentPositions, gl.STATIC_DRAW);
        
        // Calculate color index with wrapping
        const colorIndex = (i - 1) % chartColors.length;
        gl.uniform4fv(colorUniformLocation, chartColors[colorIndex]);
        
        // Draw the line segment
        gl.lineWidth(lineWidth * pixelRatio);
        gl.drawArrays(gl.LINES, 0, 2);
      }
      
      // Continue animation if not complete
      if (animate && progress < 1.0) {
        animationFrameId = requestAnimationFrame(render);
      }
    };
    
    // Start rendering
    animationFrameId = requestAnimationFrame(render);
    
    // Draw axes if enabled
    if (showAxis) {
      drawAxes(canvas, pixelRatio, qualityMultiplier);
    }
    
    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      gl.deleteBuffer(positionBuffer);
    };
  }, [data, width, height, chartColors, lineWidth, animate, animationDuration, showAxis, qualityMultiplier, enableAntialiasing]);
  
  return (
    <div className={`webgl-chart-container ${className}`}>
      {title && <h3 className="chart-title">{title}</h3>}
      <div className="canvas-container">
        <canvas ref={canvasRef} />
        {animate && (
          <div className="progress-indicator" style={{ width: `${animationProgress * 100}%` }} />
        )}
      </div>
      {description && <p className="chart-description">{description}</p>}
    </div>
  );
};

// Helper functions for WebGL setup
function createShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  
  const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (success) return shader;
  
  console.error(gl.getShaderInfoLog(shader));
  gl.deleteShader(shader);
  return null;
}

function createProgram(gl: WebGLRenderingContext, vertexShader: WebGLShader, fragmentShader: WebGLShader) {
  const program = gl.createProgram();
  if (!program) return null;
  
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  
  const success = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (success) return program;
  
  console.error(gl.getProgramInfoLog(program));
  gl.deleteProgram(program);
  return null;
}

// Normalize data to 0-1 range for chart display
function normalizeData(data: number[], width: number, height: number) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min;
  
  return data.map(value => {
    // If all values are the same, center in the chart
    if (range === 0) return 0.5;
    // Otherwise normalize to 0-1 with padding
    return 0.1 + ((value - min) / range) * 0.8;
  });
}

// Draw chart axes using standard canvas API
function drawAxes(canvas: HTMLCanvasElement, pixelRatio: number, qualityMultiplier: number) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  
  // Scale context for high-DPI displays
  ctx.scale(pixelRatio * qualityMultiplier, pixelRatio * qualityMultiplier);
  
  const width = canvas.width / (pixelRatio * qualityMultiplier);
  const height = canvas.height / (pixelRatio * qualityMultiplier);
  
  // Draw x-axis (bottom)
  ctx.beginPath();
  ctx.moveTo(0, height - 1);
  ctx.lineTo(width, height - 1);
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
  ctx.lineWidth = 1;
  ctx.stroke();
  
  // Draw y-axis (left)
  ctx.beginPath();
  ctx.moveTo(1, 0);
  ctx.lineTo(1, height);
  ctx.stroke();
}

export default WebGLChart;