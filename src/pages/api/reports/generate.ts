/**
 * Report Generation API
 * Generates comprehensive reports using RAG data and LLM
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { vietnamReportService } from '../../../lib/vietnam-report-service';

interface GenerateReportRequest {
  companyCode: string;
  reportType: string;
  includeFinancials?: boolean;
  includeTariffAnalysis?: boolean;
  includeCompetitors?: boolean;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    companyCode,
    reportType = 'company_profile',
    includeFinancials = true,
    includeTariffAnalysis = true,
    includeCompetitors = false
  }: GenerateReportRequest = req.body;

  if (!companyCode) {
    return res.status(400).json({ error: 'Company code is required' });
  }

  try {
    console.log(`Generating ${reportType} report for ${companyCode}`);
    
    // Generate report using Vietnam Report Service
    const report = await vietnamReportService.generateVietnamCompanyReport({
      companyCode,
      reportType: reportType as any,
      includeFinancials,
      includeTariffAnalysis,
      includeCompetitors
    });
    
    // Cache the report for future access
    await cacheReport(companyCode, report);
    
    res.status(200).json(report);
    
  } catch (error) {
    console.error('Report generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate report',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function cacheReport(companyCode: string, report: any) {
  // In a production environment, this would store in Redis or a database
  // For now, we'll use in-memory storage
  if (typeof global !== 'undefined') {
    (global as any).reportCache = (global as any).reportCache || {};
    (global as any).reportCache[companyCode] = {
      report,
      timestamp: Date.now()
    };
  }
}