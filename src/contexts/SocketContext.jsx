import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const { token, isAuthenticated } = useAuth();
  
  useEffect(() => {
    let socketInstance = null;
    
    if (isAuthenticated && token) {
      // Create socket instance
      socketInstance = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
        transports: ['websocket'],
        autoConnect: false
      });
      
      // Set up event listeners
      socketInstance.on('connect', () => {
        console.log('Socket connected');
        setConnected(true);
        
        // Authenticate with token
        socketInstance.emit('authenticate', token);
      });
      
      socketInstance.on('authenticated', (response) => {
        if (response.success) {
          console.log('Socket authenticated');
        } else {
          console.error('Socket authentication failed:', response.error);
          socketInstance.disconnect();
        }
      });
      
      socketInstance.on('disconnect', () => {
        console.log('Socket disconnected');
        setConnected(false);
      });
      
      socketInstance.on('error', (error) => {
        console.error('Socket error:', error);
      });
      
      // Connect to the server
      socketInstance.connect();
      setSocket(socketInstance);
    }
    
    // Cleanup on unmount
    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, [isAuthenticated, token]);
  
  // Send a private message
  const sendPrivateMessage = (receiverId, content, projectId = null) => {
    if (!socket || !connected) {
      console.error('Socket not connected');
      return false;
    }
    
    socket.emit('private-message', {
      receiverId,
      content,
      projectId
    });
    
    return true;
  };
  
  // Send typing indicator
  const sendTypingIndicator = (receiverId, isTyping) => {
    if (!socket || !connected) return;
    
    socket.emit('typing', {
      receiverId,
      isTyping
    });
  };
  
  // Send message reaction
  const sendMessageReaction = (messageId, emoji, recipientId) => {
    if (!socket || !connected) return false;
    
    socket.emit('messageReaction', {
      messageId,
      emoji,
      recipientId
    });
    
    return true;
  };
  
  const value = {
    socket,
    connected,
    sendPrivateMessage,
    sendTypingIndicator,
    sendMessageReaction
  };
  
  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
