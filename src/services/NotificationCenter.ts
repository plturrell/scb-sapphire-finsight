/**
 * NotificationCenter for the Tariff Alert Scanner
 * Handles various notification channels and preferences
 */
export class NotificationCenter {
  static preferences = {
    browserNotifications: true,
    emailNotifications: true,
    slackNotifications: false,
    notificationThreshold: 'medium' // 'low', 'medium', 'high', 'critical'
  };
  
  static priorityLevels: Record<string, number> = {
    critical: 4,
    high: 3,
    medium: 2,
    low: 1,
    informational: 0
  };
  
  /**
   * Show a notification across configured channels
   */
  static async showNotification(notification: {
    id?: string;
    title: string;
    body: string;
    priority: string;
    data?: any;
    onClick?: () => void;
  }) {
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
    
    // Show browser notification if enabled
    if (this.preferences.browserNotifications) {
      this.showBrowserNotification(notificationObj);
    }
    
    // Send email if enabled
    if (this.preferences.emailNotifications && 
        this.priorityLevels[notification.priority] >= this.priorityLevels.medium) {
      await this.sendEmailNotification(notificationObj);
    }
    
    // Send to Slack if enabled
    if (this.preferences.slackNotifications && 
        this.priorityLevels[notification.priority] >= this.priorityLevels.high) {
      await this.sendSlackNotification(notificationObj);
    }
    
    // Store notification in history
    this.storeNotification(notificationObj);
    
    // Dispatch event for dashboard updates
    this.dispatchNotificationEvent(notificationObj);
    
    return true;
  }
  
  /**
   * Check if notification meets priority threshold
   */
  static meetsPriorityThreshold(priority: string) {
    const thresholdLevel = this.priorityLevels[this.preferences.notificationThreshold];
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
   * Store notification in local storage
   */
  static storeNotification(notification: any) {
    if (typeof window === 'undefined') return;
    
    // Store in local history
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
  
  /**
   * Get stored notifications from local storage
   */
  static getStoredNotifications() {
    if (typeof window === 'undefined') return [];
    
    const stored = localStorage.getItem('tariffAlertNotifications');
    return stored ? JSON.parse(stored) : [];
  }
  
  /**
   * Mark notification as read
   */
  static markAsRead(notificationId: string) {
    if (typeof window === 'undefined') return;
    
    const notifications = this.getStoredNotifications();
    const notification = notifications.find(n => n.id === notificationId);
    
    if (notification) {
      notification.read = true;
      localStorage.setItem('tariffAlertNotifications', JSON.stringify(notifications));
      this.dispatchNotificationEvent({ type: 'notification_read', id: notificationId });
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
