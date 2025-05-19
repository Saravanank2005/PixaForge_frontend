/**
 * Shared utility functions for profile components
 */

import api from './api';

/**
 * Fetch user profile data
 * @param {string} userId - Optional user ID for fetching another user's profile
 * @returns {Promise} Promise resolving to profile data
 */
export const fetchUserProfile = async (userId = null) => {
  try {
    const endpoint = userId ? `/api/user/${userId}` : '/api/auth/profile';
    const response = await api.get(endpoint);
    return response.data;
  } catch (error) {
    console.error('Profile fetch error:', error);
    throw error;
  }
};

/**
 * Upload portfolio item with image
 * @param {Object} portfolioItem - Portfolio item data
 * @param {string} portfolioItem.title - Title of the portfolio item
 * @param {string} portfolioItem.description - Description of the portfolio item
 * @param {string} portfolioItem.category - Category of the portfolio item (optional)
 * @param {Array} portfolioItem.tags - Tags for the portfolio item (optional)
 * @param {string} portfolioItem.projectUrl - Project URL (optional)
 * @param {File} portfolioItem.image - Image file (required for new items, optional for updates)
 * @param {string} portfolioItem._id - Item ID (only for updates)
 * @param {Function} onProgress - Progress callback function (optional)
 * @param {boolean} isUpdate - Whether this is an update to an existing item
 * @returns {Promise} Promise resolving to the created/updated portfolio item
 */
export const uploadPortfolioItem = async (portfolioItem, onProgress, isUpdate = false) => {
  try {
    // Validate required inputs
    if (!portfolioItem.title || !portfolioItem.description) {
      throw new Error('Please provide a title and description');
    }
    
    if (!isUpdate && !portfolioItem.image) {
      throw new Error('Please upload an image');
    }
    
    // Create form data for upload
    const formData = new FormData();
    formData.append('title', portfolioItem.title);
    formData.append('description', portfolioItem.description);
    
    // Add optional fields if they exist
    if (portfolioItem.category) formData.append('category', portfolioItem.category);
    if (portfolioItem.projectUrl) formData.append('projectUrl', portfolioItem.projectUrl);
    if (portfolioItem.tags && portfolioItem.tags.length > 0) {
      formData.append('tags', JSON.stringify(portfolioItem.tags));
    }
    
    // Add image if provided
    if (portfolioItem.image) {
      formData.append('portfolioImage', portfolioItem.image);
    }
    
    // Determine endpoint based on whether this is an update or new item
    const endpoint = isUpdate 
      ? `/api/designers/portfolio/${portfolioItem._id}`
      : '/api/designers/portfolio';
    
    // Use appropriate HTTP method
    const method = isUpdate ? 'put' : 'post';
    
    // Upload with progress tracking
    const response = await api[method](endpoint, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: onProgress ? (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(percentCompleted);
      } : undefined
    });
    
    return response.data;
  } catch (error) {
    console.error('Portfolio upload error:', error);
    throw error;
  }
};

/**
 * Remove portfolio item
 * @param {string} itemId - ID of the portfolio item to remove
 * @returns {Promise} Promise resolving when the item is removed
 */
export const removePortfolioItem = async (itemId) => {
  try {
    await api.delete(`/api/designers/portfolio/${itemId}`);
    return true;
  } catch (error) {
    console.error('Portfolio remove error:', error);
    throw error;
  }
};

/**
 * Update user profile
 * @param {Object} profileData - Profile data to update
 * @param {string} userType - User type (client or designer)
 * @returns {Promise} Promise resolving to the updated user data
 */
export const updateUserProfile = async (profileData, userType) => {
  try {
    // Use the appropriate endpoint based on user type
    const endpoint = userType === 'designer' 
      ? '/api/designers/profile'
      : '/api/auth/profile';
      
    const response = await api.put(endpoint, profileData);
    return response.data;
  } catch (error) {
    console.error('Profile update error:', error);
    throw error;
  }
};

/**
 * Validate image file
 * @param {File} file - Image file to validate
 * @returns {Object} Validation result with isValid and error properties
 */
export const validateImageFile = (file) => {
  // Validate file size (5MB limit)
  if (file.size > 5 * 1024 * 1024) {
    return { isValid: false, error: 'Image size should be less than 5MB' };
  }
  
  // Validate file type
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
  if (!validTypes.includes(file.type)) {
    return { isValid: false, error: 'Only JPG, PNG and GIF images are allowed' };
  }
  
  return { isValid: true };
};

/**
 * Fetch portfolio items for a user
 * @param {string} userId - Optional user ID for fetching another user's portfolio
 * @returns {Promise} Promise resolving to portfolio items
 */
export const fetchPortfolioItems = async (userId = null) => {
  try {
    const endpoint = userId 
      ? `/api/designers/${userId}/portfolio`
      : '/api/designers/portfolio';
      
    const response = await api.get(endpoint);
    return response.data;
  } catch (error) {
    console.error('Portfolio fetch error:', error);
    throw error;
  }
};

/**
 * Extract unique categories from portfolio items
 * @param {Array} items - Portfolio items
 * @param {boolean} includeAll - Whether to include 'all' as a category
 * @returns {Array} Array of unique categories
 */
export const extractCategories = (items, includeAll = true) => {
  if (!items || !items.length) {
    return includeAll ? ['all'] : [];
  }
  
  // Get unique categories that are not empty
  const uniqueCategories = [...new Set(
    items
      .map(item => item.category)
      .filter(Boolean)
  )];
  
  return includeAll ? ['all', ...uniqueCategories] : uniqueCategories;
};

/**
 * Filter portfolio items by search term and category
 * @param {Array} items - Portfolio items to filter
 * @param {string} searchTerm - Search term
 * @param {string} category - Category to filter by
 * @returns {Array} Filtered items
 */
export const filterPortfolioItems = (items, searchTerm, category) => {
  if (!items || !items.length) return [];
  
  let filtered = [...items];
  
  // Filter by category if not 'all'
  if (category && category !== 'all') {
    filtered = filtered.filter(item => item.category === category);
  }
  
  // Filter by search term if provided
  if (searchTerm && searchTerm.trim()) {
    const term = searchTerm.toLowerCase().trim();
    filtered = filtered.filter(item => 
      (item.title && item.title.toLowerCase().includes(term)) || 
      (item.description && item.description.toLowerCase().includes(term)) ||
      (item.tags && item.tags.some(tag => tag.toLowerCase().includes(term)))
    );
  }
  
  return filtered;
};
