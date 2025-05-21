import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { 
  Bell, 
  AlertTriangle, 
  Check, 
  Info, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Filter, 
  Search, 
  RefreshCw, 
  Trash2, 
  X, 
  Settings, 
  CheckSquare,
  ChevronDown,
  Calendar
} from 'lucide-react';
import ScbBeautifulUI from '@/components/ScbBeautifulUI';

// Sample notification types
type NotificationType = 'alert' | 'success' | 'warning' | 'info';

// Sample notification interface
interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  category?: string;
}

// Sample notifications data
const sampleNotifications: Notification[] = [
  {
    id: '1',
    type: 'alert',
    title: 'Portfolio Alert',
    message: 'Your tech sector allocation is above threshold (25%). Consider rebalancing your portfolio.',
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    read: false,
    actionUrl: '/portfolio',
    category: 'Portfolio'
  },
  {
    id: '2',
    type: 'success',
    title: 'Report Generated',
    message: 'Q2 Financial Analysis report has been successfully generated and is ready to view.',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    read: false,
    actionUrl: '/reports',
    category: 'Reports'
  },
  {
    id: '3',
    type: 'warning',
    title: 'Market Update',
    message: 'Market volatility has increased by 15% over the past week. Review your risk exposure.',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    read: true,
    category: 'Market'
  },
  {
    id: '4',
    type: 'info',
    title: 'New Feature Available',
    message: 'Monte Carlo simulations are now available in the Financial Simulator module.',
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    read: true,
    actionUrl: '/financial-simulation',
    category: 'System'
  },
  {
    id: '5',
    type: 'alert',
    title: 'Tariff Alert',
    message: 'New tariff regulations affecting automotive sector will be implemented starting next month.',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    read: false,
    actionUrl: '/tariff-alerts',
    category: 'Regulatory'
  },
  {
    id: '6',
    type: 'success',
    title: 'API Key Generated',
    message: 'Your new API key has been successfully generated. You can now use it for API access.',
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    read: true,
    actionUrl: '/api-explorer',
    category: 'System'
  },
  {
    id: '7',
    type: 'info',
    title: 'Scheduled Maintenance',
    message: 'System maintenance is scheduled for Sunday, June 5, from 2:00 AM to 4:00 AM GMT.',
    timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    read: true,
    category: 'System'
  },
  {
    id: '8',
    type: 'warning',
    title: 'Data Update Pending',
    message: 'Corporate financial data update for Q2 is pending. Some reports may show incomplete data.',
    timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    read: true,
    category: 'Data'
  },
  {
    id: '9',
    type: 'success',
    title: 'Watchlist Alert',
    message: 'Stock AAPL in your watchlist has reached your target price of $185.',
    timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    read: true,
    actionUrl: '/trading',
    category: 'Trading'
  },
  {
    id: '10',
    type: 'alert',
    title: 'Security Alert',
    message: 'Your account was accessed from a new device. Please verify if this was you.',
    timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    read: true,
    actionUrl: '/settings',
    category: 'Security'
  }
];

