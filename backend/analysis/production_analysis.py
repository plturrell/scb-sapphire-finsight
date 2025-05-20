#!/usr/bin/env python3
"""
Production Analysis Module for Tariff Impact Assessment
Integrates all advanced Monte Carlo capabilities for comprehensive financial analysis
"""

import os
import logging
import json
import time
import numpy as np
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Any, Optional, Union, Tuple

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("ProductionAnalysis")

# Import advanced models
try:
    from analysis.advanced_monte_carlo import (
        AdvancedMonteCarloEngine, 
        SamplingMethod, 
        DistributionType
    )
    from analysis.variance_reduction import (
        SobolSequenceGenerator,
        HaltonSequenceGenerator,
        LatinHypercubeSampler,
        StratifiedSampler
    )
    from analysis.financial_models import (
        TariffModel,
        BlackScholesModel,
        HestonModel,
        JumpDiffusionModel,
        MarketScenario
    )
    from analysis.cuda_config import (
        get_gpu_config,
        get_monte_carlo_config,
        is_cuda_available,
        is_multi_gpu_available,
        get_optimal_multi_gpu_config
    )
    ADVANCED_MODELS_AVAILABLE = True
except ImportError:
    logger.warning("Advanced Monte Carlo models not available. Using simplified analysis.")
    ADVANCED_MODELS_AVAILABLE = False

