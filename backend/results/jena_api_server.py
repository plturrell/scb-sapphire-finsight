#!/usr/bin/env python3
"""
Simple Jena API Server
Provides REST endpoints for the dashboard to fetch data
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
import json
from datetime import datetime
import random

app = Flask(__name__)
CORS(app)

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
    },
    "tariffImpacts": {
        "Consumer Electronics": {"rate": 0.25, "impact": 5600000000},
        "Semiconductors": {"rate": 0.25, "impact": 2900000000},
        "Display Panels": {"rate": 0.25, "impact": 1370000000}
    },
    "riskIndicators": {
        "geopolitical": 0.85,
        "regulatory": 0.90,
        "market": 0.65,
        "operational": 0.45,
        "currency": 0.55
    }
}

@app.route('/api/jena/latest')
def get_latest_data():
    """Get latest data from Jena store"""
    # Simulate real-time updates
    jena_data["lastUpdated"] = datetime.now().isoformat()
    jena_data["riskScore"] = min(100, jena_data["riskScore"] + random.randint(-2, 3))
    
    # Add some variation to monthly revenue
    base_revenue = jena_data["monthlyRevenue"][0]
    for i in range(len(jena_data["monthlyRevenue"])):
        jena_data["monthlyRevenue"][i] = int(base_revenue * (0.9 + random.random() * 0.2))
    
    return jsonify(jena_data)

@app.route('/api/jena/refresh', methods=['POST'])
def refresh_data():
    """Refresh data from external sources"""
    # Simulate data refresh
    jena_data["lastUpdated"] = datetime.now().isoformat()
    
    # Update risk indicators with random variations
    for key in jena_data["riskIndicators"]:
        jena_data["riskIndicators"][key] = min(1.0, max(0.0, 
            jena_data["riskIndicators"][key] + (random.random() - 0.5) * 0.1))
    
    return jsonify({"status": "success", "timestamp": jena_data["lastUpdated"]})

@app.route('/api/jena/query', methods=['POST'])
def custom_query():
    """Execute custom SPARQL query"""
    query = request.json.get('query', '')
    
    # Simulate SPARQL query processing
    if 'SELECT' in query.upper():
        # Return sample results
        results = {
            "head": {"vars": ["company", "revenue", "risk"]},
            "results": {
                "bindings": [
                    {
                        "company": {"type": "uri", "value": "http://example.org/company#samsung"},
                        "revenue": {"type": "literal", "value": str(jena_data["totalRevenue"])},
                        "risk": {"type": "literal", "value": str(jena_data["riskScore"])}
                    }
                ]
            }
        }
        return jsonify(results)
    
    return jsonify({"error": "Invalid query"})

@app.route('/api/jena/sankeydata')
def get_sankey_data():
    """Get data formatted for Sankey diagram"""
    sankey_data = {
        "nodes": [
            {"name": jena_data["company"], "id": 0},
            {"name": "Consumer Electronics", "id": 1},
            {"name": "Semiconductors", "id": 2},
            {"name": "Display Panels", "id": 3},
            {"name": "Home Appliances", "id": 4},
            {"name": "US Market (at risk)", "id": 5},
            {"name": "China Market", "id": 6},
            {"name": "Europe Market", "id": 7},
            {"name": "Japan Market", "id": 8},
            {"name": "Other Markets", "id": 9}
        ],
        "links": []
    }
    
    # Calculate flows based on actual data
    total_revenue = jena_data["totalRevenue"]
    
    # Company to product categories
    for i, (product, value) in enumerate(jena_data["productCategories"].items(), 1):
        ratio = value / total_revenue
        sankey_data["links"].append({
            "source": 0,
            "target": i,
            "value": value / 1000000,  # Convert to millions
            "risk": False
        })
    
    # Products to markets
    for i, (product, prod_value) in enumerate(jena_data["productCategories"].items(), 1):
        for j, (market, market_value) in enumerate(jena_data["marketDistribution"].items(), 5):
            # Distribute product value across markets proportionally
            flow_value = (prod_value * market_value) / total_revenue
            sankey_data["links"].append({
                "source": i,
                "target": j,
                "value": flow_value / 1000000,  # Convert to millions
                "risk": market == "US"  # US market flows are at risk
            })
    
    return jsonify(sankey_data)

@app.route('/api/jena/health')
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "service": "Jena Data API",
        "timestamp": datetime.now().isoformat()
    })

if __name__ == '__main__':
    print("Starting Jena Data API Server on http://localhost:5000")
    print("Endpoints:")
    print("  GET  /api/jena/latest      - Get latest data")
    print("  POST /api/jena/refresh     - Refresh data")
    print("  POST /api/jena/query       - Execute SPARQL query")
    print("  GET  /api/jena/sankeydata  - Get Sankey diagram data")
    print("  GET  /api/jena/health      - Health check")
    app.run(host='0.0.0.0', port=5000, debug=True)