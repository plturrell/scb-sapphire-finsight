/**
 * Monte Carlo Data Products Integration Test Script
 * 
 * This script tests the integration between Monte Carlo simulations and SAP Business Data Cloud data products.
 * It verifies that the API endpoints for importing/exporting simulation data from/to data products
 * and running simulations from data product inputs are working correctly.
 * 
 * Run with:
 * ts-node scripts/test-data-products-integration.ts
 */

import fetch from 'node-fetch';
// Using node-fetch v2 for compatibility
import chalk from 'chalk';
import { UUID } from '../src/types/MonteCarloTypes';

// Base URL for API calls (local development server)
const API_BASE_URL = 'http://localhost:3000/api/monte-carlo/data-products';

// Test configuration
const CONFIG = {
  serverUrl: API_BASE_URL,
  logLevel: 'verbose', // 'verbose' or 'minimal'
  tests: {
    importInputs: true,
    importOutputs: true,
    exportInputs: true,
    exportOutputs: true,
    runSimulation: true,
    getMapping: true
  }
};

// Helper function for logging
const log = {
  info: (message: string) => console.log(chalk.blue('INFO: ') + message),
  success: (message: string) => console.log(chalk.green('SUCCESS: ') + message),
  warn: (message: string) => console.log(chalk.yellow('WARNING: ') + message),
  error: (message: string) => console.log(chalk.red('ERROR: ') + message),
  debug: (message: string, data?: any) => {
    if (CONFIG.logLevel === 'verbose') {
      console.log(chalk.gray('DEBUG: ') + message);
      if (data) console.log(chalk.gray(JSON.stringify(data, null, 2)));
    }
  }
};

