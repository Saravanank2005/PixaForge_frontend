/**
 * Utility functions for formatting data across the application
 */

/**
 * Format a date string to a readable format
 * @param {string} dateString - ISO date string
 * @param {boolean} includeTime - Whether to include time in the output
 * @returns {string} Formatted date string
 */
export const formatDate = (dateString, includeTime = true) => {
  try {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    
    if (!includeTime) {
      return `${day}.${month}.${year}`;
    }
    
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    return `${day}.${month}.${year}, ${hours}:${minutes}`;
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
};

/**
 * Get status badge class based on status value
 * @param {string} status - Status value
 * @returns {string} CSS class for the status badge
 */
export const getStatusBadgeClass = (status) => {
  const classes = {
    completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    accepted: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
    rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
  };
  
  return classes[status] || classes.pending;
};

/**
 * Get message partner information
 * @param {object} message - Message object
 * @param {object} currentUser - Current user object
 * @returns {object} Partner information (id, name, initial)
 */
export const getMessagePartnerInfo = (message, currentUser) => {
  if (!message || !currentUser) {
    return { id: null, name: 'Unknown User', initial: '?' };
  }
  
  // Determine if current user is sender or recipient
  const isUserSender = message.sender?._id === currentUser._id;
  const partner = isUserSender ? message.recipient : message.sender;
  
  if (!partner) {
    return { id: null, name: 'Unknown User', initial: '?' };
  }
  
  return {
    id: partner._id,
    name: partner.name || partner.username || (isUserSender ? 'Recipient' : 'Sender'),
    initial: (partner.name || partner.username || '?').charAt(0).toUpperCase()
  };
};

/**
 * Truncate text to a specific length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
export const truncateText = (text, maxLength = 100) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  
  return text.substring(0, maxLength) + '...';
};

/**
 * Format currency amount
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code (default: USD)
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, currency = 'USD') => {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency
    }).format(amount);
  } catch (error) {
    console.error('Error formatting currency:', error);
    return `${amount} ${currency}`;
  }
};
