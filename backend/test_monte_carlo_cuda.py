#!/usr/bin/env python3
"""
Test script for CUDA Monte Carlo simulations
Demonstrates performance comparison between CPU and GPU implementations
"""

import os
import json
import time
import logging
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("MonteCarlo-Test")

try:
    # Import the CUDA Monte Carlo simulator
    from analysis.monte_carlo_cuda import CudaMonteCarloSimulator
    
    # Import GPU configuration
    from analysis.cuda_config import get_gpu_config, is_cuda_available, get_device
    
    MONTE_CARLO_AVAILABLE = True
except ImportError as e:
    logger.error(f"Error importing CUDA Monte Carlo modules: {e}")
    MONTE_CARLO_AVAILABLE = False

def run_simulation_benchmark(iterations_list=[1000, 10000, 100000, 1000000]):
    """Run Monte Carlo simulations with different iteration counts"""
    if not MONTE_CARLO_AVAILABLE:
        logger.error("CUDA Monte Carlo modules not available")
        return
    
    # Create simulator with GPU if available
    gpu_available = is_cuda_available()
    device = get_device()
    
    logger.info(f"Running Monte Carlo benchmark using device: {device}")
    logger.info(f"CUDA acceleration available: {gpu_available}")
    
    # Example parameters for tariff analysis
    parameters = {
        "tariff_rate": 46.0,  # Vietnamese electronics tariff rate (%)
        "negotiation_chance": 0.3,  # Probability of successful negotiations
        "market_adaptability": 0.5,  # Market's ability to adapt (0-1)
        "baseline_revenue": 60000000000,  # Company revenue
        "us_export_percentage": 35.0  # Percentage of exports to US
    }
    
    # Run benchmarks
    print("\n===== Monte Carlo Simulation Benchmark =====\n")
    print(f"Device: {device}")
    print(f"Parameters: {json.dumps(parameters, indent=2)}")
    print("\nIterations | GPU Time (ms) | CPU Time (ms) | Speedup")
    print("-" * 60)
    
    for iterations in iterations_list:
        # GPU simulation
        gpu_simulator = CudaMonteCarloSimulator(use_gpu=True)
        gpu_start = time.time()
        gpu_results = gpu_simulator.run_simulation(
            parameters=parameters,
            iterations=iterations,
            use_tensor_cores=True
        )
        gpu_time = (time.time() - gpu_start) * 1000  # ms
        
        # CPU simulation
        cpu_simulator = CudaMonteCarloSimulator(use_gpu=False)
        cpu_start = time.time()
        cpu_results = cpu_simulator.run_simulation(
            parameters=parameters,
            iterations=iterations,
            use_tensor_cores=False
        )
        cpu_time = (time.time() - cpu_start) * 1000  # ms
        
        # Calculate speedup
        speedup = cpu_time / gpu_time if gpu_time > 0 else 0
        
        # Print results
        print(f"{iterations:10,d} | {gpu_time:12.2f} | {cpu_time:12.2f} | {speedup:7.2f}x")
        
        # Additional result information for largest iteration
        if iterations == max(iterations_list):
            print("\n===== Simulation Results =====\n")
            print(f"Expected Financial Impact: ${gpu_results['results']['expected_financial_impact']/1000000000:.2f}B")
            print(f"Worst Case Impact: ${gpu_results['results']['worst_case_impact']/1000000000:.2f}B")
            print(f"Best Case Impact: ${gpu_results['results']['best_case_impact']/1000000000:.2f}B")
            print("\n95% Confidence Interval:")
            ci = gpu_results['results']['confidence_interval_95']
            print(f"  Lower Bound: ${ci['lower']/1000000000:.2f}B")
            print(f"  Upper Bound: ${ci['upper']/1000000000:.2f}B")
            
            print("\nSensitivity Factors:")
            for factor in gpu_results['results']['sensitivity_factors']:
                print(f"  {factor['factor']}: {factor['sensitivity']:.2f}")
    
    print("\n===========================================\n")

def show_cuda_configuration():
    """Display CUDA configuration"""
    try:
        from analysis.cuda_config import get_gpu_config, get_cuda_info
        
        config = get_gpu_config()
        cuda_info = get_cuda_info()
        
        print("\n===== CUDA Configuration =====\n")
        print(f"CUDA Available: {cuda_info.get('available', False)}")
        if cuda_info.get('available', False):
            print(f"Device Name: {cuda_info.get('device_name', 'Unknown')}")
            print(f"CUDA Version: {cuda_info.get('cuda_version', 'Unknown')}")
            print(f"Has Tensor Cores: {cuda_info.get('has_tensor_cores', False)}")
            print(f"Device Count: {cuda_info.get('device_count', 0)}")
            
        print("\nConfiguration Settings:")
        print(f"Use GPU: {config.config.get('use_gpu', False)}")
        print(f"Precision: {config.config.get('precision', 'fp32')}")
        print(f"Monte Carlo Batch Size: {config.config.get('monte_carlo', {}).get('batch_size', 0)}")
        print(f"Use Tensor Cores: {config.config.get('monte_carlo', {}).get('use_tensor_cores', False)}")
        
    except ImportError as e:
        logger.error(f"Error importing CUDA configuration: {e}")
        print("\nCUDA configuration not available")

if __name__ == "__main__":
    # Show CUDA configuration
    show_cuda_configuration()
    
    # Run Monte Carlo benchmark
    if MONTE_CARLO_AVAILABLE:
        # Use smaller iteration counts for quick testing
        run_simulation_benchmark([1000, 10000, 50000])
    else:
        print("\nMonte Carlo simulation not available. Make sure PyTorch is installed and CUDA is configured.")
        print("Try running: pip install torch numpy")