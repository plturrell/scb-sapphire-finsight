#!/usr/bin/env python3
"""
Advanced Monte Carlo Engine for Financial Simulations
Implements multi-GPU, distributed computing, and variance reduction techniques
"""

import os
import time
import json
import logging
import numpy as np
from pathlib import Path
from typing import Dict, List, Tuple, Any, Optional, Union, Callable
from enum import Enum

# Conditionally import CUDA libraries
try:
    import torch
    import torch.nn as nn
    import torch.cuda as cuda
    import torch.distributed as dist
    from torch.nn.parallel import DistributedDataParallel as DDP
    TORCH_AVAILABLE = True
except ImportError:
    TORCH_AVAILABLE = False

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("Advanced-MonteCarlo")

class SamplingMethod(Enum):
    """Sampling methods for variance reduction"""
    STANDARD = "standard"  # Standard Monte Carlo
    STRATIFIED = "stratified"  # Stratified sampling
    LATIN_HYPERCUBE = "latin_hypercube"  # Latin Hypercube sampling
    QUASI_SOBOL = "quasi_sobol"  # Sobol sequences
    QUASI_HALTON = "quasi_halton"  # Halton sequences
    IMPORTANCE = "importance"  # Importance sampling
    CONTROL_VARIATE = "control_variate"  # Control variate method

class DistributionType(Enum):
    """Probability distribution types for risk factors"""
    NORMAL = "normal"
    LOGNORMAL = "lognormal"
    UNIFORM = "uniform"
    TRIANGULAR = "triangular"
    BETA = "beta"
    CUSTOM = "custom"

