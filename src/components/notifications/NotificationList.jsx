import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useNotifications } from '../../contexts/NotificationContext';
import api from '../../utils/api';
import { formatDistanceToNow } from 'date-fns';

const NotificationList = () => {
  const { notifications, markAsRead, clearAll } = useNotifications();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Mark notification as read and navigate
  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      await markAsRead(notification._id);
    }
  };
  
  // Mark all notifications as read
  const handleMarkAllAsRead = async () => {
    try {
      setLoading(true);
      // Use the context's function to mark all as read
      await clearAll();
      setLoading(false);
    } catch (error) {
      console.error('Error marking all as read:', error);
      setError('Failed to mark notifications as read');
      setLoading(false);
    }
  };
  
  // Get notification link based on type
  const getNotificationLink = (notification) => {
    switch (notification.type) {
      case 'message':
        return notification.senderId ? `/app/messages/${notification.senderId}` : '/app/messages';
      case 'reaction':
        return notification.relatedId ? `/app/messages/${notification.relatedId}` : '/app/messages';
      case 'project':
        return notification.relatedId ? `/app/projects/${notification.relatedId}` : '/app/projects';
      case 'payment':
        return notification.relatedId ? `/app/projects/${notification.relatedId}` : '/app/projects';
      case 'review':
        return notification.relatedId ? `/app/designers/${notification.relatedId}` : '/app/designers';
      default:
        return '/app';
    }
  };
  
  // Get notification icon based on type
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'message':
        return (
          <div className="flex-shrink-0 rounded-full p-2 bg-blue-100 text-blue-600">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
        );
      case 'reaction':
        return (
          <div className="flex-shrink-0 rounded-full p-2 bg-amber-100 text-amber-600">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M7 16a7 7 0 1114 0 7 7 0 01-14 0z" />
            </svg>
          </div>
        );
      case 'project':
        return (
          <div className="flex-shrink-0 rounded-full p-2 bg-green-100 text-green-600">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
        );
      case 'payment':
        return (
          <div className="flex-shrink-0 rounded-full p-2 bg-indigo-100 text-indigo-600">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case 'review':
        return (
          <div className="flex-shrink-0 rounded-full p-2 bg-yellow-100 text-yellow-600">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1.002 1.002 0 00.951-.69l1.519-4.674z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="flex-shrink-0 rounded-full p-2 bg-gray-100 text-gray-600">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
        );
    }
  };
  
  return (
    <div className="flex flex-col h-full w-full bg-white">
      <div className="bg-primary-600 px-6 py-4 flex justify-between items-center sticky top-0 z-10">
        <h3 className="text-xl font-medium text-white">Notifications</h3>
        {notifications.length > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            disabled={loading}
            className="text-sm text-white hover:text-primary-100 transition-colors duration-200 px-3 py-1 rounded-md hover:bg-primary-700"
          >
            Mark all as read
          </button>
        )}
      </div>
      
      <div className="divide-y divide-gray-200 flex-1 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500 flex flex-col items-center justify-center h-full">
            <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <p className="text-lg">No notifications</p>
            <p className="text-sm text-gray-400 mt-1">You're all caught up!</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <Link
              key={notification._id}
              to={getNotificationLink(notification)}
              onClick={() => handleNotificationClick(notification)}
              className={`flex p-5 hover:bg-gray-50 transition-colors duration-200 ${
                !notification.isRead ? 'bg-blue-50' : ''
              }`}
            >
              {getNotificationIcon(notification.type)}
              <div className="ml-4 flex-1">
                <p className={`text-sm font-medium ${!notification.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                  {notification.title}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {notification.content}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                </p>
              </div>
              {!notification.isRead && (
                <div className="ml-2 flex-shrink-0">
                  <span className="inline-block h-2 w-2 rounded-full bg-primary-500"></span>
                </div>
              )}
            </Link>
          ))
        )}
      </div>
      
      {error && (
        <div className="p-4 bg-red-50 border-t border-red-200">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
    </div>
  );
};

export default NotificationList;
