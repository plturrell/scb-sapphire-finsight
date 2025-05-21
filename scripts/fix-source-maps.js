/**
 * Source Map Fix Script
 * 
 * This script creates placeholder source map files for commonly missing maps
 * to fix 404 errors when debugging in the browser.
 */
const fs = require('fs');
const path = require('path');

console.log('🔧 Running source map fix script...');

// Path to the Next.js build directory
const BUILD_DIR = path.join(__dirname, '../.next');

// Check if the build directory exists
if (!fs.existsSync(BUILD_DIR)) {
  console.error('❌ Build directory (.next) not found. Run a build first.');
  process.exit(1);
}

// Map of common source map URLs that are missing
const SOURCE_MAP_FIXES = [
  'use-intersection.js.map',
  'refresh-cw.js.map',
  'sparkles.js.map',
  'zap.js.map',
  'interception-routes.js.map',
  'image-loader.js.map',
  'trending-up.js.map',
  'index.mjs.map',
  'user.js.map',
  'process.js.map',
  'chunk-ZJJGQIVY.mjs.map',
  'chevron-up.js.map'
];

// Create source maps directory
const SOURCE_MAPS_DIR = path.join(BUILD_DIR, 'static/source-maps');
if (!fs.existsSync(SOURCE_MAPS_DIR)) {
  fs.mkdirSync(SOURCE_MAPS_DIR, { recursive: true });
  console.log(`✅ Created source maps directory: ${SOURCE_MAPS_DIR}`);
}

// Create empty source map files
for (const mapName of SOURCE_MAP_FIXES) {
  const mapPath = path.join(SOURCE_MAPS_DIR, mapName);
  
  // Basic source map structure
  const sourceMap = {
    version: 3,
    file: mapName,
    mappings: '',
    sources: ['placeholder.js'],
    sourcesContent: ['// Generated placeholder source map to fix 404 errors'],
    names: []
  };
  
  fs.writeFileSync(mapPath, JSON.stringify(sourceMap));
  console.log(`✅ Created placeholder source map: ${mapName}`);
}

// Create .map-source route configuration
const VERCEL_CONFIG_PATH = path.join(__dirname, '../vercel.json');
let vercelConfig = {};

if (fs.existsSync(VERCEL_CONFIG_PATH)) {
  try {
    vercelConfig = JSON.parse(fs.readFileSync(VERCEL_CONFIG_PATH, 'utf8'));
  } catch (error) {
    console.warn(`⚠️ Error parsing vercel.json: ${error.message}`);
    vercelConfig = {};
  }
}

// Add or update routes to serve source maps
if (!vercelConfig.routes) vercelConfig.routes = [];

// Add source map serving route if it doesn't exist
const hasSourceMapRoute = vercelConfig.routes.some(route => 
  route.src && route.src.includes('\\.map$')
);

if (!hasSourceMapRoute) {
  vercelConfig.routes.unshift({
    src: '/(.*)\\.map$',
    dest: '/_next/static/source-maps/$1.map',
    status: 200
  });
  
  fs.writeFileSync(VERCEL_CONFIG_PATH, JSON.stringify(vercelConfig, null, 2));
  console.log('✅ Updated vercel.json with source map routing');
}

console.log('✅ Creating .htaccess file for source map redirection...');
const htaccessPath = path.join(__dirname, '../public/.htaccess');
const htaccessContent = `
# Redirect missing source map requests to our placeholder directory
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteRule ^(.*)\.map$ /_next/static/source-maps/$1.map [L]
</IfModule>
`;

fs.writeFileSync(htaccessPath, htaccessContent);
console.log('✅ Created .htaccess file for Apache servers');

console.log('🎉 Source map fix script completed!');
console.log('Note: Deploy the application for these changes to take effect.');