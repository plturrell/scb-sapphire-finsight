from http.server import BaseHTTPRequestHandler
from urllib.parse import parse_qs, urlparse
import json

class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        """Handle GET request for SPARQL query endpoint"""
        # Parse query parameters
        query_params = parse_qs(urlparse(self.path).query)
        query = query_params.get('query', [''])[0]
        
        if not query:
            self.send_response(400)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"error": "Missing query parameter"}).encode())
            return
        
        # Simplified mock SPARQL endpoint that returns pre-defined results
        # In a real implementation, this would send the query to a SPARQL endpoint
        
        # Mock data based on query content
        results = {
            "head": {
                "vars": ["subject", "predicate", "object"]
            },
            "results": {
                "bindings": []
            }
        }
        
        # Add mock data based on keywords in the query
        if "company" in query.lower():
            results["results"]["bindings"].append({
                "subject": {"type": "uri", "value": "http://example.org/TariffAnalysis"},
                "predicate": {"type": "uri", "value": "http://example.org/hasCompany"},
                "object": {"type": "literal", "value": "Sample Electronics Vietnam"}
            })
            
        if "impact" in query.lower():
            results["results"]["bindings"].append({
                "subject": {"type": "uri", "value": "http://example.org/TariffImpact1"},
                "predicate": {"type": "uri", "value": "http://example.org/hasCategory"},
                "object": {"type": "literal", "value": "financial"}
            })
            results["results"]["bindings"].append({
                "subject": {"type": "uri", "value": "http://example.org/TariffImpact1"},
                "predicate": {"type": "uri", "value": "http://example.org/hasSeverity"},
                "object": {"type": "literal", "value": "8", "datatype": "http://www.w3.org/2001/XMLSchema#integer"}
            })
        
        if "finance" in query.lower():
            results["results"]["bindings"].append({
                "subject": {"type": "uri", "value": "http://example.org/FinanceOption1"},
                "predicate": {"type": "uri", "value": "http://www.w3.org/2000/01/rdf-schema#label"},
                "object": {"type": "literal", "value": "Export Credit Insurance"}
            })
        
        # Send successful response
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(results).encode())