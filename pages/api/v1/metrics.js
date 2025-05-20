/**
 * Next.js API route for metrics
 * Acts as a proxy to the Python API or directly processes data in development
 */

import axios from 'axios';

// Detect if we're in a Vercel production environment
const isProduction = process.env.VERCEL_ENV === 'production';

// Base URL for API endpoints
const getBaseUrl = () => {
  if (isProduction) {
    // In production, use relative path to call serverless functions
    return '';
  } else {
    // In development, call the local Python API server
    return process.env.API_BASE_URL || 'http://localhost:8888';
  }
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const baseUrl = getBaseUrl();
    
    // In production environment, we're using the Vercel Python functions directly
    // In development, we proxy to the local Python API
    const response = await axios.get(`${baseUrl}/api/metrics`);
    
    return res.status(200).json(response.data);
  } catch (error) {
    console.error('Error fetching metrics:', error);
    
    // If we couldn't reach the Python API, return a meaningful error
    return res.status(500).json({
      error: 'Failed to fetch metrics data',
      details: error.message
    });
  }
}