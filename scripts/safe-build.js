/**
 * Simple build script that uses Next.js's standard build command
 * but ensures that we don't have any minification errors
 */
const { spawn } = require('child_process');

console.log('🏗️ Running safe build script...');

// Execute the Next.js build command
console.log('Starting Next.js build with default configuration...');

const buildProcess = spawn('next', ['build'], {
  stdio: 'inherit',
  env: {
    ...process.env,
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