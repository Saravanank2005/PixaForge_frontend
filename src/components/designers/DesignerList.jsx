import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../../utils/api';
import DesignerMapComponent from './DesignerMapComponent';

// Fallback component when map has errors
const MapFallback = ({ position, designers, radiusKm }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full bg-gray-50 rounded-xl p-8">
      <div className="text-xl font-semibold text-gray-700 mb-4">Map currently unavailable</div>
      <p className="text-gray-600 text-center mb-4">
        We're experiencing some technical difficulties with the map display.
        <br />You can still view and interact with designers in the list below.
      </p>
      <div className="bg-sky-100 p-4 rounded-lg text-sky-800 text-sm">
        <strong>Your location:</strong> {position ? `${position[0].toFixed(4)}, ${position[1].toFixed(4)}` : 'Unknown'}
        <br />
        <strong>Designers nearby:</strong> {designers.length}
        <br />
        <strong>Search radius:</strong> {radiusKm} km
      </div>
    </div>
  );
};

// Map component with error boundary to handle potential issues
const DesignerMap = ({ position, designers, radiusKm }) => {
  const [hasError, setHasError] = useState(false);
  
  // Reset error state when props change
  useEffect(() => {
    setHasError(false);
  }, [position, designers, radiusKm]);
  
  if (hasError || !position) {
    return <MapFallback position={position} designers={designers} radiusKm={radiusKm} />;
  }
  
  try {
    return (
      <div className="h-full" style={{ position: 'relative' }}>
        <DesignerMapComponent
          position={position}
          designers={designers}
          radiusKm={radiusKm}
        />
      </div>
    );
  } catch (error) {
    console.error('Error rendering map:', error);
    setHasError(true);
    return <MapFallback position={position} designers={designers} radiusKm={radiusKm} />;
  }
};

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

