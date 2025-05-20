#!/usr/bin/env python3
"""
Tariff Impact Analysis Workflow Runner
Automates the entire workflow from simulation to dashboard generation
"""

import os
import sys
import argparse
import logging
import json
import webbrowser
import time
from pathlib import Path
from datetime import datetime
from typing import Dict, Any, Optional

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("TariffAnalysisRunner")

# Import required modules
try:
    from analysis.production_analysis import TariffImpactAnalyzer, ADVANCED_MODELS_AVAILABLE
    from results.generate_executive_dashboard import (
        load_latest_analysis_results,
        generate_dashboard_data,
        generate_dashboard_html,
        save_dashboard
    )
    MODULE_IMPORT_SUCCESS = True
except ImportError as e:
    logger.error(f"Failed to import required modules: {e}")
    MODULE_IMPORT_SUCCESS = False

class TariffAnalysisWorkflow:
    """Automates the entire tariff impact analysis workflow"""
    
    def __init__(self, args):
        """Initialize the workflow runner"""
        self.args = args
        self.results_dir = Path(__file__).parent / "results"
        self.dashboard_path = self.results_dir / "executive_dashboard.html"
        self.company_profile = self._load_company_profile()
    
    def _load_company_profile(self) -> Dict[str, Any]:
        """Load company profile from file or use default"""
        if self.args.company_profile and os.path.exists(self.args.company_profile):
            try:
                with open(self.args.company_profile, 'r') as f:
                    return json.load(f)
            except Exception as e:
                logger.error(f"Failed to load company profile: {e}")
        
        # Default company profile
        return {
            "company": self.args.company_name,
            "annual_revenue": self.args.annual_revenue,
            "annual_costs": self.args.annual_costs,
            "us_export_percentage": self.args.us_export_percentage,
            "price_elasticity": self.args.price_elasticity
        }
    
    def run(self) -> bool:
        """Run the complete workflow"""
        if not MODULE_IMPORT_SUCCESS:
            logger.error("Module import failed, cannot run analysis")
            return False
        
        if not ADVANCED_MODELS_AVAILABLE:
            logger.warning("Advanced Monte Carlo models not available, using simplified analysis")
            
        logger.info("======== Tariff Impact Analysis Workflow ========")
        logger.info(f"Company: {self.company_profile['company']}")
        logger.info(f"Tariff Rate: {self.args.tariff_rate}")
        logger.info(f"Using GPU: {not self.args.no_gpu}")
        logger.info(f"Performance Profile: {self.args.profile}")
        logger.info("===============================================")
        
        # Initialize the analyzer
        analyzer = TariffImpactAnalyzer(
            company_profile=self.company_profile,
            use_gpu=not self.args.no_gpu,
            profile=self.args.profile
        )
        
        # Step 1: Run standard impact analysis
        if self._should_run_analysis("standard"):
            logger.info("Step 1: Running standard tariff impact analysis...")
            analyzer.run_standard_impact_analysis(
                tariff_rate=self.args.tariff_rate,
                iterations=self.args.iterations,
                sampling_method=self.args.sampling_method
            )
        else:
            logger.info("Step 1: Skipping standard tariff impact analysis")
        
        # Step 2: Run multi-scenario analysis
        if self._should_run_analysis("scenarios"):
            logger.info("Step 2: Running multi-scenario analysis...")
            scenario_list = self.args.scenarios.split(',')
            analyzer.run_multi_scenario_analysis(
                tariff_rate=self.args.tariff_rate,
                iterations=self.args.iterations // 2,
                scenarios=scenario_list
            )
        else:
            logger.info("Step 2: Skipping multi-scenario analysis")
        
        # Step 3: Run flexibility valuation
        if self._should_run_analysis("flexibility"):
            logger.info("Step 3: Running flexibility valuation...")
            analyzer.run_flexibility_valuation(
                time_horizon=self.args.time_horizon,
                volatility=self.args.volatility,
                risk_free_rate=self.args.risk_free_rate,
                tariff_probability=self.args.tariff_probability
            )
        else:
            logger.info("Step 3: Skipping flexibility valuation")
        
        # Step 4: Run multi-period analysis
        if self._should_run_analysis("periods"):
            logger.info("Step 4: Running multi-period analysis...")
            analyzer.run_multi_period_analysis(
                periods=self.args.periods,
                tariff_rate_initial=self.args.tariff_rate,
                tariff_rate_growth=self.args.tariff_rate_growth,
                negotiation_probability_initial=self.args.negotiation_probability,
                negotiation_probability_growth=self.args.negotiation_probability_growth,
                iterations=self.args.iterations // 2
            )
        else:
            logger.info("Step 4: Skipping multi-period analysis")
        
        # Step 5: Generate executive dashboard
        logger.info("Step 5: Generating executive dashboard...")
        self._generate_dashboard()
        
        # Step 6: Open dashboard in browser if requested
        if self.args.open_dashboard:
            logger.info("Step 6: Opening dashboard in browser...")
            self._open_dashboard()
        else:
            logger.info("Dashboard generated but not opened (use --open to view)")
            logger.info(f"Dashboard saved to: {self.dashboard_path}")
        
        logger.info("Tariff impact analysis workflow completed successfully!")
        return True
    
    def _should_run_analysis(self, analysis_type: str) -> bool:
        """Check if a specific analysis should be run"""
        if self.args.run_all:
            return True
        
        if analysis_type == "standard":
            return self.args.run_standard
        elif analysis_type == "scenarios":
            return self.args.run_scenarios
        elif analysis_type == "flexibility":
            return self.args.run_flexibility
        elif analysis_type == "periods":
            return self.args.run_periods
        
        return False
    
    def _generate_dashboard(self) -> None:
        """Generate the executive dashboard from analysis results"""
        # Load the latest analysis results
        results = load_latest_analysis_results(str(self.results_dir))
        
        if not results:
            logger.warning("No analysis results found, cannot generate dashboard")
            return
        
        # Update company name in results if not present
        if "standard" in results and "environment" in results["standard"]:
            if "company" not in results["standard"]["environment"]:
                results["standard"]["environment"]["company"] = self.company_profile["company"]
        
        # Generate dashboard data and HTML
        dashboard_data = generate_dashboard_data(results)
        dashboard_html = generate_dashboard_html(dashboard_data)
        
        # Save dashboard
        save_dashboard(dashboard_html, str(self.dashboard_path))
        logger.info(f"Executive dashboard generated: {self.dashboard_path}")
    
    def _open_dashboard(self) -> None:
        """Open the dashboard in the default web browser"""
        if not os.path.exists(self.dashboard_path):
            logger.error(f"Dashboard file not found: {self.dashboard_path}")
            return
        
        dashboard_url = f"file://{self.dashboard_path.absolute()}"
        webbrowser.open(dashboard_url)
        logger.info(f"Dashboard opened in browser: {dashboard_url}")
        

