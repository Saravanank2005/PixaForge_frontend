import { useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { 
  BellIcon, 
  Bars3Icon as MenuIcon,
  UserIcon,
  ArrowRightOnRectangleIcon as LogoutIcon,
  MagnifyingGlassIcon,
  Cog6ToothIcon,
  EnvelopeIcon,
  QuestionMarkCircleIcon,
  ChevronRightIcon,
  FolderIcon,
  CheckCircleIcon,
  SunIcon,
  MoonIcon
} from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';
import '../../styles/navbar.css';

const Navbar = ({ toggleSidebar }) => {
  const { currentUser, logout, isClient, isDesigner } = useAuth();
  const { notifications, markAsRead, markAllAsRead } = useNotifications();
  const { theme, toggleTheme } = useTheme();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const location = useLocation();

  const unreadCount = notifications?.filter(n => !n.read)?.length || 0;
  const isDark = theme === 'dark';
  
  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showNotifications || showProfile) {
        if (!event.target.closest('.navbar-dropdown') && 
            !event.target.closest('.navbar-action')) {
          setShowNotifications(false);
          setShowProfile(false);
        }
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications, showProfile]);
  
  // Close dropdowns when location changes
  useEffect(() => {
    setShowNotifications(false);
    setShowProfile(false);
  }, [location]);

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
    setShowProfile(false);
  };

  const toggleProfileMenu = () => {
    setShowProfile(!showProfile);
    setShowNotifications(false);
  };

  const handleMarkAllAsRead = () => {
    if (markAllAsRead) {
      markAllAsRead();
    } else {
      notifications?.forEach(notification => markAsRead(notification._id));
    }
  };

  const handleLogout = () => {
    logout();
    setShowProfile(false);
  };
  
  // Get user's first initial for avatar
  const getInitial = () => {
    if (currentUser) {
      // Check for name or username property
      if (currentUser.name) {
        return currentUser.name.charAt(0).toUpperCase();
      } else if (currentUser.username) {
        return currentUser.username.charAt(0).toUpperCase();
      }
    }
    return 'U'; // Default to 'U' for User instead of C/D
  };
  
  // Get user's display name
  const getUserName = () => {
    if (currentUser) {
      // Check for name or username property
      if (currentUser.name) {
        return currentUser.name;
      } else if (currentUser.username) {
        return currentUser.username;
      }
    }
    return 'User'; // Default to 'User' instead of Client/Designer
  };
  
  // Get breadcrumbs based on current location
  const getBreadcrumbs = () => {
    const pathnames = location.pathname.split('/').filter(x => x);
    
    if (pathnames.length <= 1) return null;
    
    const breadcrumbs = [];
    let path = '';
    
    pathnames.forEach((name, index) => {
      path += `/${name}`;
      
      // Skip 'app' in the breadcrumb display
      if (name === 'app') return;
      
      let displayName = name.charAt(0).toUpperCase() + name.slice(1);
      
      // Handle IDs in the path
      if (name.length > 20) {
        displayName = 'Details';
      }
      
      // Replace common paths with friendly names
      if (name === 'projects') displayName = 'Projects';
      if (name === 'designers') displayName = 'Designers';
      if (name === 'messages') displayName = 'Messages';
      if (name === 'profile') displayName = 'Profile';
      if (name === 'profilesettings') displayName = 'Settings';
      
      const isLast = index === pathnames.length - 1 || 
                    (index === pathnames.length - 2 && pathnames[pathnames.length - 1].length > 20);
      
      breadcrumbs.push({
        name: displayName,
        path: path,
        isLast
      });
    });
    
    return breadcrumbs;
  };
  
  const breadcrumbs = getBreadcrumbs();

  return (
    <nav className="navbar">
      {/* Left section */}
      <div className="navbar-start">
        <button 
          className="navbar-menu-btn" 
          onClick={toggleSidebar}
          aria-label="Toggle menu"
        >
          <MenuIcon className="navbar-action-icon" />
        </button>
        
        {breadcrumbs && (
          <div className="navbar-breadcrumbs ml-4 hidden md:flex">
            <div className="breadcrumb-item">
              <Link to="/app" className="breadcrumb-link">Dashboard</Link>
              <span className="breadcrumb-separator">
                <ChevronRightIcon className="w-3 h-3" />
              </span>
            </div>
            
            {breadcrumbs.map((breadcrumb, index) => (
              <div key={index} className="breadcrumb-item">
                {breadcrumb.isLast ? (
                  <span className="breadcrumb-current">{breadcrumb.name}</span>
                ) : (
                  <>
                    <Link to={breadcrumb.path} className="breadcrumb-link">
                      {breadcrumb.name}
                    </Link>
                    <span className="breadcrumb-separator">
                      <ChevronRightIcon className="w-3 h-3" />
                    </span>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Center section */}
      <div className="navbar-center">
        <div className="navbar-search">
          <input 
            type="text" 
            className="navbar-search-input"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <MagnifyingGlassIcon className="navbar-search-icon" />
        </div>
      </div>
      
      {/* Right section */}
      <div className="navbar-end">
        {/* Theme toggle */}
        <button 
          className="navbar-action"
          onClick={toggleTheme}
          aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
        >
          {isDark ? (
            <SunIcon className="navbar-action-icon" />
          ) : (
            <MoonIcon className="navbar-action-icon" />
          )}
        </button>
        
        {/* Notifications */}
        <div className="relative">
          <button 
            className="navbar-action"
            onClick={toggleNotifications}
            aria-label="Notifications"
          >
            <BellIcon className="navbar-action-icon" />
            {unreadCount > 0 && (
              <span className="navbar-notification-badge">{unreadCount}</span>
            )}
          </button>
          
          {showNotifications && (
            <div className="navbar-dropdown">
              <div className="navbar-dropdown-header">
                <h3 className="navbar-dropdown-title">Notifications</h3>
                {unreadCount > 0 && (
                  <button 
                    className="navbar-dropdown-action"
                    onClick={handleMarkAllAsRead}
                  >
                    Mark all as read
                  </button>
                )}
              </div>
              
              <div className="navbar-dropdown-body">
                {!notifications || notifications.length === 0 ? (
                  <div className="navbar-dropdown-empty">
                    <BellIcon className="navbar-dropdown-empty-icon" />
                    <p>No notifications yet</p>
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div 
                      key={notification._id} 
                      className={`notification-item ${!notification.read ? 'unread' : ''}`}
                      onClick={() => markAsRead(notification._id)}
                    >
                      <div className="notification-icon">
                        {notification.type === 'message' ? (
                          <EnvelopeIcon className="w-4 h-4" />
                        ) : notification.type === 'project' ? (
                          <FolderIcon className="w-4 h-4" />
                        ) : (
                          <CheckCircleIcon className="w-4 h-4" />
                        )}
                      </div>
                      
                      <div className="notification-content">
                        <p className="notification-message">{notification.message}</p>
                        <p className="notification-time">
                          {formatDistanceToNow(new Date(notification.createdAt), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                      
                      {!notification.read && (
                        <div className="notification-unread-dot"></div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* User profile */}
        <div className="relative">
          <button 
            className="navbar-action"
            onClick={toggleProfileMenu}
            aria-label="User menu"
          >
            <div className="profile-avatar w-8 h-8">
              {getInitial()}
            </div>
          </button>
          
          {showProfile && (
            <div className="navbar-dropdown profile-dropdown">
              <div className="profile-header">
                <div className="profile-avatar">
                  {getInitial()}
                </div>
                <div className="profile-info">
                  <div className="profile-name">
                    {getUserName()}
                  </div>
                  <div className="profile-role">
                    {isClient ? 'Client' : isDesigner ? 'Designer' : 'User'}
                  </div>
                </div>
              </div>
              
              <div className="profile-menu">
                <Link to="/app/profile" className="profile-menu-item">
                  <UserIcon className="profile-menu-icon" />
                  Your Profile
                </Link>
                <Link to="/app/profilesettings" className="profile-menu-item">
                  <Cog6ToothIcon className="profile-menu-icon" />
                  Settings
                </Link>
                <Link to="/app/help" className="profile-menu-item">
                  <QuestionMarkCircleIcon className="profile-menu-icon" />
                  Help & Support
                </Link>
                <div className="sidebar-divider"></div>
                <button 
                  className="profile-menu-item danger"
                  onClick={handleLogout}
                >
                  <LogoutIcon className="profile-menu-icon" />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
