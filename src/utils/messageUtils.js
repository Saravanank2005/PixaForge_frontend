/**
 * Utility functions for handling messages
 */

/**
 * Group messages by date for display with separators
 * @param {Array} messages - Array of message objects
 * @returns {Array} Array of grouped messages with date separators
 */
export const groupMessagesByDate = (messages) => {
  if (!messages || messages.length === 0) return [];
  
  const groups = [];
  let currentDate = null;
  
  messages.forEach(message => {
    const messageDate = new Date(message.timestamp);
    const dateString = messageDate.toDateString();
    
    // If this is a new date, add a separator
    if (dateString !== currentDate) {
      groups.push({ type: 'date', timestamp: message.timestamp });
      currentDate = dateString;
    }
    
    // Add the message
    groups.push({ type: 'message', ...message });
  });
  
  return groups;
};

/**
 * Check if a message is from the current user
 * @param {Object} message - Message object
 * @param {Object} currentUser - Current user object
 * @returns {boolean} True if message is from current user
 */
export const isMessageFromCurrentUser = (message, currentUser) => {
  if (!message || !currentUser) return false;
  return message.sender === currentUser._id || message.sender?._id === currentUser._id;
};

/**
 * Generate error message based on API error
 * @param {Error} error - Error object from API call
 * @param {string} defaultMessage - Default message to show
 * @returns {string} Formatted error message
 */
export const getErrorMessage = (error, defaultMessage = 'An error occurred') => {
  if (!error) return defaultMessage;
  
  if (error.response) {
    // Server responded with error
    switch (error.response.status) {
      case 400:
        return 'Invalid request. Please check your input.';
      case 401:
        return 'You need to log in again to continue.';
      case 403:
        return 'You do not have permission to perform this action.';
      case 404:
        return 'The requested resource was not found.';
      case 500:
        return 'Server error. Please try again later.';
      default:
        return error.response.data?.message || defaultMessage;
    }
  } else if (error.request) {
    // Request made but no response received
    return 'Network error. Please check your internet connection.';
  } else {
    // Something else happened
    return error.message || defaultMessage;
  }
};

/**
 * Create a debounced function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export const debounce = (func, wait) => {
  let timeout;
  
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};
