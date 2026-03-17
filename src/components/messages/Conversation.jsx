import { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { motion, AnimatePresence } from 'framer-motion';
import ChatMessage from './ChatMessage';

const ConversationFixed = () => {
  const params = useParams();
  const { userId } = params;
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { socket } = useSocket();
  
  const [messages, setMessages] = useState([]);
  const [otherUser, setOtherUser] = useState(null);
  const [relatedProject, setRelatedProject] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState(null);
  
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  
  // Extract projectId from params or query params if available
  const queryParams = new URLSearchParams(location.search);
  const projectId = params.projectId || queryParams.get('projectId');
  
  useEffect(() => {
    // If no userId is provided, redirect to messages list
    if (!userId) {
      navigate('/app/messages');
      return;
    }

    // Fetch other user's details
    const fetchUserData = async () => {
      try {
        const response = await api.get(`/api/user/${userId}`);
        setOtherUser(response.data);
      } catch (error) {
        console.error('Error fetching user data:', error);
        if (error.response && error.response.status === 404) {
          setError('User not found. They may have deleted their account.');
        } else if (error.response && error.response.status === 403) {
          setError('You do not have permission to view this conversation.');
        } else if (error.message === 'Network Error') {
          setError('Network error. Please check your internet connection.');
        } else {
          setError('Failed to load user information. Please try again later.');
        }
      }
    };
    
    // Fetch conversation history
    const fetchMessages = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/api/messages/conversation/${userId}`);
        setMessages(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching messages:', error);
        if (error.response && error.response.status === 404) {
          setError('Conversation not found.');
        } else if (error.response && error.response.status === 403) {
          setError('You do not have permission to view this conversation.');
        } else if (error.message === 'Network Error') {
          setError('Network error. Please check your internet connection.');
        } else {
          setError('Failed to load conversation history. Please try again later.');
        }
        setLoading(false);
      }
    };
    
    // Fetch related project if projectId is provided
    const fetchProject = async () => {
      if (projectId) {
        try {
          const response = await api.get(`/api/projects/${projectId}`);
          setRelatedProject(response.data);
        } catch (error) {
          console.error('Error fetching project:', error);
        }
      }
    };
    
    // Only fetch data if userId is defined
    if (userId && userId !== 'undefined') {
      fetchUserData();
      fetchMessages();
      fetchProject();
    } else {
      setLoading(false);
      setError('Invalid user ID. Redirecting to messages...');
      setTimeout(() => navigate('/app/messages'), 1500);
    }
  }, [userId, projectId, navigate]);
  
  // Socket.io event listeners
  useEffect(() => {
    if (!socket || !userId) return;
    
    // Listen for incoming messages
    socket.on('receiveMessage', (message) => {
      if (message.sender === userId || message.recipient === userId) {
        setMessages(prevMessages => [...prevMessages, message]);
      }
    });
    
    // Listen for typing indicators
    socket.on('userTyping', ({ userId: typingUserId }) => {
      if (typingUserId === userId) {
        setOtherUserTyping(true);
        
        // Auto-clear typing indicator after 3 seconds of no updates
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        
        typingTimeoutRef.current = setTimeout(() => {
          setOtherUserTyping(false);
        }, 3000);
      }
    });
    
    socket.on('userStoppedTyping', ({ userId: typingUserId }) => {
      if (typingUserId === userId) {
        setOtherUserTyping(false);
      }
    });
    
    // Clean up event listeners
    return () => {
      socket.off('receiveMessage');
      socket.off('userTyping');
      socket.off('userStoppedTyping');
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [socket, userId]);
  
  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Handle typing indicator
  const handleTyping = () => {
    if (!isTyping && socket) {
      setIsTyping(true);
      socket.emit('typing', { recipientId: userId });
      
      // Reset typing status after 2 seconds of no input
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        socket.emit('stopTyping', { recipientId: userId });
      }, 2000);
    }
  };
  
  // Handle message input change
  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    handleTyping();
  };
  
  // Send message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || sending) return;
    
    try {
      setSending(true);
      
      const messageData = {
        receiverId: userId,
        content: newMessage.trim(),
        projectId: projectId || undefined
      };
      
      const response = await api.post('/api/messages', messageData);
      
      // Add the new message to the conversation
      setMessages(prevMessages => [...prevMessages, response.data]);
      
      // Clear the input field
      setNewMessage('');
      
      // Reset typing status
      setIsTyping(false);
      if (socket) {
        socket.emit('stopTyping', { recipientId: userId });
      }
      
      // Clear any error messages
      if (error) setError(null);
      
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };
  
  // Format timestamp for display
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Format date for day separators
  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // If today, show "Today"
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    }
    
    // If yesterday, show "Yesterday"
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    
    // Otherwise, show the date
    return date.toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Group messages by date
  const groupMessagesByDate = () => {
    const groups = {};
    
    messages.forEach(message => {
      const date = new Date(message.createdAt).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });
    
    return Object.entries(groups).map(([date, messages]) => ({
      date,
      messages
    }));
  };
  
  // Navigate to project details
  const handleViewProject = () => {
    if (relatedProject) {
      navigate(`/app/projects/${relatedProject._id}`);
    }
  };
  
  if (!userId) {
    return null;
  }
  
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 mb-4"></div>
        <p className="text-gray-600 animate-pulse">Loading conversation...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        className="flex items-center justify-center h-screen bg-gray-50"
      >
        <div className="bg-white p-6 rounded-lg shadow-md text-center max-w-md w-full mx-4">
          <div className="text-red-500 rounded-full bg-red-100 w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Conversation</h3>
          <p className="text-red-500 mb-6">{error}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate('/app/messages')}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors shadow-sm"
            >
              Back to Messages
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </motion.div>
    );
  }
  
  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }}
      className="flex flex-col h-screen bg-gray-50"
    >
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm sticky top-0 z-10">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/app/messages')}
            className="mr-3 text-gray-500 hover:text-gray-700 transition-colors p-2 rounded-full hover:bg-gray-100"
            aria-label="Back to messages"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-medium shadow-sm">
              {otherUser?.username?.charAt(0).toUpperCase() || '?'}
            </div>
            
            <div className="ml-3">
              <h2 className="text-lg font-semibold text-gray-900">
                {otherUser?.username || 'User'}
              </h2>
              
              <AnimatePresence>
                {otherUserTyping && (
                  <motion.p 
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-xs text-gray-500 flex items-center"
                  >
                    <span className="mr-1">Typing</span>
                    <span className="flex space-x-1">
                      <span className="animate-bounce delay-0 inline-block w-1 h-1 bg-gray-500 rounded-full"></span>
                      <span className="animate-bounce delay-150 inline-block w-1 h-1 bg-gray-500 rounded-full"></span>
                      <span className="animate-bounce delay-300 inline-block w-1 h-1 bg-gray-500 rounded-full"></span>
                    </span>
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
        
        {relatedProject && (
          <button
            onClick={handleViewProject}
            className="text-sm text-primary-600 hover:text-primary-800 flex items-center bg-primary-50 px-3 py-1.5 rounded-full transition-colors hover:bg-primary-100"
          >
            <span className="mr-1">Project: {relatedProject.title}</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </button>
        )}
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 pb-0">
        {messages.length === 0 && !loading ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <div className="w-16 h-16 text-gray-300 mb-4">
              <svg className="w-full h-full" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No messages yet</h3>
            <p className="text-gray-500 mb-4">Start the conversation by sending a message below.</p>
          </div>
        ) : (
          groupMessagesByDate().map((group, groupIndex) => (
            <div key={groupIndex} className="mb-6">
              <div className="flex justify-center mb-4">
                <div className="bg-gray-100 text-gray-700 text-xs px-4 py-1.5 rounded-full shadow-sm font-medium">
                  {formatDate(new Date(group.date))}
                </div>
              </div>
              
              {group.messages.map((message, messageIndex) => {
                const isCurrentUser = message.sender === currentUser?._id;
                
                return (
                  <ChatMessage
                    key={message._id || messageIndex}
                    message={message.content}
                    isCurrentUser={isCurrentUser}
                    currentUser={currentUser}
                    otherUser={otherUser}
                    timestamp={message.createdAt}
                    showAvatar={true}
                  />
                );
              })}
            </div>
          ))
        )}
        
        {/* Typing indicator */}
        <AnimatePresence>
          {otherUserTyping && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex mb-4 justify-start"
            >
              <div className="flex-shrink-0 mr-2 self-end mb-1">
                <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs font-medium shadow-sm">
                  {otherUser?.username?.charAt(0).toUpperCase() || '?'}
                </div>
              </div>
              
              <div className="bg-white border border-gray-100 px-4 py-2 rounded-2xl rounded-bl-none shadow-sm">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Auto-scroll anchor */}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Message Input */}
      <div className="bg-white border-t border-gray-200 p-4 sticky bottom-0 z-10 shadow-md">
        {error && (
          <div className="bg-red-50 text-red-600 text-sm p-2 rounded-md mb-2 flex items-center justify-between">
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
            <button onClick={() => setError(null)} className="text-red-700 hover:text-red-800">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        <form onSubmit={handleSendMessage} className="flex items-center">
          <input
            type="text"
            value={newMessage}
            onChange={handleInputChange}
            placeholder="Type a message..."
            className="flex-1 border border-gray-300 rounded-l-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent shadow-sm"
            disabled={sending}
          />
          
          <button
            type="submit"
            disabled={sending || !newMessage.trim()}
            className="bg-primary-600 text-white py-3 px-4 rounded-r-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            aria-label="Send message"
          >
            {sending ? (
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path>
              </svg>
            )}
          </button>
        </form>
      </div>
    </motion.div>
  );
};

export default ConversationFixed;
9