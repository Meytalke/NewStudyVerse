import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';

import './Navbar.css';
import logo from '../../logo.png';

const Navbar = () => {
  const { isAuthenticated } = useAuth();
  const { t , i18n} = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const isRTL = i18n.language === 'he';
  const profileMenuRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const searchRef = useRef(null);

  // Handle scroll to add special styling
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

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target) && !event.target.closest('[data-search-toggle]')) {
        setIsSearchOpen(false);
      }
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



  return (
    <nav className={`nav-modern ${scrolled ? 'nav-scrolled' : ''}`}>
      <div className="nav-container">
        <div className={`flex justify-between items-center h-16 ${isRTL ? 'flex-row-reverse' : ''}`}>
            {/* Left side: Logo and Site Name */}
          <div className="flex items-center">
            {isAuthenticated ? (         
            null
            ):
            <Link to="/" className="nav-logo">
              <img className="logo-image" src={logo} alt="StudyVerse Logo" />
              <span className="logo-text">{t('header.title')}</span>
            </Link>}
          </div>

          {/* Right side: Auth and Navigation */}
          <div className="flex items-center">
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

            {/* Mobile menu button */}
            <button
              data-menu-toggle
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="mobile-menu-button"
              aria-expanded={isMenuOpen}
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`mobile-menu ${isMenuOpen ? 'open' : ''}`} ref={mobileMenuRef}>
        <div className="py-1">
          <div className="px-2 pt-2 pb-3 space-y-1">
              <LanguageSwitcher />
          </div>
          {!isAuthenticated && (
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