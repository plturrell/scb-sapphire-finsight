// Simple test script for Monte Carlo Data Products Integration
// Run with: node test-monte-carlo-integration.js

const fs = require('fs');
const path = require('path');

// Configuration
const DATA_PRODUCTS_DIR = path.join(__dirname, 'data_products');
const TEST_LOG_FILE = path.join(__dirname, 'monte-carlo-test-results.log');

// Main test function
async function runTests() {
  console.log('Starting Monte Carlo Data Products Integration Test');
  console.log('================================================');
  
  const logStream = fs.createWriteStream(TEST_LOG_FILE, { flags: 'w' });
  logStream.write(`Monte Carlo Integration Test - ${new Date().toISOString()}\n\n`);
  
  try {
    // Test 1: Check if data product files exist
    console.log('Test 1: Checking if data product files exist');
    
    const inputFilePath = path.join(DATA_PRODUCTS_DIR, 'MonteCarloSimulationInput_v1.MonteCarloSimulationInput.json');
    const outputFilePath = path.join(DATA_PRODUCTS_DIR, 'MonteCarloSimulationOutput_v1.MonteCarloSimulationOutput.json');
    const historyFilePath = path.join(DATA_PRODUCTS_DIR, 'MonteCarloParameterHistory_v1.MonteCarloParameterHistory.json');
    
    const inputExists = fs.existsSync(inputFilePath);
    const outputExists = fs.existsSync(outputFilePath);
    const historyExists = fs.existsSync(historyFilePath);
    
    logStream.write(`Input file exists: ${inputExists}\n`);
    logStream.write(`Output file exists: ${outputExists}\n`);
    logStream.write(`History file exists: ${historyExists}\n\n`);
    
    console.log(`- Input file exists: ${inputExists ? 'PASS' : 'FAIL'}`);
    console.log(`- Output file exists: ${outputExists ? 'PASS' : 'FAIL'}`);
    console.log(`- History file exists: ${historyExists ? 'PASS' : 'FAIL'}`);
    
    // Test 2: Check if data product files have valid JSON
    console.log('\nTest 2: Checking if data product files have valid JSON');
    
    let inputData, outputData, historyData;
    let inputValid = false, outputValid = false, historyValid = false;
    
    try {
      if (inputExists) {
        inputData = JSON.parse(fs.readFileSync(inputFilePath, 'utf8'));
        inputValid = inputData && Array.isArray(inputData.data);
        logStream.write(`Input file has ${inputData.data?.length || 0} records\n`);
      }
    } catch (err) {
      logStream.write(`Error parsing input file: ${err.message}\n`);
    }
    
    try {
      if (outputExists) {
        outputData = JSON.parse(fs.readFileSync(outputFilePath, 'utf8'));
        outputValid = outputData && Array.isArray(outputData.data);
        logStream.write(`Output file has ${outputData.data?.length || 0} records\n`);
      }
    } catch (err) {
      logStream.write(`Error parsing output file: ${err.message}\n`);
    }
    
    try {
      if (historyExists) {
        historyData = JSON.parse(fs.readFileSync(historyFilePath, 'utf8'));
        historyValid = historyData && Array.isArray(historyData.data);
        logStream.write(`History file has ${historyData.data?.length || 0} records\n`);
      }
    } catch (err) {
      logStream.write(`Error parsing history file: ${err.message}\n`);
    }
    
    console.log(`- Input file valid JSON: ${inputValid ? 'PASS' : 'FAIL'}`);
    console.log(`- Output file valid JSON: ${outputValid ? 'PASS' : 'FAIL'}`);
    console.log(`- History file valid JSON: ${historyValid ? 'PASS' : 'FAIL'}`);
    
    // Test 3: Check data structure and relationships
    console.log('\nTest 3: Checking data structure and relationships');
    
    let relationships = false;
    
    if (inputValid && outputValid) {
      // Check if outputs reference inputs
      const inputIds = new Set(inputData.data.map(item => item.id));
      const outputsWithValidInputs = outputData.data.filter(output => 
        inputIds.has(output.simulationInputId)
      );
      
      const relationshipsValid = outputsWithValidInputs.length > 0;
      relationships = relationshipsValid;
      
      logStream.write(`Outputs with valid input references: ${outputsWithValidInputs.length}/${outputData.data.length}\n`);
      console.log(`- Proper input/output relationships: ${relationshipsValid ? 'PASS' : 'FAIL'}`);
    } else {
      logStream.write('Skipping relationship check due to invalid JSON\n');
      console.log(`- Proper input/output relationships: SKIPPED`);
    }
    
    // Test 4: Simulate data product integration
    console.log('\nTest 4: Simulating data product integration');
    
    // Create a mock integration object
    const mockIntegration = {
      importAllSimulationInputs: () => {
        return inputValid ? inputData.data : [];
      },
      importAllSimulationOutputs: () => {
        return outputValid ? outputData.data : [];
      },
      runSimulationFromDataProduct: (inputId) => {
        if (!inputValid) return null;
        
        // Find the input
        const input = inputData.data.find(i => i.id === inputId);
        if (!input) return null;
        
        // Find an existing output or create one
        let output = outputValid ? 
          outputData.data.find(o => o.simulationInputId === inputId) : null;
          
        if (!output) {
          // Create a simplified mock output
          output = {
            id: 'test-' + Date.now(),
            simulationInputId: inputId,
            status: 'completed',
            startTime: Date.now() - 5000,
            endTime: Date.now(),
            progressPercentage: 100,
            results: {
              statistics: {
                mean: 20 + Math.random() * 10,
                median: 20 + Math.random() * 10
              }
            }
          };
        }
        
        return output;
      }
    };
    
    // Test the mock integration
    const importedInputs = mockIntegration.importAllSimulationInputs();
    logStream.write(`Mock integration imported ${importedInputs.length} inputs\n`);
    
    const importedOutputs = mockIntegration.importAllSimulationOutputs();
    logStream.write(`Mock integration imported ${importedOutputs.length} outputs\n`);
    
    // Try to run a simulation if we have inputs
    let simulationResult = null;
    if (importedInputs.length > 0) {
      const firstInputId = importedInputs[0].id;
      simulationResult = mockIntegration.runSimulationFromDataProduct(firstInputId);
      logStream.write(`Mock simulation result: ${simulationResult ? 'Success' : 'Failed'}\n`);
    }
    
    const integrationValid = 
      importedInputs.length > 0 && 
      importedOutputs.length > 0 && 
      simulationResult !== null;
    
    console.log(`- Mock integration test: ${integrationValid ? 'PASS' : 'FAIL'}`);
    
    // Print summary
    console.log('\nTest Summary');
    console.log('===========');
    console.log(`Files exist: ${(inputExists && outputExists && historyExists) ? 'PASS' : 'FAIL'}`);
    console.log(`Valid JSON: ${(inputValid && outputValid && historyValid) ? 'PASS' : 'FAIL'}`);
    console.log(`Relationships: ${relationships ? 'PASS' : 'FAIL'}`);
    console.log(`Integration: ${integrationValid ? 'PASS' : 'FAIL'}`);
    
    const overallResult = inputExists && outputExists && historyExists && 
                         inputValid && outputValid && historyValid && 
                         relationships && integrationValid;
    
    console.log(`\nOVERALL RESULT: ${overallResult ? 'PASS' : 'FAIL'}`);
    
    logStream.write(`\nOVERALL RESULT: ${overallResult ? 'PASS' : 'FAIL'}\n`);
    logStream.end();
    
    console.log(`\nDetailed log written to ${TEST_LOG_FILE}`);
  } catch (error) {
    console.error('Test failed with error:', error.message);
    logStream.write(`\nTest failed with error: ${error.message}\n`);
    logStream.end();
  }
}

// Run the tests
runTests().catch(err => {
  console.error('Unhandled error during tests:', err);
});