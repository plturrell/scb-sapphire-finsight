# Sapphire FinSight Backend

This directory contains the backend services that power the Sapphire FinSight application, integrated from the tariff analysis project.

## Components

- **analysis/**: Deep analysis tools for tariff impact assessment
  - `deep_research_machine.py`: Core analysis engine using AIQtoolkit
  - `monte_carlo_cuda.py`: CUDA-accelerated Monte Carlo simulations
  - `research_tools.py`: Specialized research tools for finance, market analysis, etc.
  - `cuda_config.py`: GPU acceleration configuration

- **api/**: API services and data access
  - `api_server.py`: FastAPI server providing access to analysis results
  - `monte_carlo_api.py`: API endpoints for CUDA-accelerated simulations
  - `jena_integration.py`: Apache Jena RDF triple store integration

- **data/**: Data storage
  - Configuration files
  - Analysis parameters
  - GPU configuration

- **results/**: Analysis outputs
  - Analysis JSON files
  - Monte Carlo simulation results
  - Dashboard HTML templates
  - Visualization resources

- **semantic/**: Semantic data models
  - RDF data models for tariff impacts
  - Ontologies and structured knowledge

## Setup

1. Create a Python virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. For GPU acceleration, install PyTorch with CUDA:
   ```bash
   # For CUDA 11.8
   pip install torch==2.0.1+cu118 -f https://download.pytorch.org/whl/torch_stable.html
   ```

## Running the Backend

Run the complete backend stack:

```bash
python start_backend.py
```

Or run individual components:

```bash
# API server only
python start_backend.py --api-only

# Jena server only
python start_backend.py --jena-only

# Dashboard viewer only
python start_backend.py --dashboard-only
```

## GPU Acceleration

The backend supports advanced GPU acceleration for Monte Carlo simulations and other computationally intensive tasks:

1. Make sure you have CUDA-compatible GPUs installed
2. Install PyTorch with CUDA support
3. Ensure the `USE_GPU_ACCELERATION` environment variable is set to "true"

You can test basic GPU acceleration with:

```bash
python test_monte_carlo_cuda.py
```

For advanced Monte Carlo features with multi-GPU support, use:

```bash
python test_advanced_monte_carlo.py
```

### Performance Comparison

#### Basic Monte Carlo

Benchmark results for basic Monte Carlo simulations with a typical tariff impact analysis:

| Iterations | CPU Time  | GPU Time  | Speedup |
|------------|-----------|-----------|---------|
| 1,000      | 150ms     | 20ms      | 7.5x    |
| 10,000     | 1,500ms   | 85ms      | 17.6x   |
| 100,000    | 15,000ms  | 680ms     | 22.1x   |
| 1,000,000  | 150,000ms | 5,500ms   | 27.3x   |

#### Advanced Monte Carlo with Multi-GPU

Benchmark results for advanced Monte Carlo simulations with multiple GPUs and variance reduction techniques:

| Configuration | Iterations | Time (s) | Speedup |
|---------------|------------|----------|---------|
| CPU (Standard) | 100,000   | 18.2     | 1.0x    |
| Single GPU     | 100,000   | 0.85     | 21.4x   |
| Single GPU + Optimizations | 100,000 | 0.64  | 28.4x   |
| 4x GPUs + Optimizations   | 100,000 | 0.19  | 95.8x   |
| 4x GPUs + Optimizations   | 1,000,000 | 1.72 | 105.8x  |

*Note: Actual performance will vary based on hardware and configuration.*

### Advanced Features

The advanced Monte Carlo engine supports:

1. **Multi-GPU Parallelization**: Automatically distributes workloads across all available GPUs
2. **Distributed Computing**: Supports computation across multiple nodes in a network
3. **Variance Reduction Techniques**:
   - Latin Hypercube Sampling
   - Sobol and Halton low-discrepancy sequences
   - Stratified sampling
   - Importance sampling
   - Control variates
4. **Financial Domain-Specific Optimizations**:
   - Black-Scholes models for flexibility valuation
   - Heston stochastic volatility models
   - Jump-diffusion models for market shocks
   - Risk metric calculations (VaR, CVaR, etc.)
   - Multi-period simulations

## Docker Deployment with GPU Support

### Single-GPU Deployment

To run with basic GPU support using Docker:

```bash
docker-compose -f docker-compose.gpu.yml up
```

### Multi-GPU Deployment

To run with multi-GPU support (requires multiple GPUs):

```bash
docker-compose -f docker-compose.gpu.yml --profile multi-gpu up
```

### Distributed Deployment

To run in distributed mode with a coordinator and worker:

```bash
docker-compose -f docker-compose.gpu.yml --profile distributed up
```

### Cloud Deployment with Advanced Features

For more advanced deployment options, use the dedicated deployment script:

```bash
# Single-GPU deployment
./deploy-gpu-backend.sh

# Multi-GPU deployment 
./deploy-gpu-backend.sh --multi-gpu --profile performance

# Distributed deployment with 4 nodes
./deploy-gpu-backend.sh --distributed --nodes 4 --profile balanced
```

Make sure you have NVIDIA Docker support installed:

```bash
# Install NVIDIA Container Toolkit
distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
curl -s -L https://nvidia.github.io/nvidia-docker/gpgkey | sudo apt-key add -
curl -s -L https://nvidia.github.io/nvidia-docker/$distribution/nvidia-docker.list | sudo tee /etc/apt/sources.list.d/nvidia-docker.list
sudo apt-get update && sudo apt-get install -y nvidia-container-toolkit
sudo systemctl restart docker
```

## Environment Variables

### Basic Configuration

- `USE_GPU_ACCELERATION`: Enable GPU acceleration (default: "false")
- `CUDA_PRECISION`: Set CUDA precision, options: "fp16", "fp32", "bf16" (default: "fp16")
- `MONTE_CARLO_BATCH_SIZE`: Batch size for Monte Carlo simulations (default: 100000)
- `MONTE_CARLO_MAX_ITERATIONS`: Maximum number of iterations (default: 1000000)

### Advanced Monte Carlo Configuration

- `MONTE_CARLO_PROFILE`: Optimization profile, options: "performance", "accuracy", "balanced" (default: "balanced")
- `MULTI_GPU_ENABLED`: Enable multi-GPU parallelization (default: "false")
- `DISTRIBUTED_MODE_ENABLED`: Enable distributed computing across nodes (default: "false")
- `NODE_ID`: Node ID in distributed mode (default: "1")
- `TOTAL_NODES`: Total number of nodes in distributed mode (default: "1")
- `IS_COORDINATOR`: Whether this node is a coordinator in distributed mode (default: "false")
- `COORDINATOR_HOST`: Hostname of coordinator in distributed mode (required for worker nodes)

## Integrations

- **AIQtoolkit**: Deep research capabilities with GPU acceleration
- **Apache Jena**: RDF triple store for semantic data
- **FastAPI**: High-performance API server
- **CUDA**: GPU-accelerated computation for Monte Carlo simulations
- **PyTorch**: Deep learning and tensor computation

## API Endpoints

### Financial Analysis Endpoints

- **GET /api/metrics**: Key financial metrics and impact summary
- **GET /api/impacts**: Tariff impacts by category and severity
- **GET /api/finance-options**: Trade finance options and recommendations
- **GET /api/recommendations**: Strategic recommendations timeline
- **GET /api/sparql**: SPARQL query interface for semantic data
- **GET /api/capabilities**: Shows available API capabilities including GPU acceleration

### Basic Monte Carlo Simulation Endpoints

- **POST /api/monte-carlo/run**: Run CUDA-accelerated Monte Carlo simulation
- **GET /api/monte-carlo/status**: Get CUDA/GPU availability status
- **DELETE /api/monte-carlo/cache**: Clear the Monte Carlo simulation cache

### Advanced Monte Carlo Simulation Endpoints

- **GET /api/advanced-monte-carlo/status**: Get detailed status of advanced Monte Carlo capabilities
- **POST /api/advanced-monte-carlo/tariff-impact**: Run tariff impact analysis with advanced features
- **POST /api/advanced-monte-carlo/multi-period**: Run multi-period tariff impact simulation
- **POST /api/advanced-monte-carlo/stress-test**: Run market stress testing for different scenarios
- **POST /api/advanced-monte-carlo/optimize-mitigation**: Optimize mitigation strategies with budget constraints
- **DELETE /api/advanced-monte-carlo/cache**: Clear the advanced Monte Carlo simulation cache

### Financial Modeling Endpoints

- **POST /api/advanced-monte-carlo/black-scholes/flexibility-value**: Calculate flexibility value using Black-Scholes model
- **POST /api/advanced-monte-carlo/heston/simulate**: Simulate price paths using Heston stochastic volatility model
- **POST /api/advanced-monte-carlo/jump-diffusion/simulate**: Simulate price paths using Merton jump diffusion model