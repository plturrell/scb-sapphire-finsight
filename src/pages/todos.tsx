import React from 'react';
import Layout from '../components/Layout';
import IntelligentTodoList from '../components/IntelligentTodoList';
import { MonochromeIcons } from '../components/MonochromeIcons';

const TodosPage: React.FC = () => {
  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Perfect Header */}
        <div className="bg-white/90 backdrop-blur-xl border-b border-[#1d1d1f]/10">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-[#1d1d1f]/5 rounded-2xl">
                <MonochromeIcons.GitBranch size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-[#1d1d1f] mb-1">
                  Intelligent Development
                </h1>
                <p className="text-[#1d1d1f]/60 text-sm">
                  AI-generated todos from git commit analysis
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          <IntelligentTodoList />
        </div>
      </div>
    </Layout>
  );
};

export default TodosPage;