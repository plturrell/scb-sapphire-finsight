#!/usr/bin/env python3
"""
Custom tools for tariff research analysis
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass
import numpy as np
from datetime import datetime

from aiq.tool import Tool
from aiq.data_models.function import FunctionInfo, FunctionDependencies


class FinancialCalculator(Tool):
    """Calculate financial impacts of tariffs"""
    
    def __init__(self):
        super().__init__(
            name="financial_calculator",
            description="Calculate financial impacts of tariffs on company metrics"
        )
        
    @property
    def function_info(self) -> FunctionInfo:
        return FunctionInfo(
            name=self.name,
            description=self.description,
            parameters={
                "revenue": {
                    "type": "number",
                    "description": "Annual revenue in USD"
                },
                "tariff_rate": {
                    "type": "number", 
                    "description": "Tariff rate as percentage"
                },
                "export_percentage": {
                    "type": "number",
                    "description": "Percentage of revenue from US exports"
                },
                "cost_structure": {
                    "type": "object",
                    "description": "Optional cost structure breakdown",
                    "optional": True
                }
            }
        )
        
    async def _run(self, revenue: float, tariff_rate: float, 
                   export_percentage: float, cost_structure: Optional[Dict] = None) -> Dict:
        """Calculate financial impacts"""
        
        # Revenue at risk
        revenue_at_risk = revenue * (export_percentage / 100)
        
        # Direct tariff cost
        tariff_cost = revenue_at_risk * (tariff_rate / 100)
        
        # Cash flow impact (immediate)
        cash_flow_impact = -tariff_cost * 0.75  # Assume 75% immediate impact
        
        # Profit margin impact
        current_margin = cost_structure.get("profit_margin", 0.15) if cost_structure else 0.15
        margin_compression = tariff_rate * 0.1  # 10% of tariff rate
        new_margin = max(0, current_margin - margin_compression)
        
        # Working capital requirement increase
        working_capital_increase = tariff_cost * 0.3  # 30% of tariff cost
        
        # Scenario analysis
        scenarios = {
            "best_case": {
                "probability": 0.15,
                "revenue_impact": -revenue_at_risk * 0.05,
                "margin_impact": -0.01
            },
            "expected_case": {
                "probability": 0.60,
                "revenue_impact": -revenue_at_risk * 0.15,
                "margin_impact": -0.03
            },
            "worst_case": {
                "probability": 0.25,
                "revenue_impact": -revenue_at_risk * 0.35,
                "margin_impact": -0.07
            }
        }
        
        return {
            "revenue_at_risk": revenue_at_risk,
            "direct_tariff_cost": tariff_cost,
            "cash_flow_impact": cash_flow_impact,
            "margin_compression": margin_compression,
            "new_margin": new_margin,
            "working_capital_increase": working_capital_increase,
            "scenarios": scenarios,
            "financial_ratios": {
                "debt_service_coverage": 1.2 - (margin_compression * 5),
                "current_ratio": 1.5 - (margin_compression * 2),
                "return_on_equity": 0.18 - margin_compression
            }
        }


class MarketDataTool(Tool):
    """Retrieve market data and competitive analysis"""
    
    def __init__(self):
        super().__init__(
            name="market_data_tool",
            description="Get market data and competitive intelligence"
        )
        
    @property
    def function_info(self) -> FunctionInfo:
        return FunctionInfo(
            name=self.name,
            description=self.description,
            parameters={
                "industry": {
                    "type": "string",
                    "description": "Industry sector"
                },
                "region": {
                    "type": "string",
                    "description": "Geographic region"  
                },
                "competitors": {
                    "type": "array",
                    "description": "List of competitor names",
                    "optional": True
                }
            }
        )
        
    async def _run(self, industry: str, region: str, 
                   competitors: Optional[List[str]] = None) -> Dict:
        """Get market data"""
        
        # Simulated market data
        market_data = {
            "industry": industry,
            "region": region,
            "market_size": 250_000_000_000,  # $250B
            "growth_rate": 0.08,  # 8% annual
            "market_share": {
                "company": 0.22,  # 22% market share
                "competitors": {
                    "competitor_1": 0.18,
                    "competitor_2": 0.15,
                    "competitor_3": 0.12,
                    "others": 0.33
                }
            },
            "price_elasticity": -1.2,  # Price sensitive market
            "switching_costs": "medium",
            "barriers_to_entry": "high",
            "regulatory_environment": "complex",
            "tariff_impacts": {
                "market_disruption": "significant",
                "price_pressure": "high",
                "supply_chain_stress": "moderate"
            }
        }
        
        # Competitive analysis
        competitive_analysis = {
            "competitive_intensity": "high",
            "differentiation_factors": [
                "technology",
                "brand",
                "distribution",
                "cost"
            ],
            "competitor_responses": {
                "price_reduction": 0.7,  # 70% likely
                "market_exit": 0.1,      # 10% likely
                "diversification": 0.2   # 20% likely
            },
            "market_dynamics": {
                "consolidation_trend": "increasing",
                "innovation_pace": "rapid",
                "customer_loyalty": "moderate"
            }
        }
        
        return {
            "market_data": market_data,
            "competitive_analysis": competitive_analysis,
            "market_forecast": {
                "1_year": {"growth": -0.05, "volatility": "high"},
                "3_year": {"growth": 0.03, "volatility": "moderate"},
                "5_year": {"growth": 0.06, "volatility": "low"}
            },
            "strategic_implications": [
                "Market share at risk due to price pressures",
                "Need for cost optimization",
                "Opportunity for market consolidation",
                "Innovation as key differentiator"
            ]
        }


class TradeFinanceOptionsTool(Tool):
    """Get available trade finance options"""
    
    def __init__(self):
        super().__init__(
            name="trade_finance_options",
            description="Retrieve and analyze trade finance options"
        )
        
    @property  
    def function_info(self) -> FunctionInfo:
        return FunctionInfo(
            name=self.name,
            description=self.description,
            parameters={
                "company_size": {
                    "type": "string",
                    "description": "Company size category",
                    "enum": ["small", "medium", "large", "multinational"]
                },
                "impact_type": {
                    "type": "array",
                    "description": "Types of impacts to mitigate"
                },
                "urgency": {
                    "type": "string",
                    "description": "Implementation urgency",
                    "enum": ["immediate", "short_term", "medium_term"],
                    "optional": True
                }
            }
        )
        
    async def _run(self, company_size: str, impact_type: List[str], 
                   urgency: str = "short_term") -> Dict:
        """Get trade finance options"""
        
        # Define finance options based on company size and needs
        all_options = {
            "export_credit_insurance": {
                "name": "Export Credit Insurance",
                "providers": ["HSBC", "Standard Chartered", "AIG"],
                "cost_range": [0.3, 0.8],  # % of insured amount
                "complexity": 4,
                "implementation_time": "2-4 weeks",
                "suitable_for": ["large", "multinational"],
                "mitigates": ["payment_risk", "cash_flow"],
                "requirements": [
                    "Credit assessment",
                    "Trade documentation",
                    "Historical export data"
                ]
            },
            "supply_chain_financing": {
                "name": "Supply Chain Financing",
                "providers": ["Citibank", "JP Morgan", "HSBC"],
                "cost_range": [1.2, 2.5],  # % above base rate
                "complexity": 7,
                "implementation_time": "4-8 weeks",
                "suitable_for": ["medium", "large", "multinational"],
                "mitigates": ["cash_flow", "supplier_risk"],
                "requirements": [
                    "Supply chain mapping",
                    "Technology integration",
                    "Supplier onboarding"
                ]
            },
            "letters_of_credit": {
                "name": "Letters of Credit",
                "providers": ["All major banks"],
                "cost_range": [0.5, 1.5],  # % of transaction
                "complexity": 5,
                "implementation_time": "1-2 weeks",
                "suitable_for": ["all"],
                "mitigates": ["payment_risk", "trust"],
                "requirements": [
                    "Bank relationship",
                    "Trade documentation",
                    "Compliance checks"
                ]
            },
            "working_capital_loans": {
                "name": "Working Capital Loans",
                "providers": ["Commercial banks", "Development banks"],
                "cost_range": [2.0, 5.0],  # % above base rate
                "complexity": 5,
                "implementation_time": "2-4 weeks",
                "suitable_for": ["all"],
                "mitigates": ["cash_flow", "liquidity"],
                "requirements": [
                    "Financial statements",
                    "Business plan",
                    "Collateral"
                ]
            },
            "structured_trade_finance": {
                "name": "Structured Trade Finance",
                "providers": ["Investment banks", "Specialized lenders"],
                "cost_range": [1.8, 3.5],  # % above base rate
                "complexity": 9,
                "implementation_time": "8-12 weeks",
                "suitable_for": ["large", "multinational"],
                "mitigates": ["complex_risks", "strategic_shifts"],
                "requirements": [
                    "Complex documentation",
                    "Legal structuring",
                    "Multi-party agreements"
                ]
            }
        }
        
        # Filter options based on company size and impact type
        suitable_options = {}
        for key, option in all_options.items():
            if company_size in option["suitable_for"] or "all" in option["suitable_for"]:
                if any(impact in option["mitigates"] for impact in impact_type):
                    suitable_options[key] = option
                    
        # Add urgency-based recommendations
        recommendations = []
        if urgency == "immediate":
            recommendations = ["letters_of_credit", "working_capital_loans"]
        elif urgency == "short_term":
            recommendations = ["export_credit_insurance", "supply_chain_financing"]
        else:
            recommendations = ["structured_trade_finance", "supply_chain_financing"]
            
        return {
            "suitable_options": suitable_options,
            "recommended_options": [opt for opt in recommendations if opt in suitable_options],
            "implementation_roadmap": {
                "phase_1": "Immediate liquidity support",
                "phase_2": "Risk mitigation instruments",
                "phase_3": "Strategic restructuring"
            },
            "total_cost_estimate": f"{len(suitable_options) * 0.5}-{len(suitable_options) * 2.0}% of revenue",
            "combined_strategy": {
                "description": "Multi-layered approach using multiple instruments",
                "benefits": "Comprehensive risk coverage and flexibility",
                "considerations": "Higher complexity and coordination required"
            }
        }


class RiskAssessmentTool(Tool):
    """Assess risk levels for different scenarios"""
    
    def __init__(self):
        super().__init__(
            name="risk_assessment",
            description="Comprehensive risk assessment for tariff scenarios"
        )
        
    @property
    def function_info(self) -> FunctionInfo:
        return FunctionInfo(
            name=self.name,
            description=self.description,
            parameters={
                "scenario": {
                    "type": "string",
                    "description": "Scenario to assess"
                },
                "financial_data": {
                    "type": "object",
                    "description": "Company financial data"
                },
                "market_data": {
                    "type": "object",
                    "description": "Market conditions data",
                    "optional": True
                }
            }
        )
        
    async def _run(self, scenario: str, financial_data: Dict, 
                   market_data: Optional[Dict] = None) -> Dict:
        """Assess risks"""
        
        # Base risk factors
        base_risks = {
            "financial_risk": {
                "liquidity": 0.7,
                "solvency": 0.4,
                "profitability": 0.8,
                "credit": 0.5
            },
            "operational_risk": {
                "supply_chain": 0.6,
                "production": 0.5,
                "technology": 0.3,
                "human_resources": 0.4
            },
            "market_risk": {
                "demand": 0.8,
                "competition": 0.7,
                "pricing": 0.9,
                "reputation": 0.5
            },
            "strategic_risk": {
                "business_model": 0.6,
                "innovation": 0.5,
                "regulatory": 0.7,
                "geopolitical": 0.9
            }
        }
        
        # Scenario-specific adjustments
        scenario_adjustments = {
            "high_tariff": {
                "financial_risk": 0.2,
                "market_risk": 0.3,
                "strategic_risk": 0.25
            },
            "prolonged_impact": {
                "financial_risk": 0.3,
                "operational_risk": 0.2,
                "strategic_risk": 0.3
            },
            "market_disruption": {
                "market_risk": 0.35,
                "operational_risk": 0.2,
                "strategic_risk": 0.15
            }
        }
        
        # Calculate adjusted risks
        adjusted_risks = {}
        adjustments = scenario_adjustments.get(scenario, {})
        
        for risk_category, risks in base_risks.items():
            adjusted_risks[risk_category] = {}
            adjustment = adjustments.get(risk_category, 0)
            
            for risk_type, base_score in risks.items():
                adjusted_score = min(1.0, base_score + adjustment)
                adjusted_risks[risk_category][risk_type] = adjusted_score
                
        # Calculate aggregate risk score
        total_score = 0
        risk_count = 0
        for category_risks in adjusted_risks.values():
            for score in category_risks.values():
                total_score += score
                risk_count += 1
                
        aggregate_risk = total_score / risk_count if risk_count > 0 else 0
        
        # Risk mitigation recommendations
        mitigation_strategies = []
        if aggregate_risk > 0.7:
            mitigation_strategies.extend([
                "Immediate liquidity injection",
                "Aggressive cost reduction",
                "Market diversification",
                "Strategic partnerships"
            ])
        elif aggregate_risk > 0.5:
            mitigation_strategies.extend([
                "Working capital optimization",
                "Gradual market shift",
                "Operational efficiency",
                "Risk hedging instruments"
            ])
        else:
            mitigation_strategies.extend([
                "Monitor and adjust",
                "Opportunistic improvements",
                "Long-term planning",
                "Innovation investment"
            ])
            
        return {
            "scenario": scenario,
            "risk_scores": adjusted_risks,
            "aggregate_risk_level": aggregate_risk,
            "risk_rating": "Critical" if aggregate_risk > 0.7 else "High" if aggregate_risk > 0.5 else "Moderate",
            "key_risk_factors": [
                risk_type for category in adjusted_risks.values() 
                for risk_type, score in category.items() if score > 0.7
            ],
            "mitigation_strategies": mitigation_strategies,
            "monitoring_indicators": {
                "financial": ["cash_flow", "debt_ratios", "margins"],
                "operational": ["inventory_turns", "supplier_reliability"],
                "market": ["market_share", "pricing_power", "customer_retention"],
                "strategic": ["regulatory_changes", "competitor_moves"]
            },
            "action_timeline": {
                "immediate": "0-30 days",
                "short_term": "1-6 months",
                "medium_term": "6-18 months",
                "long_term": "18+ months"
            }
        }


# Register tools with AIQtoolkit
def register_research_tools():
    """Register all research tools"""
    from aiq.tool import register_tool
    
    tools = [
        FinancialCalculator(),
        MarketDataTool(),
        TradeFinanceOptionsTool(),
        RiskAssessmentTool()
    ]
    
    for tool in tools:
        register_tool(tool.name, tool)
        
    print(f"Registered {len(tools)} research tools")
    

if __name__ == "__main__":
    # Example usage
    import asyncio
    
    async def test_tools():
        # Test financial calculator
        calc = FinancialCalculator()
        financial_impact = await calc.run(
            revenue=60_000_000_000,
            tariff_rate=46,
            export_percentage=35
        )
        print("Financial Impact:", financial_impact)
        
        # Test market data tool
        market_tool = MarketDataTool()
        market_data = await market_tool.run(
            industry="Electronics",
            region="North America"
        )
        print("\nMarket Data:", market_data)
        
        # Test finance options
        finance_tool = TradeFinanceOptionsTool()
        finance_options = await finance_tool.run(
            company_size="large",
            impact_type=["cash_flow", "payment_risk"]
        )
        print("\nFinance Options:", finance_options)
        
        # Test risk assessment
        risk_tool = RiskAssessmentTool()
        risk_assessment = await risk_tool.run(
            scenario="high_tariff",
            financial_data={"revenue": 60_000_000_000, "margin": 0.15}
        )
        print("\nRisk Assessment:", risk_assessment)
        
    asyncio.run(test_tools())