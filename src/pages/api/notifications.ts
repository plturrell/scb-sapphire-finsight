import { NextApiRequest, NextApiResponse } from 'next';
import { RedisDataStore } from '../../services/RedisDataStore';
import { NotificationCenter, NotificationCategory, PriorityLevel, ModuleType } from '../../services/NotificationCenter';

// Initialize the Redis data store
const redisDataStore = RedisDataStore.getInstance();

// Extended notification interface that combines RedisDataStore.Notification and NotificationCenter properties
interface Notification {
  id: string;
  type: 'alert' | 'success' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  priority?: PriorityLevel;
  category?: NotificationCategory;
  module?: ModuleType;
  actionUrl?: string;
  data?: any;
  summary?: string;
  thumbnail?: string;
  groupId?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    switch (req.method) {
      case 'GET':
        return await handleGetNotifications(req, res);
      case 'POST':
        return await handleCreateNotification(req, res);
      case 'PUT':
        return await handleUpdateNotification(req, res);
      case 'DELETE':
        return await handleDeleteNotification(req, res);
      default:
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Notification API error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error', 
      error: (error as Error).message 
    });
  }
}

/**
 * Get notifications with filtering and pagination
 */
async function handleGetNotifications(req: NextApiRequest, res: NextApiResponse) {
  const { 
    page = '1',
    limit = '20',
    userId,
    priority,
    module,
    category,
    read,
    search,
    unreadOnly = 'false',
  } = req.query;
  
  // Parse pagination parameters
  const pageNumber = parseInt(page as string, 10);
  const limitNumber = parseInt(limit as string, 10);
  
  // Prepare filters
  const filters: any = {};
  
  if (userId) {
    filters.userId = userId as string;
  }
  
  if (priority) {
    filters.priority = (priority as string).split(',');
  }
  
  if (module) {
    filters.module = (module as string).split(',');
  }
  
  if (category) {
    filters.category = (category as string).split(',');
  }
  
  if (read) {
    filters.read = read === 'true';
  }
  
  if (unreadOnly === 'true') {
    filters.read = false;
  }
  
  if (search) {
    filters.search = search as string;
  }
  
  // Get notifications from Redis
  const result = await redisDataStore.getNotifications(pageNumber, limitNumber, filters);
  
  return res.status(200).json({
    success: true,
    ...result
  });
}

/**
 * Create a new notification
 */
async function handleCreateNotification(req: NextApiRequest, res: NextApiResponse) {
  const notification = req.body as Notification;
  
  if (!notification) {
    return res.status(400).json({ success: false, message: 'Notification data is required' });
  }
  
  if (!notification.title) {
    return res.status(400).json({ success: false, message: 'Notification title is required' });
  }
  
  if (!notification.message) {
    return res.status(400).json({ success: false, message: 'Notification message is required' });
  }
  
  // Set defaults for required fields
  const notificationWithDefaults = {
    ...notification,
    id: notification.id || `notification-${Date.now()}`,
    timestamp: notification.timestamp || new Date().toISOString(),
    read: notification.read !== undefined ? notification.read : false,
    type: notification.type || 'info'
  };
  
  // Store notification in Redis
  const id = await redisDataStore.storeNotification(notificationWithDefaults);
  
  // If NotificationCenter is being used in browser context, dispatch notification
  // This happens on the client-side, not here in the API
  
  return res.status(201).json({
    success: true,
    id,
    message: 'Notification created successfully'
  });
}

/**
 * Update an existing notification
 */
async function handleUpdateNotification(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const updates = req.body;
  
  if (!id) {
    return res.status(400).json({ success: false, message: 'Notification ID is required' });
  }
  
  if (!updates) {
    return res.status(400).json({ success: false, message: 'Update data is required' });
  }
  
  // Mark as read is a common operation
  if (updates.read === true) {
    const success = await redisDataStore.markNotificationAsRead(id as string);
    
    if (!success) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Notification marked as read'
    });
  }
  
  // Handle other updates - need to add updateNotification method to RedisDataStore
  try {
    // Get the existing notification
    const existingNotifications = await redisDataStore.getNotifications(1, 1, { id: id as string });
    
    if (!existingNotifications.notifications.length) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    
    const existingNotification = existingNotifications.notifications[0];
    
    // Create updated notification
    const updatedNotification = {
      ...existingNotification,
      ...updates,
      id: id as string // Ensure ID doesn't change
    };
    
    // Delete old notification and create new one with same ID
    await redisDataStore.deleteNotification(id as string);
    await redisDataStore.storeNotification(updatedNotification);
    
    return res.status(200).json({
      success: true,
      message: 'Notification updated successfully'
    });
  } catch (error) {
    console.error('Error updating notification:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to update notification', 
      error: (error as Error).message 
    });
  }
}

/**
 * Delete a notification
 */
async function handleDeleteNotification(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  
  if (!id) {
    return res.status(400).json({ success: false, message: 'Notification ID is required' });
  }
  
  // Delete notification from Redis
  const success = await redisDataStore.deleteNotification(id as string);
  
  if (!success) {
    return res.status(404).json({ success: false, message: 'Notification not found' });
  }
  
  return res.status(200).json({
    success: true,
    message: 'Notification deleted successfully'
  });
}