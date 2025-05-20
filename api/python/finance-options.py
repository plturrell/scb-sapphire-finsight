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
                "finance_options": [
                    {
                        "name": "Export Credit Insurance",
                        "provider": "HSBC",
                        "cost": 0.5,
                        "complexity": 4,
                        "implementation_time": "2-4 weeks",
                        "impact_mitigation": ["cash_flow", "payment_risk"],
                        "requirements": ["credit_assessment", "trade_documentation"]
                    },
                    {
                        "name": "Supply Chain Financing",
                        "provider": "Standard Chartered",
                        "cost": 1.8,
                        "complexity": 7,
                        "implementation_time": "4-6 weeks",
                        "impact_mitigation": ["cash_flow", "supplier_relationships"],
                        "requirements": ["supply_chain_mapping", "technology_integration"]
                    },
                    {
                        "name": "Letters of Credit",
                        "provider": "Multiple banks",
                        "cost": 0.8,
                        "complexity": 5,
                        "implementation_time": "1-2 weeks",
                        "impact_mitigation": ["payment_risk", "trust"],
                        "requirements": ["bank_relationship", "trade_documentation"]
                    }
                ]
            }

class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        """Handle GET request for finance options endpoint"""
        # Load analysis data
        analysis_data = load_analysis_data()
        
        if not analysis_data or "finance_options" not in analysis_data:
            self.send_response(404)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"error": "No finance options available"}).encode())
            return
        
        # Extract and format finance options
        try:
            options = analysis_data["finance_options"]
            
            # Convert to format expected by dashboard
            formatted_options = []
            for option in options:
                formatted_options.append({
                    "name": {"value": option["name"]},
                    "provider": {"value": option["provider"]},
                    "cost": {"value": str(option["cost"])},
                    "complexity": {"value": str(option["complexity"])},
                    "implementationTime": {"value": option["implementation_time"]}
                })
            
            # Send successful response
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(formatted_options).encode())
            
        except Exception as e:
            # Send error response
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"error": f"Error processing finance options: {str(e)}"}).encode())