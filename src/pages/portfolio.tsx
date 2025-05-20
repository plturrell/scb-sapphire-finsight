import React from 'react';
import ModernLayout from '@/components/ModernLayout';
import MetricCard from '@/components/MetricCard';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

const portfolioData = [
  { region: 'United Kingdom', planned: 75, actual: 82 },
  { region: 'India', planned: 65, actual: 70 },
  { region: 'Bangladesh', planned: 58, actual: 60 },
  { region: 'United States', planned: 85, actual: 88 },
  { region: 'United Arab Emirates', planned: 62, actual: 65 },
  { region: 'China', planned: 78, actual: 80 },
  { region: 'Korea', planned: 55, actual: 58 },
];

const taskData = [
  { id: '1', task: 'Review annual budget allocation', status: 'completed', dueDate: '2025-01-15' },
  { id: '2', task: 'Provide personal details for company records', status: 'pending', dueDate: '2025-01-20' },
  { id: '3', task: 'Update compliance certifications', status: 'overdue', dueDate: '2025-01-10' },
  { id: '4', task: 'Complete Q4 performance review', status: 'pending', dueDate: '2025-01-25' },
];

export default function Portfolio() {
  return (
    <ModernLayout>
      <div className="space-y-6">
        <div>
          <h1 className="scb-title text-2xl font-bold text-[rgb(var(--scb-honolulu-blue))]">Asia Portfolio</h1>
          <p className="scb-data-label text-[rgb(var(--scb-dark-gray))] mt-1">Sofia - Transaction Banking CFO</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total Revenue"
            value={14.32}
            change={6.3}
            period="YoY Income"
            format="percentage"
          />
          <MetricCard
            title="RoRWA"
            value={6.3}
            change={6.3}
            period="Risk-adjusted returns"
            format="percentage"
          />
          <MetricCard
            title="Sustainable Finance"
            value={50789}
            period="Mobilization"
            format="currency"
          />
          <MetricCard
            title="Tasks"
            value="7 overdue"
            period="3 tasks need attention"
            format="string"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-[rgb(var(--scb-border))] p-6 fiori-tile">
            <h3 className="scb-section-header text-lg font-medium mb-4">Regional Performance</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={portfolioData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="region" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="planned" fill="#9CA3AF" name="Planned" />
                <Bar dataKey="actual" fill="#4A5FDB" name="Actual" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-[rgb(var(--scb-border))] p-6 fiori-tile">
            <h3 className="scb-section-header text-lg font-medium mb-4">Tasks</h3>
            <div className="space-y-3">
              {taskData.map((task) => (
                <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{task.task}</p>
                    <p className="text-sm text-gray-600">Due: {task.dueDate}</p>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      task.status === 'completed'
                        ? 'bg-[rgba(var(--scb-american-green),0.1)] text-[rgb(var(--scb-american-green))] scb-badge scb-badge-positive'
                        : task.status === 'overdue'
                        ? 'bg-[rgba(var(--scb-muted-red),0.1)] text-[rgb(var(--scb-muted-red))] scb-badge scb-badge-negative'
                        : 'bg-[rgba(var(--scb-honolulu-blue),0.1)] text-[rgb(var(--scb-honolulu-blue))] scb-badge scb-badge-neutral'
                    }`}
                  >
                    {task.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-[rgb(var(--scb-border))] p-6 fiori-tile">
          <h3 className="scb-section-header text-lg font-medium mb-4">Personal & Additional Data Collection</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Personal Data Collection</p>
                <p className="text-sm text-gray-600">Provide personal details for company records</p>
              </div>
              <button className="px-4 py-2 bg-[rgb(var(--scb-honolulu-blue))] text-white rounded-lg hover:opacity-90 transition-opacity fiori-btn fiori-btn-primary">
                Start
              </button>
            </div>
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Compliance Data Collection</p>
                <p className="text-sm text-gray-600">Complete mandatory compliance questionnaire</p>
              </div>
              <button className="px-4 py-2 bg-[rgb(var(--scb-honolulu-blue))] text-white rounded-lg hover:opacity-90 transition-opacity fiori-btn fiori-btn-primary">
                Start
              </button>
            </div>
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Update Profile</p>
                <p className="text-sm text-gray-600">Update your professional and contact details</p>
              </div>
              <button className="px-4 py-2 bg-[rgb(var(--scb-honolulu-blue))] text-white rounded-lg hover:opacity-90 transition-opacity fiori-btn fiori-btn-primary">
                Start
              </button>
            </div>
          </div>
        </div>
      </div>
    </ModernLayout>
  );
}