def parse_arguments():
    """Parse command line arguments"""
    parser = argparse.ArgumentParser(description="Tariff Impact Analysis Workflow Runner")
    
    # Company information
    company_group = parser.add_argument_group("Company Information")
    company_group.add_argument("--company-name", default="Global TechCorp", help="Company name")
    company_group.add_argument("--company-profile", help="Path to JSON file with company profile")
    company_group.add_argument("--annual-revenue", type=float, default=60_000_000_000, help="Annual revenue ($)")
    company_group.add_argument("--annual-costs", type=float, default=51_000_000_000, help="Annual costs ($)")
    company_group.add_argument("--us-export-percentage", type=float, default=35.0, help="US export percentage")
    company_group.add_argument("--price-elasticity", type=float, default=-2.0, help="Price elasticity of demand")
    
    # Tariff parameters
    tariff_group = parser.add_argument_group("Tariff Parameters")
    tariff_group.add_argument("--tariff-rate", type=float, default=0.15, help="Tariff rate (0.15 = 15%)")
    tariff_group.add_argument("--time-horizon", type=float, default=3.0, help="Time horizon for flexibility valuation (years)")
    tariff_group.add_argument("--volatility", type=float, default=0.25, help="Revenue volatility for flexibility valuation")
    tariff_group.add_argument("--risk-free-rate", type=float, default=0.03, help="Risk-free interest rate for flexibility valuation")
    tariff_group.add_argument("--tariff-probability", type=float, default=0.5, help="Probability of tariff implementation")
    tariff_group.add_argument("--periods", type=int, default=5, help="Number of periods for multi-period analysis")
    tariff_group.add_argument("--tariff-rate-growth", type=float, default=-0.1, help="Tariff rate growth per period")
    tariff_group.add_argument("--negotiation-probability", type=float, default=0.3, help="Initial negotiation success probability")
    tariff_group.add_argument("--negotiation-probability-growth", type=float, default=0.2, help="Negotiation probability growth per period")
    
    # Simulation parameters
    sim_group = parser.add_argument_group("Simulation Parameters")
    sim_group.add_argument("--iterations", type=int, default=100000, help="Number of Monte Carlo iterations")
    sim_group.add_argument("--sampling-method", choices=["standard", "latin_hypercube", "sobol", "halton", "stratified"],
                          default="latin_hypercube", help="Sampling method")
    sim_group.add_argument("--scenarios", default="base,recession,stagflation,high_volatility,trade_war",
                          help="Comma-separated list of scenarios for multi-scenario analysis")
    sim_group.add_argument("--profile", choices=["balanced", "performance", "accuracy"],
                          default="balanced", help="Performance profile")
    sim_group.add_argument("--no-gpu", action="store_true", help="Disable GPU acceleration")
    
    # Workflow control
    workflow_group = parser.add_argument_group("Workflow Control")
    workflow_group.add_argument("--run-all", action="store_true", help="Run all analysis types")
    workflow_group.add_argument("--run-standard", action="store_true", help="Run standard impact analysis")
    workflow_group.add_argument("--run-scenarios", action="store_true", help="Run multi-scenario analysis")
    workflow_group.add_argument("--run-flexibility", action="store_true", help="Run flexibility valuation")
    workflow_group.add_argument("--run-periods", action="store_true", help="Run multi-period analysis")
    workflow_group.add_argument("--open-dashboard", action="store_true", help="Open dashboard in browser after generation")
    
    args = parser.parse_args()
    
    # If no specific analysis is selected, run all
    if not any([args.run_all, args.run_standard, args.run_scenarios, args.run_flexibility, args.run_periods]):
        args.run_all = True
    
    return args

def main():
    """Main function"""
    # Parse command line arguments
    args = parse_arguments()
    
    # Run the workflow
    workflow = TariffAnalysisWorkflow(args)
    success = workflow.run()
    
    # Return exit code
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())