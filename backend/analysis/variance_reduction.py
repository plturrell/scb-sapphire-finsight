#!/usr/bin/env python3
"""
Variance Reduction Techniques for Monte Carlo Simulations
Implements advanced methods for more efficient simulations:
- Quasi-Monte Carlo methods with Sobol and Halton sequences
- Stratified sampling
- Latin Hypercube Sampling
- Importance sampling
- Control variates
"""

import numpy as np
from typing import Dict, List, Tuple, Any, Optional, Union, Callable
from enum import Enum
import logging
from scipy import stats

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("VarianceReduction")

class SamplingMethod(Enum):
    """Available sampling methods"""
    STANDARD = "standard"  # Standard Monte Carlo
    STRATIFIED = "stratified"  # Stratified sampling
    LATIN_HYPERCUBE = "latin_hypercube"  # Latin Hypercube sampling
    QUASI_SOBOL = "sobol"  # Sobol sequences
    QUASI_HALTON = "halton"  # Halton sequences
    IMPORTANCE = "importance"  # Importance sampling
    CONTROL_VARIATE = "control_variate"  # Control variate method

class SobolSequenceGenerator:
    """
    Sobol sequence generator for quasi-Monte Carlo simulation
    
    Sobol sequences are low-discrepancy sequences that provide better
    coverage of the sampling space than pseudo-random numbers, leading
    to faster convergence for integration problems.
    """
    
    def __init__(self, dimensions: int, skip: int = 1000):
        """
        Initialize Sobol sequence generator
        
        Args:
            dimensions: Number of dimensions (variables)
            skip: Number of initial points to skip
        """
        self.dimensions = dimensions
        self.skip = skip
        self.initialized = False
        self._init_sobol()
    
    def _init_sobol(self) -> None:
        """Initialize the Sobol sequence generator"""
        try:
            from scipy.stats import qmc
            self.sampler = qmc.Sobol(d=self.dimensions, scramble=True)
            # Skip initial points as they may have poor distribution
            if self.skip > 0:
                self.sampler.fast_forward(self.skip)
            self.initialized = True
        except ImportError:
            logger.warning("scipy.stats.qmc not available, falling back to numpy random")
            self.initialized = False
    
    def generate(self, n_points: int) -> np.ndarray:
        """
        Generate Sobol sequence
        
        Args:
            n_points: Number of points to generate
            
        Returns:
            Array of shape (n_points, dimensions) with values in [0, 1)
        """
        if not self.initialized:
            # Fall back to random sampling
            return np.random.random(size=(n_points, self.dimensions))
        
        # For best results with Sobol, use power of 2
        m = int(np.ceil(np.log2(n_points)))
        points = self.sampler.random_base2(m=m)
        
        # Truncate to the requested number of points
        return points[:n_points]
    
    def generate_normal(self, n_points: int, mean: float = 0.0, std: float = 1.0) -> np.ndarray:
        """
        Generate Sobol sequence with normal distribution
        
        Args:
            n_points: Number of points to generate
            mean: Mean of normal distribution
            std: Standard deviation of normal distribution
            
        Returns:
            Array of shape (n_points, dimensions) with normal distribution
        """
        uniform_samples = self.generate(n_points)
        
        # Transform to standard normal using inverse CDF
        return stats.norm.ppf(uniform_samples) * std + mean