const DesignerList = () => {
  const [designers, setDesigners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [position, setPosition] = useState(null);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [minRating, setMinRating] = useState(0);
  const [maxRates, setMaxRates] = useState({});
  const [radiusKm, setRadiusKm] = useState(10); // Default 10km radius

  // Initialize map icons
  // Fix Leaflet's default icon path issues
  useEffect(() => {
    // Fix Leaflet's default icon path issues
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    });
  }, []);

  const userIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  const designerIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

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
            await api.put('/api/location', {
              latitude: newPosition[0],
              longitude: newPosition[1]
            });
            
            // Include location and radius in initial fetch
            const params = {
              lat: newPosition[0],
              lng: newPosition[1],
              maxDistance: radiusKm * 1000 // Convert km to meters
            };
            
            const response = await api.get('/api/designers', { params });
            setDesigners(response.data);
            setLoading(false);
          } catch (error) {
            console.error('Error:', error);
            setError(error.response?.data?.error || 'Failed to fetch data');
            setLoading(false);
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
          setError('Failed to get your location. Please allow location access.');
          setLoading(false);
        }
      );
    };

    getUserLocation();
  }, [radiusKm]); // Add radiusKm as a dependency to refresh when it changes

  const applyFilters = async () => {
    try {
      setLoading(true);
      const params = {};
      
      if (selectedSkills.length > 0) {
        params.skills = selectedSkills.join(',');
      }
      if (minRating > 0) {
        params.minRating = minRating;
      }
      
      // Add distance radius filter if position is available
      if (position && radiusKm > 0) {
        params.lat = position[0];
        params.lng = position[1];
        params.maxDistance = radiusKm * 1000; // Convert km to meters for the API
      }
      
      // Add max rates for selected skills
      const maxRateFilters = {};
      Object.entries(maxRates).forEach(([skill, rate]) => {
        if (rate) {
          maxRateFilters[skill] = rate;
        }
      });
      
      if (Object.keys(maxRateFilters).length > 0) {
        params.maxRates = JSON.stringify(maxRateFilters);
      }

      const response = await api.get('/api/designers', { params });
      setDesigners(response.data);
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to apply filters');
    } finally {
      setLoading(false);
    }
  };

  const handleMaxRateChange = (skill, value) => {
    setMaxRates(prev => ({
      ...prev,
      [skill]: value ? Number(value) : null
    }));
  };

  return (
    <>
      <style>
        {`
          /* Map Container Styling */
          .leaflet-container {
            border-radius: 0.75rem;
            box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
            transition: all 0.3s ease;
            border: 2px solid #0ea5e9; /* Sky blue border */
          }

          /* Card Fade-In Animation */
          .designer-card {
            animation: slideUp 0.4s ease-out;
          }

          @keyframes slideUp {
            from { opacity: 0; transform: translateY(15px); }
            to { opacity: 1; transform: translateY(0); }
          }

          /* Custom Checkbox Styling */
          input[type="checkbox"] {
            transition: all 0.2s ease;
          }
          input[type="checkbox"]:checked {
            background-color: #0ea5e9; /* Sky blue */
            border-color: #0ea5e9;
          }

          /* Loading Spinner */
          .custom-spinner {
            border: 5px solid rgba(0, 0, 0, 0.1);
            border-left-color: #0ea5e9; /* Sky blue */
            animation: spin 0.8s linear infinite;
          }

          @keyframes spin {
            to { transform: rotate(360deg); }
          }

          /* Map Marker Hover */
          .leaflet-marker-icon {
            transition: transform 0.2s ease;
          }
          .leaflet-marker-icon:hover {
            transform: scale(1.15);
          }

          /* Skill Tag Hover */
          .skill-tag {
            transition: transform 0.2s ease, background-color 0.2s ease;
          }
          .skill-tag:hover {
            transform: translateY(-2px);
            background-color: #e0f2fe; /* Lighter sky blue */
          }
        `}
      </style>
      <div className="container mx-auto px-6 py-16 max-w-7xl">
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight">Find Designers</h1>
          <p className="mt-3 text-lg text-gray-600 leading-relaxed">
            Connect with talented graphic designers for your next project.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
          {/* Filters */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl p-8 sticky top-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Filters</h2>
              
              {/* Skills and Rates */}
              <div className="mb-8">
                <h3 className="text-sm font-medium text-gray-700 mb-4">Skills & Max Rates</h3>
                <div className="space-y-5">
                  {AVAILABLE_SKILLS.map((skill, skillIndex) => (
                    <div key={`skill-${skill.name}-${skillIndex}`} className="flex flex-col space-y-3">
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={selectedSkills.includes(skill.name)}
                          onChange={() => {
                            if (selectedSkills.includes(skill.name)) {
                              setSelectedSkills(selectedSkills.filter(s => s !== skill.name));
                            } else {
                              setSelectedSkills([...selectedSkills, skill.name]);
                            }
                          }}
                          className="h-5 w-5 rounded border-gray-300 text-sky-500 focus:ring-sky-500 focus:ring-offset-1"
                        />
                        <span className="text-sm text-gray-800 font-medium">{skill.name}</span>
                      </label>
                      {selectedSkills.includes(skill.name) && (
                        <div className="ml-8">
                          <label className="block text-xs text-gray-500 font-medium">Max Rate (USD)</label>
                          <input
                            type="number"
                            value={maxRates[skill.name] || ''}
                            onChange={(e) => handleMaxRateChange(skill.name, e.target.value)}
                            placeholder={`Default: $${skill.defaultRate}`}
                            className="mt-2 block w-full rounded-lg border-gray-200 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm py-2 px-3 transition-all duration-300"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Rating Filter */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Rating
                </label>
                <select
                  value={minRating}
                  onChange={(e) => setMinRating(Number(e.target.value))}
                  className="mt-2 block w-full rounded-lg border-gray-200 shadow-sm focus:border-sky-500 focus:ring-sky-500 text-sm py-2 px-3 transition-all duration-300"
                >
                  <option value="0">Any Rating</option>
                  <option value="3">3+ Stars</option>
                  <option value="4">4+ Stars</option>
                  <option value="5">5 Stars</option>
                </select>
              </div>
              
              {/* Distance Radius Filter */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Distance Radius: {radiusKm} km
                </label>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={radiusKm}
                  onChange={(e) => setRadiusKm(Number(e.target.value))}
                  className="mt-2 block w-full accent-sky-500 cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span>1 km</span>
                  <span>50 km</span>
                  <span>100 km</span>
                </div>
                <div className="mt-3 text-sm text-gray-600">
                  {position ? (
                    <p>Showing designers within {radiusKm} km of your location</p>
                  ) : (
                    <p className="text-amber-600">Enable location to use this filter</p>
                  )}
                </div>
              </div>

              {/* Apply Filters Button */}
              <button
                onClick={applyFilters}
                className="w-full bg-sky-500 text-white px-6 py-3 rounded-lg hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 transition-all duration-300 font-medium"
              >
                Apply Filters
              </button>
            </div>
          </div>

          {/* Map and Designer List */}
          <div className="lg:col-span-3">
            {/* Map */}
            <div className="bg-white rounded-2xl shadow-xl mb-10 overflow-hidden" style={{ height: '500px' }}>
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="custom-spinner rounded-full h-14 w-14"></div>
                </div>
              ) : error ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-red-600 text-xl font-medium">{error}</div>
                </div>
              ) : (
                <div className="h-full">
                  {position ? (
                    <DesignerMap
                      position={position}
                      designers={designers}
                      userIcon={userIcon}
                      designerIcon={designerIcon}
                      radiusKm={radiusKm}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-gray-600 text-xl font-medium">Please allow location access to view the map</div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Designer List */}
            <div className="bg-white rounded-2xl shadow-xl">
              <div className="p-8 border-b border-gray-200">
                <h2 className="text-2xl font-semibold text-gray-900">
                  {loading ? 'Loading Designers...' : `${designers.length} Designers Found`}
                </h2>
              </div>
              
              {loading ? (
                <div className="p-8 text-center">
                  <div className="custom-spinner rounded-full h-14 w-14 mx-auto"></div>
                </div>
              ) : error ? (
                <div className="p-8 text-center text-red-600 text-xl font-medium">
                  {error}
                </div>
              ) : designers.length === 0 ? (
                <div className="p-8 text-center text-gray-500 text-xl">
                  No designers found matching your criteria.
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {designers.map((designer, designerIndex) => (
                    <div
                      key={`designer-${designer._id}-${designerIndex}`}
                      className="p-6 bg-white rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02] designer-card mb-4"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-xl font-bold text-gray-900">{designer.name || designer.username}</h3>
                            <div className="flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                              <span className="text-gray-700 font-medium ml-1">{designer.averageRating?.toFixed(1) || 'New'}</span>
                            </div>
                          </div>
                          
                          {/* Distance indicator */}
                          {designer.distance && (
                            <div className="text-sm text-sky-600 font-medium mb-3 flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              {designer.distance.toFixed(1)} km away
                            </div>
                          )}
                          
                          {/* Skills */}
                          {designer.skills && designer.skills.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {designer.skills.slice(0, 3).map((skill, skillIndex) => (
                                <span
                                  key={`skill-${designer._id}-${skill.name}-${skillIndex}`}
                                  className="skill-tag inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-sky-100 text-sky-800"
                                >
                                  {skill.name} {skill.rate && `- $${skill.rate}/hr`}
                                </span>
                              ))}
                              {designer.skills.length > 3 && (
                                <span className="text-xs text-gray-500">+{designer.skills.length - 3} more</span>
                              )}
                            </div>
                          )}
                          
                          {/* Bio */}
                          {designer.bio && (
                            <p className="mt-3 text-sm text-gray-600 line-clamp-2">
                              {designer.bio}
                            </p>
                          )}
                        </div>
                        
                        <div className="ml-4 flex-shrink-0">
                          <Link
                            to={`/app/designers/${designer._id}`}
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-sky-500 hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 transition-all duration-300"
                          >
                            View Profile
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DesignerList;