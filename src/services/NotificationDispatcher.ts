/**
 * NotificationDispatcher for the Tariff Alert Scanner system
 * Implements notification capabilities across multiple channels
 */
export class NotificationDispatcher {
  
  /**
   * Send alerts across all configured channels
   */
  static async sendAlerts(alerts: any[]) {
    if (!alerts || alerts.length === 0) return;
    
    // Filter for high priority alerts
    const highPriorityAlerts = alerts.filter(alert => 
      alert.priority === 'high' || alert.priority === 'Critical'
    );
    
    // Send browser notifications for high priority alerts
    this.sendBrowserNotifications(highPriorityAlerts);
    
    // Send to notification services (Slack, email, etc.)
    await this.sendToNotificationServices(alerts);
    
    // Push to real-time dashboard
    this.updateDashboard(alerts);
    
    console.log(`Dispatched ${alerts.length} alerts (${highPriorityAlerts.length} high priority)`);
  }
  
  /**
   * Send browser notifications
   */
  static sendBrowserNotifications(alerts: any[]) {
    if (typeof window === 'undefined' || !alerts.length) return;
    
    // Request permission if needed
    if (Notification && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
    
    if (Notification && Notification.permission === 'granted') {
      alerts.forEach(alert => {
        try {
          new Notification(`${alert.priority || 'Info'} Tariff Alert: ${alert.country || 'Global'}`, {
            body: alert.title || 'New tariff alert detected',
            icon: '/icons/tariff-alert.png',
            tag: `tariff-alert-${Date.now()}`,
            vibrate: [200, 100, 200]
          });
        } catch (e) {
          console.error('Error showing notification:', e);
        }
      });
    }
  }
  
  /**
   * Send to configured notification services
   */
  static async sendToNotificationServices(alerts: any[]) {
    if (!alerts.length) return;
    
    // In a full implementation, we would support multiple services
    try {
      // Example: Send to API endpoint for further distribution
      const response = await fetch('/api/notifications/dispatch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ alerts })
      });
      
      if (response.ok) {
        console.log(`Sent ${alerts.length} alerts to notification services`);
      } else {
        console.error(`Failed to send notifications: ${response.status}`);
      }
    } catch (error) {
      console.error('Error sending to notification services:', error);
    }
  }
  
  /**
   * Update connected dashboards via WebSockets
   */
  static updateDashboard(alerts: any[]) {
    // In a full implementation, this would use a WebSocket connection
    if (typeof window !== 'undefined') {
      // If window.dashboardSocket exists, use it
      const wsClient = (window as any).dashboardSocket;
      
      if (wsClient && wsClient.readyState === WebSocket.OPEN) {
        wsClient.send(JSON.stringify({
          type: 'NEW_ALERTS',
          alerts
        }));
        
        console.log('Sent alerts to dashboard via WebSocket');
      } else {
        // Fallback to custom event for in-app notifications
        const event = new CustomEvent('tariff-alerts', { detail: alerts });
        window.dispatchEvent(event);
        
        console.log('Dispatched tariff-alerts event');
      }
    }
  }
  
  /**
   * Initialize WebSocket connection
   */
  static initializeWebSocket(url: string = '/api/ws/tariff-alerts') {
    if (typeof window === 'undefined') return null;
    
    try {
      const socket = new WebSocket(url);
      
      socket.onopen = () => {
        console.log('Tariff alert WebSocket connection established');
        (window as any).dashboardSocket = socket;
      };
      
      socket.onclose = () => {
        console.log('Tariff alert WebSocket connection closed');
        (window as any).dashboardSocket = null;
        
        // Attempt to reconnect after delay
        setTimeout(() => this.initializeWebSocket(url), 5000);
      };
      
      socket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
      
      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'ALERTS_UPDATE') {
            // Dispatch custom event for components to listen for
            const customEvent = new CustomEvent('tariff-alerts-update', { detail: data });
            window.dispatchEvent(customEvent);
          }
        } catch (e) {
          console.error('Error processing WebSocket message:', e);
        }
      };
      
      return socket;
    } catch (error) {
      console.error('Failed to initialize WebSocket:', error);
      return null;
    }
  }
}

// Export the class
export default NotificationDispatcher;
