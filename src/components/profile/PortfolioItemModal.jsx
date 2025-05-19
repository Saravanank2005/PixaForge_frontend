import { motion } from 'framer-motion';
import { XMarkIcon, LinkIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { formatDate } from '../../utils/formatters';

/**
 * Modal component for viewing portfolio item details
 */
const PortfolioItemModal = ({ item, onClose, onDownload, designerId }) => {
  if (!item) return null;
  
  // Handle opening project URL
  const openProjectUrl = (url) => {
    if (!url) return;
    
    // Ensure URL has protocol
    const fullUrl = url.startsWith('http') ? url : `https://${url}`;
    window.open(fullUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-xl font-semibold text-gray-800">{item.title}</h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
            aria-label="Close modal"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col md:flex-row gap-6">
          {/* Image */}
          <div className="md:w-1/2 flex-shrink-0">
            {item.imageUrl ? (
              <img 
                src={item.imageUrl} 
                alt={item.title} 
                className="w-full h-auto rounded-lg object-cover shadow-md"
              />
            ) : (
              <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center">
                <span className="text-gray-500">No image available</span>
              </div>
            )}
          </div>
          
          {/* Details */}
          <div className="md:w-1/2">
            {item.category && (
              <div className="mb-4">
                <span className="inline-block bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
                  {item.category}
                </span>
              </div>
            )}
            
            <h4 className="text-lg font-medium text-gray-900 mb-2">Description</h4>
            <p className="text-gray-700 mb-6 whitespace-pre-wrap">{item.description}</p>
            
            {item.tags && item.tags.length > 0 && (
              <div className="mb-6">
                <h4 className="text-lg font-medium text-gray-900 mb-2">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {item.tags.map(tag => (
                    <span 
                      key={tag} 
                      className="inline-block px-2 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            <div className="border-t border-gray-200 pt-4 mt-auto">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Added on {formatDate(item.createdAt)}
                </p>
                
                <div className="flex space-x-3">
                  {item.projectUrl && (
                    <button
                      type="button"
                      onClick={() => openProjectUrl(item.projectUrl)}
                      className="inline-flex items-center px-3 py-1.5 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 text-sm"
                    >
                      <LinkIcon className="h-4 w-4 mr-1" />
                      Visit Project
                    </button>
                  )}
                  
                  <button
                    type="button"
                    onClick={() => onDownload(item)}
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 text-sm"
                  >
                    <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                    Download
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default PortfolioItemModal;
