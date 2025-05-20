#!/usr/bin/env python3
"""
Advanced Monte Carlo API Integration Test
Tests the advanced Monte Carlo API with multi-GPU and distributed capabilities
"""

import requests
import json
import time
import numpy as np
import matplotlib.pyplot as plt
import argparse
import os
from pathlib import Path
from typing import Dict, List, Any, Optional, Tuple
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("AdvancedMonteCarloTest")

# API endpoints
DEFAULT_API_URL = "http://localhost:8888"

def check_api_status(api_url: str) -> Dict[str, Any]:
    """Check if the API is running and get capabilities"""
    try:
        response = requests.get(f"{api_url}/api/capabilities", timeout=10)
        response.raise_for_status()
        capabilities = response.json()
        
        # Check if the advanced Monte Carlo API is available
        if capabilities.get("advanced_monte_carlo", False):
            logger.info("Advanced Monte Carlo API is available")
            
            # Check detailed status
            status_response = requests.get(f"{api_url}/api/advanced-monte-carlo/status", timeout=10)
            status_response.raise_for_status()
            status = status_response.json()
            
            logger.info(f"CUDA available: {status.get('cuda_available', False)}")
            if status.get("cuda_available", False):
                gpu_devices = status.get("gpu_devices", [])
                logger.info(f"GPU devices: {len(gpu_devices)}")
                for i, device in enumerate(gpu_devices):
                    logger.info(f"  GPU {i}: {device.get('name')} ({device.get('memory', 0) / (1024**3):.2f} GB)")
            
            return status
        else:
            logger.error("Advanced Monte Carlo API is not available")
            return {"status": "not_available"}
    except requests.RequestException as e:
        logger.error(f"Error connecting to API: {e}")
        return {"status": "error", "message": str(e)}

def run_simple_tariff_impact_test(api_url: str) -> Dict[str, Any]:
    """Run a simple tariff impact simulation"""
    request_data = {
        "variables": [
            {
                "name": "tariff_rate",
                "distribution": "normal",
                "params": {
                    "mean": 0.15,
                    "std": 0.03
                },
                "importance": 1.0
            },
            {
                "name": "price_elasticity",
                "distribution": "normal",
                "params": {
                    "mean": -1.8,
                    "std": 0.4
                },
                "importance": 0.8
            },
            {
                "name": "competitor_response",
                "distribution": "uniform",
                "params": {
                    "low": 0.1,
                    "high": 0.6
                },
                "importance": 0.7
            },
            {
                "name": "market_adaptability",
                "distribution": "uniform",
                "params": {
                    "low": 0.2,
                    "high": 0.7
                },
                "importance": 0.6
            }
        ],
        "config": {
            "iterations": 50000,
            "sampling_method": "latin_hypercube",
            "use_multi_gpu": True,
            "use_domain_optimizations": True,
            "precision": "mixed",
            "batch_size": 10000,
            "return_samples": False,
            "market_scenario": "base",
            "baseline_revenue": 60000000000.0,
            "baseline_costs": 51000000000.0,
            "us_export_percentage": 35.0,
            "price_elasticity": -2.0
        }
    }
    
    try:
        logger.info("Running tariff impact simulation...")
        start_time = time.time()
        response = requests.post(f"{api_url}/api/advanced-monte-carlo/tariff-impact", json=request_data, timeout=120)
        response.raise_for_status()
        result = response.json()
        elapsed_time = time.time() - start_time
        
        logger.info(f"Simulation completed in {elapsed_time:.2f} seconds")
        
        # Check if the result is from cache
        if result.get("cached", False):
            logger.info("Result was retrieved from cache")
        
        # Extract key statistics
        stats = result.get("results", {}).get("statistics", {})
        for output, values in stats.items():
            if "mean" in values and "std" in values:
                logger.info(f"{output}: Mean = {values['mean']:.2f}, Std = {values['std']:.2f}")
        
        return result
    except requests.RequestException as e:
        logger.error(f"Error running simulation: {e}")
        return {"status": "error", "message": str(e)}

