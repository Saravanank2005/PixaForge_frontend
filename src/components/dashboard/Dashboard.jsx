import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';
import { motion } from 'framer-motion';
import { formatDate } from '../../utils/formatters';

const Dashboard = () => {
  const { currentUser, isClient, isDesigner } = useAuth();
  const [stats, setStats] = useState({
    projects: { total: 0, active: 0 },
    messages: { total: 0, unread: 0 },
    designers: { total: 0, nearby: 0 }
  });
  const [recentProjects, setRecentProjects] = useState([]);
  const [recentMessages, setRecentMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch data in parallel
        const [projectsRes, conversationsRes] = await Promise.all([
          api.get('/api/projects'),
          api.get('/api/messages/conversations')
        ]);
        
        // Process projects data
        const projects = projectsRes.data;
        const activeProjects = projects.filter(project => 
          ['pending', 'accepted', 'in_progress'].includes(project.status)
        );
        setRecentProjects(projects.slice(0, 3));
        
        // Process messages data
        const conversations = conversationsRes.data;
        setRecentMessages(conversations.slice(0, 3));
        const unreadCount = conversations.reduce(
          (total, conv) => total + (conv.unreadCount || 0), 0
        );
        
        // Set basic stats that don't require geolocation
        const baseStats = {
          projects: { 
            total: projects.length, 
            active: activeProjects.length 
          },
          messages: { 
            total: conversations.length, 
            unread: unreadCount 
          },
          designers: { total: 0, nearby: 0 }
        };
        
        // Update stats immediately with what we have
        setStats(baseStats);
        
        // For clients only: fetch designer stats with geolocation
        if (isClient) {
          try {
            const position = await new Promise((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject, {
                timeout: 10000,
                maximumAge: 60000
              });
            });
            
            // Fetch designer stats in parallel
            const [designersRes, nearbyDesignersRes] = await Promise.all([
              api.get('/api/designers'),
              api.get('/api/designers', {
                params: {
                  lat: position.coords.latitude,
                  lng: position.coords.longitude,
                  maxDistance: 50000
                }
              })
            ]);
            
            // Update stats with designer information
            setStats({
              ...baseStats,
              designers: {
                total: designersRes.data.length,
                nearby: nearbyDesignersRes.data.length
              }
            });
          } catch (geoError) {
            console.error('Geolocation error:', geoError);
            // Still fetch all designers even if geolocation fails
            try {
              const designersRes = await api.get('/api/designers');
              setStats({
                ...baseStats,
                designers: {
                  total: designersRes.data.length,
                  nearby: 0
                }
              });
            } catch (designerError) {
              console.error('Error fetching designers:', designerError);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [isClient, isDesigner]);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-16 h-16">
          <svg className="animate-spin w-full h-full text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="dashboard-container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Stats Cards */}
            <div className="stat-card">
              <div className="stat-icon bg-primary-100 text-primary-600 dark:bg-opacity-20">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"></path>
                </svg>
              </div>
              <div className="stat-title">Active Projects</div>
              <div className="stat-value">{stats.projects.active}</div>
              <div className="stat-change positive">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path>
                </svg>
                10% increase
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon bg-secondary-100 text-secondary-600 dark:bg-opacity-20">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z"></path>
                  <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z"></path>
                </svg>
              </div>
              <div className="stat-title">Unread Messages</div>
              <div className="stat-value">{stats.messages.unread}</div>
              <div className="stat-change positive">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path>
                </svg>
                5% increase
              </div>
            </div>

            {isClient && (
              <div className="stat-card">
                <div className="stat-icon bg-green-100 text-green-600 dark:bg-opacity-20">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"></path>
                  </svg>
                </div>
                <div className="stat-title">Available Designers</div>
                <div className="stat-value">{stats.designers.total}</div>
                <div className="stat-change positive">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path>
                  </svg>
                  12% increase
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Recent Projects Section */}
        <div className="glass p-6 rounded-lg mt-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold flex items-center">
              <span className="p-2 rounded-lg bg-primary-100 text-primary-600 mr-3 dark:bg-opacity-20">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"></path>
                </svg>
              </span>
              Recent Projects
            </h2>
            <Link to="/app/projects" className="btn btn-primary text-sm">
              View All Projects
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
              </svg>
            </Link>
          </div>
          
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="skeleton h-40 rounded-lg"></div>
              ))}
            </div>
          ) : recentProjects.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
              <h3 className="text-lg font-medium mb-2">No projects yet</h3>
              <p className="text-gray-500 mb-6">Start creating your first project to see it here</p>
              {isClient && (
                <Link to="/app/projects/create" className="btn btn-primary">
                  Create New Project
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentProjects.map((project, index) => (
                <Link 
                  key={project?._id || index} 
                  to={`/app/projects/${project?._id}`}
                  className="card hover-shadow-pop"
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className={`badge ${getStatusBadgeClass(project?.status || 'pending')}`}>
                        {project?.status || 'pending'}
                      </span>
                      <span className="text-sm text-gray-500">
                        {new Date(project?.createdAt || Date.now()).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{project?.title || 'Untitled Project'}</h3>
                    <p className="text-gray-600 mb-4 line-clamp-2">{project?.description || 'No description available'}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="avatar mr-2">
                          {isClient ? 
                            (project.designer?.username?.charAt(0) || 'D') : 
                            (project.client?.username?.charAt(0) || 'C')}
                        </div>
                        <span className="text-sm">
                          {isClient ? 
                            (project.designer?.username || 'No designer yet') : 
                            (project.client?.username || 'Unknown client')}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500">
                        ${project?.budget || '0'}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
        
        {/* Recent Messages Section */}
        <div className="glass p-6 rounded-lg mt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center">
              <span className="p-2 rounded-lg bg-secondary-100 text-secondary-600 mr-3 dark:bg-opacity-20">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z"></path>
                  <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z"></path>
                </svg>
              </span>
              Recent Messages
            </h2>
            <Link to="/app/messages" className="btn btn-primary text-sm">
              View All Messages
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
              </svg>
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// Helper function to get status badge class
const getStatusBadgeClass = (status) => {
  const classes = {
    completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    accepted: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
    rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
  };
  
  return classes[status] || 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
};

// Helper function to get message partner info (id, name, initial)
const getMessagePartnerInfo = (message, currentUser) => {
  if (!message || !currentUser) {
    return { id: null, name: 'Unknown User', initial: '?' };
  }
  
  // Determine if current user is sender or recipient
  const isUserSender = message.sender?._id === currentUser._id;
  const partner = isUserSender ? message.recipient : message.sender;
  
  if (!partner) {
    return { id: null, name: 'Unknown User', initial: '?' };
  }
  
  return {
    id: partner._id,
    name: partner.name || partner.username || (isUserSender ? 'Recipient' : 'Sender'),
    initial: (partner.name || partner.username || '?').charAt(0).toUpperCase()
  };
};

// Export utility functions for reuse in other components
export { getStatusBadgeClass, getMessagePartnerInfo };

export default Dashboard;