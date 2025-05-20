/**
 * Enterprise-Grade NotificationCenter for SCB Sapphire Platform
 * Implements Apple-quality notification system across all modules
 * Supports: Supply Chain, Tariff Analysis, Market Intelligence, News, Compliance, and more
 */

import { OntologyManager } from './OntologyManager';
import perplexityApiClient from './PerplexityApiClient';

// Module types supported by the notification system
export type ModuleType = 
  | 'supply-chain'
  | 'tariff-analysis'
  | 'market-intelligence'
  | 'compliance'
  | 'news'
  | 'forecasting'
  | 'competitor-analysis'
  | 'regulatory-updates'
  | 'system';

// Notification category for Apple-like organization
export type NotificationCategory = 
  | 'alert' // Requires immediate attention
  | 'warning' // Important but not critical
  | 'insight' // New intelligence or data analysis
  | 'update' // System or data updates
  | 'forecast' // Predictive notifications
  | 'news' // Market or industry news
  | 'action-required' // User needs to take action
  | 'recommendation'; // System recommendations

// Notification priority levels
export type PriorityLevel = 'critical' | 'high' | 'medium' | 'low' | 'informational';

// Rich notification with interactive elements
export interface NotificationAction {
  id: string;
  title: string;
  icon?: string;
  primary?: boolean;
  destructive?: boolean;
  handler: () => void;
}

// Rich notification content support
export interface NotificationContent {
  title: string;
  body: string;
  summary?: string;
  richText?: string;
  thumbnail?: string;
  image?: string;
  chart?: any;
  dataPoints?: Record<string, number | string>;
  timestamp: Date;
}

// Context for intelligent notification delivery
export interface NotificationContext {
  userRole?: string;
  location?: string;
  deviceType?: string;
  appState?: 'active' | 'background' | 'not-running';
  previousInteractions?: Array<{notification: string, action: string, timestamp: Date}>;
  timeSensitivity?: 'immediate' | 'today' | 'this-week' | 'informational';
}

export class NotificationCenter {
  // User notification preferences with granular controls
  static preferences = {
    // Channels
    channels: {
      push: true,
      inApp: true,
      email: true,
      slack: false,
      sms: false,
      teams: false
    },
    
    // Module-specific settings
    moduleSettings: {
      'supply-chain': { enabled: true, threshold: 'low', digestFrequency: 'realtime' },
      'tariff-analysis': { enabled: true, threshold: 'medium', digestFrequency: 'daily' },
      'market-intelligence': { enabled: true, threshold: 'medium', digestFrequency: 'daily' },
      'compliance': { enabled: true, threshold: 'high', digestFrequency: 'realtime' },
      'news': { enabled: true, threshold: 'medium', digestFrequency: 'daily' },
      'forecasting': { enabled: true, threshold: 'medium', digestFrequency: 'weekly' },
      'competitor-analysis': { enabled: true, threshold: 'medium', digestFrequency: 'daily' },
      'regulatory-updates': { enabled: true, threshold: 'high', digestFrequency: 'realtime' },
      'system': { enabled: true, threshold: 'high', digestFrequency: 'realtime' }
    },
    
    // Category settings
    categorySettings: {
      'alert': { enabled: true, sound: true, criticalOverride: true },
      'warning': { enabled: true, sound: true, criticalOverride: false },
      'insight': { enabled: true, sound: false, criticalOverride: false },
      'update': { enabled: true, sound: false, criticalOverride: false },
      'forecast': { enabled: true, sound: false, criticalOverride: false },
      'news': { enabled: true, sound: false, criticalOverride: false },
      'action-required': { enabled: true, sound: true, criticalOverride: true },
      'recommendation': { enabled: true, sound: false, criticalOverride: false }
    },
    
    // Delivery preferences
    deliveryPreferences: {
      quietHours: { enabled: true, start: '22:00', end: '07:00' },
      summaryFrequency: 'twice-daily', // 'hourly', 'twice-daily', 'daily', 'never'
      batchSimilarNotifications: true,
      intelligentDelivery: true, // Use ML to determine best delivery time
      maxNotificationsPerHour: 10
    },
    
    // Global settings
    globalThreshold: 'medium', // 'low', 'medium', 'high', 'critical'
    notificationHistory: { keepDays: 30, maxCount: 1000 }
  };
  
  static priorityLevels: Record<string, number> = {
    critical: 4,
    high: 3,
    medium: 2,
    low: 1,
    informational: 0
  };
  
