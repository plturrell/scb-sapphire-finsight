#!/usr/bin/env python3
"""
Simple dashboard runner
"""
import webbrowser
import os
import time

# Get the absolute path to the dashboard
dashboard_path = os.path.abspath("dashboard_standalone.html")
dashboard_url = f"file://{dashboard_path}"

print("Opening Aspire FinSight Dashboard...")
print(f"Location: {dashboard_url}")
print("")
print("Dashboard Features:")
print("✓ Real-time Sankey diagram visualization")
print("✓ Dynamic KPI updates")
print("✓ Interactive charts")
print("✓ Simulated Jena RDF data")
print("")

# Open in default browser
webbrowser.open(dashboard_url)

print("Dashboard opened in your default browser.")
print("The dashboard is fully standalone - no server required!")
print("")
print("To view the dashboard again, open:")
print(dashboard_path)