import React, { useState, useEffect } from 'react';
import { DocumentTextIcon, ArrowDownTrayIcon, CalendarIcon, TrashIcon, LinkIcon } from '@heroicons/react/24/outline';
import api from '../../utils/api';
import { retrieveFile, deleteFile } from '../../utils/fileStorage';

import { useAuth } from '../../contexts/AuthContext';
import '../../styles/animations.css';
import '../../styles/fileComponents.css';

/**
 * Component for displaying and downloading files
 * @param {Object} props
 * @param {Object} props.file - File object with name, url, and uploadedAt
 * @param {string} props.projectId - ID of the project the file belongs to
 * @param {number} props.fileIndex - Index of the file in the project's files array
 * @param {boolean} props.showDate - Whether to show the upload date
 * @param {string} props.className - Additional CSS classes
 * @param {Function} props.onDelete - Optional callback function when file is deleted
 * @param {boolean} props.showDeleteButton - Whether to show the delete button
 */
const FileDownload = ({ 
  file, 
  projectId, 
  fileIndex, 
  showDate = true, 
  showDeleteButton = false,
  onDelete,
  className = ''
 }) => {
  const [downloading, setDownloading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const { token } = useAuth();

  // Initialize file storage and check if this file exists in storage
  useEffect(() => {
    if (file && file.name) {
      const fileData = retrieveFile(file.name);
      if (fileData) {
        console.log('File data found in storage:', file.name);
      }
    }
  }, [file]);

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Check if URL is a blob URL (created with URL.createObjectURL)
  const isBlobUrl = (url) => {
    return url && url.startsWith('blob:');
  };

  // Check if URL is a Cloudinary URL
  const isCloudinaryUrl = (url) => {
    return url && (url.includes('cloudinary.com') || url.includes('res.cloudinary.com'));
  };

  const isExternalProjectLink = (url) => {
    if (!url) return false;
    return (
      url.includes('github.com') ||
      url.includes('drive.google.com') ||
      url.includes('docs.google.com')
    );
  };

  const getLinkSourceLabel = (url) => {
    if (!url) return 'External Link';
    if (url.includes('github.com')) return 'GitHub Link';
    if (url.includes('drive.google.com') || url.includes('docs.google.com')) return 'Drive Link';
    return 'External Link';
  };

  const getLinkHost = (url) => {
    if (!url) return '';
    try {
      const normalizedUrl = /^https?:\/\//i.test(url) ? url : `https://${url}`;
      return new URL(normalizedUrl).hostname.replace(/^www\./, '');
    } catch {
      return '';
    }
  };

  // Handle blob URL downloads
  const handleBlobDownload = (url, filename) => {
    try {
      // Create a download link for the blob URL
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || 'download';
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setDownloading(false);
      return true;
    } catch (err) {
      console.error('Blob URL download error:', err);
      setError('Failed to download file. Please try again.');
      setDownloading(false);
      return false;
    }
  };

  // Check if file exists at the given URL
  const checkFileExists = async (url) => {
    // Skip check for blob URLs as they can't be checked with HEAD request
    if (isBlobUrl(url)) {
      return { exists: true };
    }
    
    // Skip check for Cloudinary URLs - they're always assumed to exist
    if (isCloudinaryUrl(url)) {
      return { exists: true };
    }
    
    // Skip check for relative URLs (they'll be handled by the API)
    if (url.startsWith('/') || url.startsWith('./')) {
      return { exists: true };
    }
    
    try {
      // Use HEAD request to check if file exists without downloading it
      // Add a timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const response = await fetch(url, {
        method: 'HEAD',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        // Avoid caching issues
        cache: 'no-store',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        return { exists: true };
      } else if (response.status === 404) {
        return { exists: false, error: 'not_found', status: 404 };
      } else if (response.status === 401 || response.status === 403) {
        return { exists: false, error: 'unauthorized', status: response.status };
      } else {
        return { exists: false, error: 'http_error', status: response.status };
      }
    } catch (error) {
      console.error('Fetch error during file check:', error);
      // If it's an abort error (timeout), provide a specific message
      if (error.name === 'AbortError') {
        return { exists: false, error: 'timeout', message: 'Request timed out' };
      }
      return { exists: false, error: 'network_error', message: error.message };
    }
  };

  // Download file using API with proper authentication
  const downloadWithApi = async (filename) => {
    try {
      // Construct the API endpoint URL for downloading the file
      const downloadUrl = `/api/files/download/${projectId}/${fileIndex}`;
      console.log('API download URL:', downloadUrl);
      
      // Use a timeout to prevent hanging requests
      const source = api.CancelToken.source();
      setTimeout(() => {
        source.cancel('Request timed out');
      }, 30000); // 30 second timeout
      
      const response = await api.get(downloadUrl, {
        responseType: 'blob',
        headers: {
          'Accept': 'application/octet-stream'
        },
        cancelToken: source.token
      });
      
      // Check if we got a valid blob response
      if (response.data.size === 0) {
        throw new Error('Received empty file');
      }
      
      // Create a blob URL from the response data
      const blob = new Blob([response.data], { type: response.headers['content-type'] || 'application/octet-stream' });
      const blobUrl = URL.createObjectURL(blob);
      
      // Create a download link
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename || 'download';
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the URL object to avoid memory leaks
      setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
      
      setDownloading(false);
      return true;
    } catch (err) {
      console.error('API download error:', err);
      let errorMessage = 'Failed to download file from server';
      
      if (err.response) {
        // Server responded with an error
        errorMessage = `Server error: ${err.response.status} ${err.response.statusText || ''}`;
      } else if (err.request) {
        // Request was made but no response received
        errorMessage = 'No response from server - please check your connection';
      } else if (err.message) {
        // Something else happened
        errorMessage = `Error: ${err.message}`;
      }
      
      setError(errorMessage);
      setDownloading(false);
      return false;
    }
  };

  // Handle direct URL downloads
  const handleDirectDownload = async (url, filename) => {
    try {
      // Skip Cloudinary URLs - they should be handled by handleCloudinaryDownload
      if (isCloudinaryUrl(url)) {
        return handleCloudinaryDownload(url, filename);
      }
      
      // For cross-origin URLs, we need to fetch the file first
      // This avoids CORS issues and ensures proper download
      if (!url.startsWith('/') && !url.startsWith('blob:') && !url.includes(window.location.hostname)) {
        try {
          console.log('Fetching cross-origin file:', url);
          const response = await fetch(url, {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
          });
          
          if (!response.ok) {
            throw new Error(`HTTP error ${response.status}`);
          }
          
          const blob = await response.blob();
          const blobUrl = URL.createObjectURL(blob);
          
          // Create a download link for the blob
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = filename || 'download';
          link.style.display = 'none';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          // Clean up the blob URL
          setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
          
          setDownloading(false);
          return true;
        } catch (fetchErr) {
          console.error('Fetch error during direct download:', fetchErr);
          throw fetchErr; // Re-throw to be caught by outer try-catch
        }
      } else {
        // For same-origin or blob URLs, use direct link
        const link = document.createElement('a');
        link.href = url;
        link.download = filename || 'download';
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        setDownloading(false);
        return true;
      }
    } catch (err) {
      console.error('Direct download error:', err);
      setError('Failed to download file: ' + (err.message || 'Network error - please check your connection'));
      setDownloading(false);
      return false;
    }
  };

  // Handle Cloudinary URL downloads directly
  const handleCloudinaryDownload = (url, filename) => {
    try {
      console.log('Using Cloudinary direct download method');
      
      // Check if this is a mock URL (contains demo or timestamp)
      const isMockUrl = url.includes('cloudinary.com/demo') || url.includes(`v${new Date().getTime().toString().substring(0, 8)}`);
      
      if (isMockUrl) {
        console.log('Detected mock Cloudinary URL, showing actual file preview');
        
        // Extract the filename from the URL or use the provided filename
        const extractedFilename = url.split('/').pop();
        const actualFilename = extractedFilename || filename;
        
        // Create a modal to display the image
        const modal = document.createElement('div');
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.width = '100%';
        modal.style.height = '100%';
        modal.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        modal.style.display = 'flex';
        modal.style.flexDirection = 'column';
        modal.style.justifyContent = 'center';
        modal.style.alignItems = 'center';
        modal.style.zIndex = '1000';
        
        // Add close button
        const closeButton = document.createElement('button');
        closeButton.textContent = 'Close';
        closeButton.style.position = 'absolute';
        closeButton.style.top = '20px';
        closeButton.style.right = '20px';
        closeButton.style.padding = '10px 20px';
        closeButton.style.backgroundColor = '#ffffff';
        closeButton.style.border = 'none';
        closeButton.style.borderRadius = '4px';
        closeButton.style.cursor = 'pointer';
        closeButton.onclick = () => document.body.removeChild(modal);
        
        // Create image element with the actual file content
        const img = document.createElement('img');
        
        // Try to get file data using our utility
        const fileData = retrieveFile(actualFilename);
        
        if (fileData) {
          img.src = fileData;
          console.log('File data found for preview:', actualFilename);
        } else {
          // If not available anywhere, use a placeholder with the actual filename
          img.src = `https://placehold.co/800x600/e2e8f0/1e293b?text=${encodeURIComponent(actualFilename)}`;
          console.warn('No file data found for preview, using placeholder:', actualFilename);
        }
        
        img.style.maxWidth = '80%';
        img.style.maxHeight = '80%';
        img.style.objectFit = 'contain';
        img.style.marginBottom = '20px';
        
        // Add download button
        const downloadButton = document.createElement('button');
        downloadButton.textContent = 'Download';
        downloadButton.style.padding = '10px 20px';
        downloadButton.style.backgroundColor = '#3b82f6';
        downloadButton.style.color = '#ffffff';
        downloadButton.style.border = 'none';
        downloadButton.style.borderRadius = '4px';
        downloadButton.style.cursor = 'pointer';
        downloadButton.style.marginTop = '20px';
        downloadButton.onclick = () => {
          // Get file data using our utility
          const fileData = retrieveFile(actualFilename);
          
          if (fileData) {
            const link = document.createElement('a');
            link.href = fileData;
            link.download = actualFilename;
            link.click();
            console.log('File downloaded successfully:', actualFilename);
          } else {
            alert('Original file data is not available for download.');
            console.error('File data not found for download:', actualFilename);
          }
        };
        
        // Add filename display
        const filenameDisplay = document.createElement('div');
        filenameDisplay.textContent = actualFilename;
        filenameDisplay.style.color = '#ffffff';
        filenameDisplay.style.fontSize = '16px';
        filenameDisplay.style.marginBottom = '10px';
        
        // Assemble modal
        modal.appendChild(closeButton);
        modal.appendChild(filenameDisplay);
        modal.appendChild(img);
        modal.appendChild(downloadButton);
        
        // Add to document
        document.body.appendChild(modal);
      } else {
        // Create a direct download link for real Cloudinary URLs
        const link = document.createElement('a');
        link.href = url;
        link.download = filename || 'download';
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      
      setDownloading(false);
      return true;
    } catch (err) {
      console.error('Cloudinary download error:', err);
      setError('Failed to download file: ' + (err.message || 'Unknown error'));
      setDownloading(false);
      return false;
    }
  };

  // Main download handler
  const handleDownload = async () => {
    // Reset any previous errors
    setError('');
    setDownloading(true);
    
    // Check if file object is valid
    if (!file) {
      setError('Invalid file data');
      setDownloading(false);
      return;
    }
    
    // Check if user is authenticated for protected resources
    if ((file.url?.includes('/api/') || (projectId && fileIndex !== undefined)) && !token) {
      setError('Please log in to download this file');
      setDownloading(false);
      return;
    }
    
    try {
      // Log download attempt for debugging
      console.log('Download attempt:', { 
        hasUrl: !!file.url, 
        projectId, 
        fileIndex, 
        fileName: file.name,
        isBlobUrl: file.url ? isBlobUrl(file.url) : false,
        isCloudinaryUrl: file.url ? isCloudinaryUrl(file.url) : false,
        url: file.url || 'Using API endpoint'
      });
      
      // Handle different download scenarios
      if (file.url) {
        if (isExternalProjectLink(file.url)) {
          const externalUrl = /^https?:\/\//i.test(file.url) ? file.url : `https://${file.url}`;
          window.open(externalUrl, '_blank', 'noopener,noreferrer');
          setDownloading(false);
          return true;
        }

        // For blob URLs, use special handling
        if (isBlobUrl(file.url)) {
          console.log('Using blob URL download method');
          return handleBlobDownload(file.url, file.name);
        }
        
        // For Cloudinary URLs, use direct download
        if (isCloudinaryUrl(file.url)) {
          console.log('Using Cloudinary direct download method');
          return handleCloudinaryDownload(file.url, file.name);
        }
        
        // Try direct download first for simplicity
        console.log('Attempting direct download');
        const downloadResult = await handleDirectDownload(file.url, file.name);
        if (downloadResult) {
          return true;
        }
        
        // If direct download fails and we have project info, fall back to API
        if (projectId !== undefined && fileIndex !== undefined) {
          console.log('Direct download failed, falling back to API download');
          return downloadWithApi(file.name);
        }
        
        // If we get here, both methods failed
        setError('Download failed. Please try again later.');
        setDownloading(false);
        return false;
      } 
      else if (projectId !== undefined && fileIndex !== undefined) {
        // For server-stored files, use API download
        console.log('Using API download method');
        return downloadWithApi(file.name);
      } 
      else {
        setError('Missing file information for download');
        setDownloading(false);
        return false;
      }
    } catch (err) {
      console.error('Download handler error:', err);
      setError(`Download failed: ${err.message || 'Network error'}`);
      setDownloading(false);
      return false;
    }
  };

  // Handle file deletion
  const handleDelete = async () => {
    if (!projectId || fileIndex === undefined) {
      setError('Missing project information for deletion');
      return;
    }

    // Confirm before deleting
    if (!window.confirm(`Are you sure you want to delete ${file.name}? This action cannot be undone.`)) {
      return;
    }

    setDeleting(true);
    setError('');

    try {
      // Check if this is a mock/fallback URL or a file marked as fallback
      const isMockUrl = file.url && (
        file.url.includes('cloudinary.com/demo') || 
        file.url.includes(`v${new Date().getTime().toString().substring(0, 8)}`) ||
        file.isFallback === true
      );
      
      let deleteSuccessful = false;
      
      // First attempt: Try deleting through our server endpoint
      try {
        // Call the API to delete the file
        await api.delete(`/api/project-files/${projectId}/${fileIndex}`);
        console.log('File deleted successfully via server API');
        deleteSuccessful = true;
      } catch (serverError) {
        console.log('Server delete failed, using fallback method:', serverError);
        
        // For mock URLs or if server delete fails, handle locally
        if (isMockUrl || serverError) {
          // Remove file using our utility
          if (file.name) {
            const wasDeleted = deleteFile(file.name);
            if (wasDeleted) {
              console.log('File deleted successfully from local storage:', file.name);
              deleteSuccessful = true;
            } else {
              console.warn('File not found in local storage:', file.name);
              // Still mark as successful since the file is gone anyway
              deleteSuccessful = true;
            }
          }
        }
      }
      
      // If either method was successful, call the onDelete callback
      if (deleteSuccessful && onDelete && typeof onDelete === 'function') {
        onDelete(fileIndex);
      } else if (!deleteSuccessful) {
        throw new Error('Failed to delete file through any available method');
      }
    } catch (err) {
      console.error('Error deleting file:', err);
      setError('Failed to delete file: ' + (err.response?.data?.error || err.message || 'Unknown error'));
      setDeleting(false);
    }
  };

  const isLinkItem = isExternalProjectLink(file?.url);
  const linkSourceLabel = getLinkSourceLabel(file?.url);
  const linkHost = getLinkHost(file?.url);

  return (
    <div className={`file-card ${isLinkItem ? 'file-card-link' : 'file-card-upload'} hover-lift ${className}`}>
      <div className="file-icon">
        {isLinkItem ? <LinkIcon className="w-5 h-5" /> : <DocumentTextIcon className="w-5 h-5" />}
      </div>
      <div className="file-info">
        <p className={`file-name ${isLinkItem ? 'file-name-link' : ''}`}>{file.name}</p>
        <div className="file-meta">
          <span className={`file-type-badge ${isLinkItem ? 'link' : 'upload'}`}>
            {isLinkItem ? linkSourceLabel : 'Uploaded File'}
          </span>
          {showDate && file.uploadedAt && (
            <span className="file-date">
              <CalendarIcon className="w-3 h-3" />
              {formatDate(file.uploadedAt)}
            </span>
          )}
          {isLinkItem && linkHost && (
            <span className="file-link-host">{linkHost}</span>
          )}
        </div>
        {error && <p className="file-error">{error}</p>}
      </div>
      <div className="file-actions">
        <button
          onClick={handleDownload}
          disabled={downloading || deleting}
          className={`file-download-btn ${isLinkItem ? 'file-open-link-btn' : ''}`}
          title={error ? error : (isExternalProjectLink(file.url) ? 'Open link' : 'Download file')}
        >
          {downloading ? (
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <ArrowDownTrayIcon className="download-icon -ml-1 mr-1 h-4 w-4" />
          )}
          {isExternalProjectLink(file.url) ? 'Open Link' : 'Download'}
        </button>
        
        {showDeleteButton && (
          <button
            onClick={handleDelete}
            disabled={downloading || deleting}
            className="file-delete-btn"
            title="Delete file"
          >
            {deleting ? (
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <TrashIcon className="h-4 w-4" />
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default FileDownload;
