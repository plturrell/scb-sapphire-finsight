#!/usr/bin/env python3
"""Test imports for our API server"""

import sys
import os
from pathlib import Path

# Add the parent directory to the path
sys.path.append(str(Path(__file__).parent))

print("Testing API imports...")

try:
    from api.monte_carlo_api import router as monte_carlo_router
    print("✅ Monte Carlo API imported successfully")
except ImportError as e:
    print(f"❌ Monte Carlo API import failed: {e}")

try:
    from api.advanced_monte_carlo_api import router as advanced_monte_carlo_router
    print("✅ Advanced Monte Carlo API imported successfully")
except ImportError as e:
    print(f"❌ Advanced Monte Carlo API import failed: {e}")

try:
    from analysis.monte_carlo_cuda import CudaMonteCarloSimulator
    print("✅ Monte Carlo CUDA imported successfully")
except ImportError as e:
    print(f"❌ Monte Carlo CUDA import failed: {e}")

try:
    from analysis.advanced_monte_carlo import AdvancedMonteCarloEngine
    print("✅ Advanced Monte Carlo Engine imported successfully")
except ImportError as e:
    print(f"❌ Advanced Monte Carlo Engine import failed: {e}")

try:
    from analysis.cuda_config import get_gpu_config
    print("✅ CUDA config imported successfully")
except ImportError as e:
    print(f"❌ CUDA config import failed: {e}")

# Check CUDA availability
try:
    import torch
    cuda_available = torch.cuda.is_available()
    print(f"✅ CUDA available: {cuda_available}")
    if cuda_available:
        device_count = torch.cuda.device_count()
        print(f"   - Device count: {device_count}")
        for i in range(device_count):
            print(f"   - GPU {i}: {torch.cuda.get_device_name(i)}")
except ImportError as e:
    print(f"❌ CUDA check failed: {e}")