class TariffImpactAnalyzer:
    """
    Comprehensive tariff impact analysis using advanced Monte Carlo techniques
    """
    
    def __init__(self, company_profile: Dict[str, Any], use_gpu: bool = True, profile: str = "balanced"):
        """
        Initialize the tariff impact analyzer
        
        Args:
            company_profile: Company financial data
            use_gpu: Whether to use GPU acceleration
            profile: Performance profile to use ("balanced", "performance", or "accuracy")
        """
        self.company_profile = company_profile
        self.use_gpu = use_gpu and is_cuda_available()
        self.profile = profile
        self.mc_config = get_monte_carlo_config() if ADVANCED_MODELS_AVAILABLE else {}
        
        # Create output directory
        self.results_dir = Path(__file__).parent.parent / "results"
        os.makedirs(self.results_dir, exist_ok=True)
        
        # Initialize engine
        if ADVANCED_MODELS_AVAILABLE:
            logger.info(f"Initializing Tariff Impact Analyzer with profile: {profile}")
            
            # Set environment variables for performance profile
            os.environ["MONTE_CARLO_PROFILE"] = profile
            
            # Get multi-GPU configuration
            multi_gpu_config = get_optimal_multi_gpu_config()
            
            # Initialize Monte Carlo engine
            self.engine = AdvancedMonteCarloEngine(
                use_multi_gpu=multi_gpu_config["enabled"],
                sampling_method=SamplingMethod.LATIN_HYPERCUBE,
                use_domain_optimizations=True,
                precision="mixed" if profile != "accuracy" else "double"
            )
            
            # Initialize tariff model
            self.tariff_model = TariffModel(
                baseline_revenue=company_profile.get("annual_revenue", 60_000_000_000),
                baseline_costs=company_profile.get("annual_costs", 51_000_000_000),
                us_export_percentage=company_profile.get("us_export_percentage", 35.0),
                price_elasticity=company_profile.get("price_elasticity", -2.0)
            )
            
            # Log configuration
            logger.info(f"Using GPU acceleration: {self.use_gpu}")
            if self.use_gpu:
                logger.info(f"CUDA devices: {self.engine.devices}")
                logger.info(f"Multi-GPU enabled: {multi_gpu_config['enabled']}")
                if multi_gpu_config["enabled"]:
                    logger.info(f"GPU count: {multi_gpu_config['device_count']}")
        else:
            logger.warning("Advanced models not available, using simplified analysis")
            self.engine = None
            self.tariff_model = None
    
    def run_standard_impact_analysis(
        self, 
        tariff_rate: float, 
        iterations: int = 100000,
        sampling_method: str = "latin_hypercube"
    ) -> Dict[str, Any]:
        """
        Run standard tariff impact analysis
        
        Args:
            tariff_rate: Base tariff rate to analyze
            iterations: Number of Monte Carlo iterations
            sampling_method: Sampling method to use
            
        Returns:
            Analysis results
        """
        if not ADVANCED_MODELS_AVAILABLE:
            return self._run_simplified_analysis(tariff_rate)
        
        logger.info(f"Running tariff impact analysis with rate: {tariff_rate}, "
                   f"iterations: {iterations}, sampling: {sampling_method}")
        
        # Configure engine
        method_enum = getattr(SamplingMethod, sampling_method.upper())
        self.engine.sampling_method = method_enum
        
        # Register variables with distributions
        self.engine.register_variable(
            name="tariff_rate",
            distribution=DistributionType.NORMAL,
            params={"mean": tariff_rate, "std": 0.03},
            importance=1.0
        )
        
        self.engine.register_variable(
            name="price_elasticity",
            distribution=DistributionType.NORMAL,
            params={"mean": -1.8, "std": 0.4},
            importance=0.8
        )
        
        self.engine.register_variable(
            name="competitor_response",
            distribution=DistributionType.UNIFORM,
            params={"low": 0.1, "high": 0.6},
            importance=0.7
        )
        
        self.engine.register_variable(
            name="market_adaptability",
            distribution=DistributionType.UNIFORM,
            params={"low": 0.2, "high": 0.7},
            importance=0.6
        )
        
        # Define outputs to track
        outputs = [
            "direct_tariff_costs",
            "volume_impact",
            "market_share_loss",
            "competitor_impact",
            "alternative_market_offset",
            "direct_financial_impact",
            "indirect_impact",
            "total_financial_impact",
            "percentage_impact",
            "new_profit",
            "profit_impact_percentage"
        ]
        
        # Configure additional arguments
        additional_args = {
            "baseline_revenue": self.company_profile.get("annual_revenue", 60_000_000_000),
            "us_export_percentage": self.company_profile.get("us_export_percentage", 35.0),
            "baseline_costs": self.company_profile.get("annual_costs", 51_000_000_000),
            "market_scenario": MarketScenario.BASE
        }
        
        # Run simulation
        start_time = time.time()
        results = self.engine.run_simulation(
            simulation_function=self.engine.tariff_impact_simulation,
            iterations=iterations,
            outputs=outputs,
            additional_args=additional_args,
            batch_size=self.mc_config.get("batch_size", 10000),
            save_results=True,
            return_samples=False,
            show_progress=True
        )
        elapsed_time = time.time() - start_time
        
        # Add timing information
        results["timing"] = {
            "elapsed_time": elapsed_time,
            "iterations_per_second": iterations / elapsed_time,
            "timestamp": datetime.now().isoformat()
        }
        
        # Add environment information
        results["environment"] = {
            "use_gpu": self.use_gpu,
            "profile": self.profile,
            "multi_gpu": self.engine.use_multi_gpu,
            "sampling_method": sampling_method,
            "iterations": iterations
        }
        
        # Calculate risk metrics for key outputs
        if self.engine.use_domain_optimizations:
            risk_analyses = {}
            key_outputs = ["total_financial_impact", "percentage_impact", "profit_impact_percentage"]
            
            for output in key_outputs:
                if output in results["statistics"]:
                    samples = np.array(results["statistics"][output].get("samples", []))
                    if len(samples) > 0:
                        risk_metrics = self.tariff_model.calculate_risk_metrics(samples)
                        risk_analyses[output] = risk_metrics
            
            results["risk_analyses"] = risk_analyses
        
        # Save results to disk
        self._save_results(results, f"tariff_impact_{tariff_rate:.2f}")
        
        return results
    
    def run_multi_scenario_analysis(
        self, 
        tariff_rate: float, 
        iterations: int = 50000,
        scenarios: List[str] = ["base", "recession", "stagflation", "high_volatility", "trade_war"]
    ) -> Dict[str, Any]:
        """
        Run tariff impact analysis across multiple market scenarios
        
        Args:
            tariff_rate: Base tariff rate to analyze
            iterations: Number of Monte Carlo iterations
            scenarios: List of market scenarios to test
            
        Returns:
            Analysis results across scenarios
        """
        if not ADVANCED_MODELS_AVAILABLE:
            return self._run_simplified_analysis(tariff_rate)
        
        logger.info(f"Running multi-scenario analysis with rate: {tariff_rate}, "
                   f"iterations: {iterations}, scenarios: {scenarios}")
        
        # Configure engine
        self.engine.sampling_method = SamplingMethod.LATIN_HYPERCUBE
        
        # Register variables
        self.engine.register_variable(
            name="tariff_rate",
            distribution=DistributionType.NORMAL,
            params={"mean": tariff_rate, "std": 0.03},
            importance=1.0
        )
        
        self.engine.register_variable(
            name="price_elasticity",
            distribution=DistributionType.NORMAL,
            params={"mean": -1.8, "std": 0.4},
            importance=0.8
        )
        
        self.engine.register_variable(
            name="competitor_response",
            distribution=DistributionType.UNIFORM,
            params={"low": 0.1, "high": 0.6},
            importance=0.7
        )
        
        # Define outputs to track
        outputs = ["total_financial_impact", "percentage_impact", "profit_impact_percentage"]
        
        # Run simulations for each scenario
        scenario_results = {}
        start_time = time.time()
        
        for scenario_name in scenarios:
            # Get scenario enum
            scenario_enum = getattr(MarketScenario, scenario_name.upper())
            
            # Configure additional arguments
            additional_args = {
                "baseline_revenue": self.company_profile.get("annual_revenue", 60_000_000_000),
                "us_export_percentage": self.company_profile.get("us_export_percentage", 35.0),
                "baseline_costs": self.company_profile.get("annual_costs", 51_000_000_000),
                "market_scenario": scenario_enum
            }
            
            # Run simulation for this scenario
            logger.info(f"Running scenario: {scenario_name}")
            result = self.engine.run_simulation(
                simulation_function=self.engine.tariff_impact_simulation,
                iterations=iterations,
                outputs=outputs,
                additional_args=additional_args,
                batch_size=self.mc_config.get("batch_size", 10000),
                save_results=False,
                return_samples=False,
                show_progress=False
            )
            
            scenario_results[scenario_name] = result
        
        elapsed_time = time.time() - start_time
        
        # Create consolidated results
        results = {
            "tariff_rate": tariff_rate,
            "iterations": iterations,
            "scenarios": scenario_results,
            "timing": {
                "elapsed_time": elapsed_time,
                "iterations_per_second": (iterations * len(scenarios)) / elapsed_time,
                "timestamp": datetime.now().isoformat()
            },
            "environment": {
                "use_gpu": self.use_gpu,
                "profile": self.profile,
                "multi_gpu": self.engine.use_multi_gpu,
                "sampling_method": "latin_hypercube"
            }
        }
        
        # Save results to disk
        self._save_results(results, f"multi_scenario_{tariff_rate:.2f}")
        
        return results
    
    def run_flexibility_valuation(
        self,
        time_horizon: float = 3.0,
        volatility: float = 0.25,
        risk_free_rate: float = 0.03,
        tariff_probability: float = 0.5
    ) -> Dict[str, Any]:
        """
        Calculate the value of flexibility to adapt to tariff risks using Black-Scholes model
        
        Args:
            time_horizon: Time horizon in years
            volatility: Revenue volatility
            risk_free_rate: Risk-free interest rate
            tariff_probability: Probability of tariff implementation
            
        Returns:
            Flexibility valuation results
        """
        if not ADVANCED_MODELS_AVAILABLE:
            return {"error": "Advanced models not available"}
        
        logger.info(f"Running flexibility valuation analysis with horizon: {time_horizon}, "
                   f"volatility: {volatility}, tariff_probability: {tariff_probability}")
        
        # Get company profile values
        current_revenue = self.company_profile.get("annual_revenue", 60_000_000_000)
        us_export_percentage = self.company_profile.get("us_export_percentage", 35.0)
        revenue_at_risk = current_revenue * us_export_percentage / 100
        
        # Calculate flexibility value
        value = BlackScholesModel.value_of_flexibility(
            current_revenue=current_revenue,
            revenue_at_risk=revenue_at_risk,
            time_horizon=time_horizon,
            volatility=volatility,
            risk_free_rate=risk_free_rate,
            tariff_probability=tariff_probability
        )
        
        # Calculate flexibility value as percentage of revenue at risk
        value_percentage = 100 * value / revenue_at_risk if revenue_at_risk > 0 else 0
        
        # Create results
        results = {
            "flexibility_value": value,
            "flexibility_value_percentage": value_percentage,
            "inputs": {
                "current_revenue": current_revenue,
                "revenue_at_risk": revenue_at_risk,
                "time_horizon": time_horizon,
                "volatility": volatility,
                "risk_free_rate": risk_free_rate,
                "tariff_probability": tariff_probability
            },
            "timestamp": datetime.now().isoformat()
        }
        
        # Save results to disk
        self._save_results(results, "flexibility_valuation")
        
        return results
    
    def run_multi_period_analysis(
        self,
        periods: int = 5,
        tariff_rate_initial: float = 0.15,
        tariff_rate_growth: float = -0.1,  # Decreasing over time
        negotiation_probability_initial: float = 0.3,
        negotiation_probability_growth: float = 0.2,  # Increasing over time
        iterations: int = 50000
    ) -> Dict[str, Any]:
        """
        Run multi-period tariff impact analysis
        
        Args:
            periods: Number of periods to simulate
            tariff_rate_initial: Initial tariff rate
            tariff_rate_growth: Growth rate of tariff rate (per period)
            negotiation_probability_initial: Initial probability of successful negotiation
            negotiation_probability_growth: Growth rate of negotiation probability (per period)
            iterations: Number of Monte Carlo iterations
            
        Returns:
            Multi-period analysis results
        """
        if not ADVANCED_MODELS_AVAILABLE:
            return {"error": "Advanced models not available"}
        
        logger.info(f"Running multi-period analysis with periods: {periods}, "
                   f"initial tariff: {tariff_rate_initial}, growth: {tariff_rate_growth}")
        
        # Generate time series for tariff rate and negotiation probability
        tariff_rates = [
            tariff_rate_initial * (1 + tariff_rate_growth) ** period
            for period in range(periods)
        ]
        
        negotiation_probs = [
            min(0.95, negotiation_probability_initial * (1 + negotiation_probability_growth) ** period)
            for period in range(periods)
        ]
        
        # Get company profile values
        baseline_revenue = self.company_profile.get("annual_revenue", 60_000_000_000)
        baseline_costs = self.company_profile.get("annual_costs", 51_000_000_000)
        us_export_percentage = self.company_profile.get("us_export_percentage", 35.0)
        
        # Run multi-period simulation
        start_time = time.time()
        
        # Run simulation using the TariffModel
        multi_period_results = self.tariff_model.run_multi_period_simulation(
            tariff_rates=np.array(tariff_rates),
            market_adaptability_growth=0.1,
            base_market_adaptability=0.3,
            negotiation_probs=np.array(negotiation_probs),
            initial_competitor_response=0.5,
            competitor_learning_rate=0.1,
            alternative_market_growth_rate=0.05,
            periods=periods,
            num_simulations=iterations,
            scenario=MarketScenario.BASE
        )
        
        elapsed_time = time.time() - start_time
        
        # Process results for JSON serialization
        processed_results = {}
        for key, value in multi_period_results.items():
            if isinstance(value, np.ndarray):
                processed_results[key] = value.tolist()
            else:
                processed_results[key] = value
        
        # Create final results
        results = {
            "periods": periods,
            "inputs": {
                "tariff_rates": tariff_rates,
                "negotiation_probabilities": negotiation_probs,
                "baseline_revenue": baseline_revenue,
                "baseline_costs": baseline_costs,
                "us_export_percentage": us_export_percentage
            },
            "results": processed_results,
            "timing": {
                "elapsed_time": elapsed_time,
                "iterations_per_second": iterations / elapsed_time,
                "timestamp": datetime.now().isoformat()
            },
            "environment": {
                "use_gpu": self.use_gpu,
                "profile": self.profile,
                "multi_gpu": self.engine.use_multi_gpu
            }
        }
        
        # Save results to disk
        self._save_results(results, "multi_period_analysis")
        
        return results
    
    def _run_simplified_analysis(self, tariff_rate: float) -> Dict[str, Any]:
        """
        Run simplified analysis when advanced models are not available
        
        Args:
            tariff_rate: Base tariff rate to analyze
            
        Returns:
            Simplified analysis results
        """
        logger.info(f"Running simplified analysis with tariff rate: {tariff_rate}")
        
        # Get company profile values
        baseline_revenue = self.company_profile.get("annual_revenue", 60_000_000_000)
        baseline_costs = self.company_profile.get("annual_costs", 51_000_000_000)
        us_export_percentage = self.company_profile.get("us_export_percentage", 35.0)
        price_elasticity = self.company_profile.get("price_elasticity", -2.0)
        
        # Calculate simple impacts
        revenue_at_risk = baseline_revenue * us_export_percentage / 100
        direct_tariff_costs = revenue_at_risk * tariff_rate
        volume_impact = price_elasticity * tariff_rate
        market_share_loss = revenue_at_risk * volume_impact * 0.7
        competitor_impact = revenue_at_risk * volume_impact * 0.3 * 1.1
        
        # Calculate total impact
        total_financial_impact = direct_tariff_costs + market_share_loss + competitor_impact
        percentage_impact = 100 * total_financial_impact / baseline_revenue
        
        # Calculate profit impact
        baseline_profit = baseline_revenue - baseline_costs
        new_profit = baseline_profit - total_financial_impact
        profit_impact_percentage = 100 * total_financial_impact / baseline_profit
        
        # Create results
        results = {
            "tariff_rate": tariff_rate,
            "baseline_revenue": baseline_revenue,
            "baseline_costs": baseline_costs,
            "baseline_profit": baseline_profit,
            "us_export_percentage": us_export_percentage,
            "price_elasticity": price_elasticity,
            "revenue_at_risk": revenue_at_risk,
            "impacts": {
                "direct_tariff_costs": direct_tariff_costs,
                "market_share_loss": market_share_loss,
                "competitor_impact": competitor_impact,
                "total_financial_impact": total_financial_impact,
                "percentage_impact": percentage_impact,
                "new_profit": new_profit,
                "profit_impact_percentage": profit_impact_percentage
            },
            "timestamp": datetime.now().isoformat()
        }
        
        # Save results to disk
        self._save_results(results, f"simplified_analysis_{tariff_rate:.2f}")
        
        return results
    
    def _save_results(self, results: Dict[str, Any], prefix: str) -> None:
        """
        Save results to disk
        
        Args:
            results: Results to save
            prefix: Filename prefix
        """
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{prefix}_{timestamp}.json"
        filepath = self.results_dir / filename
        
        with open(filepath, 'w') as f:
            json.dump(results, f, indent=2)
        
        logger.info(f"Results saved to {filepath}")

