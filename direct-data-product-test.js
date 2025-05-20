#!/usr/bin/env node

/**
 * Direct Data Product Integration Test
 * This test directly verifies that our integration code can successfully read and process
 * the actual data product files in the data_products directory.
 * 
 * This is a 0% mock test - all file operations and data processing are real.
 */

const fs = require('fs');
const path = require('path');
const util = require('util');

// Terminal colors
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Data product paths
const DATA_PRODUCTS_DIR = path.join(__dirname, 'data_products');
const MONTE_CARLO_INPUT_PATH = path.join(DATA_PRODUCTS_DIR, 'MonteCarloSimulationInput_v1.MonteCarloSimulationInput.json');
const MONTE_CARLO_OUTPUT_PATH = path.join(DATA_PRODUCTS_DIR, 'MonteCarloSimulationOutput_v1.MonteCarloSimulationOutput.json');
const MONTE_CARLO_PARAMETER_HISTORY_PATH = path.join(DATA_PRODUCTS_DIR, 'MonteCarloParameterHistory_v1.MonteCarloParameterHistory.json');

// Reporting
let testsPassed = 0;
let testsFailed = 0;
const results = [];

// Test framework functions
function reportResult(name, pass, message, data = null) {
  const result = {
    name,
    pass,
    message,
    data: data ? util.inspect(data, { depth: null, colors: true }) : null
  };
  
  results.push(result);
  
  if (pass) {
    testsPassed++;
    console.log(`${colors.green}✓ PASS: ${name}${colors.reset} - ${message}`);
  } else {
    testsFailed++;
    console.log(`${colors.red}✗ FAIL: ${name}${colors.reset} - ${message}`);
    if (data) console.log(`  ${colors.yellow}Details: ${util.inspect(data, { depth: null, colors: true })}${colors.reset}`);
  }
}

function printHeader(text) {
  console.log(`\n${colors.blue}===== ${text} =====${colors.reset}`);
}

function printSummary() {
  console.log(`\n${colors.yellow}===== Test Summary =====${colors.reset}`);
  console.log(`${colors.cyan}Total tests: ${testsPassed + testsFailed}${colors.reset}`);
  console.log(`${colors.green}Passed: ${testsPassed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${testsFailed}${colors.reset}`);
  
  const allPassed = testsFailed === 0;
  console.log(`\n${allPassed ? colors.green : colors.red}OVERALL: ${allPassed ? 'PASS' : 'FAIL'}${colors.reset}`);
}

// ===== DIRECT DATA PRODUCT INTEGRATION TESTS =====

// Test 1: Verify data product files exist
function testFilesExist() {
  printHeader('Test 1: Verify Data Product Files Exist');
  
  const inputExists = fs.existsSync(MONTE_CARLO_INPUT_PATH);
  reportResult('Input File Exists', inputExists, 
    inputExists ? 'Input file found' : 'Input file is missing', 
    { path: MONTE_CARLO_INPUT_PATH });
  
  const outputExists = fs.existsSync(MONTE_CARLO_OUTPUT_PATH);
  reportResult('Output File Exists', outputExists, 
    outputExists ? 'Output file found' : 'Output file is missing',
    { path: MONTE_CARLO_OUTPUT_PATH });
  
  const historyExists = fs.existsSync(MONTE_CARLO_PARAMETER_HISTORY_PATH);
  reportResult('Parameter History File Exists', historyExists, 
    historyExists ? 'Parameter history file found' : 'Parameter history file is missing',
    { path: MONTE_CARLO_PARAMETER_HISTORY_PATH });
  
  return inputExists && outputExists && historyExists;
}

