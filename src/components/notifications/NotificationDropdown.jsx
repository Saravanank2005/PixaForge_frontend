import React, { Fragment, useState, useEffect } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { BellIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import { useNotifications } from '../../contexts/NotificationContext';
import { formatDistanceToNow } from 'date-fns';

export default function NotificationDropdown() {
  const { notifications: contextNotifications, markAllAsRead, markAsRead } = useNotifications();
  const [notifications, setNotifications] = useState(contextNotifications);
  const unreadCount = notifications.filter(n => !n.isRead).length;
  
  // Update local state when context notifications change
  useEffect(() => {
    setNotifications(contextNotifications);
  }, [contextNotifications]);
  
  // Handle marking all notifications as read
  const handleMarkAllAsRead = async () => {
    try {
      // Close the dropdown after marking all as read
      const result = await markAllAsRead();
      if (result) {
        // Force UI update by setting a state
        setNotifications(prev => prev.map(notification => ({
          ...notification,
          isRead: true
        })));
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
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
          <div className="flex-shrink-0 rounded-full p-1.5 bg-blue-100 text-blue-600">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
        );
      case 'reaction':
        return (
          <div className="flex-shrink-0 rounded-full p-1.5 bg-amber-100 text-amber-600">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M7 16a7 7 0 1114 0 7 7 0 01-14 0z" />
            </svg>
          </div>
        );
      case 'project':
        return (
          <div className="flex-shrink-0 rounded-full p-1.5 bg-green-100 text-green-600">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="flex-shrink-0 rounded-full p-1.5 bg-gray-100 text-gray-600">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
        );
    }
  };

  return (
    <Menu as="div" className="relative inline-block text-left">
      <div>
        <Menu.Button className="nav-link relative">
          <BellIcon className="h-5 w-5" aria-hidden="true" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 text-xs flex items-center justify-center bg-red-500 text-white rounded-full">
              {unreadCount}
            </span>
          )}
        </Menu.Button>
      </div>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 mt-2 w-96 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-sm text-blue-600 hover:text-blue-800 px-3 py-1 rounded hover:bg-blue-50 transition-colors"
                >
                  Mark all as read
                </button>
              )}
            </div>

            <div className="space-y-4 max-h-96 overflow-auto">
              {notifications.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  No notifications yet
                </p>
              ) : (
                notifications.map((notification) => (
                  <Menu.Item key={notification._id}>
                    {({ active }) => (
                      <Link
                        to={getNotificationLink(notification)}
                        onClick={() => markAsRead(notification._id)}
                        className={`w-full text-left p-3 rounded-lg transition-colors block ${
                          active ? 'bg-gray-50' : ''
                        } ${!notification.isRead ? 'bg-blue-50' : ''}`}
                      >
                        <div className="flex items-start gap-3">
                          {getNotificationIcon(notification.type)}
                          <div className="flex-1">
                            <p className={`text-sm font-medium ${!notification.isRead ? 'font-semibold' : ''}`}>
                              {notification.title}
                            </p>
                            <p className={`text-sm ${!notification.isRead ? 'font-medium' : ''}`}>
                              {notification.content}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                            </p>
                          </div>
                          {!notification.isRead && (
                            <span className="h-2 w-2 rounded-full bg-blue-600 flex-shrink-0" />
                          )}
                        </div>
                      </Link>
                    )}
                  </Menu.Item>
                ))
              )}
            </div>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}