  /**
   * Show a rich notification across all configured channels with intelligent delivery
   * Implements Apple-quality notification system with context awareness
   * @param notification The notification object with rich content and actions
   * @param module The module generating the notification
   * @param category The notification category
   * @param context Optional delivery context for intelligent notification
   */
  static async showNotification(notification: {
    id?: string;
    title: string;
    body: string;
    priority: PriorityLevel;
    category?: NotificationCategory;
    module?: ModuleType;
    summary?: string;
    thumbnail?: string;
    image?: string;
    chart?: any;
    dataPoints?: Record<string, number | string>;
    actions?: NotificationAction[];
    data?: any;
    onClick?: () => void;
    timeSensitive?: boolean;
    groupId?: string;
    expiresAt?: Date;
  }, module: ModuleType = 'system', category: NotificationCategory = 'update', context?: NotificationContext) {
    // Check if meets threshold
    if (!this.meetsPriorityThreshold(notification.priority)) {
      console.log(`Notification "${notification.title}" below threshold, not showing`);
      return false;
    }
    
    // Create notification object
    const notificationObj = {
      id: notification.id || `notification-${Date.now()}`,
      title: notification.title,
      body: notification.body,
      priority: notification.priority,
      timestamp: new Date(),
      read: false,
      data: notification.data || {},
      onClick: notification.onClick
    };
    
    // Show push notification if enabled
    if (this.preferences.channels.push) {
      this.showBrowserNotification(notificationObj);
    }
    
    // Send email if enabled
    if (this.preferences.channels.email && 
        this.priorityLevels[notification.priority] >= this.priorityLevels.medium) {
      await this.sendEmailNotification(notificationObj);
    }
    
    // Send to Slack if enabled
    if (this.preferences.channels.slack && 
        this.priorityLevels[notification.priority] >= this.priorityLevels.high) {
      await this.sendSlackNotification(notificationObj);
    }
    
    // Send via SMS for critical notifications if enabled
    if (this.preferences.channels.sms && 
        this.priorityLevels[notification.priority] >= this.priorityLevels.critical) {
      await this.sendSmsNotification(notificationObj);
    }
    
    // Send via Microsoft Teams if enabled
    if (this.preferences.channels.teams && 
        this.priorityLevels[notification.priority] >= this.priorityLevels.high) {
      await this.sendTeamsNotification(notificationObj);
    }
    
    // Store notification in history
    this.storeNotification(notificationObj);
    
    // Dispatch event for dashboard updates
    this.dispatchNotificationEvent(notificationObj);
    
    return true;
  }
  
  /**
   * Check if notification meets priority threshold based on module and global settings
   * @param priority The notification priority level
   * @param module The module generating the notification
   */
  static meetsPriorityThreshold(priority: string, module: ModuleType = 'system') {
    // Get module-specific threshold if available, otherwise use global threshold
    const moduleThreshold = this.preferences.moduleSettings[module]?.threshold || this.preferences.globalThreshold;
    const thresholdLevel = this.priorityLevels[moduleThreshold];
    const notificationLevel = this.priorityLevels[priority.toLowerCase()];
    
    return notificationLevel >= thresholdLevel;
  }
  
