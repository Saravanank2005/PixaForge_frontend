import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import FileDownload from './FileDownload';
import { DocumentIcon, FolderIcon } from '@heroicons/react/24/outline';
import '../../styles/animations.css';
import '../../styles/fileComponents.css';

/**
 * Component for displaying a list of files with download functionality
 * @param {Object} props
 * @param {string} props.projectId - ID of the project to fetch files for
 * @param {Array} props.files - Optional array of files to display (if not fetching from API)
 * @param {boolean} props.showTitle - Whether to show the component title
 * @param {string} props.title - Title to display above the file list
 * @param {string} props.className - Additional CSS classes
 */
const FileList = ({ 
  projectId, 
  files: initialFiles, 
  showTitle = true, 
  title = "Files", 
  className = '',
  onFileDeleted
}) => {
  const [files, setFiles] = useState(initialFiles || []);
  const [loading, setLoading] = useState(!initialFiles);
  const [error, setError] = useState('');

  useEffect(() => {
    // If files are provided as props, use those
    if (initialFiles) {
      setFiles(initialFiles);
      setLoading(false);
      return;
    }

    // Otherwise fetch files from API
    if (projectId) {
      fetchFiles();
    }
  }, [projectId, initialFiles]);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/files/project/${projectId}`);
      setFiles(response.data);
      setError('');
    } catch (err) {
      console.error('Error fetching files:', err);
      setError('Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  // Handle file deletion
  const handleFileDeleted = (fileIndex) => {
    // Remove the file from the local state
    const updatedFiles = [...files];
    updatedFiles.splice(fileIndex, 1);
    setFiles(updatedFiles);

    // Call the parent component's callback if provided
    if (onFileDeleted && typeof onFileDeleted === 'function') {
      onFileDeleted(fileIndex);
    }
  };

  if (loading) {
    return (
      <div className={`file-list-container ${className}`}>
        <div className="p-4">
          {showTitle && <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>}
          <div className="animate-pulse space-y-4">
            <div className="h-12 bg-gray-200 rounded-md"></div>
            <div className="h-12 bg-gray-200 rounded-md"></div>
            <div className="h-12 bg-gray-200 rounded-md"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`file-list-container ${className}`}>
        <div className="p-4">
          {showTitle && <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>}
          <div className="bg-red-50 border-l-4 border-red-500 p-4 animate-fade-in">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className={`file-list-container ${className}`}>
        <div className="p-4">
          {showTitle && <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>}
          <div className="file-list-empty animate-fade-in">
            <DocumentIcon className="mx-auto h-12 w-12 animate-float" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No files</h3>
            <p className="mt-1 text-sm text-gray-500">No files have been uploaded yet.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`file-list-container ${className}`}>
      <div className="file-list-header">
        {showTitle && (
          <h3 className="text-lg font-medium">
            <FolderIcon className="inline-block w-5 h-5 mr-2" />
            {title}
          </h3>
        )}
      </div>
      <div className="file-list-body stagger-list">
        {files.map((file, index) => (
          <FileDownload
            key={file._id || index}
            file={file}
            projectId={projectId}
            fileIndex={index}
            showDate={true}
            onDelete={handleFileDeleted}
            showDeleteButton={true}
          />
        ))}
      </div>
    </div>
  );
};

export default FileList;