// Helper function for API calls
async function callApi(endpoint: string, method: 'GET' | 'POST' = 'GET', body?: any) {
  const url = `${CONFIG.serverUrl}${endpoint}`;
  log.debug(`Making ${method} request to ${url}`);
  
  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json'
      },
      body: body ? JSON.stringify(body) : undefined
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status} - ${response.statusText}`);
    }
    
    const data = await response.json();
    log.debug(`Response received:`, data);
    return data;
  } catch (error) {
    log.error(`API call failed: ${(error as Error).message}`);
    throw error;
  }
}

// Test for importing simulation inputs
async function testImportInputs() {
  log.info('Testing import of simulation inputs...');
  
  try {
    const response = await callApi('?action=inputs');
    
    if (response.success && Array.isArray(response.inputs)) {
      log.success(`Successfully imported ${response.inputs.length} simulation inputs`);
      return response.inputs;
    } else {
      log.error('Failed to import simulation inputs: Invalid response format');
      return [];
    }
  } catch (error) {
    log.error(`Failed to import simulation inputs: ${(error as Error).message}`);
    return [];
  }
}

// Test for importing simulation outputs
async function testImportOutputs() {
  log.info('Testing import of simulation outputs...');
  
  try {
    const response = await callApi('?action=outputs');
    
    if (response.success && Array.isArray(response.outputs)) {
      log.success(`Successfully imported ${response.outputs.length} simulation outputs`);
      return response.outputs;
    } else {
      log.error('Failed to import simulation outputs: Invalid response format');
      return [];
    }
  } catch (error) {
    log.error(`Failed to import simulation outputs: ${(error as Error).message}`);
    return [];
  }
}

// Test for exporting simulation inputs
async function testExportInputs() {
  log.info('Testing export of simulation inputs...');
  
  try {
    const response = await callApi('?action=inputs/export', 'POST');
    
    if (response.success) {
      log.success('Successfully exported simulation inputs');
      return true;
    } else {
      log.error(`Failed to export simulation inputs: ${response.message}`);
      return false;
    }
  } catch (error) {
    log.error(`Failed to export simulation inputs: ${(error as Error).message}`);
    return false;
  }
}

// Test for exporting simulation outputs
async function testExportOutputs() {
  log.info('Testing export of simulation outputs...');
  
  try {
    const response = await callApi('?action=outputs/export', 'POST');
    
    if (response.success) {
      log.success('Successfully exported simulation outputs');
      return true;
    } else {
      log.error(`Failed to export simulation outputs: ${response.message}`);
      return false;
    }
  } catch (error) {
    log.error(`Failed to export simulation outputs: ${(error as Error).message}`);
    return false;
  }
}

// Test for running a simulation from data product input
async function testRunSimulation(inputId: UUID) {
  log.info(`Testing running a simulation from data product input ${inputId}...`);
  
  try {
    const response = await callApi(`?action=run&inputId=${inputId}`, 'POST');
    
    if (response.success && response.output) {
      log.success(`Successfully ran simulation from data product input ${inputId}`);
      return response.output;
    } else {
      log.error(`Failed to run simulation: ${response.message}`);
      return null;
    }
  } catch (error) {
    log.error(`Failed to run simulation: ${(error as Error).message}`);
    return null;
  }
}

// Test for getting the mapping between data products and simulations
async function testGetMapping() {
  log.info('Testing getting the mapping between data products and simulations...');
  
  try {
    const response = await callApi('?action=mapping');
    
    if (response.success && response.mapping) {
      log.success('Successfully got data product simulation mapping');
      return response.mapping;
    } else {
      log.error(`Failed to get mapping: ${response.message}`);
      return null;
    }
  } catch (error) {
    log.error(`Failed to get mapping: ${(error as Error).message}`);
    return null;
  }
}

// Main function to run all tests
async function runTests() {
  log.info('Starting Monte Carlo Data Products Integration Tests...');
  log.info('---------------------------------------------------');
  
  const results = {
    importInputs: false,
    importOutputs: false,
    exportInputs: false,
    exportOutputs: false,
    runSimulation: false,
    getMapping: false
  };
  
  // Store test data
  let inputs: any[] = [];
  let outputs: any[] = [];
  let mapping: any = null;
  
  // Test importing simulation inputs
  if (CONFIG.tests.importInputs) {
    inputs = await testImportInputs();
    results.importInputs = inputs.length > 0;
    log.info('---------------------------------------------------');
  }
  
  // Test importing simulation outputs
  if (CONFIG.tests.importOutputs) {
    outputs = await testImportOutputs();
    results.importOutputs = outputs.length > 0;
    log.info('---------------------------------------------------');
  }
  
  // Test exporting simulation inputs
  if (CONFIG.tests.exportInputs) {
    results.exportInputs = await testExportInputs();
    log.info('---------------------------------------------------');
  }
  
  // Test exporting simulation outputs
  if (CONFIG.tests.exportOutputs) {
    results.exportOutputs = await testExportOutputs();
    log.info('---------------------------------------------------');
  }
  
  // Test running a simulation from data product input
  if (CONFIG.tests.runSimulation && inputs.length > 0) {
    const inputId = inputs[0].id;
    const output = await testRunSimulation(inputId);
    results.runSimulation = output !== null;
    log.info('---------------------------------------------------');
  } else if (CONFIG.tests.runSimulation) {
    log.warn('Skipping run simulation test: No inputs available');
  }
  
  // Test getting the mapping between data products and simulations
  if (CONFIG.tests.getMapping) {
    mapping = await testGetMapping();
    results.getMapping = mapping !== null;
    log.info('---------------------------------------------------');
  }
  
  // Print summary
  log.info('Test Results Summary:');
  Object.entries(results).forEach(([test, passed]) => {
    if (CONFIG.tests[test as keyof typeof CONFIG.tests]) {
      if (passed) {
        log.success(`✅ ${test}: PASSED`);
      } else {
        log.error(`❌ ${test}: FAILED`);
      }
    } else {
      log.warn(`⚠️ ${test}: SKIPPED`);
    }
  });
  
  // Overall result
  const testedCount = Object.values(CONFIG.tests).filter(Boolean).length;
  const passedCount = Object.entries(results)
    .filter(([test]) => CONFIG.tests[test as keyof typeof CONFIG.tests])
    .filter(([, passed]) => passed).length;
  
  console.log('\n' + '='.repeat(50));
  if (passedCount === testedCount) {
    log.success(`ALL TESTS PASSED: ${passedCount}/${testedCount} tests passed`);
  } else {
    log.error(`SOME TESTS FAILED: ${passedCount}/${testedCount} tests passed`);
  }
  console.log('='.repeat(50) + '\n');
}

// Run the tests
runTests().catch(error => {
  log.error(`Unhandled error: ${error.message}`);
  process.exit(1);
});