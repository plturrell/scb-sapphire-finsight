#!/usr/bin/env python3
"""
API endpoints for CUDA-accelerated Monte Carlo simulations
Provides high-performance financial impact analysis
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional
import json
import time
import logging
import os
from pathlib import Path

# Import CUDA Monte Carlo simulator
try:
    from ..analysis.monte_carlo_cuda import CudaMonteCarloSimulator
    CUDA_MONTE_CARLO_AVAILABLE = True
except ImportError:
    CUDA_MONTE_CARLO_AVAILABLE = False

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("MonteCarloAPI")

# Cached results for recent simulations
simulation_cache = {}

# Create API router
router = APIRouter(
    prefix="/api/monte-carlo",
    tags=["monte-carlo"],
    responses={404: {"description": "Not found"}}
)

# Models
class SimulationParameters(BaseModel):
    """Parameters for Monte Carlo simulation"""
    tariff_rate: float = Field(46.0, description="Tariff rate as percentage")
    negotiation_chance: float = Field(0.3, description="Probability of successful negotiations (0-1)")
    market_adaptability: float = Field(0.5, description="Market's adaptability to changes (0-1)")
    baseline_revenue: float = Field(60000000000, description="Company's baseline annual revenue")
    us_export_percentage: float = Field(35.0, description="Percentage of exports to US")

class SimulationOptions(BaseModel):
    """Options for Monte Carlo simulation"""
    iterations: int = Field(10000, description="Number of simulation iterations")
    use_gpu: bool = Field(True, description="Whether to use GPU acceleration if available")
    use_tensor_cores: bool = Field(True, description="Whether to use tensor cores for mixed precision")
    save_results: bool = Field(True, description="Whether to save results to file")

class SimulationRequest(BaseModel):
    """Full request for Monte Carlo simulation"""
    parameters: SimulationParameters
    options: Optional[SimulationOptions] = Field(default_factory=SimulationOptions)

@router.post("/run")
async def run_monte_carlo_simulation(request: SimulationRequest):
    """
    Run a CUDA-accelerated Monte Carlo simulation for tariff impact analysis
    """
    if not CUDA_MONTE_CARLO_AVAILABLE:
        logger.warning("CUDA Monte Carlo module not available. Using fallback implementation.")
    
    # Extract parameters and options
    parameters = request.parameters.dict()
    options = request.options.dict() if request.options else SimulationOptions().dict()
    
    # Generate cache key based on parameters and iteration count
    cache_key = f"{hash(json.dumps(parameters, sort_keys=True))}-{options['iterations']}"
    
    # Check cache (valid for 30 minutes)
    if cache_key in simulation_cache:
        cache_time, cache_results = simulation_cache[cache_key]
        if time.time() - cache_time < 1800:  # 30 minutes
            logger.info(f"Returning cached simulation results for {cache_key}")
            return {
                "cached": True,
                "results": cache_results
            }
    
    # Create simulator
    try:
        simulator = CudaMonteCarloSimulator(use_gpu=options["use_gpu"])
        
        # Run simulation
        results = simulator.run_simulation(
            parameters=parameters,
            iterations=options["iterations"],
            use_tensor_cores=options["use_tensor_cores"]
        )
        
        # Save results if requested
        if options["save_results"]:
            output_dir = Path(__file__).parent.parent / "results"
            simulator.save_results(results, output_dir)
        
        # Cache results
        simulation_cache[cache_key] = (time.time(), results)
        
        # Clean up old cache entries
        cleanup_cache()
        
        return {
            "cached": False,
            "results": results
        }
        
    except Exception as e:
        logger.error(f"Error running Monte Carlo simulation: {e}")
        raise HTTPException(status_code=500, detail=f"Simulation error: {str(e)}")

@router.get("/status")
async def get_monte_carlo_status():
    """
    Get status of Monte Carlo simulation capabilities
    """
    # Check for CUDA availability
    cuda_available = False
    gpu_name = "None"
    try:
        import torch
        cuda_available = torch.cuda.is_available()
        if cuda_available:
            gpu_name = torch.cuda.get_device_name(0)
    except ImportError:
        pass
    
    return {
        "module_available": CUDA_MONTE_CARLO_AVAILABLE,
        "cuda_available": cuda_available,
        "gpu_device": gpu_name,
        "cache_entries": len(simulation_cache),
        "max_recommended_iterations": 1000000 if cuda_available else 100000
    }

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

# Initialize module
def setup_monte_carlo():
    """Initialize Monte Carlo simulation module"""
    if CUDA_MONTE_CARLO_AVAILABLE:
        # Try to create a simulator to check if CUDA is actually working
        try:
            simulator = CudaMonteCarloSimulator(use_gpu=True)
            logger.info("CUDA Monte Carlo simulation module initialized successfully")
            
            # Get GPU info if available
            if simulator.use_gpu:
                logger.info(f"Using GPU: {simulator.device}")
            else:
                logger.info("Using CPU for simulations (CUDA not available)")
                
        except Exception as e:
            logger.error(f"Error initializing CUDA Monte Carlo module: {e}")
    else:
        logger.warning("CUDA Monte Carlo module not available. Some features will be limited.")

# Run setup when module is loaded
setup_monte_carlo()