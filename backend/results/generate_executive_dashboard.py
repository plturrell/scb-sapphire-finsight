#!/usr/bin/env python3
"""
Executive Dashboard Generator for Tariff Impact Analysis
Creates interactive dashboard visualizations from Monte Carlo simulation results
"""

import json
import os
import glob
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from datetime import datetime
from pathlib import Path
import argparse

# Dashboard HTML template with embedded plotly.js
DASHBOARD_TEMPLATE = """<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tariff Impact Executive Dashboard</title>
    <script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js@3.7.1/dist/chart.min.js"></script>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f5f5f5;
        }
        
        .dashboard-container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .header {
            background-color: #1a5276;
            color: white;
            padding: 20px;
            text-align: center;
            margin-bottom: 20px;
            border-radius: 8px;
        }
        
        .metrics-container {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
            flex-wrap: wrap;
        }
        
        .metric-card {
            background-color: white;
            border-radius: 8px;
            padding: 15px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            flex-basis: 23%;
            margin-bottom: 15px;
        }
        
        .metric-card h3 {
            margin-top: 0;
            color: #1a5276;
            font-size: 16px;
        }
        
        .metric-value {
            font-size: 24px;
            font-weight: bold;
            color: #2c3e50;
        }
        
        .metric-change {
            font-size: 14px;
            margin-top: 5px;
        }
        
        .positive-change {
            color: #27ae60;
        }
        
        .negative-change {
            color: #c0392b;
        }
        
        .chart-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
            flex-wrap: wrap;
        }
        
        .chart-container {
            background-color: white;
            border-radius: 8px;
            padding: 15px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            margin-bottom: 20px;
        }
        
        .chart-large {
            flex-basis: 100%;
        }
        
        .chart-medium {
            flex-basis: 48%;
        }
        
        .chart-small {
            flex-basis: 31%;
        }
        
        .footer {
            text-align: center;
            padding: 20px;
            color: #7f8c8d;
            font-size: 12px;
        }
        
        @media (max-width: 768px) {
            .metric-card, .chart-medium, .chart-small {
                flex-basis: 100%;
            }
        }
    </style>
</head>
<body>
    <div class="dashboard-container">
        <div class="header">
            <h1>Tariff Impact Executive Dashboard</h1>
            <p>Analysis Date: {{ANALYSIS_DATE}} | Company: {{COMPANY_NAME}}</p>
        </div>
        
        <div class="metrics-container">
            <div class="metric-card">
                <h3>Financial Impact</h3>
                <div class="metric-value">{{TOTAL_IMPACT}}</div>
                <div class="metric-change negative-change">{{IMPACT_PERCENTAGE}} of Revenue</div>
            </div>
            
            <div class="metric-card">
                <h3>Profit Impact</h3>
                <div class="metric-value">{{PROFIT_IMPACT_PERCENTAGE}}</div>
                <div class="metric-change negative-change">of Annual Profit</div>
            </div>
            
            <div class="metric-card">
                <h3>Value at Risk (95%)</h3>
                <div class="metric-value">{{VAR_95}}</div>
                <div class="metric-change">Worst-case threshold</div>
            </div>
            
            <div class="metric-card">
                <h3>Flexibility Value</h3>
                <div class="metric-value">{{FLEXIBILITY_VALUE}}</div>
                <div class="metric-change positive-change">Mitigation potential</div>
            </div>
        </div>
        
        <div class="chart-row">
            <div class="chart-container chart-large">
                <h3>Total Financial Impact Distribution</h3>
                <div id="impact-distribution-chart" style="width: 100%; height: 300px;"></div>
            </div>
        </div>
        
        <div class="chart-row">
            <div class="chart-container chart-medium">
                <h3>Impact by Market Scenario</h3>
                <div id="scenario-comparison-chart" style="width: 100%; height: 300px;"></div>
            </div>
            
            <div class="chart-container chart-medium">
                <h3>Multi-Period Projection</h3>
                <div id="multi-period-chart" style="width: 100%; height: 300px;"></div>
            </div>
        </div>
        
        <div class="chart-row">
            <div class="chart-container chart-small">
                <h3>Impact Breakdown</h3>
                <div id="impact-breakdown-chart" style="width: 100%; height: 250px;"></div>
            </div>
            
            <div class="chart-container chart-small">
                <h3>Mitigation Effectiveness</h3>
                <div id="mitigation-chart" style="width: 100%; height: 250px;"></div>
            </div>
            
            <div class="chart-container chart-small">
                <h3>Success Probability</h3>
                <div id="success-probability-chart" style="width: 100%; height: 250px;"></div>
            </div>
        </div>
        
        <div class="footer">
            <p>Generated by Sapphire FinSight Advanced Monte Carlo Engine | Data as of {{ANALYSIS_DATE}}</p>
        </div>
    </div>

    <script>
        // Impact Distribution Chart
        const impactData = {{IMPACT_DISTRIBUTION_DATA}};
        
        Plotly.newPlot('impact-distribution-chart', [{
            x: impactData.values,
            type: 'histogram',
            marker: {
                color: '#3498db',
                line: {
                    color: 'white',
                    width: 1
                }
            },
            name: 'Impact Distribution'
        }, {
            x: [impactData.mean, impactData.mean],
            y: [0, impactData.max_y],
            mode: 'lines',
            type: 'scatter',
            name: 'Mean',
            line: {
                color: '#e74c3c',
                width: 2,
                dash: 'dash'
            }
        }, {
            x: [impactData.var95, impactData.var95],
            y: [0, impactData.max_y * 0.8],
            mode: 'lines',
            type: 'scatter',
            name: '95% VaR',
            line: {
                color: '#c0392b',
                width: 2,
                dash: 'dot'
            }
        }], {
            title: '',
            xaxis: {
                title: 'Financial Impact ($)'
            },
            yaxis: {
                title: 'Frequency'
            },
            margin: {
                l: 50,
                r: 20,
                t: 20,
                b: 50
            },
            legend: {
                x: 0.01,
                y: 0.99,
                bgcolor: 'rgba(255, 255, 255, 0.7)'
            },
            bargap: 0.05
        });
        
        // Scenario Comparison Chart
        const scenarioData = {{SCENARIO_DATA}};
        
        Plotly.newPlot('scenario-comparison-chart', [{
            x: scenarioData.scenarios,
            y: scenarioData.impacts,
            type: 'bar',
            marker: {
                color: scenarioData.colors
            },
            text: scenarioData.impacts.map(v => '$' + (v / 1e9).toFixed(2) + 'B'),
            textposition: 'auto'
        }], {
            title: '',
            xaxis: {
                title: '',
                tickangle: -45
            },
            yaxis: {
                title: 'Financial Impact ($)'
            },
            margin: {
                l: 50,
                r: 20,
                t: 20,
                b: 80
            }
        });
        
        // Multi-Period Chart
        const periodData = {{MULTI_PERIOD_DATA}};
        
        Plotly.newPlot('multi-period-chart', [{
            x: periodData.periods,
            y: periodData.impacts,
            type: 'scatter',
            mode: 'lines+markers',
            line: {
                color: '#2980b9',
                width: 3
            },
            marker: {
                color: '#3498db',
                size: 10
            },
            text: periodData.impacts.map(v => '$' + (v / 1e9).toFixed(2) + 'B'),
            textposition: 'top'
        }], {
            title: '',
            xaxis: {
                title: 'Period',
                tickmode: 'array',
                tickvals: periodData.periods,
                ticktext: periodData.periods.map(p => 'Year ' + p)
            },
            yaxis: {
                title: 'Financial Impact ($)'
            },
            margin: {
                l: 50,
                r: 20,
                t: 20,
                b: 50
            }
        });
        
        // Impact Breakdown Chart
        const breakdownData = {{IMPACT_BREAKDOWN_DATA}};
        
        Plotly.newPlot('impact-breakdown-chart', [{
            values: breakdownData.values,
            labels: breakdownData.labels,
            type: 'pie',
            textinfo: 'label+percent',
            insidetextorientation: 'radial',
            marker: {
                colors: breakdownData.colors
            }
        }], {
            title: '',
            margin: {
                l: 20,
                r: 20,
                t: 20,
                b: 20
            }
        });
        
        // Mitigation Effectiveness Chart
        const mitigationData = {{MITIGATION_DATA}};
        
        Plotly.newPlot('mitigation-chart', [{
            x: mitigationData.strategies,
            y: mitigationData.effectiveness,
            type: 'bar',
            marker: {
                color: '#27ae60'
            },
            text: mitigationData.effectiveness.map(v => (v*100).toFixed(0) + '%'),
            textposition: 'auto'
        }], {
            title: '',
            xaxis: {
                title: '',
                tickangle: -45
            },
            yaxis: {
                title: 'Effectiveness',
                range: [0, 1]
            },
            margin: {
                l: 50,
                r: 20,
                t: 20,
                b: 100
            }
        });
        
        // Success Probability Chart
        const probData = {{SUCCESS_PROBABILITY_DATA}};
        
        const successProbChart = document.getElementById('success-probability-chart');
        new Chart(successProbChart, {
            type: 'doughnut',
            data: {
                labels: ['Success', 'Failure'],
                datasets: [{
                    data: [probData.success, 100 - probData.success],
                    backgroundColor: ['#27ae60', '#e74c3c'],
                    borderColor: ['#27ae60', '#e74c3c'],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.label + ': ' + context.raw + '%';
                            }
                        }
                    }
                }
            }
        });
    </script>
</body>
</html>
"""

