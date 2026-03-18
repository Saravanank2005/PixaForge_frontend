import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';
import { storeFile, retrieveFile, deleteFile } from '../../utils/fileStorage';
import FileList from '../common/FileList';
import FileDownload from '../common/FileDownload';
import UpiPayment from './UpiPayment';
import { DocumentIcon, ClockIcon, CurrencyDollarIcon, UserIcon, ChatBubbleLeftRightIcon, 
  CheckCircleIcon, FireIcon, StarIcon, CalendarIcon, PaperClipIcon, TagIcon, 
  ArrowPathIcon, ShieldCheckIcon, BellIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { CheckBadgeIcon } from '@heroicons/react/24/solid';
import '../../styles/animations.css';
import '../../styles/fileComponents.css';

const ProjectDetails = () => {
  const { projectId } = useParams();
  const { currentUser, isClient } = useAuth();
  const navigate = useNavigate();
  
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('details');
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState('');
  const [fileUpload, setFileUpload] = useState({
    name: '',
    file: null,
    githubUrl: '',
    driveUrl: '',
    uploadingImage: false,
    savingLinks: false,
    error: ''
  });
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [showTimeline, setShowTimeline] = useState(false);
  const [projectStats, setProjectStats] = useState({
    daysRemaining: 0,
    filesCount: 0,
    completionRate: 0,
    lastActivity: null
  });
  const [bidForm, setBidForm] = useState({
    amount: '',
    proposal: '',
    estimatedDays: '',
    submitting: false,
    error: ''
  });
  const [bidActionLoading, setBidActionLoading] = useState(false);

  const toValidDate = (value) => {
    if (!value) return null;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const parseTimelineDays = (timelineValue) => {
    if (timelineValue === null || timelineValue === undefined || timelineValue === '') return null;
    const parsed = Number.parseInt(String(timelineValue), 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  };

  const formatDateTime = (value, fallback = 'Not available') => {
    const parsed = value instanceof Date ? value : toValidDate(value);
    if (!parsed) return fallback;
    return parsed.toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateDaysRemaining = (projectData) => {
    if (!projectData) return 0;

    if (['completed', 'approved', 'cancelled'].includes(projectData.status)) {
      return 0;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let targetDate = toValidDate(projectData.deadline);

    if (!targetDate) {
      const createdAt = toValidDate(projectData.createdAt);
      const timelineDays = parseTimelineDays(projectData.timeline);
      if (createdAt && timelineDays) {
        targetDate = new Date(createdAt);
        targetDate.setDate(targetDate.getDate() + timelineDays);
      }
    }

    if (!targetDate) return 0;

    targetDate.setHours(0, 0, 0, 0);
    const diffMs = targetDate.getTime() - today.getTime();
    return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  };
  
  useEffect(() => {
    const fetchProject = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/api/projects/${projectId}`);
        const projectData = response.data;
        setProject(projectData);
        
        // Calculate project statistics
        let completionRate = 0;
        let daysRemaining = 0;
        let lastActivity = null;

        // Calculate days remaining from deadline or (createdAt + timeline days)
        daysRemaining = calculateDaysRemaining(projectData);
        
        // Calculate completion rate based on status
        switch(projectData.status) {
          case 'pending': completionRate = 10; break;
          case 'in-progress': completionRate = 40; break;
          case 'review': completionRate = 70; break;
          case 'completed': completionRate = 90; break;
          case 'approved': completionRate = 100; break;
          default: completionRate = 5;
        }
        
        // Get last activity date (most recent update)
        lastActivity = toValidDate(projectData.updatedAt) || toValidDate(projectData.createdAt);
        
        // Update project stats
        setProjectStats({
          daysRemaining,
          filesCount: projectData.files ? projectData.files.length : 0,
          completionRate,
          lastActivity
        });
        
        // Set progress percentage for the progress bar
        setProgressPercentage(completionRate);
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching project:', error);
        setError('Failed to load project. Please try again.');
        setLoading(false);
      }
    };
    
    if (projectId) {
      fetchProject();
    }
  }, [projectId]);

  useEffect(() => {
    if (!project || !currentUser || isClient) return;
    const existingBid = project.bids?.find((bid) => {
      const bidDesignerId = bid.designerId?._id || bid.designerId;
      return bidDesignerId?.toString() === currentUser._id?.toString();
    });

    if (existingBid) {
      setBidForm((prev) => ({
        ...prev,
        amount: existingBid.amount?.toString() || prev.amount,
        proposal: existingBid.proposal || prev.proposal,
        estimatedDays: existingBid.estimatedDays?.toString() || prev.estimatedDays
      }));
    }
  }, [project, currentUser, isClient]);
  
  // Status change and UPI update now handled by UpiPayment component
  
  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      const file = e.target.files[0];
      setFileUpload({
        ...fileUpload,
        name: file.name,
        file
      });
    }
  };
  
  // Function to create a file entry in the database after upload
  const createFileEntry = async (fileUrl, fileName) => {
    try {
      // Create a file entry in the database
      const fileData = {
        name: fileName,
        url: fileUrl,
        uploadedAt: new Date().toISOString()
      };
      
      // Add the file to the project
      const response = await api.post(`/api/projects/${projectId}/add-file`, fileData);
      return response.data;
    } catch (error) {
      console.error('Error creating file entry:', error);
      throw error;
    }
  };

  const normalizeUrl = (value) => {
    if (!value) return '';
    const trimmed = value.trim();
    if (!trimmed) return '';
    return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  };

  const buildLinkDisplayName = (url, typeLabel) => {
    try {
      const parsed = new URL(url);
      const host = parsed.hostname.replace(/^www\./, '');
      const path = parsed.pathname && parsed.pathname !== '/' ? parsed.pathname : '';
      return `${typeLabel}: ${host}${path}`;
    } catch {
      return `${typeLabel}: ${url.replace(/^https?:\/\//i, '')}`;
    }
  };

  const handleImageUpload = async () => {
    if (!fileUpload.name.trim()) {
      setFileUpload({
        ...fileUpload,
        error: 'Please enter an image name'
      });
      return;
    }

    if (!fileUpload.file) {
      setFileUpload({
        ...fileUpload,
        error: 'Please select an image file to upload'
      });
      return;
    }
    
    setFileUpload({
      ...fileUpload,
      uploadingImage: true,
      error: ''
    });
    
    try {
      // Check file size before uploading
      if (fileUpload.file.size > 2 * 1024 * 1024) { // 2MB limit
        throw new Error('File size exceeds 2MB limit. Please compress your image or choose a smaller file.');
      }

      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!validTypes.includes(fileUpload.file.type)) {
        throw new Error('Only image files (JPEG, PNG, GIF) are allowed');
      }

      // Store the file immediately using our utility
      await storeFile(fileUpload.name, fileUpload.file);
      console.log('File stored successfully in persistent storage:', fileUpload.name);

      // Create FormData for file upload to Cloudinary
      const formData = new FormData();
      formData.append('file', fileUpload.file);
      formData.append('filename', fileUpload.name);

      console.log('Uploading file:', fileUpload.name, 'Size:', fileUpload.file.size, 'Type:', fileUpload.file.type);

      // First attempt: Try uploading through our server endpoint
      try {
        const uploadResponse = await api.post(
          `/api/project-files/upload/${projectId}`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data'
            },
            timeout: 60000
          }
        );

        console.log('File uploaded through server:', uploadResponse.data);
      } catch (serverError) {
        console.error('Server upload failed, using fallback method:', serverError);

        // Fallback: add a temporary file entry so the user can continue
        const timestamp = new Date().getTime();
        const fallbackUrl = `https://res.cloudinary.com/demo/image/upload/v${timestamp}/${encodeURIComponent(fileUpload.name)}`;
        const newFile = {
          name: fileUpload.name,
          url: fallbackUrl,
          uploadedAt: new Date().toISOString(),
          isFallback: true
        };

        setProject(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            files: [...(prev.files || []), newFile]
          };
        });
      }

      // Refresh project data after upload
      const response = await api.get(`/api/projects/${projectId}`);
      setProject(response.data);

      // Reset image upload state only
      setFileUpload({
        ...fileUpload,
        name: '',
        file: null,
        uploadingImage: false,
        error: ''
      });

      // Clear the file input
      document.getElementById('file-upload').value = '';
    } catch (error) {
      console.error('Error uploading file:', error);
      let errorMessage = 'Failed to upload file. Please try again.';
      
      if (error.message) {
        errorMessage = error.message;
      } else if (error.response) {
        // Handle different status codes
        if (error.response.status === 500) {
          errorMessage = 'Server error. This could be due to temporary server issues or Cloudinary service limitations. Try uploading a smaller file or try again later.';
        } else if (error.response.status === 413) {
          errorMessage = 'File is too large for the server to process. Please use a smaller file.';
        } else if (error.response.data && error.response.data.error) {
          errorMessage = error.response.data.error;
        }
      }
      
      setFileUpload({
        ...fileUpload,
        uploadingImage: false,
        error: errorMessage
      });
    }
  };

  const handleSaveLinks = async () => {
    const normalizedGithubUrl = normalizeUrl(fileUpload.githubUrl);
    const normalizedDriveUrl = normalizeUrl(fileUpload.driveUrl);

    if (!normalizedGithubUrl && !normalizedDriveUrl) {
      setFileUpload({
        ...fileUpload,
        error: 'Please add at least one GitHub or Drive link'
      });
      return;
    }

    if (normalizedGithubUrl && !/^(https?:\/\/)?(www\.)?github\.com\/[\S]+$/i.test(normalizedGithubUrl)) {
      setFileUpload({
        ...fileUpload,
        error: 'Please enter a valid GitHub URL'
      });
      return;
    }

    if (normalizedDriveUrl && !/^(https?:\/\/)?(drive\.google\.com|docs\.google\.com)\/[\S]+$/i.test(normalizedDriveUrl)) {
      setFileUpload({
        ...fileUpload,
        error: 'Please enter a valid Google Drive/Docs URL'
      });
      return;
    }

    setFileUpload({
      ...fileUpload,
      savingLinks: true,
      error: ''
    });

    try {
      const linkRequests = [];

      if (normalizedGithubUrl) {
        linkRequests.push(
          api.post(`/api/projects/${projectId}/files`, {
            name: buildLinkDisplayName(normalizedGithubUrl, 'GitHub'),
            url: normalizedGithubUrl
          })
        );
      }

      if (normalizedDriveUrl) {
        linkRequests.push(
          api.post(`/api/projects/${projectId}/files`, {
            name: buildLinkDisplayName(normalizedDriveUrl, 'Drive'),
            url: normalizedDriveUrl
          })
        );
      }

      await Promise.all(linkRequests);

      const response = await api.get(`/api/projects/${projectId}`);
      setProject(response.data);

      setFileUpload({
        ...fileUpload,
        githubUrl: '',
        driveUrl: '',
        savingLinks: false,
        error: ''
      });
    } catch (err) {
      console.error('Error saving links:', err);
      setFileUpload({
        ...fileUpload,
        savingLinks: false,
        error: err.response?.data?.error || 'Failed to save links. Please try again.'
      });
    }
  };
  
  const handlePayment = async () => {
    try {
      const response = await api.post('/api/payments/create-payment-intent', {
        projectId: projectId
      });
      
      // In a real implementation, we would handle Stripe payment flow here
      // For now, we'll just refresh the project data
      const projectResponse = await api.get(`/api/projects/${projectId}`);
      setProject(projectResponse.data);
      
      // Show success message or redirect to payment success page
      alert('Payment processed successfully!');
    } catch (error) {
      console.error('Error processing payment:', error);
      alert(error.response?.data?.error || 'Failed to process payment. Please try again.');
    }
  };
  
  const handleMessageClick = () => {
    const otherUserId = isClient
      ? (project.designerId?._id || project.designerId)
      : (project.clientId?._id || project.clientId);

    if (!otherUserId) {
      alert('No designer is assigned yet. Accept a bid first to start direct collaboration chat.');
      return;
    }

    navigate(`/app/messages/${otherUserId}?projectId=${projectId}`);
  };

  const handleSubmitBid = async (e) => {
    e.preventDefault();

    if (!bidForm.amount || Number(bidForm.amount) <= 0) {
      setBidForm({ ...bidForm, error: 'Please enter a valid bid amount.' });
      return;
    }

    try {
      setBidForm({ ...bidForm, submitting: true, error: '' });
      await api.post(`/api/projects/${projectId}/bids`, {
        amount: Number(bidForm.amount),
        proposal: bidForm.proposal,
        estimatedDays: bidForm.estimatedDays ? Number(bidForm.estimatedDays) : undefined
      });

      const refreshed = await api.get(`/api/projects/${projectId}`);
      setProject(refreshed.data);
      setBidForm((prev) => ({ ...prev, submitting: false, error: '' }));
    } catch (err) {
      console.error('Error submitting bid:', err);
      setBidForm({
        ...bidForm,
        submitting: false,
        error: err.response?.data?.error || 'Failed to submit bid. Please try again.'
      });
    }
  };

  const handleAcceptBid = async (bidId) => {
    try {
      setBidActionLoading(true);
      await api.put(`/api/projects/${projectId}/bids/${bidId}/accept`);
      const refreshed = await api.get(`/api/projects/${projectId}`);
      setProject(refreshed.data);
    } catch (err) {
      console.error('Error accepting bid:', err);
      alert(err.response?.data?.error || 'Failed to accept bid. Please try again.');
    } finally {
      setBidActionLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 animate-fade-in">
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-6 py-1">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }
  
  if (error || !project) {
    return (
      <div className="container mx-auto px-4 py-8 animate-fade-in">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 animate-fade-in">
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
      </div>
    );
  }
  
  // No longer need the complex timeline rendering function since we've implemented a simpler timeline

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
      case 'approved':
        return 'bg-emerald-100 text-emerald-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8 animate-fade-in">
      {/* Project Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-500 px-6 py-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between">
          <div className="mb-4 md:mb-0">
            <h1 className="text-2xl font-bold text-white">{project.title}</h1>
            <p className="text-primary-100 mt-1 flex items-center">
              <ClockIcon className="h-4 w-4 mr-1" />
              Created on {new Date(project.createdAt).toLocaleDateString()}
            </p>
            <p className="text-primary-100 mt-1 text-sm">
              Mode: {project.projectType === 'bidding' ? 'Open Bidding' : 'Direct Hire'}
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeClass(project.status)}`}>
              {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
            </span>
            
            <button
              onClick={handleMessageClick}
              disabled={isClient && !project.designerId}
              className="btn-animated inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-primary-700 hover:bg-primary-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <ChatBubbleLeftRightIcon className="h-4 w-4 mr-1" />
              Message
            </button>
          </div>
        </div>
      </div>
      
      {/* Project Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex -mb-px">
          <button
            onClick={() => setActiveTab('details')}
            className={`tab-button py-4 px-6 text-center border-b-2 font-medium text-sm ${
              activeTab === 'details'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Details
          </button>
          
          <button
            onClick={() => setActiveTab('files')}
            className={`tab-button py-4 px-6 text-center border-b-2 font-medium text-sm ${
              activeTab === 'files'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Files
          </button>
          
          <button
            onClick={() => setActiveTab('payment')}
            className={`tab-button py-4 px-6 text-center border-b-2 font-medium text-sm ${
              activeTab === 'payment'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Payment
          </button>
        </nav>
      </div>
      
      {/* Tab Content */}
      <div className="p-6">
        {/* Details Tab */}
        {activeTab === 'details' && (
          <div className="animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Project Description
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <p className="text-gray-700 whitespace-pre-line">{project.description}</p>
                </div>

                {project.projectType === 'bidding' && project.status === 'pending' && !project.designerId && (
                  <div className="bg-white rounded-xl shadow-sm p-5 mb-6 border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Bidding</h3>

                    {!isClient ? (
                      <form onSubmit={handleSubmitBid}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <input
                            type="number"
                            min="1"
                            step="0.01"
                            placeholder="Your bid amount"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            value={bidForm.amount}
                            onChange={(e) => setBidForm({ ...bidForm, amount: e.target.value })}
                            required
                          />
                          <input
                            type="number"
                            min="1"
                            placeholder="Estimated days"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            value={bidForm.estimatedDays}
                            onChange={(e) => setBidForm({ ...bidForm, estimatedDays: e.target.value })}
                          />
                        </div>
                        <textarea
                          rows="3"
                          placeholder="Proposal (why you are a good fit)"
                          className="w-full mt-4 px-3 py-2 border border-gray-300 rounded-md"
                          value={bidForm.proposal}
                          onChange={(e) => setBidForm({ ...bidForm, proposal: e.target.value })}
                        ></textarea>
                        {bidForm.error && <p className="text-sm text-red-600 mt-2">{bidForm.error}</p>}
                        <div className="mt-4 flex justify-end">
                          <button
                            type="submit"
                            disabled={bidForm.submitting}
                            className="px-4 py-2 rounded-md text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
                          >
                            {bidForm.submitting ? 'Submitting...' : 'Place / Update Bid'}
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div>
                        <p className="text-sm text-gray-600 mb-4">
                          Review bids and accept one designer to start collaboration.
                        </p>
                        {(project.bids?.length || 0) === 0 ? (
                          <p className="text-sm text-gray-500">No bids yet.</p>
                        ) : (
                          <div className="space-y-3">
                            {project.bids.map((bid) => (
                              <div key={bid._id} className="border rounded-md p-3 bg-gray-50">
                                <div className="flex justify-between items-start gap-3">
                                  <div>
                                    <p className="font-medium text-gray-900">{bid.designerId?.username || 'Designer'}</p>
                                    <p className="text-sm text-gray-600">Bid: ₹{bid.amount}</p>
                                    {bid.estimatedDays && (
                                      <p className="text-sm text-gray-600">ETA: {bid.estimatedDays} days</p>
                                    )}
                                    {bid.proposal && <p className="text-sm text-gray-700 mt-2">{bid.proposal}</p>}
                                  </div>
                                  <button
                                    onClick={() => handleAcceptBid(bid._id)}
                                    disabled={bidActionLoading}
                                    className="px-3 py-1.5 rounded-md text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
                                  >
                                    Accept Bid
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
                
                {/* Project Timeline - Styled to match the design */}
                <div className="bg-white rounded-xl shadow-sm p-5 mb-6 border border-gray-100">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <CalendarIcon className="h-5 w-5 mr-2 text-blue-500" />
                      Project Timeline
                    </h3>
                    <button 
                      onClick={() => setShowTimeline(!showTimeline)}
                      className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors duration-200 flex items-center text-sm font-medium"
                    >
                      {showTimeline ? 'Hide Timeline' : 'Show Timeline'}
                    </button>
                  </div>
                  
                  {showTimeline && (
                    <div className="relative border-l-2 border-blue-200 ml-4 pl-6 pb-2">
                      {/* Project Created Event */}
                      <div className="mb-6 relative">
                        <div className="absolute -left-[11px] mt-1.5 w-5 h-5 rounded-full bg-blue-500 border-4 border-white shadow"></div>
                        <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                          <div className="flex items-center mb-2">
                            <DocumentIcon className="h-5 w-5 text-blue-500" />
                            <h4 className="text-md font-medium text-gray-900 ml-2">Project Created</h4>
                          </div>
                          <p className="text-sm text-gray-500">
                            {formatDateTime(project.createdAt)}
                          </p>
                        </div>
                      </div>
                      
                      {/* Current Status Event */}
                      <div className="relative">
                        <div className="absolute -left-[11px] mt-1.5 w-5 h-5 rounded-full bg-green-500 border-4 border-white shadow animate-pulse"></div>
                        <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                          <div className="flex items-center mb-2">
                            <ArrowPathIcon className="h-5 w-5 text-green-500" />
                            <h4 className="text-md font-medium text-gray-900 ml-2">Current Status: <span className="capitalize">{project.status}</span></h4>
                          </div>
                          <p className="text-sm text-gray-500">
                            Last updated: {formatDateTime(project.updatedAt, 'Not available')}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="md:col-span-1">
                {/* Project Progress Card */}
                <div className="bg-white rounded-xl shadow-sm p-5 mb-6 border border-gray-100 hover:shadow-md transition-shadow duration-300">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <ChartBarIcon className="h-5 w-5 text-blue-500 mr-2" />
                    Project Progress
                  </h3>
                  
                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-3 mb-3 mt-4">
                    <div 
                      className="bg-blue-600 h-3 rounded-full transition-all duration-1000 ease-out" 
                      style={{ width: `${progressPercentage}%` }}
                    ></div>
                  </div>
                  <p className="text-right text-sm font-medium text-gray-600">{progressPercentage}% Complete</p>
                  
                  {/* Project Stats */}
                  <div className="mt-5 space-y-3">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600 flex items-center">
                        <CalendarIcon className="h-4 w-4 text-blue-500 mr-2" />
                        Days Remaining
                      </span>
                      <span className="text-sm font-semibold bg-white px-3 py-1 rounded-md shadow-sm">{projectStats.daysRemaining}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600 flex items-center">
                        <PaperClipIcon className="h-4 w-4 text-blue-500 mr-2" />
                        Files Uploaded
                      </span>
                      <span className="text-sm font-semibold bg-white px-3 py-1 rounded-md shadow-sm">{projectStats.filesCount}</span>
                    </div>
                    {projectStats.lastActivity && (
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-600 flex items-center">
                          <ArrowPathIcon className="h-4 w-4 text-blue-500 mr-2" />
                          Last Activity
                        </span>
                        <span className="text-sm font-semibold bg-white px-3 py-1 rounded-md shadow-sm">
                          {formatDateTime(projectStats.lastActivity)}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* No timeline toggle button needed here anymore */}
                </div>
                
                {/* Project Details Card */}
                <div className="bg-white rounded-xl shadow-sm p-5 mb-6 border border-gray-100 hover:shadow-md transition-shadow duration-300">
                  <h3 className="text-lg font-semibold text-gray-900 mb-5 flex items-center">
                    <DocumentIcon className="h-5 w-5 text-blue-500 mr-2" />
                    Project Details
                  </h3>
                  
                  <div className="space-y-5">
                    {/* Budget */}
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-green-100 p-3 rounded-full">
                        <CurrencyDollarIcon className="h-5 w-5 text-green-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Budget</p>
                        <p className="text-xl font-semibold text-gray-900">₹{project.budget}</p>
                      </div>
                    </div>
                    
                    {/* Timeline */}
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-blue-100 p-3 rounded-full">
                        <ClockIcon className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Timeline</p>
                        <p className="text-xl font-semibold text-gray-900">
                          {parseTimelineDays(project.timeline) ? `${parseTimelineDays(project.timeline)} days` : 'Not set'}
                        </p>
                      </div>
                    </div>
                    
                    {/* User */}
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-purple-100 p-3 rounded-full">
                        <UserIcon className="h-5 w-5 text-purple-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">{isClient ? 'Designer' : 'Client'}</p>
                        <p className="text-xl font-semibold text-gray-900">
                          {isClient 
                            ? (project.designerId?.username || project.designer?.username || project.designer?.name || 'Not selected yet') 
                            : (project.clientId?.username || project.client?.username || project.client?.name || 'Client')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Status Change Section - Now handled by UpiPayment component in the Payment tab */}
                {((isClient && project.status === 'completed') || 
                  (!isClient && (project.status === 'in_progress' || project.status === 'accepted'))) && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Project Status Management
                    </h3>
                    
                    <p className="text-gray-600 mb-4">
                      {!isClient && project.status === 'accepted' && 
                        "You've accepted this project. Go to the Payment tab to add your UPI ID and start working on this project."}
                      {!isClient && project.status === 'in_progress' && 
                        "You're currently working on this project. When finished, go to the Payment tab to mark it as completed."}
                      {isClient && project.status === 'completed' && 
                        "The designer has completed this project. Please go to the Payment tab to make payment and approve the project."}
                    </p>
                    
                    <div className="flex justify-center">
                      <button
                        onClick={() => setActiveTab('payment')}
                        className="btn-animated inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                      >
                        Go to Payment Tab
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Timeline feature temporarily removed to fix production build errors */}
            </div>
          </div>
        )}
        
        {/* Files Tab */}
        {activeTab === 'files' && (
          <div className="animate-fade-in">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Project Files
            </h3>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
              {/* File upload form */}
              <div className="xl:col-span-5 file-upload-form mb-0">
                <div className="grid grid-cols-1 gap-6">
                  <section>
                    <div className="file-upload-header">
                      <h3>Upload Images</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input
                        type="text"
                        id="file-name"
                        placeholder="Image name"
                        value={fileUpload.name}
                        onChange={(e) => setFileUpload({ ...fileUpload, name: e.target.value })}
                        className="form-input"
                      />

                      <input
                        type="file"
                        id="file-upload"
                        onChange={handleFileChange}
                        className="form-input"
                      />
                    </div>

                    <div className="mt-4 flex justify-end">
                      <button
                        type="button"
                        onClick={handleImageUpload}
                        disabled={fileUpload.uploadingImage || fileUpload.savingLinks}
                        className="btn-animated inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                      >
                        {fileUpload.uploadingImage ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Uploading Image...
                          </>
                        ) : (
                          'Upload Image'
                        )}
                      </button>
                    </div>
                  </section>

                  <section>
                    <div className="file-upload-header">
                      <h3>Save External Links</h3>
                    </div>

                    <div className="grid grid-cols-1 gap-4 mt-4">
                      <input
                        type="url"
                        placeholder="GitHub URL (optional)"
                        value={fileUpload.githubUrl}
                        onChange={(e) => setFileUpload({ ...fileUpload, githubUrl: e.target.value })}
                        className="form-input"
                      />
                      <input
                        type="url"
                        placeholder="Google Drive URL (optional)"
                        value={fileUpload.driveUrl}
                        onChange={(e) => setFileUpload({ ...fileUpload, driveUrl: e.target.value })}
                        className="form-input"
                      />
                    </div>

                    {fileUpload.error && (
                      <div className="mt-2 text-sm text-red-600">{fileUpload.error}</div>
                    )}

                    <div className="mt-4 flex justify-end">
                      <button
                        type="button"
                        onClick={handleSaveLinks}
                        disabled={fileUpload.savingLinks || fileUpload.uploadingImage}
                        className="btn-animated inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                      >
                        {fileUpload.savingLinks ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Saving Links...
                          </>
                        ) : (
                          'Save Links'
                        )}
                      </button>
                    </div>
                  </section>
                </div>
              </div>

              {/* File list with download functionality */}
              <div className="xl:col-span-7">
                <FileList
                  projectId={projectId}
                  files={project.files}
                  title="Available Files"
                  showTitle={true}
                  className="file-list-container stagger-list"
                  onFileDeleted={async () => {
                    // Refresh project data after file deletion
                    try {
                      const response = await api.get(`/api/projects/${projectId}`);
                      setProject(response.data);
                    } catch (error) {
                      console.error('Error refreshing project data:', error);
                    }
                  }}
                />
              </div>
            </div>
          </div>
        )}
        
        {/* Payment Tab */}
        {activeTab === 'payment' && (
          <div className="animate-fade-in">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Payment Information
            </h3>
            
            <div className="glass-card p-4 mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-700">Project Budget:</span>
                <span className="font-semibold text-gray-900">₹{project.budget}</span>
              </div>
              
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-700">Payment Status:</span>
                <span className={`font-semibold ${
                  project.status === 'approved' 
                    ? 'text-green-600' 
                    : 'text-yellow-600'
                }`}>
                  {project.status === 'approved' ? 'Paid & Approved' : 'Pending'}
                </span>
              </div>
              
              {project.upiId && (
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-700">Designer UPI ID:</span>
                  <span className="text-gray-900 font-mono">{project.upiId}</span>
                </div>
              )}
              
              {project.approvedAt && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Approved On:</span>
                  <span className="text-gray-900">{new Date(project.approvedAt).toLocaleDateString()}</span>
                </div>
              )}
            </div>
            
            {/* UPI Payment Component */}
            <UpiPayment 
              project={project} 
              isClient={isClient} 
              onStatusChange={(newStatus) => {
                // Refresh project data after status change
                const fetchProject = async () => {
                  try {
                    const response = await api.get(`/api/projects/${projectId}`);
                    setProject(response.data);
                  } catch (error) {
                    console.error('Error fetching project:', error);
                  }
                };
                fetchProject();
              }}
              onRefresh={() => {
                // Refresh project data
                const fetchProject = async () => {
                  try {
                    const response = await api.get(`/api/projects/${projectId}`);
                    setProject(response.data);
                  } catch (error) {
                    console.error('Error fetching project:', error);
                  }
                };
                fetchProject();
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectDetails;