def run_stress_test(api_url: str) -> Dict[str, Any]:
    """Run stress test for different market scenarios"""
    request_data = {
        "baseline_config": {
            "iterations": 50000,
            "sampling_method": "latin_hypercube",
            "use_multi_gpu": True,
            "use_domain_optimizations": True,
            "precision": "mixed",
            "batch_size": 10000,
            "market_scenario": "base",
            "baseline_revenue": 60000000000.0,
            "baseline_costs": 51000000000.0,
            "us_export_percentage": 35.0,
            "price_elasticity": -2.0
        },
        "stress_scenarios": [
            "base",
            "recession", 
            "stagflation", 
            "high_volatility", 
            "trade_war"
        ],
        "variables": [
            {
                "name": "tariff_rate",
                "distribution": "normal",
                "params": {
                    "mean": 0.15,
                    "std": 0.03
                },
                "importance": 1.0
            },
            {
                "name": "price_elasticity",
                "distribution": "normal",
                "params": {
                    "mean": -1.8,
                    "std": 0.4
                },
                "importance": 0.8
            },
            {
                "name": "competitor_response",
                "distribution": "uniform",
                "params": {
                    "low": 0.1,
                    "high": 0.6
                },
                "importance": 0.7
            }
        ]
    }
    
    try:
        logger.info("Running market stress test...")
        start_time = time.time()
        response = requests.post(f"{api_url}/api/advanced-monte-carlo/stress-test", json=request_data, timeout=180)
        response.raise_for_status()
        result = response.json()
        elapsed_time = time.time() - start_time
        
        logger.info(f"Stress test completed in {elapsed_time:.2f} seconds")
        
        # Extract key statistics for each scenario
        stress_results = result.get("stress_results", {})
        for scenario, data in stress_results.items():
            stats = data.get("statistics", {}).get("total_financial_impact", {})
            if "mean" in stats and "std" in stats:
                logger.info(f"Scenario {scenario}: Mean impact = {stats['mean']:.2f}, Std = {stats['std']:.2f}")
        
        return result
    except requests.RequestException as e:
        logger.error(f"Error running stress test: {e}")
        return {"status": "error", "message": str(e)}

def run_flexibility_valuation(api_url: str) -> Dict[str, Any]:
    """Run a Black-Scholes flexibility valuation test"""
    params = {
        "current_revenue": 60000000000.0,
        "revenue_at_risk": 21000000000.0,
        "time_horizon": 3.0,
        "volatility": 0.25,
        "risk_free_rate": 0.03,
        "tariff_probability": 0.5
    }
    
    try:
        logger.info("Running flexibility valuation...")
        start_time = time.time()
        response = requests.post(f"{api_url}/api/advanced-monte-carlo/black-scholes/flexibility-value", params=params, timeout=30)
        response.raise_for_status()
        result = response.json()
        elapsed_time = time.time() - start_time
        
        logger.info(f"Valuation completed in {elapsed_time:.2f} seconds")
        logger.info(f"Flexibility value: ${result.get('flexibility_value', 0):.2f}")
        
        return result
    except requests.RequestException as e:
        logger.error(f"Error running flexibility valuation: {e}")
        return {"status": "error", "message": str(e)}

def run_multi_period_simulation(api_url: str) -> Dict[str, Any]:
    """Run a multi-period tariff impact simulation"""
    request_data = {
        "periods": 5,
        "variables": {
            "tariff_rate": {
                "initial_value": 0.15,
                "growth_rate": -0.1  # Decreasing over time
            },
            "negotiation_probability": {
                "initial_value": 0.3,
                "growth_rate": 0.2  # Increasing over time
            }
        },
        "config": {
            "iterations": 50000,
            "sampling_method": "latin_hypercube",
            "use_multi_gpu": True,
            "use_domain_optimizations": True,
            "precision": "mixed",
            "market_scenario": "base",
            "baseline_revenue": 60000000000.0,
            "baseline_costs": 51000000000.0,
            "us_export_percentage": 35.0,
            "price_elasticity": -2.0
        }
    }
    
    try:
        logger.info("Running multi-period simulation...")
        start_time = time.time()
        response = requests.post(f"{api_url}/api/advanced-monte-carlo/multi-period", json=request_data, timeout=120)
        response.raise_for_status()
        result = response.json()
        elapsed_time = time.time() - start_time
        
        logger.info(f"Multi-period simulation completed in {elapsed_time:.2f} seconds")
        
        # Extract key statistics for each period
        total_impact = result.get("results", {}).get("total_impact", [])
        periods = result.get("periods", 0)
        
        logger.info(f"Periods simulated: {periods}")
        for i, impact in enumerate(total_impact[:periods]):
            logger.info(f"Period {i+1}: Mean impact = ${impact:.2f}")
        
        return result
    except requests.RequestException as e:
        logger.error(f"Error running multi-period simulation: {e}")
        return {"status": "error", "message": str(e)}

