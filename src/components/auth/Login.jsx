import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/auth.css';

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.username || !formData.password) {
      setError('Please fill in all fields');
      return;
    }
    
    try {
      setError('');
      setLoading(true);
      
      const result = await login(formData.username, formData.password);
      
      if (!result.success) {
        setError(result.message);
      } else {
        navigate('/app');
      }
    } catch (err) {
      setError('Failed to log in. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/app" />;
  }
  
  return (
    <div className="auth-container auth-login-view">
      <div className="auth-background"></div>
      
      <div className="auth-card auth-login-card">
        <form className="auth-form auth-login-refined" onSubmit={handleSubmit}>
          <div className="auth-form-header">
            <span className="auth-mini-badge">Secure Workspace Access</span>
            <div className="auth-logo">
              <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4"></path>
              </svg>
            </div>
            <h2 className="auth-title mt-6 text-center text-3xl font-extrabold font-['Outfit']">
              Welcome Back
            </h2>
            <p className="auth-subtitle mt-2 text-center text-sm">
              Sign in to access your PixaForge account
            </p>
            <div className="auth-inline-points">
              <span>Fast login</span>
              <span>Protected sessions</span>
              <span>Realtime updates</span>
            </div>
          </div>
          
          {error && (
            <div className="auth-error">
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          )}
          
          <div className="auth-form-fields">
            <div className="auth-form-field">
              <label htmlFor="username" className="auth-label">Username or Email</label>
              <div className="auth-input-wrapper">
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  className="auth-input auth-input-with-icon"
                  placeholder="Enter your username or email"
                  value={formData.username}
                  onChange={handleChange}
                />
                <svg className="h-5 w-5 auth-input-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
              </div>
            </div>
            
            <div className="auth-form-field">
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="password" className="auth-label">Password</label>
                <Link to="/forgot-password" className="auth-inline-link text-xs font-medium transition duration-150 ease-in-out">
                  Forgot your password?
                </Link>
              </div>
              <div className="auth-input-wrapper">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="auth-input auth-input-with-icon"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                />
                <svg className="h-5 w-5 auth-input-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          
            <button
              type="submit"
              disabled={loading}
              className="auth-button"
            >
              {loading ? (
                <>
                  <div className="loading-spinner"></div>
                  <span>Signing in...</span>
                </>
              ) : 'Sign in'}
            </button>
          </div>
          
          <div className="auth-divider">
            <span className="auth-divider-text">Don't have an account?</span>
          </div>
          
          <Link 
            to="/register" 
            className="auth-button auth-button-secondary"
          >
            Create new account
          </Link>
          
          <Link to="/" className="auth-back-link">
            <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to home
          </Link>
        </form>
      </div>
    </div>
  );
};

export default Login;