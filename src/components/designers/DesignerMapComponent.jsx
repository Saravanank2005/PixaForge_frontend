import React, { useState } from 'react';
import { Map, Marker, Overlay } from 'pigeon-maps';

// Custom marker component for designers
const DesignerMarker = ({ designer, onClick, isSelected }) => {
  // Determine marker color based on designer's rating if available
  const getMarkerColor = () => {
    if (!designer.rating) return 'bg-red-500';
    if (designer.rating >= 4.5) return 'bg-green-500';
    if (designer.rating >= 4) return 'bg-emerald-500';
    if (designer.rating >= 3) return 'bg-amber-500';
    return 'bg-red-500';
  };
  
  return (
    <div 
      className="relative cursor-pointer group" 
      onClick={() => onClick(designer)}
      title={designer.username}
    >
      {/* Pulse effect for selected designer */}
      {isSelected && (
        <div className="absolute w-10 h-10 rounded-full bg-red-500 opacity-30 animate-ping transform -translate-x-5 -translate-y-5"></div>
      )}
      
      {/* Main marker */}
      <div className={`w-8 h-8 ${getMarkerColor()} rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg transform -translate-x-4 -translate-y-4 ring-2 ring-white transition-all duration-200 ${isSelected ? 'scale-110 ring-4' : ''}`}>
        {designer.username.charAt(0).toUpperCase()}
      </div>
      
      {/* Tooltip on hover */}
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-2 bg-white px-2 py-1 rounded shadow-md text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-20">
        <strong>{designer.username}</strong>
        {designer.distance && <span className="ml-1 text-gray-500">{designer.distance.toFixed(1)}km</span>}
      </div>
    </div>
  );
};

// Custom marker component for user
const UserMarker = () => {
  return (
    <div className="relative">
      {/* Outer pulse animation */}
      <div className="absolute w-16 h-16 rounded-full bg-blue-500 opacity-10 animate-ping transform -translate-x-8 -translate-y-8"></div>
      <div className="absolute w-12 h-12 rounded-full bg-blue-500 opacity-20 transform -translate-x-6 -translate-y-6"></div>
      
      {/* Inner circle */}
      <div className="absolute w-8 h-8 bg-white rounded-full transform -translate-x-4 -translate-y-4 shadow-lg"></div>
      
      {/* Main marker */}
      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg transform -translate-x-4 -translate-y-4 ring-2 ring-white z-10">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
          <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
        </svg>
      </div>
      
      {/* 'You are here' tooltip */}
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-10 bg-white px-2 py-1 rounded shadow-md text-xs whitespace-nowrap pointer-events-none z-20">
        <span className="font-semibold text-blue-600">You are here</span>
      </div>
    </div>
  );
};

