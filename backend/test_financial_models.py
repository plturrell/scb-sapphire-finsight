#!/usr/bin/env python3
"""
Test financial models implemented in the advanced Monte Carlo API
Simulates Black-Scholes, Heston, and Jump-Diffusion models for tariff impact analysis
"""

import numpy as np
import matplotlib.pyplot as plt
from pathlib import Path
import os
import math
import random
import time

class BlackScholesModel:
    """Black-Scholes financial model implementation"""
    
    @staticmethod
    def d1(S, K, r, sigma, T):
        """Calculate d1 parameter"""
        return (math.log(S/K) + (r + 0.5 * sigma**2) * T) / (sigma * math.sqrt(T))
    
    @staticmethod
    def d2(S, K, r, sigma, T):
        """Calculate d2 parameter"""
        return BlackScholesModel.d1(S, K, r, sigma, T) - sigma * math.sqrt(T)
    
    @staticmethod
    def cdf(x):
        """Standard normal cumulative distribution function"""
        return 0.5 * (1 + math.erf(x / math.sqrt(2)))
    
    @staticmethod
    def call_option_price(S, K, r, sigma, T):
        """Calculate call option price"""
        if sigma <= 0 or T <= 0:
            return max(0, S - K)
        
        d1 = BlackScholesModel.d1(S, K, r, sigma, T)
        d2 = BlackScholesModel.d2(S, K, r, sigma, T)
        
        return S * BlackScholesModel.cdf(d1) - K * math.exp(-r * T) * BlackScholesModel.cdf(d2)
    
    @staticmethod
    def put_option_price(S, K, r, sigma, T):
        """Calculate put option price"""
        if sigma <= 0 or T <= 0:
            return max(0, K - S)
        
        d1 = BlackScholesModel.d1(S, K, r, sigma, T)
        d2 = BlackScholesModel.d2(S, K, r, sigma, T)
        
        return K * math.exp(-r * T) * BlackScholesModel.cdf(-d2) - S * BlackScholesModel.cdf(-d1)
    
    @staticmethod
    def value_of_flexibility(current_revenue, revenue_at_risk, time_horizon, volatility, risk_free_rate=0.03, tariff_probability=0.5):
        """
        Calculate the value of flexibility to adapt to tariff risks using option pricing
        
        This models the value of flexibility as a put option:
        - current_revenue is the current asset price
        - revenue_at_risk * tariff_probability is the strike price
        - time_horizon is the time to maturity
        - volatility is the standard deviation of revenue
        """
        # Calculate strike price as the expected impact of tariffs
        strike_price = revenue_at_risk * tariff_probability
        
        # Calculate put option price (right to sell at strike price)
        # This represents the value of having the flexibility to mitigate tariff impacts
        flexibility_value = BlackScholesModel.put_option_price(
            S=current_revenue,
            K=strike_price,
            r=risk_free_rate,
            sigma=volatility,
            T=time_horizon
        )
        
        return flexibility_value

class HestonModel:
    """Heston stochastic volatility model"""
    
    def __init__(self, initial_price, initial_variance, kappa, theta, sigma, rho, risk_free_rate=0.03):
        """
        Initialize Heston model
        
        Args:
            initial_price: Initial asset price
            initial_variance: Initial variance (volatility^2)
            kappa: Mean reversion speed of variance
            theta: Long-term variance
            sigma: Volatility of variance
            rho: Correlation between price and variance processes
            risk_free_rate: Risk-free interest rate
        """
        self.initial_price = initial_price
        self.initial_variance = initial_variance
        self.kappa = kappa
        self.theta = theta
        self.sigma = sigma
        self.rho = rho
        self.risk_free_rate = risk_free_rate
    
    def simulate_paths(self, time_horizon, num_steps, num_paths, return_vol=False):
        """
        Simulate price paths using Heston model
        
        Args:
            time_horizon: Time horizon in years
            num_steps: Number of time steps
            num_paths: Number of paths to simulate
            return_vol: Whether to return volatility paths
            
        Returns:
            Price paths (and optionally volatility paths)
        """
        dt = time_horizon / num_steps
        sqrt_dt = math.sqrt(dt)
        
        # Initialize price and variance paths
        prices = np.zeros((num_paths, num_steps + 1))
        variances = np.zeros((num_paths, num_steps + 1))
        
        # Set initial values
        prices[:, 0] = self.initial_price
        variances[:, 0] = self.initial_variance
        
        # Simulate paths
        for i in range(num_steps):
            # Generate correlated random numbers
            z1 = np.random.standard_normal(num_paths)
            z2 = self.rho * z1 + np.sqrt(1 - self.rho**2) * np.random.standard_normal(num_paths)
            
            # Update variance (with full truncation to ensure positivity)
            variances[:, i+1] = np.maximum(
                variances[:, i] + self.kappa * (self.theta - np.maximum(0, variances[:, i])) * dt + 
                self.sigma * np.sqrt(np.maximum(0, variances[:, i])) * sqrt_dt * z2,
                0
            )
            
            # Update prices
            prices[:, i+1] = prices[:, i] * np.exp(
                (self.risk_free_rate - 0.5 * np.maximum(0, variances[:, i])) * dt + 
                np.sqrt(np.maximum(0, variances[:, i])) * sqrt_dt * z1
            )
        
        if return_vol:
            return prices, np.sqrt(variances)
        else:
            return prices

