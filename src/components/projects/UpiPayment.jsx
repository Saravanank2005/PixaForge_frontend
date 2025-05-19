import { useState, useEffect, useRef } from 'react';
import { QrCodeIcon, CheckCircleIcon, CurrencyDollarIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import api from '../../utils/api';

const UpiPayment = ({ project, isClient, onStatusChange, onRefresh }) => {
  const [upiId, setUpiId] = useState(project.upiId || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [useBackupQr, setUseBackupQr] = useState(false);
  const [showFallbackQr, setShowFallbackQr] = useState(false);
  const [qrLoadAttempted, setQrLoadAttempted] = useState(false);
  const [fallbackDataUrl, setFallbackDataUrl] = useState('');
  const qrCanvasRef = useRef(null);
  
  // Generate QR code URL when project or upiId changes
  useEffect(() => {
    if (project.upiId) {
      // Generate primary QR code URL
      generateQrCodeUrl(project.upiId, project.title, project.budget);
      
      // Generate multiple fallback options immediately
      try {
        // UPI payment string that all QR codes will encode
        const upiPaymentString = `upi://pay?pa=${encodeURIComponent(project.upiId)}&pn=Designer&am=${project.budget}&cu=INR&tn=${encodeURIComponent(project.title)}`;
        
        // Primary fallback - QR Server API
        const qrServerUrl = createUpiQrDataUrl(upiPaymentString);
        setFallbackDataUrl(qrServerUrl);
        
        // Secondary fallback - Try to pre-load the QR image to check if it works
        const img = new Image();
        img.onload = () => {
          console.log('Pre-loaded QR code successfully');
          // The image loaded successfully, we can use it later
          setQrLoadAttempted(true);
        };
        img.onerror = () => {
          console.error('Pre-loaded QR code failed to load');
          // If even the fallback fails to load, prepare to show the canvas fallback
          setShowFallbackQr(true);
        };
        img.src = qrServerUrl;
      } catch (err) {
        console.error('Failed to generate fallback QR code:', err);
        // Ensure we have a fallback ready
        setShowFallbackQr(true);
      }
    }
  }, [project.upiId, project.title, project.budget]);
  
  // Generate fallback QR code directly in the browser
  useEffect(() => {
    if (showFallbackQr && qrCanvasRef.current && project.upiId) {
      try {
        const upiPaymentString = `upi://pay?pa=${encodeURIComponent(project.upiId)}&pn=Designer&am=${project.budget}&cu=INR&tn=${encodeURIComponent(project.title)}`;
        
        // Create a data URL for the UPI payment string
        const dataUrl = createUpiQrDataUrl(upiPaymentString);
        
        // Draw the QR code as an image
        const img = new Image();
        img.onload = () => {
          const canvas = qrCanvasRef.current;
          const ctx = canvas.getContext('2d');
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          
          // Add a border
          ctx.strokeStyle = '#000';
          ctx.lineWidth = 2;
          ctx.strokeRect(0, 0, canvas.width, canvas.height);
        };
        img.src = dataUrl;
      } catch (err) {
        console.error('Error generating fallback QR code:', err);
        // If all else fails, draw a simple QR-like pattern
        drawSimpleQRCode(project.upiId, project.budget, qrCanvasRef.current);
      }
    }
  }, [showFallbackQr, project.upiId, project.title, project.budget]);
  
  // Function to generate QR code URL with multiple service options
  const generateQrCodeUrl = (upiId, title, budget) => {
    try {
      // Create UPI payment string
      const upiPaymentString = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=Designer&am=${budget}&cu=INR&tn=${encodeURIComponent(title)}`;
      
      // Try multiple QR code services for better reliability
      // Primary: Google Charts API
      const googleQrUrl = `https://chart.googleapis.com/chart?cht=qr&chs=300x300&chl=${encodeURIComponent(upiPaymentString)}`;
      
      // Set QR code URL
      setQrCodeUrl(googleQrUrl);
      
      // Log the generated URL for debugging
      console.log('Generated QR code URL:', googleQrUrl);
    } catch (err) {
      console.error('Error generating QR code URL:', err);
      // If Google Charts fails, immediately set up for fallback
      setUseBackupQr(true);
    }
  };
  
  // Function to create a data URL for a UPI QR code
  const createUpiQrDataUrl = (upiString) => {
    // Try multiple QR code services for better reliability
    // We use QRServer.com as our fallback service
    const qrServerUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(upiString)}&format=png&margin=10`;
    
    // Alternative service if needed (commented out for now, but can be enabled if needed)
    // const alternativeUrl = `https://quickchart.io/qr?text=${encodeURIComponent(upiString)}&size=300&margin=10`;
    
    console.log('Generated fallback QR URL:', qrServerUrl);
    return qrServerUrl;
  };
  
  // Function to draw a simple QR-like pattern as a last resort
  const drawSimpleQRCode = (upiId, budget, canvas) => {
    const size = 300;
    canvas.width = size;
    canvas.height = size;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw a white background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, size, size);
    
    // Draw a frame
    ctx.fillStyle = 'black';
    ctx.lineWidth = 4;
    ctx.strokeRect(0, 0, size, size);
    
    // Draw text for manual entry
    ctx.fillStyle = 'black';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('UPI Payment Information', size/2, 50);
    
    ctx.font = '16px Arial';
    ctx.fillText('UPI ID:', size/2, 100);
    ctx.font = 'bold 18px monospace';
    ctx.fillText(upiId, size/2, 130);
    
    ctx.font = '16px Arial';
    ctx.fillText('Amount:', size/2, 180);
    ctx.font = 'bold 24px Arial';
    ctx.fillText(`₹${budget}`, size/2, 220);
    
    ctx.font = '14px Arial';
    ctx.fillText('Please enter these details manually', size/2, 270);
    ctx.fillText('in your UPI payment app', size/2, 290);
  };

  // Handle UPI ID update for designers
  const handleUpiUpdate = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      
      if (!upiId) {
        setError('UPI ID is required');
        setLoading(false);
        return;
      }
      
      await api.put(`/api/projects/${project._id}/upi`, { upiId });
      
      setSuccess('UPI ID updated successfully');
      if (onRefresh) onRefresh();
      
      setLoading(false);
    } catch (err) {
      console.error('Error updating UPI ID:', err);
      setError(err.response?.data?.error || 'Failed to update UPI ID. Please try again.');
      setLoading(false);
    }
  };

  // Handle project status change
  const handleStatusChange = async (newStatus) => {
    try {
      setLoading(true);
      setError('');
      
      // If marking as completed, require UPI ID
      if (newStatus === 'completed') {
        if (!upiId && !project.upiId) {
          setError('UPI ID is required to mark project as completed');
          setLoading(false);
          return;
        }
        
        await api.put(`/api/projects/${project._id}/status`, { 
          status: newStatus,
          upiId: upiId || project.upiId
        });
      } else {
        await api.put(`/api/projects/${project._id}/status`, { status: newStatus });
      }
      
      setSuccess(`Project marked as ${newStatus} successfully`);
      if (onStatusChange) onStatusChange(newStatus);
      if (onRefresh) onRefresh();
      
      setLoading(false);
    } catch (err) {
      console.error('Error updating project status:', err);
      setError(err.response?.data?.error || 'Failed to update status. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 animate-fade-in">
      {error && (
        <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-4 bg-green-50 border-l-4 border-green-500 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">{success}</p>
            </div>
          </div>
        </div>
      )}

      {/* Designer View - Project Actions */}
      {!isClient && (
        <div className="mb-6 bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {project.status === 'pending' && 'Project Request'}
            {project.status === 'accepted' && 'Project Accepted'}
            {project.status === 'in_progress' && 'Project In Progress'}
            {project.status === 'completed' && 'Project Completed'}
          </h3>
          
          {/* Pending Project - Accept/Reject */}
          {project.status === 'pending' && (
            <div>
              <p className="text-gray-600 mb-4">
                You have received a new project request. Would you like to accept or reject it?
              </p>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => handleStatusChange('accepted')}
                  disabled={loading}
                  className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  <CheckIcon className="h-5 w-5 mr-1" />
                  {loading ? 'Processing...' : 'Accept Project'}
                </button>
                
                <button
                  onClick={() => handleStatusChange('rejected')}
                  disabled={loading}
                  className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <XMarkIcon className="h-5 w-5 mr-1" />
                  {loading ? 'Processing...' : 'Reject Project'}
                </button>
              </div>
            </div>
          )}
          
          {/* Accepted or In Progress - UPI ID and Status Update */}
          {(project.status === 'accepted' || project.status === 'in_progress') && (
            <div>
              <div className="mb-4">
                <label htmlFor="upi-id" className="block text-sm font-medium text-gray-700 mb-1">
                  Your UPI ID {project.status === 'in_progress' && '(required to complete project)'}
                </label>
                <input
                  type="text"
                  id="upi-id"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="e.g. yourname@upi"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  required
                />
                <p className="mt-1 text-sm text-gray-500">
                  This UPI ID will be used by the client to make payment directly to you.
                </p>
              </div>
              
              <div className="flex space-x-3">
                {project.status === 'accepted' && (
                  <>
                    <button
                      onClick={handleUpiUpdate}
                      disabled={loading || !upiId}
                      className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      <CurrencyDollarIcon className="h-5 w-5 mr-1" />
                      {loading ? 'Saving...' : 'Save UPI ID'}
                    </button>
                    
                    <button
                      onClick={() => handleStatusChange('in_progress')}
                      disabled={loading}
                      className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      {loading ? 'Processing...' : 'Start Working'}
                    </button>
                  </>
                )}
                
                {project.status === 'in_progress' && (
                  <button
                    onClick={() => handleStatusChange('completed')}
                    disabled={loading || (!upiId && !project.upiId)}
                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    <CheckCircleIcon className="h-5 w-5 mr-1" />
                    {loading ? 'Processing...' : 'Mark as Completed'}
                  </button>
                )}
              </div>
            </div>
          )}
          
          {/* Completed - Waiting for Payment */}
          {project.status === 'completed' && (
            <div className="text-center">
              <div className="bg-yellow-50 p-4 rounded-md mb-4">
                <p className="text-sm font-medium text-yellow-700">Payment Pending</p>
                <p className="text-gray-600 mt-1">
                  This project has been marked as completed. The client can now see your UPI QR code for payment.
                </p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-md mb-4">
                <p className="text-sm font-medium text-gray-700">Your UPI ID:</p>
                <p className="font-mono text-gray-900">{project.upiId}</p>
              </div>
              
              <div className="bg-white p-2 border rounded-lg mb-4">
                {!showFallbackQr ? (
                  !useBackupQr ? (
                    <img 
                      src={qrCodeUrl || project.upiQrCode} 
                      alt="UPI Payment QR Code" 
                      className="max-w-full h-auto max-h-48 mx-auto"
                      onLoad={() => {
                        console.log('Designer view: Primary QR code loaded successfully');
                        setQrLoadAttempted(true);
                      }}
                      onError={(e) => {
                        console.log('Designer view: Primary QR code failed to load, trying backup...');
                        setQrLoadAttempted(true);
                        if (project.backupQrCode) {
                          setUseBackupQr(true);
                        } else if (fallbackDataUrl) {
                          console.log('Designer view: Using fallback data URL');
                          e.target.src = fallbackDataUrl;
                          e.target.onerror = (e2) => {
                            console.log('Designer view: Fallback data URL also failed');
                            setShowFallbackQr(true);
                          };
                        } else {
                          setShowFallbackQr(true);
                        }
                      }}
                    />
                  ) : (
                    <img 
                      src={project.backupQrCode} 
                      alt="UPI Payment QR Code (Backup)" 
                      className="max-w-full h-auto max-h-48 mx-auto"
                      onLoad={() => {
                        console.log('Designer view: Backup QR code loaded successfully');
                      }}
                      onError={(e) => {
                        console.log('Designer view: Backup QR code also failed, using fallback...');
                        if (fallbackDataUrl) {
                          console.log('Designer view: Trying fallback data URL');
                          e.target.src = fallbackDataUrl;
                          e.target.onerror = (e2) => {
                            console.log('Designer view: All QR options failed');
                            setShowFallbackQr(true);
                          };
                        } else {
                          setShowFallbackQr(true);
                        }
                      }}
                    />
                  )
                ) : (
                  <div>
                    <div className="relative">
                      <canvas 
                        ref={qrCanvasRef} 
                        className="max-w-full h-auto max-h-48 mx-auto bg-white p-2 border border-gray-200 rounded"
                      />
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0">
                        <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(`upi://pay?pa=${encodeURIComponent(project.upiId)}&pn=Designer&am=${project.budget}&cu=INR&tn=${encodeURIComponent(project.title)}`)}`}
                          alt="Hidden QR" 
                          className="hidden" 
                          onLoad={(e) => {
                            // If this loads, draw it on the canvas
                            const canvas = qrCanvasRef.current;
                            if (canvas) {
                              const ctx = canvas.getContext('2d');
                              canvas.width = e.target.width;
                              canvas.height = e.target.height;
                              ctx.drawImage(e.target, 0, 0);
                            }
                          }}
                        />
                      </div>
                      <p className="text-xs text-center mt-1 text-gray-500">
                        Scan with any UPI app - {project.upiId} - Amount: ₹{project.budget}
                      </p>
                    </div>
                  </div>
                )}
              </div>
              
              <p className="text-sm text-gray-600">
                Once the client makes the payment, they will mark the project as approved.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Client View - Project Actions */}
      {isClient && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {project.status === 'pending' && 'Project Pending'}
            {project.status === 'accepted' && 'Project Accepted'}
            {project.status === 'in_progress' && 'Project In Progress'}
            {project.status === 'completed' && 'Payment Required'}
            {project.status === 'approved' && 'Project Completed'}
          </h3>
          
          {/* Pending Project */}
          {project.status === 'pending' && (
            <div className="text-center">
              <div className="bg-yellow-50 p-4 rounded-md mb-4">
                <p className="text-sm font-medium text-yellow-700">Waiting for Designer</p>
                <p className="text-gray-600 mt-1">
                  Your project request has been sent to the designer. Waiting for them to accept.
                </p>
              </div>
              
              <button
                onClick={() => handleStatusChange('cancelled')}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <XMarkIcon className="h-5 w-5 mr-1" />
                {loading ? 'Processing...' : 'Cancel Project'}
              </button>
            </div>
          )}
          
          {/* Accepted Project */}
          {project.status === 'accepted' && (
            <div className="text-center">
              <div className="bg-green-50 p-4 rounded-md mb-4">
                <p className="text-sm font-medium text-green-700">Project Accepted</p>
                <p className="text-gray-600 mt-1">
                  The designer has accepted your project. They will start working on it soon.
                </p>
              </div>
              
              <button
                onClick={() => handleStatusChange('cancelled')}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <XMarkIcon className="h-5 w-5 mr-1" />
                {loading ? 'Processing...' : 'Cancel Project'}
              </button>
            </div>
          )}
          
          {/* In Progress Project */}
          {project.status === 'in_progress' && (
            <div className="text-center">
              <div className="bg-blue-50 p-4 rounded-md mb-4">
                <p className="text-sm font-medium text-blue-700">Project In Progress</p>
                <p className="text-gray-600 mt-1">
                  The designer is currently working on your project. You will be notified when it's completed.
                </p>
              </div>
              
              <button
                onClick={() => handleStatusChange('cancelled')}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <XMarkIcon className="h-5 w-5 mr-1" />
                {loading ? 'Processing...' : 'Cancel Project'}
              </button>
            </div>
          )}
          
          {/* Completed Project - Payment QR Code */}
          {project.status === 'completed' && project.upiQrCode && (
            <div className="text-center">
              <div className="flex flex-col items-center">
                <QrCodeIcon className="h-10 w-10 text-primary-600 mb-2" />
                <h3 className="text-lg font-semibold mb-4">Scan QR Code to Pay</h3>
                
                <div className="bg-white p-2 border rounded-lg mb-4">
                  {!showFallbackQr ? (
                    !useBackupQr ? (
                      <img 
                        src={qrCodeUrl || project.upiQrCode} 
                        alt="UPI Payment QR Code" 
                        className="max-w-full h-auto max-h-64"
                        onLoad={() => {
                          console.log('Primary QR code loaded successfully');
                          setQrLoadAttempted(true);
                        }}
                        onError={(e) => {
                          console.log('Primary QR code failed to load, trying backup...');
                          // Try the backup QR code if available
                          if (project.backupQrCode) {
                            setUseBackupQr(true);
                          } else if (fallbackDataUrl) {
                            // Try our pre-generated fallback URL
                            e.target.src = fallbackDataUrl;
                            e.target.onerror = (e2) => {
                              console.log('Fallback QR URL also failed, showing manual QR...');
                              setShowFallbackQr(true);
                            };
                          } else {
                            // If all else fails, show the canvas fallback
                            setShowFallbackQr(true);
                          }
                        }}
                      />
                    ) : (
                      <img 
                        src={project.backupQrCode} 
                        alt="UPI Payment QR Code (Backup)" 
                        className="max-w-full h-auto max-h-64"
                        onLoad={() => {
                          console.log('Backup QR code loaded successfully');
                        }}
                        onError={(e) => {
                          console.log('Backup QR code also failed, trying fallback URL...');
                          if (fallbackDataUrl) {
                            // Try our pre-generated fallback URL
                            e.target.src = fallbackDataUrl;
                            e.target.onerror = (e2) => {
                              console.log('All QR options failed, showing manual QR...');
                              setShowFallbackQr(true);
                            };
                          } else {
                            setShowFallbackQr(true);
                          }
                        }}
                      />
                    )
                  ) : (
                    <div>
                      <div className="relative">
                        <canvas 
                          ref={qrCanvasRef} 
                          className="max-w-full h-auto max-h-64 mx-auto bg-white p-2 border border-gray-200 rounded"
                        />
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0">
                          <img 
                            src={fallbackDataUrl || `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(`upi://pay?pa=${encodeURIComponent(project.upiId)}&pn=Designer&am=${project.budget}&cu=INR&tn=${encodeURIComponent(project.title)}`)}`}
                            alt="Hidden QR" 
                            className="hidden" 
                            onLoad={(e) => {
                              console.log('Hidden QR image loaded, drawing to canvas');
                              // If this loads, draw it on the canvas
                              const canvas = qrCanvasRef.current;
                              if (canvas) {
                                const ctx = canvas.getContext('2d');
                                canvas.width = e.target.width;
                                canvas.height = e.target.height;
                                ctx.drawImage(e.target, 0, 0);
                                
                                // Add a border and title for better visibility
                                ctx.strokeStyle = '#000';
                                ctx.lineWidth = 2;
                                ctx.strokeRect(0, 0, canvas.width, canvas.height);
                              }
                            }}
                            onError={(e) => {
                              console.log('Even hidden QR failed to load, drawing simple QR');
                              // If all else fails, draw a simple QR-like pattern
                              drawSimpleQRCode(project.upiId, project.budget, qrCanvasRef.current);
                            }}
                          />
                        </div>
                        <p className="text-xs text-center mt-1 text-gray-500">
                          Scan with any UPI app - {project.upiId} - Amount: ₹{project.budget}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                
                <p className="text-sm text-gray-600 mb-2">
                  Scan this QR code with any UPI app to pay the designer directly.
                </p>
                
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-700 bg-gray-50 p-2 rounded-md w-full mb-4">
                  <span>UPI ID:</span>
                  <span className="font-mono font-medium">{project.upiId}</span>
                </div>
                
                <p className="text-sm text-gray-600 mb-4">
                  After making the payment, click the button below to mark the project as approved.
                </p>
                
                <button
                  onClick={() => handleStatusChange('approved')}
                  disabled={loading}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  <CheckCircleIcon className="h-5 w-5 mr-1" />
                  {loading ? 'Processing...' : 'I Have Paid - Approve Project'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Payment Completed View */}
      {project.status === 'approved' && (
        <div className="text-center bg-white p-6 rounded-lg shadow-md">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 mb-4">
            <CheckCircleIcon className="h-10 w-10" />
          </div>
          <h4 className="text-xl font-semibold text-green-700 mb-2">Project Completed & Payment Processed</h4>
          <p className="text-gray-600 mb-4">
            This project has been successfully completed and payment has been processed.
          </p>
          
          <div className="bg-gray-50 p-4 rounded-md mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-700">Project Budget:</span>
              <span className="font-semibold text-gray-900">₹{project.budget}</span>
            </div>
            
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-700">Payment Method:</span>
              <span className="font-semibold text-gray-900">UPI</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-700">UPI ID:</span>
              <span className="font-mono text-gray-900">{project.upiId}</span>
            </div>
          </div>
          
          {project.approvedAt && (
            <p className="text-sm text-gray-500">
              Approved on {new Date(project.approvedAt).toLocaleDateString()} at {new Date(project.approvedAt).toLocaleTimeString()}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default UpiPayment;
