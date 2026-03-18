import { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';
import UserAvatar from '../common/UserAvatar';

const PROJECT_TYPE_LABELS = {
  logo: 'Logo Design',
  branding: 'Brand Identity',
  uiux: 'UI/UX',
  web: 'Web Design',
  mobile: 'Mobile App Design',
  illustration: 'Illustration',
  print: 'Print Design',
  other: 'Other'
};

const renderStarIcons = (count, sizeClass = 'w-5 h-5') => (
  <div className="flex items-center">
    {[1, 2, 3, 4, 5].map((star) => (
      <svg
        key={star}
        className={`${sizeClass} ${star <= count ? 'text-yellow-400' : 'text-gray-300'}`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3 .921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ))}
  </div>
);

const getProjectTypeLabel = (value) => PROJECT_TYPE_LABELS[value] || 'General Design';

const safeNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const DesignerProfile = () => {
  const { designerId } = useParams();
  const location = useLocation();
  const { currentUser, isClient } = useAuth();
  const navigate = useNavigate();
  const tabFromQuery = new URLSearchParams(location.search).get('tab');
  
  const [designer, setDesigner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(tabFromQuery === 'reviews' ? 'reviews' : 'portfolio');
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    title: '',
    projectType: '',
    communication: 5,
    timeliness: 5,
    valueForMoney: 5,
    wouldRecommend: true,
    review: ''
  });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');
  
  useEffect(() => {
    const fetchDesignerProfile = async () => {
      try {
        if (!designerId) {
          setError('Designer ID is required');
          setLoading(false);
          return;
        }

        setLoading(true);
        const response = await api.get(`/api/designers/${designerId}`);
        setDesigner(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching designer profile:', error);
        setError(error.response?.data?.error || 'Failed to load designer profile. Please try again.');
        setLoading(false);
      }
    };
    
    fetchDesignerProfile();
  }, [designerId]);

  useEffect(() => {
    if (tabFromQuery === 'reviews' || tabFromQuery === 'portfolio') {
      setActiveTab(tabFromQuery);
    }
  }, [tabFromQuery]);
  
  const handleReviewChange = (e) => {
    const { name, value, type, checked } = e.target;
    setReviewForm({
      ...reviewForm,
      [name]: type === 'checkbox'
        ? checked
        : ['rating', 'communication', 'timeliness', 'valueForMoney'].includes(name)
          ? parseInt(value)
          : value
    });
  };
  
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    
    if (!reviewForm.rating) {
      setReviewError('Please select a rating');
      return;
    }
    
    try {
      setSubmittingReview(true);
      setReviewError('');
      
      await api.post(`/api/designers/${designerId}/reviews`, reviewForm);
      
      // Refresh designer data to show the new review
      const response = await api.get(`/api/designers/${designerId}`);
      setDesigner(response.data);
      
      // Reset form
      setReviewForm({
        rating: 5,
        title: '',
        projectType: '',
        communication: 5,
        timeliness: 5,
        valueForMoney: 5,
        wouldRecommend: true,
        review: ''
      });
      
      setSubmittingReview(false);
    } catch (error) {
      console.error('Error submitting review:', error);
      setReviewError(error.response?.data?.error || 'Failed to submit review. Please try again.');
      setSubmittingReview(false);
    }
  };
  
  const handleHireClick = () => {
    navigate(`/app/projects/create?designerId=${designerId}`);
  };
  
  const handleMessageClick = () => {
    navigate(`/app/messages/${designerId}`);
  };

  const sortedRatings = useMemo(() => {
    const ratings = Array.isArray(designer?.ratings) ? [...designer.ratings] : [];
    return ratings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [designer?.ratings]);

  const reviewInsights = useMemo(() => {
    if (!sortedRatings.length) {
      return {
        total: 0,
        average: 0,
        recommendRate: 0,
        communicationAvg: null,
        timelinessAvg: null,
        valueAvg: null
      };
    }

    const total = sortedRatings.length;
    const avg = sortedRatings.reduce((sum, item) => sum + Number(item.rating || 0), 0) / total;

    const recommendCount = sortedRatings.filter((item) => item.wouldRecommend === true).length;
    const recommendRate = Math.round((recommendCount / total) * 100);

    const metricAverage = (key) => {
      const values = sortedRatings
        .map((item) => safeNumber(item[key]))
        .filter((value) => value !== null);
      if (!values.length) return null;
      return values.reduce((sum, value) => sum + value, 0) / values.length;
    };

    return {
      total,
      average: avg,
      recommendRate,
      communicationAvg: metricAverage('communication'),
      timelinessAvg: metricAverage('timeliness'),
      valueAvg: metricAverage('valueForMoney')
    };
  }, [sortedRatings]);
  
  if (loading) {
    return (
      <div className="container mx-auto px-6 py-16 max-w-7xl">
        <div className="flex items-center justify-center h-64">
          <div className="custom-spinner rounded-full h-14 w-14"></div>
        </div>
      </div>
    );
  }
  
  if (error || !designer) {
    return (
      <div className="container mx-auto px-6 py-16 max-w-7xl">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <p className="text-red-600 text-xl font-medium">{error || 'Designer not found'}</p>
          <Link to="/designers" className="mt-6 inline-block text-sky-500 hover:text-sky-600 font-medium transition-colors duration-300">
            Back to Designers
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <>
      <style>
        {`
          /* Card Fade-In Animation */
          .profile-card, .portfolio-card, .review-card {
            animation: slideUp 0.4s ease-out;
          }

          @keyframes slideUp {
            from { opacity: 0; transform: translateY(15px); }
            to { opacity: 1; transform: translateY(0); }
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

          /* Skill Tag Hover */
          .skill-tag {
            transition: transform 0.2s ease, background-color 0.2s ease;
          }
          .skill-tag:hover {
            transform: translateY(-2px);
            background-color: #e0f2fe; /* Lighter sky blue */
          }

          /* Star Rating Hover */
          .star-rating:hover {
            transform: scale(1.1);
          }

          /* Tab Hover */
          .tab-button {
            transition: all 0.3s ease;
          }
        `}
      </style>
      <div className="container mx-auto px-6 py-10 max-w-7xl">
        {/* Designer Header */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8 profile-card border border-slate-100">
          <div className="p-6 sm:p-8">
            <div className="flex flex-col md:flex-row md:items-start gap-6">
              <div className="flex-shrink-0 mb-6 md:mb-0">
                <UserAvatar user={designer} sizeClass="w-24 h-24" textClass="text-3xl font-semibold" className="shadow-md" bgClass="bg-sky-500 text-white" />
              </div>
              
              <div className="md:ml-8 flex-1">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between">
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
                      {designer.name || designer.username}
                    </h1>

                    {designer.professionalHeadline && (
                      <p className="mt-2 text-base text-sky-700 font-medium">{designer.professionalHeadline}</p>
                    )}
                    
                    {designer.averageRating > 0 && (
                      <div className="flex items-center mt-2">
                        {renderStarIcons(Math.round(designer.averageRating), 'w-5 h-5')}
                        <span className="text-sm font-medium text-gray-900 ml-2">
                          {designer.averageRating.toFixed(1)}
                        </span>
                        <span className="text-sm text-gray-500 ml-1">
                          ({Array.isArray(designer.ratings) ? designer.ratings.length : 0} reviews)
                        </span>
                      </div>
                    )}
                    
                    <p className="mt-3 text-sm text-gray-600">
                      Last active: {new Date(designer.lastActive).toLocaleString()}
                    </p>
                  </div>
                  
                  {designer.hourlyRate && (
                    <div className="mt-6 md:mt-0 md:text-right">
                      <p className="text-3xl font-bold text-gray-900">
                        ₹{designer.hourlyRate}/hr
                      </p>
                    </div>
                  )}
                </div>
                
                {designer.skills && designer.skills.length > 0 && (
                  <div className="mt-6">
                    <h2 className="text-sm font-medium text-gray-700 mb-3">Skills</h2>
                    <div className="flex flex-wrap gap-2">
                      {designer.skills.map(skill => (
                        <span
                          key={skill._id || skill.name}
                          className="skill-tag inline-flex items-center bg-sky-100 text-sky-800 text-sm font-medium px-4 py-1.5 rounded-full"
                        >
                          {skill.name} {skill.rate && `(₹${skill.rate}/hr)`}
                          {skill.proficiency ? ` • ${skill.proficiency}` : ''}
                          {skill.yearsExperience ? ` • ${skill.yearsExperience} yrs` : ''}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {designer.hiringPreference && (
                  <div className="mt-4">
                    <h2 className="text-sm font-medium text-gray-700 mb-1">Hiring Style Preference</h2>
                    <p className="text-sm text-gray-600 capitalize">{designer.hiringPreference}</p>
                  </div>
                )}
                
                {designer.bio && (
                  <div className="mt-6">
                    <h2 className="text-sm font-medium text-gray-700 mb-3">About</h2>
                    <p className="text-gray-600 leading-relaxed">{designer.bio}</p>
                  </div>
                )}
                
                {isClient && currentUser?._id !== designer._id && (
                  <div className="mt-6 flex flex-wrap gap-3">
                    <button
                      onClick={handleHireClick}
                      className="inline-flex items-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-lg shadow-md text-white bg-sky-500 hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 transition-all duration-300"
                    >
                      Hire for a Project
                    </button>
                    <button
                      onClick={handleMessageClick}
                      className="inline-flex items-center px-5 py-2.5 border border-gray-200 text-sm font-medium rounded-lg shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 transition-all duration-300"
                    >
                      Message
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-10 border border-slate-100">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('portfolio')}
                className={`tab-button py-4 px-8 text-center border-b-2 font-medium text-sm ${
                  activeTab === 'portfolio'
                    ? 'border-sky-500 text-sky-500'
                    : 'border-transparent text-gray-500 hover:text-sky-600 hover:border-sky-200'
                }`}
              >
                Portfolio
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={`tab-button py-4 px-8 text-center border-b-2 font-medium text-sm ${
                  activeTab === 'reviews'
                    ? 'border-sky-500 text-sky-500'
                    : 'border-transparent text-gray-500 hover:text-sky-600 hover:border-sky-200'
                }`}
              >
                Reviews
              </button>
            </nav>
          </div>
          
          <div className="p-6 md:p-8">
            {/* Portfolio Tab */}
            {activeTab === 'portfolio' && (
              <div>
                {designer.portfolio && designer.portfolio.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {designer.portfolio.map((item, index) => (
                      <div key={item._id || index} className="portfolio-card bg-white border border-gray-100 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col">
                        {item.imageUrl ? (
                          <img 
                            src={item.imageUrl} 
                            alt={item.title} 
                            className="w-full h-52 object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-full h-52 bg-slate-50 flex items-center justify-center px-4 text-center text-sm text-gray-500 border-b border-gray-200">
                            No image uploaded for this project. Use links below to view the work.
                          </div>
                        )}
                        <div className="p-5 flex-1 flex flex-col">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {item.title}
                          </h3>
                          {item.description && (
                            <p className="text-sm text-gray-600 line-clamp-3 flex-1">
                              {item.description}
                            </p>
                          )}

                          <div className="mt-4 flex flex-wrap gap-2">
                            {item.projectUrl && (
                              <a
                                href={item.projectUrl.startsWith('http') ? item.projectUrl : `https://${item.projectUrl}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium bg-sky-100 text-sky-700 hover:bg-sky-200"
                              >
                                Project Link
                              </a>
                            )}

                            {item.githubUrl && (
                              <a
                                href={item.githubUrl.startsWith('http') ? item.githubUrl : `https://${item.githubUrl}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium bg-gray-200 text-gray-800 hover:bg-gray-300"
                              >
                                GitHub
                              </a>
                            )}

                            {item.driveUrl && (
                              <a
                                href={item.driveUrl.startsWith('http') ? item.driveUrl : `https://${item.driveUrl}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium bg-green-100 text-green-800 hover:bg-green-200"
                              >
                                Drive
                              </a>
                            )}
                          </div>

                          <p className="text-xs text-gray-500 mt-4">
                            Added on {new Date(item.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <p className="text-gray-500 text-lg">No portfolio items yet.</p>
                  </div>
                )}
              </div>
            )}
            
            {/* Reviews Tab */}
            {activeTab === 'reviews' && (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Overall Rating</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{reviewInsights.average ? reviewInsights.average.toFixed(1) : 'New'}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Reviews</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{reviewInsights.total}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Would Recommend</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{reviewInsights.total ? `${reviewInsights.recommendRate}%` : '-'}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Response Quality</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{reviewInsights.communicationAvg ? reviewInsights.communicationAvg.toFixed(1) : '-'}</p>
                  </div>
                </div>

                {/* Review Form (for clients only) */}
                {isClient && currentUser?._id !== designer._id && (
                  <div className="mb-10 bg-gray-50 rounded-xl p-6 shadow-sm">
                    <h3 className="text-xl font-semibold text-gray-900 mb-6">
                      Leave a Review
                    </h3>
                    
                    <form onSubmit={handleReviewSubmit}>
                      {reviewError && (
                        <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
                          <p className="text-sm text-red-700">{reviewError}</p>
                        </div>
                      )}
                      
                      <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Rating
                        </label>
                        <div className="flex items-center">
                          {[1, 2, 3, 4, 5].map(star => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setReviewForm({...reviewForm, rating: star})}
                              className="p-1 focus:outline-none star-rating transition-transform duration-200"
                            >
                              <svg 
                                className={`w-8 h-8 ${
                                  star <= reviewForm.rating 
                                    ? 'text-yellow-400' 
                                    : 'text-gray-300'
                                }`} 
                                fill="currentColor" 
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3 .921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div>
                          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                            Review Title
                          </label>
                          <input
                            id="title"
                            name="title"
                            value={reviewForm.title}
                            onChange={handleReviewChange}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-sky-500 focus:border-sky-500 text-sm"
                            placeholder="Great communication and delivery"
                            maxLength={120}
                          />
                        </div>
                        <div>
                          <label htmlFor="projectType" className="block text-sm font-medium text-gray-700 mb-2">
                            Project Type
                          </label>
                          <select
                            id="projectType"
                            name="projectType"
                            value={reviewForm.projectType}
                            onChange={handleReviewChange}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-sky-500 focus:border-sky-500 text-sm"
                          >
                            <option value="">Select project type</option>
                            <option value="logo">Logo Design</option>
                            <option value="branding">Brand Identity</option>
                            <option value="uiux">UI/UX</option>
                            <option value="web">Web Design</option>
                            <option value="mobile">Mobile App Design</option>
                            <option value="illustration">Illustration</option>
                            <option value="print">Print Design</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Communication</label>
                          <select
                            name="communication"
                            value={reviewForm.communication}
                            onChange={handleReviewChange}
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500"
                          >
                            {[1, 2, 3, 4, 5].map((value) => (
                              <option key={value} value={value}>{value} / 5</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Timeliness</label>
                          <select
                            name="timeliness"
                            value={reviewForm.timeliness}
                            onChange={handleReviewChange}
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500"
                          >
                            {[1, 2, 3, 4, 5].map((value) => (
                              <option key={value} value={value}>{value} / 5</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Value for Money</label>
                          <select
                            name="valueForMoney"
                            value={reviewForm.valueForMoney}
                            onChange={handleReviewChange}
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500"
                          >
                            {[1, 2, 3, 4, 5].map((value) => (
                              <option key={value} value={value}>{value} / 5</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="mb-6">
                        <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-700">
                          <input
                            type="checkbox"
                            name="wouldRecommend"
                            checked={reviewForm.wouldRecommend}
                            onChange={handleReviewChange}
                            className="rounded border-gray-300 text-sky-500 focus:ring-sky-500"
                          />
                          I would recommend this designer
                        </label>
                      </div>
                      
                      <div className="mb-6">
                        <label htmlFor="review" className="block text-sm font-medium text-gray-700 mb-2">
                          Review (optional)
                        </label>
                        <textarea
                          id="review"
                          name="review"
                          rows="4"
                          value={reviewForm.review}
                          onChange={handleReviewChange}
                          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-sky-500 focus:border-sky-500 text-sm transition-all duration-300"
                          placeholder="Share your experience working with this designer..."
                        ></textarea>
                      </div>
                      
                      <button
                        type="submit"
                        disabled={submittingReview}
                        className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg shadow-md text-white bg-sky-500 hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {submittingReview ? 'Submitting...' : 'Submit Review'}
                      </button>
                    </form>
                  </div>
                )}
                
                {/* Reviews List */}
                {sortedRatings.length > 0 ? (
                  <div className="space-y-8">
                    {sortedRatings.map((rating) => {
                      const reviewer = rating?.userId && typeof rating.userId === 'object' ? rating.userId : null;
                      const reviewerName = reviewer?.name || reviewer?.username || 'Client';
                      const hasDetailScores = [rating?.communication, rating?.timeliness, rating?.valueForMoney].some((value) => safeNumber(value) !== null);

                      return (
                      <div key={rating._id} className="review-card border border-gray-100 rounded-xl p-5 bg-white shadow-sm">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-shrink-0">
                            <UserAvatar user={reviewer || { username: reviewerName }} sizeClass="w-12 h-12" className="shadow-sm" textClass="text-sm font-semibold" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-semibold text-gray-900">{reviewerName}</p>
                              {reviewer?.userType && (
                                <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 capitalize">{reviewer.userType}</span>
                              )}
                              {rating?.projectType && (
                                <span className="text-[11px] px-2 py-0.5 rounded-full bg-sky-100 text-sky-700">{getProjectTypeLabel(rating.projectType)}</span>
                              )}
                              {rating?.wouldRecommend === true && (
                                <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Recommended</span>
                              )}
                            </div>

                            <div className="flex items-center gap-3 mt-1">
                              {renderStarIcons(Number(rating.rating || 0), 'w-4 h-4')}
                              <p className="text-xs text-gray-500">
                                {new Date(rating.createdAt).toLocaleDateString()}
                              </p>
                            </div>

                            {rating?.title && (
                              <p className="mt-2 text-sm font-medium text-gray-800">{rating.title}</p>
                            )}

                            {rating.review && (
                              <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                                {rating.review}
                              </p>
                            )}

                            {hasDetailScores && (
                              <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                                <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2">
                                  <span className="text-slate-500">Communication</span>
                                  <p className="font-semibold text-slate-800">{rating.communication || '-'} / 5</p>
                                </div>
                                <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2">
                                  <span className="text-slate-500">Timeliness</span>
                                  <p className="font-semibold text-slate-800">{rating.timeliness || '-'} / 5</p>
                                </div>
                                <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2">
                                  <span className="text-slate-500">Value</span>
                                  <p className="font-semibold text-slate-800">{rating.valueForMoney || '-'} / 5</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );})}
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <p className="text-gray-500 text-lg">No reviews yet.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default DesignerProfile;