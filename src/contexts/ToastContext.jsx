import { createContext, useContext, useState, useCallback } from 'react';
import Toast from '../components/common/Toast';

const ToastContext = createContext();

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  
  const addToast = useCallback((message, type = 'info', duration = 3000) => {
    const id = Date.now();
    setToasts(prevToasts => [...prevToasts, { id, message, type, duration }]);
    return id;
  }, []);
  
  const removeToast = useCallback((id) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  }, []);
  
  // Convenience methods
  const success = useCallback((message, duration) => {
    return addToast(message, 'success', duration);
  }, [addToast]);
  
  const error = useCallback((message, duration) => {
    return addToast(message, 'error', duration);
  }, [addToast]);
  
  const warning = useCallback((message, duration) => {
    return addToast(message, 'warning', duration);
  }, [addToast]);
  
  const info = useCallback((message, duration) => {
    return addToast(message, 'info', duration);
  }, [addToast]);
  
  const value = {
    addToast,
    removeToast,
    success,
    error,
    warning,
    info
  };
  
  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-0 right-0 p-4 space-y-4 z-50">
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
