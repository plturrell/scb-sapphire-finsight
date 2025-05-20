#!/usr/bin/env python3
"""
Test variance reduction techniques for Monte Carlo simulation
Compares standard Monte Carlo, Latin Hypercube, and Sobol sequence sampling
for convergence rate and accuracy.
"""

import time
import random
import math
import numpy as np
import matplotlib.pyplot as plt
from pathlib import Path
import os

# A simple function to estimate pi using Monte Carlo
# We'll use different sampling techniques to estimate the area of a quarter circle
def estimate_pi_standard(iterations):
    """Estimate Pi using standard Monte Carlo with pseudo-random numbers"""
    points_inside = 0
    
    for _ in range(iterations):
        x = random.random()
        y = random.random()
        
        # Check if point is inside quarter circle
        if x*x + y*y <= 1.0:
            points_inside += 1
    
    # Calculate pi: area ratio * 4
    pi_estimate = 4.0 * points_inside / iterations
    
    return pi_estimate

def estimate_pi_stratified(iterations):
    """Estimate Pi using stratified sampling"""
    points_inside = 0
    n = int(math.sqrt(iterations))  # Grid size
    
    # Ensure we have a square number of iterations
    iterations = n * n
    
    for i in range(n):
        for j in range(n):
            # Get random point in grid cell (i,j)
            x = (i + random.random()) / n
            y = (j + random.random()) / n
            
            # Check if point is inside quarter circle
            if x*x + y*y <= 1.0:
                points_inside += 1
    
    # Calculate pi: area ratio * 4
    pi_estimate = 4.0 * points_inside / iterations
    
    return pi_estimate

def generate_latin_hypercube_samples(n, d=2):
    """Generate Latin Hypercube samples"""
    # Generate samples for d dimensions
    samples = np.zeros((n, d))
    
    for i in range(d):
        # Create a random permutation of integers 0 to n-1
        perm = np.random.permutation(n)
        
        # Generate samples
        samples[:, i] = (perm + np.random.random(n)) / n
    
    return samples

def estimate_pi_latin_hypercube(iterations):
    """Estimate Pi using Latin Hypercube sampling"""
    # Generate 2D Latin Hypercube samples
    samples = generate_latin_hypercube_samples(iterations, 2)
    
    points_inside = 0
    for i in range(iterations):
        x = samples[i, 0]
        y = samples[i, 1]
        
        # Check if point is inside quarter circle
        if x*x + y*y <= 1.0:
            points_inside += 1
    
    # Calculate pi: area ratio * 4
    pi_estimate = 4.0 * points_inside / iterations
    
    return pi_estimate

def sobol_sequence(n, d=2):
    """Generate a simple Sobol sequence (a simplified implementation)"""
    # For a true Sobol sequence, we would use a library like sobol_seq
    # This is a very simplified version that resembles a low-discrepancy sequence
    
    # Use base-2 Gray code to simulate Sobol sequence
    samples = np.zeros((n, d))
    
    for i in range(n):
        # Gray code
        gray = i ^ (i >> 1)
        
        # Convert to binary representation
        for j in range(d):
            # Extract bits and divide
            bits = 0
            div = 1
            g = gray
            while g > 0:
                div *= 2
                if g & 1:
                    bits += 1/div
                g >>= 1
            
            # Add randomized offset
            samples[i, j] = (bits + j/d) % 1.0
    
    return samples

def estimate_pi_sobol(iterations):
    """Estimate Pi using Sobol sequence (simulated)"""
    # Generate 2D Sobol samples
    samples = sobol_sequence(iterations, 2)
    
    points_inside = 0
    for i in range(iterations):
        x = samples[i, 0]
        y = samples[i, 1]
        
        # Check if point is inside quarter circle
        if x*x + y*y <= 1.0:
            points_inside += 1
    
    # Calculate pi: area ratio * 4
    pi_estimate = 4.0 * points_inside / iterations
    
    return pi_estimate

