#!/usr/bin/env node

import { extractAndLoadFinancialData } from './extractAndLoadFinancialData';
import { parseAndProcessTariffData } from './parseAndProcessTariffData';
import { loadCompanyDataToRAG } from './loadCompanyDataToRAG';
import { loadDataProducts } from '../src/scripts/loadDataProductsToRedis';

/**
 * Master script that runs the complete data processing pipeline:
 * 1. Extract and load financial data using LangChain and Perplexity API
 * 2. Parse and process tariff data
 * 3. Load company data to RAG system
 * 4. Load all data products to Redis
 */
async function runDataProcessingPipeline() {
  console.log('===============================================');
  console.log('STARTING COMPLETE DATA PROCESSING PIPELINE');
  console.log('===============================================');

  try {
    console.log('\n\n--- STEP 1: Extract and Load Financial Data ---');
    await extractAndLoadFinancialData();
    console.log('Financial data extraction completed successfully');

    console.log('\n\n--- STEP 2: Parse and Process Tariff Data ---');
    await parseAndProcessTariffData();
    console.log('Tariff data processing completed successfully');

    console.log('\n\n--- STEP 3: Load Company Data to RAG System ---');
    await loadCompanyDataToRAG();
    console.log('Company data loaded to RAG system successfully');

    console.log('\n\n--- STEP 4: Load All Data Products to Redis ---');
    await loadDataProducts();
    console.log('All data products loaded to Redis successfully');

    console.log('\n===============================================');
    console.log('DATA PROCESSING PIPELINE COMPLETED SUCCESSFULLY');
    console.log('===============================================');

    process.exit(0);
  } catch (error) {
    console.error('\n===============================================');
    console.error('DATA PROCESSING PIPELINE FAILED');
    console.error('===============================================');
    console.error(error);
    process.exit(1);
  }
}

// Run the pipeline when script is executed directly
if (require.main === module) {
  runDataProcessingPipeline();
}

export { runDataProcessingPipeline };