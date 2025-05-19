/**
 * Company Report Retrieval API
 * Retrieves cached reports or generates new ones
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { vietnamReportService } from '../../../../lib/vietnam-report-service';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { companyCode } = req.query;

  if (!companyCode || typeof companyCode !== 'string') {
    return res.status(400).json({ error: 'Invalid company code' });
  }

  if (req.method === 'GET') {
    try {
      // Check cache first
      const cachedReport = getCachedReport(companyCode);
      
      if (cachedReport && isReportFresh(cachedReport.timestamp)) {
        return res.status(200).json(cachedReport.report);
      }
      
      // Generate new report if not cached or stale
      const report = await vietnamReportService.generateVietnamCompanyReport({
        companyCode,
        reportType: 'company_profile',
        includeFinancials: true,
        includeTariffAnalysis: true
      });
      
      // Cache the new report
      cacheReport(companyCode, report);
      
      res.status(200).json(report);
      
    } catch (error) {
      console.error('Error retrieving report:', error);
      res.status(500).json({ error: 'Failed to retrieve report' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}

function getCachedReport(companyCode: string): any {
  if (typeof global !== 'undefined' && (global as any).reportCache) {
    return (global as any).reportCache[companyCode];
  }
  return null;
}

function isReportFresh(timestamp: number): boolean {
  // Consider reports fresh for 1 hour
  const oneHour = 60 * 60 * 1000;
  return Date.now() - timestamp < oneHour;
}

function cacheReport(companyCode: string, report: any) {
  if (typeof global !== 'undefined') {
    (global as any).reportCache = (global as any).reportCache || {};
    (global as any).reportCache[companyCode] = {
      report,
      timestamp: Date.now()
    };
  }
}