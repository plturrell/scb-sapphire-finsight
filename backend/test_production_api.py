#!/usr/bin/env python3
"""
Test script for the production tariff analysis API
Demonstrates comprehensive tariff impact analysis with real-world examples
"""

import requests
import json
import time
import matplotlib.pyplot as plt
import numpy as np
from pathlib import Path
import os
import argparse

# API base URL
DEFAULT_API_URL = "http://localhost:8888"

# Test data
SAMPLE_COMPANY_PROFILES = {
    "tech": {
        "company": "Global TechCorp",
        "annual_revenue": 60_000_000_000,  # $60 billion
        "annual_costs": 51_000_000_000,    # $51 billion
        "us_export_percentage": 35.0,      # 35% of revenue from US exports
        "price_elasticity": -2.0,          # Price elasticity of demand
        "sector": "Technology",
        "size": "Large"
    },
    "auto": {
        "company": "AutoMotive Industries",
        "annual_revenue": 85_000_000_000,  # $85 billion
        "annual_costs": 76_500_000_000,    # $76.5 billion
        "us_export_percentage": 40.0,      # 40% of revenue from US exports
        "price_elasticity": -1.8,          # Price elasticity of demand
        "sector": "Automotive",
        "size": "Large"
    },
    "chemical": {
        "company": "ChemSolutions Inc.",
        "annual_revenue": 12_000_000_000,  # $12 billion
        "annual_costs": 9_600_000_000,     # $9.6 billion
        "us_export_percentage": 45.0,      # 45% of revenue from US exports
        "price_elasticity": -1.5,          # Price elasticity of demand
        "sector": "Chemicals",
        "size": "Medium"
    }
}

def test_standard_analysis(api_url, company_key="tech", tariff_rate=0.15, use_gpu=True):
    """Test standard tariff impact analysis"""
    print(f"\n=== Standard Tariff Impact Analysis for {company_key.capitalize()} Company ===")
    
    company_profile = SAMPLE_COMPANY_PROFILES[company_key]
    
    request_data = {
        "company_profile": company_profile,
        "tariff_rate": tariff_rate,
        "use_gpu": use_gpu,
        "profile": "balanced",
        "iterations": 100000,
        "sampling_method": "latin_hypercube"
    }
    
    print(f"Running analysis for {company_profile['company']} with tariff rate {tariff_rate}...")
    
    try:
        start_time = time.time()
        response = requests.post(f"{api_url}/api/tariff-analysis/standard", json=request_data)
        response.raise_for_status()
        result = response.json()
        elapsed_time = time.time() - start_time
        
        print(f"Analysis completed in {elapsed_time:.2f} seconds")
        
        # Check if result is cached
        if result.get("cached", False):
            print("Result retrieved from cache")
        
        # Extract key statistics
        stats = result["results"]["statistics"]
        
        print("\nKey Results:")
        for output in ["total_financial_impact", "percentage_impact", "profit_impact_percentage"]:
            if output in stats:
                mean = stats[output]["mean"]
                std = stats[output]["std"]
                var = stats[output]["var"]
                
                if output == "total_financial_impact":
                    print(f"Total Financial Impact: ${mean:,.2f} ± ${std:,.2f}")
                elif output == "percentage_impact":
                    print(f"Percentage of Revenue: {mean:.2f}% ± {std:.2f}%")
                elif output == "profit_impact_percentage":
                    print(f"Percentage of Profit: {mean:.2f}% ± {std:.2f}%")
        
        # Extract risk analyses if available
        if "risk_analyses" in result["results"]:
            risk = result["results"]["risk_analyses"]
            if "total_financial_impact" in risk:
                var = risk["total_financial_impact"]["var"]
                cvar = risk["total_financial_impact"]["cvar"]
                print(f"\nRisk Metrics:")
                print(f"Value at Risk (95%): ${var:,.2f}")
                print(f"Conditional Value at Risk (95%): ${cvar:,.2f}")
        
        return result["results"]
    
    except requests.RequestException as e:
        print(f"Error: {e}")
        if hasattr(e, 'response') and e.response is not None:
            try:
                error_detail = e.response.json().get('detail', 'Unknown error')
                print(f"API Error: {error_detail}")
            except:
                print(f"Status code: {e.response.status_code}")
        return None

