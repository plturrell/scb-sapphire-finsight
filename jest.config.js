/**
 * Comprehensive Jest configuration for Perplexity Integration
 */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  transform: {
    // TypeScript files
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
      jsx: 'react-jsx'
    }],
    // JavaScript files
    '^.+\\.(js|jsx)$': ['babel-jest', {
      presets: [
        ['@babel/preset-env', { targets: { node: 'current' } }],
        ['@babel/preset-react', { runtime: 'automatic' }]
      ]
    }]
  },
  // Module name mapping for static assets
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/src/assets/mock-file.js',
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  // Path patterns
  testPathIgnorePatterns: ['/node_modules/', '/.next/', '/build/'],
  testMatch: ['**/src/**/__tests__/**/*.test.[jt]s?(x)', '**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
  // Transform ignore patterns for node_modules
  transformIgnorePatterns: [
    'node_modules/(?!(@mui|d3|d3-array|d3-scale|d3-shape|d3-hierarchy|d3-zoom|d3-selection|d3-transition|d3-color|d3-interpolate|d3-path|internmap)/)'
  ],
  // Global settings
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json',
      isolatedModules: true
    }
  },
  // File extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  // Coverage settings
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/index.{js,ts}',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/mock/**'
  ],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/.next/',
    '/build/',
    '/coverage/'
  ],
  // Jest performance settings
  maxWorkers: '50%',
  watchPathIgnorePatterns: [
    '/node_modules/',
    '/.next/',
    '/build/',
    '/coverage/'
  ]
};