import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';
import UserAvatar from '../common/UserAvatar';

const projectQuickStarts = [
  {
    label: 'Logo Sprint',
    title: 'Logo Design for New Brand Launch',
    description:
      'Need a modern logo system for a new digital-first brand. Please share 3 visual directions, rationale, and final source files.',
    deliverables: '3 logo concepts, 1 final logo pack, color variants, source files (AI/SVG/PNG)'
  },
  {
    label: 'Social Pack',
    title: 'Social Media Creative Kit',
    description:
      'Looking for reusable social templates with a premium visual style for monthly campaigns across Instagram and LinkedIn.',
    deliverables: '12 editable templates, 4 cover designs, brand style adaptation, export-ready assets'
  },
  {
    label: 'App UI',
    title: 'Mobile App UI Design',
    description:
      'Need polished screens for onboarding, dashboard, and profile flows with clear hierarchy and conversion-focused interactions.',
    deliverables: 'UI kit, 12 high-fidelity screens, clickable prototype, handoff notes'
  }
];

const budgetSuggestions = ['5000', '10000', '25000', '50000'];

const CreateProject = () => {
  const { isClient } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Extract designerId from URL query params if available
  const queryParams = new URLSearchParams(location.search);
  const preselectedDesignerId = queryParams.get('designerId');
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    projectType: preselectedDesignerId ? 'direct' : 'bidding',
    designerId: preselectedDesignerId || '',
    budget: '',
    deliverables: '',
    deadline: ''
  });
  
  const [designers, setDesigners] = useState([]);
  const [selectedDesigner, setSelectedDesigner] = useState(null);
  const [loading, setLoading] = useState(false);
  const [designersLoading, setDesignersLoading] = useState(false);
  const [error, setError] = useState('');
  const [showOptionalFields, setShowOptionalFields] = useState(false);
  
  // Redirect if not a client
  useEffect(() => {
    if (!isClient) {
      navigate('/app/projects');
    }
  }, [isClient, navigate]);
  
  // Fetch designers
  useEffect(() => {
    const fetchDesigners = async () => {
      try {
        setDesignersLoading(true);
        const response = await api.get('/api/designers');
        setDesigners(response.data);
        
        // If a designer ID is preselected, find that designer's details
        if (preselectedDesignerId) {
          const designer = response.data.find(d => d._id === preselectedDesignerId);
          if (designer) {
            setSelectedDesigner(designer);
          }
        }
        
        setDesignersLoading(false);
      } catch (error) {
        console.error('Error fetching designers:', error);
        setDesignersLoading(false);
      }
    };
    
    fetchDesigners();
  }, [preselectedDesignerId]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'projectType') {
      setFormData({
        ...formData,
        projectType: value,
        designerId: value === 'direct' ? formData.designerId : ''
      });
      if (value !== 'direct') {
        setSelectedDesigner(null);
      }
      return;
    }

    setFormData({
      ...formData,
      [name]: value
    });
    
    // Update selected designer when designerId changes
    if (name === 'designerId' && value) {
      const designer = designers.find(d => d._id === value);
      setSelectedDesigner(designer || null);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.title || !formData.description || !formData.budget) {
      setError('Please fill in all required fields');
      return;
    }

    if (formData.projectType === 'direct' && !formData.designerId) {
      setError('Please select a designer for direct hire projects');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      const response = await api.post('/api/projects', {
        ...formData,
        designerId: formData.projectType === 'direct' ? formData.designerId : undefined,
        budget: parseFloat(formData.budget),
        deadline: formData.deadline || undefined
      });
      
      // Redirect to the new project page
      navigate(`/app/projects/${response.data.project._id}`);
    } catch (error) {
      console.error('Error creating project:', error);
      setError(error.response?.data?.error || 'Failed to create project. Please try again.');
      setLoading(false);
    }
  };

  const applyQuickStart = (template) => {
    setFormData((prev) => ({
      ...prev,
      title: template.title,
      description: template.description,
      deliverables: template.deliverables
    }));
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold text-cyan-700 bg-cyan-100 mb-3">
          Smart Project Composer
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Create New Project</h1>
        <p className="text-gray-600">
          Define essentials first, then optionally add details. Built for fast project posting.
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Project Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow border border-cyan-50 p-6">
            {error && (
              <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              <div className="mb-5">
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Quick Start Templates
                </label>
                <div className="flex flex-wrap gap-2">
                  {projectQuickStarts.map((template) => (
                    <button
                      key={template.label}
                      type="button"
                      className="px-3 py-1.5 rounded-full text-xs font-semibold text-slate-700 border border-slate-300 hover:border-cyan-400 hover:text-cyan-700 hover:bg-cyan-50 transition"
                      onClick={() => applyQuickStart(template)}
                    >
                      {template.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hiring Mode *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <label className={`border rounded-md p-3 cursor-pointer ${formData.projectType === 'direct' ? 'border-primary-500 bg-primary-50' : 'border-gray-300'}`}>
                    <input
                      type="radio"
                      name="projectType"
                      value="direct"
                      checked={formData.projectType === 'direct'}
                      onChange={handleChange}
                      className="mr-2"
                    />
                    <span className="font-medium text-gray-900">Direct Hire</span>
                    <p className="text-xs text-gray-600 mt-1">Invite one designer directly (existing flow).</p>
                  </label>
                  <label className={`border rounded-md p-3 cursor-pointer ${formData.projectType === 'bidding' ? 'border-primary-500 bg-primary-50' : 'border-gray-300'}`}>
                    <input
                      type="radio"
                      name="projectType"
                      value="bidding"
                      checked={formData.projectType === 'bidding'}
                      onChange={handleChange}
                      className="mr-2"
                    />
                    <span className="font-medium text-gray-900">Open Bidding</span>
                    <p className="text-xs text-gray-600 mt-1">Designers place bids, you select the best one.</p>
                  </label>
                </div>
              </div>

              <div className="mb-4">
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  Project Title *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="E.g., Logo Design for My Startup"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Project Description *
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows="5"
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Describe your project in detail, including your requirements and expectations..."
                  required
                ></textarea>
              </div>
              
              {formData.projectType === 'direct' && (
                <div className="mb-4">
                  <label htmlFor="designerId" className="block text-sm font-medium text-gray-700 mb-1">
                    Select Designer *
                  </label>
                  {designersLoading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-primary-600 mr-2"></div>
                      <span className="text-sm text-gray-500">Loading designers...</span>
                    </div>
                  ) : designers.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      No designers available. <Link to="/app/designers" className="text-primary-600 hover:text-primary-800">Browse designers</Link>
                    </p>
                  ) : (
                    <select
                      id="designerId"
                      name="designerId"
                      value={formData.designerId}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      required
                    >
                      <option value="">Select a designer</option>
                      {designers.map(designer => (
                        <option key={designer._id} value={designer._id}>
                          {designer.username} {designer.hourlyRate ? `(₹${designer.hourlyRate}/hr)` : ''}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}
              
              <div className="mb-4">
                <label htmlFor="budget" className="block text-sm font-medium text-gray-700 mb-1">
                  Budget (INR) *
                </label>
                <input
                  type="number"
                  id="budget"
                  name="budget"
                  value={formData.budget}
                  onChange={handleChange}
                  min="1"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter your budget"
                  required
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  {budgetSuggestions.map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      className="px-2.5 py-1 rounded-md text-xs font-medium border border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition"
                      onClick={() => setFormData((prev) => ({ ...prev, budget: amount }))}
                    >
                      ₹{Number(amount).toLocaleString('en-IN')}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-6 border border-gray-200 rounded-lg">
                <button
                  type="button"
                  className="w-full flex items-center justify-between px-4 py-3 text-left"
                  onClick={() => setShowOptionalFields((prev) => !prev)}
                >
                  <span className="text-sm font-semibold text-gray-800">Optional Details (deliverables, deadline)</span>
                  <span className="text-xs font-medium text-cyan-700">{showOptionalFields ? 'Hide' : 'Add'}</span>
                </button>

                {showOptionalFields && (
                  <div className="px-4 pb-4">
                    <div className="mb-4">
                      <label htmlFor="deliverables" className="block text-sm font-medium text-gray-700 mb-1">
                        Deliverables
                      </label>
                      <textarea
                        id="deliverables"
                        name="deliverables"
                        rows="3"
                        value={formData.deliverables}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        placeholder="List specific outputs (e.g., 3 logo concepts, source files, usage guide)"
                      ></textarea>
                    </div>

                    <div>
                      <label htmlFor="deadline" className="block text-sm font-medium text-gray-700 mb-1">
                        Deadline
                      </label>
                      <input
                        type="date"
                        id="deadline"
                        name="deadline"
                        value={formData.deadline}
                        onChange={handleChange}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex items-center justify-end space-x-3">
                <Link
                  to="/app/projects"
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
        
        {/* Designer Preview */}
        <div className="lg:col-span-1">
          {formData.projectType === 'direct' && selectedDesigner ? (
            <div className="bg-white rounded-lg shadow overflow-hidden sticky top-20">
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Selected Designer</h2>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <UserAvatar user={selectedDesigner} sizeClass="w-12 h-12" className="shadow-sm" />
                  </div>
                  
                  <div className="ml-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {selectedDesigner.username}
                    </h3>
                    
                    {selectedDesigner.averageRating > 0 && (
                      <div className="flex items-center mt-1">
                        <span className="text-yellow-500 mr-1">★</span>
                        <span className="text-sm">{selectedDesigner.averageRating.toFixed(1)}</span>
                        <span className="text-xs text-gray-500 ml-1">
                          ({selectedDesigner.ratings.length} reviews)
                        </span>
                      </div>
                    )}
                    
                    {selectedDesigner.hourlyRate && (
                      <p className="mt-1 text-sm text-gray-600">
                        Rate: ₹{selectedDesigner.hourlyRate}/hr
                      </p>
                    )}
                  </div>
                </div>
                
                {selectedDesigner.skills && selectedDesigner.skills.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Skills</h4>
                    <div className="flex flex-wrap">
                      {selectedDesigner.skills.map(skill => (
                        <span
                          key={skill._id || skill.name}
                          className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full mr-1 mb-1"
                        >
                          {skill.name} {skill.rate && `(₹${skill.rate}/hr)`}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {selectedDesigner.bio && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">About</h4>
                    <p className="text-sm text-gray-600 line-clamp-4">
                      {selectedDesigner.bio}
                    </p>
                  </div>
                )}
                
                <div className="mt-6">
                  <Link
                    to={`/app/designers/${selectedDesigner._id}`}
                    className="text-primary-600 hover:text-primary-800 text-sm font-medium"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View Full Profile →
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {formData.projectType === 'direct' ? 'Designer Preview' : 'Open Bidding Mode'}
              </h2>
              {formData.projectType === 'direct' ? (
                <>
                  <p className="text-gray-500">
                    Select a designer to see their details here.
                  </p>
                  <div className="mt-4">
                    <Link
                      to="/app/designers"
                      className="text-primary-600 hover:text-primary-800 text-sm font-medium"
                    >
                      Browse Designers →
                    </Link>
                  </div>
                </>
              ) : (
                <p className="text-gray-600 text-sm">
                  This project will be visible to designers. They can submit bids and proposals, and you can choose the best bid to start collaboration.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateProject;
