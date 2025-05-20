#!/usr/bin/env python3
"""
Real-world integration test for NVIDIA API
This script tests the actual integration with NVIDIA's API

To use:
1. Set your NVIDIA API key as an environment variable:
   export NVIDIA_API_KEY=your_key_here
2. Run this script:
   python test_real_integration.py
"""

import os
import json
import time
from nvidia_integration import NvidiaAPIClient

def main():
    """Main test function"""
    # Get API key from environment or use a default for testing
    api_key = os.environ.get("NVIDIA_API_KEY", "")
    
    if not api_key:
        print("\n⚠️  WARNING: No NVIDIA API key provided. Using mock responses.")
        print("For a real test, please set the NVIDIA_API_KEY environment variable.\n")
    
    # Create NVIDIA API client
    client = NvidiaAPIClient(api_key=api_key)
    
    # Test data
    company_data = {
        "name": "Samsung Electronics Vietnam",
        "industry": "Electronics",
        "annual_revenue": 60000000000,
        "employee_count": 160000,
        "us_export_percentage": 35.0
    }
    
    # Test 1: Tariff Impact Analysis
    print("\n🔍 TEST 1: Tariff Impact Analysis")
    print("--------------------------------")
    try:
        print("Calling NVIDIA API for tariff impact analysis...")
        start_time = time.time()
        impacts = client.analyze_tariff_impacts(company_data)
        elapsed = time.time() - start_time
        
        print(f"✅ Success! Received {len(impacts)} impact entries in {elapsed:.2f} seconds")
        print("Sample impact data:")
        print(json.dumps(impacts[0], indent=2))
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test 2: Monte Carlo Simulation
    print("\n🎲 TEST 2: Monte Carlo Simulation")
    print("-------------------------------")
    try:
        simulation_params = {
            "tariff_rate": 46.0,
            "negotiation_chance": 0.3,
            "market_adaptability": 0.5
        }
        
        print("Calling NVIDIA API for Monte Carlo simulation...")
        start_time = time.time()
        results = client.run_monte_carlo_simulation(simulation_params, iterations=10000)
        elapsed = time.time() - start_time
        
        print(f"✅ Success! Completed simulation in {elapsed:.2f} seconds")
        print("Simulation ID:", results.get("simulation_id", "N/A"))
        print("GPU utilized:", results.get("gpu_utilized", "N/A"))
        print("Key findings:")
        
        if "results" in results:
            sim_results = results["results"]
            print(f"- Expected financial impact: {sim_results.get('expected_financial_impact', 'N/A')}")
            print(f"- Worst case: {sim_results.get('worst_case_impact', 'N/A')}")
            print(f"- Best case: {sim_results.get('best_case_impact', 'N/A')}")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test 3: Mitigation Strategies
    print("\n📊 TEST 3: Mitigation Strategies")
    print("------------------------------")
    try:
        # Use impact data from Test 1 or mock data
        impacts_data = impacts if 'impacts' in locals() else [
            {"category": "financial", "severity": 8},
            {"category": "market", "severity": 7}
        ]
        
        print("Calling NVIDIA API for mitigation strategy analysis...")
        start_time = time.time()
        strategies = client.analyze_mitigation_strategies(impacts_data, company_data)
        elapsed = time.time() - start_time
        
        print(f"✅ Success! Received {len(strategies)} strategies in {elapsed:.2f} seconds")
        print("Top recommended strategy:")
        if strategies:
            top_strategy = strategies[0]
            print(f"- Strategy: {top_strategy.get('strategy', 'N/A')}")
            print(f"- Provider: {top_strategy.get('provider', 'N/A')}")
            print(f"- Cost: {top_strategy.get('implementation_cost', 'N/A')}")
            print(f"- ROI: {top_strategy.get('roi', 'N/A')}%")
            print(f"- Timeline: {top_strategy.get('implementation_time', 'N/A')}")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Summary
    print("\n📋 INTEGRATION TEST SUMMARY")
    print("-------------------------")
    if api_key:
        print("✅ All tests completed with actual NVIDIA API integration")
    else:
        print("⚠️  Tests completed with mock responses")
        print("   Set NVIDIA_API_KEY environment variable for actual API testing")
    
    print("\nAPI base URL:", client.base_url)
    print("Model ID:", client.model_id)

if __name__ == "__main__":
    main()