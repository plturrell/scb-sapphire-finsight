import { NextApiRequest, NextApiResponse } from 'next';
import { redisDataStore } from '../../services/RedisDataStore';
import { TariffAlert } from '../../types';
import fs from 'fs';
import path from 'path';

/**
 * Tariff Data API Endpoint
 * Provides real tariff data from data products and Redis storage
 * 
 * GET /api/tariff-data - Get all tariff alerts with optional filtering
 * POST /api/tariff-data - Create a new tariff alert
 * DELETE /api/tariff-data/:id - Delete a tariff alert
 * 
 * Query parameters for GET:
 * - page: Page number for pagination (default: 1)
 * - limit: Number of items per page (default: 20)
 * - country: Filter by country (can be comma-separated for multiple)
 * - priority: Filter by priority (can be comma-separated for multiple)
 * - search: Search term in title, description, or country
 * - refresh: Set to "true" to fetch fresh data from data products
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    switch (req.method) {
      case 'GET':
        await handleGetTariffData(req, res);
        break;
        
      case 'POST':
        await handleCreateTariffAlert(req, res);
        break;
        
      case 'DELETE':
        await handleDeleteTariffAlert(req, res);
        break;
        
      default:
        res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
        return res.status(405).json({
          success: false,
          message: `Method ${req.method} Not Allowed`
        });
    }
  } catch (error) {
    console.error('Tariff Data API error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: (error as Error).message
    });
  }
}

/**
 * Handle GET request to fetch tariff data
 */
async function handleGetTariffData(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { 
    page = '1',
    limit = '20',
    country,
    priority,
    search,
    refresh = 'false'
  } = req.query;
  
  // Parse pagination parameters
  const pageNumber = parseInt(page as string, 10);
  const limitNumber = parseInt(limit as string, 10);
  
  // Prepare filters
  const filters: any = {};
  
  if (country) {
    filters.country = (country as string).split(',');
  }
  
  if (priority) {
    filters.priority = (priority as string).split(',');
  }
  
  if (search) {
    filters.search = search as string;
  }
  
  // Check if we should refresh data from data products
  if (refresh === 'true') {
    // Import data from data products if available
    await importTariffDataFromDataProducts();
  }
  
  // Get tariff alerts from Redis
  const result = await redisDataStore.getTariffAlerts(pageNumber, limitNumber, filters);
  
  return res.status(200).json({
    success: true,
    ...result
  });
}

/**
 * Handle POST request to create a tariff alert
 */
async function handleCreateTariffAlert(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const alert = req.body as TariffAlert;
  
  if (!alert.title || !alert.description || !alert.country || !alert.priority) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields: title, description, country, or priority'
    });
  }
  
  try {
    // Set defaults if missing
    if (!alert.createdAt) {
      alert.createdAt = new Date();
    }
    
    if (!alert.impactSeverity) {
      alert.impactSeverity = 5; // Default medium impact
    }
    
    if (!alert.confidence) {
      alert.confidence = 0.7; // Default confidence
    }
    
    // Store in Redis
    const id = await redisDataStore.storeTariffAlert(alert);
    
    return res.status(201).json({
      success: true,
      message: 'Tariff alert created successfully',
      id,
      alert: {
        ...alert,
        id
      }
    });
  } catch (error) {
    console.error('Error creating tariff alert:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create tariff alert',
      error: (error as Error).message
    });
  }
}

/**
 * Handle DELETE request to remove a tariff alert
 */
async function handleDeleteTariffAlert(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;
  
  if (!id) {
    return res.status(400).json({
      success: false,
      message: 'Missing alert ID'
    });
  }
  
  try {
    // Delete from Redis
    const success = await redisDataStore.deleteKey(`tariff-alert:${id}`);
    
    if (success) {
      return res.status(200).json({
        success: true,
        message: `Tariff alert ${id} deleted successfully`
      });
    } else {
      return res.status(404).json({
        success: false,
        message: `Tariff alert ${id} not found`
      });
    }
  } catch (error) {
    console.error('Error deleting tariff alert:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete tariff alert',
      error: (error as Error).message
    });
  }
}

/**
 * Import tariff data from data product files
 */
