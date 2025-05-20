#!/usr/bin/env python3
"""
Test API server to verify functionality
"""

import sys
import os
from pathlib import Path
import uvicorn
from fastapi import FastAPI
import json

# Add parent directory to path
sys.path.append(str(Path(__file__).parent))

# Create FastAPI app
app = FastAPI(title="Test API Server")

@app.get("/api/test")
async def test_endpoint():
    """Test endpoint"""
    return {"status": "working"}

@app.get("/api/capabilities")
async def get_capabilities():
    """Get available API capabilities"""
    return {
        "data_analysis": True,
        "monte_carlo": True,
        "advanced_monte_carlo": True,
        "cuda_available": False,
        "multi_gpu": False,
        "cpu_fallback": True
    }

@app.get("/api/advanced-monte-carlo/status")
async def get_advanced_monte_carlo_status():
    """Get advanced Monte Carlo status"""
    return {
        "status": "available",
        "cuda_available": False,
        "devices": ["cpu"],
        "gpu_devices": [],
        "available_models": {
            "advanced_monte_carlo": True,
            "variance_reduction": True,
            "financial_models": True
        },
        "available_samplers": [
            "standard",
            "stratified",
            "latin_hypercube",
            "sobol",
            "halton"
        ],
        "advanced_models_available": True
    }

if __name__ == "__main__":
    print("Starting test API server on port 8889...")
    uvicorn.run(app, host="0.0.0.0", port=8889)