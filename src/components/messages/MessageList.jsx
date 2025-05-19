import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { motion, AnimatePresence } from 'framer-motion';
import React from 'react';

const MessageList = () => {
  const { currentUser } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setLoading(true);
        setRefreshing(true);
        const response = await api.get('/api/messages/conversations');

        // Ensure each conversation has a valid user ID
        const validConversations = response.data.filter((conv) => {
          const hasValidUserId = conv.userId || (conv.user && conv.user._id);
          if (!hasValidUserId) {
            console.error('Conversation missing user ID:', conv);
            return false;
          }
          return true;
        });

        setConversations(validConversations);
        setError(null);
      } catch (error) {
        console.error('Error fetching conversations:', error);
        if (error.message === 'Network Error') {
          setError('Network error. Please check your internet connection.');
        } else if (error.response && error.response.status === 401) {
          setError('Your session has expired. Please log in again.');
          // Redirect to login after a delay
          setTimeout(() => navigate('/login'), 3000);
        } else {
          setError('Failed to load conversations. Please try again.');
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    };

    fetchConversations();

    // Listen for new messages to update conversations
    if (socket) {
      socket.on('newMessage', (message) => {
        setConversations((prevConversations) => {
          // Check if conversation exists
          const conversationIndex = prevConversations.findIndex(
            (conv) => conv.userId === message.senderId || conv.userId === message.receiverId
          );

          if (conversationIndex >= 0) {
            // Update existing conversation
            const updatedConversations = [...prevConversations];
            updatedConversations[conversationIndex] = {
              ...updatedConversations[conversationIndex],
              lastMessage: message.content,
              lastMessageTime: message.createdAt,
              unreadCount:
                message.senderId !== currentUser._id
                  ? updatedConversations[conversationIndex].unreadCount + 1
                  : updatedConversations[conversationIndex].unreadCount,
            };
            return updatedConversations;
          } else if (message.senderId !== currentUser._id) {
            // Add new conversation if it's a message from someone else
            return [
              {
                userId: message.senderId,
                username: message.senderName || 'Unknown User',
                lastMessage: message.content,
                lastMessageTime: message.createdAt,
                unreadCount: 1,
              },
              ...prevConversations,
            ];
          }

          return prevConversations;
        });
      });
    }

    return () => {
      if (socket) {
        socket.off('newMessage');
      }
    };
  }, [socket, currentUser]);

  const formatTime = (timestamp) => {
    if (!timestamp) return '';

    const date = new Date(timestamp);
    const now = new Date();

    // If today, show time
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    // If this week, show day name
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    }

    // Format as DD.MM.YYYY
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  // Filter conversations based on search term - focus on user search
  const filteredConversations =
    searchTerm.trim() !== ''
      ? conversations.filter((conv) => {
          const username = conv.user?.username || conv.username || '';
          const userFullName = conv.user?.fullName || conv.fullName || '';

          return (
            username.toLowerCase().includes(searchTerm.toLowerCase()) ||
            userFullName.toLowerCase().includes(searchTerm.toLowerCase())
          );
        })
      : conversations;

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      const response = await api.get('/api/messages/conversations');

      // Ensure each conversation has a valid user ID
      const validConversations = response.data.filter((conv) => {
        const hasValidUserId = conv.userId || (conv.user && conv.user._id);
        if (!hasValidUserId) {
          console.error('Conversation missing user ID:', conv);
          return false;
        }
        return true;
      });

      setConversations(validConversations);
      setError(null);
    } catch (error) {
      console.error('Error refreshing conversations:', error);
      setError('Failed to refresh conversations. Please try again.');
    } finally {
      setRefreshing(false);
    }
  };

  if (loading && !refreshing) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 mb-4"></div>
          <p className="text-gray-600 animate-pulse">Loading conversations...</p>
        </div>
      </div>
    );
  }

  if (error && !refreshing) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6 text-center max-w-md mx-auto">
          <div className="text-red-500 rounded-full bg-red-100 w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Messages</h3>
          <p className="text-red-500 mb-6">{error}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={handleRefresh}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors shadow-sm"
            >
              Try Again
            </button>
            <button
              onClick={() => navigate('/app/dashboard')}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="container mx-auto px-4 py-8">
      {/* Header with search */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Messages</h1>
          <p className="text-gray-600">Communicate with designers and clients about your projects.</p>
        </div>

        <div className="flex items-center space-x-2">
          <div className="relative flex-grow max-w-xs">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                className="h-5 w-5 text-gray-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-500"
              >
                <svg
                  className="h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            )}
          </div>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            aria-label="Refresh messages"
          >
            <svg
              className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`}
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Error notification if there's an error but we're still showing content */}
      {error && refreshing && (
        <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={() => setError(null)}
                className="-mx-1.5 -my-1.5 inline-flex rounded-md p-1.5 text-red-500 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <svg
                  className="h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {filteredConversations.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-md p-8 text-center"
        >
          <div className="w-16 h-16 mx-auto mb-4 text-gray-300">
            <svg
              className="w-full h-full"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          {searchTerm ? (
            <>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
              <p className="text-gray-500 mb-4">No users match your search for "{searchTerm}"</p>
              <button
                onClick={() => setSearchTerm('')}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
              >
                Clear Search
              </button>
            </>
          ) : (
            <>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No conversations yet</h3>
              <p className="text-gray-500 mb-4">
                Start a conversation with designers or clients about your projects.
              </p>
              <Link
                to="/app/designers"
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors inline-block"
              >
                Find designers to message
              </Link>
            </>
          )}
        </motion.div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-100">
          <h2 className="px-4 py-3 bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-700">
            Conversations
          </h2>
          <ul className="divide-y divide-gray-200">
            <AnimatePresence>
              {filteredConversations.map((conversation, index) => {
                // Get the correct user ID from the conversation object
                const userId = conversation.user?._id || conversation.userId;

                // Skip rendering if no valid user ID
                if (!userId) {
                  console.error('Conversation missing user ID:', conversation);
                  return null;
                }
                return (
                  <motion.li
                    key={`conversation-${userId}-${index}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <Link
                      to={`/app/messages/${userId}`}
                      className="block hover:bg-gray-50 transition-colors duration-150 relative"
                    >
                      <div className="px-4 py-4 sm:px-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="flex-shrink-0">
                              <div className="w-12 h-12 rounded-full bg-primary-600 flex items-center justify-center text-white font-medium shadow-sm">
                                {(conversation.user?.username || conversation.username || '?')
                                  .charAt(0)
                                  .toUpperCase()}
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="flex items-center">
                                <h3 className="text-base font-medium text-gray-900">
                                  {conversation.user?.username || conversation.username || 'Unknown User'}
                                </h3>
                                {conversation.projectTitle && (
                                  <span className="ml-2 text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full font-medium">
                                    {conversation.projectTitle}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-500 truncate max-w-xs mt-1">
                                {conversation.lastMessage || conversation.latestMessage?.content || 'No messages yet'}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end">
                            <span className="text-xs text-gray-500">
                              {formatTime(conversation.lastMessageTime || conversation.latestMessage?.createdAt)}
                            </span>
                            {conversation.unreadCount > 0 && (
                              <span className="mt-1 inline-flex items-center justify-center px-2.5 py-1 text-xs font-bold leading-none text-white bg-primary-600 rounded-full shadow-sm min-w-[20px]">
                                {conversation.unreadCount}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Active indicator if this is the most recent conversation */}
                      {index === 0 && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-600"></div>
                      )}
                    </Link>
                  </motion.li>
                );
              })}
            </AnimatePresence>

            {/* Show loading indicator at the bottom when refreshing */}
            {refreshing && (
              <li className="py-4 px-6 flex justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-primary-600"></div>
              </li>
            )}
          </ul>
        </div>
      )}
    </motion.div>
  );
};

// Add memo to prevent unnecessary re-renders
export default React.memo(MessageList);