def test_analyzer():
    """Test the TariffImpactAnalyzer with a sample company profile"""
    # Sample company profile
    company_profile = {
        "company": "Global TechCorp",
        "annual_revenue": 60_000_000_000,  # $60 billion
        "annual_costs": 51_000_000_000,    # $51 billion
        "us_export_percentage": 35.0,      # 35% of revenue from US exports
        "price_elasticity": -2.0           # Price elasticity of demand
    }
    
    # Create analyzer
    analyzer = TariffImpactAnalyzer(company_profile, use_gpu=True, profile="balanced")
    
    # Run standard impact analysis
    logger.info("Running standard impact analysis...")
    standard_results = analyzer.run_standard_impact_analysis(
        tariff_rate=0.15,
        iterations=50000,
        sampling_method="latin_hypercube"
    )
    
    # Print key results
    total_impact = standard_results["statistics"]["total_financial_impact"]["mean"]
    percentage_impact = standard_results["statistics"]["percentage_impact"]["mean"]
    logger.info(f"Total financial impact: ${total_impact:,.2f}")
    logger.info(f"Percentage impact: {percentage_impact:.2f}%")
    
    # Run multi-scenario analysis
    logger.info("\nRunning multi-scenario analysis...")
    multi_scenario_results = analyzer.run_multi_scenario_analysis(
        tariff_rate=0.15,
        iterations=20000,
        scenarios=["base", "recession", "high_volatility"]
    )
    
    # Print key results for each scenario
    for scenario, results in multi_scenario_results["scenarios"].items():
        total_impact = results["statistics"]["total_financial_impact"]["mean"]
        logger.info(f"{scenario.capitalize()} scenario impact: ${total_impact:,.2f}")
    
    # Run flexibility valuation
    logger.info("\nRunning flexibility valuation...")
    flexibility_results = analyzer.run_flexibility_valuation()
    
    # Print key results
    flexibility_value = flexibility_results["flexibility_value"]
    flexibility_percentage = flexibility_results["flexibility_value_percentage"]
    logger.info(f"Flexibility value: ${flexibility_value:,.2f}")
    logger.info(f"As percentage of revenue at risk: {flexibility_percentage:.2f}%")
    
    # Run multi-period analysis
    logger.info("\nRunning multi-period analysis...")
    multi_period_results = analyzer.run_multi_period_analysis()
    
    # Print key results for each period
    total_impact = multi_period_results["results"]["total_impact"]
    for i, impact in enumerate(total_impact):
        logger.info(f"Period {i+1} impact: ${impact:,.2f}")
    
    logger.info("\nAll tests completed successfully!")

if __name__ == "__main__":
    test_analyzer()