// Pigeon Maps implementation
const DesignerMapComponent = ({ position, designers, radiusKm }) => {
  const [selectedDesigner, setSelectedDesigner] = useState(null);
  
  if (!position) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50 rounded-xl">
        <div className="text-gray-600">Waiting for location data...</div>
      </div>
    );
  }
  
  // Filter designers with valid locations and within radius
  const validDesigners = designers.filter(designer => {
    const hasValidLocation = designer.location && 
      typeof designer.location.coordinates === 'object' &&
      Array.isArray(designer.location.coordinates) &&
      designer.location.coordinates.length === 2;
    
    if (!hasValidLocation) return false;
    
    // Skip designers outside the radius if we have distance data
    if (designer.distance && designer.distance > radiusKm) {
      return false;
    }
    
    return true;
  });
  
  // Handle designer selection
  const handleDesignerClick = (designer) => {
    setSelectedDesigner(selectedDesigner && selectedDesigner._id === designer._id ? null : designer);
  };
  
  // Close info window
  const handleCloseInfoWindow = () => {
    setSelectedDesigner(null);
  };
  
  return (
    <div className="h-full w-full rounded-xl overflow-hidden relative">
      {/* Map controls */}
      <div className="absolute top-4 right-4 z-10 bg-white p-3 rounded-lg shadow-md">
        <div className="flex items-center mb-2">
          <svg className="w-4 h-4 text-sky-500 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
          </svg>
          <p className="text-sm font-medium text-gray-700">
            <span className="font-bold text-sky-600">{validDesigners.length}</span> designers within {radiusKm}km
          </p>
        </div>
        
        {/* Map legend */}
        <div className="text-xs text-gray-600 border-t border-gray-100 pt-2">
          <div className="flex items-center mb-1">
            <div className="w-3 h-3 bg-blue-600 rounded-full mr-1"></div>
            <span>Your location</span>
          </div>
          <div className="flex items-center mb-1">
            <div className="w-3 h-3 bg-red-500 rounded-full mr-1"></div>
            <span>Designers</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 border border-dashed border-blue-400 rounded-full mr-1"></div>
            <span>Search radius ({radiusKm}km)</span>
          </div>
        </div>
      </div>
      
      {/* Pigeon Maps */}
      <Map
        height={600}
        defaultCenter={[position[0], position[1]]}
        defaultZoom={13}
        attribution={false}
        metaWheelZoom={true}
        // Fix for React warnings - create a wrapper component that doesn't pass these props to DOM
        attributionPrefix={false}
      >
        {/* Search radius circle - using a custom overlay to avoid React warnings */}
        <Overlay anchor={[position[0], position[1]]} offset={[0, 0]}>
          <div style={{ position: 'relative', transform: 'translate(-50%, -50%)' }}>
            <div 
              style={{
                width: `${radiusKm * 100 / Math.pow(2, 13-8)}px`,
                height: `${radiusKm * 100 / Math.pow(2, 13-8)}px`,
                borderRadius: '50%',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                border: '2px dashed rgba(59, 130, 246, 0.4)',
                position: 'absolute',
                transform: 'translate(-50%, -50%)'
              }}
            />
          </div>
        </Overlay>
        
        {/* User marker */}
        <Marker
          width={40}
          anchor={[position[0], position[1]]}
        >
          <UserMarker />
        </Marker>
        
        {/* Designer markers */}
        {validDesigners.map(designer => {
          const lat = designer.location.coordinates[1];
          const lng = designer.location.coordinates[0];
          const isSelected = selectedDesigner && selectedDesigner._id === designer._id;
          
          return (
            <Marker
              key={designer._id}
              width={40}
              anchor={[lat, lng]}
              // Render selected markers on top of others
              zIndex={isSelected ? 100 : 10}
            >
              <DesignerMarker 
                designer={designer} 
                onClick={handleDesignerClick}
                isSelected={isSelected}
              />
            </Marker>
          );
        })}
        
        {/* Distance indicators for selected designer */}
        {selectedDesigner && selectedDesigner.distance && (
          <svg width="100%" height="100%" style={{ position: 'absolute', pointerEvents: 'none', zIndex: 5 }}>
            {/* Line connecting user to selected designer */}
            <line
              x1="50%"
              y1="50%"
              x2={`${50 + (selectedDesigner.location.coordinates[0] - position[1]) * 50 / 180}%`}
              y2={`${50 - (selectedDesigner.location.coordinates[1] - position[0]) * 50 / 90}%`}
              stroke="rgba(59, 130, 246, 0.6)"
              strokeWidth="2"
              strokeDasharray="5,3"
            />
          </svg>
        )}
        
        {/* Info window for selected designer */}
        {selectedDesigner && (
          <Overlay
            anchor={[
              selectedDesigner.location.coordinates[1],
              selectedDesigner.location.coordinates[0]
            ]}
            offset={[0, -15]}
          >
            <div className="bg-white p-3 rounded-lg shadow-lg max-w-xs" onClick={e => e.stopPropagation()}>
              <button 
                className="absolute top-1 right-1 text-gray-400 hover:text-gray-600"
                onClick={handleCloseInfoWindow}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
              
              <div className="flex items-start mt-1">
                <div className="h-10 w-10 rounded-full bg-gray-200 flex-shrink-0 mr-3">
                  {selectedDesigner.profileImage ? (
                    <img 
                      src={selectedDesigner.profileImage} 
                      alt={selectedDesigner.username} 
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-sky-100 flex items-center justify-center text-sky-500 font-semibold">
                      {selectedDesigner.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-800">{selectedDesigner.username}</h3>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">{selectedDesigner.bio || 'Designer'}</p>
                  
                  {selectedDesigner.distance && (
                    <span className="text-xs text-gray-500 mt-1 inline-block">
                      {selectedDesigner.distance.toFixed(1)}km away
                    </span>
                  )}
                  
                  <a 
                    href={`/app/designers/${selectedDesigner._id}`}
                    className="mt-2 px-3 py-1 bg-sky-500 hover:bg-sky-600 text-white text-sm rounded inline-block transition-colors"
                  >
                    View Profile
                  </a>
                </div>
              </div>
            </div>
          </Overlay>
        )}
      </Map>
    </div>
  );
};

export default DesignerMapComponent;