class AdvancedMonteCarloEngine:
    """
    Advanced Monte Carlo simulation engine with multi-GPU support,
    distributed computing capabilities, and variance reduction techniques
    """
    
    def __init__(
        self,
        config_path: Optional[str] = None,
        use_multi_gpu: bool = True,
        use_distributed: bool = False,
        master_addr: str = "localhost",
        master_port: str = "12355",
        sampling_method: SamplingMethod = SamplingMethod.STANDARD,
        use_domain_optimizations: bool = True,
        precision: str = "mixed"
    ):
        """
        Initialize the Monte Carlo engine
        
        Args:
            config_path: Path to configuration file
            use_multi_gpu: Whether to use multiple GPUs if available
            use_distributed: Whether to use distributed computing
            master_addr: Master address for distributed computing
            master_port: Master port for distributed computing
            sampling_method: Sampling method for variance reduction
            use_domain_optimizations: Whether to use financial domain optimizations
            precision: Computation precision ("mixed", "single", "double")
        """
        self.config = self._load_config(config_path)
        self.backend_type = "torch" if TORCH_AVAILABLE else "numpy"
        self.sampling_method = sampling_method
        self.use_domain_optimizations = use_domain_optimizations
        self.precision = precision
        self.use_multi_gpu = use_multi_gpu
        self.use_distributed = use_distributed
        
        # Setup device and distributed environment
        self.setup_environment(master_addr, master_port)
        
        # Create simulation counters and statistics
        self.total_iterations = 0
        self.computation_time = 0.0
        self.speedup_factor = 1.0
        
        # Register simulation variables and correlations
        self.variables = {}
        self.correlations = np.eye(0)  # Empty correlation matrix to start
        
        logger.info(f"Advanced Monte Carlo Engine initialized")
        logger.info(f"Sampling method: {sampling_method.value}")
        logger.info(f"Devices: {self.devices}")
        
    def _load_config(self, config_path: Optional[str] = None) -> Dict[str, Any]:
        """Load configuration from file or use defaults"""
        default_config = {
            "batch_size": 100000,
            "max_gpu_memory_fraction": 0.8,
            "checkpoint_interval": 1000000,
            "domain_optimizations": {
                "use_black_scholes": True,
                "use_heston_model": False,
                "use_jump_diffusion": False
            },
            "variance_reduction": {
                "stratification_factors": 5,
                "lhs_iterations": 1000,
                "sobol_skip": 1000,
                "importance_warmup": 10000
            },
            "multi_gpu": {
                "synchronization_interval": 5,
                "gradient_accumulation_steps": 1
            },
            "distributed": {
                "backend": "nccl",
                "init_method": "env://",
                "world_size": 1,
                "rank": 0
            },
            "numerical_precision": {
                "use_mixed_precision": True,
                "dtypes": {
                    "float32": {"torch": "float32", "numpy": "float32"},
                    "float16": {"torch": "float16", "numpy": "float16"},
                    "bfloat16": {"torch": "bfloat16", "numpy": "float32"}
                }
            }
        }
        
        if config_path and os.path.exists(config_path):
            try:
                with open(config_path, 'r') as f:
                    user_config = json.load(f)
                
                # Deep merge user config with defaults
                merged_config = self._deep_merge(default_config, user_config)
                logger.info(f"Loaded configuration from {config_path}")
                return merged_config
            except Exception as e:
                logger.error(f"Error loading config: {e}, using defaults")
                return default_config
        else:
            return default_config
    
    def _deep_merge(self, dict1: Dict, dict2: Dict) -> Dict:
        """Recursively merge two dictionaries"""
        result = dict1.copy()
        for key, value in dict2.items():
            if key in result and isinstance(result[key], dict) and isinstance(value, dict):
                result[key] = self._deep_merge(result[key], value)
            else:
                result[key] = value
        return result
    
    def setup_environment(self, master_addr: str, master_port: str) -> None:
        """Setup computation devices and distributed environment"""
        self.devices = []
        
        if not TORCH_AVAILABLE:
            logger.warning("PyTorch not available, using numpy for computations")
            self.devices = ["cpu"]
            self.main_device = "cpu"
            self.backend_type = "numpy"
            return
        
        # Set environment variables for distributed computing
        if self.use_distributed:
            os.environ["MASTER_ADDR"] = master_addr
            os.environ["MASTER_PORT"] = master_port
        
        # Check GPU availability
        if torch.cuda.is_available():
            self.backend_type = "torch"
            gpu_count = torch.cuda.device_count()
            
            if gpu_count > 0:
                if self.use_multi_gpu and gpu_count > 1:
                    logger.info(f"Using {gpu_count} GPUs")
                    self.devices = [f"cuda:{i}" for i in range(gpu_count)]
                else:
                    logger.info("Using single GPU")
                    self.devices = ["cuda:0"]
                
                self.main_device = self.devices[0]
                
                # Initialize distributed process group if needed
                if self.use_distributed:
                    try:
                        dist_backend = self.config["distributed"]["backend"]
                        dist.init_process_group(
                            backend=dist_backend,
                            init_method=self.config["distributed"]["init_method"],
                            world_size=self.config["distributed"]["world_size"],
                            rank=self.config["distributed"]["rank"]
                        )
                        logger.info(f"Distributed computing initialized with {dist_backend} backend")
                    except Exception as e:
                        logger.error(f"Failed to initialize distributed environment: {e}")
                        self.use_distributed = False
            else:
                logger.warning("No GPUs available, using CPU")
                self.devices = ["cpu"]
                self.main_device = "cpu"
        else:
            logger.warning("CUDA not available, using CPU")
            self.devices = ["cpu"]
            self.main_device = "cpu"
    
    def register_variable(
        self, 
        name: str, 
        distribution: DistributionType,
        params: Dict[str, Any],
        importance: float = 1.0
    ) -> None:
        """
        Register a simulation variable with its distribution
        
        Args:
            name: Variable name
            distribution: Type of probability distribution
            params: Distribution parameters
            importance: Relative importance for stratification (0-1)
        """
        self.variables[name] = {
            "distribution": distribution,
            "params": params,
            "importance": importance
        }
        
        # Reset correlation matrix when variables change
        var_count = len(self.variables)
        self.correlations = np.eye(var_count)
        
        logger.debug(f"Registered variable {name} with {distribution.value} distribution")
    
    def set_correlations(self, correlation_matrix: np.ndarray) -> None:
        """
        Set correlation matrix between variables
        
        Args:
            correlation_matrix: Correlation matrix (must be positive semi-definite)
        """
        var_count = len(self.variables)
        if correlation_matrix.shape != (var_count, var_count):
            raise ValueError(f"Correlation matrix must be {var_count}x{var_count}")
        
        # Validate correlation matrix
        if not self._is_positive_semidefinite(correlation_matrix):
            logger.warning("Correlation matrix is not positive semi-definite, adjusting...")
            correlation_matrix = self._adjust_to_psd(correlation_matrix)
        
        self.correlations = correlation_matrix
        logger.debug(f"Set correlation matrix for {var_count} variables")
    
    def _is_positive_semidefinite(self, matrix: np.ndarray) -> bool:
        """Check if matrix is positive semi-definite"""
        eigenvalues = np.linalg.eigvalsh(matrix)
        return np.all(eigenvalues >= -1e-10)
    
    def _adjust_to_psd(self, matrix: np.ndarray) -> np.ndarray:
        """Adjust matrix to nearest positive semi-definite matrix"""
        eigenvalues, eigenvectors = np.linalg.eigh(matrix)
        eigenvalues = np.maximum(eigenvalues, 0)
        return eigenvectors @ np.diag(eigenvalues) @ eigenvectors.T
    
    def _generate_samples(
        self, 
        sample_count: int, 
        device: str,
        use_correlated: bool = True
    ) -> Dict[str, np.ndarray]:
        """
        Generate random samples based on registered variables and correlations
        
        Args:
            sample_count: Number of samples to generate
            device: Device to generate samples on
            use_correlated: Whether to apply correlations
            
        Returns:
            Dictionary with variable names and sampled values
        """
        if self.backend_type == "numpy":
            return self._generate_samples_numpy(sample_count, use_correlated)
        else:
            return self._generate_samples_torch(sample_count, device, use_correlated)
    
    def _generate_samples_numpy(
        self, 
        sample_count: int,
        use_correlated: bool
    ) -> Dict[str, np.ndarray]:
        """Generate samples using numpy backend"""
        var_names = list(self.variables.keys())
        var_count = len(var_names)
        
        # Generate uncorrelated standard normal samples
        if self.sampling_method == SamplingMethod.STANDARD:
            # Standard Monte Carlo sampling
            standard_normal = np.random.standard_normal(size=(sample_count, var_count))
        
        elif self.sampling_method == SamplingMethod.STRATIFIED:
            # Stratified sampling
            strat_factors = self.config["variance_reduction"]["stratification_factors"]
            samples_per_stratum = sample_count // strat_factors
            
            standard_normal = np.zeros((sample_count, var_count))
            for i in range(strat_factors):
                # Generate samples for each stratum
                stratum_start = i * samples_per_stratum
                stratum_end = (i + 1) * samples_per_stratum if i < strat_factors - 1 else sample_count
                stratum_size = stratum_end - stratum_start
                
                # Define stratum bounds (divide normal distribution into strata)
                lower = norm.ppf(i / strat_factors)
                upper = norm.ppf((i + 1) / strat_factors)
                
                # Generate uniform samples within the stratum
                uniform_samples = np.random.uniform(
                    low=norm.cdf(lower),
                    high=norm.cdf(upper),
                    size=(stratum_size, var_count)
                )
                
                # Transform to normal distribution
                standard_normal[stratum_start:stratum_end] = norm.ppf(uniform_samples)
        
        elif self.sampling_method == SamplingMethod.LATIN_HYPERCUBE:
            # Latin Hypercube Sampling
            standard_normal = np.zeros((sample_count, var_count))
            
            for j in range(var_count):
                # Generate permutation of intervals
                perm = np.random.permutation(sample_count)
                
                # Generate uniform samples within each interval
                u = np.random.uniform(0, 1, size=sample_count)
                
                # Map to stratified intervals
                samples = (perm + u) / sample_count
                
                # Transform to normal distribution
                standard_normal[:, j] = norm.ppf(samples)
        
        elif self.sampling_method == SamplingMethod.QUASI_SOBOL:
            # Sobol sequences
            from scipy.stats import qmc
            
            # Skip initial points that may have poor distribution
            skip = self.config["variance_reduction"]["sobol_skip"]
            sampler = qmc.Sobol(d=var_count, scramble=True)
            uniform_samples = sampler.random_base2(m=int(np.log2(sample_count)))
            
            # Transform to normal distribution
            standard_normal = norm.ppf(uniform_samples)
        
        elif self.sampling_method == SamplingMethod.QUASI_HALTON:
            # Halton sequences
            from scipy.stats import qmc
            
            sampler = qmc.Halton(d=var_count, scramble=True)
            uniform_samples = sampler.random(n=sample_count)
            
            # Transform to normal distribution
            standard_normal = norm.ppf(uniform_samples)
        
        else:
            # Fallback to standard sampling
            standard_normal = np.random.standard_normal(size=(sample_count, var_count))
        
        # Apply correlations if requested
        if use_correlated and var_count > 1:
            # Cholesky decomposition of correlation matrix
            try:
                L = np.linalg.cholesky(self.correlations)
                # Apply correlation structure
                standard_normal = standard_normal @ L.T
            except np.linalg.LinAlgError:
                logger.warning("Cholesky decomposition failed, using uncorrelated samples")
        
        # Transform to target distributions
        result = {}
        for i, name in enumerate(var_names):
            var_info = self.variables[name]
            dist_type = var_info["distribution"]
            params = var_info["params"]
            
            if dist_type == DistributionType.NORMAL:
                # Normal distribution: mu + sigma * Z
                mu = params.get("mu", 0.0)
                sigma = params.get("sigma", 1.0)
                result[name] = mu + sigma * standard_normal[:, i]
                
            elif dist_type == DistributionType.LOGNORMAL:
                # Lognormal distribution: exp(mu + sigma * Z)
                mu = params.get("mu", 0.0)
                sigma = params.get("sigma", 1.0)
                result[name] = np.exp(mu + sigma * standard_normal[:, i])
                
            elif dist_type == DistributionType.UNIFORM:
                # Uniform distribution: a + (b-a) * Phi(Z)
                a = params.get("a", 0.0)
                b = params.get("b", 1.0)
                result[name] = a + (b - a) * norm.cdf(standard_normal[:, i])
                
            elif dist_type == DistributionType.TRIANGULAR:
                # Triangular distribution
                a = params.get("a", 0.0)
                b = params.get("b", 1.0)
                c = params.get("c", 0.5)
                
                # Convert normal to uniform
                u = norm.cdf(standard_normal[:, i])
                
                # Convert uniform to triangular
                fc = (c - a) / (b - a)
                mask = u < fc
                
                result[name] = np.zeros(sample_count)
                result[name][mask] = a + np.sqrt(u[mask] * (b - a) * (c - a))
                result[name][~mask] = b - np.sqrt((1 - u[~mask]) * (b - a) * (b - c))
                
            elif dist_type == DistributionType.BETA:
                # Beta distribution
                alpha = params.get("alpha", 1.0)
                beta = params.get("beta", 1.0)
                a = params.get("a", 0.0)
                b = params.get("b", 1.0)
                
                # Convert normal to beta
                from scipy.stats import beta
                u = norm.cdf(standard_normal[:, i])
                result[name] = a + (b - a) * beta.ppf(u, alpha, beta)
                
            elif dist_type == DistributionType.CUSTOM:
                # Custom distribution using provided inverse CDF function
                inv_cdf = params.get("inverse_cdf")
                if callable(inv_cdf):
                    u = norm.cdf(standard_normal[:, i])
                    result[name] = inv_cdf(u)
                else:
                    logger.error(f"Custom distribution for {name} has no valid inverse_cdf function")
                    result[name] = standard_normal[:, i]
            else:
                # Fallback to standard normal
                result[name] = standard_normal[:, i]
        
        return result
    
    def _generate_samples_torch(
        self, 
        sample_count: int,
        device: str,
        use_correlated: bool
    ) -> Dict[str, torch.Tensor]:
        """Generate samples using PyTorch backend"""
        var_names = list(self.variables.keys())
        var_count = len(var_names)
        
        # Get precision
        torch_dtype = torch.float32
        if self.precision == "mixed" or self.precision == "half":
            if torch.cuda.is_available() and device.startswith("cuda"):
                torch_dtype = torch.float16
        elif self.precision == "double":
            torch_dtype = torch.float64
        
        # Generate uncorrelated standard normal samples
        if self.sampling_method == SamplingMethod.STANDARD:
            # Standard Monte Carlo sampling
            standard_normal = torch.randn(
                (sample_count, var_count), 
                device=device, 
                dtype=torch_dtype
            )
        
        elif self.sampling_method == SamplingMethod.STRATIFIED:
            # Stratified sampling
            strat_factors = self.config["variance_reduction"]["stratification_factors"]
            samples_per_stratum = sample_count // strat_factors
            
            standard_normal = torch.zeros(
                (sample_count, var_count), 
                device=device, 
                dtype=torch_dtype
            )
            
            for i in range(strat_factors):
                # Generate samples for each stratum
                stratum_start = i * samples_per_stratum
                stratum_end = (i + 1) * samples_per_stratum if i < strat_factors - 1 else sample_count
                stratum_size = stratum_end - stratum_start
                
                # Define stratum bounds
                # For simplicity, we divide the range [-4, 4] into strata
                lower = -4.0 + i * 8.0 / strat_factors
                upper = -4.0 + (i + 1) * 8.0 / strat_factors
                
                # Generate uniform samples within the stratum
                uniform_samples = torch.rand(
                    (stratum_size, var_count), 
                    device=device, 
                    dtype=torch_dtype
                )
                
                # Scale to the stratum
                scaled_uniform = lower + (upper - lower) * uniform_samples
                
                # Assign to the main tensor
                standard_normal[stratum_start:stratum_end] = scaled_uniform
        
        elif self.sampling_method == SamplingMethod.LATIN_HYPERCUBE:
            # Latin Hypercube Sampling (LHS)
            standard_normal = torch.zeros(
                (sample_count, var_count), 
                device=device, 
                dtype=torch_dtype
            )
            
            # We need to do this on CPU as torch doesn't support all operations on GPU
            for j in range(var_count):
                # Generate permutation of intervals
                perm = torch.randperm(sample_count, device="cpu").to(device)
                
                # Generate uniform samples within each interval
                u = torch.rand(sample_count, device=device, dtype=torch_dtype)
                
                # Map to stratified intervals
                samples = (perm.float() + u) / float(sample_count)
                
                # Transform to approximate normal distribution using inverse CDF
                # This approximation avoids using torch.erfinv which may not be available on all devices
                samples = samples * 8.0 - 4.0  # Map [0,1] to [-4,4]
                standard_normal[:, j] = samples
        
        elif self.sampling_method == SamplingMethod.QUASI_SOBOL or self.sampling_method == SamplingMethod.QUASI_HALTON:
            # For quasi-random sequences, fall back to numpy implementation
            # and then convert to torch tensor
            if self.sampling_method == SamplingMethod.QUASI_SOBOL:
                from scipy.stats import qmc
                
                # Skip initial points that may have poor distribution
                skip = self.config["variance_reduction"]["sobol_skip"]
                sampler = qmc.Sobol(d=var_count, scramble=True)
                
                # Get next power of 2 for sample_count
                m = int(np.ceil(np.log2(sample_count)))
                uniform_samples = sampler.random_base2(m=m)
                
                # Truncate to desired sample count
                uniform_samples = uniform_samples[:sample_count]
            else:
                # Halton sequence
                from scipy.stats import qmc
                
                sampler = qmc.Halton(d=var_count, scramble=True)
                uniform_samples = sampler.random(n=sample_count)
            
            # Transform to approximate normal distribution
            standard_normal_np = norm.ppf(uniform_samples)
            
            # Convert to torch tensor and move to device
            standard_normal = torch.tensor(
                standard_normal_np, 
                device=device, 
                dtype=torch_dtype
            )
        
        else:
            # Fallback to standard sampling
            standard_normal = torch.randn(
                (sample_count, var_count), 
                device=device, 
                dtype=torch_dtype
            )
        
        # Apply correlations if requested
        if use_correlated and var_count > 1:
            # Cholesky decomposition of correlation matrix
            try:
                # Need to ensure correlation matrix is on the same device
                corr_tensor = torch.tensor(
                    self.correlations, 
                    device=device, 
                    dtype=torch_dtype
                )
                
                L = torch.linalg.cholesky(corr_tensor)
                # Apply correlation structure: Z' = Z * L^T
                standard_normal = torch.matmul(standard_normal, L.T)
            except RuntimeError:
                logger.warning("Cholesky decomposition failed, using uncorrelated samples")
        
        # Transform to target distributions
        result = {}
        for i, name in enumerate(var_names):
            var_info = self.variables[name]
            dist_type = var_info["distribution"]
            params = var_info["params"]
            
            if dist_type == DistributionType.NORMAL:
                # Normal distribution: mu + sigma * Z
                mu = params.get("mu", 0.0)
                sigma = params.get("sigma", 1.0)
                result[name] = mu + sigma * standard_normal[:, i]
                
            elif dist_type == DistributionType.LOGNORMAL:
                # Lognormal distribution: exp(mu + sigma * Z)
                mu = params.get("mu", 0.0)
                sigma = params.get("sigma", 1.0)
                result[name] = torch.exp(mu + sigma * standard_normal[:, i])
                
            elif dist_type == DistributionType.UNIFORM:
                # Uniform distribution: a + (b-a) * Phi(Z)
                a = params.get("a", 0.0)
                b = params.get("b", 1.0)
                
                # Approximate normal CDF
                uniform = 0.5 * (1.0 + torch.erf(standard_normal[:, i] / math.sqrt(2.0)))
                result[name] = a + (b - a) * uniform
                
            elif dist_type == DistributionType.TRIANGULAR or dist_type == DistributionType.BETA or dist_type == DistributionType.CUSTOM:
                # For complex distributions, convert to numpy, compute, and convert back
                # This is inefficient but ensures correctness
                Z_np = standard_normal[:, i].cpu().numpy()
                
                if dist_type == DistributionType.TRIANGULAR:
                    # Triangular distribution
                    a = params.get("a", 0.0)
                    b = params.get("b", 1.0)
                    c = params.get("c", 0.5)
                    
                    # Convert normal to uniform
                    u = norm.cdf(Z_np)
                    
                    # Convert uniform to triangular
                    fc = (c - a) / (b - a)
                    mask = u < fc
                    
                    result_np = np.zeros(sample_count)
                    result_np[mask] = a + np.sqrt(u[mask] * (b - a) * (c - a))
                    result_np[~mask] = b - np.sqrt((1 - u[~mask]) * (b - a) * (b - c))
                    
                elif dist_type == DistributionType.BETA:
                    # Beta distribution
                    alpha = params.get("alpha", 1.0)
                    beta_param = params.get("beta", 1.0)
                    a = params.get("a", 0.0)
                    b = params.get("b", 1.0)
                    
                    # Convert normal to beta
                    from scipy.stats import beta
                    u = norm.cdf(Z_np)
                    result_np = a + (b - a) * beta.ppf(u, alpha, beta_param)
                    
                elif dist_type == DistributionType.CUSTOM:
                    # Custom distribution using provided inverse CDF function
                    inv_cdf = params.get("inverse_cdf")
                    if callable(inv_cdf):
                        u = norm.cdf(Z_np)
                        result_np = inv_cdf(u)
                    else:
                        logger.error(f"Custom distribution for {name} has no valid inverse_cdf function")
                        result_np = Z_np
                
                # Convert back to torch tensor
                result[name] = torch.tensor(
                    result_np, 
                    device=device, 
                    dtype=torch_dtype
                )
            else:
                # Fallback to standard normal
                result[name] = standard_normal[:, i]
        
        return result
    
    def run_simulation(
        self,
        simulation_function: Callable,
        iterations: int,
        outputs: List[str],
        additional_args: Dict[str, Any] = None,
        batch_size: Optional[int] = None,
        save_results: bool = True,
        output_file: Optional[str] = None,
        distributed_sync_interval: int = 10,
        show_progress: bool = True,
        return_samples: bool = False
    ) -> Dict[str, Any]:
        """
        Run Monte Carlo simulation with the provided function
        
        Args:
            simulation_function: Function that takes samples and returns simulation results
            iterations: Total number of iterations to run
            outputs: Names of output variables
            additional_args: Additional arguments to pass to simulation function
            batch_size: Batch size for processing (default from config)
            save_results: Whether to save results to file
            output_file: Output file path (default is timestamped file in results directory)
            distributed_sync_interval: How often to synchronize in distributed mode
            show_progress: Whether to show progress during simulation
            return_samples: Whether to return all samples (warning: large memory usage)
            
        Returns:
            Simulation results dictionary
        """
        # Use default batch size if not specified
        if batch_size is None:
            batch_size = self.config["batch_size"]
        
        # Check if we have variables defined
        if not self.variables:
            raise ValueError("No variables defined for simulation")
        
        # Calculate number of batches
        num_batches = (iterations + batch_size - 1) // batch_size
        
        # Initialize storage for outputs
        all_outputs = {output: [] for output in outputs}
        all_samples = {name: [] for name in self.variables.keys()} if return_samples else None
        
        # Record start time
        start_time = time.time()
        
        # Distribute batches across devices
        device_batch_counts = self._distribute_batches(num_batches)
        
        # Run simulation on each device
        results_per_device = []
        
        for device_idx, device in enumerate(self.devices):
            device_results = self._run_device_simulation(
                device=device,
                device_batch_count=device_batch_counts[device_idx],
                batch_size=batch_size,
                simulation_function=simulation_function,
                outputs=outputs,
                additional_args=additional_args,
                all_samples=all_samples,
                distributed_sync_interval=distributed_sync_interval,
                show_progress=show_progress and device_idx == 0  # Only show progress for first device
            )
            results_per_device.append(device_results)
        
        # Combine results from all devices
        for output in outputs:
            for device_results in results_per_device:
                if output in device_results:
                    all_outputs[output].extend(device_results[output])
        
        # Convert output lists to numpy arrays for statistics calculation
        output_arrays = {}
        for output in outputs:
            # Ensure we have results
            if all_outputs[output]:
                if self.backend_type == "torch":
                    # Move to CPU and convert to numpy
                    all_outputs[output] = [
                        x.cpu().numpy() if isinstance(x, torch.Tensor) else x 
                        for x in all_outputs[output]
                    ]
                
                output_arrays[output] = np.concatenate(all_outputs[output])
            else:
                output_arrays[output] = np.array([])
        
        # Calculate statistics
        statistics = {}
        for output in outputs:
            if len(output_arrays[output]) > 0:
                statistics[output] = self._calculate_statistics(output_arrays[output])
            else:
                statistics[output] = {
                    "mean": 0.0,
                    "std": 0.0,
                    "min": 0.0,
                    "max": 0.0,
                    "percentiles": {
                        "1": 0.0,
                        "5": 0.0,
                        "25": 0.0,
                        "50": 0.0,
                        "75": 0.0,
                        "95": 0.0,
                        "99": 0.0
                    }
                }
        
        # Record end time and computation statistics
        end_time = time.time()
        computation_time = end_time - start_time
        self.computation_time = computation_time
        self.total_iterations += iterations
        
        # Calculate speedup (estimated)
        reference_time_per_iter = 0.0001  # 0.1ms per iteration on reference CPU
        estimated_cpu_time = iterations * reference_time_per_iter
        self.speedup_factor = estimated_cpu_time / computation_time if computation_time > 0 else 1.0
        
        # Prepare final results
        results = {
            "outputs": {
                name: arrays.tolist() if return_samples else None for name, arrays in output_arrays.items()
            },
            "statistics": statistics,
            "sample_count": iterations,
            "actual_count": sum(len(output_arrays[output]) for output in outputs) // len(outputs),
            "computation_time": computation_time,
            "iterations_per_second": iterations / computation_time if computation_time > 0 else 0,
            "start_time": time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(start_time)),
            "end_time": time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(end_time)),
            "sampling_method": self.sampling_method.value,
            "devices_used": self.devices,
            "multi_gpu": self.use_multi_gpu,
            "distributed": self.use_distributed,
            "backend": self.backend_type,
            "estimated_speedup": self.speedup_factor
        }
        
        # Add domain-specific metrics if financial domain optimizations are enabled
        if self.use_domain_optimizations:
            for output in outputs:
                if output.endswith("_return") and len(output_arrays[output]) > 0:
                    # Calculate financial metrics
                    financial_metrics = self._calculate_financial_metrics(output_arrays[output])
                    results["statistics"][output].update(financial_metrics)
        
        # Save results to file if requested
        if save_results:
            if output_file is None:
                # Generate timestamped filename
                timestamp = time.strftime("%Y%m%d_%H%M%S")
                output_file = f"monte_carlo_{timestamp}.json"
                results_dir = Path(__file__).parent.parent / "results"
                output_path = results_dir / output_file
                os.makedirs(results_dir, exist_ok=True)
            else:
                output_path = Path(output_file)
                os.makedirs(output_path.parent, exist_ok=True)
            
            # Save results (exclude large arrays if not requested)
            save_data = results.copy()
            if not return_samples:
                save_data["outputs"] = "Output arrays not saved"
            
            with open(output_path, "w") as f:
                json.dump(save_data, f, indent=2)
            
            logger.info(f"Saved simulation results to {output_path}")
        
        # Include samples if requested
        if return_samples and all_samples:
            # Convert sample lists to numpy arrays
            sample_arrays = {}
            for name in self.variables.keys():
                # Ensure we have samples
                if all_samples[name]:
                    if self.backend_type == "torch":
                        # Move to CPU and convert to numpy
                        all_samples[name] = [
                            x.cpu().numpy() if isinstance(x, torch.Tensor) else x 
                            for x in all_samples[name]
                        ]
                    
                    sample_arrays[name] = np.concatenate(all_samples[name])
                else:
                    sample_arrays[name] = np.array([])
            
            results["samples"] = {
                name: arrays.tolist() for name, arrays in sample_arrays.items()
            }
        
        logger.info(f"Simulation completed. {iterations} iterations in {computation_time:.2f} seconds")
        logger.info(f"Speed: {iterations / computation_time:.2f} iterations/second")
        
        return results
    
    def _distribute_batches(self, num_batches: int) -> List[int]:
        """Distribute batches across devices"""
        if len(self.devices) == 1:
            return [num_batches]
        
        # Simple even distribution
        batch_counts = [num_batches // len(self.devices)] * len(self.devices)
        
        # Distribute remainder
        remainder = num_batches % len(self.devices)
        for i in range(remainder):
            batch_counts[i] += 1
        
        return batch_counts
    
    def _run_device_simulation(
        self,
        device: str,
        device_batch_count: int,
        batch_size: int,
        simulation_function: Callable,
        outputs: List[str],
        additional_args: Dict[str, Any],
        all_samples: Optional[Dict[str, List]] = None,
        distributed_sync_interval: int = 10,
        show_progress: bool = True
    ) -> Dict[str, List]:
        """Run simulation on a specific device"""
        # Initialize storage for outputs
        device_outputs = {output: [] for output in outputs}
        
        # Additional args or empty dict
        if additional_args is None:
            additional_args = {}
        
        # Enable mixed precision if requested
        amp_enabled = (
            self.precision == "mixed" and
            self.backend_type == "torch" and
            device.startswith("cuda")
        )
        
        # Use domain-specific optimizations if enabled
        domain_opt = self.use_domain_optimizations
        
        if self.backend_type == "torch":
            # Set default torch dtype for device
            torch_dtype = torch.float32
            if self.precision == "double":
                torch_dtype = torch.float64
            elif self.precision == "half" and device.startswith("cuda"):
                torch_dtype = torch.float16
        
        # Process each batch
        for batch_idx in range(device_batch_count):
            # For last batch, adjust size if needed
            current_batch_size = min(batch_size, batch_size)
            
            # Generate samples for this batch
            samples = self._generate_samples(current_batch_size, device, use_correlated=True)
            
            # Keep samples if requested
            if all_samples is not None:
                for name, sample_array in samples.items():
                    all_samples[name].append(sample_array)
            
            # Execute simulation function
            if self.backend_type == "torch" and amp_enabled:
                with torch.cuda.amp.autocast():
                    batch_results = simulation_function(samples, additional_args)
            else:
                batch_results = simulation_function(samples, additional_args)
            
            # Store results
            for output in outputs:
                if output in batch_results:
                    device_outputs[output].append(batch_results[output])
            
            # Distributed synchronization if needed
            if (
                self.use_distributed and 
                (batch_idx + 1) % distributed_sync_interval == 0
            ):
                dist.barrier()  # Synchronize processes
            
            # Show progress
            if show_progress and (batch_idx + 1) % 10 == 0:
                progress = (batch_idx + 1) / device_batch_count * 100
                logger.info(f"Progress on {device}: {progress:.1f}% ({batch_idx + 1}/{device_batch_count})")
        
        return device_outputs
    
    def _calculate_statistics(self, data: np.ndarray) -> Dict[str, Any]:
        """Calculate statistics for simulation results"""
        # Basic statistics
        stats = {
            "mean": float(np.mean(data)),
            "std": float(np.std(data)),
            "min": float(np.min(data)),
            "max": float(np.max(data)),
            "percentiles": {
                "1": float(np.percentile(data, 1)),
                "5": float(np.percentile(data, 5)),
                "25": float(np.percentile(data, 25)),
                "50": float(np.percentile(data, 50)),  # median
                "75": float(np.percentile(data, 75)),
                "95": float(np.percentile(data, 95)),
                "99": float(np.percentile(data, 99))
            }
        }
        
        # Calculate confidence intervals
        n = len(data)
        if n > 30:  # Only calculate if we have enough samples
            std_error = stats["std"] / np.sqrt(n)
            
            # 95% confidence interval
            stats["confidence_interval_95"] = {
                "lower": float(stats["mean"] - 1.96 * std_error),
                "upper": float(stats["mean"] + 1.96 * std_error)
            }
            
            # 99% confidence interval
            stats["confidence_interval_99"] = {
                "lower": float(stats["mean"] - 2.576 * std_error),
                "upper": float(stats["mean"] + 2.576 * std_error)
            }
        
        return stats
    
    def _calculate_financial_metrics(self, returns: np.ndarray) -> Dict[str, Any]:
        """Calculate financial metrics for returns"""
        metrics = {}
        
        # Sharpe Ratio (assuming returns are excess returns)
        if len(returns) > 0:
            mean_return = np.mean(returns)
            std_return = np.std(returns)
            
            if std_return > 0:
                metrics["sharpe_ratio"] = float(mean_return / std_return)
            else:
                metrics["sharpe_ratio"] = 0.0
        
        # Value at Risk (VaR)
        metrics["var_95"] = float(-np.percentile(returns, 5))  # 95% VaR
        metrics["var_99"] = float(-np.percentile(returns, 1))  # 99% VaR
        
        # Conditional Value at Risk (CVaR) / Expected Shortfall
        var_95_threshold = -metrics["var_95"]
        var_99_threshold = -metrics["var_99"]
        
        below_var_95 = returns[returns <= var_95_threshold]
        below_var_99 = returns[returns <= var_99_threshold]
        
        if len(below_var_95) > 0:
            metrics["cvar_95"] = float(-np.mean(below_var_95))
        else:
            metrics["cvar_95"] = metrics["var_95"]
            
        if len(below_var_99) > 0:
            metrics["cvar_99"] = float(-np.mean(below_var_99))
        else:
            metrics["cvar_99"] = metrics["var_99"]
        
        # Maximum Drawdown (if returns represent a time series)
        # For Monte Carlo simulations, we might not have time series
        # This approximation treats the returns as independent scenarios
        sorted_returns = np.sort(returns)
        worst_case_sum = np.sum(sorted_returns[:min(252, len(sorted_returns))])
        metrics["approx_max_drawdown"] = float(worst_case_sum)
        
        return metrics
    
    def tariff_impact_simulation(
        self, 
        samples: Dict[str, Any],
        additional_args: Dict[str, Any]
    ) -> Dict[str, np.ndarray]:
        """
        Specialized simulation function for tariff impact analysis
        
        Args:
            samples: Dictionary of input samples
            additional_args: Additional arguments for simulation
                - baseline_revenue: Company's baseline revenue
                - us_export_percentage: Percentage of exports to US
                - baseline_costs: Baseline costs
                
        Returns:
            Dictionary of output arrays
        """
        # Extract samples
        tariff_rate = samples.get("tariff_rate")
        negotiation_success = samples.get("negotiation_success")
        market_adaptability = samples.get("market_adaptability")
        competitor_response = samples.get("competitor_response")
        alternative_market_growth = samples.get("alternative_market_growth")
        
        # Extract additional arguments
        baseline_revenue = additional_args.get("baseline_revenue", 60000000000)
        us_export_percentage = additional_args.get("us_export_percentage", 35.0)
        baseline_costs = additional_args.get("baseline_costs", baseline_revenue * 0.85)
        
        # Calculate revenue at risk
        revenue_at_risk = baseline_revenue * (us_export_percentage / 100.0)
        
        # If using PyTorch, move to appropriate device and dtype
        if self.backend_type == "torch":
            # Determine device and dtype
            device = tariff_rate.device
            dtype = tariff_rate.dtype
            
            # Convert any numpy arrays to torch tensors
            if isinstance(baseline_revenue, (int, float)):
                baseline_revenue = torch.tensor(baseline_revenue, device=device, dtype=dtype)
            if isinstance(revenue_at_risk, (int, float)):
                revenue_at_risk = torch.tensor(revenue_at_risk, device=device, dtype=dtype)
            if isinstance(baseline_costs, (int, float)):
                baseline_costs = torch.tensor(baseline_costs, device=device, dtype=dtype)
            
            # Handle effective tariff rates based on negotiation success
            effective_tariff_rates = torch.where(
                negotiation_success,
                tariff_rate * 0.3,  # Reduced tariff rate if negotiations succeed
                tariff_rate
            )
            
            # Direct tariff costs
            direct_tariff_costs = revenue_at_risk * effective_tariff_rates / 100.0
            
            # Market adaptation factor
            market_adaptation_factor = market_adaptability
            
            # Calculate market share loss
            market_share_loss = revenue_at_risk * (
                0.4 * effective_tariff_rates / 100.0 * (1.0 - market_adaptation_factor)
            )
            
            # Alternative market offset (recovery through other markets)
            alternative_market_offset = market_share_loss * alternative_market_growth * 0.6
            
            # Competitor pressure impact
            competitor_impact = revenue_at_risk * 0.15 * competitor_response * effective_tariff_rates / 100.0
            
            # Calculate total direct financial impact
            direct_financial_impact = -(
                direct_tariff_costs + 
                market_share_loss + 
                competitor_impact - 
                alternative_market_offset
            )
            
            # Calculate indirect effects (e.g., on suppliers, etc.)
            indirect_factor = 0.2 + 0.1 * effective_tariff_rates / 100.0
            indirect_impact = direct_financial_impact * indirect_factor
            
            # Calculate total financial impact
            total_financial_impact = direct_financial_impact + indirect_impact
            
            # Calculate impact as percentage of baseline revenue
            percentage_impact = total_financial_impact / baseline_revenue * 100.0
            
            # Calculate new profit
            baseline_profit = baseline_revenue - baseline_costs
            new_profit = baseline_profit + total_financial_impact
            
            # Calculate profit impact percentage
            profit_impact_percentage = (
                (new_profit - baseline_profit) / baseline_profit * 100.0
                if baseline_profit > 0 else 
                torch.zeros_like(new_profit)
            )
            
        else:
            # NumPy implementation
            # Handle effective tariff rates based on negotiation success
            effective_tariff_rates = np.where(
                negotiation_success,
                tariff_rate * 0.3,  # Reduced tariff rate if negotiations succeed
                tariff_rate
            )
            
            # Direct tariff costs
            direct_tariff_costs = revenue_at_risk * effective_tariff_rates / 100.0
            
            # Market adaptation factor
            market_adaptation_factor = market_adaptability
            
            # Calculate market share loss
            market_share_loss = revenue_at_risk * (
                0.4 * effective_tariff_rates / 100.0 * (1.0 - market_adaptation_factor)
            )
            
            # Alternative market offset (recovery through other markets)
            alternative_market_offset = market_share_loss * alternative_market_growth * 0.6
            
            # Competitor pressure impact
            competitor_impact = revenue_at_risk * 0.15 * competitor_response * effective_tariff_rates / 100.0
            
            # Calculate total direct financial impact
            direct_financial_impact = -(
                direct_tariff_costs + 
                market_share_loss + 
                competitor_impact - 
                alternative_market_offset
            )
            
            # Calculate indirect effects (e.g., on suppliers, etc.)
            indirect_factor = 0.2 + 0.1 * effective_tariff_rates / 100.0
            indirect_impact = direct_financial_impact * indirect_factor
            
            # Calculate total financial impact
            total_financial_impact = direct_financial_impact + indirect_impact
            
            # Calculate impact as percentage of baseline revenue
            percentage_impact = total_financial_impact / baseline_revenue * 100.0
            
            # Calculate new profit
            baseline_profit = baseline_revenue - baseline_costs
            new_profit = baseline_profit + total_financial_impact
            
            # Calculate profit impact percentage
            profit_impact_percentage = np.where(
                baseline_profit > 0,
                (new_profit - baseline_profit) / baseline_profit * 100.0,
                np.zeros_like(new_profit)
            )
        
        # Return all outputs
        return {
            "direct_financial_impact": direct_financial_impact,
            "indirect_impact": indirect_impact,
            "total_financial_impact": total_financial_impact,
            "percentage_impact": percentage_impact,
            "new_profit": new_profit,
            "profit_impact_percentage": profit_impact_percentage
        }

# Example usage
if __name__ == "__main__":
    # Create Monte Carlo engine
    engine = AdvancedMonteCarloEngine(
        use_multi_gpu=True,
        sampling_method=SamplingMethod.LATIN_HYPERCUBE,
        use_domain_optimizations=True
    )
    
    # Register variables for tariff impact simulation
    engine.register_variable(
        name="tariff_rate",
        distribution=DistributionType.NORMAL,
        params={"mu": 46.0, "sigma": 5.0},
        importance=1.0
    )
    
    engine.register_variable(
        name="negotiation_success",
        distribution=DistributionType.UNIFORM,
        params={"a": 0.0, "b": 1.0},  # Will be thresholded in the simulation
        importance=0.8
    )
    
    engine.register_variable(
        name="market_adaptability",
        distribution=DistributionType.BETA,
        params={"alpha": 2.0, "beta": 2.0, "a": 0.0, "b": 1.0},
        importance=0.9
    )
    
    engine.register_variable(
        name="competitor_response",
        distribution=DistributionType.BETA,
        params={"alpha": 1.5, "beta": 3.0, "a": 0.0, "b": 1.0},
        importance=0.7
    )
    
    engine.register_variable(
        name="alternative_market_growth",
        distribution=DistributionType.BETA,
        params={"alpha": 2.0, "beta": 3.0, "a": 0.0, "b": 1.0},
        importance=0.6
    )
    
    # Set correlations between variables
    correlation_matrix = np.array([
        [1.0, -0.2, 0.3, 0.1, 0.2],  # tariff_rate
        [-0.2, 1.0, 0.0, -0.1, 0.0],  # negotiation_success
        [0.3, 0.0, 1.0, 0.2, 0.4],  # market_adaptability
        [0.1, -0.1, 0.2, 1.0, 0.1],  # competitor_response
        [0.2, 0.0, 0.4, 0.1, 1.0]   # alternative_market_growth
    ])
    engine.set_correlations(correlation_matrix)
    
    # Setup additional arguments for the simulation
    additional_args = {
        "baseline_revenue": 60000000000,  # $60B
        "us_export_percentage": 35.0,
        "baseline_costs": 51000000000  # $51B (85% of revenue)
    }
    
    # Run simulation
    outputs = [
        "direct_financial_impact",
        "indirect_impact",
        "total_financial_impact",
        "percentage_impact",
        "new_profit",
        "profit_impact_percentage"
    ]
    
    results = engine.run_simulation(
        simulation_function=engine.tariff_impact_simulation,
        iterations=100000,
        outputs=outputs,
        additional_args=additional_args,
        batch_size=10000,
        save_results=True,
        output_file=None,  # Auto-generate filename
        show_progress=True
    )
    
    # Print summary of results
    print("\n===== Tariff Impact Simulation Results =====\n")
    print(f"Total Financial Impact: ${results['statistics']['total_financial_impact']['mean']/1000000000:.2f}B")
    print(f"95% Confidence Interval: (${results['statistics']['total_financial_impact']['percentiles']['5']/1000000000:.2f}B to ${results['statistics']['total_financial_impact']['percentiles']['95']/1000000000:.2f}B)")
    print(f"Impact as % of Revenue: {results['statistics']['percentage_impact']['mean']:.2f}%")
    print(f"Profit Impact: {results['statistics']['profit_impact_percentage']['mean']:.2f}%")
    
    print("\nComputation Statistics:")
    print(f"- Iterations: {results['sample_count']}")
    print(f"- Time: {results['computation_time']:.2f} seconds")
    print(f"- Speed: {results['iterations_per_second']:.2f} iterations/second")
    print(f"- Sampling method: {results['sampling_method']}")
    print(f"- Devices used: {results['devices_used']}")
    print(f"- Estimated speedup: {results['estimated_speedup']:.2f}x")
    
    print("\nFinancial Risk Metrics:")
    print(f"- Value at Risk (95%): ${results['statistics']['total_financial_impact']['var_95']/1000000000:.2f}B")
    print(f"- Expected Shortfall (95%): ${results['statistics']['total_financial_impact']['cvar_95']/1000000000:.2f}B")