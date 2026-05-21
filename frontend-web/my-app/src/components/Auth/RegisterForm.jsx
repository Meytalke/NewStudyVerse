import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Select from 'react-select';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import { validateEmail, validatePassword } from '../utils/validators';
import { studyFields, institutions, yearOptions } from '../utils/types';
import './RegisterForm.css';

const RegisterForm = () => {
  console.log('RegisterForm component rendered');
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    institution: '',
    studyField: '',
    yearOfStudy: '',
    email: '',
  });

  const [errors, setErrors] = useState({}); // State to store validation errors
  const [showPassword, setShowPassword] = useState(false); // States for toggling password visibility
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register, loading } = useAuth(); // Hooks from AuthContext and React Router
  const navigate = useNavigate(); 

  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'he';
  const studyFieldOptions = studyFields.map((field) => ({ value: field, label: field }));
  const institutionOptions = institutions.map((inst) => ({ value: inst, label: inst }));
  const yearOptionsSelect = yearOptions.map((year) => ({ value: year, label: year }));

  // Function to validate all form fields
  const validateForm = () => {
    const newErrors = {};

    if (!formData.username) {
      newErrors.username = t('register.error.username_required');
    } else if (formData.username.length < 2) {
      newErrors.username = t('register.error.username_short');
    }

    if (!formData.email) {
      newErrors.email = t('register.error.email_required');
    } else if (!validateEmail(formData.email)) {
      newErrors.email = t('register.error.email_invalid');
    }

    if (!formData.password) {
      newErrors.password = t('register.error.password_required');
    } else if (!validatePassword(formData.password)) {
      newErrors.password = t('register.error.password_invalid');
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = t('register.error.confirm_password_required');
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t('register.error.password_mismatch');
    }

    if (!formData.institution) {
      newErrors.institution = t('register.error.institution_required');
    }

    if (!formData.studyField) {
      newErrors.studyField = t('register.error.study_field_required');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0; // Returns true if no errors
  };

  // Generic change handler for form inputs, clears error if input is valid
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error for the specific field when it changes
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form before submission
    if (!validateForm()) {
      return;
    }

    // Prepare user data for registration
    const userData = {
      username: formData.username,
      email: formData.email,
      password: formData.password,
      institution: formData.institution,
      studyField: formData.studyField,
      yearOfStudy: formData.yearOfStudy,
    };

    try {
      // Attempt to register user via AuthContext
      await register(userData);
      toast.success('Registration successful! Please verify your email.'); // Updated message
      navigate('/login'); // Navigate to login page
    } catch (error) {
      console.error('Registration error:', error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message); // Use specific message from server
      } else {
        toast.error('Registration failed. Please try again.'); // Default message for other errors
      }
      // If backend sends specific validation errors, set them
      if (error.response?.data?.errors) {
        const backendErrors = {};
        error.response.data.errors.forEach(err => {
          backendErrors[err.path] = err.msg;
        });
        setErrors(backendErrors); // Set backend validation errors
      }
    }
  };

  // Toggles visibility of the password input
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Toggles visibility of the confirm password input
  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  return (
    <div className="register-form-container"> 
      <div className="register-form"> 
        <div className="text-center">
          <h2 className="register-title">{t('register.title')}</h2>
          <p className="register-subtitle">{t('register.subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="register-grid-form"> 
          {/* Username */}
          <div className="form-group-item"> 
            <label htmlFor="username" className="register-label">
              {t('register.label.username')}
            </label>
            <input
              id="username"
              name="username"
              type="text"
              required
              value={formData.username}
              onChange={handleChange}
              className={`register-input ${errors.username ? 'input-error' : ''}`}
            />
            {errors.username && (
              <p className="error-message-inline">{errors.username}</p>
            )}
          </div>

          {/* Email - spans 2 columns */}
          <div className="form-group-item span-2-col"> {/* Use class for spanning */}
            <label htmlFor="email" className="register-label">
              {t('register.label.email')}
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              className={`register-input ${errors.email ? 'input-error' : ''}`}
              dir="ltr"
            />
            {errors.email && (
              <p className="error-message-inline">{errors.email}</p>
            )}
          </div>

          {/* Password */}
          <div className="form-group-item">
            <label htmlFor="password" className="register-label">
              {t('register.label.password')} 
            </label>
            <div className="input-with-icon-wrapper" style={{ position: 'relative' }}> {/* <-- הוסף עטיפה זו */}
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={formData.password}
                onChange={handleChange}
                className={`register-input ${errors.password ? 'input-error' : ''}`}
                dir="ltr"
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="password-toggle-button"
              >
                <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
              </button>
            </div>
            {errors.password && (
              <p className="error-message-inline">{errors.password}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div className="form-group-item">
            <label htmlFor="confirmPassword" className="register-label">
              {t('register.label.confirm_password')} 
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`register-input ${errors.confirmPassword ? 'input-error' : ''}`}
                dir="ltr"
              />
              <button
                type="button"
                onClick={toggleConfirmPasswordVisibility}
                className="password-toggle-button"
              >          
                <FontAwesomeIcon icon={showConfirmPassword ? faEyeSlash : faEye} />
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="error-message-inline">{errors.confirmPassword}</p>
            )}
          </div>

          {/* Institution */}
          <div className="form-group-item span-2-col"> 
            <label htmlFor="institution" className="register-label">
              {t('register.label.institution')}
            </label>
            <Select
              id="institution"
              name="institution"
              value={formData.institution ? { value: formData.institution, label: formData.institution } : null}
              onChange={(selectedOption) => handleChange({ target: { name: 'institution', value: selectedOption ? selectedOption.value : '' } })}
              options={institutionOptions}
              isSearchable
              placeholder={t('register.placeholder.institution_search')}
              className={`react-select-container ${errors.institution ? 'select-error' : ''} ${isRTL ? 'react-select-rtl' : ''}`}
              classNamePrefix="react-select"
            />
            {errors.institution && (
              <p className="error-message-inline">{errors.institution}</p>
            )}
          </div>

          {/* Study Field */}
          <div className="form-group-item">
            <label htmlFor="studyField" className="register-label">
              {t('register.label.study_field')} 
            </label>
            <Select
              id="studyField"
              name="studyField"
              value={formData.studyField ? { value: formData.studyField, label: formData.studyField } : null}
              onChange={(selectedOption) => handleChange({ target: { name: 'studyField', value: selectedOption ? selectedOption.value : '' } })}
              options={studyFieldOptions}
              isSearchable
              placeholder={t('register.placeholder.study_field_select')}
              className={`react-select-container ${errors.studyField ? 'select-error' : ''} ${isRTL ? 'react-select-rtl' : ''}`}
              classNamePrefix="react-select"
            />
            {errors.studyField && (
              <p className="error-message-inline">{errors.studyField}</p>
            )}
          </div>

          {/* Year of Study */}
          <div className="form-group-item">
            <label htmlFor="yearOfStudy" className="register-label">
              {t('register.label.year_of_study')} 
            </label>
            <Select
              id="yearOfStudy"
              name="yearOfStudy"
              value={formData.yearOfStudy ? { value: formData.yearOfStudy, label: formData.yearOfStudy } : null}
              onChange={(selectedOption) => handleChange({ target: { name: 'yearOfStudy', value: selectedOption ? selectedOption.value : '' } })}
              options={yearOptionsSelect}
              isSearchable={false}
              placeholder={t('register.placeholder.year_select')}
              className={`react-select-container ${errors.yearOfStudy ? 'select-error' : ''} ${isRTL ? 'react-select-rtl' : ''}`}
              classNamePrefix="react-select"
              isClearable
            />
          </div>

          {/* Register Button */}
          <div className="form-group-item span-2-col">
            <button
              type="submit"
              disabled={loading}
              className="register-button"
            >
              {loading ? t('register.loading') : t('register.button')}
            </button>
          </div>
        </form>

        <div className="signup-prompt">
          <p className="register-subtitle">
            {t('register.login_text')}{' '}
            <Link to="/login" className="register-link">
              {t('register.login_link')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;