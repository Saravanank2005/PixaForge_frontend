import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  HomeIcon,
  UsersIcon,
  FolderIcon,
  PlusCircleIcon,
  ChatBubbleLeftRightIcon,
  UserIcon,
  ChevronLeftIcon,
  Squares2X2Icon,
  BellIcon,
  QuestionMarkCircleIcon,
  ArrowRightOnRectangleIcon,
  BriefcaseIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';
import api from '../../utils/api';
import UserAvatar from '../common/UserAvatar';
import '../../styles/sidebar.css';

const Sidebar = ({ open, toggleSidebar }) => {
  const { currentUser, isClient, isDesigner, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [counts, setCounts] = useState({
    unreadMessages: 0,
    unreadNotifications: 0,
    activeProjects: 0
  });
  const [loading, setLoading] = useState(true);
  
  // Fetch counts from API
  useEffect(() => {
    // Skip if no user is logged in
    if (!currentUser) return;
    
    const fetchCounts = async () => {
      try {
        setLoading(true);
        const [notificationsRes, conversationsRes, statsRes] = await Promise.allSettled([
          api.get('/api/notifications', { params: { read: false } }),
          api.get('/api/messages/conversations'),
          api.get('/api/projects/stats')
        ]);
        
        const unreadNotifications = notificationsRes.status === 'fulfilled'
          ? notificationsRes.value.data.length
          : 0;

        const unreadMessages = conversationsRes.status === 'fulfilled'
          ? conversationsRes.value.data.reduce(
              (total, conversation) => total + (conversation.unreadCount || 0),
              0
            )
          : 0;

        const activeProjects = statsRes.status === 'fulfilled'
          ? statsRes.value.data.activeProjects
          : 0;

        // Process all data at once with per-request fallbacks
        setCounts({
          unreadNotifications,
          unreadMessages,
          activeProjects
        });
      } catch (error) {
        console.error('Error fetching counts:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCounts();
    
    // Refresh every 2 minutes
    const intervalId = setInterval(fetchCounts, 120000);
    return () => clearInterval(intervalId);
  }, [currentUser]);
  
  const handleCollapse = () => setCollapsed(!collapsed);
  
  // Define navigation items grouped by sections
  const navSections = [
    {
      title: 'Main',
      items: [
        {
          name: 'Dashboard',
          path: '/app',
          icon: HomeIcon,
          showTo: ['client', 'designer'],
        },
        {
          name: 'Projects',
          path: '/app/projects',
          icon: FolderIcon,
          showTo: ['client', 'designer'],
          badgeKey: 'activeProjects',
        },
      ]
    },
    {
      title: 'Actions',
      items: [
        {
          name: 'Browse Designers',
          path: '/app/designers',
          icon: UsersIcon,
          showTo: ['client'],
        },
        {
          name: 'Talent Marketplace',
          path: '/app/marketplace',
          icon: BriefcaseIcon,
          showTo: ['client'],
        },
        {
          name: 'Design Match Studio',
          path: '/app/design-match',
          icon: SparklesIcon,
          showTo: ['client'],
        },
        {
          name: 'Create Project',
          path: '/app/projects/create',
          icon: PlusCircleIcon,
          showTo: ['client'],
        },
        {
          name: 'Messages',
          path: '/app/messages',
          icon: ChatBubbleLeftRightIcon,
          showTo: ['client', 'designer'],
          badgeKey: 'unreadMessages',
        },
        {
          name: 'Notifications',
          path: '/app/notifications',
          icon: BellIcon,
          showTo: ['client', 'designer'],
          badgeKey: 'unreadNotifications',
        },
      ]
    },
    {
      title: 'Account',
      items: [
        {
          name: 'Profile',
          path: '/app/profile',
          icon: UserIcon,
          showTo: ['client', 'designer'],
        },
        {
          name: 'Help',
          path: '/app/help',
          icon: QuestionMarkCircleIcon,
          showTo: ['client', 'designer'],
        },
      ]
    }
  ];

  // Simple helper functions
  const getInitial = () => {
    if (!currentUser) return '?';
    return (currentUser.name || currentUser.email || '?').charAt(0).toUpperCase();
  };

  const getUserRole = () => isClient ? 'Client' : isDesigner ? 'Designer' : 'User';
  const displayName = currentUser?.name || currentUser?.username || currentUser?.email?.split('@')?.[0] || getUserRole();
  const showRole = displayName.toLowerCase() !== getUserRole().toLowerCase();

  return (
    <>
      {/* Mobile backdrop */}
      <div 
        className={`sidebar-backdrop ${open ? 'active' : ''}`} 
        onClick={toggleSidebar}
      ></div>
      
      {/* Sidebar */}
      <aside className={`sidebar-container ${collapsed ? 'sidebar-collapsed' : ''} ${open ? 'sidebar-open' : ''}`}>
        {/* Logo and collapse button */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <Squares2X2Icon className="h-8 w-8 text-primary-600" />
            <h1>BidLance</h1>
          </div>
          <button 
            className="sidebar-toggle md:flex hidden"
            onClick={handleCollapse}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
        </div>
        
        {/* Navigation */}
        <nav className="sidebar-nav">
          {navSections.map((section) => {
            // Filter items based on user type
            const filteredItems = section.items.filter(item => 
              (isClient && item.showTo.includes('client')) || 
              (isDesigner && item.showTo.includes('designer'))
            );
            
            // Skip section if no items to show
            if (filteredItems.length === 0) return null;
            
            return (
              <div key={section.title} className="sidebar-nav-section">
                <h3 className="sidebar-nav-title">{section.title}</h3>
                
                {filteredItems.map(item => {
                  const Icon = item.icon;
                  // Get badge value from counts object
                  const badgeValue = item.badgeKey ? counts[item.badgeKey] : null;
                  
                  return (
                    <NavLink
                      key={item.name}
                      to={item.path}
                      className={({ isActive }) =>
                        `sidebar-nav-item ${isActive ? 'active' : ''}`
                      }
                      onClick={() => window.innerWidth < 768 && toggleSidebar()}
                    >
                      <Icon className="sidebar-nav-icon" aria-hidden="true" />
                      <span className="sidebar-nav-text">{item.name}</span>
                      {badgeValue > 0 && (
                        <span className="sidebar-notification-badge">{badgeValue}</span>
                      )}
                      {collapsed && (
                        <span className="sidebar-nav-tooltip">{item.name}</span>
                      )}
                    </NavLink>
                  );
                })}
                
                <div className="sidebar-divider"></div>
              </div>
            );
          })}
          
          {/* Logout button */}
          <div className="sidebar-nav-section mt-auto">
            <NavLink 
              to="/login" 
              className="sidebar-nav-item text-red-600 hover:bg-red-50"
              onClick={(e) => {
                e.preventDefault();
                logout();
              }}
            >
              <ArrowRightOnRectangleIcon className="sidebar-nav-icon text-red-500" />
              <span className="sidebar-nav-text">Logout</span>
              {collapsed && (
                <span className="sidebar-nav-tooltip">Logout</span>
              )}
            </NavLink>
          </div>
        </nav>
        
        {/* User profile */}
        <div className="sidebar-profile">
          <UserAvatar user={currentUser} sizeClass="w-10 h-10" className="sidebar-profile-avatar" textClass="text-sm font-semibold" />
          <div className="sidebar-profile-info">
            <div className="sidebar-profile-name">
              {displayName}
            </div>
            {showRole && <div className="sidebar-profile-role">{getUserRole()}</div>}
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;