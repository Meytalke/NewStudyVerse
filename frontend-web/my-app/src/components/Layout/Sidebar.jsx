import React, { useState, useContext, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Users, 
  MessageSquare, 
  User as UserIcon,
  TrendingUp, 
  Settings,
  LogOut,
  ChevronRight,
  ChevronLeft,} from 'lucide-react';
import AuthContext from '../contexts/AuthContext';
import './Sidebar.css';
import logo from '../../logo.png';

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);


  const mainNavItems = [
        { name: 'Groups', icon: <Users size={20} />, path: '/groups' },
        { name: 'Chat', icon: <MessageSquare size={20} />, path: '/chat' },
        { name: 'Dashboard', icon: <TrendingUp size={20} />, path: '/dashboard' },
    ];

    if (user && user.role === 'admin') {
        mainNavItems.splice(1, 0, { 
            name: 'Users',
            icon: <UserIcon size={20} />,
            path: '/admin/users'
        });
    }

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  const isActive = (path) => {
    return path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    logout();
    // Close sidebar on mobile when logging out
    if (isMobile) {
      setCollapsed(true);
    }
  };

  return (
    <div 
      className={`sidebar ${collapsed ? 'sidebar-collapsed' : 'sidebar-expanded'}`}
      dir="ltr"
    >
      <div className="sidebar-header">
        <div className="nav-logo">
          <img className="logo-image" src={logo} alt="StudyVerse Logo" />
          <span className="logo-text">StudyVerse</span>
        </div>
        <button 
          onClick={toggleSidebar}
          className="toggle-button"
          aria-label="Toggle sidebar"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      <div className="user-profile">
        <div className="avatar">
          {user?.username?.charAt(0) || 'U'}
        </div>
        {!collapsed && (
          <div className="user-info">
            <div className="user-name">{user?.username || 'User'}</div>
            <div className="user-institution">{user?.institution || 'Institution'}</div>
          </div>
        )}
      </div>

      <nav className="nav-container">
        <ul className="nav-list">
          {mainNavItems.map((item) => (
            <li key={item.name} className="nav-item">
              <Link
                to={item.path}
                className={`nav-link ${isActive(item.path) ? 'active' : ''}`}
              >
                <span className="nav-link-icon">{item.icon}</span>
                {!collapsed && <span className="nav-link-text">{item.name}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="sidebar-footer">
        <ul className="footer-list">
          <li className="footer-item">
            <Link
              to="/settings"
              className="footer-link"
            >
              <span className="nav-link-icon"><Settings size={20} /></span>
              {!collapsed && <span className="nav-link-text">Settings</span>}
            </Link>
          </li>
          <li className="footer-item">
            <button
              onClick={handleLogout}
              className="logout-button"
            >
              <span className="nav-link-icon"><LogOut size={20} /></span>
              {!collapsed && <span className="nav-link-text">Log Out</span>}
            </button>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Sidebar;