#!/usr/bin/env python3
"""
Test suite for NVIDIA API integration
"""

import sys
import os
import json
import unittest
from unittest.mock import patch, MagicMock

# Add parent directory to path to import modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import the module to test
from nvidia_integration import NvidiaAPIClient

class TestNvidiaIntegration(unittest.TestCase):
    """Test NVIDIA API integration"""
    
    def setUp(self):
        """Set up test environment"""
        # Create client with mock API key
        self.api_key = "test_api_key"
        self.nvidia_client = NvidiaAPIClient(api_key=self.api_key)
        
        # Sample test data
        self.company_data = {
            "name": "Samsung Electronics Vietnam",
            "industry": "Electronics",
            "annual_revenue": 60000000000,
            "employee_count": 160000,
            "us_export_percentage": 35.0
        }
        
        self.simulation_params = {
            "tariff_rate": 46.0,
            "negotiation_chance": 0.3,
            "market_adaptability": 0.5
        }
    
    @patch('nvidia_integration.NvidiaAPIClient._make_api_request')
    def test_analyze_tariff_impacts_calls_api_correctly(self, mock_api_request):
        """Test that analyze_tariff_impacts calls the API correctly"""
        # Set up mock response
        mock_response = {"impacts": [{"category": "financial", "severity": 8}]}
        mock_api_request.return_value = mock_response
        
        # Call the method
        result = self.nvidia_client.analyze_tariff_impacts(self.company_data)
        
        # Verify API was called correctly
        mock_api_request.assert_called_once_with(
            endpoint="/tariff-analysis",
            payload={
                "model": self.nvidia_client.model_id,
                "company_data": self.company_data,
                "analysis_type": "comprehensive"
            }
        )
        
        # Verify the result
        self.assertEqual(result, mock_response["impacts"])
    
    @patch('nvidia_integration.NvidiaAPIClient._make_api_request')
    def test_run_monte_carlo_simulation_calls_api_correctly(self, mock_api_request):
        """Test that run_monte_carlo_simulation calls the API correctly"""
        # Set up mock response
        mock_response = {"simulation_id": "test_sim_id", "results": {}}
        mock_api_request.return_value = mock_response
        
        # Call the method
        result = self.nvidia_client.run_monte_carlo_simulation(
            parameters=self.simulation_params,
            iterations=5000
        )
        
        # Verify API was called correctly
        mock_api_request.assert_called_once_with(
            endpoint="/monte-carlo-simulation",
            payload={
                "model": self.nvidia_client.model_id,
                "parameters": self.simulation_params,
                "iterations": 5000,
                "acceleration": "tensor_cores"
            }
        )
        
        # Verify the result
        self.assertEqual(result, mock_response)
    
    @patch('nvidia_integration.NvidiaAPIClient._make_api_request')
    def test_analyze_mitigation_strategies_calls_api_correctly(self, mock_api_request):
        """Test that analyze_mitigation_strategies calls the API correctly"""
        # Set up test data
        impacts = [{"category": "financial", "severity": 8}]
        
        # Set up mock response
        mock_response = {"strategies": [{"strategy": "Export credit insurance"}]}
        mock_api_request.return_value = mock_response
        
        # Call the method
        result = self.nvidia_client.analyze_mitigation_strategies(
            impacts=impacts,
            company_profile=self.company_data
        )
        
        # Verify API was called correctly
        mock_api_request.assert_called_once_with(
            endpoint="/strategy-optimization",
            payload={
                "model": self.nvidia_client.model_id,
                "impacts": impacts,
                "company_profile": self.company_data,
                "optimization_goal": "minimize_financial_impact"
            }
        )
        
        # Verify the result
        self.assertEqual(result, mock_response["strategies"])
    
    def test_api_request_exception_handling(self):
        """Test that exceptions in API requests are handled correctly"""
        # Test with no API key to trigger fallback to mock data
        client = NvidiaAPIClient(api_key=None)
        
        # Should not raise an exception, but use mock data
        impacts = client.analyze_tariff_impacts(self.company_data)
        
        # Verify we got mock data
        self.assertIsInstance(impacts, list)
        self.assertTrue(len(impacts) > 0)
        self.assertIn("category", impacts[0])
        self.assertIn("severity", impacts[0])
    
    def test_full_integration_flow(self):
        """Test the full integration flow"""
        # This test ensures all methods work together
        
        # Analyze tariff impacts
        impacts = self.nvidia_client.analyze_tariff_impacts(self.company_data)
        self.assertIsInstance(impacts, list)
        self.assertTrue(len(impacts) > 0)
        
        # Run Monte Carlo simulation
        simulation_results = self.nvidia_client.run_monte_carlo_simulation(self.simulation_params)
        self.assertIsInstance(simulation_results, dict)
        self.assertIn("results", simulation_results)
        
        # Analyze mitigation strategies
        strategies = self.nvidia_client.analyze_mitigation_strategies(impacts, self.company_data)
        self.assertIsInstance(strategies, list)
        self.assertTrue(len(strategies) > 0)
        self.assertIn("strategy", strategies[0])

# Allow running the tests directly
if __name__ == '__main__':
    unittest.main()