def plot_multi_period_results(result: Dict[str, Any], output_dir: str = "./results"):
    """Plot multi-period simulation results"""
    # Create output directory if it doesn't exist
    output_path = Path(output_dir)
    output_path.mkdir(exist_ok=True)
    
    # Extract data
    periods = result.get("periods", 0)
    total_impact = result.get("results", {}).get("total_impact", [])
    
    if not total_impact or periods == 0:
        logger.error("No data to plot")
        return
    
    # Create the plot
    plt.figure(figsize=(10, 6))
    x = list(range(1, periods + 1))
    plt.plot(x, total_impact[:periods], 'o-', linewidth=2, markersize=8)
    plt.title("Multi-Period Tariff Impact Analysis", fontsize=14)
    plt.xlabel("Period", fontsize=12)
    plt.ylabel("Financial Impact ($)", fontsize=12)
    plt.grid(True, linestyle='--', alpha=0.7)
    plt.xticks(x)
    
    # Format y-axis labels in millions or billions
    import matplotlib.ticker as ticker
    def billions(x, pos):
        return f'${x/1e9:.1f}B'
    plt.gca().yaxis.set_major_formatter(ticker.FuncFormatter(billions))
    
    # Add data labels
    for i, impact in enumerate(total_impact[:periods]):
        plt.annotate(f"${impact/1e9:.1f}B", 
                    (i+1, impact),
                    textcoords="offset points", 
                    xytext=(0, 10),
                    ha='center')
    
    # Save the plot
    filename = output_path / "multi_period_impact.png"
    plt.savefig(filename, dpi=300, bbox_inches='tight')
    logger.info(f"Plot saved to {filename}")

def run_optimization_test(api_url: str) -> Dict[str, Any]:
    """Run mitigation strategy optimization test"""
    request_data = {
        "tariff_rate": 0.15,
        "strategy_costs": {
            "supply_chain_restructuring": 2500000000.0,
            "factory_relocation": 5000000000.0,
            "product_redesign": 1500000000.0,
            "trade_agreement_lobbying": 500000000.0,
            "market_diversification": 3000000000.0
        },
        "strategy_benefits": {
            "supply_chain_restructuring": 0.4,
            "factory_relocation": 0.7,
            "product_redesign": 0.3,
            "trade_agreement_lobbying": 0.2,
            "market_diversification": 0.5
        },
        "budget_constraint": 7000000000.0,
        "min_improvement": 0.3,
        "company_profile": {
            "baseline_revenue": 60000000000.0,
            "baseline_costs": 51000000000.0,
            "us_export_percentage": 35.0,
            "price_elasticity": -2.0
        }
    }
    
    try:
        logger.info("Running optimization test...")
        start_time = time.time()
        response = requests.post(f"{api_url}/api/advanced-monte-carlo/optimize-mitigation", json=request_data, timeout=60)
        response.raise_for_status()
        result = response.json()
        elapsed_time = time.time() - start_time
        
        logger.info(f"Optimization completed in {elapsed_time:.2f} seconds")
        
        # Extract optimal strategy
        optimal_strategy = result.get("optimal_strategy", {})
        logger.info("Optimal strategy:")
        for strategy, included in optimal_strategy.items():
            if included:
                logger.info(f"  - {strategy}")
        
        logger.info(f"Total cost: ${result.get('total_cost', 0):.2f}")
        logger.info(f"Expected impact reduction: {result.get('expected_impact_reduction', 0) * 100:.1f}%")
        
        return result
    except requests.RequestException as e:
        logger.error(f"Error running optimization test: {e}")
        return {"status": "error", "message": str(e)}

