import React, { useState, useEffect } from 'react';
import { MonochromeIcons } from './MonochromeIcons';

interface TodoItem {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'high' | 'medium' | 'low';
  linkedCommit?: string;
  category: 'feature' | 'bugfix' | 'refactor' | 'docs' | 'test';
  createdAt: string;
}

interface TodoResponse {
  success: boolean;
  todos: TodoItem[];
  metadata: {
    totalCommits: number;
    generatedTodos: number;
    lastUpdate: string;
  };
}

const IntelligentTodoList: React.FC = () => {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [metadata, setMetadata] = useState<TodoResponse['metadata'] | null>(null);

  useEffect(() => {
    loadTodos();
  }, []);

  const loadTodos = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/git-todo');
      if (!response.ok) {
        throw new Error('Failed to load intelligent todos');
      }
      
      const data: TodoResponse = await response.json();
      if (data.success) {
        setTodos(data.todos);
        setMetadata(data.metadata);
      } else {
        throw new Error('API returned unsuccessful response');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const updateTodoStatus = async (todoId: string, newStatus: TodoItem['status']) => {
    setTodos(prev => prev.map(todo => 
      todo.id === todoId ? { ...todo, status: newStatus } : todo
    ));
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'feature': return <MonochromeIcons.Plus size={16} />;
      case 'bugfix': return <MonochromeIcons.AlertTriangle size={16} />;
      case 'refactor': return <MonochromeIcons.RotateCcw size={16} />;
      case 'docs': return <MonochromeIcons.FileText size={16} />;
      case 'test': return <MonochromeIcons.CheckCircle size={16} />;
      default: return <MonochromeIcons.Circle size={16} />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <MonochromeIcons.Circle size={16} />;
      case 'in_progress': return <MonochromeIcons.RotateCcw size={16} />;
      case 'completed': return <MonochromeIcons.CheckCircle size={16} />;
      default: return <MonochromeIcons.Circle size={16} />;
    }
  };

  const getPriorityIndicator = (priority: string) => {
    const baseStyle = "h-2 w-2 rounded-full";
    switch (priority) {
      case 'high': return <div className={`${baseStyle} bg-red-500`} />;
      case 'medium': return <div className={`${baseStyle} bg-yellow-500`} />;
      case 'low': return <div className={`${baseStyle} bg-green-500`} />;
      default: return <div className={`${baseStyle} bg-gray-400`} />;
    }
  };

  const filteredTodos = selectedCategory === 'all' 
    ? todos 
    : todos.filter(todo => todo.category === selectedCategory);

  const categories = ['all', 'feature', 'bugfix', 'refactor', 'docs', 'test'];

  if (loading) {
    return (
      <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-8">
        <div className="flex items-center justify-center space-x-3">
          <MonochromeIcons.RotateCcw size={20} className="animate-spin" />
          <span className="text-[#1d1d1f] text-sm font-medium">Analyzing git history...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-8">
        <div className="flex items-center space-x-3 text-red-600">
          <MonochromeIcons.AlertTriangle size={20} />
          <span className="text-sm font-medium">{error}</span>
        </div>
        <button 
          onClick={loadTodos}
          className="mt-4 px-4 py-2 text-[#1d1d1f] border border-[#1d1d1f]/20 rounded-lg hover:bg-[#1d1d1f]/5 transition-all duration-200"
        >
          Retry Analysis
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <MonochromeIcons.GitBranch size={20} />
            <h2 className="text-lg font-semibold text-[#1d1d1f]">Intelligent Todo List</h2>
          </div>
          <button 
            onClick={loadTodos}
            className="p-2 hover:bg-[#1d1d1f]/5 rounded-lg transition-all duration-200"
            title="Refresh analysis"
          >
            <MonochromeIcons.RefreshCw size={16} />
          </button>
        </div>

        {metadata && (
          <div className="flex items-center space-x-6 text-sm text-[#1d1d1f]/60">
            <span>{metadata.totalCommits} commits analyzed</span>
            <span>{metadata.generatedTodos} todos generated</span>
            <span>Updated {new Date(metadata.lastUpdate).toLocaleTimeString()}</span>
          </div>
        )}
      </div>

      {/* Category Filter */}
      <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-4">
        <div className="flex space-x-2 overflow-x-auto">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap flex items-center space-x-2 ${
                selectedCategory === category
                  ? 'bg-[#1d1d1f] text-white'
                  : 'text-[#1d1d1f] hover:bg-[#1d1d1f]/5'
              }`}
            >
              {category !== 'all' && getCategoryIcon(category)}
              <span className="capitalize">{category}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Todo Items */}
      <div className="space-y-3">
        {filteredTodos.length === 0 ? (
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-8 text-center">
            <MonochromeIcons.CheckCircle size={32} className="mx-auto mb-4 text-[#1d1d1f]/40" />
            <p className="text-[#1d1d1f]/60">No todos found for the selected category</p>
          </div>
        ) : (
          filteredTodos.map(todo => (
            <div key={todo.id} className="bg-white/90 backdrop-blur-xl rounded-2xl p-6 hover:bg-white/95 transition-all duration-200">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <button
                      onClick={() => {
                        const nextStatus = todo.status === 'pending' ? 'in_progress' 
                          : todo.status === 'in_progress' ? 'completed' 
                          : 'pending';
                        updateTodoStatus(todo.id, nextStatus);
                      }}
                      className="p-1 hover:bg-[#1d1d1f]/10 rounded transition-all duration-200"
                    >
                      {getStatusIcon(todo.status)}
                    </button>
                    
                    <h3 className={`font-medium ${
                      todo.status === 'completed' 
                        ? 'text-[#1d1d1f]/40 line-through' 
                        : 'text-[#1d1d1f]'
                    }`}>
                      {todo.title}
                    </h3>
                    
                    <div className="flex items-center space-x-2">
                      {getCategoryIcon(todo.category)}
                      {getPriorityIndicator(todo.priority)}
                    </div>
                  </div>
                  
                  <p className={`text-sm mb-3 ${
                    todo.status === 'completed' 
                      ? 'text-[#1d1d1f]/30' 
                      : 'text-[#1d1d1f]/60'
                  }`}>
                    {todo.description}
                  </p>
                  
                  <div className="flex items-center space-x-4 text-xs text-[#1d1d1f]/40">
                    {todo.linkedCommit && (
                      <div className="flex items-center space-x-1">
                        <MonochromeIcons.GitCommit size={12} />
                        <span>{todo.linkedCommit.substring(0, 7)}</span>
                      </div>
                    )}
                    <span>{new Date(todo.createdAt).toLocaleDateString()}</span>
                    <span className="capitalize">{todo.category}</span>
                    <span className="capitalize">{todo.priority} priority</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default IntelligentTodoList;