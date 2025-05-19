import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { fetchUserProfile, updateUserProfile, validateImageFile } from '../../utils/profileUtils';
import PortfolioForm from './PortfolioForm';
import PortfolioGallery from './PortfolioGallery';
import ThemeToggle from '../common/ThemeToggle';

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
  const [formData, setFormData] = useState({
    bio: '',
    skills: [],
    hourlyRate: 0,
    latitude: '',
    longitude: ''
  });
  const [portfolioItems, setPortfolioItems] = useState([]);
  const [locationLoading, setLocationLoading] = useState(false);
  
  useEffect(() => {
    const loadUserData = async () => {
      try {
        setLoading(true);
        const profileData = await fetchUserProfile();
        
        setFormData({
          bio: profileData.bio || '',
          skills: profileData.skills || [],
          hourlyRate: profileData.hourlyRate || 0,
          latitude: profileData.location?.coordinates ? profileData.location.coordinates[1] : '',
          longitude: profileData.location?.coordinates ? profileData.location.coordinates[0] : ''
        });
        
        setPortfolioItems(profileData.portfolio || []);
        setLoading(false);
      } catch (error) {
        setError('Failed to load profile data');
        setLoading(false);
      }
    };
    
    loadUserData();
  }, []);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'hourlyRate' ? parseFloat(value) : value
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
          console.error('Error getting location:', error);
          setError('Failed to get your location. Please enter coordinates manually.');
          setLocationLoading(false);
        },
        { enableHighAccuracy: true }
      );
    } else {
      setError('Geolocation is not supported by your browser');
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
          description: field === 'description' ? value : ''
        });
      } else {
        // Update existing skill
        skills[skillIndex] = {
          ...skills[skillIndex],
          [field]: field === 'rate' ? Number(value) : value
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
      // Prepare location data
      const locationData = {
        type: 'Point',
        coordinates: [
          parseFloat(formData.longitude) || 0,
          parseFloat(formData.latitude) || 0
        ]
      };

      // Prepare profile data
      const profileData = {
        bio: formData.bio,
        skills: formData.skills,
        location: locationData
      };

      const response = await updateUserProfile(profileData, currentUser?.userType);
      setSuccess('Profile updated successfully!');
      updateUser(response.user || response);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };
  
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
        
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="card p-6 rounded-lg shadow">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Location</h2>
            
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-3">
                <label htmlFor="latitude" className="block text-sm font-medium text-gray-700">Latitude</label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="latitude"
                    id="latitude"
                    value={formData.latitude}
                    onChange={handleChange}
                    className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>
              
              <div className="sm:col-span-3">
                <label htmlFor="longitude" className="block text-sm font-medium text-gray-700">Longitude</label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="longitude"
                    id="longitude"
                    value={formData.longitude}
                    onChange={handleChange}
                    className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>
              
              <div className="sm:col-span-6">
                <button
                  type="button"
                  onClick={handleGetLocation}
                  disabled={locationLoading}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  {locationLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Getting location...
                    </>
                  ) : (
                    'Get My Current Location'
                  )}
                </button>
              </div>
            </div>
          </div>
          
          {currentUser?.userType === 'designer' && (
            <>
              <div className="card p-6 rounded-lg shadow mt-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Skills & Rates</h2>
                
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
                              <label className="block text-sm text-gray-600">Rate (USD)</label>
                              <input
                                type="number"
                                value={userSkill.rate}
                                onChange={(e) => handleSkillChange(skill.name, 'rate', e.target.value)}
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
              </div>
              
              <div className="card p-6 rounded-lg shadow mt-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Portfolio</h2>
                
                <div className="space-y-6">
                  {/* Portfolio Form Component */}
                  <PortfolioForm 
                    onSuccess={handlePortfolioSuccess}
                    onError={setError}
                  />
                  
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
              </div>
              
              <div className="card p-6 rounded-lg shadow mt-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Appearance</h2>
                
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">Theme</h3>
                      <p className="text-sm text-gray-500">Choose between light and dark mode</p>
                    </div>
                    <ThemeToggle />
                  </div>
                </div>
              </div>
            </>
          )}
          
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="mr-3 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
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
        </form>
      </div>
    </div>
  );
};

export default ProfileSettings;