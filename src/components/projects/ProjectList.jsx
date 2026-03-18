import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';

const ProjectList = () => {
  const { isClient, isDesigner, currentUser } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [designerView, setDesignerView] = useState('assigned');
  const [retryCount, setRetryCount] = useState(0);

  const isTimeoutError = (requestError) => {
    if (!requestError) return false;
    if (requestError.code === 'ECONNABORTED') return true;
    const message = typeof requestError.message === 'string' ? requestError.message.toLowerCase() : '';
    return message.includes('timeout');
  };

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/api/projects', { timeout: 15000 });
      setProjects(response.data);
    } catch (requestError) {
      console.error('Error fetching projects:', requestError);
      if (isTimeoutError(requestError)) {
        setError('Request timed out while loading projects. Please retry in a moment.');
      } else {
        setError('Failed to fetch projects. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchProjects();
  }, [retryCount]);
  
  const assignedProjects = projects.filter((project) => {
    const assignedDesignerId = project.designerId?._id || project.designerId;
    if (!assignedDesignerId || !currentUser?._id) return false;
    return String(assignedDesignerId) === String(currentUser._id);
  });

  const openBidProjects = projects.filter((project) => (
    project.projectType === 'bidding' &&
    project.status === 'pending' &&
    !project.designerId
  ));

  const baseProjects = isDesigner
    ? (designerView === 'open-bids' ? openBidProjects : designerView === 'all' ? projects : assignedProjects)
    : projects;

  // Filter projects based on status
  const filteredProjects = statusFilter === 'all'
    ? baseProjects
    : baseProjects.filter(project => project.status === statusFilter);
  
  // Get status badge color
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'accepted':
        return 'bg-purple-100 text-purple-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">My Projects</h1>
          <p className="text-gray-600">
            {isClient
              ? "Manage your design projects and track their progress."
              : "View and manage the design projects you're working on."}
          </p>
        </div>
        
        {isClient && (
          <Link
            to="/app/projects/create"
            className="mt-4 md:mt-0 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Create New Project
          </Link>
        )}
      </div>

      {isDesigner && (
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm font-medium text-gray-700 mr-2">View:</span>
            <button
              onClick={() => setDesignerView('assigned')}
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                designerView === 'assigned'
                  ? 'bg-primary-100 text-primary-800'
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
            >
              Assigned Projects ({assignedProjects.length})
            </button>
            <button
              onClick={() => {
                setDesignerView('open-bids');
                setStatusFilter('all');
              }}
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                designerView === 'open-bids'
                  ? 'bg-cyan-100 text-cyan-800'
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
            >
              Open Bids ({openBidProjects.length})
            </button>
            <button
              onClick={() => setDesignerView('all')}
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                designerView === 'all'
                  ? 'bg-indigo-100 text-indigo-800'
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
            >
              All Visible ({projects.length})
            </button>
          </div>
        </div>
      )}
      
      {/* Status Filter */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap items-center">
          <span className="text-sm font-medium text-gray-700 mr-4">Filter by status:</span>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                statusFilter === 'all'
                  ? 'bg-primary-100 text-primary-800'
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                statusFilter === 'pending'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setStatusFilter('accepted')}
              disabled={isDesigner && designerView === 'open-bids'}
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                statusFilter === 'accepted'
                  ? 'bg-purple-100 text-purple-800'
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
            >
              Accepted
            </button>
            <button
              onClick={() => setStatusFilter('in_progress')}
              disabled={isDesigner && designerView === 'open-bids'}
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                statusFilter === 'in_progress'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
            >
              In Progress
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              disabled={isDesigner && designerView === 'open-bids'}
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                statusFilter === 'completed'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
            >
              Completed
            </button>
            <button
              onClick={() => setStatusFilter('cancelled')}
              disabled={isDesigner && designerView === 'open-bids'}
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                statusFilter === 'cancelled'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
            >
              Cancelled
            </button>
          </div>
        </div>
        {isDesigner && designerView === 'open-bids' && (
          <p className="text-xs text-gray-500 mt-3">Open bidding projects are always in pending status.</p>
        )}
      </div>
      
      {/* Projects List */}
      {loading ? (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading projects...</p>
        </div>
      ) : error ? (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-red-500">{error}</p>
          <button
            onClick={() => setRetryCount((count) => count + 1)}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Retry
          </button>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-gray-500">
            {statusFilter === 'all'
              ? 'You have no projects yet.'
              : `You have no ${statusFilter} projects.`}
          </p>
          {isClient && statusFilter === 'all' && (
            <Link
              to="/app/projects/create"
              className="mt-4 inline-block text-primary-600 hover:text-primary-800 font-medium"
            >
              Create your first project
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project, index) => (
            <Link
              key={`${project._id}-${index}`}
              to={`/app/projects/${project._id}`}
              className="bg-white rounded-lg shadow overflow-hidden hover:shadow-md transition-shadow duration-200"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900 mb-1 truncate">
                    {project.title}
                  </h2>
                  <div className="flex gap-2 ml-2 flex-wrap justify-end">
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeClass(project.status)}`}>
                      {project.status.replace('_', ' ')}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded-full ${project.projectType === 'bidding' ? 'bg-cyan-100 text-cyan-800' : 'bg-indigo-100 text-indigo-800'}`}>
                      {project.projectType === 'bidding' ? 'bidding' : 'direct'}
                    </span>
                  </div>
                </div>
                
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {project.description}
                </p>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">
                      Budget: <span className="font-semibold text-gray-900">₹{project.budget}</span>
                    </p>
                    {project.projectType === 'bidding' && (
                      <p className="text-sm text-gray-500">
                        Bids: <span className="font-semibold text-gray-900">{project.bids?.length || 0}</span>
                      </p>
                    )}
                    {project.deadline && (
                      <p className="text-sm text-gray-500">
                        Deadline: <span className="font-semibold text-gray-900">
                          {new Date(project.deadline).toLocaleDateString()}
                        </span>
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs font-medium">
                      {isClient 
                        ? project.designerId?.username?.charAt(0).toUpperCase() || 'B'
                        : project.clientId?.username?.charAt(0).toUpperCase() || 'C'
                      }
                    </div>
                    <span className="ml-2 text-sm text-gray-700 truncate max-w-[100px]">
                      {isClient 
                        ? project.designerId?.username || (project.projectType === 'bidding' ? 'Open Bids' : 'Designer')
                        : project.clientId?.username || 'Client'
                      }
                    </span>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                  <span className="text-xs text-gray-500">
                    Created: {new Date(project.createdAt).toLocaleDateString()}
                  </span>
                  <span className="text-primary-600 text-sm font-medium">View details →</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectList;