def test_multi_scenario_analysis(api_url, company_key="tech", tariff_rate=0.15, use_gpu=True):
    """Test multi-scenario tariff impact analysis"""
    print(f"\n=== Multi-Scenario Market Analysis for {company_key.capitalize()} Company ===")
    
    company_profile = SAMPLE_COMPANY_PROFILES[company_key]
    
    scenarios = ["base", "recession", "stagflation", "growth", "high_volatility", "trade_war"]
    
    request_data = {
        "company_profile": company_profile,
        "tariff_rate": tariff_rate,
        "scenarios": scenarios,
        "use_gpu": use_gpu,
        "profile": "balanced",
        "iterations": 50000
    }
    
    print(f"Running multi-scenario analysis for {company_profile['company']} across {len(scenarios)} scenarios...")
    
    try:
        start_time = time.time()
        response = requests.post(f"{api_url}/api/tariff-analysis/multi-scenario", json=request_data)
        response.raise_for_status()
        result = response.json()
        elapsed_time = time.time() - start_time
        
        print(f"Analysis completed in {elapsed_time:.2f} seconds")
        
        # Check if result is cached
        if result.get("cached", False):
            print("Result retrieved from cache")
        
        # Extract key statistics for each scenario
        print("\nTotal Financial Impact by Scenario:")
        
        scenario_impacts = {}
        for scenario, data in result["results"]["scenarios"].items():
            if "statistics" in data and "total_financial_impact" in data["statistics"]:
                mean = data["statistics"]["total_financial_impact"]["mean"]
                std = data["statistics"]["total_financial_impact"]["std"]
                scenario_impacts[scenario] = mean
                print(f"{scenario.capitalize()}: ${mean:,.2f} ± ${std:,.2f}")
        
        # Plot scenario comparison
        if scenario_impacts:
            plt.figure(figsize=(12, 6))
            scenarios = list(scenario_impacts.keys())
            impacts = [scenario_impacts[s] for s in scenarios]
            
            bars = plt.bar(scenarios, impacts)
            plt.title(f"Tariff Impact Across Market Scenarios - {company_profile['company']}")
            plt.xlabel("Market Scenario")
            plt.ylabel("Total Financial Impact ($)")
            plt.xticks(rotation=45)
            plt.grid(axis='y', alpha=0.3)
            
            # Add values on top of bars
            for bar in bars:
                height = bar.get_height()
                plt.text(bar.get_x() + bar.get_width()/2., height + 0.1,
                        f'${height/1e9:.1f}B',
                        ha='center', va='bottom', rotation=0)
            
            plt.tight_layout()
            
            # Create output directory if it doesn't exist
            output_dir = Path("./results")
            os.makedirs(output_dir, exist_ok=True)
            
            # Save plot
            output_path = output_dir / f"multi_scenario_comparison_{company_key}.png"
            plt.savefig(output_path)
            print(f"\nScenario comparison plot saved to {output_path}")
        
        return result["results"]
    
    except requests.RequestException as e:
        print(f"Error: {e}")
        if hasattr(e, 'response') and e.response is not None:
            try:
                error_detail = e.response.json().get('detail', 'Unknown error')
                print(f"API Error: {error_detail}")
            except:
                print(f"Status code: {e.response.status_code}")
        return None

def test_flexibility_valuation(api_url, company_key="tech"):
    """Test flexibility valuation using Black-Scholes model"""
    print(f"\n=== Flexibility Valuation for {company_key.capitalize()} Company ===")
    
    company_profile = SAMPLE_COMPANY_PROFILES[company_key]
    
    # Parameters for flexibility valuation
    request_data = {
        "company_profile": company_profile,
        "time_horizon": 3.0,         # 3 years
        "volatility": 0.25,          # 25% volatility
        "risk_free_rate": 0.03,      # 3% risk-free rate
        "tariff_probability": 0.5    # 50% probability of tariff implementation
    }
    
    print(f"Calculating flexibility value for {company_profile['company']}...")
    
    try:
        start_time = time.time()
        response = requests.post(f"{api_url}/api/tariff-analysis/flexibility", json=request_data)
        response.raise_for_status()
        result = response.json()
        elapsed_time = time.time() - start_time
        
        print(f"Calculation completed in {elapsed_time:.2f} seconds")
        
        # Extract key results
        flexibility_value = result["flexibility_value"]
        flexibility_percentage = result["flexibility_value_percentage"]
        
        print("\nFlexibility Valuation Results:")
        print(f"Value of flexibility: ${flexibility_value:,.2f}")
        print(f"As percentage of revenue at risk: {flexibility_percentage:.2f}%")
        
        return result
    
    except requests.RequestException as e:
        print(f"Error: {e}")
        if hasattr(e, 'response') and e.response is not None:
            try:
                error_detail = e.response.json().get('detail', 'Unknown error')
                print(f"API Error: {error_detail}")
            except:
                print(f"Status code: {e.response.status_code}")
        return None

