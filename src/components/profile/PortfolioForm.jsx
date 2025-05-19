import { useState, useEffect } from 'react';
import { uploadPortfolioItem, validateImageFile, extractCategories } from '../../utils/profileUtils';
import { XMarkIcon, PlusIcon } from '@heroicons/react/24/outline';

/**
 * Reusable portfolio item form component with enhanced features
 */
const PortfolioForm = ({ onSuccess, onError, editItem = null }) => {
  const [portfolioItem, setPortfolioItem] = useState({
    title: '',
    description: '',
    category: '',
    projectUrl: '',
    tags: [],
    image: null,
    imagePreview: null
  });
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errors, setErrors] = useState({});
  const [currentTag, setCurrentTag] = useState('');
  
  // Categories for portfolio items
  const categories = [
    'Web Design', 
    'Mobile App', 
    'UI/UX', 
    'Graphic Design', 
    'Illustration', 
    '3D Modeling',
    'Interior Design',
    'Architecture',
    'Product Design',
    'Other'
  ];
  
  // If editItem is provided, populate the form for editing
  useEffect(() => {
    if (editItem) {
      setPortfolioItem({
        ...editItem,
        image: null,
        imagePreview: editItem.imageUrl || null
      });
    }
  }, [editItem]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPortfolioItem(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field when user makes changes
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validate file
      const validation = validateImageFile(file);
      if (!validation.isValid) {
        onError(validation.error);
        setErrors(prev => ({
          ...prev,
          image: validation.error
        }));
        return;
      }
      
      setPortfolioItem(prev => ({
        ...prev,
        image: file,
        imagePreview: URL.createObjectURL(file)
      }));
      
      // Clear image error
      if (errors.image) {
        setErrors(prev => ({
          ...prev,
          image: null
        }));
      }
    }
  };
  
  // Handle adding tags
  const handleAddTag = () => {
    if (!currentTag.trim()) return;
    
    // Don't add duplicate tags
    if (portfolioItem.tags.includes(currentTag.trim())) {
      setErrors(prev => ({
        ...prev,
        tags: 'Tag already exists'
      }));
      return;
    }
    
    setPortfolioItem(prev => ({
      ...prev,
      tags: [...prev.tags, currentTag.trim()]
    }));
    setCurrentTag('');
    
    // Clear tag error
    if (errors.tags) {
      setErrors(prev => ({
        ...prev,
        tags: null
      }));
    }
  };
  
  // Handle removing tags
  const handleRemoveTag = (tagToRemove) => {
    setPortfolioItem(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };
  
  // Handle tag input key press (add tag on Enter)
  const handleTagKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  // Validate form fields
  const validateForm = () => {
    const newErrors = {};
    
    if (!portfolioItem.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (portfolioItem.title.length > 100) {
      newErrors.title = 'Title must be less than 100 characters';
    }
    
    if (!portfolioItem.description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    if (!portfolioItem.category) {
      newErrors.category = 'Please select a category';
    }
    
    if (portfolioItem.projectUrl && !/^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/.test(portfolioItem.projectUrl)) {
      newErrors.projectUrl = 'Please enter a valid URL';
    }
    
    if (!editItem && !portfolioItem.image) {
      newErrors.image = 'Please upload an image';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (loading) return;
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setUploadProgress(0);
    
    try {
      // Use the enhanced uploadPortfolioItem function which handles both creates and updates
      const response = await uploadPortfolioItem(
        portfolioItem, 
        (progress) => setUploadProgress(progress),
        !!editItem // Pass whether this is an update
      );
      
      // Reset form
      setPortfolioItem({
        title: '',
        description: '',
        category: '',
        projectUrl: '',
        tags: [],
        image: null,
        imagePreview: null
      });
      setCurrentTag('');
      setErrors({});
      
      // Notify parent component of success
      if (onSuccess) {
        onSuccess(response, !!editItem);
      }
    } catch (error) {
      console.error('Error uploading portfolio item:', error);
      if (onError) {
        onError(error.response?.data?.error || 'Failed to upload portfolio item');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 bg-white p-5 rounded-lg shadow-sm border border-gray-100">
      <h3 className="text-lg font-medium text-gray-900 mb-4">{editItem ? 'Edit Portfolio Item' : 'Add New Portfolio Item'}</h3>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Title <span className="text-red-500">*</span></label>
        <input
          type="text"
          name="title"
          value={portfolioItem.title}
          onChange={handleChange}
          className={`shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm ${errors.title ? 'border-red-300' : 'border-gray-300'} rounded-md`}
          placeholder="Project title"
        />
        {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Category <span className="text-red-500">*</span></label>
        <select
          name="category"
          value={portfolioItem.category}
          onChange={handleChange}
          className={`shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm ${errors.category ? 'border-red-300' : 'border-gray-300'} rounded-md`}
        >
          <option value="">Select a category</option>
          {categories.map(category => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
        {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category}</p>}
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description <span className="text-red-500">*</span></label>
        <textarea
          name="description"
          value={portfolioItem.description}
          onChange={handleChange}
          rows={3}
          className={`shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm ${errors.description ? 'border-red-300' : 'border-gray-300'} rounded-md`}
          placeholder="Describe your project"
        />
        {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Project URL</label>
        <input
          type="text"
          name="projectUrl"
          value={portfolioItem.projectUrl}
          onChange={handleChange}
          className={`shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm ${errors.projectUrl ? 'border-red-300' : 'border-gray-300'} rounded-md`}
          placeholder="https://yourproject.com"
        />
        {errors.projectUrl && <p className="mt-1 text-sm text-red-600">{errors.projectUrl}</p>}
        <p className="mt-1 text-xs text-gray-500">Optional: Add a link to view your project</p>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
        <div className="flex items-center">
          <input
            type="text"
            value={currentTag}
            onChange={(e) => setCurrentTag(e.target.value)}
            onKeyPress={handleTagKeyPress}
            className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
            placeholder="Add tags (e.g., 'responsive', 'minimalist')"
          />
          <button
            type="button"
            onClick={handleAddTag}
            className="ml-2 inline-flex items-center p-1.5 border border-transparent rounded-full shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <PlusIcon className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        {errors.tags && <p className="mt-1 text-sm text-red-600">{errors.tags}</p>}
        
        {portfolioItem.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {portfolioItem.tags.map(tag => (
              <span 
                key={tag} 
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="ml-1.5 h-3.5 w-3.5 rounded-full inline-flex items-center justify-center text-blue-400 hover:bg-blue-200 hover:text-blue-500 focus:outline-none focus:bg-blue-500 focus:text-white"
                >
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
        <p className="mt-1 text-xs text-gray-500">Press Enter or click + to add a tag</p>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Upload Image {!editItem && <span className="text-red-500">*</span>}
        </label>
        <div className="mt-1 flex items-center">
          <input
            type="file"
            onChange={handleImageChange}
            accept="image/jpeg,image/png,image/gif"
            className="sr-only"
            id="portfolio-image"
          />
          <label
            htmlFor="portfolio-image"
            className={`relative cursor-pointer bg-white py-2 px-3 border ${errors.image ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500`}
          >
            <span>{editItem ? 'Change image' : 'Choose file'}</span>
          </label>
          {portfolioItem.imagePreview && (
            <div className="ml-4 relative">
              <img
                src={portfolioItem.imagePreview}
                alt="Preview"
                className="h-20 w-20 object-cover rounded-md border border-gray-200"
              />
              <button
                type="button"
                onClick={() => setPortfolioItem(prev => ({ ...prev, image: null, imagePreview: null }))}
                className="absolute -top-2 -right-2 bg-red-100 rounded-full p-0.5 text-red-500 hover:bg-red-200"
                title="Remove image"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
        {errors.image && <p className="mt-1 text-sm text-red-600">{errors.image}</p>}
        <p className="mt-1 text-xs text-gray-500">JPG, PNG or GIF up to 5MB</p>
        
        {uploadProgress > 0 && uploadProgress < 100 && (
          <div className="mt-2">
            <div className="bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 w-full">
              <div 
                className="bg-blue-600 h-2.5 rounded-full" 
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">Uploading: {uploadProgress}%</p>
          </div>
        )}
      </div>
      
      <div className="pt-2">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {editItem ? 'Updating...' : 'Uploading...'}
            </>
          ) : (
            editItem ? 'Update Portfolio Item' : 'Add to Portfolio'
          )}
        </button>
        
        {editItem && (
          <button
            type="button"
            onClick={() => {
              setPortfolioItem({
                title: '',
                description: '',
                category: '',
                projectUrl: '',
                tags: [],
                image: null,
                imagePreview: null
              });
              onSuccess(null, false);
            }}
            className="ml-3 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
};

export default PortfolioForm;