def run_performance_comparison(api_url: str) -> Dict[str, Any]:
    """Compare performance with different configurations"""
    configurations = [
        {"name": "Standard (CPU)", "use_multi_gpu": False, "use_domain_optimizations": False, "precision": "fp32", "iterations": 50000},
        {"name": "GPU Basic", "use_multi_gpu": False, "use_domain_optimizations": False, "precision": "mixed", "iterations": 50000},
        {"name": "GPU Optimized", "use_multi_gpu": False, "use_domain_optimizations": True, "precision": "mixed", "iterations": 50000},
        {"name": "Multi-GPU", "use_multi_gpu": True, "use_domain_optimizations": True, "precision": "mixed", "iterations": 50000}
    ]
    
    results = []
    
    for config in configurations:
        request_data = {
            "variables": [
                {
                    "name": "tariff_rate",
                    "distribution": "normal",
                    "params": {
                        "mean": 0.15,
                        "std": 0.03
                    },
                    "importance": 1.0
                },
                {
                    "name": "price_elasticity",
                    "distribution": "normal",
                    "params": {
                        "mean": -1.8,
                        "std": 0.4
                    },
                    "importance": 0.8
                },
                {
                    "name": "competitor_response",
                    "distribution": "uniform",
                    "params": {
                        "low": 0.1,
                        "high": 0.6
                    },
                    "importance": 0.7
                }
            ],
            "config": {
                "iterations": config["iterations"],
                "sampling_method": "latin_hypercube",
                "use_multi_gpu": config["use_multi_gpu"],
                "use_domain_optimizations": config["use_domain_optimizations"],
                "precision": config["precision"],
                "batch_size": 10000,
                "return_samples": False,
                "market_scenario": "base",
                "baseline_revenue": 60000000000.0,
                "baseline_costs": 51000000000.0,
                "us_export_percentage": 35.0,
                "price_elasticity": -2.0
            }
        }
        
        try:
            logger.info(f"Running performance test with configuration: {config['name']}...")
            
            # First clear the cache
            requests.delete(f"{api_url}/api/advanced-monte-carlo/cache")
            
            # Then run the test
            start_time = time.time()
            response = requests.post(f"{api_url}/api/advanced-monte-carlo/tariff-impact", json=request_data, timeout=180)
            response.raise_for_status()
            result = response.json()
            elapsed_time = time.time() - start_time
            
            # Check if cached (should not be since we cleared cache)
            if result.get("cached", False):
                logger.warning("Result was retrieved from cache despite clearing it")
            
            logger.info(f"Configuration {config['name']} completed in {elapsed_time:.2f} seconds")
            
            results.append({
                "configuration": config["name"],
                "elapsed_time": elapsed_time,
                "computation_time": result.get("results", {}).get("computation_time", elapsed_time),
                "iterations": config["iterations"]
            })
            
            # Give the system a brief rest between tests
            time.sleep(2)
            
        except requests.RequestException as e:
            logger.error(f"Error running performance test for {config['name']}: {e}")
            results.append({
                "configuration": config["name"],
                "elapsed_time": -1,
                "error": str(e)
            })
    
    return {"performance_comparison": results}

def plot_performance_comparison(results: Dict[str, Any], output_dir: str = "./results"):
    """Plot performance comparison results"""
    # Create output directory if it doesn't exist
    output_path = Path(output_dir)
    output_path.mkdir(exist_ok=True)
    
    # Extract data
    performance_data = results.get("performance_comparison", [])
    
    if not performance_data:
        logger.error("No performance data to plot")
        return
    
    # Prepare plot data
    configs = [item["configuration"] for item in performance_data if "elapsed_time" in item and item["elapsed_time"] > 0]
    times = [item["elapsed_time"] for item in performance_data if "elapsed_time" in item and item["elapsed_time"] > 0]
    
    if not configs or not times:
        logger.error("No valid performance data to plot")
        return
    
    # Create the plot
    plt.figure(figsize=(10, 6))
    bars = plt.bar(configs, times)
    plt.title("Monte Carlo Simulation Performance Comparison", fontsize=14)
    plt.xlabel("Configuration", fontsize=12)
    plt.ylabel("Execution Time (seconds)", fontsize=12)
    plt.grid(True, linestyle='--', alpha=0.7, axis='y')
    
    # Add data labels
    for bar, time_value in zip(bars, times):
        plt.annotate(f"{time_value:.1f}s", 
                    (bar.get_x() + bar.get_width() / 2, time_value),
                    textcoords="offset points", 
                    xytext=(0, 10),
                    ha='center')
    
    # Calculate speedups relative to first configuration (baseline)
    if len(times) > 1 and times[0] > 0:
        baseline = times[0]
        speedups = [baseline / time for time in times]
        
        # Add speedup text
        for i, (bar, speedup) in enumerate(zip(bars, speedups)):
            if i > 0:  # Skip the baseline
                plt.annotate(f"{speedup:.1f}x", 
                            (bar.get_x() + bar.get_width() / 2, times[i] / 2),
                            color='white', fontweight='bold',
                            ha='center', va='center')
    
    # Save the plot
    filename = output_path / "performance_comparison.png"
    plt.savefig(filename, dpi=300, bbox_inches='tight')
    logger.info(f"Performance plot saved to {filename}")

