#!/usr/bin/env python3
"""
Test script for the NVIDIA integration module
Uses mock data to verify functionality
"""

import os
import json
from nvidia_integration import NVIDIAAPIClient

def main():
    """Test the NVIDIA API client with mock data"""
    print("\n===== NVIDIA API Integration Test =====\n")
    
    # Initialize client without API key to use mock data
    client = NVIDIAAPIClient()
    
    # Test company data
    company_data = {
        "name": "Samsung Electronics Vietnam",
        "industry": "Electronics",
        "annual_revenue": 60000000000,
        "employee_count": 160000,
        "us_export_percentage": 35.0
    }
    
    # Test parameters for Monte Carlo simulation
    simulation_params = {
        "tariff_rate": 46.0,
        "negotiation_chance": 0.3,
        "market_adaptability": 0.5
    }
    
    # Test 1: Tariff Impact Analysis
    print("Test 1: Tariff Impact Analysis")
    print("-" * 40)
    impacts = client.analyze_tariff_impacts(company_data)
    print(f"Received {len(impacts)} impact predictions")
    print("Sample impact:")
    print(json.dumps(impacts[0], indent=2))
    print("\n")
    
    # Test 2: Monte Carlo Simulation
    print("Test 2: Monte Carlo Simulation")
    print("-" * 40)
    simulation = client.run_monte_carlo_simulation(
        parameters=simulation_params,
        iterations=10000
    )
    print(f"Simulation ID: {simulation.get('simulation_id')}")
    print(f"GPU utilized: {simulation.get('gpu_utilized')}")
    
    # Print key results
    results = simulation.get("results", {})
    print("\nKey findings:")
    print(f"- Expected impact: ${results.get('expected_financial_impact', 0)/1000000000:.2f}B")
    print(f"- Worst case: ${results.get('worst_case_impact', 0)/1000000000:.2f}B")
    print(f"- Best case: ${results.get('best_case_impact', 0)/1000000000:.2f}B")
    
    # 95% confidence interval
    ci_95 = results.get("confidence_interval_95", {})
    print(f"- 95% CI: $({ci_95.get('lower', 0)/1000000000:.2f}B to {ci_95.get('upper', 0)/1000000000:.2f}B)")
    print("\n")
    
    # Test 3: Mitigation Strategies
    print("Test 3: Mitigation Strategies")
    print("-" * 40)
    strategies = client.analyze_mitigation_strategies(impacts, company_data)
    print(f"Received {len(strategies)} mitigation strategies")
    
    # Print top strategy
    if strategies:
        top = strategies[0]
        print("\nTop recommended strategy:")
        print(f"- Strategy: {top.get('strategy')}")
        print(f"- Provider: {top.get('provider')}")
        print(f"- Cost: ${top.get('implementation_cost', 0):,}")
        print(f"- Expected benefit: ${top.get('expected_benefit', 0):,}")
        print(f"- ROI: {top.get('roi')}%")
        print(f"- Timeline: {top.get('implementation_time')}")
    
    print("\n")
    
    # Test 4: Market Data
    print("Test 4: Real-time Market Data")
    print("-" * 40)
    indicators = ["us_gdp", "vn_manufacturing_index", "tariff_negotiations"]
    market_data = client.get_real_time_market_data(indicators)
    
    print(f"Received data for {len(market_data)} market indicators")
    print("\nIndicator data:")
    for indicator, data in market_data.items():
        print(f"- {indicator}: {data.get('value')} {data.get('unit')} ({data.get('trend')})")
    
    print("\n===== All NVIDIA API Tests Completed =====\n")
    
if __name__ == "__main__":
    main()