def format_currency(value):
    """Format a number as a currency string with appropriate scale (B, M, K)"""
    abs_value = abs(value)
    if abs_value >= 1e9:
        return f"${abs_value / 1e9:.1f}B"
    elif abs_value >= 1e6:
        return f"${abs_value / 1e6:.1f}M"
    elif abs_value >= 1e3:
        return f"${abs_value / 1e3:.1f}K"
    else:
        return f"${abs_value:.2f}"

def format_percentage(value):
    """Format a number as a percentage string"""
    return f"{value:.1f}%"

def load_latest_analysis_results(results_dir, company=None):
    """
    Load the latest analysis results from the results directory
    
    Args:
        results_dir: Directory containing analysis result files
        company: Optional company name to filter results
        
    Returns:
        Dictionary containing combined analysis results
    """
    # Create results directory if it doesn't exist
    if not os.path.exists(results_dir):
        os.makedirs(results_dir)
    
    # Find all analysis files
    analysis_files = glob.glob(os.path.join(results_dir, "tariff_impact_*.json"))
    scenario_files = glob.glob(os.path.join(results_dir, "multi_scenario_*.json"))
    flexibility_files = glob.glob(os.path.join(results_dir, "flexibility_*.json"))
    multi_period_files = glob.glob(os.path.join(results_dir, "multi_period_*.json"))
    
    # Sort by modification time (newest first)
    analysis_files.sort(key=os.path.getmtime, reverse=True)
    scenario_files.sort(key=os.path.getmtime, reverse=True)
    flexibility_files.sort(key=os.path.getmtime, reverse=True)
    multi_period_files.sort(key=os.path.getmtime, reverse=True)
    
    # Load the latest analysis results
    results = {}
    
    # Load standard analysis results
    if analysis_files:
        with open(analysis_files[0], 'r') as f:
            standard_results = json.load(f)
            results["standard"] = standard_results
    
    # Load multi-scenario analysis results
    if scenario_files:
        with open(scenario_files[0], 'r') as f:
            scenario_results = json.load(f)
            results["multi_scenario"] = scenario_results
    
    # Load flexibility valuation results
    if flexibility_files:
        with open(flexibility_files[0], 'r') as f:
            flexibility_results = json.load(f)
            results["flexibility"] = flexibility_results
    
    # Load multi-period analysis results
    if multi_period_files:
        with open(multi_period_files[0], 'r') as f:
            multi_period_results = json.load(f)
            results["multi_period"] = multi_period_results
    
    return results

