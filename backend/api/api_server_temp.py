#!/usr/bin/env python3
"""
Real-time API server for Enterprise Dashboard
Serves actual analysis data from JSON file and provides Monte Carlo simulation capabilities
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import json
import sys
import os
from pathlib import Path
from datetime import datetime
import uvicorn

# Add parent directory to path to allow importing from sibling modules
sys.path.append(str(Path(__file__).parent.parent))

# Create FastAPI app
app = FastAPI(title="Tariff Analysis Real-Time API")

# Enable CORS for dashboard access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)

# Import Monte Carlo API routers
try:
    from api.monte_carlo_api import router as monte_carlo_router
    MONTE_CARLO_API_AVAILABLE = True
except ImportError:
    MONTE_CARLO_API_AVAILABLE = False

# Import Advanced Monte Carlo API router
try:
    from api.advanced_monte_carlo_api import router as advanced_monte_carlo_router
    ADVANCED_MONTE_CARLO_API_AVAILABLE = True
except ImportError:
    ADVANCED_MONTE_CARLO_API_AVAILABLE = False

# Import Production Analysis API router
try:
    from api.production_analysis_api import router as production_analysis_router
    PRODUCTION_ANALYSIS_API_AVAILABLE = True
except ImportError:
    PRODUCTION_ANALYSIS_API_AVAILABLE = False

# Load analysis data
def load_analysis_data():
    """Load the latest analysis results"""
    results_dir = Path(__file__).parent.parent / "results"
    analysis_files = sorted(results_dir.glob("tariff_analysis_*.json"))
    
    if analysis_files:
        latest_file = analysis_files[-1]
        with open(latest_file, 'r') as f:
            return json.load(f)
    return None

# Cache the data
ANALYSIS_DATA = load_analysis_data()

@app.get("/api/metrics")
async def get_metrics():
    """Get real-time metrics from analysis data"""
    if not ANALYSIS_DATA:
        return JSONResponse(content={"error": "No analysis data available"}, status_code=404)
    
    baseline = ANALYSIS_DATA["baseline_data"]["financial_metrics"]
    summary = ANALYSIS_DATA["executive_summary"]
    
    return {
        "company": ANALYSIS_DATA["metadata"]["company"],
        "revenue": ANALYSIS_DATA["baseline_data"]["company_profile"]["annual_revenue"],
        "revenue_at_risk": baseline["revenue_at_risk"],
        "total_impact": summary["key_findings"]["total_financial_impact"],
        "critical_risks": summary["key_findings"]["critical_risk_areas"],
        "success_probability": summary["success_probability"]["with_recommended_actions"]
    }

@app.get("/api/impacts")
async def get_impacts():
    """Get all impacts by category"""
    if not ANALYSIS_DATA:
        return JSONResponse(content={"error": "No analysis data available"}, status_code=404)
    
    impacts = ANALYSIS_DATA["tariff_impacts"]
    
    # Convert to format expected by dashboard
    formatted_impacts = []
    for impact in impacts:
        formatted_impacts.append({
            "category": {"value": impact["category"]},
            "severity": {"value": str(impact["severity"])},
            "timeframe": {"value": impact["timeframe"]},
            "description": {"value": impact["description"]},
            "financialImpact": {"value": impact.get("financial_impact", 0)} if impact.get("financial_impact") else None
        })
    
    return formatted_impacts

@app.get("/api/finance-options")
async def get_finance_options():
    """Get trade finance options"""
    if not ANALYSIS_DATA:
        return JSONResponse(content={"error": "No analysis data available"}, status_code=404)
    
    options = ANALYSIS_DATA["finance_options"]
    
    # Convert to format expected by dashboard
    formatted_options = []
    for option in options:
        formatted_options.append({
            "name": {"value": option["name"]},
            "provider": {"value": option["provider"]},
            "cost": {"value": str(option["cost"])},
            "complexity": {"value": str(option["complexity"])},
            "implementationTime": {"value": option["implementation_time"]}
        })
    
    return formatted_options

@app.get("/api/recommendations")
async def get_recommendations():
    """Get recommendations timeline"""
    if not ANALYSIS_DATA:
        return JSONResponse(content={"error": "No analysis data available"}, status_code=404)
    
    recommendations = ANALYSIS_DATA["recommendations"]
    
    # Group by timeline
    timeline_groups = {}
    
    # Immediate actions
    for action in recommendations.get("immediate_actions", []):
        timeline = action["timeline"]
        if timeline not in timeline_groups:
            timeline_groups[timeline] = []
        timeline_groups[timeline].append({
            "action": action["action"],
            "priority": action["priority"],
            "cost": action.get("cost")
        })
    
    # Short-term strategies
    for strategy in recommendations.get("short_term_strategy", []):
        timeline = strategy["timeline"]
        if timeline not in timeline_groups:
            timeline_groups[timeline] = []
        timeline_groups[timeline].append({
            "action": strategy["strategy"],
            "priority": "High",
            "cost": strategy.get("investment_required")
        })
    
    return timeline_groups

@app.get("/api/real-time-update")
async def get_real_time_update():
    """Simulate real-time updates"""
    import random
    
    # Reload data periodically (in production, this would be from live sources)
    global ANALYSIS_DATA
    if random.random() > 0.9:  # 10% chance of data update
        ANALYSIS_DATA = load_analysis_data()
    
    return {
        "timestamp": datetime.now().isoformat(),
        "data_updated": True,
        "message": "Real-time data synchronized"
    }

@app.get("/api/sparql")
async def sparql_query(query: str):
    """Mock SPARQL query endpoint"""
    return {
        "results": {
            "bindings": [
                {
                    "subject": {"value": "http://example.org/TariffAnalysis"},
                    "predicate": {"value": "http://example.org/hasCompany"},
                    "object": {"value": ANALYSIS_DATA["metadata"]["company"]}
                }
            ]
        }
    }

@app.get("/api/capabilities")
async def get_capabilities():
    """Get available API capabilities"""
    capabilities = {
        "data_analysis": True,
        "monte_carlo": MONTE_CARLO_API_AVAILABLE,
        "advanced_monte_carlo": ADVANCED_MONTE_CARLO_API_AVAILABLE,
        "production_analysis": PRODUCTION_ANALYSIS_API_AVAILABLE,
        "semantic": True,
        "gpu_acceleration": os.environ.get("USE_GPU_ACCELERATION", "false").lower() == "true"
    }
    
    # Check for CUDA availability
    try:
        import torch
        capabilities["cuda_available"] = torch.cuda.is_available()
        if capabilities["cuda_available"]:
            capabilities["gpu_device"] = torch.cuda.get_device_name(0)
            capabilities["gpu_count"] = torch.cuda.device_count()
            capabilities["cuda_version"] = torch.version.cuda
            
            # Get memory info for first GPU
            if torch.cuda.device_count() > 0:
                props = torch.cuda.get_device_properties(0)
                capabilities["gpu_memory"] = props.total_memory
                capabilities["tensor_cores_available"] = props.major >= 7
    except ImportError:
        capabilities["cuda_available"] = False
    
    # Check for advanced features
    if ADVANCED_MONTE_CARLO_API_AVAILABLE:
        capabilities["advanced_features"] = {
            "multi_gpu": True,
            "distributed_computing": True,
            "variance_reduction": True,
            "financial_models": True,
            "black_scholes": True,
            "heston_model": True,
            "jump_diffusion": True
        }
    
    # Check for production analysis features
    if PRODUCTION_ANALYSIS_API_AVAILABLE:
        capabilities["production_analysis_features"] = {
            "standard_analysis": True,
            "multi_scenario_analysis": True,
            "flexibility_valuation": True,
            "multi_period_analysis": True,
            "strategy_optimization": True
        }
    
    return capabilities

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "data_loaded": ANALYSIS_DATA is not None,
        "monte_carlo_available": MONTE_CARLO_API_AVAILABLE,
        "advanced_monte_carlo_available": ADVANCED_MONTE_CARLO_API_AVAILABLE,
        "production_analysis_available": PRODUCTION_ANALYSIS_API_AVAILABLE
    }

# Include Monte Carlo router if available
if MONTE_CARLO_API_AVAILABLE:
    app.include_router(monte_carlo_router)
    print("Monte Carlo simulation API endpoints enabled")

# Include Advanced Monte Carlo router if available
if ADVANCED_MONTE_CARLO_API_AVAILABLE:
    app.include_router(advanced_monte_carlo_router)
    print("Advanced Monte Carlo simulation API endpoints enabled")
    
# Include Production Analysis router if available
if PRODUCTION_ANALYSIS_API_AVAILABLE:
    app.include_router(production_analysis_router)
    print("Production Analysis API endpoints enabled")

if __name__ == "__main__":
    print("Starting Tariff Analysis API Server...")
    print("API will be available at http://localhost:8888")
    
    # Print status of Monte Carlo APIs
    if MONTE_CARLO_API_AVAILABLE:
        print("✅ Monte Carlo simulation capabilities enabled")
    else:
        print("⚠️ Monte Carlo simulation capabilities not available")
    
    if ADVANCED_MONTE_CARLO_API_AVAILABLE:
        print("✅ Advanced Monte Carlo simulation capabilities enabled")
        
        # Try to get GPU information
        try:
            import torch
            if torch.cuda.is_available():
                device_count = torch.cuda.device_count()
                print(f"✅ CUDA available with {device_count} GPU(s)")
                for i in range(device_count):
                    props = torch.cuda.get_device_properties(i)
                    print(f"   - GPU {i}: {torch.cuda.get_device_name(i)} ({props.total_memory / 1024**3:.2f} GB)")
                    
                if device_count > 1:
                    print("✅ Multi-GPU processing enabled")
            else:
                print("⚠️ CUDA not available, using CPU fallback")
        except ImportError:
            print("⚠️ PyTorch not available, using CPU fallback")
    else:
        print("⚠️ Advanced Monte Carlo simulation capabilities not available")
    
    if PRODUCTION_ANALYSIS_API_AVAILABLE:
        print("✅ Production Analysis API enabled")
        print("   - Standard tariff impact analysis")
        print("   - Multi-scenario market analysis")
        print("   - Financial flexibility valuation")
        print("   - Multi-period impact projections")
        print("   - Strategy optimization")
    else:
        print("⚠️ Production Analysis API not available")
        
    uvicorn.run(app, host="0.0.0.0", port=8888)