def test_multi_period_analysis(api_url, company_key="tech"):
    """Test multi-period tariff impact analysis"""
    print(f"\n=== Multi-Period Analysis for {company_key.capitalize()} Company ===")
    
    company_profile = SAMPLE_COMPANY_PROFILES[company_key]
    
    # Parameters for multi-period analysis
    request_data = {
        "company_profile": company_profile,
        "periods": 5,                    # 5 periods (years)
        "tariff_rate_initial": 0.15,     # Initial tariff rate of 15%
        "tariff_rate_growth": -0.1,      # Tariff rate decreases by 10% per period
        "negotiation_probability_initial": 0.3,  # Initial negotiation probability of 30%
        "negotiation_probability_growth": 0.2,   # Negotiation probability increases by 20% per period
        "iterations": 50000              # Number of Monte Carlo iterations
    }
    
    print(f"Running multi-period analysis for {company_profile['company']}...")
    
    try:
        start_time = time.time()
        response = requests.post(f"{api_url}/api/tariff-analysis/multi-period", json=request_data)
        response.raise_for_status()
        result = response.json()
        elapsed_time = time.time() - start_time
        
        print(f"Analysis completed in {elapsed_time:.2f} seconds")
        
        # Extract key results
        results = result["results"]
        inputs = result["inputs"]
        periods = result["periods"]
        
        # Print inputs
        print("\nAnalysis Inputs:")
        print(f"Periods: {periods}")
        print(f"Tariff rates: {[f'{rate:.2%}' for rate in inputs['tariff_rates']]}")
        print(f"Negotiation probabilities: {[f'{prob:.2%}' for prob in inputs['negotiation_probabilities']]}")
        
        # Print key results for each period
        if "total_impact" in results:
            total_impact = results["total_impact"]
            print("\nTotal Financial Impact by Period:")
            for i, impact in enumerate(total_impact):
                print(f"Period {i+1}: ${impact:,.2f}")
            
            # Plot multi-period impact
            plt.figure(figsize=(12, 6))
            periods_range = list(range(1, periods + 1))
            
            plt.plot(periods_range, total_impact, 'o-', linewidth=2, markersize=8)
            plt.title(f"Multi-Period Tariff Impact - {company_profile['company']}")
            plt.xlabel("Period")
            plt.ylabel("Total Financial Impact ($)")
            plt.grid(True, linestyle='--', alpha=0.7)
            plt.xticks(periods_range)
            
            # Format y-axis labels in billions
            import matplotlib.ticker as ticker
            def billions(x, pos):
                return f'${x/1e9:.1f}B'
            plt.gca().yaxis.set_major_formatter(ticker.FuncFormatter(billions))
            
            # Add data labels
            for i, impact in enumerate(total_impact):
                plt.annotate(f"${impact/1e9:.1f}B", 
                            (i+1, impact),
                            textcoords="offset points", 
                            xytext=(0, 10),
                            ha='center')
            
            plt.tight_layout()
            
            # Create output directory if it doesn't exist
            output_dir = Path("./results")
            os.makedirs(output_dir, exist_ok=True)
            
            # Save plot
            output_path = output_dir / f"multi_period_impact_{company_key}.png"
            plt.savefig(output_path)
            print(f"\nMulti-period impact plot saved to {output_path}")
        
        return result
    
    except requests.RequestException as e:
        print(f"Error: {e}")
        if hasattr(e, 'response') and e.response is not None:
            try:
                error_detail = e.response.json().get('detail', 'Unknown error')
                print(f"API Error: {error_detail}")
            except:
                print(f"Status code: {e.response.status_code}")
        return None

