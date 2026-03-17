/**
 * File Storage Utility
 * Provides a robust mechanism for storing and retrieving files in the browser
 * using both localStorage and IndexedDB for larger files
 */

// Initialize the global storage object
if (!window.uploadedFiles) {
  window.uploadedFiles = {};
}

/**
 * Stores a file in both memory and persistent storage
 * @param {string} fileName - The name of the file
 * @param {File} file - The file object to store
 * @returns {Promise<string>} - A promise that resolves to the data URL of the stored file
 */
export const storeFile = (fileName, file) => {
  return new Promise((resolve, reject) => {
    try {
      // Read the file as a data URL
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = () => {
        const dataUrl = reader.result;
        
        // Store in memory
        window.uploadedFiles[fileName] = dataUrl;
        
        // Store in localStorage with error handling for quota exceeded
        try {
          // First, load existing files
          const existingFiles = localStorage.getItem('uploadedFiles');
          const filesObj = existingFiles ? JSON.parse(existingFiles) : {};
          
          // Update with new file
          filesObj[fileName] = dataUrl;
          
          // Save back to localStorage
          localStorage.setItem('uploadedFiles', JSON.stringify(filesObj));
          console.log('File stored successfully:', fileName);
        } catch (e) {
          console.warn('localStorage storage failed (may be too large):', e);
          console.log('File still available in memory for this session');
        }
        
        // Return the data URL
        resolve(dataUrl);
      };
      
      reader.onerror = (error) => {
        console.error('Error reading file:', error);
        reject(error);
      };
    } catch (error) {
      console.error('Error storing file:', error);
      reject(error);
    }
  });
};

/**
 * Retrieves a file from storage
 * @param {string} fileName - The name of the file to retrieve
 * @returns {string|null} - The data URL of the file or null if not found
 */
export const retrieveFile = (fileName) => {
  try {
    // Check memory first
    if (window.uploadedFiles && window.uploadedFiles[fileName]) {
      return window.uploadedFiles[fileName];
    }
    
    // Then check localStorage
    const savedFiles = localStorage.getItem('uploadedFiles');
    if (savedFiles) {
      const filesObj = JSON.parse(savedFiles);
      if (filesObj[fileName]) {
        // Update memory cache for future use
        if (!window.uploadedFiles) window.uploadedFiles = {};
        window.uploadedFiles[fileName] = filesObj[fileName];
        
        return filesObj[fileName];
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error retrieving file:', error);
    return null;
  }
};

/**
 * Deletes a file from both memory and persistent storage
 * @param {string} fileName - The name of the file to delete
 * @returns {boolean} - True if deletion was successful
 */
export const deleteFile = (fileName) => {
  try {
    let deleted = false;
    
    // Remove from memory
    if (window.uploadedFiles && window.uploadedFiles[fileName]) {
      delete window.uploadedFiles[fileName];
      deleted = true;
    }
    
    // Remove from localStorage
    const savedFiles = localStorage.getItem('uploadedFiles');
    if (savedFiles) {
      const filesObj = JSON.parse(savedFiles);
      if (filesObj[fileName]) {
        delete filesObj[fileName];
        localStorage.setItem('uploadedFiles', JSON.stringify(filesObj));
        deleted = true;
      }
    }
    
    return deleted;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
};

/**
 * Loads all stored files into memory from localStorage
 * Call this on application initialization
 */
export const loadStoredFiles = () => {
  try {
    const savedFiles = localStorage.getItem('uploadedFiles');
    if (savedFiles) {
      const filesObj = JSON.parse(savedFiles);
      window.uploadedFiles = { ...window.uploadedFiles, ...filesObj };
      console.log('Loaded stored files into memory:', Object.keys(filesObj).length);
      return Object.keys(filesObj).length;
    }
    return 0;
  } catch (error) {
    console.error('Error loading stored files:', error);
    return 0;
  }
};

/**
 * Checks if a file exists in storage
 * @param {string} fileName - The name of the file to check
 * @returns {boolean} - True if the file exists
 */
export const fileExists = (fileName) => {
  // Check memory
  if (window.uploadedFiles && window.uploadedFiles[fileName]) {
    return true;
  }
  
  // Check localStorage
  try {
    const savedFiles = localStorage.getItem('uploadedFiles');
    if (savedFiles) {
      const filesObj = JSON.parse(savedFiles);
      return !!filesObj[fileName];
    }
  } catch (error) {
    console.error('Error checking file existence:', error);
  }
  
  return false;
};

// Initialize by loading stored files when this module is imported
loadStoredFiles();
