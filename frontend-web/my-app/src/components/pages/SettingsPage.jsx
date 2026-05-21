import { useState, useEffect } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useUser } from '../contexts/UserContext';
import { userService } from '../services/api';
import { studyFields, institutions, yearOptions } from '../utils/types';
import './SettingsPage.css';

const SettingsPage = () => {
    const { user, logout ,refreshUser} = useAuth();
    const { updateProfile } = useUser();
    const navigate = useNavigate();

    // const [username, setUsername] = useState('');
    const [institution, setInstitution] = useState('');
    const [studyField, setStudyField] = useState('');
    const [yearOfStudy, setYearOfStudy] = useState('');

    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const [deleteLoading, setDeleteLoading] = useState(false);
    const [deleteError, setDeleteError] = useState('');

    useEffect(() => {
        if (user) {
            console.log("user:", user.institution);
            // setUsername(user.username || '');
            setInstitution(user.institution || '');
            setStudyField(user.studyField || '');
            setYearOfStudy(user.yearOfStudy || '');
        }
    }, [user]); 

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        setLoading(true);

        const updatedUserData = {institution, studyField, yearOfStudy };

        const isConfirmed = window.confirm(
            'Updating your profile may require you to log back in. Do you wish to proceed?'
        );

        if (!isConfirmed) {
            setLoading(false); 
            setSuccessMessage('Profile update cancelled.'); 
            return;
        }

        try {
            await updateProfile(updatedUserData);
            refreshUser();
        } catch (error) {
            console.error('Error updating profile:', error);
            setError(error.response?.data?.message || 'Failed to update profile.');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
            setDeleteLoading(true);
            setDeleteError('');
            try {
                await userService.deleteAccount();
                logout(); 
                navigate('/');
            } catch (error) {
                console.error('Error deleting account:', error);
                setDeleteError(error.message || 'Failed to delete account.');
            } finally {
                setDeleteLoading(false);
            }
        }
    };

    if (!user) {
        return <Navigate to="/" replace />;
    }

    const handleGoBack = () => {
        navigate(-1);
    };

    return (
        <div className="settings-page" dir="ltr">
            <button className="back-button" onClick={handleGoBack}>&larr; Go Back</button>
            <h1>Settings</h1>
            {error && <div className="error-message">{error}</div>}
            {successMessage && <div className="success-message">{successMessage}</div>}

            <form onSubmit={handleSubmit} className="settings-form">
                {/* <div className="form-group">
                    <label htmlFor="username">Username</label>
                    <input
                        type="text"
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                </div> */}

                <div className="form-group">
                    <label htmlFor="institution">Institution</label>
                    <select
                        id="institution"
                        value={institution}
                        onChange={(e) => setInstitution(e.target.value)}
                    >
                        {institutions.map((field) => (
                            <option key={field} value={field}>
                                {field}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="form-group">
                    <label htmlFor="studyField">Study Field</label>
                    <select
                        id="studyField"
                        value={studyField}
                        onChange={(e) => setStudyField(e.target.value)}
                    >
                        {studyFields.map((field) => (
                            <option key={field} value={field}>
                                {field}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="form-group">
                    <label htmlFor="yearOfStudy">Year of Study</label>
                    <select
                        id="yearOfStudy"
                        value={yearOfStudy}
                        onChange={(e) => setYearOfStudy(e.target.value)}
                    >
                        {yearOptions.map((year) => (
                            <option key={year} value={year}>
                                {year}
                            </option>
                        ))}
                    </select>
                </div>

                <button type="submit" disabled={loading}>
                    {loading ? 'Saving...' : 'Save Changes'}
                </button>
            </form>

            <div className="delete-account-section">
                <h2>Delete Account</h2>
                {deleteError && <div className="error-message">{deleteError}</div>}
                <button
                    onClick={handleDeleteAccount}
                    className="delete-account-button"
                    disabled={deleteLoading}
                >
                    {deleteLoading ? 'Deleting...' : 'Delete My Account'}
                </button>
                <p className="delete-warning">
                    Please note: This action is irreversible and all your data will be deleted
                </p>
            </div>

            <div className="additional-settings">
                <Link to="/settings/password">Change Password</Link>
            </div>
        </div>
    );
};

export default SettingsPage;