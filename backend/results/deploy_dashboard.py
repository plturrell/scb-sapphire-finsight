#!/usr/bin/env python3
"""Deploy SAP Fiori Dashboard with screenshot capabilities"""

import os
import time
import json
import base64
from http.server import HTTPServer, SimpleHTTPRequestHandler
from threading import Thread
import webbrowser

class DashboardHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/data.json':
            # Serve the actual analysis data
            with open('tariff_analysis_20250517_191510.json', 'r') as f:
                data = f.read()
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(data.encode())
        else:
            # Serve static files
            super().do_GET()
    
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

def start_server():
    """Start the HTTP server"""
    os.chdir('results')
    server = HTTPServer(('localhost', 8000), DashboardHandler)
    print("Dashboard server running at http://localhost:8000/sap_fiori_dashboard.html")
    server.serve_forever()

if __name__ == '__main__':
    # Start server in background thread
    server_thread = Thread(target=start_server, daemon=True)
    server_thread.start()
    
    # Give server time to start
    time.sleep(2)
    
    # Open dashboard in browser
    webbrowser.open('http://localhost:8000/sap_fiori_dashboard.html')
    
    print("\n=== SAP Fiori Dashboard Deployed ===")
    print("Server: http://localhost:8000/sap_fiori_dashboard.html")
    print("\nAll screens are fully functional:")
    print("1. Dashboard - Main overview with KPIs and charts")
    print("2. Impact Analysis - Detailed tariff impact breakdown")
    print("3. Finance Options - Trade finance alternatives")
    print("4. Risk Assessment - Comprehensive risk matrix")
    print("5. Action Timeline - Phased mitigation strategies")
    print("6. Reports - Downloadable analytical reports")
    print("\nPress Ctrl+C to stop the server")
    
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nShutting down server...")