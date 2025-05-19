import { NextApiRequest, NextApiResponse } from 'next';

interface Notification {
  id: string;
  type: 'alert' | 'success' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

// In a real app, these would come from a database
let notifications: Notification[] = [
  {
    id: '1',
    type: 'alert',
    title: 'Portfolio Alert',
    message: 'Your tech sector allocation is above threshold',
    timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    read: false,
    actionUrl: '/portfolio'
  },
  {
    id: '2',
    type: 'success',
    title: 'Report Generated',
    message: 'Q2 Financial Analysis is ready to view',
    timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    read: false,
    actionUrl: '/reports'
  },
  {
    id: '3',
    type: 'warning',
    title: 'Market Update',
    message: 'Market volatility has increased by 15%',
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    read: true
  },
  {
    id: '4',
    type: 'info',
    title: 'New Feature',
    message: 'Monte Carlo simulations now available',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    read: true,
    actionUrl: '/vietnam-monte-carlo-enhanced'
  },
  {
    id: '5',
    type: 'alert',
    title: 'Tariff Alert',
    message: 'New tariff changes detected for Vietnam imports',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    read: false,
    actionUrl: '/tariff-alerts'
  },
  {
    id: '6',
    type: 'success',
    title: 'Data Sync Complete',
    message: 'All company data synchronized with S&P Capital IQ',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    read: false
  }
];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  switch (req.method) {
    case 'GET':
      // Get all notifications
      res.status(200).json(notifications);
      break;
      
    case 'POST':
      // Create new notification
      const newNotification: Notification = {
        id: Date.now().toString(),
        ...req.body,
        timestamp: new Date().toISOString(),
        read: false
      };
      notifications.unshift(newNotification);
      res.status(201).json(newNotification);
      break;
      
    case 'PUT':
      // Update notification (mark as read, etc.)
      const { id } = req.query;
      const notificationIndex = notifications.findIndex(n => n.id === id);
      if (notificationIndex !== -1) {
        notifications[notificationIndex] = {
          ...notifications[notificationIndex],
          ...req.body
        };
        res.status(200).json(notifications[notificationIndex]);
      } else {
        res.status(404).json({ error: 'Notification not found' });
      }
      break;
      
    case 'DELETE':
      // Delete notification
      const deleteId = req.query.id as string;
      notifications = notifications.filter(n => n.id !== deleteId);
      res.status(204).end();
      break;
      
    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}