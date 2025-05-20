/**
 * Custom build script for Vercel that ensures development mode is used
 */
const { spawn } = require('child_process');
const path = require('path');

console.log('🏗️ Running custom Vercel build script');

// Set environment variables for the build
process.env.NODE_ENV = 'development';
console.log(`NODE_ENV set to: ${process.env.NODE_ENV}`);

// Execute the Next.js build command
console.log('Starting Next.js build...');

const buildProcess = spawn('next', ['build'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    // Force Node environment to development
    NODE_ENV: 'development',
    // Disable telemetry for builds
    NEXT_TELEMETRY_DISABLED: '1'
  }
});

// Handle the build process completion
buildProcess.on('close', (code) => {
  if (code !== 0) {
    console.error(`❌ Build failed with code ${code}`);
    process.exit(code);
  }
  
  console.log('✅ Build completed successfully');
});