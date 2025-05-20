#!/usr/bin/env python3
"""
GPU Acceleration Configuration for Tariff Analysis
Provides CUDA optimization for Monte Carlo simulations and deep analysis
"""

import os
import json
import logging
from pathlib import Path
from typing import Dict, Optional, Union, List, Any

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("CUDA-Config")

class GPUConfig:
    """Configuration for GPU acceleration"""
    
    def __init__(self, config_file: Optional[str] = None):
        self.config_path = config_file or os.path.join(
            Path(__file__).parent.parent, 'data', 'gpu_config.json'
        )
        self.config = self._load_config()
        self.cuda_available = self._check_cuda_available()
        if self.cuda_available:
            self._configure_cuda_environment()
        else:
            logger.warning("CUDA is not available. Using CPU fallback.")
        
    def _check_cuda_available(self) -> Dict[str, Any]:
        """Check if CUDA is available"""
        try:
            import torch
            cuda_available = torch.cuda.is_available()
            
            if cuda_available:
                device_count = torch.cuda.device_count()
                device_name = torch.cuda.get_device_name(0)
                cuda_version = torch.version.cuda
                
                logger.info(f"CUDA is available with {device_count} GPU(s)")
                logger.info(f"GPU 0: {device_name}")
                logger.info(f"CUDA Version: {cuda_version}")
                
                # Check for tensor cores (Volta, Turing, Ampere, or newer architectures)
                has_tensor_cores = any(arch in device_name.lower() 
                                     for arch in ["volta", "turing", "ampere", "hopper", "a100", "a6000", "h100"])
                
                return {
                    "available": True,
                    "device_count": device_count,
                    "device_name": device_name,
                    "cuda_version": cuda_version,
                    "has_tensor_cores": has_tensor_cores
                }
            else:
                logger.warning("CUDA is not available")
                return {"available": False}
                
        except ImportError:
            logger.warning("PyTorch is not installed, CUDA cannot be used")
            return {"available": False}
        except Exception as e:
            logger.error(f"Error checking CUDA availability: {e}")
            return {"available": False, "error": str(e)}
    
    def _configure_cuda_environment(self) -> None:
        """Configure the CUDA environment based on settings"""
        try:
            import torch
            
            # Set PyTorch environment variables
            os.environ["CUDA_VISIBLE_DEVICES"] = str(self.config.get("preferred_gpu_index", 0))
            
            # Configure PyTorch
            if self.config["precision"] == "fp16":
                torch.set_default_tensor_type(torch.cuda.HalfTensor)
            else:
                torch.set_default_tensor_type(torch.cuda.FloatTensor)
            
            # Configure memory optimization
            if self.config["memory_optimization"]["gradient_checkpointing"]:
                # This needs to be applied to specific models when created
                pass
                
            # Set memory fraction if supported
            if hasattr(torch.cuda, "set_per_process_memory_fraction"):
                torch.cuda.set_per_process_memory_fraction(
                    self.config.get("memory_optimization", {}).get("memory_fraction", 0.8)
                )
            
            logger.info(f"CUDA environment configured successfully with precision {self.config['precision']}")
            
        except ImportError:
            logger.warning("PyTorch is not installed, CUDA environment not configured")
        except Exception as e:
            logger.error(f"Error configuring CUDA environment: {e}")
        
    def _load_config(self) -> Dict:
        """Load GPU configuration"""
        default_config = {
            "use_gpu": True,
            "precision": "fp16",  # fp16, fp32, bf16
            "tensor_parallel_size": 4,
            "batch_size": 1024,
            "preferred_gpu_index": 0,
            "vector_dim": 768,
            "cuda_kernels": {
                "similarity": True,
                "matrix_multiply": True,
                "monte_carlo": True,
                "visualization": True
            },
            "monte_carlo": {
                "batch_size": 100000,
                "use_tensor_cores": True,
                "max_iterations": 1000000
            },
            "memory_optimization": {
                "gradient_checkpointing": True,
                "mixed_precision": True,
                "offload_to_cpu": False,
                "memory_fraction": 0.8
            }
        }
        
        # Check for environment variable overrides
        env_use_gpu = os.environ.get("USE_GPU_ACCELERATION")
        if env_use_gpu is not None:
            default_config["use_gpu"] = env_use_gpu.lower() == "true"
        
        env_precision = os.environ.get("CUDA_PRECISION")
        if env_precision in ["fp16", "fp32", "bf16"]:
            default_config["precision"] = env_precision
        
        # Load from file if it exists, otherwise create it
        if os.path.exists(self.config_path):
            try:
                with open(self.config_path, 'r') as f:
                    file_config = json.load(f)
                
                # Merge with defaults (nested update)
                merged_config = default_config.copy()
                for key, value in file_config.items():
                    if isinstance(value, dict) and key in merged_config and isinstance(merged_config[key], dict):
                        merged_config[key].update(value)
                    else:
                        merged_config[key] = value
                
                return merged_config
            except Exception as e:
                logger.error(f"Error loading GPU config: {e}")
                return default_config
        else:
            # Create default config file
            os.makedirs(os.path.dirname(self.config_path), exist_ok=True)
            with open(self.config_path, 'w') as f:
                json.dump(default_config, f, indent=2)
            return default_config
    
    def save_config(self) -> None:
        """Save current configuration"""
        with open(self.config_path, 'w') as f:
            json.dump(self.config, f, indent=2)
    
    def enable_gpu(self, enabled: bool = True) -> None:
        """Enable or disable GPU acceleration"""
        self.config["use_gpu"] = enabled
        self.save_config()
    
    def set_precision(self, precision: str) -> None:
        """Set computation precision (fp16, fp32, bf16)"""
        if precision not in ["fp16", "fp32", "bf16"]:
            raise ValueError(f"Invalid precision: {precision}. Use fp16, fp32, or bf16.")
        self.config["precision"] = precision
        self.save_config()
        
        # Re-configure CUDA environment if available
        if self.cuda_available["available"]:
            self._configure_cuda_environment()
    
    def set_tensor_parallel_size(self, size: int) -> None:
        """Set tensor parallelism size"""
        if size < 1:
            raise ValueError("Tensor parallel size must be >= 1")
        self.config["tensor_parallel_size"] = size
        self.save_config()
    
    def enable_cuda_kernel(self, kernel: str, enabled: bool = True) -> None:
        """Enable or disable specific CUDA kernel"""
        if kernel not in self.config["cuda_kernels"]:
            raise ValueError(f"Unknown CUDA kernel: {kernel}")
        self.config["cuda_kernels"][kernel] = enabled
        self.save_config()
    
    def optimize_memory(self, **kwargs) -> None:
        """Configure memory optimization options"""
        for key, value in kwargs.items():
            if key in self.config["memory_optimization"]:
                self.config["memory_optimization"][key] = value
        self.save_config()
        
        # Re-configure CUDA environment if available
        if self.cuda_available["available"]:
            self._configure_cuda_environment()
    
    def configure_monte_carlo(self, **kwargs) -> None:
        """Configure Monte Carlo simulation options"""
        for key, value in kwargs.items():
            if key in self.config["monte_carlo"]:
                self.config["monte_carlo"][key] = value
        self.save_config()
    
    def get_optimal_batch_size(self, model_size_mb=1000, input_size_mb=1, safety_factor=0.7) -> int:
        """Calculate optimal batch size based on available GPU memory"""
        if not self.cuda_available["available"]:
            return self.config["batch_size"]
            
        try:
            import torch
            if torch.cuda.is_available():
                # Get available GPU memory
                free_memory = torch.cuda.get_device_properties(0).total_memory
                free_memory_mb = free_memory / (1024 * 1024)
                
                # Calculate memory needed per sample
                memory_per_sample = input_size_mb
                
                # Calculate optimal batch size
                max_batch_size = int((free_memory_mb * safety_factor - model_size_mb) / memory_per_sample)
                
                # Ensure it's at least 1
                max_batch_size = max(1, max_batch_size)
                
                logger.info(f"Calculated optimal batch size: {max_batch_size}")
                return max_batch_size
        except Exception as e:
            logger.warning(f"Error calculating optimal batch size: {e}")
        
        # Return default batch size from config
        return self.config["batch_size"]
    
    def get_device(self) -> str:
        """Get the device to use (cuda or cpu)"""
        if self.cuda_available["available"] and self.config["use_gpu"]:
            return f"cuda:{self.config.get('preferred_gpu_index', 0)}"
        return "cpu"
    
    def get_monte_carlo_config(self) -> Dict[str, Any]:
        """Get Monte Carlo specific configuration"""
        # Get enhanced Monte Carlo config if available
        monte_carlo_config = self.config.get("monte_carlo", {})
        
        if isinstance(monte_carlo_config, dict) and "optimization_profiles" in monte_carlo_config:
            # Advanced config (new format)
            profile_name = os.environ.get("MONTE_CARLO_PROFILE", "balanced")
            profile = monte_carlo_config.get("optimization_profiles", {}).get(profile_name, {})
            
            # Get batch size
            batch_size = (
                profile.get("batch_size") or
                monte_carlo_config.get("default_batch_size") or
                monte_carlo_config.get("batch_size", 10000)
            )
            
            # Check for available GPU memory and adjust batch size if needed
            if self.cuda_available.get("available", False):
                try:
                    import torch
                    if torch.cuda.is_available():
                        # Get available GPU memory (90% of total to be safe)
                        total_memory = torch.cuda.get_device_properties(0).total_memory
                        available_memory = total_memory * 0.9  # 90% of total
                        
                        # Estimate memory per simulation (very rough estimate)
                        memory_per_simulation = 8 * 20  # ~20 variables per simulation, 8 bytes per float
                        
                        # Maximum batch size based on available memory
                        max_memory_batch_size = int(available_memory / memory_per_simulation)
                        
                        # Use the smaller of configured batch size or max memory batch size
                        batch_size = min(batch_size, max_memory_batch_size)
                except Exception as e:
                    logger.warning(f"Error calculating memory-based batch size: {e}")
            
            # Determine if multi-GPU is enabled and available
            multi_gpu_enabled = (
                monte_carlo_config.get("multi_gpu", {}).get("enabled", False) and
                self.cuda_available.get("device_count", 0) > 1
            )
            
            # Determine precision mode
            precision_mode = (
                profile.get("precision") or
                monte_carlo_config.get("precision_options", {}).get("mixed", {}).get("enabled", True) and "mixed" or
                self.config.get("precision", "fp32")
            )
            
            # Get sampling method
            sampling_method = monte_carlo_config.get("default_sampling_method", "latin_hypercube")
            
            return {
                "use_gpu": self.cuda_available["available"] and self.config["use_gpu"],
                "device": self.get_device(),
                "batch_size": batch_size,
                "use_tensor_cores": (
                    profile.get("tensor_cores", True) and
                    self.cuda_available.get("has_tensor_cores", False)
                ),
                "max_iterations": monte_carlo_config.get("max_iterations", 1000000),
                "precision": precision_mode,
                "multi_gpu": {
                    "enabled": multi_gpu_enabled,
                    "device_count": self.cuda_available.get("device_count", 1) if multi_gpu_enabled else 1,
                    "strategy": monte_carlo_config.get("multi_gpu", {}).get("strategy", "data_parallel"),
                    "sync_interval": monte_carlo_config.get("multi_gpu", {}).get("synchronization_interval", 1000)
                },
                "distributed": monte_carlo_config.get("distributed", {"enabled": False}),
                "sampling_method": sampling_method,
                "available_sampling_methods": monte_carlo_config.get("available_sampling_methods", 
                    ["standard", "latin_hypercube", "sobol"]),
                "profile": profile_name
            }
        else:
            # Legacy config (old format)
            return {
                "use_gpu": self.cuda_available["available"] and self.config["use_gpu"],
                "device": self.get_device(),
                "batch_size": monte_carlo_config.get("batch_size", 10000),
                "use_tensor_cores": (
                    monte_carlo_config.get("use_tensor_cores", True) and 
                    self.cuda_available.get("has_tensor_cores", False)
                ),
                "max_iterations": monte_carlo_config.get("max_iterations", 1000000),
                "precision": self.config["precision"],
                "multi_gpu": {"enabled": False},
                "distributed": {"enabled": False},
                "sampling_method": "standard",
                "profile": "legacy"
            }

