import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { fetchUserProfile, updateUserProfile } from '../../utils/profileUtils';
import PortfolioForm from './PortfolioForm';
import PortfolioGallery from './PortfolioGallery';

const Profile = () => {
  const { currentUser, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    bio: '',
    location: {
      type: 'Point',
      coordinates: [0, 0]
    },
    skills: [],
    portfolio: []
  });
  const [newSkill, setNewSkill] = useState({ name: '', rate: '', description: '' });
  const [activeTab, setActiveTab] = useState('basic');

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        const profileData = await fetchUserProfile();
        
        if (profileData) {
          setFormData({
            username: profileData.username || '',
            email: profileData.email || '',
            bio: profileData.bio || '',
            location: profileData.location || { type: 'Point', coordinates: [0, 0] },
            skills: profileData.skills || [],
            portfolio: profileData.portfolio || []
          });
        }
      } catch (err) {
        console.error('Profile fetch error:', err);
        setError(err.response?.data?.error || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLocationChange = (e) => {
    const { name, value } = e.target;
    const index = name === 'longitude' ? 0 : 1;
    const newCoordinates = [...formData.location.coordinates];
    newCoordinates[index] = parseFloat(value) || 0;
    
    setFormData(prev => ({
      ...prev,
      location: {
        ...prev.location,
        coordinates: newCoordinates
      }
    }));
  };

  const handleSkillChange = (e) => {
    const { name, value } = e.target;
    setNewSkill(prev => ({
      ...prev,
      [name]: name === 'rate' ? (value ? parseFloat(value) : '') : value
    }));
  };

  const addSkill = () => {
    if (!newSkill.name || !newSkill.rate) {
      setError('Skill name and rate are required');
      return;
    }

    setFormData(prev => ({
      ...prev,
      skills: [...prev.skills, { ...newSkill }]
    }));

    setNewSkill({ name: '', rate: '', description: '' });
    setError('');
  };

  const removeSkill = (index) => {
    const updatedSkills = [...formData.skills];
    updatedSkills.splice(index, 1);
    setFormData(prev => ({
      ...prev,
      skills: updatedSkills
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Prepare the data for update
      const updatedData = {
        username: formData.username,
        email: formData.email,
        bio: formData.bio || '',
        // Location will be stringified in the updateUserProfile function
        location: formData.location || { type: 'Point', coordinates: [0, 0] }
      };
      
      // Include skills only for designer profiles
      if (currentUser?.userType === 'designer') {
        updatedData.skills = formData.skills || [];
      }
      
      // For debugging
      console.log('Preparing profile update with data:', updatedData);

      const response = await updateUserProfile(updatedData, currentUser?.userType);
      
      if (response) {
        updateUser(response.user || response);
        setSuccess('Profile updated successfully!');
      }
    } catch (err) {
      console.error('Profile update error:', err);
      setError(err.response?.data?.error || 'Failed to update profile: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  // Handle portfolio item added
  const handlePortfolioSuccess = (newItem) => {
    setFormData(prev => ({
      ...prev,
      portfolio: [...prev.portfolio, newItem]
    }));
    setSuccess('Portfolio item added successfully!');
  };

  // Handle portfolio item removed
  const handlePortfolioItemRemoved = (itemId) => {
    setFormData(prev => ({
      ...prev,
      portfolio: prev.portfolio.filter(item => item._id !== itemId)
    }));
    setSuccess('Portfolio item removed successfully!');
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Profile Settings</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}
      
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b">
          <button
            className={`px-4 py-2 text-sm font-medium ${activeTab === 'basic' ? 'border-b-2 border-primary-600 text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('basic')}
          >
            Basic Info
          </button>
          {currentUser?.userType === 'designer' && (
            <button
              className={`px-4 py-2 text-sm font-medium ${activeTab === 'skills' ? 'border-b-2 border-primary-600 text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('skills')}
            >
              Skills
            </button>
          )}
          {currentUser?.userType === 'designer' && (
            <button
              className={`px-4 py-2 text-sm font-medium ${activeTab === 'portfolio' ? 'border-b-2 border-primary-600 text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('portfolio')}
            >
              Portfolio
            </button>
          )}
          <button
            className={`px-4 py-2 text-sm font-medium ${activeTab === 'location' ? 'border-b-2 border-primary-600 text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('location')}
          >
            Location
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6">
            {/* Basic Info Tab */}
            {activeTab === 'basic' && (
              <div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">
                    Username
                  </label>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="bio">
                    Bio
                  </label>
                  <textarea
                    id="bio"
                    name="bio"
                    value={formData.bio || ''}
                    onChange={handleChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    rows="4"
                    placeholder="Tell us about yourself..."
                  />
                </div>
              </div>
            )}

            {/* Skills Tab (Designer only) */}
            {activeTab === 'skills' && currentUser?.userType === 'designer' && (
              <div>
                <h3 className="text-lg font-medium mb-4">Your Skills</h3>
                
                {formData.skills.length > 0 ? (
                  <div className="mb-6">
                    <div className="grid grid-cols-12 font-semibold mb-2 text-sm text-gray-600">
                      <div className="col-span-4">Skill</div>
                      <div className="col-span-3">Rate ($/hr)</div>
                      <div className="col-span-4">Description</div>
                      <div className="col-span-1"></div>
                    </div>
                    {formData.skills.map((skill, index) => (
                      <div key={index} className="grid grid-cols-12 gap-2 mb-2 items-center">
                        <div className="col-span-4">{skill.name}</div>
                        <div className="col-span-3">${skill.rate}</div>
                        <div className="col-span-4 text-sm text-gray-600 truncate">{skill.description || 'N/A'}</div>
                        <div className="col-span-1">
                          <button 
                            type="button"
                            onClick={() => removeSkill(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 mb-4">You haven't added any skills yet.</p>
                )}
                
                <div className="border-t pt-4 mt-4">
                  <h4 className="font-medium mb-3">Add New Skill</h4>
                  <div className="grid grid-cols-12 gap-3">
                    <div className="col-span-4">
                      <input
                        type="text"
                        name="name"
                        value={newSkill.name}
                        onChange={handleSkillChange}
                        placeholder="Skill name"
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      />
                    </div>
                    <div className="col-span-3">
                      <input
                        type="number"
                        name="rate"
                        value={newSkill.rate}
                        onChange={handleSkillChange}
                        placeholder="Rate ($/hr)"
                        min="0"
                        step="0.01"
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      />
                    </div>
                    <div className="col-span-4">
                      <input
                        type="text"
                        name="description"
                        value={newSkill.description}
                        onChange={handleSkillChange}
                        placeholder="Brief description"
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      />
                    </div>
                    <div className="col-span-1">
                      <button
                        type="button"
                        onClick={addSkill}
                        className="bg-green-500 hover:bg-green-600 text-white py-2 px-3 rounded focus:outline-none focus:shadow-outline"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Portfolio Tab (Designer only) */}
            {activeTab === 'portfolio' && currentUser?.userType === 'designer' && (
              <div>
                <h3 className="text-lg font-medium mb-4">Your Portfolio</h3>
                
                {/* Portfolio Gallery Component */}
                <PortfolioGallery 
                  items={formData.portfolio} 
                  onRemove={setError}
                  onItemRemoved={handlePortfolioItemRemoved}
                  isLoading={loading}
                />
                
                <div className="border-t pt-4 mt-4">
                  <h4 className="font-medium mb-3">Add New Portfolio Item</h4>
                  
                  {/* Portfolio Form Component */}
                  <PortfolioForm 
                    onSuccess={handlePortfolioSuccess}
                    onError={setError}
                  />
                </div>
              </div>
            )}

            {/* Location Tab */}
            {activeTab === 'location' && (
              <div>
                <h3 className="text-lg font-medium mb-4">Your Location</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Your location helps clients find you on the map. Please enter accurate coordinates.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="longitude">
                      Longitude
                    </label>
                    <input
                      type="number"
                      id="longitude"
                      name="longitude"
                      value={formData.location?.coordinates?.[0] || 0}
                      onChange={handleLocationChange}
                      step="0.000001"
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="latitude">
                      Latitude
                    </label>
                    <input
                      type="number"
                      id="latitude"
                      name="latitude"
                      value={formData.location?.coordinates?.[1] || 0}
                      onChange={handleLocationChange}
                      step="0.000001"
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    />
                  </div>
                </div>
                
                <div className="text-sm text-gray-600 mt-2">
                  <p>Tip: You can find your coordinates by right-clicking on Google Maps and selecting "What's here?"</p>
                </div>
              </div>
            )}
          </div>
          
          <div className="bg-gray-50 px-6 py-4 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;