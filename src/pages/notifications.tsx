import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  X,
  ChevronRight
} from 'lucide-react';
import ScbBeautifulUI from '@/components/ScbBeautifulUI';
import { useDeviceCapabilities } from '@/hooks/useDeviceCapabilities';
import { useUIPreferences } from '@/context/UIPreferencesContext';
import { haptics } from '@/lib/haptics';
import EnhancedTouchButton from '@/components/EnhancedTouchButton';
import EnhancedIOSNavBar from '@/components/EnhancedIOSNavBar';
import { useSafeArea } from '@/hooks/useSafeArea';
import { useApplePhysics } from '@/hooks/useApplePhysics';

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
  
  // iOS optimization hooks
  const { deviceType, isAppleDevice, screenSize } = useDeviceCapabilities();
  const { isDarkMode } = useUIPreferences();
  const { safeArea, orientation, hasHomeIndicator, hasDynamicIsland } = useSafeArea();
  const physics = useApplePhysics({ motion: 'standard', respectReduceMotion: true });
  
  // Detect if running on Apple device
  const isiOS = deviceType === 'mobile' && isAppleDevice;
  const isiPad = deviceType === 'tablet' && isAppleDevice;
  const isApplePlatform = isiOS || isiPad;
  
  // References for swipe actions
  const swipeRefs = useRef<{[key: string]: HTMLDivElement | null}>({});
  const swipeStartX = useRef<number | null>(null);
  const activeSwipeItem = useRef<string | null>(null);
  
  // Detect iPad multi-tasking mode (Slide Over, Split View, or Full Screen)
  const [iPadMode, setIPadMode] = useState<'full' | 'split' | 'slide' | 'none'>('full');
  
  // Track iPad multi-tasking mode
  useEffect(() => {
    if (!isiPad) return;
    
    const detectMultitaskingMode = () => {
      const windowWidth = window.innerWidth;
      const screenWidth = window.screen.width;
      
      // iPad multi-tasking detection logic
      if (windowWidth === screenWidth || (orientation === 'landscape' && windowWidth > 768)) {
        // Full screen mode
        setIPadMode('full');
      } else if (windowWidth >= 320 && windowWidth <= 400) {
        // Slide Over mode (narrow floating window)
        setIPadMode('slide');
      } else {
        // Split View mode (portion of the screen)
        setIPadMode('split');
      }
    };
    
    // Initial detection
    detectMultitaskingMode();
    
    // Update on resize
    window.addEventListener('resize', detectMultitaskingMode);
    
    return () => {
      window.removeEventListener('resize', detectMultitaskingMode);
    };
  }, [isiPad, orientation]);
  
  // Count unread notifications
  const unreadCount = notifications.filter(n => !n.read).length;
  
  // Helper to adapt layout based on iPad multi-tasking mode
  const getLayoutForIPadMode = useCallback(() => {
    if (!isiPad) return '';
    
    switch (iPadMode) {
      case 'slide':
        return 'ipad-slide-over-mode';
      case 'split':
        return 'ipad-split-view-mode';
      default:
        return 'ipad-full-screen-mode';
    }
  }, [isiPad, iPadMode]);

  // Compact layout for smaller screens or iPad Slide Over mode
  const useCompactLayout = isiPad && iPadMode === 'slide' || screenSize === 'mobile';
  
  // Mark notification as read
  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true } 
          : notification
      )
    );
    
    // Provide haptic feedback on Apple devices
    if (isApplePlatform) {
      haptics.selection();
    }
    
    // Reset swipe state
    if (activeSwipeItem.current === id) {
      resetSwipe(id);
    }
  }, [isApplePlatform]);
  
  // Delete notification
  const deleteNotification = useCallback((id: string) => {
    // Provide haptic feedback on Apple devices
    if (isApplePlatform) {
      haptics.rigid();
    }
    
    setNotifications(prev => prev.filter(notification => notification.id !== id));
    
    // Reset swipe state
    resetSwipe(id);
  }, [isApplePlatform]);
  
  // Mark all as read
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
    
    // Provide haptic feedback on Apple devices
    if (isApplePlatform) {
      haptics.success();
    }
    
    // Reset all swipe states
    resetAllSwipes();
  }, [isApplePlatform]);
  
  // Swipe gesture handlers for iOS style
  const handleTouchStart = useCallback((e: React.TouchEvent, id: string) => {
    if (!isApplePlatform) return;
    
    swipeStartX.current = e.touches[0].clientX;
    activeSwipeItem.current = id;
  }, [isApplePlatform]);
  
  const handleTouchMove = useCallback((e: React.TouchEvent, id: string) => {
    if (!isApplePlatform || swipeStartX.current === null || activeSwipeItem.current !== id) return;
    
    const currentX = e.touches[0].clientX;
    const diffX = swipeStartX.current - currentX;
    
    // Only allow swiping left
    if (diffX > 0) {
      const elem = swipeRefs.current[id];
      if (!elem) return;
      
      // Limit the swipe to 160px (width of action buttons)
      const translateX = Math.min(diffX, 160);
      elem.style.transform = `translateX(-${translateX}px)`;
      
      // Show action buttons based on swipe distance
      const readAction = elem.querySelector('.swipe-read-action') as HTMLElement;
      const deleteAction = elem.querySelector('.swipe-delete-action') as HTMLElement;
      
      if (readAction && deleteAction) {
        if (translateX > 80) {
          readAction.style.opacity = '1';
          deleteAction.style.opacity = '1';
        } else if (translateX > 40) {
          readAction.style.opacity = '1';
          deleteAction.style.opacity = '0';
        } else {
          readAction.style.opacity = '0';
          deleteAction.style.opacity = '0';
        }
      }
    }
  }, [isApplePlatform]);
  
  const handleTouchEnd = useCallback((e: React.TouchEvent, id: string) => {
    if (!isApplePlatform || swipeStartX.current === null || activeSwipeItem.current !== id) return;
    
    const elem = swipeRefs.current[id];
    if (!elem) return;
    
    const endX = e.changedTouches[0].clientX;
    const diffX = swipeStartX.current - endX;
    
    // If swiped far enough, show action buttons
    if (diffX > 80) {
      elem.style.transform = 'translateX(-160px)';
      
      const readAction = elem.querySelector('.swipe-read-action') as HTMLElement;
      const deleteAction = elem.querySelector('.swipe-delete-action') as HTMLElement;
      
      if (readAction && deleteAction) {
        readAction.style.opacity = '1';
        deleteAction.style.opacity = '1';
      }
      
      // Provide haptic feedback
      haptics.light();
    } else {
      // Reset position
      resetSwipe(id);
    }
    
    swipeStartX.current = null;
  }, [isApplePlatform]);
  
  // Reset swipe state for a specific notification
  const resetSwipe = useCallback((id: string) => {
    const elem = swipeRefs.current[id];
    if (!elem) return;
    
    elem.style.transform = 'translateX(0)';
    
    const readAction = elem.querySelector('.swipe-read-action') as HTMLElement;
    const deleteAction = elem.querySelector('.swipe-delete-action') as HTMLElement;
    
    if (readAction && deleteAction) {
      readAction.style.opacity = '0';
      deleteAction.style.opacity = '0';
    }
  }, []);
  
  // Reset all swipe states
  const resetAllSwipes = useCallback(() => {
    Object.keys(swipeRefs.current).forEach(id => resetSwipe(id));
  }, [resetSwipe]);
  
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
  
  // Configure iOS navigation bar actions
  const navRightActions = [
    {
      icon: 'tray.full',
      label: 'Mark All Read',
      onPress: markAllAsRead,
      variant: 'primary',
      disabled: unreadCount === 0
    }
  ];

  // Render different UIs for Apple vs non-Apple devices
  return isApplePlatform ? (
    <>
      <Head>
        <title>Notifications | SCB Sapphire FinSight</title>
      </Head>

      <EnhancedIOSNavBar 
        title="Notifications"
        largeTitle={true}
        rightActions={navRightActions}
        respectSafeArea={true}
        transparent={false}
        blurred={true}
        theme={isDarkMode ? 'dark' : 'light'}
        subtitle={unreadCount > 0 ? `${unreadCount} unread` : undefined}
      />
      
      <div 
        className={`space-y-4 px-4 pt-2 ${getLayoutForIPadMode()}`}
        style={{ 
          paddingBottom: hasHomeIndicator ? '34px' : '16px',
          maxWidth: isiPad && iPadMode === 'full' ? '768px' : '100%',
          margin: isiPad && iPadMode === 'full' ? '0 auto' : '0'
        }}
      >
        {/* iOS-style search bar */}
        <div className="py-2">
          <div className="relative flex w-full">
            <div 
              className={`flex items-center w-full overflow-hidden rounded-full shadow-sm
              ${isDarkMode 
                ? 'bg-gray-800/80 border border-gray-700' 
                : 'bg-gray-100/90 border border-gray-200'
              }`}
              style={{ backdropFilter: 'blur(4px)' }}
            >
              <div className="pl-4 flex items-center">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search notifications..."
                className={`w-full py-2.5 px-3 border-0 bg-transparent focus:outline-none text-sm ${
                  isDarkMode ? 'text-white placeholder-gray-400' : 'text-gray-900 placeholder-gray-500'
                }`}
                style={{ fontFamily: "-apple-system, system-ui, BlinkMacSystemFont, sans-serif" }}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (isApplePlatform) {
                    haptics.selection();
                  }
                }}
              />
              {searchQuery && (
                <button 
                  className="pr-4 text-gray-400"
                  onClick={() => {
                    setSearchQuery('');
                    if (isApplePlatform) {
                      haptics.light();
                    }
                  }}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            
            <div className="ml-2">
              <EnhancedTouchButton
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (isApplePlatform) {
                    haptics.selection();
                  }
                  setActiveFilter(activeFilter ? null : categories[0] || null);
                }}
                leftIcon={<Filter className="h-4 w-4" />}
                className={activeFilter ? 'bg-blue-500/10 text-blue-500' : ''}
              >
                {activeFilter ? activeFilter : 'Filter'}
              </EnhancedTouchButton>
            </div>
          </div>
          
          {/* Filter tags */}
          {categories.length > 0 && (
            <div className="flex items-center space-x-2 overflow-x-auto py-2 no-scrollbar">
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => {
                    if (isApplePlatform) {
                      haptics.selection();
                    }
                    setActiveFilter(activeFilter === category ? null : category);
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    activeFilter === category
                      ? isDarkMode 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-blue-500 text-white'
                      : isDarkMode 
                        ? 'bg-gray-800 text-gray-300 border border-gray-700' 
                        : 'bg-gray-100 text-gray-700 border border-gray-200'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          )}
        </div>
        
        {/* iOS-style notification list with swipe actions */}
        <div className={`rounded-xl shadow-sm overflow-hidden ${
          isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
        }`}>
          {filteredNotifications.length > 0 ? (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredNotifications.map(notification => (
                <div 
                  key={notification.id}
                  ref={el => swipeRefs.current[notification.id] = el}
                  className="relative overflow-hidden"
                  style={{ transform: 'translateX(0)', transition: 'transform 0.3s ease-out' }}
                  onTouchStart={(e) => handleTouchStart(e, notification.id)}
                  onTouchMove={(e) => handleTouchMove(e, notification.id)} 
                  onTouchEnd={(e) => handleTouchEnd(e, notification.id)}
                >
                  {/* Swipe actions (iOS style) */}
                  <div className="absolute right-0 top-0 bottom-0 flex h-full">
                    <div 
                      className="swipe-read-action w-20 bg-blue-500 flex items-center justify-center text-white opacity-0 transition-opacity"
                      onClick={() => markAsRead(notification.id)}
                    >
                      <Check className="h-5 w-5" />
                    </div>
                    <div 
                      className="swipe-delete-action w-20 bg-red-500 flex items-center justify-center text-white opacity-0 transition-opacity"
                      onClick={() => deleteNotification(notification.id)}
                    >
                      <Trash2 className="h-5 w-5" />
                    </div>
                  </div>
                  
                  {/* Notification content */}
                  <div 
                    className={`p-4 bg-white dark:bg-gray-800 ${
                      !notification.read ? 'border-l-4 border-blue-500 dark:border-blue-400' : ''
                    }`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex items-start">
                      <div className="flex-shrink-0 mr-3 pt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <h3 className={`text-sm ${
                            !notification.read ? 'font-medium' : 'font-normal'
                          } ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                            style={{ fontFamily: "-apple-system, 'SF Pro Text', system-ui, sans-serif" }}>
                            {notification.title}
                          </h3>
                          <div className="ml-2 flex-shrink-0">
                            <p className="text-xs text-gray-500">{notification.timestamp}</p>
                          </div>
                        </div>
                        <p className="text-sm mt-1 text-gray-600 dark:text-gray-300">
                          {notification.message}
                        </p>
                        {notification.category && (
                          <div className="mt-2">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                              {notification.category}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="ml-2 flex-shrink-0">
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-16 text-center">
              <Bell className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-base font-medium text-gray-900 dark:text-white">
                No notifications
              </h3>
              <p className="mt-2 text-sm text-gray-500 max-w-sm mx-auto">
                {searchQuery || activeFilter 
                  ? 'Try changing your search or filter criteria' 
                  : 'You\'re all caught up!'}
              </p>
            </div>
          )}
        </div>
        
        {/* iOS-specific helper text */}
        {filteredNotifications.length > 0 && (
          <p className="text-xs text-center text-gray-500 italic mt-2 pb-2">
            Swipe left on a notification for actions
          </p>
        )}
      </div>
      
      {/* CSS for iOS styling */}
      <style jsx>{`
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        
        /* iPad multi-tasking responsive styles */
        .ipad-slide-over-mode {
          max-width: 100%;
        }
        
        .ipad-split-view-mode {
          max-width: 100%;
        }
        
        .ipad-full-screen-mode {
          max-width: 768px;
          margin: 0 auto;
        }
      `}</style>
    </>
  ) : (
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
