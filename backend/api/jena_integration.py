#!/usr/bin/env python3
"""
Apache Jena Integration for Deep Research Data
Stores all analysis results as RDF triples for real-time querying
"""

import json
import requests
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any
from SPARQLWrapper import SPARQLWrapper, JSON, POST
from rdflib import Graph, Namespace, Literal, URIRef, BNode
from rdflib.namespace import RDF, RDFS, OWL, XSD, DC, DCTERMS

# Namespaces
CTFA = Namespace("http://example.org/company-tariff-finance-analysis#")
PROV = Namespace("http://www.w3.org/ns/prov#")
FOAF = Namespace("http://xmlns.com/foaf/0.1/")
TIME = Namespace("http://www.w3.org/2006/time#")
QUDT = Namespace("http://qudt.org/schema/qudt#")

class JenaDataStore:
    """
    Apache Jena triple store for deep research data
    """
    
    def __init__(self, fuseki_url="http://localhost:3030/tariff_research"):
        self.fuseki_url = fuseki_url
        self.sparql_endpoint = f"{fuseki_url}/sparql"
        self.update_endpoint = f"{fuseki_url}/update"
        self.graph = Graph()
        self._bind_namespaces()
        
    def _bind_namespaces(self):
        """Bind commonly used namespaces"""
        self.graph.bind("ctfa", CTFA)
        self.graph.bind("prov", PROV)
        self.graph.bind("foaf", FOAF)
        self.graph.bind("dc", DC)
        self.graph.bind("dct", DCTERMS)
        self.graph.bind("time", TIME)
        self.graph.bind("qudt", QUDT)
        
    def load_analysis_results(self, json_file: str):
        """Load analysis results from JSON and convert to RDF"""
        with open(json_file, 'r') as f:
            data = json.load(f)
            
        # Create main analysis entity
        analysis_uri = URIRef(f"{CTFA}Analysis_{data['metadata']['analysis_date'].replace(':', '-')}")
        
        # Add analysis metadata
        self.graph.add((analysis_uri, RDF.type, CTFA.TariffAnalysis))
        self.graph.add((analysis_uri, DC.title, Literal(f"Tariff Analysis - {data['metadata']['company']}")))
        self.graph.add((analysis_uri, DCTERMS.created, Literal(data['metadata']['analysis_date'], datatype=XSD.dateTime)))
        self.graph.add((analysis_uri, CTFA.analysisVersion, Literal(data['metadata']['analysis_version'])))
        
        # Add company data
        company_uri = URIRef(f"{CTFA}Company_{data['metadata']['company'].replace(' ', '_')}")
        self.graph.add((company_uri, RDF.type, CTFA.Company))
        self.graph.add((company_uri, RDFS.label, Literal(data['metadata']['company'])))
        self.graph.add((analysis_uri, CTFA.analyzedCompany, company_uri))
        
        # Add baseline data
        baseline_uri = BNode()
        self.graph.add((analysis_uri, CTFA.hasBaselineData, baseline_uri))
        self._add_baseline_data(baseline_uri, data['baseline_data'])
        
        # Add impacts
        for impact in data['tariff_impacts']:
            impact_uri = BNode()
            self.graph.add((analysis_uri, CTFA.hasImpact, impact_uri))
            self._add_impact_data(impact_uri, impact)
            
        # Add finance options
        for option in data['finance_options']:
            option_uri = BNode()
            self.graph.add((analysis_uri, CTFA.hasFinanceOption, option_uri))
            self._add_finance_option_data(option_uri, option)
            
        # Add recommendations
        rec_uri = BNode()
        self.graph.add((analysis_uri, CTFA.hasRecommendations, rec_uri))
        self._add_recommendations(rec_uri, data['recommendations'])
        
        # Add executive summary
        summary_uri = BNode()
        self.graph.add((analysis_uri, CTFA.hasExecutiveSummary, summary_uri))
        self._add_executive_summary(summary_uri, data['executive_summary'])
        
        return analysis_uri
        
    def _add_baseline_data(self, baseline_uri, baseline_data):
        """Add baseline company data as triples"""
        self.graph.add((baseline_uri, RDF.type, CTFA.BaselineData))
        
        # Company profile
        profile = baseline_data['company_profile']
        self.graph.add((baseline_uri, CTFA.companyName, Literal(profile['name'])))
        self.graph.add((baseline_uri, CTFA.industry, Literal(profile['industry'])))
        self.graph.add((baseline_uri, CTFA.annualRevenue, Literal(profile['annual_revenue'], datatype=XSD.decimal)))
        self.graph.add((baseline_uri, CTFA.employeeCount, Literal(profile['employee_count'], datatype=XSD.integer)))
        self.graph.add((baseline_uri, CTFA.usExportPercentage, Literal(profile['us_export_percentage'], datatype=XSD.decimal)))
        
        # Financial metrics
        metrics = baseline_data['financial_metrics']
        for key, value in metrics.items():
            if isinstance(value, (int, float)):
                self.graph.add((baseline_uri, CTFA[key], Literal(value, datatype=XSD.decimal)))
                
    def _add_impact_data(self, impact_uri, impact):
        """Add tariff impact data as triples"""
        self.graph.add((impact_uri, RDF.type, CTFA.TariffImpact))
        self.graph.add((impact_uri, CTFA.category, Literal(impact['category'])))
        self.graph.add((impact_uri, CTFA.severity, Literal(impact['severity'], datatype=XSD.integer)))
        self.graph.add((impact_uri, CTFA.timeframe, Literal(impact['timeframe'])))
        self.graph.add((impact_uri, DC.description, Literal(impact['description'])))
        
        if 'financial_impact' in impact and impact['financial_impact']:
            self.graph.add((impact_uri, CTFA.financialImpact, Literal(impact['financial_impact'], datatype=XSD.decimal)))
            
        for option in impact.get('mitigation_options', []):
            self.graph.add((impact_uri, CTFA.hasMitigationOption, Literal(option)))
            
    def _add_finance_option_data(self, option_uri, option):
        """Add trade finance option data as triples"""
        self.graph.add((option_uri, RDF.type, CTFA.TradeFinanceOption))
        self.graph.add((option_uri, RDFS.label, Literal(option['name'])))
        self.graph.add((option_uri, CTFA.provider, Literal(option['provider'])))
        self.graph.add((option_uri, CTFA.cost, Literal(option['cost'], datatype=XSD.decimal)))
        self.graph.add((option_uri, CTFA.complexity, Literal(option['complexity'], datatype=XSD.integer)))
        self.graph.add((option_uri, CTFA.implementationTime, Literal(option['implementation_time'])))
        
        for mitigation in option.get('impact_mitigation', []):
            self.graph.add((option_uri, CTFA.mitigates, Literal(mitigation)))
            
        for requirement in option.get('requirements', []):
            self.graph.add((option_uri, CTFA.requires, Literal(requirement)))
            
    def _add_recommendations(self, rec_uri, recommendations):
        """Add strategic recommendations as triples"""
        self.graph.add((rec_uri, RDF.type, CTFA.Recommendations))
        
        # Immediate actions
        for action in recommendations.get('immediate_actions', []):
            action_uri = BNode()
            self.graph.add((rec_uri, CTFA.hasImmediateAction, action_uri))
            self.graph.add((action_uri, RDF.type, CTFA.ImmediateAction))
            self.graph.add((action_uri, RDFS.label, Literal(action['action'])))
            self.graph.add((action_uri, CTFA.timeline, Literal(action['timeline'])))
            self.graph.add((action_uri, CTFA.priority, Literal(action['priority'])))
            if 'cost' in action:
                self.graph.add((action_uri, CTFA.cost, Literal(action['cost'])))
                
    def _add_executive_summary(self, summary_uri, summary):
        """Add executive summary as triples"""
        self.graph.add((summary_uri, RDF.type, CTFA.ExecutiveSummary))
        self.graph.add((summary_uri, DC.description, Literal(summary['situation_overview'])))
        
        # Key findings
        findings = summary['key_findings']
        self.graph.add((summary_uri, CTFA.totalFinancialImpact, Literal(findings['total_financial_impact'])))
        self.graph.add((summary_uri, CTFA.criticalRiskAreas, Literal(findings['critical_risk_areas'], datatype=XSD.integer)))
        
        # Success probability
        prob = summary['success_probability']
        self.graph.add((summary_uri, CTFA.successWithIntervention, Literal(prob['with_recommended_actions'])))
        self.graph.add((summary_uri, CTFA.successWithoutIntervention, Literal(prob['without_intervention'])))
        
    def upload_to_fuseki(self):
        """Upload the RDF graph to Apache Jena Fuseki"""
        # Convert graph to N-Triples format
        data = self.graph.serialize(format='nt')
        
        # Upload to Fuseki
        headers = {'Content-Type': 'application/n-triples'}
        response = requests.post(f"{self.fuseki_url}/data", data=data, headers=headers)
        
        if response.status_code == 200:
            print(f"Successfully uploaded {len(self.graph)} triples to Fuseki")
        else:
            print(f"Error uploading to Fuseki: {response.status_code} - {response.text}")
            
    def query(self, sparql_query: str) -> List[Dict]:
        """Execute SPARQL query against Fuseki"""
        sparql = SPARQLWrapper(self.sparql_endpoint)
        sparql.setQuery(sparql_query)
        sparql.setReturnFormat(JSON)
        
        try:
            results = sparql.query().convert()
            return results["results"]["bindings"]
        except Exception as e:
            print(f"Query error: {e}")
            return []
            
    def get_real_time_metrics(self) -> Dict[str, Any]:
        """Get real-time metrics from the knowledge graph"""
        query = """
        PREFIX ctfa: <http://example.org/company-tariff-finance-analysis#>
        PREFIX dc: <http://purl.org/dc/elements/1.1/>
        PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
        
        SELECT ?company ?revenue ?revenueAtRisk ?totalImpact ?criticalRisks ?successProb
        WHERE {
            ?analysis a ctfa:TariffAnalysis ;
                     ctfa:analyzedCompany ?company ;
                     ctfa:hasBaselineData ?baseline ;
                     ctfa:hasExecutiveSummary ?summary .
            
            ?baseline ctfa:annualRevenue ?revenue ;
                      ctfa:revenue_at_risk ?revenueAtRisk .
                      
            ?summary ctfa:totalFinancialImpact ?totalImpact ;
                     ctfa:criticalRiskAreas ?criticalRisks ;
                     ctfa:successWithIntervention ?successProb .
        }
        ORDER BY DESC(?analysis)
        LIMIT 1
        """
        
        results = self.query(query)
        if results:
            return {
                "company": results[0]["company"]["value"],
                "revenue": float(results[0]["revenue"]["value"]),
                "revenue_at_risk": float(results[0]["revenueAtRisk"]["value"]),
                "total_impact": results[0]["totalImpact"]["value"],
                "critical_risks": int(results[0]["criticalRisks"]["value"]),
                "success_probability": results[0]["successProb"]["value"]
            }
        return {}
        
    def get_impacts_by_category(self) -> List[Dict]:
        """Get all impacts grouped by category"""
        query = """
        PREFIX ctfa: <http://example.org/company-tariff-finance-analysis#>
        PREFIX dc: <http://purl.org/dc/elements/1.1/>
        
        SELECT ?category ?severity ?timeframe ?description ?financialImpact
        WHERE {
            ?analysis a ctfa:TariffAnalysis ;
                     ctfa:hasImpact ?impact .
                     
            ?impact ctfa:category ?category ;
                    ctfa:severity ?severity ;
                    ctfa:timeframe ?timeframe ;
                    dc:description ?description .
                    
            OPTIONAL { ?impact ctfa:financialImpact ?financialImpact }
        }
        ORDER BY DESC(?severity)
        """
        
        return self.query(query)
        
    def get_finance_options(self) -> List[Dict]:
        """Get all trade finance options"""
        query = """
        PREFIX ctfa: <http://example.org/company-tariff-finance-analysis#>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
        
        SELECT ?name ?provider ?cost ?complexity ?implementationTime
        WHERE {
            ?analysis a ctfa:TariffAnalysis ;
                     ctfa:hasFinanceOption ?option .
                     
            ?option rdfs:label ?name ;
                    ctfa:provider ?provider ;
                    ctfa:cost ?cost ;
                    ctfa:complexity ?complexity ;
                    ctfa:implementationTime ?implementationTime .
        }
        ORDER BY ?complexity
        """
        
        return self.query(query)
        
    def get_recommendations_timeline(self) -> Dict[str, List]:
        """Get recommendations organized by timeline"""
        query = """
        PREFIX ctfa: <http://example.org/company-tariff-finance-analysis#>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
        
        SELECT ?action ?timeline ?priority ?cost
        WHERE {
            ?analysis a ctfa:TariffAnalysis ;
                     ctfa:hasRecommendations ?recs .
                     
            ?recs ctfa:hasImmediateAction ?actionNode .
            
            ?actionNode rdfs:label ?action ;
                        ctfa:timeline ?timeline ;
                        ctfa:priority ?priority .
                        
            OPTIONAL { ?actionNode ctfa:cost ?cost }
        }
        ORDER BY ?timeline
        """
        
        results = self.query(query)
        
        # Group by timeline
        timeline_groups = {}
        for result in results:
            timeline = result["timeline"]["value"]
            if timeline not in timeline_groups:
                timeline_groups[timeline] = []
            
            action_data = {
                "action": result["action"]["value"],
                "priority": result["priority"]["value"]
            }
            if "cost" in result:
                action_data["cost"] = result["cost"]["value"]
                
            timeline_groups[timeline].append(action_data)
            
        return timeline_groups


