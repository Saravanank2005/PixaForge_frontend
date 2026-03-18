import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';
import UserAvatar from '../common/UserAvatar';

const DesignerProfile = () => {
  const { designerId } = useParams();
  const { currentUser, isClient } = useAuth();
  const navigate = useNavigate();
  
  const [designer, setDesigner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('portfolio');
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
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
  
  const handleReviewChange = (e) => {
    const { name, value } = e.target;
    setReviewForm({
      ...reviewForm,
      [name]: name === 'rating' ? parseInt(value) : value
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
      <div className="container mx-auto px-6 py-16 max-w-7xl">
        {/* Designer Header */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-10 profile-card">
          <div className="p-8 sm:p-10">
            <div className="flex flex-col md:flex-row md:items-start">
              <div className="flex-shrink-0 mb-6 md:mb-0">
                <UserAvatar user={designer} sizeClass="w-28 h-28" textClass="text-4xl font-semibold" className="shadow-md" bgClass="bg-sky-500 text-white" />
              </div>
              
              <div className="md:ml-8 flex-1">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                      {designer.username}
                    </h1>

                    {designer.professionalHeadline && (
                      <p className="mt-2 text-base text-sky-700 font-medium">{designer.professionalHeadline}</p>
                    )}
                    
                    {designer.averageRating > 0 && (
                      <div className="flex items-center mt-2">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map(star => (
                            <svg 
                              key={star}
                              className={`w-6 h-6 star-rating transition-transform duration-200 ${
                                star <= Math.round(designer.averageRating) 
                                  ? 'text-yellow-400' 
                                  : 'text-gray-300'
                              }`} 
                              fill="currentColor" 
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                        <span className="text-sm font-medium text-gray-900 ml-2">
                          {designer.averageRating.toFixed(1)}
                        </span>
                        <span className="text-sm text-gray-500 ml-1">
                          ({designer.ratings.length} reviews)
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
                  <div className="mt-8 flex flex-wrap gap-4">
                    <button
                      onClick={handleHireClick}
                      className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg shadow-md text-white bg-sky-500 hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 transition-all duration-300"
                    >
                      Hire for a Project
                    </button>
                    <button
                      onClick={handleMessageClick}
                      className="inline-flex items-center px-6 py-3 border border-gray-200 text-sm font-medium rounded-lg shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 transition-all duration-300"
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
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-10">
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
          
          <div className="p-8">
            {/* Portfolio Tab */}
            {activeTab === 'portfolio' && (
              <div>
                {designer.portfolio && designer.portfolio.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {designer.portfolio.map((item, index) => (
                      <div key={item._id || index} className="portfolio-card bg-gray-50 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300">
                        {item.imageUrl ? (
                          <img 
                            src={item.imageUrl} 
                            alt={item.title} 
                            className="w-full h-56 object-cover"
                          />
                        ) : (
                          <div className="w-full h-56 bg-white flex items-center justify-center px-4 text-center text-sm text-gray-500 border-b border-gray-200">
                            No image uploaded for this project. Use links below to view the work.
                          </div>
                        )}
                        <div className="p-6">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {item.title}
                          </h3>
                          {item.description && (
                            <p className="text-sm text-gray-600 line-clamp-3">
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

                          <p className="text-xs text-gray-500 mt-3">
                            {new Date(item.createdAt).toLocaleDateString()}
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
                {designer.ratings && designer.ratings.length > 0 ? (
                  <div className="space-y-8">
                    {designer.ratings.map((rating) => (
                      <div key={rating._id} className="review-card border-b border-gray-200 pb-8 last:border-b-0 last:pb-0">
                        <div className="flex items-start">
                          <div className="flex-shrink-0">
                            <div className="w-12 h-12 rounded-full bg-sky-100 flex items-center justify-center text-sky-800 font-medium">
                              C
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="flex items-center">
                              <div className="flex">
                                {[1, 2, 3, 4, 5].map(star => (
                                  <svg 
                                    key={star}
                                    className={`w-5 h-5 star-rating transition-transform duration-200 ${
                                      star <= rating.rating 
                                        ? 'text-yellow-400' 
                                        : 'text-gray-300'
                                    }`} 
                                    fill="currentColor" 
                                    viewBox="0 0 20 20"
                                  >
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3 .921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                ))}
                              </div>
                              <p className="text-xs text-gray-500 ml-3">
                                {new Date(rating.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            
                            {rating.review && (
                              <p className="mt-3 text-sm text-gray-600 leading-relaxed">
                                {rating.review}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
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