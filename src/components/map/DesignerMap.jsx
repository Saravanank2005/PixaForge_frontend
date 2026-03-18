import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../../utils/api';

// Custom hook to update map center when position changes
const ChangeMapView = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  return null;
};

const DesignerMap = () => {
  const [position, setPosition] = useState(null);
  const [designers, setDesigners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchRadius, setSearchRadius] = useState(50);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [availableSkills, setAvailableSkills] = useState([]);
  const [minRating, setMinRating] = useState(0);
  const [maxRate, setMaxRate] = useState('');
  const mapRef = useRef(null);
  
  // Custom marker icons
  const userIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
  
  const designerIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
  
  // Get user's location and fetch nearby designers
  useEffect(() => {
    const getUserLocation = () => {
      if (!navigator.geolocation) {
        setError('Geolocation is not supported by your browser');
        setLoading(false);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const newPosition = [pos.coords.latitude, pos.coords.longitude];
          setPosition(newPosition);
          
          try {
            // Update user's location on the server
            await api.put('/api/location', {
              latitude: newPosition[0],
              longitude: newPosition[1]
            });
            
            // Fetch all available skills for filtering
            const skillsRes = await api.get('/api/designers');
            const allSkills = skillsRes.data.reduce((skills, designer) => {
              designer.skills?.forEach(skill => {
                if (!skills.includes(skill)) {
                  skills.push(skill);
                }
              });
              return skills;
            }, []);
            
            setAvailableSkills(allSkills);
            
            // Initial fetch of nearby designers
            fetchNearbyDesigners(newPosition, searchRadius);
          } catch (error) {
            console.error('Error:', error);
            setError(error.response?.data?.error || 'Failed to fetch data. Please try again.');
            setLoading(false);
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
          setError('Failed to get your location. Please allow location access in your browser settings.');
          setLoading(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    };
    
    getUserLocation();
  }, []);
  
  // Fetch nearby designers with filters
  const fetchNearbyDesigners = async (pos, radius, filters = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        lat: pos[0],
        lng: pos[1],
        maxDistance: radius * 1000 // Convert km to meters
      };
      
      // Add filters if provided
      if (filters.skills?.length) {
        params.skills = filters.skills.join(',');
      }
      
      if (filters.minRating) {
        params.minRating = filters.minRating;
      }
      
      if (filters.maxRate) {
        params.maxRate = filters.maxRate;
      }
      
      const response = await api.get('/api/designers', { params });
      console.log('Fetched designers:', response.data); // Debug log
      setDesigners(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching designers:', error);
      setError(error.response?.data?.error || 'Failed to fetch designers. Please try again.');
      setLoading(false);
    }
  };
  
  // Apply filters
  const applyFilters = () => {
    if (!position) return;
    
    const filters = {
      skills: selectedSkills,
      minRating: minRating > 0 ? minRating : null,
      maxRate: maxRate ? parseFloat(maxRate) : null
    };
    
    fetchNearbyDesigners(position, searchRadius, filters);
  };
  
  // Reset filters
  const resetFilters = () => {
    setSelectedSkills([]);
    setMinRating(0);
    setMaxRate('');
    
    if (position) {
      fetchNearbyDesigners(position, searchRadius);
    }
  };
  
  // Handle skill selection
  const handleSkillToggle = (skill) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter(s => s !== skill));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };
  
  // Update search radius
  const handleRadiusChange = (e) => {
    const newRadius = parseInt(e.target.value);
    setSearchRadius(newRadius);
    
    if (position) {
      fetchNearbyDesigners(position, newRadius, {
        skills: selectedSkills,
        minRating: minRating > 0 ? minRating : null,
        maxRate: maxRate ? parseFloat(maxRate) : null
      });
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Find Designers Near You</h1>
        <p className="text-gray-600">
          Discover talented graphic designers in your area and connect with them for your projects.
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
            
            {/* Search Radius */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search Radius: {searchRadius} km
              </label>
              <input
                type="range"
                min="1"
                max="100"
                value={searchRadius}
                onChange={handleRadiusChange}
                className="w-full"
              />
            </div>
            
            {/* Skills Filter */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Skills
              </label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {availableSkills.map((skill) => (
                  <label key={skill} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedSkills.includes(skill)}
                      onChange={() => handleSkillToggle(skill)}
                      className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                    />
                    <span className="ml-2 text-sm text-gray-700">{skill}</span>
                  </label>
                ))}
              </div>
            </div>
            
            {/* Rating Filter */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Minimum Rating
              </label>
              <input
                type="number"
                min="0"
                max="5"
                step="0.5"
                value={minRating}
                onChange={(e) => setMinRating(parseFloat(e.target.value))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              />
            </div>
            
            {/* Max Rate Filter */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Maximum Rate (₹/hour)
              </label>
              <input
                type="number"
                min="0"
                value={maxRate}
                onChange={(e) => setMaxRate(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              />
            </div>
            
            {/* Filter Buttons */}
            <div className="space-y-2">
              <button
                onClick={applyFilters}
                className="w-full bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                Apply Filters
              </button>
              <button
                onClick={resetFilters}
                className="w-full bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Reset Filters
              </button>
            </div>
          </div>
        </div>
        
        {/* Map */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow overflow-hidden" style={{ height: '600px' }}>
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-red-600">{error}</div>
              </div>
            ) : (
              <MapContainer
                center={position || [0, 0]}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
                ref={mapRef}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <ChangeMapView center={position} />
                
                {/* User Marker */}
                {position && (
                  <Marker position={position} icon={userIcon}>
                    <Popup>You are here</Popup>
                  </Marker>
                )}
                
                {/* Designer Markers */}
                {designers.map((designer) => (
                  <Marker
                    key={designer._id}
                    position={[designer.location.latitude, designer.location.longitude]}
                    icon={designerIcon}
                  >
                    <Popup>
                      <div className="p-2">
                        <h3 className="font-semibold">{designer.username}</h3>
                        <p className="text-sm text-gray-600">{designer.bio}</p>
                        <div className="mt-2">
                          <p className="text-sm">
                            <span className="font-medium">Rating:</span> {designer.rating || 'N/A'}
                          </p>
                          <p className="text-sm">
                            <span className="font-medium">Rate:</span> ₹{designer.rate}/hour
                          </p>
                        </div>
                        <Link
                          to={`/designers/${designer._id}`}
                          className="mt-2 inline-block bg-indigo-600 text-white px-3 py-1 rounded-md text-sm hover:bg-indigo-700"
                        >
                          View Profile
                        </Link>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DesignerMap;