async function importTariffDataFromDataProducts() {
  const dataProductsDir = path.join(process.cwd(), 'data_products');
  
  // Check if data_products directory exists
  if (!fs.existsSync(dataProductsDir)) {
    console.error('Data products directory not found');
    return false;
  }
  
  try {
    // Check for TariffData data product files
    const tariffDataFile = path.join(dataProductsDir, 'TariffData_v1.TariffAlert.json');
    
    if (fs.existsSync(tariffDataFile)) {
      const fileContent = fs.readFileSync(tariffDataFile, 'utf8');
      const data = JSON.parse(fileContent);
      
      if (data && data.data && Array.isArray(data.data)) {
        // Convert data product format to TariffAlert format
        const alerts: TariffAlert[] = data.data.map((item: any) => ({
          id: item.id,
          title: item.title,
          description: item.description,
          priority: mapImpactToPriority(item.impactLevel),
          country: item.country,
          impactSeverity: item.impactLevel,
          confidence: item.confidence,
          sourceUrl: item.sourceUrl,
          sourceName: item.sourceName,
          publishDate: item.publishDate ? new Date(item.publishDate) : undefined,
          createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
          effectiveDate: item.effectiveDate ? new Date(item.effectiveDate) : undefined,
          tariffRate: item.tariffRate,
          productCategories: item.productCategories,
          aiEnhanced: item.aiEnhanced,
          tradingPartners: item.tradingPartners
        }));
        
        // Store in Redis
        for (const alert of alerts) {
          await redisDataStore.storeTariffAlert(alert);
        }
        
        console.log(`Imported ${alerts.length} tariff alerts from data products`);
        return true;
      }
    }
    
    // If no dedicated TariffData file, check if there are any tariff alerts in JournalEntry data
    // This is an example of how we might extract tariff data from other data products
    const journalEntryFile = path.join(dataProductsDir, 'JournalEntryHeader_v1.JournalEntry.json');
    
    if (fs.existsSync(journalEntryFile)) {
      const fileContent = fs.readFileSync(journalEntryFile, 'utf8');
      const data = JSON.parse(fileContent);
      
      if (data && data.data && Array.isArray(data.data)) {
        // Look for entries that might contain tariff information (this is a simplified example)
        const tariffRelatedEntries = data.data.filter((entry: any) => 
          entry.headerText && (
            entry.headerText.toLowerCase().includes('tariff') ||
            entry.headerText.toLowerCase().includes('tax') ||
            entry.headerText.toLowerCase().includes('duty')
          )
        );
        
        if (tariffRelatedEntries.length > 0) {
          // Convert to TariffAlert format (simplified example)
          const alerts: TariffAlert[] = tariffRelatedEntries.map((entry: any) => ({
            id: `je-${entry.id}`,
            title: entry.headerText,
            description: `Journal entry related to tariffs: ${entry.headerText}`,
            priority: 'medium',
            country: extractCountryFromText(entry.headerText) || 'Unknown',
            impactSeverity: 5, // Default medium impact
            confidence: 0.7, // Default confidence
            createdAt: entry.createdAt ? new Date(entry.createdAt) : new Date(),
            tariffRate: extractTariffRateFromText(entry.headerText),
            aiEnhanced: false
          }));
          
          // Store in Redis
          for (const alert of alerts) {
            await redisDataStore.storeTariffAlert(alert);
          }
          
          console.log(`Extracted ${alerts.length} tariff alerts from journal entries`);
          return true;
        }
      }
    }
    
    // Fall back to mock data if available
    const mockTariffAlerts = await importMockTariffAlerts();
    if (mockTariffAlerts) {
      console.log('Imported mock tariff alerts as fallback');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error importing tariff data from data products:', error);
    return false;
  }
}

/**
 * Import mock tariff alerts as fallback
 */
async function importMockTariffAlerts() {
  try {
    // Dynamic import to avoid bundling in production
    const { mockTariffAlerts } = await import('../../mock/tariffAlerts');
    
    if (mockTariffAlerts && Array.isArray(mockTariffAlerts)) {
      // Store in Redis
      for (const alert of mockTariffAlerts) {
        await redisDataStore.storeTariffAlert(alert);
      }
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error importing mock tariff alerts:', error);
    return false;
  }
}

/**
 * Map impact level to priority
 */
function mapImpactToPriority(impact: number): 'low' | 'medium' | 'high' | 'Critical' {
  if (impact >= 8) return 'Critical';
  if (impact >= 6) return 'high';
  if (impact >= 4) return 'medium';
  return 'low';
}

/**
 * Extract country from text
 */
function extractCountryFromText(text: string): string | undefined {
  // List of ASEAN countries
  const countries = [
    'Brunei', 'Cambodia', 'Indonesia', 'Laos', 'Malaysia', 
    'Myanmar', 'Philippines', 'Singapore', 'Thailand', 'Vietnam'
  ];
  
  // Check if any country is mentioned in the text
  for (const country of countries) {
    if (text.includes(country)) {
      return country;
    }
  }
  
  return undefined;
}

/**
 * Extract tariff rate from text
 */
function extractTariffRateFromText(text: string): number | undefined {
  // Simple regex to find percentage in text
  const percentageMatch = text.match(/(\d+(\.\d+)?)%/);
  if (percentageMatch) {
    return parseFloat(percentageMatch[1]);
  }
  
  return undefined;
}