class JumpDiffusionModel:
    """Merton Jump Diffusion model"""
    
    def __init__(self, initial_price, drift, volatility, jump_intensity, jump_mean, jump_volatility):
        """
        Initialize Jump Diffusion model
        
        Args:
            initial_price: Initial asset price
            drift: Drift term (annual rate)
            volatility: Diffusion volatility (annual)
            jump_intensity: Expected number of jumps per year
            jump_mean: Mean of jump size
            jump_volatility: Volatility of jump size
        """
        self.initial_price = initial_price
        self.drift = drift
        self.volatility = volatility
        self.jump_intensity = jump_intensity
        self.jump_mean = jump_mean
        self.jump_volatility = jump_volatility
    
    def simulate_paths(self, time_horizon, num_steps, num_paths):
        """
        Simulate price paths using Jump Diffusion model
        
        Args:
            time_horizon: Time horizon in years
            num_steps: Number of time steps
            num_paths: Number of paths to simulate
            
        Returns:
            Price paths
        """
        dt = time_horizon / num_steps
        sqrt_dt = math.sqrt(dt)
        
        # Adjust drift to compensate for jumps
        adjusted_drift = self.drift - self.jump_intensity * (math.exp(self.jump_mean + 0.5 * self.jump_volatility**2) - 1)
        
        # Initialize price paths
        prices = np.zeros((num_paths, num_steps + 1))
        prices[:, 0] = self.initial_price
        
        # Simulate paths
        for i in range(num_steps):
            # Diffusion component
            diffusion = np.random.normal(
                (adjusted_drift - 0.5 * self.volatility**2) * dt,
                self.volatility * sqrt_dt,
                num_paths
            )
            
            # Jump component
            num_jumps = np.random.poisson(self.jump_intensity * dt, num_paths)
            jumps = np.zeros(num_paths)
            
            for j in range(num_paths):
                if num_jumps[j] > 0:
                    jump_sizes = np.random.normal(self.jump_mean, self.jump_volatility, num_jumps[j])
                    jumps[j] = np.sum(jump_sizes)
            
            # Update prices
            log_returns = diffusion + jumps
            prices[:, i+1] = prices[:, i] * np.exp(log_returns)
        
        return prices

