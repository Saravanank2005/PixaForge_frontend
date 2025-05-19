import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDate } from '../../utils/formatters';

/**
 * Individual message component with reaction functionality
 */
const MessageItem = ({ 
  message, 
  isCurrentUser, 
  currentUser,
  otherUser,
  handleReaction, 
  toggleReactionMenu, 
  selectedMessageId,
  reactionEmojis 
}) => {
  // Format timestamp for display
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex mb-4 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
    >
      {/* Avatar for other user's messages */}
      {!isCurrentUser && (
        <div className="flex-shrink-0 mr-2 self-end mb-1">
          <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs font-medium shadow-sm">
            {otherUser?.name?.charAt(0).toUpperCase() || 
             otherUser?.username?.charAt(0).toUpperCase() || '?'}
          </div>
        </div>
      )}
      
      {/* Message bubble */}
      <div 
        className={`relative group ${
          isCurrentUser 
            ? 'bg-primary-600 text-white rounded-2xl rounded-br-none' 
            : 'bg-white border border-gray-100 rounded-2xl rounded-bl-none'
        } px-4 py-2 shadow-sm max-w-[75%]`}
      >
        {/* Message content */}
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
        
        {/* Timestamp */}
        <div className={`text-xs mt-1 ${isCurrentUser ? 'text-primary-100' : 'text-gray-500'}`}>
          {formatTime(message.timestamp)}
        </div>
        
        {/* Reaction button */}
        <button
          onClick={() => toggleReactionMenu(message._id)}
          className={`absolute -top-2 -left-2 w-8 h-8 rounded-full bg-white shadow-md border border-gray-200 
            flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity
            hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500`}
          aria-label="Add reaction"
        >
          <span className="text-lg">😀</span>
        </button>
        
        {/* Reaction menu */}
        <AnimatePresence>
          {selectedMessageId === message._id && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: -40 }}
              exit={{ opacity: 0, scale: 0.8, y: -10 }}
              className="absolute left-0 -top-2 bg-white rounded-full shadow-lg border border-gray-200 p-1 z-10 flex"
            >
              {reactionEmojis.map((reaction) => (
                <button
                  key={reaction.name}
                  onClick={() => handleReaction(message._id, reaction.emoji)}
                  className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
                  title={reaction.name}
                >
                  <span className="text-xl">{reaction.emoji}</span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Display reactions */}
        {message.reactions && message.reactions.length > 0 && (
          <div className="flex mt-1 -ml-1">
            {message.reactions.map((reaction, index) => (
              <div 
                key={`${reaction.emoji}-${index}`}
                className="bg-white rounded-full shadow-sm border border-gray-100 px-1.5 py-0.5 text-xs flex items-center mr-1"
                title={`${reaction.user === currentUser._id ? 'You' : 'Other user'} reacted with ${reaction.emoji}`}
              >
                <span className="mr-1">{reaction.emoji}</span>
                <span className="text-gray-600">1</span>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Avatar for current user's messages */}
      {isCurrentUser && (
        <div className="flex-shrink-0 ml-2 self-end mb-1">
          <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-white text-xs font-medium shadow-sm">
            {currentUser?.name?.charAt(0).toUpperCase() || 
             currentUser?.email?.charAt(0).toUpperCase() || '?'}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default MessageItem;
