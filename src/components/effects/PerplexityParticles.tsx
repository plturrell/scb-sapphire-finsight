import React, { useEffect, useRef, useState } from 'react';
import { Box, useTheme } from '@mui/material';

interface Particle {
  x: number;
  y: number;
  radius: number;
  color: string;
  velocity: {
    x: number;
    y: number;
  };
  life: number;
  maxLife: number;
  opacity: number;
  connectDistance: number;
}

interface PerplexityParticlesProps {
  width?: number | string;
  height?: number | string;
  particleCount?: number;
  colorScheme?: 'perplexity' | 'scb' | 'monochrome';
  interactivity?: boolean;
  density?: 'low' | 'medium' | 'high';
  style?: React.CSSProperties;
  connectParticles?: boolean;
  speed?: number;
  opacity?: number;
}

const PerplexityParticles: React.FC<PerplexityParticlesProps> = ({
  width = '100%',
  height = '200px',
  particleCount = 40,
  colorScheme = 'scb',
  interactivity = true,
  density = 'medium',
  style = {},
  connectParticles = true,
  speed = 1,
  opacity = 0.6,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationFrameRef = useRef<number>(0);
  const mouseRef = useRef<{ x: number | null; y: number | null }>({ x: null, y: null });
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const theme = useTheme();

  // Color schemes
  const colorSchemes = {
    perplexity: ['#6F4FF2', '#9D81FD', '#B297FC', '#4573D2'],
    scb: ['#042278', '#31ddc1', '#58a6ff', '#0066cc'],
    monochrome: ['#3A3A3A', '#5A5A5A', '#7A7A7A', '#9A9A9A'],
  };

  // Density settings
  const densitySettings = {
    low: { count: particleCount * 0.5, connectDistance: 80 },
    medium: { count: particleCount, connectDistance: 120 },
    high: { count: particleCount * 2, connectDistance: 180 },
  };

  const selectedColors = colorSchemes[colorScheme];
  const { count, connectDistance } = densitySettings[density];

  // Initialize canvas and particles
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleResize = () => {
      const { width, height } = canvas.getBoundingClientRect();
      canvas.width = width;
      canvas.height = height;
      setCanvasSize({ width, height });
      
      // Recreate particles when canvas size changes
      initializeParticles();
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  // Initialize mouse tracking
  useEffect(() => {
    if (!interactivity) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };
    
    const handleMouseLeave = () => {
      mouseRef.current = { x: null, y: null };
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [interactivity]);

  // Initialize particles
  const initializeParticles = () => {
    if (!canvasRef.current) return;
    
    const { width, height } = canvasRef.current;
    const particles: Particle[] = [];
    
    for (let i = 0; i < count; i++) {
      const radius = Math.random() * 2 + 1;
      const x = Math.random() * width;
      const y = Math.random() * height;
      const color = selectedColors[Math.floor(Math.random() * selectedColors.length)];
      const vx = (Math.random() - 0.5) * speed;
      const vy = (Math.random() - 0.5) * speed;
      const maxLife = Math.random() * 200 + 100;
      
      particles.push({
        x,
        y,
        radius,
        color,
        velocity: { x: vx, y: vy },
        life: Math.random() * maxLife,
        maxLife,
        opacity: Math.random() * opacity + 0.2,
        connectDistance: connectDistance * (0.8 + Math.random() * 0.4),
      });
    }
    
    particlesRef.current = particles;
  };

  // Animation loop
  useEffect(() => {
    if (!canvasRef.current || canvasSize.width === 0) return;
    
    // Initialize particles if not already
    if (particlesRef.current.length === 0) {
      initializeParticles();
    }
    
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    
    const animate = () => {
      ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);
      
      // Update and draw particles
      particlesRef.current.forEach((particle, i) => {
        // Update position
        particle.x += particle.velocity.x;
        particle.y += particle.velocity.y;
        
        // Update lifecycle
        particle.life += 1;
        if (particle.life > particle.maxLife) {
          particle.opacity -= 0.01;
          if (particle.opacity <= 0) {
            // Reset particle
            particle.x = Math.random() * canvasSize.width;
            particle.y = Math.random() * canvasSize.height;
            particle.life = 0;
            particle.opacity = Math.random() * opacity + 0.2;
          }
        }
        
        // Handle edge boundaries
        if (particle.x < 0 || particle.x > canvasSize.width) {
          particle.velocity.x = -particle.velocity.x;
        }
        if (particle.y < 0 || particle.y > canvasSize.height) {
          particle.velocity.y = -particle.velocity.y;
        }
        
        // Mouse interaction
        if (interactivity && mouseRef.current.x !== null && mouseRef.current.y !== null) {
          const dx = mouseRef.current.x - particle.x;
          const dy = mouseRef.current.y - particle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const maxDistance = 100;
          
          if (distance < maxDistance) {
            const force = -0.2 * (1 - distance / maxDistance);
            particle.velocity.x += force * dx / distance * speed;
            particle.velocity.y += force * dy / distance * speed;
          }
        }
        
        // Draw particle
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fillStyle = `${particle.color}${Math.floor(particle.opacity * 255).toString(16).padStart(2, '0')}`;
        ctx.fill();
        
        // Connect particles
        if (connectParticles) {
          for (let j = i + 1; j < particlesRef.current.length; j++) {
            const p2 = particlesRef.current[j];
            const dx = particle.x - p2.x;
            const dy = particle.y - p2.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < particle.connectDistance) {
              const opacity = (1 - distance / particle.connectDistance) * Math.min(particle.opacity, p2.opacity) * 0.5;
              ctx.beginPath();
              ctx.moveTo(particle.x, particle.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.strokeStyle = `${particle.color}${Math.floor(opacity * 255).toString(16).padStart(2, '0')}`;
              ctx.lineWidth = 0.5;
              ctx.stroke();
            }
          }
        }
      });
      
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, [canvasSize, colorScheme, connectParticles, density, interactivity, opacity, speed]);

  return (
    <Box
      sx={{
        width,
        height,
        overflow: 'hidden',
        position: 'relative',
        ...style,
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
        }}
      />
    </Box>
  );
};

export default PerplexityParticles;