  /**
   * Show a browser notification
   */
  static showBrowserNotification(notification: any) {
    // Check if browser notifications are supported and permitted
    if (typeof window === 'undefined' || !('Notification' in window)) {
      console.log('Browser does not support notifications');
      return;
    }
    
    if (Notification.permission === 'granted') {
      // Create and show notification
      const browserNotification = new Notification(notification.title, {
        body: notification.body,
        icon: this.getIconForPriority(notification.priority),
        tag: notification.id
      });
      
      // Add click handler
      browserNotification.onclick = () => {
        window.focus();
        this.markAsRead(notification.id);
        if (typeof notification.onClick === 'function') {
          notification.onClick();
        }
      };
    } else if (Notification.permission !== 'denied') {
      // Request permission
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          this.showBrowserNotification(notification);
        }
      });
    }
  }
  
  /**
   * Send email notification
   */
  static async sendEmailNotification(notification: any) {
    try {
      // This would connect to your email service API
      const response = await fetch('/api/notifications/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          subject: `[${notification.priority.toUpperCase()}] ${notification.title}`,
          body: notification.body,
          priority: notification.priority,
          notificationId: notification.id
        })
      });
      
      if (!response.ok) {
        throw new Error(`Email notification failed: ${response.status}`);
      }
      
      console.log('Email notification sent successfully');
      return true;
    } catch (error) {
      console.error('Failed to send email notification:', error);
      return false;
    }
  }
  
  /**
   * Send Slack notification
   */
  static async sendSlackNotification(notification: any) {
    try {
      // This would connect to Slack API
      const response = await fetch('/api/notifications/slack', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: `*[${notification.priority.toUpperCase()}]* ${notification.title}`,
          blocks: [
            {
              type: 'header',
              text: {
                type: 'plain_text',
                text: notification.title
              }
            },
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: notification.body
              }
            },
            {
              type: 'context',
              elements: [
                {
                  type: 'mrkdwn',
                  text: `*Priority:* ${notification.priority}`
                }
              ]
            }
          ]
        })
      });
      
      if (!response.ok) {
        throw new Error(`Slack notification failed: ${response.status}`);
      }
      
      console.log('Slack notification sent successfully');
      return true;
    } catch (error) {
      console.error('Failed to send Slack notification:', error);
      return false;
    }
  }
  
  /**
   * Send SMS notification for critical alerts
   */
  static async sendSmsNotification(notification: any) {
    try {
      // This would connect to SMS gateway API
      const response = await fetch('/api/notifications/sms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          // Create concise SMS-friendly version
          message: `${notification.title} - ${notification.body.substring(0, 140)}...`,
          priority: notification.priority,
          notificationId: notification.id,
          // Add shortened link to view details
          actionUrl: `https://sapphire.scb.com/alert/${notification.id}`
        })
      });
      
      if (!response.ok) {
        throw new Error(`SMS notification failed: ${response.status}`);
      }
      
      console.log('SMS notification sent successfully');
      return true;
    } catch (error) {
      console.error('Failed to send SMS notification:', error);
      return false;
    }
  }
  
  /**
   * Send Microsoft Teams notification with adaptive cards
   */
  static async sendTeamsNotification(notification: any) {
    try {
      // This would connect to Teams webhook
      const response = await fetch('/api/notifications/teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'message',
          attachments: [
            {
              contentType: 'application/vnd.microsoft.card.adaptive',
              content: {
                $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
                type: 'AdaptiveCard',
                version: '1.2',
                body: [
                  { 
                    type: 'TextBlock', 
                    size: 'Medium', 
                    weight: 'Bolder', 
                    text: notification.title,
                    color: notification.priority === 'critical' ? 'attention' : 
                            notification.priority === 'high' ? 'warning' : 'default'
                  },
                  { 
                    type: 'TextBlock', 
                    text: notification.body, 
                    wrap: true 
                  },
                  // Add data points if available
                  ...(notification.dataPoints ? [
                    {
                      type: 'FactSet',
                      facts: Object.entries(notification.dataPoints).map(([key, value]) => ({
                        title: key,
                        value: String(value)
                      }))
                    }
                  ] : [])
                ],
                actions: [
                  {
                    type: 'Action.OpenUrl',
                    title: 'View Details',
                    url: `https://sapphire.scb.com/alert/${notification.id}`
                  },
                  {
                    type: 'Action.Submit',
                    title: 'Acknowledge',
                    data: {
                      actionType: 'acknowledge',
                      notificationId: notification.id
                    }
                  }
                ]
              }
            }
          ]
        })
      });
      
      if (!response.ok) {
        throw new Error(`Teams notification failed: ${response.status}`);
      }
      
      console.log('Teams notification sent successfully');
      return true;
    } catch (error) {
      console.error('Failed to send Teams notification:', error);
      return false;
    }
  }
  
  /**
   * Store notification in local storage and send to server API
   */
  static async storeNotification(notification: any) {
    // Store in local history for client-side usage
    if (typeof window !== 'undefined') {
      // Get existing local notifications
      const notifications = this.getStoredNotifications();
      
      // Remove onClick function before storing
      const storableNotification = { ...notification };
      delete storableNotification.onClick;
      
      notifications.unshift(storableNotification);
      
      // Keep only last 100 notifications
      if (notifications.length > 100) {
        notifications.length = 100;
      }
      
      localStorage.setItem('tariffAlertNotifications', JSON.stringify(notifications));
    }
    
    // Store on server via API for persistence and cross-client access
    try {
      // Prepare notification for API (remove client-side functions)
      const apiNotification = { ...notification };
      delete apiNotification.onClick;
      
      // Convert timestamp to ISO string if it's a Date object
      if (apiNotification.timestamp instanceof Date) {
        apiNotification.timestamp = apiNotification.timestamp.toISOString();
      }
      
      // Map fields to match API expectations
      const serverNotification = {
        ...apiNotification,
        message: apiNotification.body, // API uses message instead of body
        type: this.mapPriorityToType(apiNotification.priority)
      };
      
      // Send to server API
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(serverNotification)
      });
      
      if (!response.ok) {
        console.error('Failed to store notification on server:', await response.text());
      }
    } catch (error) {
      console.error('Error storing notification on server:', error);
    }
  }
  
  /**
   * Map priority level to notification type
   */
  static mapPriorityToType(priority: string): 'alert' | 'warning' | 'info' | 'success' {
    switch (priority.toLowerCase()) {
      case 'critical':
        return 'alert';
      case 'high':
        return 'warning';
      case 'medium':
        return 'info';
      case 'low':
      case 'informational':
      default:
        return 'info';
    }
  }
  
  /**
   * Get stored notifications from local storage
   */
  static getStoredNotifications() {
    if (typeof window === 'undefined') return [];
    
    const stored = localStorage.getItem('tariffAlertNotifications');
    return stored ? JSON.parse(stored) : [];
  }
  
  /**
   * Mark notification as read both locally and on server
   */
  static async markAsRead(notificationId: string) {
    // Update local storage if in browser
    if (typeof window !== 'undefined') {
      const notifications = this.getStoredNotifications();
      const notification = notifications.find(n => n.id === notificationId);
      
      if (notification) {
        notification.read = true;
        localStorage.setItem('tariffAlertNotifications', JSON.stringify(notifications));
        this.dispatchNotificationEvent({ type: 'notification_read', id: notificationId });
      }
    }
    
    // Also update on server for persistence
    try {
      const response = await fetch(`/api/notifications?id=${notificationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          read: true
        })
      });
      
      if (!response.ok) {
        console.error('Failed to mark notification as read on server:', await response.text());
      }
    } catch (error) {
      console.error('Error marking notification as read on server:', error);
    }
  }
  
  /**
   * Get notifications from server API with filtering
   */
  static async getNotificationsFromServer(options: {
    page?: number;
    limit?: number;
    unreadOnly?: boolean;
    priority?: PriorityLevel | PriorityLevel[];
    module?: ModuleType | ModuleType[];
    category?: NotificationCategory | NotificationCategory[];
    search?: string;
  } = {}) {
    try {
      // Build query string from options
      const queryParams = new URLSearchParams();
      
      if (options.page) queryParams.append('page', options.page.toString());
      if (options.limit) queryParams.append('limit', options.limit.toString());
      if (options.unreadOnly) queryParams.append('unreadOnly', 'true');
      
      if (options.priority) {
        const priorities = Array.isArray(options.priority) ? options.priority : [options.priority];
        queryParams.append('priority', priorities.join(','));
      }
      
      if (options.module) {
        const modules = Array.isArray(options.module) ? options.module : [options.module];
        queryParams.append('module', modules.join(','));
      }
      
      if (options.category) {
        const categories = Array.isArray(options.category) ? options.category : [options.category];
        queryParams.append('category', categories.join(','));
      }
      
      if (options.search) queryParams.append('search', options.search);
      
      // Fetch notifications from API
      const response = await fetch(`/api/notifications?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch notifications: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching notifications from server:', error);
      return { 
        notifications: [], 
        total: 0, 
        page: 1, 
        pages: 0 
      };
    }
  }
  
  /**
   * Dispatch custom event for notification
   */
  static dispatchNotificationEvent(notification: any) {
    if (typeof window === 'undefined') return;
    
    // Dispatch event for components to listen to
    const event = new CustomEvent('tariffNotification', { detail: notification });
    window.dispatchEvent(event);
  }
  
  /**
   * Get icon for notification based on priority
   */
  static getIconForPriority(priority: string) {
    const iconMap: Record<string, string> = {
      critical: '/icons/notification-critical.png',
      high: '/icons/notification-high.png',
      medium: '/icons/notification-medium.png',
      low: '/icons/notification-low.png',
      informational: '/icons/notification-info.png'
    };
    
    return iconMap[priority.toLowerCase()] || iconMap.informational;
  }
}
