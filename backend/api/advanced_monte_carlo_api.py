#!/usr/bin/env python3
"""
Advanced Monte Carlo API for Financial Simulations
Provides endpoints for GPU-accelerated Monte Carlo simulations
with advanced variance reduction techniques, multi-GPU support,
and specialized financial models.
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends, Query, Path
from fastapi.responses import JSONResponse, FileResponse
from pydantic import BaseModel, Field, conint, confloat, validator
from typing import Dict, List, Any, Optional, Union, Literal
import json
import time
import logging
import os
import uuid
import numpy as np
from pathlib import Path
from enum import Enum

# Import financial models
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
    ADVANCED_MODELS_AVAILABLE = True
except ImportError:
    ADVANCED_MODELS_AVAILABLE = False

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("AdvancedMonteCarloAPI")

# Create API router
router = APIRouter(
    prefix="/api/advanced-monte-carlo",
    tags=["advanced-monte-carlo"],
    responses={404: {"description": "Not found"}}
)

# Cache for recent simulations
simulation_cache = {}

# Models for API
class DistributionParams(BaseModel):
    """Parameters for probability distributions"""
    distribution: str = Field("normal", description="Distribution type")
    params: Dict[str, Any] = Field(default_factory=dict, description="Distribution parameters")
    importance: Optional[float] = Field(None, description="Importance for stratification")

class SimulationVariable(BaseModel):
    """Variable definition for simulation"""
    name: str = Field(..., description="Variable name")
    distribution: str = Field("normal", description="Distribution type")
    params: Dict[str, Any] = Field(default_factory=dict, description="Distribution parameters")
    importance: float = Field(1.0, description="Importance factor for sampling (0-1)")

class MarketScenarioType(str, Enum):
    BASE = "base"
    RECESSION = "recession"
    STAGFLATION = "stagflation"
    GROWTH = "growth"
    VOLATILITY = "high_volatility"
    TECH_BOOM = "tech_boom"
    TRADE_WAR = "trade_war"
    SUPPLY_CHAIN_DISRUPTION = "supply_chain_disruption"

class SamplingMethodType(str, Enum):
    STANDARD = "standard"
    STRATIFIED = "stratified"
    LATIN_HYPERCUBE = "latin_hypercube"
    SOBOL = "sobol"
    HALTON = "halton"
    IMPORTANCE = "importance"
    CONTROL_VARIATE = "control_variate"

class SimulationConfig(BaseModel):
    """Configuration for advanced Monte Carlo simulation"""
    # Basic simulation parameters
    iterations: int = Field(100000, description="Number of iterations")
    sampling_method: SamplingMethodType = Field(
        SamplingMethodType.LATIN_HYPERCUBE,
        description="Sampling method for variance reduction"
    )
    use_multi_gpu: bool = Field(
        True, 
        description="Whether to use multiple GPUs if available"
    )
    use_domain_optimizations: bool = Field(
        True,
        description="Whether to use financial domain-specific optimizations"
    )
    
    # Correlation matrix (optional)
    correlation_matrix: Optional[List[List[float]]] = Field(
        None,
        description="Correlation matrix between variables"
    )
    
    # Advanced options
    precision: str = Field(
        "mixed",
        description="Computation precision (mixed, single, double)"
    )
    checkpoint_interval: Optional[int] = Field(
        None,
        description="Checkpoint interval (iterations)"
    )
    return_samples: bool = Field(
        False,
        description="Whether to return all samples (warning: large memory usage)"
    )
    batch_size: Optional[int] = Field(
        None,
        description="Batch size for processing"
    )
    random_seed: Optional[int] = Field(
        None,
        description="Random seed for reproducibility"
    )
    
    # Financial model parameters
    market_scenario: MarketScenarioType = Field(
        MarketScenarioType.BASE,
        description="Market scenario for simulation"
    )
    baseline_revenue: float = Field(
        60000000000.0,
        description="Company's baseline annual revenue"
    )
    baseline_costs: float = Field(
        51000000000.0,
        description="Company's baseline annual costs" 
    )
    us_export_percentage: float = Field(
        35.0,
        description="Percentage of revenue from US exports"
    )
    price_elasticity: float = Field(
        -2.0,
        description="Price elasticity of demand (typically negative)"
    )
    
    # Validations
    @validator('iterations')
    def validate_iterations(cls, v):
        if v < 1000:
            raise ValueError("Iterations must be at least 1000")
        if v > 10000000:
            raise ValueError("Iterations must be at most 10,000,000")
        return v

class TariffImpactRequest(BaseModel):
    """Request for tariff impact simulation"""
    variables: List[SimulationVariable] = Field(..., description="Variables for simulation")
    config: SimulationConfig = Field(..., description="Simulation configuration")

class VariableDefinition(BaseModel):
    """Variable definition for multi-period simulation"""
    name: str
    initial_value: float
    growth_rate: Optional[float] = None
    time_series: Optional[List[float]] = None

class MultiPeriodRequest(BaseModel):
    """Request for multi-period tariff impact simulation"""
    periods: int = Field(..., description="Number of periods to simulate")
    variables: Dict[str, VariableDefinition] = Field(..., description="Variable definitions")
    config: SimulationConfig = Field(..., description="Simulation configuration")

class StressTestRequest(BaseModel):
    """Request for market stress testing"""
    baseline_config: SimulationConfig = Field(..., description="Baseline configuration")
    stress_scenarios: List[MarketScenarioType] = Field(..., description="Stress scenarios to test")
    variables: List[SimulationVariable] = Field(..., description="Variables for simulation")

class OptimizationRequest(BaseModel):
    """Request for mitigation strategy optimization"""
    tariff_rate: float = Field(..., description="Expected tariff rate")
    strategy_costs: Dict[str, float] = Field(..., description="Strategy costs")
    strategy_benefits: Dict[str, float] = Field(..., description="Strategy benefits")
    budget_constraint: float = Field(..., description="Budget constraint")
    min_improvement: float = Field(0.0, description="Minimum required improvement")
    company_profile: Dict[str, Any] = Field(..., description="Company profile")

def get_mc_engine() -> Optional[AdvancedMonteCarloEngine]:
    """Get Monte Carlo engine (dependency injection)"""
    if not ADVANCED_MODELS_AVAILABLE:
        return None
    
    # Create engine with default settings
    engine = AdvancedMonteCarloEngine(
        use_multi_gpu=True,
        sampling_method=SamplingMethod.LATIN_HYPERCUBE,
        use_domain_optimizations=True,
        precision="mixed"
    )
    
    return engine

@router.get("/status")
async def get_monte_carlo_status(engine: Optional[AdvancedMonteCarloEngine] = Depends(get_mc_engine)):
    """
    Get status of advanced Monte Carlo simulation capabilities
    """
    if not ADVANCED_MODELS_AVAILABLE:
        return {
            "status": "not_available",
            "message": "Advanced Monte Carlo models are not available on this server"
        }
    
    # Check CUDA availability
    cuda_available = False
    gpu_devices = []
    
    try:
        import torch
        cuda_available = torch.cuda.is_available()
        if cuda_available:
            device_count = torch.cuda.device_count()
            for i in range(device_count):
                gpu_devices.append({
                    "index": i,
                    "name": torch.cuda.get_device_name(i),
                    "memory": torch.cuda.get_device_properties(i).total_memory
                })
    except ImportError:
        pass
    
    # Check what models are available
    available_models = {
        "advanced_monte_carlo": True,
        "variance_reduction": True,
        "financial_models": True
    }
    
    available_samplers = [
        "standard",
        "stratified",
        "latin_hypercube",
        "sobol",
        "halton"
    ]
    
    if engine:
        devices = engine.devices
    else:
        devices = ["cpu"]
    
    return {
        "status": "available",
        "cuda_available": cuda_available,
        "devices": devices,
        "gpu_devices": gpu_devices,
        "available_models": available_models,
        "available_samplers": available_samplers,
        "advanced_models_available": ADVANCED_MODELS_AVAILABLE,
        "cache_entries": len(simulation_cache)
    }

@router.post("/tariff-impact")
async def run_tariff_impact(
    request: TariffImpactRequest,
    engine: Optional[AdvancedMonteCarloEngine] = Depends(get_mc_engine)
):
    """
    Run advanced Monte Carlo simulation for tariff impact analysis
    """
    if not ADVANCED_MODELS_AVAILABLE or not engine:
        raise HTTPException(
            status_code=501,
            detail="Advanced Monte Carlo models are not available on this server"
        )
    
    # Configure engine based on request
    engine.sampling_method = getattr(SamplingMethod, request.config.sampling_method.upper())
    engine.use_domain_optimizations = request.config.use_domain_optimizations
    engine.precision = request.config.precision
    engine.use_multi_gpu = request.config.use_multi_gpu
    
    # Set random seed if provided
    if request.config.random_seed is not None:
        np.random.seed(request.config.random_seed)
        try:
            import torch
            torch.manual_seed(request.config.random_seed)
            if torch.cuda.is_available():
                torch.cuda.manual_seed_all(request.config.random_seed)
        except ImportError:
            pass
    
    # Register variables
    for var in request.variables:
        dist_type = getattr(DistributionType, var.distribution.upper())
        engine.register_variable(
            name=var.name,
            distribution=dist_type,
            params=var.params,
            importance=var.importance
        )
    
    # Set correlation matrix if provided
    if request.config.correlation_matrix:
        correlation_matrix = np.array(request.config.correlation_matrix)
        engine.set_correlations(correlation_matrix)
    
    # Create tariff model for simulation
    tariff_model = TariffModel(
        baseline_revenue=request.config.baseline_revenue,
        baseline_costs=request.config.baseline_costs,
        us_export_percentage=request.config.us_export_percentage,
        price_elasticity=request.config.price_elasticity
    )
    
    # Setup additional arguments for the simulation
    additional_args = {
        "baseline_revenue": request.config.baseline_revenue,
        "us_export_percentage": request.config.us_export_percentage,
        "baseline_costs": request.config.baseline_costs,
        "market_scenario": getattr(MarketScenario, request.config.market_scenario.upper())
    }
    
    # Define outputs we want to track
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
    
    # Generate cache key based on request parameters
    cache_key = f"tariff_{hash(str(request.dict()))}"
    
    # Check cache
    if cache_key in simulation_cache:
        cache_time, cache_results = simulation_cache[cache_key]
        # Cache valid for 30 minutes
        if time.time() - cache_time < 1800:
            return {
                "cached": True,
                "results": cache_results
            }
    
    # Run simulation
    start_time = time.time()
    
    try:
        # Define simulation function
        simulation_fn = engine.tariff_impact_simulation
        
        # Run simulation
        results = engine.run_simulation(
            simulation_function=simulation_fn,
            iterations=request.config.iterations,
            outputs=outputs,
            additional_args=additional_args,
            batch_size=request.config.batch_size,
            save_results=True,
            return_samples=request.config.return_samples,
            show_progress=True
        )
        
        # Add additional insights based on financial models
        if engine.use_domain_optimizations:
            # Calculate financial risk metrics
            for output in outputs:
                if output in results["statistics"]:
                    risk_metrics = tariff_model.calculate_risk_metrics(
                        np.array(results["statistics"][output].get("samples", []))
                    )
                    results["statistics"][output]["risk_metrics"] = risk_metrics
        
        # Add to cache
        simulation_cache[cache_key] = (time.time(), results)
        
        # Clean up old cache entries
        cleanup_cache()
        
        return {
            "cached": False,
            "results": results
        }
        
    except Exception as e:
        logger.error(f"Error running tariff impact simulation: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Simulation error: {str(e)}"
        )

@router.post("/multi-period")
async def run_multi_period_simulation(
    request: MultiPeriodRequest,
    engine: Optional[AdvancedMonteCarloEngine] = Depends(get_mc_engine)
):
    """
    Run multi-period tariff impact simulation
    """
    if not ADVANCED_MODELS_AVAILABLE or not engine:
        raise HTTPException(
            status_code=501,
            detail="Advanced Monte Carlo models are not available on this server"
        )
    
    # Create tariff model for simulation
    tariff_model = TariffModel(
        baseline_revenue=request.config.baseline_revenue,
        baseline_costs=request.config.baseline_costs,
        us_export_percentage=request.config.us_export_percentage,
        price_elasticity=request.config.price_elasticity
    )
    
    # Process time series for variables
    variable_time_series = {}
    for name, var_def in request.variables.items():
        if var_def.time_series:
            # Use provided time series
            time_series = var_def.time_series
            
            # Pad if needed
            if len(time_series) < request.periods:
                # Repeat last value
                padding = [time_series[-1]] * (request.periods - len(time_series))
                time_series = time_series + padding
                
            variable_time_series[name] = np.array(time_series[:request.periods])
        else:
            # Generate time series from initial value and growth rate
            initial_value = var_def.initial_value
            growth_rate = var_def.growth_rate or 0.0
            
            time_series = [
                initial_value * (1 + growth_rate) ** period
                for period in range(request.periods)
            ]
            
            variable_time_series[name] = np.array(time_series)
    
    # Set required variables
    if "tariff_rate" not in variable_time_series:
        raise HTTPException(
            status_code=400,
            detail="Variable 'tariff_rate' is required for multi-period simulation"
        )
    
    # Set default values for optional variables
    if "negotiation_probability" not in variable_time_series:
        variable_time_series["negotiation_probability"] = np.full(request.periods, 0.3)
    
    # Run multi-period simulation
    market_scenario = getattr(MarketScenario, request.config.market_scenario.upper())
    
    try:
        results = tariff_model.run_multi_period_simulation(
            tariff_rates=variable_time_series["tariff_rate"],
            market_adaptability_growth=0.1,  # Could be parameterized
            base_market_adaptability=0.3,    # Could be parameterized
            negotiation_probs=variable_time_series["negotiation_probability"],
            initial_competitor_response=0.5,  # Could be parameterized
            competitor_learning_rate=0.1,     # Could be parameterized
            alternative_market_growth_rate=0.05,  # Could be parameterized
            periods=request.periods,
            num_simulations=request.config.iterations,
            scenario=market_scenario
        )
        
        # Convert NumPy arrays to lists for JSON serialization
        processed_results = {}
        for key, value in results.items():
            if isinstance(value, np.ndarray):
                processed_results[key] = value.tolist()
            else:
                processed_results[key] = value
        
        return {
            "periods": request.periods,
            "results": processed_results,
            "variable_time_series": {
                name: values.tolist() for name, values in variable_time_series.items()
            }
        }
        
    except Exception as e:
        logger.error(f"Error running multi-period simulation: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Simulation error: {str(e)}"
        )

@router.post("/stress-test")
async def run_stress_test(
    request: StressTestRequest,
    engine: Optional[AdvancedMonteCarloEngine] = Depends(get_mc_engine)
):
    """
    Run market stress testing for tariff impact
    """
    if not ADVANCED_MODELS_AVAILABLE or not engine:
        raise HTTPException(
            status_code=501,
            detail="Advanced Monte Carlo models are not available on this server"
        )
    
    # Configure engine
    engine.sampling_method = getattr(SamplingMethod, request.baseline_config.sampling_method.upper())
    engine.use_domain_optimizations = request.baseline_config.use_domain_optimizations
    engine.precision = request.baseline_config.precision
    engine.use_multi_gpu = request.baseline_config.use_multi_gpu
    
    # Register variables
    for var in request.variables:
        dist_type = getattr(DistributionType, var.distribution.upper())
        engine.register_variable(
            name=var.name,
            distribution=dist_type,
            params=var.params,
            importance=var.importance
        )
    
    # Set correlation matrix if provided
    if request.baseline_config.correlation_matrix:
        correlation_matrix = np.array(request.baseline_config.correlation_matrix)
        engine.set_correlations(correlation_matrix)
    
    # Create tariff model
    tariff_model = TariffModel(
        baseline_revenue=request.baseline_config.baseline_revenue,
        baseline_costs=request.baseline_config.baseline_costs,
        us_export_percentage=request.baseline_config.us_export_percentage,
        price_elasticity=request.baseline_config.price_elasticity
    )
    
    # Define outputs we want to track
    outputs = [
        "total_financial_impact",
        "percentage_impact",
        "profit_impact_percentage"
    ]
    
    # Run stress tests for each scenario
    stress_results = {}
    
    for scenario in request.stress_scenarios:
        # Setup additional arguments for this scenario
        additional_args = {
            "baseline_revenue": request.baseline_config.baseline_revenue,
            "us_export_percentage": request.baseline_config.us_export_percentage,
            "baseline_costs": request.baseline_config.baseline_costs,
            "market_scenario": getattr(MarketScenario, scenario.upper())
        }
        
        # Run simulation for this scenario
        try:
            # Define simulation function
            simulation_fn = engine.tariff_impact_simulation
            
            # Run simulation
            results = engine.run_simulation(
                simulation_function=simulation_fn,
                iterations=request.baseline_config.iterations,
                outputs=outputs,
                additional_args=additional_args,
                batch_size=request.baseline_config.batch_size,
                save_results=False,
                return_samples=False,
                show_progress=False
            )
            
            # Store results
            stress_results[scenario] = {
                "statistics": results["statistics"],
                "computation_time": results["computation_time"]
            }
            
        except Exception as e:
            logger.error(f"Error running stress test for {scenario}: {e}")
            stress_results[scenario] = {
                "error": str(e)
            }
    
    return {
        "baseline_config": request.baseline_config.dict(),
        "stress_scenarios": [s for s in request.stress_scenarios],
        "stress_results": stress_results
    }

@router.post("/optimize-mitigation")
async def optimize_mitigation_strategy(
    request: OptimizationRequest
):
    """
    Optimize mitigation strategy for tariff impact
    """
    if not ADVANCED_MODELS_AVAILABLE:
        raise HTTPException(
            status_code=501,
            detail="Advanced Monte Carlo models are not available on this server"
        )
    
    # Create tariff model
    company_profile = request.company_profile
    tariff_model = TariffModel(
        baseline_revenue=company_profile.get("baseline_revenue", 60000000000),
        baseline_costs=company_profile.get("baseline_costs", 51000000000),
        us_export_percentage=company_profile.get("us_export_percentage", 35.0),
        price_elasticity=company_profile.get("price_elasticity", -2.0)
    )
    
    try:
        # Run optimization
        result = tariff_model.optimize_mitigation_strategy(
            tariff_rate=request.tariff_rate,
            strategy_costs=request.strategy_costs,
            strategy_benefits=request.strategy_benefits,
            budget_constraint=request.budget_constraint,
            min_improvement=request.min_improvement
        )
        
        return result
        
    except Exception as e:
        logger.error(f"Error optimizing mitigation strategy: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Optimization error: {str(e)}"
        )

@router.delete("/cache")
async def clear_monte_carlo_cache():
    """
    Clear the Monte Carlo simulation cache
    """
    global simulation_cache
    cache_size = len(simulation_cache)
    simulation_cache = {}
    
    return {
        "status": "success",
        "message": f"Cleared {cache_size} cache entries"
    }

def cleanup_cache():
    """Clean up old cache entries (older than 60 minutes)"""
    global simulation_cache
    current_time = time.time()
    expired_keys = [
        key for key, (cache_time, _) in simulation_cache.items()
        if current_time - cache_time > 3600  # 60 minutes
    ]
    
    for key in expired_keys:
        del simulation_cache[key]
    
    if expired_keys:
        logger.debug(f"Cleaned up {len(expired_keys)} expired cache entries")
        
# Additional endpoints for specialty financial models

@router.post("/black-scholes/flexibility-value")
async def calculate_flexibility_value(
    current_revenue: float = Query(..., description="Current annual revenue"),
    revenue_at_risk: float = Query(..., description="Revenue exposed to tariff risk"),
    time_horizon: float = Query(..., description="Time horizon for analysis (years)"),
    volatility: float = Query(..., description="Volatility of revenue"),
    risk_free_rate: float = Query(0.03, description="Risk-free interest rate"),
    tariff_probability: float = Query(0.5, description="Probability of tariff implementation")
):
    """
    Value the flexibility to adapt to tariff risk using Black-Scholes model
    """
    if not ADVANCED_MODELS_AVAILABLE:
        raise HTTPException(
            status_code=501,
            detail="Advanced Monte Carlo models are not available on this server"
        )
    
    try:
        flexibility_value = BlackScholesModel.value_of_flexibility(
            current_revenue=current_revenue,
            revenue_at_risk=revenue_at_risk,
            time_horizon=time_horizon,
            volatility=volatility,
            risk_free_rate=risk_free_rate,
            tariff_probability=tariff_probability
        )
        
        return {
            "flexibility_value": flexibility_value,
            "inputs": {
                "current_revenue": current_revenue,
                "revenue_at_risk": revenue_at_risk,
                "time_horizon": time_horizon,
                "volatility": volatility,
                "risk_free_rate": risk_free_rate,
                "tariff_probability": tariff_probability
            }
        }
        
    except Exception as e:
        logger.error(f"Error calculating flexibility value: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Calculation error: {str(e)}"
        )

@router.post("/heston/simulate")
async def simulate_heston_model(
    initial_price: float = Query(..., description="Initial asset price"),
    initial_volatility: float = Query(..., description="Initial volatility"),
    kappa: float = Query(2.0, description="Mean reversion speed"),
    theta: float = Query(0.04, description="Long-term variance"),
    sigma: float = Query(0.3, description="Volatility of volatility"),
    rho: float = Query(-0.7, description="Correlation between price and volatility"),
    risk_free_rate: float = Query(0.03, description="Risk-free interest rate"),
    time_horizon: float = Query(1.0, description="Time horizon for simulation (years)"),
    num_steps: int = Query(100, description="Number of time steps"),
    num_paths: int = Query(5, description="Number of paths to simulate"),
    return_volatility: bool = Query(True, description="Whether to return volatility paths")
):
    """
    Simulate price paths using the Heston stochastic volatility model
    """
    if not ADVANCED_MODELS_AVAILABLE:
        raise HTTPException(
            status_code=501,
            detail="Advanced Monte Carlo models are not available on this server"
        )
    
    try:
        # Create Heston model
        heston = HestonModel(
            initial_price=initial_price,
            initial_variance=initial_volatility ** 2,  # Convert volatility to variance
            kappa=kappa,
            theta=theta,
            sigma=sigma,
            rho=rho,
            risk_free_rate=risk_free_rate
        )
        
        # Generate paths
        if return_volatility:
            paths, vols = heston.simulate_paths(
                time_horizon=time_horizon,
                num_steps=num_steps,
                num_paths=num_paths,
                return_vol=True
            )
            
            # Convert NumPy arrays to lists for JSON serialization
            paths_list = paths.tolist()
            vols_list = vols.tolist()
            
            return {
                "time_horizon": time_horizon,
                "num_steps": num_steps,
                "num_paths": num_paths,
                "time_points": [i * time_horizon / num_steps for i in range(num_steps + 1)],
                "price_paths": paths_list,
                "volatility_paths": vols_list
            }
        else:
            paths = heston.simulate_paths(
                time_horizon=time_horizon,
                num_steps=num_steps,
                num_paths=num_paths,
                return_vol=False
            )
            
            # Convert NumPy arrays to lists for JSON serialization
            paths_list = paths.tolist()
            
            return {
                "time_horizon": time_horizon,
                "num_steps": num_steps,
                "num_paths": num_paths,
                "time_points": [i * time_horizon / num_steps for i in range(num_steps + 1)],
                "price_paths": paths_list
            }
        
    except Exception as e:
        logger.error(f"Error simulating Heston model: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Simulation error: {str(e)}"
        )

@router.post("/jump-diffusion/simulate")
async def simulate_jump_diffusion(
    initial_price: float = Query(..., description="Initial asset price"),
    drift: float = Query(0.05, description="Drift term (annual rate)"),
    volatility: float = Query(0.2, description="Diffusion volatility (annual)"),
    jump_intensity: float = Query(1.0, description="Expected number of jumps per year"),
    jump_mean: float = Query(-0.2, description="Mean of jump size"),
    jump_volatility: float = Query(0.1, description="Volatility of jump size"),
    time_horizon: float = Query(1.0, description="Time horizon for simulation (years)"),
    num_steps: int = Query(100, description="Number of time steps"),
    num_paths: int = Query(5, description="Number of paths to simulate")
):
    """
    Simulate price paths using the Merton jump diffusion model
    """
    if not ADVANCED_MODELS_AVAILABLE:
        raise HTTPException(
            status_code=501,
            detail="Advanced Monte Carlo models are not available on this server"
        )
    
    try:
        # Create jump diffusion model
        jd_model = JumpDiffusionModel(
            initial_price=initial_price,
            drift=drift,
            volatility=volatility,
            jump_intensity=jump_intensity,
            jump_mean=jump_mean,
            jump_volatility=jump_volatility
        )
        
        # Generate paths
        paths = jd_model.simulate_paths(
            time_horizon=time_horizon,
            num_steps=num_steps,
            num_paths=num_paths
        )
        
        # Convert NumPy arrays to lists for JSON serialization
        paths_list = paths.tolist()
        
        return {
            "time_horizon": time_horizon,
            "num_steps": num_steps,
            "num_paths": num_paths,
            "time_points": [i * time_horizon / num_steps for i in range(num_steps + 1)],
            "price_paths": paths_list
        }
        
    except Exception as e:
        logger.error(f"Error simulating jump diffusion model: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Simulation error: {str(e)}"
        )

# Initialize module
def setup():
    """Initialize module"""
    if ADVANCED_MODELS_AVAILABLE:
        logger.info("Advanced Monte Carlo API initialized successfully")
        
        # Get available Monte Carlo engines
        engine = get_mc_engine()
        if engine:
            logger.info(f"Monte Carlo engine created with devices: {engine.devices}")
            
            # Register default sampling methods
            logger.info("Registering default sampling methods...")
            engine.register_sampling_method("standard", SamplingMethod.STANDARD)
            engine.register_sampling_method("stratified", SamplingMethod.STRATIFIED)
            engine.register_sampling_method("latin_hypercube", SamplingMethod.LATIN_HYPERCUBE)
            engine.register_sampling_method("sobol", SamplingMethod.SOBOL)
            engine.register_sampling_method("halton", SamplingMethod.HALTON)
            
            # Register default financial models
            logger.info("Registering default financial models...")
            engine.register_financial_model("black_scholes", BlackScholesModel)
            engine.register_financial_model("heston", HestonModel)
            engine.register_financial_model("jump_diffusion", JumpDiffusionModel)
            
            # Initialize performance profiles
            if "optimization_profiles" in engine.config:
                logger.info("Initializing optimization profiles...")
                for profile_name, profile in engine.config.get("optimization_profiles", {}).items():
                    logger.info(f"  - {profile_name}: {profile}")
            
            # Ready for production use
            logger.info("Advanced Monte Carlo engine ready for production use")
        else:
            logger.warning("Failed to create Monte Carlo engine")
            
    else:
        logger.warning("Advanced Monte Carlo models not available. Some features will be limited.")

# Run setup when module is loaded
setup()