# Singleton instance
_gpu_config = None

def get_gpu_config() -> GPUConfig:
    """Get GPU configuration singleton"""
    global _gpu_config
    if _gpu_config is None:
        _gpu_config = GPUConfig()
    return _gpu_config

def get_device() -> str:
    """Helper to get current device (cuda or cpu)"""
    return get_gpu_config().get_device()

def is_cuda_available() -> bool:
    """Helper to check if CUDA is available"""
    return get_gpu_config().cuda_available.get("available", False)

def get_cuda_info() -> Dict[str, Any]:
    """Get detailed CUDA information"""
    return get_gpu_config().cuda_available

def get_monte_carlo_config() -> Dict[str, Any]:
    """Get Monte Carlo specific configuration"""
    return get_gpu_config().get_monte_carlo_config()

def get_available_gpus() -> List[int]:
    """Get list of available GPU indices"""
    gpu_info = get_cuda_info()
    if not gpu_info.get("available", False):
        return []
    
    return list(range(gpu_info.get("device_count", 0)))

def is_multi_gpu_available() -> bool:
    """Check if multiple GPUs are available"""
    gpu_info = get_cuda_info()
    return gpu_info.get("available", False) and gpu_info.get("device_count", 0) > 1

def get_sampling_method_enum(method_name: str):
    """
    Convert string sampling method name to enum value
    
    This helper function prevents circular imports while providing
    a convenient way to map string names to enum values.
    """
    mapping = {
        "standard": 0,
        "stratified": 1,
        "latin_hypercube": 2,
        "sobol": 3,
        "halton": 4,
        "importance": 5,
        "control_variate": 6
    }
    
    return mapping.get(method_name.lower(), 0)  # Default to standard method

