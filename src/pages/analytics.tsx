import React from 'react';
import Layout from '@/components/Layout';
import DetailedAnalyticsTable from '@/components/DetailedAnalyticsTable.enhanced';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { TransactionSector } from '@/types';

const sectorData: TransactionSector[] = [
  { name: 'Aluminum', revenue: 500000, accounts: 120, income: 45000, assets: 2500000, deposits: 1800000, yield: 5.2, rowWa: 3.5, change: 2.5 },
  { name: 'Automotive', revenue: 750000, accounts: 85, income: 68000, assets: 3200000, deposits: 2100000, yield: 6.1, rowWa: 4.2, change: -1.2 },
  { name: 'Cement', revenue: 420000, accounts: 95, income: 38000, assets: 1900000, deposits: 1400000, yield: 4.8, rowWa: 3.1, change: 3.8 },
  { name: 'Chemical', revenue: 680000, accounts: 110, income: 61000, assets: 2800000, deposits: 2000000, yield: 5.6, rowWa: 3.8, change: 1.5 },
  { name: 'Diversified', revenue: 890000, accounts: 145, income: 80000, assets: 3600000, deposits: 2500000, yield: 6.3, rowWa: 4.5, change: 4.2 },
  { name: 'Gems', revenue: 320000, accounts: 75, income: 29000, assets: 1500000, deposits: 1100000, yield: 4.2, rowWa: 2.8, change: -0.5 },
  { name: 'Construction', revenue: 580000, accounts: 105, income: 52000, assets: 2400000, deposits: 1700000, yield: 5.1, rowWa: 3.4, change: 2.1 },
  { name: 'Real Estate', revenue: 720000, accounts: 90, income: 65000, assets: 3100000, deposits: 2200000, yield: 5.9, rowWa: 4.0, change: 3.6 },
  { name: 'Telecom', revenue: 820000, accounts: 125, income: 74000, assets: 3400000, deposits: 2400000, yield: 6.2, rowWa: 4.3, change: 2.8 },
  { name: 'Others', revenue: 550000, accounts: 130, income: 50000, assets: 2300000, deposits: 1600000, yield: 5.0, rowWa: 3.3, change: 1.8 },
];

const trendData = [
  { month: 'Jan', revenue: 420000, accounts: 85 },
  { month: 'Feb', revenue: 450000, accounts: 88 },
  { month: 'Mar', revenue: 480000, accounts: 92 },
  { month: 'Apr', revenue: 510000, accounts: 95 },
  { month: 'May', revenue: 540000, accounts: 98 },
  { month: 'Jun', revenue: 570000, accounts: 102 },
];

const pieData = [
  { name: 'Diversified', value: 25, color: '#4A5FDB' },
  { name: 'Telecom', value: 20, color: '#1ED760' },
  { name: 'Automotive', value: 18, color: '#F59E0B' },
  { name: 'Real Estate', value: 15, color: '#EF4444' },
  { name: 'Others', value: 22, color: '#8B5CF6' },
];

export default function Analytics() {
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600 mt-1">Transaction Banking Performance Overview</p>
        </div>

        <DetailedAnalyticsTable data={sectorData} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Revenue & Account Growth</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" orientation="left" stroke="#4A5FDB" />
                <YAxis yAxisId="right" orientation="right" stroke="#1ED760" />
                <Tooltip />
                <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#4A5FDB" name="Revenue" />
                <Line yAxisId="right" type="monotone" dataKey="accounts" stroke="#1ED760" name="Accounts" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Revenue by Sector</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}%`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Key Insights</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-900">Top Performer</h4>
              <p className="text-sm text-blue-700 mt-1">Diversified sector showing 4.2% growth</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-semibold text-green-900">Strongest Yield</h4>
              <p className="text-sm text-green-700 mt-1">Diversified sector at 6.3% yield</p>
            </div>
            <div className="p-4 bg-yellow-50 rounded-lg">
              <h4 className="font-semibold text-yellow-900">Watch Area</h4>
              <p className="text-sm text-yellow-700 mt-1">Automotive showing -1.2% decline</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}