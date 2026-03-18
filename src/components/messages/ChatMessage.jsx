import React from 'react';
import { motion } from 'framer-motion';
import UserAvatar from '../common/UserAvatar';

/**
 * ChatMessage component for displaying individual messages in the chat
 * with distinct styling for sent vs received messages
 */
const ChatMessage = ({ 
  message, 
  isCurrentUser, 
  currentUser, 
  otherUser,
  timestamp,
  showAvatar = true
}) => {
  // Format timestamp for display
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex mb-4 ${isCurrentUser ? 'justify-end' : 'justify-start'} w-full`}
    >
      {/* Avatar for received messages - left side */}
      {!isCurrentUser && showAvatar && (
        <div className="flex-shrink-0 mr-2 self-end mb-1">
          <UserAvatar user={otherUser} sizeClass="w-8 h-8" className="shadow-md ring-2 ring-white" textClass="text-xs font-medium" bgClass="bg-gray-600 text-white" />
        </div>
      )}
      
      <div className="flex flex-col max-w-[75%]">
        {/* Sender name for received messages */}
        {!isCurrentUser && showAvatar && (
          <span className="text-xs text-gray-500 ml-1 mb-1 font-medium">
            {otherUser?.username || otherUser?.name || 'User'}
          </span>
        )}
        
        {/* Message bubble */}
        <div 
          className={`px-4 py-3 rounded-xl shadow-sm ${
            isCurrentUser 
              ? 'bg-sky-600 text-white rounded-tr-none ml-auto' 
              : 'bg-white border border-gray-100 text-gray-800 rounded-tl-none mr-auto'
          }`}
        >
          <p className="whitespace-pre-wrap break-words">{message}</p>
          
          {/* Timestamp */}
          <p className={`text-xs mt-1 ${isCurrentUser ? 'text-right text-sky-100' : 'text-left text-gray-500'}`}>
            {formatTime(timestamp)}
          </p>
        </div>
        
        {/* Read status for sent messages */}
        {isCurrentUser && (
          <span className="text-xs text-gray-500 mr-1 mt-1 self-end">
            <svg className="w-3 h-3 inline-block mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Sent
          </span>
        )}
      </div>
      
      {/* Avatar for sent messages - right side */}
      {isCurrentUser && showAvatar && (
        <div className="flex-shrink-0 ml-2 self-end mb-1">
          <UserAvatar user={currentUser} sizeClass="w-8 h-8" className="shadow-md ring-2 ring-white" textClass="text-xs font-medium" bgClass="bg-sky-700 text-white" />
        </div>
      )}
    </motion.div>
  );
};

export default ChatMessage;
