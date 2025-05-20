from http.server import BaseHTTPRequestHandler
from os import environ, path
import json
import sys

# Add the backend directory to the path
sys.path.append(path.abspath(path.join(path.dirname(__file__), '..', '..', 'backend')))

# Try to import directly from the copied backend modules
try:
    from api.api_server import load_analysis_data
except ImportError:
    # Fallback to local implementation if backend modules not available
    def load_analysis_data():
        """Load the latest analysis results"""
        results_path = environ.get('ANALYSIS_RESULTS_PATH', '/tmp/analysis-results')
        analysis_file = path.join(results_path, 'tariff_analysis_latest.json')
        
        try:
            with open(analysis_file, 'r') as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading analysis data: {e}")
            # Return mock data if file not available
            return {
                "metadata": {
                    "company": "Sample Corp",
                    "analysis_date": "2025-05-20T10:30:00"
                },
                "baseline_data": {
                    "company_profile": {
                        "name": "Sample Corp",
                        "industry": "Electronics",
                        "annual_revenue": 45000000000,
                        "employee_count": 95000,
                        "us_export_percentage": 28.5
                    },
                    "financial_metrics": {
                        "revenue_at_risk": 12825000000,
                        "direct_tariff_cost": 5899500000,
                        "cash_flow_impact": -3650000000,
                        "margin_compression": 4.6,
                        "working_capital_increase": 1800000000
                    }
                },
                "executive_summary": {
                    "situation_overview": "Sample analysis of tariff impacts",
                    "key_findings": {
                        "total_financial_impact": "$5.9B",
                        "critical_risk_areas": 3
                    },
                    "success_probability": {
                        "with_recommended_actions": 0.85,
                        "without_intervention": 0.35
                    }
                }
            }

class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        """Handle GET request for metrics endpoint"""
        # Load analysis data
        analysis_data = load_analysis_data()
        
        if not analysis_data:
            self.send_response(404)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"error": "No analysis data available"}).encode())
            return
        
        # Extract metrics from analysis data
        try:
            baseline = analysis_data["baseline_data"]["financial_metrics"]
            summary = analysis_data["executive_summary"]
            company_profile = analysis_data["baseline_data"]["company_profile"]
            
            metrics = {
                "company": analysis_data["metadata"]["company"],
                "revenue": company_profile["annual_revenue"],
                "revenue_at_risk": baseline["revenue_at_risk"],
                "total_impact": summary["key_findings"]["total_financial_impact"],
                "critical_risks": summary["key_findings"]["critical_risk_areas"],
                "success_probability": summary["success_probability"]["with_recommended_actions"]
            }
            
            # Send successful response
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(metrics).encode())
            
        except Exception as e:
            # Send error response
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"error": f"Error processing metrics: {str(e)}"}).encode())