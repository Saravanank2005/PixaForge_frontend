import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import api from '../../utils/api';
import { fetchUserProfile } from '../../utils/profileUtils';
import PortfolioForm from './PortfolioForm';
import PortfolioGallery from './PortfolioGallery';
import ThemeToggle from '../common/ThemeToggle';
import UserAvatar from '../common/UserAvatar';

const AVAILABLE_SKILLS = [
  { name: 'Logo Design', defaultRate: 500 },
  { name: 'UI/UX Design', defaultRate: 600 },
  { name: 'Web Design', defaultRate: 550 },
  { name: 'Figma', defaultRate: 400 },
  { name: 'Photoshop', defaultRate: 450 },
  { name: 'Illustrator', defaultRate: 475 },
  { name: 'Brand Identity', defaultRate: 700 },
  { name: 'Mobile App Design', defaultRate: 650 },
  { name: 'Icon Design', defaultRate: 300 },
  { name: 'Print Design', defaultRate: 400 }
];

const ProfileSettings = () => {
  const { currentUser, updateUser } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [profileMetrics, setProfileMetrics] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    bio: '',
    skills: [],
    hourlyRate: 0,
    professionalHeadline: '',
    hiringPreference: 'both'
  });
  const [location, setLocation] = useState({
    latitude: null,
    longitude: null,
    accuracy: null,
    source: 'profile',
    capturedAt: null
  });
  const [portfolioItems, setPortfolioItems] = useState([]);
  const [locationLoading, setLocationLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [expandedSections, setExpandedSections] = useState({
    clientStats: true,
    basic: true,
    location: false,
    professional: true,
    performance: true,
    skills: false,
    portfolio: false,
    appearance: false
  });
  
  useEffect(() => {
    const loadUserData = async () => {
      try {
        setLoading(true);
        const profileData = await fetchUserProfile();
        
        setFormData({
          username: profileData.username || '',
          email: profileData.email || '',
          bio: profileData.bio || '',
          skills: profileData.skills || [],
          hourlyRate: profileData.hourlyRate || 0,
          professionalHeadline: profileData.professionalHeadline || '',
          hiringPreference: profileData.hiringPreference || 'both'
        });

        try {
          const metricsResponse = await api.get('/api/projects/profile-metrics');
          setProfileMetrics(metricsResponse.data);
        } catch (metricsError) {
          console.error('Failed to fetch profile metrics:', metricsError);
        }

        if (profileData.location?.coordinates?.length === 2) {
          setLocation((prev) => ({
            ...prev,
            latitude: profileData.location.coordinates[1],
            longitude: profileData.location.coordinates[0],
            source: 'profile',
            capturedAt: profileData.lastActive || null
          }));
        }

        setAvatarPreview(profileData.avatarUrl || '');
        
        setPortfolioItems(profileData.portfolio || []);
        setLoading(false);
      } catch (error) {
        setError('Failed to load profile data');
        setLoading(false);
      }
    };
    
    loadUserData();
  }, []);

  // Try to dynamically refresh location when settings open.
  useEffect(() => {
    captureAndSyncLocation(true);
  }, []);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'hourlyRate' ? parseFloat(value) : value
    });
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setError('Only JPG, PNG and GIF images are allowed for profile picture');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Profile picture size should be less than 5MB');
      return;
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setError('');
  };
  
  const captureAndSyncLocation = (silent = false) => {
    setLocationLoading(true);
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const latitude = position.coords.latitude;
            const longitude = position.coords.longitude;

            await api.put('/api/location', { latitude, longitude });

            setLocation({
              latitude,
              longitude,
              accuracy: Math.round(position.coords.accuracy || 0),
              source: 'live',
              capturedAt: new Date().toISOString()
            });

            if (!silent) {
              setSuccess('Live location updated successfully.');
              setError('');
            }
          } catch (syncError) {
            console.error('Error syncing location:', syncError);
            if (!silent) {
              setError('Location captured, but failed to sync with server. Please try again.');
            }
          } finally {
            setLocationLoading(false);
          }
        },
        (error) => {
          console.error('Error getting location:', error);
          if (!silent) {
            setError('Failed to get your live location. Please allow location access in your browser.');
          }
          setLocationLoading(false);
        },
        { enableHighAccuracy: true, timeout: 15000 }
      );
    } else {
      if (!silent) {
        setError('Geolocation is not supported by your browser');
      }
      setLocationLoading(false);
    }
  };
  
  const handleSkillChange = (skillName, field, value) => {
    setFormData(prev => {
      const skills = [...prev.skills];
      const skillIndex = skills.findIndex(s => s.name === skillName);
      
      if (skillIndex === -1) {
        // Add new skill
        skills.push({
          name: skillName,
          rate: field === 'rate' ? Number(value) : AVAILABLE_SKILLS.find(s => s.name === skillName).defaultRate,
          description: field === 'description' ? value : '',
          proficiency: field === 'proficiency' ? value : 'Intermediate',
          yearsExperience: field === 'yearsExperience' ? Number(value) : 0
        });
      } else {
        // Update existing skill
        skills[skillIndex] = {
          ...skills[skillIndex],
          [field]: field === 'rate' || field === 'yearsExperience' ? Number(value) : value
        };
      }
      
      return { ...prev, skills };
    });
  };
  
  // Handle portfolio item added
  const handlePortfolioSuccess = (newItem) => {
    setPortfolioItems(prev => [...prev, newItem]);
    setSuccess('Portfolio item added successfully!');
  };

  // Handle portfolio item removed
  const handlePortfolioItemRemoved = (itemId) => {
    setPortfolioItems(prev => prev.filter(item => item._id !== itemId));
    setSuccess('Portfolio item removed successfully!');
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (!formData.username || !formData.email) {
        throw new Error('Username and email are required');
      }

      if (avatarFile) {
        const avatarForm = new FormData();
        avatarForm.append('avatar', avatarFile);
        await api.put('/api/auth/avatar', avatarForm, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      const baseProfileData = {
        username: formData.username,
        email: formData.email,
        bio: formData.bio,
      };

      // Update shared profile fields for both clients and designers.
      await api.put('/api/auth/profile', baseProfileData);

      // Update designer-specific fields when relevant.
      if (currentUser?.userType === 'designer') {
        await api.put('/api/designers/profile', {
          skills: formData.skills,
          bio: formData.bio,
          professionalHeadline: formData.professionalHeadline,
          hiringPreference: formData.hiringPreference
        });
      }

      // Keep location dynamic by syncing most recent geolocation before save if available.
      if (location.latitude !== null && location.longitude !== null) {
        await api.put('/api/location', {
          latitude: location.latitude,
          longitude: location.longitude
        });
      }

      const refreshedProfile = await fetchUserProfile();
      setSuccess('Profile updated successfully!');
      updateUser(refreshedProfile);
      setAvatarFile(null);
      setAvatarPreview(refreshedProfile.avatarUrl || avatarPreview);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (key) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const openAndScrollToSection = (key) => {
    setExpandedSections((prev) => ({ ...prev, [key]: true }));
    setTimeout(() => {
      const el = document.getElementById(`profile-section-${key}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 80);
  };

  const sectionNav = currentUser?.userType === 'designer'
    ? [
        { key: 'basic', label: 'Basic' },
        { key: 'location', label: 'Location' },
        { key: 'professional', label: 'Professional' },
        { key: 'performance', label: 'Performance' },
        { key: 'skills', label: 'Skills' },
        { key: 'portfolio', label: 'Portfolio' },
        { key: 'appearance', label: 'Appearance' }
      ]
    : [
        { key: 'clientStats', label: 'Stats' },
        { key: 'basic', label: 'Basic' },
        { key: 'location', label: 'Location' },
        { key: 'appearance', label: 'Appearance' }
      ];
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Profile Settings</h1>
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        {success && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700">{success}</p>
              </div>
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <aside className="lg:col-span-3 lg:sticky lg:top-4 z-20 bg-white/95 backdrop-blur border border-gray-200 rounded-lg shadow-sm p-3">
            <p className="text-xs text-gray-500 mb-2">Quick Access</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-1 gap-2">
              {sectionNav.map((section) => (
                <button
                  key={section.key}
                  type="button"
                  onClick={() => openAndScrollToSection(section.key)}
                  className="w-full text-left px-3 py-2 text-xs font-medium rounded-md bg-gray-100 text-gray-700 hover:bg-primary-50 hover:text-primary-700"
                >
                  {section.label}
                </button>
              ))}
            </div>
          </aside>

          <div className="lg:col-span-9 space-y-6 min-w-0 overflow-x-hidden">
          {currentUser?.userType === 'client' && profileMetrics?.projectStats && (
            <div id="profile-section-clientStats" className="card rounded-lg shadow">
              <button
                type="button"
                onClick={() => toggleSection('clientStats')}
                className="w-full px-6 py-4 flex items-center justify-between"
              >
                <h2 className="text-lg font-medium text-gray-900">Project Stats</h2>
                <span className="text-sm text-gray-500">{expandedSections.clientStats ? 'Hide' : 'Show'}</span>
              </button>
              {expandedSections.clientStats && <div className="px-6 pb-6 border-t border-gray-100 pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-xs text-blue-700 uppercase">Total Posted</p>
                  <p className="text-2xl font-bold text-blue-900">{profileMetrics.projectStats.totalPosted}</p>
                </div>
                <div className="bg-amber-50 rounded-lg p-4">
                  <p className="text-xs text-amber-700 uppercase">Active</p>
                  <p className="text-2xl font-bold text-amber-900">{profileMetrics.projectStats.active}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-xs text-green-700 uppercase">Completed</p>
                  <p className="text-2xl font-bold text-green-900">{profileMetrics.projectStats.completed}</p>
                </div>
                <div className="bg-red-50 rounded-lg p-4">
                  <p className="text-xs text-red-700 uppercase">Canceled</p>
                  <p className="text-2xl font-bold text-red-900">{profileMetrics.projectStats.canceled}</p>
                </div>
              </div>
              <div className="mt-5">
                <button
                  type="button"
                  onClick={() => navigate('/app/projects/create')}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
                >
                  Post New Project
                </button>
              </div>
              </div>}
            </div>
          )}

          <div id="profile-section-basic" className="card rounded-lg shadow">
            <button
              type="button"
              onClick={() => toggleSection('basic')}
              className="w-full px-6 py-4 flex items-center justify-between"
            >
              <h2 className="text-lg font-medium text-gray-900">Basic Information</h2>
              <span className="text-sm text-gray-500">{expandedSections.basic ? 'Hide' : 'Show'}</span>
            </button>
            {expandedSections.basic && <div className="px-6 pb-6 border-t border-gray-100 pt-4">

            <div className="mb-6 flex items-center gap-4">
              <UserAvatar
                user={{ ...currentUser, avatarUrl: avatarPreview || currentUser?.avatarUrl }}
                sizeClass="w-20 h-20"
                textClass="text-xl font-semibold"
                className="ring-2 ring-white shadow"
              />
              <div>
                <label htmlFor="avatar" className="block text-sm font-medium text-gray-700 mb-2">Profile Picture</label>
                <input
                  id="avatar"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="block text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                />
                <p className="mt-1 text-xs text-gray-500">JPG/PNG/GIF, max 5MB. Save changes to apply everywhere.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-3">
                <label htmlFor="username" className="block text-sm font-medium text-gray-700">Username</label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="username"
                    id="username"
                    value={formData.username}
                    onChange={handleChange}
                    className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                <div className="mt-1">
                  <input
                    type="email"
                    name="email"
                    id="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>

              <div className="sm:col-span-6">
                <label htmlFor="bio" className="block text-sm font-medium text-gray-700">Bio</label>
                <div className="mt-1">
                  <textarea
                    name="bio"
                    id="bio"
                    rows="3"
                    value={formData.bio}
                    onChange={handleChange}
                    className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  ></textarea>
                </div>
              </div>
            </div>
            </div>}
          </div>

          <div id="profile-section-location" className="card rounded-lg shadow">
            <button
              type="button"
              onClick={() => toggleSection('location')}
              className="w-full px-6 py-4 flex items-center justify-between"
            >
              <h2 className="text-lg font-medium text-gray-900">Live Location</h2>
              <span className="text-sm text-gray-500">{expandedSections.location ? 'Hide' : 'Show'}</span>
            </button>
            {expandedSections.location && <div className="px-6 pb-6 border-t border-gray-100 pt-4">
            <p className="text-sm text-gray-600 mb-4">
              Location is captured dynamically from your device and synced to the server. Manual coordinate editing is disabled.
            </p>
            
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-3">
                <label htmlFor="latitude" className="block text-sm font-medium text-gray-700">Latitude</label>
                <div className="mt-1">
                  <input
                    type="text"
                    id="latitude"
                    value={location.latitude ?? ''}
                    className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    readOnly
                  />
                </div>
              </div>
              
              <div className="sm:col-span-3">
                <label htmlFor="longitude" className="block text-sm font-medium text-gray-700">Longitude</label>
                <div className="mt-1">
                  <input
                    type="text"
                    id="longitude"
                    value={location.longitude ?? ''}
                    className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    readOnly
                  />
                </div>
              </div>

              <div className="sm:col-span-6 text-sm text-gray-600">
                {location.capturedAt ? (
                  <>
                    <p>Last captured: {new Date(location.capturedAt).toLocaleString()}</p>
                    {location.accuracy !== null && <p>Accuracy: ±{location.accuracy} meters</p>}
                  </>
                ) : (
                  <p>No live location captured yet.</p>
                )}
              </div>
              
              <div className="sm:col-span-6">
                <button
                  type="button"
                  onClick={() => captureAndSyncLocation(false)}
                  disabled={locationLoading}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  {locationLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Capturing live location...
                    </>
                  ) : (
                    'Refresh Live Location'
                  )}
                </button>
              </div>
            </div>
            </div>}
          </div>
          
          {currentUser?.userType === 'designer' && (
            <>
              <div id="profile-section-professional" className="card rounded-lg shadow mt-6">
                <button
                  type="button"
                  onClick={() => toggleSection('professional')}
                  className="w-full px-6 py-4 flex items-center justify-between"
                >
                  <h2 className="text-lg font-medium text-gray-900">Professional Profile</h2>
                  <span className="text-sm text-gray-500">{expandedSections.professional ? 'Hide' : 'Show'}</span>
                </button>
                {expandedSections.professional && <div className="px-6 pb-6 border-t border-gray-100 pt-4">
                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                  <div className="sm:col-span-6">
                    <label htmlFor="professionalHeadline" className="block text-sm font-medium text-gray-700">Professional Headline</label>
                    <input
                      type="text"
                      name="professionalHeadline"
                      id="professionalHeadline"
                      value={formData.professionalHeadline}
                      onChange={handleChange}
                      placeholder="e.g., Brand Designer | UI/UX Specialist"
                      className="mt-1 shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label htmlFor="hiringPreference" className="block text-sm font-medium text-gray-700">Hiring Style Preference</label>
                    <select
                      name="hiringPreference"
                      id="hiringPreference"
                      value={formData.hiringPreference}
                      onChange={handleChange}
                      className="mt-1 shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    >
                      <option value="both">Direct + Bidding</option>
                      <option value="direct">Direct Hire Only</option>
                      <option value="bidding">Bidding Only</option>
                    </select>
                  </div>
                </div>
                </div>}
              </div>

              {profileMetrics?.performanceStats && (
                <div id="profile-section-performance" className="card rounded-lg shadow mt-6">
                  <button
                    type="button"
                    onClick={() => toggleSection('performance')}
                    className="w-full px-6 py-4 flex items-center justify-between"
                  >
                    <h2 className="text-lg font-medium text-gray-900">Performance Stats</h2>
                    <span className="text-sm text-gray-500">{expandedSections.performance ? 'Hide' : 'Show'}</span>
                  </button>
                  {expandedSections.performance && <div className="px-6 pb-6 border-t border-gray-100 pt-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <p className="text-xs text-blue-700 uppercase">Jobs Completed</p>
                      <p className="text-2xl font-bold text-blue-900">{profileMetrics.performanceStats.jobsCompleted}</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4">
                      <p className="text-xs text-green-700 uppercase">Success Rate</p>
                      <p className="text-2xl font-bold text-green-900">{profileMetrics.performanceStats.successRate}%</p>
                    </div>
                    <div className="bg-indigo-50 rounded-lg p-4">
                      <p className="text-xs text-indigo-700 uppercase">Repeat Clients</p>
                      <p className="text-2xl font-bold text-indigo-900">{profileMetrics.performanceStats.repeatClients}</p>
                    </div>
                    <div className="bg-yellow-50 rounded-lg p-4">
                      <p className="text-xs text-yellow-700 uppercase">Avg Rating</p>
                      <p className="text-2xl font-bold text-yellow-900">{profileMetrics.performanceStats.avgRating}</p>
                    </div>
                  </div>

                  {profileMetrics?.bidsSummary && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-800 mb-3">Open Bids & Accepted Projects</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-purple-50 rounded-lg p-4">
                          <p className="text-xs text-purple-700 uppercase">Open Bid Opportunities</p>
                          <p className="text-xl font-bold text-purple-900">{profileMetrics.bidsSummary.openBidOpportunities}</p>
                        </div>
                        <div className="bg-orange-50 rounded-lg p-4">
                          <p className="text-xs text-orange-700 uppercase">My Pending Bids</p>
                          <p className="text-xl font-bold text-orange-900">{profileMetrics.bidsSummary.pendingMyBids}</p>
                        </div>
                        <div className="bg-teal-50 rounded-lg p-4">
                          <p className="text-xs text-teal-700 uppercase">Accepted Projects</p>
                          <p className="text-xl font-bold text-teal-900">{profileMetrics.bidsSummary.acceptedProjects}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  </div>}
                </div>
              )}

              <div id="profile-section-skills" className="card rounded-lg shadow mt-6">
                <button
                  type="button"
                  onClick={() => toggleSection('skills')}
                  className="w-full px-6 py-4 flex items-center justify-between"
                >
                  <h2 className="text-lg font-medium text-gray-900">Skills & Rates</h2>
                  <span className="text-sm text-gray-500">{expandedSections.skills ? 'Hide' : 'Show'}</span>
                </button>
                {expandedSections.skills && <div className="px-6 pb-6 border-t border-gray-100 pt-4">
                
                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                  {AVAILABLE_SKILLS.map((skill) => {
                    const userSkill = formData.skills.find(s => s.name === skill.name);
                    return (
                      <div key={skill.name} className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm font-medium text-gray-700">
                            <input
                              type="checkbox"
                              checked={!!userSkill}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  handleSkillChange(skill.name, 'rate', skill.defaultRate);
                                } else {
                                  setFormData(prev => ({
                                    ...prev,
                                    skills: prev.skills.filter(s => s.name !== skill.name)
                                  }));
                                }
                              }}
                              className="mr-2 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                            {skill.name}
                          </label>
                        </div>
                        
                        {userSkill && (
                          <>
                            <div className="mt-2">
                              <label className="block text-sm text-gray-600">Rate (INR/hr)</label>
                              <input
                                type="number"
                                value={userSkill.rate}
                                onChange={(e) => handleSkillChange(skill.name, 'rate', e.target.value)}
                                min="0"
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                              />
                            </div>
                            <div className="mt-2">
                              <label className="block text-sm text-gray-600">Proficiency</label>
                              <select
                                value={userSkill.proficiency || 'Intermediate'}
                                onChange={(e) => handleSkillChange(skill.name, 'proficiency', e.target.value)}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                              >
                                <option value="Beginner">Beginner</option>
                                <option value="Intermediate">Intermediate</option>
                                <option value="Advanced">Advanced</option>
                                <option value="Expert">Expert</option>
                              </select>
                            </div>
                            <div className="mt-2">
                              <label className="block text-sm text-gray-600">Years Experience</label>
                              <input
                                type="number"
                                value={userSkill.yearsExperience ?? 0}
                                onChange={(e) => handleSkillChange(skill.name, 'yearsExperience', e.target.value)}
                                min="0"
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                              />
                            </div>
                            <div className="mt-2">
                              <label className="block text-sm text-gray-600">Description</label>
                              <input
                                type="text"
                                value={userSkill.description || ''}
                                onChange={(e) => handleSkillChange(skill.name, 'description', e.target.value)}
                                placeholder="Brief description of your expertise"
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                              />
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
                </div>}
              </div>
              
              <div id="profile-section-portfolio" className="card rounded-lg shadow mt-6">
                <button
                  type="button"
                  onClick={() => toggleSection('portfolio')}
                  className="w-full px-6 py-4 flex items-center justify-between"
                >
                  <h2 className="text-lg font-medium text-gray-900">Portfolio</h2>
                  <span className="text-sm text-gray-500">{expandedSections.portfolio ? 'Hide' : 'Show'}</span>
                </button>
                {expandedSections.portfolio && <div className="px-6 pb-6 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={() => document.getElementById('portfolio-form-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                  className="mb-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
                >
                  Add Portfolio Item
                </button>
                
                <div className="space-y-6">
                  {/* Portfolio Form Component */}
                  <div id="portfolio-form-section">
                    <PortfolioForm 
                      onSuccess={handlePortfolioSuccess}
                      onError={setError}
                    />
                  </div>
                  
                  <div className="mt-6">
                    <h3 className="text-sm font-medium text-gray-900 mb-4">Current Portfolio Items</h3>
                    
                    {/* Portfolio Gallery Component */}
                    <PortfolioGallery 
                      items={portfolioItems} 
                      onRemove={setError}
                      onItemRemoved={handlePortfolioItemRemoved}
                      isLoading={loading}
                    />
                  </div>
                </div>
                </div>}
              </div>
              
            </>
          )}

          <div id="profile-section-appearance" className="card rounded-lg shadow mt-6">
            <button
              type="button"
              onClick={() => toggleSection('appearance')}
              className="w-full px-6 py-4 flex items-center justify-between"
            >
              <h2 className="text-lg font-medium text-gray-900">Appearance</h2>
              <span className="text-sm text-gray-500">{expandedSections.appearance ? 'Hide' : 'Show'}</span>
            </button>
            {expandedSections.appearance && <div className="px-6 pb-6 border-t border-gray-100 pt-4">
            
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Theme</h3>
                  <p className="text-sm text-gray-500">Choose between light and dark mode</p>
                </div>
                <ThemeToggle />
              </div>
            </div>
            </div>}
          </div>
          
          <div className="sticky bottom-0 z-20 w-full max-w-full bg-white/95 backdrop-blur border border-gray-200 rounded-lg p-3 flex flex-wrap justify-end gap-2 overflow-hidden">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 whitespace-nowrap"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 whitespace-nowrap"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileSettings;