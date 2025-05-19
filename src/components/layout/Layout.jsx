import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { useState, useEffect } from 'react';
import '../../styles/sidebar.css';
import '../../styles/background.css';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  // Close sidebar on window resize if screen is large
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setSidebarOpen(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return (
    <div className="flex h-screen overflow-hidden relative">
      {/* Enhanced Background */}
      <div className="app-background"></div>
      <div className="diagonal-pattern"></div>
      <div className="topographic-pattern"></div>
      
      {/* Abstract Shapes */}
      <div className="shape-decoration shape-circle"></div>
      <div className="shape-decoration shape-square"></div>
      <div className="shape-decoration shape-triangle"></div>
      <div className="shape-decoration shape-rectangle"></div>
      
      {/* Sidebar */}
      <Sidebar 
        open={sidebarOpen} 
        toggleSidebar={toggleSidebar} 
      />
      
      {/* Main Content */}
      <div className="main-content flex-1 flex flex-col overflow-hidden">
        <Navbar 
          toggleSidebar={toggleSidebar} 
          className="z-30"
        />
        
        <main className="flex-1 overflow-y-auto p-6 md:p-8 pt-20">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;