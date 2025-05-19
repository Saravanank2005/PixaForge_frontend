import { motion } from 'framer-motion';
import { formatDate } from '../../utils/formatters';

/**
 * Date separator component for conversation messages
 */
const DateSeparator = ({ date }) => {
  // Format date for display
  const formatDateForDisplay = (timestamp) => {
    try {
      const messageDate = new Date(timestamp);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      // Check if date is today
      if (messageDate.toDateString() === today.toDateString()) {
        return 'Today';
      }
      
      // Check if date is yesterday
      if (messageDate.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
      }
      
      // Otherwise, return formatted date
      return formatDate(timestamp, false);
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex justify-center my-4"
    >
      <div className="bg-gray-100 text-gray-600 text-xs font-medium px-3 py-1 rounded-full">
        {formatDateForDisplay(date)}
      </div>
    </motion.div>
  );
};

export default DateSeparator;