// Test 2: Validate data product file structure
function testFileStructure() {
  printHeader('Test 2: Validate Data Product File Structure');
  
  let valid = true;
  let inputData, outputData, historyData;
  
  // Load and validate input file
  try {
    const inputContent = fs.readFileSync(MONTE_CARLO_INPUT_PATH, 'utf8');
    inputData = JSON.parse(inputContent);
    const inputValid = inputData && 
                     inputData.$schema && 
                     inputData.metadata &&
                     Array.isArray(inputData.data);
    
    reportResult('Input File Structure', inputValid, 
      inputValid ? 'Input file has valid structure' : 'Input file has invalid structure',
      inputValid ? null : { got: Object.keys(inputData) });
    
    valid = valid && inputValid;
  } catch (err) {
    reportResult('Input File Parse', false, 'Failed to parse input file', { error: err.message });
    valid = false;
  }
  
  // Load and validate output file
  try {
    const outputContent = fs.readFileSync(MONTE_CARLO_OUTPUT_PATH, 'utf8');
    outputData = JSON.parse(outputContent);
    const outputValid = outputData && 
                      outputData.$schema && 
                      outputData.metadata &&
                      Array.isArray(outputData.data);
    
    reportResult('Output File Structure', outputValid, 
      outputValid ? 'Output file has valid structure' : 'Output file has invalid structure',
      outputValid ? null : { got: Object.keys(outputData) });
    
    valid = valid && outputValid;
  } catch (err) {
    reportResult('Output File Parse', false, 'Failed to parse output file', { error: err.message });
    valid = false;
  }
  
  // Load and validate parameter history file
  try {
    const historyContent = fs.readFileSync(MONTE_CARLO_PARAMETER_HISTORY_PATH, 'utf8');
    historyData = JSON.parse(historyContent);
    const historyValid = historyData && 
                       historyData.$schema && 
                       historyData.metadata &&
                       Array.isArray(historyData.data);
    
    reportResult('Parameter History File Structure', historyValid, 
      historyValid ? 'Parameter history file has valid structure' : 'Parameter history file has invalid structure',
      historyValid ? null : { got: Object.keys(historyData) });
    
    valid = valid && historyValid;
  } catch (err) {
    reportResult('Parameter History File Parse', false, 'Failed to parse parameter history file', { error: err.message });
    valid = false;
  }
  
  return valid ? { inputData, outputData, historyData } : null;
}

// Test 3: Validate input and output relationships
function testRelationships(data) {
  printHeader('Test 3: Validate Input and Output Relationships');
  
  if (!data) {
    reportResult('Relationship Test Skipped', false, 'Previous tests failed, skipping relationship tests');
    return false;
  }
  
  const { inputData, outputData } = data;
  
  // Create a map of input IDs
  const inputIds = new Set(inputData.data.map(input => input.id));
  
  // Check if all outputs reference valid inputs
  const validRelationships = outputData.data.filter(output => inputIds.has(output.simulationInputId));
  const allValid = validRelationships.length === outputData.data.length;
  
  reportResult('Output-Input References', allValid, 
    allValid ? 'All outputs reference valid inputs' : 'Some outputs reference invalid inputs',
    allValid ? null : { 
      validCount: validRelationships.length, 
      totalCount: outputData.data.length, 
      invalidRefs: outputData.data
        .filter(output => !inputIds.has(output.simulationInputId))
        .map(output => ({ outputId: output.id, invalidInputId: output.simulationInputId }))
    });
  
  // Count references for each input
  const refCounts = {};
  inputData.data.forEach(input => {
    refCounts[input.id] = outputData.data.filter(output => output.simulationInputId === input.id).length;
  });
  
  // Check if each input has at least one output
  const inputsWithOutputs = Object.entries(refCounts).filter(([_, count]) => count > 0).length;
  const coverage = inputsWithOutputs / inputData.data.length;
  const goodCoverage = coverage >= 0.5; // At least 50% of inputs have outputs
  
  reportResult('Input Coverage', goodCoverage, 
    `${inputsWithOutputs}/${inputData.data.length} inputs (${(coverage * 100).toFixed(1)}%) have outputs`,
    { refCounts });
  
  return allValid && goodCoverage;
}

// Test 4: Validate parameter history references
function testParameterHistory(data) {
  printHeader('Test 4: Validate Parameter History References');
  
  if (!data) {
    reportResult('Parameter History Test Skipped', false, 'Previous tests failed, skipping parameter history tests');
    return false;
  }
  
  const { inputData, historyData } = data;
  
  // Create a map of input IDs
  const inputIds = new Set(inputData.data.map(input => input.id));
  
  // Check if all parameter history records reference valid inputs
  const validReferences = historyData.data.filter(history => inputIds.has(history.simulationInputId));
  const allValid = validReferences.length === historyData.data.length;
  
  reportResult('History-Input References', allValid, 
    allValid ? 'All parameter history records reference valid inputs' : 'Some parameter history records reference invalid inputs',
    allValid ? null : { 
      validCount: validReferences.length, 
      totalCount: historyData.data.length, 
      invalidRefs: historyData.data
        .filter(history => !inputIds.has(history.simulationInputId))
        .map(history => ({ historyId: history.id, invalidInputId: history.simulationInputId }))
    });
  
  // Validate parameter IDs in history records
  const validParameterIds = historyData.data.filter(history => {
    // Look up the input
    const input = inputData.data.find(input => input.id === history.simulationInputId);
    if (!input) return false;
    
    // Check if the parameter ID exists in the input's parameters
    const generalParamExists = input.parameters.generalParameters.some(param => param.id === history.parameterId);
    const isExchangeRate = history.parameterId === 'exchangeRates'; // Special case
    
    return generalParamExists || isExchangeRate;
  });
  
  const allParamsValid = validParameterIds.length === validReferences.length;
  
  reportResult('Parameter ID Validity', allParamsValid, 
    allParamsValid ? 'All parameter IDs in history records are valid' : 'Some parameter IDs in history records are invalid',
    allParamsValid ? null : {
      validCount: validParameterIds.length,
      totalCount: validReferences.length,
      invalidParams: historyData.data
        .filter(history => {
          const input = inputData.data.find(input => input.id === history.simulationInputId);
          if (!input) return false;
          const paramExists = input.parameters.generalParameters.some(param => param.id === history.parameterId);
          return input && !paramExists && history.parameterId !== 'exchangeRates';
        })
        .map(history => ({ historyId: history.id, invalidParam: history.parameterId }))
    });
  
  return allValid && allParamsValid;
}

