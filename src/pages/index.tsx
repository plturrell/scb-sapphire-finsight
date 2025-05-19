import React, { useState } from 'react';
import Image from 'next/image';
import Layout from '@/components/Layout';
import MetricCard from '@/components/MetricCard';
import JouleAssistant from '@/components/JouleAssistant';
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
import { Sparkles } from 'lucide-react';

const monthlyData = [
  { month: 'Jan', revenue: 45000, target: 42000 },
  { month: 'Feb', revenue: 52000, target: 48000 },
  { month: 'Mar', revenue: 48000, target: 50000 },
  { month: 'Apr', revenue: 55000, target: 53000 },
  { month: 'May', revenue: 58000, target: 55000 },
  { month: 'Jun', revenue: 62000, target: 60000 },
];

const sectorData = [
  { name: 'Banking', value: 45, color: '#4A5FDB' },
  { name: 'Insurance', value: 30, color: '#1ED760' },
  { name: 'Investment', value: 25, color: '#F59E0B' },
];

const newsItems = [
  { id: '1', title: 'New tariff announcement impacts Asian markets', source: 'CNBC', date: 'May 04, 11:53', important: true },
  { id: '2', title: 'New allegations for APAC region', source: 'Bloomberg Green', date: 'May 04, 11:53' },
  { id: '3', title: 'New regulations for APAC region', source: 'BNC Green', date: 'May 03, 12:25' },
  { id: '4', title: 'Innovative ways companies turn waste into resources', source: 'CNBC', date: 'May 03, 10:32' },
];

export default function Dashboard() {
  const [jouleOpen, setJouleOpen] = useState(false);

  return (
    <Layout>
      <div className="space-y-6">
        {/* SCB Banner Image */}
        <div className="w-full overflow-hidden rounded-md shadow-sm mb-6 max-h-[180px]">
          <Image 
            src="/images/banner.png" 
            alt="SCB Sapphire FinSight Banner" 
            width={1200} 
            height={180} 
            className="w-full object-cover"
            priority
          />
        </div>
        
        {/* Welcome Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 border border-[hsl(var(--border))] rounded shadow-sm mb-6">
          <div>
            <h1 className="text-xl font-normal text-[hsl(var(--foreground))]">Welcome to SCB Sapphire FinSight</h1>
            <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">GCFO's digital gateway for data, executive insights driving commercial insights and business decision-making.</p>
          </div>
          <button
            onClick={() => setJouleOpen(true)}
            className="btn-sapui5 btn-sapui5-primary flex items-center self-start space-x-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Launch Joule</span>
          </button>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="SF Revenue"
            value={120567}
            change={6.3}
            period="vs Budget"
            format="currency"
          />
          <MetricCard
            title="Outlook vs Budget"
            value={10221}
            change={6.3}
            period="FY Outlook: 8m"
            format="currency"
          />
          <MetricCard
            title="SF Penetration"
            value={111}
            change={6.3}
            period="CIB Income: $n YTD"
            format="number"
          />
          <MetricCard
            title="YoY Income"
            value={14.32}
            change={6.3}
            period="Last Year YTD: $m"
            format="percentage"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Line Chart */}
          <div className="bg-white border border-[hsl(var(--border))] rounded shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-[hsl(var(--border))]">
              <h3 className="text-base font-normal">Monthly Revenue Trend</h3>
            </div>
            <div className="p-4">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="revenue" stroke="#4A5FDB" />
                  <Line type="monotone" dataKey="target" stroke="#1ED760" strokeDasharray="5 5" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pie Chart */}
          <div className="bg-white border border-[hsl(var(--border))] rounded shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-[hsl(var(--border))]">
              <h3 className="text-base font-normal">Revenue by Sector</h3>
            </div>
            <div className="p-4">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={sectorData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}%`}
                  >
                    {sectorData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* News Section */}
        <div className="bg-white border border-[hsl(var(--border))] rounded shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-[hsl(var(--border))]">
            <h3 className="text-base font-normal">News from SAP Joule</h3>
          </div>
          <div className="p-4">
            <div className="space-y-3">
              {newsItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-3 border-b border-[hsl(var(--border))] last:border-0">
                  <div className="flex-1">
                    <p className="text-sm font-normal">{item.title}</p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">{item.source}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-[hsl(var(--muted-foreground))]">{item.date}</span>
                    {item.important && (
                      <span className="px-2 py-1 bg-[hsla(var(--destructive),0.15)] text-[hsl(var(--destructive))] text-xs rounded">Important</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* News Categories */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* CNBC News */}
          <div className="bg-white border border-[hsl(var(--border))] rounded shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-[hsl(var(--border))]">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-[hsl(var(--destructive))]"></div>
                <h3 className="text-base font-normal">Important CNBC News</h3>
              </div>
            </div>
            <div className="p-4">
              <ul className="space-y-2">
                {[
                  'New regulation for APAC region',
                  'Impact tariff announcements on Asia markets',
                  'Bloomberg Green new regulations for APAC region',
                ].map((item, index) => (
                  <li key={index} className="flex items-start py-1 border-b border-[hsl(var(--border))] last:border-0">
                    <span className="text-[hsl(var(--destructive))] mr-2">•</span>
                    <span className="text-xs text-[hsl(var(--foreground))]">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bloomberg Green */}
          <div className="bg-white border border-[hsl(var(--border))] rounded shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-[hsl(var(--border))]">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-[hsl(var(--warning))]"></div>
                <h3 className="text-base font-normal">Bloomberg Green</h3>
              </div>
            </div>
            <div className="p-4">
              <ul className="space-y-2">
                {[
                  'New regulations for APAC region',
                  'Sustainability targets updated',
                  'Climate change impact assessment',
                ].map((item, index) => (
                  <li key={index} className="flex items-start py-1 border-b border-[hsl(var(--border))] last:border-0">
                    <span className="text-[hsl(var(--warning))] mr-2">•</span>
                    <span className="text-xs text-[hsl(var(--foreground))]">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* BNC Green */}
          <div className="bg-white border border-[hsl(var(--border))] rounded shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-[hsl(var(--border))]">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-[hsl(var(--success))]"></div>
                <h3 className="text-base font-normal">BNC Green</h3>
              </div>
            </div>
            <div className="p-4">
              <ul className="space-y-2">
                {[
                  'New regulations for APAC region',
                  'Environmental compliance update',
                  'Green finance opportunities',
                ].map((item, index) => (
                  <li key={index} className="flex items-start py-1 border-b border-[hsl(var(--border))] last:border-0">
                    <span className="text-[hsl(var(--success))] mr-2">•</span>
                    <span className="text-xs text-[hsl(var(--foreground))]">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      <JouleAssistant open={jouleOpen} onOpenChange={setJouleOpen} />
    </Layout>
  );
}