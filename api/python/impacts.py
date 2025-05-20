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
                "tariff_impacts": [
                    {
                        "category": "financial",
                        "severity": 8,
                        "timeframe": "immediate",
                        "description": "Significant cash flow reduction due to tariff costs",
                        "financial_impact": -3500000000
                    },
                    {
                        "category": "market",
                        "severity": 7,
                        "timeframe": "medium_term",
                        "description": "Potential loss of US market share",
                        "financial_impact": -2100000000
                    },
                    {
                        "category": "operational",
                        "severity": 6,
                        "timeframe": "short_term",
                        "description": "Supply chain disruption",
                        "financial_impact": -950000000
                    }
                ]
            }

class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        """Handle GET request for impacts endpoint"""
        # Load analysis data
        analysis_data = load_analysis_data()
        
        if not analysis_data or "tariff_impacts" not in analysis_data:
            self.send_response(404)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"error": "No impact data available"}).encode())
            return
        
        # Extract and format impacts
        try:
            impacts = analysis_data["tariff_impacts"]
            
            # Convert to format expected by dashboard
            formatted_impacts = []
            for impact in impacts:
                formatted_impact = {
                    "category": {"value": impact["category"]},
                    "severity": {"value": str(impact["severity"])},
                    "timeframe": {"value": impact["timeframe"]},
                    "description": {"value": impact["description"]}
                }
                
                if "financial_impact" in impact and impact["financial_impact"] is not None:
                    formatted_impact["financialImpact"] = {"value": impact["financial_impact"]}
                
                formatted_impacts.append(formatted_impact)
            
            # Send successful response
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(formatted_impacts).encode())
            
        except Exception as e:
            # Send error response
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"error": f"Error processing impacts: {str(e)}"}).encode())