def get_optimal_multi_gpu_config() -> Dict[str, Any]:
    """
    Get optimal multi-GPU configuration based on available hardware
    """
    monte_carlo_config = get_monte_carlo_config()
    gpu_info = get_cuda_info()
    
    if not gpu_info.get("available", False) or gpu_info.get("device_count", 0) <= 1:
        return {
            "enabled": False,
            "device_count": 1,
            "strategy": "none",
            "devices": ["cpu"]
        }
    
    # Multi-GPU is available
    device_count = gpu_info.get("device_count", 0)
    
    # Get memory info for all GPUs
    devices = []
    try:
        import torch
        for i in range(device_count):
            device_name = torch.cuda.get_device_name(i)
            memory = torch.cuda.get_device_properties(i).total_memory
            devices.append({
                "index": i,
                "name": device_name,
                "memory": memory,
                "device": f"cuda:{i}"
            })
    except ImportError:
        # Fallback if torch not available
        for i in range(device_count):
            devices.append({
                "index": i,
                "name": f"GPU {i}",
                "memory": 0,
                "device": f"cuda:{i}"
            })
    
    return {
        "enabled": True,
        "device_count": device_count,
        "strategy": monte_carlo_config.get("multi_gpu", {}).get("strategy", "data_parallel"),
        "devices": devices,
        "sync_interval": monte_carlo_config.get("multi_gpu", {}).get("sync_interval", 1000)
    }

