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
                "recommendations": {
                    "immediate_actions": [
                        {
                            "action": "Implement export credit insurance",
                            "priority": "High",
                            "timeline": "0-30 days",
                            "cost": "$2.5M"
                        },
                        {
                            "action": "Optimize working capital management",
                            "priority": "High",
                            "timeline": "0-30 days",
                            "cost": "$1.8M"
                        },
                        {
                            "action": "Diversify supplier base",
                            "priority": "Medium",
                            "timeline": "30-60 days",
                            "cost": "$3.2M"
                        }
                    ],
                    "short_term_strategy": [
                        {
                            "strategy": "Develop alternative markets",
                            "timeline": "60-180 days",
                            "investment_required": "$8.5M"
                        },
                        {
                            "strategy": "Implement pricing strategy changes",
                            "timeline": "30-90 days",
                            "investment_required": "$1.2M"
                        }
                    ],
                    "long_term_strategy": [
                        {
                            "strategy": "Establish regional production facilities",
                            "timeline": "12-24 months",
                            "investment_required": "$120M"
                        }
                    ]
                }
            }

class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        """Handle GET request for recommendations endpoint"""
        # Load analysis data
        analysis_data = load_analysis_data()
        
        if not analysis_data or "recommendations" not in analysis_data:
            self.send_response(404)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"error": "No recommendations available"}).encode())
            return
        
        # Extract and group recommendations
        try:
            recommendations = analysis_data["recommendations"]
            
            # Group by timeline
            timeline_groups = {}
            
            # Immediate actions
            for action in recommendations.get("immediate_actions", []):
                timeline = action["timeline"]
                if timeline not in timeline_groups:
                    timeline_groups[timeline] = []
                timeline_groups[timeline].append({
                    "action": action["action"],
                    "priority": action["priority"],
                    "cost": action.get("cost")
                })
            
            # Short-term strategies
            for strategy in recommendations.get("short_term_strategy", []):
                timeline = strategy["timeline"]
                if timeline not in timeline_groups:
                    timeline_groups[timeline] = []
                timeline_groups[timeline].append({
                    "action": strategy["strategy"],
                    "priority": "High",
                    "cost": strategy.get("investment_required")
                })
            
            # Send successful response
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(timeline_groups).encode())
            
        except Exception as e:
            # Send error response
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"error": f"Error processing recommendations: {str(e)}"}).encode())