class HaltonSequenceGenerator:
    """
    Halton sequence generator for quasi-Monte Carlo simulation
    
    Halton sequences are low-discrepancy sequences that provide better
    coverage of the sampling space than pseudo-random numbers. They are
    particularly useful for moderate dimensions.
    """
    
    def __init__(self, dimensions: int, scramble: bool = True):
        """
        Initialize Halton sequence generator
        
        Args:
            dimensions: Number of dimensions (variables)
            scramble: Whether to use scrambled Halton sequence
        """
        self.dimensions = dimensions
        self.scramble = scramble
        self.initialized = False
        self._init_halton()
    
    def _init_halton(self) -> None:
        """Initialize the Halton sequence generator"""
        try:
            from scipy.stats import qmc
            self.sampler = qmc.Halton(d=self.dimensions, scramble=self.scramble)
            self.initialized = True
        except ImportError:
            logger.warning("scipy.stats.qmc not available, falling back to numpy random")
            self.initialized = False
    
    def generate(self, n_points: int) -> np.ndarray:
        """
        Generate Halton sequence
        
        Args:
            n_points: Number of points to generate
            
        Returns:
            Array of shape (n_points, dimensions) with values in [0, 1)
        """
        if not self.initialized:
            # Fall back to random sampling
            return np.random.random(size=(n_points, self.dimensions))
        
        return self.sampler.random(n=n_points)
    
    def generate_normal(self, n_points: int, mean: float = 0.0, std: float = 1.0) -> np.ndarray:
        """
        Generate Halton sequence with normal distribution
        
        Args:
            n_points: Number of points to generate
            mean: Mean of normal distribution
            std: Standard deviation of normal distribution
            
        Returns:
            Array of shape (n_points, dimensions) with normal distribution
        """
        uniform_samples = self.generate(n_points)
        
        # Transform to standard normal using inverse CDF
        return stats.norm.ppf(uniform_samples) * std + mean

class LatinHypercubeSampler:
    """
    Latin Hypercube Sampling (LHS) for Monte Carlo simulation
    
    LHS ensures that each variable's range is divided into equal 
    probability intervals, and exactly one sample is taken from each 
    interval, providing better coverage of the parameter space.
    """
    
    def __init__(self, dimensions: int, optimize: bool = True):
        """
        Initialize Latin Hypercube sampler
        
        Args:
            dimensions: Number of dimensions (variables)
            optimize: Whether to optimize the sampling (reduce correlation)
        """
        self.dimensions = dimensions
        self.optimize = optimize
        self.initialized = False
        self._init_lhs()
    
    def _init_lhs(self) -> None:
        """Initialize the Latin Hypercube sampler"""
        try:
            from scipy.stats import qmc
            self.sampler = qmc.LatinHypercube(d=self.dimensions, optimization=self.optimize)
            self.initialized = True
        except ImportError:
            logger.warning("scipy.stats.qmc not available, using custom LHS implementation")
            self.initialized = False
    
    def generate(self, n_points: int) -> np.ndarray:
        """
        Generate Latin Hypercube samples
        
        Args:
            n_points: Number of points to generate
            
        Returns:
            Array of shape (n_points, dimensions) with values in [0, 1)
        """
        if self.initialized:
            return self.sampler.random(n=n_points)
        else:
            # Custom LHS implementation
            result = np.zeros((n_points, self.dimensions))
            
            # Generate samples for each dimension
            for i in range(self.dimensions):
                # Generate random permutation of intervals
                perms = np.random.permutation(n_points)
                
                # Generate uniform random sample within each interval
                u = np.random.random(n_points)
                
                # Combine to get stratified samples
                result[:, i] = (perms + u) / n_points
            
            # Optimize to reduce correlation if requested
            if self.optimize:
                self._optimize_lhs(result)
                
            return result
    
    def _optimize_lhs(self, samples: np.ndarray) -> None:
        """
        Optimize Latin Hypercube samples to reduce correlation
        
        Uses a simplified version of iterative selection algorithm
        
        Args:
            samples: Samples to optimize (modified in-place)
        """
        n_points, dims = samples.shape
        
        # Only optimize if we have multiple dimensions
        if dims < 2:
            return
        
        # Simple optimization: column-by-column approach
        # For each column, swap points to minimize correlation with previous columns
        for i in range(1, dims):
            # Calculate correlation with previous columns
            initial_corr = np.max(np.abs(np.corrcoef(samples[:, :i].T, samples[:, i])[:-1, -1]))
            
            # Try to reduce correlation through swaps
            for _ in range(min(100, n_points * 5)):
                # Select two random points
                idx1, idx2 = np.random.choice(n_points, 2, replace=False)
                
                # Swap their values in this dimension
                samples[idx1, i], samples[idx2, i] = samples[idx2, i], samples[idx1, i]
                
                # Calculate new correlation
                new_corr = np.max(np.abs(np.corrcoef(samples[:, :i].T, samples[:, i])[:-1, -1]))
                
                # If correlation increased, revert the swap
                if new_corr > initial_corr:
                    samples[idx1, i], samples[idx2, i] = samples[idx2, i], samples[idx1, i]
                else:
                    initial_corr = new_corr
    
    def generate_normal(self, n_points: int, mean: float = 0.0, std: float = 1.0) -> np.ndarray:
        """
        Generate Latin Hypercube samples with normal distribution
        
        Args:
            n_points: Number of points to generate
            mean: Mean of normal distribution
            std: Standard deviation of normal distribution
            
        Returns:
            Array of shape (n_points, dimensions) with normal distribution
        """
        uniform_samples = self.generate(n_points)
        
        # Transform to standard normal using inverse CDF
        return stats.norm.ppf(uniform_samples) * std + mean