def run_convergence_test(max_iterations=10000, step=100):
    """Run convergence test for different sampling methods"""
    iterations_list = list(range(step, max_iterations + step, step))
    
    results = {
        "standard": [],
        "stratified": [],
        "latin_hypercube": [],
        "sobol": [],
        "iterations": iterations_list
    }
    
    true_pi = math.pi
    
    print(f"Running convergence tests up to {max_iterations} iterations...")
    
    for iterations in iterations_list:
        # Standard Monte Carlo
        pi_standard = estimate_pi_standard(iterations)
        error_standard = abs(pi_standard - true_pi)
        results["standard"].append(error_standard)
        
        # Stratified sampling
        pi_stratified = estimate_pi_stratified(iterations)
        error_stratified = abs(pi_stratified - true_pi)
        results["stratified"].append(error_stratified)
        
        # Latin Hypercube Sampling
        pi_lhs = estimate_pi_latin_hypercube(iterations)
        error_lhs = abs(pi_lhs - true_pi)
        results["latin_hypercube"].append(error_lhs)
        
        # Sobol sequence
        pi_sobol = estimate_pi_sobol(iterations)
        error_sobol = abs(pi_sobol - true_pi)
        results["sobol"].append(error_sobol)
        
        if iterations % 1000 == 0:
            print(f"Completed {iterations} iterations")
            print(f"  Standard error: {error_standard:.8f}")
            print(f"  Stratified error: {error_stratified:.8f}")
            print(f"  Latin Hypercube error: {error_lhs:.8f}")
            print(f"  Sobol error: {error_sobol:.8f}")
    
    return results

def plot_convergence(results, output_dir="./results"):
    """Plot convergence of different sampling methods"""
    plt.figure(figsize=(12, 8))
    
    plt.plot(results["iterations"], results["standard"], label='Standard Monte Carlo')
    plt.plot(results["iterations"], results["stratified"], label='Stratified Sampling')
    plt.plot(results["iterations"], results["latin_hypercube"], label='Latin Hypercube Sampling')
    plt.plot(results["iterations"], results["sobol"], label='Sobol Sequence')
    
    plt.xlabel('Number of Iterations')
    plt.ylabel('Absolute Error')
    plt.title('Convergence of Monte Carlo Methods for π Estimation')
    plt.legend()
    plt.grid(True, alpha=0.3)
    
    # Use log scale for y-axis
    plt.yscale('log')
    
    # Create output directory if it doesn't exist
    os.makedirs(output_dir, exist_ok=True)
    
    # Save plot
    plt.tight_layout()
    output_path = Path(output_dir) / "variance_reduction_convergence.png"
    plt.savefig(output_path)
    print(f"Convergence plot saved to {output_path}")
    
    # Plot distribution of samples for visual comparison
    plot_sampling_methods(output_dir)

def plot_sampling_methods(output_dir="./results"):
    """Plot different sampling methods to visualize the distribution"""
    fig, axs = plt.subplots(2, 2, figsize=(12, 10))
    
    n_samples = 500
    
    # Generate samples for each method
    random_samples = np.random.random((n_samples, 2))
    
    # Stratified sampling
    n_strat = int(math.sqrt(n_samples))
    strat_samples = np.zeros((n_strat * n_strat, 2))
    
    idx = 0
    for i in range(n_strat):
        for j in range(n_strat):
            strat_samples[idx, 0] = (i + random.random()) / n_strat
            strat_samples[idx, 1] = (j + random.random()) / n_strat
            idx += 1
    
    # Latin Hypercube samples
    lhs_samples = generate_latin_hypercube_samples(n_samples, 2)
    
    # Sobol samples (simulated)
    sobol_samples = sobol_sequence(n_samples, 2)
    
    # Plot each set of samples
    axs[0, 0].scatter(random_samples[:, 0], random_samples[:, 1], s=5, alpha=0.6)
    axs[0, 0].set_title('Standard Monte Carlo')
    axs[0, 0].grid(True, alpha=0.3)
    
    axs[0, 1].scatter(strat_samples[:, 0], strat_samples[:, 1], s=5, alpha=0.6)
    axs[0, 1].set_title('Stratified Sampling')
    axs[0, 1].grid(True, alpha=0.3)
    
    axs[1, 0].scatter(lhs_samples[:, 0], lhs_samples[:, 1], s=5, alpha=0.6)
    axs[1, 0].set_title('Latin Hypercube Sampling')
    axs[1, 0].grid(True, alpha=0.3)
    
    axs[1, 1].scatter(sobol_samples[:, 0], sobol_samples[:, 1], s=5, alpha=0.6)
    axs[1, 1].set_title('Sobol Sequence')
    axs[1, 1].grid(True, alpha=0.3)
    
    # Add quarter circle boundary to each plot
    theta = np.linspace(0, np.pi/2, 100)
    for ax in axs.flatten():
        ax.plot(np.cos(theta), np.sin(theta), 'r-')
        ax.set_xlim(-0.05, 1.05)
        ax.set_ylim(-0.05, 1.05)
        ax.set_aspect('equal')
    
    plt.tight_layout()
    output_path = Path(output_dir) / "sampling_methods_visualization.png"
    plt.savefig(output_path)
    print(f"Sampling visualization saved to {output_path}")

if __name__ == "__main__":
    print("Testing variance reduction techniques for Monte Carlo simulation...")
    results = run_convergence_test()
    plot_convergence(results)