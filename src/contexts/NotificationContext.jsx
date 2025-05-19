import { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated, user } = useAuth();
  const { socket, connected } = useSocket();
  
  // Function to create a notification (used for testing if needed)
  const createNotification = async (notificationData) => {
    try {
      const response = await api.post('/api/notifications', notificationData);
      return response.data;
    } catch (error) {
      console.error('Error creating notification:', error);
      return null;
    }
  };
  
  // Fetch notifications when authenticated
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!isAuthenticated) {
        setNotifications([]);
        setUnreadCount(0);
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        
        // Fetch real notifications from the API
        const res = await api.get('/api/notifications');
        setNotifications(res.data);
        
        // Count unread notifications
        const unread = res.data.filter(notification => !notification.read).length;
        setUnreadCount(unread);
      } catch (error) {
        console.error('Error fetching notifications:', error);
        // If API fails, set empty notifications
        setNotifications([]);
        setUnreadCount(0);
      } finally {
        setLoading(false);
      }
    };
    
    fetchNotifications();
    
    // Set up interval to refresh notifications every 2 minutes
    const intervalId = setInterval(fetchNotifications, 120000);
    
    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, [isAuthenticated]);
  
  // Listen for real-time notifications
  useEffect(() => {
    if (!socket || !connected) return;
    
    const handleNewNotification = (notification) => {
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
    };
    
    socket.on('notification', handleNewNotification);
    
    return () => {
      socket.off('notification', handleNewNotification);
    };
  }, [socket, connected]);
  
  // Mark a notification as read
  const markAsRead = async (notificationId) => {
    try {
      await api.put(`/api/notifications/${notificationId}/read`);
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification._id === notificationId 
            ? { ...notification, read: true } 
            : notification
        )
      );
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  };
  
  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      await api.put('/api/notifications/read-all');
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      );
      
      // Reset unread count
      setUnreadCount(0);
      
      return true;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return false;
    }
  };
  
  // Delete a notification
  const deleteNotification = async (notificationId) => {
    try {
      await api.delete(`/api/notifications/${notificationId}`);
      
      // Update local state
      const updatedNotifications = notifications.filter(
        notification => notification._id !== notificationId
      );
      setNotifications(updatedNotifications);
      
      // Update unread count if needed
      const deletedNotification = notifications.find(
        notification => notification._id === notificationId
      );
      
      if (deletedNotification && !deletedNotification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting notification:', error);
      return false;
    }
  };
  
  // Clear all notifications (mark all as read)
  const clearAll = async () => {
    try {
      await markAllAsRead();
      return true;
    } catch (error) {
      console.error('Error clearing notifications:', error);
      return false;
    }
  };
  
  const value = {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    createNotification
  };
  
  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
