import React, { useState, useEffect } from 'react';
import Head from 'next/head';
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
  X
} from 'lucide-react';
import ScbBeautifulUI from '@/components/ScbBeautifulUI';
import { useDeviceCapabilities } from '@/hooks/useDeviceCapabilities';
import { useUIPreferences } from '@/context/UIPreferencesContext';
import { haptics } from '@/lib/haptics';

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
    timestamp: '2 hours ago',
    read: false,
    category: 'Portfolio'
  },
  {
    id: '2',
    type: 'success',
    title: 'Transaction Complete',
    message: 'Your transfer of $5,000 to Account #4281 has been completed successfully.',
    timestamp: 'Yesterday',
    read: true,
    category: 'Transactions'
  },
  {
    id: '3',
    type: 'warning',
    title: 'Security Alert',
    message: 'A new device was used to access your account. Please verify this was you.',
    timestamp: '2 days ago',
    read: false,
    category: 'Security'
  },
  {
    id: '4',
    type: 'info',
    title: 'New Feature Available',
    message: 'Try our new AI-powered financial insights feature in the Analytics section.',
    timestamp: '3 days ago',
    read: true,
    category: 'System'
  }
];

// Notification page component
export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>(sampleNotifications);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { isAppleDevice } = useDeviceCapabilities();
  const { isDarkMode } = useUIPreferences();
  
  // Count unread notifications
  const unreadCount = notifications.filter(n => !n.read).length;
  
  // Mark notification as read
  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true } 
          : notification
      )
    );
    
    // Provide haptic feedback on Apple devices
    if (isAppleDevice) {
      haptics.selection();
    }
  };
  
  // Mark all as read
  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
    
    // Provide haptic feedback on Apple devices
    if (isAppleDevice) {
      haptics.success();
    }
  };
  
  // Get notification icon based on type
  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'alert':
        return <AlertTriangle size={18} className="text-red-500" />;
      case 'success':
        return <Check size={18} className="text-green-500" />;
      case 'warning':
        return <AlertCircle size={18} className="text-amber-500" />;
      case 'info':
        return <Info size={18} className="text-blue-500" />;
      default:
        return <Bell size={18} className="text-gray-500" />;
    }
  };
  
  // Get notification color class based on type
  const getNotificationColorClass = (type: NotificationType) => {
    switch (type) {
      case 'alert':
        return isDarkMode ? 'border-red-800 bg-red-900/20' : 'border-red-100 bg-red-50';
      case 'success':
        return isDarkMode ? 'border-green-800 bg-green-900/20' : 'border-green-100 bg-green-50';
      case 'warning':
        return isDarkMode ? 'border-amber-800 bg-amber-900/20' : 'border-amber-100 bg-amber-50';
      case 'info':
        return isDarkMode ? 'border-blue-800 bg-blue-900/20' : 'border-blue-100 bg-blue-50';
      default:
        return isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50';
    }
  };
  
  // Filter notifications based on search query and active filter
  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = 
      searchQuery === '' || 
      notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesFilter = 
      !activeFilter || 
      notification.category === activeFilter;
      
    return matchesSearch && matchesFilter;
  });
  
  // Get unique categories for filtering
  const categories = Array.from(
    new Set(notifications.map(notification => notification.category).filter(Boolean))
  );
  
  return (
    <ScbBeautifulUI pageTitle="Notifications">
      <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header section */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Notifications</h1>
            <p className="text-gray-500 mt-1">
              {unreadCount > 0 ? `You have ${unreadCount} unread notifications` : 'No new notifications'}
            </p>
          </div>
          
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className={`text-sm font-medium px-3 py-1 rounded-md ${
                isDarkMode ? 'text-blue-400 hover:bg-blue-900/30' : 'text-blue-600 hover:bg-blue-50'
              }`}
            >
              Mark all as read
            </button>
          )}
        </div>
        
        {/* Search and filter bar */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                isDarkMode 
                  ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              }`}
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter size={16} className="text-gray-400" />
            <select
              value={activeFilter || ''}
              onChange={(e) => setActiveFilter(e.target.value || null)}
              className={`rounded-lg border px-3 py-2 ${
                isDarkMode 
                  ? 'bg-gray-800 border-gray-700 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Notifications list */}
        <div className="space-y-4">
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map(notification => (
              <div 
                key={notification.id}
                className={`p-4 rounded-lg border ${getNotificationColorClass(notification.type)} ${!notification.read ? 'border-l-4' : ''}`}
                onClick={() => markAsRead(notification.id)}
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0 mr-3">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">{notification.title}</h3>
                    <p className="text-sm mt-1">{notification.message}</p>
                    <div className="flex items-center mt-2 text-xs text-gray-500">
                      <Clock size={12} className="mr-1" />
                      <span>{notification.timestamp}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className={`p-8 text-center rounded-lg border ${
              isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
            }`}>
              <Bell size={24} className="mx-auto mb-2 text-gray-400" />
              <h3 className="text-lg font-medium">No notifications found</h3>
              <p className="text-sm text-gray-500 mt-1">
                {searchQuery || activeFilter 
                  ? 'Try changing your search or filter criteria' 
                  : 'You\'re all caught up!'}
              </p>
            </div>
          )}
        </div>
      </div>
    </ScbBeautifulUI>
  );
}
