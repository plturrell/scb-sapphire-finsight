#!/usr/bin/env python3
"""
Production Analysis API for Tariff Impact Assessment
Provides endpoints for comprehensive tariff impact analysis using advanced Monte Carlo techniques
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks, Query, Path, Body
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import Dict, List, Any, Optional, Union
import logging
import os
import json
import time
from datetime import datetime
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("ProductionAnalysisAPI")

# Import TariffImpactAnalyzer
try:
    from analysis.production_analysis import TariffImpactAnalyzer
    ANALYZER_AVAILABLE = True
    logger.info("TariffImpactAnalyzer is available")
except ImportError:
    ANALYZER_AVAILABLE = False
    logger.warning("TariffImpactAnalyzer is not available. Some features will be limited.")

# Create API router
router = APIRouter(
    prefix="/api/tariff-analysis",
    tags=["tariff-analysis"],
    responses={404: {"description": "Not found"}}
)

# Cache for recent analyses
analysis_cache = {}

# Models for API
class CompanyProfile(BaseModel):
    """Company profile for tariff impact analysis"""
    company: str = Field(..., description="Company name")
    annual_revenue: float = Field(..., description="Annual revenue")
    annual_costs: float = Field(..., description="Annual costs")
    us_export_percentage: float = Field(..., description="Percentage of revenue from US exports")
    price_elasticity: float = Field(..., description="Price elasticity of demand")
    sector: Optional[str] = Field(None, description="Industry sector")
    size: Optional[str] = Field(None, description="Company size")

class AnalysisRequest(BaseModel):
    """Request for tariff impact analysis"""
    company_profile: CompanyProfile = Field(..., description="Company profile")
    tariff_rate: float = Field(..., description="Base tariff rate to analyze")
    use_gpu: bool = Field(True, description="Whether to use GPU acceleration")
    profile: Optional[str] = Field("balanced", description="Performance profile")
    iterations: Optional[int] = Field(100000, description="Number of Monte Carlo iterations")
    sampling_method: Optional[str] = Field("latin_hypercube", description="Sampling method")
    save_results: Optional[bool] = Field(True, description="Whether to save results to disk")

class MultiScenarioRequest(BaseModel):
    """Request for multi-scenario tariff impact analysis"""
    company_profile: CompanyProfile = Field(..., description="Company profile")
    tariff_rate: float = Field(..., description="Base tariff rate to analyze")
    scenarios: List[str] = Field(..., description="Market scenarios to analyze")
    use_gpu: bool = Field(True, description="Whether to use GPU acceleration")
    profile: Optional[str] = Field("balanced", description="Performance profile")
    iterations: Optional[int] = Field(50000, description="Number of Monte Carlo iterations")

class FlexibilityRequest(BaseModel):
    """Request for flexibility valuation"""
    company_profile: CompanyProfile = Field(..., description="Company profile")
    time_horizon: float = Field(..., description="Time horizon in years")
    volatility: float = Field(..., description="Revenue volatility")
    risk_free_rate: Optional[float] = Field(0.03, description="Risk-free interest rate")
    tariff_probability: Optional[float] = Field(0.5, description="Probability of tariff implementation")

class MultiPeriodRequest(BaseModel):
    """Request for multi-period analysis"""
    company_profile: CompanyProfile = Field(..., description="Company profile")
    periods: int = Field(..., description="Number of periods to simulate")
    tariff_rate_initial: float = Field(..., description="Initial tariff rate")
    tariff_rate_growth: float = Field(..., description="Growth rate of tariff rate")
    negotiation_probability_initial: Optional[float] = Field(0.3, description="Initial negotiation probability")
    negotiation_probability_growth: Optional[float] = Field(0.2, description="Growth rate of negotiation probability")
    iterations: Optional[int] = Field(50000, description="Number of Monte Carlo iterations")

@router.post("/standard")
async def run_standard_analysis(request: AnalysisRequest):
    """
    Run standard tariff impact analysis
    """
    if not ANALYZER_AVAILABLE:
        raise HTTPException(
            status_code=501,
            detail="Tariff impact analyzer is not available on this server"
        )
    
    # Generate cache key
    cache_key = f"standard_{hash(str(request.dict()))}"
    
    # Check cache
    if cache_key in analysis_cache:
        cache_time, cache_results = analysis_cache[cache_key]
        # Cache valid for 30 minutes
        if time.time() - cache_time < 1800:
            return {
                "cached": True,
                "results": cache_results
            }
    
    logger.info(f"Running standard analysis for {request.company_profile.company} "
               f"with tariff rate {request.tariff_rate}")
    
    try:
        # Create analyzer
        analyzer = TariffImpactAnalyzer(
            company_profile=request.company_profile.dict(),
            use_gpu=request.use_gpu,
            profile=request.profile
        )
        
        # Run analysis
        results = analyzer.run_standard_impact_analysis(
            tariff_rate=request.tariff_rate,
            iterations=request.iterations,
            sampling_method=request.sampling_method
        )
        
        # Add to cache
        analysis_cache[cache_key] = (time.time(), results)
        
        # Clean up old cache entries
        cleanup_cache()
        
        return {
            "cached": False,
            "results": results
        }
    except Exception as e:
        logger.error(f"Error running standard analysis: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Analysis error: {str(e)}"
        )

@router.post("/multi-scenario")
async def run_multi_scenario_analysis(request: MultiScenarioRequest):
    """
    Run multi-scenario tariff impact analysis
    """
    if not ANALYZER_AVAILABLE:
        raise HTTPException(
            status_code=501,
            detail="Tariff impact analyzer is not available on this server"
        )
    
    # Generate cache key
    cache_key = f"multi_scenario_{hash(str(request.dict()))}"
    
    # Check cache
    if cache_key in analysis_cache:
        cache_time, cache_results = analysis_cache[cache_key]
        # Cache valid for 30 minutes
        if time.time() - cache_time < 1800:
            return {
                "cached": True,
                "results": cache_results
            }
    
    logger.info(f"Running multi-scenario analysis for {request.company_profile.company} "
               f"with tariff rate {request.tariff_rate}, scenarios: {request.scenarios}")
    
    try:
        # Create analyzer
        analyzer = TariffImpactAnalyzer(
            company_profile=request.company_profile.dict(),
            use_gpu=request.use_gpu,
            profile=request.profile
        )
        
        # Run analysis
        results = analyzer.run_multi_scenario_analysis(
            tariff_rate=request.tariff_rate,
            iterations=request.iterations,
            scenarios=request.scenarios
        )
        
        # Add to cache
        analysis_cache[cache_key] = (time.time(), results)
        
        # Clean up old cache entries
        cleanup_cache()
        
        return {
            "cached": False,
            "results": results
        }
    except Exception as e:
        logger.error(f"Error running multi-scenario analysis: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Analysis error: {str(e)}"
        )

@router.post("/flexibility")
async def run_flexibility_valuation(request: FlexibilityRequest):
    """
    Calculate the value of flexibility using Black-Scholes model
    """
    if not ANALYZER_AVAILABLE:
        raise HTTPException(
            status_code=501,
            detail="Tariff impact analyzer is not available on this server"
        )
    
    logger.info(f"Running flexibility valuation for {request.company_profile.company} "
               f"with time horizon {request.time_horizon}, volatility {request.volatility}")
    
    try:
        # Create analyzer
        analyzer = TariffImpactAnalyzer(
            company_profile=request.company_profile.dict(),
            use_gpu=False,  # Not needed for Black-Scholes
            profile="accuracy"
        )
        
        # Run analysis
        results = analyzer.run_flexibility_valuation(
            time_horizon=request.time_horizon,
            volatility=request.volatility,
            risk_free_rate=request.risk_free_rate,
            tariff_probability=request.tariff_probability
        )
        
        return results
    except Exception as e:
        logger.error(f"Error running flexibility valuation: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Analysis error: {str(e)}"
        )

@router.post("/multi-period")
async def run_multi_period_analysis(request: MultiPeriodRequest):
    """
    Run multi-period tariff impact analysis
    """
    if not ANALYZER_AVAILABLE:
        raise HTTPException(
            status_code=501,
            detail="Tariff impact analyzer is not available on this server"
        )
    
    logger.info(f"Running multi-period analysis for {request.company_profile.company} "
               f"with {request.periods} periods, initial rate {request.tariff_rate_initial}")
    
    try:
        # Create analyzer
        analyzer = TariffImpactAnalyzer(
            company_profile=request.company_profile.dict(),
            use_gpu=True,  # Use GPU for multi-period analysis
            profile="balanced"
        )
        
        # Run analysis
        results = analyzer.run_multi_period_analysis(
            periods=request.periods,
            tariff_rate_initial=request.tariff_rate_initial,
            tariff_rate_growth=request.tariff_rate_growth,
            negotiation_probability_initial=request.negotiation_probability_initial,
            negotiation_probability_growth=request.negotiation_probability_growth,
            iterations=request.iterations
        )
        
        return results
    except Exception as e:
        logger.error(f"Error running multi-period analysis: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Analysis error: {str(e)}"
        )

@router.get("/latest-analyses")
async def get_latest_analyses(limit: int = Query(10, description="Maximum number of analyses to return")):
    """
    Get latest analyses from the results directory
    """
    if not ANALYZER_AVAILABLE:
        raise HTTPException(
            status_code=501,
            detail="Tariff impact analyzer is not available on this server"
        )
    
    logger.info(f"Getting latest {limit} analyses")
    
    try:
        # Get path to results directory
        results_dir = Path(__file__).parent.parent / "results"
        
        # Get all JSON files in results directory
        json_files = sorted(
            [f for f in results_dir.glob("*.json") if f.name.startswith(("tariff", "multi", "flexibility"))],
            key=lambda f: f.stat().st_mtime,
            reverse=True
        )
        
        # Limit number of files
        json_files = json_files[:limit]
        
        # Read files
        analyses = []
        for file in json_files:
            try:
                with open(file, 'r') as f:
                    data = json.load(f)
                analyses.append({
                    "filename": file.name,
                    "timestamp": datetime.fromtimestamp(file.stat().st_mtime).isoformat(),
                    "type": file.name.split('_')[0],
                    "summary": get_analysis_summary(data)
                })
            except Exception as e:
                logger.error(f"Error reading {file}: {e}")
        
        return analyses
    except Exception as e:
        logger.error(f"Error getting latest analyses: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error: {str(e)}"
        )

def get_analysis_summary(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Get summary of analysis results
    
    Args:
        data: Analysis results
        
    Returns:
        Summary of analysis results
    """
    summary = {}
    
    # Extract key information depending on analysis type
    if "statistics" in data and "total_financial_impact" in data.get("statistics", {}):
        stats = data["statistics"]["total_financial_impact"]
        summary["total_impact"] = stats.get("mean")
        summary["std_dev"] = stats.get("std")
        summary["min"] = stats.get("min")
        summary["max"] = stats.get("max")
    elif "flexibility_value" in data:
        summary["flexibility_value"] = data["flexibility_value"]
        summary["percentage"] = data.get("flexibility_value_percentage")
    elif "scenarios" in data:
        summary["scenarios"] = list(data["scenarios"].keys())
        if len(summary["scenarios"]) > 0:
            first_scenario = data["scenarios"][summary["scenarios"][0]]
            if "statistics" in first_scenario and "total_financial_impact" in first_scenario.get("statistics", {}):
                summary["example_impact"] = first_scenario["statistics"]["total_financial_impact"].get("mean")
    elif "results" in data and "total_impact" in data.get("results", {}):
        total_impact = data["results"]["total_impact"]
        if isinstance(total_impact, list) and len(total_impact) > 0:
            summary["periods"] = len(total_impact)
            summary["final_impact"] = total_impact[-1]
    
    # Add timing information if available
    if "timing" in data:
        summary["elapsed_time"] = data["timing"].get("elapsed_time")
        summary["iterations_per_second"] = data["timing"].get("iterations_per_second")
    
    # Add environment information if available
    if "environment" in data:
        summary["gpu_used"] = data["environment"].get("use_gpu")
        summary["multi_gpu"] = data["environment"].get("multi_gpu")
    
    return summary

@router.delete("/cache")
async def clear_analysis_cache():
    """
    Clear the analysis cache
    """
    global analysis_cache
    cache_size = len(analysis_cache)
    analysis_cache = {}
    
    return {
        "status": "success",
        "message": f"Cleared {cache_size} cache entries"
    }

def cleanup_cache():
    """Clean up old cache entries (older than 60 minutes)"""
    global analysis_cache
    current_time = time.time()
    expired_keys = [
        key for key, (cache_time, _) in analysis_cache.items()
        if current_time - cache_time > 3600  # 60 minutes
    ]
    
    for key in expired_keys:
        del analysis_cache[key]
    
    if expired_keys:
        logger.debug(f"Cleaned up {len(expired_keys)} expired cache entries")

# Initialize module
def setup():
    """Initialize module"""
    if ANALYZER_AVAILABLE:
        logger.info("Production Analysis API initialized successfully")
    else:
        logger.warning("TariffImpactAnalyzer not available. Some features will be limited.")

# Run setup when module is loaded
setup()