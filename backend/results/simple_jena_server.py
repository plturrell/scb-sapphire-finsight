#!/usr/bin/env python3
"""
Simple Jena Data Server using built-in libraries
"""

import http.server
import json
from datetime import datetime
import random
from urllib.parse import urlparse, parse_qs

# Simulated Jena data store
jena_data = {
    "company": "Samsung Electronics Vietnam",
    "totalRevenue": 47000000000,
    "revenueAtRisk": 21000000000,
    "tariffRate": 0.25,
    "riskScore": 87,
    "tradeBalance": 80000000000,
    "lastUpdated": datetime.now().isoformat(),
    "monthlyRevenue": [3900, 4100, 4200, 4300, 4100, 4000, 3800, 3600, 3500, 3400, 3300, 3200],
    "productCategories": {
        "Consumer Electronics": 22400000000,
        "Semiconductors": 11600000000,
        "Display Panels": 5480000000,
        "Home Appliances": 7520000000
    },
    "marketDistribution": {
        "US": 21000000000,
        "China": 9000000000,
        "Europe": 8000000000,
        "Japan": 5000000000,
        "Others": 4000000000
    }
}

class JenaDataHandler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        parsed_path = urlparse(self.path)
        
        # Enable CORS
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        if parsed_path.path == '/api/jena/latest':
            # Update some values for realism
            jena_data["lastUpdated"] = datetime.now().isoformat()
            jena_data["riskScore"] = min(100, jena_data["riskScore"] + random.randint(-2, 3))
            
            self.wfile.write(json.dumps(jena_data).encode())
            
        elif parsed_path.path == '/api/jena/sankeydata':
            sankey_data = {
                "nodes": [
                    {"name": jena_data["company"], "id": 0},
                    {"name": "Consumer Electronics", "id": 1},
                    {"name": "Semiconductors", "id": 2},
                    {"name": "Display Panels", "id": 3},
                    {"name": "US Market (at risk)", "id": 4},
                    {"name": "China Market", "id": 5},
                    {"name": "Europe Market", "id": 6},
                    {"name": "Other Markets", "id": 7}
                ],
                "links": [
                    {"source": 0, "target": 1, "value": 22400, "risk": False},
                    {"source": 0, "target": 2, "value": 11600, "risk": False},
                    {"source": 0, "target": 3, "value": 5480, "risk": False},
                    {"source": 1, "target": 4, "value": 5600, "risk": True},
                    {"source": 1, "target": 5, "value": 6720, "risk": False},
                    {"source": 1, "target": 6, "value": 5600, "risk": False},
                    {"source": 1, "target": 7, "value": 4480, "risk": False},
                    {"source": 2, "target": 4, "value": 2900, "risk": True},
                    {"source": 2, "target": 5, "value": 3480, "risk": False},
                    {"source": 2, "target": 6, "value": 2900, "risk": False},
                    {"source": 2, "target": 7, "value": 2320, "risk": False},
                    {"source": 3, "target": 4, "value": 1370, "risk": True},
                    {"source": 3, "target": 5, "value": 1644, "risk": False},
                    {"source": 3, "target": 6, "value": 1370, "risk": False},
                    {"source": 3, "target": 7, "value": 1096, "risk": False}
                ]
            }
            self.wfile.write(json.dumps(sankey_data).encode())
            
        else:
            self.wfile.write(json.dumps({"error": "Not found"}).encode())
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def log_message(self, format, *args):
        # Suppress log messages
        pass

if __name__ == '__main__':
    PORT = 5000
    server = http.server.HTTPServer(('localhost', PORT), JenaDataHandler)
    print(f"Jena Data Server running on http://localhost:{PORT}")
    print("Endpoints:")
    print("  GET /api/jena/latest - Get latest data")
    print("  GET /api/jena/sankeydata - Get Sankey diagram data")
    server.serve_forever()