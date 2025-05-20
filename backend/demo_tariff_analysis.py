#!/usr/bin/env python3
"""
Simple demonstration of the tariff analysis capabilities
Uses the TariffImpactAnalyzer to perform a basic analysis with default parameters
"""

import os
import json
import logging
from pathlib import Path
from datetime import datetime
import webbrowser

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("TariffDemo")

# Import the analyzer
try:
    from analysis.production_analysis import TariffImpactAnalyzer
    from results.generate_executive_dashboard import (
        load_latest_analysis_results,
        generate_dashboard_data,
        generate_dashboard_html,
        save_dashboard
    )
except ImportError as e:
    logger.error(f"Error importing required modules: {e}")
    exit(1)

def run_demo():
    """Run a demonstration of the tariff impact analysis"""
    
    logger.info("Starting tariff impact analysis demo")
    
    # Create a sample company profile
    company_profile = {
        "company": "Demo Company Ltd.",
        "annual_revenue": 10_000_000_000,  # $10 billion
        "annual_costs": 8_500_000_000,     # $8.5 billion
        "us_export_percentage": 40.0,      # 40% of revenue from US exports
        "price_elasticity": -1.8           # Price elasticity of demand
    }
    
    # Create the analyzer
    logger.info("Initializing TariffImpactAnalyzer")
    analyzer = TariffImpactAnalyzer(
        company_profile=company_profile,
        use_gpu=False,  # Use CPU for compatibility
        profile="balanced"
    )
    
    # Run a simplified analysis
    tariff_rate = 0.15  # 15% tariff
    logger.info(f"Running simplified tariff impact analysis with {tariff_rate*100}% tariff rate")
    
    # Execute the analysis with a small number of iterations for demo purposes
    standard_results = analyzer._run_simplified_analysis(tariff_rate)
    
    # Display the key results
    total_impact = standard_results["impacts"]["total_financial_impact"]
    percentage_impact = standard_results["impacts"]["percentage_impact"]
    profit_impact = standard_results["impacts"]["profit_impact_percentage"]
    
    logger.info("Analysis Results:")
    logger.info(f"Total Financial Impact: ${total_impact:,.2f}")
    logger.info(f"Percentage of Revenue: {percentage_impact:.2f}%")
    logger.info(f"Percentage of Profit: {profit_impact:.2f}%")
    
    # Create a sample multi-scenario result for the dashboard
    
    # Sample scenarios
    scenarios = ["base", "recession", "stagflation", "high_volatility", "trade_war"]
    scenario_results = {}
    
    for i, scenario in enumerate(scenarios):
        # Create different impacts for different scenarios
        modifier = 1.0
        if scenario == "recession":
            modifier = 1.4
        elif scenario == "stagflation":
            modifier = 1.7
        elif scenario == "high_volatility":
            modifier = 1.2
        elif scenario == "trade_war":
            modifier = 2.0
        
        # Create a sample result
        impact = total_impact * modifier
        scenario_results[scenario] = {
            "statistics": {
                "total_financial_impact": {
                    "mean": impact,
                    "std": impact * 0.1,
                    "median": impact * 0.95,
                    "min": impact * 0.7,
                    "max": impact * 1.3,
                },
                "percentage_impact": {
                    "mean": percentage_impact * modifier,
                    "std": percentage_impact * 0.1,
                }
            }
        }
    
    # Create a mock multi-scenario result
    multi_scenario = {
        "tariff_rate": tariff_rate,
        "iterations": 1000,
        "scenarios": scenario_results,
        "environment": {
            "company": company_profile["company"]
        }
    }
    
    # Create a mock flexibility valuation result
    flexibility_valuation = {
        "flexibility_value": total_impact * 0.25,
        "flexibility_value_percentage": 25.0,
        "inputs": {
            "current_revenue": company_profile["annual_revenue"],
            "revenue_at_risk": company_profile["annual_revenue"] * company_profile["us_export_percentage"] / 100,
            "time_horizon": 3.0,
            "volatility": 0.25,
            "risk_free_rate": 0.03,
            "tariff_probability": 0.5
        }
    }
    
    # Create a mock multi-period result
    periods = 5
    # Generate decreasing impacts over time as companies adapt
    period_impacts = [total_impact * (1 - 0.08 * i) for i in range(periods)]
    
    multi_period = {
        "periods": periods,
        "results": {
            "total_impact": period_impacts
        }
    }
    
    # Save all mock results
    results_dir = Path(__file__).parent / "results"
    os.makedirs(results_dir, exist_ok=True)
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    # Convert impacts to proper format for dashboard
    formatted_impacts = {}
    for key, value in standard_results["impacts"].items():
        formatted_impacts[key] = {"mean": value, "std": value * 0.1}
        # Add samples for distribution plot
        if key == "total_financial_impact":
            # Generate random samples around the mean for visualization
            import numpy as np
            np.random.seed(42)  # For reproducibility
            samples = np.random.normal(value, abs(value) * 0.1, 1000).tolist()
            formatted_impacts[key]["samples"] = samples
    
    # Standard results in expected format
    standard_formatted = {
        "statistics": formatted_impacts,
        "environment": {"company": company_profile["company"]},
        "risk_analyses": {
            "total_financial_impact": {
                "var": total_impact * 1.6,
                "cvar": total_impact * 1.8
            }
        }
    }
    
    # Save standard results
    with open(results_dir / f"tariff_impact_{tariff_rate:.2f}_{timestamp}.json", "w") as f:
        json.dump(standard_formatted, f, indent=2)
    
    # Save multi-scenario results
    with open(results_dir / f"multi_scenario_{tariff_rate:.2f}_{timestamp}.json", "w") as f:
        json.dump(multi_scenario, f, indent=2)
    
    # Save flexibility valuation
    with open(results_dir / f"flexibility_valuation_{timestamp}.json", "w") as f:
        json.dump(flexibility_valuation, f, indent=2)
    
    # Save multi-period analysis
    with open(results_dir / f"multi_period_analysis_{timestamp}.json", "w") as f:
        json.dump(multi_period, f, indent=2)
    
    # Generate a dashboard
    logger.info("Generating executive dashboard")
    
    # Load the results
    all_results = {
        "standard": standard_formatted,
        "multi_scenario": multi_scenario,
        "flexibility": flexibility_valuation,
        "multi_period": multi_period
    }
    
    # Generate the dashboard
    dashboard_data = generate_dashboard_data(all_results)
    dashboard_html = generate_dashboard_html(dashboard_data)
    
    # Save the dashboard
    dashboard_path = results_dir / "executive_dashboard.html"
    save_dashboard(dashboard_html, str(dashboard_path))
    
    logger.info(f"Dashboard saved to {dashboard_path}")
    
    # Open the dashboard in a browser
    dashboard_url = f"file://{dashboard_path.absolute()}"
    webbrowser.open(dashboard_url)
    logger.info(f"Dashboard opened in browser: {dashboard_url}")

if __name__ == "__main__":
    run_demo()