// Category list for filter
const categories = [
  'All',
  'Portfolio',
  'Trading',
  'Market',
  'Reports',
  'Regulatory',
  'System',
  'Data',
  'Security'
];

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>(sampleNotifications);
  const [filter, setFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);
  const [readFilter, setReadFilter] = useState<'all' | 'read' | 'unread'>('all');
  
  const refreshNotifications = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };
  
  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
  };
  
  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };
  
  const deleteNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    setSelectedNotifications(prev => prev.filter(id => id !== notificationId));
  };
  
  const deleteSelected = () => {
    setNotifications(prev => prev.filter(n => !selectedNotifications.includes(n.id)));
    setSelectedNotifications([]);
  };
  
  const toggleSelected = (notificationId: string) => {
    if (selectedNotifications.includes(notificationId)) {
      setSelectedNotifications(prev => prev.filter(id => id !== notificationId));
    } else {
      setSelectedNotifications(prev => [...prev, notificationId]);
    }
  };
  
  const selectAll = () => {
    const allIds = filteredNotifications.map(n => n.id);
    if (selectedNotifications.length === allIds.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(allIds);
    }
  };
  
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
  };
  
  // Filter notifications based on search, category, and read status
  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = searchQuery === '' || 
      notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = filter === 'All' || notification.category === filter;
    
    const matchesReadStatus = 
      readFilter === 'all' || 
      (readFilter === 'read' && notification.read) || 
      (readFilter === 'unread' && !notification.read);
    
    return matchesSearch && matchesCategory && matchesReadStatus;
  });
  
  // Count of unread notifications
  const unreadCount = notifications.filter(n => !n.read).length;

  // Get notification icon based on type
  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'alert': return <AlertCircle className="w-4 h-4 text-[rgb(var(--scb-muted-red))]" />;
      case 'success': return <CheckCircle className="w-4 h-4 text-[rgb(var(--scb-american-green))]" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case 'info': return <Info className="w-4 h-4 text-[rgb(var(--scb-honolulu-blue))]" />;
      default: return <Bell className="w-4 h-4 text-[rgb(var(--scb-dark-gray))]" />;
    }
  };

  return (
    <ScbBeautifulUI pageTitle="Notifications" showNewsBar={false}>
      <Head>
        <title>Notifications | SCB Sapphire FinSight</title>
      </Head>

      <div className="space-y-6">
        {/* Notifications Header */}
        <div className="bg-white rounded-lg shadow-sm border border-[rgb(var(--scb-border))] p-5">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div>
              <h2 className="text-xl font-medium text-[rgb(var(--scb-dark-gray))] flex items-center">
                <Bell className="mr-2 h-5 w-5" />
                Notifications
                {unreadCount > 0 && (
                  <span className="ml-2 px-2 py-0.5 text-xs bg-[rgb(var(--scb-honolulu-blue))] text-white rounded-full">
                    {unreadCount} unread
                  </span>
                )}
              </h2>
              <p className="text-sm text-[rgb(var(--scb-dark-gray))] opacity-80 mt-1">
                Stay updated with alerts, system notifications, and important updates
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={refreshNotifications}
                className="scb-btn-ghost p-2 rounded-full hover:bg-[rgba(var(--scb-light-gray),0.5)] transition-colors"
                disabled={isLoading}
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
              
              <Link href="/settings" className="scb-btn-ghost p-2 rounded-full hover:bg-[rgba(var(--scb-light-gray),0.5)] transition-colors">
                <Settings className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
        
        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm border border-[rgb(var(--scb-border))] p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-[rgb(var(--scb-dark-gray))]" />
              </div>
              <input
                type="text"
                placeholder="Search notifications..."
                className="scb-input pl-10 w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex gap-2">
              <div className="relative">
                <select
                  className="scb-input pl-3 pr-8 appearance-none"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                >
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                  <ChevronDown className="h-4 w-4 text-[rgb(var(--scb-dark-gray))]" />
                </div>
              </div>
              
              <div className="relative">
                <select
                  className="scb-input pl-3 pr-8 appearance-none"
                  value={readFilter}
                  onChange={(e) => setReadFilter(e.target.value as 'all' | 'read' | 'unread')}
                >
                  <option value="all">All</option>
                  <option value="read">Read</option>
                  <option value="unread">Unread</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                  <ChevronDown className="h-4 w-4 text-[rgb(var(--scb-dark-gray))]" />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Notifications List */}
        <div className="bg-white rounded-lg shadow-sm border border-[rgb(var(--scb-border))] overflow-hidden">
          <div className="px-6 py-3 border-b border-[rgb(var(--scb-border))] flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={selectAll}
                className={`p-1.5 rounded mr-3 border ${
                  selectedNotifications.length > 0 
                    ? 'border-[rgb(var(--scb-honolulu-blue))] bg-[rgba(var(--scb-honolulu-blue),0.1)]' 
                    : 'border-[rgb(var(--scb-border))]'
                }`}
              >
                <CheckSquare className={`h-4 w-4 ${
                  selectedNotifications.length > 0 
                    ? 'text-[rgb(var(--scb-honolulu-blue))]' 
                    : 'text-[rgb(var(--scb-dark-gray))] opacity-50'
                }`} />
              </button>
              
              <h3 className="text-sm font-medium text-[rgb(var(--scb-dark-gray))]">
                {selectedNotifications.length > 0 ? (
                  `${selectedNotifications.length} selected`
                ) : (
                  `${filteredNotifications.length} notifications`
                )}
              </h3>
            </div>
            
            <div className="flex items-center gap-2">
              {selectedNotifications.length > 0 ? (
                <>
                  <button
                    onClick={() => {
                      setNotifications(prev => prev.map(n => 
                        selectedNotifications.includes(n.id) ? { ...n, read: true } : n
                      ));
                    }}
                    className="text-xs text-[rgb(var(--scb-honolulu-blue))] hover:text-[rgb(var(--scb-honolulu-blue-dark))] font-medium"
                  >
                    Mark as read
                  </button>
                  <div className="w-px h-4 bg-[rgb(var(--scb-border))]"></div>
                  <button
                    onClick={deleteSelected}
                    className="text-xs text-[rgb(var(--scb-muted-red))] hover:text-[rgb(var(--scb-muted-red-dark))] font-medium"
                  >
                    Delete
                  </button>
                </>
              ) : (
                unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-[rgb(var(--scb-honolulu-blue))] hover:text-[rgb(var(--scb-honolulu-blue-dark))] font-medium"
                  >
                    Mark all as read
                  </button>
                )
              )}
            </div>
          </div>
          
          <div className="divide-y divide-[rgb(var(--scb-border))]">
            {filteredNotifications.length === 0 ? (
              <div className="py-12 px-6 text-center">
                <Bell className="h-12 w-12 mx-auto text-[rgb(var(--scb-dark-gray))] opacity-20 mb-3" />
                <h3 className="text-lg font-medium text-[rgb(var(--scb-dark-gray))]">No notifications found</h3>
                <p className="text-sm text-[rgb(var(--scb-dark-gray))] opacity-70 mt-1 max-w-md mx-auto">
                  {searchQuery 
                    ? 'Try adjusting your search or filters to find the notifications you\'re looking for.'
                    : 'You\'re all caught up! No notifications match your current filters.'}
                </p>
              </div>
            ) : (
              filteredNotifications.map(notification => (
                <div 
                  key={notification.id} 
                  className={`px-6 py-4 hover:bg-[rgba(var(--scb-light-gray),0.2)] group relative ${
                    !notification.read ? 'bg-[rgba(var(--scb-honolulu-blue),0.05)]' : ''
                  }`}
                >
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mr-4">
                      <button
                        onClick={() => toggleSelected(notification.id)}
                        className={`p-1.5 rounded border ${
                          selectedNotifications.includes(notification.id) 
                            ? 'border-[rgb(var(--scb-honolulu-blue))] bg-[rgba(var(--scb-honolulu-blue),0.1)]' 
                            : 'border-[rgb(var(--scb-border))] opacity-0 group-hover:opacity-100'
                        }`}
                      >
                        <CheckSquare className={`h-4 w-4 ${
                          selectedNotifications.includes(notification.id) 
                            ? 'text-[rgb(var(--scb-honolulu-blue))]' 
                            : 'text-[rgb(var(--scb-dark-gray))] opacity-50'
                        }`} />
                      </button>
                    </div>
                    
                    <div className="flex-shrink-0 mt-1 mr-3">
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h4 className={`text-sm ${notification.read ? 'font-normal' : 'font-medium'} text-[rgb(var(--scb-dark-gray))]`}>
                          {notification.title}
                        </h4>
                        <div className="flex items-center ml-4">
                          <span className="text-xs text-[rgb(var(--scb-dark-gray))] opacity-70">
                            {formatTimestamp(notification.timestamp)}
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-sm text-[rgb(var(--scb-dark-gray))] mt-1">
                        {notification.message}
                      </p>
                      
                      <div className="mt-2 flex flex-wrap items-center gap-3">
                        {notification.category && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[rgba(var(--scb-light-gray),0.5)] text-[rgb(var(--scb-dark-gray))]">
                            {notification.category}
                          </span>
                        )}
                        
                        {notification.actionUrl && (
                          <Link 
                            href={notification.actionUrl}
                            className="text-xs font-medium text-[rgb(var(--scb-honolulu-blue))]"
                            onClick={() => markAsRead(notification.id)}
                          >
                            View Details
                          </Link>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex-shrink-0 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!notification.read && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="p-1.5 rounded-full hover:bg-[rgba(var(--scb-light-gray),0.5)] transition-colors text-[rgb(var(--scb-dark-gray))]"
                          title="Mark as read"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                      )}
                      
                      <button
                        onClick={() => deleteNotification(notification.id)}
                        className="p-1.5 rounded-full hover:bg-[rgba(var(--scb-light-gray),0.5)] transition-colors text-[rgb(var(--scb-dark-gray))]"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    
                    {!notification.read && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-[rgb(var(--scb-honolulu-blue))]"></div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
          
          {filteredNotifications.length > 0 && (
            <div className="px-6 py-4 border-t border-[rgb(var(--scb-border))] flex items-center justify-between">
              <button className="text-xs text-[rgb(var(--scb-muted-red))] font-medium flex items-center">
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                <span>Clear all notifications</span>
              </button>
              
              <Link href="/settings" className="text-xs text-[rgb(var(--scb-dark-gray))] font-medium flex items-center">
                <Settings className="h-3.5 w-3.5 mr-1" />
                <span>Notification Settings</span>
              </Link>
            </div>
          )}
        </div>
        
        {/* Notification Preferences Quick Access */}
        <div className="bg-white rounded-lg shadow-sm border border-[rgb(var(--scb-border))] overflow-hidden">
          <div className="px-6 py-4 border-b border-[rgb(var(--scb-border))]">
            <h3 className="text-base font-medium text-[rgb(var(--scb-dark-gray))]">Notification Preferences</h3>
          </div>
          
          <div className="p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 border border-[rgb(var(--scb-border))] rounded-lg hover:bg-[rgba(var(--scb-light-gray),0.2)] transition-colors">
                <div className="flex items-center mb-3">
                  <div className="p-1.5 rounded-full bg-[rgba(var(--scb-honolulu-blue),0.1)] mr-3">
                    <Bell className="h-4 w-4 text-[rgb(var(--scb-honolulu-blue))]" />
                  </div>
                  <h4 className="text-sm font-medium text-[rgb(var(--scb-dark-gray))]">Delivery Methods</h4>
                </div>
                <p className="text-xs text-[rgb(var(--scb-dark-gray))]">
                  Configure how you receive notifications (email, in-app, mobile)
                </p>
              </div>
              
              <div className="p-4 border border-[rgb(var(--scb-border))] rounded-lg hover:bg-[rgba(var(--scb-light-gray),0.2)] transition-colors">
                <div className="flex items-center mb-3">
                  <div className="p-1.5 rounded-full bg-[rgba(var(--scb-american-green),0.1)] mr-3">
                    <Filter className="h-4 w-4 text-[rgb(var(--scb-american-green))]" />
                  </div>
                  <h4 className="text-sm font-medium text-[rgb(var(--scb-dark-gray))]">Category Settings</h4>
                </div>
                <p className="text-xs text-[rgb(var(--scb-dark-gray))]">
                  Choose which notification categories you want to receive
                </p>
              </div>
              
              <div className="p-4 border border-[rgb(var(--scb-border))] rounded-lg hover:bg-[rgba(var(--scb-light-gray),0.2)] transition-colors">
                <div className="flex items-center mb-3">
                  <div className="p-1.5 rounded-full bg-[rgba(var(--scb-muted-red),0.1)] mr-3">
                    <AlertTriangle className="h-4 w-4 text-[rgb(var(--scb-muted-red))]" />
                  </div>
                  <h4 className="text-sm font-medium text-[rgb(var(--scb-dark-gray))]">Alert Thresholds</h4>
                </div>
                <p className="text-xs text-[rgb(var(--scb-dark-gray))]">
                  Set custom thresholds for market and portfolio alerts
                </p>
              </div>
              
              <div className="p-4 border border-[rgb(var(--scb-border))] rounded-lg hover:bg-[rgba(var(--scb-light-gray),0.2)] transition-colors">
                <div className="flex items-center mb-3">
                  <div className="p-1.5 rounded-full bg-[rgba(var(--scb-dark-gray),0.1)] mr-3">
                    <Calendar className="h-4 w-4 text-[rgb(var(--scb-dark-gray))]" />
                  </div>
                  <h4 className="text-sm font-medium text-[rgb(var(--scb-dark-gray))]">Scheduled Reports</h4>
                </div>
                <p className="text-xs text-[rgb(var(--scb-dark-gray))]">
                  Manage your scheduled report notifications and frequency
                </p>
              </div>
            </div>
            
            <div className="mt-4 text-center">
              <Link href="/settings" className="scb-btn scb-btn-primary">
                Manage All Notification Settings
              </Link>
            </div>
          </div>
        </div>
      </div>
    </ScbBeautifulUI>
  );
}