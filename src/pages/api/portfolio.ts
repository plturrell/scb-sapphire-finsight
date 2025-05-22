import { NextApiRequest, NextApiResponse } from 'next';
import { PerplexityService } from '@/services/PerplexityService';

/**
 * Portfolio API Endpoint
 * Provides real-time portfolio performance data, regional analytics, and task management
 * Integrates with Perplexity AI to generate realistic portfolio insights
 */

interface PortfolioData {
  region: string;
  planned: number;
  actual: number;
  currency?: string;
  market?: string;
  riskLevel?: string;
  lastUpdated?: string;
}

interface TaskData {
  id: string;
  task: string;
  status: 'completed' | 'pending' | 'overdue' | 'in_progress';
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
  category: string;
  assignee?: string;
  description?: string;
}

interface PortfolioMetrics {
  totalRevenue: number;
  revenueChange: number;
  rorwa: number;
  rorwaChange: number;
  sustainableFinance: number;
  tasksOverdue: number;
  tasksTotal: number;
  assetsUnderManagement: number;
  lastUpdated: string;
}

// Cache implementation
const cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

const getFromCache = (key: string): any | null => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < cached.ttl) {
    return cached.data;
  }
  return null;
};

const setCache = (key: string, data: any, ttlMinutes: number = 10): void => {
  cache.set(key, {
    data,
    timestamp: Date.now(),
    ttl: ttlMinutes * 60 * 1000
  });
};

// Generate realistic portfolio data with AI
const generatePortfolioData = async (): Promise<PortfolioData[]> => {
  try {
    const perplexityService = new PerplexityService();
    const prompt = `Generate realistic portfolio performance data for SCB (Standard Chartered Bank) Asia regions for 2025 transaction banking. Include 7 key Asian markets with their planned vs actual performance percentages.

Format as JSON array with these fields for each region:
- region: Country/region name (e.g., "United Kingdom", "India", "Bangladesh", "United States", "United Arab Emirates", "China", "Korea")
- planned: Planned performance percentage (55-85 range)
- actual: Actual performance percentage (should be slightly different from planned, usually +/- 0-10 points)
- currency: Local currency code
- market: Market classification (emerging/developed)
- riskLevel: Risk assessment (low/medium/high)

Focus on realistic Asian markets plus key global partners. Make the data reflect current 2025 market conditions with slight variations between planned and actual performance.`;

    const response = await perplexityService.callPerplexityAPI([
      { role: 'user', content: prompt }
    ]);

    // Try to parse AI response as JSON
    const responseContent = response.choices[0]?.message?.content || "";
    const jsonMatch = responseContent.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      try {
        const data = JSON.parse(jsonMatch[0]);
        if (Array.isArray(data) && data.length > 0) {
          return data.map(item => ({
            region: item.region || 'Unknown Region',
            planned: typeof item.planned === 'number' ? item.planned : Math.floor(Math.random() * 30) + 55,
            actual: typeof item.actual === 'number' ? item.actual : Math.floor(Math.random() * 30) + 55,
            currency: item.currency || 'USD',
            market: item.market || 'emerging',
            riskLevel: item.riskLevel || 'medium',
            lastUpdated: new Date().toISOString()
          }));
        }
      } catch (parseError) {
        console.error('Error parsing AI response for portfolio data:', parseError);
      }
    }

    // Fallback to generated data if AI response is not parseable
    return getFallbackPortfolioData();
  } catch (error) {
    console.error('Error generating portfolio data with AI:', error);
    return getFallbackPortfolioData();
  }
};

// Generate realistic task data with AI
const generateTaskData = async (): Promise<TaskData[]> => {
  try {
    const perplexityService = new PerplexityService();
    const prompt = `Generate 8-10 realistic banking portfolio management tasks for a Transaction Banking CFO at Standard Chartered Bank in 2025. Include a mix of completed, pending, overdue, and in-progress tasks.

Format as JSON array with these fields:
- id: Unique task identifier
- task: Task description (realistic banking operations)
- status: One of: completed, pending, overdue, in_progress
- dueDate: Date in YYYY-MM-DD format (mix of past and future dates)
- priority: low, medium, or high
- category: Task category (compliance, reporting, client-management, etc.)
- assignee: Person responsible (can be null)
- description: Brief task description

Focus on realistic transaction banking tasks like compliance reviews, client onboarding, regulatory reporting, budget reviews, etc.`;

    const response = await perplexityService.callPerplexityAPI([
      { role: 'user', content: prompt }
    ]);

    // Try to parse AI response as JSON
    const responseContent = response.choices[0]?.message?.content || "";
    const jsonMatch = responseContent.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      try {
        const data = JSON.parse(jsonMatch[0]);
        if (Array.isArray(data) && data.length > 0) {
          return data.map((item, index) => ({
            id: item.id || `task-${index + 1}`,
            task: item.task || 'Review portfolio performance',
            status: ['completed', 'pending', 'overdue', 'in_progress'].includes(item.status) 
              ? item.status 
              : 'pending',
            dueDate: item.dueDate || new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            priority: ['low', 'medium', 'high'].includes(item.priority) ? item.priority : 'medium',
            category: item.category || 'general',
            assignee: item.assignee || null,
            description: item.description || item.task
          }));
        }
      } catch (parseError) {
        console.error('Error parsing AI response for task data:', parseError);
      }
    }

    // Fallback to generated data if AI response is not parseable
    return getFallbackTaskData();
  } catch (error) {
    console.error('Error generating task data with AI:', error);
    return getFallbackTaskData();
  }
};