if __name__ == "__main__":
    # Test configuration
    config = get_gpu_config()
    print("\n===== GPU Configuration =====\n")
    print(json.dumps(config.config, indent=2))
    
    print("\n===== CUDA Status =====\n")
    cuda_info = config.cuda_available
    for key, value in cuda_info.items():
        print(f"{key}: {value}")
    
    print(f"\nActive device: {config.get_device()}")
    
    # Test tensor cores if available
    if cuda_info.get("available", False) and cuda_info.get("has_tensor_cores", False):
        print("\n===== Testing Tensor Cores =====\n")
        try:
            import torch
            import time
            
            # Create test tensors
            size = 4096
            a = torch.randn(size, size, device=config.get_device())
            b = torch.randn(size, size, device=config.get_device())
            
            # Warm up
            torch.matmul(a, b)
            torch.cuda.synchronize()
            
            # Benchmark with tensor cores
            with torch.cuda.amp.autocast(enabled=True):
                start = time.time()
                for _ in range(10):
                    c = torch.matmul(a, b)
                    torch.cuda.synchronize()
                tensor_cores_time = (time.time() - start) / 10
            
            # Benchmark without tensor cores
            start = time.time()
            for _ in range(10):
                c = torch.matmul(a, b)
                torch.cuda.synchronize()
            normal_time = (time.time() - start) / 10
            
            print(f"Matrix multiply time with tensor cores: {tensor_cores_time*1000:.2f} ms")
            print(f"Matrix multiply time without tensor cores: {normal_time*1000:.2f} ms")
            print(f"Speedup: {normal_time/tensor_cores_time:.2f}x")
            
        except ImportError:
            print("PyTorch not available, can't test tensor cores")
        except Exception as e:
            print(f"Error testing tensor cores: {e}")
    
    # Test advanced Monte Carlo configuration
    print("\n===== Monte Carlo Configuration =====\n")
    mc_config = get_monte_carlo_config()
    print(json.dumps(mc_config, indent=2))
    
    # Test multi-GPU support
    print("\n===== Multi-GPU Support =====\n")
    if is_multi_gpu_available():
        print("Multiple GPUs are available")
        multi_gpu_config = get_optimal_multi_gpu_config()
        print(json.dumps(multi_gpu_config, indent=2))
        
        # Test performance scaling with multiple GPUs
        try:
            import torch
            import time
            import numpy as np
            
            if torch.cuda.device_count() > 1:
                print("\nTesting multi-GPU performance scaling...")
                
                # Function to simulate Monte Carlo on a single GPU
                def simulate_single_gpu(size=10000, iters=100):
                    device = torch.device("cuda:0")
                    # Initialize random data
                    data = torch.randn(size, 10, device=device)
                    
                    # Simulate calculations
                    start = time.time()
                    for _ in range(iters):
                        # Emulate a Monte Carlo iteration
                        noise = torch.randn(size, 10, device=device)
                        result = data + noise
                        result = torch.sum(result ** 2, dim=1)
                        result = torch.sqrt(result)
                        # Get some stats
                        mean = torch.mean(result)
                        std = torch.std(result)
                    torch.cuda.synchronize()
                    
                    elapsed = time.time() - start
                    return elapsed
                
                # Function to simulate Monte Carlo on multiple GPUs
                def simulate_multi_gpu(size=10000, iters=100):
                    gpu_count = torch.cuda.device_count()
                    chunk_size = size // gpu_count
                    results = []
                    
                    start = time.time()
                    
                    # Create processes for each GPU
                    futures = []
                    for i in range(gpu_count):
                        # In a real implementation, this would use multiprocessing
                        # Here we'll just loop through GPUs sequentially for testing
                        device = torch.device(f"cuda:{i}")
                        # Initialize random data for this GPU
                        data = torch.randn(chunk_size, 10, device=device)
                        
                        # Simulate calculations
                        for _ in range(iters):
                            # Emulate a Monte Carlo iteration
                            noise = torch.randn(chunk_size, 10, device=device)
                            result = data + noise
                            result = torch.sum(result ** 2, dim=1)
                            result = torch.sqrt(result)
                            # Get some stats
                            mean = torch.mean(result)
                            std = torch.std(result)
                        torch.cuda.synchronize()
                    
                    elapsed = time.time() - start
                    return elapsed
                
                # Run tests
                single_time = simulate_single_gpu()
                multi_time = simulate_multi_gpu()
                
                print(f"Single GPU time: {single_time:.4f} seconds")
                print(f"Multi-GPU time: {multi_time:.4f} seconds")
                print(f"Speedup: {single_time/multi_time:.2f}x")
                print(f"Efficiency: {(single_time/multi_time)/torch.cuda.device_count():.2f}")
                
        except ImportError:
            print("PyTorch not available, can't test multi-GPU performance")
        except Exception as e:
            print(f"Error testing multi-GPU performance: {e}")
    else:
        print("Multi-GPU support not available")
    
    # Test sampling methods
    print("\n===== Sampling Methods =====\n")
    for method in mc_config.get("available_sampling_methods", []):
        enum_value = get_sampling_method_enum(method)
        print(f"{method}: {enum_value}")
    
    print("\n=====================================\n")