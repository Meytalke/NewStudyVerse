import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import { validatePassword } from '../utils/validators';
import './LoginForm.css';
import { FaEye, FaEyeSlash } from 'react-icons/fa'; 
import { useTranslation } from 'react-i18next';
import Snow from './Snow';

const LoginForm = () => {
  // Manages form input values for identifier (email/username) and password.
  const [formData, setFormData] = useState({
    identifier: '',
    password: '',
  });

  // Stores validation error messages for form fields.
  const [errors, setErrors] = useState({});

  // Controls the visibility of the password in the input field.
  const [showPassword, setShowPassword] = useState(false);

  // Accesses login function and loading state from authentication context.
  const { login, loading } = useAuth();

  const { t } = useTranslation();
  // Hook for navigation.
  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors = {};

    if (!formData.identifier) {
      newErrors.identifier = t('login.error.identifier_required');
    }

    if (!formData.password) {
      newErrors.password = t('login.error.password_required');
    } else if (!validatePassword(formData.password)) {
      newErrors.password = t('login.error.password_invalid');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Updates form data state and clears error when input changes. 
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      const response = await login(formData);
      if (response?.user && response?.token) {
        toast.success('Logged in successfully!');
        navigate('/dashboard');
      } else {
        const data = response?.data;
        if (response?.status === 403) {
          toast.error(data?.message || 'Please verify your email before logging in.');
        } else {
          toast.error(data?.message || 'Login failed. Please try again.');
          if (data?.errors) {
            const backendErrors = {};
            data.errors.forEach((err) => {
              backendErrors[err.path] = err.msg;
            });
            setErrors(backendErrors);
          }
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Network error. Please try again.');
      }
      if (error.response?.data?.errors) {
        const backendErrors = {};
        error.response.data.errors.forEach((err) => {
          backendErrors[err.path] = err.msg;
        });
        setErrors(backendErrors);
      }
    }
  };

  return (
    <div className="login-form-container"  >
      <Snow />
      <div className="login-form">
        <div className="text-center">
          <h2 className="login-title">{t('login.title')}</h2>
          <p className="login-subtitle">{t('login.subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form-fields"> 
          <div>
            <label htmlFor="identifier" className="login-label">
              {t('login.label.identifier')}
            </label>
            <input
              id="identifier"
              name="identifier"
              type="text"
              autoComplete="username"
              required
              value={formData.identifier}
              onChange={handleChange}
              className={`login-input ${errors.identifier ? 'input-error' : ''}`}
            />
            {errors.identifier && <p className="error-message-inline">{errors.identifier}</p>}
          </div>

          <div className="password-input-group">
            <label htmlFor="password" className="login-label">
              {t('login.label.password')}
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'} 
                autoComplete="current-password"
                required
                value={formData.password}
                onChange={handleChange}
                className={`login-input ${errors.password ? 'input-error' : ''}`}
              />
              <span
                className="password-toggle-icon"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>
            {errors.password && <p className="error-message-inline">{errors.password}</p>}
          </div>

          <div className="login-options">
            <div className="forgot-password">
              <Link to="/forgot-password" className="login-link">
                {t('login.forgot_password')}
              </Link>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="login-button"
            >
              {loading ? t('login.loading') : t('login.button')}
            </button>
          </div>
        </form>

        <div className="signup-prompt">
          <p className="login-subtitle">
            {t('login.no_account_text')}{' '}
            <Link to="/register" className="login-link">
              {t('login.sign_up_link')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;