// Generate portfolio metrics with AI
const generatePortfolioMetrics = async (): Promise<PortfolioMetrics> => {
  try {
    const perplexityService = new PerplexityService();
    const prompt = `Generate realistic portfolio metrics for Standard Chartered Bank's Transaction Banking Asia portfolio for Q1 2025. Include:

Format as JSON object:
- totalRevenue: Total revenue percentage (10-20 range)
- revenueChange: YoY change percentage (-5 to +15 range)
- rorwa: Return on Risk Weighted Assets percentage (4-8 range) 
- rorwaChange: YoY change percentage (-3 to +10 range)
- sustainableFinance: Sustainable finance mobilization in thousands (40000-60000 range)
- tasksOverdue: Number of overdue tasks (3-12 range)
- tasksTotal: Total active tasks (15-35 range)
- assetsUnderManagement: Assets under management in billions (200-500 range)

Reflect realistic banking performance metrics for 2025 market conditions in Asia.`;

    const response = await perplexityService.callPerplexityAPI([
      { role: 'user', content: prompt }
    ]);

    // Try to parse AI response as JSON
    const responseContent = response.choices[0]?.message?.content || "";
    const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const data = JSON.parse(jsonMatch[0]);
        return {
          totalRevenue: typeof data.totalRevenue === 'number' ? data.totalRevenue : 14.32,
          revenueChange: typeof data.revenueChange === 'number' ? data.revenueChange : 6.3,
          rorwa: typeof data.rorwa === 'number' ? data.rorwa : 6.3,
          rorwaChange: typeof data.rorwaChange === 'number' ? data.rorwaChange : 6.3,
          sustainableFinance: typeof data.sustainableFinance === 'number' ? data.sustainableFinance : 50789,
          tasksOverdue: typeof data.tasksOverdue === 'number' ? data.tasksOverdue : 7,
          tasksTotal: typeof data.tasksTotal === 'number' ? data.tasksTotal : 24,
          assetsUnderManagement: typeof data.assetsUnderManagement === 'number' ? data.assetsUnderManagement : 347.2,
          lastUpdated: new Date().toISOString()
        };
      } catch (parseError) {
        console.error('Error parsing AI response for portfolio metrics:', parseError);
      }
    }

    // Fallback to default metrics
    return getFallbackPortfolioMetrics();
  } catch (error) {
    console.error('Error generating portfolio metrics with AI:', error);
    return getFallbackPortfolioMetrics();
  }
};

// Fallback data functions
const getFallbackPortfolioData = (): PortfolioData[] => [
  { region: 'United Kingdom', planned: 75, actual: 82, currency: 'GBP', market: 'developed', riskLevel: 'low' },
  { region: 'India', planned: 65, actual: 70, currency: 'INR', market: 'emerging', riskLevel: 'medium' },
  { region: 'Bangladesh', planned: 58, actual: 60, currency: 'BDT', market: 'emerging', riskLevel: 'high' },
  { region: 'United States', planned: 85, actual: 88, currency: 'USD', market: 'developed', riskLevel: 'low' },
  { region: 'United Arab Emirates', planned: 62, actual: 65, currency: 'AED', market: 'developed', riskLevel: 'medium' },
  { region: 'China', planned: 78, actual: 80, currency: 'CNY', market: 'emerging', riskLevel: 'medium' },
  { region: 'Korea', planned: 55, actual: 58, currency: 'KRW', market: 'developed', riskLevel: 'medium' },
];

