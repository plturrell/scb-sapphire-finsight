# Advanced Monte Carlo Tariff Impact Analysis

This guide explains how to use the advanced Monte Carlo simulation tools to analyze tariff impacts on your business.

## Features

The advanced Monte Carlo engine includes:

- **Multi-GPU Acceleration**: Utilizes multiple GPUs for parallel processing
- **Distributed Computing**: Coordinates analysis across multiple compute nodes
- **Variance Reduction Techniques**: 
  - Latin Hypercube Sampling
  - Sobol Sequences
  - Halton Sequences
  - Stratified Sampling
- **Advanced Financial Models**:
  - Black-Scholes Model for flexibility valuation
  - Heston Stochastic Volatility
  - Jump-Diffusion Models
  - Multi-period projection
- **Interactive Dashboards**: Visualizes analysis results with customizable charts

## Quick Start

For quick analysis with default parameters:

```bash
./run_analysis.sh
```

This will:
1. Run a standard tariff impact analysis
2. Run multi-scenario analysis
3. Calculate flexibility valuation
4. Perform multi-period projection
5. Generate an executive dashboard
6. Open the dashboard in your default browser

## Running Advanced Analysis

For more control over the analysis:

```bash
./run_tariff_analysis.py --tariff-rate 0.25 --iterations 250000 --open-dashboard
```

### Common Parameters

- `--tariff-rate`: Tariff rate (0.15 = 15%)
- `--iterations`: Number of Monte Carlo iterations
- `--company-name`: Company name for reports
- `--sampling-method`: Sampling method (standard, latin_hypercube, sobol, halton, stratified)
- `--profile`: Performance profile (balanced, performance, accuracy)
- `--no-gpu`: Disable GPU acceleration
- `--open-dashboard`: Open dashboard in browser after generation

### Company Information

- `--annual-revenue`: Annual revenue ($)
- `--annual-costs`: Annual costs ($)
- `--us-export-percentage`: US export percentage
- `--price-elasticity`: Price elasticity of demand

### Selective Analysis

By default, all analysis types are run. You can select specific analyses:

- `--run-standard`: Run standard impact analysis
- `--run-scenarios`: Run multi-scenario analysis
- `--run-flexibility`: Run flexibility valuation
- `--run-periods`: Run multi-period analysis

## Advanced Scenarios

### Multi-Scenario Analysis

Evaluate tariff impacts across different market scenarios:

```bash
./run_tariff_analysis.py --run-scenarios --scenarios base,recession,stagflation,high_volatility,trade_war
```

### Flexibility Valuation

Assess the value of strategic flexibility:

```bash
./run_tariff_analysis.py --run-flexibility --time-horizon 5.0 --volatility 0.3 --tariff-probability 0.7
```

### Multi-Period Analysis

Project impacts over multiple periods:

```bash
./run_tariff_analysis.py --run-periods --periods 10 --tariff-rate-growth -0.05 --negotiation-probability 0.2
```

## Performance Optimization

For maximum performance:

```bash
./run_tariff_analysis.py --profile performance --iterations 50000
```

For maximum accuracy:

```bash
./run_tariff_analysis.py --profile accuracy --iterations 500000
```

## Output Files

Analysis results are stored in the `results` directory:

- `tariff_impact_*.json`: Standard impact analysis
- `multi_scenario_*.json`: Multi-scenario analysis
- `flexibility_*.json`: Flexibility valuation
- `multi_period_*.json`: Multi-period analysis
- `executive_dashboard.html`: Interactive dashboard

## Required Dependencies

- Python 3.8+
- NumPy
- Pandas
- Matplotlib
- Plotly
- CUDA Toolkit 11.4+ (for GPU acceleration)
- PyTorch 2.0+ (for tensor operations)

## Troubleshooting

- **GPU Not Detected**: Ensure CUDA drivers are installed and `nvidia-smi` runs without errors
- **Memory Errors**: Reduce batch size or number of iterations
- **Slow Performance**: Enable GPU acceleration, adjust performance profile

For further assistance, contact the SCB-Sapphire-UIUX development team.