# FastAPI endpoint for real-time data
def create_api_endpoints():
    """Create FastAPI endpoints for real-time data access"""
    from fastapi import FastAPI
    from fastapi.middleware.cors import CORSMiddleware
    
    app = FastAPI(title="Tariff Analysis Real-Time API")
    
    # Enable CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_methods=["*"],
        allow_headers=["*"]
    )
    
    # Initialize Jena store
    jena_store = JenaDataStore()
    
    @app.get("/api/metrics")
    async def get_metrics():
        """Get real-time metrics"""
        return jena_store.get_real_time_metrics()
        
    @app.get("/api/impacts")
    async def get_impacts():
        """Get all impacts by category"""
        return jena_store.get_impacts_by_category()
        
    @app.get("/api/finance-options")
    async def get_finance_options():
        """Get trade finance options"""
        return jena_store.get_finance_options()
        
    @app.get("/api/recommendations")
    async def get_recommendations():
        """Get recommendations timeline"""
        return jena_store.get_recommendations_timeline()
        
    @app.get("/api/sparql")
    async def sparql_query(query: str):
        """Execute custom SPARQL query"""
        return jena_store.query(query)
        
    return app


if __name__ == "__main__":
    # Load analysis data into Jena
    jena_store = JenaDataStore()
    
    # Load the latest analysis results
    results_dir = Path("results")
    latest_result = sorted(results_dir.glob("tariff_analysis_*.json"))[-1]
    
    print(f"Loading analysis data from: {latest_result}")
    analysis_uri = jena_store.load_analysis_results(str(latest_result))
    print(f"Created analysis: {analysis_uri}")
    
    # Upload to Fuseki
    jena_store.upload_to_fuseki()
    
    # Test some queries
    print("\nReal-time Metrics:")
    print(jena_store.get_real_time_metrics())
    
    print("\nTop Impacts:")
    impacts = jena_store.get_impacts_by_category()
    for impact in impacts[:3]:
        print(f"- {impact['category']['value']}: {impact['description']['value']} (Severity: {impact['severity']['value']})")
        
    # Start API server
    import uvicorn
    app = create_api_endpoints()
    uvicorn.run(app, host="0.0.0.0", port=8888)