def run_all_tests(api_url: str, output_dir: str = "./results"):
    """Run all tests in sequence"""
    test_results = {}
    
    # Step 1: Check API status
    logger.info("\n=== Checking API Status ===")
    status = check_api_status(api_url)
    test_results["status"] = status
    
    if status.get("status") == "not_available":
        logger.error("Cannot proceed with tests since the Advanced Monte Carlo API is not available")
        return test_results
    
    # Step 2: Run simple tariff impact test
    logger.info("\n=== Running Simple Tariff Impact Test ===")
    tariff_impact = run_simple_tariff_impact_test(api_url)
    test_results["tariff_impact"] = tariff_impact
    
    # Step 3: Run multi-period simulation
    logger.info("\n=== Running Multi-Period Simulation ===")
    multi_period = run_multi_period_simulation(api_url)
    test_results["multi_period"] = multi_period
    
    # Plot multi-period results
    if "results" in multi_period:
        plot_multi_period_results(multi_period, output_dir)
    
    # Step 4: Run stress test
    logger.info("\n=== Running Market Stress Test ===")
    stress_test = run_stress_test(api_url)
    test_results["stress_test"] = stress_test
    
    # Step 5: Run flexibility valuation
    logger.info("\n=== Running Flexibility Valuation ===")
    flexibility = run_flexibility_valuation(api_url)
    test_results["flexibility"] = flexibility
    
    # Step 6: Run optimization test
    logger.info("\n=== Running Optimization Test ===")
    optimization = run_optimization_test(api_url)
    test_results["optimization"] = optimization
    
    # Step 7: Run performance comparison
    logger.info("\n=== Running Performance Comparison ===")
    performance = run_performance_comparison(api_url)
    test_results["performance"] = performance
    
    # Plot performance comparison
    plot_performance_comparison(performance, output_dir)
    
    # Save all results to JSON
    results_file = Path(output_dir) / "advanced_monte_carlo_test_results.json"
    with open(results_file, 'w') as f:
        json.dump(test_results, f, indent=2)
    
    logger.info(f"\nAll test results saved to {results_file}")
    
    return test_results

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Test the Advanced Monte Carlo API")
    parser.add_argument("--api-url", default=DEFAULT_API_URL, help="API base URL (default: http://localhost:8888)")
    parser.add_argument("--output-dir", default="./results", help="Output directory for results and plots")
    parser.add_argument("--test", choices=["status", "tariff", "multi-period", "stress", "flexibility", "optimization", "performance", "all"], 
                        default="all", help="Which test to run")
    
    args = parser.parse_args()
    
    if args.test == "status":
        check_api_status(args.api_url)
    elif args.test == "tariff":
        run_simple_tariff_impact_test(args.api_url)
    elif args.test == "multi-period":
        result = run_multi_period_simulation(args.api_url)
        plot_multi_period_results(result, args.output_dir)
    elif args.test == "stress":
        run_stress_test(args.api_url)
    elif args.test == "flexibility":
        run_flexibility_valuation(args.api_url)
    elif args.test == "optimization":
        run_optimization_test(args.api_url)
    elif args.test == "performance":
        result = run_performance_comparison(args.api_url)
        plot_performance_comparison(result, args.output_dir)
    else:  # "all"
        run_all_tests(args.api_url, args.output_dir)