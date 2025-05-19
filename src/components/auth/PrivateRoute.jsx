import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const PrivateRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // If there's no current user, redirect to login
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // If children is provided, render children, otherwise render Outlet
  return children ? children : <Outlet />;
};

export default PrivateRoute; 