def plot_model_paths(output_dir="./results"):
    """Plot sample paths from different financial models"""
    # Create output directory if it doesn't exist
    os.makedirs(output_dir, exist_ok=True)
    
    # Parameters
    initial_price = 60_000_000_000  # Initial company revenue
    time_horizon = 3  # Years
    num_steps = 500
    num_sample_paths = 5
    
    # Create time axis
    time_points = np.linspace(0, time_horizon, num_steps + 1)
    
    # 1. Black-Scholes Model (simulated paths)
    plt.figure(figsize=(12, 8))
    
    volatility = 0.25  # Annual volatility
    drift = 0.05  # Annual drift
    
    # Simulate Black-Scholes paths
    np.random.seed(42)  # For reproducibility
    paths = np.zeros((num_sample_paths, num_steps + 1))
    paths[:, 0] = initial_price
    
    dt = time_horizon / num_steps
    sqrt_dt = math.sqrt(dt)
    
    for i in range(num_steps):
        z = np.random.standard_normal(num_sample_paths)
        paths[:, i+1] = paths[:, i] * np.exp((drift - 0.5 * volatility**2) * dt + volatility * sqrt_dt * z)
    
    # Plot paths
    for i in range(num_sample_paths):
        plt.plot(time_points, paths[i, :])
    
    plt.title('Black-Scholes Model Sample Paths')
    plt.xlabel('Time (years)')
    plt.ylabel('Revenue ($)')
    plt.grid(True, alpha=0.3)
    plt.ticklabel_format(style='sci', axis='y', scilimits=(0,0))
    
    plt.tight_layout()
    output_path = Path(output_dir) / "black_scholes_paths.png"
    plt.savefig(output_path)
    print(f"Black-Scholes plot saved to {output_path}")
    
    # 2. Heston Model
    plt.figure(figsize=(12, 8))
    
    heston = HestonModel(
        initial_price=initial_price,
        initial_variance=0.03,
        kappa=2.0,
        theta=0.04,
        sigma=0.4,
        rho=-0.7,
        risk_free_rate=0.03
    )
    
    # Simulate paths
    np.random.seed(42)
    paths, vols = heston.simulate_paths(time_horizon, num_steps, num_sample_paths, return_vol=True)
    
    # Plot price paths
    for i in range(num_sample_paths):
        plt.plot(time_points, paths[i, :])
    
    plt.title('Heston Model Sample Paths')
    plt.xlabel('Time (years)')
    plt.ylabel('Revenue ($)')
    plt.grid(True, alpha=0.3)
    plt.ticklabel_format(style='sci', axis='y', scilimits=(0,0))
    
    plt.tight_layout()
    output_path = Path(output_dir) / "heston_paths.png"
    plt.savefig(output_path)
    print(f"Heston model plot saved to {output_path}")
    
    # 3. Jump Diffusion Model
    plt.figure(figsize=(12, 8))
    
    jump_diffusion = JumpDiffusionModel(
        initial_price=initial_price,
        drift=0.05,
        volatility=0.2,
        jump_intensity=2.0,  # Average 2 jumps per year
        jump_mean=-0.1,      # Negative mean jump size (tariff shocks)
        jump_volatility=0.1
    )
    
    # Simulate paths
    np.random.seed(42)
    paths = jump_diffusion.simulate_paths(time_horizon, num_steps, num_sample_paths)
    
    # Plot price paths
    for i in range(num_sample_paths):
        plt.plot(time_points, paths[i, :])
    
    plt.title('Jump Diffusion Model Sample Paths')
    plt.xlabel('Time (years)')
    plt.ylabel('Revenue ($)')
    plt.grid(True, alpha=0.3)
    plt.ticklabel_format(style='sci', axis='y', scilimits=(0,0))
    
    plt.tight_layout()
    output_path = Path(output_dir) / "jump_diffusion_paths.png"
    plt.savefig(output_path)
    print(f"Jump Diffusion model plot saved to {output_path}")
    
    # 4. Flexibility Valuation
    plt.figure(figsize=(12, 8))
    
    # Calculate flexibility value for different revenue at risk levels
    revenue_at_risk_levels = np.linspace(5_000_000_000, 25_000_000_000, 100)
    flexibility_values = []
    
    for rev_at_risk in revenue_at_risk_levels:
        value = BlackScholesModel.value_of_flexibility(
            current_revenue=initial_price,
            revenue_at_risk=rev_at_risk,
            time_horizon=3.0,
            volatility=0.25,
            risk_free_rate=0.03,
            tariff_probability=0.5
        )
        flexibility_values.append(value)
    
    plt.plot(revenue_at_risk_levels / 1e9, np.array(flexibility_values) / 1e9)
    plt.title('Value of Flexibility vs. Revenue at Risk')
    plt.xlabel('Revenue at Risk ($ billions)')
    plt.ylabel('Flexibility Value ($ billions)')
    plt.grid(True, alpha=0.3)
    
    plt.tight_layout()
    output_path = Path(output_dir) / "flexibility_value.png"
    plt.savefig(output_path)
    print(f"Flexibility valuation plot saved to {output_path}")

if __name__ == "__main__":
    print("Testing financial models...")
    plot_model_paths()
    
    # Test flexibility valuation
    value = BlackScholesModel.value_of_flexibility(
        current_revenue=60_000_000_000,
        revenue_at_risk=21_000_000_000,
        time_horizon=3.0,
        volatility=0.25,
        risk_free_rate=0.03,
        tariff_probability=0.5
    )
    
    print(f"\nBlack-Scholes Flexibility Valuation")
    print(f"Value of flexibility: ${value:,.2f}")
    print(f"As percentage of revenue at risk: {100 * value / 21_000_000_000:.2f}%")