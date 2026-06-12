import { useState, useEffect } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/auth.css';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    userType: 'client',
    companyName: '',
    latitude: 0,  // Default value for all users
    longitude: 0  // Default value for all users
  });
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  
  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleUserTypeChange = (type) => {
    setFormData({
      ...formData,
      userType: type
    });
  };
  
  const handleGetLocation = () => {
    setLocationLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData({
            ...formData,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
          setLocationLoading(false);
        },
        (error) => {
          console.error("Error getting location:", error);
          setError("Failed to get your location. Please try again or enter manually.");
          setLocationLoading(false);
        }
      );
    } else {
      setError("Geolocation is not supported by your browser.");
      setLocationLoading(false);
    }
  };
  
  const validateForm = () => {
    // Check if required fields are filled
    if (!formData.username || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('Please fill in all required fields');
      return false;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    
    // Check password length
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    
    // Check if passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    
    return true;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    try {
      setError('');
      setLoading(true);
      
      // If location is not shared, use default coordinates so users can continue onboarding.
      const registrationData = { ...formData };
      if (!registrationData.latitude || !registrationData.longitude) {
        registrationData.latitude = 0;
        registrationData.longitude = 0;
      }
      
      // Log the data being sent to the server
      console.log('Registration data being sent:', registrationData);
      
      const result = await register(registrationData);
      
      if (!result.success) {
        console.log('Registration failed with message:', result.message);
        setError(result.message);
      } else {
        setSuccess('Registration successful! Redirecting to login...');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (err) {
      console.error('Registration error details:', err.response?.data || err.message);
      setError(err.response?.data?.error || 'Failed to register. Please try again.');
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
    <div className="auth-container auth-register-view">
      <div className="auth-background"></div>
      
      <div className="auth-card auth-register-card">
        <form className="auth-form auth-compact-form auth-register-refined" onSubmit={handleSubmit}>
          <div className="auth-form-header">
            <span className="auth-mini-badge">Create Your Design Identity</span>
            <div className="auth-logo">
              <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4"></path>
              </svg>
            </div>
            <h2 className="auth-title mt-4 text-center text-2xl font-bold font-['Outfit']">
              Create Your Account
            </h2>
            <p className="auth-subtitle mt-1 text-center text-sm">
              Join PixaForge and start your journey
            </p>
          </div>
          
          {error && (
            <div className="auth-error">
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          )}
          
          {success && (
            <div className="auth-success">
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>{success}</span>
            </div>
          )}
          
          <div className="auth-user-type">
            <div 
              className={`auth-user-type-option ${formData.userType === 'client' ? 'active' : ''}`}
              onClick={() => handleUserTypeChange('client')}
            >
              Client
            </div>
            <div 
              className={`auth-user-type-option ${formData.userType === 'designer' ? 'active' : ''}`}
              onClick={() => handleUserTypeChange('designer')}
            >
              Designer
            </div>
          </div>
          
          <div className="auth-scrollable-section">
            <div className="auth-form-fields">
              <div className="auth-form-field full-span">
                <label htmlFor="username" className="auth-label">Username</label>
                <div className="auth-input-wrapper">
                  <input
                    id="username"
                    name="username"
                    type="text"
                    className="auth-input auth-input-with-icon"
                    placeholder="Choose a username"
                    value={formData.username}
                    onChange={handleChange}
                  />
                  <svg className="auth-input-icon h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              
              <div className="auth-form-field full-span">
                <label htmlFor="email" className="auth-label">Email Address</label>
                <div className="auth-input-wrapper">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    className="auth-input auth-input-with-icon"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleChange}
                  />
                  <svg className="auth-input-icon h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                </div>
              </div>
              
              <div className="auth-form-row">
                <div className="auth-form-field">
                  <label htmlFor="password" className="auth-label">Password</label>
                  <div className="auth-input-wrapper">
                    <input
                      id="password"
                      name="password"
                      type="password"
                      className="auth-input auth-input-with-icon"
                      placeholder="Create a password"
                      value={formData.password}
                      onChange={handleChange}
                    />
                    <svg className="auth-input-icon h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                
                <div className="auth-form-field">
                  <label htmlFor="confirmPassword" className="auth-label">Confirm Password</label>
                  <div className="auth-input-wrapper">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      className="auth-input auth-input-with-icon"
                      placeholder="Confirm password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                    />
                    <svg className="auth-input-icon h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>
              
              {formData.userType === 'designer' && (
                <div className="auth-form-field">
                  <label htmlFor="companyName" className="auth-label">Company Name (Optional)</label>
                  <input
                    id="companyName"
                    name="companyName"
                    type="text"
                    className="auth-input"
                    placeholder="Your company name"
                    value={formData.companyName}
                    onChange={handleChange}
                  />
                </div>
              )}
              
              {formData.userType === 'designer' && (
                <div className="auth-location-section">
                  <div className="auth-location-header">
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium">Location (optional)</span>
                  </div>
                  <p className="auth-location-note">Share to appear in nearby search results.</p>
                  
                  <div className="auth-location-action-row">
                    <button
                      type="button"
                      onClick={handleGetLocation}
                      disabled={locationLoading}
                      className="auth-location-btn"
                    >
                      {locationLoading ? (
                        <>
                          <div className="loading-spinner border-gray-300 border-t-gray-600"></div>
                          <span>Getting location...</span>
                        </>
                      ) : (
                        <>
                          <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                          </svg>
                          <span>Share My Location</span>
                        </>
                      )}
                    </button>
                  </div>
                  
                  {formData.latitude && formData.longitude ? (
                    <div className="auth-location-status success">
                      <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>Location successfully captured</span>
                    </div>
                  ) : (
                    <div className="auth-location-status muted">You can skip this now and add it later.</div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="auth-button mt-4"
          >
            {loading ? (
              <>
                <div className="loading-spinner"></div>
                <span>Creating account...</span>
              </>
            ) : 'Create Account'}
          </button>
          
          <div className="auth-divider">
            <span className="auth-divider-text">Already have an account?</span>
          </div>
          
          <Link 
            to="/login" 
            className="auth-button auth-button-secondary"
          >
            Sign in instead
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

export default Register;