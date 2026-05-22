import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';

import './Navbar.css';
import logo from '../../logo.png';

const Navbar = () => {
  const { isAuthenticated, logout, user } = useAuth();
  const { t , i18n} = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const isRTL = i18n.language === 'he';
  const mobileMenuRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target) &&
        !event.target.closest('[data-menu-toggle]')
      ) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogoutClick = async () => {
    setIsMenuOpen(false);
    if (logout) {
      await logout();
      navigate('/login');
    }
  };

  return (
    <nav className={`nav-modern ${scrolled ? 'nav-scrolled' : ''}`}>
      <div className="nav-container">
        <div className={`flex justify-between items-center h-16 ${isRTL ? 'flex-row-reverse' : ''}`}>
          {/* Left side: Logo and Site Name */}
          <div className="flex items-center">
            {isAuthenticated ? null : (
              <Link to="/" className="nav-logo">
                <img className="logo-image" src={logo} alt="StudyVerse Logo" />
                <span className="logo-text">{t('header.title')}</span>
              </Link>
            )}
          </div>

          {/* Right side: Auth and Navigation */}
          <div className="flex items-center nav-right-actions">
            <LanguageSwitcher />
            {!isAuthenticated && (
              <div className="auth-buttons">
                <Link to="/login" className="login-button">
                  {t('auth.login')}
                </Link>
                <Link to="/register" className="register-button">
                  {t('auth.register')}
                </Link>
              </div>
            )}

            {/* כפתור 3 פסים (המבורגר) */}
            <button
              data-menu-toggle
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="mobile-menu-button"
              aria-expanded={isMenuOpen}
            >
              {isMenuOpen ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="hamburger-icon">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="hamburger-icon">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`mobile-menu ${isMenuOpen ? 'open' : ''}`} ref={mobileMenuRef}>
        <div className="mobile-menu-inner">
          {/* <div className="mobile-switcher-container">
            <LanguageSwitcher />
          </div> */}

          {isAuthenticated ? (
            <div className="mobile-nav-links">
              {/* <div className="mobile-user-brief">
                <span className="mobile-user-name">👋 {user?.username || 'User'}</span>
              </div> */}
              <Link to="/dashboard" className="mobile-link" onClick={() => setIsMenuOpen(false)}>
                {'Dashboard'}
              </Link>
              <Link to="/groups" className="mobile-link" onClick={() => setIsMenuOpen(false)}>
                {'Groups'}
              </Link>
              
              {/* התאמה לראוט הנכון: /chat בלשון יחיד */}
              <Link to="/chat" className="mobile-link" onClick={() => setIsMenuOpen(false)}>
                {'Chats'}
              </Link>
              
              {/* הצגת עמוד ניהול משתמשים רק אם המשתמש הוא אדמין */}
              {user?.role === 'admin' && (
                <Link to="/admin/users" className="mobile-link" onClick={() => setIsMenuOpen(false)}>
                  {'Users'}
                </Link>
              )}
              
              {/* עמוד הגדרות מערכת */}
              <Link to="/settings" className="mobile-link" onClick={() => setIsMenuOpen(false)}>
                {'Settings'}
              </Link>

              <button onClick={handleLogoutClick} className="mobile-logout-btn">
                {'Logout'}
              </button>
            </div>
          ) : (
            <div className="mobile-auth">
              <Link to="/login" className="mobile-auth-button mobile-login" onClick={() => setIsMenuOpen(false)}>
                {t('auth.login')}
              </Link>
              <Link to="/register" className="mobile-auth-button mobile-register" onClick={() => setIsMenuOpen(false)}>
                {t('auth.register')}
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;