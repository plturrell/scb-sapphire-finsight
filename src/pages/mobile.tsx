import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, Filter, Bell, Grid3x3, FileText, MoreHorizontal } from 'lucide-react';

interface TabProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

function Tab({ label, active, onClick }: TabProps) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 font-medium transition-colors border-b-2 ${
        active
          ? 'text-primary border-primary'
          : 'text-gray-600 border-transparent'
      }`}
    >
      {label}
    </button>
  );
}

export default function MobileView() {
  const [activeTab, setActiveTab] = useState('Posts');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="flex items-center justify-between p-4">
          <Link href="/" className="p-2">
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-lg font-semibold flex-1 text-center">FinSight</h1>
          <div className="flex items-center space-x-3">
            <button className="p-2">
              <Filter className="w-6 h-6" />
            </button>
            <button className="p-2">
              <Bell className="w-6 h-6" />
            </button>
          </div>
        </div>
        <div className="flex border-t">
          <Tab label="Posts" active={activeTab === 'Posts'} onClick={() => setActiveTab('Posts')} />
          <Tab label="Files" active={activeTab === 'Files'} onClick={() => setActiveTab('Files')} />
          <Tab label="More" active={activeTab === 'More'} onClick={() => setActiveTab('More')} />
        </div>
      </header>

      {/* Content */}
      <main className="p-4">
        {activeTab === 'Posts' && (
          <div className="space-y-4">
            {/* Sample post content */}
            <div className="bg-white rounded-lg p-4 shadow">
              <h3 className="font-semibold mb-2">Market Update</h3>
              <p className="text-gray-600 text-sm">Asia-Pacific markets showing strong performance...</p>
              <div className="mt-3 flex items-center justify-between text-sm text-gray-500">
                <span>2 hours ago</span>
                <span>12 comments</span>
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow">
              <h3 className="font-semibold mb-2">Quarterly Report</h3>
              <p className="text-gray-600 text-sm">Q2 results exceed expectations with revenue growth...</p>
              <div className="mt-3 flex items-center justify-between text-sm text-gray-500">
                <span>5 hours ago</span>
                <span>8 comments</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Files' && (
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-4 shadow flex items-center space-x-3">
              <FileText className="w-8 h-8 text-primary" />
              <div className="flex-1">
                <h3 className="font-semibold">Annual Report 2024.pdf</h3>
                <p className="text-sm text-gray-600">Updated 3 days ago</p>
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow flex items-center space-x-3">
              <FileText className="w-8 h-8 text-primary" />
              <div className="flex-1">
                <h3 className="font-semibold">Market Analysis.xlsx</h3>
                <p className="text-sm text-gray-600">Updated 1 week ago</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'More' && (
          <div className="space-y-4">
            <button className="w-full bg-white rounded-lg p-4 shadow flex items-center justify-between">
              <span className="font-medium">Settings</span>
              <ChevronLeft className="w-5 h-5 transform rotate-180" />
            </button>
            <button className="w-full bg-white rounded-lg p-4 shadow flex items-center justify-between">
              <span className="font-medium">Help & Support</span>
              <ChevronLeft className="w-5 h-5 transform rotate-180" />
            </button>
            <button className="w-full bg-white rounded-lg p-4 shadow flex items-center justify-between">
              <span className="font-medium">About</span>
              <ChevronLeft className="w-5 h-5 transform rotate-180" />
            </button>
          </div>
        )}
      </main>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t">
        <div className="flex items-center justify-around py-2">
          <button className="p-3">
            <Grid3x3 className="w-6 h-6 text-primary" />
          </button>
          <button className="p-3">
            <FileText className="w-6 h-6 text-gray-600" />
          </button>
          <button className="p-3">
            <Bell className="w-6 h-6 text-gray-600" />
          </button>
          <button className="p-3">
            <MoreHorizontal className="w-6 h-6 text-gray-600" />
          </button>
        </div>
      </nav>
    </div>
  );
}