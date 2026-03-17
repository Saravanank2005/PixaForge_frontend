import { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  
  // Token is already handled by the api utility interceptors
  useEffect(() => {}, [token]);
  
  // Load user data on initial render if token exists
  useEffect(() => {
    const loadUser = async () => {
      if (token) {
        try {
          const res = await api.get('/api/auth/profile');
          setCurrentUser(res.data);
        } catch (error) {
          console.error('Error loading user:', error);
          logout();
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };
    
    loadUser();
  }, [token]);
  
  const login = async (username, password) => {
    try {
      const res = await api.post('/api/auth/login', { username, password });
      const { token, userId, userType, username: userName } = res.data;
      
      localStorage.setItem('token', token);
      setToken(token);
      
      // Set current user with basic info until full profile is loaded
      setCurrentUser({
        _id: userId,
        username: userName,
        userType
      });
      
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        message: error.response?.data?.error || 'Login failed' 
      };
    }
  };
  
  const register = async (userData) => {
    try {
      // Format the data to match exactly what the server expects
      const registrationData = {
        username: userData.username,
        email: userData.email,
        password: userData.password,
        userType: userData.userType,
        // Ensure latitude and longitude are numbers, not strings or null
        latitude: Number(userData.latitude || 0),
        longitude: Number(userData.longitude || 0)
        // Remove any fields not expected by the server
      };
      
      const res = await api.post('/api/auth/register', registrationData);
      const { token, userId, userType } = res.data;
      
      if (token) {
        localStorage.setItem('token', token);
        setToken(token);
        
        // Set current user with basic info until full profile is loaded
        setCurrentUser({
          _id: userId,
          username: userData.username,
          userType
        });
      }
      
      return { success: true };
    } catch (error) {
      console.error('Registration error:', error);
      return { 
        success: false, 
        message: error.response?.data?.error || 'Registration failed' 
      };
    }
  };
  
  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setCurrentUser(null);
  };
  
  const updateProfile = async (profileData) => {
    try {
      let endpoint = '/api/auth/profile';
      
      // Use designer-specific endpoint for designer profile updates
      if (currentUser?.userType === 'designer' && 
          (profileData.skills || profileData.hourlyRate || profileData.bio)) {
        endpoint = '/api/designers/profile';
      }
      
      const res = await api.put(endpoint, profileData);
      
      // Update current user with new data
      setCurrentUser(prev => ({ ...prev, ...res.data.user }));
      
      return { success: true };
    } catch (error) {
      console.error('Profile update error:', error);
      return { 
        success: false, 
        message: error.response?.data?.error || 'Profile update failed' 
      };
    }
  };
  
  // Directly update the current user object in state
  const updateUser = (userData) => {
    setCurrentUser(prev => ({ ...prev, ...userData }));
  };
  
  const value = {
    currentUser,
    token,
    loading,
    login,
    register,
    logout,
    updateProfile,
    updateUser,
    isAuthenticated: !!currentUser,
    isDesigner: currentUser?.userType === 'designer',
    isClient: currentUser?.userType === 'client'
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