def generate_dashboard_data(results):
    """
    Generate dashboard data from analysis results
    
    Args:
        results: Dictionary containing combined analysis results
        
    Returns:
        Dictionary containing dashboard data
    """
    dashboard_data = {
        "analysis_date": datetime.now().strftime("%B %d, %Y"),
        "company_name": "Global TechCorp",  # Default
        "total_impact": "$0",
        "impact_percentage": "0%",
        "profit_impact_percentage": "0%",
        "var_95": "$0",
        "flexibility_value": "$0",
        "impact_distribution_data": {
            "values": [],
            "mean": 0,
            "var95": 0,
            "max_y": 0
        },
        "scenario_data": {
            "scenarios": [],
            "impacts": [],
            "colors": []
        },
        "multi_period_data": {
            "periods": [],
            "impacts": []
        },
        "impact_breakdown_data": {
            "labels": ["Direct Costs", "Market Share Loss", "Competitor Impact"],
            "values": [33, 33, 34],
            "colors": ['#3498db', '#e74c3c', '#f39c12']
        },
        "mitigation_data": {
            "strategies": ["Supply Chain", "Product Mix", "Market Shift", "Trade Finance"],
            "effectiveness": [0.65, 0.45, 0.75, 0.35]
        },
        "success_probability_data": {
            "success": 75
        }
    }
    
    # Extract standard analysis data
    if "standard" in results:
        std_results = results["standard"]
        
        # Extract company name
        if "environment" in std_results and "company" in std_results.get("environment", {}):
            dashboard_data["company_name"] = std_results["environment"]["company"]
        
        # Extract key statistics
        if "statistics" in std_results:
            stats = std_results["statistics"]
            
            # Total financial impact
            if "total_financial_impact" in stats:
                total_impact = stats["total_financial_impact"].get("mean", 0)
                dashboard_data["total_impact"] = format_currency(total_impact)
                
                # Extract impact distribution data
                if "samples" in stats["total_financial_impact"]:
                    samples = stats["total_financial_impact"]["samples"]
                    if len(samples) > 0:
                        # Convert to numpy array if it's a list
                        if isinstance(samples, list):
                            samples = np.array(samples)
                        
                        dashboard_data["impact_distribution_data"]["values"] = samples.tolist()
                        dashboard_data["impact_distribution_data"]["mean"] = float(stats["total_financial_impact"].get("mean", 0))
                        
                        # Calculate 95% VaR
                        if "risk_analyses" in std_results and "total_financial_impact" in std_results["risk_analyses"]:
                            var95 = std_results["risk_analyses"]["total_financial_impact"].get("var", 0)
                            dashboard_data["impact_distribution_data"]["var95"] = var95
                            dashboard_data["var_95"] = format_currency(var95)
                        else:
                            # Approximate VaR if not available
                            var95 = np.percentile(samples, 95)
                            dashboard_data["impact_distribution_data"]["var95"] = float(var95)
                            dashboard_data["var_95"] = format_currency(var95)
                        
                        # Calculate max Y for plot scaling
                        hist, _ = np.histogram(samples, bins=30)
                        dashboard_data["impact_distribution_data"]["max_y"] = int(np.max(hist) * 1.1)
            
            # Percentage impact
            if "percentage_impact" in stats:
                percentage_impact = stats["percentage_impact"].get("mean", 0)
                dashboard_data["impact_percentage"] = format_percentage(percentage_impact)
            
            # Profit impact percentage
            if "profit_impact_percentage" in stats:
                profit_impact = stats["profit_impact_percentage"].get("mean", 0)
                dashboard_data["profit_impact_percentage"] = format_percentage(profit_impact)
            
            # Impact breakdown
            if all(key in stats for key in ["direct_tariff_costs", "market_share_loss", "competitor_impact"]):
                direct_costs = stats["direct_tariff_costs"].get("mean", 0)
                market_share_loss = stats["market_share_loss"].get("mean", 0)
                competitor_impact = stats["competitor_impact"].get("mean", 0)
                
                total = direct_costs + market_share_loss + competitor_impact
                if total > 0:
                    dashboard_data["impact_breakdown_data"]["values"] = [
                        direct_costs / total * 100,
                        market_share_loss / total * 100,
                        competitor_impact / total * 100
                    ]
    
    # Extract multi-scenario data
    if "multi_scenario" in results:
        scenario_results = results["multi_scenario"]
        
        if "scenarios" in scenario_results:
            scenarios_data = scenario_results["scenarios"]
            
            # Extract scenario names and impacts
            scenarios = []
            impacts = []
            colors = []
            
            color_map = {
                "base": '#3498db',       # Blue
                "recession": '#e74c3c',  # Red
                "stagflation": '#9b59b6', # Purple
                "growth": '#2ecc71',     # Green
                "high_volatility": '#f39c12', # Orange
                "trade_war": '#c0392b'   # Dark Red
            }
            
            for scenario, data in scenarios_data.items():
                if "statistics" in data and "total_financial_impact" in data["statistics"]:
                    scenarios.append(scenario.capitalize())
                    impacts.append(data["statistics"]["total_financial_impact"].get("mean", 0))
                    colors.append(color_map.get(scenario, '#3498db'))
            
            if scenarios and impacts:
                dashboard_data["scenario_data"]["scenarios"] = scenarios
                dashboard_data["scenario_data"]["impacts"] = impacts
                dashboard_data["scenario_data"]["colors"] = colors
    
    # Extract flexibility valuation
    if "flexibility" in results:
        flexibility_results = results["flexibility"]
        
        if "flexibility_value" in flexibility_results:
            flexibility_value = flexibility_results["flexibility_value"]
            dashboard_data["flexibility_value"] = format_currency(flexibility_value)
    
    # Extract multi-period data
    if "multi_period" in results:
        period_results = results["multi_period"]
        
        if "results" in period_results and "total_impact" in period_results["results"]:
            total_impact = period_results["results"]["total_impact"]
            if isinstance(total_impact, list):
                periods = list(range(1, len(total_impact) + 1))
                
                dashboard_data["multi_period_data"]["periods"] = periods
                dashboard_data["multi_period_data"]["impacts"] = total_impact
    
    # Success probability (mock data if not available)
    # In a real implementation, this would come from actual model predictions
    dashboard_data["success_probability_data"]["success"] = 75
    
    return dashboard_data

