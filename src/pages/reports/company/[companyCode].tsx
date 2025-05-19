/**
 * Company Report Page
 * Displays comprehensive reports for companies loaded from S&P Capital IQ
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { 
  Building2, 
  FileText, 
  TrendingUp, 
  Globe, 
  Download, 
  Share2,
  Loader,
  ChartLine,
  PieChart,
  Calendar,
  DollarSign
} from 'lucide-react';
import ModernLayout from '@/components/ModernLayout';
import { vietnamReportService } from '@/lib/vietnam-report-service';

interface CompanyReport {
  companyCode: string;
  companyName: string;
  reportType: string;
  sections: Array<{
    title: string;
    content: string;
    data?: any;
  }>;
  financialData?: {
    revenue: number;
    exports: number;
    imports: number;
    currency: string;
  };
  tariffAnalysis?: {
    impact: number;
    recommendations: string[];
  };
  metadata: {
    generatedAt: string;
    sources: string[];
    confidence: number;
  };
}

const CompanyReportPage: React.FC = () => {
  const router = useRouter();
  const { companyCode } = router.query;
  
  const [report, setReport] = useState<CompanyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (companyCode) {
      loadCompanyReport(companyCode as string);
    }
  }, [companyCode]);

  const loadCompanyReport = async (code: string) => {
    setLoading(true);
    try {
      // First check if report exists in cache
      const existingReport = await fetch(`/api/reports/company/${code}`);
      
      if (existingReport.ok) {
        const data = await existingReport.json();
        setReport(data);
      } else {
        // Generate new report
        await generateReport(code);
      }
    } catch (error) {
      console.error('Error loading report:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async (code: string, reportType = 'company_profile') => {
    setGenerating(true);
    try {
      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyCode: code,
          reportType,
          includeFinancials: true,
          includeTariffAnalysis: true
        })
      });

      if (response.ok) {
        const data = await response.json();
        setReport(data);
      }
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setGenerating(false);
    }
  };

  const downloadReport = () => {
    // TODO: Implement PDF download
    console.log('Downloading report...');
  };

  const shareReport = () => {
    // TODO: Implement sharing
    console.log('Sharing report...');
  };

  if (loading || !report) {
    return (
      <ModernLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading company report...</p>
          </div>
        </div>
      </ModernLayout>
    );
  }

  return (
    <ModernLayout>
      <div className="max-w-7xl mx-auto">
        {/* Report Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center mb-2">
                <Building2 className="w-6 h-6 text-gray-400 mr-2" />
                <h1 className="text-2xl font-bold text-gray-900">{report.companyName}</h1>
                <span className="ml-3 text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  {report.companyCode}
                </span>
              </div>
              
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  Generated: {new Date(report.metadata.generatedAt).toLocaleDateString()}
                </span>
                <span className="flex items-center">
                  <FileText className="w-4 h-4 mr-1" />
                  Sources: {report.metadata.sources.join(', ')}
                </span>
                <span className="flex items-center">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  Confidence: {(report.metadata.confidence * 100).toFixed(0)}%
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={downloadReport}
                className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </button>
              <button
                onClick={shareReport}
                className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </button>
            </div>
          </div>
        </div>

        {/* Report Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {['overview', 'financials', 'tariff', 'analysis'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        {/* Report Content */}
        <div className="space-y-6">
          {activeTab === 'overview' && (
            <>
              {report.sections.map((section, idx) => (
                <div key={idx} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">{section.title}</h2>
                  <div className="prose max-w-none text-gray-700 whitespace-pre-wrap">
                    {section.content}
                  </div>
                  {section.data && (
                    <div className="mt-4 p-4 bg-gray-50 rounded">
                      <pre className="text-sm">{JSON.stringify(section.data, null, 2)}</pre>
                    </div>
                  )}
                </div>
              ))}
            </>
          )}

          {activeTab === 'financials' && report.financialData && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center mb-2">
                  <DollarSign className="w-6 h-6 text-green-500 mr-2" />
                  <h3 className="text-lg font-semibold">Revenue</h3>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: report.financialData.currency
                  }).format(report.financialData.revenue)}
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center mb-2">
                  <TrendingUp className="w-6 h-6 text-blue-500 mr-2" />
                  <h3 className="text-lg font-semibold">Exports</h3>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: report.financialData.currency
                  }).format(report.financialData.exports)}
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center mb-2">
                  <Globe className="w-6 h-6 text-purple-500 mr-2" />
                  <h3 className="text-lg font-semibold">Imports</h3>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: report.financialData.currency
                  }).format(report.financialData.imports)}
                </p>
              </div>
            </div>
          )}

          {activeTab === 'tariff' && report.tariffAnalysis && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Tariff Impact Analysis</h2>
              
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-700 mb-2">Impact Assessment</h3>
                <div className="flex items-center">
                  <div className="flex-1 bg-gray-200 rounded-full h-4">
                    <div
                      className="bg-blue-500 h-4 rounded-full"
                      style={{ width: `${report.tariffAnalysis.impact * 100}%` }}
                    />
                  </div>
                  <span className="ml-3 text-sm font-medium">
                    {(report.tariffAnalysis.impact * 100).toFixed(1)}% Impact
                  </span>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-700 mb-2">Recommendations</h3>
                <ul className="space-y-2">
                  {report.tariffAnalysis.recommendations.map((rec, idx) => (
                    <li key={idx} className="flex items-start">
                      <ChartLine className="w-5 h-5 text-green-500 mr-2 mt-0.5" />
                      <span className="text-gray-700">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'analysis' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Generate Custom Analysis</h2>
              
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => generateReport(companyCode as string, 'financial_analysis')}
                  disabled={generating}
                  className="flex items-center justify-center p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all"
                >
                  <ChartLine className="w-6 h-6 text-blue-500 mr-2" />
                  <span className="font-medium">Financial Analysis</span>
                </button>

                <button
                  onClick={() => generateReport(companyCode as string, 'tariff_impact')}
                  disabled={generating}
                  className="flex items-center justify-center p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all"
                >
                  <Globe className="w-6 h-6 text-green-500 mr-2" />
                  <span className="font-medium">Tariff Impact</span>
                </button>

                <button
                  onClick={() => generateReport(companyCode as string, 'market_comparison')}
                  disabled={generating}
                  className="flex items-center justify-center p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all"
                >
                  <PieChart className="w-6 h-6 text-purple-500 mr-2" />
                  <span className="font-medium">Market Comparison</span>
                </button>

                <button
                  disabled={generating}
                  className="flex items-center justify-center p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all"
                >
                  <TrendingUp className="w-6 h-6 text-orange-500 mr-2" />
                  <span className="font-medium">Growth Opportunities</span>
                </button>
              </div>

              {generating && (
                <div className="mt-6 text-center">
                  <Loader className="w-6 h-6 text-blue-500 animate-spin mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Generating analysis...</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </ModernLayout>
  );
};

export default CompanyReportPage;