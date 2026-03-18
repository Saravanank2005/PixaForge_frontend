import { useState, useEffect } from 'react';
import { removePortfolioItem, extractCategories, filterPortfolioItems } from '../../utils/profileUtils';
import { 
  ArrowDownTrayIcon, 
  PencilIcon, 
  TrashIcon, 
  EyeIcon,
  LinkIcon
} from '@heroicons/react/24/outline';

// Import extracted components
import PortfolioItemModal from './PortfolioItemModal';
import PortfolioControls from './PortfolioControls';

/**
 * Enhanced reusable component to display portfolio items in a grid with filtering and search
 */
const PortfolioGallery = ({ 
  items = [], 
  onRemove, 
  onItemRemoved, 
  isLoading, 
  showRemoveButton = true,
  showDownloadButton = true,
  showEditButton = true,
  onEditItem,
  designerId,
  emptyMessage = "No portfolio items found."
}) => {
  const [filteredItems, setFilteredItems] = useState(items);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewItem, setViewItem] = useState(null);
  const [categories, setCategories] = useState(['all']);
  
  // Extract unique categories from items
  useEffect(() => {
    if (items.length > 0) {
      setCategories(extractCategories(items));
    }
  }, [items]);
  
  // Filter items based on search term and category
  useEffect(() => {
    const filtered = filterPortfolioItems(items, searchTerm, selectedCategory);
    setFilteredItems(filtered);
  }, [items, searchTerm, selectedCategory]);
  
  // Handle item removal with confirmation
  const handleRemove = async (itemId) => {
    try {
      if (isLoading) return;
      
      // Show confirmation dialog
      if (!window.confirm('Are you sure you want to remove this portfolio item? This action cannot be undone.')) {
        return;
      }
      
      await removePortfolioItem(itemId);
      
      // Notify parent component
      if (onItemRemoved) {
        onItemRemoved(itemId);
      }
    } catch (error) {
      if (onRemove) {
        onRemove(error.response?.data?.error || 'Failed to remove portfolio item');
      }
    }
  };
  
  // Handle editing an item
  const handleEdit = (item) => {
    if (onEditItem) {
      onEditItem(item);
    }
  };
  
  // Handle viewing an item in modal
  const handleViewItem = (item) => {
    setViewItem(item);
  };
  
  // Close the view modal
  const closeViewModal = () => {
    setViewItem(null);
  };

  // Handle download of portfolio item
  const handleDownload = (item) => {
    try {
      if (!item.imageUrl) {
        if (onRemove) {
          onRemove('This portfolio item has no image to download');
        }
        return;
      }

      // Create download URL based on whether we have a designerId or not
      const downloadUrl = designerId 
        ? `/api/files/download-portfolio/${designerId}/${item._id}`
        : item.imageUrl;
      
      // Create a temporary anchor element
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `${item.title || 'portfolio-item'}.jpg`);
      link.setAttribute('target', '_blank');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Download error:', error);
      if (onRemove) {
        onRemove('Failed to download portfolio item');
      }
    }
  };

  return (
    <>
      {/* Search and filter controls */}
      <PortfolioControls
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        categories={categories}
        itemCount={filteredItems.length}
      />
      
      {/* Portfolio items grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <p className="text-gray-500">{emptyMessage}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map(item => (
            <div 
              key={item._id} 
              className="bg-white rounded-lg shadow-sm overflow-hidden flex flex-col h-full border border-gray-100 hover:shadow-md transition-shadow"
            >
              {/* Item image or placeholder */}
              {item.imageUrl ? (
                <div 
                  className="relative h-48 overflow-hidden cursor-pointer group"
                  onClick={() => handleViewItem(item)}
                >
                  <img 
                    src={item.imageUrl} 
                    alt={item.title} 
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity flex items-center justify-center">
                    <EyeIcon className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  {item.category && (
                    <span className="absolute top-2 right-2 bg-white bg-opacity-90 text-xs px-2 py-1 rounded-full">
                      {item.category}
                    </span>
                  )}
                </div>
              ) : (
                <div className="h-48 flex items-center justify-center bg-gray-50 border-b border-gray-100">
                  <p className="text-sm text-gray-500 px-4 text-center">No image uploaded. Use links below to view this project.</p>
                </div>
              )}
              
              <div className="p-4 flex-grow flex flex-col">
                <h4 
                  className="font-medium text-lg cursor-pointer hover:text-primary-600 transition-colors"
                  onClick={() => handleViewItem(item)}
                >
                  {item.title}
                </h4>
                
                <p className="text-sm text-gray-600 mt-1 line-clamp-2 flex-grow">
                  {item.description}
                </p>
                
                {item.tags && item.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {item.tags.slice(0, 3).map(tag => (
                      <span 
                        key={tag} 
                        className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700"
                      >
                        {tag}
                      </span>
                    ))}
                    {item.tags.length > 3 && (
                      <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-gray-50 text-gray-500">
                        +{item.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}
                
                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <p className="text-xs text-gray-500">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </p>
                  
                  <div className="flex space-x-2">
                    {showEditButton && onEditItem && (
                      <button
                        type="button"
                        onClick={() => handleEdit(item)}
                        className="text-gray-500 hover:text-gray-700"
                        title="Edit item"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                    )}
                    
                    {showDownloadButton && item.imageUrl && (
                      <button
                        type="button"
                        onClick={() => handleDownload(item)}
                        className="text-primary-600 hover:text-primary-800"
                        title="Download image"
                      >
                        <ArrowDownTrayIcon className="h-4 w-4" />
                      </button>
                    )}
                    
                    {item.projectUrl && (
                      <button
                        type="button"
                        onClick={() => window.open(item.projectUrl.startsWith('http') ? item.projectUrl : `https://${item.projectUrl}`, '_blank', 'noopener,noreferrer')}
                        className="text-blue-600 hover:text-blue-800"
                        title="Visit project"
                      >
                        <LinkIcon className="h-4 w-4" />
                      </button>
                    )}

                    {item.githubUrl && (
                      <button
                        type="button"
                        onClick={() => window.open(item.githubUrl.startsWith('http') ? item.githubUrl : `https://${item.githubUrl}`, '_blank', 'noopener,noreferrer')}
                        className="text-gray-700 hover:text-black"
                        title="Open GitHub repository"
                      >
                        <LinkIcon className="h-4 w-4" />
                      </button>
                    )}

                    {item.driveUrl && (
                      <button
                        type="button"
                        onClick={() => window.open(item.driveUrl.startsWith('http') ? item.driveUrl : `https://${item.driveUrl}`, '_blank', 'noopener,noreferrer')}
                        className="text-green-600 hover:text-green-800"
                        title="Open Google Drive link"
                      >
                        <LinkIcon className="h-4 w-4" />
                      </button>
                    )}
                    
                    {showRemoveButton && (
                      <button
                        type="button"
                        onClick={() => handleRemove(item._id)}
                        className="text-red-500 hover:text-red-700"
                        title="Remove item"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* View modal */}
      {viewItem && (
        <PortfolioItemModal
          item={viewItem}
          onClose={closeViewModal}
          onDownload={handleDownload}
          designerId={designerId}
        />
      )}
    </>
  );
};

export default PortfolioGallery;
