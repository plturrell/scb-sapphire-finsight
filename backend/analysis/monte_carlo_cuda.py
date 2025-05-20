#!/usr/bin/env python3
"""
CUDA-accelerated Monte Carlo simulation for tariff impact analysis
Provides high-performance financial simulations using GPU acceleration
"""

import os
import time
import json
import numpy as np
import logging
from pathlib import Path

# Conditionally import CUDA libraries
try:
    import torch
    import torch.nn as nn
    import torch.cuda as cuda
    CUDA_AVAILABLE = torch.cuda.is_available()
except ImportError:
    CUDA_AVAILABLE = False

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("CUDA-MonteCarlo")

class CudaMonteCarloSimulator:
    """Monte Carlo simulator with CUDA acceleration for financial modeling"""
    
    def __init__(self, use_gpu=True):
        """
        Initialize the simulator
        
        Args:
            use_gpu: Whether to use GPU acceleration if available
        """
        self.use_gpu = use_gpu and CUDA_AVAILABLE
        
        if self.use_gpu:
            logger.info(f"CUDA is available. Using GPU acceleration.")
            logger.info(f"GPU Device: {torch.cuda.get_device_name(0)}")
            logger.info(f"CUDA Version: {torch.version.cuda}")
            self.device = torch.device("cuda:0")
        else:
            if use_gpu and not CUDA_AVAILABLE:
                logger.warning("GPU acceleration requested but CUDA is not available. Using CPU.")
            else:
                logger.info("Using CPU for computations.")
            self.device = torch.device("cpu")
    
    def run_simulation(self, parameters, iterations=10000, use_tensor_cores=True):
        """
        Run a Monte Carlo simulation for tariff impact analysis
        
        Args:
            parameters: Simulation parameters dict (tariff_rate, negotiation_chance, etc.)
            iterations: Number of iterations to run
            use_tensor_cores: Whether to use tensor cores for mixed-precision acceleration
                             (only applies to Turing/Ampere GPUs)
                             
        Returns:
            Dictionary with simulation results
        """
        start_time = time.time()
        
        # Extract parameters
        tariff_rate = float(parameters.get("tariff_rate", 25.0))
        negotiation_chance = float(parameters.get("negotiation_chance", 0.3))
        market_adaptability = float(parameters.get("market_adaptability", 0.5))
        company_baseline_revenue = float(parameters.get("baseline_revenue", 60000000000))
        us_export_percentage = float(parameters.get("us_export_percentage", 35.0))
        
        # Calculate baseline metrics
        revenue_at_risk = company_baseline_revenue * (us_export_percentage / 100.0)
        
        # Configure precision based on hardware
        dtype = torch.float16 if use_tensor_cores and self.use_gpu else torch.float32
        
        if self.use_gpu:
            # CUDA implementation
            return self._run_cuda_simulation(
                tariff_rate=tariff_rate,
                negotiation_chance=negotiation_chance,
                market_adaptability=market_adaptability,
                revenue_at_risk=revenue_at_risk,
                company_baseline_revenue=company_baseline_revenue,
                iterations=iterations,
                dtype=dtype,
                start_time=start_time
            )
        else:
            # CPU fallback implementation
            return self._run_cpu_simulation(
                tariff_rate=tariff_rate,
                negotiation_chance=negotiation_chance,
                market_adaptability=market_adaptability,
                revenue_at_risk=revenue_at_risk,
                company_baseline_revenue=company_baseline_revenue,
                iterations=iterations,
                start_time=start_time
            )
    
    def _run_cuda_simulation(self, tariff_rate, negotiation_chance, market_adaptability, 
                           revenue_at_risk, company_baseline_revenue, iterations, 
                           dtype, start_time):
        """Run Monte Carlo simulation using CUDA acceleration"""
        logger.info(f"Running CUDA-accelerated Monte Carlo with {iterations} iterations")
        
        # Create random number generators with different seeds for each parameter
        seed = int(time.time())
        torch.manual_seed(seed)
        
        # Move to GPU
        batch_size = min(iterations, 1000000)  # Process in batches for memory efficiency
        
        # Track results across batches
        all_financial_impacts = []
        
        # Process in batches
        for i in range(0, iterations, batch_size):
            current_batch_size = min(batch_size, iterations - i)
            logger.debug(f"Processing batch {i//batch_size + 1}, size {current_batch_size}")
            
            # Generate random inputs for this batch
            with torch.cuda.amp.autocast(enabled=dtype==torch.float16):
                # Market conditions (random variables)
                market_resilience = torch.rand(current_batch_size, device=self.device)
                negotiation_success = torch.rand(current_batch_size, device=self.device) < negotiation_chance
                competitor_response = torch.rand(current_batch_size, device=self.device)
                alternative_market_growth = torch.rand(current_batch_size, device=self.device)
                
                # Economic variables
                tariff_variance = torch.normal(mean=0.0, std=0.1, size=(current_batch_size,), device=self.device)
                effective_tariff_rates = torch.clamp(
                    tariff_rate/100.0 * (1.0 + tariff_variance), min=0.0, max=1.0
                )
                
                # Apply negotiation success to reduce tariff rates
                effective_tariff_rates = torch.where(
                    negotiation_success, 
                    effective_tariff_rates * 0.3,  # Reduced tariff if negotiations succeed
                    effective_tariff_rates
                )
                
                # Calculate direct tariff costs
                direct_tariff_costs = revenue_at_risk * effective_tariff_rates
                
                # Factor in market adaptability
                market_adaptation_factor = market_adaptability * market_resilience
                
                # Calculate market share loss
                market_share_loss = revenue_at_risk * (
                    0.4 * effective_tariff_rates * (1.0 - market_adaptation_factor)
                )
                
                # Alternative market offset (recovery through other markets)
                alternative_market_offset = market_share_loss * alternative_market_growth * 0.6
                
                # Competitor pressure impact
                competitor_impact = revenue_at_risk * 0.15 * competitor_response * effective_tariff_rates
                
                # Calculate total financial impact
                financial_impact = -(direct_tariff_costs + market_share_loss + competitor_impact - alternative_market_offset)
                
                # Move to CPU and convert to numpy
                batch_financial_impacts = financial_impact.cpu().numpy()
                all_financial_impacts.append(batch_financial_impacts)
        
        # Combine results from all batches
        all_financial_impacts = np.concatenate(all_financial_impacts)
        
        # Calculate statistics
        expected_impact = float(np.mean(all_financial_impacts))
        worst_case_impact = float(np.percentile(all_financial_impacts, 1))  # 1st percentile
        best_case_impact = float(np.percentile(all_financial_impacts, 99))  # 99th percentile
        lower_ci = float(np.percentile(all_financial_impacts, 2.5))  # 2.5th percentile
        upper_ci = float(np.percentile(all_financial_impacts, 97.5))  # 97.5th percentile
        
        # Calculate sensitivity factors using additional simulations
        sensitivity_factors = self._calculate_sensitivity_factors(
            tariff_rate=tariff_rate,
            negotiation_chance=negotiation_chance,
            market_adaptability=market_adaptability,
            revenue_at_risk=revenue_at_risk,
            baseline_impact=expected_impact
        )
        
        # Prepare risk distribution
        high_risk = len(all_financial_impacts[all_financial_impacts < expected_impact * 1.5]) / iterations
        medium_risk = len(all_financial_impacts[(all_financial_impacts >= expected_impact * 1.5) & 
                                        (all_financial_impacts < expected_impact * 0.5)]) / iterations
        low_risk = len(all_financial_impacts[all_financial_impacts >= expected_impact * 0.5]) / iterations
        
        # Calculate computation time
        computation_time_ms = (time.time() - start_time) * 1000
        
        # Format results
        result = {
            "simulation_id": f"sim_{int(time.time())}",
            "iterations_completed": iterations,
            "results": {
                "expected_financial_impact": expected_impact,
                "worst_case_impact": worst_case_impact,
                "best_case_impact": best_case_impact,
                "confidence_interval_95": {
                    "lower": lower_ci,
                    "upper": upper_ci
                },
                "risk_distribution": {
                    "high_risk": float(high_risk),
                    "medium_risk": float(medium_risk),
                    "low_risk": float(low_risk)
                },
                "sensitivity_factors": sensitivity_factors
            },
            "computation_time_ms": computation_time_ms,
            "gpu_utilized": torch.cuda.get_device_name(0) if self.use_gpu else "CPU"
        }
        
        logger.info(f"Simulation completed in {computation_time_ms:.2f} ms")
        return result
    
    def _run_cpu_simulation(self, tariff_rate, negotiation_chance, market_adaptability, 
                          revenue_at_risk, company_baseline_revenue, iterations, start_time):
        """Run Monte Carlo simulation on CPU (fallback)"""
        logger.info(f"Running CPU-based Monte Carlo with {iterations} iterations")
        
        # Set random seed for reproducibility
        np.random.seed(int(time.time()))
        
        # Initialize arrays to store results
        financial_impacts = np.zeros(iterations)
        
        # Market conditions (random variables)
        market_resilience = np.random.random(iterations)
        negotiation_success = np.random.random(iterations) < negotiation_chance
        competitor_response = np.random.random(iterations)
        alternative_market_growth = np.random.random(iterations)
        
        # Economic variables
        tariff_variance = np.random.normal(0, 0.1, iterations)
        effective_tariff_rates = np.clip(tariff_rate/100.0 * (1.0 + tariff_variance), 0, 1)
        
        # Apply negotiation success
        effective_tariff_rates[negotiation_success] *= 0.3
        
        # Calculate direct tariff costs
        direct_tariff_costs = revenue_at_risk * effective_tariff_rates
        
        # Factor in market adaptability
        market_adaptation_factor = market_adaptability * market_resilience
        
        # Calculate market share loss
        market_share_loss = revenue_at_risk * (
            0.4 * effective_tariff_rates * (1.0 - market_adaptation_factor)
        )
        
        # Alternative market offset (recovery through other markets)
        alternative_market_offset = market_share_loss * alternative_market_growth * 0.6
        
        # Competitor pressure impact
        competitor_impact = revenue_at_risk * 0.15 * competitor_response * effective_tariff_rates
        
        # Calculate total financial impact
        financial_impacts = -(direct_tariff_costs + market_share_loss + competitor_impact - alternative_market_offset)
        
        # Calculate statistics
        expected_impact = float(np.mean(financial_impacts))
        worst_case_impact = float(np.percentile(financial_impacts, 1))  # 1st percentile
        best_case_impact = float(np.percentile(financial_impacts, 99))  # 99th percentile
        lower_ci = float(np.percentile(financial_impacts, 2.5))  # 2.5th percentile
        upper_ci = float(np.percentile(financial_impacts, 97.5))  # 97.5th percentile
        
        # Calculate sensitivity factors
        sensitivity_factors = self._calculate_sensitivity_factors(
            tariff_rate=tariff_rate,
            negotiation_chance=negotiation_chance,
            market_adaptability=market_adaptability,
            revenue_at_risk=revenue_at_risk,
            baseline_impact=expected_impact
        )
        
        # Prepare risk distribution
        high_risk = len(financial_impacts[financial_impacts < expected_impact * 1.5]) / iterations
        medium_risk = len(financial_impacts[(financial_impacts >= expected_impact * 1.5) & 
                                     (financial_impacts < expected_impact * 0.5)]) / iterations
        low_risk = len(financial_impacts[financial_impacts >= expected_impact * 0.5]) / iterations
        
        # Calculate computation time
        computation_time_ms = (time.time() - start_time) * 1000
        
        # Format results
        result = {
            "simulation_id": f"sim_{int(time.time())}",
            "iterations_completed": iterations,
            "results": {
                "expected_financial_impact": expected_impact,
                "worst_case_impact": worst_case_impact,
                "best_case_impact": best_case_impact,
                "confidence_interval_95": {
                    "lower": lower_ci,
                    "upper": upper_ci
                },
                "risk_distribution": {
                    "high_risk": float(high_risk),
                    "medium_risk": float(medium_risk),
                    "low_risk": float(low_risk)
                },
                "sensitivity_factors": sensitivity_factors
            },
            "computation_time_ms": computation_time_ms,
            "gpu_utilized": "CPU"
        }
        
        logger.info(f"Simulation completed in {computation_time_ms:.2f} ms")
        return result
    
    def _calculate_sensitivity_factors(self, tariff_rate, negotiation_chance, 
                                    market_adaptability, revenue_at_risk, baseline_impact):
        """Calculate sensitivity factors by varying each parameter"""
        sensitivity_factors = []
        
        # We'll use either numpy or torch depending on GPU availability
        if self.use_gpu:
            # Use a smaller batch for sensitivity analysis
            num_samples = 1000
            
            # Tariff rate sensitivity (+10%)
            tariff_delta = tariff_rate * 0.1
            high_tariff_impacts = self._quick_gpu_sensitivity_run(
                tariff_rate=tariff_rate + tariff_delta,
                negotiation_chance=negotiation_chance,
                market_adaptability=market_adaptability,
                revenue_at_risk=revenue_at_risk,
                num_samples=num_samples
            )
            tariff_sensitivity = abs((high_tariff_impacts - baseline_impact) / baseline_impact)
            
            # Market adaptation sensitivity (+10%)
            adaptation_delta = min(market_adaptability + 0.1, 1.0)
            market_impacts = self._quick_gpu_sensitivity_run(
                tariff_rate=tariff_rate,
                negotiation_chance=negotiation_chance,
                market_adaptability=adaptation_delta,
                revenue_at_risk=revenue_at_risk,
                num_samples=num_samples
            )
            market_sensitivity = abs((market_impacts - baseline_impact) / baseline_impact)
            
            # Negotiation sensitivity (+10%)
            negotiation_delta = min(negotiation_chance + 0.1, 1.0)
            negotiation_impacts = self._quick_gpu_sensitivity_run(
                tariff_rate=tariff_rate,
                negotiation_chance=negotiation_delta,
                market_adaptability=market_adaptability,
                revenue_at_risk=revenue_at_risk,
                num_samples=num_samples
            )
            negotiation_sensitivity = abs((negotiation_impacts - baseline_impact) / baseline_impact)
        else:
            # Use CPU numpy implementation
            num_samples = 1000
            
            # Tariff rate sensitivity (+10%)
            tariff_delta = tariff_rate * 0.1
            high_tariff_impacts = self._quick_cpu_sensitivity_run(
                tariff_rate=tariff_rate + tariff_delta,
                negotiation_chance=negotiation_chance,
                market_adaptability=market_adaptability,
                revenue_at_risk=revenue_at_risk,
                num_samples=num_samples
            )
            tariff_sensitivity = abs((high_tariff_impacts - baseline_impact) / baseline_impact)
            
            # Market adaptation sensitivity (+10%)
            adaptation_delta = min(market_adaptability + 0.1, 1.0)
            market_impacts = self._quick_cpu_sensitivity_run(
                tariff_rate=tariff_rate,
                negotiation_chance=negotiation_chance,
                market_adaptability=adaptation_delta,
                revenue_at_risk=revenue_at_risk,
                num_samples=num_samples
            )
            market_sensitivity = abs((market_impacts - baseline_impact) / baseline_impact)
            
            # Negotiation sensitivity (+10%)
            negotiation_delta = min(negotiation_chance + 0.1, 1.0)
            negotiation_impacts = self._quick_cpu_sensitivity_run(
                tariff_rate=tariff_rate,
                negotiation_chance=negotiation_delta,
                market_adaptability=market_adaptability,
                revenue_at_risk=revenue_at_risk,
                num_samples=num_samples
            )
            negotiation_sensitivity = abs((negotiation_impacts - baseline_impact) / baseline_impact)
        
        # Create sensitivity factors list
        sensitivity_factors = [
            {"factor": "tariff_rate", "sensitivity": float(tariff_sensitivity)},
            {"factor": "market_adaptation", "sensitivity": float(market_sensitivity)},
            {"factor": "negotiation_success", "sensitivity": float(negotiation_sensitivity)}
        ]
        
        return sensitivity_factors
    
    def _quick_gpu_sensitivity_run(self, tariff_rate, negotiation_chance, 
                                market_adaptability, revenue_at_risk, num_samples):
        """Run a quick sensitivity analysis on GPU"""
        with torch.cuda.amp.autocast(enabled=True):
            # Market conditions (random variables)
            market_resilience = torch.rand(num_samples, device=self.device)
            negotiation_success = torch.rand(num_samples, device=self.device) < negotiation_chance
            competitor_response = torch.rand(num_samples, device=self.device)
            alternative_market_growth = torch.rand(num_samples, device=self.device)
            
            # Economic variables
            tariff_variance = torch.normal(mean=0.0, std=0.1, size=(num_samples,), device=self.device)
            effective_tariff_rates = torch.clamp(
                tariff_rate/100.0 * (1.0 + tariff_variance), min=0.0, max=1.0
            )
            
            # Apply negotiation success
            effective_tariff_rates = torch.where(
                negotiation_success, 
                effective_tariff_rates * 0.3,
                effective_tariff_rates
            )
            
            # Calculate direct tariff costs
            direct_tariff_costs = revenue_at_risk * effective_tariff_rates
            
            # Factor in market adaptability
            market_adaptation_factor = market_adaptability * market_resilience
            
            # Calculate market share loss
            market_share_loss = revenue_at_risk * (
                0.4 * effective_tariff_rates * (1.0 - market_adaptation_factor)
            )
            
            # Alternative market offset (recovery through other markets)
            alternative_market_offset = market_share_loss * alternative_market_growth * 0.6
            
            # Competitor pressure impact
            competitor_impact = revenue_at_risk * 0.15 * competitor_response * effective_tariff_rates
            
            # Calculate total financial impact
            financial_impact = -(direct_tariff_costs + market_share_loss + competitor_impact - alternative_market_offset)
            
            # Return mean impact
            return float(torch.mean(financial_impact).cpu().item())
    
    def _quick_cpu_sensitivity_run(self, tariff_rate, negotiation_chance, 
                               market_adaptability, revenue_at_risk, num_samples):
        """Run a quick sensitivity analysis on CPU"""
        # Market conditions (random variables)
        market_resilience = np.random.random(num_samples)
        negotiation_success = np.random.random(num_samples) < negotiation_chance
        competitor_response = np.random.random(num_samples)
        alternative_market_growth = np.random.random(num_samples)
        
        # Economic variables
        tariff_variance = np.random.normal(0, 0.1, num_samples)
        effective_tariff_rates = np.clip(tariff_rate/100.0 * (1.0 + tariff_variance), 0, 1)
        
        # Apply negotiation success
        effective_tariff_rates[negotiation_success] *= 0.3
        
        # Calculate direct tariff costs
        direct_tariff_costs = revenue_at_risk * effective_tariff_rates
        
        # Factor in market adaptability
        market_adaptation_factor = market_adaptability * market_resilience
        
        # Calculate market share loss
        market_share_loss = revenue_at_risk * (
            0.4 * effective_tariff_rates * (1.0 - market_adaptation_factor)
        )
        
        # Alternative market offset (recovery through other markets)
        alternative_market_offset = market_share_loss * alternative_market_growth * 0.6
        
        # Competitor pressure impact
        competitor_impact = revenue_at_risk * 0.15 * competitor_response * effective_tariff_rates
        
        # Calculate total financial impact
        financial_impacts = -(direct_tariff_costs + market_share_loss + competitor_impact - alternative_market_offset)
        
        # Return mean impact
        return float(np.mean(financial_impacts))
    
    def save_results(self, results, output_dir=None):
        """
        Save simulation results to a JSON file
        
        Args:
            results: Simulation results dictionary
            output_dir: Output directory (defaults to backend/results/)
        """
        if output_dir is None:
            # Default to backend/results/ directory
            output_dir = Path(__file__).parent.parent / "results"
        
        # Ensure directory exists
        os.makedirs(output_dir, exist_ok=True)
        
        # Generate filename with timestamp
        timestamp = time.strftime("%Y%m%d_%H%M%S")
        filename = f"monte_carlo_simulation_{timestamp}.json"
        filepath = output_dir / filename
        
        # Save results
        with open(filepath, "w") as f:
            json.dump(results, f, indent=2)
        
        logger.info(f"Saved simulation results to {filepath}")
        return filepath


# Module example usage
if __name__ == "__main__":
    # Example parameters
    parameters = {
        "tariff_rate": 46.0,  # Vietnamese electronics tariff rate (%)
        "negotiation_chance": 0.3,  # Probability of successful negotiations
        "market_adaptability": 0.5,  # Market's ability to adapt (0-1)
        "baseline_revenue": 60000000000,  # Company revenue
        "us_export_percentage": 35.0  # Percentage of exports to US
    }
    
    # Create simulator
    simulator = CudaMonteCarloSimulator(use_gpu=True)
    
    # Run simulation with different iteration counts
    for iterations in [1000, 10000, 100000, 1000000]:
        print(f"\nRunning simulation with {iterations} iterations...")
        results = simulator.run_simulation(
            parameters=parameters,
            iterations=iterations,
            use_tensor_cores=True
        )
        
        # Print key results
        print(f"Expected impact: ${results['results']['expected_financial_impact']/1000000000:.2f}B")
        print(f"Computation time: {results['computation_time_ms']:.2f} ms")
        print(f"Accelerator: {results['gpu_utilized']}")
    
    # Save final results
    simulator.save_results(results)