const getFallbackTaskData = (): TaskData[] => [
  { 
    id: '1', 
    task: 'Review annual budget allocation', 
    status: 'completed', 
    dueDate: '2025-01-15',
    priority: 'high',
    category: 'budgeting',
    assignee: 'Sofia Chen',
    description: 'Complete annual budget review and allocation for Asia portfolio'
  },
  { 
    id: '2', 
    task: 'Provide personal details for company records', 
    status: 'pending', 
    dueDate: '2025-01-20',
    priority: 'medium',
    category: 'compliance',
    description: 'Update personal information in company system'
  },
  { 
    id: '3', 
    task: 'Update compliance certifications', 
    status: 'overdue', 
    dueDate: '2025-01-10',
    priority: 'high',
    category: 'compliance',
    assignee: 'Compliance Team',
    description: 'Renew mandatory compliance and regulatory certifications'
  },
  { 
    id: '4', 
    task: 'Complete Q4 performance review', 
    status: 'pending', 
    dueDate: '2025-01-25',
    priority: 'high',
    category: 'reporting',
    assignee: 'Sofia Chen',
    description: 'Finalize Q4 2024 performance review for Asia portfolio'
  },
];

const getFallbackPortfolioMetrics = (): PortfolioMetrics => ({
  totalRevenue: 14.32,
  revenueChange: 6.3,
  rorwa: 6.3,
  rorwaChange: 6.3,
  sustainableFinance: 50789,
  tasksOverdue: 7,
  tasksTotal: 24,
  assetsUnderManagement: 347.2,
  lastUpdated: new Date().toISOString()
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { dataType = 'all', refresh = 'false' } = req.query;
    const forceRefresh = refresh === 'true';

    switch (dataType) {
      case 'regional':
        {
          const cacheKey = 'portfolio_regional';
          if (!forceRefresh) {
            const cached = getFromCache(cacheKey);
            if (cached) {
              return res.status(200).json({ success: true, data: cached, cached: true });
            }
          }

          const data = await generatePortfolioData();
          setCache(cacheKey, data, 15); // Cache for 15 minutes
          res.status(200).json({ success: true, data, cached: false });
        }
        break;

      case 'tasks':
        {
          const cacheKey = 'portfolio_tasks';
          if (!forceRefresh) {
            const cached = getFromCache(cacheKey);
            if (cached) {
              return res.status(200).json({ success: true, data: cached, cached: true });
            }
          }

          const data = await generateTaskData();
          setCache(cacheKey, data, 10); // Cache for 10 minutes
          res.status(200).json({ success: true, data, cached: false });
        }
        break;

      case 'metrics':
        {
          const cacheKey = 'portfolio_metrics';
          if (!forceRefresh) {
            const cached = getFromCache(cacheKey);
            if (cached) {
              return res.status(200).json({ success: true, data: cached, cached: true });
            }
          }

          const data = await generatePortfolioMetrics();
          setCache(cacheKey, data, 5); // Cache for 5 minutes
          res.status(200).json({ success: true, data, cached: false });
        }
        break;

      case 'all':
      default:
        {
          const cacheKey = 'portfolio_all';
          if (!forceRefresh) {
            const cached = getFromCache(cacheKey);
            if (cached) {
              return res.status(200).json({ success: true, data: cached, cached: true });
            }
          }

          const [regional, tasks, metrics] = await Promise.all([
            generatePortfolioData(),
            generateTaskData(),
            generatePortfolioMetrics()
          ]);

          const data = {
            regional,
            tasks,
            metrics,
            summary: {
              totalRegions: regional.length,
              avgPlannedPerformance: regional.reduce((sum, r) => sum + r.planned, 0) / regional.length,
              avgActualPerformance: regional.reduce((sum, r) => sum + r.actual, 0) / regional.length,
              tasksCompleted: tasks.filter(t => t.status === 'completed').length,
              tasksOverdue: tasks.filter(t => t.status === 'overdue').length,
              lastUpdated: new Date().toISOString()
            }
          };

          setCache(cacheKey, data, 8); // Cache for 8 minutes
          res.status(200).json({ success: true, data, cached: false });
        }
        break;
    }
  } catch (error) {
    console.error('Portfolio API Error:', error);
    
    // Return fallback data on error
    const fallbackData = {
      regional: getFallbackPortfolioData(),
      tasks: getFallbackTaskData(),
      metrics: getFallbackPortfolioMetrics(),
      summary: {
        totalRegions: 7,
        avgPlannedPerformance: 68.3,
        avgActualPerformance: 71.9,
        tasksCompleted: 1,
        tasksOverdue: 1,
        lastUpdated: new Date().toISOString()
      }
    };

    res.status(200).json({ 
      success: true, 
      data: fallbackData, 
      cached: false,
      note: 'Fallback data provided due to service unavailability'
    });
  }
}