def test_all_analyses(api_url, company_key="tech", use_gpu=True):
    """Run all analyses for a given company"""
    print(f"\n=== Running Comprehensive Analysis for {SAMPLE_COMPANY_PROFILES[company_key]['company']} ===\n")
    
    # Run standard analysis
    standard_result = test_standard_analysis(api_url, company_key, 0.15, use_gpu)
    
    # Run multi-scenario analysis
    multi_scenario_result = test_multi_scenario_analysis(api_url, company_key, 0.15, use_gpu)
    
    # Run flexibility valuation
    flexibility_result = test_flexibility_valuation(api_url, company_key)
    
    # Run multi-period analysis
    multi_period_result = test_multi_period_analysis(api_url, company_key)
    
    # Print summary
    print("\n=== Analysis Summary ===")
    
    if standard_result:
        total_impact = standard_result["statistics"]["total_financial_impact"]["mean"]
        percentage_impact = standard_result["statistics"]["percentage_impact"]["mean"]
        print(f"Standard Analysis: ${total_impact:,.2f} ({percentage_impact:.2f}% of revenue)")
    
    if multi_scenario_result and "scenarios" in multi_scenario_result:
        worst_scenario = max(
            multi_scenario_result["scenarios"].items(),
            key=lambda x: x[1]["statistics"]["total_financial_impact"]["mean"] if "statistics" in x[1] else 0
        )
        worst_impact = worst_scenario[1]["statistics"]["total_financial_impact"]["mean"]
        print(f"Worst-Case Scenario ({worst_scenario[0]}): ${worst_impact:,.2f}")
    
    if flexibility_result:
        flexibility_value = flexibility_result["flexibility_value"]
        print(f"Value of Flexibility: ${flexibility_value:,.2f}")
    
    if multi_period_result and "results" in multi_period_result and "total_impact" in multi_period_result["results"]:
        final_impact = multi_period_result["results"]["total_impact"][-1]
        print(f"Final Period Impact: ${final_impact:,.2f}")
    
    print("\nAll analyses completed successfully!")

def check_api_status(api_url):
    """Check if the API is running and get capabilities"""
    try:
        response = requests.get(f"{api_url}/api/capabilities", timeout=10)
        response.raise_for_status()
        capabilities = response.json()
        
        print("=== API Capabilities ===")
        for key, value in capabilities.items():
            if isinstance(value, bool):
                print(f"{key}: {'Available' if value else 'Not available'}")
            elif isinstance(value, dict):
                print(f"{key}:")
                for subkey, subvalue in value.items():
                    print(f"  - {subkey}: {'Available' if subvalue else 'Not available'}")
            else:
                print(f"{key}: {value}")
        
        return capabilities
    
    except requests.RequestException as e:
        print(f"Error connecting to API: {e}")
        return None

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Test the Production Tariff Analysis API")
    parser.add_argument("--api-url", default=DEFAULT_API_URL, help="API base URL")
    parser.add_argument("--company", choices=["tech", "auto", "chemical"], default="tech", help="Company to analyze")
    parser.add_argument("--no-gpu", action="store_true", help="Disable GPU acceleration")
    parser.add_argument("--test", choices=["status", "standard", "multi-scenario", "flexibility", "multi-period", "all"], 
                        default="all", help="Which test to run")
    
    args = parser.parse_args()
    use_gpu = not args.no_gpu
    
    # Check API status
    if args.test == "status" or args.test == "all":
        capabilities = check_api_status(args.api_url)
        if not capabilities:
            print("API is not running or not accessible. Please start the API server first.")
            exit(1)
    
    # Run requested test
    if args.test == "standard":
        test_standard_analysis(args.api_url, args.company, 0.15, use_gpu)
    elif args.test == "multi-scenario":
        test_multi_scenario_analysis(args.api_url, args.company, 0.15, use_gpu)
    elif args.test == "flexibility":
        test_flexibility_valuation(args.api_url, args.company)
    elif args.test == "multi-period":
        test_multi_period_analysis(args.api_url, args.company)
    elif args.test == "all":
        test_all_analyses(args.api_url, args.company, use_gpu)