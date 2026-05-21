import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom'; 
import { useUser } from '../contexts/UserContext';
import './UserProfilePage.css'; 

const UserProfilePage = () => {
    const { userId } = useParams(); 
    const navigate = useNavigate(); 
    const { getPublicUserProfile, publicProfileLoading, publicProfileError } = useUser(); 
    const [displayedProfile, setDisplayedProfile] = useState(null); 

    useEffect(() => {
        const fetchProfile = async () => {
            if (!userId) { 
                setDisplayedProfile(null); 
                return;
            }

            try {
                const profileData = await getPublicUserProfile(userId); 
                setDisplayedProfile(profileData); 
            } catch (err) {
                setDisplayedProfile(null); 
            }
        };

        fetchProfile(); 
    }, [userId, getPublicUserProfile]); 

    if (publicProfileLoading) {
        return (
            <div className="profile-container">
                <p>Loading profile...</p>
                <button onClick={() => navigate(-1)} className="go-back-button">
                    Go Back
                </button>
            </div>
        );
    }

    if (publicProfileError) {
        return (
            <div className="profile-container error-message">
                <p>Error: {publicProfileError}</p>
                <button onClick={() => navigate(-1)} className="go-back-button">
                    Go Back
                </button>
            </div>
        );
    }

    if (!displayedProfile) {
        return (
            <div className="profile-container">
                <p>Profile not found or could not be loaded.</p>
                <button onClick={() => navigate(-1)} className="go-back-button">
                    Go Back
                </button>
            </div>
        );
    }

    return (
        <div className="profile-container">
            <h1 className="profile-username">{displayedProfile.username}'s Profile</h1>
            <div className="profile-details">
                <p><strong>Email:</strong> {displayedProfile.email}</p>
                <p><strong>Institution:</strong> {displayedProfile.institution}</p>
                <p><strong>Study Field:</strong> {displayedProfile.studyField}</p>
                <p><strong>Year of Study:</strong> {displayedProfile.yearOfStudy}</p>
            </div>
            <button onClick={() => navigate(-1)} className="go-back-button">
                Go Back
            </button>
        </div>
    );
};

export default UserProfilePage;