class StratifiedSampler:
    """
    Stratified sampling for Monte Carlo simulation
    
    Divides the sample space into strata and samples from each stratum,
    which can reduce variance when the strata are chosen appropriately.
    """
    
    def __init__(self, dimensions: int, strata_per_dim: int = 5):
        """
        Initialize stratified sampler
        
        Args:
            dimensions: Number of dimensions (variables)
            strata_per_dim: Number of strata per dimension
        """
        self.dimensions = dimensions
        self.strata_per_dim = strata_per_dim
        
        # Calculate total number of strata
        self.total_strata = strata_per_dim ** dimensions
        
        # Check if total strata is reasonable
        if self.total_strata > 10000 and dimensions > 2:
            logger.warning(
                f"Stratified sampling with {dimensions} dimensions and {strata_per_dim} strata per dimension "
                f"results in {self.total_strata} total strata, which may be inefficient. "
                f"Consider using Latin Hypercube Sampling instead."
            )
    
    def generate(self, n_points: int) -> np.ndarray:
        """
        Generate stratified samples
        
        Args:
            n_points: Number of points to generate
            
        Returns:
            Array of shape (n_points, dimensions) with values in [0, 1)
        """
        # For high dimensions, fall back to LHS which is more efficient
        if self.dimensions > 3:
            logger.info(f"Using Latin Hypercube Sampling for {self.dimensions} dimensions")
            lhs = LatinHypercubeSampler(self.dimensions)
            return lhs.generate(n_points)
        
        # Calculate samples per stratum (approximately)
        samples_per_stratum = max(1, n_points // self.total_strata)
        
        # Adjust if we have more strata than desired points
        if samples_per_stratum == 0:
            logger.warning(
                f"More strata ({self.total_strata}) than requested points ({n_points}). "
                f"Some strata will be empty."
            )
            samples_per_stratum = 1
            actual_strata = n_points
        else:
            actual_strata = self.total_strata
            
        # Generate strata indices
        if self.dimensions == 1:
            # 1D case: simple strata assignment
            strata_indices = np.repeat(np.arange(self.strata_per_dim), samples_per_stratum)
            
            # Truncate or extend as needed
            if len(strata_indices) < n_points:
                extra = n_points - len(strata_indices)
                extra_indices = np.random.choice(self.strata_per_dim, extra)
                strata_indices = np.concatenate([strata_indices, extra_indices])
            elif len(strata_indices) > n_points:
                strata_indices = strata_indices[:n_points]
                
            # Convert to stratum boundaries
            strata_min = strata_indices / self.strata_per_dim
            strata_max = (strata_indices + 1) / self.strata_per_dim
            
            # Sample within each stratum
            u = np.random.random(n_points)
            result = strata_min + u * (strata_max - strata_min)
            
            # Reshape to match expected dimensions
            return result.reshape(-1, 1)
            
        elif self.dimensions == 2:
            # 2D case: grid of strata
            result = np.zeros((n_points, 2))
            
            # Generate grid indices
            grid_x, grid_y = np.meshgrid(
                np.arange(self.strata_per_dim),
                np.arange(self.strata_per_dim)
            )
            strata_x = grid_x.flatten()
            strata_y = grid_y.flatten()
            
            # Generate samples for each stratum
            for i in range(min(n_points, len(strata_x))):
                # Stratum boundaries
                x_min = strata_x[i] / self.strata_per_dim
                x_max = (strata_x[i] + 1) / self.strata_per_dim
                y_min = strata_y[i] / self.strata_per_dim
                y_max = (strata_y[i] + 1) / self.strata_per_dim
                
                # Random point within stratum
                result[i, 0] = x_min + np.random.random() * (x_max - x_min)
                result[i, 1] = y_min + np.random.random() * (y_max - y_min)
            
            # Fill any remaining points randomly
            if n_points > len(strata_x):
                extra = n_points - len(strata_x)
                result[len(strata_x):, :] = np.random.random((extra, 2))
                
            return result
            
        else:
            # 3D case: use recursive subdivision
            result = np.zeros((n_points, self.dimensions))
            
            # Generate evenly spaced grid points along each dimension
            grid_points = [np.linspace(0, 1, self.strata_per_dim + 1) for _ in range(self.dimensions)]
            
            # Track generated points
            points_generated = 0
            
            # Generate samples for each stratum
            stratum_idx = 0
            while points_generated < n_points and stratum_idx < self.total_strata:
                # Convert stratum index to multi-dimensional indices
                indices = []
                remaining = stratum_idx
                for _ in range(self.dimensions):
                    indices.append(remaining % self.strata_per_dim)
                    remaining //= self.strata_per_dim
                
                # Stratum boundaries
                stratum_mins = [grid_points[d][indices[d]] for d in range(self.dimensions)]
                stratum_maxs = [grid_points[d][indices[d] + 1] for d in range(self.dimensions)]
                
                # Generate random point within stratum
                for d in range(self.dimensions):
                    result[points_generated, d] = stratum_mins[d] + np.random.random() * (stratum_maxs[d] - stratum_mins[d])
                
                points_generated += 1
                stratum_idx += 1
            
            # Fill any remaining points randomly
            if points_generated < n_points:
                extra = n_points - points_generated
                result[points_generated:, :] = np.random.random((extra, self.dimensions))
                
            return result
    
    def generate_normal(self, n_points: int, mean: float = 0.0, std: float = 1.0) -> np.ndarray:
        """
        Generate stratified samples with normal distribution
        
        Args:
            n_points: Number of points to generate
            mean: Mean of normal distribution
            std: Standard deviation of normal distribution
            
        Returns:
            Array of shape (n_points, dimensions) with normal distribution
        """
        uniform_samples = self.generate(n_points)
        
        # Transform to standard normal using inverse CDF
        return stats.norm.ppf(uniform_samples) * std + mean

class ImportanceSampler:
    """
    Importance sampling for Monte Carlo simulation
    
    Samples from a different distribution that puts more emphasis on
    important regions, then adjusts the weights to get unbiased estimates.
    """
    
    def __init__(self, target_pdf: Callable, proposal_pdf: Callable, proposal_sampler: Callable):
        """
        Initialize importance sampler
        
        Args:
            target_pdf: Target probability density function
            proposal_pdf: Proposal probability density function
            proposal_sampler: Function to sample from proposal distribution
        """
        self.target_pdf = target_pdf
        self.proposal_pdf = proposal_pdf
        self.proposal_sampler = proposal_sampler
    
    def generate_weighted_samples(self, n_points: int) -> Tuple[np.ndarray, np.ndarray]:
        """
        Generate weighted samples using importance sampling
        
        Args:
            n_points: Number of points to generate
            
        Returns:
            Tuple of (samples, weights) where samples has shape (n_points, d)
            and weights has shape (n_points,)
        """
        # Sample from proposal distribution
        samples = self.proposal_sampler(n_points)
        
        # Calculate importance weights
        weights = np.zeros(n_points)
        for i in range(n_points):
            target_density = self.target_pdf(samples[i])
            proposal_density = self.proposal_pdf(samples[i])
            
            # Avoid division by zero
            if proposal_density > 0:
                weights[i] = target_density / proposal_density
            else:
                weights[i] = 0
        
        return samples, weights
    
    def estimate_expectation(self, function: Callable, n_points: int) -> Tuple[float, float]:
        """
        Estimate expectation of a function using importance sampling
        
        Args:
            function: Function to estimate expectation of
            n_points: Number of points to use
            
        Returns:
            Tuple of (estimate, standard_error)
        """
        # Generate weighted samples
        samples, weights = self.generate_weighted_samples(n_points)
        
        # Normalize weights
        weights = weights / np.sum(weights)
        
        # Calculate function values
        f_values = np.zeros(n_points)
        for i in range(n_points):
            f_values[i] = function(samples[i])
        
        # Calculate weighted estimate
        estimate = np.sum(f_values * weights)
        
        # Calculate standard error
        variance = np.sum(((f_values - estimate) ** 2) * weights)
        standard_error = np.sqrt(variance / n_points)
        
        return estimate, standard_error

class ControlVariateSampler:
    """
    Control variate method for Monte Carlo simulation
    
    Uses a correlated variable with known expectation to reduce variance
    in the Monte Carlo estimate.
    """
    
    def __init__(self, function: Callable, control_function: Callable, control_expectation: float):
        """
        Initialize control variate sampler
        
        Args:
            function: Function to estimate expectation of
            control_function: Control function with known expectation
            control_expectation: Expected value of control function
        """
        self.function = function
        self.control_function = control_function
        self.control_expectation = control_expectation
    
    def estimate_expectation(
        self, 
        sampler: Callable, 
        n_points: int
    ) -> Tuple[float, float, float]:
        """
        Estimate expectation using control variates
        
        Args:
            sampler: Function to generate samples
            n_points: Number of points to use
            
        Returns:
            Tuple of (estimate, standard_error, optimal_beta)
        """
        # Generate samples
        samples = sampler(n_points)
        
        # Calculate function values
        f_values = np.zeros(n_points)
        g_values = np.zeros(n_points)
        
        for i in range(n_points):
            f_values[i] = self.function(samples[i])
            g_values[i] = self.control_function(samples[i])
        
        # Calculate control variate estimate
        g_mean = np.mean(g_values)
        
        # Calculate correlation between f and g
        cov_fg = np.cov(f_values, g_values)[0, 1]
        var_g = np.var(g_values)
        
        # Calculate optimal beta (coefficient for control variate)
        optimal_beta = cov_fg / var_g if var_g > 0 else 0
        
        # Calculate control variate estimate
        cv_estimate = np.mean(f_values) - optimal_beta * (g_mean - self.control_expectation)
        
        # Calculate standard error
        variance_reduction = 1 - (optimal_beta ** 2) * var_g / np.var(f_values)
        standard_error = np.std(f_values) * np.sqrt(variance_reduction / n_points)
        
        return cv_estimate, standard_error, optimal_beta

def generate_correlated_samples(
    dimensions: int,
    n_points: int,
    correlation_matrix: np.ndarray,
    method: SamplingMethod = SamplingMethod.LATIN_HYPERCUBE
) -> np.ndarray:
    """
    Generate correlated samples using specified method
    
    Args:
        dimensions: Number of dimensions
        n_points: Number of samples to generate
        correlation_matrix: Target correlation matrix (d x d)
        method: Sampling method to use
        
    Returns:
        Array of shape (n_points, dimensions) with standard normal distribution
        and specified correlation structure
    """
    # Validate correlation matrix
    if correlation_matrix.shape != (dimensions, dimensions):
        raise ValueError(f"Correlation matrix must be {dimensions}x{dimensions}")
    
    # Generate uncorrelated samples based on method
    if method == SamplingMethod.STANDARD:
        # Standard Monte Carlo
        uncorrelated = np.random.standard_normal(size=(n_points, dimensions))
    
    elif method == SamplingMethod.LATIN_HYPERCUBE:
        # Latin Hypercube Sampling
        lhs = LatinHypercubeSampler(dimensions)
        uniform_samples = lhs.generate(n_points)
        uncorrelated = stats.norm.ppf(uniform_samples)
    
    elif method == SamplingMethod.STRATIFIED:
        # Stratified sampling
        stratified = StratifiedSampler(dimensions)
        uniform_samples = stratified.generate(n_points)
        uncorrelated = stats.norm.ppf(uniform_samples)
    
    elif method == SamplingMethod.QUASI_SOBOL:
        # Sobol sequences
        sobol = SobolSequenceGenerator(dimensions)
        uniform_samples = sobol.generate(n_points)
        uncorrelated = stats.norm.ppf(uniform_samples)
    
    elif method == SamplingMethod.QUASI_HALTON:
        # Halton sequences
        halton = HaltonSequenceGenerator(dimensions)
        uniform_samples = halton.generate(n_points)
        uncorrelated = stats.norm.ppf(uniform_samples)
    
    else:
        # Default to standard Monte Carlo
        uncorrelated = np.random.standard_normal(size=(n_points, dimensions))
    
    # Apply correlation structure
    try:
        # Cholesky decomposition
        L = np.linalg.cholesky(correlation_matrix)
        correlated = np.dot(uncorrelated, L.T)
        return correlated
    except np.linalg.LinAlgError:
        logger.warning("Cholesky decomposition failed, correlation matrix may not be positive definite")
        
        # Try to fix by computing nearest positive definite matrix
        nearest_psd = _nearest_positive_definite(correlation_matrix)
        try:
            L = np.linalg.cholesky(nearest_psd)
            correlated = np.dot(uncorrelated, L.T)
            return correlated
        except:
            logger.error("Failed to apply correlation structure, returning uncorrelated samples")
            return uncorrelated

def _nearest_positive_definite(matrix: np.ndarray) -> np.ndarray:
    """
    Find the nearest positive definite matrix to a given matrix
    
    Args:
        matrix: Input matrix
        
    Returns:
        Nearest positive definite matrix
    """
    # Ensure matrix is symmetric
    B = (matrix + matrix.T) / 2
    
    # Calculate eigenvalues and eigenvectors
    eigenvalues, eigenvectors = np.linalg.eigh(B)
    
    # Replace any negative eigenvalues with small positive value
    eigenvalues = np.maximum(eigenvalues, 1e-8)
    
    # Reconstruct matrix
    return eigenvectors @ np.diag(eigenvalues) @ eigenvectors.T

def transform_to_distribution(
    normal_samples: np.ndarray, 
    distribution_type: str, 
    parameters: Dict[str, Any]
) -> np.ndarray:
    """
    Transform standard normal samples to other distributions
    
    Args:
        normal_samples: Samples from standard normal distribution
        distribution_type: Type of target distribution
        parameters: Distribution parameters
        
    Returns:
        Samples from target distribution
    """
    if distribution_type == "normal":
        # Normal distribution: mu + sigma * Z
        mu = parameters.get("mu", 0.0)
        sigma = parameters.get("sigma", 1.0)
        return mu + sigma * normal_samples
        
    elif distribution_type == "lognormal":
        # Lognormal distribution: exp(mu + sigma * Z)
        mu = parameters.get("mu", 0.0)
        sigma = parameters.get("sigma", 1.0)
        return np.exp(mu + sigma * normal_samples)
        
    elif distribution_type == "uniform":
        # Uniform distribution: a + (b-a) * Phi(Z)
        a = parameters.get("a", 0.0)
        b = parameters.get("b", 1.0)
        uniform = stats.norm.cdf(normal_samples)
        return a + (b - a) * uniform
        
    elif distribution_type == "triangular":
        # Triangular distribution
        a = parameters.get("a", 0.0)
        b = parameters.get("b", 1.0)
        c = parameters.get("c", (a + b) / 2)  # Mode
        
        # Convert to uniform
        uniform = stats.norm.cdf(normal_samples)
        
        # Transform to triangular
        f_c = (c - a) / (b - a)  # CDF at mode
        result = np.zeros_like(uniform)
        
        # Values below mode
        mask = uniform < f_c
        if np.any(mask):
            result[mask] = a + np.sqrt(uniform[mask] * (b - a) * (c - a))
        
        # Values above mode
        mask = ~mask
        if np.any(mask):
            result[mask] = b - np.sqrt((1 - uniform[mask]) * (b - a) * (b - c))
            
        return result
        
    elif distribution_type == "exponential":
        # Exponential distribution
        scale = parameters.get("scale", 1.0)
        
        # Convert to uniform
        uniform = stats.norm.cdf(normal_samples)
        
        # Transform to exponential
        return -scale * np.log(1 - uniform)
        
    elif distribution_type == "beta":
        # Beta distribution
        alpha = parameters.get("alpha", 1.0)
        beta = parameters.get("beta", 1.0)
        a = parameters.get("a", 0.0)  # Lower bound
        b = parameters.get("b", 1.0)  # Upper bound
        
        # Convert to uniform
        uniform = stats.norm.cdf(normal_samples)
        
        # Transform to beta
        beta_samples = stats.beta.ppf(uniform, alpha, beta)
        
        # Scale to [a, b]
        return a + (b - a) * beta_samples
        
    elif distribution_type == "gamma":
        # Gamma distribution
        shape = parameters.get("shape", 1.0)
        scale = parameters.get("scale", 1.0)
        
        # Convert to uniform
        uniform = stats.norm.cdf(normal_samples)
        
        # Transform to gamma
        return stats.gamma.ppf(uniform, shape, scale=scale)
        
    else:
        # Default to normal if distribution type is not recognized
        logger.warning(f"Unknown distribution type: {distribution_type}. Using standard normal.")
        return normal_samples

def convergence_analysis(
    function: Callable,
    dimensions: int,
    max_iterations: int = 100000,
    methods: List[SamplingMethod] = None,
    check_points: List[int] = None
) -> Dict[str, Dict[int, Tuple[float, float]]]:
    """
    Analyze convergence rates for different sampling methods
    
    Args:
        function: Function to integrate
        dimensions: Number of dimensions
        max_iterations: Maximum number of iterations
        methods: Sampling methods to compare
        check_points: Points at which to check convergence
        
    Returns:
        Dictionary with results for each method at each check point
    """
    # Default methods to compare
    if methods is None:
        methods = [
            SamplingMethod.STANDARD,
            SamplingMethod.LATIN_HYPERCUBE,
            SamplingMethod.QUASI_SOBOL
        ]
    
    # Default check points (logarithmically spaced)
    if check_points is None:
        check_points = [
            100, 200, 500, 
            1000, 2000, 5000, 
            10000, 20000, 50000, 
            100000
        ]
        # Truncate to max iterations
        check_points = [p for p in check_points if p <= max_iterations]
    
    # Initialize results
    results = {method.value: {} for method in methods}
    
    # Run convergence analysis for each method
    for method in methods:
        logger.info(f"Analyzing convergence for {method.value}...")
        
        # Initialize samplers
        if method == SamplingMethod.STANDARD:
            def sampler(n):
                return np.random.standard_normal(size=(n, dimensions))
        
        elif method == SamplingMethod.LATIN_HYPERCUBE:
            lhs = LatinHypercubeSampler(dimensions)
            def sampler(n):
                return lhs.generate_normal(n)
        
        elif method == SamplingMethod.STRATIFIED:
            stratified = StratifiedSampler(dimensions)
            def sampler(n):
                return stratified.generate_normal(n)
        
        elif method == SamplingMethod.QUASI_SOBOL:
            sobol = SobolSequenceGenerator(dimensions)
            def sampler(n):
                return sobol.generate_normal(n)
        
        elif method == SamplingMethod.QUASI_HALTON:
            halton = HaltonSequenceGenerator(dimensions)
            def sampler(n):
                return halton.generate_normal(n)
        
        else:
            # Default to standard Monte Carlo
            def sampler(n):
                return np.random.standard_normal(size=(n, dimensions))
        
        # Run for each check point
        for n in check_points:
            # Generate samples
            samples = sampler(n)
            
            # Evaluate function
            f_values = np.zeros(n)
            for i in range(n):
                f_values[i] = function(samples[i])
            
            # Calculate mean and standard error
            mean = np.mean(f_values)
            std_error = np.std(f_values) / np.sqrt(n)
            
            # Store results
            results[method.value][n] = (mean, std_error)
            
            logger.info(f"  {method.value} at n={n}: {mean:.6f} ± {std_error:.6f}")
    
    return results

# Example usage
if __name__ == "__main__":
    # Example function to integrate: sum of squares
    def f(x):
        return np.sum(x**2)
    
    # Expected value for sum of squares of d standard normal variables is d
    dimensions = 5
    expected_value = dimensions
    
    print(f"\nConvergence analysis for {dimensions}-dimensional function")
    print(f"Expected value: {expected_value}\n")
    
    # Compare convergence rates
    methods = [
        SamplingMethod.STANDARD,
        SamplingMethod.LATIN_HYPERCUBE,
        SamplingMethod.QUASI_SOBOL,
        SamplingMethod.QUASI_HALTON
    ]
    
    results = convergence_analysis(
        function=f,
        dimensions=dimensions,
        max_iterations=50000,
        methods=methods
    )
    
    # Print results table
    print("\nResults summary table:")
    print(f"{'Method':<20} {'n=1000':<15} {'n=10000':<15} {'n=50000':<15}")
    print("-" * 70)
    
    for method, points in results.items():
        values_1k = f"{points.get(1000, (0, 0))[0]:.6f} ± {points.get(1000, (0, 0))[1]:.6f}"
        values_10k = f"{points.get(10000, (0, 0))[0]:.6f} ± {points.get(10000, (0, 0))[1]:.6f}"
        values_50k = f"{points.get(50000, (0, 0))[0]:.6f} ± {points.get(50000, (0, 0))[1]:.6f}"
        
        print(f"{method:<20} {values_1k:<15} {values_10k:<15} {values_50k:<15}")
    
    print("\nError reduction factors compared to standard Monte Carlo:")
    print(f"{'Method':<20} {'n=1000':<15} {'n=10000':<15} {'n=50000':<15}")
    print("-" * 70)
    
    # Get standard Monte Carlo errors as baseline
    std_errors = {
        n: results[SamplingMethod.STANDARD.value][n][1]
        for n in [1000, 10000, 50000]
        if n in results[SamplingMethod.STANDARD.value]
    }
    
    for method, points in results.items():
        if method == SamplingMethod.STANDARD.value:
            continue
            
        factors = []
        for n in [1000, 10000, 50000]:
            if n in points and n in std_errors:
                factor = std_errors[n] / points[n][1]
                factors.append(f"{factor:.2f}x")
            else:
                factors.append("N/A")
        
        print(f"{method:<20} {factors[0]:<15} {factors[1]:<15} {factors[2]:<15}")
    
    print("\nDemo complete!")