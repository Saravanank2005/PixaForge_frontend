import { MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline';

/**
 * Search and filter controls for portfolio gallery
 */
const PortfolioControls = ({ 
  searchTerm, 
  setSearchTerm, 
  selectedCategory, 
  setSelectedCategory, 
  categories,
  itemCount
}) => {
  return (
    <div className="mb-6 space-y-4">
      {/* Search and filter row */}
      <div className="flex flex-col md:flex-row gap-3">
        {/* Search input */}
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search portfolio items..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          />
        </div>
        
        {/* Category filter */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FunnelIcon className="h-5 w-5 text-gray-400" />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category === 'all' ? 'All Categories' : category}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Results count */}
      <div className="text-sm text-gray-500">
        Showing {itemCount} {itemCount === 1 ? 'item' : 'items'}
        {selectedCategory !== 'all' && (
          <span> in <span className="font-medium">{selectedCategory}</span></span>
        )}
        {searchTerm && (
          <span> matching <span className="font-medium">"{searchTerm}"</span></span>
        )}
      </div>
    </div>
  );
};

export default PortfolioControls;
