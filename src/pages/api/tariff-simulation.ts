import type { NextApiRequest, NextApiResponse } from 'next';
import { RedisDataStore } from '../../services/RedisDataStore';
import { TariffOntology } from '../../services/TariffOntology';
import { TariffImpactSimulator } from '../../services/TariffImpactSimulator';
import { SankeyData, TariffAlert } from '../../types';

const redisDataStore = RedisDataStore.getInstance();

interface SimulationConfig {
  countries: string[];
  includedAlerts?: string[];
  timeframe: number;
  confidence: number;
  includeSecondOrderEffects?: boolean;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const config: SimulationConfig = req.body;
    
    if (!config) {
      return res.status(400).json({ 
        success: false, 
        message: 'Simulation configuration is required' 
      });
    }
    
    // Validate required fields
    if (!config.countries || !Array.isArray(config.countries) || config.countries.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'At least one country is required for simulation' 
      });
    }
    
    if (!config.timeframe || config.timeframe < 1) {
      return res.status(400).json({ 
        success: false, 
        message: 'Valid timeframe is required' 
      });
    }
    
    // Fetch relevant alerts from Redis
    let relevantAlerts: TariffAlert[] = [];
    const result = await redisDataStore.getTariffAlerts(1, 1000, { 
      country: config.countries 
    });
    
    relevantAlerts = result.alerts;
    
    // If specific alerts are specified, filter to those
    if (config.includedAlerts && config.includedAlerts.length > 0) {
      relevantAlerts = relevantAlerts.filter(alert => 
        config.includedAlerts.includes(alert.id)
      );
    }
    
    // If no alerts found, return an error
    if (relevantAlerts.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'No relevant alerts found for the specified countries' 
      });
    }
    
    // Initialize services for simulation
    const ontology = new TariffOntology();
    await ontology.initialize();
    
    const simulator = new TariffImpactSimulator(ontology);
    
    // Run the simulation
    const simulationResults = await simulator.simulateImpact({
      alerts: relevantAlerts,
      timeHorizon: config.timeframe,
      confidenceThreshold: config.confidence,
      includeSecondOrderEffects: config.includeSecondOrderEffects || false
    });
    
    // Generate Sankey data from the simulation results
    const sankeyData: SankeyData = await simulator.generateSankeyData(simulationResults);
    
    // Return the results
    return res.status(200).json({
      success: true,
      data: {
        sankeyData,
        metrics: simulationResults.metrics,
        alerts: relevantAlerts.length,
        timeframe: config.timeframe,
        countries: config.countries
      }
    });
  } catch (error) {
    console.error('Tariff simulation error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error during simulation',
      error: (error as Error).message
    });
  }
}