def generate_dashboard_html(dashboard_data):
    """
    Generate dashboard HTML from dashboard data
    
    Args:
        dashboard_data: Dictionary containing dashboard data
        
    Returns:
        Dashboard HTML as a string
    """
    html = DASHBOARD_TEMPLATE
    
    # Replace placeholders with actual values
    html = html.replace("{{ANALYSIS_DATE}}", dashboard_data["analysis_date"])
    html = html.replace("{{COMPANY_NAME}}", dashboard_data["company_name"])
    html = html.replace("{{TOTAL_IMPACT}}", dashboard_data["total_impact"])
    html = html.replace("{{IMPACT_PERCENTAGE}}", dashboard_data["impact_percentage"])
    html = html.replace("{{PROFIT_IMPACT_PERCENTAGE}}", dashboard_data["profit_impact_percentage"])
    html = html.replace("{{VAR_95}}", dashboard_data["var_95"])
    html = html.replace("{{FLEXIBILITY_VALUE}}", dashboard_data["flexibility_value"])
    
    # Replace JSON data
    html = html.replace("{{IMPACT_DISTRIBUTION_DATA}}", json.dumps(dashboard_data["impact_distribution_data"]))
    html = html.replace("{{SCENARIO_DATA}}", json.dumps(dashboard_data["scenario_data"]))
    html = html.replace("{{MULTI_PERIOD_DATA}}", json.dumps(dashboard_data["multi_period_data"]))
    html = html.replace("{{IMPACT_BREAKDOWN_DATA}}", json.dumps(dashboard_data["impact_breakdown_data"]))
    html = html.replace("{{MITIGATION_DATA}}", json.dumps(dashboard_data["mitigation_data"]))
    html = html.replace("{{SUCCESS_PROBABILITY_DATA}}", json.dumps(dashboard_data["success_probability_data"]))
    
    return html

def save_dashboard(html, output_path):
    """
    Save dashboard HTML to file
    
    Args:
        html: Dashboard HTML as a string
        output_path: Path to save dashboard HTML
    """
    with open(output_path, 'w') as f:
        f.write(html)
    
    print(f"Dashboard saved to {output_path}")

def main():
    """Main function"""
    parser = argparse.ArgumentParser(description="Generate executive dashboard from analysis results")
    parser.add_argument("--results-dir", default="./", help="Directory containing analysis results")
    parser.add_argument("--output", default="tariff_impact_dashboard.html", help="Output HTML file")
    parser.add_argument("--company", help="Company name to filter results")
    
    args = parser.parse_args()
    
    # Load analysis results
    results = load_latest_analysis_results(args.results_dir, args.company)
    
    if not results:
        print("No analysis results found.")
        return
    
    # Generate dashboard data
    dashboard_data = generate_dashboard_data(results)
    
    # Generate dashboard HTML
    html = generate_dashboard_html(dashboard_data)
    
    # Save dashboard
    save_dashboard(html, os.path.join(args.results_dir, args.output))

if __name__ == "__main__":
    main()