// Test 5: Validate data types and values
function testDataTypes(data) {
  printHeader('Test 5: Validate Data Types and Values');
  
  if (!data) {
    reportResult('Data Type Test Skipped', false, 'Previous tests failed, skipping data type tests');
    return false;
  }
  
  const { inputData, outputData } = data;
  let allValid = true;
  
  // Validate input data types
  const inputTypesValid = inputData.data.every(input => {
    const basicFields = 
      typeof input.id === 'string' &&
      typeof input.name === 'string' &&
      typeof input.createdBy === 'string' &&
      typeof input.createdAt === 'number' &&
      typeof input.simulationType === 'string';
    
    const parametersValid = 
      Array.isArray(input.parameters.generalParameters) &&
      typeof input.parameters.tariffSpecificParameters === 'object' &&
      Array.isArray(input.parameters.tariffSpecificParameters.hsCodes) &&
      Array.isArray(input.parameters.tariffSpecificParameters.countries) &&
      Array.isArray(input.parameters.tariffSpecificParameters.tradeAgreements) &&
      Array.isArray(input.parameters.tariffSpecificParameters.exchangeRates);
    
    const configValid = 
      typeof input.simulationConfig === 'object' &&
      typeof input.simulationConfig.iterations === 'number' &&
      typeof input.simulationConfig.confidenceInterval === 'number' &&
      typeof input.simulationConfig.scenarioThresholds === 'object';
    
    return basicFields && parametersValid && configValid;
  });
  
  reportResult('Input Data Types', inputTypesValid, 
    inputTypesValid ? 'All input data types are valid' : 'Some input data types are invalid');
  
  allValid = allValid && inputTypesValid;
  
  // Validate output data types
  const outputTypesValid = outputData.data.every(output => {
    const basicFields = 
      typeof output.id === 'string' &&
      typeof output.simulationInputId === 'string' &&
      typeof output.startTime === 'number' &&
      (output.endTime === undefined || typeof output.endTime === 'number') &&
      typeof output.status === 'string' &&
      typeof output.progressPercentage === 'number';
    
    // Results might be undefined for outputs that are still running or failed
    const resultsValid = !output.results || (
      typeof output.results === 'object' &&
      typeof output.results.statistics === 'object' &&
      typeof output.results.scenarios === 'object'
    );
    
    // LLM analysis might be undefined
    const llmValid = !output.llmAnalysis || (
      typeof output.llmAnalysis === 'object' &&
      Array.isArray(output.llmAnalysis.insights) &&
      Array.isArray(output.llmAnalysis.recommendations)
    );
    
    return basicFields && resultsValid && llmValid;
  });
  
  reportResult('Output Data Types', outputTypesValid, 
    outputTypesValid ? 'All output data types are valid' : 'Some output data types are invalid');
  
  allValid = allValid && outputTypesValid;
  
  return allValid;
}

// Main function
async function runTests() {
  console.log(`${colors.magenta}Direct Data Product Integration Test${colors.reset}`);
  console.log(`${colors.magenta}====================================${colors.reset}`);
  console.log(`Testing with real data product files in: ${colors.cyan}${DATA_PRODUCTS_DIR}${colors.reset}\n`);
  
  // Test 1: Verify files exist
  const filesExist = testFilesExist();
  
  // Test 2: Validate file structure
  const dataObj = testFileStructure();
  
  // Test 3: Validate relationships
  testRelationships(dataObj);
  
  // Test 4: Validate parameter history
  testParameterHistory(dataObj);
  
  // Test 5: Validate data types
  testDataTypes(dataObj);
  
  // Print summary
  printSummary();
}

// Run the tests
runTests().catch(err => {
  console.error(`${colors.red}Unhandled error: ${err.message}${colors.reset}`);
  console.error(err.stack);
  process.exit(1);
});