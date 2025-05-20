from http.server import BaseHTTPRequestHandler
import json
from os import environ, path, makedirs
import shutil
from datetime import datetime

# Sample analysis data for development
SAMPLE_ANALYSIS_DATA = {
    "metadata": {
        "company": "Samsung Electronics Vietnam",
        "analysis_date": datetime.now().isoformat(),
        "analysis_version": "1.0.0"
    },
    "baseline_data": {
        "company_profile": {
            "name": "Samsung Electronics Vietnam",
            "industry": "Electronics",
            "annual_revenue": 60000000000,
            "employee_count": 160000,
            "us_export_percentage": 35.0
        },
        "financial_metrics": {
            "revenue_at_risk": 21000000000,
            "direct_tariff_cost": 9660000000,
            "cash_flow_impact": -7245000000,
            "margin_compression": 4.6,
            "working_capital_increase": 2898000000
        }
    },
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
        },
        {
            "category": "strategic",
            "severity": 9,
            "timeframe": "long_term",
            "description": "Reduced competitiveness in US market",
            "financial_impact": -4800000000
        }
    ],
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
        },
        {
            "name": "Working Capital Loans",
            "provider": "Commercial banks",
            "cost": 3.2,
            "complexity": 6,
            "implementation_time": "3-5 weeks",
            "impact_mitigation": ["cash_flow", "liquidity"],
            "requirements": ["financial_statements", "collateral"]
        }
    ],
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
    },
    "executive_summary": {
        "situation_overview": "Samsung Electronics Vietnam faces significant challenges due to 46% US tariffs affecting key export products. This analysis assesses impacts and recommends mitigation strategies.",
        "key_findings": {
            "total_financial_impact": "$9.66B",
            "critical_risk_areas": 3
        },
        "success_probability": {
            "with_recommended_actions": 0.85,
            "without_intervention": 0.35
        }
    }
}

def save_sample_data():
    """Save sample analysis data to the designated directory"""
    results_path = environ.get('ANALYSIS_RESULTS_PATH', '/tmp/analysis-results')
    
    # Create directory if it doesn't exist
    makedirs(results_path, exist_ok=True)
    
    # Save sample data
    analysis_file = path.join(results_path, 'tariff_analysis_latest.json')
    with open(analysis_file, 'w') as f:
        json.dump(SAMPLE_ANALYSIS_DATA, f, indent=2)
    
    return {
        "saved_to": analysis_file,
        "timestamp": datetime.now().isoformat(),
        "status": "success"
    }

class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        """Initialize sample data for Vercel deployment"""
        try:
            result = save_sample_data()
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(result).encode())
            
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode())